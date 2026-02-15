from flask import Flask, request, jsonify
import cv2
import numpy as np
from ultralytics import YOLO
import uuid
from PIL import Image
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
model = YOLO("best.pt")
CONF_THRESHOLD = 0.4  # 40% confidence threshold
image_id = str(uuid.uuid4())

@app.route("/predict",methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "no image"}),400
    
    file = request.files["image"]
    img = Image.open(file)
    results = model.predict(img)
    
    detections = []
    #detection配列に結果を保存
    for r in results[0].boxes:
        conf = float(r.conf[0])
        if conf < CONF_THRESHOLD:
            continue

        detections.append({
            "class": int(r.cls[0]),
            "confidence": conf,
            "box": r.xyxy[0].tolist()
        })
    return jsonify({
        "image_id":image_id,
        "detections": detections
    })

if __name__ == "__main__":
    app.run(port=5001,debug=True)