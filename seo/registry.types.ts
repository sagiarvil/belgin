export type PageRole = 'home' | 'hub' | 'category' | 'product' | 'service' | 'tool' | 'article' | 'guide' | 'legal';

export type IndexDirective = 'index, follow' | 'noindex, follow' | 'noindex, nofollow' | 'index';

export interface SemanticTriple {
  readonly subject: string;
  readonly predicate: string;
  readonly object: string;
}

export interface UniversalEntityRef {
  readonly id: string;
  readonly name: string;
  readonly type: 'Organization' | 'Person' | 'Product' | 'Service' | 'SoftwareApplication' | 'JewelryStore' | 'LocalBusiness';
  readonly wikidataQid?: `Q${number}` | string;
  readonly googleMid?: string;
  readonly sameAs: readonly string[];
}

export interface UniversalPageRecord {
  readonly route: `/${string}` | '/';
  readonly locale: string;
  readonly role: PageRole;
  readonly indexDirective: IndexDirective;
  readonly canonicalRoute: `/${string}` | '/';
  readonly title: string;
  readonly metaDescription: string;
  readonly h1: string;
  readonly primaryIntent: string;
  readonly primaryEntity: UniversalEntityRef;
  readonly semanticTriples: readonly SemanticTriple[];
  readonly heroAnswerEngine: string; // 29-80 kelime, ilk 100px
  readonly publishedAt: string;      // ISO 8601
  readonly modifiedAt: string;       // GERÇEK güncelleme — Asla sahte tarih yok (%15 Delta şartı)
  readonly llmSubGraphRoute?: `/llms/${string}.md` | `/llms/pages/${string}.md`;
  readonly breadcrumbs?: readonly { readonly name: string; readonly item: string }[];
}

export type SeoEntityRef = UniversalEntityRef;
export type SeoPageRecord = UniversalPageRecord;

