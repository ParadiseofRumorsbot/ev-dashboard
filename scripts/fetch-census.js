#!/usr/bin/env node
/**
 * US Census Bureau Import Data Fetcher v3
 * 2차전지 밸류체인 + 차량 수입 데이터 수집
 *
 * Usage: CENSUS_API_KEY=xxxxx node scripts/fetch-census.js
 */
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.CENSUS_API_KEY;
if (!API_KEY) { console.error('ERROR: CENSUS_API_KEY 환경변수를 설정하세요.'); process.exit(1); }

const BASE = 'https://api.census.gov/data/timeseries/intltrade/imports/hs';

// ══════════════════════════════════════════════
//  모니터링 대상 HS코드 (21개)
// ══════════════════════════════════════════════
const HS_CODES = {
  // ── 셀·완제품 ──
  '850760':     { label:'리튬이온 배터리 전체',  labelEn:'Li-ion Batteries (Total)', level:'HS6',  tab:'cell' },
  '8507600010': { label:'EV용 LiB',            labelEn:'Li-ion for EV',            level:'HS10', tab:'cell' },
  '8507600020': { label:'기타 LiB (ESS·IT)',    labelEn:'Li-ion Other (ESS/IT)',    level:'HS10', tab:'cell' },
  // ── 소재 ──
  '8507908000': { label:'축전지 부품 (비납축)',   labelEn:'Battery Parts (ex. Lead)',  level:'HS10', tab:'material' },
  '380110':     { label:'인조흑연 (음극재)',     labelEn:'Artificial Graphite',       level:'HS6',  tab:'material' },
  '250410':     { label:'천연흑연 분말',         labelEn:'Natural Graphite Powder',   level:'HS6',  tab:'material' },
  '3824999397': { label:'전해액 (화학조제품)',    labelEn:'Electrolyte (Chem Prep)',   level:'HS10', tab:'material' },
  '741012':     { label:'전해동박',              labelEn:'Electrodeposited Cu Foil',  level:'HS6',  tab:'material' },
  '760711':     { label:'알루미늄박 (압연)',      labelEn:'Rolled Al Foil',            level:'HS6',  tab:'material' },
  // ── 원료 ──
  '283691':     { label:'탄산리튬',              labelEn:'Lithium Carbonate',         level:'HS6',  tab:'raw' },
  '282520':     { label:'수산화리튬',            labelEn:'Lithium Hydroxide',         level:'HS6',  tab:'raw' },
  '283324':     { label:'황산니켈',              labelEn:'Nickel Sulphate',           level:'HS6',  tab:'raw' },
  '282200':     { label:'산화코발트',            labelEn:'Cobalt Oxide',              level:'HS6',  tab:'raw' },
  // ── 차량 ──
  '870380':     { label:'BEV (순수전기차)',      labelEn:'Battery Electric Vehicle',  level:'HS6',  tab:'vehicle' },
  '870340':     { label:'PHEV (가솔린+전기)',    labelEn:'PHEV Gasoline Plug-in',     level:'HS6',  tab:'vehicle' },
  '870350':     { label:'PHEV (디젤+전기)',      labelEn:'PHEV Diesel Plug-in',       level:'HS6',  tab:'vehicle' },
  '870360':     { label:'HEV (가솔린 하이브리드)',labelEn:'HEV Gasoline Non-Plugin',   level:'HS6',  tab:'vehicle' },
  '870321':     { label:'ICE 가솔린 ≤1L',       labelEn:'ICE Gasoline ≤1000cc',      level:'HS6',  tab:'vehicle' },
  '870322':     { label:'ICE 가솔린 1~1.5L',    labelEn:'ICE Gasoline 1000-1500cc',  level:'HS6',  tab:'vehicle' },
  '870323':     { label:'ICE 가솔린 1.5~3L',    labelEn:'ICE Gasoline 1500-3000cc',  level:'HS6',  tab:'vehicle' },
  '870324':     { label:'ICE 가솔린 >3L',       labelEn:'ICE Gasoline >3000cc',      level:'HS6',  tab:'vehicle' },
};

// ══════════════════════════════════════════════
//  주요 감시 국가
// ══════════════════════════════════════════════
const WATCH = {
  'KOREA, SOUTH':{ code:'KR', label:'한국',      group:'major' },
  'CHINA':       { code:'CN', label:'중국',      group:'major' },
  'JAPAN':       { code:'JP', label:'일본',      group:'major' },
  'GERMANY':     { code:'DE', label:'독일',      group:'major' },
  'CANADA':      { code:'CA', label:'캐나다',    group:'major' },
  'AUSTRALIA':   { code:'AU', label:'호주',      group:'major' },
  'CHILE':       { code:'CL', label:'칠레',      group:'major' },
  'ARGENTINA':   { code:'AR', label:'아르헨티나', group:'major' },
  'UNITED KINGDOM':{ code:'GB', label:'영국',    group:'major' },
  'SWEDEN':      { code:'SE', label:'스웨덴',    group:'major' },
  'MOROCCO':     { code:'MA', label:'모로코',    group:'circumvention' },
  'HUNGARY':     { code:'HU', label:'헝가리',    group:'circumvention' },
  'THAILAND':    { code:'TH', label:'태국',      group:'circumvention' },
  'INDONESIA':   { code:'ID', label:'인도네시아', group:'circumvention' },
  'VIETNAM':     { code:'VN', label:'베트남',    group:'circumvention' },
  'MEXICO':      { code:'MX', label:'멕시코',    group:'circumvention' },
  'POLAND':      { code:'PL', label:'폴란드',    group:'circumvention' },
  'MALAYSIA':    { code:'MY', label:'말레이시아', group:'circumvention' },
  'INDIA':       { code:'IN', label:'인도',      group:'circumvention' },
};

function getTimeRange() {
  const now = new Date();
  const latest = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const start = new Date(2023, 0, 1);
  const months = [];
  let cur = new Date(start);
  while (cur <= latest) {
    months.push(`${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(2000 * (i + 1));
    }
  }
}

async function fetchMonth(hs, info, time) {
  const url = `${BASE}?get=I_COMMODITY,CTY_CODE,CTY_NAME,GEN_VAL_MO,GEN_QY1_MO`
    + `&I_COMMODITY=${hs}&time=${time}&COMM_LVL=${info.level}&SUMMARY_LVL=DET&key=${API_KEY}`;
  try {
    const d = await fetchRetry(url);
    if (!d || d.length < 2) return null;
    const h = d[0], ci = h.indexOf('CTY_NAME'), vi = h.indexOf('GEN_VAL_MO'), qi = h.indexOf('GEN_QY1_MO');
    const res = { total: 0, totalQty: 0, countries: {} };
    for (let i = 1; i < d.length; i++) {
      const name = d[i][ci], val = parseInt(d[i][vi])||0, qty = parseInt(d[i][qi])||0;
      if (name === 'TOTAL FOR ALL COUNTRIES') { res.total = val; res.totalQty = qty; continue; }
      const w = WATCH[name];
      if (w) res.countries[w.code] = { val, qty, name };
    }
    const wSum = Object.values(res.countries).reduce((s,c) => s + c.val, 0);
    res.countries.OTHER = { val: Math.max(0, res.total - wSum), qty: 0, name: 'Others' };
    return res;
  } catch (e) { console.error(`  ✗ ${hs} ${time}: ${e.message}`); return null; }
}

async function main() {
  console.log('══════════════════════════════════════════════════════');
  console.log('  Census Import Fetcher v3');
  console.log('  셀·소재·원료·차량 — 21개 코드');
  console.log('══════════════════════════════════════════════════════');
  const months = getTimeRange();
  const entries = Object.entries(HS_CODES);
  console.log(`기간: ${months[0]}~${months.at(-1)} (${months.length}개월) × ${entries.length}코드`);
  console.log(`예상 API: ~${entries.length * months.length}건 (약 ${Math.ceil(entries.length*months.length*0.35/60)}분)\n`);

  const out = {
    meta: {
      lastUpdated: new Date().toISOString().split('T')[0],
      dataRange: { from: months[0], to: months.at(-1) },
      hsCodes: HS_CODES,
      countries: Object.fromEntries(Object.entries(WATCH).map(([k,v])=>[v.code,{name:k,label:v.label,group:v.group}])),
      tabs: {
        cell:     { label:'셀·완제품', codes: entries.filter(([,v])=>v.tab==='cell').map(([k])=>k) },
        material: { label:'소재',     codes: entries.filter(([,v])=>v.tab==='material').map(([k])=>k) },
        raw:      { label:'원료',     codes: entries.filter(([,v])=>v.tab==='raw').map(([k])=>k) },
        vehicle:  { label:'차량 수입', codes: entries.filter(([,v])=>v.tab==='vehicle').map(([k])=>k) },
      },
    },
    monthly: {},
  };

  let calls = 0, errs = 0;
  for (const [hs, info] of entries) {
    console.log(`\n▶ [${info.tab}] ${hs} — ${info.label}`);
    out.monthly[hs] = {};
    for (const t of months) {
      process.stdout.write(`  ${t}...`);
      const r = await fetchMonth(hs, info, t);
      calls++;
      if (r && r.total > 0) { out.monthly[hs][t] = r; process.stdout.write(` $${(r.total/1e6).toFixed(1)}M\n`); }
      else if (r) { out.monthly[hs][t] = r; process.stdout.write(` $0\n`); }
      else { process.stdout.write(` (err)\n`); errs++; }
      await sleep(300);
      if (calls % 50 === 0) { console.log(`  ... ${calls}건, 대기 ...`); await sleep(2000); }
    }
  }

  const p = path.join(__dirname, '..', 'data', 'census-import.json');
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(out, null, 2));
  console.log(`\n✅ ${p} (${(fs.statSync(p).size/1024).toFixed(1)}KB) — ${calls}건, 에러 ${errs}건`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
