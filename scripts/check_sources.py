#!/usr/bin/env python3
"""EV 대시보드 출처 표기 점검 — 보고 전용 (배포 게이트 아님, 항상 exit 0)

사용법:
    py scripts/check_sources.py

검사 대상: 루트 *.html, 루트 *.js, data/*.json 의 '출처:' 캡션 줄 (템플릿 `${...}` 줄은 제외)
점검 항목 (UPDATE_CHECKLIST.md §0):
  [위반]      증권사 실명 — humanoid-dashboard update_dashboard.py BLOCKED_SOURCES와 동일 목록
  [위반]      검색 스니펫·AI 요약 흔적
  [확인 필요] 개인 화자·X계정·영상·블로그
  [확인 필요] 유료 조사기관 수치의 언론 경유 재인용 흔적 (기관명 + 언론/보도/기사 동시 등장, "보도자료"는 제외)
  [목록]      기준일·연도 없는 캡션 (data/*.json은 별도 날짜 필드가 있어 제외)
"""
import glob
import io
import os
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")  # Windows cp949 콘솔 대응

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

BROKERS = [
    "대신증권", "LS증권", "미래에셋증권", "삼성증권", "NH투자증권",
    "한국투자증권", "KB증권", "키움증권", "신한투자증권", "하나증권",
    "메리츠증권", "유진투자증권", "IBK투자증권", "iM증권", "교보증권",
    "신영증권", "한화투자증권", "DB금융투자", "BNK투자증권",
    "SK증권", "현대차증권", "하이투자증권", "유안타증권",
    "다올투자증권", "Cape투자증권", "토스증권",
    "Morgan Stanley", "JP Morgan Research", "Barclays Research",
    "Citi Research", "UBS Research", "Deutsche Bank Research",
    "BofA Research", "Credit Suisse Research", "Jefferies",
    "Bernstein", "Nomura Research", "CLSA", "Macquarie Research",
]
PERSONAL = ["Troy Teslike", "유튜브", "YouTube", "영상", "대표님", "트위터",
            "X계정", "X 계정", "텔레그램", "블로그", "카페", "커뮤니티"]
PERSONAL_RE = re.compile(r"@[A-Za-z0-9_]{3,}")
PAID_RE = re.compile(
    r"(?<![A-Za-z])(SNE|TrendForce|Marklines|IEA|BNEF|BloombergNEF|Rho Motion|EV Volumes|"
    r"Benchmark Mineral|Wood Mackenzie|Fastmarkets)(?![A-Za-z])", re.I)
MEDIA = ["언론", "보도", "기사", "뉴스", "신문", "매체"]
SNIPPET = ["스니펫", "snippet", "AI 요약", "검색 결과"]
DATE_RE = re.compile(r"20\d\d|(?<!\d)\d{6}(?!\d)|'2\d|(?<!\d)\d{2}\.\d{2}(?!\d)|[A-Z][a-z]{2}-\d{2}|FY2\d")
CAP_RE = re.compile(r"출처[:：][^<\"\n]{0,200}")


def captions():
    for pat in ("*.html", "*.js", "data/*.json"):
        for path in sorted(glob.glob(os.path.join(ROOT, pat))):
            rel = os.path.relpath(path, ROOT)
            with io.open(path, encoding="utf-8", errors="replace") as fh:
                for no, line in enumerate(fh, 1):
                    if "출처" not in line or "${" in line:
                        continue
                    for m in CAP_RE.finditer(line):
                        yield rel, no, m.group(0).strip()


def main():
    found = {"broker": [], "snippet": [], "personal": [], "reprint": [], "nodate": []}
    total = 0
    for rel, no, cap in captions():
        total += 1
        low = cap.lower()
        hit = (rel, no, cap[:100])
        if any(b.lower() in low for b in BROKERS):
            found["broker"].append(hit)
        if any(s.lower() in low for s in SNIPPET):
            found["snippet"].append(hit)
        if any(p.lower() in low for p in PERSONAL) or PERSONAL_RE.search(cap):
            found["personal"].append(hit)
        if PAID_RE.search(cap) and any(w in cap.replace("보도자료", "") for w in MEDIA):
            found["reprint"].append(hit)
        if not rel.startswith("data") and not DATE_RE.search(cap):
            found["nodate"].append(hit)

    print(f"출처 캡션 {total}건 점검 (보고 전용 — 배포 게이트 아님)\n")
    sections = [
        ("broker", "[위반] 증권사 실명"),
        ("snippet", "[위반] 검색 스니펫·AI 요약 흔적"),
        ("personal", "[확인 필요] 개인 화자·X계정·영상·블로그"),
        ("reprint", "[확인 필요] 유료 조사기관 수치의 언론 경유 재인용 흔적"),
        ("nodate", "[목록] 기준일·연도 없는 캡션"),
    ]
    for key, title in sections:
        rows = found[key]
        print(f"{title}: {len(rows)}건")
        for rel, no, cap in rows:
            print(f"  {rel}:{no}  {cap}")
        print()
    sys.exit(0)


if __name__ == "__main__":
    main()
