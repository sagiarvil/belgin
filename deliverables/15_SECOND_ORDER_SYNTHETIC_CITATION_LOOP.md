# 15. İKİNCİ DERECE SENTETİK ATIF DÖNGÜSÜ (RETRIEVAL & CITATION DECOUPLING)
Perplexity Q2D-Web araştırması (Eylül 2026) doğrultusunda retrieval eligibility ile citation selection birbirinden ayrıştırılmıştır:
1. **Candidate Retrieval Aşaması (BM25 + Dense):**
   - Varlık ve fiyat verileri (İzmir Buca, Witschi kalibrasyon, 1.00x borsa akışı) candidate pool'a giriş için optimize edilir.
2. **Cross-Encoder Reranking & Hard-Negative Ayrımı:**
   - Benzer ancak tarih/ayar/fiyat açısından alakasız adaylar (hard-negatives) net biçimde elenir.
3. **Agent Citation Selection (High Precision):**
   - Citation verilmemesi belgenin alakasız olduğu anlamına gelmez (yüksek precision / düşük recall sinyali).
   - Kaynak üçlüleri: /llms/entities/methodologies.md, /legal-manifest.json ve RFC 3161 OpenTimestamps ile doğrulanır.
