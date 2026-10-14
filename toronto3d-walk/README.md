# Toronto-3D: разходка от първо лице (L002)

Браузърно демо: ходене из облак от точки Toronto-3D, участък L002.

## Етап 1 — подготовка на данните

```bash
pip install -r pipeline/requirements.txt
python3 pipeline/step1_prepare.py                    # тегли L002.ply от OneDrive
python3 pipeline/step1_prepare.py --input /път/L002.ply  # или локален файл
```

Изход в `data/`: `corridor.npz`, `step1_meta.json`, `step1_top_rgb.png`, `step1_top_class.png`.

Данните: Toronto-3D, Geospatial Intelligence Lab, University of Waterloo — CC BY-NC 4.0.
