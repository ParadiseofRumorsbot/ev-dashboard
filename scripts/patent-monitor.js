/**
 * patent-monitor.js
 * 매주 월요일 8AM KST 자동 실행 — 배터리·EV 특허 모니터링
 *
 * 목적: 주요 OEM·셀 업체의 배터리·EV 관련 특허 뉴스 수집
 * 프로세스: Google News RSS 수집 → data/weekly_patents.json 저장 → 사용자 확인 후 반영
 *
 * 환경변수: (없음 — RSS만 사용)
 * 의존성: 없음 (Node.js 내장 모듈만)
 */

const https = require('https');
const fs = require('fs');

// ── 특허 검색 키워드 ──
const KEYWORDS = [
  // 셀 화학
  'battery patent solid state electrolyte',
  'battery patent NMC cathode silicon anode',
  'battery patent LFP lithium iron phosphate',
  'sodium ion battery patent',
  'lithium sulfur battery patent',
  // 셀 구조·제조
  'battery patent dry electrode',
  'battery patent cell-to-pack CTP',
  'battery patent cell-to-chassis CTC',
  'battery patent 4680 cylindrical cell',
  // BMS·충전
  'EV battery patent 800V charging',
  'battery management system patent BMS',
  'vehicle-to-grid V2G patent',
  // 리사이클링
  'battery recycling patent direct recycling',
  'lithium battery recycling hydrometallurgy patent',
  // OEM별
  'Samsung SDI battery patent',
  'LG Energy Solution battery patent',
  'SK On battery patent',
  'CATL battery patent filing',
  'Tesla battery patent dry electrode',
  'Toyota solid state battery patent',
  'Panasonic battery patent',
  'BYD battery patent blade',
  // 한국어
  '배터리 특허 출원 전고체',
  '2차전지 특허 삼성SDI LG에너지',
  '배터리 특허 건식전극 음극재',
];

const MAX_ITEMS_PER_KEYWORD = 3;
const MAX_TOTAL = 40;
const OUTPUT_PATH = 'data/weekly_patents.json';

// ── 특허 관련성 필터 키워드 ──
const RELEVANCE_KEYWORDS = [
  'patent', 'filed', 'granted', 'application', 'invention',
  'intellectual property', 'IP', 'claims', 'USPTO', 'EPO', 'WIPO',
  'KIPRIS', 'filing', 'published', 'assignee',
  'solid state', 'solid-state', 'electrolyte', 'cathode', 'anode',
  'separator', 'dry electrode', 'silicon', 'graphite',
  'NMC', 'NCM', 'LFP', 'LMFP', 'sodium ion', 'lithium sulfur',
  'cell-to-pack', 'CTP', 'CTC', '4680', '46xx',
  '800v', 'fast charging', 'BMS', 'thermal management',
  'recycling', 'recycle', 'recovery', 'hydrometallurgy',
  '특허', '출원', '등록', '공개', '발명',
  '전고체', '건식전극', '음극재', '양극재', '분리막', '전해질',
];

// ── 비관련 필터 ──
const EXCLUDE_KEYWORDS = [
  'stock price', 'shares', 'earnings', 'revenue', 'profit',
  'lawsuit', 'infringement suit', 'troll',
  '주가', '실적', '매출', '소송',
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
    const url = `https://news.google.com/rss/search?q=${encoded}+when:7d&hl=en&gl=US&ceid=US:en`;
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

// ── 관련성 점수 ──
function relevanceScore(title) {
  const t = title.toLowerCase();
  for (const ex of EXCLUDE_KEYWORDS) {
    if (t.includes(ex.toLowerCase())) return -1;
  }
  let score = 0;
  for (const kw of RELEVANCE_KEYWORDS) {
    if (t.includes(kw.toLowerCase())) score++;
  }
  return score;
}

// ── 업체 분류 ──
function classifyCompany(title) {
  const t = title.toLowerCase();
  if (/samsung sdi|삼성sdi|삼성에스디아이/.test(t)) return 'Samsung SDI';
  if (/lg energy|lg에너지|lges/.test(t)) return 'LG Energy';
  if (/sk on|sk이노|sk innovation/.test(t)) return 'SK On';
  if (/catl|닝더스다이/.test(t)) return 'CATL';
  if (/byd|비야디/.test(t)) return 'BYD';
  if (/tesla/.test(t)) return 'Tesla';
  if (/toyota|도요타/.test(t)) return 'Toyota';
  if (/panasonic|파나소닉/.test(t)) return 'Panasonic';
  if (/hyundai|현대/.test(t)) return 'Hyundai';
  if (/bmw/.test(t)) return 'BMW';
  if (/mercedes|benz/.test(t)) return 'Mercedes';
  if (/volkswagen|vw/.test(t)) return 'VW';
  if (/ampx|sila|group14|quantumscape|solid power/.test(t)) return 'Startup';
  return 'Other';
}

// ── 기술 분류 ──
function classifyTech(title) {
  const t = title.toLowerCase();
  if (/solid.state|전고체|sulfide|oxide electrolyte/.test(t)) return '전고체';
  if (/dry electrode|건식전극/.test(t)) return '건식전극';
  if (/cathode|양극|nmc|ncm|lmfp|lfp|nickel/.test(t)) return '양극재';
  if (/anode|음극|silicon|graphite|리튬메탈/.test(t)) return '음극재';
  if (/separator|분리막|electrolyte|전해질/.test(t)) return '전해질/분리막';
  if (/recycl|리사이클|재활용|recovery/.test(t)) return '리사이클링';
  if (/bms|thermal|냉각|management/.test(t)) return 'BMS/열관리';
  if (/charging|충전|800v|fast charge|v2g/.test(t)) return '충전';
  if (/ctp|ctc|cell.to|4680|cell design|셀 구조/.test(t)) return '셀 구조';
  if (/manufacturing|제조|coating|stacking|공정/.test(t)) return '제조공정';
  return '기타';
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
  console.log(`\n🔬 배터리·EV 특허 모니터링 — ${new Date().toISOString()}\n`);

  let allItems = [];

  for (const kw of KEYWORDS) {
    try {
      process.stdout.write(`  🔍 "${kw.slice(0, 45)}..." `);
      const xml = await fetchRSS(kw);
      const items = parseRSS(xml).slice(0, MAX_ITEMS_PER_KEYWORD);
      const relevant = items.filter(it => relevanceScore(it.title) > 0);
      console.log(`${items.length}건 → ${relevant.length}건 관련`);
      allItems.push(...relevant.map(it => ({
        ...it,
        keyword: kw,
        company: classifyCompany(it.title),
        tech: classifyTech(it.title),
        score: relevanceScore(it.title),
      })));
    } catch (e) {
      console.log(`⚠️ 실패: ${e.message.slice(0, 50)}`);
    }
  }

  // 중복 제거 + 관련성 순 + 상한
  allItems = dedup(allItems)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_TOTAL);

  // 통계
  const companyStats = {};
  const techStats = {};
  allItems.forEach(it => {
    companyStats[it.company] = (companyStats[it.company] || 0) + 1;
    techStats[it.tech] = (techStats[it.tech] || 0) + 1;
  });

  console.log(`\n📊 총 ${allItems.length}건 수집`);
  console.log('🏭 업체:', JSON.stringify(companyStats));
  console.log('🔬 기술:', JSON.stringify(techStats));

  // JSON 저장
  const output = {
    type: 'battery_patent_monitor',
    lastUpdated: new Date().toISOString(),
    weekOf: new Date().toISOString().split('T')[0],
    description: '배터리·EV 특허 모니터링 — 주간 수집',
    note: '⚠️ 자동 수집 결과입니다. 대시보드 반영 전 사용자 확인 필요.',
    totalItems: allItems.length,
    companyStats,
    techStats,
    items: allItems.map(it => ({
      title: it.title,
      link: it.link,
      pubDate: it.pubDate,
      source: it.source,
      company: it.company,
      tech: it.tech,
      score: it.score,
    })),
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`💾 ${OUTPUT_PATH} 저장`);
  console.log('\n✅ 완료 — 사용자 확인 대기\n');
}

main().catch(e => { console.error('❌ 실패:', e.message); process.exit(1); });
