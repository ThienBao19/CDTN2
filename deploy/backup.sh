#!/bin/sh
# NFR-11: sao lưu CSDL hằng ngày, giữ bản của 7 ngày gần nhất.
# Chạy ngay một lần: docker compose ... exec backup sh /backup.sh --once
set -eu
KEEP_DAYS="${BACKUP_KEEP_DAYS:-7}"
PREFIX="${BACKUP_PREFIX:-patient_tracker}"

backup_once() {
  # Chờ CSDL sẵn sàng (sau khi Docker khởi động lại, các container lên cùng lúc)
  until pg_isready -h postgres -U "$POSTGRES_USER" -q; do sleep 2; done
  FILE="/backups/${PREFIX}_$(date +%Y%m%d_%H%M%S).sql.gz"
  TMP="/tmp/${PREFIX}.sql"
  # Không dùng pg_dump | gzip: mã thoát của pipeline là của gzip nên sẽ che lỗi của pg_dump
  if pg_dump -h postgres -U "$POSTGRES_USER" "$POSTGRES_DB" > "$TMP"; then
    gzip -c "$TMP" > "$FILE"
    echo "Đã sao lưu: $FILE ($(wc -c < "$FILE") byte)"
  else
    echo "Sao lưu thất bại lúc $(date)" >&2
  fi
  rm -f "$TMP"
  find /backups -name "${PREFIX}_*.sql.gz" -mtime "+$KEEP_DAYS" -delete
}

if [ "${1:-}" = "--once" ]; then
  backup_once
  exit 0
fi
while true; do
  backup_once
  sleep "${BACKUP_INTERVAL_SECONDS:-86400}"
done
