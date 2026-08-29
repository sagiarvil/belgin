/**
 * Universal Typo-Tolerant Turkish Search Engine (Vanilla JS Version for Belgin Kuyumculuk)
 * Features: Diacritic normalization, Levenshtein fuzzy match, intent token extraction, Did You Mean suggestions.
 */
(function(window) {
  function normalizeTurkish(text, options) {
    if (!text) return '';
    const foldDiacritics = options && options.foldDiacritics !== undefined ? options.foldDiacritics : true;
    let s = text.trim().toLocaleLowerCase('tr-TR');
    if (foldDiacritics) {
      s = s
        .replace(/i̇/g, 'i')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/â/g, 'a')
        .replace(/î/g, 'i')
        .replace(/û/g, 'u');
    }
    return s.replace(/\s+/g, ' ');
  }

  function levenshteinDistance(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  const STOP_WORDS = new Set([
    'nasil', 'nedir', 'ne', 'icin', 'kadar', 'olan', 'mi', 'mu', 'muydum',
    'fiyat', 'fiyati', 'hesaplama', 'orani', 'tablosu', 'listesi', 'almak',
    'istiyorum', 'bakmak', 'hangisi', 'en', 'iyi', 'uygun'
  ]);

  function extractSearchIntent(query) {
    const rawTokens = normalizeTurkish(query).split(/[^a-z0-9]+/i).filter(Boolean);
    const intentTokens = rawTokens.filter(t => !STOP_WORDS.has(t));
    return {
      rawQuery: query.trim(),
      normalizedQuery: normalizeTurkish(query),
      tokens: rawTokens,
      intentTokens: intentTokens.length > 0 ? intentTokens : rawTokens,
      isQuestion: rawTokens.some(t => ['nasil', 'nedir', 'ne', 'hangisi'].includes(t)) || query.includes('?'),
    };
  }

  function searchEngine(items, query, options) {
    const limit = (options && options.limit) || 24;
    const threshold = (options && options.threshold) || 20;
    const queryIntent = extractSearchIntent(query);
    const qNorm = queryIntent.normalizedQuery;

    if (!qNorm) {
      return { results: [], matches: [], didYouMean: null, suggestedItems: [], totalMatches: 0 };
    }

    const scored = [];
    const allTokens = new Set();

    for (const item of items) {
      const nameNorm = normalizeTurkish(item.name || `${item.brand || ''} ${item.name || ''}`);
      const summaryNorm = normalizeTurkish(`${item.summary || ''} ${item.reference || ''} ${item.metal || ''} ${item.category || ''}`);
      const combined = `${nameNorm} ${summaryNorm}`;

      nameNorm.split(' ').forEach(t => t.length >= 3 && allTokens.add(t));

      let score = 0;
      if (nameNorm === qNorm) score += 150;
      else if (nameNorm.startsWith(qNorm)) score += 90;
      else if (nameNorm.includes(qNorm)) score += 70;
      else if (combined.includes(qNorm)) score += 40;

      for (const token of queryIntent.intentTokens) {
        if (token.length < 2) continue;
        if (nameNorm.includes(token)) score += 35;
        else if (combined.includes(token)) score += 15;

        // Fuzzy match
        for (const word of nameNorm.split(' ')) {
          if (word.length >= 3 && token.length >= 3) {
            const dist = levenshteinDistance(token, word);
            const maxLen = Math.max(token.length, word.length);
            if (dist <= 2 && dist / maxLen <= 0.35) {
              score += 25 - dist * 8;
            }
          }
        }
      }

      if (score >= threshold) {
        scored.push({ item, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const results = scored.slice(0, limit).map(s => s.item);

    // Calculate Did You Mean
    let didYouMean = null;
    if (results.length === 0 || scored[0]?.score < 50) {
      let bestDist = Infinity;
      let bestWord = null;
      for (const word of allTokens) {
        const dist = levenshteinDistance(qNorm, word);
        if (dist > 0 && dist <= 2 && dist < bestDist) {
          bestDist = dist;
          bestWord = word;
        }
      }
      if (bestWord) didYouMean = bestWord;
    }

    const suggestedItems = results.length === 0 && scored.length > 0 ? scored.slice(0, 4).map(s => s.item) : [];

    return {
      results,
      didYouMean,
      suggestedItems,
      totalMatches: scored.length,
    };
  }

  window.UniversalSearch = {
    normalizeTurkish,
    levenshteinDistance,
    extractSearchIntent,
    searchEngine,
  };
})(window);
