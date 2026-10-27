#!/usr/bin/env bash
# 런치박스애니메이션 빌드: src/ 조각을 합쳐 app.html(본문)과 index.html(배포용 한 장)을 만들어요.
set -e
cd "$(dirname "$0")"
{ cat src/p1_head.html src/p1b_tex.html; echo '<script>'; cat src/p2_core.js src/p2b_ui.js src/p2c_artdata.js src/p2d_splash.js src/p3a_core.js src/p3b_intro_data.js src/p3c_screens.js src/p4_shoot.js src/p5a_steps.js src/p5b_script.js src/p5c_rec.js src/p5d_export.js; echo '</script>'; } > app.html
node -e "const s=require('fs').readFileSync('app.html','utf8');new Function(s.split('<script>')[1].split('</script>')[0]);console.log('syntax ok')"
{ printf '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no"></head><body>'; cat app.html; printf '</body></html>'; } > index.html
echo "built index.html ($(wc -c < index.html) bytes)"
