'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),D=require('../dist/core.js');
const clone=s=>JSON.parse(JSON.stringify(s)),cache=new Map();
function finish(s){while(s.phase==='active')s=s.pendingEvent?D.resolveEvent(s,s.pendingEvent.choices.at(-1).id):D.advanceWeeks(s,'balanced',60).state;return s;}
function unsigned(role='batter',seed=2){
 const key=role+':'+seed;if(cache.has(key))return clone(cache.get(key));
 let s=D.createCareer({name:'새 무대 검증',role,entry:'pro',seed});for(let y=0;y<8;y++){s=finish(s);if(y<7)s=D.nextSeason(s,s.teamId);}s=D.enterFreeAgency(s);cache.set(key,clone(s));return s;
}
function offer(s,id){const o=D.getAlternativeOffers(s).find(o=>o.leagueId===id);assert.ok(o,id+' offer missing');return o;}

test('실제 학교 표본과 7개 재도전 무대·56개 구단을 데이터로 구분한다',()=>{
 assert.equal(D.PATHWAYS.LEAGUES.length,7);const clubs=D.PATHWAYS.LEAGUES.flatMap(l=>l.clubs);assert.equal(clubs.length,56);assert.equal(new Set(clubs.map(c=>c.id)).size,56);
 assert.equal(D.PATHWAYS.byId('gg').clubs.length,9);assert.equal(D.PATHWAYS.byId('bc').clubs.length,9);assert.equal(D.PATHWAYS.byId('shikoku').clubs.length,4);
 for(const country of ['kr','jp','us']){const s=D.createCareer({name:'실제 고교',schoolCountry:country,role:'batter',seed:3});assert.equal(D.getSchoolName(s.teamId,country),D.PATHWAYS.SCHOOLS[country].names[0]);assert.equal(s.amateur.schoolMode,'real');assert.equal(s.schedule.sourceMode,'modeled');D.validateSave(s);}
 assert.notEqual(D.PATHWAYS.byId('jaba-company').kind,D.PATHWAYS.byId('shikoku').kind);
});

test('고교 주요 대회는 탈락·진출 조건을 지키고 지역 경기와 별도 보관해 합산한다',()=>{
 for(const country of ['kr','jp','us'])for(const role of ['batter','pitcher']){
  let s=D.createCareer({name:'대회 경력',schoolCountry:country,role,seed:3});s=finish(s);D.validateSave(s);
  assert.ok(s.amateur.schoolCups.length>=2);if(country!=='us')assert.ok(s.amateur.schoolCups.some(c=>c.results.length));
  const extra=s.amateur.schoolCups.reduce((n,c)=>n+c.results.reduce((a,r)=>a+r.stats.g,0),0);
  assert.equal(D.getSchoolSeasonStats(s).g,s.stats.g+extra);assert.equal(D.getSchoolCareerStats(s).g,s.schoolStats.g+extra);assert.equal(s.careerStats.g,0);
  if(country==='jp'){
   const spring=s.amateur.schoolCups.find(c=>c.id==='senbatsu'),summer=s.amateur.schoolCups.find(c=>c.id==='summer'),local=s.amateur.schoolCups.find(c=>c.id==='osaka');assert.equal(spring.status,'unqualified');assert.deepEqual(spring.results,[]);if(local.status!=='champion')assert.equal(summer.status,'unqualified');
  }
  for(const c of s.amateur.schoolCups){const def=D.PATHWAYS.SCHOOL_CUPS[country].find(d=>d.id===c.id);if(def.format==='knockout')assert.ok(c.results.slice(0,-1).every(r=>r.our>r.opp));}
  let graduate=s;for(let year=0;year<2;year++)graduate=finish(D.nextSeason(graduate,graduate.teamId));const pro=D.nextSeason(graduate,D.contractOptions(graduate)[0].teamId);assert.equal(pro.stage,'pro');assert.equal(pro.careerStats.g,0);D.validateSave(pro);
 }
});

test('CIF-SS D1 풀 대회는 2패 탈락·2승 진출·무패팀 3라운드 휴식을 적용한다',()=>{
 const seen=new Set();
 for(let seed=1;seed<=16;seed++){
  let s=D.createCareer({name:'CIF 대회',role:'batter',schoolCountry:'us',seed});for(const k of Object.keys(s.attrs))s.attrs[k]=s.potential.caps[k]=99;s=finish(s);
  const c=s.amateur.schoolCups.find(c=>c.id==='cifss');if(!c.pool.length)continue;
  const own=c.pool.find(r=>r.teamId===s.teamId),poolResults=c.results.filter(r=>r.date<='2026-05-19'),knockout=c.results.filter(r=>r.date>'2026-05-19');
  assert.ok(own.l<=2);assert.equal(poolResults.filter(r=>r.our>r.opp).length,own.w);assert.equal(poolResults.filter(r=>r.our<r.opp).length,own.l);
  if(own.l===2){seen.add('eliminated');assert.equal(knockout.length,0);assert.equal(c.status,'out');}
  if(own.w===2&&own.l===0){seen.add('bye');assert.equal(poolResults.length,2);assert.ok(!poolResults.some(r=>r.date==='2026-05-19'));assert.ok(knockout.length);}
  if(own.w===2&&own.l===1){seen.add('recovery');assert.equal(poolResults.length,3);assert.ok(knockout.length);}
  D.validateSave(s);
 }
 assert.deepEqual([...seen].sort(),['bye','eliminated','recovery']);
});

test('독립·사회인 입단은 소급 기록 없이 별도 경기를 치르고 주요 프로 서비스·통산을 보존한다',()=>{
 for(const role of ['batter','pitcher']){
  const s=unsigned(role),before=JSON.stringify(s);
  for(const league of D.PATHWAYS.LEAGUES){
   const o=offer(s,league.id);let a=D.joinAlternative(s,o.teamId);assert.equal(a.amateur.alternative.stats.g,0);assert.equal(a.amateur.alternative.results.length,0);assert.equal(a.amateur.alternative.joinedWeek,s.week);assert.equal(a.schedule.endDate,a.schedule.year+'-12-01');
   assert.throws(()=>D.joinAlternative(a,o.teamId));const saved=clone(a);a=D.advanceWeek(a,'balanced');assert.deepEqual(a,D.advanceWeek(D.validateSave(saved),'balanced'));
   a=finish(a);D.validateSave(a);assert.ok(a.amateur.alternative.results.length>0);assert.ok(a.amateur.alternative.stats.g>0);
   assert.deepEqual(a.stats,s.stats);assert.deepEqual(a.careerStats,s.careerStats);assert.deepEqual(a.contract,s.contract);assert.equal(a.salary,0);assert.equal(a.lastWeek.games.length,0);
   if(league.kind==='company'){assert.ok(Math.abs(a.amateur.alternative.income-3600)<1e-7);assert.ok(Math.abs(a.totalSalary-s.totalSalary-3600)<1e-7);}else assert.equal(a.totalSalary,s.totalSalary);
   if(role==='pitcher'){const starts=a.amateur.alternative.results.filter(r=>r.stats.starts);for(let i=1;i<starts.length;i++)assert.ok((Date.parse(starts[i].date)-Date.parse(starts[i-1].date))/86400000>=5);}
  }
  assert.equal(JSON.stringify(s),before);
 }
});

test('2026 경기도리그의 9→8→4 단계와 16·14·3 경기 수를 보존한다',()=>{
 const s=unsigned(),a=finish(D.joinAlternative(s,offer(s,'gg').teamId)).amateur.alternative;
 for(const [stage,size,games]of [[1,9,16],[2,8,14],[3,4,3]]){const table=a.stageTables.find(t=>t.stage===stage).standings;assert.equal(table.length,size);assert.ok(table.every(r=>r.w+r.l===games));}
 assert.equal(a.stage,4);assert.equal(a.finished,true);assert.ok(a.championId);assert.equal(a.stageTables.at(-1).standings.reduce((n,r)=>n+r.w,0),3);
});

test('JABA는 도시대항·일본선수권/클럽선수권을 구분하고 2시즌 NPB 제한을 유지한다',()=>{
 for(const leagueId of ['jaba-company','jaba-club']){
  const base=unsigned();let s=D.joinAlternative(base,offer(base,leagueId).teamId);assert.equal(D.getAlternativeStatus(s).npbWait,2);assert.deepEqual(D.getFreeAgentStatus(s).offers,[]);
  for(let i=0;i<4;i++)s=D.advanceWeek(s,'balanced');const left=D.leaveAlternative(s);assert.equal(left.amateur.jabaSince,s.amateur.jabaSince);assert.deepEqual(D.getFreeAgentStatus(left).offers,[]);assert.throws(()=>D.joinAlternative(left,offer(base,'gg').teamId));
  s=finish(s);assert.equal(D.getAlternativeStatus(s).npbWait,1);assert.ok(D.getAlternativeReturnOffers(s).every(o=>!o.teamId.startsWith('npb-')));
  if(leagueId==='jaba-company'){assert.equal(s.amateur.alternative.stage,3);assert.ok(s.amateur.alternative.stageTables.some(t=>t.stage===2));assert.ok(s.amateur.alternative.stageTables.some(t=>t.stage===3));}else assert.equal(s.amateur.alternative.stage,2);
  const service=clone(s.contract.leagueService);s=D.nextSeason(s,s.teamId,1,false,'unattached');assert.equal(s.amateur.alternative.leagueId,leagueId);assert.equal(D.getAlternativeStatus(s).npbWait,1);s=finish(s);assert.equal(D.getAlternativeStatus(s).npbWait,0);assert.deepEqual(s.contract.leagueService,service);assert.equal(s.amateur.alternativeHistory.length,1);D.validateSave(s);
 }
});

test('독립리그에서 프로 복귀하면 합류 전 기록을 만들지 않고 경로 원장을 보존한다',()=>{
 let successful=false;
 for(let seed=1;seed<=8&&!successful;seed++){
  const base=unsigned('batter',seed);let s=D.joinAlternative(base,offer(base,'gg').teamId);
  while(s.phase==='active'){
   const o=D.getFreeAgentStatus(s).offers[0];if(o){const stats=clone(s.amateur.alternative.stats),week=s.week,service=s.contract.serviceYears;const signed=D.signFreeAgent(s,o.teamId);assert.equal(signed.week,week);assert.equal(signed.contract.serviceYears,service);assert.equal(signed.amateur.alternative,null);assert.deepEqual(signed.amateur.alternativeHistory.at(-1).stats,stats);assert.equal(signed.stats.g,0);assert.equal(signed.lastWeek.games.length,0);D.validateSave(D.advanceWeek(signed,'balanced'));successful=true;break;}
   s=D.advanceWeek(s,'balanced');
  }
 }
 assert.ok(successful);
});

test('시즌 후 복귀 계약은 공백 서비스를 늘리지 않고 새해에 합류한다',()=>{
 let successful=false;
 for(let seed=1;seed<=12&&!successful;seed++){
  const base=unsigned('batter',seed);let s=D.joinAlternative(base,offer(base,'gg').teamId);s=finish(s);const o=D.getAlternativeReturnOffers(s)[0];if(!o)continue;
  const next=D.signAlternativeReturn(s,o.teamId);assert.equal(next.season,s.season+1);assert.equal(next.age,s.age+1);assert.equal(next.week,0);assert.equal(next.teamId,o.teamId);assert.equal(next.contract.serviceYears,s.contract.serviceYears);assert.equal(next.amateur.alternative,null);assert.equal(next.seasons.at(-1).stage,'unattached');assert.equal(next.stats.g,0);D.validateSave(next);successful=true;
 }
 assert.ok(successful);
});

test('기존 가상 고교 저장을 보존하고 새 경로의 기록·일자·소속·급여 변조를 거부한다',()=>{
 let old=D.advanceWeek(D.createCareer({name:'기존 학교',role:'batter',schoolMode:'legacy',seed:8}),'balanced');delete old.amateur;const text=JSON.stringify(old),m=D.validateSave(old);assert.equal(JSON.stringify(old),text);assert.equal(m.amateur.schoolMode,'legacy');assert.equal(m.schedule.weekCount,14);assert.equal(D.getSchoolName(m.teamId,m.schoolCountry,m.amateur.schoolMode),D.SCHOOL_PATHS.kr.schools[0]);D.validateSave(D.advanceWeek(m,'balanced'));
 const base=unsigned();let s=D.joinAlternative(base,offer(base,'gg').teamId);for(let i=0;i<4;i++)s=D.advanceWeek(s,'balanced');
 for(const change of [v=>v.amateur.extra=true,v=>v.amateur.schoolMode='bad',v=>v.amateur.alternative.teamId='kbo-lg',v=>v.amateur.alternative.income=1,v=>v.amateur.alternative.stats.g++,v=>v.amateur.alternative.results[0].date='2099-01-01',v=>v.amateur.alternative.standings[0].w++]){const bad=clone(s);change(bad);assert.throws(()=>D.validateSave(bad));}
});

test('화면에서 사회인 무대 선택·입단·경력 확인·개인훈련 전환이 저장에 연결된다',async()=>{
 const fs=require('node:fs'),vm=require('node:vm'),saved=unsigned(),elements=new Map(),events={},store=new Map([['dugout.career.v1',JSON.stringify(saved)]]);
 const document={documentElement:{style:{setProperty(){}}},getElementById(id){if(!elements.has(id))elements.set(id,{innerHTML:'',classList:{toggle(){},add(){},remove(){}},addEventListener(){},showModal(){},close(){}});return elements.get(id);},querySelectorAll:()=>[],querySelector:()=>null,addEventListener:(name,fn)=>events[name]=fn};
 vm.runInNewContext(fs.readFileSync(require.resolve('../dist/app.js'),'utf8'),{window:{Dugout:D,scrollTo(){}},document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},JSON,setTimeout(){},clearTimeout(){},matchMedia:()=>({matches:true})});
 const click=dataset=>events.click({target:{closest:()=>({dataset})}}),state=()=>D.validateSave(JSON.parse(store.get('dugout.career.v1'))),html=()=>elements.get('main').innerHTML;
 assert.match(html(),/독립리그 · 일본 사회인 트라이아웃/);events.change({target:{id:'alternative-league',value:'jaba-company'}});assert.match(html(),/가상 채용/);
 const target=offer(saved,'jaba-company');await click({alternativeJoin:target.teamId});assert.equal(state().amateur.alternative.teamId,target.teamId);assert.match(html(),/NPB 재계약 제한 2시즌/);
  await click({view:'league'});assert.match(html(),/새 무대의 경기와 순위/);assert.match(html(),/JABA 사회인/);
 await click({view:'records'});assert.match(html(),/독립·사회인 경력/);await click({view:'home'});await click({action:'leave-alternative'});assert.equal(state().amateur.alternative,null);assert.ok(state().amateur.jabaSince);assert.equal(state().amateur.alternativeHistory.length,1);
});
