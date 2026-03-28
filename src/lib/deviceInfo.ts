export function getDeviceInfo() {
  const ua = navigator.userAgent;
  
  let browser = 'Unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  const deviceName = `${browser} on ${os}`;
  
  // Simulated IP
  const ip = `192.168.1.${Math.floor(Math.random() * 254) + 1}`;
  
  return { browser, os, deviceName, ip };
}

export async function registerDevice(supabase: any, userId: string) {
  const { browser, os, deviceName, ip } = getDeviceInfo();
  
  // Check if device already exists (by user + browser + os combo)
  const { data: existing } = await supabase
    .from('devices')
    .select('id')
    .eq('user_id', userId)
    .eq('browser', browser)
    .eq('os', os);
  
  if (existing && existing.length > 0) {
    // Update last login
    await supabase
      .from('devices')
      .update({ last_login: new Date().toISOString(), ip_address: ip })
      .eq('id', existing[0].id);
    return existing[0].id;
  }
  
  // Check device limit (max 5 per user)
  const { count } = await supabase
    .from('devices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  if (count && count >= 5) {
    return null; // Device limit reached
  }
  
  const { data } = await supabase
    .from('devices')
    .insert({
      user_id: userId,
      device_name: deviceName,
      browser,
      os,
      ip_address: ip,
    })
    .select('id')
    .single();
  
  const deviceId = data?.id || null;

  // Run AI threat analysis on new devices
  if (deviceId) {
    try {
      const { data: analysisData, error } = await supabase.functions.invoke('analyze-device', {
        body: { device_id: deviceId, user_id: userId, browser, os, ip_address: ip, device_name: deviceName },
      });

      if (!error && analysisData?.threat_score > 70) {
        const { toast } = await import('sonner');
        toast.error('⚠️ Security Alert: Your device has been flagged as suspicious and blocked. Contact IT support.');
        await supabase.auth.signOut();
        return null;
      }
    } catch (e) {
      console.error('Threat analysis failed:', e);
      // Don't block login if analysis fails
    }
  }

  return deviceId;
}

export async function createSession(supabase: any, userId: string, deviceId: string | null) {
  await supabase.from('sessions').insert({
    user_id: userId,
    device_id: deviceId,
    status: 'active',
  });
}
