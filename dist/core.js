(function (root, factory) {
  'use strict';
  const api = factory(typeof module === 'object' && module.exports ? require('./league-data.js') : root.DugoutData, typeof module === 'object' && module.exports ? require('./legacy-v2-core.js') : root.DugoutLegacyV2, typeof module === 'object' && module.exports ? require('./schedule-data.js') : root.DugoutScheduleData);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Dugout = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (data, legacy, schedules) {
  'use strict';
  const VERSION = 3;
  const { TEAMS, LEAGUES, LEGACY_TEAM_MAP } = data;
  const SCHOOL_PATHS={kr:{name:'한국',leagueId:'kbo',schools:['서울 한빛고','부산 해강고','인천 청해고','대구 태산고','광주 무등고','대전 새빛고','수원 누리고','제주 바람고']},us:{name:'미국',leagueId:'mlb',schools:['캘리포니아 선셋고','텍사스 프레리 고교','플로리다 팜 고교','애리조나 캐니언 고교','조지아 파인 고교','뉴욕 리버 고교','워싱턴 레이크 고교','오리건 포레스트 고교']},jp:{name:'일본',leagueId:'npb',schools:['도쿄 아오바 고교','오사카 미나토 고교','요코하마 세이요 고교','나고야 메이린 고교','후쿠오카 하쿠요 고교','삿포로 호쿠세이 고교','고베 시오카제 고교','센다이 모리노 고교']}};
  function getSchoolName(id,country='kr'){const i=TEAMS.filter(t=>t.leagueId==='highschool').findIndex(t=>t.id===id);return SCHOOL_PATHS[country]?.schools[i]||team(id)?.name||id;}
  function blankScouting(){return {interest:Object.fromEntries(TEAMS.filter(t=>t.leagueId!=='highschool').map(t=>[t.id,0])),visits:[],declined:[],encounter:null};}
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
    {id:'growth',name:'성장 훈련권',description:'3주 성장 +50% · 35세 이후 노화 감소 35%',price:45,effect:'성장·유지 보조 / 3주'},
    {id:'protection',name:'보호 장비',description:'다음 3주 부상 확률 65% 감소',price:35,effect:'부상 위험 ×0.35 / 3주'}
  ];
  const LIFE_ITEMS = [
    ['bat','맞춤 배트','training',30,'손에 맞춰 제작한 나만의 배트.'],
    ['glove','수제 글러브','training',60,'오래 길들여 함께할 가죽 글러브.'],
    ['shoes','맞춤 스파이크','training',45,'발 모양을 본떠 만든 경기용 스파이크.'],
    ['machine','개인 훈련 머신','training',400,'집에서도 사용할 수 있는 전문 훈련 장비.'],
    ['gym','홈 트레이닝 세트','training',180,'운동 공간을 채울 웨이트 장비.'],
    ['camera','동작 분석 카메라','training',120,'자신의 동작을 남기는 고속 촬영 카메라.'],
    ['headphones','프리미엄 헤드폰','luxury',40,'원정길에 좋아하는 음악과 함께.'],
    ['suit','맞춤 정장','luxury',150,'행사와 특별한 날을 위한 한 벌.'],
    ['watch','명품 시계','luxury',1200,'첫 큰 계약을 기념하는 손목시계.'],
    ['car','스포츠카','luxury',15000,'한번쯤 꿈꾸던 드림카.'],
    ['audio','하이엔드 오디오','luxury',800,'거실을 작은 공연장으로 바꾸는 취향.'],
    ['art','미술 작품','luxury',3000,'마음에 들어 오래 바라보고 싶은 작품.'],
    ['studio','작은 오피스텔','home',8000,'처음으로 마련하는 나만의 공간.'],
    ['apartment','도심 아파트','home',35000,'원정에서 돌아오면 기다리는 보금자리.'],
    ['garden','마당 있는 집','home',60000,'햇볕과 작은 정원이 있는 주택.'],
    ['vacation','바닷가 별장','home',90000,'시즌이 끝나면 찾아갈 바닷가의 집.'],
    ['penthouse','펜트하우스','home',180000,'도시의 야경이 내려다보이는 집.'],
    ['villa','개인 훈련장 주택','home',250000,'넓은 운동 공간을 갖춘 오랜 꿈의 집.']
  ].map(([id,name,category,price,description])=>({id,name,category,price,description}));
  function lifeEffects(s) {
    const effects={growth:1,recovery:0,morale:0};
    for(const owned of s.life.owned){
      const item=LIFE_ITEMS.find(i=>i.id===owned.id),q=owned.quality/100;
      if(item.category==='training')effects.growth+=.015+q*.035;
      if(item.category==='home')effects.recovery+=.2+q*.5;
      if(item.category==='luxury')effects.morale+=.1+q*.25;
    }
    effects.growth=Math.min(1.25,effects.growth);effects.recovery=Math.min(3,effects.recovery);effects.morale=Math.min(2,effects.morale);
    return effects;
  }
  function getLifeShop(s) {
    const owned=new Set(s.life.owned.map(i=>i.id));
    const offers=['training','luxury','home'].flatMap(category=>LIFE_ITEMS.filter(i=>i.category===category&&!owned.has(i.id))
      .sort((a,b)=>seedValue(s.id+':shop:'+s.season+':'+s.week+':'+a.id)-seedValue(s.id+':shop:'+s.season+':'+s.week+':'+b.id)).slice(0,2));
    return {balance:Math.max(0,Math.floor(s.totalSalary)-s.life.spent),spent:s.life.spent,offers:clone(offers),owned:s.life.owned.map(o=>({...LIFE_ITEMS.find(i=>i.id===o.id),season:o.season,week:o.week}))};
  }
  function buyLifeItem(input,id) {
    const s=validateSave(input);
    if(s.stage!=='pro'||s.phase==='retired')fail('프로 선수로 활동 중일 때 구매할 수 있습니다.');
    if(s.life.owned.some(o=>o.id===id))fail('이미 보유한 물건입니다.');
    const shop=getLifeShop(s),item=shop.offers.find(i=>i.id===id);
    if(!item)fail('현재 진열된 물건을 선택해 주세요.');
    if(shop.balance<item.price)fail('보유한 돈이 부족합니다.');
    s.life.owned.push({id,price:item.price,season:s.season,week:s.week,quality:1+seedValue(s.id+':life:'+id)%100});
    s.life.spent+=item.price;
    log(s,'새로운 일상',item.name+' 구입 · '+item.price.toLocaleString('ko-KR')+'만 원','career');
    return s;
  }
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
      { id: 'video', name: '타석 영상 분석', description: '선구안·컨택 성장 · 피로 소폭 회복', fatigue: -4 },
      { id: 'running', name: '베이스 러닝', description: '주력 집중 성장 · 수비 보조 성장', fatigue: 8 },
      { id: 'rest', name: '회복 주간', description: '피로 크게 감소 · 출전 기회와 성장 감소', fatigue: -34 }
    ],
    pitcher: [
      { id: 'balanced', name: '균형 훈련', description: '전 능력 소폭 성장 · 피로 소폭 증가', fatigue: 4 },
      { id: 'velocity', name: '구위 강화', description: '구위·변화구 성장 · 피로 크게 증가', fatigue: 17 },
      { id: 'control', name: '제구 훈련', description: '제구·위기관리 집중 성장 · 피로 증가', fatigue: 10 },
      { id: 'stamina', name: '지구력 훈련', description: '체력 집중 성장 · 감독 신뢰 증가', fatigue: 8 },
      { id: 'video', name: '타자 영상 분석', description: '제구·변화구 성장 · 피로 소폭 회복', fatigue: -4 },
      { id: 'mental', name: '위기관리 훈련', description: '위기관리 집중 성장 · 체력 보조 성장', fatigue: 4 },
      { id: 'rest', name: '회복 주간', description: '피로 크게 감소 · 등판 기회와 성장 감소', fatigue: -34 }
    ]
  };
  const STAT_KEYS = 'ab h doubles triples hr bb hbp sf rbi r sb cs so g pa starts outs ha er ra w l sv hld'.split(' ');
  const STATE_KEYS = 'version id rng name role style teamId age season week phase attrs fatigue morale trust salary totalSalary stats careerStats seasons lastWeek history standings pendingEvent leagueId scheduleTeamIds potential position pitchingRole points inventory buffs injury usedItems roleChangedWeek startAge stage schoolStats schedule contract injuryBurden injurySeasonLoss agingCarry draftTeamId life schoolCountry favoriteTeamId scouting'.split(' ');
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const clone = value => JSON.parse(JSON.stringify(value));
  const team = id => TEAMS.find(t => t.id === id);
  const blankStats = () => Object.fromEntries(STAT_KEYS.map(k => [k, 0]));
  const blankStandings = ids => ids.map(id => team(id)).map(t => ({ teamId: t.id, w: 0, l: 0, t: 0, rs: 0, ra: 0 }));
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
  function log(s, title, text, type) { s.history.push({ season: s.season, week: s.week, title, text, type }); if(s.history.length > 500) s.history.shift(); }
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
    const entry = options.entry === undefined ? 'highschool' : options.entry;
    if(!['highschool','pro'].includes(entry)) fail('시작 경로를 확인해 주세요.');
    const teamId = options.teamId === undefined ? (entry==='highschool' ? 'hs-seoul' : TEAMS.find(t=>t.leagueId===(options.leagueId || 'kbo')).id) : options.teamId;
    if (!STYLES[role].some(v => v.id === style)) fail('선수 스타일을 확인해 주세요.');
    if (!team(teamId)) fail('구단을 확인해 주세요.');
    if((entry==='highschool') !== (team(teamId).leagueId==='highschool')) fail('시작 경로와 구단을 확인해 주세요.');
    const rng = seedValue(options.seed);
    const s = { version: VERSION, id: 'career-' + rng.toString(36), rng, name, role, style, teamId, age: entry==='highschool'?16:19, season: 1, week: 0, phase: 'active',
      attrs: {}, fatigue: 12, morale: 65, trust: 48, salary: entry==='highschool'?0:3200, totalSalary: 0,
      stats: blankStats(), careerStats: blankStats(), seasons: [], lastWeek: null, history: [], standings: [], pendingEvent: null, leagueId: team(teamId).leagueId, scheduleTeamIds: TEAMS.filter(t => t.leagueId === team(teamId).leagueId).map(t => t.id), potential: null, position: role === 'batter' ? (options.position || 'CF') : null, pitchingRole: role === 'pitcher' ? (options.pitchingRole || 'starter') : null, points:120, inventory:{recovery:0,growth:0,protection:0}, buffs:{growth:0,protection:0}, injury:null, usedItems:[], roleChangedWeek:false, startAge:entry==='highschool'?16:19, stage:entry, schoolStats:blankStats(), schedule:null, contract:null, injuryBurden:0, injurySeasonLoss:0, agingCarry:{}, draftTeamId:null };
    ATTRS[role].forEach(a => { s.attrs[a.key] = integer(s, entry==='highschool'?28:46, entry==='highschool'?35:53); });
    s.attrs[style] += 11;
    if (style === 'contact') s.attrs.discipline += 5;
    if (style === 'power') s.attrs.contact += 5;
    if (style === 'speed') s.attrs.fielding += 5;
    if (style === 'velocity') s.attrs.movement += 5;
    if (style === 'control') s.attrs.stamina += 5;
    if (style === 'movement') s.attrs.composure += 5;
    if (options.leagueId && options.leagueId !== s.leagueId) fail('리그와 구단을 확인해 주세요.');
    if (role === 'batter' ? !POSITIONS.some(v => v.id === s.position) : !PITCHING_ROLES.some(v => v.id === s.pitchingRole)) fail('수비 위치 / 투수 역할을 확인해 주세요.');
    s.life={owned:[],spent:0};s.schoolCountry=options.schoolCountry||'kr';s.favoriteTeamId=options.favoriteTeamId||null;s.scouting=blankScouting();
    if(!Object.hasOwn(SCHOOL_PATHS,s.schoolCountry))fail('고교 시작 국가를 확인해 주세요.');
    if(s.favoriteTeamId&&(!team(s.favoriteTeamId)||team(s.favoriteTeamId).leagueId==='highschool'))fail('선호 구단을 확인해 주세요.');
    s.potential = makePotential(s, s.rng); s.standings = blankStandings(s.scheduleTeamIds);
    s.agingCarry=Object.fromEntries(ATTRS[role].map(a=>[a.key,0])); s.schedule=makeSchedule(s); if(s.stage==='pro') s.contract=newContract(s,1); s.salary=s.contract?s.contract.annualSalary:0;
    log(s, s.stage==='highschool'?'고교 야구의 첫 페이지':'프로의 첫 페이지', (s.stage==='highschool'?getSchoolName(teamId,s.schoolCountry):team(teamId).name) + '에서 ' + s.age + '세 선수의 시즌이 시작됩니다.', 'career');
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
    else if (plan.id === 'video') { grow(s.role==='batter'?'discipline':'control',1.5); grow(s.role==='batter'?'contact':'movement',.8); }
    else if (plan.id === 'running') { grow('speed',2.3); grow('fielding',.6); }
    else if (plan.id === 'mental') { grow('composure',2); grow('stamina',.8); }
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
  const scheduleCache = new Map();
  const LEAGUE_RULES = Object.freeze({
    kbo:Object.freeze({label:'KBO',regulation:9,maxInnings:11,automaticRunner:false,ties:true,description:'정규 9회 · 연장 11회까지 · 이후 동점이면 무승부'}),
    npb:Object.freeze({label:'NPB',regulation:9,maxInnings:12,automaticRunner:false,ties:true,description:'정규 9회 · 연장 12회까지 · 이후 동점이면 무승부'}),
    mlb:Object.freeze({label:'MLB',regulation:9,maxInnings:null,automaticRunner:true,ties:false,description:'정규 9회 · 연장부터 무사 2루 승부치기 · 무승부 없음'}),
    highschool:Object.freeze({label:'가상 고교',regulation:9,maxInnings:null,automaticRunner:true,ties:false,description:'게임 규칙: 정규 9회 · 연장 승부치기로 승패 결정'})
  });
  function getLeagueRules(leagueId){if(!LEAGUE_RULES[leagueId])fail('리그를 확인해 주세요.');return LEAGUE_RULES[leagueId];}
  function finishTiedGame(s,home,away,homeStrength,awayStrength) {
    if(home!==away)return {home,away,note:'',extra:false};
    const rule=getLeagueRules(s.leagueId);
    let inning=9;
    while(home===away&&inning<(rule.maxInnings||99)){
      inning++;
      const mean=rule.automaticRunner ? .95 : .45;
      const top=poisson(s,mean+(awayStrength-homeStrength)*.003);
      const bottom=poisson(s,mean+(homeStrength-awayStrength)*.003);
      away+=top;
      // A non-homer walk-off ends the game as soon as the home side takes the lead.
      home+=bottom>top?top+1:bottom;
    }
    // Finite simulation guard for leagues without an innings limit.
    if(home===away&&!rule.ties){if(random(s)<.5)home++;else away++;}
    return {home,away,extra:true,note:'연장 '+inning+'회'+(rule.automaticRunner?' · 승부치기':'')+(home===away?' · 무승부':home>away?' · 끝내기':' · 원정 승리')};
  }
  function roundPairs(ids,day) {
    ids=ids.slice(); for(let r=0;r<day%(ids.length-1);r++)ids.splice(1,0,ids.pop());
    return Array.from({length:ids.length/2},(_,i)=>[ids[i],ids[ids.length-1-i]]);
  }
  const dateAt=(date,days)=>new Date(Date.parse(date+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);
  const fixtureKey=g=>[g.date,g.home,g.away,g.gameNumber||1].join('|');
  function getSeasonSchedule(s) {
    const kind=s.schedule?s.schedule.kind:'standard',year=s.schedule?s.schedule.year:2026+s.season-1;
    const key=[s.leagueId,year,kind,...s.scheduleTeamIds].join('|');
    if(scheduleCache.has(key))return scheduleCache.get(key);
    let result;
    if(kind==='legacy') {
      const openingDate=year+'-03-01',games=[];
      for(let day=0;day<112;day++)for(const [home,away]of roundPairs(s.scheduleTeamIds,day))games.push({date:dateAt(openingDate,day),home,away});
      result={games,gamesPerTeam:112,openingDate,endDate:dateAt(openingDate,111),sourceMode:'legacy',notes:'이전 저장의 현재 시즌은 기존 112경기 형식을 유지합니다.'};
    } else result=schedules.createSchedule(s.leagueId,year,s.scheduleTeamIds);
    const totalWeeks=Math.floor((Date.parse(result.endDate)-Date.parse(result.openingDate))/604800000)+1;
    const weeks=Array.from({length:totalWeeks},(_,i)=>({startDate:dateAt(result.openingDate,i*7),endDate:dateAt(result.openingDate,i*7+6),games:[]}));
    result.games.forEach(g=>weeks[Math.floor((Date.parse(g.date)-Date.parse(result.openingDate))/604800000)].games.push(g));
    // Rotation slots follow calendar days, including doubleheaders and week boundaries.
    const starterSlots=Object.fromEntries(s.scheduleTeamIds.map(id=>[id,[]]));
    const lastStartDate=Object.fromEntries(s.scheduleTeamIds.map(id=>[id,-Infinity]));
    result.games.forEach(g=>{
      const day=Date.parse(g.date)/86400000;
      [g.home,g.away].forEach(id=>{if(day-lastStartDate[id]>=5){starterSlots[id].push(fixtureKey(g));lastStartDate[id]=day;}});
    });
    const value=freeze({...result,weeks,starterSlots}); scheduleCache.set(key,value);return value;
  }
  function makeSchedule(s) {
    const q=getSeasonSchedule(s);return {kind:s.schedule?s.schedule.kind:'standard',year:s.schedule?s.schedule.year:2026+s.season-1,gamesPerTeam:q.games.filter(g=>g.home===s.teamId||g.away===s.teamId).length,weekCount:q.weeks.length,openingDate:q.openingDate,endDate:q.endDate,sourceMode:q.sourceMode,notes:typeof q.notes==='string'?q.notes:JSON.stringify(q.notes)};
  }
  function ageDevelopment(age,potential,injuryBurden=0) {
    const averageCap=Object.values(potential.caps).reduce((a,b)=>a+b,0)/5;
    const budget=age<19?25:age<24?22:age<27?18:age<30?14:0;
    const annualDecline=age<35?0:clamp(2+(age-35)*.9+Math.max(0,95-averageCap)*.12+Math.max(0,1.2-potential.growthRate)*3+(1.1-potential.resilience)*2+Math.min(20,injuryBurden)*.05,1,12);
    return {growthBudget:budget,annualDecline};
  }
  function makePotential(s, seed) {
    const r = {rng:seedValue(String(seed) + ':potential')};
    // A single hidden talent roll lets exceptional players reach 99 in every skill.
    const ceiling=integer(r,0,99)>=65?99:integer(r,82,98);
    return {caps:Object.fromEntries(ATTRS[s.role].map(a => [a.key,Math.max(Math.ceil(s.attrs[a.key]),ceiling)])),growthRate:integer(r,85,150)/100,resilience:integer(r,60,140)/100};
  }
  function growAttr(s,key,amount) {
    if(s.age>=30)return;
    const gap=s.potential.caps[key]-s.attrs[key],slowdown=clamp(gap/12,0.6,1);
    const yearFactor=ageDevelopment(s.age,s.potential,s.injuryBurden).growthBudget/s.schedule.weekCount;
    s.attrs[key]=Math.min(s.potential.caps[key],Math.round((s.attrs[key]+amount*yearFactor*s.potential.growthRate*slowdown*(s.buffs.growth?1.5:1)*lifeEffects(s).growth)*100)/100);
  }
  function applyAging(s,plan) {
    const annual=ageDevelopment(s.age,s.potential,s.injuryBurden).annualDecline;
    if(!annual)return;
    const maintenance=plan.id==='balanced'?0.6:plan.id==='rest'?0.85:0.75;
    ATTRS[s.role].forEach(a=>{
      s.agingCarry[a.key]+=annual*maintenance*(s.buffs.growth?0.65:1)/s.schedule.weekCount;
      const loss=Math.floor((s.agingCarry[a.key]+1e-9)*100)/100;
      s.agingCarry[a.key]=Math.max(0,s.agingCarry[a.key]-loss);
      s.attrs[a.key]=Math.max(1,Math.round((s.attrs[a.key]-loss)*100)/100);
    });
  }
  function potentialSummary(s) { return {averageCap:Math.round(Object.values(s.potential.caps).reduce((a,b)=>a+b,0)/5),growthRate:s.potential.growthRate,resilience:s.potential.resilience}; }
  function getRetirementStatus(s) {
    const rating=overall(s),recommended=s.stage==='pro'&&s.age>=35&&rating<60&&s.phase==='seasonEnd';
    return {recommended,rating,threshold:60,detail:recommended?team(s.teamId).name+'에서 은퇴를 권고했습니다. 지금까지의 기록으로 커리어를 마무리하거나 다음 시즌에 다시 도전할 수 있습니다.':'35세부터 기량이 하락하며, 시즌 종료 시 종합 능력 60 미만이면 구단의 은퇴 권고를 받습니다.'};
  }
  function getCareerAssessment(s) {
    const leagues=['kbo','npb','mlb'].map(leagueId=>{
      const rows=s.seasons.filter(v=>v.leagueId===leagueId),stats=blankStats();
      rows.forEach(v=>addStats(stats,v.stats));
      const hasCurrent=rows.some(v=>v.season===s.season);
      if(s.stage==='pro'&&s.leagueId===leagueId&&s.week>0&&!hasCurrent)addStats(stats,s.stats);
      const seasons=rows.filter(v=>v.season<s.season||s.week===s.schedule.weekCount).length+(!hasCurrent&&s.leagueId===leagueId&&s.stage==='pro'&&s.week===s.schedule.weekCount?1:0);
      const label=leagueId.toUpperCase(),batter=s.role==='batter';
      const hall=leagueId==='mlb'&&seasons>=10&&(batter?stats.h>=3000||stats.hr>=500:stats.w>=200||stats.so>=2500||stats.sv>=400);
      const legend=seasons>=10&&(batter?stats.h>=2000||stats.hr>=300:stats.w>=150||stats.so>=2000||stats.sv>=250||stats.hld>=300);
      const star=seasons>=7&&(batter?stats.h>=1000||stats.hr>=150:stats.w>=75||stats.so>=1000||stats.sv>=120||stats.hld>=150);
      const regular=seasons>=5&&(batter?stats.g>=500:stats.outs>=1500||stats.g>=200);
      const tier=hall?5:legend?4:star?3:regular?2:seasons>=3||stats.g>=200?1:0;
      const title=hall?'MLB 명예의 전당':label+' '+['짧은 프로 커리어','평범한 프로 선수','꾸준한 주전 선수','리그 스타','레전드'][tier];
      const metrics=batter?[['완료 시즌',seasons,10],['안타',stats.h,hall?3000:2000],['홈런',stats.hr,hall?500:300]]:[['완료 시즌',seasons,10],['승리',stats.w,150],['탈삼진',stats.so,2000],['세이브',stats.sv,250],['홀드',stats.hld,300]];
      const awards=leagueId==='mlb'&&s.role==='pitcher'?careerGoal(s).awards.length:0;
      return {leagueId,label,title,tier,seasons,stats,metrics,awards};
    });
    const played=leagues.filter(l=>l.stats.g>0||l.seasons>0);
    const ranked=played.slice().sort((a,b)=>b.tier-a.tier||b.stats.g-a.stats.g);
    const best=ranked[0],legends=played.filter(l=>l.tier===4);
    const title=best?.tier===5?best.title:legends.length>1?legends.map(l=>l.label).join('·')+' 레전드':best?.title||'짧은 야구 여정';
    const tier=best?.tier||0;
    const descriptions=['프로 무대에 남긴 첫 발자취도 당신의 야구 인생입니다.','화려한 기록보다, 자신의 자리를 찾아 뛰었던 야구 인생입니다.','오랜 시즌 팀의 한 자리를 지킨 꾸준함이 남았습니다.','동시대 팬들에게 이름을 각인시킨 리그의 스타입니다.','한 리그의 역사를 함께 쓴 선수로 기억됩니다.','메이저리그의 역사에 이름을 남겼습니다.'];
    return {title,tier,description:descriptions[tier],leagues,played};
  }
  function advanceWeeks(input, planId, count=4) {
    if(!Number.isInteger(count)||count<1||count>60)fail('진행 기간을 확인해 주세요.');
    let s=validateSave(input), weeks=0, recoveries=0;
    if(!PLANS[s.role].some(p=>p.id===planId))fail('훈련 계획을 확인해 주세요.');
    const before={...s.attrs};
    let games=0;
    while(weeks<count&&s.phase==='active'&&!s.pendingEvent) {
      const recover=count>1&&(s.fatigue>=60||s.injury);
      s=advanceWeek(s,recover?'rest':planId);weeks++;if(recover)recoveries++;
      games+=s.lastWeek.gamesPlayed;
      if(s.scouting.encounter)break;
      // Keep the normal weekly report and save schema intact.
    }
    return {state:s,weeks,recoveries,games,gains:ATTRS[s.role].map(a=>({key:a.key,delta:Math.round((s.attrs[a.key]-before[a.key])*100)/100}))};
  }
  function careerGoal(s) {
    const rows=s.seasons.filter(v=>v.leagueId==='mlb');
    if(s.leagueId==='mlb'&&!rows.some(v=>v.season===s.season)&&s.week>0)
      rows.push({season:s.season,stats:s.stats,complete:s.week===s.schedule.weekCount});
    const complete=rows.filter(v=>v.complete===true||(v.complete!==false&&(v.season<s.season||s.week===s.schedule.weekCount)));
    const totals=blankStats();rows.forEach(v=>addStats(totals,v.stats));
    const qualifies=st=>st.outs>=540&&st.er*27/st.outs<=2.8&&st.so>=200||st.outs>=180&&st.sv>=40&&st.er*27/st.outs<=2;
    if(s.role==='pitcher') {
      const awards=complete.filter(v=>qualifies(v.stats)).map(v=>v.season);
      const current=s.leagueId==='mlb'?s.stats:blankStats();
      return {title:'사이영상',achieved:awards.length>0,awards,metrics:[['MLB 수상 시즌',awards.length,1],['이번 시즌 이닝',Math.floor(current.outs/3),s.pitchingRole==='starter'?180:60],s.pitchingRole==='starter'?['이번 시즌 탈삼진',current.so,200]:['이번 시즌 세이브',current.sv,40]],detail:'게임 수상 기준: MLB 한 시즌 180이닝·200탈삼진·ERA 2.80 이하 또는 60이닝·40세이브·ERA 2.00 이하. 시즌 종료 때 확정됩니다.'};
    }
    const eligible=complete.length>=10&&(totals.h>=3000||totals.hr>=500);
    return {title:'미국 명예의 전당',achieved:s.phase==='retired'&&eligible,eligible,metrics:[['MLB 완료 시즌',complete.length,10],['MLB 통산 안타',totals.h,3000],['MLB 통산 홈런',totals.hr,500]],detail:'게임 입성 기준: MLB 10시즌과 통산 3,000안타 또는 500홈런. 은퇴 시 입성이 확정됩니다. 실제 투표 제도는 생략합니다.'};
  }
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
  const EXTRA_EVENTS = [
    ['film','상대의 약점이 보인다','다음 상대의 영상을 보며 공략법을 정합니다.',
      ['film-study','분석실에서 패턴을 찾는다','선구안/제구 성장 · 피로 +4'],
      ['team-scout','분석 내용을 동료들과 나눈다','신뢰 +8 · 사기 +5'], 'fundamentals'],
    ['slump','흔들리는 감각','좋았던 감각을 찾기 위해 코치가 세 가지 접근을 제안합니다.',
      ['reset-form','폼을 점검하고 기본기로 돌아간다','컨택/제구 성장 · 피로 +6'],
      ['mental-reset','스포츠 심리 상담을 받는다','사기 +15 · 피로 -8'], 'recharge'],
    ['scout','관중석의 스카우트','경기장에 스카우트가 찾아왔습니다. 무엇을 보여줄까요?',
      ['showcase','장점을 집중적으로 다듬는다','주특기 성장 · 피로 +14'],
      ['professional','꾸준한 준비와 팀 플레이로 답한다','신뢰 +12 · 사기 +4'], 'personal'],
    ['recovery','트레이너의 경고','시즌을 오래 버티려면 훈련 방식도 바꿔야 합니다.',
      ['prehab','예방 운동 프로그램을 따른다','3주 부상 예방 · 피로 -8'],
      ['nutrition','영양과 수면 계획을 조정한다','피로 -18 · 사기 +6'], 'fundamentals'],
    ['mentor','베테랑의 노하우','선배가 자신만의 루틴을 알려주겠다고 합니다.',
      ['mentor-skill','개인 레슨을 받는다','수비/변화구 성장 · 피로 +8'],
      ['mentor-lead','후배들과 함께 레슨을 듣는다','신뢰 +10 · 사기 +8'], 'recharge'],
    ['pressure','중요한 경기의 부담','순위 경쟁 속에서 코치가 준비 방향을 묻습니다.',
      ['clutch','승부처 대응을 집중 훈련한다','선구안/위기관리 성장 · 피로 +10'],
      ['routine','평소 루틴을 지킨다','신뢰 +6 · 피로 -10'], 'personal'],
    ['community','팬들이 보내온 응원','응원 편지를 받은 구단에서 팬 행사를 제안합니다.',
      ['fan-day','팬 행사에 참여한다','사기 +18 · 신뢰 +5 · 피로 +8'],
      ['quiet-focus','개인 훈련에 집중한다','주특기 성장 · 피로 +6'], 'recharge'],
    ['competition','새로운 주전 경쟁','팀 동료의 활약으로 출전 경쟁이 치열해졌습니다.',
      ['extra-work','약점을 보완하는 추가 훈련','가장 낮은 능력 성장 · 피로 +12'],
      ['team-role','감독과 팀 내 역할을 의논한다','신뢰 +14 · 사기 +3'], 'fundamentals'],
    ['camp-invite','전문 훈련실의 초대','구단이 짧은 집중 프로그램을 지원합니다.',
      ['growth-camp','성장 프로그램에 참여한다','3주 성장 보조 · 피로 +10'],
      ['safe-camp','몸 관리 프로그램을 선택한다','3주 부상 예방 · 피로 -5'], 'recharge'],
    ['rival','라이벌의 활약','동기 선수의 좋은 성적이 자극이 됐습니다.',
      ['rival-chase','주특기를 더욱 날카롭게 만든다','주특기 성장 · 사기 +5 · 피로 +12'],
      ['rival-learn','서로 훈련법을 공유한다','신뢰 +8 · 가장 낮은 능력 성장 · 피로 +5'], 'personal']
  ];
  const EVENT_EFFECTS = {
    'film-study':{skill:'analysis',growth:2,fatigue:4},'team-scout':{trust:8,morale:5},
    'reset-form':{skill:'accuracy',growth:2.2,fatigue:6},'mental-reset':{morale:15,fatigue:-8},
    showcase:{skill:'style',growth:3.5,fatigue:14},professional:{trust:12,morale:4},
    prehab:{protection:3,fatigue:-8},nutrition:{fatigue:-18,morale:6},
    'mentor-skill':{skill:'defense',growth:2.5,fatigue:8},'mentor-lead':{trust:10,morale:8},
    clutch:{skill:'mental',growth:3,fatigue:10},routine:{trust:6,fatigue:-10},
    'fan-day':{morale:18,trust:5,fatigue:8},'quiet-focus':{skill:'style',growth:2,fatigue:6},
    'extra-work':{skill:'weakest',growth:3,fatigue:12},'team-role':{trust:14,morale:3},
    'growth-camp':{buff:3,fatigue:10},'safe-camp':{protection:3,fatigue:-5},
    'rival-chase':{skill:'style',growth:3,fatigue:12,morale:5},'rival-learn':{skill:'weakest',growth:1.5,fatigue:5,trust:8}
  };
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
    const marks=[Math.max(1,Math.round(s.schedule.weekCount*.25)),Math.max(2,Math.round(s.schedule.weekCount*.5)),Math.max(3,Math.round(s.schedule.weekCount*.75))];
    const eventWeek=[4,8,12][marks.indexOf(s.week)];
    if(events[eventWeek])return clone(events[eventWeek]);
    const slots=[.125,.375,.625,.875].map(f=>Math.max(1,Math.round(s.schedule.weekCount*f)));
    const index=slots.indexOf(s.week);
    if(index<0||s.week>=s.schedule.weekCount)return null;
    const offset=seedValue(s.id+':events')%EXTRA_EVENTS.length;
    const [id,title,body,a,b,fallback]=EXTRA_EVENTS[(offset+(s.season-1)*4+index)%EXTRA_EVENTS.length];
    const known=Object.values(events).flatMap(e=>e.choices).find(c=>c.id===fallback);
    return {id,title,body,choices:[a,b].map(([id,label,detail])=>({id,label,detail})).concat(clone(known))};
  }
  function advanceWeek(input, planId) {
    const s = validateSave(input);
    if (s.phase !== 'active') fail('진행 중인 시즌에서만 다음 주로 갈 수 있습니다.');
    if (s.pendingEvent) fail('먼저 현재 사건의 선택을 완료해 주세요.');
    const plan = PLANS[s.role].find(p => p.id === planId);
    if (!plan) fail('훈련 계획을 확인해 주세요.');
    const before = {...s.attrs}, games = [], weekly = blankStats();
    let newInjury = false;
    const risk = clamp((s.fatigue - 55) * 0.0015 + Math.max(0,plan.fatigue - 10) * 0.001,0,0.075) / s.potential.resilience * (s.buffs.protection ? 0.35 : 1);
    if (!s.injury && random(s) < risk) { s.injury={name:'근육 피로 부상',weeks:integer(s,1,2)}; newInjury=true; }
    const missed = !!s.injury;
    train(s,plan);
    if(newInjury) {
      s.injuryBurden++;
      const affected=s.role==='batter'?['speed','fielding']:['velocity','stamina'];
      affected.forEach(key=>{
        const loss=Math.min(0.4,Math.max(0,2-s.injurySeasonLoss),Math.round(clamp(integer(s,10,28)/100/s.potential.resilience,0.1,0.35)*100)/100,s.attrs[key]-1);
        s.attrs[key]=Math.round((s.attrs[key]-loss)*100)/100;s.injurySeasonLoss=Math.round((s.injurySeasonLoss+loss)*100)/100;
      });
    }
    applyAging(s,plan);
    const gains=ATTRS[s.role].map(a=>({key:a.key,delta:Math.round((s.attrs[a.key]-before[a.key])*100)/100})).filter(g=>g.delta!==0);
    s.week++;s.scouting.encounter=null;
    const odds = getOutlook(s).probability * (plan.id === 'rest' ? 0.6 : 1);
    let playerGameIndex=-1;
    for (const fixture of getSeasonSchedule(s).weeks[s.week-1].games) {
      const pair=[fixture.home,fixture.away];
      {
        const a = team(pair[0]), b = team(pair[1]);
        let aScore = poisson(s, 4.4 + (a.strength - b.strength) * 0.055), bScore = poisson(s, 4.4 + (b.strength - a.strength) * 0.055);
        const involved = pair.includes(s.teamId);
        let player = null;
        if (involved) {
          const isA = a.id === s.teamId, rival = isA ? b : a; const day=++playerGameIndex;
          const eligible = !missed && (s.role === 'batter' || (s.pitchingRole === 'starter' ? getSeasonSchedule(s).starterSlots[s.teamId].includes(fixtureKey(fixture)) && (plan.id !== 'rest' || weekly.starts===0) : s.pitchingRole === 'reliever' ? [0,2,4,6].includes(day) : [0,2,4].includes(day)));
          const played = eligible && random(s) < odds;
          let our = isA ? aScore : bScore, opp = isA ? bScore : aScore, defensivePlay=false;
          if (played) {
            player = s.role === 'batter' ? batGame(s, rival) : pitchGame(s, rival);
            if (s.role === 'batter') {
              our = Math.max(our, player.rbi, player.r);
              if(s.position!=='DH'&&opp>0&&random(s)<s.attrs.fielding*.0025){opp--;defensivePlay=true;}
            }
            else opp = player.ra + poisson(s, (27 - player.outs) / 27 * (4.4 + (rival.strength - team(s.teamId).strength) * 0.035));
          }
          const decision=finishTiedGame(s,isA?our:opp,isA?opp:our,a.strength,b.strength);
          our=isA?decision.home:decision.away;opp=isA?decision.away:decision.home;
          const won = our > opp;
          let line = missed ? '부상 회복 중' : s.role === 'pitcher' && !eligible ? '등판 휴식' : '출전 대기';
          let highlight = '';
          if (player) {
            if (s.role === 'batter') {
              line = player.ab + '타수 ' + player.h + '안타 · ' + player.hr + '홈런 · ' + player.rbi + '타점';
              highlight = player.hr ? '담장을 넘기는 타구!' : player.h >= 3 ? '뜨거운 타격감, 3안타 이상!' : player.sb ? '빠른 발로 베이스를 훔쳤습니다.' : player.h ? '안타로 기회를 이어갑니다.' : '오늘의 타석을 다음 경기의 경험으로.';
              if(defensivePlay)highlight+=' 호수비로 1실점을 막았습니다!';
            } else {
              // One decision per appearance; saves and holds require a close team win.
              if (player.starts) {
                if (!decision.extra && won && player.outs >= 15 && random(s) < 0.72) player.w = 1;
                if (!decision.extra && our<opp && player.ra > 0 && random(s) < 0.72) player.l = 1;
              } else if (!decision.extra && won && our - opp <= 3 && player.ra === 0) {
                if(s.pitchingRole === 'closer') player.sv=1;
                else if(random(s)<0.8) player.hld=1;
              } else if(!decision.extra && won && random(s)<0.16) player.w=1;
              else if(!decision.extra && our<opp && player.ra>0 && random(s)<0.3) player.l=1;
              line = rateStats(player, s.role).ip + '이닝 · ' + player.er + '자책 · ' + player.so + '삼진' + (player.sv ? ' · 세이브' : player.hld ? ' · 홀드' : '');
              highlight = player.er === 0 ? '무실점으로 마운드를 지켰습니다.' : player.outs >= 18 && player.er <= 3 ? '퀄리티 스타트! 선발의 역할을 해냈습니다.' : '다음 등판을 위한 과제가 남았습니다.';
            }
            addStats(weekly, player);
          }
          if(decision.note)line+=' · '+decision.note;
          games.push({ date:fixture.date, opponentId: rival.id, our, opp, result: won ? 'W' : our===opp?'D':'L', played, line, highlight });
          aScore = isA ? our : opp; bScore = isA ? opp : our;
        } else {const decision=finishTiedGame(s,aScore,bScore,a.strength,b.strength);aScore=decision.home;bScore=decision.away;}
        const aRow = s.standings.find(r => r.teamId === a.id), bRow = s.standings.find(r => r.teamId === b.id);
        aRow.rs += aScore; aRow.ra += bScore; bRow.rs += bScore; bRow.ra += aScore;
        if (aScore > bScore) { aRow.w++; bRow.l++; } else if(bScore>aScore) { bRow.w++; aRow.l++; } else {aRow.t++;bRow.t++;}
      }
    }
    addStats(s.stats, weekly); addStats(s.stage==='highschool'?s.schoolStats:s.careerStats, weekly);
    s.fatigue = clamp(s.fatigue + (s.role === 'batter' ? weekly.g * 2 : weekly.starts * 7 + (weekly.g - weekly.starts) * 3), 0, 100);
    const performance = s.role === 'batter' ? (weekly.ab ? weekly.h / weekly.ab - 0.24 : 0) * 20 : weekly.outs ? (4.5 - weekly.er * 27 / weekly.outs) * 0.6 : 0;
    s.trust = Math.round(clamp(s.trust + 1 + performance, 0, 100) * 10) / 10;
    const wins = games.filter(g => g.result === 'W').length;
    s.morale = Math.round(clamp(s.morale + (wins - games.length/2) * 0.8 + performance * 0.3, 0, 100) * 10) / 10;
    s.totalSalary += s.salary / s.schedule.weekCount; s.points += 12;
    const lifestyle=lifeEffects(s);
    s.fatigue=Math.round(clamp(s.fatigue-lifestyle.recovery,0,100)*100)/100;
    s.morale=Math.round(clamp(s.morale+lifestyle.morale,0,100)*100)/100;
    if(missed) {s.fatigue=clamp(s.fatigue-14,0,100); if(--s.injury.weeks<=0) s.injury=null;}
    // An event belongs to the week just simulated, including its growth bonus.
    if(!weekEvent(s)) s.buffs.growth=Math.max(0,s.buffs.growth-1);
    s.buffs.protection=Math.max(0,s.buffs.protection-1);
    s.usedItems=[]; s.roleChangedWeek=false;
    const summary = [team(s.teamId).short + ' ' + wins + '승 ' + games.filter(g=>g.result==='L').length + '패 ' + games.filter(g=>g.result==='D').length + '무', s.role === 'batter' ? weekly.g + '경기 출전 · ' + weekly.h + '안타 · ' + weekly.hr + '홈런' : weekly.g + '경기 등판 · ' + weekly.starts + '선발 · ' + rateStats(weekly, s.role).ip + '이닝 · ' + weekly.so + '삼진'];
    if(missed) summary.push(newInjury ? '부상 발생: 이번 주 경기를 쉬며 회복했습니다. 능력 감소를 확인하세요.' : '재활 주간: 출전 없이 훈련 효과 25%로 회복했습니다.');
    if (!weekly.g) summary.push('출전하지 못해도 훈련과 신뢰는 쌓입니다. 회복 후 다음 기회를 준비하세요.');
    if (s.fatigue >= 65) summary.push('피로 경고: 회복 주간으로 컨디션을 관리하세요.');
    s.lastWeek = { games, summary, gains, gamesPlayed: weekly.g };
    const visit=recordScoutVisit(s);
    if(visit)s.lastWeek.summary.push(team(visit.teamId).name+' '+(visit.kind==='analyst'?'전력분석관':'스카우트')+'이 경기를 관찰했습니다.');
    log(s, s.week + '주차 리포트', summary.join(' / '), 'week');
    if (s.week === s.schedule.weekCount) { s.phase = 'seasonEnd'; if(s.stage==='highschool'&&s.age===18)s.draftTeamId=selectDraftTeam(s); log(s, '시즌 종료', s.schedule.gamesPerTeam+'경기의 시즌이 끝났습니다. 기록과 다음 시즌 진로를 확인하세요.', 'season'); const retirement=getRetirementStatus(s);if(retirement.recommended)log(s,'구단의 은퇴 권고',retirement.detail,'career'); }
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
    const effect=EVENT_EFFECTS[choiceId];
    if(effect){
      const keys={analysis:s.role==='batter'?'discipline':'control',accuracy:s.role==='batter'?'contact':'control',defense:s.role==='batter'?'fielding':'movement',mental:s.role==='batter'?'discipline':'composure',style:s.style,weakest:ATTRS[s.role].reduce((a,b)=>s.attrs[a.key]<=s.attrs[b.key]?a:b).key};
      if(effect.skill)grow(keys[effect.skill],effect.growth);
      for(const key of ['fatigue','trust','morale'])s[key]=clamp(s[key]+(effect[key]||0),0,100);
      if(effect.buff)s.buffs.growth=Math.max(s.buffs.growth,effect.buff);
      if(effect.protection)s.buffs.protection=Math.max(s.buffs.protection,effect.protection);
    }
    s.pendingEvent = null;
    return s;
  }
  function archive(s) {
    if(s.seasons.some(v=>v.season===s.season))return;
    const row=s.standings.find(v=>v.teamId===s.teamId);
    s.seasons.push({season:s.season,age:s.age,teamId:s.teamId,stats:clone(s.stats),overall:overall(s),wins:row.w,losses:row.l,ties:row.t,stage:s.stage,leagueId:s.leagueId,scheduledGames:s.schedule.gamesPerTeam});
  }
  function selectDraftTeam(s) {
    const choices=TEAMS.filter(t=>t.leagueId===SCHOOL_PATHS[s.schoolCountry||'kr'].leagueId).slice().sort((a,b)=>a.competition-b.competition);
    const seed=seedValue(s.id+':draft:'+overall(s)+':'+s.schoolStats.g);
    return choices[seed%choices.length].id;
  }
  function seasonMarketScore(s) {
    const st=s.stats;
    if(s.role==='batter') {
      const rates=rateStats(st,s.role);
      return st.pa<(s.stage==='highschool'?15:150)?0:clamp((Number(rates.ops)-.55)*100+st.hr*.7+st.sb*.25,0,100);
    }
    return st.outs<(s.stage==='highschool'?12:90)?0:clamp((5-st.er*27/st.outs)*17+st.so*.13+(st.sv+st.hld)*.5,0,100);
  }
  function getScoutingReport(s){
    const score=seasonMarketScore(s),chance=clamp(.05+score*.0045+Math.max(0,overall(s)-55)*.002,.05,.65);
    return {chance,encounter:s.scouting.encounter?clone(s.scouting.encounter):null,visits:clone(s.scouting.visits),clubs:TEAMS.filter(t=>t.leagueId!=='highschool'&&s.scouting.interest[t.id]>0).map(t=>({teamId:t.id,interest:s.scouting.interest[t.id]})).sort((a,b)=>b.interest-a.interest)};
  }
  function recordScoutVisit(s){
    const roll=seedValue(s.id+':visit:'+s.season+':'+s.week)/4294967296;
    if(!s.stats.g||roll>=getScoutingReport(s).chance)return null;
    const candidates=TEAMS.filter(t=>t.leagueId!=='highschool'&&t.id!==s.teamId&&(s.stage!=='highschool'||t.leagueId===SCHOOL_PATHS[s.schoolCountry].leagueId));
    const club=candidates[seedValue(s.id+':visitor:'+s.season+':'+s.week)%candidates.length];
    const kind=s.stage==='pro'&&club.leagueId===s.leagueId&&seedValue(s.id+':kind:'+s.season+':'+s.week)%2===0?'analyst':'scout';
    const visit={teamId:club.id,kind,season:s.season,week:s.week};
    s.scouting.interest[club.id]=Math.min(100,s.scouting.interest[club.id]+(kind==='scout'?12:4)+Math.floor(seasonMarketScore(s)/12));
    s.scouting.visits.push(visit);if(s.scouting.visits.length>100)s.scouting.visits.shift();s.scouting.encounter=clone(visit);
    log(s,kind==='analyst'?'전력분석관의 관찰':'스카우트의 방문',club.name+' 관계자가 경기 영상과 플레이를 확인했습니다. 관찰은 영입 확약이 아닙니다.','career');return visit;
  }
  function respondToScout(input,choice){
    const s=validateSave(input),visit=s.scouting.encounter;
    if(!visit||!['development','teamwork','decline'].includes(choice))fail('응답할 관찰 소식을 확인해 주세요.');
    if(choice==='development'){s.scouting.interest[visit.teamId]=Math.min(100,s.scouting.interest[visit.teamId]+5);s.fatigue=clamp(s.fatigue+3,0,100);}
    if(choice==='teamwork'){s.scouting.interest[visit.teamId]=Math.min(100,s.scouting.interest[visit.teamId]+3);s.trust=clamp(s.trust+4,0,100);}
    s.scouting.encounter=null;log(s,'관찰 소식에 대한 응답',team(visit.teamId).name+' · '+({development:'훈련 계획을 공유했습니다.',teamwork:'팀 기여를 강조했습니다.',decline:'정중히 관심을 보류했습니다.'}[choice]),'career');return s;
  }
  function declineContract(input,teamId){
    const s=validateSave(input),r=s.contract?contractRights(s,true):null;
    if(s.phase!=='seasonEnd'||!r?.domestic||teamId===s.teamId||!contractOptions(s).some(o=>o.teamId===teamId))fail('거절할 외부 FA 제안을 선택해 주세요.');
    s.scouting.declined.push(teamId);log(s,'FA 제안 거절',team(teamId).name+'의 이번 시즌 제안을 거절했습니다.','contract');return s;
  }
  function salaryOffer(s,teamId) {
    const performance=s.stats.g?(.7+seasonMarketScore(s)/100):1;
    const league=team(teamId).leagueId==='mlb'?1.8:team(teamId).leagueId==='npb'?1.25:1;
    return Math.round((3200+Math.max(0,overall(s)-50)*240+s.careerStats.g*12)*(0.9+team(teamId).strength/250)*performance*league/100)*100;
  }
  function getPostingStatus(s) {
    const available=s.stage==='pro'&&['kbo','npb'].includes(s.leagueId)&&s.phase==='seasonEnd'&&s.age<40;
    const service=s.contract?s.contract.leagueService[s.leagueId]+(s.phase==='seasonEnd'?1:0):0;
    const required=s.leagueId==='kbo'?7:6;
    const st=s.stats,era=st.outs?st.er*27/st.outs:Infinity;
    const performance=s.role==='batter'?st.pa>=350&&Number(rateStats(st,s.role).ops)>=.8&&(st.h>=140||st.hr>=20):
      st.outs>=360&&era<=3.5&&st.so>=120||st.outs>=135&&era<=3.2&&st.so>=50&&st.sv+st.hld>=20;
    const performanceRule=s.role==='batter'?'350타석·OPS .800 이상·(140안타 또는 20홈런)':
      '120이닝·ERA 3.50 이하·120K 또는 45이닝·ERA 3.20 이하·50K·20세이브+홀드';
    const checks=[
      {label:'시즌 종료 후 KBO·NPB 소속',met:available},
      {label:(s.leagueId==='kbo'?'KBO 7시즌':'NPB 6시즌·다음 시즌 25세 이상')+' 경력',met:service>=required&&(s.leagueId!=='npb'||s.age+1>=25)},
      {label:'잔여 다년 계약 없음',met:!!s.contract&&s.contract.yearsLeft===1},
      {label:'해외 FA 전 포스팅 경로',met:!!s.contract&&!contractRights(s,s.phase==='seasonEnd').international},
      {label:'구단 승인: 감독 신뢰 65 이상',met:s.trust>=65},
      {label:'MLB 평가: 종합 능력 75 이상',met:overall(s)>=75},
      {label:'시즌 성적: '+performanceRule,met:performance}
    ];
    const eligible=checks.every(c=>c.met);
    const clubs=eligible?TEAMS.filter(t=>t.leagueId==='mlb').slice().sort((a,b)=>seedValue(s.id+':posting:'+s.season+':'+a.id)-seedValue(s.id+':posting:'+s.season+':'+b.id)).slice(0,3+Math.floor(seasonMarketScore(s)/25)):[];
    return {eligible,checks,offers:clubs.map(t=>({teamId:t.id,years:[1,2,3,4],annualSalary:salaryOffer(s,t.id),reason:'성적 평가 통과 · 구단 포스팅 승인'})),detail:'게임 간소화 기준입니다. NPB의 6시즌·연령 조건, 성적 기준과 자동 구단 승인은 실제 공통 규정이 아닙니다. 협상 기간·마이너 계약·이적료 정산은 생략합니다.'};
  }
  function getContractOffer(s,teamId,years=1) {
    const offer=contractOptions(s).find(o=>o.teamId===teamId);
    if(!offer||!offer.years.includes(years))fail('선택할 수 없는 계약입니다.');
    const r=s.contract?contractRights(s,true):null;
    const annualSalary=s.stage==='highschool'?0:r.yearsLeft>0?s.salary:salaryOffer(s,teamId);
    return {annualSalary,total:annualSalary*years,marketScore:Math.round(seasonMarketScore(s))};
  }
  function newContract(s,years,prior=null) {
    return {yearsLeft:years,annualSalary:salaryOffer(s,s.teamId),serviceYears:prior?prior.serviceYears:0,leagueService:prior?clone(prior.leagueService):{kbo:0,npb:0,mlb:0},faService:prior?clone(prior.faService):{kbo:null,npb:null,mlb:null},internationalVeteran:prior?prior.internationalVeteran:false};
  }
  function contractRights(s,finishCurrent) {
    const c=s.contract,service=c.leagueService[s.leagueId]+(finishCurrent?1:0),lastFA=c.faService[s.leagueId];
    const yearsLeft=c.yearsLeft-(finishCurrent?1:0);
    if(yearsLeft>0)return {domestic:false,international:false,yearsLeft,service};
    if(c.internationalVeteran)return {domestic:true,international:true,yearsLeft,service};
    let domestic=false,international=false;
    if(s.leagueId==='kbo')domestic=international=lastFA===null?service>=8:service-lastFA>=4;
    else if(s.leagueId==='npb') {domestic=lastFA===null?service>=8:service-lastFA>=4;international=lastFA===null?service>=9:service-lastFA>=4;}
    else domestic=international=service>=6;
    return {domestic,international,yearsLeft,service};
  }
  function contractOptions(s) {
    if(s.phase!=='seasonEnd'||s.age>=40)return [];
    if(s.stage==='highschool')return [{teamId:s.age<18?s.teamId:s.draftTeamId,years:[1],reason:s.age<18?'고교 진급':SCHOOL_PATHS[s.schoolCountry].leagueId.toUpperCase()+' 신인 지명 입단'}];
    const r=contractRights(s,true);
    let allowed=r.international?TEAMS.filter(t=>t.leagueId!=='highschool'):r.domestic?TEAMS.filter(t=>t.leagueId===s.leagueId):[team(s.teamId)];
    if(r.domestic){
      const score=seasonMarketScore(s),candidates=allowed.filter(t=>t.id!==s.teamId);
      const ranked=candidates.map(t=>({t,value:s.scouting.interest[t.id]+score*.7+overall(s)*.15-t.competition*.18+seedValue(t.id+':need:'+s.season+':'+(s.position||s.pitchingRole))%21+seedValue(s.id+':market:'+s.season+':'+t.id)%45})).sort((a,b)=>b.value-a.value);
      const count=1+Math.floor(score/22),selected=ranked.filter(v=>v.value>=35).slice(0,count);
      allowed=[team(s.teamId),...selected.map(v=>v.t)].filter(t=>!s.scouting.declined.includes(t.id));
    }
    return allowed.map(t=>({teamId:t.id,years:r.domestic?[1,2,3,4]:[Math.max(1,r.yearsLeft)],reason:r.yearsLeft>0?'다년 계약 잔여 기간':r.domestic?'FA 계약':'보류권에 따른 동일 구단 연봉 갱신'}));
  }
  function getContractStatus(s) {
    const options=contractOptions(s);
    if(s.stage==='highschool')return {label:s.age===18?'졸업·신인 드래프트':'고교 '+(s.age-15)+'학년',detail:s.draftTeamId?team(s.draftTeamId).name+'의 지명을 받았습니다.':s.age===18?'시즌 성적을 바탕으로 시즌 종료 후 시작 국가의 프로 구단에 지명됩니다.':'졸업 전까지 같은 학교에서 성장합니다.',canChooseTeam:false,yearsLeft:0,serviceYears:0,faEligible:false,draftTeamId:s.draftTeamId,options};
    const r=contractRights(s,s.phase==='seasonEnd');
    const threshold=s.contract.faService[s.leagueId]===null?(s.leagueId==='mlb'?6:8):(s.leagueId==='mlb'?0:4);
    const since=s.contract.faService[s.leagueId]===null?r.service:r.service-s.contract.faService[s.leagueId];
    const label=r.yearsLeft>0?'계약 '+r.yearsLeft+'년 잔여':r.domestic?'FA 자격':'구단 보류권';
    const serviceDetail=' 리그 서비스 '+r.service+'시즌 · '+(s.contract.internationalVeteran?'계약 종료 후 국제 FA.':'FA 기준까지 '+Math.max(0,threshold-since)+'시즌'+(s.leagueId==='npb'&&s.contract.faService.npb===null?' / 해외 FA까지 '+Math.max(0,9-r.service)+'시즌.':'.'));
    const detail=(r.yearsLeft>0?'계약 기간에는 현재 구단 소속을 유지합니다.':r.domestic?(r.international?'국내·해외 구단과 1~4년 계약이 가능합니다.':'NPB 국내 FA: 해외 FA는 첫 취득 9시즌 또는 FA 행사 후 4시즌입니다.'):s.leagueId==='mlb'&&r.service>=3?'연봉 조정 대상 구간입니다.':'매년 현재 구단과 연봉을 갱신합니다.')+serviceDetail;
    return {label,detail,canChooseTeam:r.domestic,yearsLeft:Math.max(0,r.yearsLeft),serviceYears:s.contract.serviceYears+(s.phase==='seasonEnd'?1:0),faEligible:r.domestic,draftTeamId:null,options};
  }
  function nextSeason(input,teamId,years=1,deferFA=false,route='contract') {
    const s=validateSave(input);if(s.phase!=='seasonEnd')fail('시즌 종료 후에 계약할 수 있습니다.');if(s.age>=40)return retire(s);
    if(!['contract','posting'].includes(route)||route==='posting'&&deferFA)fail('이적 경로를 확인해 주세요.');
    const posting=route==='posting';
    const options=posting?getPostingStatus(s).offers:contractOptions(s),offer=options.find(v=>v.teamId===teamId);
    if(!offer)fail('현재 계약·보류권·드래프트 조건에서 선택할 수 없는 구단입니다.');
    const oldTeam=s.teamId,oldLeague=s.leagueId,oldStage=s.stage,prior=s.contract?clone(s.contract):null;
    let rights=prior?contractRights(s,true):null;
    if(typeof deferFA!=='boolean'||(deferFA&&(!rights||!rights.domestic||rights.yearsLeft>0||teamId!==s.teamId||years!==1)))fail('FA 유보는 자격 취득 후 현재 구단에 1년 잔류할 때만 가능합니다.');
    if(rights&&rights.yearsLeft>0)years=rights.yearsLeft;
    if(!offer.years.includes(years))fail('계약 기간을 확인해 주세요.');
    archive(s);
    if(prior){prior.serviceYears++;prior.leagueService[oldLeague]++;}
    s.teamId=teamId;s.leagueId=team(teamId).leagueId;s.stage=s.leagueId==='highschool'?'highschool':'pro';s.season++;s.age++;s.week=0;s.phase='active';
    if(s.stage==='highschool')s.contract=null;
    else if(prior&&rights.yearsLeft>0){s.contract=prior;s.contract.yearsLeft=rights.yearsLeft;}
    else {
      if(posting)prior.internationalVeteran=true;
      if(prior&&rights.domestic&&!deferFA&&!posting){prior.faService[oldLeague]=prior.leagueService[oldLeague];if(oldLeague!==s.leagueId)prior.internationalVeteran=true;}
      s.contract=newContract(s,years,prior);
    }
    s.salary=s.contract?s.contract.annualSalary:0;
    s.scheduleTeamIds=TEAMS.filter(t=>t.leagueId===s.leagueId).map(t=>t.id);s.schedule=null;s.schedule=makeSchedule(s);
    s.stats=blankStats();s.standings=blankStandings(s.scheduleTeamIds);s.injury=null;s.injurySeasonLoss=0;s.buffs={growth:0,protection:0};s.usedItems=[];s.roleChangedWeek=false;s.fatigue=8;s.morale=72;s.trust=oldTeam===teamId?Math.max(50,s.trust):48;
    s.lastWeek=null;s.pendingEvent=null;s.draftTeamId=null;
    s.scouting.declined=[];s.scouting.encounter=null;Object.keys(s.scouting.interest).forEach(id=>s.scouting.interest[id]=Math.floor(s.scouting.interest[id]*.65));
    log(s,posting?'MLB 포스팅 이적':deferFA?'FA 재수 · 1년 재도전':oldStage==='highschool'&&s.stage==='pro'?'프로 입단':oldTeam===teamId?'새로운 시즌':'새로운 더그아웃',(s.stage==='highschool'?getSchoolName(teamId,s.schoolCountry):team(teamId).name)+(s.contract?'와 '+s.contract.yearsLeft+'년 계약 · 연간 '+s.salary.toLocaleString('ko-KR')+'만원 상당의 게임 보수입니다.':'에서 다음 학년을 시작합니다.')+(deferFA?' FA 행사 이력은 유지하고 다음 시즌 성적으로 시장 제안을 다시 평가합니다.':''),'contract');
    return s;
  }
  function retire(input) {
    const s = validateSave(input);
    if (s.phase === 'retired') fail('이미 종료된 커리어입니다.');
    if (!s.week && !s.seasons.length) fail('최소 한 주를 진행한 뒤 커리어를 마칠 수 있습니다.');
    if (s.week > 0) archive(s);
    s.phase = 'retired'; s.pendingEvent = null;
    log(s, '나의 야구 연대기', s.name + '의 기록이 커리어 북에 남았습니다.', 'career');
    const ending=getCareerAssessment(s);log(s,'커리어 평가 · '+ending.title,ending.description,'career');
    return s;
  }
  function migrateLegacy(input) {
    const s=legacy.validateSave(input);
    s.version=VERSION;s.startAge=18;s.stage='pro';s.schoolStats=blankStats();s.injuryBurden=s.injury?1:0;s.injurySeasonLoss=0;s.agingCarry=Object.fromEntries(ATTRS[s.role].map(a=>[a.key,0]));s.draftTeamId=null;
    s.schedule={kind:'legacy',year:2026+s.season-1};s.schedule=makeSchedule(s);
    s.contract=newContract(s,1);s.contract.annualSalary=s.salary;
    s.seasons.forEach(v=>{v.ties=0;v.stage='pro';v.leagueId=team(v.teamId).leagueId;v.scheduledGames=112;if(v.season<s.season){s.contract.serviceYears++;s.contract.leagueService[v.leagueId]++;}});
    s.standings.forEach(v=>{v.t=0;});
    if(s.lastWeek){const fixtures=getSeasonSchedule(s).weeks[s.week-1].games.filter(g=>g.home===s.teamId||g.away===s.teamId);s.lastWeek.games.forEach((g,i)=>{g.date=fixtures[i].date;});}
    if(s.pendingEvent)s.pendingEvent=weekEvent(s);
    return s;
  }
  function validateSave(input) {
    if(input&&(input.version===1||input.version===2))input=migrateLegacy(input);
    if(input&&input.version===VERSION&&!Object.hasOwn(input,'life'))input={...input,life:{owned:[],spent:0}};
    if(input&&input.version===VERSION&&!Object.hasOwn(input,'schoolCountry'))input={...input,schoolCountry:'kr',favoriteTeamId:null,scouting:blankScouting()};
    const err=label=>fail('저장 데이터가 올바르지 않습니다: '+label);
    const object=(v,keys,label)=>{if(!v||typeof v!=='object'||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v)))err(label);const actual=Object.keys(v);if(actual.length!==keys.length||keys.some(k=>!Object.hasOwn(v,k)))err(label+' 필드');};
    const number=(n,lo,hi,label,integral=false)=>{if(typeof n!=='number'||!Number.isFinite(n)||n<lo||n>hi||(integral&&!Number.isInteger(n)))err(label);};
    const str=(v,max,label,empty=false)=>{if(typeof v!=='string'||v.length>max||(!empty&&!v.length)||/[\u0000-\u001f\u007f]/.test(v))err(label);};
    const array=(v,max,label)=>{if(!Array.isArray(v)||v.length>max)err(label);};
    const validTeam=id=>{if(!team(id))err('구단');};
    object(input,STATE_KEYS,'전체 구조');const s=input;if(s.version!==VERSION)err('지원하지 않는 버전');
    str(s.id,40,'선수 ID');str(s.name,20,'선수 이름');if(!s.name.trim())err('이름');number(s.rng,1,4294967295,'난수 상태',true);
    if(!Object.hasOwn(ATTRS,s.role)||!STYLES[s.role].some(v=>v.id===s.style))err('선수 유형');
    number(s.season,1,25,'시즌',true);if(![16,18,19].includes(s.startAge)||s.age!==s.startAge+s.season-1||s.age>40)err('나이');
    if(!['highschool','pro'].includes(s.stage)||(s.stage==='highschool'&&(s.age<16||s.age>18)))err('커리어 단계');
    if(!Object.hasOwn(SCHOOL_PATHS,s.schoolCountry))err('고교 시작 국가');
    if(s.favoriteTeamId!==null&&(!team(s.favoriteTeamId)||team(s.favoriteTeamId).leagueId==='highschool'))err('선호 구단');
    object(s.scouting,['interest','visits','declined','encounter'],'스카우팅');
    const proIds=TEAMS.filter(t=>t.leagueId!=='highschool').map(t=>t.id);
    object(s.scouting.interest,proIds,'구단 관심');proIds.forEach(id=>number(s.scouting.interest[id],0,100,'관심',true));
    array(s.scouting.visits,100,'방문 이력');
    const visitKeys=new Set();
    const checkVisit=v=>{object(v,['teamId','kind','season','week'],'관찰');if(!proIds.includes(v.teamId)||!['scout','analyst'].includes(v.kind))err('관찰 구단');number(v.season,1,s.season,'관찰 시즌',true);number(v.week,1,60,'관찰 주차',true);if(v.season===s.season&&v.week>s.week)err('관찰 시점');};
    s.scouting.visits.forEach(v=>{checkVisit(v);const key=v.season+':'+v.week;if(visitKeys.has(key))err('중복 관찰');visitKeys.add(key);});
    array(s.scouting.declined,52,'거절 목록');if(new Set(s.scouting.declined).size!==s.scouting.declined.length||s.scouting.declined.some(id=>!proIds.includes(id)||id===s.teamId))err('거절 구단');
    if(s.scouting.encounter!==null){checkVisit(s.scouting.encounter);if(s.scouting.encounter.season!==s.season||s.scouting.encounter.week!==s.week||!s.scouting.visits.some(v=>Object.keys(v).every(k=>v[k]===s.scouting.encounter[k])))err('현재 관찰');}
    validTeam(s.teamId);if(!LEAGUES.some(v=>v.id===s.leagueId)||team(s.teamId).leagueId!==s.leagueId||(s.stage==='highschool')!==(s.leagueId==='highschool'))err('리그');
    array(s.scheduleTeamIds,30,'참가 팀');const ids=TEAMS.filter(t=>t.leagueId===s.leagueId).map(t=>t.id);
    if(new Set(s.scheduleTeamIds).size!==s.scheduleTeamIds.length||!s.scheduleTeamIds.includes(s.teamId)||s.scheduleTeamIds.some(id=>!ids.includes(id)))err('참가 팀');
    object(s.schedule,['kind','year','gamesPerTeam','weekCount','openingDate','endDate','sourceMode','notes'],'시즌 일정');
    if(!['standard','legacy'].includes(s.schedule.kind)||s.schedule.year!==2026+s.season-1)err('일정 버전');
    if(s.schedule.kind==='legacy'&&s.stage!=='pro')err('이전 일정 단계');
    const allowedLegacy=s.leagueId==='kbo'&&s.scheduleTeamIds.length===8&&s.scheduleTeamIds.every(id=>Object.values(LEGACY_TEAM_MAP).includes(id));
    if(s.scheduleTeamIds.length!==ids.length&&!(s.schedule.kind==='legacy'&&allowedLegacy))err('참가 팀 수');
    const expectedSchedule=makeSchedule(s);if(Object.keys(expectedSchedule).some(k=>s.schedule[k]!==expectedSchedule[k]))err('시즌 일정 내용');
    const calendar=getSeasonSchedule(s);number(s.week,0,s.schedule.weekCount,'주차',true);
    if(!['active','seasonEnd','retired'].includes(s.phase)||(s.phase==='active'&&s.week===s.schedule.weekCount)||(s.phase==='seasonEnd'&&s.week!==s.schedule.weekCount))err('진행 단계');
    if(s.role==='batter'?(!POSITIONS.some(v=>v.id===s.position)||s.pitchingRole!==null):(!PITCHING_ROLES.some(v=>v.id===s.pitchingRole)||s.position!==null))err('수비 위치 / 보직');
    const attrKeys=ATTRS[s.role].map(a=>a.key);object(s.attrs,attrKeys,'능력');object(s.potential,['caps','growthRate','resilience'],'잠재력');object(s.potential.caps,attrKeys,'잠재력 상한');
    attrKeys.forEach(k=>{number(s.potential.caps[k],1,99,'잠재력 상한',true);number(s.attrs[k],1,s.potential.caps[k],'능력');});number(s.potential.growthRate,.65,1.5,'성장 속도');number(s.potential.resilience,.6,1.4,'회복력');
    object(s.agingCarry,attrKeys,'노화 누적');attrKeys.forEach(k=>number(s.agingCarry[k],0,.011,'노화 잔여량'));number(s.injuryBurden,0,2000,'누적 부상',true);number(s.injurySeasonLoss,0,2.000001,'시즌 부상 손실');
    ['fatigue','morale','trust'].forEach(k=>number(s[k],0,100,k));number(s.points,0,100000,'포인트',true);number(s.salary,0,1000000,'연봉');number(s.totalSalary,0,100000000,'누적 보수');
    object(s.life,['owned','spent'],'생활 자산');array(s.life.owned,LIFE_ITEMS.length,'보유 물품');
    let lifeSpent=0;const lifeIds=new Set();
    for(const o of s.life.owned){
      object(o,['id','price','season','week','quality'],'구매 내역');const item=LIFE_ITEMS.find(i=>i.id===o.id);
      if(!item||lifeIds.has(o.id)||o.price!==item.price)err('구매 물품');lifeIds.add(o.id);lifeSpent+=o.price;
      number(o.season,1,s.season,'구매 시즌',true);number(o.week,0,60,'구매 주차',true);
      number(o.quality,1,100,'물품 상태',true);
      if(o.quality!==1+seedValue(s.id+':life:'+o.id)%100)err('물품 상태');
      if(o.season===s.season&&o.week>s.week||s.startAge+o.season-1<19)err('구매 시점');
    }
    number(s.life.spent,0,Math.floor(s.totalSalary),'지출',true);if(s.life.spent!==lifeSpent)err('지출 합계');
    object(s.inventory,ITEMS.map(v=>v.id),'보관함');ITEMS.forEach(v=>number(s.inventory[v.id],0,99,'아이템 수',true));object(s.buffs,['growth','protection'],'효과');['growth','protection'].forEach(k=>number(s.buffs[k],0,3,'효과 남은 주',true));
    if(s.injury!==null){object(s.injury,['name','weeks'],'부상');if(s.injury.name!=='근육 피로 부상')err('부상 종류');number(s.injury.weeks,1,3,'부상 남은 주',true);}
    array(s.usedItems,1,'사용 아이템');if(s.usedItems.some(id=>!ITEMS.some(v=>v.id===id)))err('사용 아이템');if(typeof s.roleChangedWeek!=='boolean')err('보직 변경 상태');
    if(s.draftTeamId!==null){validTeam(s.draftTeamId);if(s.stage!=='highschool'||s.age!==18||s.week!==s.schedule.weekCount||team(s.draftTeamId).leagueId!==SCHOOL_PATHS[s.schoolCountry].leagueId||s.draftTeamId!==selectDraftTeam(s))err('드래프트 지명');}
    if(s.stage==='highschool'&&s.age===18&&s.week===s.schedule.weekCount&&s.draftTeamId===null)err('드래프트 누락');
    if(s.stage==='highschool'){if(s.contract!==null||s.salary!==0)err('고교 계약');}
    else {
      object(s.contract,['yearsLeft','annualSalary','serviceYears','leagueService','faService','internationalVeteran'],'계약');const c=s.contract;
      number(c.yearsLeft,1,4,'계약 잔여 년',true);number(c.annualSalary,1,1000000,'계약 연봉');if(c.annualSalary!==s.salary)err('계약 보수');number(c.serviceYears,0,24,'서비스 연수',true);
      object(c.leagueService,['kbo','npb','mlb'],'리그 서비스');object(c.faService,['kbo','npb','mlb'],'FA 서비스');['kbo','npb','mlb'].forEach(k=>{number(c.leagueService[k],0,24,'리그 서비스',true);if(c.faService[k]!==null)number(c.faService[k],0,c.leagueService[k],'FA 행사 시점',true);});
      if(Object.values(c.leagueService).reduce((a,b)=>a+b,0)!==c.serviceYears||typeof c.internationalVeteran!=='boolean')err('서비스 합계');
    }
    const stats=(v,label,limit)=>{
      object(v,STAT_KEYS,label);STAT_KEYS.forEach(k=>number(v[k],0,100000,label+'/'+k,true));
      if(v.g>limit||v.h>v.ab||v.doubles+v.triples+v.hr>v.h||v.so>(s.role==='batter'?v.ab-v.h:v.outs)||(s.role==='batter'&&v.pa!==v.ab+v.bb+v.hbp+v.sf))err(label+' 타격 관계');
      if(v.starts>v.g||v.w+v.l+v.sv+v.hld>v.g||v.sv+v.hld>v.g-v.starts||v.er>v.ra||v.outs>v.g*27||v.r>v.h+v.bb+v.hbp||v.hr>v.r||v.hr>v.rbi||v.sb+v.cs>v.h+v.bb+v.hbp-v.hr)err(label+' 기록 관계');
      if(s.role==='batter'){if(v.g*5<v.pa||['starts','outs','ha','er','ra','w','l','sv','hld'].some(k=>v[k]!==0))err(label+' 타자 기록');}
      else if(['ab','h','doubles','triples','hr','hbp','sf','rbi','r','sb','cs','pa'].some(k=>v[k]!==0))err(label+' 투수 기록');
    };
    const playedCounts=Object.fromEntries(s.scheduleTeamIds.map(id=>[id,0]));calendar.weeks.slice(0,s.week).forEach(w=>w.games.forEach(g=>{playedCounts[g.home]++;playedCounts[g.away]++;}));
    stats(s.stats,'시즌 기록',playedCounts[s.teamId]);stats(s.careerStats,'프로 통산',25*162);stats(s.schoolStats,'고교 통산',3*28);
    array(s.seasons,25,'시즌 이력');const proPrevious=blankStats(),schoolPrevious=blankStats(),service={kbo:0,npb:0,mlb:0};
    s.seasons.forEach((v,i)=>{
      object(v,['season','age','teamId','stats','overall','wins','losses','ties','stage','leagueId','scheduledGames'],'시즌 이력');if(v.season!==i+1||v.age!==s.startAge+i||v.season>s.season)err('시즌 이력 순서');validTeam(v.teamId);
      if(team(v.teamId).leagueId!==v.leagueId||!['highschool','pro'].includes(v.stage)||(v.stage==='highschool')!==(v.leagueId==='highschool')||(v.stage==='highschool'&&v.age>18))err('이력 리그');
      number(v.scheduledGames,1,200,'이력 일정',true);['wins','losses','ties'].forEach(k=>number(v[k],0,200,'이력 승패',true));number(v.overall,1,99,'이력 능력',true);stats(v.stats,'이력 기록',v.wins+v.losses+v.ties);
      if(v.season<s.season){if(v.wins+v.losses+v.ties!==v.scheduledGames)err('지난 시즌 경기 수');addStats(v.stage==='highschool'?schoolPrevious:proPrevious,v.stats);if(v.stage==='pro')service[v.leagueId]++;}
      else if(s.phase!=='retired'||v.wins+v.losses+v.ties!==playedCounts[s.teamId]||STAT_KEYS.some(k=>v.stats[k]!==s.stats[k]))err('은퇴 시즌 기록');
    });
    if(s.seasons.length!==s.season-1+(s.phase==='retired'&&s.week>0?1:0))err('이력 개수');
    STAT_KEYS.forEach(k=>{if(s.careerStats[k]!==proPrevious[k]+(s.stage==='pro'?s.stats[k]:0)||s.schoolStats[k]!==schoolPrevious[k]+(s.stage==='highschool'?s.stats[k]:0))err('통산 합계');});
    if(s.contract&&Object.keys(service).some(k=>service[k]!==s.contract.leagueService[k]))err('서비스 이력');
    array(s.standings,30,'순위');if(s.standings.length!==s.scheduleTeamIds.length||new Set(s.standings.map(v=>v.teamId)).size!==s.scheduleTeamIds.length)err('순위 팀 수');
    let wins=0,losses=0,runs=0,allowed=0,ties=0;
    s.standings.forEach(v=>{object(v,['teamId','w','l','t','rs','ra'],'순위 행');if(!s.scheduleTeamIds.includes(v.teamId))err('순위 팀');['w','l','t'].forEach(k=>number(v[k],0,200,'팀 승패',true));['rs','ra'].forEach(k=>number(v[k],0,10000,'팀 득실점',true));if(v.w+v.l+v.t!==playedCounts[v.teamId])err('팀 경기 수');if(!['kbo','npb'].includes(s.leagueId)&&v.t)err('무승부 규칙');wins+=v.w;losses+=v.l;ties+=v.t;runs+=v.rs;allowed+=v.ra;});
    if(wins!==losses||runs!==allowed||ties%2)err('리그 합계');const our=s.standings.find(v=>v.teamId===s.teamId);if(s.stats.w+s.stats.sv+s.stats.hld>our.w||s.stats.l>our.l||s.stats.r>our.rs||s.stats.rbi>our.rs||s.stats.ra>our.ra)err('선수 / 팀 기록');
    array(s.history,500,'로그');s.history.forEach(v=>{object(v,['season','week','title','text','type'],'로그 행');number(v.season,1,s.season,'로그 시즌',true);number(v.week,0,60,'로그 주차',true);str(v.title,100,'로그 제목');str(v.text,600,'로그 내용');if(!['career','week','choice','season','contract'].includes(v.type))err('로그 유형');});
    if(s.lastWeek!==null){
      const v=s.lastWeek;object(v,['games','summary','gains','gamesPlayed'],'주간 결과');array(v.games,20,'주간 경기');if(!s.week)err('시작 전 경기');const expected=calendar.weeks[s.week-1].games.filter(g=>g.home===s.teamId||g.away===s.teamId);if(v.games.length!==expected.length)err('주간 경기 수');
      v.games.forEach((g,i)=>{object(g,['date','opponentId','our','opp','result','played','line','highlight'],'경기');const fixture=expected[i],opponent=fixture.home===s.teamId?fixture.away:fixture.home;if(g.date!==fixture.date||g.opponentId!==opponent)err('경기 일정');number(g.our,0,100,'득점',true);number(g.opp,0,100,'실점',true);if(g.result!==(g.our>g.opp?'W':g.our<g.opp?'L':'D')||typeof g.played!=='boolean'||(g.result==='D'&&!['kbo','npb'].includes(s.leagueId)))err('경기 결과');str(g.line,160,'경기 기록');str(g.highlight,200,'하이라이트',true);});
      number(v.gamesPlayed,0,s.role==='batter'?v.games.length:4,'주간 출전',true);if(v.gamesPlayed!==v.games.filter(g=>g.played).length)err('주간 출전 합계');array(v.summary,6,'주간 요약');v.summary.forEach(t=>str(t,300,'요약'));array(v.gains,5,'능력 변화');const seen=new Set();v.gains.forEach(g=>{object(g,['key','delta'],'변화 행');if(!attrKeys.includes(g.key)||seen.has(g.key))err('변화 능력');seen.add(g.key);number(g.delta,-10,20,'변화량');});
    }else if(s.week>0)err('주간 결과 누락');
    if(s.pendingEvent!==null){if(s.phase!=='active')err('종료 후 사건');const expected=weekEvent(s);object(s.pendingEvent,['id','title','body','choices'],'사건');array(s.pendingEvent.choices,3,'선택지');if(!expected||['id','title','body'].some(k=>s.pendingEvent[k]!==expected[k])||s.pendingEvent.choices.length!==expected.choices.length)err('사건 내용');s.pendingEvent.choices.forEach((v,i)=>{object(v,['id','label','detail'],'선택지');if(['id','label','detail'].some(k=>v[k]!==expected.choices[i][k]))err('선택지 내용');});}
    return clone(s);
  }
  // Public definitions are immutable so UI code cannot change simulation rules accidentally.
  function freeze(value) { Object.values(value).forEach(v => { if (v && typeof v === 'object') freeze(v); }); return Object.freeze(value); }
  [TEAMS, STYLES, ATTRS, PLANS, LEAGUES, POSITIONS, PITCHING_ROLES, ITEMS,LIFE_ITEMS,SCHOOL_PATHS].forEach(freeze);
  return Object.freeze({ VERSION, TEAMS, LEAGUES, STYLES, ATTRS, PLANS, POSITIONS, PITCHING_ROLES, ITEMS, LIFE_ITEMS, getLifeShop, buyLifeItem, changePosition, changePitchingRole, buyItem, useItem, potentialSummary, ageDevelopment, getLeagueRules, getSeasonSchedule, getContractStatus, getContractOffer, getPostingStatus, contractOptions, createCareer, advanceWeek, advanceWeeks, careerGoal, getCareerAssessment, getRetirementStatus, SCHOOL_PATHS, getSchoolName, getScoutingReport, respondToScout, declineContract, resolveEvent, nextSeason, retire, validateSave, overall, rateStats, getOutlook });
});
