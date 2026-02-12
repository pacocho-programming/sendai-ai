import sqlite3
import json
import shutil
from pathlib import Path
from PIL import Image

# ===== 設定 =====
DB_PATH = "../backend/data.db"
OUT_DIR = Path("../dataset")
IMG_DIR = OUT_DIR / "images/train"
LBL_DIR = OUT_DIR / "labels/train"

IMG_DIR.mkdir(parents=True, exist_ok=True)
LBL_DIR.mkdir(parents=True, exist_ok=True)

LABEL_MAP = {
    "milk": 0,
    "yogurt": 1,
    "butter": 2,
    "tofu": 3
}

# ===== DB 読み込み =====
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

for row in c.execute("SELECT image_path, final_label, bbox FROM detections"):
    image_path, label, bbox_json = row
    bbox = json.loads(bbox_json)

    # DBに保存されている実画像パスを使用する
    src_img = Path(image_path)
    if not src_img.exists():
        print(f"[WARN] image not found: {src_img}")
        continue

    dst_img = IMG_DIR / src_img.name
    shutil.copy(src_img, dst_img)

    # bbox 正規化
    with Image.open(dst_img) as im:
        w, h = im.size

    x1, y1, x2, y2 = bbox
    xc = ((x1 + x2) / 2) / w
    yc = ((y1 + y2) / 2) / h
    bw = (x2 - x1) / w
    bh = (y2 - y1) / h

    label_id = LABEL_MAP[label]

    txt_path = LBL_DIR / (dst_img.stem + ".txt")
    with open(txt_path, "w") as f:
        f.write(f"{label_id} {xc} {yc} {bw} {bh}\n")

conn.close()