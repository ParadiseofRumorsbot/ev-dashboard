/**
 * sync-robotaxi.js
 * Notion "로보택시 DB" → data/robotaxi_data.json
 *
 * 2개 Notion DB를 조회:
 *   1) 타임라인 이벤트 DB — robotaxi.html 타임라인 섹션
 *   2) FSD 메트릭 DB     — FSD 누적 마일, 플릿 수, 도시별 현황
 *
 * ═══ 타임라인 이벤트 DB 컬럼 ═══
 *   날짜 (title)      — 25.06, 26.04.18 등
 *   내용 (rich_text)   — 이벤트 설명
 *   카테고리 (select)  — fleet, fsd, industry, regulation, production
 *   중요도 (select)    — high, normal
 *
 * ═══ FSD 메트릭 DB 컬럼 ═══
 *   항목 (title)       — cum_miles, daily_miles, subscribers, austin_total, etc.
 *   값 (number)        — 숫자 값
 *   단위 (select)      — B, M, 대, 명
 *   기준일 (date)      — 데이터 기준 날짜
 *   비고 (rich_text)   — 추가 설명
 *
 * 환경변수:
 *   NOTION_TOKEN
 *   NOTION_TIMELINE_DB_ID
 *   NOTION_FSD_METRICS_DB_ID
 */

const https = require('https');
const fs = require('fs');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const TIMELINE_DB_ID = process.env.NOTION_TIMELINE_DB_ID;
const METRICS_DB_ID = process.env.NOTION_FSD_METRICS_DB_ID;

if (!NOTION_TOKEN) { console.error('❌ NOTION_TOKEN 필요'); process.exit(1); }
if (!TIMELINE_DB_ID) { console.error('❌ NOTION_TIMELINE_DB_ID 필요'); process.exit(1); }
if (!METRICS_DB_ID) { console.error('❌ NOTION_FSD_METRICS_DB_ID 필요'); process.exit(1); }

function notionRequest(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'api.notion.com',
      path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, res => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        if (res.statusCode >= 400) reject(new Error(`Notion ${res.statusCode}: ${chunks}`));
        else resolve(JSON.parse(chunks));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getTitle(p)  { return p?.title?.map(t => t.plain_text).join('') || ''; }
function getText(p)   { return p?.rich_text?.map(t => t.plain_text).join('') || ''; }
function getSelect(p) { return p?.select?.name || ''; }
function getNumber(p) { return p?.number ?? null; }
function getDate(p)   { return p?.date?.start || ''; }

async function queryAll(dbId, sorts) {
  let all = [], hasMore = true, cursor;
  while (hasMore) {
    const body = { page_size: 100, sorts };
    if (cursor) body.start_cursor = cursor;
    const d = await notionRequest(`/v1/databases/${dbId}/query`, body);
    all = all.concat(d.results);
    hasMore = d.has_more;
    cursor = d.next_cursor;
  }
  return all;
}

async function main() {
  // ── 1. 타임라인 이벤트 ──
  console.log('📡 타임라인 DB 조회 중...');
  const tlRows = await queryAll(TIMELINE_DB_ID, [
    { property: '날짜', direction: 'ascending' },
  ]);
  console.log(`   타임라인: ${tlRows.length}건`);

  const timeline = tlRows.map(page => {
    const p = page.properties;
    return {
      date:     getTitle(p['날짜']),
      desc:     getText(p['내용']),
      category: getSelect(p['카테고리']),
      priority: getSelect(p['중요도']),
    };
  }).filter(e => e.date && e.desc);

  // ── 2. FSD 메트릭 ──
  console.log('📡 FSD 메트릭 DB 조회 중...');
  const mRows = await queryAll(METRICS_DB_ID, [
    { property: '기준일', direction: 'descending' },
  ]);
  console.log(`   메트릭: ${mRows.length}건`);

  const metricsRaw = mRows.map(page => {
    const p = page.properties;
    return {
      key:   getTitle(p['항목']),
      value: getNumber(p['값']),
      unit:  getSelect(p['단위']),
      date:  getDate(p['기준일']),
      note:  getText(p['비고']),
    };
  }).filter(m => m.key && m.value !== null);

  // 최신 값만 추출 (같은 key는 가장 최근 date 우선 — 이미 desc 정렬)
  const seen = new Set();
  const latestMetrics = {};
  for (const m of metricsRaw) {
    if (!seen.has(m.key)) {
      seen.add(m.key);
      latestMetrics[m.key] = m;
    }
  }

  // 히스토리 (차트용): key별 시계열
  const history = {};
  for (const m of metricsRaw) {
    if (!history[m.key]) history[m.key] = [];
    history[m.key].push({ date: m.date, value: m.value });
  }
  // 오래된 순 정렬
  for (const k of Object.keys(history)) {
    history[k].sort((a, b) => a.date.localeCompare(b.date));
  }

  // ── 출력 ──
  const output = {
    syncedAt: new Date().toISOString(),
    metrics: latestMetrics,
    history,
    timeline,
  };

  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync('data/robotaxi_data.json', JSON.stringify(output, null, 2));
  console.log(`✅ data/robotaxi_data.json 생성`);
  console.log(`   메트릭: ${Object.keys(latestMetrics).length}개 (최신)`);
  console.log(`   히스토리 키: ${Object.keys(history).length}개`);
  console.log(`   타임라인: ${timeline.length}건`);
}

main().catch(e => { console.error('❌ 동기화 실패:', e.message); process.exit(1); });
