'use strict';
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname,'dist',file),'utf8');
const script = file => read(file).replace(/<\/script/gi,'<\\/script');
let html = read('index.html')
  .replace('<link rel="stylesheet" href="styles.css">','<style>'+read('styles.css')+'</style>')
  .replace(/\s*<script src="(?:league-data|legacy-core|legacy-v2-core|schedule-data|pathways-data|core|recap|app)\.js" defer><\/script>/g,'')
  .replace('</body>',()=>['league-data.js','legacy-core.js','legacy-v2-core.js','schedule-data.js','pathways-data.js','core.js','recap.js','app.js'].map(file=>'<script>'+script(file)+'</script>').join('')+'</body>');
for (const file of ['ball.svg','field.svg']) {
  const uri = 'data:image/svg+xml;base64,'+Buffer.from(read(file)).toString('base64');
  html = html.replaceAll('"'+file+'"','"'+uri+'"');
}
const target=path.join(__dirname,'play.html');
fs.writeFileSync(target,html,'utf8');
console.log('Standalone game created: '+target);
