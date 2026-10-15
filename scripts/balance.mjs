import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const D = require('../dist/core.js');

const average = s => Object.values(s.attrs).reduce((a, b) => a + b, 0) / 5;
const rounded = n => Math.round(n * 10000) / 10000;
function finishSeason(state) {
  let s = state;
  while (s.phase === 'active') {
    if (s.pendingEvent) s = D.resolveEvent(s, s.pendingEvent.choices[0].id);
    s = D.advanceWeek(s, s.fatigue > 60 ? 'rest' : 'balanced');
  }
  return D.validateSave(s);
}
const firstSeasons = {};
for (const entry of ['highschool', 'pro']) {
  const samples = [];
  for (let seed = 1; seed <= 20; seed++) {
    const start = D.createCareer({ name: '성장 표본', role: 'batter', entry, seed });
    const end = finishSeason(start);
    samples.push({ seed, growthRate: start.potential.growthRate, resilience: start.potential.resilience,
      startAge: start.age, weeks: start.schedule.weekCount, increase: rounded(average(end) - average(start)),
      injuries: end.injuryBurden, injuryLoss: end.injurySeasonLoss });
  }
  firstSeasons[entry] = { count: samples.length,
    meanIncrease: rounded(samples.reduce((sum, s) => sum + s.increase, 0) / samples.length),
    minIncrease: Math.min(...samples.map(s => s.increase)), maxIncrease: Math.max(...samples.map(s => s.increase)), samples };
}
const laterCareers = [];
for (const seed of [1, 10, 20]) {
  let s = D.createCareer({ name: '노화 표본', role: 'batter', entry: 'pro', seed });
  while (s.age <= 40) {
    const before = average(s), initialBurden = s.injuryBurden;
    s = finishSeason(s);
    if ([30, 35, 40].includes(s.age)) laterCareers.push({ seed, age: s.age, growthRate: s.potential.growthRate,
      resilience: s.potential.resilience, averageCap: D.potentialSummary(s).averageCap,
      meanAttributeChange: rounded(average(s) - before), newInjuries: s.injuryBurden - initialBurden,
      injuryBurden: s.injuryBurden, injuryLoss: s.injurySeasonLoss,
      ageCurve: D.ageDevelopment(s.age, s.potential, s.injuryBurden) });
    if (s.age === 40) break;
    const offer = D.contractOptions(s).find(o => o.teamId === s.teamId) || D.contractOptions(s)[0];
    s = D.nextSeason(s, offer.teamId, offer.years[0]);
  }
}
const evidence = { version: D.VERSION, generatedAt: new Date().toISOString(),
  policy: '균형 훈련, 피로 60 초과 시 회복, 사건 첫 선택, 아이템 미사용. 노화 표본은 같은 팀에 잔류하며 첫 허용 계약 기간 선택. 평균 능력은 5개 능력의 산술평균.',
  firstSeasons, laterCareers };
mkdirSync(new URL('../.validation/', import.meta.url), { recursive: true });
writeFileSync(new URL('../.validation/v3-balance.json', import.meta.url), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ firstSeasons: Object.fromEntries(Object.entries(firstSeasons).map(([k, v]) => [k, { mean: v.meanIncrease, min: v.minIncrease, max: v.maxIncrease }])), laterCareers }, null, 2));
