'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),D=require('../dist/core.js'),R=require('../dist/recap.js');
const copy=x=>JSON.parse(JSON.stringify(x));
function retired(role='batter'){
  let s=D.createCareer({name:'나의 여름',role,entry:'pro',seed:6});
  s=D.advanceWeek(s,'balanced');return D.retire(s);
}
test('은퇴 리캡은 기존 저장을 바꾸지 않고 재현되며 현역에는 생성하지 않는다',()=>{
  const active=D.createCareer({name:'현역',role:'batter',seed:3});assert.deepEqual(R.build(active),[]);
  const s=retired(),before=JSON.stringify(s),cards=R.build(s);
  assert.equal(JSON.stringify(s),before);assert.deepEqual(cards,R.build(D.validateSave(copy(s))));
  assert.equal(cards[0].id,'cover');assert.equal(cards.at(-1).id,'goodbye');
  assert.equal(new Set(cards.map(c=>c.id)).size,cards.length);
  cards.forEach((c,i)=>{assert.equal(c.index,i);assert.equal(c.total,cards.length);});
});
test('최고 시즌·마지막 출전·통산 기록은 고교·미아 기록과 분리하고 중복 합산하지 않는다',()=>{
  const s=retired(),base=copy(s.seasons[0]);s.season=4;s.age=22;s.schedule.year=2029;
  const low={...base,season:1,age:19,stats:{...base.stats,h:4,hr:0,rbi:1,g:8}},peak={...base,season:2,age:20,stats:{...base.stats,h:180,hr:35,rbi:100,g:140}};
  const unpaid={...base,season:3,age:21,stage:'unattached',stats:{...peak.stats,h:999,hr:999,g:0}};
  const final={...base,season:4,age:22,stats:{...base.stats,h:20,hr:1,g:40}};
  s.seasons=[low,peak,unpaid,final];s.stats=final.stats;s.careerStats={...base.stats,g:188,h:204,hr:36};
  const cards=R.build(s);assert.equal(cards.find(c=>c.id==='peak').hero,'2027');
  assert.equal(cards.find(c=>c.id==='last-season').hero,'2029');
  assert.equal(cards.find(c=>c.id==='totals').hero,'188');
  assert.equal(cards.find(c=>c.id==='totals').metrics[0][1],'204');
  assert.match(cards.find(c=>c.id==='comeback').lines[0],/개인훈련/);
});
test('투수 리캡은 이닝·삼진·ERA를 표시하고 타격 기록이나 허구의 우승을 넣지 않는다',()=>{
  const cards=R.build(retired('pitcher')),total=cards.find(c=>c.id==='totals');
  assert.deepEqual(total.metrics.map(m=>m[0]),['승리','탈삼진','이닝','평균자책점']);
  assert.ok(!JSON.stringify(cards).includes('우승'));assert.ok(!JSON.stringify(cards).includes('undefined'));
});
test('고교 은퇴와 경기 없는 프로 시즌에도 첫 유니폼과 작별 카드가 남는다',()=>{
  let s=D.createCareer({name:'아직 여름',role:'batter',seed:3});s=D.retire(D.advanceWeek(s,'balanced'));
  const cards=R.build(s);assert.ok(!cards.some(c=>c.id==='debut'||c.id==='peak'||c.id==='last-season'));
  assert.equal(cards.find(c=>c.id==='origin').heroLabel.includes('16세'),true);
  assert.equal(cards.find(c=>c.id==='totals').hero,'0');
  assert.equal(cards.find(c=>c.id==='origin').metrics[0][1],String(D.getSchoolCareerStats(s).h));
});
test('시즌 중 이적 구단과 실제 보유 소장품을 리캡에 남긴다',()=>{
  const s=retired();s.transfers.moves=[{season:1,week:1,fromTeamId:'kbo-doosan',toTeamId:s.teamId}];
  s.life.owned=[{id:'hangang',price:450000,season:1,week:0,quality:1}];
  const cards=R.build(s),clubs=cards.find(c=>c.id==='uniforms');
  assert.equal(clubs.hero,'2');assert.ok(clubs.lines.some(v=>v.includes('두산')));
  assert.deepEqual(cards.find(c=>c.id==='life').lines,['한강뷰 아파트']);
});
test('인생 이야기의 전환점은 실제 저장된 사건만 시간순으로 표시한다',()=>{
  const s=retired();s.history.push({season:1,week:1,title:'트레이드 승인·공시',text:'이적',type:'contract'});
  const card=R.build(s).find(c=>c.id==='moments');assert.ok(card);
  assert.ok(card.lines.some(line=>line.includes('트레이드 승인·공시')));
  assert.ok(!card.lines.some(line=>line.includes('사이영상')));
});
test('독립·사회인 재도전은 별도 경기 수와 실제 소속 이름으로 남는다',()=>{
  const s=retired(),id=D.PATHWAYS.LEAGUES[0].clubs[0].id;
  s.amateur.alternativeHistory=[{teamId:id,stats:{g:12},results:[{}]}];
  const card=R.build(s).find(c=>c.id==='comeback');assert.equal(card.hero,'12');assert.match(card.footnote,/합산하지/);
});
test('카드 HTML과 1080×1920 SVG는 사용자 이름을 안전하게 이스케이프한다',()=>{
  const s=retired();s.name='<svg onload="x">&';
  for(const c of R.build(s)){
    const html=R.html(c),svg=R.svg(c);assert.ok(!html.includes(s.name));assert.ok(!svg.includes(s.name));
    assert.match(svg,/width="1080" height="1920"/);assert.match(svg,/&lt;svg/);
    assert.ok(!svg.includes('foreignObject'));assert.ok(!svg.includes('undefined'));
  }
});
test('리캡 넘기기·모아보기·자동재생은 저장을 변경하지 않고 이동 시 재생을 멈춘다',async()=>{
  const fs=require('node:fs'),vm=require('node:vm'),saved=retired(),elements=new Map(),events={},store=new Map([['dugout.career.v1',JSON.stringify(saved)]]),timers=new Map(),exports=[],canvases=[];let serial=0;
  const document={body:{appendChild(){}},createElement(tag){if(tag==='canvas'){const canvas={getContext:()=>({drawImage(){}}),toBlob:fn=>fn(new Blob(['PNG'],{type:'image/png'}))};canvases.push(canvas);return canvas;}return {click(){exports.push(this.download);},remove(){}};},documentElement:{style:{setProperty(){}}},getElementById(id){if(!elements.has(id))elements.set(id,{innerHTML:'',classList:{toggle(){},add(){},remove(){}},addEventListener(){},showModal(){},close(){},focus(){}});return elements.get(id);},querySelectorAll:()=>[],querySelector:()=>null,addEventListener:(name,fn)=>events[name]=fn};
  vm.runInNewContext(fs.readFileSync(require.resolve('../dist/app.js'),'utf8'),{window:{Dugout:D,DugoutRecap:R,scrollTo(){}},document,Blob,URL:{createObjectURL:()=> 'blob:recap',revokeObjectURL(){}},Image:class{set src(v){Promise.resolve().then(()=>this.onload());}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},JSON,setTimeout(fn,ms){timers.set(++serial,{fn,ms});return serial;},clearTimeout:id=>timers.delete(id),matchMedia:()=>({matches:true})});
  const click=dataset=>events.click({target:{closest:()=>({dataset})}}),html=()=>elements.get('main').innerHTML,before=store.get('dugout.career.v1');
  assert.match(html(),/은퇴 커리어 리캡/);assert.match(html(),/마지막 아웃 뒤/);
  assert.match(html(),/팬들의 이야기/);assert.match(html(),/게임 속 가상 반응/);assert.match(html(),/은퇴 소식/);
  await click({action:'recap-next'});assert.match(html(),/아무도 몰랐던/);
  await click({action:'recap-mode'});assert.match(html(),/recap-gallery/);
  await click({recapIndex:'2'});assert.match(html(),/꿈꾸던 무대에/);assert.ok(!html().includes('recap-gallery'));
  await click({action:'recap-play'});assert.match(html(),/일시정지/);
  const playback=[...timers.values()].find(t=>t.ms===6500);assert.ok(playback);playback.fn();assert.match(html(),/배트 끝에서/);
  await click({view:'records'});assert.ok(![...timers.values()].some(t=>t.ms===6500));
  await click({view:'home'});await click({action:'recap-download'});
  assert.equal(exports.length,1);assert.match(exports[0],/^dugout-나의_여름-recap-04\.png$/);
  assert.equal(canvases[0].width,1080);assert.equal(canvases[0].height,1920);
  assert.equal(store.get('dugout.career.v1'),before);
});
