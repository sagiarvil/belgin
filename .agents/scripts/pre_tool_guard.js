// pre_tool_guard.js
// Antigravity PreToolUse Güvenlik Kapısı
// Bu betik her dosya yazma ve düzenleme aracından önce otomatik çalışır.

const fs = require('fs');

let raw = '';
try {
  raw = fs.readFileSync(0, 'utf8'); // stdin
} catch (e) {}

if (!raw) {
  process.exit(0);
}

try {
  const payload = JSON.parse(raw);
  const toolCall = payload.toolCall || {};
  const toolName = toolCall.name || '';
  const args = toolCall.args || {};
  const targetFile = (args.TargetFile || args.FilePath || args.AbsolutePath || '').toLowerCase();

  // 1. Korumalı Dosya Kontrolü:
  // Eğer kullanıcı açıkça belirtmediği halde ajan ana şablonları tahrif etmeye kalkarsa engelle
  const SENSITIVE_CORE = ['schema.sql', '.env', 'composer.lock', 'package-lock.json'];
  for (const s of SENSITIVE_CORE) {
    if (targetFile.endsWith(s)) {
      console.error('GÜVENLİK ENGELİ: ' + s + ' dosyasına doğrudan yazma yetkiniz kısıtlanmıştır.');
      process.exit(1);
    }
  }
} catch (e) {}

process.exit(0);
