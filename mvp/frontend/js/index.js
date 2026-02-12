function send() {
  const input = document.getElementById('imageInput');
  if (!input.files || input.files.length === 0) {
    alert('画像を選んでください');
    return;
  }

  const file = input.files[0];

  const img = new Image();
  img.onload = () => {
    // 画像を描画するキャンバスを取得
    const canvas = document.getElementById('imageCanvas');
    // 表示用に画像サイズを縮小（最大幅を指定）
    const maxWidth = 500; // 表示したい最大幅（px）
    const scale = Math.min(1, maxWidth / img.width);

    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 画像を JPEG に変換してサーバーに送信
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0);

    tempCanvas.toBlob((blob) => {
      const formData = new FormData();
      formData.append('image', blob, 'image.jpg');

      fetch('http://localhost:5001/predict', {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          console.log(data);
          document.getElementById('result').innerText = JSON.stringify(data, null, 2);

          // バウンディングボックスをキャンバスに描画
          data.forEach(item => {
            const [x1, y1, x2, y2] = item.box;
            const sx1 = x1 * scale;
            const sy1 = y1 * scale;
            const sx2 = x2 * scale;
            const sy2 = y2 * scale;
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 2;
            ctx.strokeRect(sx1, sy1, sx2 - sx1, sy2 - sy1);

            ctx.font = '20px Arial';
            ctx.fillStyle = 'red';
            ctx.fillText(
              `Class ${item.class} (${(item.confidence * 100).toFixed(1)}%)`,
              sx1,
              sy1 - 8
            );
          });

          // 画像として保存できるようボタンを作る
          let saveBtn = document.getElementById('saveBtn');
          if (!saveBtn) {
            saveBtn = document.createElement('button');
            saveBtn.id = 'saveBtn';
            saveBtn.innerText = 'Download Image';
            document.body.appendChild(saveBtn);
            saveBtn.onclick = () => {
              const link = document.createElement('a');
              link.href = canvas.toDataURL('image/jpeg');
              link.download = 'detected_image.jpg';
              link.click();
            };
          }
        })
        .catch(err => {
          console.error(err);
          alert('送信エラー');
        });
    }, 'image/jpeg', 0.9);
  };

  img.src = URL.createObjectURL(file);
}