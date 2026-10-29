'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),target=path.join(root,'_site');
const revision=process.env.GITHUB_SHA||'local';
fs.cpSync(path.join(root,'dist'),target,{recursive:true});
const index=path.join(target,'index.html');
const html=fs.readFileSync(index,'utf8').replace(/(src|href)="([^"?]+\.(?:js|css))"/g,(_,attr,file)=>`${attr}="${file}?v=${encodeURIComponent(revision)}"`);
fs.writeFileSync(index,html);
console.log('Prepared Pages assets for '+revision);
