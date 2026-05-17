FROM python:3.12-slim AS builder

WORKDIR /app

COPY pyproject.toml ./
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir .

COPY . .

FROM python:3.12-slim
WORKDIR /app

COPY --from=builder /usr/local /usr/local
COPY --from=builder /app/src /app/src
COPY --from=builder /app/templates /app/templates

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
