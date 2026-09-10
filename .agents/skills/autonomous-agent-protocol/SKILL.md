---
name: autonomous-agent-protocol
description: >-
  Autonomous Agent Optimization (AAO-Pro), Agent-to-Agent (A2A) protocol, and Model Context Protocol (MCP) tool server integration. Governs /.well-known/agent-card.json and /mcp programmatic contracts.
---

# Autonomous Agent Protocol (AAO-Pro) & MCP Architecture
## Headless Commerce & Machine-to-Machine Transaction Surfaces

Bu yetenek; otonom satın alma ve analiz ajanlarının (Siri Agent, Claude Use, Google Project Astra, OpenAI Operator) web platformunu insan müdahalesi olmadan keşfetmesini, denetlemesini ve işlem yapmasını sağlar.

---

### 1. İmzalı A2A Ajan Kartı (`/.well-known/agent-card.json`)
Agent Protocol v1.0 spesifikasyonuna uygun, makine tarafından doğrulanabilir JSON kartı:
```json
{
  "@context": "https://agent-protocol.org/v1",
  "@type": "AgentCard",
  "name": "htmlandhtml AI Visibility Agent",
  "description": "Autonomous verification and deterministic remediation code delivery agent.",
  "url": "https://htmlandhtml.com",
  "version": "2.0.0",
  "capabilities": {
    "audit": {
      "endpoint": "https://htmlandhtml.com/api/scan",
      "method": "POST",
      "input": { "domain": "string" },
      "output": { "overallScore": "number", "vitals": "object" }
    },
    "purchase": {
      "endpoint": "https://htmlandhtml.com/api/delivery",
      "method": "POST",
      "price": { "currency": "USD", "amount": 99.00 }
    }
  }
}
```

---

### 2. Model Context Protocol (MCP) Uç Noktası (`/mcp`)
Ajanların doğrudan araç (tool) olarak çağırabileceği JSON-RPC arayüzü:
```typescript
export const onRequestPost: PagesFunction = async ({ request }) => {
  const body: any = await request.json();
  if (body.method === "tools/list") {
    return Response.json({
      tools: [
        {
          name: "audit_domain",
          description: "Run 18-engine deterministic audit for an enterprise domain",
          inputSchema: {
            type: "object",
            properties: { domain: { type: "string" } },
            required: ["domain"]
          }
        }
      ]
    });
  }
  return Response.json({ error: "Unsupported MCP method" }, { status: 400 });
};
```

