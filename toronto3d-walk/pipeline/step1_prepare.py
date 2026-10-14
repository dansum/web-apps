#!/usr/bin/env python3
"""Етап 1: изтегляне на Toronto-3D L002, изваждане на UTM отместването,
изрязване на коридор 250x60 м по оста на улицата и воксел-прореждане 3 см.

Изход:
  data/corridor.npz        xyz (float32, локални метри; x по улицата, y напречно, z нагоре),
                           rgb (uint8), intensity (uint8), label (uint8), meta
  data/step1_top_rgb.png   изглед отгоре (RGB)
  data/step1_top_class.png изглед отгоре (класове)

Употреба:
  python3 pipeline/step1_prepare.py                 # тегли от OneDrive
  python3 pipeline/step1_prepare.py --input L002.ply  # ползва локален файл
"""
import argparse
import base64
import json
import os
import shutil
import sys
import urllib.request

import numpy as np
from plyfile import PlyData

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.normpath(os.path.join(HERE, "..", "data"))

# Официалната споделена папка от README на Toronto-3D.
ONEDRIVE_SHARE = "https://1drv.ms/u/s!Amlc6yZnF87psX6hKS8VOQllVvj4?e=yWhrYX"
UTM_OFFSET = np.array([627285.0, 4841948.0, 0.0])  # препоръчано в README

CORRIDOR_LEN = 250.0
CORRIDOR_WID = 60.0
VOXEL = 0.03

CLASS_NAMES = ["unclassified", "road", "road_marking", "natural", "building",
               "utility_line", "pole", "car", "fence"]
CLASS_COLORS = np.array([
    [120, 120, 120], [60, 60, 70], [240, 240, 240], [60, 160, 60], [200, 120, 80],
    [240, 200, 40], [220, 40, 200], [40, 120, 230], [230, 140, 30]], np.uint8)


# ---------------------------------------------------------------- изтегляне
def _onedrive_api(share_url, suffix):
    token = base64.urlsafe_b64encode(share_url.encode()).decode().rstrip("=")
    return f"https://api.onedrive.com/v1.0/shares/u!{token}/root{suffix}"


def _get_json(url):
    with urllib.request.urlopen(url, timeout=60) as r:
        return json.load(r)


def _find_l002(share_url):
    """Обхожда споделената папка и връща URL за сваляне на L002.ply."""
    stack = [_onedrive_api(share_url, "/children")]
    while stack:
        page = _get_json(stack.pop())
        for item in page.get("value", []):
            name = item.get("name", "")
            if name.lower() == "l002.ply":
                return item["@content.downloadUrl"], item.get("size")
            if "folder" in item:
                stack.append(_onedrive_api(share_url, f":/{item['name']}:/children"))
        if "@odata.nextLink" in page:
            stack.append(page["@odata.nextLink"])
    raise RuntimeError("L002.ply не е намерен в споделената папка")


def download(dst):
    if os.path.exists(dst):
        print(f"[download] вече има {dst}")
        return dst
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    url, size = _find_l002(ONEDRIVE_SHARE)
    print(f"[download] L002.ply ({(size or 0) / 1e6:.0f} MB)")
    tmp = dst + ".part"
    with urllib.request.urlopen(url, timeout=120) as r, open(tmp, "wb") as f:
        shutil.copyfileobj(r, f, length=1 << 22)
    os.replace(tmp, dst)
    return dst


# ---------------------------------------------------------------- четене
def _field(v, *names):
    for n in names:
        if n in v.dtype.names:
            return np.asarray(v[n])
    raise KeyError(f"липсва поле {names}; налични: {v.dtype.names}")


def load_ply(path):
    v = PlyData.read(path)["vertex"].data
    # Координатите са double в UTM: изваждаме отместването ПРЕДИ преминаване към float32.
    xyz = np.stack([_field(v, "x"), _field(v, "y"), _field(v, "z")], 1).astype(np.float64)
    xyz -= UTM_OFFSET
    rgb = np.stack([_field(v, "red", "r"), _field(v, "green", "g"),
                    _field(v, "blue", "b")], 1).astype(np.uint8)
    inten = _field(v, "scalar_Intensity", "intensity", "Intensity").astype(np.float32)
    label = _field(v, "scalar_Label", "label", "class").astype(np.int64).clip(0, 8).astype(np.uint8)
    return xyz, rgb, inten, label


# ---------------------------------------------------------------- коридор
def street_frame(xyz, label):
    """Ос на улицата = главната компонента на XY на точките от пътя."""
    road = xyz[(label == 1) | (label == 2), :2]
    if len(road) < 1000:
        road = xyz[:, :2]
    c = np.median(road, 0)
    cov = np.cov((road - c).T)
    w, vec = np.linalg.eigh(cov)
    d = vec[:, np.argmax(w)]
    if d[0] < 0:
        d = -d
    # Центърът по дължина = средата на покритието на пътя (2–98 перцентил).
    t = (road - c) @ d
    n = (road - c) @ np.array([-d[1], d[0]])
    t_mid = 0.5 * (np.percentile(t, 2) + np.percentile(t, 98))
    n_mid = np.median(n)
    origin = c + t_mid * d + n_mid * np.array([-d[1], d[0]])
    return origin, d


def to_local(xyz, origin, d):
    n = np.array([-d[1], d[0]])
    rel = xyz[:, :2] - origin
    return np.stack([rel @ d, rel @ n, xyz[:, 2]], 1)


def voxel_downsample(xyz, voxel):
    """Една реална точка на воксел – най-близката до центъра му (запазва класа)."""
    vox = np.floor(xyz / voxel)
    dist = np.sum((xyz - (vox + 0.5) * voxel) ** 2, 1)
    q = (vox - vox.min(0)).astype(np.int64)
    dims = q.max(0) + 1
    key = (q[:, 0] * dims[1] + q[:, 1]) * dims[2] + q[:, 2]
    order = np.lexsort((dist, key))
    key_sorted = key[order]
    first = np.ones(len(order), bool)
    first[1:] = key_sorted[1:] != key_sorted[:-1]
    return np.sort(order[first])


# ---------------------------------------------------------------- PNG
def top_png(xyz, colors, path, res=0.1, title=""):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    x0, y0 = -CORRIDOR_LEN / 2, -CORRIDOR_WID / 2
    W, H = int(CORRIDOR_LEN / res), int(CORRIDOR_WID / res)
    ix = np.clip(((xyz[:, 0] - x0) / res).astype(int), 0, W - 1)
    iy = np.clip(((xyz[:, 1] - y0) / res).astype(int), 0, H - 1)
    # Най-високата точка печели (изглед отгоре).
    order = np.argsort(xyz[:, 2])
    img = np.full((H, W, 3), 255, np.uint8)
    img[iy[order], ix[order]] = colors[order]
    img = img[::-1]  # +y нагоре
    fig, ax = plt.subplots(figsize=(W / 100 * 0.6 + 1, H / 100 * 0.6 + 1.2), dpi=150)
    ax.imshow(img, extent=[x0, -x0, y0, -y0], interpolation="nearest")
    ax.set_xlabel("x по улицата, м")
    ax.set_ylabel("y напречно, м")
    ax.set_title(title, fontsize=9)
    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", help="локален L002.ply (иначе тегли от OneDrive)")
    args = ap.parse_args()

    src = args.input or download(os.path.join(DATA, "raw", "L002.ply"))
    print(f"[load] {src}")
    xyz, rgb, inten, label = load_ply(src)
    n_raw = len(xyz)
    print(f"[load] {n_raw:,} точки; обхват след отместване: "
          f"{xyz.min(0).round(1)} – {xyz.max(0).round(1)}")

    origin, d = street_frame(xyz, label)
    loc = to_local(xyz, origin, d)
    keep = (np.abs(loc[:, 0]) <= CORRIDOR_LEN / 2) & (np.abs(loc[:, 1]) <= CORRIDOR_WID / 2)
    loc, rgb, inten, label = loc[keep], rgb[keep], inten[keep], label[keep]
    n_crop = len(loc)

    # Нулата по z = медианата на пътя в коридора.
    road_z = loc[label == 1, 2]
    z0 = float(np.median(road_z)) if len(road_z) else float(np.percentile(loc[:, 2], 5))
    loc[:, 2] -= z0
    print(f"[crop] {n_crop:,} точки в коридора {CORRIDOR_LEN:.0f}x{CORRIDOR_WID:.0f} м")

    idx = voxel_downsample(loc, VOXEL)
    loc, rgb, inten, label = loc[idx], rgb[idx], inten[idx], label[idx]
    n_vox = len(loc)
    print(f"[voxel] {n_vox:,} точки след воксел {VOXEL * 100:.0f} см")

    # Интензитет към uint8 (робастно по 1–99 перцентил).
    lo, hi = np.percentile(inten, [1, 99])
    inten8 = np.clip((inten - lo) / max(hi - lo, 1e-6) * 255, 0, 255).astype(np.uint8)

    angle = float(np.degrees(np.arctan2(d[1], d[0])))
    counts = {CLASS_NAMES[i]: int((label == i).sum()) for i in range(9)}
    meta = dict(source=os.path.basename(src), utm_offset=UTM_OFFSET.tolist(),
                origin_after_offset=[float(origin[0]), float(origin[1]), z0],
                street_axis_deg=angle, corridor=[CORRIDOR_LEN, CORRIDOR_WID], voxel=VOXEL,
                points_raw=n_raw, points_corridor=n_crop, points_voxel=n_vox,
                intensity_range=[float(lo), float(hi)], class_counts=counts)
    os.makedirs(DATA, exist_ok=True)
    np.savez(os.path.join(DATA, "corridor.npz"), xyz=loc.astype(np.float32), rgb=rgb,
             intensity=inten8, label=label)
    with open(os.path.join(DATA, "step1_meta.json"), "w") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)

    top_png(loc, rgb, os.path.join(DATA, "step1_top_rgb.png"),
            title=f"L002 коридор {CORRIDOR_LEN:.0f}x{CORRIDOR_WID:.0f} м, RGB — {n_vox:,} точки")
    top_png(loc, CLASS_COLORS[label], os.path.join(DATA, "step1_top_class.png"),
            title="Класове: път, маркировка, растителност, сгради, кабели, стълбове, коли, огради")
    print(json.dumps(meta, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    sys.exit(main())
