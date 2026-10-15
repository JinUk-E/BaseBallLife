'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../dist/core.js');
const legacy = require('../dist/legacy-core.js');
const data = require('../dist/league-data.js');
const copy = s => JSON.parse(JSON.stringify(s));
const career = (options = {}) => core.createCareer({name: '확장 검증', role: 'batter', seed: 17, entry: 'pro', ...options});
const resolve = s => s.pendingEvent ? core.resolveEvent(s, s.pendingEvent.choices[0].id) : s;
function finishSeason(s, api = core) {
  let steps = 0;
  while (s.phase === 'active') {
    assert.ok(++steps < 80, 'season progression deadlock');
    s = s.pendingEvent ? api.resolveEvent(s, s.pendingEvent.choices[0].id) : api.advanceWeek(s, 'balanced');
  }
  return s;
}
function assertCaps(s) {
  for (const [key, value] of Object.entries(s.attrs)) {
    assert.ok(value >= 1 && value <= s.potential.caps[key], `${key}: ${value} exceeds ${s.potential.caps[key]}`);
  }
}

test('LeagueData_ThreeCountries_Has52UniqueTeamsAndCompleteMembership', () => {
  assert.equal(data.TEAMS.filter(t => t.leagueId !== 'highschool').length, 52);
  assert.equal(new Set(data.TEAMS.map(t => t.id)).size, data.TEAMS.length);
  for (const [id, count] of [['kbo', 10], ['npb', 12], ['mlb', 30]]) {
    assert.equal(data.TEAMS.filter(t => t.leagueId === id).length, count);
    assert.equal(data.LEAGUES.find(l => l.id === id).teamCount, count);
  }
});

test('Potential_SeededCreation_IsStableVariedAndPersisted', () => {
  for (const role of ['batter', 'pitcher']) {
    const signatures = new Set();
    for (let seed = 1; seed <= 40; seed++) {
      const s = career({role, seed});
      assert.equal(s.version, 3);
      assert.deepEqual(s.potential, career({role, seed}).potential);
      signatures.add(JSON.stringify(s.potential));
      assertCaps(s);
      const next = core.advanceWeek(s, 'balanced');
      assert.deepEqual(next.potential, s.potential);
      assert.deepEqual(core.validateSave(copy(next)).potential, s.potential);
    }
    assert.ok(signatures.size > 30, 'different seeds should produce varied potential');
  }
});

test('Growth_AllTrainingPlansAndEventChoices_RespectIndividualCaps', () => {
  for (const role of ['batter', 'pitcher']) {
    for (const plan of core.PLANS[role]) {
      let s = career({role});
      for (const key of Object.keys(s.attrs)) s.attrs[key] = s.potential.caps[key] - 0.1;
      assertCaps(core.advanceWeek(s, plan.id));
    }
    let s = career({role});
    while (s.phase === 'active') {
      if (s.pendingEvent) {
        for (const choice of s.pendingEvent.choices) {
          const atCap = copy(s);
          for (const key of Object.keys(atCap.attrs)) atCap.attrs[key] = atCap.potential.caps[key];
          assertCaps(core.resolveEvent(atCap, choice.id));
        }
        s = resolve(s);
      } else {
        s = core.advanceWeek(s, 'balanced');
      }
      assertCaps(s);
    }
  }
});

test('Overwork_HighFatigue_CanReduceAttributesWithoutViolatingCaps', () => {
  let reductions = 0;
  for (const role of ['batter', 'pitcher']) {
    for (let seed = 1; seed <= 80; seed++) {
      const s = career({role, seed});
      s.fatigue = 100;
      const next = core.advanceWeek(s, role === 'batter' ? 'power' : 'velocity');
      reductions += Object.keys(s.attrs).filter(k => next.attrs[k] < s.attrs[k]).length;
      assertCaps(next);
    }
  }
  assert.ok(reductions > 0, 'overwork never reduced an attribute');
});

test('Items_PurchaseAndWeeklyUse_ChargePointsAndRejectUnavailableActions', () => {
  let s = career();
  s.points = 120;
  s.inventory.recovery = 0;
  const before = copy(s);
  const bought = core.buyItem(s, 'recovery');
  assert.deepEqual(s, before, 'purchase mutated original state');
  assert.equal(bought.points, 90);
  assert.equal(bought.inventory.recovery, 1);
  bought.fatigue = 80;
  const used = core.useItem(bought, 'recovery');
  assert.equal(used.fatigue, 55);
  assert.equal(used.inventory.recovery, 0);
  assert.equal(used.usedItems.length, 1);
  const stocked = core.buyItem(used, 'growth');
  assert.throws(() => core.useItem(stocked, 'growth'), 'second item used in same week');
  const next = resolve(core.advanceWeek(stocked, 'rest'));
  assert.equal(next.usedItems.length, 0);
  assert.ok(core.useItem(next, 'growth').buffs.growth > 0);
  const poor = career(); poor.points = 0; poor.inventory.recovery = 0;
  assert.throws(() => core.buyItem(poor, 'recovery'));
  assert.throws(() => core.useItem(poor, 'recovery'));
  assert.throws(() => core.buyItem(s, 'unknown'));
  assert.throws(() => core.useItem(s, 'unknown'));
});

test('Items_TimedBuffs_ExpireAfterThreeWeeksAndCannotStack', () => {
  for (const id of ['growth', 'protection']) {
    let s = career(); s.points = 1000; s.inventory[id] = 0;
    s = core.useItem(core.buyItem(s, id), id);
    assert.equal(s.buffs[id], 3);
    const originalPotential = copy(s.potential);
    for (const remaining of [2, 1, 0]) {
      s = resolve(core.advanceWeek(s, 'balanced'));
      assert.equal(s.buffs[id], remaining);
      s = core.buyItem(s, id);
      if (remaining) assert.throws(() => core.useItem(s, id), 'active buff stacked or refreshed');
    }
    assert.equal(core.useItem(s, id).buffs[id], 3);
    assert.deepEqual(s.potential, originalPotential);
  }
});

test('GrowthBuff_SameSeed_ImprovesTrainingWithoutBypassingCaps', () => {
  const s = career();
  s.inventory.growth = 1;
  const boosted = core.advanceWeek(core.useItem(s, 'growth'), 'power');
  const baseline = core.advanceWeek(s, 'power');
  assert.ok(boosted.attrs.power > baseline.attrs.power);
  assertCaps(boosted);
  assert.deepEqual(boosted.potential, baseline.potential);
});

test('GrowthBuff_LastCoveredWeekEvent_AppliesBeforeExpirationAndSurvivesReload', () => {
  let discovery = career();
  while(!discovery.pendingEvent) discovery=core.advanceWeek(discovery,'rest');
  let s = career();
  while(s.week<discovery.week-3)s=core.advanceWeek(s,'rest');
  s.inventory.growth = 1;
  s = core.useItem(s, 'growth');
  for (let i = 0; i < 3; i++) s = core.advanceWeek(s, 'rest');
  assert.equal(s.week, discovery.week);
  assert.ok(s.pendingEvent);
  assert.equal(s.buffs.growth, 1, 'final covered event lost the growth bonus');
  const baseline = copy(s); baseline.buffs.growth = 0;
  const boosted = core.resolveEvent(core.validateSave(copy(s)), 'fundamentals');
  const plain = core.resolveEvent(baseline, 'fundamentals');
  assert.equal(boosted.buffs.growth, 0);
  assert.ok(boosted.attrs.contact > plain.attrs.contact);
  assertCaps(boosted);
  assert.deepEqual(boosted, core.resolveEvent(s, 'fundamentals'));
});

test('Protection_SameSeedHighFatigue_ReducesInjuryIncidence', () => {
  let ordinary = 0, protectedCount = 0;
  for (let seed = 1; seed <= 120; seed++) {
    const s = career({seed}); s.fatigue = 95; s.inventory.protection = 1;
    const a = core.advanceWeek(s, 'power');
    const b = core.advanceWeek(core.useItem(s, 'protection'), 'power');
    ordinary += Number(Boolean(a.injury));
    protectedCount += Number(Boolean(b.injury));
    assert.ok(!b.injury || a.injury, 'protective item introduced an injury for the same initial seed');
  }
  assert.ok(ordinary > 0);
  assert.ok(protectedCount < ordinary, 'protection did not reduce injuries');
});

test('Roles_ChangesAreLimitedAndCrossRoleActionsReject', () => {
  let batter = career({position: 'CF'});
  batter = core.changePosition(batter, 'C');
  assert.equal(batter.position, 'C');
  assert.equal(batter.roleChangedWeek, true);
  assert.throws(() => core.changePosition(batter, '1B'));
  assert.throws(() => core.changePitchingRole(batter, 'closer'));
  batter = resolve(core.advanceWeek(batter, 'rest'));
  assert.equal(core.changePosition(batter, '1B').position, '1B');
  let pitcher = career({role: 'pitcher', pitchingRole: 'starter'});
  pitcher = core.changePitchingRole(pitcher, 'closer');
  assert.equal(pitcher.pitchingRole, 'closer');
  assert.throws(() => core.changePitchingRole(pitcher, 'reliever'));
  assert.throws(() => core.changePosition(pitcher, 'C'));
  assert.throws(() => core.changePitchingRole(career({role: 'pitcher'}), 'invalid'));
});

test('Positions_DefenseSpecialist_HasBetterOutlookAtCatcherThanDesignatedHitter', () => {
  const catcher = career({position: 'C'});
  for (const key of Object.keys(catcher.attrs)) {
    catcher.potential.caps[key] = 99;
    catcher.attrs[key] = key === 'fielding' ? 95 : 40;
  }
  const hitter = {...copy(catcher), position: 'DH'};
  assert.ok(core.overall(catcher) > core.overall(hitter));
  assert.ok(core.getOutlook(catcher).probability > core.getOutlook(hitter).probability);
  assert.deepEqual(core.validateSave(catcher), catcher);
  assert.deepEqual(core.validateSave(hitter), hitter);
});

test('Injury_DowntimeAndRecoveryItem_AdvanceCalendarAndShortenAbsence', () => {
  for (const role of ['batter', 'pitcher']) {
    let s = career({role});
    s.injury = {name: '근육 피로 부상', weeks: 2};
    s.inventory.recovery = 1;
    assert.equal(core.getOutlook(s).probability, 0);
    const treated = core.useItem(s, 'recovery');
    assert.equal(treated.injury.weeks, 1);
    s = core.advanceWeek(s, 'rest');
    assert.equal(s.week, 1);
    assert.equal(s.injury.weeks, 1);
    assert.equal(s.lastWeek.gamesPlayed, 0);
    assert.equal(s.stats.g, 0);
    assert.ok(s.standings.some(t => t.w + t.l + t.t > 0));
    const healed = core.advanceWeek(treated, 'rest');
    assert.equal(healed.injury, null);
    assert.equal(healed.lastWeek.gamesPlayed, 0);
    assert.ok(core.getOutlook(healed).probability > 0);
    s = core.advanceWeek(s, 'rest');
    assert.equal(s.injury, null);
    assert.equal(s.week, 2);
    assert.equal(s.stats.g, 0);
    assert.deepEqual(core.validateSave(s), s);
  }
});

test('PitchingRoles_SeededSeasons_RespectAppearanceLimitsAndDecisionConservation', () => {
  const totals = {starter: {sv: 0, hld: 0, starts: 0}, reliever: {sv: 0, hld: 0, starts: 0}, closer: {sv: 0, hld: 0, starts: 0}};
  for (const pitchingRole of Object.keys(totals)) {
    for (let seed = 1; seed <= 20; seed++) {
      const leagueId = ['kbo', 'npb', 'mlb'][seed % 3];
      let s = career({role: 'pitcher', pitchingRole, seed, leagueId, teamId: data.TEAMS.find(t => t.leagueId === leagueId).id});
      while (s.phase === 'active') {
        if (s.pendingEvent) { s = resolve(s); continue; }
        const before = copy(s.stats);
        s = core.advanceWeek(s, s.fatigue > 45 ? 'rest' : 'balanced');
        const delta = key => s.stats[key] - before[key];
        const wins = s.lastWeek.games.filter(g => g.result === 'W').length;
        assert.ok(delta('g') <= {starter: 2, reliever: 4, closer: 3}[pitchingRole]);
        assert.ok(delta('w') + delta('l') + delta('sv') + delta('hld') <= delta('g'));
        assert.ok(delta('w') + delta('sv') + delta('hld') <= wins);
        assert.ok(delta('l') <= s.lastWeek.games.filter(g=>g.result==='L').length);
        const credited = s.lastWeek.games.filter(g => g.line.includes('세이브') || g.line.includes('홀드'));
        assert.equal(credited.length, delta('sv') + delta('hld'));
        assert.ok(credited.every(g => g.played && g.result === 'W' && g.our - g.opp <= 3));
        if (pitchingRole === 'starter') {
          assert.equal(delta('starts'), delta('g'));
          assert.equal(delta('sv') + delta('hld'), 0);
        } else {
          assert.equal(delta('starts'), 0);
          assert.ok(delta('outs') <= delta('g') * 6);
          assert.equal(pitchingRole === 'closer' ? delta('hld') : delta('sv'), 0);
        }
        assert.deepEqual(core.validateSave(s), s);
      }
      for (const key of ['sv', 'hld', 'starts']) totals[pitchingRole][key] += s.stats[key];
    }
  }
  assert.ok(totals.starter.starts > 0);
  assert.ok(totals.reliever.hld > 0);
  assert.ok(totals.closer.sv > 0);
});

test('Schedule_EachLeague_CompletesItsSeasonWithoutForeignOpponents', () => {
  for (const league of data.LEAGUES) {
    const ids = data.TEAMS.filter(t => t.leagueId === league.id).map(t => t.id);
    let s = career({leagueId: league.id, teamId: ids[0],entry:league.id==='highschool'?'highschool':'pro'});
    assert.deepEqual([...s.scheduleTeamIds].sort(), [...ids].sort());
    while (s.phase === 'active') {
      if (s.pendingEvent) { s = resolve(s); continue; }
      s = core.advanceWeek(s, 'balanced');
      assert.equal(s.lastWeek.games.length, core.getSeasonSchedule(s).weeks[s.week-1].games.filter(g=>g.home===s.teamId||g.away===s.teamId).length);
      assert.ok(s.lastWeek.games.every(g => ids.includes(g.opponentId) && g.opponentId !== s.teamId));
      const sum = key => s.standings.reduce((n, t) => n + t[key], 0);
      assert.equal(sum('w'), sum('l'));
      assert.equal(sum('rs'), sum('ra'));
    }
    const calendar=core.getSeasonSchedule(s);
    assert.ok(s.standings.every(t => t.w + t.l + t.t === calendar.games.filter(g=>g.home===t.teamId||g.away===t.teamId).length));
    assert.equal(s.standings.reduce((n, t) => n + t.w + t.t / 2, 0), calendar.games.length);
    assert.deepEqual(core.validateSave(s), s);
  }
});

test('Contract_InternationalTransfer_ResetsLeagueAndPreservesCareerRecords', () => {
  let s = finishSeason(career());
  while(!core.contractOptions(s).some(o=>data.TEAMS.find(t=>t.id===o.teamId).leagueId==='npb'))s=finishSeason(core.nextSeason(s,s.teamId));
  for (const leagueId of ['npb', 'mlb']) {
    const team = data.TEAMS.find(t => t.leagueId === leagueId);
    const total = copy(s.careerStats), potential = copy(s.potential);
    s = core.nextSeason(s, team.id);
    assert.equal(s.leagueId, leagueId);
    assert.equal(s.teamId, team.id);
    assert.ok(s.standings.every(t => data.TEAMS.find(x => x.id === t.teamId).leagueId === leagueId));
    assert.deepEqual(s.careerStats, total);
    assert.deepEqual(s.potential, potential);
    assert.ok(Object.values(s.stats).every(n => n === 0));
    s = finishSeason(s);
  }
});

test('Migration_AllLegacyPhases_PreservesRecordsEventsAndEightTeamSeason', () => {
  for (const role of ['batter', 'pitcher']) {
    const initial = legacy.createCareer({name: '이전 선수', role, seed: 991});
    let pending = initial;
    for (let i = 0; i < 4; i++) pending = legacy.advanceWeek(pending, 'balanced');
    const seasonEnd = finishSeason(pending, legacy);
    const second = legacy.nextSeason(seasonEnd, legacy.TEAMS[3].id);
    const secondEnd = finishSeason(second, legacy);
    const thirdEnd = finishSeason(legacy.nextSeason(secondEnd, legacy.TEAMS[6].id), legacy);
    const retired = legacy.retire(thirdEnd);
    for (const old of [initial, pending, seasonEnd, second, secondEnd, thirdEnd, retired]) {
      const before = copy(old);
      const migrated = core.validateSave(old);
      assert.deepEqual(old, before, 'migration mutated legacy input');
      assert.equal(migrated.version, 3);
      assert.equal(migrated.phase, old.phase);
      assert.equal(migrated.week, old.week);
      assert.equal(migrated.age, old.age);
      assert.equal(migrated.season, old.season);
      assert.equal(migrated.rng, old.rng, 'migration consumed simulation RNG');
      assert.equal(migrated.scheduleTeamIds.length, 8);
      assert.equal(migrated.standings.length, 8);
      assert.equal(migrated.seasons.length, old.seasons.length);
      for (const [i, archived] of old.seasons.entries()) {
        assert.equal(migrated.seasons[i].teamId, data.LEGACY_TEAM_MAP[archived.teamId]);
        for (const [key, value] of Object.entries(archived.stats)) assert.equal(migrated.seasons[i].stats[key], value);
      }
      for (const [key, value] of Object.entries(old.stats)) assert.equal(migrated.stats[key], value, key);
      for (const [key, value] of Object.entries(old.careerStats)) assert.equal(migrated.careerStats[key], value, key);
      assert.equal(migrated.pendingEvent?.id, old.pendingEvent?.id);
      assert.deepEqual(migrated.pendingEvent?.choices.map(c => c.id), old.pendingEvent?.choices.map(c => c.id));
      assert.deepEqual(migrated, core.validateSave(copy(old)), 'migration is not deterministic');
      assert.deepEqual(migrated, core.validateSave(copy(migrated)), 'migration is not idempotent');
      if (old.pendingEvent) assert.throws(() => core.advanceWeek(migrated, 'rest'));
    }
    const end = finishSeason(core.validateSave(pending));
    assert.equal(end.standings.reduce((n, t) => n + t.w + t.t / 2, 0), 448);
    const next = core.nextSeason(end, end.teamId);
    assert.equal(next.scheduleTeamIds.length, 10);
    assert.equal(next.standings.length, 10);
  }
});

test('Save_NewFieldsAndImpossibleCredit_RejectCorruptionWithoutMutatingValidState', () => {
  const original = core.advanceWeek(career(), 'balanced');
  const cases = [
    s => { s.leagueId = 'unknown'; },
    s => { s.scheduleTeamIds[1] = s.scheduleTeamIds[0]; },
    s => { s.scheduleTeamIds[0] = data.TEAMS.find(t => t.leagueId === 'mlb').id; },
    s => { s.potential.caps.contact = s.attrs.contact - 1; },
    s => { s.potential.growthRate = -1; },
    s => { s.potential.resilience = Infinity; },
    s => { s.position = 'unknown'; },
    s => { s.pitchingRole = 'closer'; },
    s => { s.points = -1; },
    s => { s.inventory.recovery = -1; },
    s => { s.buffs.growth = 999; },
    s => { s.usedItems = ['growth', 'protection']; },
    s => { s.roleChangedWeek = 'yes'; },
    s => { s.injury = {name: 'invalid', weeks: -1}; },
    s => { s.stats.sv = 1; },
  ];
  for (const corrupt of cases) {
    const invalid = copy(original); corrupt(invalid);
    assert.throws(() => core.validateSave(invalid), corrupt.toString());
  }
  assert.deepEqual(core.validateSave(original), original);
});
