// Non-destructive image derivatives. Original art and photographs never change.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname,'..');
async function build() {
  const input = path.join(root,'assets/img');
  const output = path.join(root,'assets/optimized');
  fs.mkdirSync(output,{recursive:true});
  const fonts = path.join(root,'assets/fonts');
  fs.mkdirSync(fonts,{recursive:true});
  for (const [name,files] of [['eb-garamond',['eb-garamond-latin-400-normal.woff2','eb-garamond-latin-600-normal.woff2']],['uncial-antiqua',['uncial-antiqua-latin-400-normal.woff2']]]) {
    for (const file of files) fs.copyFileSync(path.join(root,'node_modules/@fontsource',name,'files',file),path.join(fonts,file));
    fs.copyFileSync(path.join(root,'node_modules/@fontsource',name,'LICENSE'),path.join(fonts,`${name}-LICENSE.txt`));
  }
  const manifest = {};
  for (const file of fs.readdirSync(input).sort()) {
    if (!/\.(png|jpg)$/.test(file) || file === 'theswordcoast.png') continue;
    const name = path.parse(file).name;
    const original = path.join(input,file);
    const meta = await sharp(original).metadata();
    manifest[file] = {width:meta.width,height:meta.height,sourceBytes:fs.statSync(original).size};
    for (const width of [480,960]) {
      for (const format of ['webp','jpg']) {
        const pipeline = sharp(original).rotate().resize({width,withoutEnlargement:true});
        const target = path.join(output,`${name}-${width}.${format}`);
        if (format === 'webp') await pipeline.webp({quality:82,effort:6}).toFile(target);
        else await pipeline.flatten({background:'#efe4ca'}).jpeg({quality:84,mozjpeg:true}).toFile(target);
      }
    }
  }
  const map = path.join(input,'theswordcoast.png');
  const meta = await sharp(map).metadata();
  await sharp(map).resize({width:1600}).jpeg({quality:78,mozjpeg:true}).toFile(path.join(output,'sword-coast.jpg'));
  await sharp(map).resize({width:1600}).webp({quality:78,effort:6}).toFile(path.join(output,'sword-coast.webp'));
  manifest['theswordcoast.png'] = {width:meta.width,height:meta.height,sourceBytes:fs.statSync(map).size,jpgBytes:fs.statSync(path.join(output,'sword-coast.jpg')).size,webpBytes:fs.statSync(path.join(output,'sword-coast.webp')).size};
  fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(`Generated derivatives of ${Object.keys(manifest).length} artwork assets; map ${manifest['theswordcoast.png'].webpBytes} bytes WebP.`);
}
if (require.main === module) build().catch(e=>{console.error(e);process.exitCode=1;});
module.exports = build;
