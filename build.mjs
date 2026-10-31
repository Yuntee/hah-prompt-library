import {mkdir,copyFile,rm} from 'node:fs/promises';
const files=['index.html','style.css','app.js','content.json'];
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for (const f of files) await copyFile(f,`dist/${f}`);
console.log(`Built ${files.length} static files → dist/`);
