import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import magazine_upstream_contract as contract
import repair_magazine_expected_articles as repair


class MagazineUpstreamContractTests(unittest.TestCase):
    def test_extracts_current_chrono24_article_shape(self):
        html = '''
        <html><body>
          <a href="/magazine/the-top-10-luxury-watches-for-newcomers-under-10000-p_182399/">Latest</a>
          <a href="/magazine/category/watch-guide/">Category</a>
        </body></html>
        '''
        urls = contract.extract_article_urls(html)
        self.assertEqual(len(urls), 1)
        self.assertEqual(contract.article_id_from_url(urls[0]), "mag-182399")

    def test_new_id_is_newer_than_previous_local_id(self):
        self.assertGreater(contract.numeric_id("mag-182399"), contract.numeric_id("mag-182342"))

    def test_blocked_policy_matches_known_exclusions_only(self):
        self.assertTrue(contract.is_blocked_candidate({
            "id": "mag-180505",
            "url": "https://www.chrono24.com/magazine/rolex-report-p_180505/",
            "headline": "Rolex Report 2026",
        }))
        self.assertFalse(contract.is_blocked_candidate({
            "id": "mag-182399",
            "url": "https://www.chrono24.com/magazine/the-top-10-luxury-watches-for-newcomers-under-10000-p_182399/",
            "headline": "The Top 10 Luxury Watches for Newcomers Under $10,000",
        }))

    def test_local_article_payload_parser_is_fail_closed_and_valid(self):
        payload = [{"id": "mag-182342", "slug": "concept-watch", "raw_date": "2026-09-07"}]
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "magazine_data.js"
            path.write_text("const MAGAZINE_ARTICLES = " + json.dumps(payload) + ";\n", encoding="utf-8")
            parsed = contract.parse_local_articles(path)
            self.assertEqual(parsed[0]["id"], "mag-182342")

    def test_rss_editorial_fallback_is_original_turkish_and_substantial(self):
        meta = {
            "id": "mag-182399",
            "headline": "The Top 10 Luxury Watches for Newcomers Under $10,000",
            "published": "2026-09-08",
            "description_html": (
                "<p>With a budget between $4,000 and $10,000, the selection of luxury watches "
                "gets broader and offers newcomers more choice across established brands and complications.</p>"
            ),
            "image_url": "https://static.chrono24.com/example.jpg",
        }
        payload = repair.build_rss_editorial_payload(meta)
        self.assertEqual(payload["ingest_mode"], "rss_editorial")
        self.assertEqual(payload["raw_date"], "2026-09-08")
        self.assertIn("10.000 Dolar", payload["raw_title"])
        self.assertGreaterEqual(len(payload["raw_paras"]), 4)
        self.assertGreater(len(" ".join(payload["raw_paras"])), 1000)
        self.assertNotIn("Chrono24", " ".join(payload["raw_paras"]))

    def test_rss_editorial_fallback_rejects_thin_evidence(self):
        meta = {
            "id": "mag-182407",
            "headline": "My Top 10 Novelties From Geneva Watch Days 2026",
            "published": "2026-09-09",
            "description_html": "<p>Too short.</p>",
        }
        with self.assertRaises(RuntimeError):
            repair.build_rss_editorial_payload(meta)


if __name__ == "__main__":
    unittest.main()
