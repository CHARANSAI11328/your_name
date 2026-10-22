/**
 * Comprehensive Automated End-to-End Verification Test Suite
 * Authentic Scrollytelling Website ("Your Name" 500 Frames)
 * Pure Visual Scrollytelling — Zero UI Overlays, 100% Reliable Scrolling
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

let failures = 0;
let passes = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passes++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failures++;
  }
}

// Read JPEG dimensions from binary header
function getJpegDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  let i = 0;
  while (i < buffer.length - 8) {
    if (buffer[i] === 0xFF) {
      const marker = buffer[i + 1];
      if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
        const height = buffer.readUInt16BE(i + 5);
        const width = buffer.readUInt16BE(i + 7);
        return { width, height };
      } else if (marker !== 0xD8 && marker !== 0xD9) {
        const length = buffer.readUInt16BE(i + 2);
        i += 2 + length;
        continue;
      }
    }
    i++;
  }
  return null;
}

// Check local web server endpoint
function checkUrl(urlPath) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8080,
      path: urlPath,
      method: 'GET'
    }, (res) => {
      let dataLen = 0;
      res.on('data', chunk => dataLen += chunk.length);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, length: dataLen, type: res.headers['content-type'] });
      });
    });
    req.on('error', (err) => resolve({ error: err }));
    req.end();
  });
}

// Chrome DevTools Protocol helper
async function launchChromeCDP(port) {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    'http://127.0.0.1:8080/index.html'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const targets = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/json`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const page = targets.find(t => t.url && t.url.includes('8080'));
  if (!page) throw new Error('Could not find scrollytelling page target');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let msgId = 1;

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = msgId++;
    const handler = (evt) => {
      const resp = JSON.parse(evt.data);
      if (resp.id === id) {
        ws.removeEventListener('message', handler);
        if (resp.error) reject(resp.error);
        else resolve(resp.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await new Promise(r => ws.addEventListener('open', r));
  await send('Runtime.enable');

  return {
    send,
    close: () => {
      ws.close();
      chrome.kill();
    }
  };
}

async function runTests() {
  console.log('\n--- 1. File Count & Binary JPEG Resolution Verification ---');
  const hdDir = path.join(__dirname, 'frames');
  const mobileDir = path.join(__dirname, 'frames_mobile');

  assert(fs.existsSync(hdDir), 'HD frames directory exists');
  assert(fs.existsSync(mobileDir), 'Mobile frames directory exists');

  const hdFiles = fs.readdirSync(hdDir).filter(f => f.endsWith('.jpg'));
  const mobileFiles = fs.readdirSync(mobileDir).filter(f => f.endsWith('.jpg'));

  assert(hdFiles.length === 500, `HD folder contains exactly 500 frames (found: ${hdFiles.length})`);
  assert(mobileFiles.length === 500, `Mobile folder contains exactly 500 frames (found: ${mobileFiles.length})`);

  const testIndices = [1, 50, 125, 250, 375, 500];
  for (const idx of testIndices) {
    const filename = `img_${idx.toString().padStart(5, '0')}.jpg`;
    const hdDims = getJpegDimensions(path.join(hdDir, filename));
    assert(hdDims && hdDims.width === 1920 && hdDims.height === 1080,
      `HD ${filename} is horizontal landscape 1920x1080 (actual: ${hdDims?.width}x${hdDims?.height})`);
    
    const mobDims = getJpegDimensions(path.join(mobileDir, filename));
    assert(mobDims && mobDims.width === 960 && mobDims.height === 540,
      `Mobile ${filename} is horizontal landscape 960x540 (actual: ${mobDims?.width}x${mobDims?.height})`);
  }

  console.log('\n--- 2. Static Assets & Code Syntax Verification ---');
  const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert(indexHtml.includes('<canvas id="scrolly-canvas"'), 'index.html contains scrolly-canvas');
  assert(indexHtml.includes('<canvas id="ambient-canvas"'), 'index.html contains ambient-canvas');
  assert(indexHtml.includes('<div id="scroll-track"'), 'index.html contains scroll-track');

  // Verify complete REMOVAL of video player controls
  assert(!indexHtml.includes('id="btn-play"'), 'index.html has NO play/pause button');
  assert(!indexHtml.includes('id="timeline-track"'), 'index.html has NO timeline scrub track');
  assert(!indexHtml.includes('id="timeline-container"'), 'index.html has NO timeline container');
  assert(!indexHtml.includes('class="micro-actions"'), 'index.html has NO video control dock');

  // Verify COMPLETE REMOVAL of all text, instructions, and UI overlays
  assert(!indexHtml.includes('id="story-nav"'), 'index.html has NO story-nav vertical rail');
  assert(!indexHtml.includes('id="story-progress-bar"'), 'index.html has NO story-progress-bar');
  assert(!indexHtml.includes('id="story-bead"'), 'index.html has NO story-bead');
  assert(!indexHtml.includes('class="stage-dot'), 'index.html has NO chapter stage dots');
  assert(!indexHtml.includes('id="scroll-hint"'), 'index.html has NO scroll-hint prompt');
  assert(!indexHtml.includes('id="scroll-pct"'), 'index.html has NO scroll percentage text');
  assert(!indexHtml.includes('id="frame-current"'), 'index.html has NO frame counter text');
  assert(!indexHtml.includes('id="hud-container"'), 'index.html has NO hud container');
  assert(!indexHtml.includes('id="preloader-bar"'), 'index.html has NO preloader bar');
  assert(!indexHtml.includes('SCROLL TO EXPLORE'), 'index.html has NO "SCROLL TO EXPLORE" text');
  assert(!indexHtml.includes('SWIPE TO EXPLORE'), 'index.html has NO "SWIPE TO EXPLORE" text');
  assert(!indexHtml.includes('Prologue'), 'index.html has NO chapter tooltip text');

  const styleCss = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
  assert(!styleCss.match(/html\s*,\s*body\s*\{[^}]*height:\s*100%/), 'style.css does NOT lock document height to 100%');
  assert(styleCss.includes('min-height: 100%'), 'style.css uses natural min-height: 100%');
  assert(styleCss.includes('overflow-y: scroll'), 'style.css configures unhindered overflow-y: scroll');
  assert(!styleCss.includes('scrollbar-width: none'), 'style.css does NOT hide scrollbar with scrollbar-width: none');
  assert(!styleCss.includes('display: none; /* Chrome, Safari, Opera */'), 'style.css does NOT hide scrollbar with display: none');
  assert(styleCss.includes('::-webkit-scrollbar'), 'style.css provides sleek draggable scrollbar');
  assert(!styleCss.includes('.story-nav'), 'style.css has NO leftover .story-nav styles');
  assert(!styleCss.includes('.stage-dot'), 'style.css has NO leftover .stage-dot styles');
  assert(!styleCss.includes('.telemetry-pill'), 'style.css has NO leftover .telemetry-pill styles');

  const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  assert(appJs.includes('TOTAL_FRAMES = 500'), 'app.js configured for 500 frames');
  assert(!appJs.includes('isPlaying'), 'app.js has NO video auto-play logic');
  assert(!appJs.includes('togglePlayback'), 'app.js has NO togglePlayback function');
  assert(appJs.includes('setupTouchGesture'), 'app.js contains touch gesture engine');
  assert(appJs.includes('setupWheel'), 'app.js contains direct mouse wheel support');
  assert(appJs.includes('setupKeyboardNav'), 'app.js contains keyboard navigation support');
  assert(!appJs.includes('stageDots'), 'app.js has NO leftover stageDots references');
  assert(!appJs.includes('hudContainer'), 'app.js has NO leftover hudContainer references');

  console.log('\n--- 3. Local Web Server HTTP Status Verification ---');
  const testEndpoints = [
    '/index.html',
    '/style.css',
    '/app.js',
    '/frames/img_00001.jpg',
    '/frames/img_00250.jpg',
    '/frames/img_00500.jpg',
    '/frames_mobile/img_00001.jpg',
    '/frames_mobile/img_00250.jpg',
    '/frames_mobile/img_00500.jpg'
  ];

  for (const ep of testEndpoints) {
    const res = await checkUrl(ep);
    assert(res.statusCode === 200 && res.length > 0, `HTTP GET ${ep} -> 200 OK (${res.length} bytes)`);
  }

  console.log('\n--- 4. Real Chrome Headless Interactive Deep Verification ---');
  try {
    const cdp = await launchChromeCDP(9238);
    console.log('  [INFO] Chrome Headless connected via CDP');

    // Test 4.1: Verify Page Scrollability
    const scrollMetrics = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const canScroll = document.documentElement.scrollHeight > window.innerHeight;
        return JSON.stringify({
          scrollHeight: document.documentElement.scrollHeight,
          clientHeight: window.innerHeight,
          canScroll
        });
      })()`
    });
    const parsedMetrics = JSON.parse(scrollMetrics.result.value);
    assert(parsedMetrics.canScroll === true && parsedMetrics.scrollHeight >= 5000,
      `Document is scrollable (scrollHeight: ${parsedMetrics.scrollHeight}px >= 5000px, clientHeight: ${parsedMetrics.clientHeight}px)`);

    // Test 4.2: Verify Page is 100% Clean (Zero visible text or instruction overlays)
    const textCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText.trim();
        const hud = document.getElementById('hud-container');
        const storyNav = document.getElementById('story-nav');
        const scrollHint = document.getElementById('scroll-hint');
        return JSON.stringify({
          textLength: text.length,
          hasHud: !!hud,
          hasStoryNav: !!storyNav,
          hasScrollHint: !!scrollHint
        });
      })()`
    });
    const parsedText = JSON.parse(textCheck.result.value);
    assert(parsedText.textLength === 0 && !parsedText.hasHud && !parsedText.hasStoryNav && !parsedText.hasScrollHint,
      'Page is 100% clean: Zero text nodes and zero UI overlays on screen');

    // Test 4.3: Verify Native Document Scroll Advances Frames Smoothly
    await cdp.send('Runtime.evaluate', {
      expression: 'window.scrollTo(0, 2500);'
    });
    await new Promise(r => setTimeout(r, 600));
    const scrollEval = await cdp.send('Runtime.evaluate', {
      expression: `JSON.stringify({
        scrollY: window.scrollY,
        currentFrame: window.__SCROLLY_ENGINE__.getCurrentFrame(),
        targetFrame: window.__SCROLLY_ENGINE__.getTargetFrame(),
        lastDrawn: window.__SCROLLY_ENGINE__.getLastDrawnFrame()
      })`
    });
    const parsedScroll = JSON.parse(scrollEval.result.value);
    assert(parsedScroll.scrollY === 2500 && parsedScroll.currentFrame > 150 && parsedScroll.currentFrame < 300,
      `window.scrollTo(0, 2500) smoothly advanced currentFrame to ${parsedScroll.currentFrame.toFixed(1)} (target: ${parsedScroll.targetFrame.toFixed(1)}, drawn: ${parsedScroll.lastDrawn})`);

    // Test 4.4: Mouse Wheel Scrolling Advances Frames Smoothly
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x: 500,
      y: 500,
      deltaX: 0,
      deltaY: 500
    });
    await new Promise(r => setTimeout(r, 600));
    const wheelEval = await cdp.send('Runtime.evaluate', {
      expression: `JSON.stringify({
        scrollY: window.scrollY,
        currentFrame: window.__SCROLLY_ENGINE__.getCurrentFrame(),
        lastDrawn: window.__SCROLLY_ENGINE__.getLastDrawnFrame()
      })`
    });
    const parsedWheel = JSON.parse(wheelEval.result.value);
    assert(parsedWheel.scrollY > 2500 && parsedWheel.currentFrame > parsedScroll.currentFrame,
      `Mouse wheel event smoothly progressed scroll to ${parsedWheel.scrollY}px and frame to ${parsedWheel.currentFrame.toFixed(1)} (drawn: ${parsedWheel.lastDrawn})`);

    // Test 4.5: Keyboard Navigation Advances Frames
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'PageDown', bubbles: true }));
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    const keyEval = await cdp.send('Runtime.evaluate', {
      expression: `JSON.stringify({
        scrollY: window.scrollY,
        currentFrame: window.__SCROLLY_ENGINE__.getCurrentFrame()
      })`
    });
    const parsedKey = JSON.parse(keyEval.result.value);
    assert(parsedKey.scrollY > parsedWheel.scrollY,
      `Keyboard PageDown navigated scroll position to ${parsedKey.scrollY}px (frame: ${parsedKey.currentFrame.toFixed(1)})`);

    // Test 4.6: Rapid Keyboard Key-Repeat Verification (No Smooth-Scroll Cancellation Bug)
    const beforeRapidY = parsedKey.scrollY;
    for (let i = 0; i < 5; i++) {
      await cdp.send('Runtime.evaluate', {
        expression: `window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown', bubbles: true }));`
      });
      await new Promise(r => setTimeout(r, 30));
    }
    await new Promise(r => setTimeout(r, 600));
    const rapidKeyEval = await cdp.send('Runtime.evaluate', {
      expression: `JSON.stringify({
        scrollY: window.scrollY,
        currentFrame: window.__SCROLLY_ENGINE__.getCurrentFrame()
      })`
    });
    const parsedRapidKey = JSON.parse(rapidKeyEval.result.value);
    const keyDelta = parsedRapidKey.scrollY - beforeRapidY;
    assert(keyDelta >= 1500,
      `Rapid ArrowDown key-repeat smoothly scrolled ${keyDelta}px (>= 1500px, 5x320) without cancellation collisions (scrollY: ${parsedRapidKey.scrollY}px, frame: ${parsedRapidKey.currentFrame.toFixed(1)})`);

    // Test 4.7: Direct Synthetic Wheel Event Progresses Scroll Position & Frames
    const beforeSyntheticWheel = parsedRapidKey.scrollY;
    await cdp.send('Runtime.evaluate', {
      expression: `window.dispatchEvent(new WheelEvent('wheel', { deltaY: 240, bubbles: true }));`
    });
    await new Promise(r => setTimeout(r, 400));
    const syntheticWheelEval = await cdp.send('Runtime.evaluate', {
      expression: `JSON.stringify({
        scrollY: window.scrollY,
        currentFrame: window.__SCROLLY_ENGINE__.getCurrentFrame()
      })`
    });
    const parsedSyntheticWheel = JSON.parse(syntheticWheelEval.result.value);
    assert(parsedSyntheticWheel.scrollY >= beforeSyntheticWheel + 240,
      `Direct synthetic WheelEvent progressed scroll position to ${parsedSyntheticWheel.scrollY}px (+240px) and frame to ${parsedSyntheticWheel.currentFrame.toFixed(1)}`);

    // Test 4.8: Canvas Content Verification (Visual frames actually rendered)
    const canvasEval = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const c = document.getElementById('scrolly-canvas');
        const ctx = c.getContext('2d');
        const pixel = ctx.getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1).data;
        return JSON.stringify({
          width: c.width,
          height: c.height,
          hasPixel: (pixel[0] + pixel[1] + pixel[2] + pixel[3]) > 0
        });
      })()`
    });
    const parsedCanvas = JSON.parse(canvasEval.result.value);
    assert(parsedCanvas.width > 0 && parsedCanvas.hasPixel,
      `Canvas actively renders image pixels (${parsedCanvas.width}x${parsedCanvas.height})`);

    // Test 4.9: Mobile Viewport & Touch Gesture Verification
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await cdp.send('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 5
    });
    await new Promise(r => setTimeout(r, 200));

    // Zero horizontal overflow on mobile
    const overflowEval = await cdp.send('Runtime.evaluate', {
      expression: `JSON.stringify({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      })`
    });
    const parsedOverflow = JSON.parse(overflowEval.result.value);
    assert(parsedOverflow.scrollWidth <= parsedOverflow.clientWidth,
      `Mobile layout has zero horizontal overflow (${parsedOverflow.scrollWidth}px <= ${parsedOverflow.clientWidth}px)`);

    // Simulate genuine mobile touch drag (NO CHEATING WITH scrollTo)
    const preTouchEval = await cdp.send('Runtime.evaluate', {
      expression: `JSON.stringify({
        scrollY: window.scrollY,
        currentFrame: window.__SCROLLY_ENGINE__.getCurrentFrame()
      })`
    });
    const parsedPreTouch = JSON.parse(preTouchEval.result.value);
    const beforeTouchY = parsedPreTouch.scrollY;
    const beforeTouchFrame = parsedPreTouch.currentFrame;

    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 195, y: 600 }]
    });
    for (let y = 560; y >= 250; y -= 30) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: 195, y }]
      });
      await new Promise(r => setTimeout(r, 16));
    }
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: []
    });
    await new Promise(r => setTimeout(r, 600));

    const touchEval = await cdp.send('Runtime.evaluate', {
      expression: `JSON.stringify({
        scrollY: window.scrollY,
        currentFrame: window.__SCROLLY_ENGINE__.getCurrentFrame(),
        lastDrawn: window.__SCROLLY_ENGINE__.getLastDrawnFrame()
      })`
    });
    const parsedTouch = JSON.parse(touchEval.result.value);
    assert(parsedTouch.scrollY > beforeTouchY && parsedTouch.currentFrame > beforeTouchFrame,
      `Genuine mobile touch drag advanced scroll from ${beforeTouchY}px to ${parsedTouch.scrollY}px and frame from ${beforeTouchFrame.toFixed(1)} to ${parsedTouch.currentFrame.toFixed(1)} (drawn: ${parsedTouch.lastDrawn})`);

    // Complete journey to mobile bottom
    await cdp.send('Runtime.evaluate', {
      expression: 'window.scrollTo(0, 5988);'
    });
    await new Promise(r => setTimeout(r, 1200));

    const mobileEval = await cdp.send('Runtime.evaluate', {
      expression: `JSON.stringify({
        scrollY: window.scrollY,
        currentFrame: window.__SCROLLY_ENGINE__.getCurrentFrame(),
        lastDrawn: window.__SCROLLY_ENGINE__.getLastDrawnFrame()
      })`
    });
    const parsedMobile = JSON.parse(mobileEval.result.value);
    assert(parsedMobile.scrollY === 5988 && parsedMobile.lastDrawn === 499,
      `Bottom scroll successfully reached final frame 500 (drawn: ${parsedMobile.lastDrawn}, frame: ${parsedMobile.currentFrame.toFixed(1)}, scrollY: ${parsedMobile.scrollY}px)`);

    // Capture mobile verification screenshot
    const mobilePng = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, 'screenshot_mobile.png'), Buffer.from(mobilePng.data, 'base64'));
    console.log('  [PASS] Saved verified screenshot_mobile.png');
    passes++;

    // Capture desktop verification screenshot
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });
    await cdp.send('Runtime.evaluate', { expression: 'window.scrollTo(0, 2400);' });
    await new Promise(r => setTimeout(r, 600));
    const desktopPng = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, 'screenshot_desktop.png'), Buffer.from(desktopPng.data, 'base64'));
    console.log('  [PASS] Saved verified screenshot_desktop.png');
    passes++;

    cdp.close();
  } catch (err) {
    console.error('CDP test failure:', err);
    failures++;
  }

  console.log('\n==================================================');
  console.log(`TOTAL PASSES: ${passes}`);
  console.log(`TOTAL FAILURES: ${failures}`);
  console.log('==================================================\n');

  if (failures > 0) {
    process.exit(1);
  }
}

runTests();
