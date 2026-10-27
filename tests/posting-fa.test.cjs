'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),D=require('../dist/core.js');
const copy=s=>JSON.parse(JSON.stringify(s));
function create(leagueId='kbo',role='batter') {
  const s=D.createCareer({name:'시장 검증',role,seed:11,entry:'pro',leagueId,teamId:D.TEAMS.find(t=>t.leagueId===leagueId).id});
  for(const a of D.ATTRS[role]){s.potential.caps[a.key]=99;s.attrs[a.key]=99;}
  s.trust=100;return s;
}
function end(s){while(s.phase==='active'){if(s.pendingEvent)s=D.resolveEvent(s,s.pendingEvent.choices.find(c=>['fundamentals','recharge','personal'].includes(c.id)).id);else s=D.advanceWeeks(s,'balanced',60).state;}return s;}
function atYear(leagueId,years,role='batter') {let s=create(leagueId,role);for(let i=1;i<=years;i++){s=end(s);if(i<years)s=D.nextSeason(s,s.teamId);}return s;}

test('KBO 포스팅: 7시즌 전에는 닫히고 성적 통과 후 MLB만 제안한다',()=>{
  const early=atYear('kbo',6);assert.equal(D.getPostingStatus(early).eligible,false);
  assert.throws(()=>D.nextSeason(early,'mlb-yankees',1,false,'posting'));
  const s=end(D.nextSeason(early,early.teamId)),p=D.getPostingStatus(s);
  assert.equal(p.eligible,true,JSON.stringify({checks:p.checks,stats:s.stats}));assert.ok(p.offers.length>=3);
  assert.ok(p.offers.every(o=>D.TEAMS.find(t=>t.id===o.teamId).leagueId==='mlb'));
  assert.deepEqual(p,D.getPostingStatus(D.validateSave(copy(s))));
  assert.throws(()=>D.nextSeason(s,p.offers[0].teamId));
  const before=JSON.stringify(s),offer=p.offers[0],next=D.nextSeason(s,offer.teamId,3,false,'posting');
  assert.equal(JSON.stringify(s),before);assert.equal(next.leagueId,'mlb');assert.equal(next.salary,offer.annualSalary);
  assert.equal(next.contract.yearsLeft,3);assert.equal(next.contract.faService.kbo,null);
  assert.equal(next.contract.leagueService.kbo,7);assert.deepEqual(next.careerStats,s.careerStats);
  assert.equal(D.validateSave(copy(next)).teamId,offer.teamId);
  const locked=end(next);assert.equal(D.getPostingStatus(locked).eligible,false);
  assert.equal(D.nextSeason(locked,locked.teamId).salary,next.salary);
});
test('포스팅은 부진·신뢰 부족·다년 계약·잘못된 계약 기간을 거부한다',()=>{
  const s=atYear('kbo',7),p=D.getPostingStatus(s);assert.ok(p.eligible);
  const low=copy(s);low.stats={...low.stats,pa:100,h:20,hr:0};assert.equal(D.getPostingStatus(low).eligible,false);
  const distrust=copy(s);distrust.trust=64;assert.equal(D.getPostingStatus(distrust).eligible,false);
  assert.throws(()=>D.nextSeason(distrust,p.offers[0].teamId,1,false,'posting'));
  const locked=copy(s);locked.contract.yearsLeft=2;assert.equal(D.getPostingStatus(locked).eligible,false);
  assert.throws(()=>D.nextSeason(locked,p.offers[0].teamId,1,false,'posting'));
  assert.throws(()=>D.nextSeason(s,p.offers[0].teamId,5,false,'posting'));
  assert.throws(()=>D.nextSeason(s,p.offers[0].teamId,1,true,'posting'));
  assert.throws(()=>D.nextSeason(s,s.teamId,1,false,'invalid'));
});
test('NPB 포스팅은 게임 경력 기준과 구원투수 성적 경로를 지원한다',()=>{
  const s=atYear('npb',6),p=D.getPostingStatus(s);assert.equal(p.eligible,true,JSON.stringify(p.checks));
  const next=D.nextSeason(s,p.offers[0].teamId,2,false,'posting');assert.equal(next.leagueId,'mlb');D.validateSave(next);
  const pitcher=create('kbo','pitcher');pitcher.phase='seasonEnd';pitcher.week=pitcher.schedule.weekCount;pitcher.age=25;pitcher.contract.leagueService.kbo=6;
  pitcher.stats={...pitcher.stats,outs:135,er:15,so:50,sv:20};assert.equal(D.getPostingStatus(pitcher).eligible,true);
  pitcher.stats.er=17;assert.equal(D.getPostingStatus(pitcher).eligible,false);
});
test('선발투수 포스팅과 NPB 국내 FA 시점 포스팅도 FA 행사 이력을 바꾸지 않는다',()=>{
  for(const [league,years,role] of [['kbo',7,'pitcher'],['npb',8,'batter']]){
    const s=atYear(league,years,role),p=D.getPostingStatus(s);assert.ok(p.eligible,JSON.stringify(p.checks));
    const next=D.nextSeason(s,p.offers[0].teamId,1,false,'posting');
    assert.equal(next.contract.faService[league],null);assert.equal(next.contract.leagueService[league],years);
    assert.equal(D.validateSave(copy(next)).leagueId,'mlb');
  }
});
test('FA 재수: 현재 팀 1년·권리 보존·다음 시장 재진입 및 계약 금액 일치',()=>{
  for(const league of ['kbo','npb','mlb']){
    const s=atYear(league,league==='mlb'?6:8),offer=D.getContractOffer(s,s.teamId,1);
    const retry=D.nextSeason(s,s.teamId,1,true);assert.equal(retry.salary,offer.annualSalary);assert.equal(retry.contract.yearsLeft,1);
    assert.equal(retry.contract.faService[league],null);assert.match(retry.history.at(-1).title,/FA 재수/);
    const market=end(retry);assert.ok(D.getContractStatus(market).faEligible);
    assert.ok(D.contractOptions(market).length>1);D.validateSave(copy(market));
    const quote=D.getContractOffer(market,market.teamId,3),signed=D.nextSeason(market,market.teamId,3);
    assert.equal(signed.salary,quote.annualSalary);assert.equal(quote.total,signed.salary*3);
  }
});
test('시장 제안은 현재 시즌 성적에 따라 오르내리고 조회로 재추첨되지 않는다',()=>{
  const s=atYear('kbo',8),bad=copy(s);bad.stats={...bad.stats,h:30,doubles:0,triples:0,hr:0,bb:0};
  const good=D.getContractOffer(s,s.teamId,1),poor=D.getContractOffer(bad,bad.teamId,1);
  assert.ok(good.annualSalary>poor.annualSalary);assert.deepEqual(good,D.getContractOffer(s,s.teamId,1));
});
