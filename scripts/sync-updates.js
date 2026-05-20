/**
 * sync-updates.js
 * Notion "주간 업데이트 DB" → data/weekly_updates.json
 *
 * Notion DB 컬럼:
 *   제목 (title)       — 업데이트 제목
 *   카테고리 (select)   — 미국, 중국, 유럽, Cell, ESS, FSD
 *   아이콘 (rich_text)  — 🇺🇸, 🇨🇳, 🔋 등
 *   본문 (rich_text)    — 상세 내용 (HTML 인라인 스타일 포함 가능)
 *   색상 (select)       — teal, red, blue, yellow, purple
 *   섹션 (select)       — this_week / update_log
 *   대상 (multi_select) — index, robotaxi, both
 *   날짜 (date)         — 업데이트 날짜
 *   순서 (number)       — 표시 순서
 *
 * 환경변수: NOTION_TOKEN, NOTION_UPDATES_DB_ID
 */

const https = require('https');
const fs = require('fs');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_UPDATES_DB_ID;

if (!NOTION_TOKEN) { console.error('❌ NOTION_TOKEN 필요'); process.exit(1); }
if (!DATABASE_ID) { console.error('❌ NOTION_UPDATES_DB_ID 필요'); process.exit(1); }

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
        if (res.statusCode >= 400) reject(new Error(`Notion API ${res.statusCode}: ${chunks}`));
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
function getMultiSelect(p) { return p?.multi_select?.map(s => s.name) || []; }
function getNumber(p) { return p?.number ?? null; }
function getDate(p)   { return p?.date?.start || ''; }

async function main() {
  console.log('📡 주간 업데이트 DB 조회 중...');

  let allResults = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    const body = {
      page_size: 100,
      sorts: [
        { property: '날짜', direction: 'descending' },
        { property: '순서', direction: 'ascending' },
      ],
    };
    if (startCursor) body.start_cursor = startCursor;
    const data = await notionRequest(`/v1/databases/${DATABASE_ID}/query`, body);
    allResults = allResults.concat(data.results);
    hasMore = data.has_more;
    startCursor = data.next_cursor;
  }

  console.log(`   ${allResults.length}개 행 조회 완료`);

  const updates = allResults.map(page => {
    const p = page.properties;
    return {
      title:    getTitle(p['제목']),
      category: getSelect(p['카테고리']),
      icon:     getText(p['아이콘']),
      body:     getText(p['본문']),
      color:    getSelect(p['색상']),
      section:  getSelect(p['섹션']),
      targets:  getMultiSelect(p['대상']),
      date:     getDate(p['날짜']),
      order:    getNumber(p['순서']),
    };
  }).filter(u => u.title && u.section && (u.order === null || u.order < 90));

  // 최신 날짜 기준으로 this_week / update_log 분리
  const latestDate = updates.length > 0 ? updates[0].date : '';

  const output = {
    syncedAt: new Date().toISOString(),
    latestDate,
    count: updates.length,
    this_week: updates
      .filter(u => u.section === 'this_week' && u.date === latestDate)
      .sort((a, b) => (a.order || 99) - (b.order || 99)),
    update_log: updates
      .filter(u => u.section === 'update_log' && u.date === latestDate)
      .sort((a, b) => (a.order || 99) - (b.order || 99)),
    // 지난 주 데이터도 보관 (아카이브)
    archive: updates.filter(u => u.date !== latestDate),
  };

  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync('data/weekly_updates.json', JSON.stringify(output, null, 2));
  console.log(`✅ data/weekly_updates.json 생성 (this_week: ${output.this_week.length}건, update_log: ${output.update_log.length}건)`);
}

main().catch(e => { console.error('❌ 동기화 실패:', e.message); process.exit(1); });
