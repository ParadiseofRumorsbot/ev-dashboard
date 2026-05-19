/**
 * news-monitor.js
 * 매일 7AM KST 자동 실행 — EV·배터리 뉴스 모니터링
 *
 * 1) Google News RSS에서 키워드별 뉴스 수집
 * 2) data/daily_news.json에 저장
 * 3) (선택) Notion 주간 업데이트 DB에 주요 항목 등록
 *
 * 환경변수:
 *   NOTION_TOKEN        — Notion API 토큰 (선택)
 *   NOTION_UPDATES_DB_ID — 주간 업데이트 DB ID (선택)
 *
 * 의존성: 없음 (Node.js 내장 모듈만 사용)
 */

const https = require('https');
const fs = require('fs');
const { XMLParser } = (() => {
  // Minimal RSS XML parser (no dependencies)
  class XMLParser {
    parse(xml) {
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
          title: get('title'),
          link: get('link'),
          pubDate: get('pubDate'),
          source: get('source'),
        });
      }
      return items;
    }
  }
  return { XMLParser };
})();

// ── 설정 ──
const KEYWORDS = [
  // 한국어
  '전기차 배터리',
  'LGES 엘지에너지솔루션',
  '삼성SDI',
  'SK온 배터리',
  // 영어
  'EV battery market',
  'Tesla EV sales',
  'CATL battery',
  'EU CO2 regulation electric vehicle',
  'IRA electric vehicle tax credit',
  'BYD electric vehicle',
  'Hyundai Kia EV',
];

const MAX_ITEMS_PER_KEYWORD = 5;
const MAX_TOTAL = 30;
const OUTPUT_PATH = 'data/daily_news.json';

// ── Google News RSS 가져오기 ──
function fetchRSS(keyword) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(keyword);
    const url = `https://news.google.com/rss/search?q=${encoded}&hl=ko&gl=KR&ceid=KR:ko`;

    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 ev-dashboard-bot' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow redirect
        https.get(res.headers.location, res2 => {
          let data = '';
          res2.on('data', c => data += c);
          res2.on('end', () => resolve(data));
        }).on('error', reject);
        return;
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// ── HTML 태그 제거 ──
function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

// ── 중복 제거 (제목 유사도) ──
function dedup(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.title.slice(0, 40).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── 카테고리 자동 분류 ──
function categorize(title) {
  const t = title.toLowerCase();
  if (/tesla|테슬라/.test(t)) return { category: 'Tesla', icon: '🚗', color: 'red' };
  if (/lges|lg에너지|엘지에너지|lg energy/.test(t)) return { category: 'LGES', icon: '🔋', color: 'purple' };
  if (/삼성sdi|samsung sdi/.test(t)) return { category: 'SDI', icon: '🔋', color: 'purple' };
  if (/sk온|sk on|sk이노/.test(t)) return { category: 'SK온', icon: '🔋', color: 'purple' };
  if (/catl/.test(t)) return { category: 'CATL', icon: '🇨🇳', color: 'teal' };
  if (/byd|비야디/.test(t)) return { category: 'BYD', icon: '🇨🇳', color: 'teal' };
  if (/현대|기아|hyundai|kia|제네시스|genesis/.test(t)) return { category: '현대기아', icon: '🇰🇷', color: 'blue' };
  if (/eu |유럽|europe/.test(t)) return { category: '유럽', icon: '🇪🇺', color: 'blue' };
  if (/ira |미국|us |trump|관세|tariff/.test(t)) return { category: '미국', icon: '🇺🇸', color: 'teal' };
  if (/중국|china|chinese/.test(t)) return { category: '중국', icon: '🇨🇳', color: 'red' };
  if (/ess|에너지저장|energy storage/.test(t)) return { category: 'ESS', icon: '⚡', color: 'yellow' };
  if (/배터리|battery|셀|cell/.test(t)) return { category: 'Battery', icon: '🔋', color: 'purple' };
  return { category: 'EV', icon: '🚗', color: 'teal' };
}

// ── Notion에 주요 뉴스 등록 (선택) ──
function notionRequest(path, body) {
  return new Promise((resolve, reject) => {
    const NOTION_TOKEN = process.env.NOTION_TOKEN;
    if (!NOTION_TOKEN) { reject(new Error('No NOTION_TOKEN')); return; }
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
    req.end(data);
  });
}

async function postToNotion(items) {
  const DB_ID = process.env.NOTION_UPDATES_DB_ID;
  if (!DB_ID || !process.env.NOTION_TOKEN) {
    console.log('ℹ️  Notion 토큰 미설정 — DB 등록 건너뜀');
    return;
  }

  // 상위 5개만 Notion에 등록
  const top5 = items.slice(0, 5);
  const today = new Date().toISOString().split('T')[0];

  for (const item of top5) {
    const cat = categorize(item.title);
    try {
      await notionRequest('/v1/pages', {
        parent: { database_id: DB_ID },
        properties: {
          '제목': { title: [{ text: { content: stripHtml(item.title).slice(0, 100) } }] },
          '카테고리': { select: { name: cat.category } },
          '아이콘': { rich_text: [{ text: { content: cat.icon } }] },
          '본문': { rich_text: [{ text: { content: `${stripHtml(item.title)} · ${item.source || 'Google News'}` } }] },
          '색상': { select: { name: cat.color } },
          '섹션': { select: { name: 'update_log' } },
          '대상': { multi_select: [{ name: 'index' }] },
          '날짜': { date: { start: today } },
          '순서': { number: 99 },  // 뉴스봇은 낮은 우선순위
        },
      });
      console.log(`  ✅ Notion 등록: ${stripHtml(item.title).slice(0, 50)}`);
    } catch (e) {
      console.log(`  ⚠️ Notion 등록 실패: ${e.message.slice(0, 80)}`);
    }
  }
}

// ── 메인 ──
async function main() {
  console.log(`\n📰 EV 뉴스 모니터링 시작 — ${new Date().toISOString()}\n`);

  const parser = new XMLParser();
  let allItems = [];

  for (const kw of KEYWORDS) {
    try {
      console.log(`🔍 "${kw}" 검색 중...`);
      const xml = await fetchRSS(kw);
      const items = parser.parse(xml).slice(0, MAX_ITEMS_PER_KEYWORD);
      console.log(`   → ${items.length}건 수집`);
      allItems.push(...items.map(it => ({
        ...it,
        title: stripHtml(it.title),
        keyword: kw,
        ...categorize(it.title),
      })));
    } catch (e) {
      console.log(`   ⚠️ "${kw}" 실패: ${e.message}`);
    }
  }

  // 중복 제거 + 최신순 정렬 + 상한
  allItems = dedup(allItems)
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, MAX_TOTAL);

  console.log(`\n📊 총 ${allItems.length}건 수집 완료`);

  // 카테고리별 통계
  const stats = {};
  allItems.forEach(it => { stats[it.category] = (stats[it.category] || 0) + 1; });
  console.log('📈 카테고리:', JSON.stringify(stats));

  // JSON 저장
  const output = {
    lastUpdated: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    totalItems: allItems.length,
    categoryStats: stats,
    items: allItems.map(it => ({
      title: it.title,
      link: it.link,
      pubDate: it.pubDate,
      source: it.source,
      category: it.category,
      icon: it.icon,
      color: it.color,
      keyword: it.keyword,
    })),
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n💾 ${OUTPUT_PATH} 저장 완료`);

  // Notion 등록 (선택)
  await postToNotion(allItems);

  console.log('\n✅ 뉴스 모니터링 완료\n');
}

main().catch(e => { console.error('❌ 실패:', e.message); process.exit(1); });
