// ensure_utf8_bom.js
// Dosya yazıldıktan sonra başında UTF-8 BOM (EF BB BF) yoksa otomatik olarak ekler.
const fs = require('fs');

let raw = '';
try { raw = fs.readFileSync(0, 'utf8'); } catch (e) {}

if (raw) {
  try {
    const payload = JSON.parse(raw);
    const args = (payload.toolCall && payload.toolCall.args) || {};
    const file = args.TargetFile || args.FilePath || args.AbsolutePath;
    if (file && fs.existsSync(file)) {
      const ext = file.split('.').pop().toLowerCase();
      if (['html', 'htm', 'js', 'css', 'php', 'json', 'md'].includes(ext)) {
        const buf = fs.readFileSync(file);
        if (!(buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF)) {
          const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
          fs.writeFileSync(file, Buffer.concat([bom, buf]));
        }
      }
    }
  } catch (e) {}
}
process.exit(0);
