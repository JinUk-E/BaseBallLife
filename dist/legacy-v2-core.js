(function (root, factory) {
  'use strict';
  const api = factory(typeof module === 'object' && module.exports ? require('./league-data.js') : root.DugoutData, typeof module === 'object' && module.exports ? require('./legacy-core.js') : root.DugoutLegacy);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DugoutLegacyV2 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (data, legacy) {
  'use strict';
  const VERSION = 2;
  // Freeze the v2 professional-only catalog even when v3 adds high-school teams.
  const TEAMS = data.TEAMS.filter(t => t.leagueId !== 'highschool');
  const LEAGUES = data.LEAGUES.filter(t => t.id !== 'highschool');
  const { LEGACY_TEAM_MAP } = data;
  const POSITIONS = [
    {id:'C',name:'포수',description:'수비와 선구안이 중요한 안방마님'},
    {id:'1B',name:'1루수',description:'파워와 타격을 앞세우는 중심 타선'},
    {id:'2B',name:'2루수',description:'수비와 주루가 중요한 내야수'},
    {id:'3B',name:'3루수',description:'파워와 수비를 겸비한 핫코너'},
    {id:'SS',name:'유격수',description:'수비와 주루 중심의 내야 핵심'},
    {id:'LF',name:'좌익수',description:'타격과 파워를 겸비한 외야수'},
    {id:'CF',name:'중견수',description:'수비 범위와 주루가 중요한 외야수'},
    {id:'RF',name:'우익수',description:'파워와 수비를 갖춘 외야수'},
    {id:'DH',name:'지명타자',description:'수비 부담 없이 타격에 집중'}
  ];
  const PITCHING_ROLES = [
    {id:'starter',name:'선발',description:'주 최대 2회, 긴 이닝을 책임집니다'},
    {id:'reliever',name:'중계',description:'주 최대 4회 짧은 등판, 홀드 기회를 얻습니다'},
    {id:'closer',name:'마무리',description:'주 최대 3회 짧은 등판, 접전 승리에서 세이브를 노립니다'}
  ];
  const ITEMS = [
    {id:'recovery',name:'회복 키트',description:'피로 25 감소 · 부상 1주 단축',price:30,effect:'피로 -25 / 부상 -1주'},
    {id:'growth',name:'성장 훈련권',description:'다음 3주 훈련·이벤트 성장 50% 증가',price:45,effect:'성장 ×1.5 / 3주'},
    {id:'protection',name:'보호 장비',description:'다음 3주 부상 확률 65% 감소',price:35,effect:'부상 위험 ×0.35 / 3주'}
  ];
  const POSITION_WEIGHTS = {C:[.15,.1,.15,.05,.55],'1B':[.3,.4,.15,.05,.1],'2B':[.2,.05,.1,.25,.4],'3B':[.2,.3,.1,.05,.35],SS:[.15,.05,.1,.25,.45],LF:[.3,.3,.15,.1,.15],CF:[.15,.1,.1,.3,.35],RF:[.2,.3,.1,.1,.3],DH:[.4,.4,.2,0,0]};
  const PITCH_WEIGHTS = {starter:[.18,.22,.2,.25,.15],reliever:[.3,.2,.25,.05,.2],closer:[.3,.2,.15,.05,.3]};
  const STYLES = {
    batter: [
      { id: 'contact', name: '컨택 히터', description: '정확한 타격과 선구안으로 출루합니다.' },
      { id: 'power', name: '파워 히터', description: '삼진 위험을 감수하고 장타를 노립니다.' },
      { id: 'speed', name: '스피드 스타', description: '빠른 발과 수비로 출전 기회를 만듭니다.' }
    ],
    pitcher: [
      { id: 'velocity', name: '파이어볼러', description: '빠른 공과 삼진으로 승부합니다.' },
      { id: 'control', name: '컨트롤 아티스트', description: '안정적인 제구와 긴 이닝이 강점입니다.' },
      { id: 'movement', name: '브레이킹 마스터', description: '변화구로 약한 타구를 유도합니다.' }
    ]
  };
  const ATTRS = {
    batter: [{ key: 'contact', label: '컨택' }, { key: 'power', label: '파워' }, { key: 'discipline', label: '선구안' }, { key: 'speed', label: '주력' }, { key: 'fielding', label: '수비' }],
    pitcher: [{ key: 'velocity', label: '구위' }, { key: 'control', label: '제구' }, { key: 'movement', label: '변화구' }, { key: 'stamina', label: '체력' }, { key: 'composure', label: '위기관리' }]
  };
  const PLANS = {
    batter: [
      { id: 'balanced', name: '균형 훈련', description: '전 능력 소폭 성장 · 피로 소폭 증가', fatigue: 4 },
      { id: 'contact', name: '타격 감각', description: '컨택·선구안 집중 성장 · 피로 증가', fatigue: 10 },
      { id: 'power', name: '장타 훈련', description: '파워 집중 성장 · 피로 크게 증가', fatigue: 17 },
      { id: 'defense', name: '수비·주루', description: '수비·주력 성장 · 감독 신뢰 증가', fatigue: 8 },
      { id: 'rest', name: '회복 주간', description: '피로 크게 감소 · 출전 기회와 성장 감소', fatigue: -34 }
    ],
    pitcher: [
      { id: 'balanced', name: '균형 훈련', description: '전 능력 소폭 성장 · 피로 소폭 증가', fatigue: 4 },
      { id: 'velocity', name: '구위 강화', description: '구위·변화구 성장 · 피로 크게 증가', fatigue: 17 },
      { id: 'control', name: '제구 훈련', description: '제구·위기관리 집중 성장 · 피로 증가', fatigue: 10 },
      { id: 'stamina', name: '지구력 훈련', description: '체력 집중 성장 · 감독 신뢰 증가', fatigue: 8 },
      { id: 'rest', name: '회복 주간', description: '피로 크게 감소 · 등판 기회와 성장 감소', fatigue: -34 }
    ]
  };
  const STAT_KEYS = 'ab h doubles triples hr bb hbp sf rbi r sb cs so g pa starts outs ha er ra w l sv hld'.split(' ');
  const STATE_KEYS = 'version id rng name role style teamId age season week phase attrs fatigue morale trust salary totalSalary stats careerStats seasons lastWeek history standings pendingEvent leagueId scheduleTeamIds potential position pitchingRole points inventory buffs injury usedItems roleChangedWeek'.split(' ');
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const clone = value => JSON.parse(JSON.stringify(value));
  const team = id => TEAMS.find(t => t.id === id);
  const blankStats = () => Object.fromEntries(STAT_KEYS.map(k => [k, 0]));
  const blankStandings = ids => ids.map(id => team(id)).map(t => ({ teamId: t.id, w: 0, l: 0, rs: 0, ra: 0 }));
  const fail = message => { throw new Error(message); };
  function random(s) {
    let n = s.rng >>> 0;
    n ^= n << 13; n ^= n >>> 17; n ^= n << 5;
    s.rng = n >>> 0;
    return s.rng / 4294967296;
  }
  function integer(s, lo, hi) { return lo + Math.floor(random(s) * (hi - lo + 1)); }
  function poisson(s, mean) {
    const threshold = Math.exp(-clamp(mean, 0.05, 12));
    let p = 1, n = 0;
    do { n++; p *= random(s); } while (p > threshold && n < 30);
    return n - 1;
  }
  function overall(s) { const weights = s.role === 'batter' ? POSITION_WEIGHTS[s.position] : PITCH_WEIGHTS[s.pitchingRole]; return Math.round(ATTRS[s.role].reduce((n, a, i) => n + s.attrs[a.key] * weights[i], 0)); }
  function addStats(to, from) { STAT_KEYS.forEach(k => { to[k] += from[k]; }); }
  function log(s, title, text, type) { s.history.push({ season: s.season, week: s.week, title, text, type }); if(s.history.length > 250) s.history.shift(); }
  function rateStats(st, role) {
    const avg = st.ab ? st.h / st.ab : 0;
    const denominator = st.ab + st.bb + st.hbp + st.sf;
    const obp = denominator ? (st.h + st.bb + st.hbp) / denominator : 0;
    const slg = st.ab ? (st.h + st.doubles + 2 * st.triples + 3 * st.hr) / st.ab : 0;
    const decimal = n => n.toFixed(3).replace(/^0\./, '.');
    return { avg: st.ab ? decimal(avg) : '—', ops: st.ab && denominator ? (obp + slg).toFixed(3) : '—', obp: denominator ? decimal(obp) : '—', slg: st.ab ? decimal(slg) : '—',
      era: st.outs ? (st.er * 27 / st.outs).toFixed(2) : '—',
      whip: st.outs ? ((st.ha + st.bb) * 3 / st.outs).toFixed(2) : '—',
      ip: Math.floor(st.outs / 3) + '.' + st.outs % 3 };
  }
  function getOutlook(s) {
    const difference = overall(s) - team(s.teamId).competition;
    const probability = s.injury ? 0 : clamp(0.66 + difference * 0.013 + (s.trust - 50) * 0.003 + (s.morale - 50) * 0.001 - Math.max(0, s.fatigue - 30) * 0.006, 0.22, 0.97);
    const label = probability >= 0.8 ? (s.role === 'batter' ? '주전 중심' : PITCHING_ROLES.find(v => v.id === s.pitchingRole).name + ' 핵심') : probability >= 0.55 ? '출전 경쟁 중' : '기회를 기다리는 중';
    const reason = s.injury ? s.injury.name + ': ' + s.injury.weeks + '주 회복이 필요합니다.' : s.fatigue >= 65 ? '누적 피로가 출전과 경기력을 낮추고 있습니다.' : difference < -8 ? '경쟁이 강한 팀입니다. 성장과 감독 신뢰로 기회를 넓히세요.' : '능력, 감독 신뢰, 컨디션이 출전 기회를 결정합니다.';
    return { label, reason, probability, starts: s.role === 'batter' ? Math.round(probability * 7) : Math.round(probability * (s.pitchingRole === 'starter' ? 2 : s.pitchingRole === 'reliever' ? 4 : 3)) };
  }
  function seedValue(value) {
    if (value === undefined) return (Date.now() >>> 0) || 1;
    if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 4294967295) return value || 1;
    if (typeof value === 'string' && value.length <= 100) {
      let h = 2166136261;
      for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
      return (h >>> 0) || 1;
    }
    fail('시드는 32비트 정수 또는 짧은 문자열이어야 합니다.');
  }
  function createCareer(options) {
    if (!options || typeof options !== 'object') fail('선수 정보를 입력해 주세요.');
    const { role } = options;
    if (!Object.hasOwn(ATTRS, role)) fail('타자 또는 투수를 선택해 주세요.');
    const name = typeof options.name === 'string' ? options.name.trim() : '';
    if (!name || name.length > 20 || /[\u0000-\u001f\u007f]/.test(name)) fail('이름은 1~20자의 일반 문자로 입력해 주세요.');
    const style = options.style === undefined ? STYLES[role][0].id : options.style;
    const teamId = options.teamId === undefined ? TEAMS[0].id : options.teamId;
    if (!STYLES[role].some(v => v.id === style)) fail('선수 스타일을 확인해 주세요.');
    if (!team(teamId)) fail('구단을 확인해 주세요.');
    const rng = seedValue(options.seed);
    const s = { version: VERSION, id: 'career-' + rng.toString(36), rng, name, role, style, teamId, age: 18, season: 1, week: 0, phase: 'active',
      attrs: {}, fatigue: 12, morale: 65, trust: 48, salary: 3200, totalSalary: 0,
      stats: blankStats(), careerStats: blankStats(), seasons: [], lastWeek: null, history: [], standings: [], pendingEvent: null, leagueId: team(teamId).leagueId, scheduleTeamIds: TEAMS.filter(t => t.leagueId === team(teamId).leagueId).map(t => t.id), potential: null, position: role === 'batter' ? (options.position || 'CF') : null, pitchingRole: role === 'pitcher' ? (options.pitchingRole || 'starter') : null, points:120, inventory:{recovery:0,growth:0,protection:0}, buffs:{growth:0,protection:0}, injury:null, usedItems:[], roleChangedWeek:false };
    ATTRS[role].forEach(a => { s.attrs[a.key] = integer(s, 46, 53); });
    s.attrs[style] += 11;
    if (style === 'contact') s.attrs.discipline += 5;
    if (style === 'power') s.attrs.contact += 5;
    if (style === 'speed') s.attrs.fielding += 5;
    if (style === 'velocity') s.attrs.movement += 5;
    if (style === 'control') s.attrs.stamina += 5;
    if (style === 'movement') s.attrs.composure += 5;
    if (options.leagueId && options.leagueId !== s.leagueId) fail('리그와 구단을 확인해 주세요.');
    if (role === 'batter' ? !POSITIONS.some(v => v.id === s.position) : !PITCHING_ROLES.some(v => v.id === s.pitchingRole)) fail('수비 위치 / 투수 역할을 확인해 주세요.');
    s.potential = makePotential(s, s.rng); s.standings = blankStandings(s.scheduleTeamIds);
    log(s, '프로의 첫 페이지', team(teamId).name + '에서 18세 신인의 시즌이 시작됩니다.', 'career');
    return s;
  }
  function train(s, plan) {
    const before = { ...s.attrs };
    const efficiency = s.fatigue >= 75 ? 0.35 : s.fatigue >= 50 ? 0.65 : 1;
    const grow = (key, amount) => growAttr(s, key, amount * efficiency * (s.injury ? 0.25 : 1));
    if (plan.id === 'balanced') ATTRS[s.role].forEach(a => grow(a.key, 0.7));
    else if (plan.id === 'contact') { grow('contact', 2.2); grow('discipline', 1); }
    else if (plan.id === 'power') { grow('power', 3.1); grow('contact', 0.3); }
    else if (plan.id === 'defense') { grow('fielding', 2); grow('speed', 1.4); s.trust = clamp(s.trust + 3, 0, 100); }
    else if (plan.id === 'velocity') { grow('velocity', 2.1); grow('movement', 1.3); }
    else if (plan.id === 'control') { grow('control', 2.2); grow('composure', 1.1); }
    else if (plan.id === 'stamina') { grow('stamina', 2.5); grow('composure', 0.6); s.trust = clamp(s.trust + 3, 0, 100); }
    else { s.morale = clamp(s.morale + 5, 0, 100); }
    s.fatigue = clamp(s.fatigue + plan.fatigue - 7, 0, 100);
    return ATTRS[s.role].map(a => ({ key: a.key, delta: Math.round((s.attrs[a.key] - before[a.key]) * 10) / 10 })).filter(g => g.delta !== 0);
  }
  function batGame(s, opponent) {
    const st = blankStats(); st.g = 1;
    const a = s.attrs, penalty = Math.max(0, s.fatigue - 35) * 0.001;
    const hitChance = clamp(0.21 + (a.contact - 40) * 0.002 + (a.power - 50) * 0.0004 - penalty - (opponent.strength - 55) * 0.0008, 0.12, 0.38);
    const appearances = integer(s, 3, 5);
    for (let i = 0; i < appearances; i++) {
      st.pa++;
      const walk = 0.045 + a.discipline * 0.0007;
      const roll = random(s);
      if (roll < walk) { st.bb++; continue; }
      if (roll < walk + 0.008) { st.hbp++; continue; }
      if (roll < walk + 0.026) { st.sf++; st.rbi++; continue; }
      st.ab++;
      if (random(s) < hitChance) {
        st.h++;
        const extra = random(s);
        if (extra < 0.035 + a.power * 0.0016) { st.hr++; st.r++; st.rbi += integer(s, 1, 3); }
        else if (extra < 0.06 + a.power * 0.0016) st.triples++;
        else if (extra < 0.25 + a.power * 0.0016) st.doubles++;
        if (st.hr === 0 || extra >= 0.035 + a.power * 0.0016) {
          if (random(s) < 0.32) st.rbi += integer(s, 1, 2);
          if (random(s) < 0.32) st.r++;
        }
      } else if (random(s) < clamp(0.36 - (a.contact - 50) * 0.003 + (a.power - a.contact) * 0.001, 0.15, 0.5)) st.so++;
    }
    const bases = st.h - st.hr + st.bb + st.hbp;
    for (let i = 0; i < bases; i++) {
      if (random(s) < 0.02 + a.speed * 0.0013) { if (random(s) < 0.52 + a.speed * 0.004) st.sb++; else st.cs++; }
    }
    st.r = Math.min(st.r, st.h + st.bb + st.hbp);
    return st;
  }
  function pitchGame(s, opponent) {
    const st = blankStats(); st.g = 1; st.starts = s.pitchingRole === 'starter' ? 1 : 0;
    const a = s.attrs;
    st.outs = clamp(Math.round(12 + a.stamina * 0.1 - Math.max(0, s.fatigue - 35) * 0.085 + integer(s, -3, 3)), 6, 24);
    if (!st.starts) st.outs = s.pitchingRole === 'closer' ? 3 : integer(s, 2, 6);
    const quality = (a.velocity + a.control + a.movement + a.composure) / 4;
    const expectedEra = clamp(5.8 - (quality - 40) * 0.055 + Math.max(0, s.fatigue - 35) * 0.035 + (opponent.strength - 55) * 0.035, 1.8, 8.5);
    st.er = poisson(s, expectedEra * st.outs / 27);
    st.ra = st.er + (random(s) < 0.16 ? 1 : 0);
    st.ha = Math.max(st.er, poisson(s, st.outs / 3 * (1.08 - (a.movement - 50) * 0.004)));
    st.bb = poisson(s, st.outs / 3 * clamp(0.42 - (a.control - 40) * 0.005, 0.12, 0.5));
    st.so = Math.min(st.outs, poisson(s, st.outs / 3 * (0.65 + (a.velocity - 40) * 0.01)));
    return st;
  }
  // Continue the round-robin rotation across weeks for 10/12/30 team leagues.
  function pairs(s, day) {
    const ids = s.scheduleTeamIds.slice();
    for (let r = 0; r < day % (ids.length - 1); r++) ids.splice(1, 0, ids.pop());
    return Array.from({ length: ids.length / 2 }, (_, i) => [ids[i], ids[ids.length - 1 - i]]);
  }
  function makePotential(s, seed) {
    const r = {rng:seedValue(String(seed) + ':potential')};
    return {caps:Object.fromEntries(ATTRS[s.role].map(a => [a.key,Math.min(99,Math.max(Math.ceil(s.attrs[a.key]),integer(r,68,99)))])),growthRate:integer(r,65,150)/100,resilience:integer(r,60,140)/100};
  }
  function growAttr(s, key, amount) {
    const gap = s.potential.caps[key] - s.attrs[key];
    const slowdown = clamp(gap / 22, 0.12, 1);
    s.attrs[key] = Math.min(s.potential.caps[key],Math.round((s.attrs[key] + amount * s.potential.growthRate * slowdown * (s.buffs.growth > 0 ? 1.5 : 1)) * 10) / 10);
  }
  function potentialSummary(s) { return {averageCap:Math.round(Object.values(s.potential.caps).reduce((a,b)=>a+b,0)/5),growthRate:s.potential.growthRate,resilience:s.potential.resilience}; }
  function editable(input) { const s = validateSave(input); if(s.phase !== 'active' || s.pendingEvent) fail('진행 중인 주차에서 사건 선택을 마친 뒤 이용해 주세요.'); return s; }
  function changePosition(input,id) {
    const s=editable(input); if(s.role !== 'batter' || !POSITIONS.some(v=>v.id===id)) fail('타자의 수비 위치를 확인해 주세요.');
    if(s.roleChangedWeek || id===s.position) fail('위치는 주 1회 변경할 수 있습니다.');
    s.position=id; s.roleChangedWeek=true; log(s,'수비 위치 변경',POSITIONS.find(v=>v.id===id).name+'로 출전 경쟁을 시작합니다.','choice'); return s;
  }
  function changePitchingRole(input,id) {
    const s=editable(input); if(s.role !== 'pitcher' || !PITCHING_ROLES.some(v=>v.id===id)) fail('투수 역할을 확인해 주세요.');
    if(s.roleChangedWeek || id===s.pitchingRole) fail('역할은 주 1회 변경할 수 있습니다.');
    s.pitchingRole=id; s.roleChangedWeek=true; log(s,'투수 보직 변경',PITCHING_ROLES.find(v=>v.id===id).name+' 보직에서 기회를 노립니다.','choice'); return s;
  }
  function buyItem(input,id) {
    const s=editable(input),item=ITEMS.find(v=>v.id===id); if(!item) fail('아이템을 확인해 주세요.');
    if(s.points<item.price) fail('포인트가 부족합니다.'); if(s.inventory[id]>=99) fail('보유 한도에 도달했습니다.');
    s.points-=item.price; s.inventory[id]++; return s;
  }
  function useItem(input,id) {
    const s=editable(input),item=ITEMS.find(v=>v.id===id); if(!item || !s.inventory[id]) fail('보유한 아이템을 선택해 주세요.');
    if(s.usedItems.length) fail('아이템은 주 1개 사용할 수 있습니다.');
    if(id!=='recovery' && s.buffs[id]>0) fail('이미 같은 아이템 효과가 적용 중입니다.');
    if(id==='recovery' && !s.injury && s.fatigue===0) fail('이미 충분히 회복했습니다.');
    s.inventory[id]--; s.usedItems.push(id);
    if(id==='recovery') {s.fatigue=Math.max(0,s.fatigue-25); if(s.injury && --s.injury.weeks<=0) s.injury=null;}
    else s.buffs[id]=3;
    log(s,item.name+' 사용',item.description,'choice'); return s;
  }
  function weekEvent(s) {
    const events = {
      4: { id: 'coach', title: '감독실의 짧은 면담', body: '감독이 앞으로 어떤 선수로 성장하고 싶은지 묻습니다.', choices: [
        { id: 'opportunity', label: '출전으로 증명하겠습니다', detail: '신뢰 +10 · 사기 +3' },
        { id: 'fundamentals', label: '기본기를 더 다지겠습니다', detail: '전 능력 성장 · 잠재력 적용 · 피로 +5' }] },
      8: { id: 'midseason', title: '시즌의 한가운데', body: '코치가 특별 훈련과 재충전 중 하나를 제안합니다.', choices: [
        { id: 'camp', label: '특별 훈련에 참가한다', detail: '핵심 능력 성장 · 잠재력 적용 · 피로 +16' },
        { id: 'recharge', label: '충분히 쉬고 돌아온다', detail: '피로 -25 · 사기 +10' }] },
      12: { id: 'clubhouse', title: '라커룸의 목소리', body: '순위 경쟁이 치열해졌습니다. 남은 시즌의 태도를 정하세요.', choices: [
        { id: 'teamwork', label: '동료들과 함께 버틴다', detail: '신뢰 +8 · 사기 +8' },
        { id: 'personal', label: '나만의 기술을 완성한다', detail: '핵심·보조 능력 성장 · 잠재력 적용 · 피로 +8' }] }
    };
    return events[s.week] ? clone(events[s.week]) : null;
  }
  function advanceWeek(input, planId) {
    const s = validateSave(input);
    if (s.phase !== 'active') fail('진행 중인 시즌에서만 다음 주로 갈 수 있습니다.');
    if (s.pendingEvent) fail('먼저 현재 사건의 선택을 완료해 주세요.');
    const plan = PLANS[s.role].find(p => p.id === planId);
    if (!plan) fail('훈련 계획을 확인해 주세요.');
    const before = {...s.attrs}, games = [], weekly = blankStats();
    let newInjury = false;
    const risk = clamp((s.fatigue - 35) * 0.006 + Math.max(0,plan.fatigue - 8) * 0.004,0,0.5) / s.potential.resilience * (s.buffs.protection ? 0.35 : 1);
    if (!s.injury && random(s) < risk) { s.injury={name:'근육 피로 부상',weeks:integer(s,2,3)}; newInjury=true; }
    const missed = !!s.injury;
    train(s,plan);
    if (s.fatigue >= 75 || newInjury) {
      const loss = (newInjury ? 1.2 : 0.35) / s.potential.resilience;
      ATTRS[s.role].forEach(a => {s.attrs[a.key]=Math.max(1,Math.round((s.attrs[a.key]-loss)*10)/10);});
    }
    const gains=ATTRS[s.role].map(a=>({key:a.key,delta:Math.round((s.attrs[a.key]-before[a.key])*10)/10})).filter(g=>g.delta!==0);
    s.week++;
    const odds = getOutlook(s).probability * (plan.id === 'rest' ? 0.6 : 1);
    for (let day = 0; day < 7; day++) {
      for (const pair of pairs(s, (s.week - 1) * 7 + day)) {
        const a = team(pair[0]), b = team(pair[1]);
        let aScore = poisson(s, 4.4 + (a.strength - b.strength) * 0.055), bScore = poisson(s, 4.4 + (b.strength - a.strength) * 0.055);
        const involved = pair.includes(s.teamId);
        let player = null;
        if (involved) {
          const isA = a.id === s.teamId, rival = isA ? b : a;
          const eligible = !missed && (s.role === 'batter' || (s.pitchingRole === 'starter' ? (day === 1 || (day === 5 && plan.id !== 'rest')) : s.pitchingRole === 'reliever' ? [0,2,4,6].includes(day) : [1,3,5].includes(day)));
          const played = eligible && random(s) < odds;
          let our = isA ? aScore : bScore, opp = isA ? bScore : aScore;
          if (played) {
            player = s.role === 'batter' ? batGame(s, rival) : pitchGame(s, rival);
            if (s.role === 'batter') our = Math.max(our, player.rbi, player.r);
            else opp = player.ra + poisson(s, (27 - player.outs) / 27 * (4.4 + (rival.strength - team(s.teamId).strength) * 0.035));
          }
          if (our === opp) { if (random(s) < 0.5) our++; else opp++; }
          const won = our > opp;
          let line = missed ? '부상 회복 중' : s.role === 'pitcher' && !eligible ? '등판 휴식' : '출전 대기';
          let highlight = '';
          if (player) {
            if (s.role === 'batter') {
              line = player.ab + '타수 ' + player.h + '안타 · ' + player.hr + '홈런 · ' + player.rbi + '타점';
              highlight = player.hr ? '담장을 넘기는 타구!' : player.h >= 3 ? '뜨거운 타격감, 3안타 이상!' : player.sb ? '빠른 발로 베이스를 훔쳤습니다.' : player.h ? '안타로 기회를 이어갑니다.' : '오늘의 타석을 다음 경기의 경험으로.';
            } else {
              // One decision per appearance; saves and holds require a close team win.
              if (player.starts) {
                if (won && player.outs >= 15 && random(s) < 0.72) player.w = 1;
                if (!won && player.ra > 0 && random(s) < 0.72) player.l = 1;
              } else if (won && our - opp <= 3 && player.ra === 0) {
                if(s.pitchingRole === 'closer') player.sv=1;
                else if(random(s)<0.8) player.hld=1;
              } else if(won && random(s)<0.16) player.w=1;
              else if(!won && player.ra>0 && random(s)<0.3) player.l=1;
              line = rateStats(player, s.role).ip + '이닝 · ' + player.er + '자책 · ' + player.so + '삼진' + (player.sv ? ' · 세이브' : player.hld ? ' · 홀드' : '');
              highlight = player.er === 0 ? '무실점으로 마운드를 지켰습니다.' : player.outs >= 18 && player.er <= 3 ? '퀄리티 스타트! 선발의 역할을 해냈습니다.' : '다음 등판을 위한 과제가 남았습니다.';
            }
            addStats(weekly, player);
          }
          games.push({ opponentId: rival.id, our, opp, result: won ? 'W' : 'L', played, line, highlight });
          aScore = isA ? our : opp; bScore = isA ? opp : our;
        } else if (aScore === bScore) { if (random(s) < 0.5) aScore++; else bScore++; }
        const aRow = s.standings.find(r => r.teamId === a.id), bRow = s.standings.find(r => r.teamId === b.id);
        aRow.rs += aScore; aRow.ra += bScore; bRow.rs += bScore; bRow.ra += aScore;
        if (aScore > bScore) { aRow.w++; bRow.l++; } else { bRow.w++; aRow.l++; }
      }
    }
    addStats(s.stats, weekly); addStats(s.careerStats, weekly);
    s.fatigue = clamp(s.fatigue + (s.role === 'batter' ? weekly.g * 2 : weekly.starts * 7 + (weekly.g - weekly.starts) * 3), 0, 100);
    const performance = s.role === 'batter' ? (weekly.ab ? weekly.h / weekly.ab - 0.24 : 0) * 20 : weekly.outs ? (4.5 - weekly.er * 27 / weekly.outs) * 0.6 : 0;
    s.trust = Math.round(clamp(s.trust + 1 + performance, 0, 100) * 10) / 10;
    const wins = games.filter(g => g.result === 'W').length;
    s.morale = Math.round(clamp(s.morale + (wins - 3.5) * 0.8 + performance * 0.3, 0, 100) * 10) / 10;
    s.totalSalary += s.salary / 16; s.points += 12;
    if(missed) {s.fatigue=clamp(s.fatigue-14,0,100); if(--s.injury.weeks<=0) s.injury=null;}
    // An event belongs to the week just simulated, including its growth bonus.
    if(!weekEvent(s)) s.buffs.growth=Math.max(0,s.buffs.growth-1);
    s.buffs.protection=Math.max(0,s.buffs.protection-1);
    s.usedItems=[]; s.roleChangedWeek=false;
    const summary = [team(s.teamId).short + ' ' + wins + '승 ' + (7 - wins) + '패', s.role === 'batter' ? weekly.g + '경기 출전 · ' + weekly.h + '안타 · ' + weekly.hr + '홈런' : weekly.g + '경기 등판 · ' + weekly.starts + '선발 · ' + rateStats(weekly, s.role).ip + '이닝 · ' + weekly.so + '삼진'];
    if(missed) summary.push(newInjury ? '부상 발생: 이번 주 경기를 쉬며 회복했습니다. 능력 감소를 확인하세요.' : '재활 주간: 출전 없이 훈련 효과 25%로 회복했습니다.');
    if (!weekly.g) summary.push('출전하지 못해도 훈련과 신뢰는 쌓입니다. 회복 후 다음 기회를 준비하세요.');
    if (s.fatigue >= 65) summary.push('피로 경고: 회복 주간으로 컨디션을 관리하세요.');
    s.lastWeek = { games, summary, gains, gamesPlayed: weekly.g };
    log(s, s.week + '주차 리포트', summary.join(' / '), 'week');
    if (s.week === 16) { s.phase = 'seasonEnd'; log(s, '시즌 종료', '112경기의 정규시즌이 끝났습니다. 기록을 확인하고 다음 계약을 선택하세요.', 'season'); }
    else s.pendingEvent = weekEvent(s);
    return s;
  }
  function resolveEvent(input, choiceId) {
    const s = validateSave(input);
    if (s.phase !== 'active' || !s.pendingEvent) fail('선택할 사건이 없습니다.');
    const choice = s.pendingEvent.choices.find(c => c.id === choiceId);
    if (!choice) fail('유효한 사건 선택지를 골라 주세요.');
    const grow = (k, amount) => growAttr(s,k,amount);
    if (choiceId === 'opportunity') { s.trust += 10; s.morale += 3; }
    else if (choiceId === 'fundamentals') { ATTRS[s.role].forEach(a => grow(a.key, 1)); s.fatigue += 5; }
    else if (choiceId === 'camp') { grow(s.style, 3); s.fatigue += 16; }
    else if (choiceId === 'recharge') { s.fatigue -= 25; s.morale += 10; }
    else if (choiceId === 'teamwork') { s.trust += 8; s.morale += 8; }
    else if (choiceId === 'personal') { grow(s.style, 2); grow(s.role === 'batter' ? 'discipline' : 'composure', 2); s.fatigue += 8; }
    ['trust', 'morale', 'fatigue'].forEach(k => { s[k] = clamp(s[k], 0, 100); });
    log(s, s.pendingEvent.title, choice.label + ' — ' + choice.detail, 'choice');
    s.buffs.growth=Math.max(0,s.buffs.growth-1);
    s.pendingEvent = null;
    return s;
  }
  function archive(s) {
    if (s.seasons.some(v => v.season === s.season)) return;
    const row = s.standings.find(v => v.teamId === s.teamId);
    s.seasons.push({ season: s.season, age: s.age, teamId: s.teamId, stats: clone(s.stats), overall: overall(s), wins: row.w, losses: row.l });
  }
  function nextSeason(input, teamId) {
    const s = validateSave(input);
    if (s.phase !== 'seasonEnd') fail('시즌 종료 후에 계약할 수 있습니다.');
    if (s.season === 3) return retire(s);
    if (!team(teamId)) fail('계약할 구단을 선택해 주세요.');
    archive(s);
    const stayed = s.teamId === teamId;
    s.teamId = teamId; s.season++; s.age++; s.week = 0; s.phase = 'active';
    s.salary = Math.round((3200 + Math.max(0, overall(s) - 50) * 240 + s.careerStats.g * 12) * (0.9 + team(teamId).strength / 250) / 100) * 100;
    s.leagueId = team(teamId).leagueId; s.scheduleTeamIds = TEAMS.filter(t => t.leagueId === s.leagueId).map(t => t.id);
    s.stats = blankStats(); s.standings = blankStandings(s.scheduleTeamIds); s.injury = null; s.buffs = {growth:0,protection:0}; s.usedItems=[]; s.roleChangedWeek=false; s.fatigue = 8; s.morale = 72; s.trust = stayed ? Math.max(50, s.trust) : 48;
    s.lastWeek = null; s.pendingEvent = null;
    log(s, stayed ? '같은 유니폼, 새로운 시즌' : '새로운 더그아웃', team(teamId).name + '와 연봉 ' + s.salary.toLocaleString('ko-KR') + '만원에 계약했습니다.', 'contract');
    return s;
  }
  function retire(input) {
    const s = validateSave(input);
    if (s.phase === 'retired') fail('이미 종료된 커리어입니다.');
    if (!s.week && !s.seasons.length) fail('최소 한 주를 진행한 뒤 커리어를 마칠 수 있습니다.');
    if (s.week > 0) archive(s);
    s.phase = 'retired'; s.pendingEvent = null;
    log(s, '나의 야구 연대기', s.name + '의 기록이 커리어 북에 남았습니다.', 'career');
    return s;
  }
  function migrateLegacy(input) {
    const s=legacy.validateSave(input);
    s.version=VERSION; s.teamId=LEGACY_TEAM_MAP[s.teamId]; s.leagueId='kbo';
    s.scheduleTeamIds=s.standings.map(v=>LEGACY_TEAM_MAP[v.teamId]);
    s.standings.forEach(v=>{v.teamId=LEGACY_TEAM_MAP[v.teamId];});
    [s.stats,s.careerStats,...s.seasons.map(v=>v.stats)].forEach(st=>{st.sv=0;st.hld=0;});
    s.seasons.forEach(v=>{v.teamId=LEGACY_TEAM_MAP[v.teamId];});
    if(s.lastWeek) s.lastWeek.games.forEach(v=>{v.opponentId=LEGACY_TEAM_MAP[v.opponentId];});
    s.potential=makePotential(s,s.id+':'+s.rng); s.position=s.role==='batter'?'CF':null; s.pitchingRole=s.role==='pitcher'?'starter':null;
    s.points=120; s.inventory={recovery:0,growth:0,protection:0}; s.buffs={growth:0,protection:0}; s.injury=null; s.usedItems=[]; s.roleChangedWeek=false;
    if(s.pendingEvent) s.pendingEvent=weekEvent(s);
    return s;
  }
  function validateSave(input) {
    if(input && input.version===1) input=migrateLegacy(input);
    const err = label => fail('저장 데이터가 올바르지 않습니다: ' + label);
    const object = (v, keys, label) => {
      if (!v || typeof v !== 'object' || Array.isArray(v) || ![Object.prototype, null].includes(Object.getPrototypeOf(v))) err(label);
      const actual = Object.keys(v);
      if (actual.length !== keys.length || keys.some(k => !Object.hasOwn(v, k))) err(label + ' 필드');
    };
    const number = (n, lo, hi, label, integral) => { if (typeof n !== 'number' || !Number.isFinite(n) || n < lo || n > hi || (integral && !Number.isInteger(n))) err(label); };
    const str = (v, max, label, empty) => { if (typeof v !== 'string' || v.length > max || (!empty && !v.length) || /[\u0000-\u001f\u007f]/.test(v)) err(label); };
    const array = (v, max, label) => { if (!Array.isArray(v) || v.length > max) err(label); };
    const teamId = v => { if (!team(v)) err('구단'); };
    object(input, STATE_KEYS, '전체 구조');
    const s = input;
    if (s.version !== VERSION) err('지원하지 않는 버전');
    str(s.id, 40, '선수 ID'); str(s.name, 20, '선수 이름');
    if (!s.name.trim()) err('선수 이름');
    if (!Object.hasOwn(ATTRS, s.role) || !STYLES[s.role].some(v => v.id === s.style)) err('포지션 / 스타일');
    teamId(s.teamId); number(s.rng, 1, 4294967295, '난수 상태', true);
    number(s.season, 1, 3, '시즌', true); number(s.week, 0, 16, '주차', true);
    if (s.age !== 17 + s.season) err('나이');
    if (!['active', 'seasonEnd', 'retired'].includes(s.phase) || (s.phase === 'active' && s.week === 16) || (s.phase === 'seasonEnd' && s.week !== 16)) err('진행 단계');
    if(!LEAGUES.some(v=>v.id===s.leagueId) || team(s.teamId).leagueId!==s.leagueId) err('리그');
    array(s.scheduleTeamIds,30,'리그 참가 팀');
    const leagueTeams=TEAMS.filter(v=>v.leagueId===s.leagueId).map(v=>v.id);
    const legacyTeams=Object.values(LEGACY_TEAM_MAP);
    if(![leagueTeams.length, ...(s.leagueId==='kbo'?[8]:[])].includes(s.scheduleTeamIds.length) || new Set(s.scheduleTeamIds).size!==s.scheduleTeamIds.length || s.scheduleTeamIds.some(id=>!leagueTeams.includes(id)) || !s.scheduleTeamIds.includes(s.teamId)) err('리그 참가 팀');
    if(s.scheduleTeamIds.length===8 && s.scheduleTeamIds.some(id=>!legacyTeams.includes(id))) err('이전 시즌 참가 팀');
    if(s.role==='batter' ? (!POSITIONS.some(v=>v.id===s.position) || s.pitchingRole!==null) : (!PITCHING_ROLES.some(v=>v.id===s.pitchingRole) || s.position!==null)) err('수비 위치 / 투수 역할');
    object(s.potential,['caps','growthRate','resilience'],'잠재력'); object(s.potential.caps,ATTRS[s.role].map(v=>v.key),'잠재력 상한');
    ATTRS[s.role].forEach(a=>number(s.potential.caps[a.key],1,99,'잠재력 상한',true));
    number(s.potential.growthRate,0.65,1.5,'성장 속도'); number(s.potential.resilience,0.6,1.4,'회복력');
    number(s.points,0,10000,'포인트',true); object(s.inventory,ITEMS.map(v=>v.id),'보관함'); ITEMS.forEach(v=>number(s.inventory[v.id],0,99,'아이템 수',true));
    object(s.buffs,['growth','protection'],'아이템 효과'); ['growth','protection'].forEach(k=>number(s.buffs[k],0,3,'효과 남은 주',true));
    if(s.injury!==null) {object(s.injury,['name','weeks'],'부상'); if(s.injury.name!=='근육 피로 부상') err('부상 종류'); number(s.injury.weeks,1,3,'부상 남은 주',true);}
    array(s.usedItems,1,'사용 아이템'); if(s.usedItems.some(id=>!ITEMS.some(v=>v.id===id))) err('사용 아이템');
    if(typeof s.roleChangedWeek!=='boolean') err('포지션 변경 상태');
    object(s.attrs, ATTRS[s.role].map(a => a.key), '능력');
    ATTRS[s.role].forEach(a => number(s.attrs[a.key], 1, s.potential.caps[a.key], '능력'));
    ['fatigue', 'morale', 'trust'].forEach(k => number(s[k], 0, 100, k));
    number(s.salary, 1, 1000000, '연봉'); number(s.totalSalary, 0, 3000000, '누적 연봉');
    const stats = (v, label, limitGames) => {
      object(v, STAT_KEYS, label); STAT_KEYS.forEach(k => number(v[k], 0, 100000, label + '/' + k, true));
      if (v.g > limitGames || v.h > v.ab || v.doubles + v.triples + v.hr > v.h || v.so > (s.role === 'batter' ? v.ab - v.h : v.outs) || v.pa !== v.ab + v.bb + v.hbp + v.sf && s.role === 'batter') err(label + ' 타격 기록');
      if (v.starts > v.g || v.w + v.l + v.sv + v.hld > v.g || v.sv + v.hld > v.g-v.starts || v.er > v.ra || v.outs > v.g * 27 || v.r > v.h + v.bb + v.hbp || v.hr > v.r || v.hr > v.rbi || v.sb + v.cs > v.h + v.bb + v.hbp - v.hr) err(label + ' 기록 관계');
      if (s.role === 'batter') { if (v.g * 5 < v.pa || ['starts', 'outs', 'ha', 'er', 'ra', 'w', 'l', 'sv', 'hld'].some(k => v[k] !== 0)) err(label + ' 타자 기록'); }
      else if ( ['ab', 'h', 'doubles', 'triples', 'hr', 'hbp', 'sf', 'rbi', 'r', 'sb', 'cs', 'pa'].some(k => v[k] !== 0)) err(label + ' 투수 기록');
    };
    const gamesLimit = s.role === 'batter' ? 7 : 4;
    stats(s.stats, '시즌 기록', s.week * gamesLimit); stats(s.careerStats, '통산 기록', ((s.season - 1) * 16 + s.week) * gamesLimit);
    array(s.seasons, 3, '시즌 이력');
    const previous = blankStats();
    s.seasons.forEach((v, i) => {
      object(v, ['season', 'age', 'teamId', 'stats', 'overall', 'wins', 'losses'], '시즌 이력');
      if (v.season !== i + 1 || v.age !== 18 + i || v.season > s.season) err('시즌 이력 순서');
      teamId(v.teamId); stats(v.stats, '지난 시즌 기록', 16 * gamesLimit);
      number(v.overall, 1, 99, '지난 능력', true); number(v.wins, 0, 112, '승수', true); number(v.losses, 0, 112, '패수', true);
      if (v.season < s.season) { if (v.wins + v.losses !== 112) err('지난 시즌 경기 수'); addStats(previous, v.stats); }
      else { if (s.phase !== 'retired' || v.wins + v.losses !== s.week * 7 || STAT_KEYS.some(k => v.stats[k] !== s.stats[k])) err('은퇴 시즌 기록'); }
    });
    if (s.seasons.length !== s.season - 1 + (s.phase === 'retired' && s.week > 0 ? 1 : 0)) err('시즌 이력 개수');
    STAT_KEYS.forEach(k => { if (s.careerStats[k] !== previous[k] + s.stats[k]) err('통산 기록 합계'); });
    array(s.standings, 30, '순위');
    if (s.standings.length !== s.scheduleTeamIds.length) err('순위 구단 수');
    let w = 0, l = 0, rs = 0, ra = 0;
    s.standings.forEach(v => {
      object(v, ['teamId', 'w', 'l', 'rs', 'ra'], '순위 행'); teamId(v.teamId);
      ['w', 'l'].forEach(k => number(v[k], 0, 112, '팀 승패', true)); ['rs', 'ra'].forEach(k => number(v[k], 0, 10000, '팀 득실점', true));
      if (v.w + v.l !== s.week * 7) err('팀 경기 수');
      w += v.w; l += v.l; rs += v.rs; ra += v.ra;
    });
    if (new Set(s.standings.map(v => v.teamId)).size !== s.scheduleTeamIds.length || s.standings.some(v=>!s.scheduleTeamIds.includes(v.teamId))) err('순위 구단 중복');
    if (w !== l || rs !== ra) err('리그 기록 합계');
    const our = s.standings.find(v => v.teamId === s.teamId);
    if (s.stats.w + s.stats.sv + s.stats.hld > our.w || s.stats.l > our.l || s.stats.r > our.rs || s.stats.rbi > our.rs || s.stats.ra > our.ra) err('선수 / 팀 기록');
    array(s.history, 250, '커리어 로그');
    s.history.forEach(v => {
      object(v, ['season', 'week', 'title', 'text', 'type'], '로그'); number(v.season, 1, s.season, '로그 시즌', true); number(v.week, 0, 16, '로그 주차', true);
      str(v.title, 100, '로그 제목'); str(v.text, 600, '로그 내용');
      if (!['career', 'week', 'choice', 'season', 'contract'].includes(v.type)) err('로그 종류');
    });
    if (s.lastWeek !== null) {
      const v = s.lastWeek;
      object(v, ['games', 'summary', 'gains', 'gamesPlayed'], '주간 결과'); array(v.games, 7, '주간 경기');
      if (v.games.length !== 7 || s.week === 0) err('주간 경기 수');
      v.games.forEach(g => {
        object(g, ['opponentId', 'our', 'opp', 'result', 'played', 'line', 'highlight'], '경기'); teamId(g.opponentId);
        if (g.opponentId === s.teamId || !s.scheduleTeamIds.includes(g.opponentId)) err('경기 상대');
        number(g.our, 0, 100, '득점', true); number(g.opp, 0, 100, '실점', true);
        if (g.our === g.opp || g.result !== (g.our > g.opp ? 'W' : 'L') || typeof g.played !== 'boolean') err('경기 결과');
        str(g.line, 160, '경기 기록'); str(g.highlight, 200, '하이라이트', true);
      });
      number(v.gamesPlayed, 0, gamesLimit, '출전 수', true);
      if (v.gamesPlayed !== v.games.filter(g => g.played).length) err('주간 출전 수');
      array(v.summary, 6, '주간 요약'); v.summary.forEach(t => str(t, 300, '요약'));
      array(v.gains, 5, '성장'); const seen = new Set();
      v.gains.forEach(g => { object(g, ['key', 'delta'], '성장 행'); if (!Object.hasOwn(s.attrs, g.key) || seen.has(g.key)) err('성장 능력'); seen.add(g.key); number(g.delta, -10, 10, '성장량'); });
    } else if (s.week > 0) err('주간 결과 누락');
    if (s.pendingEvent !== null) {
      if (s.phase !== 'active') err('종료 후 사건');
      const expected = weekEvent(s);
      const event = s.pendingEvent;
      object(event, ['id', 'title', 'body', 'choices'], '사건');
      array(event.choices, 2, '사건 선택지');
      if (!expected || event.id !== expected.id || event.title !== expected.title || event.body !== expected.body || event.choices.length !== 2) err('사건 내용');
      event.choices.forEach((v, i) => {
        object(v, ['id', 'label', 'detail'], '사건 선택지');
        if (['id', 'label', 'detail'].some(k => v[k] !== expected.choices[i][k])) err('사건 선택지 내용');
      });
    }
    return clone(s);
  }
  // Public definitions are immutable so UI code cannot change simulation rules accidentally.
  function freeze(value) { Object.values(value).forEach(v => { if (v && typeof v === 'object') freeze(v); }); return Object.freeze(value); }
  [TEAMS, STYLES, ATTRS, PLANS, LEAGUES, POSITIONS, PITCHING_ROLES, ITEMS].forEach(freeze);
  return Object.freeze({ VERSION, TEAMS, LEAGUES, STYLES, ATTRS, PLANS, POSITIONS, PITCHING_ROLES, ITEMS, changePosition, changePitchingRole, buyItem, useItem, potentialSummary, createCareer, advanceWeek, resolveEvent, nextSeason, retire, validateSave, overall, rateStats, getOutlook });
});
