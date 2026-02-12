from ultralytics import YOLO
import os

model = YOLO("best.pt")
img_path = "test.HEIC"
output_dir = "output"

# 出力フォルダ作成
os.makedirs(output_dir, exist_ok=True)

results = model(img_path)

# 保存する時に拡張子付きパスを指定
for i, r in enumerate(results):
    save_path = os.path.join(output_dir, f"result_{i}.jpg")
    r.save(save_path)  # または r.plot() と cv2.imwrite(save_path, r.plot())