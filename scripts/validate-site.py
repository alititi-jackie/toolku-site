#!/usr/bin/env python3
"""Lightweight static-site validation with no third-party dependencies."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

class PageParser(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.links = []
        self.scripts = []
        self.ids = set()
        self.duplicate_ids = set()
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            if a['id'] in self.ids:
                self.duplicate_ids.add(a['id'])
            self.ids.add(a['id'])
        if tag == 'a' and a.get('href'):
            self.links.append(a['href'])
        if tag == 'script' and a.get('src'):
            self.scripts.append(a['src'])

def local_path(value):
    parsed = urlparse(value)
    if parsed.scheme in ('http', 'https'):
        if parsed.netloc not in ('toolku.com', 'www.toolku.com'):
            return None
        value = parsed.path or '/'
    elif parsed.scheme or value.startswith('//'):
        return None
    value = value.split('#', 1)[0].split('?', 1)[0]
    if not value:
        return None
    if value.startswith('/'):
        path = ROOT / value.lstrip('/')
    else:
        path = None
    return path

def resolve_relative(value, source):
    if value.startswith('/'):
        return ROOT / value.lstrip('/')
    return (source.parent / value).resolve()

def check_target(source, value):
    if value.startswith(('#', 'mailto:', 'tel:', 'javascript:')) or value.startswith('//'):
        return
    parsed = urlparse(value)
    if parsed.scheme in ('http', 'https') and parsed.netloc not in ('toolku.com', 'www.toolku.com'):
        return
    target = local_path(value)
    if target is None:
        target = resolve_relative(value, source)
    if target.is_dir():
        target = target / 'index.html'
    if not target.exists():
        errors.append(f'{source.relative_to(ROOT)}: broken local link/resource -> {value}')

for html in ROOT.rglob('*.html'):
    if any(part in {'.git', 'node_modules'} for part in html.parts):
        continue
    parser = PageParser(html)
    try:
        parser.feed(html.read_text(encoding='utf-8'))
    except Exception as exc:
        errors.append(f'{html.relative_to(ROOT)}: HTML parse error: {exc}')
        continue
    for href in parser.links:
        check_target(html, href)
    for src in parser.scripts:
        check_target(html, src)
    for dup in sorted(parser.duplicate_ids):
        errors.append(f'{html.relative_to(ROOT)}: duplicate id="{dup}"')

sitemap = ROOT / 'sitemap.xml'
if sitemap.exists():
    text = sitemap.read_text(encoding='utf-8')
    for loc in re.findall(r'<loc>(.*?)</loc>', text):
        check_target(sitemap, loc)
    if re.search(r'<lastmod>\d{4}-\d{2}-\d{2}</lastmod>', text):
        # lastmod is intentionally allowed, but future dates are rejected.
        from datetime import date
        for value in re.findall(r'<lastmod>(\d{4}-\d{2}-\d{2})</lastmod>', text):
            if value > date.today().isoformat():
                errors.append(f'sitemap.xml: future lastmod date {value}')

if errors:
    print('\n'.join(f'ERROR: {x}' for x in errors))
    print(f'\nValidation failed with {len(errors)} error(s).')
    sys.exit(1)

print('Static site validation passed: local links/resources and duplicate IDs checked.')
