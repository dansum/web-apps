#!/usr/bin/env python3
"""Шифрова съдържанието на админ страницата (admin.html) с парола.

Употреба:  python3 tools/encrypt_admin.py <plan.html> <парола>  > data/admin.enc.js

Отвореният текст на плана НЕ се записва в хранилището — пазете го отделно.
Шифроване: PBKDF2-HMAC-SHA256 (250 000 итерации) → AES-256-GCM; браузърът дешифрира с WebCrypto.
Внимание: сигурността зависи изцяло от паролата. Кратка парола може да бъде отгатната.
"""
import base64, json, os, sys
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ITER = 250000
src, pw = sys.argv[1], sys.argv[2]
data = open(src, 'rb').read()
salt, iv = os.urandom(16), os.urandom(12)
key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITER).derive(pw.encode('utf-8'))
ct = AESGCM(key).encrypt(iv, data, None)
b = lambda x: base64.b64encode(x).decode()
print('/* БУМ — шифрованото съдържание на admin.html (виж tools/encrypt_admin.py). */')
print('window.BUM_ADMIN = ' + json.dumps({'iter': ITER, 'salt': b(salt), 'iv': b(iv), 'ct': b(ct)}) + ';')
