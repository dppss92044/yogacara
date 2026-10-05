#!/bin/sh
# 在 ~/.zshrc 加入「瑜伽統計」指令（可重複執行，不會重複加入）。不會寫入任何 token。
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
RC="$HOME/.zshrc"
BEGIN="# >>> yogacara-stats (W001) >>>"
END="# <<< yogacara-stats (W001) <<<"
touch "$RC"
if grep -qF "$BEGIN" "$RC"; then
  echo "~/.zshrc 已有瑜伽統計設定，未重複加入。"
else
  {
    echo ""
    echo "$BEGIN"
    echo "瑜伽統計() { python3 \"$DIR/yoga_stats.py\" \"\$@\"; }"
    echo "yogastats() { python3 \"$DIR/yoga_stats.py\" \"\$@\"; }"
    echo "$END"
  } >> "$RC"
  echo "已加入。請執行：source ~/.zshrc"
fi
