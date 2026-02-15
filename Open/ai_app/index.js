/*
必要な間数ー＞
＠画像アップロード間数（firebase.js）
＠label.txtアップロード間数（firebase.js）
＠send()＜ーuploadImage(file,imageId),uploadLabel(text,imageId)
@draw_box()バウンディングボックスで囲む作業
*/

//import { start } from "repl";

//firebase.jsonからuploadImage(),uploadLabel()をインポートする
import { uploadImage,uploadLabel } from "../firebase";
import { getAuth, signOut } from "firebase/auth";

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
let data = null;







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
  data = await response.json();
  return data;

}

//firestoreに必要なデータを保存
async function send_to_db(){
  //console.log("pusshed button!");
  //getImagefile();
  
}

//firebase storageにimage,.txtを保存
async function  send_to_storage(file,label,image_id) {
  await uploadImage(file,image_id);
  await uploadLabel(label,image_id);
  console.log("送信完了！");
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
        let selected_class = selectedBox.class;
        document.getElementById("food_name").value = LABELS[selected_class];
        document.getElementById("labelSelect").value = selected_class;
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
      //console.log("移動後のボックス座標: ",typeof(selectedBox));
    }
    if (resizing) {
      selectedBox.x2 = x / scale;
      selectedBox.y2 = y / scale;
      draw_box(detections);
      //デバック用
      //console.log("リサイズ後のボックス座標: ",selectedBox);
    }
  });

  //mouse up
  canvas.addEventListener("mouseup", () => {
    dragging = false;
    resizing = false;
  });
}

function createBox() {
  if (!img.src) {
    alert("先に画像を読み込んでください");
    return;
  }

  // 画像中央付近に適当なサイズで box を作る
  const boxWidth = img.width * 0.2;
  const boxHeight = img.height * 0.2;

  const x1 = img.width * 0.4;
  const y1 = img.height * 0.4;

  const newBox = {
    class: -1,        // 初期は none
    confidence: 1.0,  // 手動作成なので仮
    x1: x1,
    y1: y1,
    x2: x1 + boxWidth,
    y2: y1 + boxHeight
  };

  detections.push(newBox);
  selectedBox = newBox;

  // UI 同期
  document.getElementById("labelSelect").value = "-1";
  document.getElementById("food_name").value = "";

  draw_box(detections);
}

//クラス名の変更動作
function fix_class() {
  const labelSelect = document.getElementById("labelSelect");
  labelSelect.addEventListener("change", e => {
    if(!selectedBox) return;

    const newClass = parseInt(e.target.value);
    selectedBox.class = newClass;
    if (selectedBox.class === -1) {
      //detections配列からselectedBoxを削除
      const index = detections.indexOf(selectedBox);
      if (index !== -1) {
        detections.splice(index,1);
      }
      selectedBox = null;
      document.getElementById("food_name").value = "";
    } else {
      document.getElementById("food_name").value = LABELS[newClass];
    }
    draw_box(detections);
  });
}

//YOLO学習用label.txtのためにslectedBoxの形式を修正
function change_to_label() {
  if (!detections || detections.length === 0) {
    alert("ボックスがありません");
    return "";
  }

  return detections
    .filter(d => d.class !== -1)
    .map(d => {
      const x_center = ((d.x1 + d.x2) / 2) / img.width;
      const y_center = ((d.y1 + d.y2) / 2) / img.height;
      const width = (d.x2 - d.x1) / img.width;
      const height = (d.y2 - d.y1) / img.height;

      return `${d.class} ${x_center.toFixed(6)} ${y_center.toFixed(6)} ${width.toFixed(6)} ${height.toFixed(6)}`;
    })
    .join("\n");
}

function generateImageId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function send() {
  const file = getImagefile();
  if(!file) return ;
  const label = change_to_label();
  const image_id = generateImageId();
  send_to_storage(file,label,image_id);

}

function logout() {
  const auth = getAuth();
  signOut(auth).then(() => {
    window.location.href = "../index.html";
  }).catch((error) => {
    alert("ログアウトに失敗しました: " + error.message);
  });
}



//初期化
fix_box()
fix_class();
// index.js の最後に追加
document.getElementById("scanBtn").addEventListener("click", draw_canvas);
document.getElementById("send").addEventListener("click", send);
document.getElementById("add_box").addEventListener("click",createBox);
document.getElementById("logoutBtn").addEventListener("click", logout);
