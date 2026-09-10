#!/usr/bin/env python3
"""Extract inline JavaScript from HTML and validate it with Node."""
from html.parser import HTMLParser
from pathlib import Path
import subprocess
import tempfile
import sys

ROOT = Path(__file__).resolve().parents[1]
failures = []

class Scripts(HTMLParser):
    def __init__(self):
        super().__init__()
        self.capture = False
        self.parts = []
        self.scripts = []
    def handle_starttag(self, tag, attrs):
        if tag != 'script':
            return
        data = dict(attrs)
        self.capture = not data.get('src') and data.get('type', 'text/javascript') not in ('application/ld+json', 'application/json')
        self.parts = []
    def handle_data(self, data):
        if self.capture:
            self.parts.append(data)
    def handle_endtag(self, tag):
        if tag == 'script' and self.capture:
            self.scripts.append(''.join(self.parts))
            self.capture = False

for page in ROOT.rglob('*.html'):
    if '.git' in page.parts:
        continue
    parser = Scripts()
    parser.feed(page.read_text(encoding='utf-8'))
    for index, script in enumerate(parser.scripts, 1):
        if not script.strip():
            continue
        with tempfile.NamedTemporaryFile('w', suffix='.js', encoding='utf-8') as tmp:
            tmp.write(script)
            tmp.flush()
            result = subprocess.run(['node', '--check', tmp.name], capture_output=True, text=True)
        if result.returncode:
            failures.append(f'{page.relative_to(ROOT)} inline script {index}: {result.stderr.strip()}')

if failures:
    print('\n'.join(f'ERROR: {item}' for item in failures))
    sys.exit(1)
print('Inline JavaScript syntax passed.')
