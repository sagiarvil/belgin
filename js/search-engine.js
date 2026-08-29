// --- UNIVERSAL TURKISH SEARCH ENGINE (STANDARDIZED WITH PHONETIC & TRANSLITERATION) ---
const PHONETIC_BRAND_MAP = {
  "maykil": "michael kors",
  "maykıl": "michael kors",
  "maykel": "michael kors",
  "micheal": "michael kors",
  "michal": "michael kors",
  "maykılkors": "michael kors",
  "maykıl kors": "michael kors",
  "maykilkors": "michael kors",
  "roleks": "rolex",
  "rolx": "rolex",
  "rolexs": "rolex",
  "kartye": "cartier",
  "kartiye": "cartier",
  "karter": "cartier",
  "cartye": "cartier",
  "seyko": "seiko",
  "seko": "seiko",
  "sayko": "seiko",
  "versase": "versace",
  "vercase": "versace",
  "versace": "versace",
  "tisso": "tissot",
  "tisot": "tissot",
  "tisott": "tissot",
  "tomi": "tommy hilfiger",
  "tomy": "tommy hilfiger",
  "tomi hilfigir": "tommy hilfiger",
  "tommy": "tommy hilfiger",
  "patek filip": "patek philippe",
  "filip": "philippe",
  "patek": "patek philippe",
  "kasyo": "casio",
  "kassio": "casio",
  "casio": "casio",
  "fosil": "fossil",
  "fossil": "fossil",
  "svac": "swatch",
  "svoc": "swatch",
  "swoc": "swatch",
  "swatch": "swatch",
  "lonjin": "longines",
  "lonjines": "longines",
  "longines": "longines",
  "hublo": "hublot",
  "ublo": "hublot",
  "hublot": "hublot",
  "piyaje": "piaget",
  "piaget": "piaget",
  "sanel": "chanel",
  "şanel": "chanel",
  "chanel": "chanel",
  "guci": "gucci",
  "gucci": "gucci",
  "bulgari": "bvlgari",
  "bvlgari": "bvlgari",
  "kelvin": "calvin klein",
  "kalvin": "calvin klein",
  "calvin": "calvin klein",
  "dizel": "diesel",
  "disel": "diesel",
  "diesel": "diesel",
  "armani": "emporio armani",
  "emporyo": "emporio armani",
  "emporio": "emporio armani",
  "ges": "guess",
  "guess": "guess",
  "lakost": "lacoste",
  "lakoste": "lacoste",
  "lacoste": "lacoste",
  "svarovski": "swarovski",
  "swarovski": "swarovski",
  "zenit": "zenith",
  "zenith": "zenith",
  "velder": "welder",
  "welder": "welder",
  "submarner": "submariner",
  "submariner": "submariner",
  "altin": "altın",
  "bilezik": "bilezik",
  "yuzuk": "yüzük",
  "kolye": "kolye",
  "kupe": "küpe",
  "tektas": "tektaş",
  "pirlanta": "pırlanta"
};

function normalizeTr(text) {
  if (!text) return "";
  return text.trim().toLocaleLowerCase("tr-TR")
    .replace(/i̇/g, "i").replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a")
    .replace(/î/g, "i").replace(/û/g, "u").replace(/\\s+/g, " ");
}

function levenshteinDist(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

const STOP_WORDS_SET = new Set(["nasil", "nedir", "ne", "icin", "kadar", "olan", "mi", "fiyat", "fiyati", "almak", "istiyorum", "secilir"]);

function runBelginSearch(items, query) {
  const qNorm = normalizeTr(query);
  if (!qNorm) return { results: [], didYouMean: null, suggested: [] };
  
  const aliasExpansion = PHONETIC_BRAND_MAP[qNorm] || PHONETIC_BRAND_MAP[query.toLowerCase()] || "";
  const effectiveQueries = [qNorm];
  if (aliasExpansion) {
    effectiveQueries.push(normalizeTr(aliasExpansion));
  }
  
  const allTokens = new Set();
  effectiveQueries.forEach(eq => {
    eq.split(/[^a-z0-9]+/i).filter(t => !STOP_WORDS_SET.has(t) && t.length > 1).forEach(t => allTokens.add(t));
  });
  
  const tokens = Array.from(allTokens);
  const scored = [];
  const allWords = new Set();
  
  for (const p of items) {
    const brandNorm = normalizeTr(p.brand || "");
    const nameNorm = normalizeTr(p.name || "");
    const titleNorm = brandNorm + " " + nameNorm;
    const detailsNorm = normalizeTr((p.reference || "") + " " + (p.metal || "") + " " + (p.category || "") + " " + (p.subCategory || ""));
    const combined = titleNorm + " " + detailsNorm;
    
    brandNorm.split(" ").forEach(w => w.length >= 3 && allWords.add(w));
    nameNorm.split(" ").forEach(w => w.length >= 3 && allWords.add(w));
    
    let score = 0;
    for (const eq of effectiveQueries) {
      if (titleNorm === eq) score += 200;
      else if (titleNorm.startsWith(eq)) score += 120;
      else if (titleNorm.includes(eq)) score += 90;
      else if (brandNorm.includes(eq)) score += 100;
      else if (combined.includes(eq)) score += 50;
    }
    
    for (const t of tokens) {
      if (t.length < 2) continue;
      if (brandNorm === t) score += 90;
      else if (brandNorm.includes(t)) score += 70;
      else if (titleNorm.includes(t)) score += 40;
      else if (combined.includes(t)) score += 20;
      
      for (const w of titleNorm.split(" ")) {
        if (w.length >= 3 && t.length >= 3) {
          const d = levenshteinDist(t, w);
          const maxL = Math.max(t.length, w.length);
          if (d <= 2 && d / maxL <= 0.35) {
            score += 45 - d * 15;
          }
        }
      }
    }
    
    if (score >= 12) {
      scored.push({ p, score });
    }
  }
  
  scored.sort((a, b) => b.score - a.score);
  const results = scored.slice(0, 24).map(s => s.p);
  
  let didYouMean = null;
  if (aliasExpansion) {
    didYouMean = aliasExpansion;
  } else if (results.length === 0 || (scored[0] && scored[0].score < 50)) {
    let bestDist = Infinity;
    let bestWord = null;
    for (const w of allWords) {
      const d = levenshteinDist(qNorm, w);
      if (d > 0 && d <= 2 && d < bestDist) {
        bestDist = d;
        bestWord = w;
      }
    }
    if (bestWord) didYouMean = bestWord;
  }
  
  const suggested = results.length === 0 && scored.length > 0 ? scored.slice(0, 6).map(s => s.p) : [];
  return { results, didYouMean, suggested };
}

if (typeof module !== "undefined") module.exports = { runBelginSearch, normalizeTr, levenshteinDist, PHONETIC_BRAND_MAP };
