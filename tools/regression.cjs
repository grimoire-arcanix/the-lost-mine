const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const cheerio = require('cheerio');
const AxeBuilder = require('@axe-core/playwright').default;
const launch = require('./browser.cjs');
const server = require('./preview.cjs');
const buildAssets = require('./build-assets.cjs');
const buildGallery = require('./build-gallery.cjs');
const base = 'http://127.0.0.1:4175/the-lost-mine/';
const root = path.resolve(__dirname,'..');
const dir = path.join(root,'artifacts/qa');
const checks = [];
function check(value, message) { assert.ok(value,message); checks.push(message); }
function normalize(s) { return s.replace(/\s+/g,' ').trim(); }
function hashes(folder) {
  const result={};
  for (const entry of fs.readdirSync(folder,{withFileTypes:true})) {
    const file=path.join(folder,entry.name);
    if(entry.isDirectory())Object.assign(result,hashes(file));
    else result[path.relative(root,file)]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  }
  return result;
}
async function fullScroll(page) {
  await page.evaluate(async()=>{
    const original = scrollY;
    for(let y=0;y<document.body.scrollHeight;y+=innerHeight*2){scrollTo(0,y);await new Promise(r=>setTimeout(r,15));}
    scrollTo(0,original);
  });
  await page.waitForLoadState('networkidle');
}
async function main() {
  fs.mkdirSync(dir,{recursive:true});
  const content = JSON.parse(fs.readFileSync(path.join(root,'tests/campaign-content.json'),'utf8'));
  for(const [name,expected] of Object.entries(content)) {
    const s=cheerio.load(fs.readFileSync(path.join(root,`${name}.html`),'utf8'));
    s('.profile-reference').remove();
    const actual=s(name==='index'?'.timeline-text':'.profile-story, .profile-meta, .profile-subtitle').toArray().map(e=>normalize(s(e).text()));
    check(JSON.stringify(actual)===JSON.stringify(expected),`${name}: complete original narrative/metadata preserved in order`);
  }
  check(cheerio.load(fs.readFileSync(path.join(root,'index.html'),'utf8'))('.timeline-entry').length===39,'All 39 original timeline entries retained');
  if (!process.argv.includes('--skip-generation')) {
  const beforeSources = hashes(path.join(root,'assets/img'));
  await buildAssets(); await buildGallery();
  const once = {...hashes(path.join(root,'assets/optimized')),gallery:fs.readFileSync(path.join(root,'gallery.html'),'utf8')};
  await buildAssets(); await buildGallery();
  const twice = {...hashes(path.join(root,'assets/optimized')),gallery:fs.readFileSync(path.join(root,'gallery.html'),'utf8')};
  check(JSON.stringify(once)===JSON.stringify(twice),'Two complete asset/gallery builds are byte-for-byte deterministic');
  check(JSON.stringify(beforeSources)===JSON.stringify(hashes(path.join(root,'assets/img'))),'Generation leaves every source photograph and artwork unchanged');
  check(JSON.parse(fs.readFileSync(path.join(root,'assets/optimized/gallery/manifest.json'))).length===8,'Eight gallery entries; no derivatives scanned recursively');
  }
  const srv=server().listen(4175,'127.0.0.1');
  let browser;
  try {
    browser=await launch();
    const pages=fs.readdirSync(root).filter(f=>f.endsWith('.html')).sort();
    const errors=[];
    const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    page.on('requestfailed',r=>errors.push(`Failed: ${r.url()} ${r.failure()?.errorText}`));
    page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()}: ${r.url()}`);});
    const destinations=new Set();
    for(const file of pages) {
      const response=await page.goto(base+file,{waitUntil:'networkidle'});
      check(response.status()===200,`${file}: HTTP 200 under project prefix`);
      await fullScroll(page);
      check(await page.locator('h1').count()===1,`${file}: exactly one h1`);
      check(await page.locator('meta[name="description"]').count()===1,`${file}: unique page description`);
      await page.locator('.skip-link').focus();
      await page.keyboard.press('Enter');
      check(await page.locator('#main').evaluate(e=>e===document.activeElement),`${file}: skip link moves keyboard focus into main content`);
      await page.evaluate(()=>scrollTo(0,0));
      check(await page.evaluate(()=>[...document.images].filter(i=>i.src).every(i=>i.complete&&i.naturalWidth>0)),`${file}: all static images decode`);
      check(await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return new Set(ids).size===ids.length;}),`${file}: unique fragment ids`);
      const urls=await page.evaluate(()=>{
        const urls=[];
        for(const el of document.querySelectorAll('[href],[src],[srcset],meta[property="og:image"],meta[property="og:url"],link[rel="canonical"]')) {
          for(const attr of ['href','src'])if(el.hasAttribute(attr)&&el.getAttribute(attr))urls.push(new URL(el.getAttribute(attr),document.baseURI).href);
          if(el.hasAttribute('srcset'))for(const source of el.getAttribute('srcset').split(','))urls.push(new URL(source.trim().split(/\s+/)[0],document.baseURI).href);
          if(el.matches('meta[property="og:image"],meta[property="og:url"]'))urls.push(el.content);
        }
        return urls;
      });
      for(const url of urls) {
        const u=new URL(url);
        if(u.hostname==='grimoire-arcanix.github.io')destinations.add(base+u.pathname.slice('/the-lost-mine/'.length)+u.hash);
        else if(u.origin===new URL(base).origin)destinations.add(url);
      }
      for(const [w,h] of [[320,780],[390,844],[768,1024],[1024,800],[1440,1000],[1920,1080],[844,390]]) {
        await page.setViewportSize({width:w,height:h});
        check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${file}: no horizontal overflow at ${w}×${h}`);
      }
      await page.setViewportSize({width:640,height:800});
      await page.evaluate(()=>document.documentElement.style.fontSize='200%');
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${file}: 200% text at 640px reflows`);
      await page.evaluate(()=>document.documentElement.style.fontSize='');
      for(const width of [1440,390]) {
        await page.setViewportSize({width,height:width===390?844:1000});
        await page.evaluate(()=>scrollTo(0,0));
        const accessibility=await new AxeBuilder({page}).analyze();
        fs.writeFileSync(path.join(dir,`${file}-${width}-axe.json`),JSON.stringify(accessibility.violations,null,2)+'\n');
        check(accessibility.violations.length===0,`${file}: axe zero violations at ${width}px`);
        if(['index.html','heroes.html','iris.html','gallery.html','404.html'].includes(file))await page.screenshot({path:path.join(dir,`${file.replace('.html','')}-${width}.png`)});
        if(['heroes.html','gallery.html'].includes(file))await page.screenshot({path:path.join(dir,`${file.replace('.html','')}-full-${width}.png`),fullPage:true});
        if(file==='iris.html')await page.locator('.profile-card').screenshot({path:path.join(dir,`dossier-full-${width}.png`)});
      }
    }
    for(const url of destinations) {
      const u=new URL(url);const response=await context.request.get(url);
      check(response.status()===200,`Crawl destination HTTP 200: ${u.pathname}${u.hash}`);
      if(u.hash){const s=cheerio.load(await response.text());check(s(`[id="${decodeURIComponent(u.hash.slice(1))}"]`).length>0,`Fragment exists: ${u.hash}`);}
    }
    // CSS background/font URLs are checked separately from DOM references.
    const css=fs.readFileSync(path.join(root,'style.css'),'utf8');
    for(const match of css.matchAll(/url\('([^']+)'\)/g)) {
      if(match[1]==='x.webp')continue; // A feature-query syntax probe, never a request.
      check((await context.request.get(base+match[1])).status()===200,`CSS asset exact-case HTTP 200: ${match[1]}`);
    }
    check((await context.request.get(base+'Assets/codex-emblem.svg')).status()===404,'Preview rejects incorrect filename case');
    check(!errors.length,`All ${pages.length} pages: no browser console/page errors or failed network requests`);
    await page.setViewportSize({width:1440,height:1000});
    await page.goto(base+'index.html',{waitUntil:'networkidle'});
    for (const destination of ['heroes.html','gallery.html','index.html']) {
      await page.locator(`.main-nav a[href="${destination}"]`).click();
      check(page.url().endsWith(destination),`Main navigation reaches ${destination}`);
    }
    await page.locator('.prologue-index summary').click();
    check(await page.locator('.prologue-index').evaluate(e=>e.open),'Native contents disclosure opens all 23 prologue events');
    await page.locator('.prologue-index summary').click();
    await page.locator('.opening a[href="#campaign"]').click();
    check(new URL(page.url()).hash==='#campaign','Cover campaign action follows real fragment');
    await page.reload({waitUntil:'networkidle'});
    check(await page.locator('#campaign').evaluate(e=>{const top=e.getBoundingClientRect().top;return top>=50&&top<160;}),'Deep-link reload stays below sticky chapter bar');
    await page.screenshot({path:path.join(dir,'campaign-1440.png')});
    await page.locator('.campaign-chapter').last().screenshot({path:path.join(dir,'campaign-long-1440.png')});
    await page.locator('.chapter-nav a[href="#campaign"]').click();
    await page.locator('.chapter-nav a[href="#epilogue"]').click();
    check(await page.locator('.chapter-nav a[href="#epilogue"]').getAttribute('aria-current')==='location','Chapter navigation announces current section');
    await page.goBack();check(new URL(page.url()).hash==='#campaign','Browser Back returns to campaign fragment');
    await page.goForward();check(new URL(page.url()).hash==='#epilogue','Browser Forward returns to epilogue fragment');
    await page.locator('.back-top').click();check(await page.evaluate(()=>scrollY<5),'Back-to-top control reaches page opening');
    for(const link of ['prologue','campaign','epilogue','unfinished-threads']) {
      await page.locator(`.chapter-nav-links a[href="#${link}"]`).click();
      check(await page.locator(`#${link}`).evaluate(e=>e.getBoundingClientRect().top>=50),`${link}: chapter heading not obscured`);
    }
    await page.goto(base+'index.html#campaign',{waitUntil:'networkidle'});
    await page.setViewportSize({width:390,height:844});
    await page.locator('#campaign').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(dir,'campaign-390.png')});
    await page.locator('.campaign-chapter').last().screenshot({path:path.join(dir,'campaign-long-390.png')});
    await page.goto(base+'heroes.html',{waitUntil:'networkidle'});
    for(const name of ['iris','flint','seraphina','quarion','robin','hammer']) {
      await page.locator(`.hero-tile[href="${name}.html"]`).click();
      check(page.url().endsWith(`${name}.html`),`Roster opens ${name} dossier`);
      await page.locator('.breadcrumbs a[href="heroes.html"]').click();
    }
    await page.goto(base+'iris.html',{waitUntil:'networkidle'});
    for(const name of ['flint','seraphina','quarion','robin','hammer','iris']) {
      await page.locator('.profile-traversal a').last().click();
      check(page.url().endsWith(`${name}.html`),`Next hero reaches ${name} in company order`);
    }
    await page.locator('.profile-traversal a').first().click();
    check(page.url().endsWith('hammer.html'),'Previous hero wraps to Hammer');
    await page.locator('.profile-traversal a[href="index.html#epilogue"]').click();
    check(new URL(page.url()).hash==='#epilogue','Profile return reaches chronicle epilogue');
    await context.close();
    // Gallery keyboard, mouse, focus and scroll tests.
    const galleryContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    const gallery=await galleryContext.newPage();
    await gallery.goto(base+'gallery.html',{waitUntil:'networkidle'});
    const first=gallery.locator('#album a').first();
    await first.focus();await gallery.keyboard.press('Enter');
    await gallery.waitForFunction(()=>{const i=document.getElementById('lightbox-image');return i?.complete&&!i.hidden&&i.naturalWidth>0;});
    check(await gallery.locator('#lightbox').evaluate(d=>d.open),'Keyboard opens native modal');
    check(await gallery.locator('#lightbox-close').evaluate(e=>e===document.activeElement),'Focus enters close control');
    const modalAxe=await new AxeBuilder({page:gallery}).analyze();
    fs.writeFileSync(path.join(dir,'viewer-axe.json'),JSON.stringify(modalAxe.violations,null,2)+'\n');
    check(!modalAxe.violations.length,'Open modal: axe zero violations');
    await gallery.keyboard.press('Shift+Tab');
    check(await gallery.locator('#viewer-original').evaluate(e=>e===document.activeElement),'Shift+Tab wraps to final viewer control');
    await gallery.keyboard.press('Tab');
    check(await gallery.locator('#lightbox-close').evaluate(e=>e===document.activeElement),'Tab wraps to first viewer control');
    for(let i=0;i<9;i++){
      await gallery.keyboard.press('Tab');
      check(await gallery.locator('#lightbox').evaluate(d=>d.contains(document.activeElement)),'Tab remains inside modal');
    }
    await gallery.locator('#lightbox-prev').click();check(await gallery.locator('#viewer-count').textContent()==='8 / 8','Previous wraps first photograph to last');
    await gallery.keyboard.press('ArrowRight');check(await gallery.locator('#viewer-count').textContent()==='1 / 8','ArrowRight wraps last photograph to first');
    await gallery.locator('#lightbox-next').click();check(await gallery.locator('#viewer-count').textContent()==='2 / 8','Next button selects second photograph');
    await gallery.waitForFunction(()=>document.getElementById('lightbox-image')?.naturalWidth>0);
    await gallery.locator('#lightbox-image').evaluate(e=>e.decode());
    await gallery.screenshot({path:path.join(dir,'viewer-1440.png')});
    await gallery.keyboard.press('Escape');
    check(await first.evaluate(e=>e===document.activeElement),'Escape restores focus to original thumbnail');
    check(!await gallery.locator('body').evaluate(e=>e.classList.contains('viewer-open')),'Closing releases scroll lock');
    const last=gallery.locator('#album a').last();await last.scrollIntoViewIfNeeded();
    const scrollBefore=await gallery.evaluate(()=>scrollY);await last.click();await gallery.locator('#lightbox-close').click();
    check(Math.abs(await gallery.evaluate(()=>scrollY)-scrollBefore)<2,'Mouse close restores original scroll position');
    await first.click();check(await gallery.locator('#lightbox').evaluate(d=>d.open),'Viewer reopens after closing');
    await gallery.locator('#lightbox-close').click();
    await gallery.route('**/*-1600.jpg',route=>route.fulfill({status:404,body:''}));
    await first.click();await gallery.waitForFunction(()=>document.getElementById('viewer-status').textContent.includes('could not'));
    check(await gallery.locator('#viewer-original').getAttribute('href')==='assets/img/gallery/20260111_114826.jpg','Missing viewer image retains original-image recovery link');
    await gallery.keyboard.press('Escape');
    await gallery.unroute('**/*-1600.jpg');
    await galleryContext.close();
    const touchContext=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
    const touch=await touchContext.newPage();await touch.goto(base+'gallery.html',{waitUntil:'networkidle'});
    await touch.locator('#album a').first().tap();await touch.waitForFunction(()=>{const i=document.getElementById('lightbox-image');return i?.complete&&!i.hidden&&i.naturalWidth>0;});
    await touch.locator('#lightbox-image').evaluate(e=>e.decode());
    await touch.screenshot({path:path.join(dir,'viewer-390.png')});
    await touch.locator('#lightbox-next').tap();check(await touch.locator('#viewer-count').textContent()==='2 / 8','Touch tap opens and advances viewer');
    for(const [width,height] of [[320,780],[390,844],[844,390]]) {
      await touch.setViewportSize({width,height});
      check(await touch.locator('.viewer-controls').evaluate(e=>{const r=e.getBoundingClientRect();return r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;}),`Viewer controls reachable at ${width}×${height}`);
    }
    await touch.setViewportSize({width:390,height:844});await touch.locator('#lightbox-close').tap();
    check(!await touch.locator('#lightbox').evaluate(d=>d.open),'Touch close dismisses viewer');await touchContext.close();
    for(const mode of ['no-js','failed-script','no-observer','no-dialog']) {
      const fallback=await browser.newContext({javaScriptEnabled:mode!=='no-js',viewport:{width:390,height:844},reducedMotion:'reduce'});
      if(mode==='no-observer')await fallback.addInitScript(()=>{window.IntersectionObserver=undefined;});
      if(mode==='no-dialog')await fallback.addInitScript(()=>{HTMLDialogElement.prototype.showModal=undefined;});
      if(mode==='failed-script')await fallback.route('**/*.js',r=>r.abort());
      const p=await fallback.newPage();await p.goto(base+'index.html',{waitUntil:'networkidle'});
      check(await p.locator('.timeline-text').count()===40,`${mode}: introduction and 39 entries remain in DOM`);
      await p.locator('.timeline-entry').last().scrollIntoViewIfNeeded();
      check(await p.locator('.timeline-entry').last().isVisible(),`${mode}: final entry remains readable`);
      await p.goto(base+'gallery.html',{waitUntil:'networkidle'});
      check(await p.locator('#album a').count()===8,`${mode}: all eight static photograph links remain usable`);
      if(['no-js','no-dialog','failed-script'].includes(mode)) {
        await p.locator('#album a').first().click();check(p.url().endsWith('-1600.jpg'),`${mode}: ordinary link opens viewer photograph`);
      }
      await fallback.close();
    }
    const motion=await browser.newContext({reducedMotion:'reduce'});const mp=await motion.newPage();await mp.goto(base+'heroes.html',{waitUntil:'networkidle'});
    check(await mp.locator('.hero-tile').first().evaluate(e=>getComputedStyle(e).transitionDuration==='0s'),'Reduced motion removes transitions');await motion.close();
    fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify({status:'passed',browser:browser.version(),pages,checks:checks.length,details:checks},null,2)+'\n');
    console.log(`PASS: ${checks.length} checks across ${pages.length} pages. Screenshots and axe results: artifacts/qa/`);
  } finally { if(browser)await browser.close();srv.close(); }
}
main().catch(e=>{fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify({status:'failed',passed:checks.length,error:e.stack,details:checks},null,2)+'\n');console.error(e);process.exitCode=1;});
