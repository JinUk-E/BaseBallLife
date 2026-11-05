'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),D=require('../dist/core.js');
const copy=s=>JSON.parse(JSON.stringify(s));
function finish(s){let i=0;while(s.phase==='active'&&i++<150)s=s.pendingEvent?D.resolveEvent(s,s.pendingEvent.choices.at(-1).id):D.advanceWeeks(s,'balanced',60).state;assert.equal(s.phase,'seasonEnd');return s;}
test('국가별 학교 표본은 64·32·16개이고 모든 학교가 같은 권역 8팀과 시작한다',()=>{
 for(const [country,n] of [['kr',64],['jp',32],['us',16]]){
  const ids=D.PATHWAYS.schoolIds(country);assert.equal(ids.length,n);assert.equal(new Set(ids).size,n);
  assert.equal(new Set(ids.map(id=>D.getSchoolName(id,country,'expanded'))).size,n);
  for(const id of ids){const group=D.PATHWAYS.schoolGroup(country,id);assert.equal(group.length,8);assert.ok(group.includes(id));assert.equal(new Set(group).size,8);
   const s=D.createCareer({name:'확장 학교',role:'batter',schoolCountry:country,schoolMode:'expanded',teamId:id,seed:11});assert.deepEqual(s.scheduleTeamIds,group);D.validateSave(copy(s));}
 }
 assert.throws(()=>D.createCareer({name:'잘못된 학교',role:'batter',schoolCountry:'us',schoolMode:'expanded',teamId:'hs-extra-20',seed:1}));
});
test('한국은 전·후반기 각각 7경기와 32강부터의 다섯 라운드를 기록하며 다음 학년에 초기화한다',()=>{
 let s=D.createCareer({name:'권역 선수',role:'batter',schoolCountry:'kr',schoolMode:'expanded',teamId:'hs-extra-55',seed:4});
 assert.equal(s.schedule.gamesPerTeam,14);s=finish(s);assert.equal(s.amateur.regionFirst.standings.length,8);
 for(const r of s.amateur.regionFirst.standings)assert.equal(r.w+r.l+r.t,7);
 const periods=D.getSchoolCompetitions(s).periods;assert.deepEqual(periods.map(x=>x.name),['전반기','후반기']);
 assert.ok(periods.every(p=>p.rows.every(r=>r.w+r.l+r.t===7)));
 for(const c of D.getSchoolCompetitions(s).competitions)assert.equal(c.dates.length,5);
 for(const cup of s.amateur.schoolCups)assert.equal(new Set(cup.results.map(r=>r.opponentId)).size,cup.results.length);
 const before=copy(s);delete before.amateur.regionFirst;assert.throws(()=>D.validateSave(before));assert.throws(()=>D.validateSave({...before,amateur:{...before.amateur,regionFirst:{season:1,standings:[]}}}));
 const next=D.nextSeason(s,s.teamId);assert.equal(next.amateur.regionFirst,null);assert.equal(next.scheduleTeamIds.length,8);D.validateSave(next);
 assert.ok(D.getSeasonSchedule(next).games.every(g=>new Date(g.date+'T12:00:00Z').getUTCDay()===6));
});
test('확장 경로 3년을 타자와 투수로 진행하고 프로 기록과 구분한다',()=>{
 for(const country of ['kr','jp','us'])for(const role of ['batter','pitcher']){
  let s=D.createCareer({name:'확장 경력',role,schoolCountry:country,schoolMode:'expanded',teamId:D.PATHWAYS.schoolIds(country).at(-1),seed:8});
  for(let age=16;age<=18;age++){s=finish(s);s=D.validateSave(copy(s));assert.equal(s.age,age);assert.equal(s.careerStats.g,0);if(age<18)s=D.nextSeason(s,s.teamId);}
  const offer=D.contractOptions(s)[0];assert.ok(offer);s=D.nextSeason(s,offer.teamId);assert.equal(s.stage,'pro');assert.equal(s.careerStats.g,0);D.validateSave(s);
 }
});
test('기존 실제 학교 저장은 8팀·기존 대회·기존 일정 그대로 유지된다',()=>{
 let s=D.createCareer({name:'이전 저장',role:'batter',schoolCountry:'kr',schoolMode:'real',seed:5});s=D.advanceWeek(s,'balanced');
 const old=copy(s);delete old.amateur.regionFirst;const loaded=D.validateSave(old);
 assert.equal(loaded.amateur.schoolMode,'real');assert.equal(loaded.schedule.gamesPerTeam,28);
 assert.equal(D.getSchoolCompetitions(loaded).competitions[0].dates.length,3);
 assert.equal(D.getSchoolName('hs-seoul','kr','real'),'덕수고');D.validateSave(D.advanceWeek(loaded,'balanced'));
});
test('학교 등록 화면에서 국가별 학교와 권역을 선택하고 확장 일정으로 시작한다',async()=>{
 const fs=require('node:fs'),vm=require('node:vm'),elements=new Map(),events={},store=new Map();
 const document={documentElement:{style:{setProperty(){}}},getElementById(id){if(!elements.has(id))elements.set(id,{innerHTML:'',value:'',classList:{toggle(){},add(){},remove(){}},addEventListener(){},focus(){}});return elements.get(id);},querySelectorAll:()=>[],querySelector:()=>null,addEventListener:(key,fn)=>events[key]=fn};
 vm.runInNewContext(fs.readFileSync(require.resolve('../dist/app.js'),'utf8'),{window:{Dugout:D,scrollTo(){}},document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},JSON,setTimeout(){},clearTimeout(){},matchMedia:()=>({matches:true})});
 const html=()=>elements.get('main').innerHTML,click=dataset=>events.click({target:{closest:()=>({dataset})}});
 assert.match(html(),/64개교 중 선택/);assert.match(html(),/optgroup label="서울"/);assert.match(html(),/덕수고/);
 await click({schoolCountry:'jp'});assert.match(html(),/32개교 중 선택/);assert.match(html(),/오사카 B/);
 await click({schoolCountry:'us'});assert.match(html(),/16개교 중 선택/);assert.match(html(),/Orange Lutheran/);
 await click({schoolCountry:'kr'});document.getElementById('team-select').value='hs-extra-55';events.change({target:{id:'team-select',value:'hs-extra-55'}});
 document.getElementById('player-name').value='새 선수';events.submit({target:{id:'create-form'},preventDefault(){}});
 const saved=D.validateSave(JSON.parse(store.get('dugout.career.v1')));assert.equal(saved.teamId,'hs-extra-55');assert.equal(saved.amateur.schoolMode,'expanded');assert.equal(saved.schedule.gamesPerTeam,14);
 assert.match(html(),/전반기 권역 순위/);assert.match(html(),/후반기 권역 순위/);assert.match(html(),/강원·제주·경남/);
});
