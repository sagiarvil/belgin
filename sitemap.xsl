<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="tr">
      <head>
        <title>XML Sitemap | Belgin Kuyumculuk &amp; Mücevherat</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          :root {
            --bg: #0d0f12;
            --card-bg: #15181e;
            --border: #262b35;
            --text: #f8fafc;
            --text-sub: #94a3b8;
            --gold: #d4af37;
            --gold-light: #f3e5ab;
            --badge-bg: rgba(212, 175, 55, 0.1);
            --badge-border: rgba(212, 175, 55, 0.25);
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: var(--bg);
            color: var(--text);
            padding: 2.5rem 1.5rem;
            font-size: 13px;
            line-height: 1.5;
          }
          .container { max-width: 1200px; margin: 0 auto; }
          .header { margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
          .brand { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
          .header h1 { font-size: 1.8rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.5rem; color: #ffffff; }
          .header p { color: var(--text-sub); font-size: 0.9rem; }
          .stats-bar { display: flex; gap: 0.75rem; margin-top: 1.25rem; flex-wrap: wrap; }
          .stat-pill { display: inline-flex; align-items: center; padding: 0.35rem 0.85rem; background: var(--badge-bg); border: 1px solid var(--badge-border); border-radius: 9999px; color: var(--gold); font-weight: 600; font-size: 0.75rem; }
          .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          th { background: #1a1e26; padding: 0.85rem 1rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--gold-light); border-bottom: 1px solid var(--border); }
          td { padding: 0.85rem 1rem; border-bottom: 1px solid var(--border); vertical-align: middle; word-break: break-all; }
          tr:last-child td { border-bottom: none; }
          tr:hover td { background: rgba(212, 175, 55, 0.03); }
          a { color: var(--gold); text-decoration: none; transition: color 0.15s; }
          a:hover { color: var(--gold-light); text-decoration: underline; }
          .thumb-box { width: 44px; height: 44px; border-radius: 6px; overflow: hidden; background: #000; border: 1px solid var(--border); display: inline-flex; align-items: center; justify-content: center; }
          .thumb-box img { max-width: 100%; max-height: 100%; object-fit: cover; }
          .footer { margin-top: 2.5rem; text-align: center; color: var(--text-sub); font-size: 0.8rem; border-top: 1px solid var(--border); padding-top: 1.5rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">💎 BELGİN KUYUMCULUK &amp; MÜCEVHERAT</div>
            <xsl:choose>
              <xsl:when test="sitemap:sitemapindex">
                <h1>Lüks Koleksiyon XML Site Haritası Dizini</h1>
                <p>Googlebot, Bing ve AI arama motorları için alt katalogları gruplayan ana indeks mimarisi.</p>
                <div class="stats-bar">
                  <span class="stat-pill">Alt Harita Sayısı: <xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)"/></span>
                  <span class="stat-pill">Standart: Sitemaps.org 0.9 Index</span>
                  <span class="stat-pill">Protokol: Güvenli HTTPS &amp; 200 OK</span>
                </div>
              </xsl:when>
              <xsl:when test="//image:image">
                <h1>Mücevherat &amp; Ürün XML Site Haritası</h1>
                <p>Google Görseller ve multimodal AI arama motorları için optimize edilmiş lüks takı ve saat kataloğu.</p>
                <div class="stats-bar">
                  <span class="stat-pill">Toplam Öğe: <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></span>
                  <span class="stat-pill">Görsel İndeksi: Google Image 1.1</span>
                </div>
              </xsl:when>
              <xsl:otherwise>
                <h1>XML Site Haritası (URL Listesi)</h1>
                <p>Arama motorları ve AI tarayıcılar için doğrulanmış kanonik sayfalar.</p>
                <div class="stats-bar">
                  <span class="stat-pill">Toplam Sayfa: <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></span>
                  <span class="stat-pill">Protokol: Sitemaps.org 0.9</span>
                </div>
              </xsl:otherwise>
            </xsl:choose>
          </div>

          <div class="card">
            <table>
              <xsl:choose>
                <!-- 1. Sitemap Index -->
                <xsl:when test="sitemap:sitemapindex">
                  <thead>
                    <tr>
                      <th style="width: 65%;">Alt Site Haritası URL</th>
                      <th style="width: 35%;">Son Güncelleme Tarihi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                      <tr>
                        <td>
                          <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                        </td>
                        <td style="color: var(--text-sub); font-family: monospace;"><xsl:value-of select="sitemap:lastmod"/></td>
                      </tr>
                    </xsl:for-each>
                  </tbody>
                </xsl:when>

                <!-- 2. Ürün & Görsel Tablosu -->
                <xsl:when test="//image:image">
                  <thead>
                    <tr>
                      <th style="width: 8%; text-align: center;">Görsel</th>
                      <th style="width: 52%;">Ürün Başlığı &amp; Sayfa URL</th>
                      <th style="width: 25%;">Görsel Kaynak Adresi</th>
                      <th style="width: 15%;">Güncelleme</th>
                    </tr>
                  </thead>
                  <tbody>
                    <xsl:for-each select="sitemap:urlset/sitemap:url">
                      <tr>
                        <td style="text-align: center;">
                          <xsl:if test="image:image/image:loc">
                            <div class="thumb-box">
                              <img src="{image:image/image:loc}" alt="{image:image/image:title}" loading="lazy"/>
                            </div>
                          </xsl:if>
                        </td>
                        <td>
                          <div style="font-weight: 600; margin-bottom: 0.25rem; color: #ffffff;">
                            <xsl:value-of select="image:image/image:title"/>
                          </div>
                          <a href="{sitemap:loc}" style="font-size: 0.8rem;"><xsl:value-of select="sitemap:loc"/></a>
                        </td>
                        <td style="font-size: 0.75rem; color: var(--text-sub);">
                          <xsl:value-of select="image:image/image:loc"/>
                        </td>
                        <td style="color: var(--text-sub); font-family: monospace; font-size: 0.8rem;">
                          <xsl:value-of select="sitemap:lastmod"/>
                        </td>
                      </tr>
                    </xsl:for-each>
                  </tbody>
                </xsl:when>

                <!-- 3. Standart Sayfalar -->
                <xsl:otherwise>
                  <thead>
                    <tr>
                      <th style="width: 75%;">Kanonik Sayfa URL</th>
                      <th style="width: 25%;">Son Güncelleme</th>
                    </tr>
                  </thead>
                  <tbody>
                    <xsl:for-each select="sitemap:urlset/sitemap:url">
                      <tr>
                        <td>
                          <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                        </td>
                        <td style="color: var(--text-sub); font-family: monospace;"><xsl:value-of select="sitemap:lastmod"/></td>
                      </tr>
                    </xsl:for-each>
                  </tbody>
                </xsl:otherwise>
              </xsl:choose>
            </table>
          </div>

          <div class="footer">
            <p>© 2026 Belgin Kuyumculuk &amp; Mücevherat. Tüm Hakları Saklıdır.</p>
            <p style="margin-top: 0.25rem; font-size: 0.75rem;">AI Arama Görünürlüğü, Otomatik Varlık ve Keşif Ağı Altyapısı</p>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
