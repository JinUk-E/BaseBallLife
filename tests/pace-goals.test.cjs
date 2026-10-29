'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),D=require('../dist/core.js');
const create=(role='batter',seed=1)=>D.createCareer({name:'도전자',role,seed,entry:'pro',leagueId:'mlb',teamId:D.TEAMS.find(t=>t.leagueId==='mlb').id});
test('빠른 진행은 사건에서 멈추고 주간 진행과 동일한 결과를 보존한다',()=>{
 const s=create(),batch=D.advanceWeeks(s,'balanced',60);let manual=s;
 for(let i=0;i<batch.weeks;i++)manual=D.advanceWeek(manual,manual.fatigue>=60||manual.injury?'rest':'balanced');
 assert.deepEqual(batch.state,manual);assert.ok(manual.pendingEvent);assert.equal(s.week,0);
 const stopped=D.advanceWeeks(manual,'balanced',4);assert.equal(stopped.weeks,0);
});
test('빠른 진행은 시즌 종료를 넘지 않고 저장 후 재현된다',()=>{
 let s=create('pitcher');while(s.phase==='active'){if(s.pendingEvent)s=D.resolveEvent(s,s.pendingEvent.choices[0].id);else s=D.advanceWeeks(s,'balanced',60).state;}
 assert.equal(s.week,s.schedule.weekCount);assert.equal(D.advanceWeeks(s,'balanced',60).weeks,0);assert.deepEqual(D.validateSave(s),s);
});
test('사이영상은 MLB 완료 시즌에만 확정되며 구원투수 경로를 지원한다',()=>{
 const s=create('pitcher');s.stats={...s.stats,outs:540,er:50,so:200};
 assert.equal(D.careerGoal(s).achieved,false);s.week=s.schedule.weekCount;assert.equal(D.careerGoal(s).achieved,true);
 s.stats={...s.stats,outs:180,er:13,so:70,sv:40};assert.equal(D.careerGoal(s).achieved,true);
 s.leagueId='kbo';assert.equal(D.careerGoal(s).achieved,false);
});
test('명전은 MLB 기록만 집계하고 은퇴 때 확정하며 중복 집계하지 않는다',()=>{
 const s=create();s.seasons=Array.from({length:10},(_,i)=>({season:i+1,leagueId:'mlb',stats:{...s.stats,h:300,hr:50}}));
 s.season=10;s.week=s.schedule.weekCount;s.stats={...s.stats,h:300,hr:50};
 let g=D.careerGoal(s);assert.equal(g.eligible,true);assert.equal(g.achieved,false);assert.equal(g.metrics[1][1],3000);
 s.phase='retired';assert.equal(D.careerGoal(s).achieved,true);
 s.seasons[0].leagueId='kbo';assert.equal(D.careerGoal(s).achieved,false);
});
test('높은 재능의 타자와 투수는 관리 선택으로 30세 전에 전 능력 99에 도달한다',()=>{
 for(const role of ['batter','pitcher']){
 let s;for(let seed=1;seed<100;seed++){s=create(role,seed);if(Object.values(s.potential.caps).every(v=>v===99)&&s.potential.growthRate>=1.2)break;}
 assert.ok(Object.values(s.potential.caps).every(v=>v===99));
 while(s.age<30&&!Object.values(s.attrs).every(v=>v===99)){
 while(s.phase==='active'){
 if(s.pendingEvent){const preferred=s.pendingEvent.choices.find(c=>['fundamentals','recharge','personal'].includes(c.id));s=D.resolveEvent(s,preferred.id);}
 else {
 const item=D.ITEMS.find(i=>i.id==='growth');
 if(!s.buffs.growth&&!s.usedItems.length&&s.points>=item.price)s=D.useItem(D.buyItem(s,'growth'),'growth');
 const weakest=Object.keys(s.attrs).reduce((a,b)=>s.attrs[a]<=s.attrs[b]?a:b);
 const focused=role==='batter'?{contact:'contact',power:'power',discipline:'video',speed:'running',fielding:'defense'}:{velocity:'velocity',control:'control',movement:'velocity',stamina:'stamina',composure:'mental'};
 s=D.advanceWeek(s,s.fatigue>=60||s.injury?'rest':Math.min(...Object.values(s.attrs))>=80?focused[weakest]:'balanced');
 }
 }
 if(Object.values(s.attrs).every(v=>v===99))break;
 s=D.nextSeason(s,s.teamId,1);
 }
 assert.ok(Object.values(s.attrs).every(v=>v===99),role+JSON.stringify(s.attrs));
 }
});

