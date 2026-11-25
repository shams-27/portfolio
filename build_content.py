#!/usr/bin/env python3
"""Generate static HTML fallbacks for the Google Sheets-backed sections.

The live site still refreshes projects and skills from the sheets in script.js,
but the generated markup means both sections are complete without JavaScript,
for crawlers that don't execute fetches, and when the sheets are unreachable.

Usage:
    python3 build_content.py           # fetch the sheets, save a local cache, update index.html
    python3 build_content.py --offline # rebuild from content_cache/*.csv
    python3 build_content.py --check   # verify index.html is up to date, write nothing
"""

from __future__ import annotations

import argparse
import csv
import html
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
INDEX = ROOT / "index.html"
CACHE_DIR = ROOT / "content_cache"

# Keep these URLs in sync with SHEETS in script.js (checks.py verifies this).
SHEETS = {
    "projects": (
        "https://docs.google.com/spreadsheets/d/e/"
        "2PACX-1vRXXuVB514-q76YWrnec50cXnoXEU24bUA6PvUFhc7UltmmnEWVFdWD3_GiwPnYXTp8EiRnTktvKeGb"
        "/pub?gid=0&single=true&output=csv"
    ),
    "skills": (
        "https://docs.google.com/spreadsheets/d/e/"
        "2PACX-1vRXXuVB514-q76YWrnec50cXnoXEU24bUA6PvUFhc7UltmmnEWVFdWD3_GiwPnYXTp8EiRnTktvKeGb"
        "/pub?gid=1426459479&single=true&output=csv"
    ),
}

MARKERS = {
    "projects": ("<!-- CONTENT:projects:start -->", "<!-- CONTENT:projects:end -->"),
    "skills": ("<!-- CONTENT:skills:start -->", "<!-- CONTENT:skills:end -->"),
}

HIDDEN_VALUES = {"false", "no", "0", "hidden"}


def visible(value: str) -> bool:
    return (value or "").strip().lower() not in HIDDEN_VALUES


def safe_url(value: str) -> str:
    """Mirror script.js safeUrl(): only http(s), add https:// when no scheme."""
    value = (value or "").strip()
    if not value:
        return ""
    if not re.match(r"^https?://", value, re.I):
        value = "https://" + value
    parsed = urllib.parse.urlparse(value)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return ""
    return html.escape(value, quote=True)


def e(value: str) -> str:
    return html.escape((value or "").strip(), quote=True)


def load_csv(name: str, offline: bool) -> list[dict[str, str]]:
    cache_file = CACHE_DIR / f"{name}.csv"
    if offline:
        text = cache_file.read_text(encoding="utf-8-sig")
    else:
        with urllib.request.urlopen(SHEETS[name], timeout=20) as response:
            text = response.read().decode("utf-8-sig")
        CACHE_DIR.mkdir(exist_ok=True)
        cache_file.write_text(text, encoding="utf-8")
    return [ {k.strip(): (v or "").strip() for k, v in row.items() if k}
             for row in csv.DictReader(io_string(text)) ]


def io_string(text: str):
    import io
    return io.StringIO(text)


def project_html(rows: list[dict[str, str]]) -> str:
    items = [r for r in rows if r.get("name") and visible(r.get("visible", ""))]

    def rank(r: dict[str, str]):
        try:
            return float(r.get("order", ""))
        except ValueError:
            return float("inf")

    has_order = any(r.get("order") and rank(r) != float("inf") for r in items)
    if has_order:
        items.sort(key=lambda r: r["name"].casefold())
        items.sort(key=rank)
    else:
        items.sort(key=lambda r: r["name"].casefold())

    cards = []
    for i, p in enumerate(items, 1):
        parts = [
            '<article class="project">',
            '  <div class="project-head">',
            f'    <span class="project-index">{i:02d}</span>',
            f'    <h3>{e(p["name"])}</h3>',
            "  </div>",
            '  <div class="project-info">',
        ]
        if p.get("description"):
            parts.append(f'    <p class="project-desc">{e(p["description"])}</p>')
        if p.get("stack"):
            chips = [c.strip() for c in re.split(r"[,;|\u00b7\u2022]+", p["stack"]) if c.strip()]
            if chips:
                parts.append('    <ul class="stack">')
                parts.extend(f"      <li>{e(c)}</li>" for c in chips)
                parts.append("    </ul>")
        links = []
        for label, key in (("Live demo", "live_url"), ("View on GitHub", "github_url")):
            href = safe_url(p.get(key, ""))
            if href:
                links.append(f'      <a href="{href}" target="_blank" rel="noopener">{label}</a>')
        if links:
            parts.append('    <div class="project-links">')
            parts.extend(links)
            parts.append("    </div>")
        parts.extend(["  </div>", "</article>"])
        cards.append("\n".join(parts))
    return "\n".join(cards)


def skills_html(rows: list[dict[str, str]]) -> str:
    groups: dict[str, list[dict[str, str]]] = {}
    for r in rows:
        if r.get("category") and r.get("skill") and visible(r.get("visible", "")):
            groups.setdefault(r["category"], []).append(r)

    blocks = []
    for category, skills in groups.items():
        lines = [
            '<div class="skill-row">',
            f'  <dt class="wrap">{e(category)}</dt>',
            "  <dd>",
            '    <div class="track">',
            '      <ul class="group">',
        ]
        for s in skills:
            name = e(s["skill"])
            full = e(s.get("full_name", ""))
            line = f'        <li><abbr title="{full}">{name}</abbr></li>' if full else f"        <li>{name}</li>"
            lines.append(line)
        lines.extend(["      </ul>", "    </div>", "  </dd>", "</div>"])
        blocks.append("\n".join(lines))
    return "\n".join(blocks)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--offline", action="store_true", help="rebuild from content_cache/*.csv")
    ap.add_argument("--check", action="store_true", help="verify index.html is current, write nothing")
    args = ap.parse_args()

    source = "local cache" if args.offline else "Google Sheets"
    index = INDEX.read_text(encoding="utf-8")
    updated = index
    for name, render_fn in (("projects", project_html), ("skills", skills_html)):
        rows = load_csv(name, args.offline)
        start, end = MARKERS[name]
        pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.S)
        match = pattern.search(index)
        if not match:
            print(f"ERROR: markers for {name} not found in index.html", file=sys.stderr)
            return 1
        # Match the indentation of the markers so the generated block reads naturally.
        indent = re.search(r"^(\s*)" + re.escape(start), index, re.M).group(1)
        body = render_fn(rows)
        lines = ["<!-- Generated by build_content.py; do not edit by hand. -->", *body.splitlines()]
        block = start + "\n" + "\n".join(indent + line for line in lines) + "\n" + indent + end
        updated = pattern.sub(lambda _: block, updated)

    if updated == index:
        print("index.html is already up to date.")
        return 0
    if args.check:
        print(f"ERROR: index.html is out of date with {source}. Run: python3 build_content.py", file=sys.stderr)
        return 1
    INDEX.write_text(updated, encoding="utf-8")
    print(f"Updated index.html from {source}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
