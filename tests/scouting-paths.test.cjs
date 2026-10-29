'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),D=require('../dist/core.js');
const copy=s=>JSON.parse(JSON.stringify(s));
const create=(options={})=>D.createCareer({name:'관찰 검증',role:'batter',seed:19,...options});
function finish(s){while(s.phase==='active')s=s.pendingEvent?D.resolveEvent(s,s.pendingEvent.choices.at(-1).id):D.advanceWeeks(s,'balanced',60).state;return s;}
function freeAgent(){let s=create({entry:'pro',favoriteTeamId:'npb-yomiuri'});for(let y=1;y<=8;y++){s=finish(s);if(y<8)s=D.nextSeason(s,s.teamId);}return s;}
test('한국·미국·일본의 가상 고교가 각국 프로로 이어지고 국가·선호 구단을 저장한다',()=>{
 for(const [schoolCountry,target] of [['kr','kbo'],['us','mlb'],['jp','npb']]){
  let s=create({schoolCountry,favoriteTeamId:'kbo-lg'});assert.equal(s.age,16);assert.equal(s.schoolCountry,schoolCountry);
  assert.ok(D.getSchoolName(s.teamId,schoolCountry));assert.match(s.history[0].text,new RegExp(D.getSchoolName(s.teamId,schoolCountry)));
  for(let year=0;year<3;year++){s=finish(s);D.validateSave(copy(s));s=D.nextSeason(s,D.contractOptions(s)[0].teamId);}
  assert.equal(s.age,19);assert.equal(s.leagueId,target);assert.equal(s.careerStats.g,0);assert.ok(s.schoolStats.g>0);
  assert.equal(s.favoriteTeamId,'kbo-lg');D.validateSave(s);
 }
 assert.throws(()=>create({schoolCountry:'unknown'}));assert.throws(()=>create({favoriteTeamId:'hs-seoul'}));
});
test('좋은 성적의 관찰 확률이 높고 고교에서도 평가가 작동한다',()=>{
 for(const entry of ['pro','highschool']){
  const poor=create({entry}),good=copy(poor);poor.stats={...poor.stats,g:60,pa:200,ab:180,h:20,bb:20};
  good.stats={...good.stats,g:60,pa:200,ab:180,h:80,bb:20,hr:20};
  assert.ok(D.getScoutingReport(good).chance>D.getScoutingReport(poor).chance);
 }
 let low=0,high=0;
 for(let seed=1;seed<=10;seed++)for(const [quality,bucket]of [[30,'low'],[95,'high']]){
  let s=create({entry:'pro',seed});for(const k of Object.keys(s.attrs)){s.attrs[k]=quality;s.potential.caps[k]=99;}
  s=finish(s);if(bucket==='low')low+=s.scouting.visits.length;else high+=s.scouting.visits.length;
 }
 assert.ok(high>low,JSON.stringify({high,low}));
});
test('관찰 방문과 응답은 재접속으로 재추첨되지 않으며 분석관·스카우트를 구분한다',()=>{
 let s=create({entry:'pro'}),kinds=new Set(),responded=false;
 for(let year=0;year<3;year++){
  while(s.phase==='active'){
   if(s.pendingEvent){s=D.resolveEvent(s,s.pendingEvent.choices.at(-1).id);continue;}
   const plan=s.fatigue>=60?'rest':'balanced',next=D.advanceWeek(s,plan);
   assert.deepEqual(next,D.advanceWeek(D.validateSave(copy(s)),plan));s=next;
   if(s.scouting.encounter){const v=s.scouting.encounter;kinds.add(v.kind);assert.ok(s.scouting.interest[v.teamId]>0);
    for(const choice of ['development','teamwork','decline']){const response=D.respondToScout(s,choice);assert.equal(response.scouting.encounter,null);D.validateSave(response);assert.deepEqual(response.stats,s.stats);}
    const response=D.respondToScout(s,'teamwork');assert.ok(response.trust>=s.trust);assert.throws(()=>D.respondToScout(response,'teamwork'));responded=true;
   }
  }
  if(year<2)s=D.nextSeason(s,s.teamId);
 }
 assert.ok(responded);assert.ok(kinds.has('scout'));assert.ok(kinds.has('analyst'));
});
test('FA는 제한된 실제 제안만 보여주며 거절·재수·관심·계약 권리를 보존한다',()=>{
 const s=freeAgent(),offers=D.contractOptions(s);assert.ok(offers.length>1&&offers.length<10);
 assert.deepEqual(offers,D.contractOptions(D.validateSave(copy(s))));
 const foreign=offers.find(o=>o.teamId!==s.teamId),before=JSON.stringify(s),rejected=D.declineContract(s,foreign.teamId);
 assert.equal(JSON.stringify(s),before);assert.ok(!D.contractOptions(rejected).some(o=>o.teamId===foreign.teamId));
 assert.throws(()=>D.nextSeason(rejected,foreign.teamId));assert.throws(()=>D.declineContract(rejected,foreign.teamId));
 assert.throws(()=>D.declineContract(s,s.teamId));D.validateSave(rejected);
 let allDeclined=s;for(const offer of offers.filter(o=>o.teamId!==s.teamId))allDeclined=D.declineContract(allDeclined,offer.teamId);
 assert.deepEqual(D.contractOptions(allDeclined).map(o=>o.teamId),[s.teamId]);assert.equal(D.getContractStatus(allDeclined).canChooseTeam,true);
 D.validateSave(D.nextSeason(allDeclined,s.teamId,1,true));
 const retry=D.nextSeason(rejected,s.teamId,1,true);assert.equal(retry.contract.faService.kbo,null);assert.deepEqual(retry.scouting.declined,[]);assert.equal(retry.favoriteTeamId,s.favoriteTeamId);
 const target=D.TEAMS.find(t=>t.leagueId==='npb').id,interested=copy(s);for(const id of Object.keys(interested.scouting.interest))interested.scouting.interest[id]=0;interested.scouting.interest[target]=100;
 assert.ok(D.contractOptions(interested).some(o=>o.teamId===target),'observed club must influence its offer');
 const unoffered=D.TEAMS.find(t=>t.leagueId!=='highschool'&&!offers.some(o=>o.teamId===t.id));assert.throws(()=>D.nextSeason(s,unoffered.id));
});
test('기존 저장은 한국 경로로 기록·자산을 보존하고 새 관찰 필드의 변조를 거부한다',()=>{
 const s=D.advanceWeek(create({entry:'pro'}),'balanced'),old=copy(s);delete old.schoolCountry;delete old.favoriteTeamId;delete old.scouting;
 const before=JSON.stringify(old),migrated=D.validateSave(old);assert.equal(JSON.stringify(old),before);assert.equal(migrated.schoolCountry,'kr');assert.deepEqual(migrated.life,s.life);assert.deepEqual(migrated.stats,s.stats);
 for(const mutate of [v=>v.scouting.interest['kbo-lg']=101,v=>v.schoolCountry='bad',v=>v.favoriteTeamId='bad',v=>v.scouting.declined=['bad'],v=>v.scouting.encounter={teamId:'kbo-lg',kind:'scout',season:1,week:1}]){const bad=copy(s);mutate(bad);assert.throws(()=>D.validateSave(bad));}
});
test('새 시작 화면에 국가·선호 구단·10개 KBO 테마가 있으며 테마와 거절 버튼이 동작한다',async()=>{
 const fs=require('node:fs'),vm=require('node:vm'),elements=new Map(),events={},style={},store=new Map();
 const document={documentElement:{style:{setProperty:(k,v)=>style[k]=v}},getElementById(id){if(!elements.has(id))elements.set(id,{innerHTML:'',classList:{toggle(){},add(){},remove(){}},addEventListener(){},showModal(){},close(){}});return elements.get(id);},querySelectorAll(){return [];},addEventListener(k,fn){events[k]=fn;}};
 const context=()=>({window:{Dugout:D,scrollTo(){}},document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},JSON,setTimeout(){},clearTimeout(){},matchMedia(){return {matches:true};}});
 const source=fs.readFileSync(require.resolve('../dist/app.js'),'utf8');vm.runInNewContext(source,context());
 assert.match(elements.get('main').innerHTML,/고교 시작 국가/);assert.match(elements.get('main').innerHTML,/선호 구단/);
 events.change({target:{id:'theme-select',value:'kbo-lg'}});assert.equal(store.get('dugout.theme.v1'),'kbo-lg');assert.equal(style['--green'],'#70182f');
 await events.click({target:{closest:()=>({dataset:{schoolCountry:'us'}})}});assert.match(elements.get('main').innerHTML,/캘리포니아 선셋고/);
 store.set('dugout.career.v1',JSON.stringify(create({schoolCountry:'us',favoriteTeamId:'kbo-lg'})));vm.runInNewContext(source,context());
 assert.match(elements.get('main').innerHTML,/MLB에서 쓰는 나의 이야기/);assert.match(elements.get('main').innerHTML,/선호 구단 · LG 트윈스/);
 const fa=freeAgent();store.set('dugout.career.v1',JSON.stringify(fa));vm.runInNewContext(source,context());
 const foreign=D.contractOptions(fa).find(o=>o.teamId!==fa.teamId);await events.click({target:{closest:()=>({dataset:{declineOffer:foreign.teamId}})}});
 const saved=D.validateSave(JSON.parse(store.get('dugout.career.v1')));assert.ok(saved.scouting.declined.includes(foreign.teamId));
});
