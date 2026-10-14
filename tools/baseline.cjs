const fs = require('node:fs');
const launch = require('./browser.cjs');
const {execFileSync} = require('node:child_process');
const server = require('./preview.cjs');
const base = 'http://127.0.0.1:4174/the-lost-mine/';
async function main() {
  const label = process.argv[2] || 'before';
  const dir = `artifacts/${label}`;
  fs.mkdirSync(dir,{recursive:true});
  const srv = server().listen(4174,'127.0.0.1');
  const browser = await launch();
  const results = [];
  try {
    for (const name of ['index','heroes','iris','gallery']) {
      const context = await browser.newContext({viewport:{width:1440,height:1000}});
      if (process.argv.includes('--original')) {
        for (const file of [`${name}.html`,'style.css','script.js']) {
          const body=execFileSync('git',['show',`HEAD:${file}`],{encoding:'utf8'});
          await context.route(`${base}${file}`,route=>route.fulfill({status:200,contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'text/javascript',body}));
        }
      }
      const page = await context.newPage();
      await page.addInitScript(() => {
        window.lab = {};
        new PerformanceObserver(l => {window.lab.lcp = l.getEntries().at(-1).startTime;}).observe({type:'largest-contentful-paint',buffered:true});
      });
      const start = Date.now();
      await page.goto(`${base}${name}.html`,{waitUntil:'networkidle'});
      await page.screenshot({path:`${dir}/${name}-desktop.png`});
      results.push({page:name,elapsedMs:Date.now()-start,...await page.evaluate(() => ({lcpMs:window.lab.lcp,imageBytes:performance.getEntriesByType('resource').filter(r=>/\.(png|jpg|jpeg|webp)(\?|$)/.test(r.name)).reduce((n,r)=>n+r.encodedBodySize,0),images:performance.getEntriesByType('resource').filter(r=>/\.(png|jpg|jpeg|webp)(\?|$)/.test(r.name)).map(r=>({url:r.name,bytes:r.encodedBodySize}))}))});
      await page.setViewportSize({width:390,height:844});
      await page.screenshot({path:`${dir}/${name}-mobile.png`});
      await context.close();
    }
    fs.writeFileSync(`${dir}/performance.json`,JSON.stringify(results,null,2)+'\n');
    console.log(JSON.stringify(results.map(({images,...r})=>r),null,2));
  } finally { await browser.close(); srv.close(); }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
