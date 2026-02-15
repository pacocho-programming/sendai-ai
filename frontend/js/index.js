/*
必要な間数ー＞
＠画像アップロード間数（firebase.js）
＠label.txtアップロード間数（firebase.js）
＠send()＜ーuploadImage(file,imageId),uploadLabel(text,imageId)
@draw_box()バウンディングボックスで囲む作業
*/

//import { start } from "repl";

//firebase.jsonからuploadImage(),uploadLabel()をインポートする
//import { uploadImage,uploadLabel } from "./firebase";
const canvas = document.getElementById("draw_result")
const ctx = canvas.getContext("2d");
const MAX_WIDTH = 600;
const HANDLE_SIZE = 8;
const LABELS = {
  "-1": "none",
  "0": "milk",
  "1": "yogurt",
  "2": "butter",
  "3": "tofu"
};

let img = new Image(); //jsで画像を表示するためのメソッドを読み込み
let scale = 1;
let selectedBox = null;
let dragging = false;
let offsetX = 0;
let offsetY = 0;
let resizing = false;
let startX = 0;
let startY = 0;
let detections = []







//画像の取得
function getImagefile() {
  const input = document.getElementById("imageInput");

  //アップロードされたファイルがある場合実行
  if(!input.files || input.files.length === 0){
    alert("ファイルが選択されていません");
    return null;
  }

  const file = input.files[0];
  console.log("選択されたファイル:",file);
  return file;
} 

//Flaskサーバーに送信
async function send_server(file) {
  const formData = new FormData();
  formData.append("image",file); //Flask側でrequest.files["image"]

  const response = await fetch("http://localhost:5001/predict", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("Flaskサーバーとの通信は失敗しました");
  }
  //dataには{image_id: ,detections: }のJsonファイルが返ってくる
  const data = await response.json();
  return data;

}

//firestoreに必要なデータを保存
async function send_to_db(){
  //console.log("pusshed button!");
  //getImagefile();
  
}

//firebase storageにimage,.txtを保存
async function  send_to_storage(params) {
  
}

//最終送信 include(send_to_db and send_to_storage)
async function  draw_canvas(params) {
  const file = getImagefile(); 
  //画像をcanvas用に読み込む
  const reader = new FileReader();
  reader.onload = async () => {
    img.onload = async () => {
      scale = Math.min(1,MAX_WIDTH / img.width)
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      try {
        //resultには{image_id: ,detections: }のJsonファイルが返ってくる
        const result = await send_server(file);
        detections = result.detections.map(d => {
          return {
            class: d.class,
            confidence: d.confidence,
            // 配列 [x1, y1, x2, y2] を個別のプロパティに展開
            x1: d.box[0],
            y1: d.box[1],
            x2: d.box[2],
            y2: d.box[3]
          };
        });
        draw_box(detections);
        console.log("YOLO結果:", result);
      } catch(e) {
        alert(e.message);
      }
    };
    img.src = reader.result;
  }
  reader.readAsDataURL(file)
}

//Boxの表示
function draw_box(detections) {
  // canvasをクリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // 画像を再描画
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  detections.forEach(d => {
    const {x1,y1,x2,y2} = d;

    const sx1 = x1 * scale;
    const sy1 = y1 * scale;
    const sx2 = x2 * scale;
    const sy2 = y2 * scale;

    // ===== バウンディングボックス =====

    //選択されている場合は赤色、さあれていない場合は青色
    ctx.strokeStyle = d === selectedBox ? "red": "blue";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      sx1,
      sy1,
      sx2 - sx1,
      sy2 - sy1
    );
  
    // ===== ラベル =====
    ctx.fillStyle = "red";
    ctx.font = "16px Arial";
    ctx.fillText(
      `class:${d.class} ${(d.confidence * 100).toFixed(1)}%`,
      sx1,
      sy1 - 5
    );

    // ===== リサイズハンドル（右下）=====
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;

    ctx.fillRect(
      sx2 - HANDLE_SIZE / 2,
      sy2 - HANDLE_SIZE / 2,
      HANDLE_SIZE,
      HANDLE_SIZE
    );

    ctx.strokeRect(
      sx2 - HANDLE_SIZE / 2,
      sy2 - HANDLE_SIZE / 2,
      HANDLE_SIZE,
      HANDLE_SIZE
    );
  });
}

// Box がクリックされたか判定
function hitTest(x,y,box) {
  return (
    x >= box.x1 * scale &&
    x <= box.x2 * scale &&
    y >= box.y1 * scale &&
    y <= box.y2 * scale
  );
}

//リサイズハンドル判定（右下）
function hitResizeHandle(x,y,box) {
  const hx = box.x2 * scale;
  const hy = box.y2 * scale;

  return (
    Math.abs(x - hx) < HANDLE_SIZE &&
    Math.abs(y - hy) < HANDLE_SIZE
  );
}

function fix_box() {
  //mouse down
  canvas.addEventListener("mousedown", e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    

    
    selectedBox = null;

    for (let box of detections) {
      if (hitResizeHandle(x,y,box)) {
        selectedBox = box;
        resizing = true;
        return;
      }

      if (hitTest(x,y,box)) {
        selectedBox = box;
        dragging = true;
        startX = x;
        startY = y;

        //選択しているboxの食材をtextboxに表示
        selected_class = selectedBox.class;
        document.getElementById("food_name").value = LABELS[selected_class];
        //console.log(selected_class);
        //console.log(selectedBox.class);
        //console.log(document.getElementById("labelSelect").value = selectedBox.class);
        return;
      }
    }
  });

  //mouse move
  canvas.addEventListener("mousemove", e => {

    if(!selectedBox) return;
    

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if(dragging) {
      const dx = (x - startX) / scale;
      const dy = (y - startY) / scale;

      selectedBox.x1 += dx;
      selectedBox.y1 += dy;
      selectedBox.x2 += dx;
      selectedBox.y2 += dy;

      startX = x;
      startY = y;
      draw_box(detections);
      //デバック用
      console.log("移動後のボックス座標: ",typeof(selectedBox));
    }
    if (resizing) {
      selectedBox.x2 = x / scale;
      selectedBox.y2 = y / scale;
      draw_box(detections);
      //デバック用
      console.log("リサイズ後のボックス座標: ",selectedBox);
    }
  });

  //mouse up
  canvas.addEventListener("mouseup", () => {
    dragging = false;
    resizing = false;
  });
}

//クラス名の変更動作
function fix_class() {
  const labelSelect = document.getElementById("labelSelect");
  labelSelect.addEventListener("change", e => {
    if(!selectedBox) return;

    const newCass = parseInt(e.target.value);
    selectedBox.class = newCass;
    document.getElementById("food_name").value = LABELS[newCass];
    draw_box(detections);
  });
}

//YOLO学習用label.txtのためにslectedBoxの形式を修正
function change_to_label() {

}

//クラス、ボックスの修正結果
function fix_result() {

}

function send() {

}


//初期化
fix_box()
fix_class();









/*
// =========================
// グローバル変数
// =========================
let imageId = "";
let originalDetections = [];
let detections = [];
let img = new Image();

const canvas = document.getElementById("imageCanvas");
const ctx = canvas.getContext("2d");

// =========================
// Scan（YOLO推論）
// =========================
function send() {
  const input = document.getElementById("imageInput");
  if (!input.files.length) {
    alert("画像を選択してください");
    return;
  }

  const file = input.files[0];
  imageId = file.name;

  // 画像表示
  const reader = new FileReader();
  reader.onload = () => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);

  // Python(YOLO)へ送信
  const formData = new FormData();
  formData.append("image", file);

  fetch("http://localhost:5001/infer", {
    method: "POST",
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      console.log(data);
      document.getElementById("result").innerText =
        JSON.stringify(data, null, 2);

      // YOLO結果を内部形式に変換
      detections = data.map(item => ({
        x1: item.box[0],
        y1: item.box[1],
        x2: item.box[2],
        y2: item.box[3],
        class: item.class,
        confidence: item.confidence
      }));

      // before 用にコピー
      originalDetections = JSON.parse(JSON.stringify(detections));

      drawBoxes();
    });
}

// =========================
// バウンディングボックス描画
// =========================
function drawBoxes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  detections.forEach((d, i) => {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      d.x1,
      d.y1,
      d.x2 - d.x1,
      d.y2 - d.y1
    );

    ctx.fillStyle = "red";
    ctx.fillText(
      `#${i} class:${d.class}`,
      d.x1,
      d.y1 - 5
    );
  });
}

// =========================
// クラス修正（select変更）
// =========================
document.getElementById("labelSelect").addEventListener("change", e => {
  const newClass = parseInt(e.target.value);

  // 今回は「最後に選択したボックス」を修正する想定
  if (detections.length === 0) return;

  detections[detections.length - 1].class = newClass;
  drawBoxes();
});

// =========================
// Save（変更があったら保存）
// =========================
function saveIfChanged() {
  if (JSON.stringify(originalDetections) === JSON.stringify(detections)) {
    alert("変更はありません");
    return;
  }

  saveCorrections();
}

function saveCorrections() {
  fetch("http://localhost:5001/save_corrections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_id: imageId,
      before: originalDetections,
      after: detections
    })
  })
    .then(res => res.json())
    .then(() => alert("修正内容を保存しました"));
}
*/