'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),D=require('../dist/core.js');
const copy=s=>JSON.parse(JSON.stringify(s));
const create=(leagueId='kbo',role='batter',seed=7)=>D.createCareer({name:'규칙 검증',role,seed,entry:leagueId==='highschool'?'highschool':'pro',leagueId});
function finish(s,onEvent=()=>{}){while(s.phase==='active'){if(s.pendingEvent){onEvent(s);s=D.resolveEvent(s,s.pendingEvent.choices.at(-1).id);}else s=D.advanceWeeks(s,'balanced',60).state;}return s;}
test('리그별 연장 규칙은 KBO 11회·NPB 12회·MLB 승부치기를 구분한다',()=>{
 assert.equal(D.getLeagueRules('kbo').maxInnings,11);assert.equal(D.getLeagueRules('npb').maxInnings,12);
 assert.equal(D.getLeagueRules('mlb').automaticRunner,true);assert.equal(D.getLeagueRules('mlb').ties,false);
 assert.throws(()=>D.getLeagueRules('unknown'));
 for(const league of ['kbo','npb','mlb']){
  let seenExtra=false,seenDraw=false;
  for(let seed=1;seed<=5;seed++){
   let s=create(league,'batter',seed);
   while(s.phase==='active'){
    if(s.pendingEvent){s=D.resolveEvent(s,s.pendingEvent.choices.at(-1).id);continue;}
    s=D.advanceWeek(s,s.fatigue>=60?'rest':'balanced');
    for(const g of s.lastWeek.games){
     const match=g.line.match(/연장 (\d+)회/);if(match){seenExtra=true;assert.ok(Number(match[1])>=10);if(league!=='mlb')assert.ok(Number(match[1])<=D.getLeagueRules(league).maxInnings);else assert.match(g.line,/승부치기/);}
     if(g.result==='D'){seenDraw=true;assert.notEqual(league,'mlb');assert.match(g.line,new RegExp('연장 '+D.getLeagueRules(league).maxInnings+'회'));assert.equal(g.our,g.opp);}
    }
    D.validateSave(copy(s));
   }
  }
  assert.ok(seenExtra,league);if(league!=='mlb')assert.ok(seenDraw,league);
 }
});
test('시즌 이벤트는 7회이며 원래 3개 사건과 추가 3지선다 저장이 호환된다',()=>{
 for(const league of ['highschool','kbo','npb','mlb']){
  const events=[];finish(create(league),s=>{
   const before=JSON.stringify(s),e=s.pendingEvent;events.push(e);
   assert.deepEqual(D.validateSave(copy(s)),s);assert.equal(D.advanceWeeks(s,'balanced',60).weeks,0);assert.throws(()=>D.advanceWeek(s,'rest'));
   for(const c of e.choices){const next=D.resolveEvent(s,c.id);assert.equal(next.pendingEvent,null);assert.deepEqual(next.stats,s.stats);D.validateSave(next);}
   assert.equal(JSON.stringify(s),before);
  });
  assert.equal(events.length,7,league);
  for(const id of ['coach','midseason','clubhouse'])assert.equal(events.find(e=>e.id===id).choices.length,2);
  assert.equal(events.filter(e=>e.choices.length===3).length,4);
 }
});
test('추가 사건 10종은 경력에 따라 순환하며 서로 다른 선택 결과와 보조 효과를 제공한다',()=>{
 let s=create('kbo'),seen=new Set(),buffs=new Set();
 for(let year=0;year<4;year++){
  s=finish(s,current=>{
   const event=current.pendingEvent;if(event.choices.length!==3)return;
   seen.add(event.id);const outcomes=event.choices.map(c=>D.resolveEvent(current,c.id));
   assert.ok(new Set(outcomes.map(v=>JSON.stringify([v.attrs,v.trust,v.fatigue,v.morale,v.buffs]))).size>1,event.id);
   for(let i=0;i<outcomes.length;i++)if(['growth-camp','prehab','safe-camp'].includes(event.choices[i].id)){
    const key=event.choices[i].id==='growth-camp'?'growth':'protection';assert.equal(outcomes[i].buffs[key],3);buffs.add(key);
   }
   const corrupt=copy(current);corrupt.pendingEvent.choices[0].detail='변조';assert.throws(()=>D.validateSave(corrupt));
  });
  if(year<3)s=D.nextSeason(s,s.teamId);
 }
 assert.equal(seen.size,10);assert.equal(buffs.size,2);
});
test('새 훈련은 타자·투수 역할별 능력을 키우고 영상 분석은 피로 부담이 낮다',()=>{
 for(const [role,plan,key] of [['batter','video','discipline'],['batter','running','speed'],['pitcher','video','control'],['pitcher','mental','composure']]){
  const s=create('kbo',role),next=D.advanceWeek(s,plan),rest=D.advanceWeek(s,'rest');
  assert.ok(next.attrs[key]>rest.attrs[key]);D.validateSave(next);
 }
});
test('호수비는 야수에게만 기록되고 지명타자에게는 발생하지 않는다',()=>{
 let seen=false;
 for(const position of ['CF','DH']){
  let s=D.createCareer({name:'수비 검증',role:'batter',seed:3,entry:'pro',position});
  while(s.phase==='active'){
   if(s.pendingEvent){s=D.resolveEvent(s,s.pendingEvent.choices.at(-1).id);continue;}
   s=D.advanceWeek(s,s.fatigue>=60?'rest':'balanced');
   for(const g of s.lastWeek.games)if(g.highlight.includes('호수비')){assert.equal(position,'CF');seen=true;assert.ok(g.played);}
  }
 }
 assert.ok(seen);
});
