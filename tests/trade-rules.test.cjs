'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),D=require('../dist/core.js');
const clone=s=>JSON.parse(JSON.stringify(s));
function end(s){while(s.phase==='active')s=s.pendingEvent?D.resolveEvent(s,s.pendingEvent.choices.at(-1).id):D.advanceWeeks(s,'balanced',60).state;return s;}
function create(leagueId='kbo',role='batter',seed=1){return D.createCareer({name:'공식 규약 검증',role,entry:'pro',leagueId,seed});}
function firstTrade(leagueId='kbo'){
 let s=create(leagueId),previous=null;for(const k of Object.keys(s.attrs))s.attrs[k]=s.potential.caps[k]=30;
 if(leagueId==='kbo'){s=end(s);s=D.nextSeason(s,s.teamId);}
 while(s.phase==='active'){
  if(s.pendingEvent){s=D.resolveEvent(s,s.pendingEvent.choices.at(-1).id);continue;}
  if(D.getTradeStatus(s).offers.length)return {s,previous};
  previous=s;s=D.advanceWeek(s,'balanced');
 }
 throw Error('No active trade fixture');
}
let faCache;
function faTrade(){
 if(faCache)return clone(faCache);
 let s=create('mlb','batter',12);
 for(let y=0;y<6;y++){s=end(s);if(y<5)s=D.nextSeason(s,s.teamId);}
 const offer=D.contractOptions(s).find(o=>o.teamId!==s.teamId&&o.teamId.startsWith('mlb-'));assert.ok(offer);
 s=D.nextSeason(s,offer.teamId,4);for(const k of Object.keys(s.attrs))s.attrs[k]=Math.min(30,s.attrs[k]);
 while(s.phase==='active'){
  if(s.pendingEvent){s=D.resolveEvent(s,s.pendingEvent.choices.at(-1).id);continue;}
  if(D.getTradeStatus(s).offers.length&&D.getTradeStatus(s).requiresConsent){faCache=clone(s);return s;}
  s=D.advanceWeek(s,'balanced');
 }
 throw Error('No consent fixture');
}

test('KBO·NPB 7월 31일과 MLB 2026년 8월 3일 마감 경계를 구분한다',()=>{
 const k=create();k.transfers.draftedOn=null;
 assert.equal(D.tradeEligibility(k,'2026-07-31').allowed,true);
 for(const date of ['2026-08-01','2026-09-30','2026-11-30'])assert.equal(D.tradeEligibility(k,date).allowed,false);
 assert.equal(D.tradeEligibility(k,'2026-12-01').allowed,true);
 const n=create('npb');assert.equal(D.tradeEligibility(n,'2026-07-31').allowed,true);assert.equal(D.tradeEligibility(n,'2026-08-01').allowed,false);
 const after=new Date(Date.parse(n.schedule.endDate)+86400000).toISOString().slice(0,10);assert.equal(D.tradeEligibility(n,after).allowed,true);
 const m=create('mlb');assert.equal(D.tradeEligibility(m,'2026-08-03').allowed,true);assert.equal(D.tradeEligibility(m,'2026-08-04').allowed,false);
 assert.equal(D.getTradeRules('mlb',2026).template,false);assert.equal(D.getTradeRules('mlb',2027).template,true);
});

test('KBO 신인의 현금 양도와 타 구단 FA 계약은 계약일부터 1년을 계산한다',()=>{
 const s=create();assert.equal(D.tradeEligibility(s,'2026-07-01').allowed,false);assert.match(D.tradeEligibility(s,'2026-07-01').reason,/선수 간 교환은 예외/);
 s.schedule.year=2027;s.transfers.draftedOn='2026-01-15';
 assert.equal(D.tradeEligibility(s,'2027-01-14').allowed,false);assert.equal(D.tradeEligibility(s,'2027-01-15').allowed,true);
 s.transfers.draftedOn=null;s.transfers.faSignings=[{date:'2026-05-20',fromTeamId:'kbo-kt',toTeamId:s.teamId,qualified:true}];
 assert.equal(D.tradeEligibility(s,'2027-05-19').allowed,false);assert.equal(D.tradeEligibility(s,'2027-05-20').allowed,true);
 // Own-club renewal does not erase an existing one-year restriction.
 s.transfers.faSignings.push({date:'2027-01-01',fromTeamId:s.teamId,toTeamId:s.teamId,qualified:true});assert.equal(D.tradeEligibility(s,'2027-05-19').allowed,false);
 s.transfers.faSignings=[s.transfers.faSignings[1]];assert.equal(D.tradeEligibility(s,'2027-05-19').allowed,true);
 s.transfers.faSignings=[{date:'2027-01-01',fromTeamId:'npb-yomiuri',toTeamId:s.teamId,qualified:true}];assert.equal(D.tradeEligibility(s,'2027-05-19').allowed,true);
});

test('시즌 중 이적은 계약·기록·주차·서비스를 보존하고 KBO 이전비만 지갑에 지급한다',()=>{
 for(const league of ['kbo','npb','mlb']){
  const {s}=firstTrade(league),before=JSON.stringify(s),status=D.getTradeStatus(s),offer=status.offers[0],cash=D.getLifeShop(s).balance;
  assert.equal(status.requiresConsent,false);assert.equal(offer.annualSalary,s.salary);
  assert.throws(()=>D.declineTrade(s,offer.teamId),/거부권/);
  const moved=D.executeTrade(s,offer.teamId);
  assert.equal(JSON.stringify(s),before);assert.equal(moved.teamId,offer.teamId);
  for(const key of ['stats','careerStats','schoolStats','contract','attrs','potential','life','inventory','buffs'])assert.deepEqual(moved[key],s[key]);
  for(const key of ['age','season','week','salary','totalSalary','points','leagueId'])assert.equal(moved[key],s[key]);
  assert.equal(D.getLifeShop(moved).balance,cash+(league==='kbo'?200:0));
  assert.equal(moved.lastWeek.games.length,0);assert.equal(D.getTradeStatus(moved).offers.length,0);assert.throws(()=>D.executeTrade(moved,offer.teamId));
  assert.deepEqual(D.validateSave(clone(moved)),moved);
  const next=D.advanceWeek(moved,'balanced');assert.ok(next.lastWeek.games.every(g=>g.opponentId!==moved.teamId));
  assert.deepEqual(next,D.advanceWeek(D.validateSave(clone(moved)),'balanced'));
  const finished=end(moved),newYear=D.nextSeason(finished,finished.teamId);
  assert.equal(newYear.contract.serviceYears,s.contract.serviceYears+1);assert.deepEqual(newYear.careerStats,finished.careerStats);D.validateSave(newYear);
 }
});

test('일반 선수의 통보 무시는 거부권이 되지 않고 빠른 진행은 협의 도착에서 멈춘다',()=>{
 const {s,previous}=firstTrade(),offer=D.getTradeStatus(s).offers[0];
 assert.deepEqual(D.advanceWeek(s,'balanced'),D.advanceWeek(D.executeTrade(s,offer.teamId),'balanced'));
 const advanced=D.advanceWeeks(previous,'balanced',4);assert.equal(advanced.weeks,1);assert.equal(advanced.state.week,s.week);assert.equal(D.getTradeStatus(advanced.state).offers.length,1);
 const oldChoice=clone(s);oldChoice.mobility.declinedTrades=[offer.teamId];delete oldChoice.transfers;
 assert.equal(D.getTradeStatus(D.validateSave(oldChoice)).offers[0].teamId,offer.teamId);
});

test('MLB 국내 FA 직후는 현금 5만 달러·서면 동의 조건으로 이적하거나 거부한다',()=>{
 const s=faTrade(),before=JSON.stringify(s),status=D.getTradeStatus(s),offer=status.offers[0];
 assert.equal(status.requiresConsent,true);assert.match(status.consentReason,/6월 15일/);assert.equal(offer.cash,50000);
 assert.equal(D.tradeEligibility(s,s.schedule.year+'-06-15').requiresConsent,true);assert.equal(D.tradeEligibility(s,s.schedule.year+'-06-16').requiresConsent,false);
 const rejected=D.declineTrade(s,offer.teamId);assert.equal(JSON.stringify(s),before);assert.deepEqual(D.getTradeStatus(rejected).offers,[]);
 assert.deepEqual(D.getTradeStatus(D.validateSave(clone(rejected))).offers,[]);assert.throws(()=>D.declineTrade(rejected,offer.teamId));assert.equal(D.advanceWeek(rejected,'balanced').teamId,s.teamId);
 const moved=D.executeTrade(s,offer.teamId);assert.equal(moved.teamId,offer.teamId);assert.deepEqual(moved.contract,s.contract);assert.equal(moved.transfers.moves.at(-1).cash,50000);D.validateSave(moved);
 const international=clone(s);international.transfers.faSignings.at(-1).fromTeamId='npb-yomiuri';assert.equal(D.tradeEligibility(international).requiresConsent,false);
 international.transfers.faSignings.at(-1).fromTeamId='mlb-yankees';international.transfers.faSignings.at(-1).qualified=false;assert.equal(D.tradeEligibility(international).requiresConsent,false);
});

test('실제 KBO FA 계약은 외부 이적만 1년 제한하고 재계약·FA 재수와 구분한다',()=>{
 let s=create('kbo','batter',2);for(let y=0;y<8;y++){s=end(s);if(y<7)s=D.nextSeason(s,s.teamId);}
 const external=D.contractOptions(s).find(o=>o.teamId!==s.teamId&&o.teamId.startsWith('kbo-'));assert.ok(external);
 const moved=D.nextSeason(s,external.teamId,4),signed=moved.transfers.faSignings.at(-1);
 assert.equal(signed.qualified,true);assert.equal(signed.fromTeamId,s.teamId);assert.equal(signed.toTeamId,external.teamId);assert.equal(signed.date,moved.schedule.year+'-01-01');
 assert.equal(D.tradeEligibility(moved).allowed,false);assert.match(D.getTradeStatus(moved).context,/FA 계약/);
 const renewed=D.nextSeason(s,s.teamId,4);assert.equal(D.tradeEligibility(renewed).allowed,true);
 const deferred=D.nextSeason(s,s.teamId,1,true);assert.equal(deferred.transfers.faSignings.length,s.transfers.faSignings.length);assert.equal(D.tradeEligibility(deferred).allowed,true);
});

test('MLB 10/5 동의권은 총 서비스와 최근 동일 구단 경력·공백·중도 이적을 함께 본다',()=>{
 const s=create('mlb');s.contract.leagueService.mlb=10;s.seasons=Array.from({length:10},(_,i)=>({season:i+1,stage:'pro',leagueId:'mlb',teamId:s.teamId}));s.season=11;s.schedule.year=2036;
 assert.equal(D.tradeEligibility(s,'2036-05-01').requiresConsent,true);
 s.contract.leagueService.mlb=9;assert.equal(D.tradeEligibility(s,'2036-05-01').requiresConsent,false);s.contract.leagueService.mlb=10;
 s.seasons[6].teamId='mlb-reds';assert.equal(D.tradeEligibility(s,'2036-05-01').requiresConsent,false);s.seasons[6].teamId=s.teamId;
 s.seasons[6].stage='unattached';assert.equal(D.tradeEligibility(s,'2036-05-01').requiresConsent,false);s.seasons[6].stage='pro';
 s.transfers.moves=[{season:8,fromTeamId:'mlb-reds',toTeamId:s.teamId}];assert.equal(D.tradeEligibility(s,'2036-05-01').requiresConsent,false);
 s.transfers.moves=[];s.phase='seasonEnd';s.contract.leagueService.mlb=9;assert.equal(D.tradeEligibility(s,'2036-12-01').requiresConsent,true);
});

test('이전 저장을 보존하고 날짜·이전비·동일 리그·중복 공시·기록의 변조를 거부한다',()=>{
 const {s}=firstTrade(),old=clone(s);delete old.transfers;const json=JSON.stringify(old),migrated=D.validateSave(old);
 assert.equal(JSON.stringify(old),json);for(const key of ['attrs','contract','stats','careerStats','life','totalSalary'])assert.deepEqual(migrated[key],s[key]);assert.equal(migrated.transfers.draftedOn,'2026-01-01');
 const moved=D.executeTrade(s,D.getTradeStatus(s).offers[0].teamId);
 for(const mutate of [
  v=>v.transfers.extra=true,v=>v.transfers.draftedOn='2027-02-30',v=>v.transfers.moves[0].relocation=400,v=>v.transfers.moves[0].cash=-1,
  v=>v.transfers.moves[0].toTeamId='mlb-yankees',v=>v.transfers.moves.push(clone(v.transfers.moves[0])),v=>v.transfers.moves[0].date='2027-08-01',
  v=>v.transfers.moves[0].week--,v=>v.transfers.moves[0].stats.g=199,v=>v.transfers.draftedOn='2027-01-01'
 ]){const bad=clone(moved);mutate(bad);assert.throws(()=>D.validateSave(bad));}
 assert.equal(D.validateSave(clone(moved)).transfers.moves.length,1);
});
