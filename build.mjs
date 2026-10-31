import {mkdir,copyFile,rm,readFile} from 'node:fs/promises';
const files=['index.html','style.css','app.js','content.json'];
const data=JSON.parse(await readFile('content.json','utf8'));
const media=[...new Set(data.cases.flatMap(c=>(c.lessonFlow||[]).flatMap(s=>(s.photos||[]).map(p=>p.src))))];
for(const src of media){if(!/^\/media-[a-z0-9-]+\.(webp|png|jpg)$/.test(src))throw new Error('Invalid public media path');files.push(src.slice(1));}
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for (const f of files) await copyFile(f,`dist/${f}`);
console.log(`Built ${files.length} static files → dist/`);
