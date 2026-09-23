FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir torch==2.6.0 --index-url https://download.pytorch.org/whl/cpu && pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd --create-home rag && mkdir -p /data && chown rag:rag /data
USER rag
ENV RAG_DATA_DIR=/data HF_HOME=/data/models ANONYMIZED_TELEMETRY=False
EXPOSE 8010
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8010", "--workers", "1"]
