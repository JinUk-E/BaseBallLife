'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),D=require('../dist/core.js');
const {sample}=require('../scripts/batting-balance.cjs');
const rising=(rows,key)=>rows.slice(1).forEach((r,i)=>assert.ok(r[key]>rows[i][key],`${key}: ${JSON.stringify(rows.map(v=>v[key]))}`));

test('능력 50·70·85·99에서 실제 시즌 타율·홈런율·도루율이 단계별로 높아진다',()=>{
 const rows=[50,70,85,99].map(rating=>sample({rating}));
 for(const key of ['avg','hrPerAB','sbPerReach'])rising(rows,key);
 const elite=rows.at(-1);assert.ok(elite.avg>rows[0].avg+.12);
 assert.ok(elite.hrPerAB>rows[0].hrPerAB*4);assert.ok(elite.sbPerReach>rows[0].sbPerReach*7);
 assert.ok(elite.hrRange[1]>55);assert.ok(elite.sbRange[1]>80);
 assert.ok(new Set(elite.seasons.map(s=>s.hr)).size>5);assert.ok(new Set(elite.seasons.map(s=>s.sb)).size>5);
});

test('컨택·파워·선구안·주력을 각각 높여도 해당 성적이 독립적으로 좋아진다',()=>{
 for(const [attribute,metric] of [['contact','avg'],['power','hrPerAB'],['discipline','bbPerPA'],['speed','sbPerReach']]){
  const rows=[30,65,99].map(value=>sample({attrs:{[attribute]:value},seeds:12}));
  rising(rows,metric);
  if(attribute==='contact')assert.ok(rows[2].soPerAB<rows[0].soPerAB);
 }
});

test('최상위에서도 90→99의 컨택·파워·주력 향상이 기록에 반영된다',()=>{
 for(const [attribute,metric] of [['contact','avg'],['power','hrPerAB'],['speed','sbPerReach']]){
  const rows=[90,99].map(value=>sample({rating:85,attrs:{[attribute]:value},seeds:16}));
  rising(rows,metric);
 }
});

test('강타자·준족 시즌도 타격 장부·도루 기회·저장 재현성과 기존 기록을 보존한다',()=>{
 const rows=[sample({rating:99,seeds:8}),sample({rating:65,attrs:{speed:99,power:30},seeds:8})];
 for(const row of rows)for(const s of row.seasons){
  assert.equal(s.pa,s.ab+s.bb+s.hbp+s.sf);assert.ok(s.h<=s.ab);assert.ok(s.doubles+s.triples+s.hr<=s.h);
  assert.ok(s.so<=s.ab-s.h);assert.ok(s.r<=s.h+s.bb+s.hbp);assert.ok(s.hr<=s.r&&s.hr<=s.rbi);
  assert.ok(s.sb+s.cs<=2*(s.h+s.bb+s.hbp-s.hr));
 }
 let state=D.createCareer({name:'강타자 저장',role:'batter',entry:'pro',seed:77});
 for(const key of Object.keys(state.attrs))state.attrs[key]=state.potential.caps[key]=99;
 state=D.advanceWeek(state,'balanced');const oldStats={...state.stats},roundTrip=D.validateSave(JSON.parse(JSON.stringify(state)));
 assert.deepEqual(roundTrip.stats,oldStats);assert.deepEqual(D.advanceWeek(state,'balanced'),D.advanceWeek(roundTrip,'balanced'));
 const doubleSteal=JSON.parse(JSON.stringify(roundTrip)),reaches=oldStats.h+oldStats.bb+oldStats.hbp-oldStats.hr;assert.ok(reaches>0);
 for(const stats of [doubleSteal.stats,doubleSteal.careerStats]){stats.sb=2*reaches;stats.cs=0;}
 D.validateSave(doubleSteal);
 for(const stats of [doubleSteal.stats,doubleSteal.careerStats])stats.sb++;
 assert.throws(()=>D.validateSave(doubleSteal),/기록 관계/);
 const legacy={...roundTrip,scouting:undefined,schoolCountry:undefined,favoriteTeamId:undefined};
 delete legacy.scouting;delete legacy.schoolCountry;delete legacy.favoriteTeamId;
 assert.deepEqual(D.validateSave(legacy).stats,oldStats);
});
