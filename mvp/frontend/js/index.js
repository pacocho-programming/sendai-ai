let detections = [];
let originalDetections = [];
let selectedBox = null;
let dragging = false;
let offsetX = 0;
let offsetY = 0;
let imageId = null;

const canvas = document.getElementById("imageCanvas");
const ctx = canvas.getContext("2d");
let img = new Image();
let scale = 1;

// クラス対応表
const LABELS = {
  "-1": "none",
  "0": "milk",
  "1": "yogurt",
  "2": "butter",
  "3": "tofu"
};

function send() {
  const input = document.getElementById("imageInput");
  if (!input.files.length) {
    alert("画像を選択してください");
    return;
  }

  const file = input.files[0];
  img = new Image();

  img.onload = () => {
    const maxWidth = 600;
    scale = Math.min(1, maxWidth / img.width);

    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    tempCanvas.getContext("2d").drawImage(img, 0, 0);

    tempCanvas.toBlob(blob => {
      const formData = new FormData();
      formData.append("image", blob, "image.jpg");


      fetch("http://localhost:5001/predict", {
        method: "POST",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          imageId = data.image_id;

          detections = data.detections.map(d => ({
            x1: d.box[0],
            y1: d.box[1],
            x2: d.box[2],
            y2: d.box[3],
            class: d.class,
            confidence: d.confidence
          }));

          // before 保存（ディープコピー）
          originalDetections = JSON.parse(JSON.stringify(detections));

          //テキストボックスに予測した食材名を代入
          if (detections.length > 0) {
            const firstClass = detections[0].class;
            document.getElementById('food_name').value = LABELS[firstClass]
          }

          document.getElementById("result").innerText =
            JSON.stringify(detections, null, 2);

          draw();
        });
    }, "image/jpeg", 0.9);
  };

  img.src = URL.createObjectURL(file);
}

// 描画
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  detections.forEach(box => {
    ctx.strokeStyle = box === selectedBox ? "red" : "blue";
    ctx.lineWidth = 2;

    ctx.strokeRect(
      box.x1 * scale,
      box.y1 * scale,
      (box.x2 - box.x1) * scale,
      (box.y2 - box.y1) * scale
    );

    ctx.fillStyle = "red";
    ctx.font = "14px Arial";
    ctx.fillText(
      `${LABELS[box.class]} ${(box.confidence * 100).toFixed(1)}%`,
      box.x1 * scale,
      box.y1 * scale - 4
    );
  });
}

// 選択
canvas.addEventListener("mousedown", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) / scale;
  const my = (e.clientY - rect.top) / scale;

  selectedBox = null;

  detections.forEach(box => {
    if (mx >= box.x1 && mx <= box.x2 && my >= box.y1 && my <= box.y2) {
      selectedBox = box;
      offsetX = mx - box.x1;
      offsetY = my - box.y1;
      dragging = true;
      document.getElementById("labelSelect").value = box.class;
      document.getElementById('food_name').value = LABELS[box.class];
    }
  });

  draw();
});

// 移動
canvas.addEventListener("mousemove", e => {
  if (!dragging || !selectedBox) return;

  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) / scale;
  const my = (e.clientY - rect.top) / scale;

  const w = selectedBox.x2 - selectedBox.x1;
  const h = selectedBox.y2 - selectedBox.y1;

  selectedBox.x1 = mx - offsetX;
  selectedBox.y1 = my - offsetY;
  selectedBox.x2 = selectedBox.x1 + w;
  selectedBox.y2 = selectedBox.y1 + h;

  draw();
});

canvas.addEventListener("mouseup", () => dragging = false);

// クラス変更（none 含む）
document.getElementById("labelSelect").addEventListener("change", e => {
  if (selectedBox) {
    selectedBox.class = Number(e.target.value);
    document.getElementById('food_name').value = LABELS[selectedBox.class];
    draw();
  }
});

// 保存
function saveCorrections() {

  // noen(-1)クラスを除外 filterメソッドでnoneを除外可
  const filteredAfter = detections.filter(d => d.class !== -1);
  const filteredBefore = originalDetections.filter(d => d.class !== -1);

  //保存対象が0件なら保存しない
  if (filteredAfter.length == 0){
    alert("none以外のクラスがないため保存しません。");
  }

  fetch("http://localhost:5001/save_corrections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_id: imageId,
      before: filteredBefore,
      after: filteredAfter
    })
  })
    .then(res => res.json())
    .then(() => alert("修正内容を保存しました"));
}

//修正がされた対象物だけ保存
function saveIfChanged() {
  //ユーザーが予測の再調整を行ったか否か
  const isModified = JSON.stringify(originalDetections) !== JSON.stringify(detections);

  //予測クラスがnone(-1)以外を対象とする
  const hasValidClass = detections.some(d => d.class !== -1);
  
  if (isModified && hasValidClass) {
    saveCorrections();
  } else {
    alert("修正がなかったため保存しませんでした");
  }
  
}