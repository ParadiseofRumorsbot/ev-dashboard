'use strict';
const assert = require('node:assert/strict');
const model = require('../assets/sib-research.js');
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-8, `${a} != ${b}`);
const old = model.rows('original'), revised = model.rows('rebased');
near(revised[0].total,459);
near(revised[3].total,612);
near(revised[3].sodium,229.5);
near(revised[3].remaining,299.625);
for (let i=0;i<old.length;i++) {
  near(revised[i].lfp,revised[i].sodium+revised[i].remaining);
  near(revised[i].share,old[i].share);
  near(revised[i].erosion,old[i].erosion);
}
for (const basis of ['original','rebased']) for (const row of model.rows(basis)) {
  const base = model.sensitivity(basis,row.year,model.referenceHours,row.share);
  near(base.total,row.total); near(base.sodium,row.sodium); near(base.remaining,row.remaining);
  near(base.total,base.sodium+base.remaining+base.other);
}
const fourHours = model.sensitivity('rebased',2026,4,0);
near(fourHours.total,632); near(fourHours.sodium,0); near(fourHours.remaining,fourHours.lfp);
assert.throws(()=>model.sensitivity('rebased',2030,4,100),RangeError);
assert.throws(()=>model.sizing(1,.2,4,.8,.2,0,.9,.95),RangeError);
const ideal = model.sizing(1,.2,4,.8,.2,1,1,1);
near(ideal.buffer,.8); near(ideal.daily,3.84); near(ideal.onsiteNameplate,3.84);
const losses = model.sizing(1,.2,4,.8,.2,1,.9,.95);
near(losses.bufferNameplate,.8/.9/.95);
near(losses.onsiteNameplate,3.84/.9/.95);
near(model.sizing(1,.2,4,.8,.2,2,.9,.95).onsiteNameplate,losses.onsiteNameplate/2);
near(model.sizing(0,.2,4,.8,.2,1,.9,.95).onsiteNameplate,0);
console.log('PASS: SIB rebasing, conservation, duration sensitivity, sizing, invalid inputs');
