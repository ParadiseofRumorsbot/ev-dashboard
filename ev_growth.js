(function(){
  'use strict';
  const root=document.getElementById('ev-growth');
  if(!root)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const valid=v=>typeof v==='number'&&Number.isFinite(v);
  const n=v=>valid(v)?v.toLocaleString('ko-KR',{minimumFractionDigits:2,maximumFractionDigits:2}):'미확인';
  const pct=v=>valid(v)?(v*100).toFixed(1)+'%':'미확인';
  const growth=(a,b)=>valid(a)&&valid(b)&&a>0?b/a-1:null;
  const sum=xs=>xs.reduce((s,x)=>s+(valid(x)?x:0),0);
  const table=(headers,rows)=>'<div class="eg-scroll"><table><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  const missing='<span class="eg-missing">미확인</span>';
  fetch('data/ev_growth.json').then(r=>{if(!r.ok)throw Error('데이터 '+r.status);return r.json()}).then(d=>{
    const models=new Map(d.models.map(m=>[m.id,m]));
    root.innerHTML=`<div class="eg-intro"><p><strong>판매차량 탑재 기준 GWh</strong> · BEV·PHEV·EREV · 북미 3개국·유럽 31개국</p><p>${esc(d.baseline)}<br>${esc(d.future)}</p><p class="eg-warning">계산 가능한 모델군의 부분합입니다. 신규 수주 미확인 물량은 빠져 있으며, 기준연도·미래연도 가정 차이도 증가율에 포함됩니다.</p></div>
      <div class="eg-controls"><label>판매지역 <select id="eg-region"><option>북미+유럽</option><option>북미</option><option>유럽</option></select></label><label>공급 시나리오 <select id="eg-case">${d.caseRates.map((c,i)=>`<option value="${i}">${esc(c[0])}</option>`).join('')}</select></label><span>자료 확인 ${esc(d.asOf)} · 판매 실적 ${esc(d.actualThrough)}까지</span></div>
      <div class="eg-tabs" role="tablist" aria-label="셀 3사 EV 분석"><button role="tab" aria-selected="true" data-view="summary">셀 3사 요약</button><button role="tab" aria-selected="false" data-view="drivers">증가 이유</button><button role="tab" aria-selected="false" data-view="capacity">CAPA·가동률</button><button role="tab" aria-selected="false" data-view="gaps">확인 필요</button></div>
      <div id="eg-content" role="tabpanel" aria-live="polite"></div><p class="eg-foot">엑셀 계산 결과에서 갱신한 스냅샷 · 셀사 배정은 제공사 추정 및 과거 유지 가정 · 공장 출하량·실제 가동률과 구분</p>`;
    let view='summary';
    const regionInput=root.querySelector('#eg-region'),caseInput=root.querySelector('#eg-case'),content=root.querySelector('#eg-content');
    const label=s=>d.suppliers[s]||s;
    const sourceLinks=ids=>String(ids||'').split(/[;,]/).map(id=>{
      const e=d.sources.find(x=>x.id===id.trim());
      const urls=(e?.urls?.length?e.urls:[e?.url]).filter(u=>u&&/^https:\/\//.test(u));
      return urls.length?urls.map((u,i)=>`<a href="${esc(u)}" title="${esc(e.name+' · '+e.date)}" target="_blank" rel="noopener">${esc(e.id)}${urls.length>1?'·'+(i+1):''}</a>`).join(' / '):esc(e?e.id+' ('+e.name+')':id);
    }).join(' · ');
    function state(){
      const region=regionInput.value,rate=d.caseRates[Number(caseInput.value)];
      const keep=r=>region==='북미+유럽'||r.region===region;
      const cells=d.cells.filter(keep).map(c=>({...c,gwh:c.gwh.slice(),transfer:[0,0]}));
      for(const t of d.transfers.filter(keep))for(const [supplier,sign] of [[t.from,-1],[t.to,1]]){
        let c=cells.find(c=>c.modelId===t.modelId&&c.supplier===supplier);
        if(!c){c={modelId:t.modelId,region:t.region,supplier,gwh:[0,0,0],ttm:0,hold:[0,0],transfer:[0,0]};cells.push(c)}
        for(let y=0;y<2;y++){
          const delta=t.gwh[y]*rate[y+1]*sign;c.transfer[y]+=delta;
          c.gwh[y+1]=valid(c.gwh[y+1])?c.gwh[y+1]+delta:null;
        }
      }
      return {region,rate,cells,keep};
    }
    function render(){
      const s=state();
      if(view==='summary'){
        const rows=Object.keys(d.suppliers).map(k=>{
          const c=s.cells.filter(c=>c.supplier===k),g=[0,1,2].map(y=>sum(c.map(x=>x.gwh[y])));
          return [esc(label(k)),...g.map(n),n(g[1]-g[0]),pct(growth(g[0],g[1])),pct(growth(g[0],g[2]))];
        });
        content.innerHTML=table(['셀사','2026E GWh','2028 GWh','2029 GWh','2028 증가 GWh','2028/2026E','2029/2026E'],rows)+`<p class="eg-warning">${s.rate[0]==='기준안'?'기준안은 기존 공급사 유지 가정입니다.':'BMW CATL 물량의 가상 이전 시나리오입니다. 실제 노이에클라쎄2 물량·CATL 대체율은 미확인입니다.'}</p><p>지역 필터는 차량 판매지역입니다. 해당 지역 셀 공장 생산량과 같지 않습니다. PHEV 집계에는 원자료 분류상 EREV가 포함될 수 있습니다.</p>`;
      }else if(view==='drivers'){
        content.innerHTML=`<div class="eg-controls"><label>셀사 <select id="eg-supplier">${Object.keys(d.suppliers).map(k=>`<option value="${esc(k)}">${esc(label(k))}</option>`).join('')}</select></label><label>차종 검색 <input id="eg-query" placeholder="BMW, Tesla, 모델명"></label></div><p>증가·감소 절댓값 순. 동일 차종의 판매국은 합산합니다. 2026년 H1 연환산과 미래의 최근12개월 유지 차이를 공급 변경 효과와 구분해 보세요.</p><div id="eg-drivers"></div>`;
        function detail(){
          const supplier=content.querySelector('#eg-supplier').value,q=content.querySelector('#eg-query').value.toLowerCase(),groups=new Map();
          for(const c of s.cells.filter(c=>c.supplier===supplier)){
            const m=models.get(c.modelId);if(!m||!(m.model+' '+m.oem).toLowerCase().includes(q))continue;
            const key=m.region+'|'+m.model;
            if(!groups.has(key))groups.set(key,{m,ids:[],g:[0,0,0],transfer:0,missing:[false,false,false],reasons:new Set(),sourceIds:new Set(),sheetRows:[]});
            const a=groups.get(key);a.ids.push(m.id);a.g=a.g.map((v,i)=>v+(valid(c.gwh[i])?c.gwh[i]:0));a.transfer+=c.transfer[0];a.missing=a.missing.map((v,i)=>v||!valid(c.gwh[i]));a.reasons.add(m.reason);a.sheetRows.push(m.sheetRow);String(m.evidence).split(/[;,]/).forEach(id=>a.sourceIds.add(id.trim()));
          }
          const rows=[...groups.values()].sort((a,b)=>Math.abs(b.g[1]-b.g[0])-Math.abs(a.g[1]-a.g[0]));
          content.querySelector('#eg-drivers').innerHTML=table(['판매지역·차종','2026E','2028','2029','2028 증감','공급이전 효과','계산 근거'],rows.map(a=>[
            `<strong>${esc(a.m.model)}</strong><br>${esc(a.m.region)} · ${esc(a.ids.join(', '))}`,...a.g.map((v,i)=>a.missing[i]?missing:n(v)),a.missing[0]||a.missing[1]?missing:n(a.g[1]-a.g[0]),n(a.transfer),`<details><summary>${esc(a.m.action28==='전망'?'공개 전망':'과거 유지·종료 등')}</summary>${[...a.reasons].map(esc).join('<br>')}<br>${esc(a.m.method)}<br>팩·셀사 구성 유지 가정<br>근거 ${sourceLinks([...a.sourceIds].join(';'))}<br>엑셀 차종별 계산 행 ${esc(a.sheetRows.join(', '))}${a.missing.some(Boolean)?'<br>일부 물량 미확인':''}</details>`
          ]));
        }
        content.querySelector('#eg-supplier').addEventListener('change',detail);content.querySelector('#eg-query').addEventListener('input',detail);detail();
      }else if(view==='capacity'){
        const caps=d.capacity.filter(s.keep);
        content.innerHTML=`<p><strong>아래 지역은 셀 생산지역입니다. CAPA 단위는 GWh입니다.</strong> 기존 CAPA에는 EV·ESS 및 명목·가용 기준이 혼재합니다. 생산공장 배정·EV 비중·연중 가동기간이 확인되지 않아 수요/CAPA 계산은 보류했습니다.</p>`+table(['셀사·생산지역','기존 CAPA 2026','2028','2029','2026 연평균 EV CAPA','2026 수요/CAPA','2026E EV 가동률'],caps.map(c=>[esc(label(c.supplier)+' · '+c.region),...c.capacity.map(n),valid(c.effectiveEV2026)?n(c.effectiveEV2026):missing,valid(c.demandRatio2026)?pct(c.demandRatio2026):missing,valid(c.evUtilization2026)?pct(c.evUtilization2026):missing]))+
          `<details class="eg-block"><summary>공장·라인별 CAPA 원표 보기 (${d.factories.filter(s.keep).length}개)</summary>`+table(['셀사·지역','공장·라인','2026','2028','2029','EV 분리 상태','원표 비고'],d.factories.filter(s.keep).map(c=>[esc(label(c.supplier)+' · '+c.region),esc(c.name),...c.capacity.map(n),esc(c.status),esc(c.note)]))+`</details><h3>가동률 참고자료</h3><p>글로벌·전사 자료는 지역 필터와 관계없이 표시합니다. 아래 숫자는 EV 수요 계산에 사용하지 않습니다.</p>`+
          table(['셀사','가동률·원문','기준 기간','제품 범위','구분·근거'],d.utilization.map(u=>[esc(label(u.supplier)),valid(u.value)?pct(u.value):esc(u.value),esc(u.period),esc(u.product),esc(u.kind)+' · '+sourceLinks(u.source)+`<details><summary>산식·제한</summary>${esc(u.denominator)}<br>${esc(u.note)}</details>`]));
      }else{
        const unassigned=s.cells.filter(c=>['tba','unspec'].includes(c.supplier));
        const all=sum(s.cells.map(c=>c.gwh[1])),unk=sum(unassigned.map(c=>c.gwh[1]));
        const contracts=d.contracts.filter(c=>s.region==='북미+유럽'||c.region===s.region||c.region==='지역 배정 미확인');
        content.innerHTML=`<div class="eg-gap"><strong>2028 산출 수요 중 공급사 미확인 ${n(unk)} GWh (${pct(all>0?unk/all:null)})</strong><p>연간 판매 자체가 미확인인 신규 프로젝트는 이 분모에 포함되지 않습니다. 따라서 이 비율은 전체 미래 시장의 미확인 비중이 아닙니다.</p></div><p>확인 우선순위: R2 연도별 출하·팩 구성, BMW SDI 공급 차종·시작 연도·배정량, EV 생산공장 연결 및 ESS 전환 후 EV CAPA.</p><details class="eg-block"><summary>출시·수주 확인 ${contracts.length}건 (지역 미확인 포함)</summary>`+
          table(['OEM·모델','공급사·확인수준','시작 시점','계약·참고 물량','2028/2029 배정','확인할 내용'],contracts.map(c=>[
            esc(c.oem)+'<br><strong>'+esc(c.model)+'</strong><br>'+esc(c.region),esc(c.supplier)+'<br>'+esc(c.status),esc(c.start),valid(c.contractGwh)?n(c.contractGwh)+' GWh<br>'+esc(c.period):valid(c.reference)?n(c.reference)+' '+esc(c.referenceUnit):'미확인',c.gwh.map(v=>valid(v)?n(v):esc(v)).join(' / '),esc(c.note)+'<br>'+sourceLinks(c.evidence)
          ]))+`</details>`;
      }
    }
    root.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;root.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-selected',String(x===b)));render()}));
    regionInput.addEventListener('change',render);caseInput.addEventListener('change',render);render();
  }).catch(e=>{root.innerHTML='<p class="eg-warning">EV 물량 데이터를 불러오지 못했습니다. 새로고침해 주세요. '+esc(e.message)+'</p>'});
})();
