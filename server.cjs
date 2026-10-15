'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'dist');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const server = http.createServer((req,res) => {
  let relative;
  try { relative = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400);return res.end(); }
  const file = path.resolve(root, '.' + (relative === '/' ? '/index.html' : relative));
  if (!file.startsWith(root + path.sep)) {res.writeHead(403);return res.end();}
  fs.readFile(file, (error,data) => {if(error){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);});
});
server.listen(4173,'127.0.0.1',()=>console.log('Dugout local preview: http://127.0.0.1:4173'));
