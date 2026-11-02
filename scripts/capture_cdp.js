import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function sendCdp(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  return new Promise((resolve, reject) => {
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function capture(url, filename, metrics) {
  const artifactDir = 'C:\\Users\\kanna\\.gemini\\antigravity\\brain\\16178239-8b89-4c2e-a3bc-0a4b1dd22ae2';
  const workspaceDir = 'C:\\Users\\kanna\\Downloads\\whether';
  const outPaths = [
    path.join(artifactDir, filename),
    path.join(workspaceDir, filename)
  ];

  // 1. Create target
  const newTargetRes = await fetch('http://127.0.0.1:9222/json/new?' + encodeURIComponent(url), { method: 'PUT' });
  const target = await newTargetRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));

  await sendCdp(ws, 'Page.enable');
  await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', metrics);
  if (metrics.mobile) {
    await sendCdp(ws, 'Emulation.setTouchEmulationEnabled', { enabled: true });
  }

  // Navigate and wait for render
  await sendCdp(ws, 'Page.navigate', { url });
  await new Promise((r) => setTimeout(r, 3000));

  const { data } = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(data, 'base64');
  for (const outPath of outPaths) {
    fs.writeFileSync(outPath, buffer);
  }
  console.log(`Saved ${filename} (${buffer.length} bytes)`);

  ws.close();
  try {
    await fetch('http://127.0.0.1:9222/json/close/' + target.id);
  } catch (e) {}
}

async function main() {
  const desktop = { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false };
  const mobile = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true };

  const baseUrl = 'http://127.0.0.1:5173';

  console.log('Capturing Landing Page screenshots...');
  // 1. Landing - Low
  await capture(`${baseUrl}/?hazard=low&lang=ta#landing`, 'landing_low_1440.png', desktop);
  await capture(`${baseUrl}/?hazard=low&lang=ta#landing`, 'landing_low_390.png', mobile);

  // 2. Landing - Heat
  await capture(`${baseUrl}/?hazard=heat&lang=ta#landing`, 'landing_heat_1440.png', desktop);
  await capture(`${baseUrl}/?hazard=heat&lang=ta#landing`, 'landing_heat_390.png', mobile);

  // 3. Landing - Rain
  await capture(`${baseUrl}/?hazard=rain&lang=ta#landing`, 'landing_rain_1440.png', desktop);
  await capture(`${baseUrl}/?hazard=rain&lang=ta#landing`, 'landing_rain_390.png', mobile);

  console.log('Capturing Dashboard Hero screenshots...');
  // 4. Dashboard - Low
  await capture(`${baseUrl}/?hazard=low&lang=ta#home`, 'dashboard_low_1440.png', desktop);
  await capture(`${baseUrl}/?hazard=low&lang=ta#home`, 'dashboard_low_390.png', mobile);

  // 5. Dashboard - Heat
  await capture(`${baseUrl}/?hazard=heat&lang=ta#home`, 'dashboard_heat_1440.png', desktop);
  await capture(`${baseUrl}/?hazard=heat&lang=ta#home`, 'dashboard_heat_390.png', mobile);

  // 6. Dashboard - Rain
  await capture(`${baseUrl}/?hazard=rain&lang=ta#home`, 'dashboard_rain_1440.png', desktop);
  await capture(`${baseUrl}/?hazard=rain&lang=ta#home`, 'dashboard_rain_390.png', mobile);

  console.log('All 12 screenshots captured successfully!');
}

main().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
