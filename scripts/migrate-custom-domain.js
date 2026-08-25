const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const OLD = 'https://belgin.web.app';
const NEW = 'https://belginkuyumculuk.com';
const extensions = new Set(['.html', '.js', '.json', '.txt', '.xml', '.md']);
const skipDirs = new Set(['.git', 'node_modules']);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (extensions.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

let changed = 0;
for (const file of walk(root)) {
  let text = fs.readFileSync(file, 'utf8');
  if (!text.includes(OLD)) continue;
  text = text.split(OLD).join(NEW);
  fs.writeFileSync(file, text, 'utf8');
  changed += 1;
  console.log('UPDATED', path.relative(root, file));
}

console.log(`DOMAIN_CUTOVER_UPDATED_FILES=${changed}`);
