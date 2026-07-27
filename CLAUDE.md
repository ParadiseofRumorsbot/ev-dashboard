# 전역 작업 규칙 — Karpathy Guidelines 확장판

> **적용 범위**: 코드 작성·리뷰·리팩터링, 그리고 코드가 데이터·수치를 만지는 모든 작업.
> 리서치·노션 정리 등 비코드 작업에는 해당 없음.
> **우선순위**: 사용자의 현재 지시 > 메모리 규칙 > 이 파일.
> **예외**: 오타 수정 등 명백히 사소한 작업은 판단껏 절차 간소화.

## 0. 작업 루프 — 모든 코드 변경의 기본 사이클

**제안 → 승인 → 구현 → 검증 → 증거로 보고**

- 제안: 무엇을·왜·어느 파일에서 바꾸는지 설명 후 승인 대기.
- 구현: 승인된 범위만. 여러 PC에서 쓰는 레포는 시작 전 `git pull` 먼저.
- 검증: 완료 선언 전 실제 실행으로 확인.
- 보고: "될 겁니다" 금지. 실제 출력·전후 값이 증거. 실패·미검증 항목은 그대로 밝힘.

## 1. Think Before Coding — 가정 금지, 혼란 은폐 금지

- 가정은 명시하고, 불확실하면 구현 전에 질문.
- 해석이 여러 개면 모두 제시하고 추천안을 표시 — 조용히 하나 고르지 않기.
- 더 간단한 방법이 보이면 코드 쓰기 전에 말하기. 요청 자체에 문제가 있으면 반박.

## 2. Simplicity First — 문제를 푸는 최소한의 코드

- 요청 이상의 기능·유연성·설정화 금지. 일회성 코드에 추상화 금지.
- 일어나지 않을 시나리오용 방어 코드 금지.
- 새 의존성·라이브러리·프레임워크 추가는 반드시 선제안·승인.
- 새 파일 생성보다 기존 파일 수정 우선.
- 기준: 200줄이 50줄로 줄 수 있으면 다시 쓴다. "시니어 개발자가 과설계라 하겠는가?"

## 3. Surgical Changes — 승인된 범위 밖은 한 글자도 건드리지 않기

- 인접 코드·주석·포매팅 "개선" 금지. 안 깨진 것 리팩터링 금지.
- 기존 코드 스타일 준수 — 내 방식과 달라도.
- 죽은 코드·이상해 보이는 부분 발견 시 삭제하지 말고 보고만.
- 내 변경이 만든 고아(import·변수·함수)만 정리. 기존 죽은 코드는 요청 없이 불변.
- **데이터 보호**: 하드코딩된 수치·출처 표기·데이터 파일 값은 코드 작업 중 부수 수정 절대 금지.
  값이 틀려 보여도 보고만 — 대시보드 수치에는 검증 이력이 있음.
- 최종 기준: diff의 모든 줄이 사용자 요청으로 직접 소급되는가.

## 4. Verify Before Done — 검증 없이 완료 선언 없음

- 시작 전 성공 기준 한 줄 정의: "무엇이 어떻게 되면 완료인가".
- 다단계 작업은 [단계 → 검증 방법] 형식의 짧은 계획 먼저.
- 테스트가 있는 코드: 테스트 먼저 (버그 → 재현 테스트 작성 → 통과).
- 테스트가 없는 코드(대시보드·스크립트·자동화): 실행이 곧 테스트 —
  스크립트 실행, 페이지 열어 콘솔 에러 확인, 산출물 직접 확인.
- 코드 변경으로 산출 수치가 달라지면 변경 전/후 값을 반드시 나란히 보고.


---

# CLAUDE.md — ev-dashboard

**이 레포(EV·배터리·로보택시 투자 대시보드, 정적 HTML/JS + GitHub Actions)에서 Claude가 작업할 때의 규칙.**

## 0. 작업 원칙

- **변경 전 승인**: 무엇을·왜·어느 파일에서 바꾸는지 설명하고 승인받은 뒤 구현. 완료 선언 전 실제 렌더로 검증.
- **데이터 보호**: 하드코딩된 수치·출처 표기·데이터 값은 다른 작업 중 부수 수정 절대 금지. 값이 틀려 보여도 보고만 — 수치에는 별도 검증 이력이 있음.
- **출처 표기**: 증권사명 명기 금지 — 원데이터 출처만 표기(예: `출처: Marklines`).
- **비밀값 금지**: 토큰·API 키·Notion DB/collection ID는 레포에 기록 금지 — GH Secrets와 로컬 메모리에서만 관리(워크플로우는 Secrets 참조로만 사용).

## 1. Git — 여러 PC에서 작업하는 레포

- origin/main 직접 푸시 방식(브랜치/PR 없음).
- **작업 시작 전 반드시 `git fetch origin` + `git merge --ff-only origin/main`** — 로컬이 수십 커밋 뒤처져 있을 수 있음.
- 로컬에 zip 해제본·옛 클론 등 사본이 여러 개 있을 수 있음 → 반드시 origin과 연결된 이 레포 클론에서만 작업.

## 2. 탭 구성

| 파일 | 내용 |
|---|---|
| index.html | 글로벌 EV 판매·KPI 카드·신차 타임라인(데이터: roadmap_data.js 인라인 로드, 렌더: `rm*` 함수) |
| global_battery_map.html | 북미 셀+ESS 거점 CAPA 맵·Sankey·US 수요 시나리오(`DEM` 객체, Bear/Base/Bull) |
| battery_scenario.html | 시나리오 엔진 — 공급측 `northAmericaCapa`·시나리오 프리셋·EU CO2 슬라이더·AIDC·금속 계산기 |
| Battery_bom_routing.html | BOM·탈중국 임계치 — battery_scenario와 동일 DATA 객체 공유(bom 쪽이 구버전) |
| battery_tech.html | 전고체·LFP·Na-ion 등 기술 로드맵·특허 |
| 2차전지_컨콜정리.html | 컨콜 정리 |
| robotaxi.html | FSD·로보택시 — 차트 c1~c6 하드코딩(§4) |
| us-import.html | US Census 수입 트래커 — data/census-import.json 동적 렌더 |

- 대부분의 데이터는 HTML 인라인에 박혀 있고, `data/*.json`은 일부 페이지만 사용.
- US 수요 시나리오(Bear/Base/Bull)의 소재지는 **global_battery_map.html**(battery_scenario 아님) — 혼동 이력 있음.

## 3. 데이터 파이프라인 — 수정은 Notion 원천에서

**대원칙: sync 대상 데이터는 JSON/HTML을 직접 고치지 말 것 — sync가 Notion 원천으로 덮어씀.** 수정은 Notion DB에서 하고 sync를 돌린다.

| 산출물 | 원천 | 동기화 |
|---|---|---|
| notion_variables.json | 모델변수 DB(Notion) | sync-notion.js (sync-all.yml, 6시간마다) |
| robotaxi_data.json | FSD메트릭 DB + 타임라인 DB(Notion) | sync-robotaxi.js |
| weekly_updates.json | 주간 업데이트 DB(Notion) | sync-updates.js |
| data/census-import.json | US Census API | fetch-census.js (census-update.yml, 주간) |
| daily_news.json | 뉴스 모니터 | news-monitor.yml — **커밋하지 않고 artifact만 생성**(승인 게이트 설계, 고장 아님). 최신본은 `gh run download <run> -n daily-news` |

주간 업데이트 DB 규칙:
- sync는 **가장 최근 날짜 행만** this_week/update_log로 노출하고 나머지는 archive로 밀어냄 — "옛 항목이 왜 안 보이나"의 원인.
- `대상` multi_select(index/robotaxi/both)가 어느 탭에 뜰지 결정. `순서` ≥90 행은 sync 제외.
- **this_week 새 행의 제목에 이모지 금지** — 렌더러가 아이콘 필드+제목을 이어붙여 이모지가 중복 표시됨(아이콘 필드만 사용). update_log는 아이콘+본문이라 무관.
- Notion MCP 쓰기 시 날짜는 확장키 `date:기준일:start` 형식(단일 값은 400 에러). FSD메트릭 DB는 **이력 보존형** — 기존 행 수정이 아니라 새 날짜 행 생성.

## 4. 하드코딩 영역 — sync가 안 건드림(직접 편집+푸시 필요)

- **robotaxi.html 차트 6개(c1~c6, Chart.js)**: JSON 미연동 — 절대 자동 갱신 안 됨. 최신화는 `new Chart(...)` 데이터 배열 직접 편집.
- **index.html 글로벌 EV 판매 카드**: Notion 연동 해제됨(하드코딩 전환) — notion_variables.json의 해당 값은 orphan이며 카드가 읽지 않음. KPI 상단 카드 일부도 원래부터 하드코딩.
- 다른 탭 차트도 하드코딩일 수 있음 — "sync가 자동 갱신할 것"이라는 가정 금지, 실제 바인딩 여부부터 확인.
- **Tesla 모델별 차트(cTSLA)는 Wards 기준 유지로 확정** — Autodata로 교체 금지(소스 간 모순·모델 커버리지 손실 검토 후 결정된 사항).
- robotaxi.html `renderMetrics`는 `cum_miles`·`daily_miles`·`austin_unsupervised`·`total_unsupervised` 4개 키만 화면에 바인딩 — 나머지 지표는 JSON에만 적재됨. note 필드는 렌더되므로 부가 수치는 note로 노출 가능.

## 5. 배포 — 2스텝, 봇 푸시는 deploy를 트리거 못함

- 즉시 라이브 반영은 **2스텝**: ① `gh workflow run sync-all.yml`(Notion→JSON 커밋) → ② `gh workflow run deploy-pages.yml`(GitHub Pages 배포).
- **봇(GITHUB_TOKEN) 푸시는 GitHub 재귀 방지로 deploy-pages의 push 트리거를 못 일으킴** → 스케줄 재배포를 기다리거나 deploy-pages를 수동 트리거해야 함. 사람 계정의 실제 `git push`는 push 이벤트로 자동 트리거됨.
- "커밋·푸시는 됐는데 라이브만 구버전"이면 GitHub Actions 장애 가능성 — githubstatus.com 확인 후 복구되면 재트리거.

## 6. 검증 — 라이브는 WebFetch 금지, 브라우저로

- 페이지 날짜·지표·차트는 JS가 런타임에 JSON에서 그려 넣음 → **WebFetch는 JS 미실행이라 하드코딩 폴백값만 읽힘**. 라이브 검증은 반드시 브라우저로 렌더값을 읽을 것.
- "라이브가 안 바뀐 것 같다" 진단 순서: ① `gh run list`로 deploy-pages 성공 확인 → ② 브라우저 렌더값 확인.
- **로컬 프리뷰 함정**: preview 서버가 구버전 스냅샷을 서빙할 수 있음 → 편집본 검증은 `py -m http.server <포트>`로 직접 띄운 URL에서. 커밋 전 `curl localhost:<포트>/... | grep <새값>` 교차확인 권장.
- tesla.com/fsd/safety는 WebFetch 403이지만 브라우저로는 정상 열림. robotaxitracker.com도 JS 대시보드라 브라우저 렌더값으로 읽어야 정확함.

## 7. FSD 트래커 — 누적 vs 30일 활성 2계열 (최대 함정)

- 무감독 차량 수는 **2개 계열**이 별도로 존재: ① **누적**(메인 "플릿 성장" 섹션, `Cumulative verified unsupervised vehicles`) ② **30일 활성**(`/unsupervised` 페이지 MARKETS). 대시보드의 기존 값은 ①누적 계열을 일관되게 따름.
- **한쪽 계열만 보고 기존 값을 오류로 단정·수정 금지** — 실제로 활성 계열만 보고 누적 값을 "오기재"로 고쳤다가 되돌린 사고 이력 있음.
- 활성 계열은 `active_unsupervised` 등 별도 지표로 분리 적재. `total_registered`는 트래커의 "ALL TRACKED"에 대응(주 DMV 등록 수치는 또 다른 별개 계열).

## 8. 리튬 가격 갱신

- 소스: 로컬 데이터 폴더의 리튬가격 xlsx(주기 발행, 레포 외부 — 경로는 로컬 메모리 참조).
- weekly 시트(중국 탄산리튬) → battery_scenario.html `LI_WEEKLY` 배열에 append. `METALS.Li.price`는 LI_WEEKLY 마지막 값을 읽으므로 주간만 append하면 금속 계산기 현재가 자동 갱신.
- **monthly 시트도 함께 확인** — 당월 마감 후에만 월간 행이 실리므로 그때 `LI_MONTHLY`도 갱신(직전월 값으로 컬럼 매핑 역검증 가능).

## 9. 기타

- 별도 노션 리서치의 AIDC-BESS 원단위(GWh/GW) 자료와 이 대시보드 battery_scenario의 AIDC 섹션은 **프레임이 다름** — 두 자료를 섞어 인용하지 말 것.
- 아침 루틴: 로컬 예약작업이 daily_news 기반 텔레그램 브리핑 발송 → **사용자 승인 후에만** 대시보드·Notion 반영(자동 반영 아님).
