#!/bin/sh
# NFR-11: sao lưu CSDL hằng ngày, giữ bản của 7 ngày gần nhất
set -eu
KEEP_DAYS="${BACKUP_KEEP_DAYS:-7}"
while true; do
  FILE="/backups/patient_tracker_$(date +%Y%m%d_%H%M%S).sql.gz"
  if pg_dump -h postgres -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$FILE"; then
    echo "Đã sao lưu: $FILE"
  else
    echo "Sao lưu thất bại" >&2
    rm -f "$FILE"
  fi
  find /backups -name 'patient_tracker_*.sql.gz' -mtime "+$KEEP_DAYS" -delete
  sleep "${BACKUP_INTERVAL_SECONDS:-86400}"
done
