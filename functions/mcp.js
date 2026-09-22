/**
 * BELGIN KUYUMCULUK — PUBLIC MCP JSON-RPC 2.0 ENDPOINT
 * Read-only discovery surface. Dynamic facts are returned only from repository-owned data.
 */
"use strict";

const PRODUCT_CATALOG = require("./product-catalog.json");

const BASE_URL = "https://www.belginkuyumculuk.com";
const MAX_RESULTS = 20;

const TOOLS = [
  {
    name: "query_belgin_catalog",
    description: "Search the current Belgin public product catalog by brand, model, reference or category.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 1, maxLength: 120 },
        category: { type: "string", maxLength: 40 },
        limit: { type: "integer", minimum: 1, maximum: MAX_RESULTS, default: 10 }
      },
      required: ["query"],
      additionalProperties: false
    }
  },
  {
    name: "get_belgin_public_profile",
    description: "Return canonical public identity and discovery URLs for Belgin Kuyumculuk.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "get_belgin_public_resources",
    description: "Return canonical public resources for prices, policies, sitemap and machine-readable discovery.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  }
];

function textResult(value) {
  return { content: [{ type: "text", text: JSON.stringify(value) }] };
}

function normalizedCatalog() {
  return Object.values(PRODUCT_CATALOG || {}).filter(item => item && typeof item === "object");
}

function catalogUrl(item) {
  const brand = encodeURIComponent(String(item.brand || "").trim());
  const q = encodeURIComponent(String(item.name || item.id || "").trim());
  return `${BASE_URL}/saatler/?brand=${brand}&q=${q}`;
}

async function handleMcpRequest(requestBody) {
  let body;
  try {
    body = typeof requestBody === "string" ? JSON.parse(requestBody) : (requestBody || {});
  } catch {
    return { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } };
  }

  const id = body.id ?? null;

  if (body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    return { jsonrpc: "2.0", id, error: { code: -32600, message: "Invalid Request" } };
  }

  if (body.method === "tools/list") {
    return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
  }

  if (body.method !== "tools/call") {
    return { jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } };
  }

  const toolName = String(body.params?.name || "");
  const args = body.params?.arguments || {};

  if (toolName === "query_belgin_catalog") {
    const query = String(args.query || "").trim().toLocaleLowerCase("tr-TR");
    if (!query || query.length > 120) {
      return { jsonrpc: "2.0", id, error: { code: -32602, message: "query must be 1-120 characters" } };
    }
    const category = String(args.category || "").trim().toLocaleLowerCase("tr-TR");
    const limit = Math.max(1, Math.min(Number.parseInt(args.limit, 10) || 10, MAX_RESULTS));

    const matches = normalizedCatalog()
      .filter(item => {
        const haystack = [item.id, item.brand, item.name, item.reference, item.category, item.metal]
          .filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");
        const categoryOk = !category || String(item.category || "").toLocaleLowerCase("tr-TR").includes(category);
        return categoryOk && haystack.includes(query);
      })
      .slice(0, limit)
      .map(item => ({
        id: String(item.id || ""),
        brand: String(item.brand || ""),
        name: String(item.name || ""),
        category: String(item.category || ""),
        inStock: item.inStock !== false,
        priceTry: Number.isFinite(Number(item.price)) ? Number(item.price) : null,
        url: catalogUrl(item)
      }));

    return { jsonrpc: "2.0", id, result: textResult({ count: matches.length, results: matches }) };
  }

  if (toolName === "get_belgin_public_profile") {
    return {
      jsonrpc: "2.0",
      id,
      result: textResult({
        name: "BELGİN KUYUMCULUK - SEMİH SONBAHAR",
        tradeName: "Belgin Kuyumculuk & Saat",
        foundedYear: 1999,
        canonicalUrl: `${BASE_URL}/`,
        about: `${BASE_URL}/biz-kimiz/`,
        contact: `${BASE_URL}/iletisim.html`,
        address: "Menderes Caddesi No:231/B, Buca, İzmir, Türkiye"
      })
    };
  }

  if (toolName === "get_belgin_public_resources") {
    return {
      jsonrpc: "2.0",
      id,
      result: textResult({
        sitemap: `${BASE_URL}/sitemap.xml`,
        llms: `${BASE_URL}/llms.txt`,
        llmsFull: `${BASE_URL}/llms-full.txt`,
        agentCard: `${BASE_URL}/.well-known/agent-card.json`,
        livePrices: `${BASE_URL}/canli-fiyatlar/`,
        privacy: `${BASE_URL}/gizlilik-politikasi.html`,
        kvkk: `${BASE_URL}/kvkk.html`
      })
    };
  }

  return { jsonrpc: "2.0", id, error: { code: -32601, message: "Tool not found" } };
}

module.exports = { handleMcpRequest, TOOLS };
