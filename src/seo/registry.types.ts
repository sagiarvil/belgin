export type PageRole = 'home' | 'hub' | 'category' | 'product' | 'service' | 'tool' | 'article' | 'guide' | 'legal';

export type IndexDirective = 'index, follow' | 'noindex, follow' | 'noindex, nofollow' | 'index';

export interface SemanticTriple {
  readonly subject: string;
  readonly predicate: string;
  readonly object: string;
}

export interface SeoEntityRef {
  readonly id: string;
  readonly name: string;
  readonly type: 'Organization' | 'Person' | 'Product' | 'Service' | 'SoftwareApplication' | 'JewelryStore' | 'LocalBusiness';
  readonly sameAs: readonly string[];
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
  readonly heroAnswerEngine: string; // 80-120 kelimelik sayısal, teknik ve bağlayıcı AEO yanıtı
  readonly publishedAt: string;
  readonly modifiedAt: string; // Gerçek son değişiklik tarihi (ISO 8601)
  readonly llmSubGraphRoute?: `/llms/pages/${string}.md`;
  readonly informationGainElements?: readonly string[];
  readonly richResultTypes?: readonly string[];
  readonly conversionGoal?: string;
  readonly priority?: string;
  readonly changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  readonly breadcrumbs?: readonly { readonly name: string; readonly item: string }[];
}
