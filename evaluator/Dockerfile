FROM python:3.12-slim

WORKDIR /app

RUN groupadd -r appuser && useradd -r -g appuser appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY evaluate.py .

RUN chown -R appuser:appuser /app
USER appuser

CMD ["python", "evaluate.py"]
