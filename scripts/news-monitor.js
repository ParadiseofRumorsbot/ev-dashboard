/**
 * news-monitor.js
 * 매일 8AM KST 자동 실행 — EV 신차 출시일정 모니터링 전용
 *
 * 목적: OEM 신차 발표·출시일 변경·스펙 확정 등 타임라인 테이블 반영 항목만 수집
 * 프로세스: 수집 → data/daily_news.json 저장 → 사용자 확인 후 반영
 *
 * 환경변수: (없음 — RSS만 사용)
 * 의존성: 없음 (Node.js 내장 모듈만)
 */

const https = require('https');
const fs = require('fs');

// ── 신차 출시일정 전용 키워드 ──
const KEYWORDS = [
  // 출시·발표 키워드
  'EV launch date 2026 2027 2028',
  'electric vehicle reveal debut 2026',
  'new EV model release date',
  // OEM별 (한국)
  'Hyundai IONIQ EV new model launch',
  'Kia EV launch 2026 2027',
  'Genesis electric vehicle launch',
  // OEM별 (글로벌)
  'Tesla new model launch date',
  'BMW electric vehicle launch 2026',
  'Mercedes EQ EV launch date',
  'VW Volkswagen electric vehicle launch',
  'Volvo EX electric launch',
  'Rivian R2 R3 launch production',
  'Ford electric vehicle launch date',
  'GM Chevrolet electric vehicle launch',
  'Nissan Honda EV launch 2026',
  // 유럽
  'Porsche electric vehicle launch',
  'Stellantis EV launch date',
  'Skoda electric vehicle launch',
  // 배터리 스펙
  'EV battery kWh 800V new model specs',
  // 한국어
  '전기차 신차 출시일정 2026',
  '전기차 출시 확정 발표',
  '현대 기아 전기차 신모델',
];

const MAX_ITEMS_PER_KEYWORD = 3;
const MAX_TOTAL = 30;
const OUTPUT_PATH = 'data/daily_news.json';

// ── 신차 출시 관련성 필터 키워드 ──
const RELEVANCE_KEYWORDS = [
  'launch', 'debut', 'reveal', 'unveil', 'production start',
  'release date', 'on sale', 'deliveries begin', 'first delivery',
  'new model', 'facelift', 'refresh', 'redesign',
  'specs', 'range', 'kwh', '800v', 'battery capacity',
  'price', 'msrp', 'starting at',
  '출시', '공개', '발표', '양산', '인도', '사전예약',
  '신차', '신모델', '페이스리프트', '항속거리', '배터리 용량',
  'q1', 'q2', 'q3', 'q4', 'first half', 'second half',
  '상반기', '하반기',
];

// ── 비관련 필터 (제외할 키워드) ──
const EXCLUDE_KEYWORDS = [
  'stock price', 'shares', 'earnings', 'revenue', 'profit',
  'recall', 'accident', 'crash', 'fire', 'lawsuit',
  '주가', '실적', '매출', '리콜', '사고',
];

// ── 미니 RSS 파서 ──
function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = tag => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
    };
    items.push({
      title: stripHtml(get('title')),
      link: get('link'),
      pubDate: get('pubDate'),
      source: stripHtml(get('source')),
    });
  }
  return items;
}

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

// ── Google News RSS fetch ──
function fetchRSS(keyword) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(keyword);
    const url = `https://news.google.com/rss/search?q=${encoded}+when:3d&hl=en&gl=US&ceid=US:en`;
    const doFetch = (fetchUrl) => {
      https.get(fetchUrl, { headers: { 'User-Agent': 'Mozilla/5.0 ev-dashboard-bot' } }, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          doFetch(res.headers.location);
          return;
        }
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    };
    doFetch(url);
  });
}

// ── 관련성 점수 계산 ──
function relevanceScore(title) {
  const t = title.toLowerCase();
  // 제외 키워드 체크
  for (const ex of EXCLUDE_KEYWORDS) {
    if (t.includes(ex.toLowerCase())) return -1;
  }
  // 관련성 점수
  let score = 0;
  for (const kw of RELEVANCE_KEYWORDS) {
    if (t.includes(kw.toLowerCase())) score++;
  }
  return score;
}

// ── OEM 자동 분류 ──
function classifyOEM(title) {
  const t = title.toLowerCase();
  if (/tesla/.test(t)) return 'Tesla';
  if (/hyundai|현대/.test(t)) return 'Hyundai';
  if (/kia|기아/.test(t)) return 'Kia';
  if (/genesis|제네시스/.test(t)) return 'Genesis';
  if (/bmw/.test(t)) return 'BMW';
  if (/mercedes|benz|벤츠/.test(t)) return 'Mercedes';
  if (/volkswagen|vw/.test(t)) return 'VW';
  if (/porsche|포르쉐/.test(t)) return 'Porsche';
  if (/volvo|볼보/.test(t)) return 'Volvo';
  if (/rivian/.test(t)) return 'Rivian';
  if (/lucid/.test(t)) return 'Lucid';
  if (/ford|포드/.test(t)) return 'Ford';
  if (/gm|chevrolet|cadillac|buick/.test(t)) return 'GM';
  if (/nissan|닛산/.test(t)) return 'Nissan';
  if (/honda|혼다/.test(t)) return 'Honda';
  if (/toyota|lexus|도요타|렉서스/.test(t)) return 'Toyota/Lexus';
  if (/stellantis|jeep|fiat|peugeot|citroen|opel/.test(t)) return 'Stellantis';
  if (/skoda|스코다/.test(t)) return 'Skoda';
  if (/scout/.test(t)) return 'Scout';
  if (/byd|비야디/.test(t)) return 'BYD';
  return 'Other';
}

// ── 시장 분류 ──
function classifyMarket(title) {
  const t = title.toLowerCase();
  if (/europe|eu |uk |germany|france|spain/.test(t)) return 'EU';
  if (/us |america|north america/.test(t)) return 'NA';
  if (/china|중국/.test(t)) return 'CN';
  if (/korea|한국/.test(t)) return 'KR';
  return 'Global';
}

// ── 중복 제거 ──
function dedup(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.title.slice(0, 50).toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── 메인 ──
async function main() {
  console.log(`\n🚗 EV 신차 출시일정 모니터링 — ${new Date().toISOString()}\n`);

  let allItems = [];

  for (const kw of KEYWORDS) {
    try {
      process.stdout.write(`  🔍 "${kw.slice(0, 40)}..." `);
      const xml = await fetchRSS(kw);
      const items = parseRSS(xml).slice(0, MAX_ITEMS_PER_KEYWORD);
      // 관련성 필터
      const relevant = items.filter(it => relevanceScore(it.title) > 0);
      console.log(`${items.length}건 → ${relevant.length}건 관련`);
      allItems.push(...relevant.map(it => ({
        ...it,
        keyword: kw,
        oem: classifyOEM(it.title),
        market: classifyMarket(it.title),
        score: relevanceScore(it.title),
      })));
    } catch (e) {
      console.log(`⚠️ 실패: ${e.message.slice(0, 50)}`);
    }
  }

  // 중복 제거 + 관련성 높은 순 + 상한
  allItems = dedup(allItems)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_TOTAL);

  // OEM별 통계
  const oemStats = {};
  allItems.forEach(it => { oemStats[it.oem] = (oemStats[it.oem] || 0) + 1; });

  console.log(`\n📊 총 ${allItems.length}건 수집`);
  console.log('🏭 OEM:', JSON.stringify(oemStats));

  // JSON 저장
  const output = {
    type: 'ev_launch_timeline',
    lastUpdated: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    description: 'EV 신차 출시일정 모니터링 — 타임라인 테이블 반영용',
    note: '⚠️ 자동 수집 결과입니다. 대시보드 반영 전 사용자 확인 필요.',
    totalItems: allItems.length,
    oemStats,
    items: allItems.map(it => ({
      title: it.title,
      link: it.link,
      pubDate: it.pubDate,
      source: it.source,
      oem: it.oem,
      market: it.market,
      score: it.score,
    })),
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`💾 ${OUTPUT_PATH} 저장`);
  console.log('\n✅ 완료 — 사용자 확인 대기\n');
}

main().catch(e => { console.error('❌ 실패:', e.message); process.exit(1); });
