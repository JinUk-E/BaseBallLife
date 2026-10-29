'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),D=require('../dist/core.js');
const copy=s=>JSON.parse(JSON.stringify(s));
const create=(role='batter',leagueId='kbo')=>D.createCareer({name:'인생 검증',role,entry:'pro',leagueId,seed:7});
function fixture(leagueId,role,years,perYear){const s=create(role,leagueId);s.season=years;s.age=18+years;s.week=s.schedule.weekCount;s.phase='retired';s.seasons=Array.from({length:years},(_,i)=>({leagueId,season:i+1,stats:{...s.stats,...perYear}}));s.stats={...s.stats,...perYear};return s;}
function end(s){while(s.phase==='active')s=s.pendingEvent?D.resolveEvent(s,s.pendingEvent.choices.at(-1).id):D.advanceWeeks(s,'balanced',60).state;return s;}

test('기량은 34세까지 노화로 감소하지 않고 35세부터 잠재력에 따라 감소한다',()=>{
 const high={caps:{a:99,b:99,c:99,d:99,e:99},growthRate:1.5,resilience:1.4},low={caps:{a:70,b:70,c:70,d:70,e:70},growthRate:.65,resilience:.6};
 for(let age=30;age<=34;age++)assert.equal(D.ageDevelopment(age,low).annualDecline,0);
 assert.ok(D.ageDevelopment(35,high).annualDecline>0);
 assert.ok(D.ageDevelopment(35,high).annualDecline<D.ageDevelopment(35,low).annualDecline);
 assert.ok(D.ageDevelopment(40,low,10).annualDecline>D.ageDevelopment(35,low).annualDecline);
});
test('KBO·NPB 단일 리그 타자·선발·마무리·중계 모두 레전드가 될 수 있다',()=>{
 for(const league of ['kbo','npb'])for(const [role,stats] of [['batter',{g:144,h:200}],['batter',{g:144,hr:30}],['pitcher',{g:30,w:15}],['pitcher',{g:30,so:200}],['pitcher',{g:50,sv:25}],['pitcher',{g:60,hld:30}]]){
  const s=fixture(league,role,10,stats),ending=D.getCareerAssessment(s);assert.equal(ending.tier,4);assert.equal(ending.title,league.toUpperCase()+' 레전드');
  assert.equal(ending.leagues.find(l=>l.leagueId==='mlb').stats.g,0);
 }
});
test('MLB 명전은 타자와 투수별 기록으로 평가하고 짧은 경력은 입성시키지 않는다',()=>{
 for(const [role,stats]of [['batter',{g:160,h:300}],['batter',{g:160,hr:50}],['pitcher',{g:30,w:20}],['pitcher',{g:30,so:250}],['pitcher',{g:60,sv:40}]]){
  assert.equal(D.getCareerAssessment(fixture('mlb',role,10,stats)).title,'MLB 명예의 전당');
  assert.notEqual(D.getCareerAssessment(fixture('mlb',role,9,stats)).tier,5);
 }
});
test('성적이 낮으면 평범한 선수·주전·스타로 구분되며 소속 리그 변경으로 업적이 사라지지 않는다',()=>{
 for(const [years,stats,tier]of [[1,{g:20,h:5},0],[3,{g:60,h:30},1],[5,{g:100,h:60},2],[7,{g:140,h:150},3]])assert.equal(D.getCareerAssessment(fixture('kbo','batter',years,stats)).tier,tier);
 const s=fixture('kbo','batter',10,{g:140,h:200});s.leagueId='mlb';assert.equal(D.getCareerAssessment(s).title,'KBO 레전드');
 s.seasons.push({season:11,leagueId:'npb',stats:{...s.stats,g:1,h:1}});assert.equal(D.getCareerAssessment(s).title,'KBO 레전드');
});
test('현재 시즌 기록과 조기 은퇴 기록을 중복 합산하지 않으며 미완료 시즌은 10시즌에 포함하지 않는다',()=>{
 const s=fixture('npb','batter',10,{g:140,h:200});assert.equal(D.getCareerAssessment(s).leagues[1].stats.h,2000);
 s.week=1;assert.equal(D.getCareerAssessment(s).leagues[1].seasons,9);assert.notEqual(D.getCareerAssessment(s).tier,4);
 s.seasons.pop();s.phase='active';assert.equal(D.getCareerAssessment(s).leagues[1].stats.h,2000);
});
test('35세·종합 60 미만 구단 권고를 수락하거나 계속할 수 있으며 저장·자산을 보존한다',()=>{
 let s=create();while(s.age<35)s=D.nextSeason(end(s),s.teamId);
 for(const key of Object.keys(s.attrs))s.attrs[key]=45;
 assert.equal(D.getRetirementStatus(s).recommended,false);
 s=end(s);assert.ok(D.getRetirementStatus(s).recommended);assert.ok(s.history.some(h=>h.title==='구단의 은퇴 권고'));
 const before=JSON.stringify(s),ending=D.retire(s);assert.equal(JSON.stringify(s),before);assert.equal(ending.phase,'retired');
 assert.deepEqual(ending.life,s.life);assert.deepEqual(ending.careerStats,s.careerStats);D.validateSave(copy(ending));
 assert.match(ending.history.at(-1).title,/커리어 평가/);
 const continued=D.nextSeason(s,s.teamId);assert.equal(continued.phase,'active');assert.equal(continued.age,36);D.validateSave(continued);
 const boundary=copy(s);for(const key of Object.keys(boundary.attrs))boundary.attrs[key]=60;assert.equal(D.getRetirementStatus(boundary).recommended,false);
 boundary.age=34;for(const key of Object.keys(boundary.attrs))boundary.attrs[key]=40;assert.equal(D.getRetirementStatus(boundary).recommended,false);
});
test('은퇴 권고 화면에서 확인 후 은퇴하면 리그별 평가 화면과 저장이 완성된다',async()=>{
 let s=create();while(s.age<35)s=D.nextSeason(end(s),s.teamId);for(const k of Object.keys(s.attrs))s.attrs[k]=45;s=end(s);
 const fs=require('node:fs'),vm=require('node:vm'),elements=new Map(),events={},store=new Map([['dugout.career.v1',JSON.stringify(s)]]);
 const document={getElementById(id){if(!elements.has(id))elements.set(id,{innerHTML:'',classList:{toggle(){},add(){},remove(){}},addEventListener(){},showModal(){this.open=true;},close(){this.open=false;}});return elements.get(id);},querySelectorAll(){return [];},addEventListener(k,fn){events[k]=fn;}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../dist/app.js'),'utf8'),{window:{Dugout:D,scrollTo(){}},document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},JSON,setTimeout(){},clearTimeout(){},matchMedia(){return {matches:true};}});
 assert.match(elements.get('main').innerHTML,/구단에서 은퇴를 권고/);
 const click=action=>events.click({target:{closest:()=>({dataset:{action},disabled:false})}});
 await click('retire-dialog');assert.match(elements.get('dialog').innerHTML,/현역으로 계속/);
 await click('confirm-retire');assert.match(elements.get('main').innerHTML,/리그마다 남긴 발자취/);
 const saved=D.validateSave(JSON.parse(store.get('dugout.career.v1')));assert.equal(saved.phase,'retired');assert.equal(saved.age,35);
 assert.ok(elements.get('main').innerHTML.includes(D.getCareerAssessment(saved).title));
});
