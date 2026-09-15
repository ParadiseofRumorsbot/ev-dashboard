/* SIB/ESS research scenarios, reviewed 2026-09-15.
 * The 459 GWh anchor is a research-note citation, not a verified BNEF series.
 * Future rows retain the original scenario's growth and chemistry shares.
 */
(function (root) {
  'use strict';
  const original = [
    {year:2026, total:360, lfp:310, sodium:19},
    {year:2027, total:400, lfp:345, sodium:52},
    {year:2028, total:430, lfp:370, sodium:104},
    {year:2030, total:480, lfp:415, sodium:180}
  ];
  const referenceHours = 459 / 158;
  function rows(basis) {
    const factor = basis === 'rebased' ? 459 / 360 : 1;
    return original.map(r => ({year:r.year, total:r.total*factor, lfp:r.lfp*factor,
      sodium:r.sodium*factor, remaining:(r.lfp-r.sodium)*factor,
      share:r.sodium/r.total*100, erosion:r.sodium/r.lfp*100}));
  }
  function sensitivity(basis, year, hours, share) {
    const r = rows(basis).find(r => r.year === Number(year));
    if (!r || !Number.isFinite(hours) || hours <= 0 || !Number.isFinite(share) || share < 0 || share > r.lfp/r.total*100) {
      throw new RangeError('저장시간·소듐 점유율의 가정 범위를 확인하세요.');
    }
    const total = r.total * hours / referenceHours;
    const lfp = total * r.lfp / r.total;
    const sodium = total * share / 100;
    return {total, lfp, sodium, remaining:lfp-sodium, other:total-lfp, erosion:sodium/lfp*100};
  }
  function sizing(gw, powerShare, hours, load, energyShare, cycles, usable, delivery) {
    const values = [gw,powerShare,hours,load,energyShare,cycles,usable,delivery];
    if (!values.every(Number.isFinite) || gw < 0 || hours <= 0 || cycles <= 0 || usable <= 0 || usable > 1 || delivery <= 0 || delivery > 1 || [powerShare,load,energyShare].some(v => v < 0 || v > 1)) {
      throw new RangeError('설비용량·비율·충방전 가정을 확인하세요.');
    }
    const buffer = gw * powerShare * hours;
    const daily = gw * 24 * load * energyShare;
    return {power:gw*powerShare, buffer, bufferNameplate:buffer/usable/delivery,
      daily, onsiteNameplate:daily/cycles/usable/delivery};
  }
  const api = {rows, sensitivity, sizing, referenceHours};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;
  root.SIBResearch = api;
  const f = (v, digits=1) => v.toLocaleString('ko-KR', {minimumFractionDigits:digits, maximumFractionDigits:digits});
  const metric = (label, value, suffix='GWh') => '<div class="sib-metric"><span>'+label+'</span><strong>'+f(value)+' <small>'+suffix+'</small></strong></div>';
  const field = (label, name, value, min, max, step) => '<label>'+label+'<input data-field="'+name+'" type="number" value="'+value+'" min="'+min+'" max="'+max+'" step="'+step+'" required></label>';
  function market(el) {
    const interactive = el.dataset.sibMarket === 'sensitivity';
    el.innerHTML = '<div class="sib-heading"><span class="sib-badge">자체 시나리오 · 2026.09.15 검토</span><h3>글로벌 ESS 성장과 LFP 대체</h3></div>'+
      '<p class="sib-note">범위: 글로벌 연간 신규 설치(GWh). 소듐 ESS가 전량 LFP를 대체한다고 가정한 강한 침투 경로입니다. 전체 소듐 출하 전망·북미 공장 CAPA와 별도입니다.</p>'+
      '<div class="sib-controls"><label>시장 규모 기준<select data-field="basis"><option value="rebased">7월 보정안 · 2026년 459GWh 기준</option><option value="original">기존 가정 · 2026년 360GWh 기준</option></select></label></div>'+
      '<div data-summary class="sib-metrics" aria-live="polite"></div>'+
      '<div class="sib-scroll"><table class="sib-table"><caption>저장시간 민감도 적용 전 · 강한 소듐 침투 가정</caption><thead><tr><th>연도</th><th>전체 ESS</th><th>소듐 없을 때 LFP</th><th>소듐 ESS</th><th>남는 LFP</th><th>소듐 / 전체 ESS</th><th>LFP 대체율</th></tr></thead><tbody data-rows></tbody></table></div>'+
      '<p class="sib-note">보정 방법: 2026년 기준을 459GWh로 바꾸고, 2027~2030년 성장률·화학계 비중은 기존 가정을 유지(459÷360=1.275배). <b>2030년 612GWh·소듐 229.5GWh는 자체 계산이며 BNEF 전망이 아닙니다.</b> 원수치로 계산 후 소수점 첫째 자리에서 표시합니다.</p>'+
      '<details class="sib-note"><summary>출처·과거 추정치·다른 전망과의 관계</summary><p>출처: 개인 ESS 리서치(2026.06.24, 07.06, 07.30), 제공 SIB 기술자료(2026.09.15). 158GW/459GWh는 리서치의 BNEF 인용값이며 원보고서·집계 범위는 미대조 상태입니다. 기존 2030년 480GWh와 시나리오 탭의 외부 전망 인용 828GWh는 별도 계열입니다.</p><p>2025년 기존 추정: 전체 250 / 소듐 6 / 잔존 LFP 209GWh. 7월 메모의 326GWh는 112GW×2.91h 역산값으로 실적이 아닙니다. 이 계산표는 2026년부터 제시합니다.</p></details>'+
      (interactive ? '<h3>저장시간·소듐 점유율 민감도</h3><div class="sib-controls"><label>비교 연도<select data-field="year"><option>2026</option><option>2027</option><option>2028</option><option selected>2030</option></select></label>'+field('가정 평균 저장시간 (h)','hours',referenceHours.toFixed(6),1,8,.01)+field('소듐 / 전체 ESS (%)','share',37.5,0,80,.1)+'<button type="button" data-reset>기준 가정으로</button></div><div data-sensitivity class="sib-metrics" aria-live="polite"></div><p data-error class="sib-error" role="alert"></p><p class="sib-note">기준 저장시간은 459÷158=2.905h로 가정합니다. 선택한 연도의 설치 전력을 고정하고 시간만 바꾸는 민감도이며 예측치가 아닙니다. 기존 전망에 시간 증가가 포함됐다면 추가 배수를 적용하지 않습니다. 최대 8h는 전력망 프로젝트의 요구 범위이며 글로벌 평균이 아닙니다.</p>' : '<p class="sib-note"><a href="battery_scenario.html#sib-sensitivity">저장시간·침투율을 직접 조정하기 →</a></p>');
    const get = name => el.querySelector('[data-field="'+name+'"]');
    function render(reset) {
      const data = rows(get('basis').value), last = data[data.length-1];
      el.querySelector('[data-summary]').innerHTML = metric('2030 전체 ESS',last.total)+metric('2030 소듐 ESS',last.sodium)+metric('2030 남는 LFP',last.remaining);
      el.querySelector('[data-rows]').innerHTML = data.map(r => '<tr><th>'+r.year+'E</th><td>'+f(r.total)+'</td><td>'+f(r.lfp)+'</td><td class="sib-na">'+f(r.sodium)+'</td><td>'+f(r.remaining)+'</td><td>'+f(r.share)+'%</td><td>'+f(r.erosion)+'%</td></tr>').join('');
      if (!interactive) return;
      if (reset) {
        get('hours').value = referenceHours.toFixed(6);
        get('share').value = (data.find(r => r.year === Number(get('year').value)).share).toFixed(6);
      }
      const inputs = [get('hours'),get('share')];
      if (inputs.some(input => input.value === '' || !Number.isFinite(Number(input.value)) || Number(input.value)<Number(input.min) || Number(input.value)>Number(input.max))) {
        el.querySelector('[data-error]').textContent = '저장시간은 1~8h, 소듐 점유율은 0~80%로 입력하세요.';
        el.querySelector('[data-sensitivity]').innerHTML = '';
        return;
      }
      const hours = Math.abs(Number(get('hours').value)-referenceHours)<0.000001 ? referenceHours : Number(get('hours').value);
      const result = sensitivity(get('basis').value, get('year').value, hours, Number(get('share').value));
      el.querySelector('[data-error]').textContent = '';
      el.querySelector('[data-sensitivity]').innerHTML = metric('민감도 적용 전체 ESS',result.total)+metric('소듐 ESS = LFP 대체량',result.sodium)+metric('남는 LFP',result.remaining);
    }
    get('basis').addEventListener('change', () => render(true));
    if (interactive) {
      get('year').addEventListener('change', () => render(true));
      ['hours','share'].forEach(name => get(name).addEventListener('input', () => render(false)));
      el.querySelector('[data-reset]').addEventListener('click', () => render(true));
    }
    render(true);
  }
  function sizingPanel(el) {
    el.innerHTML = '<span class="sib-badge">설비 용량 계산 · 자체 가정</span><h3>데이터센터 ESS — 버퍼와 자체발전 연계</h3><p class="sib-note">시설 전체 전력 기준입니다. IT 부하를 사용할 때는 시설 부하로 환산한 뒤 입력하세요. 두 용도는 같은 설비가 겸할 수 있으므로 아래 결과를 단순 합산하지 않습니다.</p>'+
      '<div class="sib-controls">'+field('시설 전력 (GW)','gw',1,0,100,.1)+field('사용 가능 용량 (%)','usable',90,1,100,1)+field('방전·출력 경로 효율 (%)','delivery',95,1,100,1)+'</div>'+
      '<h4>① 부하 완충 버퍼</h4><div class="sib-controls">'+field('ESS 담당 전력 비율 (%)','powerShare',20,0,100,1)+field('버퍼 저장시간 (h)','hours',4,.1,24,.1)+'</div><div data-buffer class="sib-metrics" aria-live="polite"></div>'+
      '<h4>② 자체발전 연계</h4><div class="sib-controls">'+field('평균 부하율 (%)','load',80,0,100,1)+field('하루 소비 중 ESS 공급 비율 (%)','energyShare',20,0,100,1)+field('일일 등가 충방전 횟수','cycles',1,.1,10,.1)+'</div><div data-onsite class="sib-metrics" aria-live="polite"></div><p data-error class="sib-error" role="alert"></p>'+
      '<details class="sib-note"><summary>계산식·사례 해석</summary><p>버퍼 부하 공급량 = GW × 담당 전력 비율 × 시간. 명목용량 = 공급량 ÷ 사용 가능 비율 ÷ 방전·출력 경로 효율. 1GW×20%×4h=0.8GWh는 손실·예비용량 반영 전 값입니다.</p><p>자체발전 ESS 일일 공급량 = GW×24h×평균 부하율×에너지 비율. 명목용량 = 일일 공급량 ÷ 일일 등가 횟수 ÷ 사용 가능 비율 ÷ 방전·출력 경로 효율. 이 효율은 왕복효율과 다릅니다. 실제 설계에는 시간대별 발전·부하, 충전 손실, 예비율·열화도 필요합니다.</p><p>7월 메모의 하루 15~20GWh×20~30%=3~6GWh/일은 에너지 처리량입니다. ‘약 3GWh/GW’는 선택한 운전 가정의 사례로만 봅니다. Colossus 메모의 0.78GWh는 시설 1GW 기준 0.78, 1.5GW 기준 0.52GWh/GW이므로 동일 시점·가동 상태를 확인해야 합니다. Abilene 1GW/4GWh는 계획 사례로 구분합니다.</p><p>출처: 개인 ESS 리서치(2026.07.06·07.30), LG에너지솔루션 2Q26 IR(2026.07.30); 계산 검토 2026.09.15.</p></details>';
    function render() {
      const fields = ['gw','powerShare','hours','load','energyShare','cycles','usable','delivery'];
      const inputs = fields.map(name => el.querySelector('[data-field="'+name+'"]'));
      if (inputs.some(i => i.value === '' || !Number.isFinite(Number(i.value)) || Number(i.value)<Number(i.min) || Number(i.value)>Number(i.max))) {
        el.querySelector('[data-error]').textContent = '각 입력란의 범위 안에서 값을 입력하세요.';
        el.querySelector('[data-buffer]').innerHTML = el.querySelector('[data-onsite]').innerHTML = '';
        return;
      }
      const values = inputs.map((input,i) => Number(input.value) / ([1,3,4,6,7].includes(i)?100:1));
      const result = sizing(...values);
      el.querySelector('[data-error]').textContent = '';
      el.querySelector('[data-buffer]').innerHTML = metric('ESS 출력',result.power,'GW')+metric('손실 반영 전 공급량',result.buffer)+metric('가정 명목용량',result.bufferNameplate);
      el.querySelector('[data-onsite]').innerHTML = metric('일일 ESS 공급량',result.daily,'GWh/일')+metric('가정 명목용량',result.onsiteNameplate);
    }
    el.querySelectorAll('input').forEach(input => input.addEventListener('input', render));
    render();
  }
  document.querySelectorAll('[data-sib-market]').forEach(market);
  document.querySelectorAll('[data-sib-sizing]').forEach(sizingPanel);
})(typeof window !== 'undefined' ? window : globalThis);
