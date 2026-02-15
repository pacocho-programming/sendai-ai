FROM python:3.10-slim

WORKDIR /app

# system deps（opencv / pillow 用）
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Cloud Run は PORT 環境変数を使う
ENV PORT=8080

CMD ["python", "infer.py"]