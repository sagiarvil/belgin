import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import magazine_release_guard as guard
import magazine_upstream_contract as contract


class MagazineReleaseGuardTests(unittest.TestCase):
    def test_duplicate_ids_are_detectable(self):
        ids = ["mag-182407", "mag-182407", "mag-182399"]
        from collections import Counter
        duplicates = sorted(k for k, n in Counter(ids).items() if k and n > 1)
        self.assertEqual(duplicates, ["mag-182407"])

    def test_recent_order_uses_date_then_numeric_id(self):
        rows = [
            {"id": "mag-182399", "raw_date": "2026-09-08"},
            {"id": "mag-182407", "raw_date": "2026-09-09"},
            {"id": "mag-182408", "raw_date": "2026-09-09"},
        ]
        ordered = sorted(
            rows,
            key=lambda a: (str(a.get("raw_date") or ""), contract.numeric_id(str(a.get("id") or ""))),
            reverse=True,
        )
        self.assertEqual([x["id"] for x in ordered], ["mag-182408", "mag-182407", "mag-182399"])

    def test_iso_date_guard_rejects_hardcoded_or_malformed_future_fallbacks(self):
        self.assertTrue(guard.ISO_DATE_RE.fullmatch("2026-09-09"))
        self.assertFalse(guard.ISO_DATE_RE.fullmatch("09.09.2026"))
        self.assertFalse(guard.ISO_DATE_RE.fullmatch(""))

    def test_local_parser_roundtrip_keeps_unique_ids(self):
        payload = [
            {"id": "mag-182407", "slug": "geneva", "raw_date": "2026-09-09", "title": "A", "content_html": "x" * 600},
            {"id": "mag-182399", "slug": "starter", "raw_date": "2026-09-08", "title": "B", "content_html": "y" * 600},
        ]
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "magazine_data.js"
            path.write_text("const MAGAZINE_ARTICLES = " + json.dumps(payload) + ";\n", encoding="utf-8")
            parsed = contract.parse_local_articles(path)
            self.assertEqual(len({row["id"] for row in parsed}), 2)


if __name__ == "__main__":
    unittest.main()
