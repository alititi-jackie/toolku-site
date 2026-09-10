#!/usr/bin/env python3
"""Dependency-free static-site validation for ToolKu."""
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
        self.resources = []
        self.ids = set()
        self.duplicate_ids = set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a and a['id']:
            if a['id'] in self.ids:
                self.duplicate_ids.add(a['id'])
            self.ids.add(a['id'])

        # Validate navigation, CSS and JavaScript resources. Images and media
        # are intentionally excluded here because many pages use external/CDN
        # assets and data/blob URLs; production smoke tests cover page delivery.
        resource_attrs = {'a': 'href', 'link': 'href', 'script': 'src'}
        attr = resource_attrs.get(tag)
        if attr and a.get(attr):
            self.resources.append((tag, a[attr]))


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
    return ROOT / value.lstrip('/') if value.startswith('/') else None


def resolve_relative(value, source):
    if value.startswith('/'):
        return ROOT / value.lstrip('/')
    return (source.parent / value).resolve()


def check_target(source, value):
    lower = value.strip().lower()
    if lower.startswith(('#', 'mailto:', 'tel:', 'javascript:', 'data:', 'blob:', 'about:')) or lower.startswith('//'):
        return
    parsed = urlparse(value)
    if parsed.scheme in ('http', 'https') and parsed.netloc not in ('toolku.com', 'www.toolku.com'):
        return
    if parsed.scheme and parsed.scheme not in ('http', 'https'):
        return
    target = local_path(value)
    if target is None:
        target = resolve_relative(value, source)
    if target.is_dir():
        target = target / 'index.html'
    if not target.exists():
        errors.append(f'{source.relative_to(ROOT)}: broken local resource -> {value}')


for html in ROOT.rglob('*.html'):
    if any(part in {'.git', 'node_modules'} for part in html.parts):
        continue
    parser = PageParser(html)
    try:
        parser.feed(html.read_text(encoding='utf-8'))
    except Exception as exc:
        errors.append(f'{html.relative_to(ROOT)}: HTML parse error: {exc}')
        continue
    for _, value in parser.resources:
        check_target(html, value)
    for dup in sorted(parser.duplicate_ids):
        errors.append(f'{html.relative_to(ROOT)}: duplicate id="{dup}"')

sitemap = ROOT / 'sitemap.xml'
if sitemap.exists():
    text = sitemap.read_text(encoding='utf-8')
    for loc in re.findall(r'<loc>(.*?)</loc>', text):
        check_target(sitemap, loc)
    from datetime import date
    for value in re.findall(r'<lastmod>(\d{4}-\d{2}-\d{2})</lastmod>', text):
        if value > date.today().isoformat():
            errors.append(f'sitemap.xml: future lastmod date {value}')

robots = ROOT / 'robots.txt'
if robots.exists():
    robots_text = robots.read_text(encoding='utf-8')
    if 'Sitemap: https://toolku.com/sitemap.xml' not in robots_text:
        errors.append('robots.txt: canonical sitemap declaration is missing')

if errors:
    print('\n'.join(f'ERROR: {x}' for x in errors))
    print(f'\nValidation failed with {len(errors)} error(s).')
    sys.exit(1)

print('Static site validation passed: HTML resources, local links, duplicate IDs, sitemap and robots.txt checked.')
