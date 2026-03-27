import { getDeviceInfo } from './deviceInfo';

const GATEWAY_URL = 'http://192.168.137.1:3000/allow';

export async function callGateway(userId?: string): Promise<boolean> {
  try {
    const { deviceName, ip, browser, os } = getDeviceInfo();
    await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId || 'event-user',
        device: deviceName,
        ip_address: ip,
        browser,
        os,
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(3000),
    });
    return true;
  } catch {
    // Fail silently — gateway may not be running
    return false;
  }
}
