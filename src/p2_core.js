'use strict';
/* =========================================================
   옛이야기 애니 스튜디오 — 아르떼노바
   (앱 이름·회사 이름은 아래 BRAND 에서 바꿀 수 있어요)
   ========================================================= */
const BRAND = {
  company: 'ARTENOVA',
  companyKo: '아르떼노바',
  app: '런치박스애니메이션',
  short: '런치박스애니메이션'
};
const W = 960, H = 540;          // 모든 무대의 기준 해상도 (16:9)
const $ = (s, r = document) => r.querySelector(s);
/* 세로로 들고 있어도 가로로 보이게 화면 전체를 90° 돌려요. 돌렸을 때 손가락 좌표도 같이 바꿔요. */
const ROT = { on: false };
function appPt(e) { return ROT.on ? { x: e.clientY, y: innerWidth - e.clientX } : { x: e.clientX, y: e.clientY }; }
function appRect(el) {
  const r = el.getBoundingClientRect(); if (!ROT.on) return r;
  return { left: r.top, top: innerWidth - r.right, width: r.height, height: r.width, right: r.bottom, bottom: innerWidth - r.left };
}
function layoutApp() {
  const app = document.getElementById('app'); if (!app) return;
  const coarse = matchMedia('(pointer:coarse)').matches;
  ROT.on = innerHeight > innerWidth && (coarse || innerWidth < 900);
  if (ROT.on) Object.assign(app.style, { width: innerHeight + 'px', height: innerWidth + 'px', left: innerWidth + 'px', top: '0px', transform: 'rotate(90deg)', transformOrigin: '0 0' });
  else Object.assign(app.style, { width: '', height: '', left: '0px', top: '0px', transform: '', transformOrigin: '' });
}
addEventListener('resize', layoutApp);
addEventListener('orientationchange', () => setTimeout(layoutApp, 250));
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const fmt = s => { s = Math.max(0, s); const m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1); };
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
}
function seeded(seed) { let s = 0; for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* ---------- 아이콘 ---------- */
const IC = {
  play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
  cam: '<path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
  onion: '<rect x="3" y="7" width="12" height="12" rx="2" opacity=".45"/><rect x="6" y="5" width="12" height="12" rx="2" opacity=".7"/><rect x="9" y="3" width="12" height="12" rx="2"/>',
  grid: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16M3 9.5h18M3 14.5h18"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  speaker: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  home: '<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  flip: '<path d="M12 3v18M8 7 3 12l5 5zM16 7l5 5-5 5z"/>',
  rotL: '<path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v5h5"/>',
  rotR: '<path d="M20 12a8 8 0 1 1-3-6.2"/><path d="M20 4v5h-5"/>',
  bigger: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8 11h6M11 8v6"/>',
  smaller: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8 11h6"/>',
  front: '<rect x="3" y="3" width="11" height="11" rx="2" opacity=".5"/><rect x="10" y="10" width="11" height="11" rx="2" fill="currentColor"/>',
  backL: '<rect x="10" y="10" width="11" height="11" rx="2" opacity=".5"/><rect x="3" y="3" width="11" height="11" rx="2" fill="currentColor"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.5 7.5 20 18M8.5 16.5 20 6"/>',
  book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-1 .2"/><path d="M20 4v14h-7"/>',
  sparkle: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  rewind: '<path d="M11 6 4 12l7 6zM20 6l-7 6 7 6z" fill="currentColor" stroke="none"/>',
  insert: '<path d="M12 4v16M4 8h4M4 16h4M16 8h4M16 16h4"/>'
};
const icon = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ''}</svg>`;
const ib = (n, label, cls = 'btn sm', attrs = {}) => h('button', { class: cls, type: 'button', ...attrs, html: icon(n) + (label ? `<span>${label}</span>` : '') , 'aria-label': attrs['aria-label'] || label || n });

/* 아르떼노바 공식 CI 로고 (100_ARTENOVA/brand/ci 에서 가져옴) */
const LOGO_STACK = "<svg class=\"logo\" role=\"img\" aria-label=\"ARTENOVA 아르떼노바\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"320 55 870 405\"><g id=\"symbol\"><path id=\"arte-A\" fill=\"#111111\" d=\"M643.500,79.500 L805.721,142.199 L770.660,167.243 L679.500,132.009 L679.500,253.786 L643.500,279.500 Z\"/><path id=\"nova-N\" fill=\"#CF5D2A\" d=\"M863.500,279.500 L701.279,216.801 L736.340,191.757 L827.500,226.991 L827.500,105.214 L863.500,79.500 Z\"/></g><g id=\"wordmark\"><path id=\"ARTE\" fill=\"#111111\" fill-rule=\"evenodd\" d=\"M376.17,341.67 L342.83,437.50 L365.17,437.50 L372.67,416.33 L406.17,416.33 L414.00,437.50 L436.50,437.50 L403.17,341.67 ZM389.33,365.50 L400.17,399.08 L378.33,399.08 ZM463.94,437.15C463.50,436.81 463.50,436.81 463.50,389.60C463.50,342.38 463.50,342.38 463.85,342.07C464.19,341.76 464.78,341.75 485.06,341.75C507.32,341.76 508.05,341.78 512.10,342.59C517.08,343.58 521.97,345.74 525.66,348.56C529.90,351.80 533.65,357.18 535.41,362.55C537.27,368.25 537.27,377.22 535.41,383.25C535.02,384.52 534.20,386.53 533.79,387.25C533.68,387.43 533.38,388.00 533.12,388.50C532.85,389.00 532.24,390.02 531.75,390.75C529.39,394.29 527.39,396.05 521.58,399.72C520.61,400.33 520.61,400.69 521.60,402.42C523.05,404.92 524.12,406.92 525.75,410.17C526.65,411.96 527.51,413.60 527.67,413.83C527.83,414.06 528.80,415.90 529.83,417.92C531.76,421.68 534.07,425.98 535.11,427.75C535.43,428.30 536.64,430.50 537.80,432.65C539.82,436.41 539.88,436.56 539.65,436.98C539.40,437.42 539.40,437.42 528.41,437.47C520.98,437.50 517.22,437.46 516.80,437.34C516.17,437.15 515.71,436.54 514.67,434.50C514.25,433.68 513.82,432.88 512.59,430.58C512.14,429.76 510.83,427.21 509.67,424.92C508.51,422.62 507.24,420.19 506.84,419.50C506.45,418.81 505.08,416.19 503.79,413.67C502.51,411.15 501.23,408.67 500.95,408.17C500.67,407.66 500.25,406.87 500.01,406.41C499.54,405.50 498.87,404.49 498.59,404.29C498.50,404.23 495.60,404.17 492.16,404.17C487.40,404.17 485.83,404.22 485.63,404.38C485.39,404.56 485.35,406.12 485.30,420.73C485.24,436.87 485.24,436.87 484.85,437.19C484.48,437.49 484.01,437.50 474.42,437.50C464.51,437.50 464.37,437.50 463.94,437.15ZM503.47,386.10C507.73,385.46 511.32,382.91 513.25,379.17C513.91,377.87 514.49,375.52 514.61,373.65C514.70,372.27 514.65,371.77 514.25,369.99C513.15,365.14 510.62,362.24 506.12,360.69C503.72,359.86 502.68,359.78 494.01,359.81C489.66,359.82 485.96,359.88 485.80,359.93C485.63,359.98 485.47,360.19 485.42,360.39C485.28,361.07 485.21,385.41 485.35,385.80C485.43,386.00 485.66,386.25 485.87,386.34C486.50,386.61 501.39,386.41 503.47,386.10ZM562.33,341.67 L562.33,360.00 L590.58,360.00 L590.58,437.50 L611.58,437.50 L611.58,359.92 L640.08,359.92 L640.08,341.67 ZM669.58,341.67 L669.58,437.50 L735.25,437.50 L735.25,419.00 L691.08,419.00 L691.08,397.92 L731.00,397.92 L731.58,396.67 L731.58,380.00 L691.17,380.00 L691.17,359.83 L734.75,359.83 L734.75,341.67 Z\"/><path id=\"NOVA\" fill=\"#CF5D2A\" fill-rule=\"evenodd\" d=\"M766.17,341.67 L766.17,437.50 L787.58,437.50 L787.58,380.50 L827.33,437.50 L845.42,437.50 L845.42,341.67 L824.00,341.67 L824.00,398.17 L785.00,341.67 ZM910.75,438.84C907.36,438.59 903.03,437.84 899.50,436.89C896.58,436.10 892.02,434.09 889.80,432.61C887.74,431.24 884.73,428.90 883.35,427.58C881.65,425.96 878.85,422.81 877.81,421.33C873.37,415.04 870.32,406.01 869.34,396.19C869.08,393.58 869.12,386.56 869.42,383.70C870.44,373.98 871.52,370.01 875.04,363.08C876.06,361.08 877.62,358.50 878.58,357.25C879.34,356.25 882.69,352.52 883.61,351.65C885.19,350.14 887.68,348.31 889.83,347.08C890.34,346.79 891.27,346.25 891.92,345.88C894.61,344.33 898.35,342.87 901.75,342.02C910.22,339.91 922.43,340.31 929.46,342.93C937.16,345.80 944.42,351.04 948.86,356.92C950.74,359.41 953.02,363.40 954.29,366.42C957.30,373.59 959.00,384.21 958.50,392.67C958.18,397.94 957.98,399.46 956.89,405.06C956.50,407.12 955.32,411.00 954.66,412.42C950.86,420.64 947.21,425.61 941.92,429.75C940.15,431.13 937.42,432.94 935.67,433.89C932.17,435.77 926.54,437.56 921.92,438.25C921.00,438.38 919.84,438.56 919.33,438.65C917.97,438.88 912.84,438.99 910.75,438.84ZM919.54,419.11C920.43,418.87 921.39,418.56 921.68,418.41C921.97,418.26 922.48,418.04 922.81,417.92C923.62,417.64 926.48,415.83 927.85,414.73C930.03,413.00 932.58,409.09 934.10,405.14C937.35,396.73 937.27,381.73 933.94,373.92C932.27,370.00 931.12,368.19 928.78,365.72C927.26,364.12 925.80,363.03 923.83,362.02C920.75,360.44 917.76,359.74 914.25,359.77C902.61,359.88 894.75,366.68 891.93,379.08C891.25,382.08 891.09,384.15 891.09,390.00C891.09,395.82 891.23,397.66 891.94,400.67C892.97,405.06 894.97,409.26 897.55,412.46C899.06,414.33 902.57,416.93 904.86,417.85C905.48,418.11 906.13,418.39 906.32,418.49C906.50,418.59 907.57,418.89 908.70,419.16C910.71,419.65 910.83,419.66 914.33,419.60C917.52,419.54 918.09,419.49 919.54,419.11ZM972.83,341.67 L1005.00,437.50 L1031.67,437.50 L1064.00,341.67 L1041.17,341.67 L1018.50,411.67 L996.00,341.67 ZM1104.50,341.67 L1070.83,437.50 L1092.83,437.50 L1101.00,416.33 L1133.67,416.33 L1141.83,437.50 L1164.33,437.50 L1131.17,341.67 ZM1117.50,366.00 L1128.33,398.92 L1106.83,398.92 Z\"/></g></svg>";
const LOGO_H = "<svg role=\"img\" aria-label=\"ARTENOVA\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"173.16 317.67 1015.01 145.13\"><g id=\"symbol\"><path id=\"arte-A\" fill=\"#111111\" d=\"M197.163,341.667 L274.894,371.710 L258.094,383.710 L214.413,366.827 L214.413,425.179 L197.163,437.500 Z\"/><path id=\"nova-N\" fill=\"#CF5D2A\" d=\"M302.580,437.500 L224.849,407.457 L241.649,395.456 L285.330,412.339 L285.330,353.988 L302.580,341.667 Z\"/></g><g id=\"wordmark\"><path id=\"ARTE\" fill=\"#111111\" fill-rule=\"evenodd\" d=\"M376.17,341.67 L342.83,437.50 L365.17,437.50 L372.67,416.33 L406.17,416.33 L414.00,437.50 L436.50,437.50 L403.17,341.67 ZM389.33,365.50 L400.17,399.08 L378.33,399.08 ZM463.94,437.15C463.50,436.81 463.50,436.81 463.50,389.60C463.50,342.38 463.50,342.38 463.85,342.07C464.19,341.76 464.78,341.75 485.06,341.75C507.32,341.76 508.05,341.78 512.10,342.59C517.08,343.58 521.97,345.74 525.66,348.56C529.90,351.80 533.65,357.18 535.41,362.55C537.27,368.25 537.27,377.22 535.41,383.25C535.02,384.52 534.20,386.53 533.79,387.25C533.68,387.43 533.38,388.00 533.12,388.50C532.85,389.00 532.24,390.02 531.75,390.75C529.39,394.29 527.39,396.05 521.58,399.72C520.61,400.33 520.61,400.69 521.60,402.42C523.05,404.92 524.12,406.92 525.75,410.17C526.65,411.96 527.51,413.60 527.67,413.83C527.83,414.06 528.80,415.90 529.83,417.92C531.76,421.68 534.07,425.98 535.11,427.75C535.43,428.30 536.64,430.50 537.80,432.65C539.82,436.41 539.88,436.56 539.65,436.98C539.40,437.42 539.40,437.42 528.41,437.47C520.98,437.50 517.22,437.46 516.80,437.34C516.17,437.15 515.71,436.54 514.67,434.50C514.25,433.68 513.82,432.88 512.59,430.58C512.14,429.76 510.83,427.21 509.67,424.92C508.51,422.62 507.24,420.19 506.84,419.50C506.45,418.81 505.08,416.19 503.79,413.67C502.51,411.15 501.23,408.67 500.95,408.17C500.67,407.66 500.25,406.87 500.01,406.41C499.54,405.50 498.87,404.49 498.59,404.29C498.50,404.23 495.60,404.17 492.16,404.17C487.40,404.17 485.83,404.22 485.63,404.38C485.39,404.56 485.35,406.12 485.30,420.73C485.24,436.87 485.24,436.87 484.85,437.19C484.48,437.49 484.01,437.50 474.42,437.50C464.51,437.50 464.37,437.50 463.94,437.15ZM503.47,386.10C507.73,385.46 511.32,382.91 513.25,379.17C513.91,377.87 514.49,375.52 514.61,373.65C514.70,372.27 514.65,371.77 514.25,369.99C513.15,365.14 510.62,362.24 506.12,360.69C503.72,359.86 502.68,359.78 494.01,359.81C489.66,359.82 485.96,359.88 485.80,359.93C485.63,359.98 485.47,360.19 485.42,360.39C485.28,361.07 485.21,385.41 485.35,385.80C485.43,386.00 485.66,386.25 485.87,386.34C486.50,386.61 501.39,386.41 503.47,386.10ZM562.33,341.67 L562.33,360.00 L590.58,360.00 L590.58,437.50 L611.58,437.50 L611.58,359.92 L640.08,359.92 L640.08,341.67 ZM669.58,341.67 L669.58,437.50 L735.25,437.50 L735.25,419.00 L691.08,419.00 L691.08,397.92 L731.00,397.92 L731.58,396.67 L731.58,380.00 L691.17,380.00 L691.17,359.83 L734.75,359.83 L734.75,341.67 Z\"/><path id=\"NOVA\" fill=\"#CF5D2A\" fill-rule=\"evenodd\" d=\"M766.17,341.67 L766.17,437.50 L787.58,437.50 L787.58,380.50 L827.33,437.50 L845.42,437.50 L845.42,341.67 L824.00,341.67 L824.00,398.17 L785.00,341.67 ZM910.75,438.84C907.36,438.59 903.03,437.84 899.50,436.89C896.58,436.10 892.02,434.09 889.80,432.61C887.74,431.24 884.73,428.90 883.35,427.58C881.65,425.96 878.85,422.81 877.81,421.33C873.37,415.04 870.32,406.01 869.34,396.19C869.08,393.58 869.12,386.56 869.42,383.70C870.44,373.98 871.52,370.01 875.04,363.08C876.06,361.08 877.62,358.50 878.58,357.25C879.34,356.25 882.69,352.52 883.61,351.65C885.19,350.14 887.68,348.31 889.83,347.08C890.34,346.79 891.27,346.25 891.92,345.88C894.61,344.33 898.35,342.87 901.75,342.02C910.22,339.91 922.43,340.31 929.46,342.93C937.16,345.80 944.42,351.04 948.86,356.92C950.74,359.41 953.02,363.40 954.29,366.42C957.30,373.59 959.00,384.21 958.50,392.67C958.18,397.94 957.98,399.46 956.89,405.06C956.50,407.12 955.32,411.00 954.66,412.42C950.86,420.64 947.21,425.61 941.92,429.75C940.15,431.13 937.42,432.94 935.67,433.89C932.17,435.77 926.54,437.56 921.92,438.25C921.00,438.38 919.84,438.56 919.33,438.65C917.97,438.88 912.84,438.99 910.75,438.84ZM919.54,419.11C920.43,418.87 921.39,418.56 921.68,418.41C921.97,418.26 922.48,418.04 922.81,417.92C923.62,417.64 926.48,415.83 927.85,414.73C930.03,413.00 932.58,409.09 934.10,405.14C937.35,396.73 937.27,381.73 933.94,373.92C932.27,370.00 931.12,368.19 928.78,365.72C927.26,364.12 925.80,363.03 923.83,362.02C920.75,360.44 917.76,359.74 914.25,359.77C902.61,359.88 894.75,366.68 891.93,379.08C891.25,382.08 891.09,384.15 891.09,390.00C891.09,395.82 891.23,397.66 891.94,400.67C892.97,405.06 894.97,409.26 897.55,412.46C899.06,414.33 902.57,416.93 904.86,417.85C905.48,418.11 906.13,418.39 906.32,418.49C906.50,418.59 907.57,418.89 908.70,419.16C910.71,419.65 910.83,419.66 914.33,419.60C917.52,419.54 918.09,419.49 919.54,419.11ZM972.83,341.67 L1005.00,437.50 L1031.67,437.50 L1064.00,341.67 L1041.17,341.67 L1018.50,411.67 L996.00,341.67 ZM1104.50,341.67 L1070.83,437.50 L1092.83,437.50 L1101.00,416.33 L1133.67,416.33 L1141.83,437.50 L1164.33,437.50 L1131.17,341.67 ZM1117.50,366.00 L1128.33,398.92 L1106.83,398.92 Z\"/></g></svg>";
const LOGO_SYMBOL = "<svg aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"623.5 59.5 260.0 240.0\"><path id=\"arte-A\" fill=\"#111111\" d=\"M643.500,79.500 L805.721,142.199 L770.660,167.243 L679.500,132.009 L679.500,253.786 L643.500,279.500 Z\"/><path id=\"nova-N\" fill=\"#CF5D2A\" d=\"M863.500,279.500 L701.279,216.801 L736.340,191.757 L827.500,226.991 L827.500,105.214 L863.500,79.500 Z\"/></svg>";
function logoSVG() { return LOGO_SYMBOL; }
function brandHTML(full = true) {
  return full ? `${LOGO_H}<span class="divider"></span><b>${BRAND.short}</b>` : LOGO_SYMBOL;
}

/* ---------- 토스트 & 모달 ---------- */
let toastT;
function toast(msg, ms = 2400, top = false) {
  $$('.toast').forEach(t => t.remove());
  const t = h('div', { class: 'toast' + (top ? ' top' : ''), role: 'status' }, msg);
  ($('#app') || document.body).append(t); clearTimeout(toastT); toastT = setTimeout(() => t.remove(), ms);
}
function modal(build, { wide = false, close = true } = {}) {
  const bg = h('div', { class: 'modal-bg' });
  const box = h('div', { class: 'modal' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true' });
  bg.append(box); $('#modals').append(bg);
  const api = { close() { bg.remove(); api.onclose && api.onclose(); }, box };
  if (close) bg.addEventListener('pointerdown', e => { if (e.target === bg) api.close(); });
  build(box, api);
  setTimeout(() => { const f = box.querySelector('input,textarea,select'); f && f.focus(); }, 60);
  return api;
}
function confirmBox(title, text, okLabel = '확인', danger = false) {
  return new Promise(res => {
    modal((b, m) => {
      b.append(h('h2', {}, title), h('p', { class: 'hint', style: { fontSize: '15px', margin: 0 } }, text),
        h('div', { class: 'acts' },
          h('button', { class: 'btn', onclick: () => { m.close(); res(false); } }, '취소'),
          h('button', { class: 'btn ' + (danger ? 'rec' : 'primary'), onclick: () => { m.close(); res(true); } }, okLabel)));
    });
  });
}

/* ---------- 전래동화 목록 ---------- */
const TALES = [
  { id: 'byeoljubu', title: '별주부전', sub: '자라와 꾀 많은 토끼', on: true, c: '#2bb59b' },
  { id: 'heungbu', title: '흥부와 놀부', sub: '제비 다리와 박씨', c: '#f5b81c' },
  { id: 'haenim', title: '해님 달님', sub: '오누이와 호랑이', c: '#e8523f' },
  { id: 'kongjwi', title: '콩쥐 팥쥐', sub: '두꺼비가 도와준 콩쥐', c: '#a27be8' },
  { id: 'hokburi', title: '혹부리 영감', sub: '노래 좋아하는 도깨비', c: '#5aa8ea' },
  { id: 'seonnyeo', title: '선녀와 나무꾼', sub: '날개옷과 사슴', c: '#f08fb0' },
  { id: 'geumdokki', title: '금도끼 은도끼', sub: '정직한 나무꾼', c: '#f5b81c' },
  { id: 'gyeonu', title: '견우와 직녀', sub: '오작교에서 만나요', c: '#5aa8ea' },
  { id: 'kkachi', title: '은혜 갚은 까치', sub: '종을 울린 까치', c: '#2bb59b' },
  { id: 'patjuk', title: '팥죽 할멈과 호랑이', sub: '알밤·자라·멍석의 도움', c: '#e8523f' },
  { id: 'simcheong', title: '심청전', sub: '효녀 심청과 연꽃', c: '#f08fb0' },
  { id: 'brothers', title: '의좋은 형제', sub: '한밤의 볏단 나르기', c: '#f5b81c' },
  { id: 'dokkaebi', title: '도깨비 방망이', sub: '금 나와라 뚝딱', c: '#a27be8' },
  { id: 'frog', title: '청개구리', sub: '거꾸로만 하는 아이', c: '#2bb59b' },
  { id: 'ureong', title: '우렁각시', sub: '우렁이 속 아가씨', c: '#5aa8ea' }
];

/* 별주부전 — 오리지널 장면·대사 */
const ORIGINAL_SCENES = ['아픈 용왕님', '토끼 간이 약이래요', '자라, 육지로 떠나다', '토끼를 만나다', '함께 용궁으로', '토끼의 꾀', '도망친 토끼'];
const CHAR_COLORS = { '용왕': '#F2C14E', '문어 의원': '#F3A6BE', '자라': '#9BCB8A', '토끼': '#E6E6DF', '해설': '#F2C4AC' };
const ORIGINAL_SCRIPT = [
  { who: '해설', text: '깊고 푸른 바닷속 용궁에 용왕님이 살고 있었어요.', scene: 0 },
  { who: '용왕', text: '아이고, 몸이 아파 죽겠구나. 누가 나를 좀 살려 다오.', scene: 0 },
  { who: '문어 의원', text: '용왕님, 육지에 사는 토끼의 간을 드셔야 병이 낫습니다.', scene: 1 },
  { who: '자라', text: '제가 육지로 가서 토끼를 꼭 데려오겠습니다!', scene: 2 },
  { who: '자라', text: '토끼님, 용궁에 가면 높은 벼슬과 맛있는 음식이 기다린답니다.', scene: 3 },
  { who: '토끼', text: '정말요? 그럼 나도 용궁 구경 한번 가 볼까?', scene: 3 },
  { who: '자라', text: '자, 제 등에 꼭 타세요. 바닷속으로 출발!', scene: 4 },
  { who: '용왕', text: '토끼야, 네 간을 어서 내어 놓아라!', scene: 5 },
  { who: '토끼', text: '아이고, 용왕님! 제 간은 육지 바위 밑에 꺼내 두고 왔는걸요.', scene: 5 },
  { who: '용왕', text: '그렇다면 얼른 가서 간을 가져오너라.', scene: 5 },
  { who: '토끼', text: '하하, 간을 빼놓고 다니는 동물이 어디 있니? 잘 있어라, 자라야!', scene: 6 },
  { who: '자라', text: '아이고, 토끼에게 감쪽같이 속았구나!', scene: 6 }
];

/* ---------- 저장소 (브라우저 IndexedDB) ---------- */
const DB = {
  _db: null,
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((res, rej) => {
      try {
        const r = indexedDB.open('artenova-anistudio', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('projects', { keyPath: 'id' });
        r.onsuccess = () => { this._db = r.result; res(this._db); };
        r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    });
  },
  async tx(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const t = db.transaction('projects', mode); const st = t.objectStore('projects');
      const out = fn(st); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error);
    });
  },
  put(obj) { return this.tx('readwrite', st => st.put(obj)); },
  get(id) { return this.tx('readonly', st => st.get(id)); },
  del(id) { return this.tx('readwrite', st => st.delete(id)); },
  all() { return this.tx('readonly', st => st.getAll()); }
};

/* =========================================================
   컷아웃 그림 도구 — 원작 애니와 '컷아웃 무대'가 같이 씀
   ========================================================= */
const INK = '#1e1a2c';
function paperShadow(ctx, on = true) {
  ctx.shadowColor = on ? 'rgba(0,0,0,.33)' : 'transparent';
  ctx.shadowOffsetX = on ? 2 : 0; ctx.shadowOffsetY = on ? 4 : 0; ctx.shadowBlur = on ? 3 : 0;
}
function fillPath(ctx, fill, path, stroke = INK, lw = 4) {
  ctx.beginPath(); path(); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { const s = ctx.shadowColor; ctx.shadowColor = 'transparent'; ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); ctx.shadowColor = s; }
}
const E = (ctx, x, y, rx, ry, r = 0) => () => ctx.ellipse(x, y, rx, ry, r, 0, Math.PI * 2);
function eye(ctx, x, y, r, look = 1, closed = false) {
  paperShadow(ctx, false);
  if (closed) { ctx.beginPath(); ctx.arc(x, y - r * .2, r * .9, .15 * Math.PI, .85 * Math.PI); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); return; }
  fillPath(ctx, '#fff', E(ctx, x, y, r, r * 1.1), INK, 2.5);
  fillPath(ctx, INK, E(ctx, x + r * .3 * look, y + r * .1, r * .5, r * .55), null);
  fillPath(ctx, '#fff', E(ctx, x + r * .45 * look, y - r * .15, r * .18, r * .18), null);
}

const CHARS = {
  turtle: { name: '자라', r: 105, draw(ctx, t = 0, o = {}) {
    const sw = Math.sin(t * 6) * .45;
    paperShadow(ctx);
    fillPath(ctx, '#3f7f48', E(ctx, -52, 30, 28, 11, .5 + sw));               // 뒷발(먼 쪽)
    fillPath(ctx, '#7fb86d', () => { ctx.moveTo(-82, 12); ctx.lineTo(-108, 22); ctx.lineTo(-80, 26); ctx.closePath(); });
    fillPath(ctx, '#7fb86d', E(ctx, 52, 34, 30, 11, -.35 - sw));              // 앞발(먼 쪽)
    fillPath(ctx, '#e2c46e', E(ctx, 0, 22, 92, 14));                           // 배딱지
    fillPath(ctx, '#4f9a55', () => { ctx.ellipse(0, 20, 88, 66, 0, Math.PI, Math.PI * 2); ctx.closePath(); }); // 등딱지
    paperShadow(ctx, false);
    ctx.strokeStyle = '#2e6b39'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i; const x = Math.cos(a) * 22, y = -14 + Math.sin(a) * 18; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-22, -14); ctx.lineTo(-60, -6); ctx.moveTo(22, -14); ctx.lineTo(60, -6); ctx.moveTo(-11, 2); ctx.lineTo(-24, 18); ctx.moveTo(11, 2); ctx.lineTo(24, 18); ctx.moveTo(0, -32); ctx.lineTo(0, -44); ctx.stroke();
    paperShadow(ctx);
    fillPath(ctx, '#86bf74', E(ctx, 88, 4, 30, 14, -.45));                    // 목
    fillPath(ctx, '#8fc77c', E(ctx, 116, -18, 28, 21, -.1));                  // 머리
    fillPath(ctx, '#2a2a36', () => { ctx.ellipse(112, -36, 18, 10, -.1, Math.PI, Math.PI * 2); ctx.closePath(); }); // 관모
    fillPath(ctx, '#2a2a36', E(ctx, 94, -36, 10, 4, .3), INK, 2);
    fillPath(ctx, '#2a2a36', E(ctx, 131, -40, 10, 4, -.3), INK, 2);
    eye(ctx, 124, -22, 7, 1, o.closed);
    paperShadow(ctx, false); ctx.beginPath(); ctx.arc(130, -10, 9, .1, 1.1); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    paperShadow(ctx);
    fillPath(ctx, '#a0d48c', E(ctx, -48, 36, 28, 12, .3 - sw));               // 뒷발
    fillPath(ctx, '#a0d48c', E(ctx, 58, 38, 32, 12, -.25 + sw));              // 앞발
  } },
  rabbit: { name: '토끼', r: 95, draw(ctx, t = 0, o = {}) {
    const ear = Math.sin(t * 5) * .08;
    paperShadow(ctx);
    fillPath(ctx, '#e9e2d4', E(ctx, 30, -98, 11, 36, -.3 + ear));             // 먼 귀
    fillPath(ctx, '#fff', E(ctx, -58, -2, 15, 15), INK, 3.5);                  // 꼬리
    fillPath(ctx, '#f7f3ea', E(ctx, -6, 6, 60, 43));                           // 몸
    fillPath(ctx, '#f1ebdd', E(ctx, -26, 40, 32, 13, .05));                    // 뒷발
    fillPath(ctx, '#f7f3ea', E(ctx, 50, -40, 31, 29));                         // 머리
    fillPath(ctx, '#f7f3ea', E(ctx, 50, -102, 12, 38, .12 + ear));             // 귀
    paperShadow(ctx, false);
    fillPath(ctx, '#f3a7b5', E(ctx, 51, -100, 5.5, 27, .12 + ear), null);
    eye(ctx, 62, -46, 5.5, 1, o.closed);
    fillPath(ctx, '#f39aac', E(ctx, 79, -36, 4.5, 3.5), INK, 2);
    fillPath(ctx, 'rgba(246,160,180,.6)', E(ctx, 63, -28, 8, 4.5), null);
    ctx.beginPath(); ctx.moveTo(78, -32); ctx.quadraticCurveTo(75, -24, 70, -25); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
    if (o.laugh) { ctx.beginPath(); ctx.arc(72, -27, 6, .2, Math.PI - .2); ctx.fillStyle = '#c0394f'; ctx.fill(); ctx.stroke(); }
    paperShadow(ctx);
    fillPath(ctx, '#f1ebdd', E(ctx, 40, 42, 15, 9));                           // 앞발
  } },
  king: { name: '용왕', r: 140, draw(ctx, t = 0, o = {}) {
    const sick = !!o.sick, sway = Math.sin(t * 2) * .03;
    ctx.rotate(sway);
    paperShadow(ctx);
    fillPath(ctx, '#a82c33', E(ctx, -80, 12, 28, 52, .35));
    fillPath(ctx, '#a82c33', E(ctx, 80, 12, 28, 52, -.35));
    fillPath(ctx, '#c4363a', () => { ctx.moveTo(-58, -42); ctx.lineTo(58, -42); ctx.lineTo(92, 118); ctx.lineTo(-92, 118); ctx.closePath(); });
    fillPath(ctx, '#f2c14e', () => { ctx.moveTo(-18, -42); ctx.lineTo(0, -10); ctx.lineTo(18, -42); }, INK, 3);
    fillPath(ctx, '#f2c14e', E(ctx, 0, 14, 25, 25), INK, 3);
    paperShadow(ctx, false);
    ctx.beginPath(); ctx.arc(0, 14, 14, 0, Math.PI * 1.5); ctx.lineWidth = 3; ctx.strokeStyle = '#a82c33'; ctx.stroke();
    paperShadow(ctx);
    fillPath(ctx, '#2c2c5e', () => ctx.roundRect(-70, 52, 140, 14, 6), INK, 3);
    fillPath(ctx, '#f0c49c', E(ctx, -96, 60, 13, 13));
    fillPath(ctx, '#f0c49c', E(ctx, 96, 60, 13, 13));
    // 뿔
    fillPath(ctx, '#e2b13c', () => { ctx.moveTo(-20, -112); ctx.lineTo(-40, -158); ctx.lineTo(-30, -140); ctx.lineTo(-52, -146); ctx.lineTo(-28, -126); ctx.lineTo(-10, -114); ctx.closePath(); }, INK, 3);
    fillPath(ctx, '#e2b13c', () => { ctx.moveTo(20, -112); ctx.lineTo(40, -158); ctx.lineTo(30, -140); ctx.lineTo(52, -146); ctx.lineTo(28, -126); ctx.lineTo(10, -114); ctx.closePath(); }, INK, 3);
    fillPath(ctx, sick ? '#d9d6a6' : '#f0c49c', E(ctx, 0, -80, 38, 40));       // 얼굴
    fillPath(ctx, '#1f1f2b', () => { ctx.ellipse(0, -104, 36, 26, 0, Math.PI, Math.PI * 2); ctx.closePath(); }, INK, 3); // 익선관
    fillPath(ctx, '#1f1f2b', E(ctx, -34, -122, 9, 15, -.5), INK, 2.5);
    fillPath(ctx, '#1f1f2b', E(ctx, 34, -122, 9, 15, .5), INK, 2.5);
    if (sick) fillPath(ctx, '#f6f6f6', () => ctx.roundRect(-34, -100, 68, 12, 4), INK, 2.5);
    eye(ctx, -14, -82, 6, 0, sick);
    eye(ctx, 14, -82, 6, 0, sick);
    paperShadow(ctx, false);
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); if (o.angry) { ctx.moveTo(-24, -96); ctx.lineTo(-6, -90); ctx.moveTo(24, -96); ctx.lineTo(6, -90); } else { ctx.moveTo(-22, -94); ctx.lineTo(-8, -96); ctx.moveTo(22, -94); ctx.lineTo(8, -96); } ctx.stroke();
    // 수염
    const w = Math.sin(t * 3) * 6;
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(-8, -66); ctx.bezierCurveTo(-40, -60, -54, -40 + w, -78, -48 + w); ctx.moveTo(8, -66); ctx.bezierCurveTo(40, -60, 54, -40 - w, 78, -48 - w); ctx.stroke();
    paperShadow(ctx);
    fillPath(ctx, '#f4f1ea', () => { ctx.moveTo(-18, -52); ctx.quadraticCurveTo(0, -46, 18, -52); ctx.quadraticCurveTo(12, -20, 0, 2); ctx.quadraticCurveTo(-12, -20, -18, -52); }, INK, 3);
    paperShadow(ctx, false);
    if (sick) { fillPath(ctx, '#8ad0f5', () => { ctx.moveTo(30, -96); ctx.quadraticCurveTo(40, -80, 32, -76); ctx.quadraticCurveTo(24, -80, 30, -96); }, INK, 2); }
    ctx.beginPath(); if (sick) ctx.arc(0, -56, 7, 1.1 * Math.PI, 1.9 * Math.PI); else ctx.arc(0, -62, 7, .15 * Math.PI, .85 * Math.PI);
    ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  } },
  octopus: { name: '문어 의원', r: 100, draw(ctx, t = 0) {
    paperShadow(ctx);
    for (let i = 0; i < 8; i++) {
      const x0 = -44 + i * 12.5, dir = i < 4 ? -1 : 1, ph = t * 3 + i;
      ctx.beginPath(); ctx.moveTo(x0, 0);
      ctx.bezierCurveTo(x0 + dir * 10, 30, x0 + dir * (24 + Math.sin(ph) * 10), 60, x0 + dir * (40 + Math.sin(ph) * 14), 70 + Math.cos(ph) * 6);
      ctx.lineCap = 'round'; ctx.lineWidth = 17; ctx.strokeStyle = INK; ctx.stroke();
      ctx.shadowColor = 'transparent'; ctx.lineWidth = 11; ctx.strokeStyle = i % 2 ? '#d9668f' : '#e27aa0'; ctx.stroke(); paperShadow(ctx);
    }
    fillPath(ctx, '#e27aa0', E(ctx, 0, -40, 50, 54));
    paperShadow(ctx, false);
    fillPath(ctx, 'rgba(255,255,255,.25)', E(ctx, -18, -66, 12, 8, -.5), null);
    eye(ctx, -17, -32, 11, .4); eye(ctx, 17, -32, 11, .4);
    fillPath(ctx, '#c0394f', E(ctx, 0, -6, 6, 5), INK, 2.5);
    paperShadow(ctx);
    fillPath(ctx, 'rgba(28,28,36,.82)', E(ctx, 0, -88, 64, 11));              // 갓 챙
    fillPath(ctx, '#1c1c24', () => ctx.roundRect(-22, -126, 44, 38, 8));
    paperShadow(ctx, false);
    ctx.beginPath(); ctx.moveTo(-40, -84); ctx.quadraticCurveTo(-46, -40, -36, -20); ctx.moveTo(40, -84); ctx.quadraticCurveTo(46, -40, 36, -20); ctx.lineWidth = 2; ctx.strokeStyle = '#1c1c24'; ctx.stroke();
  } },
  fish: { name: '물고기', r: 60, draw(ctx, t = 0) {
    const w = Math.sin(t * 8) * 8;
    paperShadow(ctx);
    fillPath(ctx, '#f08a24', () => { ctx.moveTo(-36, 0); ctx.lineTo(-72, -24 + w); ctx.lineTo(-64, 0); ctx.lineTo(-72, 24 + w); ctx.closePath(); });
    fillPath(ctx, '#f6a33a', E(ctx, 0, 0, 48, 28));
    paperShadow(ctx, false);
    ctx.strokeStyle = '#d06a12'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-6, -24); ctx.quadraticCurveTo(2, 0, -6, 24); ctx.moveTo(-22, -20); ctx.quadraticCurveTo(-14, 0, -22, 20); ctx.stroke();
    eye(ctx, 26, -6, 7);
    fillPath(ctx, '#f08a24', () => { ctx.moveTo(0, -26); ctx.lineTo(16, -44); ctx.lineTo(22, -24); ctx.closePath(); }, INK, 3);
  } },
  seaweed: { name: '해초', r: 90, draw(ctx, t = 0) {
    paperShadow(ctx);
    [[-22, '#2f8f5a', 170], [4, '#3fae6a', 200], [28, '#2a7a4e', 150]].forEach(([x, c, L], i) => {
      ctx.beginPath(); ctx.moveTo(x, 80);
      for (let y = 0; y <= L; y += 10) ctx.lineTo(x + Math.sin(y / 26 + t * 2 + i) * 14 * (y / L), 80 - y);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 20; ctx.strokeStyle = INK; ctx.stroke();
      ctx.shadowColor = 'transparent'; ctx.lineWidth = 14; ctx.strokeStyle = c; ctx.stroke(); paperShadow(ctx);
    });
  } },
  coral: { name: '산호', r: 80, draw(ctx) {
    paperShadow(ctx);
    const br = (x, y, a, l, d) => { if (d > 3) return; const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; ctx.moveTo(x, y); ctx.lineTo(x2, y2); br(x2, y2, a - .5, l * .7, d + 1); br(x2, y2, a + .45, l * .65, d + 1); };
    ctx.beginPath(); br(0, 70, -Math.PI / 2, 60, 0); ctx.lineCap = 'round'; ctx.lineWidth = 20; ctx.strokeStyle = INK; ctx.stroke();
    ctx.shadowColor = 'transparent'; ctx.lineWidth = 13; ctx.strokeStyle = '#ef7b6a'; ctx.stroke();
  } },
  shell: { name: '조개', r: 50, draw(ctx) {
    paperShadow(ctx);
    fillPath(ctx, '#f6b9a2', () => { ctx.moveTo(0, 34); ctx.lineTo(-44, -4); ctx.quadraticCurveTo(0, -60, 44, -4); ctx.closePath(); });
    paperShadow(ctx, false); ctx.strokeStyle = '#c97a62'; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = -2; i <= 2; i++) { ctx.moveTo(0, 30); ctx.lineTo(i * 15, -24 + Math.abs(i) * 6); } ctx.stroke();
    fillPath(ctx, '#f6b9a2', () => ctx.roundRect(-12, 26, 24, 12, 4), INK, 3);
  } },
  rock: { name: '바위', r: 80, draw(ctx) {
    paperShadow(ctx);
    fillPath(ctx, '#8a8fa8', () => { ctx.moveTo(-90, 50); ctx.quadraticCurveTo(-96, -10, -50, -40); ctx.quadraticCurveTo(-10, -70, 30, -46); ctx.quadraticCurveTo(84, -30, 90, 50); ctx.closePath(); });
    paperShadow(ctx, false);
    fillPath(ctx, 'rgba(255,255,255,.18)', E(ctx, -30, -24, 26, 10, -.4), null);
  } },
  tree: { name: '나무', r: 110, draw(ctx, t = 0) {
    paperShadow(ctx);
    fillPath(ctx, '#8b5a33', () => { ctx.moveTo(-14, 120); ctx.lineTo(-10, 0); ctx.lineTo(10, 0); ctx.lineTo(16, 120); ctx.closePath(); });
    const s = Math.sin(t * 1.5) * 3;
    [[-40, -20, 46], [36, -24, 48], [0, -60, 56], [-20, -10, 40], [24, 0, 40]].forEach(([x, y, r], i) => fillPath(ctx, i % 2 ? '#4c9a4a' : '#5cb057', E(ctx, x + s, y, r, r * .9)));
  } },
  flower: { name: '꽃', r: 50, draw(ctx, t = 0) {
    paperShadow(ctx);
    ctx.beginPath(); ctx.moveTo(0, 60); ctx.quadraticCurveTo(8, 20, 0, -6); ctx.lineWidth = 6; ctx.strokeStyle = '#3f8f45'; ctx.stroke();
    fillPath(ctx, '#5cb057', E(ctx, 12, 30, 14, 6, -.5));
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + t * .5; fillPath(ctx, '#f08fb0', E(ctx, Math.cos(a) * 16, -14 + Math.sin(a) * 16, 12, 9, a), INK, 3); }
    fillPath(ctx, '#f5b81c', E(ctx, 0, -14, 9, 9), INK, 3);
  } },
  sun: { name: '해', r: 70, draw(ctx, t = 0) {
    paperShadow(ctx);
    ctx.save(); ctx.rotate(t * .4);
    for (let i = 0; i < 10; i++) { ctx.rotate(Math.PI / 5); fillPath(ctx, '#ffb627', () => { ctx.moveTo(-9, -52); ctx.lineTo(0, -78); ctx.lineTo(9, -52); ctx.closePath(); }, INK, 3); }
    ctx.restore();
    fillPath(ctx, '#ffcf3a', E(ctx, 0, 0, 48, 48));
    eye(ctx, -14, -4, 5, 0, true); eye(ctx, 14, -4, 5, 0, true);
    paperShadow(ctx, false); ctx.beginPath(); ctx.arc(0, 10, 10, .15 * Math.PI, .85 * Math.PI); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  } },
  cloud: { name: '구름', r: 70, draw(ctx) {
    paperShadow(ctx);
    fillPath(ctx, '#fbfbff', () => { ctx.moveTo(-70, 20); ctx.arc(-44, 6, 26, Math.PI * .7, Math.PI * 1.6); ctx.arc(-6, -14, 34, Math.PI * 1.1, Math.PI * 1.9); ctx.arc(40, 2, 28, Math.PI * 1.3, Math.PI * .3); ctx.lineTo(-70, 30); ctx.closePath(); });
  } },
  palace: { name: '용궁', r: 150, draw(ctx) {
    paperShadow(ctx);
    fillPath(ctx, '#d8d3c4', () => ctx.rect(-150, 70, 300, 30));
    for (const x of [-110, -50, 10, 70, 120]) fillPath(ctx, '#c4363a', () => ctx.rect(x - 8, -10, 16, 82), INK, 3);
    fillPath(ctx, '#2c8a83', () => ctx.rect(-130, -24, 260, 18), INK, 3);
    fillPath(ctx, '#1f5d63', () => { ctx.moveTo(-180, -20); ctx.quadraticCurveTo(-120, -32, -110, -70); ctx.lineTo(110, -70); ctx.quadraticCurveTo(120, -32, 180, -20); ctx.quadraticCurveTo(0, -34, -180, -20); });
    fillPath(ctx, '#1f5d63', () => { ctx.moveTo(-120, -66); ctx.quadraticCurveTo(-70, -78, -60, -110); ctx.lineTo(60, -110); ctx.quadraticCurveTo(70, -78, 120, -66); ctx.closePath(); });
    fillPath(ctx, '#f2c14e', () => ctx.roundRect(-30, -60, 60, 26, 5), INK, 3);
    paperShadow(ctx, false);
    ctx.fillStyle = INK; ctx.font = '20px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('용궁', 0, -46);
  } }
};
const PIECE_ORDER = ['turtle', 'rabbit', 'king', 'octopus', 'fish', 'seaweed', 'coral', 'shell', 'rock', 'tree', 'flower', 'sun', 'cloud', 'palace'];
function drawChar(ctx, type, x, y, s = 1, opts = {}) {
  const c = CHARS[type]; if (!c) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(opts.rot || 0); ctx.scale((opts.flip ? -1 : 1) * s, s);
  c.draw(ctx, opts.t || 0, opts); ctx.restore();
}

/* ---------- 배경 ---------- */
const BGS = { sea: '바닷속', palace: '용궁', land: '육지 숲', shore: '바닷가', plain: '하얀 벽' };
function drawBG(ctx, type, t = 0) {
  ctx.save(); paperShadow(ctx, false);
  if (type === 'plain') { ctx.fillStyle = '#efe8d8'; ctx.fillRect(0, 0, W, H); ctx.restore(); return; }
  if (type === 'sea' || type === 'palace') {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a86c9'); g.addColorStop(.55, '#155a9c'); g.addColorStop(1, '#0b2d5e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = .12; ctx.fillStyle = '#fff';
    for (let i = 0; i < 5; i++) { const x = 120 + i * 190 + Math.sin(t * .6 + i) * 30; ctx.beginPath(); ctx.moveTo(x - 30, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x + 120, H); ctx.lineTo(x + 20, H); ctx.fill(); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0d3a6e';
    for (let i = 0; i < 9; i++) { const x = i * 120 + 40; ctx.beginPath(); ctx.moveTo(x, H); for (let y = 0; y < 150; y += 10) ctx.lineTo(x + Math.sin(y / 24 + t + i) * 10, H - 40 - y); ctx.lineTo(x + 12, H - 40); ctx.lineTo(x + 14, H); ctx.fill(); }
    if (type === 'palace') drawChar(ctx, 'palace', W / 2, 330, 1.25);
    ctx.fillStyle = '#d9c08a'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 470); for (let x = 0; x <= W; x += 40) ctx.quadraticCurveTo(x + 20, 455 + (x % 80 ? 8 : -6), x + 40, 468); ctx.lineTo(W, H); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (let i = 0; i < 18; i++) { const r = seeded('b' + i); const x = r() * W, sp = 30 + r() * 50, y = H - ((t * sp + r() * H) % H); const rad = 3 + r() * 6; ctx.beginPath(); ctx.arc(x + Math.sin(t * 2 + i) * 6, y, rad, 0, 7); ctx.fill(); }
  } else if (type === 'land' || type === 'shore') {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7cc8f0'); g.addColorStop(1, '#d6f0fb');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    drawChar(ctx, 'sun', 840, 90, .8, { t });
    drawChar(ctx, 'cloud', ((t * 18) % (W + 300)) - 100, 80, 1);
    drawChar(ctx, 'cloud', ((t * 12 + 520) % (W + 300)) - 100, 140, .7);
    if (type === 'land') {
      ctx.fillStyle = '#86c76f'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, 340); ctx.quadraticCurveTo(240, 230, 520, 330); ctx.quadraticCurveTo(760, 250, W, 320); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#5fae52'; ctx.beginPath(); ctx.moveTo(0, 420); ctx.quadraticCurveTo(300, 360, 600, 420); ctx.quadraticCurveTo(800, 450, W, 400); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill(); ctx.stroke();
      drawChar(ctx, 'tree', 120, 300, .9, { t }); drawChar(ctx, 'tree', 760, 280, .75, { t: t + 1 });
      drawChar(ctx, 'flower', 300, 470, .6, { t }); drawChar(ctx, 'flower', 660, 480, .5, { t: t + 2 });
    } else {
      ctx.fillStyle = '#e8d29a'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, 360); ctx.quadraticCurveTo(300, 330, 560, 380); ctx.lineTo(W, 420); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2f7fc1';
      ctx.beginPath(); ctx.moveTo(470, H); ctx.quadraticCurveTo(560, 400, W, 360); ctx.lineTo(W, H); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#d8efff'; ctx.lineWidth = 4;
      for (let i = 0; i < 4; i++) { const y = 420 + i * 28, o = Math.sin(t * 2 + i) * 14; ctx.beginPath(); ctx.moveTo(600 + i * 30 + o, y); ctx.quadraticCurveTo(650 + i * 30 + o, y - 10, 700 + i * 30 + o, y); ctx.stroke(); }
      ctx.fillStyle = '#6cba5a'; ctx.strokeStyle = INK;
      ctx.beginPath(); ctx.moveTo(0, 300); ctx.quadraticCurveTo(160, 270, 300, 330); ctx.lineTo(0, 360); ctx.closePath(); ctx.fill(); ctx.stroke();
      drawChar(ctx, 'tree', 90, 230, .7, { t });
      drawChar(ctx, 'rock', 380, 400, .55);
    }
  }
  ctx.restore();
}

/* =========================================================
   효과 (영상 위에 얹는 그림)
   ========================================================= */
const FX = [
  { id: 'sparkle', name: '반짝반짝' }, { id: 'bubbles', name: '보글보글' }, { id: 'hearts', name: '하트' },
  { id: 'boom', name: '쾅!' }, { id: 'speed', name: '집중선' }, { id: 'puff', name: '펑 연기' },
  { id: 'excl', name: '느낌표' }, { id: 'quest', name: '물음표' }, { id: 'sweat', name: '땀방울' },
  { id: 'light', name: '빛줄기' }, { id: 'rain', name: '비' }, { id: 'snow', name: '눈' },
  { id: 'dizzy', name: '어질어질' }, { id: 'text', name: '글자' }
];
const FULLSCREEN_FX = { rain: 1, snow: 1, light: 1 };
function drawFx(ctx, e, lt) {
  // lt: 0~dur 사이 경과 시간
  const x = e.x * W, y = e.y * H, s = e.s || 1, rnd = seeded(e.id || e.type), d = e.dur || 2;
  const inA = clamp(lt / .25, 0, 1), outA = clamp((d - lt) / .3, 0, 1), A = Math.min(inA, outA);
  ctx.save(); paperShadow(ctx, false); ctx.globalAlpha = A;
  switch (e.type) {
    case 'sparkle': {
      for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, r = 20 + rnd() * 70, tw = (Math.sin(lt * 7 + i * 1.7) + 1) / 2;
        star4(ctx, x + Math.cos(a) * r * s, y + Math.sin(a) * r * s, (6 + rnd() * 12) * s * (.3 + tw), i % 3 ? '#fff6b0' : '#ffd23f'); }
      break; }
    case 'bubbles': {
      ctx.lineWidth = 3 * s; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.fillStyle = 'rgba(200,235,255,.25)';
      for (let i = 0; i < 10; i++) { const bx = x + (rnd() - .5) * 90 * s, sp = 40 + rnd() * 60, r = (5 + rnd() * 11) * s; const yy = y - ((lt * sp + rnd() * 100) % 160) * s;
        ctx.beginPath(); ctx.arc(bx + Math.sin(lt * 3 + i) * 6 * s, yy, r, 0, 7); ctx.fill(); ctx.stroke(); }
      break; }
    case 'hearts': {
      for (let i = 0; i < 6; i++) { const hx = x + (rnd() - .5) * 110 * s, yy = y - ((lt * 50 + rnd() * 90) % 130) * s, k = (12 + rnd() * 10) * s;
        heart(ctx, hx + Math.sin(lt * 2 + i) * 8, yy, k, i % 2 ? '#ff6f91' : '#ff9fb4'); }
      break; }
    case 'boom': {
      const k = s * (1 + .15 * Math.sin(Math.min(lt, .4) * 20) * (1 - Math.min(lt / .4, 1))) * (lt < .15 ? lt / .15 : 1);
      ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(-.08);
      burst(ctx, 0, 0, 96, 60, 14, '#ffd23f'); burst(ctx, 0, 0, 70, 44, 14, '#ff7a3d', false);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.font = '52px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeText(e.text || '쾅!', 0, 4); ctx.fillText(e.text || '쾅!', 0, 4);
      break; }
    case 'speed': {
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < 40; i++) { const a = rnd() * 6.28, r0 = (110 + rnd() * 40) * s, len = (200 + rnd() * 300), j = Math.sin(lt * 30 + i) * 10;
        ctx.lineWidth = 2 + rnd() * 5; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (r0 + j), y + Math.sin(a) * (r0 + j)); ctx.lineTo(x + Math.cos(a) * (r0 + len), y + Math.sin(a) * (r0 + len)); ctx.stroke(); }
      break; }
    case 'puff': {
      const p = clamp(lt / .8, 0, 1);
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + rnd(), r = ease(p) * 70 * s; const pr = (26 - p * 10) * s;
        ctx.fillStyle = 'rgba(240,240,245,' + (1 - p * .7) + ')'; ctx.strokeStyle = 'rgba(30,26,44,' + (1 - p) + ')'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r * .7, pr, 0, 7); ctx.fill(); ctx.stroke(); }
      break; }
    case 'excl': case 'quest': {
      const b = Math.abs(Math.sin(lt * 6)) * 10 * s * (lt < 1 ? 1 : .4);
      ctx.translate(x, y - b); ctx.scale(s, s);
      ctx.font = '86px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.fillStyle = e.type === 'excl' ? '#ff5a4a' : '#ffd23f';
      const ch = e.type === 'excl' ? '!' : '?'; ctx.strokeText(ch, 0, 0); ctx.fillText(ch, 0, 0);
      break; }
    case 'sweat': {
      for (let i = 0; i < 3; i++) { const yy = y + ((lt * 60 + i * 20) % 50) * s; const xx = x + (i - 1) * 22 * s;
        ctx.fillStyle = '#8ad0f5'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xx, yy - 16 * s); ctx.quadraticCurveTo(xx + 11 * s, yy, xx, yy + 6 * s); ctx.quadraticCurveTo(xx - 11 * s, yy, xx, yy - 16 * s); ctx.fill(); ctx.stroke(); }
      break; }
    case 'light': {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) { const bx = x + (i - 2.5) * 70 * s + Math.sin(lt + i) * 20; const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,240,180,.35)'); g.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx - 14, 0); ctx.lineTo(bx + 14, 0); ctx.lineTo(bx + 60, H); ctx.lineTo(bx - 20, H); ctx.fill(); }
      break; }
    case 'rain': {
      ctx.strokeStyle = 'rgba(200,225,255,.7)'; ctx.lineWidth = 2;
      for (let i = 0; i < 90; i++) { const rx = rnd() * W * 1.2, sp = 600 + rnd() * 300, yy = (lt * sp + rnd() * H) % (H + 40) - 20; ctx.beginPath(); ctx.moveTo(rx - yy * .15, yy); ctx.lineTo(rx - yy * .15 - 5, yy + 18); ctx.stroke(); }
      ctx.fillStyle = 'rgba(40,60,100,.18)'; ctx.fillRect(0, 0, W, H);
      break; }
    case 'snow': {
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      for (let i = 0; i < 70; i++) { const sx = rnd() * W, sp = 30 + rnd() * 50, yy = (lt * sp + rnd() * H) % H, r = 2 + rnd() * 4; ctx.beginPath(); ctx.arc(sx + Math.sin(lt + i) * 14, yy, r, 0, 7); ctx.fill(); }
      break; }
    case 'dizzy': {
      ctx.translate(x, y); ctx.scale(s, s * .45);
      for (let i = 0; i < 4; i++) { const a = lt * 4 + i * Math.PI / 2; ctx.save(); ctx.scale(1, 1 / .45); star4(ctx, Math.cos(a) * 60, Math.sin(a) * 60 * .45, 12, '#ffd23f'); ctx.restore(); }
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, 60, 60, 0, 0, 7); ctx.stroke();
      break; }
    case 'text': {
      ctx.translate(x, y); ctx.scale(s, s); const tx = e.text || '앗!';
      ctx.font = '54px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(tx).width + 50;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(-w / 2, -42, w, 84, 40); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-20, 40); ctx.lineTo(-34, 70); ctx.lineTo(0, 41); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.fillText(tx, 0, 3);
      break; }
  }
  ctx.restore();
}
function star4(ctx, x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill(); }
function heart(ctx, x, y, k, c) { ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + k * .9); ctx.bezierCurveTo(x - k * 1.6, y - k * .2, x - k * .6, y - k * 1.3, x, y - k * .35); ctx.bezierCurveTo(x + k * .6, y - k * 1.3, x + k * 1.6, y - k * .2, x, y + k * .9); ctx.fill(); ctx.stroke(); }
function burst(ctx, x, y, R, r, n, c, stroke = true) { ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * 6.283, rr = i % 2 ? r : R; ctx.lineTo(x + Math.cos(a) * rr * 1.25, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); if (stroke) ctx.stroke(); }

/* =========================================================
   소리 — 효과음·배경음악을 앱 안에서 직접 만들어요 (파일 없이)
   ========================================================= */
const SFX = [
  { id: 'pop', name: '뽁', desc: '짠! 나타날 때' }, { id: 'boing', name: '뿅', desc: '깡충 뛸 때' },
  { id: 'boom', name: '쾅', desc: '부딪힐 때' }, { id: 'swoosh', name: '휘익', desc: '빠르게 지나갈 때' },
  { id: 'ding', name: '띠링', desc: '좋은 생각!' }, { id: 'sparkle', name: '반짝', desc: '마법·보물' },
  { id: 'drop', name: '똑', desc: '물방울' }, { id: 'bubbles', name: '보글보글', desc: '물속 거품' },
  { id: 'splash', name: '첨벙', desc: '물에 들어갈 때' }, { id: 'wave', name: '철썩', desc: '파도' },
  { id: 'steps', name: '깡충깡충', desc: '토끼 발걸음' }, { id: 'drum', name: '둥둥', desc: '북소리' },
  { id: 'gong', name: '징', desc: '용궁·등장' }, { id: 'fail', name: '띠로리', desc: '속았을 때' }
];
const BGM = [
  { id: 'sea', name: '평화로운 바닷속', desc: '잔잔하고 몽글몽글' },
  { id: 'palace', name: '용궁 궁중음악', desc: '느리고 장엄하게' },
  { id: 'worry', name: '걱정과 슬픔', desc: '아픈 용왕님' },
  { id: 'journey', name: '씩씩한 길 떠나기', desc: '힘차게 출발' },
  { id: 'tension', name: '두근두근 긴장', desc: '위기의 순간' },
  { id: 'chase', name: '신나는 도망', desc: '빠르고 경쾌하게' },
  { id: 'happy', name: '행복한 마무리', desc: '밝은 끝맺음' }
];
const midi = n => 440 * Math.pow(2, (n - 69) / 12);

const AE = {
  ctx: null, sfx: {}, bgm: {}, buses: {},
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.connect(c.destination);
    for (const k of ['bgm', 'sfx', 'voice', 'narr', 'ui']) { const g = c.createGain(); g.connect(this.master); this.buses[k] = g; }
    this.duck = c.createGain(); this.duck.connect(this.buses.bgm);
    return c;
  },
  noiseBuf(oc, dur) { const b = oc.createBuffer(1, Math.ceil(oc.sampleRate * dur), oc.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; },
  async render(dur, fn) {
    const sr = 44100, oc = new OfflineAudioContext(1, Math.ceil(sr * dur), sr);
    const out = oc.createGain(); out.connect(oc.destination);
    fn(oc, out, this.mk(oc, out));
    return oc.startRendering();
  },
  mk(oc, out) {
    const env = (g, t, a, d, peak) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
    const tone = (type, f0, f1, t, dur, peak = .5, a = .005) => { const o = oc.createOscillator(), g = oc.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur); env(g, t, a, dur, peak); o.connect(g).connect(out); o.start(t); o.stop(t + a + dur + .05); return o; };
    const noise = (t, dur, peak, ftype = 'bandpass', f0 = 1000, f1 = 1000, q = 1) => { const s = oc.createBufferSource(); s.buffer = this.noiseBuf(oc, dur + .1); const f = oc.createBiquadFilter(); f.type = ftype; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur); const g = oc.createGain(); env(g, t, .01, dur, peak); s.connect(f).connect(g).connect(out); s.start(t); s.stop(t + dur + .1); };
    const pluck = (t, f, dur = .8, v = .3) => { const o = oc.createOscillator(), o2 = oc.createOscillator(), g = oc.createGain(), lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 6, t); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + dur); o.type = 'triangle'; o2.type = 'sawtooth'; o.frequency.setValueAtTime(f * 1.03, t); o.frequency.exponentialRampToValueAtTime(f, t + .06); o2.frequency.value = f; const g2 = oc.createGain(); g2.gain.value = .25; env(g, t, .004, dur, v); o.connect(lp); o2.connect(g2).connect(lp); lp.connect(g).connect(out); o.start(t); o2.start(t); o.stop(t + dur + .1); o2.stop(t + dur + .1); };
    const pad = (t, f, dur, v = .12) => { for (const det of [-4, 4]) { const o = oc.createOscillator(), g = oc.createGain(); o.type = 'sine'; o.frequency.value = f; o.detune.value = det; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dur * .35); g.gain.linearRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(out); o.start(t); o.stop(t + dur + .05); } };
    const flute = (t, f, dur, v = .16) => { const o = oc.createOscillator(), g = oc.createGain(), l = oc.createOscillator(), lg = oc.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f * .98, t); o.frequency.linearRampToValueAtTime(f, t + .12); l.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * .012, t + dur * .6); l.connect(lg).connect(o.frequency); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + .08); g.gain.setValueAtTime(v, t + dur - .15); g.gain.linearRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(out); o.start(t); l.start(t); o.stop(t + dur + .05); l.stop(t + dur + .05); noise(t, .12, v * .25, 'bandpass', f * 2, f * 2, 2); };
    const drum = (t, v = .6, f = 120) => { tone('sine', f, f * .45, t, .35, v); noise(t, .05, v * .3, 'lowpass', 900, 300); };
    const tick = (t, v = .12) => noise(t, .04, v, 'highpass', 6000, 8000, .7);
    const bell = (t, f, dur = 1.5, v = .18) => { tone('sine', f, f, t, dur, v); tone('sine', f * 2.76, f * 2.76, t, dur * .4, v * .35); tone('sine', f * 5.4, f * 5.4, t, dur * .2, v * .12); };
    return { env, tone, noise, pluck, pad, flute, drum, tick, bell };
  },
  SFX_DEF: {
    pop: [0.25, (oc, o, m) => { m.tone('sine', 900, 180, 0, .12, .7); m.noise(0, .03, .3, 'highpass', 3000, 3000); }],
    boing: [0.6, (oc, o, m) => { const os = m.tone('sine', 180, 900, 0, .45, .55); const l = oc.createOscillator(), lg = oc.createGain(); l.frequency.value = 18; lg.gain.value = 60; l.connect(lg).connect(os.frequency); l.start(0); l.stop(.6); }],
    boom: [1.2, (oc, o, m) => { m.tone('sine', 110, 35, 0, 1, .9); m.noise(0, .8, .7, 'lowpass', 1800, 120); }],
    swoosh: [0.6, (oc, o, m) => { m.noise(0, .5, .6, 'bandpass', 400, 3500, 2.5); }],
    ding: [1.4, (oc, o, m) => { m.bell(0, 1318, 1.1, .35); m.bell(.13, 1760, 1.2, .35); }],
    sparkle: [1.4, (oc, o, m) => { [2093, 2637, 3136, 2349, 2793, 3520].forEach((f, i) => m.tone('sine', f, f, i * .07, .5, .18)); }],
    drop: [0.35, (oc, o, m) => { m.tone('sine', 500, 1500, 0, .09, .6); m.tone('sine', 1400, 1400, .09, .15, .15); }],
    bubbles: [1.4, (oc, o, m) => { for (let i = 0; i < 11; i++) { const t = i * .11 + Math.random() * .04, f = 300 + Math.random() * 500; m.tone('sine', f, f * 2.4, t, .07, .3); } }],
    splash: [1.2, (oc, o, m) => { m.noise(0, .9, .7, 'bandpass', 2500, 500, .8); m.tone('sine', 220, 70, 0, .3, .4); for (let i = 0; i < 6; i++) m.tone('sine', 700 + Math.random() * 600, 1600, .15 + i * .09, .06, .15); }],
    wave: [3.2, (oc, o, m) => { const s = oc.createBufferSource(); s.buffer = AE.noiseBuf(oc, 3.2); const f = oc.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(300, 0); f.frequency.linearRampToValueAtTime(2200, 1.1); f.frequency.linearRampToValueAtTime(400, 3); const g = oc.createGain(); g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(.7, 1.1); g.gain.linearRampToValueAtTime(0, 3.1); s.connect(f).connect(g).connect(o); s.start(0); }],
    steps: [1.2, (oc, o, m) => { for (let i = 0; i < 4; i++) { m.tone('sine', 260, 120, i * .26, .09, .55); m.noise(i * .26, .04, .2, 'bandpass', 1500, 1500, 1); } }],
    drum: [1.4, (oc, o, m) => { m.drum(0, .9, 100); m.drum(.45, .8, 100); }],
    gong: [3.2, (oc, o, m) => { [180, 263, 377, 455, 612].forEach((f, i) => m.tone('sine', f * 1.01, f, 0, 3 - i * .4, .25 - i * .035, .01)); m.noise(0, .2, .2, 'bandpass', 600, 300, 1); }],
    fail: [1.6, (oc, o, m) => { [587, 554, 523, 494].forEach((f, i) => { const os = m.tone('triangle', f, f, i * .3, i === 3 ? .8 : .26, .3); }); }]
  },
  async getSfx(id) {
    if (!this.sfx[id]) { const d = this.SFX_DEF[id]; this.sfx[id] = this.render(d[0], d[1]); }
    return this.sfx[id];
  },
  BGM_DEF: {
    sea: [12, (oc, o, m) => { const ch = [[57, 64, 69], [55, 62, 67], [53, 60, 65], [55, 62, 69]]; ch.forEach((c, i) => c.forEach(n => m.pad(i * 3, midi(n), 3.4, .07))); const r = seeded('sea'); for (let i = 0; i < 14; i++) m.bell(r() * 11, midi([76, 79, 81, 84, 86][Math.floor(r() * 5)]), 1.6, .07); }],
    palace: [12, (oc, o, m) => { [0, 2, 4, 6, 8, 10].forEach((t, i) => { m.drum(t, .5, 90); if (i % 2) m.drum(t + .5, .25, 140); }); const mel = [[67, 2], [69, 1], [72, 1], [74, 2], [72, 1], [69, 1], [67, 2], [64, 1], [67, 1]]; let t = 0; mel.forEach(([n, d]) => { m.flute(t, midi(n), d * .98, .13); t += d; }); [43, 50, 48, 43].forEach((n, i) => m.pad(i * 3, midi(n), 3.2, .08)); for (let i = 0; i < 12; i++) m.pluck(i + .5, midi([55, 60, 62, 67][i % 4]), .9, .12); }],
    worry: [12.8, (oc, o, m) => { const mel = [[69, 1.6], [67, .8], [64, 1.6], [62, .8], [60, 1.6], [62, .8], [64, 3.2], [57, 2.4]]; let t = 0; mel.forEach(([n, d]) => { m.flute(t, midi(n), d * .97, .12); t += d; }); [[45, 52], [41, 48], [43, 50], [45, 52]].forEach((c, i) => c.forEach(n => m.pad(i * 3.2, midi(n), 3.4, .07))); }],
    journey: [9.6, (oc, o, m) => { const sc = [60, 62, 64, 67, 69, 72, 74]; const r = seeded('jr'); let k = 3; for (let i = 0; i < 16; i++) { const t = i * .6; if (i % 4 === 0) m.drum(t, .55, 110); if (i % 4 === 2) m.drum(t, .35, 150); m.tick(t + .3); k = clamp(k + Math.floor(r() * 3) - 1, 0, sc.length - 1); m.pluck(t, midi(sc[k]), .55, .2); if (i % 2 === 0) m.pluck(t, midi(sc[k] - 12), .5, .12); } [48, 43, 45, 43].forEach((n, i) => m.pad(i * 2.4, midi(n), 2.5, .06)); }],
    tension: [8, (oc, o, m) => { for (let i = 0; i < 32; i++) { const t = i * .25; m.pluck(t, midi(i % 8 === 6 ? 46 : 45), .22, .22); if (i % 8 === 0) m.drum(t, .6, 70); } [[57, 60], [56, 59]].forEach((c, i) => c.forEach(n => { const g = oc.createGain(), os = oc.createOscillator(), tr = oc.createOscillator(), tg = oc.createGain(); os.type = 'sawtooth'; os.frequency.value = midi(n); const f = oc.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; tr.frequency.value = 9; tg.gain.value = .03; g.gain.value = .035; tr.connect(tg).connect(g.gain); os.connect(f).connect(g).connect(o); os.start(i * 4); tr.start(i * 4); os.stop(i * 4 + 4); tr.stop(i * 4 + 4); })); }],
    chase: [6.4, (oc, o, m) => { const sc = [62, 64, 67, 69, 71, 74, 76]; const pat = [0, 2, 4, 5, 4, 2, 3, 1, 0, 2, 4, 6, 5, 4, 2, 1]; for (let i = 0; i < 32; i++) { const t = i * .2; m.pluck(t, midi(sc[pat[i % 16]] + (i >= 16 ? 0 : 0)), .18, .2); m.tick(t + .1, .08); if (i % 2 === 0) m.drum(t, i % 4 === 0 ? .55 : .3, i % 4 === 0 ? 100 : 160); } [50, 55, 52, 50].forEach((n, i) => m.pluck(i * 1.6, midi(n), 1.5, .15)); }],
    happy: [8.8, (oc, o, m) => { const ar = [[60, 64, 67, 72], [65, 69, 72, 77], [67, 71, 74, 79], [60, 64, 67, 72]]; ar.forEach((c, i) => { for (let j = 0; j < 8; j++) { const t = i * 2.2 + j * .275; m.bell(t, midi(c[j % 4] + 12), .5, .07); if (j % 2 === 0) m.pluck(t, midi(c[(j / 2) % 4]), .4, .14); } m.drum(i * 2.2, .45, 110); m.drum(i * 2.2 + 1.1, .3, 140); m.pad(i * 2.2, midi(c[0] - 12), 2.3, .07); }); }]
  },
  async getBgm(id) {
    if (!this.bgm[id]) { const d = this.BGM_DEF[id]; this.bgm[id] = this.render(d[0], d[1]); }
    return this.bgm[id];
  },
  preview: null,
  async playPreview(kind, id) {
    this.init(); this.stopPreview();
    const buf = kind === 'sfx' ? await this.getSfx(id) : await this.getBgm(id);
    const s = this.ctx.createBufferSource(); s.buffer = buf; s.connect(this.buses.ui); s.start();
    if (kind === 'bgm') s.stop(this.ctx.currentTime + Math.min(buf.duration, 8));
    this.preview = s; return s;
  },
  stopPreview() { try { this.preview && this.preview.stop(); } catch (e) { } this.preview = null; },
  click(v = .25) { if (!this.ctx) return; const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(1800, c.currentTime); o.frequency.exponentialRampToValueAtTime(600, c.currentTime + .05); g.gain.setValueAtTime(v, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .08); o.connect(g).connect(this.buses.ui); o.start(); o.stop(c.currentTime + .1); }
};
