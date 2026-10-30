'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),D=require('../dist/core.js');
const clone=s=>JSON.parse(JSON.stringify(s)),cache=new Map();
function finish(s){while(s.phase==='active')s=s.pendingEvent?D.resolveEvent(s,s.pendingEvent.choices.at(-1).id):D.advanceWeeks(s,'balanced',60).state;return s;}
function eligible({seed=1,leagueId='kbo',role='batter'}={}){
 const key=[seed,leagueId,role].join(':');if(cache.has(key))return clone(cache.get(key));
 let s=D.createCareer({name:'다음 기회',role,entry:'pro',leagueId,seed});
 for(let year=1;year<=(leagueId==='mlb'?6:8);year++){s=finish(s);if(D.getContractStatus(s).faEligible)break;s=D.nextSeason(s,s.teamId);}
 cache.set(key,clone(s));return s;
}
function firstOffer(s){while(s.phase==='active'){if(D.getFreeAgentStatus(s).offers.length)return s;s=D.advanceWeek(s,'balanced');}throw new Error('No offer for test seed '+s.id);}

test('FA 자격·계약 만료 후 무소속을 선택하고 완료 시즌만 서비스로 인정한다',()=>{
 const s=eligible(),before=JSON.stringify(s),next=D.enterFreeAgency(s);
 assert.equal(JSON.stringify(s),before);assert.equal(next.age,s.age+1);assert.equal(next.freeAgency.active,true);assert.equal(next.salary,0);assert.equal(next.contract.yearsLeft,0);
 assert.equal(next.contract.serviceYears,s.contract.serviceYears+1);assert.equal(next.contract.faService.kbo,null);assert.deepEqual(next.careerStats,s.careerStats);assert.deepEqual(next.life,s.life);assert.equal(next.totalSalary,s.totalSalary);D.validateSave(next);
 assert.deepEqual(D.contractOptions(next),[]);assert.equal(D.getOutlook(next).probability,0);
 const reserved=finish(D.createCareer({name:'보류권 선수',role:'batter',entry:'pro',seed:4}));assert.throws(()=>D.enterFreeAgency(reserved));
 const contracted=clone(s);contracted.contract.yearsLeft=2;assert.throws(()=>D.enterFreeAgency(contracted));
});

test('개인훈련은 기량·아이템을 반영하지만 경기·연봉·서비스·감독 신뢰를 늘리지 않는다',()=>{
 let s=D.enterFreeAgency(eligible());for(const k of Object.keys(s.attrs))s.attrs[k]=50;
 const team=clone(s);team.freeAgency={active:false,originTeamId:null,international:false,joinedWeek:null,declined:[]};team.salary=team.contract.annualSalary=3200;team.contract.yearsLeft=1;
 const trained=D.advanceWeek(s,'balanced'),teamTrained=D.advanceWeek(team,'balanced');
 assert.ok(trained.attrs.contact>s.attrs.contact);assert.ok(trained.attrs.contact-s.attrs.contact<teamTrained.attrs.contact-team.attrs.contact);
 const records=clone(s.careerStats),service=clone(s.contract),cash=s.totalSalary,trust=s.trust;
 s=D.useItem(D.buyItem(s,'growth'),'growth');for(let week=0;week<4;week++)s=D.advanceWeek(s,'defense');
 assert.equal(s.buffs.growth,0);assert.equal(s.stats.g,0);assert.deepEqual(s.careerStats,records);assert.deepEqual(s.contract,service);assert.equal(s.totalSalary,cash);assert.equal(s.trust,trust);assert.equal(s.pendingEvent,null);assert.deepEqual(s.lastWeek.games,[]);D.validateSave(s);
});

test('복귀 제안은 재접속으로 바뀌지 않고 거절 후 같은 문의에서 다시 나오지 않는다',()=>{
 const s=firstOffer(D.enterFreeAgency(eligible({seed:1}))),offers=D.getFreeAgentStatus(s).offers;
 assert.deepEqual(offers,D.getFreeAgentStatus(D.validateSave(clone(s))).offers);
 let rejected=s;for(const o of offers)rejected=D.declineFreeAgentOffer(rejected,o.teamId);
 assert.deepEqual(D.getFreeAgentStatus(rejected).offers,[]);assert.throws(()=>D.signFreeAgent(rejected,offers[0].teamId));assert.throws(()=>D.declineFreeAgentOffer(rejected,offers[0].teamId));D.validateSave(rejected);
 const unoffered=D.TEAMS.find(t=>t.leagueId!=='highschool'&&!offers.some(o=>o.teamId===t.id));assert.throws(()=>D.signFreeAgent(s,unoffered.id));
 let monthly=rejected;while(monthly.phase==='active'&&Math.floor(monthly.week/4)===Math.floor(s.week/4))monthly=D.advanceWeek(monthly,'video');assert.deepEqual(monthly.freeAgency.declined,[]);
});

test('같은 리그·해외 시즌 중 복귀는 과거 출전을 만들지 않고 계약·순위·저장을 보존한다',()=>{
 for(const seed of [1,2,13]){
  const s=firstOffer(D.enterFreeAgency(eligible({seed}))),offer=D.getFreeAgentStatus(s).offers[0],before=JSON.stringify(s),next=D.signFreeAgent(s,offer.teamId);
  assert.equal(JSON.stringify(s),before);assert.equal(next.freeAgency.active,false);assert.equal(next.freeAgency.joinedWeek,s.week);assert.equal(next.teamId,offer.teamId);assert.equal(next.salary,offer.annualSalary);
  assert.equal(next.stats.g,0);assert.equal(next.contract.serviceYears,s.contract.serviceYears);assert.equal(next.contract.faService.kbo,next.contract.leagueService.kbo);assert.equal(next.totalSalary,s.totalSalary);assert.deepEqual(next.careerStats,s.careerStats);assert.deepEqual(next.lastWeek.games,[]);
  if(next.leagueId!=='kbo')assert.equal(next.contract.internationalVeteran,true);
  D.validateSave(next);const following=D.advanceWeek(next,'balanced');D.validateSave(following);assert.ok(following.totalSalary>next.totalSalary);assert.equal(following.contract.serviceYears,next.contract.serviceYears);
  assert.deepEqual(following,D.advanceWeek(D.validateSave(clone(next)),'balanced'));
  const end=finish(next),another=D.nextSeason(end,end.teamId);D.validateSave(another);assert.equal(another.contract.serviceYears,next.contract.serviceYears+1);
 }
});

test('무소속 공백은 서비스·명전 시즌에 합산하지 않고 35세 이후 노화와 은퇴를 적용한다',()=>{
 let s=D.enterFreeAgency(eligible()),service=s.contract.serviceYears,assessment=D.getCareerAssessment(s).leagues.map(l=>l.seasons),records=clone(s.careerStats),cash=s.totalSalary;
 while(s.age<35){s=finish(s);s=D.enterFreeAgency(s);D.validateSave(s);}
 assert.equal(s.contract.serviceYears,service);assert.equal(s.totalSalary,cash);assert.deepEqual(s.careerStats,records);assert.deepEqual(D.getCareerAssessment(s).leagues.map(l=>l.seasons),assessment);
 assert.ok(s.seasons.some(v=>v.stage==='unattached'));assert.ok(s.seasons.filter(v=>v.stage==='unattached').every(v=>v.scheduledGames===0&&v.stats.g===0));
 const before={...s.attrs};s=D.advanceWeek(s,'balanced');assert.ok(Object.keys(before).some(k=>s.attrs[k]<before[k]));assert.equal(D.getRetirementStatus(s).recommended,false);
 const retired=D.retire(s);D.validateSave(retired);assert.equal(retired.phase,'retired');assert.deepEqual(D.getCareerAssessment(retired).leagues.map(l=>l.seasons),assessment);assert.equal(retired.seasons.at(-1).stage,'unattached');
});

test('NPB 국내 FA 미아 기간은 해외 FA 서비스로 가산하지 않는다',()=>{
 let s=D.enterFreeAgency(eligible({leagueId:'npb',seed:2}));assert.equal(s.freeAgency.international,false);assert.equal(s.contract.leagueService.npb,8);
 let offers=0;for(let year=0;year<2;year++){while(s.phase==='active'){const market=D.getFreeAgentStatus(s);offers+=market.offers.length;assert.ok(market.offers.every(o=>o.teamId.startsWith('npb-')));s=D.advanceWeek(s,'balanced');}s=D.enterFreeAgency(s);}
 assert.ok(offers>0);assert.equal(s.contract.leagueService.npb,8);assert.equal(s.freeAgency.international,false);D.validateSave(s);
});

test('이전 저장은 무소속이 아닌 상태로 보존하고 허위 무소속 급여·기록·권리를 거부한다',()=>{
 const old=eligible(),before=clone(old);delete old.freeAgency;const migrated=D.validateSave(old);assert.deepEqual(migrated.attrs,before.attrs);assert.deepEqual(migrated.contract,before.contract);assert.equal(migrated.freeAgency.active,false);
 const unsigned=D.enterFreeAgency(before);for(const mutate of [v=>v.salary=100,v=>v.stats.g=1,v=>v.freeAgency.international=false,v=>v.freeAgency.originTeamId='bad',v=>v.freeAgency.joinedWeek=1]){const bad=clone(unsigned);mutate(bad);assert.throws(()=>D.validateSave(bad));}
 const second=D.enterFreeAgency(finish(unsigned)),bad=clone(second);bad.seasons.at(-1).stats.g=1;assert.throws(()=>D.validateSave(bad));
});

test('화면에서 무소속 개인훈련·제안 거절·프로 복귀 선택이 저장에 반영된다',async()=>{
 const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync(require.resolve('../dist/app.js'),'utf8');
 function ui(saved){const elements=new Map(),events={},store=new Map([['dugout.career.v1',JSON.stringify(saved)]]),document={documentElement:{style:{setProperty(){}}},getElementById(id){if(!elements.has(id))elements.set(id,{innerHTML:'',classList:{toggle(){},add(){},remove(){}},addEventListener(){},showModal(){},close(){}});return elements.get(id);},querySelectorAll:()=>[],addEventListener:(n,fn)=>events[n]=fn};vm.runInNewContext(source,{window:{Dugout:D,scrollTo(){}},document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},JSON,setTimeout(fn){fn();return 0;},clearTimeout(){},matchMedia:()=>({matches:true})});return {html:()=>elements.get('main').innerHTML,click:dataset=>events.click({target:{closest:()=>({dataset})}}),saved:()=>D.validateSave(JSON.parse(store.get('dugout.career.v1')))};}
 const u=ui(eligible());assert.match(u.html(),/무소속 개인훈련/);await u.click({action:'enter-free-agency'});assert.match(u.html(),/소속팀 없이 개인훈련/);assert.match(u.html(),/주요 프로 연봉/);await u.click({action:'advance-one'});assert.equal(u.saved().week,1);assert.equal(u.saved().stats.g,0);
 const offered=firstOffer(D.enterFreeAgency(eligible({seed:2}))),v=ui(offered),offer=D.getFreeAgentStatus(offered).offers[0];assert.match(v.html(),/1년 계약 · 프로 복귀/);await v.click({freeSign:offer.teamId});assert.equal(v.saved().teamId,offer.teamId);assert.equal(v.saved().freeAgency.active,false);
 const w=ui(offered);await w.click({freeDecline:offer.teamId});assert.ok(w.saved().freeAgency.declined.includes(offer.teamId));
});
