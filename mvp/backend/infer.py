# mvp/backend/infer.py

from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import uuid
import shutil
import os
import sqlite3
import json
import datetime

# =========================
# FastAPI 初期化
# =========================
app = FastAPI()

# CORS（フロントから叩くため）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# YOLOモデル読み込み
# =========================
model = YOLO("best.pt")

# =========================
# DB 初期化
# =========================
DB_PATH = "data.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS detections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_path TEXT,
        final_label TEXT,
        bbox TEXT,
        confidence REAL,
        created_at TEXT
    )
    """)
    conn.commit()
    conn.close()

init_db()

# =========================
# 推論API
# =========================
@app.post("/infer")
async def infer(image: UploadFile):
    # 元の拡張子を保持（HEIC対応）
    ext = os.path.splitext(image.filename)[1]
    tmp_path = f"/tmp/{uuid.uuid4()}{ext}"

    # ファイルポインタを先頭に戻す
    image.file.seek(0)

    # 一時保存
    with open(tmp_path, "wb") as f:
        shutil.copyfileobj(image.file, f)

    # 推論
    results = model(tmp_path)
    r = results[0]

    detections = []
    for box, cls, conf in zip(
        r.boxes.xyxy.tolist(),
        r.boxes.cls.tolist(),
        r.boxes.conf.tolist()
    ):
        detections.append({
            "label": r.names[int(cls)],
            "confidence": round(conf, 3),
            "bbox": box
        })

    return {"detections": detections}

# =========================
# 保存API
# =========================
@app.post("/save")
async def save(data: dict):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""
    INSERT INTO detections
    (image_path, final_label, bbox, confidence, created_at)
    VALUES (?, ?, ?, ?, ?)
    """, (
        data["image_path"],
        data["final_label"],
        json.dumps(data["bbox"]),
        data["confidence"],
        datetime.datetime.now().isoformat()
    ))

    conn.commit()
    conn.close()

    return {"status": "ok"}