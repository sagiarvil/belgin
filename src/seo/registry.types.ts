/**
 * UNIVERSAL OMNI-ENTERPRISE SEO, GEO, AEO, LLMO, AAO, RAG, E-E-A-T, RSS & MULTI-TIER LLMS ARCHITECTURE
 * Doküman Kodu: MANDATE-SEO-GEO-2026-V7
 * Tip Tanımları (src/seo/registry.types.ts)
 */

export type PageRole = 'home' | 'hub' | 'category' | 'product' | 'service' | 'tool' | 'article' | 'legal';
export type IndexDirective = 'index, follow' | 'noindex, follow' | 'noindex, nofollow';
export type FeedCategory = 'product' | 'service' | 'article' | 'news' | 'update';

export interface SemanticTriple {
  readonly subject: string;
  readonly predicate: string;
  readonly object: string;
}

export interface SeoEntityRef {
  readonly id: string;
  readonly name: string;
  readonly type: 'Organization' | 'Person' | 'Product' | 'Service' | 'SoftwareApplication';
  readonly sameAs: readonly string[];
}

export interface ImageAsset {
  readonly url: string;
  readonly alt: string;
  readonly caption?: string;
  readonly width: number;
  readonly height: number;
  readonly mimeType: 'image/webp' | 'image/avif' | 'image/jpeg' | 'image/png' | 'image/svg+xml';
}

export interface VideoAsset {
  readonly url: string;
  readonly thumbnailUrl: string;
  readonly title: string;
  readonly description: string;
  readonly duration: string; // ISO 8601 (örn: PT3M42S)
  readonly uploadDate: string;
  readonly transcriptUrl?: string;
}

export interface SeoPageRecord {
  readonly route: `/${string}` | '/';
  readonly locale: string;
  readonly role: PageRole;
  readonly indexDirective: IndexDirective;
  readonly canonicalRoute: `/${string}` | '/';
  readonly title: string;
  readonly metaDescription: string;
  readonly h1: string;
  readonly primaryIntent: string;
  readonly primaryEntity: SeoEntityRef;
  readonly semanticTriples: readonly SemanticTriple[];
  readonly heroAnswerEngine: string;
  readonly publishedAt: string;
  readonly modifiedAt: string;
  readonly llmSubGraphRoute?: `/llms/${string}.md`;
  readonly breadcrumbs: readonly { readonly name: string; readonly item: string }[];
  // v7.0 Eklentileri
  readonly feedCategory?: FeedCategory;
  readonly topicCluster?: `/${string}`;
  readonly pillarRoute?: `/${string}`;
  readonly hreflangGroup?: string;      // Tüm dil varyantlarını bağlayan grup ID
  readonly openGraphImage?: ImageAsset;
  readonly images?: readonly ImageAsset[];
  readonly video?: VideoAsset;
  readonly author?: SeoEntityRef;
  readonly reviewedBy?: SeoEntityRef;
  readonly reviewDate?: string;
  readonly aggregateRating?: { readonly value: number; readonly count: number; readonly best: number; readonly worst: number };
  readonly speakableSelectors?: readonly string[];
  readonly redirectFrom?: readonly `/${string}`[];
  readonly faqs?: readonly { readonly question: string; readonly answer: string }[];
}

export interface FeedConfig {
  readonly route: '/feed.xml' | '/atom.xml' | '/feed.json';
  readonly title: string;
  readonly description: string;
  readonly language: string;
  readonly hubUrl?: string;
  readonly selfUrl: string;
  readonly items: readonly FeedItem[];
}

export interface FeedItem {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly summary: string;
  readonly contentMarkdown: string;
  readonly publishedAt: string;
  readonly modifiedAt: string;
  readonly author: SeoEntityRef;
  readonly categories: readonly string[];
  readonly llmSubGraphUrl?: string;
}

export interface TopicCluster {
  readonly pillarRoute: `/${string}`;
  readonly clusterRoutes: readonly `/${string}`[];
  readonly primaryIntent: string;
  readonly semanticKeywords: readonly string[];
  readonly supportingEntities: readonly SeoEntityRef[];
}
