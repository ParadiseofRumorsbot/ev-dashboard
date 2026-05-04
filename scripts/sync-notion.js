/**
 * sync-notion.js
 * ⚙️ 모델 변수 DB → data/notion_variables.json
 * 
 * Notion DB의 각 행에서 "HTML 경로"와 "값"을 읽어
 * HTML DATA 객체를 덮어쓸 수 있는 JSON으로 변환.
 * 
 * 환경변수: NOTION_TOKEN (GitHub Secrets에 저장)
 */

const https = require('https');
const fs = require('fs');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = '659a8d5a89c344a5b68960fead1cf889';

if (!NOTION_TOKEN) {
  console.error('❌ NOTION_TOKEN 환경변수가 설정되지 않았습니다.');
  console.error('   GitHub Settings → Secrets → NOTION_TOKEN 추가 필요');
  process.exit(1);
}

// ── Notion API 요청 ──
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
        if (res.statusCode >= 400) {
          reject(new Error(`Notion API ${res.statusCode}: ${chunks}`));
        } else {
          resolve(JSON.parse(chunks));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ── Property 추출 헬퍼 ──
function getTitle(prop) {
  if (!prop || !prop.title) return '';
  return prop.title.map(t => t.plain_text).join('');
}
function getText(prop) {
  if (!prop || !prop.rich_text) return '';
  return prop.rich_text.map(t => t.plain_text).join('');
}
function getSelect(prop) {
  if (!prop || !prop.select) return '';
  return prop.select.name || '';
}
function getNumber(prop) {
  if (!prop || prop.number === null || prop.number === undefined) return null;
  return prop.number;
}
function getDate(prop) {
  if (!prop || !prop.date) return '';
  return prop.date.start || '';
}

// ── 메인 ──
async function main() {
  console.log('📡 Notion DB 조회 중...');

  // 전체 페이지 조회 (페이지네이션)
  let allResults = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    const body = { page_size: 100 };
    if (startCursor) body.start_cursor = startCursor;

    const data = await notionRequest(
      `/v1/databases/${DATABASE_ID}/query`,
      body
    );
    allResults = allResults.concat(data.results);
    hasMore = data.has_more;
    startCursor = data.next_cursor;
  }

  console.log(`   ${allResults.length}개 행 조회 완료`);

  // path → value 매핑
  const variables = allResults
    .map(page => {
      const p = page.properties;
      return {
        name:      getTitle(p['변수명']),
        category:  getSelect(p['카테고리']),
        target:    getText(p['대상']),
        region:    getSelect(p['지역']),
        year:      getSelect(p['연도']),
        value:     getNumber(p['값']),
        unit:      getSelect(p['단위']),
        path:      getText(p['HTML 경로']),
        source:    getText(p['출처']),
        updatedAt: getDate(p['수정일']),
      };
    })
    .filter(v => v.path && v.value !== null);  // 경로+값 둘 다 있는 행만

  // JSON 출력
  const output = {
    syncedAt: new Date().toISOString(),
    dbId: DATABASE_ID,
    count: variables.length,
    variables,
  };

  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync(
    'data/notion_variables.json',
    JSON.stringify(output, null, 2)
  );

  console.log(`✅ data/notion_variables.json 생성 (${variables.length}개 변수)`);

  // 요약 출력
  const cats = {};
  variables.forEach(v => {
    cats[v.category] = (cats[v.category] || 0) + 1;
  });
  Object.entries(cats).forEach(([k, n]) => console.log(`   ${k}: ${n}건`));
}

main().catch(e => {
  console.error('❌ 동기화 실패:', e.message);
  process.exit(1);
});
