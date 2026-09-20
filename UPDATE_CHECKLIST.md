# 🚗 EV 대시보드 업데이트 체크리스트
> repo: github.com/ParadiseofRumorsbot/ev-dashboard · 최종정리 2026-09-20
> 작업 폴더(정본): origin과 연결된 클론 — PC마다 경로가 다름(예: `…\ev-dashboard\ev-dashboard-repo`, `…\클로드,노션,BOT 파일\ev-dashboard`)

## 0. 항상 지킬 규칙
- [ ] 증권사명 표기 금지 → 원데이터 출처(SNE Research·Rho Motion·WardsAuto·CPCA·KBA·SMMT·ACEA·관세청·LME·US Census 등)
- [ ] X계정·개인 화자·영상 해설을 출처로 쓰지 않음 → 원데이터로 환원
- [ ] 유료 조사기관(SNE·IEA·TrendForce·Marklines 등) 수치를 언론 기사에서 재인용하지 않음 → 원보고서 미확보면 "언론 보도 기준"으로만 쓰고 기관명은 출처에 안 적음(오귀속 방지). 증권사 리포트 표 경유 원데이터는 기존대로 기관명 표기. 검색 스니펫·AI 요약 수치 인용 금지
- [ ] 새로 넣는 수치·출처 캡션에 기준일(공시일·기사일·조회일) 표기 → "최근"·"현재"만 붙은 수치 금지. 기존 캡션 소급은 해당 탭 갱신 시에만
- [ ] 커밋 전 `py scripts/check_sources.py` 실행(보고 전용, 배포 게이트 아님) → 증권사명·개인 화자·재인용 흔적·기준일 누락 목록 확인
- [ ] P/E·밸류에이션 멀티플 분석은 넣지 않음
- [ ] 종목 등재 여부·수혜 논리는 임의 판단 금지 → 사실만, 판단은 사용자
- [ ] 수치는 축약하지 말고 풀어서, 변경 전 텍스트로 설명 후 승인
- [ ] 작업 전 `git fetch origin` + `merge --ff-only origin/main` (여러 PC)

## A. 자동 트래커 (MD 없이 흐르거나 직접 갱신)
### A-1. 📊 미국 수입 트래커 (US Census) — 자동/주간 · ✅ 정상
- 경로: `census-update.yml`(매주 일 09:00 KST) → `fetch-census.js` → `data/census-import.json` → `us-import.html`
- 범위: HS 30코드(셀·소재·원료·차량·알루미늄·솔라·로보틱스) × 21개국(주요+우회감시)
- [ ] 주 1회 census-bot 커밋 확인 / 데이터는 Census 2개월 래그(최신 ≈ 전전월)
- [ ] HS코드·종목·국가 추가 필요 시 `fetch-census.js` 수정

### A-2. FSD / Tesla Robotaxi 트래킹 — ⚠️ 자동화 복구 필요(현재 5/13 정지)
- 경로(설계): 트래커(봇 또는 아침 루틴 web검색) → Notion(FSD metrics·timeline DB) → `sync-robotaxi.js`(6h) → `data/robotaxi_data.json` → robotaxi.html / index.html
- ⚠️ robotaxi_data.json은 Notion에서 sync되므로 **Notion 원천을 갱신**해야 유지됨(JSON 직접수정은 덮어써짐)
- [ ] 무감독 대수(Austin/Dallas/Houston)·총 플릿·총 등록대수
- [ ] FSD 누적/일일 마일·구독자
- [ ] Cybercab 생산·목격·도시 확장·FSD 버전

### A-3. 신차 출시 타임라인 — 자동수집/수동승인
- `news-monitor.yml`(06:30) 수집 → 07:00 텔레그램 브리핑 → 승인 시 launch-table 반영

## B. MD(이배속 Weekly) 정기 데이터
### B-1. 월간 (데이터 공개 시)
- [ ] 글로벌 EV 판매 (SNE)
- [ ] 주요국: 미국(WardsAuto)·중국(CPCA)·독일(KBA)·영국(SMMT)·프랑스(PFA)·스웨덴·노르웨이·유럽합산(ACEA) — 대수·BEV/PHEV·M/S·누적
- [ ] Tesla 지역별(유럽 국가별·중국 수출·미국)·미국 모델별
- [ ] ESS 신규 설치 (Rho Motion): 글로벌/미국/유럽/중국, Grid/BTM, 누적
- [ ] EV용 배터리 출하·점유율·LFP 침투율 (SNE)
- [ ] 양극재(NCM+NCA) 수출액·중량·단가 (관세청)
### B-2. 주간
- [ ] 광물가(리튬·니켈·코발트·망간·Al·구리·LiPF6) (LME·중국현물)
- [ ] 유럽 전력가 (TradingEconomics)
- [ ] 셀·소재·장비 / Car·Energy·Robot 뉴스
### B-3. 분기·비정기
- [ ] CAPA·가동률 / 전고체·나트륨 로드맵 / 정책(AMPC·관세·중간선거) / On-site·DC ESS 수주
### B-4. MD 수치 옮길 때 확인 (2026-09-20 추가)
- [ ] 미국 모델별 표(도표 24)는 직전 호와 대조 — 2026-09-21호는 12개 값 행에서 7월 값을 8월 값으로 덮어써 열이 한 칸 밀렸고, 13개 값 행은 첫 열 고정 + 최근 분기 값 2회 중복 구조였음. 본문 MoM·YoY와 표의 인접 값이 맞는지 검산
- [ ] 같은 호 안에서도 본문과 표 값이 다를 수 있음(8월 미국 BEV 본문 86,186 vs 표 86,168) → BEV+PHEV 합계가 맞는 쪽 사용
- [ ] SNE 글로벌 월별 값은 다음 달 발표에서 바뀜(2026년 5월 185.3만 → 176.3만) → 누계는 최신 자료 기준으로 쓰고 기준일 표기. Rho Motion 누적치도 과거월 소급 개정이 있음(5월 누적 113.2 → 6월 누적 182.2GWh)
- [ ] 월별 차트는 카드와 별개로 하드코딩 — 카드만 갱신하고 차트를 빼먹지 않기(cG·cU·cC·cE, cOEM·c4·cTSLA, bShip·bYoY·bUS·bEU)
### B-5. 탭 간 정합 (2026-09-20 추가)
- [ ] battery_scenario의 `cellMakers`(essGwh·supplyChain·guidance)·`cats`(desc·investPoint·valuation)를 고치면 Battery_bom_routing의 같은 블록도 함께 수정 — BOM 탭은 `notion_variables.json`을 읽지 않고, 시나리오 탭도 검토된 3개 경로만 읽음
- [ ] 전해액 `perGwh`는 정의가 다름: 시나리오 198(점유율 적용 전, `essMS`로 한 번 적용) vs BOM 139(M/S 70% 적용 후) → 값 복사 금지
- [ ] 배터리 맵 `sop`는 "1H26"·"2H26" 또는 연도만 — 타임라인 파서가 분기("4Q26")를 못 읽어 2026.0으로 찍힘. 분기는 note에 적기
- [ ] 로컬 프리뷰는 같은 URL을 다시 열면 브라우저 캐시로 옛 HTML이 보임 → `?v=` 쿼리를 붙여 확인

## C. 테마 워치
- [ ] 유럽 Tesla 판매 반등 / On-site·DC ESS 수요 / 트럼프 정책 Unwinding(중간선거)

## D. 자동/수동 현황
- 자동(서버, PC 무관): news-monitor(06:30)·sync-all(6h)·census-update(주 일)·patent-monitor(주)·deploy-pages(push 시)
- 반자동(앱 켜질 때): ev-launch-monitor 아침 텔레그램 브리핑 → 승인 반영
- 수동(MD 받을 때): B 전체
- ⚠️ 판매 KPI 카드는 하드코딩 → Notion 변수 연동 자동화 필요(경로 A)
