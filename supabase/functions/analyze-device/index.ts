import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { device_id, user_id, browser, os, ip_address, device_name } = await req.json();

    if (!device_id || !user_id) {
      return new Response(JSON.stringify({ error: "device_id and user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch user's existing devices for context
    const { data: existingDevices } = await supabase
      .from("devices")
      .select("browser, os, ip_address, device_name, created_at, last_login")
      .eq("user_id", user_id)
      .neq("id", device_id);

    // Fetch recent sessions
    const { data: recentSessions } = await supabase
      .from("sessions")
      .select("login_time, device_id")
      .eq("user_id", user_id)
      .order("login_time", { ascending: false })
      .limit(20);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ threat_score: 0, threat_reason: "Analysis unavailable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a network security analyst for a university WiFi system. Analyze this device connection and return a threat assessment.

NEW DEVICE connecting:
- Browser: ${browser}
- OS: ${os}
- IP: ${ip_address}
- Device Name: ${device_name}

USER'S KNOWN DEVICES (${existingDevices?.length || 0}):
${JSON.stringify(existingDevices || [], null, 2)}

RECENT LOGIN SESSIONS (${recentSessions?.length || 0}):
${JSON.stringify(recentSessions || [], null, 2)}

Evaluate for:
1. Unusual browser/OS combinations suggesting spoofing
2. Rapid device changes (many new devices in short time)
3. Known phishing or bot user-agent patterns
4. Suspicious IP patterns
5. Abnormal login frequency

Return your assessment.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a network security analyst. Evaluate device connections for threats." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "threat_assessment",
              description: "Return a threat score and reason for a device connection",
              parameters: {
                type: "object",
                properties: {
                  threat_score: {
                    type: "integer",
                    description: "Threat score from 0 (safe) to 100 (malicious). 0-30: safe, 31-70: suspicious, 71-100: likely malicious",
                  },
                  threat_reason: {
                    type: "string",
                    description: "Brief explanation of the threat assessment",
                  },
                },
                required: ["threat_score", "threat_reason"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "threat_assessment" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      console.error("AI gateway error:", status);
      // Don't block login on AI failure - return safe score
      return new Response(JSON.stringify({ threat_score: 0, threat_reason: "Analysis unavailable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let threatScore = 0;
    let threatReason = "No threat detected";

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const args = JSON.parse(toolCall.function.arguments);
        threatScore = Math.min(100, Math.max(0, args.threat_score || 0));
        threatReason = args.threat_reason || "No details provided";
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
    }

    // Update device with threat info
    const updateData: any = { threat_score: threatScore, threat_reason: threatReason };
    if (threatScore > 70) {
      updateData.is_blocked = true;
    }

    await supabase.from("devices").update(updateData).eq("id", device_id);

    return new Response(JSON.stringify({ threat_score: threatScore, threat_reason: threatReason }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-device error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
