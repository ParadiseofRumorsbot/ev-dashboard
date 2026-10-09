(function(root){
  'use strict';
  const periods={y2025:{label:'2025년 · 첨부 출하 추정 합계',year:2025,fraction:1},q126:{label:'2026년 1분기',year:2026,fraction:.25},q226:{label:'2026년 2분기 · 잠정/불완전',year:2026,fraction:.25},y2026:{label:'2026년 연간 · 자체 전망',year:2026,fraction:1},y2027:{label:'2027년 · 자체 전망',year:2027,fraction:1},y2028:{label:'2028년 · 자체 전망',year:2028,fraction:1},y2029:{label:'2029년 · 자체 전망',year:2029,fraction:1},y2030:{label:'2030년 · 자체 전망',year:2030,fraction:1}};
  // Units are physical accelerators, not H100-equivalent compute or GB superchips.
  const shipments={b200:{label:'B200 계열 → GB200 NVL72',firstYear:2024,y2025:1720485,q126:347290,q226:90245},b300:{label:'B300 계열 → GB300 NVL72',firstYear:2025,y2025:1501441,q126:992874,q226:311796},rubin:{label:'Rubin NVL72 · 물량 직접 입력',firstYear:2026,y2025:null,q126:null,q226:null}};
  const hpeReference={gpus:72,busV:50,nominalKW:132,peakKW:155,powerShelves:8,powerShelfKW:33,provisionKW:192,source:'https://www.hpe.com/us/en/collaterals/collateral.a50009244enw.html'};
  const bbuReference={model:'Compuware CBR-3332-1S1',busV:50,moduleKW:5.5,modulesPerShelf:6,maxShelves:4,seconds:90,source:'https://www.compuware-us.com/landingpage/CBR-3332-1S1'};
  // Product-level comparison only: no claim of HPE qualification, installation or cell BOM.
  function calculateShelfReference(shelves){
    if(!Number.isInteger(shelves)||shelves<1||shelves>bbuReference.maxShelves)throw new RangeError('비교 선반 수는 1~4개');
    const modules=shelves*bbuReference.modulesPerShelf;
    const backupKW=modules*bbuReference.moduleKW,oneOutKW=(modules-shelves)*bbuReference.moduleKW;
    return {shelves,modules,backupKW,oneOutKW,deliveredKWh:backupKW*bbuReference.seconds/3600,oneOutKWh:oneOutKW*bbuReference.seconds/3600};
  }
  // Attached report, 2026-09-24, p.34 Exhibit 36. Annual generation-level estimates.
  const attachDefaults={b200:{2025:40,2026:40},b300:{2025:50,2026:50,2027:50},rubin:{2026:55,2027:55,2028:55}};
  function getBackupDefaults(backupConfig){
    const match=/^shelf-([1-4])$/.exec(backupConfig);
    if(!match)return {backupConfig:'manual',power:'',seconds:'',protectionScope:'',protectionSource:''};
    const r=calculateShelfReference(Number(match[1]));
    return {backupConfig,power:r.backupKW,seconds:bbuReference.seconds,protectionScope:`제품 비교 가정: 72GPU 환산 단위당 Compuware BBU ${r.shelves}선반, 전 모듈 정상. HPE 실제 보호 범위 미확인`,protectionSource:`${bbuReference.source} · ${r.backupKW}kW / 90초 제품 사양. 랙당 배치 개수는 비교 가정`};
  }
  function getDefaults(platform,period){
    return {platform,period,chips:shipments[platform]?.[period]??'',rackShare:100,attach:attachDefaults[platform]?.[periods[period]?.year]??'',...getBackupDefaults('shelf-1')};
  }
  const fields={
    chips:['칩 출하량 (개)',0,null],rackShare:['72GPU 랙 환산 비중 (%)',0,100],attach:['BBU 채택률 (%)',0,100],
    power:['정전 시 BBU가 담당하는 부하 (kW/랙)',0,null],seconds:['해당 부하에서 요구하는 백업 시간 (초)',1,null],cellW:['셀 정격 출력 (W)',1,null],cellWh:['셀 명목 용량 (Wh)',.01,null],
    powerFactor:['출력 사용 가능 비율 (%)',.01,100],energyFactor:['에너지 사용 가능 비율 (%)',.01,100],reserve:['예비 셀 추가율 (%)',0,100],
    share:['회사 셀 물량점유율 (%)',0,100],asp:['셀 ASP (USD/개)',0,null],cbu:['기설 BBU 중 CBU 적용 비중 (%)',0,100],life:['CBU 미적용 교체주기 (년)',1,30],cbuLife:['CBU 적용 교체주기 (년)',1,30],
    capacity:['말레이시아 설계능력 (백만셀/년)',0,null],allocation:['선택 코호트 BBU 배정 비중 (%)',0,100],utilization:['가동률 (%)',0,100],yield:['양품 수율 (%)',0,100],
    margin:['BBU 셀 영업이익률 (%)',-100,100],fx:['환율 (KRW/USD)',1,null],evLoss:['같은 기간 EV 영업손실 (억원·양수)',0,null]
  };
  const number=v=>v===''||v==null?null:Number(v);
  const valid=(k,v)=>Number.isFinite(v)&&v>=fields[k][1]&&(fields[k][2]===null||v<=fields[k][2]);
  function calculate(input){
    const a={}; const missing=[],errors=[];
    for(const k of Object.keys(fields)){a[k]=number(input[k]);if(a[k]!==null&&!valid(k,a[k]))errors.push(fields[k][0]);}
    const period=periods[input.period];
    if(!period)errors.push('기간');
    const platform=shipments[input.platform];
    if(!platform)errors.push('플랫폼');
    const requireKeys=keys=>{const absent=keys.filter(k=>a[k]===null);missing.push(...absent.map(k=>fields[k][0]));return !absent.length;};
    const out={errors,missing,racks:null,backedRacks:null,backedMW:null,deliveredKWh:null,cellsPerRack:null,newCells:null,nominalGWh:null,replacementCells:null,demandCells:null,companyDemand:null,supplyCells:null,salesCells:null,demandRevenue:null,salesRevenue:null,opKRW:null,offset:null,cohortMissing:false};
    if(errors.length)return out;
    if(requireKeys(['chips','rackShare']))out.racks=a.chips*a.rackShare/100/72;
    if(out.racks!==null&&requireKeys(['attach']))out.backedRacks=out.racks*a.attach/100;
    const hasProtectionEvidence=['protectionScope','protectionSource'].every(k=>typeof input[k]==='string'&&input[k].trim().length>0);
    if(!hasProtectionEvidence)missing.push('BBU 보호 전원영역과 부하·시간의 근거 자료');
    if(hasProtectionEvidence&&out.backedRacks!==null&&requireKeys(['power']))out.backedMW=out.backedRacks*a.power/1000;
    if(hasProtectionEvidence&&requireKeys(['power','seconds']))out.deliveredKWh=a.power*a.seconds/3600;
    if(out.deliveredKWh!==null&&requireKeys(['cellW','cellWh','powerFactor','energyFactor','reserve'])){
      const byPower=a.power*1000/(a.cellW*a.powerFactor/100);
      const byEnergy=out.deliveredKWh*1000/(a.cellWh*a.energyFactor/100);
      out.limiting=byPower>=byEnergy?'출력':'에너지';
      out.cellsPerRack=Math.ceil(Math.max(byPower,byEnergy)*(1+a.reserve/100));
      if(out.backedRacks!==null){out.newCells=out.backedRacks*out.cellsPerRack;out.nominalGWh=out.newCells*a.cellWh/1e9;}
    }
    // Cohorts are market cells originally installed in the chosen platform only.
    // Explicit "new only" never claims zero replacements in the actual market.
    if(input.replacementMode==='exclude')out.replacementCells=0;
    else if(input.replacementMode==='cohort'){
      const cohorts=(input.cohorts||[]).filter(c=>c.year!==''||c.cells!=='');
      if(requireKeys(['cbu','life','cbuLife'])&&cohorts.length){
        if(!Number.isInteger(a.life)||!Number.isInteger(a.cbuLife))errors.push('교체주기는 정수 년');
        let total=0;
        const seen=new Set();
        for(const c of cohorts){
          const year=number(c.year),cells=number(c.cells);
          if(!Number.isInteger(year)||year<platform.firstYear||year>=period.year||!Number.isFinite(cells)||cells<0||seen.has(year)){errors.push('기설 셀: 플랫폼 출시 이후·분석연도 이전 설치연도, 셀 수, 중복연도 확인');continue;}
          seen.add(year);const age=period.year-year;
          if(age%a.life===0)total+=cells*1e6*(1-a.cbu/100);
          if(age%a.cbuLife===0)total+=cells*1e6*a.cbu/100;
        }
        if(!errors.length)out.replacementCells=total*period.fraction;
      }else{out.cohortMissing=true;missing.push('과거 BBU 설치 셀 수·연도');}
    }else errors.push('교체 수요 범위');
    if(out.newCells!==null&&out.replacementCells!==null)out.demandCells=out.newCells+out.replacementCells;
    if(out.demandCells!==null&&requireKeys(['share']))out.companyDemand=out.demandCells*a.share/100;
    if(requireKeys(['capacity','allocation','utilization','yield']))out.supplyCells=a.capacity*1e6*a.allocation/100*a.utilization/100*a.yield/100*period.fraction;
    if(out.companyDemand!==null&&out.supplyCells!==null)out.salesCells=Math.min(out.companyDemand,out.supplyCells);
    if(out.companyDemand!==null&&requireKeys(['asp']))out.demandRevenue=out.companyDemand*a.asp;
    if(out.salesCells!==null&&a.asp!==null)out.salesRevenue=out.salesCells*a.asp;
    if(out.salesRevenue!==null&&requireKeys(['margin','fx']))out.opKRW=out.salesRevenue*a.margin/100*a.fx/1e8;
    if(out.opKRW!==null&&a.evLoss!==null&&a.evLoss>0)out.offset=out.opKRW/a.evLoss*100;
    if(errors.length)for(const k of Object.keys(out))if(typeof out[k]==='number')out[k]=null;
    out.missing=[...new Set(missing)];return out;
  }
  function sensitivity(a){
    const specs=[['기준',null,0],['BBU 탑재율 −10%p','attach',-10],['BBU 탑재율 +10%p','attach',10],['백업 시간 ×0.5','seconds',.5],['백업 시간 ×2','seconds',2],['셀 출력 +20%','cellW',1.2],['셀 가격 −10%','asp',.9],['셀 가격 +10%','asp',1.1],['가동률 +10%p','utilization',10],['영업이익률 −5%p','margin',-5],['영업이익률 +5%p','margin',5]];
    return specs.map(([label,key,value])=>{const b={...a};if(key&&number(a[key])!==null)b[key]=['attach','utilization','margin'].includes(key)?Math.max(key==='margin'?-100:0,Math.min(100,Number(a[key])+value)):Number(a[key])*value;return {label,...calculate(b)};});
  }
  const api={calculate,sensitivity,periods,shipments,hpeReference,bbuReference,calculateShelfReference,getDefaults,getBackupDefaults};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(!root.document)return;
  root.BBUModel=api;
  const el=root.document.querySelector('[data-bbu-calculator]');
  if(!el)return;
  const fmt=(v,d=1)=>v===null||!Number.isFinite(v)?'미확인':v.toLocaleString('ko-KR',{maximumFractionDigits:d});
  const inputNotes={chips:'출하 추정: Epoch 기반 첨부표 · 2026.08.20',rackShare:'환산 가정: 기본 100% = 전체 칩 ÷ 72. 실제 NVL72 비중 아님',attach:'외부 추정: 첨부 BBU 리포트 p.34, Exhibit 36 · 2026.09.24. HPE 실측 아님',power:'제품 사양: 기본 Compuware 1선반 33kW. HPE 전체 부하 아님',seconds:'제품 사양: 선택한 Compuware 정격 출력에서 90초',cellW:'선택 BBU의 셀 BOM·방전 조건 미확인',cellWh:'선택 BBU의 셀 명목 용량 미확인',share:'회사 발언 40~50% 참고. 물량/금액 분모 미확인으로 자동 입력 보류',asp:'선택 셀의 거래가격 미공개. 시스템 USD/kW로 대체하지 않음'};
  const input=k=>`<label>${fields[k][0]}<input type="number" name="${k}" min="${fields[k][1]}" ${fields[k][2]===null?'':`max="${fields[k][2]}"`} step="any" placeholder="미확인">${inputNotes[k]?`<small class="bbu-note">${inputNotes[k]}</small>`:''}</label>`;
  const group=(title,keys,note)=>`<fieldset><legend>${title}</legend><div class="bbu-input-grid">${keys.map(input).join('')}</div><p class="bbu-note">${note}</p></fieldset>`;
  el.innerHTML=`<div class="bbu-heading"><div><span class="bbu-kicker">AI 전력용 배터리 · 검토 2026.10.09</span><h2>HPE GB300 기준 BBU 수요·공급·이익</h2></div><a href="global_battery_map.html#bbu-factories">말레이시아 생산거점</a></div>
  <p>대표 랙은 <b>HPE GB300 NVL72</b>입니다. HPE의 공식 랙 사양과 Compuware의 공개 BBU 사양으로 제품 단위 출력을 비교합니다. 실제 HPE 채택·호환 및 보호 부하는 미확인으로, 아래 비교표를 HPE 확정 구성이나 셀 수요로 자동 전환하지 않습니다.</p>
  <div class="bbu-reference"><h3>① 대표 랙 · HPE 공식 사양</h3>
  <div class="bbu-results"><div><span>GPU / 랙</span><strong>${hpeReference.gpus}개</strong><small>Blackwell Ultra</small></div><div><span>DC 버스</span><strong>${hpeReference.busV}V</strong><small>800V Kyber와 별도</small></div><div><span>설계전력 (TDP)</span><strong>${hpeReference.nominalKW}kW</strong><small>BBU 보호 부하 미확인</small></div><div><span>피크 전력 (EDPp)</span><strong>약 ${hpeReference.peakKW}kW</strong><small>설계전력과 구분</small></div></div>
  <p>전원 선반 ${hpeReference.powerShelfKW}kW × ${hpeReference.powerShelves}개 = <b>${hpeReference.powerShelfKW*hpeReference.powerShelves}kW PSU 정격 합계</b> / 시설 버스웨이 권고 ${hpeReference.provisionKW}kW. 전원 선반 개수는 BBU 개수가 아닙니다. Power-Capacitance Shelf Kit도 배터리 선반으로 집계하지 않습니다.</p>
  <p class="bbu-note">출처: <a href="${hpeReference.source}">HPE QuickSpecs V3 · 2026.09.08</a>, Standard Features / Power Delivery and Requirements. HPE BBU 셀·선반 수·백업시간은 이 자료에서 확인되지 않습니다.</p>
  <h3>② 공개 BBU 제품으로 재계산 · HPE 탑재 구성 미확인</h3>
  <p><a href="${bbuReference.source}">${bbuReference.model}</a>: ${bbuReference.busV}V, 선반당 ${bbuReference.moduleKW}kW 모듈 ${bbuReference.modulesPerShelf}개, 백업 ${bbuReference.seconds}초, 최대 ${bbuReference.maxShelves}개 선반 병렬. 선반 수별 제품 출력 합산이며 전압 일치만으로 HPE 호환이 확인되는 것은 아닙니다.</p>
  <div class="bbu-scroll"><table data-bbu-shelf-reference><thead><tr><th>BBU 선반</th><th>배터리 모듈</th><th>전 모듈 정상 출력</th><th>90초 전달 에너지</th><th>선반마다 모듈 1개 이탈 시<br>출력 / 90초 에너지</th></tr></thead><tbody>${Array.from({length:bbuReference.maxShelves},(_,i)=>calculateShelfReference(i+1)).map(r=>`<tr><th>${r.shelves}개</th><td>${r.modules}개</td><td>${fmt(r.backupKW)}kW</td><td>${fmt(r.deliveredKWh,4)}kWh</td><td>${fmt(r.oneOutKW)}kW / ${fmt(r.oneOutKWh,4)}kWh</td></tr>`).join('')}</tbody></table></div>
  <p><b>4개 선반 = 24개 배터리 모듈 · 132kW · 90초 · 3.3kWh 전달.</b> 정격 출력이 HPE 설계전력과 수치상 같아도 약 155kW 피크 대응은 단시간 과부하 허용치와 지속시간을 추가 확인해야 합니다. 선반마다 모듈 1개 이탈 시 110kW·2.75kWh로 내려갑니다. 실제 적용에는 보호 범위·설치 공간·전원 제어 검증이 필요합니다.</p>
  <p class="bbu-note">전달 에너지 = 출력 × 90 ÷ 3,600. 3.3kWh는 배터리 명목 용량이 아니며, 24개는 셀이 아닌 모듈 수입니다. 셀 BOM 미공개로 셀 수·명목 GWh·SDI 매출은 산정하지 않습니다. 정전 시 IT 보호 부하와 시설 냉각 전력도 구분합니다.</p></div>
  <p class="bbu-warning"><b>기본자료가 입력된 참조 시나리오:</b> 칩 출하 추정 + 전량 72GPU 환산 + 세대별 BBU 채택률 추정 + 환산 단위당 Compuware 1선반을 적용합니다. HPE 실제 출하·채택·보호 범위를 뜻하지 않습니다. 셀 BOM·SDI 셀 가격·전용 CAPA·이익률은 미확인으로 유지합니다.</p>
  <p><b>정전 백업의 범위:</b> BBU는 연결된 전원영역의 IT 부하에 전력을 공급해 전원 전환·작업 종료 시간을 확보합니다. <a href="https://www.opencompute.org/documents/open-rack-v3-bbu-shelf-spec-rev1-1-pdf-1">OCP ORv3 §4</a>는 공통 버스의 랙 내 IT 장비 전체를 백업하는 설계를 설명합니다. 데이터센터 냉각 등 시설 부하까지 포함하는 뜻은 아닙니다. 특정 랙의 전체/일부 보호 여부와 정전 중 부하 제한은 해당 설계자료로 확인해야 합니다.</p>
  <p class="bbu-note"><a href="battery_tech.html#bbu-800v-evidence">800VDC 전력 경로·MLCC 순증 검토</a>: 첨부 Kyber 600kW와 MLCC 수량은 BBU 보호 부하·셀 수의 근거로 자동 적용하지 않습니다.</p>
  <h3>③ 기본자료로 시작하는 BBU 참조 시나리오</h3>
  <form id="bbu-form"><div class="bbu-input-grid"><label>분석 기간<select name="period">${Object.entries(periods).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select></label><label>플랫폼<select name="platform">${Object.entries(shipments).map(([k,v])=>`<option value="${k}" ${k==='b300'?'selected':''}>${v.label}${k==='b300'?' · HPE 대표 사양':''}</option>`).join('')}</select></label></div>
  <p class="bbu-note" data-bbu-hpe-shipments></p>
  <div class="bbu-actions"><button type="reset">기본자료 복원</button><button type="button" data-bbu-clear>빈칸으로 직접 입력</button><span data-bbu-mode>출처·환산 가정이 표시된 기본자료</span></div>
  <div class="bbu-scroll"><table><thead><tr><th>여섯 변수</th><th>현재 근거</th><th>적용 기준</th></tr></thead><tbody>
  <tr><th>① 랙 출하량</th><td>B300 계열 첨부 추정 · HPE 72GPU/랙 참조</td><td>기본 100%는 전량 ÷ 72 환산. 실제 NVL72 비중·HPE 출하량이 아님</td></tr>
  <tr><th>② BBU 탑재율</th><td>리포트 Base: Blackwell 40% / Ultra 50% / Rubin 55%</td><td>p.34 표의 해당 연도만 기본 입력. 세대 전체 추정의 랙 상당 환산이며 NVL72·HPE 전용 실측이 아님. 분기는 해당 연간 추정을 동일 적용하는 가정</td></tr>
  <tr><th>③ 출력·시간</th><td>기본 비교 제품 1선반 33kW·90초</td><td>제품 출력은 제조사 사양. 환산 단위당 1선반 배치는 비교 가정이며 HPE 실제 BOM이 아님</td></tr>
  <tr><th>④ 셀 출력·용량</th><td>선택 랙의 확정 BBU BOM 미확인</td><td>출력·에너지 조건 중 큰 셀 수 + 예비분. 직병렬·전압 설계 별도 검증</td></tr>
  <tr><th>⑤ 셀 점유율·가격</th><td>삼성SDI 약 40~50% 회사 발언 (2026.07.30)</td><td>금액/물량 분모 미확인. 여기에는 물량점유율 가정을 입력; 시스템 점유율과 구분</td></tr>
  <tr><th>⑥ CBU·교체</th><td>Panasonic 7년→4~5년 단축 전망 (2025.12.05)</td><td>회사 전망. CBU 효과·교체주기는 가정; 설치연도별 셀 수 필요</td></tr></tbody></table></div>
  ${group('①·② 랙과 BBU 채택',['chips','rackShare','attach'],'기본값은 시장 추정과 환산 가정을 조합한 참조치입니다. 실제 랙 출하를 추정하려면 NVL72 공급 비중과 동일 범위의 BBU 채택률로 교체합니다. 기간·플랫폼 변경 시 해당 출하표·채택률 기본자료를 다시 불러옵니다.')}
  <div class="bbu-results" data-bbu-quick-results></div>
  <fieldset><legend>③ BBU 제품·구성 선택</legend><label>백업 구성<select name="backupConfig">${[1,2,3,4].map(n=>`<option value="shelf-${n}">Compuware ${n}선반 / 72GPU 환산 단위 · 비교 가정</option>`).join('')}<option value="manual">확인한 고객·제품 사양 직접 입력</option></select></label><p class="bbu-note">기본 1선반은 공개 제품 한 단위를 놓는 비교 기준입니다. HPE 정격 132kW 전체를 보호한다고 가정하지 않습니다. 아래 출력·시간·출처는 선택한 제품 사양으로 입력되며, 직접 수정하려면 직접 입력 모드를 선택합니다.</p><div class="bbu-input-grid"><label>BBU가 연결된 전원영역·장비<input name="protectionScope" type="text" maxlength="300" placeholder="해당 랙 설계자료에서 확인한 범위"></label><label>보호 부하·백업시간의 근거 자료<input name="protectionSource" type="text" maxlength="500" placeholder="고객·제품 SKU·자료명·페이지 또는 URL"></label></div><p class="bbu-note">직접 입력 모드는 보호 범위·출처를 모두 적어야 계산합니다. 출처 입력만으로 사양 검증이 완료되지는 않습니다.</p></fieldset>
  ${group('③·④ 백업 사양과 셀',['power','seconds','cellW','cellWh','powerFactor','energyFactor','reserve'],'비교 구성의 출력·시간은 Compuware 사양입니다. 셀 수 계산에는 동일 제품의 셀 출력·명목 용량·온도·수명 조건과 예비분이 추가로 필요합니다. 다른 제품의 셀 출력 로드맵을 임의로 조합하지 않습니다.')}
  ${group('⑤ 회사 셀 물량·가격',['share','asp'],'삼성SDI 셀 시장과 Panasonic 분산전원 시스템 80%는 범위가 다릅니다. 시스템 시장 금액에 셀 점유율을 곱하지 않습니다.')}
  <fieldset><legend>⑥ CBU와 기설 배터리 교체</legend><label>수요 범위<select name="replacementMode"><option value="exclude">신규만 계산 · 교체 수요 제외</option><option value="cohort">기설 코호트 교체 포함</option></select></label><div class="bbu-input-grid">${['cbu','life','cbuLife'].map(input).join('')}</div><div class="bbu-input-grid">${[0,1,2].map(i=>`<label>설치연도 ${i+1}<input name="year${i}" type="number" min="2000" step="1" placeholder="예: 2025"></label><label>당시 설치 셀 ${i+1} (백만개)<input name="cohort${i}" type="number" min="0" step="any" placeholder="선택 코호트의 시장 전체"></label>`).join('')}</div><p class="bbu-note">누적 칩 확보량은 설치된 BBU 수가 아닙니다. 입력한 셀 수를 유지하며 교체주기의 배수 연도에 전량 교체하는 단순 모델입니다. 분기 교체는 연중 균등 가정. CBU 비중은 각 기설 코호트에 동일 적용; 사후 개조·폐기는 미반영입니다.</p></fieldset>
  ${group('공급 상한 · 삼성SDI 말레이시아',['capacity','allocation','utilization','yield'],'전용 CAPA 미공개. 설계 투입능력 기준으로 입력하고 선택 플랫폼·분석 기간에 배정되는 비중만 사용합니다. 이미 양품 기준인 CAPA는 수율 100%로 입력. 다른 고객·용도 물량과 중복 배정 금지. 분기는 연간의 1/4로 계산합니다.')}
  ${group('영업이익과 EV 손실 상쇄',['margin','fx','evLoss'],'BBU 셀 이익률은 미공개 가정입니다. 선택 기간·코호트의 매출 × 영업이익률; 전사 이익이나 증분 이익과 같지 않습니다. EV 손실은 양수로 입력하며 0이면 상쇄율을 계산하지 않습니다.')}
  </form><div data-bbu-status role="status" aria-live="polite"></div><div class="bbu-results" data-bbu-results></div>
  <p class="bbu-note">셀 수 = ceil(max(보호W ÷ 유효 셀W, 필요Wh ÷ 유효 셀Wh) × (1+예비율)). 명목 GWh는 셀 수 × 셀Wh; 실제 백업에 전달하는 kWh와 별개입니다. 공급 반영 출하 = min(회사 수요, 배정 양품능력).</p>
  <details><summary>조건 변경 민감도 · 가정 분석</summary><p class="bbu-note">기준 입력에 대한 가상 변화이며 확인된 제품 사양·시장 전망이 아닙니다. 입력 근거가 없으면 결과를 내지 않습니다. 공급 상한에 도달하면 수요 증가가 회사 매출 증가로 연결되지 않을 수 있습니다.</p><div class="bbu-scroll"><table><thead><tr><th>변경 가정</th><th>신규 셀 (백만개)</th><th>수요 매출 (백만USD)</th><th>공급 반영 매출 (백만USD)</th><th>기준 대비 (백만USD)</th><th>영업이익 (억원)</th></tr></thead><tbody data-bbu-sensitivity></tbody></table></div></details>
  <details><summary>원자료·사양·시장 전망 비교</summary><div class="bbu-scroll"><table><thead><tr><th>출하 추정</th><th>B200</th><th>B300</th><th>합계 ÷ 72 (랙 상당)</th></tr></thead><tbody>${Object.entries(periods).filter(([k])=>shipments.b200[k]!=null).map(([k,p])=>`<tr><td>${p.label}</td><td>${fmt(shipments.b200[k],0)}</td><td>${fmt(shipments.b300[k],0)}</td><td>${fmt((shipments.b200[k]+shipments.b300[k])/72,0)}</td></tr>`).join('')}</tbody></table></div>
  <p>출처: <a href="https://epoch.ai/data/ai-chip-sales">Epoch AI</a> 기반 사용자 제공 2026.08.20 표. 중앙 추정치이며 현재 데이터베이스와 버전이 다릅니다. 2Q26은 잠정/불완전 자료로 연율화하지 않습니다. 확보량은 고객 배분 참고자료, H100e는 성능 환산치입니다.</p>
  <p><a href="https://docs.nvidia.com/dgx/dgxgb200-user-guide/hardware.html">NVIDIA GB200</a>: 72GPU·36CPU, 약 120kW. <a href="https://svr.pegatroncorp.com/SpecFile/PEGATRON_RA4803-72N3_DS_2026v1.pdf">PEGATRON Rubin NVL72</a>: MaxQ 188kW / MaxP 228kW 지원. PSU 개수·정격 합계를 BBU 사양으로 간주하지 않으며 이 수치는 계산기에 자동 적용하지 않습니다.</p>
  <div class="bbu-scroll"><table><thead><tr><th>비교 항목</th><th>값</th><th>범위·기준일</th></tr></thead><tbody><tr><td>BBU 시스템 시장</td><td>2025 21.85억 → 2026E 41.34억 → 2030E 501.57억 USD / CAGR 약 87%</td><td>외부 리서치 추정 · 2026.09.24 · 셀 시장 아님</td></tr><tr><td>시스템 추정 산식</td><td>GPU/ASIC 출하 × GPU TDP × 탑재율 × USD/kW</td><td>2030E 백업 출력 113.029GW × 444USD/kW. 랙 부대 전력과 범위 다름</td></tr><tr><td>기존 BBU 전망</td><td>CAGR 약 30% · 향후 7개년</td><td>기존 인용 보존. 시장·기간 정의 미확인으로 기준 모델 제외</td></tr><tr><td>BBU 배터리 시장</td><td>2026E 약 8억 USD / +70% 이상</td><td>삼성SDI 1Q26 발언. 회사 매출·시스템 TAM과 구분</td></tr></tbody></table></div>
  <p>원문: <a href="https://www.roic.ai/quote/006400.KS/transcripts/2026-year/2-quarter">삼성SDI 2026.07.30 발언록</a> · <a href="https://news.panasonic.com/global/stories/18524">Panasonic 시스템·CBU</a> · <a href="https://holdings.panasonic/content/dam/holdings/global/en/corporate/investors/pdf/irday2026_ene_e.pdf">Panasonic 제품·생산 로드맵</a> · <a href="https://holdings.panasonic/content/dam/holdings/global/en/corporate/investors/pdf/20251205_e.pdf">교체주기 설명</a> · <a href="https://www.opencompute.org/documents/open-rack-v3-bbu-module-spec-1-4-pdf">OCP 4분 모듈 규격</a>. 외부 리서치 추정은 공개 기업발표로 재분류하지 않았습니다.</p></details>
  <h3>투자 가설 점검표</h3><p class="bbu-note">초기 근거와 개인 확인 기록을 구분합니다. 아래 기록은 이 브라우저에만 저장되며 공시나 사이트 원문을 변경하지 않습니다.</p><div data-bbu-checklist></div><p data-bbu-save role="status"></p>`;
  const form=el.querySelector('form'),mode=el.querySelector('[data-bbu-mode]');
  function read(){const a=Object.fromEntries(new FormData(form));a.cohorts=[0,1,2].map(i=>({year:a['year'+i],cells:a['cohort'+i]}));return a;}
  function syncShip(){const a=read(),d=getDefaults(a.platform,a.period);for(const k of ['chips','rackShare','attach'])form.elements[k].value=d[k];mode.textContent='출하표·전량 환산·해당 연도 채택률 참조값 적용';}
  function syncBackup(){
    const d=getBackupDefaults(form.elements.backupConfig.value);
    for(const k of ['power','seconds','protectionScope','protectionSource']){form.elements[k].value=d[k];form.elements[k].readOnly=d.backupConfig!=='manual';}
  }
  function render(){
    const a=read(),r=calculate(a),m=el.querySelector('[data-bbu-status]');
    const chips=shipments.b300[a.period];
    el.querySelector('[data-bbu-hpe-shipments]').textContent=a.platform!=='b300'?'다른 플랫폼 선택: 위 HPE GB300·Compuware 비교 사양은 이 플랫폼의 확정 구성으로 적용하지 않습니다.':chips==null?'선택 기간의 B300 출하 추정치가 없습니다. 확인한 물량을 직접 입력합니다.':`원자료 ${periods[a.period].label}: B300 ${fmt(chips,0)}개 ÷ 72 = ${fmt(chips/hpeReference.gpus,2)}랙 상당. 기본 100%는 이 전량 환산 기준이며 실제 NVL72 비중·HPE 출하 추정이 아닙니다.`;
    m.textContent=r.errors.length?'입력 오류: '+r.errors.join(', '):'입력 기반 참조 시나리오 · HPE 실제 구성/시장 실측 아님: '+periods[a.period].label+' / '+(a.replacementMode==='exclude'?'신규만·교체 제외':'입력 코호트 교체 포함')+(r.missing.length?' · 추가 확인: '+r.missing.join(', '):' · 모든 결과는 입력한 자체 가정에 따른 시나리오');
    m.className=r.errors.length?'bbu-warning':'bbu-note';
    const data=[['72GPU 랙 환산',r.racks,'랙 상당 · 시나리오'],['BBU 적용 물량 환산',r.backedRacks,'랙 상당 · 시나리오'],['시나리오 BBU 출력',r.backedMW,'MW'],['환산 단위당 전달 에너지',r.deliveredKWh,'kWh · 명목 용량 아님'],['환산 단위당 필요 셀',r.cellsPerRack,'개'],['신규 셀',r.newCells===null?null:r.newCells/1e6,'백만개'],['신규 명목 용량',r.nominalGWh,'GWh'],['교체 셀'+(a.replacementMode==='exclude'?' (계산 제외)':''),r.replacementCells===null?null:r.replacementCells/1e6,'백만개'],['회사 수요',r.companyDemand===null?null:r.companyDemand/1e6,'백만개'],['배정 양품능력',r.supplyCells===null?null:r.supplyCells/1e6,'백만개'],['공급 반영 출하',r.salesCells===null?null:r.salesCells/1e6,'백만개'],['수요 기준 셀 매출',r.demandRevenue===null?null:r.demandRevenue/1e6,'백만USD'],['공급 반영 셀 매출',r.salesRevenue===null?null:r.salesRevenue/1e6,'백만USD'],['코호트 영업이익',r.opKRW,'억원'],['EV 손실 상쇄율',r.offset,'%']];
    const cards=data.map(([label,v,unit])=>`<div><span>${label}</span><strong>${fmt(v,3)}</strong><small>${unit}</small></div>`);
    el.querySelector('[data-bbu-results]').innerHTML=cards.join('');
    el.querySelector('[data-bbu-quick-results]').innerHTML=cards.slice(0,4).join('');
    el.querySelector('[data-bbu-sensitivity]').innerHTML=sensitivity(a).map(s=>`<tr><th>${s.label}</th><td>${fmt(s.newCells===null?null:s.newCells/1e6,3)}</td><td>${fmt(s.demandRevenue===null?null:s.demandRevenue/1e6,3)}</td><td>${fmt(s.salesRevenue===null?null:s.salesRevenue/1e6,3)}</td><td>${fmt(s.salesRevenue===null||r.salesRevenue===null?null:(s.salesRevenue-r.salesRevenue)/1e6,3)}</td><td>${fmt(s.opKRW,3)}</td></tr>`).join('');
  }
  form.addEventListener('submit',e=>e.preventDefault());
  form.addEventListener('input',()=>{mode.textContent='직접 입력 · 해당 고객·제품의 출처와 적용 범위 확인 필요';render();});
  form.addEventListener('change',e=>{if(['period','platform'].includes(e.target.name))syncShip();if(e.target.name==='backupConfig')syncBackup();render();});
  form.addEventListener('reset',()=>setTimeout(()=>{syncShip();syncBackup();mode.textContent='기본자료 복원 · 출하 추정/전량 환산/채택률 추정/1선반 비교';render();},0));
  el.querySelector('[data-bbu-clear]').addEventListener('click',()=>{form.querySelectorAll('input').forEach(c=>c.value='');form.elements.backupConfig.value='manual';syncBackup();mode.textContent='빈칸 직접 입력 · 출처와 적용 범위 확인 필요';render();});
  const checks=[['customer','고객 인증·공급','삼성SDI 셀 공급 / LGES 개발·인증 단계 구분','고객·SKU별 인증, 계약 물량, 실제 출하 확인'],['factory','말레이시아 생산','4월 보도: 7월 40V3 양산 계획 / 9월 외부 리서치: 7월 개시 서술','기업 확인, 전용 라인·CAPA·배정률·가동률 확인'],['pricing','점유율·셀 ASP','삼성SDI 2026.07.30: 각 배터리 시장 40~50%, 연간 매출 +70% 이상 전망','시장 성장과 회사 성장 구분, 물량/금액 점유율 및 셀 ASP 확인'],['cbu','CBU·교체주기','Panasonic CBU 개발 / 4~5년 교체 전망은 회사 설명','배터리 부하 감소·수명 연장 효과 실증, 고객별 채택 확인']];
  const box=el.querySelector('[data-bbu-checklist]'),key='ev-dashboard-bbu-checks-v1';let saved={};
  try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch(e){el.querySelector('[data-bbu-save]').textContent='기존 기록을 읽지 못했습니다.';}
  box.innerHTML=checks.map(([id,title,fact,next])=>`<fieldset data-check="${id}"><legend>${title}</legend><p>초기 근거: ${fact}</p><p class="bbu-note">다음 확인: ${next}</p><div class="bbu-input-grid"><label>개인 점검 상태<select name="status"><option>확인 필요</option><option>검토 중</option><option>기업 확인</option><option>출하 확인</option><option>가설 약화</option></select></label><label>확인일<input name="date" type="date"></label><label>출처 URL<input name="url" type="url" placeholder="https://"></label><label>확인 내용<input name="note" type="text" maxlength="500"></label></div></fieldset>`).join('');
  box.querySelectorAll('[data-check]').forEach(row=>{for(const c of row.querySelectorAll('input,select')){const v=saved[row.dataset.check]?.[c.name];if(typeof v==='string')c.value=v;}});
  function saveChecks(){const data={};box.querySelectorAll('[data-check]').forEach(row=>{data[row.dataset.check]=Object.fromEntries([...row.querySelectorAll('input,select')].map(c=>[c.name,c.value]));});try{localStorage.setItem(key,JSON.stringify(data));el.querySelector('[data-bbu-save]').textContent='이 브라우저에 저장했습니다.';}catch(e){el.querySelector('[data-bbu-save]').textContent='저장할 수 없습니다. 기록을 별도로 보관해 주세요.';}}
  box.addEventListener('input',saveChecks);
  box.addEventListener('change',saveChecks);
  syncShip();syncBackup();mode.textContent='기본자료 적용 · 출하 추정/전량 환산/채택률 추정/1선반 비교';render();
})(typeof globalThis!=='undefined'?globalThis:this);
