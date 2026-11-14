#!/usr/bin/env python3
"""Записва в docs/updated.json датата на последния commit за всяка папка в docs/.

Пуска се ръчно след промяна в проект: python3 tools/update-dates.py
Началната страница ДЧ показва тези дати като „Обновено: …“.
"""
import json
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOCS = ROOT / 'docs'
OUT = DOCS / 'updated.json'

dates = {}
for d in sorted(p for p in DOCS.iterdir() if p.is_dir() and not p.name.startswith('.')):
    out = subprocess.run(
        ['git', 'log', '-1', '--format=%cs', '--', str(d.relative_to(ROOT))],
        cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip()
    if out:
        dates[d.name] = out

OUT.write_text(json.dumps(dates, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(OUT.relative_to(ROOT), len(dates), 'папки')
