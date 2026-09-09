'use strict';

/**
 * BELGİN MAGAZİN — FIRST-PARTY CHRONO24 ARTICLE EXTRACTOR
 *
 * Purpose:
 * GitHub shared runners are currently blocked by Chrono24 (HTTP 403). This narrowly-scoped
 * Cloud Function performs only the full-article extraction step from Belgin's own cloud runtime.
 *
 * Security contract:
 * - POST only.
 * - Accepts an article numeric ID, never an arbitrary URL/host.
 * - The ID must currently exist in Chrono24's own static magazine RSS feed.
 * - Only fixed Chrono24 .com/.com.tr magazine URLs can be fetched.
 * - Returns extracted text fields, never raw source HTML.
 * - No browser CORS exposure; intended for server-to-server magazine sync only.
 */

const functions = require('firebase-functions');
const axios = require('axios');

const RSS_URL = 'https://static.chrono24.com/magazine/article-rss-feed.xml?limit=30';
const MAX_PARAGRAPHS = 24;
const MAX_PARAGRAPH_CHARS = 5000;
const ARTICLE_ID_RE = /^\d{5,7}$/;
const ARTICLE_LINK_RE = /https:\/\/www\.chrono24\.com\/magazine\/[^\s<"']+-p_(\d+)\/?/i;

function decodeEntities(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function stripTags(value) {
  return decodeEntities(
    String(value || '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim();
}

function extractTag(xml, tagName) {
  const escaped = tagName.replace(':', '\\:');
  const match = String(xml || '').match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, 'i'));
  return match ? decodeEntities(match[1]).trim() : '';
}

function rssItemForId(xml, articleId) {
  const items = String(xml || '').match(/<item\b[\s\S]*?<\/item>/gi) || [];
  for (const item of items) {
    const link = extractTag(item, 'link') || extractTag(item, 'guid');
    const match = link.match(ARTICLE_LINK_RE);
    if (match && match[1] === articleId) {
      return {
        link,
        title: stripTags(extractTag(item, 'title')),
        published: extractTag(item, 'pubDate') || extractTag(item, 'published') || '',
      };
    }
  }
  return null;
}

function safeArticleUrl(url) {
  try {
    const parsed = new URL(String(url || ''));
    if (parsed.protocol !== 'https:') return false;
    if (!['www.chrono24.com', 'www.chrono24.com.tr'].includes(parsed.hostname)) return false;
    return /^\/magazine\/[^/?#]+-p_\d+\/?$/i.test(parsed.pathname);
  } catch (_) {
    return false;
  }
}

function normalizePublished(raw) {
  const direct = String(raw || '').match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (direct) return direct[1];
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : '';
}

function collectJsonLd(html) {
  const out = [];
  const re = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(String(html || ''))) !== null) {
    try {
      const payload = JSON.parse(decodeEntities(match[1]).trim());
      const stack = Array.isArray(payload) ? [...payload] : [payload];
      while (stack.length) {
        const item = stack.shift();
        if (!item || typeof item !== 'object') continue;
        out.push(item);
        if (Array.isArray(item['@graph'])) stack.push(...item['@graph']);
      }
    } catch (_) {
      // A malformed JSON-LD block must not prevent fallback HTML extraction.
    }
  }
  return out;
}

function articleJsonLd(html) {
  for (const item of collectJsonLd(html)) {
    const kind = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
    if (kind.some((v) => ['Article', 'BlogPosting', 'NewsArticle'].includes(v))) return item;
  }
  return null;
}

function extractH1(html) {
  const match = String(html || '').match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return match ? stripTags(match[1]) : '';
}

function extractTime(html) {
  const match = String(html || '').match(/<time\b[^>]*datetime=["']([^"']+)["'][^>]*>/i);
  return match ? normalizePublished(match[1]) : '';
}

function extractParagraphs(html) {
  const paragraphs = [];
  const seen = new Set();
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = re.exec(String(html || ''))) !== null && paragraphs.length < MAX_PARAGRAPHS) {
    const text = stripTags(match[1]).slice(0, MAX_PARAGRAPH_CHARS).trim();
    if (text.length < 35) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    if (/cookie|privacy policy|all rights reserved|newsletter|subscribe/i.test(text)) continue;
    seen.add(key);
    paragraphs.push(text);
  }
  return paragraphs;
}

function extractImage(html, jsonLd) {
  const image = jsonLd && jsonLd.image;
  if (typeof image === 'string' && /^https:\/\//i.test(image)) return image;
  if (Array.isArray(image) && image.length) {
    const first = image[0];
    if (typeof first === 'string' && /^https:\/\//i.test(first)) return first;
    if (first && typeof first === 'object') {
      const candidate = first.contentUrl || first.url;
      if (typeof candidate === 'string' && /^https:\/\//i.test(candidate)) return candidate;
    }
  }
  if (image && typeof image === 'object') {
    const candidate = image.contentUrl || image.url;
    if (typeof candidate === 'string' && /^https:\/\//i.test(candidate)) return candidate;
  }

  const imgRe = /<img\b[^>]*(?:src|data-src)=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRe.exec(String(html || ''))) !== null) {
    const src = decodeEntities(match[1]);
    if (/magazine-article\//i.test(src) && !/300x300|logo|flag|\/144\//i.test(src)) {
      return src.startsWith('//') ? `https:${src}` : src;
    }
  }
  return '';
}

async function getText(url, headers = {}, timeout = 20000) {
  const response = await axios.get(url, {
    timeout,
    maxRedirects: 5,
    responseType: 'text',
    validateStatus: () => true,
    headers,
  });
  return response;
}

async function fetchArticleHtml(canonicalUrl) {
  const commonHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,tr;q=0.7',
    'Cache-Control': 'no-cache',
  };

  const attempts = [
    { transport: 'chrono24.com', url: canonicalUrl },
    { transport: 'chrono24.com.tr', url: canonicalUrl.replace('https://www.chrono24.com/', 'https://www.chrono24.com.tr/') },
  ];
  const statuses = [];
  for (const attempt of attempts) {
    if (!safeArticleUrl(attempt.url)) continue;
    try {
      const response = await getText(attempt.url, commonHeaders, 22000);
      statuses.push(`${attempt.transport}=${response.status}`);
      if (response.status === 200 && typeof response.data === 'string' && response.data.length > 1000) {
        return { html: response.data, transport: attempt.transport, statuses };
      }
    } catch (error) {
      statuses.push(`${attempt.transport}=${error.code || error.name || 'ERROR'}`);
    }
  }
  const error = new Error(`Chrono24 article unavailable from cloud runtime: ${statuses.join(',')}`);
  error.code = 'CHRONO_ARTICLE_UNAVAILABLE';
  throw error;
}

exports.magazineFetchArticle = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onRequest(async (req, res) => {
    res.set('Cache-Control', 'no-store, max-age=0');
    res.set('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });

    const articleId = String(req.body?.articleId || '').trim();
    if (!ARTICLE_ID_RE.test(articleId)) return res.status(400).json({ ok: false, error: 'INVALID_ARTICLE_ID' });

    try {
      const rssResponse = await getText(RSS_URL, {
        'User-Agent': 'BelginMagazineSync/2.0 (+https://www.belginkuyumculuk.com/magazin/)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*;q=0.5',
      }, 15000);
      if (rssResponse.status !== 200 || typeof rssResponse.data !== 'string') {
        return res.status(503).json({ ok: false, error: 'RSS_UNAVAILABLE', status: rssResponse.status });
      }

      const rssItem = rssItemForId(rssResponse.data, articleId);
      if (!rssItem || !safeArticleUrl(rssItem.link)) {
        return res.status(404).json({ ok: false, error: 'ARTICLE_NOT_IN_CURRENT_RSS' });
      }

      const fetched = await fetchArticleHtml(rssItem.link);
      const jsonLd = articleJsonLd(fetched.html);
      const rawTitle = extractH1(fetched.html) || String(jsonLd?.headline || '').trim() || rssItem.title;
      const rawDate = normalizePublished(jsonLd?.datePublished || '') || extractTime(fetched.html) || normalizePublished(rssItem.published);
      const rawParas = extractParagraphs(fetched.html);
      const heroImgUrl = extractImage(fetched.html, jsonLd);

      if (!rawTitle || rawParas.length < 3 || rawParas.join(' ').length < 600) {
        return res.status(422).json({
          ok: false,
          error: 'ARTICLE_EXTRACTION_TOO_THIN',
          transport: fetched.transport,
          statuses: fetched.statuses,
          paragraphCount: rawParas.length,
          bodyChars: rawParas.join(' ').length,
        });
      }

      return res.status(200).json({
        ok: true,
        schema: 'belgin-magazine-extract-v1',
        articleId,
        transport: fetched.transport,
        statuses: fetched.statuses,
        raw_title: rawTitle.slice(0, 500),
        raw_date: rawDate,
        raw_paras: rawParas,
        hero_img_url: heroImgUrl,
      });
    } catch (error) {
      console.error('[Magazine Fetch]', articleId, error.code || error.message);
      return res.status(502).json({
        ok: false,
        error: error.code || 'UPSTREAM_FETCH_FAILED',
        message: String(error.message || '').slice(0, 500),
      });
    }
  });
