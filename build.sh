#!/usr/bin/env bash
# 런치박스애니메이션 빌드: src/ 조각을 합쳐 app.html(본문)과 index.html(배포용 한 장)을 만들어요.
set -e
cd "$(dirname "$0")"
{ cat src/p1_head.html src/p1c_theme.html; echo '<script>'; cat src/p2c_clay.js src/p2_core.js src/p2b_ui.js src/p3a_core.js src/p3c_screens.js src/p4_shoot.js src/p5c_rec.js src/p6_simple.js src/p6d_extra.js src/p6e_story.js src/p5d_export.js; echo '</script>'; } > app.html
node -e "const s=require('fs').readFileSync('app.html','utf8');new Function(s.split('<script>')[1].split('</script>')[0]);console.log('syntax ok')"
BUILD=$(date +%Y%m%d%H%M%S)
# 제목·아이콘·manifest 줄(p1_head.html의 첫 <style> 앞)은 <head> 안에 둬요. 아이폰은 <body>에 있는 apple-touch-icon을 못 읽어요.
N=$(awk '/^<style/{print NR-1; exit}' src/p1_head.html)
{ printf '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="lb-build" content="'"$BUILD"'"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">\n'; head -n "$N" app.html; printf '</head><body>'; tail -n +"$((N+1))" app.html; printf '</body></html>'; } > index.html
echo "built index.html ($(wc -c < index.html) bytes)"
