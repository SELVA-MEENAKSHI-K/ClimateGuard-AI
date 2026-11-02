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

async function capture(url, outPaths, metrics) {
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
  await new Promise((r) => setTimeout(r, 3500));

  const { data } = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(data, 'base64');
  for (const outPath of outPaths) {
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot to ${outPath} (${buffer.length} bytes)`);
  }

  ws.close();
  // Close target
  try {
    await fetch('http://127.0.0.1:9222/json/close/' + target.id);
  } catch (e) {}
}

async function main() {
  const artifactDir = 'C:\\Users\\kanna\\.gemini\\antigravity\\brain\\16178239-8b89-4c2e-a3bc-0a4b1dd22ae2';
  const workspaceDir = 'C:\\Users\\kanna\\Downloads\\whether';

  console.log('1. Capturing Home at 1440px...');
  await capture('http://127.0.0.1:5173/#home', [
    path.join(artifactDir, 'home_1440.png'),
    path.join(workspaceDir, 'home_1440.png')
  ], {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('2. Capturing Home at 390px (Mobile)...');
  await capture('http://127.0.0.1:5173/#home', [
    path.join(artifactDir, 'home_390.png'),
    path.join(workspaceDir, 'home_390.png')
  ], {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  console.log('3. Capturing Irrigation at 1440px...');
  await capture('http://127.0.0.1:5173/#irrigation', [
    path.join(artifactDir, 'irrigation_1440.png'),
    path.join(workspaceDir, 'irrigation_1440.png')
  ], {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('4. Capturing Irrigation at 390px (Mobile)...');
  await capture('http://127.0.0.1:5173/#irrigation', [
    path.join(artifactDir, 'irrigation_390.png'),
    path.join(workspaceDir, 'irrigation_390.png')
  ], {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  console.log('All screenshots captured successfully!');
}

main().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
