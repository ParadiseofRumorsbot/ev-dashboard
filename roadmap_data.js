/* ============================================================
   OEM 중장기 BEV 출시 로드맵 (2021~2030E) · 연도 × 지역
   출처: Marklines  (탈중국망 기회 리포트 표 재구성, 2026.06.18)
   - PDF 페이지 렌더링 이미지로 셀 위치 전수 검증 (2026-06-19)
   - 모델명 내 annotation 그대로 보존:
       refresh / facelift  → 페이스리프트 (이탤릭)
       (추가)               → 신규 추가
       (LFP 추가)           → LFP 트림
       (출시 계획 폐기)      → 취소
       (연기; ...) (조기 출시; ...) (EREV 전환) (PHEV 전환) → 일정/구동 변경
   - GM 표의 이탤릭(원문)은 SGMW(Baojun/Wuling) 표시이며 페이스리프트 아님 →
     본 데이터는 텍스트 annotation 기준으로만 스타일링.
   ============================================================ */
const ROADMAP = {
  years: ["2021","2022","2023","2024","2025","2026E","2027E","2028E","2029E","2030E"],

  oems: {
    Tesla: {
      label: "Tesla", flag: "🇺🇸", regions: ["북미","유럽","중국"],
      sched: {
        "2021": {"북미":["Model S refresh","Model X refresh"], "유럽":["Model Y"], "중국":["Model Y"]},
        "2022": {"유럽":["Model S refresh","Model X refresh"]},
        "2023": {"북미":["Cybertruck"], "유럽":["Model 3 refresh(Highland)"], "중국":["Model S refresh","Model X refresh","Model 3 refresh(Highland)"]},
        "2024": {"북미":["Model 3 refresh(Highland)"]},
        "2025": {"북미":["Model Y refresh(Juniper)"], "유럽":["Model Y refresh(Juniper)"], "중국":["Model Y refresh(Juniper)"]},
        "2026E": {"북미":["Compact car(Redwood)","Cybercab","Tesla Semi"], "유럽":["Compact car(Redwood)"], "중국":["Compact car(Redwood)"]},
        "2027E": {"북미":["Roadster (연기; 2025→2027)"], "유럽":["Tesla Semi"]},
        "2028E": {},
        "2029E": {"북미":["Model 3 (추가)"]},
        "2030E": {"유럽":["Model 3 (추가)"], "중국":["Model 3 (추가)"]}
      }
    },

    VW: {
      label: "VW Group", flag: "🇩🇪", regions: ["북미","유럽","중국"],
      sched: {
        "2021": {"북미":["Audi e-tron GT / Audi Q4 e-tron","VW ID.4"], "유럽":["Audi e-tron GT / Audi Q4 e-tron","Cupra Born"], "중국":["Audi e-tron","VW ID.3 / VW ID.4 / VW ID.6"]},
        "2022": {"유럽":["VW ID.5 / VW ID. Buzz"], "중국":["Audi Q4 e-tron / Audi Q5 e-tron"]},
        "2023": {"북미":["Audi Q8 e-tron/SQ8 e-tron"], "유럽":["Audi Q8 e-tron / SQ8 e-tron","ID.7 / ID.7 Tourer"], "중국":["VW ID.7"]},
        "2024": {"북미":["VW ID. Buzz","Audi Q6 e-tron/SQ6 e-tron","Porsche Macan EV"], "유럽":["Audi Q6 e-tron / SQ6 e-tron","Audi A6 e-tron / S6 e-tron","Cupra Tavascan","Porsche Macan EV"], "중국":["Cupra Tavascan","Porsche Macan EV"]},
        "2025": {"북미":["Audi A6 e-tron / S6 e-tron"], "유럽":["VW Transporter","Skoda Elroq","Skoda Enyaq facelift"], "중국":["VW ID. UNYX 06","Audi A6L e-tron","Audi Q6L e-tron","Audi E5 Sportback"]},
        "2026E": {"유럽":["Skoda Peaq / Skoda Epiq (LFP 추가)","VW ID. Polo (LFP 추가) / ID. Cross (LFP 추가)","Audi Q2 e-tron","Cupra Raval (LFP 추가)","Porsche Cayenne Electric","Cupra Born facelift (LFP 추가)","Audi Q4 e-tron facelift (추가)","VW ID.3 Neo facelift (추가)"], "중국":["Jetta M6","VW ID. CODE","VW ID. UNYX 07 / VW ID. UNYX 08","VW ID. UNYX 09 (추가)","VW ID. AURA / VW ID. AURA T6 (추가)","Audi Mid-to Large-size EV / Audi E7X","Audi Mid-size SUV (조기 출시; 2027→2026)"]},
        "2027E": {"북미":["Audi Q8 e-tron / SQ8 e-tron (출시 계획 폐기)"], "유럽":["VW ID. EVERY 1","Audi Q8 e-tron / SQ8 e-tron (출시 계획 폐기)","VW ID.4 facelift (LFP 추가)","VW ID.5 facelift (LFP 추가)","Audi A2 e-tron (추가)"], "중국":["VW ID. Compact SUV (추가)","Jetta J02 (연기; 2026→2027)"]},
        "2028E": {"북미":["Scout Terra","Scout Traveler","Audi Electric Off-road SUV","VW ID.4 facelift (출시 계획 폐기)"], "중국":["Audi Q5 e-tron facelift"]},
        "2029E": {"북미":["Audi Full-size EV","Audi A4 e-tron"], "유럽":["ID. Golf","VW Electric Compact SUV(연기; 2026→2029)","Audi A4 e-tron ,Audi Full-size EV"]},
        "2030E": {"북미":["VW ID Compact SUV"], "유럽":["Skoda Estate EV","Audi Electric Full-size SUV","Porsche Electric Full-size SUV","VW ID.3 X","Cupra Born (추가)"]}
      }
    },

    Hyundai: {
      label: "현대차그룹", flag: "🇰🇷", regions: ["북미","유럽","중국"],
      sched: {
        "2021": {"북미":["Hyundai Ioniq 5"], "유럽":["Hyundai Ioniq 5","Kia EV6"]},
        "2022": {"북미":["Genesis G80","Genesis GV60","Kia EV6","Kia Niro"], "유럽":["Genesis GV70","Genesis GV60","Kia Niro","Genesis G80"]},
        "2023": {"북미":["Genesis GV70","Hyundai Ioniq 6","Kia EV9","Hyundai Kona"], "유럽":["Hyundai Kona","Hyundai Ioniq 6","Kia EV9"], "중국":["Kia EV5 (LFP 추가)"]},
        "2024": {"유럽":["Kia EV3","Hyundai Casper"]},
        "2025": {"북미":["Hyundai Ioniq 9","Kia EV6 facelift","Genesis GV60 facelift","Genesis GV70 facelift"], "유럽":["Kia EV4, Kia EV5, Kia PV5","Hyundai Ioniq 9","Hyundai Casper crossover","Genesis GV60 facelift, GV70 facelift","Hyundai Ioniq 6 facelift","Kia EV6 facelift"], "중국":["Hyundai EO (LFP 추가)"]},
        "2026E": {"북미":["Kia EV3","Kia EV4 (출시 계획 폐기)","Kia EV8","Kia PV5","Genesis GV90"], "유럽":["Kia EV2 (LFP 추가)","Hyundai Ioniq 3 (LFP 추가)","Genesis GV90"], "중국":["Kia EV4","Hyundai Ioniq V (LFP 추가)"]},
        "2027E": {"북미":["Kia PV7"], "유럽":["Kia EV6","Kia PV7","Genesis GV60","Kia B-Hatchback EV (추가)"], "중국":["Hyundai Ioniq Electric SUV (LFP 추가)"]},
        "2028E": {"북미":["Kia PV1 (출시 계획 폐기)","Kia EV6","Hyundai Ioniq 5","Genesis GV60"], "유럽":["Kia PV1 (출시 계획 폐기)","Hyundai Ioniq 5"]},
        "2029E": {"북미":["Kia Electric Pickup truck (EREV 전환)","Hyundai Ioniq 6 (출시 계획 폐기)","Kia PV9 (추가)","Hyundai Mid-size Pickup (추가)"], "유럽":["Kia EV7","Hyundai Ioniq 6","Kia PV9 (추가)"], "중국":["Kia EV7","Kia EV5"]},
        "2030E": {"북미":["Kia EV9","Genesis G80"], "유럽":["Kia EV9","Genesis G80"]}
      }
    },

    GM: {
      label: "GM", flag: "🇺🇸", regions: ["북미","유럽","중국"],
      note: "원문 이탤릭 = SGMW(Baojun·Wuling) 중국 JV 브랜드",
      sched: {
        "2021": {"북미":["Chevrolet Bolt EUV","GMC Hummer EV Pickup","Chevrolet Brightdrop 600"], "중국":["Baojun KiWi EV","Wuling Nano EV"]},
        "2022": {"북미":["Cadillac Lyriq","Cruise AV"], "중국":["Cadillac Lyriq","Wuling Air EV"]},
        "2023": {"북미":["Chevrolet Silverado EV","Chevrolet Blazer EV","GMC Hummer EV SUV","Chevrolet Brightdrop 400"], "유럽":["Cadillac Lyriq"], "중국":["Baojun Yep","Buick Electra E5","Wuling Bingo","Buick Electra E4","Baojun Yunduo","Wuling Xingguang"]},
        "2024": {"북미":["GMC Sierra EV","Chevrolet Equinox EV","Cadillac Escalade IQ"], "중국":["Cadillac Optiq","Baojun Yep PLUS","Wuling Hongguang EV","Wuling Xingguang S","Baojun Yunhai","Wuling Bingo PLUS","Wuling Yangguang"]},
        "2025": {"북미":["Cadillac Optiq","Cadillac Vistiq","Cadillac Celestiq"], "중국":["Wuling Hongguang MINI EV 4-Door","Wuling Sunshine EV","Baojun Xiangjing","Buick Electra Encasa","Wuling Bingo S","Wuling Xingguang 730"]},
        "2026E": {"북미":["Chevrolet Bolt EV"], "중국":["Cadillac Vistiq","Buick Electra E7 (출시 계획 폐기)","Buick Electra L7 (추가)","Baojun Huajing S (PHEV 전환)","Wuling Xingguang 560 (연기; 2025→2026)","Wuling Rongguang NEV (추가)","Wuling Hongguang MINI EV 4-Door (추가)"]},
        "2027E": {"북미":["Chevrolet Suburban EV (출시 계획 폐기)","Chevrolet Tahoe EV (출시 계획 폐기)","GMC Yukon(출시 계획 폐기)"]},
        "2028E": {"북미":["Light Commercial EV Van"], "중국":["Baojun Yep"]},
        "2029E": {"북미":["Cadillac Lyriq"], "중국":["Wuling Air EV","Wuling Bingo"]},
        "2030E": {}
      }
    },

    Ford: {
      label: "Ford", flag: "🇺🇸", regions: ["북미","유럽","중국"],
      sched: {
        "2021": {"북미":["Ford Mustang Mach-E"], "유럽":["Ford Mustang Mach-E"], "중국":["Ford Mustang Mach-E"]},
        "2022": {"북미":["Ford F-150 Lightening","Ford E-Transit"], "유럽":["Ford E-Transit"]},
        "2023": {},
        "2024": {"유럽":["Ford E-Transit Custom","Ford Explorer EV","Ford Capri","Ford E-Tourneo Custom","Ford E-Tourneo Courier","Ford E-Transit Courier"]},
        "2025": {"유럽":["Ford Puma EV"]},
        "2026E": {"유럽":["Ford E-Transit EV (출시 계획 폐기)","Ford Transit City (추가)"], "중국":["Ford Bronco New Energy (추가)"]},
        "2027E": {"북미":["Ford Mid-size Electric pickup","Ford Mustang Mach-E"], "중국":["Ford Mustang Mach-E"]},
        "2028E": {"북미":["Lincoln Corsair-E","Compact electric SUV","Next-generation pickup (출시 계획 폐기)","Ford E-Transit EV (출시 계획 폐기)"], "유럽":["Ford Mustang Mach-E"]},
        "2029E": {},
        "2030E": {}
      }
    },

    Stellantis: {
      label: "Stellantis", flag: "🇪🇺", regions: ["북미","유럽"],
      sched: {
        "2021": {"유럽":["Opel/Vxh Combo electric / Opel/Vxh Movano-e","Citroen e-Berlingo / Fiat E-Ducato","Peugeot E-Partner / Peugeot E-Rifter"]},
        "2022": {"유럽":["Citroen e-C4 X / Citroen e-Jumper / e-Relay","Opel Rocks-e / Fiat E-Doblo","Fiat E-Scudo / Fiat E-Ulysse"]},
        "2023": {"유럽":["Peugeot E-308 / E-308 SW","Opel/Vxh Astra-e / Opel/Vxh Astra Sports Tourer Electric","Jeep Avenger Electric / Fiat 600e"]},
        "2024": {"북미":["Ram ProMaster EV","Fiat 500e"], "유럽":["Maserati Grecale Folgore BEV","Peugeot e-5008 / Peugeot e-408","Peugeot e-3008 / Opel Grandland-e","Citroen e-C3 / e-C3 Aircross","Alfa Romeo Junior Electric / Fiat Topolino","Lancia Ypsilon EV"]},
        "2025": {"북미":["Dodge Charger Daytona","Jeep Wagoneer S"], "유럽":["Citroen Ami / Fiat Tipo Electric","DSN8 / DSN4 E-Tense / Fiat Grande Panda","Peugeot E-Expert (추가) / Citroen e-C5 Aircross (추가)","Opel/Vxh. Frontera-e / Jeep Compass"]},
        "2026E": {"북미":["Chrysler Mid-size crossover SUV","Dodge Mid-size crossover SUV","Jeep Recon (연기; 2025→2026)"], "유럽":["DSN7 E-Tense","Jeep Renegade EV","Lancia Gamma / DS 5 Crossback","Fiat Qubo L (추가) / Fiat Grizzly (추가)","Leapmotor B03/B03X (추가) / Leapmotor B05 (추가)"]},
        "2027E": {"북미":["Jeep Renegade EV","Alfa Romeo Full-size EV","Ram Mid-size pickup (출시 계획 폐기)","Chrysler Pacifica EV (출시 계획 폐기)","Jeep Wagoneer/Wagoneer L EV (출시 계획 폐기)","Jeep Grand Wagoneer/Grand Wagoneer L","Dodge Durango"], "유럽":["Peugeot E-2008","Peugeot E-208 (연기; 2026→2027)","Alfa Romeo E-Giulia","Alfa Romeo E-Stelvio","Citroen e-C4","DS 3 E-Tense"]},
        "2028E": {"북미":["Jeep Wrangler EV","Alfa Romeo E-Giulia","Alfa Romeo E-Stelvio","Ram Full-size SUV"], "유럽":["Lancia Delta","Citroen e-C4 X","Opel Corsa Electric (연기; 2026→2028)"]},
        "2029E": {},
        "2030E": {"유럽":["Fiat 500e"]}
      }
    },

    Honda: {
      label: "Honda", flag: "🇯🇵", regions: ["북미","유럽","중국"],
      sched: {
        "2021": {},
        "2022": {"중국":["Honda e:NS1","Honda e:NP1"]},
        "2023": {"유럽":["Honda e:Ny1"]},
        "2024": {"북미":["Honda Prologue","Acura ZDX"], "중국":["Honda e:NS2","Honda e:NP2","Honda Lingxi L"]},
        "2025": {"중국":["Honda Ye S7","Honda Ye P7"]},
        "2026E": {"북미":["Acura RSX (출시 계획 폐기)","Honda 0 Saloon (출시 계획 폐기)","AFEELA 1 (출시 계획 폐기)","Honda 0 SUV (출시 계획 폐기)"], "유럽":["Honda 0 Saloon (출시 계획 폐기)","Honda 0 SUV (출시 계획 폐기)","Honda Super-N"], "중국":["Honda Ye GT (연기; 2025→2026)","Honda e:N Coupe"]},
        "2027E": {"북미":["AFEELA Electric SUV (출시 계획 폐기)","Honda Full-size electric SUV"], "유럽":["Honda 0 Alpha"]},
        "2028E": {"북미":["AFEELA Compact EV (출시 계획 폐기)"]},
        "2029E": {"중국":["Honda e:NS1 (출시 계획 폐기)","Honda e:NP1 (출시 계획 폐기)"]},
        "2030E": {"유럽":["Honda e:Ny1 (출시 계획 폐기)"], "중국":["Honda e:NS2","Honda e:NP2","Honda Lingxi L"]}
      }
    }
  },

  /* LFP 트림 출시 계획 (VW·현대차) — 출처: Marklines / VW Group / 언론보도 */
  lfp: {
    VW: {
      cols: ["모델","발표","판매개시","LFP 도입형식","기존 배터리","기존 공급업체","신규 배터리"],
      rows: [
        ["Ford Explorer","26.1월","26.3월","LFP 트림 추가","52kWh NCM","CATL","58kWh LFP"],
        ["Ford Capri","26.1월","26.3월","LFP 트림 추가","52kWh NCM","CATL","58kWh LFP"],
        ["Skoda Enyaq","26.3월","26 중반","LFP 트림 추가","59kWh NCM","LG에너지솔루션","58kWh LFP"],
        ["Skoda Elroq","26.3월","26 중반","LFP 트림 추가","59kWh NCM","SK온","58kWh LFP"],
        ["VW ID.4","26.3월","26 중반","LFP 트림 추가","52kWh NCM","CATL/SK온","58kWh LFP"],
        ["VW ID.5","26.3월","26 중반","LFP 트림 추가","52kWh NCM","LG에너지솔루션","58kWh LFP"],
        ["Cupra Born","26.3월","26 중반","LFP 트림 추가","58kWh NCM","LG에너지솔루션","58kWh LFP"],
        ["VW ID.3 Neo","26.4월","26 중반","페이스리프트 (LFP 2 / NCM 1)","52kWh NCM","CATL/SK온","50·58kWh LFP, 79kWh NCM"],
        ["VW ID. Polo","26.4월","26 하반기","신차 출시","-","-","37kWh LFP, 52kWh NCM"],
        ["Skoda Epiq","26.5월","26.7월","신차 출시","-","-","37kWh LFP, 52kWh NCM"],
        ["Cupra Raval","26.4월","26.7월","신차 출시","-","-","37kWh LFP, 52kWh NCM"],
        ["VW ID. Cross","26 하반기","26 하반기","신차 출시","-","-","37kWh LFP, 52kWh NCM"]
      ]
    },
    Hyundai: {
      cols: ["브랜드","모델","배터리 업체","배터리 종류","판매 시점","판매 지역"],
      rows: [
        ["기아","Ray BEV","CATL","LFP","2024","한국"],
        ["현대차","Elexio EO BEV","BYD","LFP","2025","중국"],
        ["기아","Carens Clavis BEV","BYD","LFP","2025","인도"],
        ["기아","EV5","BYD","LFP","2025","중국"],
        ["기아","EV2","CATL","LFP","2026","유럽/아시아"],
        ["현대차","아이오닉 3","CATL","LFP","2026","유럽/아시아"]
      ]
    }
  },

  /* 모델별 판매대수 + 배터리 공급사 — 출처: Marklines (EV Volumes)
     각 행: [모델, 공급사, 2024판매, 2024성장률, 2024비중, 2025판매, 2025성장률, 2025비중, YTD판매, YTD성장률, YTD비중]
     빈 값은 "-" / YTD = 2026년 1~4월 누적 / 괄호 안 지역은 차량 생산지 기준 */
  sales: {
    Tesla: { note:"YTD = 2026 1~4월", rows: [
      ["Model Y","Panasonic(북미)/BYD(유럽)/CATL(중국)/LG ES(중국·유럽)","1,173,920","-3.2","65.7","1,086,933","-7.4","66.4","311,184","21.5","68.2"],
      ["Model 3","Panasonic(북미)/CATL(북미·중국)/LG ES(중국)","528,669","-0.3","29.6","499,172","-5.6","30.5","125,168","-14.6","27.4"],
      ["Cybertruck","Tesla(북미)","37,775","107828.6","2.1","24,397","-35.4","1.5","7,927","7.2","1.7"],
      ["Model X","Panasonic(북미)","29,868","-29.5","1.7","16,748","-43.9","1.0","7,476","40.8","1.6"],
      ["Model S","Panasonic(북미)","17,720","-30.1","1.0","9,392","-47.0","0.6","4,851","63.5","1.1"],
      ["Total","","1,787,952","-1.3","100.0","1,636,644","-8.5","100.0","456,606","9.1","100.0"]
    ]},
    VW: { note:"YTD = 2026 1~4월", rows: [
      ["Skoda Elroq BEV","SK온(유럽)","47","-","0.0","96,434","205078.7","6.9","39,853","168.4","9.3"],
      ["VW ID.4 BEV","SK온(북미)/CATL(유럽·중국)","168,286","-12.8","16.7","147,237","-12.5","10.6","33,150","-35.9","7.7"],
      ["Skoda Enyaq BEV","LGES(유럽)","80,328","-0.5","8.0","79,496","-1.0","5.7","30,940","20.7","7.2"],
      ["VW ID.3 BEV","CATL(중국·유럽)","149,813","7.6","14.8","118,072","-21.2","8.5","28,534","-28.2","6.6"],
      ["Audi Q4 e-tron BEV","CATL(중국·유럽)/SK온(중국·유럽)/LGES(유럽)","107,414","-2.9","10.6","85,877","-20.1","6.2","22,969","-23.3","5.3"],
      ["VW ID.7 BEV","CATL(유럽·중국)/SK온(유럽)","39,691","1558.6","3.9","78,712","98.3","5.6","21,146","-20.9","4.9"],
      ["VW Tiguan PHEV","CATL(중국·유럽)","22,659","-6.4","2.2","61,254","170.3","4.4","18,135","1.6","4.2"],
      ["Audi Q6 e-tron BEV","CATL(유럽·중국)/삼성SDI(유럽)","15,082","-","1.5","80,172","431.6","5.8","17,871","-19.9","4.2"],
      ["Cupra Born BEV","LGES(유럽)","41,978","-5.4","4.2","44,145","5.2","3.2","13,738","-8.6","3.2"],
      ["Audi A6 e-tron BEV","CATL(유럽)","329","-","0.0","33,946","10217.9","2.4","10,789","58.8","2.5"],
      ["Others","","383,353","-7.9","38.0","568,674","48.3","40.8","193,303","16.9","44.9"],
      ["Total","","1,008,980","-0.2","100.0","1,394,019","38.2","100.0","430,428","3.5","100.0"]
    ]},
    Hyundai: { note:"YTD = 2026 1~4월", rows: [
      ["Kia EV3 BEV","LGES(한국)","18,875","-","3.5","98,643","422.6","16.1","32,659","-10.1","14.2"],
      ["Hyundai Ioniq 5 BEV","SK온(한국·북미)","103,469","1.4","19.2","99,618","-3.7","16.3","30,127","-1.2","13.1"],
      ["Kia EV5 BEV","BYD(중국)/CATL(한국)","7,534","1867.1","1.4","14,339","90.3","2.3","20,715","416.2","9.0"],
      ["Kia PV5 BEV","CATL(한국)","-","-","-","3,709","-","0.6","11,271","-","4.9"],
      ["Hyundai Casper BEV","LGES(한국)","8,010","-","1.5","43,105","438.1","7.0","15,832","44.3","6.9"],
      ["Hyundai Kona BEV","CATL(유럽·한국)","61,594","3.8","11.4","51,315","-16.7","8.4","15,644","-2.8","6.8"],
      ["Kia EV4 BEV","LGES(유럽·한국)","-","-","-","12,474","-","2.0","14,929","1696.5","6.5"],
      ["Kia EV6 BEV","SK온(한국·북미)","67,236","-16.3","12.5","45,619","-32.2","7.4","10,721","-33.9","4.7"],
      ["Hyundai Ioniq 9 BEV","SK온(한국·북미)","-","-","-","17,277","-","2.8","9,635","388.1","4.2"],
      ["Kia EV9 BEV","SK온(한국·북미)","40,756","218.4","7.5","32,541","-20.2","5.3","9,624","0.5","4.2"],
      ["Others","","232,354","-22.7","43.0","193,969","-16.5","31.7","58,845","-10.0","25.6"],
      ["Total","","539,828","-2.8","100.0","612,609","13.5","100.0","230,002","19.9","100.0"]
    ]},
    GM: { note:"YTD = 2026 1~4월 · 괄호=생산지 · 성장률 공란=전년 기저 0", rows: [
      ["Chevrolet Equinox BEV","LGES(멕시코)","47,780","-","17.6","69,091","44.6","21.8","16,556","-13.1","20.8"],
      ["Buick Electra Encasa PHEV","CATL(중국)","-","-","-","2,891","-","0.9","8,872","-","11.2"],
      ["Buick GL8 PHEV","Zenergy(중국)","46,499","-","17.1","73,196","57.4","23.1","8,784","1.0","11.0"],
      ["Cadillac Optiq BEV","LGES(멕시코)/CATL(중국)","2,400","-","0.9","16,292","578.8","5.1","6,427","54.9","8.1"],
      ["Cadillac Lyriq BEV","LGES(미국)/CATL(중국)","33,614","132.0","12.4","24,968","-25.7","7.9","6,044","-17.6","7.6"],
      ["Chevrolet Spark BEV","Gotion(중국)","-","-","-","3,580","-","1.1","4,384","-","5.5"],
      ["Cadillac Vistiq BEV","LGES(미국)","-","-","-","8,564","-","2.7","3,235","1051.2","4.1"],
      ["Buick Electra E7 PHEV","Zenergy(중국)","-","-","-","-","-","-","3,198","-","4.0"],
      ["Chevrolet Silverado BEV","LGES(미국)","9,366","1931.7","3.4","14,033","49.8","4.4","2,883","-37.3","3.6"],
      ["Chevrolet Blazer BEV","LGES(멕시코)","28,710","4185.1","10.6","25,215","-12.2","7.9","2,444","-73.7","3.1"],
      ["Others","","103,456","-37.6","38.1","79,502","-23.2","25.1","16,680","-29.2","21.0"],
      ["Total","","271,825","49.9","100.0","317,332","16.7","100.0","79,507","3.3","100.0"]
    ]},
    Ford: { note:"YTD = 2026 1~4월 · 괄호=생산지", rows: [
      ["Ford Kuga / Escape PHEV","삼성SDI(북미·유럽)","55,135","-13.3","24.5","58,443","6.0","18.1","15,415","-22.5","15.7"],
      ["Ford Explorer (Europe) BEV","CATL(유럽)","15,872","528966.7","7.0","45,254","185.1","14.0","15,328","26.6","15.6"],
      ["Ford Puma BEV","LGES(유럽)","3","-","-","23,886","796100.0","7.4","12,593","901.0","12.9"],
      ["Ford Mustang Mach-E BEV","CATL(멕시코)/LGES(멕시코·중국)","77,998","10.3","34.6","66,845","-14.3","20.7","11,707","-37.6","11.9"],
      ["Ford Transit Custom PHEV","삼성SDI(유럽)","3,614","-","1.6","14,316","296.1","4.4","6,507","72.2","6.6"],
      ["Ford Capri BEV","CATL(유럽)","1,931","-","0.9","17,962","830.2","5.6","5,850","60.4","6.0"],
      ["Ford F-150 Lightning BEV","SK On(북미)","37,963","35.7","16.9","33,164","-12.6","10.3","5,088","-50.6","5.2"],
      ["Ford Ranger PHEV","삼성SDI(북미)","-","-","-","5,162","-","1.6","4,997","124825.0","5.1"],
      ["Ford e-Transit Custom BEV","SK On(유럽)","1,968","-","0.9","12,694","545.0","3.9","4,668","61.2","4.8"],
      ["Ford E-Transit Van BEV","SK On(북미·유럽)","22,455","8.0","10.0","15,415","-31.4","4.8","3,752","-42.0","3.8"],
      ["Others","","8,316","46.5","3.7","29,211","251.3","9.1","12,062","85.9","12.3"],
      ["Total","","225,255","19.3","100.0","322,352","43.1","100.0","97,967","14.4","100.0"]
    ]},
    Stellantis: { note:"YTD = 2026 1~4월 · 괄호=생산지 · ACC=Stellantis JV", rows: [
      ["Citroen e-C3 BEV","SVOLT(유럽·인도)","13,812","471.7","2.7","58,202","321.4","10.6","29,124","54.5","17.2"],
      ["Opel / Vxh. Frontera-e BEV","CATL/SVOLT(유럽)","118","-","-","18,524","15598.3","3.4","12,995","688.1","7.7"],
      ["Peugeot e-2008 BEV","CATL(유럽)","24,442","-4.0","4.8","26,067","6.6","4.7","10,120","27.2","6.0"],
      ["Peugeot e-208 BEV","CATL(유럽)","39,332","-23.2","7.7","28,169","-28.4","5.1","9,488","-1.1","5.6"],
      ["Peugeot e-3008 BEV","BYD/ACC(유럽)","14,781","1478000.0","2.9","20,997","42.1","3.8","7,497","-14.4","4.4"],
      ["Fiat 500 / Abarth 500 BEV","삼성SDI(유럽)","33,196","-50.2","6.5","25,343","-23.7","4.6","7,335","-10.9","4.3"],
      ["Peugeot e-5008 BEV","BYD/ACC(유럽)","2,698","269700.0","0.5","13,174","388.3","2.4","7,095","67.7","4.2"],
      ["Opel / Vxh. Grandland-e BEV","BYD(유럽)","395","-","0.1","10,460","2548.1","1.9","5,562","72.6","3.3"],
      ["Fiat Grande Panda BEV","SVOLT(유럽)","151","-","0.0","8,855","5764.2","1.6","4,960","303.9","2.9"],
      ["Peugeot 3008 PHEV","LGES(유럽)","6,510","-70.9","1.3","9,249","42.1","1.7","4,903","179.1","2.9"],
      ["Others","","377,385","-21.9","73.6","331,066","-12.3","60.2","70,314","-39.1","41.5"],
      ["Total","","512,820","-21.3","100.0","550,106","7.3","100.0","169,393","-6.3","100.0"]
    ]},
    Honda: { note:"YTD = 2026 1~4월 · 괄호=생산지", rows: [
      ["Honda Prologue BEV","LGES(멕시코)","33,549","-","42.0","40,257","20.0","43.7","4,947","-58.1","32.8"],
      ["Honda N-One e BEV","Panasonic(일본)","-","-","-","5,328","-","5.8","2,135","-","14.2"],
      ["Honda e:Ny1 BEV","CATL(중국)","9,578","667.5","12.0","2,807","-70.7","3.0","1,845","208.5","12.2"],
      ["Honda CR-V PHEV","CATL(중국)","8,361","-20.7","10.5","5,961","-28.7","6.5","1,509","-34.5","10.0"],
      ["Honda Accord PHEV","CATL(중국)","6,400","-8.1","8.0","4,088","-36.1","4.4","1,405","-44.4","9.3"],
      ["Honda Ye S7 BEV","CATL(중국)","-","-","-","2,867","-","3.1","934","-41.2","6.2"],
      ["Acura ZDX BEV","LGES(미국)","7,506","-","9.4","12,005","59.9","13.0","83","-98.8","0.6"],
      ["Others","","14,398","-29.7","18.0","18,904","31.3","20.5","2,207","-43.0","14.6"],
      ["Total","","79,792","103.4","100.0","92,217","15.6","100.0","15,065","-59.5","100.0"]
    ]}
  }
};
