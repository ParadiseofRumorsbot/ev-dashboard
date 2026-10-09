'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const model=require('../assets/bbu-research.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
// Synthetic values exercise the engine; they are never production defaults.
const base={platform:'b200',period:'y2025',chips:7200,rackShare:100,attach:100,protectionScope:'Test fixture DC load domain',protectionSource:'Synthetic test specification',power:120,seconds:90,cellW:120,cellWh:10,powerFactor:80,energyFactor:80,reserve:20,share:50,asp:3,replacementMode:'exclude',capacity:1,allocation:10,utilization:80,yield:90,margin:15,fx:1400,evLoss:100};
const r=model.calculate(base);
assert.deepEqual(r.errors,[]);
near(r.racks,100);near(r.backedMW,12);near(r.deliveredKWh,3);
near(r.cellsPerRack,1500);near(r.newCells,150000);near(r.nominalGWh,.0015);
near(r.companyDemand,75000);near(r.supplyCells,72000);near(r.salesCells,72000);
near(r.demandRevenue,225000);near(r.salesRevenue,216000);near(r.opKRW,.4536);near(r.offset,.4536);
// A numeric rack power alone must not become an asserted backup load.
for(const missing of [{protectionScope:''},{protectionSource:''},{protectionSource:'   '}]){
  const unknown=model.calculate({...base,...missing});
  for(const key of ['backedMW','deliveredKWh','cellsPerRack','newCells','salesRevenue','opKRW'])assert.equal(unknown[key],null,key);
  assert.equal(unknown.racks,100);
}
// Short backup periods are power-limited; long ones become energy-limited.
near(model.calculate({...base,seconds:240}).cellsPerRack,1500);
near(model.calculate({...base,seconds:600}).cellsPerRack,3000);
near(model.calculate({...base,cellW:240}).cellsPerRack,750);
assert.equal(model.calculate({...base,seconds:600}).limiting,'에너지');
// A capacity limit caps realized revenue even when demand grows.
const sensitivity=model.sensitivity({...base,attach:70,capacity:.1});
near(sensitivity[0].salesRevenue,sensitivity[2].salesRevenue);
assert.ok(sensitivity[2].demandRevenue>sensitivity[0].demandRevenue);
const marginUp=model.sensitivity(base).find(s=>s.label==='영업이익률 +5%p');
near(marginUp.salesRevenue,r.salesRevenue);near(marginUp.opKRW,r.opKRW*20/15);
near(model.calculate({...base,period:'q126'}).supplyCells,18000);
near(model.calculate({...base,capacity:0}).salesRevenue,0);
near(model.calculate({...base,attach:0}).salesRevenue,0);
near(model.calculate({...base,asp:0}).salesRevenue,0);
assert.equal(model.calculate({...base,evLoss:0}).offset,null);
assert.equal(model.calculate({...base,capacity:''}).salesRevenue,null);
assert.equal(model.calculate({...base,cellW:''}).newCells,null);
assert.equal(model.calculate({...base,share:''}).companyDemand,null);
assert.ok(model.calculate({...base,energyFactor:0}).errors.length);
assert.ok(model.calculate({...base,attach:101}).errors.length);
assert.ok(model.calculate({...base,cellWh:'bad'}).errors.length);
assert.ok(model.calculate({...base,period:'invalid'}).errors.length);
// Replacement schedules use installed cells, do not divide the whole base by life.
const cohort={...base,period:'y2029',replacementMode:'cohort',cohorts:[{year:2024,cells:1}],cbu:30,life:5,cbuLife:7};
near(model.calculate(cohort).replacementCells,700000);
near(model.calculate({...cohort,period:'y2030'}).replacementCells,0);
near(model.calculate({...cohort,cbu:100}).replacementCells,0);
near(model.calculate({...cohort,cbuLife:5}).replacementCells,1000000);
near(model.calculate({...cohort,period:'q126',life:2,cbuLife:2}).replacementCells,250000);
assert.equal(model.calculate({...cohort,cohorts:[]}).replacementCells,null);
assert.ok(model.calculate({...cohort,cohorts:[{year:2020,cells:1}]}).errors.length);
assert.ok(model.calculate({...cohort,cohorts:[{year:2024,cells:1},{year:2024,cells:1}]}).errors.length);
near(model.shipments.b200.y2025+model.shipments.b300.y2025,3221926);
const repo=path.join(__dirname,'..');
const pages=['index.html','battery_scenario.html','battery_tech.html','global_battery_map.html','Battery_bom_routing.html','2차전지_컨콜정리.html'];
for(const name of pages){
  const html=fs.readFileSync(path.join(repo,name),'utf8');
  let n=0;
  for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
    if(!/\bsrc\s*=/.test(m[1])&&!/type=["']application\/ld\+json/.test(m[1]))new vm.Script(m[2],{filename:`${name}:${++n}`});
  }
  assert.ok(html.includes('assets/bbu-research.css'),name);
  for(const m of html.matchAll(/href="([^"#]+\.html)#(bbu-[^"]+)"/g)){
    assert.ok(fs.readFileSync(path.join(repo,m[1]),'utf8').includes(`id="${m[2]}"`),m[0]);
  }
}
console.log('PASS: units, output/energy constraints, capacity ceiling, sensitivity, missing vs zero, cohort replacements, source totals, six-page JS syntax and BBU links');
