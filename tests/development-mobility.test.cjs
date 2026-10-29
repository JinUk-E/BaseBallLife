'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),D=require('../dist/core.js');
const clone=s=>JSON.parse(JSON.stringify(s));
const mean=s=>Object.values(s.attrs).reduce((a,b)=>a+b,0)/5;
function finish(s){while(s.phase==='active')s=s.pendingEvent?D.resolveEvent(s,(s.pendingEvent.choices.find(c=>c.id==='recharge')||s.pendingEvent.choices[0]).id):D.advanceWeeks(s,'balanced',60).state;return s;}
function school({country='kr',rating=80,role='batter',plan='overseas'}={}){
 let s=D.createCareer({name:'졸업 진로',role,schoolCountry:country,seed:28});
 for(const key of Object.keys(s.attrs))s.attrs[key]=s.potential.caps[key]=rating;
 for(let i=0;i<2;i++){s=finish(s);s=D.nextSeason(s,D.contractOptions(s)[0].teamId);}
 if(plan==='overseas')s=D.chooseDraftPlan(s,plan);return finish(s);
}
function tradeFixture({leagueId='kbo',years=1,rating=30,rebuild=false}={}){
 for(let seed=1;seed<=32;seed++){
  let s=D.createCareer({name:'이적 협의',role:'batter',entry:'pro',leagueId,seed,...(rebuild?{teamId:'kbo-kiwoom'}:{})});
  for(const key of Object.keys(s.attrs))s.attrs[key]=s.potential.caps[key]=rating;
  s.contract.yearsLeft=years;s=finish(s);
  const status=D.getTradeStatus(s);if(status.offers.length&&(!rebuild||status.offers.some(o=>o.reason.includes('하위권'))))return s;
 }
 throw new Error('No trade fixture: '+JSON.stringify({leagueId,years,rating,rebuild}));
}

test('기본 성장과 상한 근처 성장을 낮추고 균형 훈련만으로 초반 전 능력 99가 되지 않는다',()=>{
 const normal=D.createCareer({name:'성장 속도',role:'batter',entry:'pro',seed:2}),near=clone(normal);
 for(const s of [normal,near])for(const key of Object.keys(s.attrs)){s.attrs[key]=s===normal?50:95;s.potential.caps[key]=99;}
 const a=D.advanceWeek(normal,'balanced'),b=D.advanceWeek(near,'balanced');
 assert.ok(mean(a)-mean(normal)<1);assert.ok(mean(b)-mean(near)<(mean(a)-mean(normal))*.3);
 let s=normal;for(let i=0;i<3;i++){s=finish(s);if(i<2)s=D.nextSeason(s,s.teamId);}
 assert.ok(Math.min(...Object.values(s.attrs))<95);assert.match(D.ITEMS.find(i=>i.id==='growth').description,/25%/);
});

test('한국 고교 드래프트 불참 후 미국·일본 제안을 받고 계약·고교 기록을 보존한다',()=>{
 for(const role of ['batter','pitcher']){
  const s=school({role}),before=JSON.stringify(s),offers=D.getGraduationOffers(s);assert.equal(s.draftTeamId,null);assert.deepEqual(D.contractOptions(s),[]);
  assert.ok(offers.some(o=>o.teamId.startsWith('mlb-')));assert.ok(offers.some(o=>o.teamId.startsWith('npb-')));
  assert.deepEqual(offers,D.getGraduationOffers(D.validateSave(clone(s))));
  for(const league of ['mlb','npb']){
   const offer=offers.find(o=>o.teamId.startsWith(league+'-')),next=D.nextSeason(s,offer.teamId,1,false,'overseas');
   assert.equal(next.age,19);assert.equal(next.leagueId,league);assert.equal(next.salary,offer.annualSalary);assert.equal(next.careerStats.g,0);assert.deepEqual(next.schoolStats,s.schoolStats);
   assert.equal(next.contract.serviceYears,0);assert.equal(next.seasons.at(-1).stage,'highschool');assert.ok(next.history.some(h=>h.title==='드래프트 불참 · 해외 진출'));D.validateSave(D.advanceWeek(next,'balanced'));
  }
  assert.equal(JSON.stringify(s),before);assert.throws(()=>D.nextSeason(s,offers[0].teamId));
 }
});

test('미국·일본 고교의 국내 리그를 우회하지 않고 해외 제안이 없으면 국내 참가로 돌아간다',()=>{
 for(const country of ['us','jp']){
  const s=school({country}),offers=D.getGraduationOffers(s);assert.ok(offers.length);assert.ok(offers.every(o=>!o.teamId.startsWith(D.SCHOOL_PATHS[country].leagueId+'-')));
 }
 const weak=school({rating:30});assert.deepEqual(D.getGraduationOffers(weak),[]);
 const domestic=D.chooseDraftPlan(weak,'domestic');assert.ok(domestic.draftTeamId);D.validateSave(domestic);
 const back=D.chooseDraftPlan(domestic,'overseas');assert.equal(back.draftTeamId,null);
 const next=D.nextSeason(domestic,domestic.draftTeamId);assert.equal(next.leagueId,'kbo');
 assert.throws(()=>D.chooseDraftPlan(next,'overseas'));assert.throws(()=>D.nextSeason(weak,'mlb-lad',1,false,'overseas'));
});

test('세 리그의 트레이드는 같은 리그 안에서만 이동하며 잔여 계약·서비스·통산을 승계한다',()=>{
 for(const leagueId of ['kbo','npb','mlb'])for(const years of [1,3]){
  const s=tradeFixture({leagueId,years}),offer=D.getTradeStatus(s).offers[0],prior=clone(s.contract);
  assert.ok(offer.teamId.startsWith(leagueId+'-'));const next=D.nextSeason(s,offer.teamId,offer.years[0],false,'trade');
  assert.equal(next.teamId,offer.teamId);assert.equal(next.leagueId,leagueId);assert.equal(next.contract.yearsLeft,Math.max(1,years-1));
  assert.equal(next.salary,offer.annualSalary);if(years>1)assert.equal(next.salary,s.salary);
  assert.equal(next.contract.serviceYears,prior.serviceYears+1);assert.equal(next.contract.leagueService[leagueId],prior.leagueService[leagueId]+1);
  assert.deepEqual(next.contract.faService,prior.faService);assert.deepEqual(next.careerStats,s.careerStats);assert.equal(next.seasons.at(-1).teamId,s.teamId);assert.equal(next.stats.g,0);
  D.validateSave(D.advanceWeek(next,'balanced'));assert.throws(()=>D.nextSeason(s,leagueId==='mlb'?'kbo-lg':'mlb-lad',1,false,'trade'));
 }
});

test('하위권 전력 재편과 출전 부족이 협의를 만들고 거절·재접속으로 재추첨하지 않는다',()=>{
 const rebuilding=tradeFixture({rating:80,rebuild:true});assert.match(D.getTradeStatus(rebuilding).context,/전력 재편/);
 assert.ok(D.getTradeStatus(rebuilding).offers.some(o=>o.reason.includes('하위권')));
 const s=tradeFixture(),offers=D.getTradeStatus(s).offers;assert.match(D.getTradeStatus(s).context,/출전 기회/);
 assert.deepEqual(offers,D.getTradeStatus(D.validateSave(clone(s))).offers);
 let rejected=s;for(const offer of offers)rejected=D.declineTrade(rejected,offer.teamId);
 assert.deepEqual(D.getTradeStatus(rejected).offers,[]);assert.throws(()=>D.nextSeason(rejected,offers[0].teamId,1,false,'trade'));assert.throws(()=>D.declineTrade(rejected,offers[0].teamId));
 const stayed=D.nextSeason(rejected,rejected.teamId);assert.deepEqual(stayed.mobility.declinedTrades,[]);
});

test('기존 저장의 능력·기록·자산을 보존하며 진로 필드의 잘못된 값을 거부한다',()=>{
 const s=D.advanceWeek(D.createCareer({name:'이전 저장',role:'batter',seed:8}),'balanced'),old=clone(s);delete old.mobility;
 const before=JSON.stringify(old),migrated=D.validateSave(old);assert.equal(JSON.stringify(old),before);assert.deepEqual(migrated.attrs,s.attrs);assert.deepEqual(migrated.stats,s.stats);assert.deepEqual(migrated.life,s.life);
 assert.deepEqual(migrated.mobility,{draftPlan:'domestic',declinedTrades:[]});
 for(const mutate of [v=>v.mobility.draftPlan='bad',v=>v.mobility.declinedTrades=['bad'],v=>v.mobility.extra=true]){const bad=clone(s);mutate(bad);assert.throws(()=>D.validateSave(bad));}
});

function ui(saved){
 const fs=require('node:fs'),vm=require('node:vm'),elements=new Map(),events={},store=new Map([['dugout.career.v1',JSON.stringify(saved)]]),details={open:true,classList:{contains:k=>k==='point-supplies'}};
 const document={documentElement:{style:{setProperty(){}}},getElementById(id){if(!elements.has(id))elements.set(id,{innerHTML:'',classList:{toggle(){},add(){},remove(){}},addEventListener(){},showModal(){},close(){}});return elements.get(id);},querySelectorAll:()=>[],querySelector:()=>elements.get('main')?.innerHTML.includes('class="card point-supplies"')?details:null,addEventListener:(name,fn)=>events[name]=fn};
 const run=()=>vm.runInNewContext(fs.readFileSync(require.resolve('../dist/app.js'),'utf8'),{window:{Dugout:D,scrollTo(){}},document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},JSON,setTimeout(){},clearTimeout(){},matchMedia:()=>({matches:true})});
 run();return {events,store,details,run,html:()=>elements.get('main').innerHTML,click:dataset=>events.click({target:{closest:()=>({dataset})}})};
}
test('아이템 목록은 구매·사용·화면 이동 후 펼침을 유지하며 수동 접기 설정도 기억한다',async()=>{
 const u=ui(D.createCareer({name:'아이템 목록',role:'batter',entry:'pro',seed:3}));await u.click({view:'development'});assert.match(u.html(),/point-supplies" open/);
 await u.click({buyItem:'growth'});assert.match(u.html(),/point-supplies" open/);await u.click({useItem:'growth'});assert.match(u.html(),/point-supplies" open/);
 await u.click({view:'home'});await u.click({view:'development'});assert.match(u.html(),/point-supplies" open/);
 u.details.open=false;u.events.toggle({target:u.details});await u.click({view:'home'});await u.click({view:'development'});assert.doesNotMatch(u.html(),/point-supplies" open/);assert.equal(u.store.get('dugout.supplies.open.v1'),'false');
 u.run();await u.click({view:'development'});assert.doesNotMatch(u.html(),/point-supplies" open/);
});
test('졸업·트레이드 화면의 선택 버튼이 실제 다음 시즌과 저장에 연결된다',async()=>{
 const graduate=school({plan:'domestic'}),u=ui(graduate);await u.click({draftPlan:'overseas'});assert.match(u.html(),/해외 진출 선택/);
 let saved=D.validateSave(JSON.parse(u.store.get('dugout.career.v1')));const overseas=D.getGraduationOffers(saved)[0];await u.click({overseas:overseas.teamId});saved=D.validateSave(JSON.parse(u.store.get('dugout.career.v1')));assert.equal(saved.teamId,overseas.teamId);
 const traded=tradeFixture({years:3}),v=ui(traded),offer=D.getTradeStatus(traded).offers[0];assert.match(v.html(),/협의 수락 · 이적/);await v.click({trade:offer.teamId,tradeYears:String(offer.years[0])});
 const next=D.validateSave(JSON.parse(v.store.get('dugout.career.v1')));assert.equal(next.teamId,offer.teamId);assert.equal(next.contract.yearsLeft,2);
});
