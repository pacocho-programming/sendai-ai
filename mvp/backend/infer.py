from flask import Flask, request, jsonify
from ultralytics import YOLO
from PIL import Image
import io
from flask_cors import CORS



app = Flask(__name__)
CORS(app,resources={r"/predict":{"origins": "*"}}) #ブラウザいからのリクエストを許可

model = YOLO('/Users/pacocho/SENDAI_AI_dir/main_for_resume/Hemia_ai/sendai-ai/backend/best.pt') #モデルパス

@app.route('/predict', methods=['POST'])
def predict():
  if 'image' not in request.files:
    return jsonify({'error': 'No image uploaded'}), 400
  
  file = request.files['image'] #送信された画像ファイルを保存
  
  try:
    img = Image.open(file.stream)
    results = model.predict(img)
    
    output = []
    for r in results[0].boxes:
      output.append({
        'class': int(r.cls[0]), #検出クラス
        'confidence': float(r.conf[0]), #信頼度
        'box': r.xyxy[0].tolist() #バウンディングボックスの位置情報
      })
      
    return jsonify(output)
  except Exception as e:
    return  jsonify({'error': str(e)}),500
  
if __name__ == '__main__':
  app.run(debug=True, host='0.0.0.0',port=5001)
