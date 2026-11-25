#!/usr/bin/env python3
"""Dependency-free quality checks for the portfolio.

    python3 checks.py              # local checks (no network)
    python3 checks.py --online     # also verify sitemap URLs respond
    python3 checks.py --bump       # after changing a cached asset: bump CACHE_NAME,
                                   # update AGENTS.md, and record the new fingerprint

Everything here uses only the Python standard library.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
FINGERPRINT = ROOT / "content_cache" / "sw-fingerprint.json"
errors: list[str] = []
notes: list[str] = []


def fail(message: str) -> None:
    errors.append(message)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def check_jsonld() -> None:
    pages = [ROOT / "index.html", *sorted((ROOT / "posts").glob("*.html"))]
    for page in pages:
        text = read(page)
        blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', text, re.S)
        if not blocks:
            fail(f"{page.name}: no JSON-LD block")
        for block in blocks:
            try:
                data = json.loads(block)
            except json.JSONDecodeError as exc:
                fail(f"{page.name}: invalid JSON-LD ({exc})")
                continue
            types = data.get("@type") if isinstance(data, dict) else None
            if page.name == "index.html" and "ProfilePage" not in str(types):
                fail("index.html: expected ProfilePage JSON-LD")
            if page.name not in ("index.html", "template.html") and "BlogPosting" not in str(types):
                fail(f"{page.name}: expected BlogPosting JSON-LD")
            if page.name not in ("index.html", "template.html"):
                for key in ("headline", "datePublished", "dateModified", "author", "image", "mainEntityOfPage"):
                    if key not in data:
                        fail(f"{page.name}: BlogPosting is missing {key}")


def check_sitemap(online: bool) -> None:
    path = ROOT / "sitemap.xml"
    try:
        tree = ET.parse(path)
    except ET.ParseError as exc:
        fail(f"sitemap.xml: invalid XML ({exc})")
        return
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [n.text for n in tree.findall(".//s:loc", ns) if n.text]
    expected = {"https://shams.swe.bd/"} | {
        "https://shams.swe.bd/posts/" + p.name
        for p in (ROOT / "posts").glob("*.html") if p.name != "template.html"
    }
    if set(urls) != expected:
        fail(f"sitemap.xml: expected {sorted(expected)}, found {sorted(urls)}")
    for url in urls:
        node = next((u for u in tree.findall(".//s:url", ns) if u.findtext("s:loc", "", ns) == url), None)
        if node is None or not node.findtext("s:lastmod", "", ns):
            fail(f"sitemap.xml: {url} is missing lastmod")
    if online:
        for url in urls:
            try:
                with urllib.request.urlopen(urllib.request.Request(url, method="HEAD"), timeout=15) as res:
                    if res.status >= 400:
                        fail(f"sitemap.xml: {url} returned HTTP {res.status}")
            except Exception as exc:
                fail(f"sitemap.xml: {url} unreachable ({exc})")


def check_links() -> None:
    pages = [ROOT / "index.html", ROOT / "offline.html", *sorted((ROOT / "posts").glob("*.html"))]
    for page in pages:
        text = read(page)
        ids = set(re.findall(r'\bid="([^"]+)"', text))
        for href in re.findall(r'\bhref="([^"]+)"', text):
            if href.startswith("#"):
                if href[1:] and href[1:] not in ids:
                    fail(f"{page.name}: broken anchor {href}")
            elif href.startswith("/") and not href.startswith("//"):
                path_part, _, fragment = href.partition("#")
                target = ROOT / (path_part.lstrip("/") or "index.html")
                if not target.exists():
                    fail(f"{page.name}: missing local target {path_part or '/'}")
                elif fragment and target.suffix == ".html":
                    target_ids = set(re.findall(r'\bid="([^"]+)"', read(target)))
                    if fragment not in target_ids:
                        fail(f"{page.name}: {href} has no target id in {target.name}")


def sw_assets() -> list[str]:
    sw = read(ROOT / "sw.js")
    block = re.search(r"const ASSETS_TO_CACHE = \[(.*?)\];", sw, re.S)
    if not block:
        fail("sw.js: ASSETS_TO_CACHE not found")
        return []
    return re.findall(r"'([^']+)'", block.group(1))


def fingerprint(assets: list[str]) -> str:
    digest = hashlib.sha256()
    for asset in sorted(assets):
        parsed = urlparse(asset)
        if parsed.scheme or parsed.netloc or not (ROOT / asset.lstrip("/")).is_file():
            continue
        digest.update(asset.encode())
        digest.update((ROOT / asset.lstrip("/")).read_bytes())
    return digest.hexdigest()


def check_sw() -> None:
    assets = sw_assets()
    for asset in assets:
        if urlparse(asset).scheme or urlparse(asset).netloc:
            continue
        path = ROOT / (asset.lstrip("/") or "index.html")
        if not path.is_file():
            fail(f"sw.js: precached asset does not exist: {asset}")
    if "codeTrapStanding.jpg" in assets:
        fail("sw.js: codeTrapStanding.jpg must never be precached")
    current = fingerprint(assets)
    if FINGERPRINT.exists() and json.loads(FINGERPRINT.read_text()) != current:
        fail("cached assets changed: run `python3 checks.py --bump`")
    sw = read(ROOT / "sw.js")
    agents = read(ROOT / "AGENTS.md")
    sw_version = re.search(r"CACHE_NAME = 'portfolio-cache-v(\d+)'", sw)
    doc_version = re.search(r"portfolio-cache-v(\d+)`", agents)
    if not sw_version or not doc_version:
        fail("cache version missing from sw.js or AGENTS.md")
    elif sw_version.group(1) != doc_version.group(1):
        fail(f"cache version drift: sw.js v{sw_version.group(1)}, AGENTS.md v{doc_version.group(1)}")
    if "event.waitUntil" in sw and "skipWaiting" not in sw:
        fail("sw.js: skipWaiting is missing")
    if "networkFirst" not in sw or "offline.html" not in sw:
        fail("sw.js: network-first navigation or offline fallback is missing")


def check_profile_image() -> None:
    """All homepage image signals must point at the portrait, not the portfolio card."""
    expected = "https://shams.swe.bd/Shams.jpg"
    index = read(ROOT / "index.html")
    social = re.findall(
        r'<meta (?:property="og:image"|name="twitter:image") content="([^"]+)"', index
    )
    if social != [expected, expected]:
        fail(f"homepage og:image / twitter:image should both be {expected}, found {social}")
    ld_text = re.search(r'<script type="application/ld\+json">(.*?)</script>', index, re.S)
    if ld_text:
        try:
            ld = json.loads(ld_text.group(1))
            for label, value in (
                ("primaryImageOfPage", ld.get("primaryImageOfPage", {}).get("url")),
                ("Person.image", ld.get("mainEntity", {}).get("image", {}).get("url")),
            ):
                if value != expected:
                    fail(f"JSON-LD {label} should be {expected}, found {value}")
        except json.JSONDecodeError:
            pass  # already reported by check_jsonld()
    try:
        tree = ET.parse(ROOT / "sitemap.xml")
        ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9",
              "i": "http://www.google.com/schemas/sitemap-image/1.1"}
        first = tree.find(".//s:url", ns)
        loc = first.findtext("i:image/i:loc", "", ns) if first is not None else ""
        if loc != expected:
            fail(f"sitemap homepage image should be {expected}, found {loc}")
    except ET.ParseError:
        pass  # already reported by check_sitemap()


def check_design_invariants() -> None:
    css = read(ROOT / "style.css")
    if not re.search(r"body > header\s*\{[^}]*position:\s*sticky", css, re.S):
        fail("style.css: sticky rule must be scoped to body > header")
    if re.search(r"(?m)^header\s*\{", css):
        fail("style.css: bare `header` selector would overlap article headers")
    if "@media (prefers-reduced-motion: reduce)" not in css:
        fail("style.css: reduced-motion block missing")
    for page in [ROOT / "index.html", ROOT / "posts/template.html", ROOT / "posts/diu-codetrap-2025.html"]:
        if 'lang="en"' not in read(page):
            fail(f"{page.name}: missing lang=en")
    index = read(ROOT / "index.html")
    if "color-scheme\" content=\"only light" not in index:
        fail("index.html: light-only color scheme missing")
    if "fonts.googleapis.com" in index or "fonts.googleapis.com" in css:
        fail("external Google Fonts request still present")
    script = read(ROOT / "script.js")
    for stale in ("docs.google.com/spreadsheets", "SKILL_ICON_CDN", "cdn.jsdelivr.net", "loadSheet"):
        if stale in script:
            fail(f"script.js: external content dependency still present ({stale})")
    if "CONTENT:projects:start" in index or "CONTENT:skills:start" in index:
        fail("index.html: generated-block markers must be removed now content is hand-maintained")
    if "class=\"has-icon\"" not in index or "/icons/" not in index:
        fail("index.html: skill icons must be static, self-hosted SVGs")


def bump() -> None:
    assets = sw_assets()
    sw_path = ROOT / "sw.js"
    sw = read(sw_path)
    match = re.search(r"CACHE_NAME = 'portfolio-cache-v(\d+)'", sw)
    if not match:
        fail("cannot find CACHE_NAME in sw.js")
        return
    new = int(match.group(1)) + 1
    sw_path.write_text(
        sw[:match.start(1)] + str(new) + sw[match.end(1):], encoding="utf-8"
    )
    agents_path = ROOT / "AGENTS.md"
    agents = read(agents_path)
    agents_path.write_text(
        re.sub(r"portfolio-cache-v\d+", f"portfolio-cache-v{new}", agents), encoding="utf-8"
    )
    FINGERPRINT.parent.mkdir(exist_ok=True)
    FINGERPRINT.write_text(json.dumps(fingerprint(assets), indent=2) + "\n", encoding="utf-8")
    notes.append(f"Bumped cache to portfolio-cache-v{new} and recorded the asset fingerprint.")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--online", action="store_true", help="verify sitemap URLs over the network")
    ap.add_argument("--bump", action="store_true", help="bump the SW cache version and fingerprint after asset changes")
    args = ap.parse_args()

    if args.bump:
        bump()
    check_jsonld()
    check_sitemap(args.online)
    check_links()
    check_sw()
    check_profile_image()
    check_design_invariants()

    for note in notes:
        print("OK:", note)
    for error in errors:
        print("FAIL:", error, file=sys.stderr)
    if errors:
        print(f"{len(errors)} check(s) failed.", file=sys.stderr)
        return 1
    print("All checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
