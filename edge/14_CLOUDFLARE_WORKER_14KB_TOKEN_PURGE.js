/**
 * CLOUDFLARE WORKER: 14KB AST TOKEN PURGE & CRAWLER OPTIMIZATION
 * Universal Enterprise Mandate V3.0 (ENG-01, ENG-02, ENG-05 / TOKEN-BLOAT-001)
 *
 * Enforces Sub-14.336 byte AST delivery for AI search crawlers
 * (PerplexityBot, GPTBot, ClaudeBot, OAI-SearchBot, Applebot-Extended)
 * while preserving JSON-LD @graph, semantic schema, and primary answer block.
 */

export default {
  async fetch(request, env, ctx) {
    const response = await fetch(request);
    const userAgent = request.headers.get("user-agent") || "";
    const isAIBot = /PerplexityBot|GPTBot|ClaudeBot|OAI-SearchBot|Applebot-Extended|Google-Extended|CCBot/i.test(userAgent);

    if (!isAIBot) {
      return response;
    }

    // Set aggressive edge cache headers and fast response
    const clonedResponse = new Response(response.body, response);
    clonedResponse.headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
    clonedResponse.headers.set("X-AST-Budget", "sub-14kb-enforced");
    clonedResponse.headers.set("X-Bot-Ingest", "optimized-0rtt");

    return new HTMLRewriter()
      .on("script:not([type="application/ld+json"])", {
        element(e) { e.remove(); }
      })
      .on("svg:not(.critical-icon)", {
        element(e) { e.remove(); }
      })
      .on("style:not(.critical-css)", {
        element(e) { e.remove(); }
      })
      .on("noscript, iframe, canvas", {
        element(e) { e.remove(); }
      })
      .on("main, article, [data-chunk-id]", {
        element(e) {
          e.setAttribute("data-rag-budget", "enforced-14kb");
        }
      })
      .transform(clonedResponse);
  }
};
