// Strict, case-sensitive static preview at the real GitHub Pages prefix.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.json':'application/json','.woff2':'font/woff2'};
function server() {
  return http.createServer((req,res) => {
    let url;
    try { url = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
    if (url === '/') { res.writeHead(302, {Location:'/the-lost-mine/'}).end(); return; }
    if (!url.startsWith('/the-lost-mine/')) { res.writeHead(404).end(); return; }
    const segments = url.slice(15).split('/').filter(Boolean);
    if (!segments.length || url.endsWith('/')) segments.push('index.html');
    let target = root;
    for (const segment of segments) {
      if (segment === '..' || !fs.existsSync(target) || !fs.statSync(target).isDirectory() || !fs.readdirSync(target).includes(segment)) { res.writeHead(404).end(); return; }
      target = path.join(target, segment);
    }
    if (!fs.statSync(target).isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, {'Content-Type':types[path.extname(target)] || 'application/octet-stream','Content-Length':fs.statSync(target).size});
    fs.createReadStream(target).pipe(res);
  });
}
if (require.main === module) server().listen(4173,'127.0.0.1', () => console.log('Preview: http://127.0.0.1:4173/the-lost-mine/'));
module.exports = server;
