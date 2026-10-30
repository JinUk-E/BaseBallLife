'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
fs.mkdirSync(path.join(__dirname, '../.validation'), {recursive: true});
const core = require('../dist/core.js');
const v1 = require('../dist/legacy-core.js');
const v2 = require('../dist/legacy-v2-core.js');
const copy = value => JSON.parse(JSON.stringify(value));
const create = options => core.createCareer({name:'장기 검증',role:'batter',seed:317,...options});
function endSeason(input, api = core, plan = 'balanced') {
  let s = input, steps = 0;
  while (s.phase === 'active') {
    assert.ok(++steps < 100, 'season cannot finish');
    if (s.pendingEvent) s = api.resolveEvent(s,s.pendingEvent.choices[0].id);
    else s = api.advanceWeek(s, plan === 'managed' ? (s.fatigue > 45 ? 'rest' : 'balanced') : plan);
  }
  return s;
}
function assertLedgers(s) {
  for (const [stage, ledger] of [['highschool','schoolStats'],['pro','careerStats']]) {
    for (const key of Object.keys(s.stats)) {
      const prior = s.seasons.filter(row => row.season < s.season && row.stage === stage).reduce((n,row)=>n+row.stats[key],0);
      assert.equal(s[ledger][key],prior+(s.stage === stage ? s.stats[key] : 0),`${ledger}.${key} at age ${s.age}`);
    }
  }
}
function nextLegal(s, years = 1) {
  const offer = core.contractOptions(s)[0];
  return core.nextSeason(s,offer ? offer.teamId : s.teamId,years);
}
function atAge(s, age) {
  while(s.age<age){s=nextLegal(endSeason(s,core,'managed'));assert.notEqual(s.phase,'retired');}
  return s;
}

test('Creation_100Seeds_ProducesDeterministicHighSchoolAndProfessionalStarts', () => {
  const potentials = new Set();
  for (let seed=1;seed<=100;seed++) {
    const high = create({seed});
    assert.equal(high.version,3);
    assert.equal(high.stage,'highschool');
    assert.equal(high.age,16);
    assert.deepEqual(high,create({seed}));
    assert.ok(Object.values(high.careerStats).every(n=>n===0));
    potentials.add(JSON.stringify(high.potential));
    const pro = create({seed,entry:'pro',teamId:'kbo-lg'});
    assert.equal(pro.age,19);
    assert.equal(pro.stage,'pro');
    assert.deepEqual(core.validateSave(copy(high)),high);
    assert.deepEqual(core.validateSave(copy(pro)),pro);
  }
  assert.ok(potentials.size>90);
});

test('HighSchool_GraduationAndFullCareer_SeparatesAmateurRecordsAndEnforcesDraft',()=>{
  let s=create();
  for(let age=16;age<=18;age++){
    assert.equal(s.age,age);
    assert.equal(s.stage,'highschool');
    s=endSeason(s,core,'managed');
    assertLedgers(s);
    assert.ok(Object.values(s.careerStats).every(n=>n===0));
    const options=core.contractOptions(s);
    assert.equal(options.length,1);
    if(age<18){assert.equal(options[0].teamId,s.teamId);assert.equal(s.draftTeamId,null);}
    else {
      assert.equal(options[0].teamId,s.draftTeamId);
      assert.ok(core.TEAMS.find(t=>t.id===s.draftTeamId).leagueId==='kbo');
      const other=core.TEAMS.find(t=>t.leagueId==='kbo'&&t.id!==s.draftTeamId);
      assert.throws(()=>core.nextSeason(s,other.id),'draft allowed arbitrary club selection');
    }
    s=nextLegal(s);
  }
  assert.equal(s.age,19);assert.equal(s.stage,'pro');
  assert.ok(s.schoolStats.g>0);assert.equal(s.careerStats.g,0);
  const school=copy(s.schoolStats);
  let turns=0;
  while(s.phase!=='retired'){
    assert.ok(++turns<1600);
    if(s.pendingEvent)s=core.resolveEvent(s,s.pendingEvent.choices[0].id);
    else if(s.phase==='seasonEnd')s=nextLegal(s);
    else s=core.advanceWeek(s,s.fatigue>45?'rest':'balanced');
    assertLedgers(s);
    assert.deepEqual(s.schoolStats,school);
  }
  assert.equal(s.age,40);assert.equal(s.seasons.length,25);
  assert.equal(s.seasons.filter(row=>row.stage==='highschool').length,3);
  assert.equal(s.seasons.filter(row=>row.stage==='pro').length,22);
  assert.throws(()=>core.advanceWeek(s,'rest'));
  assert.throws(()=>core.nextSeason(s,s.teamId));
});

test('Contracts_ReservedServiceAndMultiYearFA_EnforceLeagueRulesAndKeepSalary',()=>{
  for(const [leagueId,threshold] of [['kbo',8],['npb',8],['mlb',6]]){
    const own=core.TEAMS.find(t=>t.leagueId===leagueId).id;
    const foreign=core.TEAMS.find(t=>t.leagueId!=='highschool'&&t.leagueId!==leagueId).id;
    let s=create({entry:'pro',teamId:own});
    for(let year=1;year<=threshold;year++){
      s=endSeason(s,core,'managed');
      const options=core.contractOptions(s);
      assert.equal(core.getContractStatus(s).serviceYears,year);
      if(year<threshold){
        assert.deepEqual(options.map(o=>o.teamId),[s.teamId]);
        assert.throws(()=>core.nextSeason(s,foreign));
        assert.throws(()=>core.nextSeason(s,s.teamId,4));
        s=core.nextSeason(s,s.teamId);
      } else {
        assert.ok(options.length>1);
        assert.equal(core.getContractStatus(s).faEligible,true);
        if(leagueId==='npb')assert.ok(options.every(o=>core.TEAMS.find(t=>t.id===o.teamId).leagueId==='npb'));
        else assert.ok(options.length<core.TEAMS.filter(t=>t.leagueId!=='highschool').length,'FA must contain actual offers rather than every team');
      }
    }
    const faTeam=core.contractOptions(s).find(o=>o.teamId!==s.teamId).teamId;
    s=core.nextSeason(s,faTeam,4);
    assert.equal(s.contract.yearsLeft,4);
    const salary=s.salary;
    for(const remaining of [3,2,1]){
      s=endSeason(s,core,'managed');
      assert.deepEqual(core.contractOptions(s).map(o=>o.teamId),[s.teamId]);
      const unavailable=core.TEAMS.find(t=>t.leagueId===s.leagueId&&t.id!==s.teamId).id;
      assert.throws(()=>core.nextSeason(s,unavailable));
      s=core.nextSeason(s,s.teamId);
      assert.equal(s.contract.yearsLeft,remaining);
      assert.equal(s.salary,salary);
      assert.equal(s.contract.annualSalary,salary);
    }
    s=endSeason(s,core,'managed');
    assert.ok(core.contractOptions(s).length>1,'free agent did not regain eligibility after four seasons');
  }
});

test('Contracts_NPBDeferredDomesticFA_PreservesEligibilityForInternationalYearNine',()=>{
  let s=create({entry:'pro',teamId:'npb-yomiuri'});
  assert.throws(()=>core.nextSeason(endSeason(s),s.teamId,1,true));
  for(let year=1;year<=8;year++){s=endSeason(s,core,'managed');if(year<8)s=core.nextSeason(s,s.teamId);}
  assert.equal(s.contract.faService.npb,null);
  assert.ok(core.contractOptions(s).every(o=>core.TEAMS.find(t=>t.id===o.teamId).leagueId==='npb'));
  assert.throws(()=>core.nextSeason(s,s.teamId,4,true));
  s=core.nextSeason(s,s.teamId,1,true);
  assert.equal(s.contract.faService.npb,null);
  s=endSeason(s,core,'managed');
  assert.ok(core.contractOptions(s).some(o=>core.TEAMS.find(t=>t.id===o.teamId).leagueId==='mlb'));
  assert.throws(()=>core.nextSeason(s,'mlb-yankees',1,true));
});

test('StartingPitcher_ActualCalendarAcrossWeeks_RequiresFiveDaysBetweenStarts',()=>{
  let checkedStarts=0;
  for(const teamId of ['kbo-lg','npb-yomiuri','mlb-yankees']){
    for(let seed=1;seed<=5;seed++){
      let s=create({entry:'pro',role:'pitcher',pitchingRole:'starter',teamId,seed}),lastDate=null;
      while(s.phase==='active'){
        if(s.pendingEvent){s=core.resolveEvent(s,s.pendingEvent.choices[0].id);continue;}
        s.fatigue=0;s=core.advanceWeek(s,'balanced');
        for(const game of s.lastWeek.games.filter(g=>g.played)){
          if(lastDate!==null)assert.ok((Date.parse(game.date)-Date.parse(lastDate))/86400000>=5,`${teamId}: ${lastDate} then ${game.date}`);
          lastDate=game.date;checkedStarts++;
        }
      }
    }
  }
  assert.ok(checkedStarts>50);
});

test('Development_Age16Versus35AndPotentialHistory_ProducesMeasuredGrowthAndDecline',()=>{
  const rows=[];
  for(const role of ['batter','pitcher']){
    const teen=create({role,seed:712});
    const older=atAge(create({role,seed:712,entry:'pro',teamId:'kbo-lg'}),35);
    function normalized(source,resilience=1,caps=90,injuryBurden=0){
      const s=copy(source);s.fatigue=0;s.injury=null;s.injuryBurden=injuryBurden;s.injurySeasonLoss=0;s.rng=712;
      s.potential.resilience=resilience;s.potential.growthRate=1;
      for(const key of Object.keys(s.attrs)){s.attrs[key]=50;s.potential.caps[key]=caps;s.agingCarry[key]=0;}
      return core.validateSave(s);
    }
    const a=normalized(teen),b=normalized(older);
    const advancedA=core.advanceWeek(a,'balanced'),advancedB=core.advanceWeek(b,'balanced');
    const delta=(x,y)=>Object.keys(x.attrs).reduce((n,k)=>n+y.attrs[k]-x.attrs[k],0);
    const youngDelta=delta(a,advancedA),oldDelta=delta(b,advancedB);
    assert.ok(youngDelta>0);assert.ok(oldDelta<=0);assert.ok(youngDelta>oldDelta);
    function maintainedYear(source){
      let s=source;
      while(s.phase==='active'){
        if(s.pendingEvent)s=core.resolveEvent(s,s.pendingEvent.choices.find(c=>['fundamentals','camp','personal'].includes(c.id))?.id||s.pendingEvent.choices[0].id);
        else{s.fatigue=0;s=core.advanceWeek(s,'balanced');}
      }
      return s;
    }
    const resilient=normalized(older,1.4,99,0),fragile=normalized(older,0.6,68,20);
    const resilientEnd=maintainedYear(resilient),fragileEnd=maintainedYear(fragile);
    const resilientDelta=delta(resilient,resilientEnd),fragileDelta=delta(fragile,fragileEnd);
    assert.ok(resilientDelta<=0);assert.ok(fragileDelta<resilientDelta);
    let withSupport=normalized(older,0.6,68,20),withoutSupport=copy(withSupport);
    withSupport.inventory.growth=1;withSupport=core.useItem(withSupport,'growth');
    for(let i=0;i<3;i++){withSupport.fatigue=0;withoutSupport.fatigue=0;withSupport=core.advanceWeek(withSupport,'balanced');withoutSupport=core.advanceWeek(withoutSupport,'balanced');}
    assert.ok(Object.keys(withSupport.attrs).every(k=>withSupport.attrs[k]>=withoutSupport.attrs[k]&&withSupport.attrs[k]<=50));
    assert.ok(Object.keys(withSupport.attrs).some(k=>withSupport.attrs[k]>withoutSupport.attrs[k]),'senior growth item did not improve maintenance');
    for(const plan of core.PLANS[role]){
      const aged=normalized(older);aged.inventory.growth=1;
      const after=core.advanceWeek(core.useItem(aged,'growth'),plan.id);
      assert.ok(Object.keys(aged.attrs).every(k=>after.attrs[k]<=aged.attrs[k]),'30+ training grew permanent attributes');
    }
    rows.push({role,teenAge:a.age,olderAge:b.age,teenWeekDelta:youngDelta,olderWeekDelta:oldDelta,resilientSeasonDelta:resilientDelta,fragileInjuredSeasonDelta:fragileDelta});
  }
  fs.writeFileSync(path.join(__dirname,'../.validation/v3-development-evidence.json'),JSON.stringify(rows,null,2));
});

test('Migration_V1AndV2EveryPhase_PreservesCompletedRecordsAndPendingDecisions', () => {
  for (const api of [v1,v2]) {
    for (const role of ['batter','pitcher']) {
      const teams = api.VERSION===1 ? [api.TEAMS[0]] : ['kbo','npb','mlb'].map(id=>api.TEAMS.find(t=>t.leagueId===id));
      for (const team of teams) {
        const first = api.createCareer({name:'이전 경력',role,teamId:team.id,seed:123});
        let pending = first;
        for(let i=0;i<4;i++) pending=api.advanceWeek(pending,'balanced');
        const ended = endSeason(pending,api);
        const second = api.nextSeason(ended,team.id);
        const secondEnd = endSeason(second,api);
        const thirdEnd = endSeason(api.nextSeason(secondEnd,team.id),api);
        const retired = api.retire(thirdEnd);
        for(const old of [first,pending,ended,second,secondEnd,thirdEnd,retired]) {
          const original = copy(old);
          const s = core.validateSave(old);
          assert.deepEqual(old,original);
          assert.equal(s.version,3);
          assert.equal(s.stage,'pro');
          for(const key of ['phase','age','season','week','rng','name','totalSalary']) assert.equal(s[key],old[key],key);
          assert.deepEqual(s.attrs,old.attrs);
          if(api.VERSION===2) assert.deepEqual(s.potential,old.potential);
          assert.equal(s.schedule.kind,'legacy');
          assert.equal(s.schedule.gamesPerTeam,112);
          assert.equal(s.schedule.weekCount,16);
          assert.equal(s.standings.length,old.standings.length);
          assert.equal(s.pendingEvent?.id,old.pendingEvent?.id);
          assert.deepEqual(s.pendingEvent?.choices.map(c=>c.id),old.pendingEvent?.choices.map(c=>c.id));
          for(const ledger of ['stats','careerStats']) for(const [key,n] of Object.entries(old[ledger])) assert.equal(s[ledger][key],n,ledger+'.'+key);
          assert.ok(Object.values(s.schoolStats).every(n=>n===0));
          assert.equal(s.seasons.length,old.seasons.length);
          for(const [i,row] of old.seasons.entries()) for(const [key,n] of Object.entries(row.stats)) assert.equal(s.seasons[i].stats[key],n);
          assert.deepEqual(s,core.validateSave(copy(old)));
          assert.deepEqual(s,core.validateSave(copy(s)));
          assertLedgers(s);
          if(s.phase==='active'&&!s.pendingEvent) assert.deepEqual(core.advanceWeek(s,'rest'),core.advanceWeek(core.validateSave(copy(s)),'rest'));
        }
        const migratedEnd = endSeason(core.validateSave(pending));
        const next = core.nextSeason(migratedEnd,migratedEnd.teamId);
        assert.equal(next.schedule.kind,'standard');
        assert.equal(next.schedule.gamesPerTeam,{kbo:144,npb:143,mlb:162}[next.leagueId]);
      }
    }
  }
});

test('Injury_RecurringOverwork_HasBoundedSeasonLossAndNoRepeatedRehabPenalty', () => {
  const evidence=[];
  for(const role of ['batter','pitcher']) {
    for(let seed=1;seed<=20;seed++) {
      let s=create({role,seed,entry:'pro',teamId:'kbo-lg'});
      let injuries=0, maxLoss=0;
      while(s.phase==='active') {
        if(s.pendingEvent){s=core.resolveEvent(s,s.pendingEvent.choices[0].id);continue;}
        s.fatigue=100;
        const prior=s.injurySeasonLoss;
        const wasInjured=Boolean(s.injury);
        s=core.advanceWeek(s,role==='batter'?'power':'velocity');
        const loss=s.injurySeasonLoss-prior;
        assert.ok(loss>=-1e-8 && loss<=0.8+1e-8,`single injury cost ${loss}`);
        assert.ok(s.injurySeasonLoss<=2+1e-8,`season injury cost ${s.injurySeasonLoss}`);
        if(wasInjured)assert.equal(loss,0,'rehabilitation applied permanent damage again');
        if(loss>0)injuries++;
        maxLoss=Math.max(maxLoss,s.injurySeasonLoss);
        assert.deepEqual(core.validateSave(s),s);
      }
      evidence.push({role,seed,injuries,seasonLoss:maxLoss});
      const next=core.nextSeason(s,s.teamId);
      assert.equal(next.injurySeasonLoss,0);
    }
  }
  assert.ok(evidence.some(row=>row.injuries>1),'exercise did not cover repeated injury');
  fs.writeFileSync(path.join(__dirname,'../.validation/v3-injury-evidence.json'),JSON.stringify(evidence,null,2));
});

test('Save_NewCareerFields_RejectsMalformedV3AndCorruptLegacy', () => {
  const s=create();
  const cases=[
    x=>{x.stage='unknown';},
    x=>{x.age=41;},
    x=>{x.startAge=12;},
    x=>{x.schoolStats.h++;},
    x=>{x.careerStats.h++;},
    x=>{x.injurySeasonLoss=-1;},
    x=>{x.injurySeasonLoss=2.1;},
    x=>{x.schedule.gamesPerTeam=999;},
    x=>{x.schedule.weekCount=1;},
    x=>{x.schedule.kind='injected';},
  ];
  for(const corrupt of cases){const bad=copy(s);corrupt(bad);assert.throws(()=>core.validateSave(bad),corrupt.toString());}
  for(const api of [v1,v2]) {
    const old=api.createCareer({name:'손상 이전',role:'batter',seed:1});
    old.careerStats.h++;
    assert.throws(()=>core.validateSave(old));
  }
  assert.deepEqual(core.validateSave(s),s);
});
