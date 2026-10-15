'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../dist/core.js');

const copy = value => JSON.parse(JSON.stringify(value));
const career = (role = 'batter', seed = 42) => core.createCareer({name: '검증 선수', role, seed, entry: 'pro'});
const deepFreeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

test('createCareer_SameSeed_ProducesIdenticalIndependentStates', () => {
  for (const role of ['batter', 'pitcher']) {
    const a = career(role);
    const b = career(role);
    assert.deepEqual(a, b);
    assert.notStrictEqual(a, b);
    assert.equal(a.phase, 'active');
    assert.equal(a.season, 1);
  }
});

test('advanceWeek_FrozenInput_DoesNotMutateCallerState', () => {
  for (const role of ['batter', 'pitcher']) {
    const input = deepFreeze(career(role));
    const before = JSON.stringify(input);
    const next = core.advanceWeek(input, 'balanced');
    assert.notStrictEqual(next, input);
    assert.equal(JSON.stringify(input), before);
    assert.equal(next.week, input.week + 1);
  }
});

test('advanceWeek_SaveRestore_PreservesNextOutcome', () => {
  for (const role of ['batter', 'pitcher']) {
    let state = career(role, 993);
    state = core.advanceWeek(state, 'balanced');
    state = core.advanceWeek(state, 'rest');
    assert.deepEqual(core.advanceWeek(state, 'balanced'), core.advanceWeek(copy(state), 'balanced'));
  }
});

test('advanceWeek_InvalidPlan_RejectsWithoutMutation', () => {
  const state = career();
  const before = copy(state);
  assert.throws(() => core.advanceWeek(state, 'cheat'));
  assert.deepEqual(state, before);
});

test('validateSave_MissingOrMalformedState_Rejects', () => {
  for (const input of [null, undefined, {}, [], '', 7, {version: 999}, {phase: 'active'}]) {
    assert.throws(() => core.validateSave(input), `accepted malformed input ${JSON.stringify(input)}`);
  }
});

const resolve = (state, choice = 0) => state.pendingEvent
  ? core.resolveEvent(state, state.pendingEvent.choices[choice].id) : state;

function assertRecords(state) {
  const st = state.stats;
  for (const n of Object.values(st)) assert.ok(Number.isSafeInteger(n) && n >= 0);
  assert.ok(st.h <= st.ab);
  assert.ok(st.doubles + st.triples + st.hr <= st.h);
  assert.ok(st.er <= st.ra);
  assert.ok(st.starts <= st.g);
  assert.ok(st.w + st.l <= st.g);
  assert.ok(st.sv + st.hld + st.w + st.l <= st.g);
  const team = state.standings.find(t => t.teamId === state.teamId);
  assert.ok(st.w <= team.w && st.l <= team.l);
  assert.ok(st.r <= team.rs && st.rbi <= team.rs && st.ra <= team.ra);
  if (state.role === 'batter') {
    assert.equal(st.pa, st.ab + st.bb + st.hbp + st.sf);
    assert.ok(st.hr <= st.r && st.hr <= st.rbi);
    assert.ok(st.so <= st.ab - st.h);
  } else {
    assert.ok(st.outs <= 27 * st.g);
    assert.ok(st.so <= st.outs);
  }
  for (const row of state.standings) assert.ok(row.w + row.l + (row.t || 0) <= 162);
  const sum = key => state.standings.reduce((n, row) => n + row[key], 0);
  assert.equal(sum('w'), sum('l'));
  assert.equal(sum('rs'), sum('ra'));
  const previous = state.seasons.filter(row => row.season < state.season);
  for (const key of Object.keys(st)) {
    assert.equal(state.careerStats[key], st[key] + previous.reduce((n, row) => n + row.stats[key], 0));
  }
  assert.deepEqual(core.validateSave(state), state);
}

test('Career_24SeededRuns_CompleteProCareerThroughAge40WithConservedRecords', () => {
  for (const role of ['batter', 'pitcher']) {
    for (let seed = 1; seed <= 12; seed++) {
      const countryTeams = core.TEAMS.filter(t => t.leagueId === ['kbo', 'npb', 'mlb'][seed % 3]);
      const team = countryTeams.length ? countryTeams[seed % countryTeams.length] : core.TEAMS[seed % core.TEAMS.length];
      let state = core.createCareer({name: '검증 선수', role, seed, entry: 'pro', style: core.STYLES[role][seed % 3].id, teamId: team.id, leagueId: team.leagueId});
      let weeks = 0;
      let events = 0;
      while (state.phase !== 'retired') {
        if (state.pendingEvent) {
          state = resolve(state, seed % 2);
          events++;
        } else if (state.phase === 'seasonEnd') {
          assert.equal(state.week, state.schedule.weekCount);
          const calendar = core.getSeasonSchedule(state);
          assert.ok(state.standings.every(t => t.w + t.l + (t.t || 0) === calendar.games.filter(g=>g.home===t.teamId||g.away===t.teamId).length));
          state = core.nextSeason(state, state.teamId);
        } else {
          const before = copy(state);
          const plan = core.PLANS[role][(seed + weeks) % core.PLANS[role].length].id;
          state = core.advanceWeek(state, plan);
          weeks++;
          assert.ok(weeks <= 1000, 'career deadlocked or exceeded duration');
          assert.ok(state.lastWeek.games.length <= 14);
          assert.ok(state.lastWeek.games.every(g => g.opponentId !== state.teamId && (g.result === 'W') === (g.our > g.opp)));
          const ourRuns = state.lastWeek.games.reduce((n, g) => n + g.our, 0);
          const opponentRuns = state.lastWeek.games.reduce((n, g) => n + g.opp, 0);
          assert.ok(state.stats.r - before.stats.r <= ourRuns);
          assert.ok(state.stats.rbi - before.stats.rbi <= ourRuns);
          assert.ok(state.stats.ra - before.stats.ra <= opponentRuns);
          assert.ok(state.lastWeek.gamesPlayed <= (role === 'batter' ? state.lastWeek.games.length : 2));
        }
        assertRecords(state);
      }
      assert.ok(weeks >= 400);
      assert.ok(events >= 22);
      assert.equal(state.seasons.length, 22);
      assert.equal(state.age, 40);
      assert.throws(() => core.advanceWeek(state, 'balanced'));
      assert.throws(() => core.nextSeason(state, core.TEAMS[0].id));
    }
  }
});

test('Event_SaveReload_BlocksProgressAndAppliesChoiceExactlyOnce', () => {
  let state = career('batter', 7);
  while (!state.pendingEvent) state = core.advanceWeek(state, 'balanced');
  assert.ok(state.pendingEvent);
  const before = copy(state);
  assert.throws(() => core.advanceWeek(state, 'rest'));
  assert.throws(() => core.resolveEvent(state, 'injected-choice'));
  assert.deepEqual(state, before);
  const choice = state.pendingEvent.choices[0].id;
  const next = core.resolveEvent(deepFreeze(state), choice);
  assert.equal(next.pendingEvent, null);
  assert.equal(next.week, before.week);
  assert.deepEqual(next.stats, before.stats);
  assert.deepEqual(next.standings, before.standings);
  assert.deepEqual(next, core.resolveEvent(core.validateSave(copy(before)), choice));
  assert.throws(() => core.resolveEvent(next, choice));
});

test('Training_TargetedPlan_GrowsTargetMoreThanRestAndCostsFatigue', () => {
  for (const [role, plan, attr] of [['batter', 'power', 'power'], ['pitcher', 'velocity', 'velocity']]) {
    let growthAdvantage = 0;
    let fatigueCost = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const state = career(role, seed);
      const trained = core.advanceWeek(state, plan);
      const rested = core.advanceWeek(state, 'rest');
      growthAdvantage += trained.attrs[attr] - rested.attrs[attr];
      fatigueCost += trained.fatigue - rested.fatigue;
    }
    assert.ok(growthAdvantage > 10, 'training should create a visible average gain');
    assert.ok(fatigueCost > 1000, 'rest should create a material recovery benefit');
  }
});

test('Career_MidSeasonRetirement_ArchivesOnceAndKeepsTotals', () => {
  let state = core.advanceWeek(career('pitcher'), 'control');
  const before = copy(state);
  state = core.retire(deepFreeze(state));
  assert.equal(state.phase, 'retired');
  assert.equal(state.seasons.length, 1);
  assert.deepEqual(state.seasons[0].stats, before.stats);
  assert.deepEqual(state.careerStats, before.careerStats);
  assertRecords(state);
  assert.throws(() => core.retire(state));
});

test('validateSave_CorruptionAndInjectedShape_RejectsWithoutChangingValidSave', () => {
  const original = core.advanceWeek(career(), 'balanced');
  const cases = [
    s => { s.version = 999; },
    s => { s.phase = 'winner'; },
    s => { s.week = 16; },
    s => { s.age = 999; },
    s => { s.rng = 0; },
    s => { s.attrs.contact = Infinity; },
    s => { s.attrs.contact = NaN; },
    s => { s.fatigue = -1; },
    s => { s.stats.h = s.stats.ab + 1; },
    s => { s.careerStats.h++; },
    s => { s.standings[0].w++; },
    s => { s.standings[1].teamId = s.standings[0].teamId; },
    s => { s.pendingEvent = {id: 'fake', choices: []}; },
    s => { s.lastWeek.games[0].our = s.lastWeek.games[0].opp; },
    s => { s.lastWeek.games[0].line = {html: '<script>bad()</script>'}; },
    s => { s.attrs.constructor = {prototype: {polluted: true}}; },
    s => { Object.defineProperty(s, '__proto__', {value: {polluted: true}, enumerable: true}); },
    s => { delete s.history; },
  ];
  for (const corrupt of cases) {
    const state = copy(original);
    corrupt(state);
    assert.throws(() => core.validateSave(state), corrupt.toString());
  }
  assert.equal({}.polluted, undefined);
  assert.deepEqual(core.validateSave(original), original);
  assert.notStrictEqual(core.validateSave(original), original);
});

test('rateStats_RawRecords_ComputesBaseballRatesAndOutNotation', () => {
  const stats = {...career().stats, ab: 10, h: 4, doubles: 1, triples: 1, hr: 1, bb: 2, hbp: 1, sf: 1, outs: 17, er: 2, ha: 5};
  const rate = core.rateStats(stats, 'batter');
  assert.equal(rate.avg, '.400');
  assert.equal(rate.obp, '.500');
  assert.equal(rate.slg, '1.000');
  assert.equal(rate.ops, '1.500');
  assert.equal(rate.ip, '5.2');
  assert.equal(rate.era, '3.18');
  assert.equal(rate.whip, '1.24');
});

test('rateStats_ZeroDenominators_ShowsUnavailableInsteadOfZeroPerformance', () => {
  const rate = core.rateStats(career().stats, 'batter');
  for (const key of ['avg', 'obp', 'slg', 'ops', 'era', 'whip']) assert.equal(rate[key], '—', key);
});
