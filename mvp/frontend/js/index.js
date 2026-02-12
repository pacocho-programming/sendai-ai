function send() {
  const input = document.getElementById('imageInput');
  if(!input.files || input.files.length === 0) {
    alert('画像を選んでください');
    return;
  }

  const file = input.files[0];
  const formData = new FormData();
  formData.append('image', file);

  fetch('http:..localhost:5000/predict', { //サーバーのURLに変更
    method: 'POST',
    body: formData
  })

  .then(response => response.json())
  .then(data => {
    console.log(data);
    document.getElementById('result').innerText = JSON.stringify(data,null,2);
  })
  .catch(err => {
    console.error(err);
    alert('送信エラー')
  });
}