// 녹음 묶음을 쉼 위치로 잘라 줄마다 mp3로 만들고, 장면별 재생 정보(story.json)를 써요
// usage: node tools/tales-split.js <id> <녹음 폴더(g0.mp3…)> <plan.json>
const { execFileSync } = require('child_process'); const fs = require('fs'), path = require('path');
const [id, dir, planFile] = process.argv.slice(2); const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
const out = `tales/${id}/v`; fs.mkdirSync(out, { recursive: true });
const sil = (f, d) => { const r = execFileSync('ffmpeg', ['-v', 'info', '-i', f, '-af', `silencedetect=noise=-38dB:d=${d}`, '-f', 'null', '-'], { stdio: ['ignore', 'pipe', 'pipe'] }).toString() + '';
  return r; };
const dur = f => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString();
const lens = {};
plan.groups.forEach((g, gi) => {
  const f = path.join(dir, `g${gi}.mp3`), need = g.items.length - 1; let cuts = [];
  for (const d of [0.75, 0.6, 0.5, 0.4]) {
    let log; try { execFileSync('ffmpeg', ['-v', 'info', '-i', f, '-af', `silencedetect=noise=-38dB:d=${d}`, '-f', 'null', '-'], { stdio: ['ignore', 'ignore', 'pipe'] }); } catch (e) { }
    log = require('child_process').spawnSync('ffmpeg', ['-v', 'info', '-i', f, '-af', `silencedetect=noise=-38dB:d=${d}`, '-f', 'null', '-']).stderr.toString();
    const ends = [...log.matchAll(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g)].map(m => [+m[1], +m[2]]);
    // 가장 긴 쉼 need개를 골라 시간순으로
    if (ends.length >= need) { cuts = ends.sort((a, b) => b[1] - a[1]).slice(0, need).sort((a, b) => a[0] - b[0]).map(([e, s]) => e - s / 2); break; }
  }
  if (cuts.length !== need) throw new Error(`group ${gi} (${g.who}): ${cuts.length} cuts, need ${need}`);
  const T = dur(f), bounds = [0, ...cuts, T];
  g.items.forEach((it, k) => {
    const o = path.join(out, it.file + '.mp3');
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(bounds[k]), '-to', String(bounds[k + 1]), '-i', f,
      '-af', 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,areverse,afade=t=in:d=0.02',
      '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '64k', o]);
    lens[it.file] = +dur(o).toFixed(2);
  });
});
fs.writeFileSync(path.join(dir, 'lens.json'), JSON.stringify(lens));
console.log(Object.keys(lens).length, 'clips', Object.values(lens).reduce((a, b) => a + b, 0).toFixed(1) + 's');
