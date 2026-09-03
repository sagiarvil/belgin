#!/usr/bin/env node
/**
 * BELGIN KUYUMCULUK — SYNTAX & SCRIPT INTEGRITY ENTERPRISE GUARD
 * HTML sayfalarındaki tüm inline script ve JSON-LD bloklarının,
 * ayrıca tüm JS dosyalarının sözdizimini (syntax) derleme anında %100 doğrular.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================');
console.log('🛡️  BELGIN SCRIPT & HTML SYNTAX INTEGRITY GUARD');
console.log('====================================================');

let totalErrors = 0;

// 1. TÜM HTML DOSYALARINDAKİ INLINE JS VE JSON-LD BLOKLARININ DENETİMİ
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
let inlineJsCount = 0;
let jsonLdCount = 0;

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(content)) !== null) {
    const attrs = match[1] || '';
    const code = match[2].trim();
    if (!code) continue;
    if (/src\s*=/i.test(attrs)) continue;

    const isJsonLd = /type\s*=\s*["']application\/ld\+json["']/i.test(attrs);

    if (isJsonLd) {
      jsonLdCount++;
      try {
        JSON.parse(code);
      } catch (err) {
        totalErrors++;
        console.error(`  ❌ [${file}] JSON-LD parse hatası:`, err.message);
      }
    } else {
      inlineJsCount++;
      try {
        new Function(code);
      } catch (err) {
        totalErrors++;
        console.error(`  ❌ [${file}] Inline JavaScript syntax hatası:`, err.message);
      }
    }
  }
});

console.log(`✅ [HTML AUDIT]: ${htmlFiles.length} HTML dosyası (${inlineJsCount} inline JS, ${jsonLdCount} JSON-LD) denetlendi.`);

// 2. TÜM JS DOSYALARININ NATIVE NODE --CHECK İLE DOĞRULANMASI
function scanDir(dir) {
  let list = [];
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
      list = list.concat(scanDir(full));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      list.push(full);
    }
  }
  return list;
}

const jsFiles = scanDir('js').concat(scanDir('functions')).concat(scanDir('scripts')).concat(scanDir('tests'));
let jsChecked = 0;

jsFiles.forEach(file => {
  try {
    execSync(`node --check "${file}"`, { stdio: 'pipe' });
    jsChecked++;
  } catch (err) {
    totalErrors++;
    console.error(`  ❌ [${file}] Node parse hatası:`, err.stderr ? err.stderr.toString() : err.message);
  }
});

console.log(`✅ [JS AUDIT]: ${jsChecked} JavaScript dosyası (node --check) ile doğrulandı.`);

// 3. VIP MULTI-POS ENGINE BÜTÜNLÜK TESTİ
try {
  const vipCode = fs.readFileSync('js/vip-payment.js', 'utf8');
  const vm = require('vm');
  const context = {
    console: console,
    TextEncoder: TextEncoder,
    TextDecoder: TextDecoder,
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    atob: (s) => Buffer.from(s, 'base64').toString('binary')
  };
  vm.createContext(context);
  vm.runInContext(vipCode, context);
  const VipEngine = context.VipEngine;

  const t1 = VipEngine.decodeCompact(VipEngine.encodeCompact({ orderId: 'T1', title: 'Test', amount: 1000, provider: 'KUVEYTTURK' }));
  const t2 = VipEngine.decodeCompact(VipEngine.encodeCompact({ orderId: 'T2', title: 'Test2', amount: 2000, provider: 'PAYTR' }));
  
  if (t1.provider !== 'KUVEYTTURK' || t2.provider !== 'PAYTR') {
    throw new Error('VipEngine provider encoding uyuşmazlığı tespit edildi.');
  }
  console.log('✅ [VIP ENGINE]: Kuveyt Türk ve PayTR çoklu token motoru ve /22 ayrıştırıcı doğrulandı.');
} catch (err) {
  totalErrors++;
  console.error('  ❌ [VIP ENGINE ERROR]:', err.message);
}

console.log('====================================================');
if (totalErrors > 0) {
  console.error(`💥 SYNTAX GUARD FAILED: Toplam ${totalErrors} adet sözdizimi/bütünlük hatası bulundu.`);
  process.exit(1);
} else {
  console.log('🎉 SCRIPT & HTML SYNTAX GUARD PASS — 0 HATA');
  console.log('====================================================');
}
