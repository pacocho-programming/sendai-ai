from flask import Flask, request, jsonify
from ultralytics import YOLO
from flask_cors import CORS
from PIL import Image
import sqlite3
import json
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=["http://127.0.0.1:5500", "http://localhost:5500"])

model = YOLO("best.pt")
DB_PATH = "data.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS corrections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_id TEXT,
        before_json TEXT,
        after_json TEXT,
        created_at TEXT
    )
    """)
    conn.commit()
    conn.close()

init_db()

@app.route("/predict", methods=["POST"])
def predict():
    img = Image.open(request.files["image"].stream)
    results = model.predict(img)

    detections = []
    for r in results[0].boxes:
        detections.append({
            "class": int(r.cls[0]),
            "confidence": float(r.conf[0]),
            "box": r.xyxy[0].tolist()
        })

    return jsonify({
        "image_id": datetime.utcnow().isoformat(),
        "detections": detections
    })

@app.route("/save_corrections", methods=["POST"])
def save_corrections():
    data = request.json

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT INTO corrections (image_id, before_json, after_json, created_at)
        VALUES (?, ?, ?, ?)
    """, (
        data["image_id"],
        json.dumps(data["before"]),
        json.dumps(data["after"]),
        datetime.utcnow().isoformat()
    ))
    conn.commit()
    conn.close()

    return jsonify({"status": "saved"})

if __name__ == "__main__":
    app.run(port=5001, debug=True)