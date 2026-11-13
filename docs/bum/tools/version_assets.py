#!/usr/bin/env python3
"""Добавя ?v=<версия> към локалните css/, js/ и data/ файлове във всички *.html.

GitHub Pages кешира файловете 10 минути. С нова версия в адреса браузърът взима
новия CSS и JS веднага след публикация. Пускайте преди всяко публикуване:
    python3 tools/version_assets.py            # версия = текущото време (UTC)
"""
import glob, os, re, time
v = time.strftime('%Y%m%d%H%M', time.gmtime())
root = os.path.join(os.path.dirname(__file__), '..')
pat = re.compile(r'((?:href|src)="(?:css|js|data)/[^"?]+\.(?:css|js))(?:\?v=[^"]*)?"')
for f in sorted(glob.glob(os.path.join(root, '*.html'))):
    s = open(f, encoding='utf-8').read()
    n = pat.sub(lambda m: m.group(1) + '?v=' + v + '"', s)
    if n != s:
        open(f, 'w', encoding='utf-8').write(n)
print('версия', v)
