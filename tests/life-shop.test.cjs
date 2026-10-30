'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),D=require('../dist/core.js');
const copy=s=>JSON.parse(JSON.stringify(s));
const create=(seed=9)=>D.createCareer({name:'생활 검증',role:'batter',entry:'pro',seed});
function funded(seed=9){const s=create(seed);s.totalSalary=10000000;return s;}
function offering(predicate){
  for(let seed=1;seed<=500;seed++){const s=funded(seed);if(predicate(D.getLifeShop(s).offers[0]))return s;}
  assert.fail('조건에 맞는 주간 매물 필요');
}

test('받은 연봉만 지갑에 들어오며 포인트 구매와 돈 구매는 서로 독립적이다',()=>{
  const start=create();assert.equal(D.getLifeShop(start).balance,0);
  assert.throws(()=>D.buyLifeItem(start,D.getLifeShop(start).offers[0].id));
  let s=D.advanceWeek(start,'balanced');assert.equal(D.getLifeShop(s).balance,Math.floor(s.salary/s.schedule.weekCount));
  s=offering(i=>i.price===30);const gear=D.getLifeShop(s).offers[0];
  const before=JSON.stringify(s),next=D.buyLifeItem(s,gear.id);
  assert.equal(JSON.stringify(s),before);assert.equal(next.totalSalary,s.totalSalary);assert.equal(next.points,s.points);
  assert.equal(D.getLifeShop(next).balance,D.getLifeShop(s).balance-gear.price);assert.equal(next.life.spent,gear.price);
  const pointPurchase=D.buyItem(next,'growth');assert.equal(pointPurchase.life.spent,next.life.spent);
  assert.equal(D.getLifeShop(pointPurchase).balance,D.getLifeShop(next).balance);
  assert.deepEqual(next.attrs,s.attrs);D.validateSave(next);
});
test('진열은 주마다 바뀌며 조회·재접속·구매 재시도로 효과를 재추첨하지 않는다',()=>{
  const s=funded(),shop=D.getLifeShop(s);assert.equal(shop.offers.length,1);assert.equal(shop.purchased,false);
  assert.deepEqual(shop,D.getLifeShop(D.validateSave(copy(s))));
  assert.ok(new Set(Array.from({length:12},(_,n)=>D.getLifeShop(funded(n+1)).offers[0].id)).size>1);
  const id=shop.offers[0].id,first=D.buyLifeItem(s,id),again=D.buyLifeItem(copy(s),id);
  assert.deepEqual(first,again);assert.throws(()=>D.buyLifeItem(first,id));
  assert.equal(D.getLifeShop(first).purchased,true);assert.deepEqual(D.getLifeShop(first).offers,[]);
  const another=D.LIFE_ITEMS.find(i=>i.id!==id);assert.throws(()=>D.buyLifeItem(first,another.id),/이번 주/);
  assert.deepEqual(D.getLifeShop(first),D.getLifeShop(D.validateSave(copy(first))));
  const next=D.advanceWeek(first,'balanced'),nextItem=D.getLifeShop(next).offers[0];
  assert.equal(D.getLifeShop(next).purchased,false);assert.notEqual(nextItem.id,id);
  assert.equal(D.buyLifeItem(next,nextItem.id).life.owned.length,2);
  assert.throws(()=>D.buyLifeItem(s,'unknown'));
  const hidden=D.LIFE_ITEMS.find(i=>!shop.offers.some(o=>o.id===i.id));assert.throws(()=>D.buyLifeItem(s,hidden.id));
  for(const entry of [...D.getLifeShop(first).offers,...D.getLifeShop(first).owned]){
    assert.equal(entry.quality,undefined);assert.equal(entry.effect,undefined);assert.equal(entry.growth,undefined);
  }
});
test('장비·사치품·집의 숨겨진 효과는 이후 주간 진행에 반영되고 저장 후에도 유지된다',()=>{
  for(const category of ['training','luxury','home']){
    const s=offering(i=>i.category===category);s.fatigue=40;s.morale=40;
    const item=D.getLifeShop(s).offers[0],owned=D.buyLifeItem(s,item.id);
    const next=D.advanceWeek(owned,'balanced'),baseline=D.advanceWeek(s,'balanced');
    if(category==='training')assert.ok(Object.keys(s.attrs).some(k=>next.attrs[k]>baseline.attrs[k]));
    if(category==='luxury')assert.ok(next.morale>baseline.morale);
    if(category==='home')assert.ok(next.fatigue<baseline.fatigue);
    assert.deepEqual(next,D.advanceWeek(D.validateSave(copy(owned)),'balanced'));
  }
});
test('기존 v3 저장은 누적 수령액과 포인트를 보존해 생활 자산으로 전환된다',()=>{
  const original=D.advanceWeek(create(),'rest'),legacy=copy(original);delete legacy.life;
  const before=JSON.stringify(legacy),migrated=D.validateSave(legacy);
  assert.equal(JSON.stringify(legacy),before);assert.equal(migrated.totalSalary,original.totalSalary);
  assert.equal(migrated.points,original.points);assert.deepEqual(migrated.life,{owned:[],spent:0});
  assert.deepEqual(D.advanceWeek(migrated,'balanced'),D.advanceWeek(original,'balanced'));
});
test('구매 장부는 중복·가격·효과 조작·잔액 초과·미래 구매를 거부한다',()=>{
  const s=funded(),item=D.getLifeShop(s).offers[0],owned=D.buyLifeItem(s,item.id);
  const mutations=[v=>v.life.owned.push(copy(v.life.owned[0])),v=>v.life.spent++,v=>v.life.owned[0].price++,v=>v.life.owned[0].quality=v.life.owned[0].quality===100?1:100,v=>v.totalSalary=0,v=>v.life.owned[0].week=1];
  for(const mutate of mutations){const bad=copy(owned);mutate(bad);assert.throws(()=>D.validateSave(bad));}
  const school=D.createCareer({name:'고교',role:'batter',seed:9});school.totalSalary=600000;
  assert.throws(()=>D.buyLifeItem(school,D.getLifeShop(school).offers[0].id));
});
test('보유 물품과 지출은 계약 변경·다음 시즌에도 유지된다',()=>{
  let s=offering(i=>i.category==='home');s=D.buyLifeItem(s,D.getLifeShop(s).offers[0].id);
  const assets=copy(s.life);
  while(s.phase==='active')s=s.pendingEvent?D.resolveEvent(s,s.pendingEvent.choices.at(-1).id):D.advanceWeeks(s,'balanced',60).state;
  const next=D.nextSeason(s,s.teamId);assert.deepEqual(next.life,assets);D.validateSave(next);
  assert.equal(D.getLifeShop(next).purchased,false);assert.equal(D.getLifeShop(next).offers.length,1);
});

test('이전 버전에서 같은 주 여러 물품을 샀어도 보존하며 추가 구매만 막는다',()=>{
  let s=funded();s=D.buyLifeItem(s,D.getLifeShop(s).offers[0].id);
  const next=D.advanceWeek(s,'balanced'),second=D.buyLifeItem(next,D.getLifeShop(next).offers[0].id);
  second.life.owned[1].week=0;
  const loaded=D.validateSave(second);assert.equal(loaded.life.owned.length,2);
  assert.equal(D.getLifeShop(loaded).purchased,false);
  loaded.life.owned[0].week=loaded.week;
  const current=D.validateSave(loaded);assert.equal(D.getLifeShop(current).purchased,true);
  assert.throws(()=>D.buyLifeItem(current,D.LIFE_ITEMS.find(i=>!current.life.owned.some(o=>o.id===i.id)).id),/이번 주/);
});

test('초호화 매물도 주간 추첨에 나오고 자금이 충분하면 숨겨진 효과 그대로 구매한다',()=>{
  for(const id of ['yacht','hangang','gold-bat','rooftop-bullpen','island']){
    const s=offering(i=>i.id===id),item=D.getLifeShop(s).offers[0];
    assert.equal(item.id,id);const next=D.buyLifeItem(s,id);
    assert.equal(next.life.owned[0].id,id);assert.equal(D.getLifeShop(next).owned[0].quality,undefined);
    const poor=copy(s);poor.totalSalary=0;assert.throws(()=>D.buyLifeItem(poor,id),/돈이 부족/);
  }
});
