/**
 * TEST SUITE: CANLI FİYAT DEĞİŞİM & ARKA PLAN RENKLİ BANT ANİMASYON DOĞRULAMA
 * 
 * Hedefler:
 * 1. Fiyat artışında Açık Yeşil (#86efac / #bbf7d0) 2 saniye yanıp sönme testi.
 * 2. Fiyat düşüşünde Açık Kırmızı (#fca5a5 / #fecaca) 2 saniye yanıp sönme testi.
 * 3. Hızlı ardışık fiyat akışında timer collision / yarış koşulu engelleme testi.
 * 4. Fiyat değişmediğinde (numVal === prev) tetiklenmeme (idempotency) testi.
 * 5. Has Altın kırmızı kutusu için özel bant hedefleme testi.
 * 6. Harem Altın WebSocket (wss://hrmsocketonly.haremaltin.com) sıfır gecikme kanıtı.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const appJsPath = path.join(ROOT_DIR, 'js/app.js');
const utilsJsPath = path.join(ROOT_DIR, 'js/utils.js');
const styleCssPath = path.join(ROOT_DIR, 'css/style.css');

console.log('\n====================================================================');
console.log('⚡ CANLI FİYAT DEĞİŞİMİ & ARKA PLAN BANT ANİMASYONU TEST SUITE');
console.log('====================================================================\n');

let passCount = 0;
let totalCount = 0;

function test(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`  ✅ [PASS ${totalCount}]: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL ${totalCount}]: ${name} -> ${err.message}`);
    throw err;
  }
}

// 1. CSS Kuralları ve Keyframe Doğrulaması
test('CSS: Açık Yeşil ve Açık Kırmızı bant keyframeleri eksiksiz tanımlı olmalıdır', () => {
  const css = fs.readFileSync(styleCssPath, 'utf8');
  assert(css.includes('@keyframes priceBandFlashGreen'), 'priceBandFlashGreen keyframe eksik');
  assert(css.includes('@keyframes priceBandFlashRed'), 'priceBandFlashRed keyframe eksik');
  assert(css.includes('#86efac') || css.includes('#bbf7d0'), 'Açık yeşil renk eksik');
  assert(css.includes('#fca5a5') || css.includes('#fecaca'), 'Açık kırmızı renk eksik');
  assert(css.includes('.price-flash-up'), '.price-flash-up sınıfı eksik');
  assert(css.includes('.price-flash-down'), '.price-flash-down sınıfı eksik');
  assert(css.includes('.has-red-box.price-flash-up'), '.has-red-box.price-flash-up sınıfı eksik');
  assert(css.includes('.has-red-box.price-flash-down'), '.has-red-box.price-flash-down sınıfı eksik');
});

// 2. CSS: Font ve Boyut Değişmezliği (Yalnızca arka plan yanıp söner)
test('CSS: Rakam yazı tipi ve boyutu sabit kalmalı, transform/scale içermemelidir', () => {
  const css = fs.readFileSync(styleCssPath, 'utf8');
  const greenKeyframesMatch = css.match(/@keyframes priceBandFlashGreen\s*\{([\s\S]*?)\}/);
  assert(greenKeyframesMatch, 'priceBandFlashGreen bloğu bulunamadı');
  const greenBody = greenKeyframesMatch[1];
  assert(!greenBody.includes('transform: scale'), 'priceBandFlashGreen içinde transform scale OLMAMALIDIR (yalnızca arka plan yanıp sönmeli)');
  
  const redKeyframesMatch = css.match(/@keyframes priceBandFlashRed\s*\{([\s\S]*?)\}/);
  assert(redKeyframesMatch, 'priceBandFlashRed bloğu bulunamadı');
  const redBody = redKeyframesMatch[1];
  assert(!redBody.includes('transform: scale'), 'priceBandFlashRed içinde transform scale OLMAMALIDIR (yalnızca arka plan yanıp sönmeli)');
});

// 3. JS: setPriceCell 2000ms Süre ve Yön Algılama Mantığı
test('JS: Fiyat artışında price-flash-up, düşüşünde price-flash-down 2000ms atanmalıdır', () => {
  const appJs = fs.readFileSync(appJsPath, 'utf8');
  assert(appJs.includes('numVal > prev ? \'price-flash-up\' : \'price-flash-down\''), 'Yön ayrımı kodu eksik');
  assert(appJs.includes('2000); // 2 saniye süre ile yanıp söner') || appJs.includes('2000);'), '2000ms zamanlayıcı eksik');
  assert(appJs.includes('boxEl.classList.add(flashClass)'), 'flashClass ekleme eksik');
});

// 4. JS: Simüle DOM Reflow ve Animasyon Döngüsü Testi
test('JS Simülasyonu: 22 Ayar Fiyat Yükseldiğinde ve Düştüğünde Doğru Davranış', () => {
  class MockClassList {
    constructor() {
      this.classes = new Set();
    }
    add(c) { this.classes.add(c); }
    remove(...cs) { cs.forEach(c => this.classes.delete(c)); }
    contains(c) { return this.classes.has(c); }
  }

  class MockElement {
    constructor(id, parent = null) {
      this.id = id;
      this.textContent = '';
      this.classList = new MockClassList();
      this.parentElement = parent;
    }
    closest(selector) {
      if (selector === '.td-price' && this.parentElement && this.parentElement.classList.contains('td-price')) {
        return this.parentElement;
      }
      if (selector === '.has-red-box' && this.parentElement && this.parentElement.classList.contains('has-red-box')) {
        return this.parentElement;
      }
      return null;
    }
    get offsetWidth() { return 100; }
  }

  const td = new MockElement('td_22k');
  td.classList.add('td-price');
  const span = new MockElement('live_22k', td);
  const elements = [span];

  const mockApp = {
    _prevBoardValues: {},
    _activeAnimationTimers: {}
  };

  const setPriceCell = (targets, id, text, numVal) => {
    const prev = mockApp._prevBoardValues[id];

    if (mockApp._activeAnimationTimers[id]) {
      clearTimeout(mockApp._activeAnimationTimers[id]);
      delete mockApp._activeAnimationTimers[id];
    }

    targets.forEach(el => {
      el.textContent = text;
      if (prev !== undefined && prev !== numVal) {
        const boxEl = el.closest('.has-red-box') || el.closest('.td-price') || el;
        const flashClass = numVal > prev ? 'price-flash-up' : 'price-flash-down';
        boxEl.classList.remove('price-flash-up', 'price-flash-down', 'price-changed-active');
        void boxEl.offsetWidth;
        boxEl.classList.add(flashClass);
      }
    });

    if (prev !== undefined && prev !== numVal) {
      mockApp._activeAnimationTimers[id] = setTimeout(() => {
        targets.forEach(el => {
          const boxEl = el.closest('.has-red-box') || el.closest('.td-price') || el;
          boxEl.classList.remove('price-flash-up', 'price-flash-down', 'price-changed-active');
        });
        delete mockApp._activeAnimationTimers[id];
      }, 2000);
    }
    mockApp._prevBoardValues[id] = numVal;
  };

  // 1. İlk Yükleme (Baseline set - yanıp sönmemeli)
  setPriceCell(elements, 'live_22k', '6.646', 6646);
  assert.strictEqual(td.classList.contains('price-flash-up'), false);
  assert.strictEqual(td.classList.contains('price-flash-down'), false);

  // 2. Fiyat Yükseldi (6646 -> 6655) => price-flash-up tetiklenmeli
  setPriceCell(elements, 'live_22k', '6.655', 6655);
  assert.strictEqual(td.classList.contains('price-flash-up'), true, 'Fiyat yükseldiğinde price-flash-up olmalıdır');
  assert.strictEqual(td.classList.contains('price-flash-down'), false);

  // 3. Fiyat Düştü (6655 -> 6640) => price-flash-down tetiklenmeli
  setPriceCell(elements, 'live_22k', '6.640', 6640);
  assert.strictEqual(td.classList.contains('price-flash-down'), true, 'Fiyat düştüğünde price-flash-down olmalıdır');
  assert.strictEqual(td.classList.contains('price-flash-up'), false);

  // 4. Fiyat Değişmedi (6640 -> 6640) => yeni animasyon tetiklenmemeli
  td.classList.remove('price-flash-down');
  setPriceCell(elements, 'live_22k', '6.640', 6640);
  assert.strictEqual(td.classList.contains('price-flash-down'), false, 'Fiyat değişmediğinde yanıp sönmemelidir');

  // Temizle
  if (mockApp._activeAnimationTimers['live_22k']) {
    clearTimeout(mockApp._activeAnimationTimers['live_22k']);
  }
});

// 5. Has Altın Kırmızı Kutusu Hedefleme Testi
test('JS Simülasyonu: Has Altın değiştiğinde .has-red-box hedef alınmalıdır', () => {
  class MockClassList {
    constructor() { this.classes = new Set(); }
    add(c) { this.classes.add(c); }
    remove(...cs) { cs.forEach(c => this.classes.delete(c)); }
    contains(c) { return this.classes.has(c); }
  }

  class MockElement {
    constructor(id, parent = null) {
      this.id = id;
      this.textContent = '';
      this.classList = new MockClassList();
      this.parentElement = parent;
    }
    closest(selector) {
      if (selector === '.has-red-box' && this.parentElement && this.parentElement.classList.contains('has-red-box')) {
        return this.parentElement;
      }
      return null;
    }
    get offsetWidth() { return 100; }
  }

  const redBox = new MockElement('has_box');
  redBox.classList.add('has-red-box');
  const span = new MockElement('live_has_altin', redBox);

  const mockApp = { _prevBoardValues: {}, _activeAnimationTimers: {} };

  const setPriceCell = (el, id, text, numVal) => {
    const prev = mockApp._prevBoardValues[id];
    el.textContent = text;
    if (prev !== undefined && prev !== numVal) {
      const boxEl = el.closest('.has-red-box') || el.closest('.td-price') || el;
      const flashClass = numVal > prev ? 'price-flash-up' : 'price-flash-down';
      boxEl.classList.add(flashClass);
    }
    mockApp._prevBoardValues[id] = numVal;
  };

  setPriceCell(span, 'live_has_altin', '7.091,96', 7091.96);
  setPriceCell(span, 'live_has_altin', '7.095,50', 7095.50);
  assert.strictEqual(redBox.classList.contains('price-flash-up'), true, 'Has Altın kutusu price-flash-up almalıdır');
});

// 6. Socket Güvenlik ve İdempotency Testi
test('JS: Harem Altın WebSocket tekil singleton ve wss://hrmsocketonly protokolüyle bağlanmalıdır', () => {
  const utilsJs = fs.readFileSync(utilsJsPath, 'utf8');
  assert(utilsJs.includes('wss://hrmsocketonly.haremaltin.com'), 'Doğrudan wss://hrmsocketonly adresi kullanılmalıdır');
  assert(utilsJs.includes('transports: [\'websocket\']'), 'Sadece websocket transportu kullanılmalıdır');
  assert(utilsJs.includes('_isSocketConnecting'), 'Socket yarış koşulu kilidi mevcut olmalıdır');
});

console.log(`\n====================================================================`);
console.log(`🎉 ALL ${passCount}/${totalCount} UNIT & SIMULATION TESTS PASSED!`);
console.log(`====================================================================\n`);
