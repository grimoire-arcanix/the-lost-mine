const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname,'..');
const escape = s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function build() {
  const source = path.join(root,'assets/img/gallery');
  const output = path.join(root,'assets/optimized/gallery');
  const metadata = JSON.parse(fs.readFileSync(path.join(root,'assets/gallery-metadata.json'),'utf8'));
  fs.mkdirSync(output,{recursive:true});
  // Only source-directory files are scanned. Derivatives live elsewhere.
  const files = fs.readdirSync(source).filter(n=>/\.(jpe?g|png|webp|gif|avif)$/i.test(n) && fs.statSync(path.join(source,n)).isFile()).sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:a.toLowerCase()>b.toLowerCase()?1:a<b?-1:1);
  const manifest = [];
  const cards = [];
  for (const [i,file] of files.entries()) {
    const name = file; // Include original extension to prevent basename collisions.
    const original = path.join(source,file);
    for (const width of [640,1600]) for(const ext of ['webp','jpg']) {
      const pipeline = sharp(original).rotate().resize({width,height:width===1600?1600:undefined,fit:'inside',withoutEnlargement:true}).flatten({background:'#f5eddc'});
      if(ext==='webp') await pipeline.webp({quality:width===640?80:86,effort:6}).toFile(path.join(output,`${name}-${width}.${ext}`));
      else await pipeline.jpeg({quality:width===640?82:86,mozjpeg:true}).toFile(path.join(output,`${name}-${width}.${ext}`));
    }
    const meta = metadata[file] || {alt:'A photograph from the campaign table.',caption:'A memory from around the table.',position:'center'};
    const thumb = await sharp(path.join(output,`${name}-640.jpg`)).metadata();
    const viewer = `assets/optimized/gallery/${encodeURIComponent(name)}-1600.jpg`;
    const originalUrl = `assets/img/gallery/${encodeURIComponent(file)}`;
    const thumbUrl = `assets/optimized/gallery/${encodeURIComponent(name)}-640`;
    manifest.push({file,sourceBytes:fs.statSync(original).size,thumbBytes:fs.statSync(path.join(output,`${name}-640.webp`)).size,viewerBytes:fs.statSync(path.join(output,`${name}-1600.jpg`)).size,width:thumb.width,height:thumb.height});
    cards.push(`        <figure class="album-card" style="--photo-position: ${escape(meta.position)}">
          <a href="${viewer}" data-original="${originalUrl}" data-caption="${escape(meta.caption)}" aria-label="View photograph ${i+1}: ${escape(meta.caption)}">
            <picture><source type="image/webp" srcset="${thumbUrl}.webp" /><img src="${thumbUrl}.jpg" width="${thumb.width}" height="${thumb.height}" alt="${escape(meta.alt)}" loading="lazy" decoding="async" /></picture>
          </a><figcaption><span class="photo-number">MEMORY ${String(i+1).padStart(2,'0')}</span>${escape(meta.caption)}</figcaption>
        </figure>`);
  }
  const file = path.join(root,'gallery.html');
  const html = fs.readFileSync(file,'utf8');
  if(!html.includes('<!-- GALLERY:START -->')) throw new Error('Missing gallery markup markers.');
  fs.writeFileSync(file,html.replace(/<!-- GALLERY:START -->[\s\S]*?<!-- GALLERY:END -->/,`<!-- GALLERY:START -->\n${cards.length?cards.join('\n'):'<p>More memories will be added to this archive.</p>'}\n<!-- GALLERY:END -->`));
  fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(`Generated ${files.length} static gallery entries, thumbnails and on-demand viewer images.`);
}
if(require.main===module)build().catch(e=>{console.error(e);process.exitCode=1;});
module.exports = build;
