import { spawn, execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const REPORTS_DIR = path.resolve(process.cwd(), 'reports', 'lighthouse');
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkServerReady(port = 3000, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const req = http.get(`http://127.0.0.1:${port}`, (res) => {
        clearInterval(interval);
        resolve(true);
      });
      req.on('error', () => {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new Error(`Server failed to start on port ${port} after ${maxAttempts} attempts`));
        }
      });
      req.end();
    }, 1000);
  });
}

async function runCommand(cmd) {
  console.log(`\n[Lighthouse] Running: ${cmd}`);
  const start = Date.now();
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`[Lighthouse] Completed in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  } catch (err) {
    console.error(`[Lighthouse] Command failed:`, err.message);
    throw err;
  }
}

function parseReport(jsonPath) {
  if (!fs.existsSync(jsonPath)) {
    console.error(`Report file missing: ${jsonPath}`);
    return null;
  }
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(raw);

  const perf = Math.round((data.categories.performance?.score || 0) * 100);
  const a11y = Math.round((data.categories.accessibility?.score || 0) * 100);
  const bp = Math.round((data.categories['best-practices']?.score || 0) * 100);
  const seo = Math.round((data.categories.seo?.score || 0) * 100);

  const cls = data.audits['cumulative-layout-shift']?.numericValue ?? 0;
  const lcp = data.audits['largest-contentful-paint']?.displayValue ?? 'N/A';
  const fcp = data.audits['first-contentful-paint']?.displayValue ?? 'N/A';
  const tbt = data.audits['total-blocking-time']?.displayValue ?? 'N/A';
  const si = data.audits['speed-index']?.displayValue ?? 'N/A';

  const layoutShiftElements = data.audits['layout-shift-elements']?.details?.items || [];

  return {
    perf,
    a11y,
    bp,
    seo,
    cls: Number(cls.toFixed(4)),
    lcp,
    fcp,
    tbt,
    speedIndex: si,
    layoutShiftElements: layoutShiftElements.map((item) => ({
      node: item.node?.snippet || item.node?.nodeLabel || 'unknown',
      score: item.score,
    })),
  };
}

async function main() {
  console.log('=== STARTING PRODUCTION LIGHTHOUSE AUDIT ===');
  console.log('Starting Next.js production server on port 3000...');

  const serverProcess = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-p', '3000'], {
    stdio: 'ignore',
    shell: true,
  });

  try {
    console.log('Waiting for production server to be ready on http://127.0.0.1:3000...');
    await checkServerReady(3000);
    console.log('Server is READY! Waiting 2 seconds for initial warm-up...');
    await wait(2000);

    // Warm up the homepage
    try {
      execSync('curl -s http://127.0.0.1:3000 > nul || true', { shell: true });
    } catch (_) {}

    // 1. Mobile Run 1
    console.log('\n--- 1. MOBILE RUN 1 ---');
    await runCommand(
      'npx --yes lighthouse http://127.0.0.1:3000 --output=json,html --output-path=reports/lighthouse/mobile-run1 --chrome-flags="--headless=new --no-sandbox" --quiet'
    );

    // 2. Mobile Run 2
    console.log('\n--- 2. MOBILE RUN 2 ---');
    await runCommand(
      'npx --yes lighthouse http://127.0.0.1:3000 --output=json,html --output-path=reports/lighthouse/mobile-run2 --chrome-flags="--headless=new --no-sandbox" --quiet'
    );

    // 3. Desktop Run 1
    console.log('\n--- 3. DESKTOP RUN 1 ---');
    await runCommand(
      'npx --yes lighthouse http://127.0.0.1:3000 --preset=desktop --output=json,html --output-path=reports/lighthouse/desktop-run1 --chrome-flags="--headless=new --no-sandbox" --quiet'
    );

    // 4. Desktop Run 2
    console.log('\n--- 4. DESKTOP RUN 2 ---');
    await runCommand(
      'npx --yes lighthouse http://127.0.0.1:3000 --preset=desktop --output=json,html --output-path=reports/lighthouse/desktop-run2 --chrome-flags="--headless=new --no-sandbox" --quiet'
    );

    console.log('\n=== PARSING AUDIT RESULTS ===');
    const results = {
      mobileRun1: parseReport(path.join(REPORTS_DIR, 'mobile-run1.report.json')),
      mobileRun2: parseReport(path.join(REPORTS_DIR, 'mobile-run2.report.json')),
      desktopRun1: parseReport(path.join(REPORTS_DIR, 'desktop-run1.report.json')),
      desktopRun2: parseReport(path.join(REPORTS_DIR, 'desktop-run2.report.json')),
    };

    console.log('\nFINAL AUDIT RESULTS:');
    console.log(JSON.stringify(results, null, 2));

    fs.writeFileSync(path.join(REPORTS_DIR, 'summary.json'), JSON.stringify(results, null, 2), 'utf8');
    console.log(`\nSummary saved to: ${path.join(REPORTS_DIR, 'summary.json')}`);
  } finally {
    console.log('Shutting down production server...');
    try {
      execSync('taskkill /F /IM node.exe /FI "WINDOWTITLE eq *next*" 2>nul || true', { shell: true });
    } catch (_) {}
    serverProcess.kill();
  }
}

main().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});

