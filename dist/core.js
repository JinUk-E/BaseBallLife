(function (root, factory) {
  'use strict';
  const api = factory(typeof module === 'object' && module.exports ? require('./league-data.js') : root.DugoutData, typeof module === 'object' && module.exports ? require('./legacy-v2-core.js') : root.DugoutLegacyV2, typeof module === 'object' && module.exports ? require('./schedule-data.js') : root.DugoutScheduleData,typeof module==='object'&&module.exports?require('./pathways-data.js'):root.DugoutPathways);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Dugout = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (data, legacy, schedules, pathways) {
  'use strict';
  const VERSION = 3;
  const { TEAMS, LEAGUES, LEGACY_TEAM_MAP } = data;
  const SCHOOL_PATHS={kr:{name:'한국',leagueId:'kbo',schools:['서울 한빛고','부산 해강고','인천 청해고','대구 태산고','광주 무등고','대전 새빛고','수원 누리고','제주 바람고']},us:{name:'미국',leagueId:'mlb',schools:['캘리포니아 선셋고','텍사스 프레리 고교','플로리다 팜 고교','애리조나 캐니언 고교','조지아 파인 고교','뉴욕 리버 고교','워싱턴 레이크 고교','오리건 포레스트 고교']},jp:{name:'일본',leagueId:'npb',schools:['도쿄 아오바 고교','오사카 미나토 고교','요코하마 세이요 고교','나고야 메이린 고교','후쿠오카 하쿠요 고교','삿포로 호쿠세이 고교','고베 시오카제 고교','센다이 모리노 고교']}};
  function getSchoolName(id,country='kr',mode='real'){const national=pathways.NATIONAL_SCHOOLS.find(t=>t.id===id);if(national)return national.name;const i=TEAMS.filter(t=>t.leagueId==='highschool').findIndex(t=>t.id===id);return (mode==='real'?pathways.SCHOOLS[country]?.names:SCHOOL_PATHS[country]?.schools)?.[i]||team(id)?.name||id;}
  function blankScouting(){return {interest:Object.fromEntries(TEAMS.filter(t=>t.leagueId!=='highschool').map(t=>[t.id,0])),visits:[],declined:[],encounter:null};}
  function blankMobility(){return {draftPlan:'domestic',declinedTrades:[]};}
  function blankFreeAgency(){return {active:false,originTeamId:null,international:false,joinedWeek:null,declined:[]};}
  function blankTransfers(){return {draftedOn:null,faSignings:[],moves:[]};}
  function blankAmateur(mode='real'){return {schoolMode:mode,schoolCups:[],alternative:null,alternativeHistory:[],extendedSeason:null,jabaSince:null,pathPitchDate:null};}
  function relocationIncome(s){return (s.transfers?.moves||[]).reduce((n,m)=>n+m.relocation,0);}
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
    {id:'growth',name:'성장 훈련권',description:'3주 성장 +25% · 35세 이후 노화 감소 35%',price:45,effect:'성장·유지 보조 / 3주'},
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
    ['villa','개인 훈련장 주택','home',250000,'넓은 운동 공간을 갖춘 오랜 꿈의 집.'],
    ['pitching-robot','절대 안 봐주는 피칭머신','training',900,'몸쪽 승부에 인간적인 배려가 전혀 없다.'],
    ['gold-bat','순금 배트 (경기 사용 불가)','luxury',2500,'타격감보다 중량감. 감독님께는 들키지 말자.'],
    ['coffee-truck','구장 앞 커피차','luxury',1800,'팬 서비스인 줄 알았는데 사장님이 선수 본인이다.'],
    ['supercar','문이 위로 열리는 슈퍼카','luxury',25000,'하차 장면만큼은 이미 올스타전 선발이다.'],
    ['yacht','초호화 요트','luxury',1200000,'홈구장은 있는데 모항까지 생겼다. 선장님은 별도 섭외.'],
    ['bullpen-sofa','불펜보다 편한 리클라이너','home',350,'감독님 전화만 안 오면 완벽한 휴식 공간.'],
    ['hangang','한강뷰 아파트','home',450000,'한강이 보인다. 이제 원정 숙소에서도 이 집 생각만 난다.'],
    ['rooftop-bullpen','옥상에 불펜 있는 펜트하우스','home',800000,'엘리베이터를 타고 등판한다. 층간소음은 별도 문제.'],
    ['island','나만의 무인도','home',2000000,'개인훈련은 가능하지만 공이 바다로 가면 직접 주워야 한다.']
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
    const purchased=s.life.owned.some(i=>i.season===s.season&&i.week===s.week);
    const offers=purchased?[]:LIFE_ITEMS.filter(i=>!owned.has(i.id))
      .sort((a,b)=>seedValue(s.id+':shop:'+s.season+':'+s.week+':'+a.id)-seedValue(s.id+':shop:'+s.season+':'+s.week+':'+b.id)).slice(0,1);
    return {balance:Math.max(0,Math.floor(s.totalSalary)+relocationIncome(s)-s.life.spent),spent:s.life.spent,purchased,offers:clone(offers),owned:s.life.owned.map(o=>({...LIFE_ITEMS.find(i=>i.id===o.id),season:o.season,week:o.week}))};
  }
  function buyLifeItem(input,id) {
    const s=validateSave(input);
    if(s.stage!=='pro'||s.phase==='retired')fail('프로 선수로 활동 중일 때 구매할 수 있습니다.');
    if(s.life.owned.some(o=>o.id===id))fail('이미 보유한 물건입니다.');
    const shop=getLifeShop(s);
    if(shop.purchased)fail('이번 주에는 이미 구매했습니다. 다음 주에 새 매물을 확인해 주세요.');
    const item=shop.offers.find(i=>i.id===id);
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
  const STATE_KEYS = 'version id rng name role style teamId age season week phase attrs fatigue morale trust salary totalSalary stats careerStats seasons lastWeek history standings pendingEvent leagueId scheduleTeamIds potential position pitchingRole points inventory buffs injury usedItems roleChangedWeek startAge stage schoolStats schedule contract injuryBurden injurySeasonLoss agingCarry draftTeamId life schoolCountry favoriteTeamId scouting mobility freeAgency transfers amateur'.split(' ');
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
    if(s.freeAgency?.active)return {probability:0,label:'무소속 · 개인훈련',reason:'공식경기 출전과 연봉 없이 새 계약을 기다립니다.'};
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
    s.life={owned:[],spent:0};s.schoolCountry=options.schoolCountry||'kr';s.favoriteTeamId=options.favoriteTeamId||null;s.scouting=blankScouting();s.mobility=blankMobility();s.freeAgency=blankFreeAgency();s.transfers=blankTransfers();s.amateur=blankAmateur(options.schoolMode||'real');
    if(!['real','legacy'].includes(s.amateur.schoolMode))fail('고교 대회 모드를 확인해 주세요.');
    if(!Object.hasOwn(SCHOOL_PATHS,s.schoolCountry))fail('고교 시작 국가를 확인해 주세요.');
    if(s.favoriteTeamId&&(!team(s.favoriteTeamId)||team(s.favoriteTeamId).leagueId==='highschool'))fail('선호 구단을 확인해 주세요.');
    s.potential = makePotential(s, s.rng); s.standings = blankStandings(s.scheduleTeamIds);
    s.agingCarry=Object.fromEntries(ATTRS[role].map(a=>[a.key,0])); s.schedule=makeSchedule(s); if(s.stage==='pro') s.contract=newContract(s,1); s.salary=s.contract?s.contract.annualSalary:0;
    if(s.stage==='pro'&&s.leagueId==='kbo')s.transfers.draftedOn=s.schedule.year+'-01-01';
    log(s, s.stage==='highschool'?'고교 야구의 첫 페이지':'프로의 첫 페이지', (s.stage==='highschool'?getSchoolName(teamId,s.schoolCountry,s.amateur.schoolMode):team(teamId).name) + '에서 ' + s.age + '세 선수의 시즌이 시작됩니다.', 'career');
    return s;
  }
  function train(s, plan) {
    const before = { ...s.attrs };
    const efficiency = (s.fatigue >= 75 ? 0.35 : s.fatigue >= 50 ? 0.65 : 1)*(s.freeAgency.active ? (s.amateur.alternative?.85:.65) : 1);
    const grow = (key, amount) => growAttr(s, key, amount * efficiency * (s.injury ? 0.25 : 1));
    if (plan.id === 'balanced') ATTRS[s.role].forEach(a => grow(a.key, 0.7));
    else if (plan.id === 'contact') { grow('contact', 2.2); grow('discipline', 1); }
    else if (plan.id === 'power') { grow('power', 3.1); grow('contact', 0.3); }
    else if (plan.id === 'defense') { grow('fielding', 2); grow('speed', 1.4); if(!s.freeAgency.active)s.trust = clamp(s.trust + 3, 0, 100); }
    else if (plan.id === 'velocity') { grow('velocity', 2.1); grow('movement', 1.3); }
    else if (plan.id === 'control') { grow('control', 2.2); grow('composure', 1.1); }
    else if (plan.id === 'stamina') { grow('stamina', 2.5); grow('composure', 0.6); if(!s.freeAgency.active)s.trust = clamp(s.trust + 3, 0, 100); }
    else if (plan.id === 'video') { grow(s.role==='batter'?'discipline':'control',1.5); grow(s.role==='batter'?'contact':'movement',.8); }
    else if (plan.id === 'running') { grow('speed',2.3); grow('fielding',.6); }
    else if (plan.id === 'mental') { grow('composure',2); grow('stamina',.8); }
    else { s.morale = clamp(s.morale + 5, 0, 100); }
    s.fatigue = clamp(s.fatigue + plan.fatigue - 7, 0, 100);
    return ATTRS[s.role].map(a => ({ key: a.key, delta: Math.round((s.attrs[a.key] - before[a.key]) * 10) / 10 })).filter(g => g.delta !== 0);
  }
  function battingChances(s,opponent) {
    const a=s.attrs,c=a.contact/99,p=a.power/99,d=a.discipline/99,v=a.speed/99;
    const tired=Math.max(0,s.fatigue-35)/65,rival=(opponent.strength-55)/100,form=(s.morale-50)/50;
    // Per-opportunity probabilities. No season total, target average or record cap.
    // Home runs and strikeouts are separate AB outcomes; contact affects balls in play.
    return {
      walk:clamp(.018+.16*d**1.7+rival*.01-tired*.025+form*.003,.005,.4),
      homeRun:clamp(.002+.125*p**2.6*(.7+.3*c)-tired*.018-rival*.015+form*.002,.001,.4),
      strikeout:clamp(.37-.23*c-.06*d+.025*p+rival*.045+tired*.10-form*.008,.015,.55),
      hitOnBall:clamp(.175+.195*c**1.25+.015*v-tired*.065-rival*.055+form*.008,.02,.8),
      double:clamp(.12+.22*p**.9+.025*v,.05,.55),triple:.003+.052*v**2.5,
      stealAttempt:clamp(.004+.49*v**3-tired*.10-rival*.02+form*.005,.001,.85),
      stealSuccess:clamp(.4+.56*v-tired*.12-rival*.06+form*.01,.05,.98),
      runSupport:.05*v-tired*.06
    };
  }
  function runAfterReach(s,st,base,chances) {
    // Singles/walks/HBP can lead to steals of second and third; doubles only third.
    // A caught runner cannot also score. Full inning/base occupancy is abstracted.
    if(base===1&&random(s)<chances.stealAttempt){
      if(random(s)>=chances.stealSuccess){st.cs++;return;}
      st.sb++;base=2;
    }
    if(base===2&&random(s)<chances.stealAttempt*.22){
      if(random(s)>=chances.stealSuccess-.1){st.cs++;return;}
      st.sb++;base=3;
    }
    if(random(s)<.25+base*.1+chances.runSupport)st.r++;
  }
  function batGame(s, opponent) {
    const st = blankStats(); st.g = 1;
    const chances=battingChances(s,opponent);
    const appearances = integer(s, 3, 5);
    for (let i = 0; i < appearances; i++) {
      st.pa++;
      const roll = random(s);
      if (roll < chances.walk) { st.bb++;runAfterReach(s,st,1,chances);continue; }
      if (roll < chances.walk + 0.008) { st.hbp++;runAfterReach(s,st,1,chances);continue; }
      if (roll < chances.walk + 0.026) { st.sf++; st.rbi++; continue; }
      st.ab++;
      const outcome=random(s);
      if(outcome<chances.homeRun){
        st.h++;st.hr++;st.r++;st.rbi++;
        for(let runner=0;runner<3;runner++)if(random(s)<.22)st.rbi++;
      }else if(outcome<chances.homeRun+chances.strikeout)st.so++;
      else if (random(s) < chances.hitOnBall) {
        st.h++;
        const extra = random(s);let base=1;
        if(extra<chances.triple){st.triples++;base=3;}
        else if(extra<chances.triple+chances.double){st.doubles++;base=2;}
        if(random(s)<.32)st.rbi+=integer(s,1,2);
        runAfterReach(s,st,base,chances);
      }
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
    const realSchool=s.leagueId==='highschool'&&s.amateur?.schoolMode==='real',extended=s.freeAgency?.active&&s.amateur?.extendedSeason===s.season;
    const key=[s.leagueId,year,kind,realSchool?s.schoolCountry:'',extended?'extended':'',...s.scheduleTeamIds].join('|');
    if(scheduleCache.has(key))return scheduleCache.get(key);
    let result;
    if(kind==='legacy') {
      const openingDate=year+'-03-01',games=[];
      for(let day=0;day<112;day++)for(const [home,away]of roundPairs(s.scheduleTeamIds,day))games.push({date:dateAt(openingDate,day),home,away});
      result={games,gamesPerTeam:112,openingDate,endDate:dateAt(openingDate,111),sourceMode:'legacy',notes:'이전 저장의 현재 시즌은 기존 112경기 형식을 유지합니다.'};
    } else result=realSchool?pathways.schoolSchedule(s.schoolCountry,year,s.scheduleTeamIds):schedules.createSchedule(s.leagueId,year,s.scheduleTeamIds);
    if(extended)result={...result,endDate:year+'-12-01',notes:result.notes+' 독립·사회인 경기를 위해 무소속 달력을 12월까지 연장합니다.'};
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
    const budget=age<19?14:age<24?12:age<27?9:age<30?6:0;
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
    const gap=s.potential.caps[key]-s.attrs[key],slowdown=clamp(gap/28,0.15,1);
    const yearFactor=ageDevelopment(s.age,s.potential,s.injuryBurden).growthBudget/s.schedule.weekCount;
    s.attrs[key]=Math.min(s.potential.caps[key],Math.round((s.attrs[key]+amount*yearFactor*s.potential.growthRate*slowdown*(s.buffs.growth?1.25:1)*lifeEffects(s).growth)*100)/100);
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
    const rating=overall(s),recommended=s.stage==='pro'&&!s.freeAgency?.active&&s.age>=35&&rating<60&&s.phase==='seasonEnd';
    return {recommended,rating,threshold:60,detail:recommended?team(s.teamId).name+'에서 은퇴를 권고했습니다. 지금까지의 기록으로 커리어를 마무리하거나 다음 시즌에 다시 도전할 수 있습니다.':'35세부터 기량이 하락하며, 시즌 종료 시 종합 능력 60 미만이면 구단의 은퇴 권고를 받습니다.'};
  }
  function getCareerAssessment(s) {
    const leagues=['kbo','npb','mlb'].map(leagueId=>{
      const rows=s.seasons.filter(v=>v.leagueId===leagueId&&v.stage!=='unattached'),stats=blankStats();
      rows.forEach(v=>addStats(stats,v.stats));
      const hasCurrent=rows.some(v=>v.season===s.season);
      if(s.stage==='pro'&&!s.freeAgency?.active&&s.leagueId===leagueId&&s.week>0&&!hasCurrent)addStats(stats,s.stats);
      const seasons=rows.filter(v=>v.season<s.season||s.week===s.schedule.weekCount).length+(!hasCurrent&&!s.freeAgency?.active&&s.leagueId===leagueId&&s.stage==='pro'&&s.week===s.schedule.weekCount?1:0);
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
      const pathBefore=pathAppearances(s),cupBefore=s.amateur.schoolCups.reduce((n,c)=>n+c.results.length,0);
      s=advanceWeek(s,recover?'rest':planId);weeks++;if(recover)recoveries++;
      games+=s.lastWeek.gamesPlayed+pathAppearances(s)-pathBefore;
      if(s.amateur.schoolCups.reduce((n,c)=>n+c.results.length,0)>cupBefore)break;
      if(s.scouting.encounter)break;
      if(getTradeStatus(s).offers.length)break;
      if(s.freeAgency.active&&(s.week===2||s.week%4===0)&&getFreeAgentStatus(s).offers.length)break;
      // Keep the normal weekly report and save schema intact.
    }
    return {state:s,weeks,recoveries,games,gains:ATTRS[s.role].map(a=>({key:a.key,delta:Math.round((s.attrs[a.key]-before[a.key])*100)/100}))};
  }
  function careerGoal(s) {
    const rows=s.seasons.filter(v=>v.leagueId==='mlb'&&v.stage!=='unattached');
    if(!s.freeAgency?.active&&s.leagueId==='mlb'&&!rows.some(v=>v.season===s.season)&&s.week>0)
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
    const trade=getTradeStatus(s);
    if(trade.offers.length&&!trade.requiresConsent)applyTrade(s,trade.offers[0]);
    const cupWeek=schoolCupWeek(s,s.week);
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
    if(s.week%4===0)s.mobility.declinedTrades=[];
    const odds = getOutlook(s).probability * (plan.id === 'rest' ? 0.6 : 1);
    let playerGameIndex=-1;
    for (const fixture of getSeasonSchedule(s).weeks[s.week-1].games) {
      const pair=[fixture.home,fixture.away];
      {
        const a = team(pair[0]), b = team(pair[1]);
        let aScore = poisson(s, 4.4 + (a.strength - b.strength) * 0.055), bScore = poisson(s, 4.4 + (b.strength - a.strength) * 0.055);
        const involved = !s.freeAgency.active&&pair.includes(s.teamId);
        let player = null;
        if (involved) {
          const isA = a.id === s.teamId, rival = isA ? b : a; const day=++playerGameIndex;
          const priorStart=s.transfers.moves.filter(m=>m.season===s.season&&!m.offseason&&m.lastStartDate).at(-1)?.lastStartDate;
          const eligible = !missed && !(cupWeek&&s.role==='pitcher'&&s.pitchingRole==='starter') && (s.role === 'batter' || (s.pitchingRole === 'starter' ? getSeasonSchedule(s).starterSlots[s.teamId].includes(fixtureKey(fixture)) && (!priorStart||(Date.parse(fixture.date)-Date.parse(priorStart))/86400000>=5) && (!s.amateur.pathPitchDate||(Date.parse(fixture.date)-Date.parse(s.amateur.pathPitchDate))/86400000>=5) && (plan.id !== 'rest' || weekly.starts===0) : s.pitchingRole === 'reliever' ? [0,2,4,6].includes(day) : [0,2,4].includes(day)));
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
              line = player.ab + '타수 ' + player.h + '안타 · ' + player.hr + '홈런 · ' + player.rbi + '타점 · ' + player.sb + '도루';
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
    if(s.role==='pitcher'&&games.some(g=>g.played))s.amateur.pathPitchDate=games.filter(g=>g.played).at(-1).date;
    const cupAppearances=playSchoolCups(s),alternativeAppearances=playAlternativeWeek(s);
    s.fatigue = clamp(s.fatigue + (s.role === 'batter' ? weekly.g * 2 : weekly.starts * 7 + (weekly.g - weekly.starts) * 3), 0, 100);
    const performance = s.role === 'batter' ? (weekly.ab ? weekly.h / weekly.ab - 0.24 : 0) * 20 : weekly.outs ? (4.5 - weekly.er * 27 / weekly.outs) * 0.6 : 0;
    if(!s.freeAgency.active)s.trust = Math.round(clamp(s.trust + 1 + performance, 0, 100) * 10) / 10;
    const wins = games.filter(g => g.result === 'W').length;
    s.morale = Math.round(clamp(s.morale + (wins - games.length/2) * 0.8 + performance * 0.3, 0, 100) * 10) / 10;
    s.totalSalary += s.salary / s.schedule.weekCount; s.points += 12;
    const lifestyle=lifeEffects(s);
    s.fatigue=Math.round(clamp(s.fatigue-lifestyle.recovery,0,100)*100)/100;
    s.morale=Math.round(clamp(s.morale+lifestyle.morale,0,100)*100)/100;
    if(missed) {s.fatigue=clamp(s.fatigue-14,0,100); if(--s.injury.weeks<=0) s.injury=null;}
    // An event belongs to the week just simulated, including its growth bonus.
    if(s.freeAgency.active||!weekEvent(s)) s.buffs.growth=Math.max(0,s.buffs.growth-1);
    s.buffs.protection=Math.max(0,s.buffs.protection-1);
    s.usedItems=[]; s.roleChangedWeek=false;
    const summary = [(s.stage==='highschool'?getSchoolName(s.teamId,s.schoolCountry,s.amateur.schoolMode):team(s.teamId).short) + ' ' + wins + '승 ' + games.filter(g=>g.result==='L').length + '패 ' + games.filter(g=>g.result==='D').length + '무', s.role === 'batter' ? weekly.g + '경기 출전 · ' + weekly.h + '안타 · ' + weekly.hr + '홈런 · ' + weekly.sb + '도루' : weekly.g + '경기 등판 · ' + weekly.starts + '선발 · ' + rateStats(weekly, s.role).ip + '이닝 · ' + weekly.so + '삼진'];
    if(s.freeAgency.active){summary.splice(0,2,s.amateur.alternative?pathways.club(s.amateur.alternative.teamId).name+' · '+s.week+'주차':'무소속 개인훈련 '+s.week+'주차',s.amateur.alternative?'독립·사회인 '+alternativeAppearances+'경기 출전 · 메이저 프로 기록·서비스 가산 없음':'공식경기 출전 · 연봉 수령 없음');if(s.week%4===0)s.freeAgency.declined=[];}
    if(cupAppearances){summary[0]+=' · 지역·연습 경기';summary[1]='지역·연습: '+summary[1];summary.push('고교 주요 대회 '+cupAppearances+'경기 출전 · 별도 대회 기록에 반영했습니다.');}
    if(missed) summary.push(newInjury ? '부상 발생: 이번 주 경기를 쉬며 회복했습니다. 능력 감소를 확인하세요.' : '재활 주간: 출전 없이 훈련 효과 25%로 회복했습니다.');
    if (!weekly.g&&!cupAppearances&&!alternativeAppearances) summary.push(s.freeAgency.active?'개인훈련으로 기량을 준비하며 새로운 계약 문의를 기다립니다.':'출전하지 못해도 훈련과 신뢰는 쌓입니다. 회복 후 다음 기회를 준비하세요.');
    if (s.fatigue >= 65) summary.push('피로 경고: 회복 주간으로 컨디션을 관리하세요.');
    s.lastWeek = { games, summary, gains, gamesPlayed: weekly.g };
    const visit=recordScoutVisit(s);
    if(visit)s.lastWeek.summary.push(team(visit.teamId).name+' '+(visit.kind==='analyst'?'전력분석관':'스카우트')+'이 경기를 관찰했습니다.');
    if(s.lastWeek.summary.length>6)s.lastWeek.summary.splice(5,s.lastWeek.summary.length-6);
    log(s, s.week + '주차 리포트', summary.join(' / '), 'week');
    if (s.week === s.schedule.weekCount) {
      s.phase = 'seasonEnd';
      if(s.stage==='highschool'&&s.age===18&&s.mobility.draftPlan==='domestic')s.draftTeamId=selectDraftTeam(s);
      log(s,'시즌 종료',s.schedule.gamesPerTeam+'경기의 시즌이 끝났습니다. 기록과 다음 시즌 진로를 확인하세요.','season');
      const retirement=getRetirementStatus(s);if(retirement.recommended)log(s,'구단의 은퇴 권고',retirement.detail,'career');
      const trades=getTradeStatus(s);if(trades.offers.length)log(s,'구단 간 트레이드 통보',team(trades.offers[0].teamId).name+'와 12월 1일 오프시즌 양도를 진행합니다.','contract');
    }
    else s.pendingEvent = s.freeAgency.active?null:weekEvent(s);
    if(s.freeAgency.active&&(s.week===2||s.week%4===0)){
      const offers=getFreeAgentStatus(s).offers;if(offers.length)log(s,'무소속 선수에게 온 계약 문의',offers.map(o=>team(o.teamId).name).join(' · ')+'에서 1년 계약을 제안했습니다.','contract');
    }
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
    const unsigned=s.freeAgency.active;
    s.seasons.push({season:s.season,age:s.age,teamId:s.teamId,stats:clone(s.stats),overall:overall(s),wins:unsigned?0:row.w,losses:unsigned?0:row.l,ties:unsigned?0:row.t,stage:unsigned?'unattached':s.stage,leagueId:s.leagueId,scheduledGames:unsigned?0:s.schedule.gamesPerTeam});
  }
  function selectDraftTeam(s) {
    const choices=TEAMS.filter(t=>t.leagueId===SCHOOL_PATHS[s.schoolCountry||'kr'].leagueId).slice().sort((a,b)=>a.competition-b.competition);
    const seed=seedValue(s.id+':draft:'+overall(s)+':'+s.schoolStats.g);
    return choices[seed%choices.length].id;
  }
  function seasonMarketScore(s) {
    const st=s.stage==='highschool'?getSchoolSeasonStats(s):s.stats;
    if(s.role==='batter') {
      const rates=rateStats(st,s.role);
      return st.pa<(s.stage==='highschool'?15:150)?0:clamp((Number(rates.ops)-.55)*100+st.hr*.7+st.sb*.25,0,100);
    }
    return st.outs<(s.stage==='highschool'?12:90)?0:clamp((5-st.er*27/st.outs)*17+st.so*.13+(st.sv+st.hld)*.5,0,100);
  }
  function getSchoolSeasonStats(s,season=s.season,base=s.stats){const st=clone(base);for(const cup of s.amateur.schoolCups.filter(c=>c.season===season))for(const r of cup.results)addStats(st,r.stats);return st;}
  function getSchoolCareerStats(s){const st=clone(s.schoolStats);for(const cup of s.amateur.schoolCups)for(const r of cup.results)addStats(st,r.stats);return st;}
  function schoolRank(s){return s.standings.slice().sort((a,b)=>b.w-a.w||a.l-b.l||b.rs-b.ra-(a.rs-a.ra)||a.teamId.localeCompare(b.teamId)).findIndex(v=>v.teamId===s.teamId)+1;}
  function schoolCupEligible(s,cup){
    if(cup.qualifier==='underclass')return s.age<18;
    if(cup.qualifier==='selection')return s.age>16&&s.amateur.schoolCups.some(c=>c.season===s.season-1&&c.id==='autumn'&&c.results.filter(r=>r.our>r.opp).length>=3);
    if(cup.qualifier==='osaka'||cup.qualifier==='cifss')return s.amateur.schoolCups.some(c=>c.season===s.season&&c.id===cup.qualifier&&c.status==='champion');
    return cup.qualifier!=='rank4'||schoolRank(s)<=4;
  }
  function getSchoolCompetitions(s){
    if(s.amateur.schoolMode!=='real')return {region:'기존 가상 고교 일정 유지',competitions:[],stats:getSchoolSeasonStats(s)};
    return {region:pathways.SCHOOLS[s.schoolCountry].region,stats:getSchoolSeasonStats(s),competitions:pathways.SCHOOL_CUPS[s.schoolCountry].map(c=>({...clone(c),record:clone(s.amateur.schoolCups.find(v=>v.season===s.season&&v.id===c.id)||null)}))};
  }
  function schoolCupWeek(s,week){
    if(s.stage!=='highschool'||s.amateur.schoolMode!=='real')return false;
    const w=getSeasonSchedule(s).weeks[week];if(!w)return false;
    return pathways.SCHOOL_CUPS[s.schoolCountry].some(c=>{
      const r=s.amateur.schoolCups.find(v=>v.season===s.season&&v.id===c.id);
      return (!r||r.status==='active')&&schoolCupEligible(s,c)&&c.dates.some(md=>{const d=s.schedule.year+'-'+md;return d>=w.startDate&&d<=w.endDate;});
    });
  }
  function pathGame(s,opponent,ourStrength,date,participate=true){
    let our=poisson(s,4.4+(ourStrength-opponent.strength)*.055),opp=poisson(s,4.4+(opponent.strength-ourStrength)*.055),st=blankStats();
    const restDays=s.role==='pitcher'?(s.pitchingRole==='starter'?5:1):0;
    const rested=!s.amateur.pathPitchDate||(Date.parse(date)-Date.parse(s.amateur.pathPitchDate))/86400000>=restDays;
    const chance=clamp(.7+(overall(s)-opponent.competition)*.012-Math.max(0,s.fatigue-35)*.006,.2,.96);
    if(participate&&!s.injury&&rested&&random(s)<chance){
      st=s.role==='batter'?batGame(s,opponent):pitchGame(s,opponent);
      if(s.role==='batter')our=Math.max(our,st.r,st.rbi);else{opp=st.ra+poisson(s,(27-st.outs)/27*4);s.amateur.pathPitchDate=date;}
      s.fatigue=clamp(s.fatigue+(s.role==='batter'?2:st.starts?7:3),0,100);
    }
    // Knockout games must produce a winner. Inning-by-inning pitching/pitch counts are abstracted.
    if(our===opp){if(random(s)<.5)our++;else opp++;}
    if(s.role==='pitcher'&&st.g){if(st.starts&&st.outs>=15&&our>opp)st.w=1;else if(our<opp&&st.ra>0)st.l=1;else if(!st.starts&&our>opp&&our-opp<=3&&st.ra===0){if(s.pitchingRole==='closer')st.sv=1;else st.hld=1;}}
    return {date,opponentId:opponent.id,our,opp,stats:st};
  }
  function playSchoolCups(s){
    if(s.stage!=='highschool'||s.amateur.schoolMode!=='real')return 0;
    const w=getSeasonSchedule(s).weeks[s.week-1];let appearances=0;
    for(const cup of pathways.SCHOOL_CUPS[s.schoolCountry])for(let round=0;round<cup.dates.length;round++){
      const date=s.schedule.year+'-'+cup.dates[round];if(date<w.startDate||date>w.endDate)continue;
      let row=s.amateur.schoolCups.find(v=>v.season===s.season&&v.id===cup.id);
      if(!row){row={season:s.season,id:cup.id,status:schoolCupEligible(s,cup)?'active':'unqualified',results:[],pool:[]};s.amateur.schoolCups.push(row);if(row.status==='unqualified')log(s,cup.name+' · 출전권 없음',cup.qualifier==='selection'?'센바쓰는 전년도 가을 성적·선발 평가를 반영하며 첫 학년은 출전하지 않습니다.':'지역 성적 또는 앞선 대회 출전 조건을 충족하지 못했습니다.','season');}
      if(row.status!=='active')continue;
      const ids=s.scheduleTeamIds,own=ids.indexOf(s.teamId),group=own<4?ids.slice(0,4):ids.slice(4);
      let result=null;
      if(cup.format==='double-pool'&&round<3){
        if(!row.pool.length)row.pool=alternativeRows(group);
        let matches;
        if(round===0)matches=pathways.pairs(group,0);
        else if(round===1)matches=[row.pool.filter(r=>r.w===1).map(r=>r.teamId),row.pool.filter(r=>r.w===0).map(r=>r.teamId)];
        else matches=[row.pool.filter(r=>r.w===1&&r.l===1).map(r=>r.teamId)];
        for(const pair of matches){
          if(pair.length!==2)continue;let u,v;
          if(pair.includes(s.teamId)){const rival=team(pair.find(id=>id!==s.teamId));result=pathGame(s,{...rival,competition:45},team(s.teamId).strength,date);row.results.push(result);appearances+=result.stats.g;u=pair[0]===s.teamId?result.our:result.opp;v=pair[0]===s.teamId?result.opp:result.our;}
          else {u=poisson(s,4);v=poisson(s,4);if(u===v)u++;}
          const a=row.pool.find(r=>r.teamId===pair[0]),b=row.pool.find(r=>r.teamId===pair[1]);a.w+=u>v?1:0;a.l+=u>v?0:1;a.rs+=u;a.ra+=v;b.w+=u>v?0:1;b.l+=u>v?1:0;b.rs+=v;b.ra+=u;
        }
        if(row.pool.find(r=>r.teamId===s.teamId).l>=2)row.status='out';
      }else {
        if(cup.format==='double-pool'&&row.pool.find(r=>r.teamId===s.teamId)?.w<2){row.status='out';continue;}
        let pool=ids.filter(id=>id!==s.teamId);
        if(s.schoolCountry==='jp'&&['senbatsu','summer'].includes(cup.id))pool=pathways.NATIONAL_SCHOOLS.filter(t=>t.country==='jp').map(t=>t.id);
        if(cup.format==='double-pool'){
          const otherGroup=ids.filter(id=>!group.includes(id));
          const backgrounds=pathways.NATIONAL_SCHOOLS.filter(t=>t.country==='us').map(t=>t.id);
          pool=[otherGroup,backgrounds.slice(0,4),backgrounds.slice(4)].flatMap(g=>g.slice().sort((a,b)=>seedValue(s.id+':cifqual:'+s.season+':'+a)-seedValue(s.id+':cifqual:'+s.season+':'+b)).slice(0,2));
        }
        const remaining=pool.filter(id=>!row.results.some(r=>r.opponentId===id));
        const opponentId=(remaining.length?remaining:pool)[seedValue(s.id+':cup:'+s.season+':'+cup.id+':'+round)%Math.max(1,remaining.length||pool.length)];
        const opponent={...(team(opponentId)||pathways.NATIONAL_SCHOOLS.find(t=>t.id===opponentId)),competition:45};result=pathGame(s,opponent,team(s.teamId).strength,date);row.results.push(result);appearances+=result.stats.g;
        if(result.our<result.opp)row.status='out';else if(round===cup.dates.length-1)row.status='champion';
      }
      if(result){const win=result.our>result.opp;log(s,cup.name+' · '+(row.status==='champion'?'우승':row.status==='out'?'탈락':win?'승리':'풀 대회 1패'),getSchoolName(s.teamId,s.schoolCountry,s.amateur.schoolMode)+' '+result.our+':'+result.opp+' '+getSchoolName(result.opponentId,s.schoolCountry,s.amateur.schoolMode)+' · '+(result.stats.g?'선수 출전':'출전 대기')+'. 대회 기록은 지역·연습 경기와 별도로 보관합니다.','season');}
    }
    return appearances;
  }
  function alternativeRows(ids){return ids.map(teamId=>({teamId,w:0,l:0,rs:0,ra:0}));}
  function pathAppearances(s){return s.amateur.schoolCups.reduce((n,c)=>n+c.results.reduce((v,r)=>v+r.stats.g,0),0)+s.amateur.alternativeHistory.reduce((n,a)=>n+a.stats.g,0)+(s.amateur.alternative?.stats.g||0);}
  function sortedAlternative(rows){return rows.slice().sort((a,b)=>b.w/(b.w+b.l||1)-a.w/(a.w+a.l||1)||b.w-a.w||b.rs-b.ra-(a.rs-a.ra)||a.teamId.localeCompare(b.teamId));}
  function blankAlternative(s,leagueId,teamId,joinedDate){const l=pathways.byId(leagueId);return {season:s.season,leagueId,teamId,joinedWeek:s.week,joinedDate,processedDate:[pathways.dateAt(s.schedule.year+'-'+l.start,-1),pathways.dateAt(joinedDate,-1)].sort()[0],stage:1,round:0,participants:l.clubs.map(c=>c.id),standings:alternativeRows(l.clubs.map(c=>c.id)),stageTables:[],results:[],stats:blankStats(),finished:false,championId:null,income:0};}
  function advanceAlternativeDay(s,a,date,participate=true){
    const l=pathways.byId(a.leagueId);if(a.finished)return;
    const isJaba=l.kind!=='independent';let pairs,winners=[];
    if(l.id==='gg'&&a.stage===4){
      const seeds=a.participants,challenger=a.championId;
      pairs=a.round===0?[[seeds[2],seeds[3]]]:[[seeds[a.round===1?1:0],challenger]];
    }else if(a.stage>=2&&l.id!=='gg')pairs=Array.from({length:a.participants.length/2},(_,i)=>a.participants.slice(i*2,i*2+2));
    else pairs=pathways.pairs(a.participants,a.round);
    for(const pair of pairs){
      const npc={rng:seedValue(s.id+':'+a.season+':'+l.id+':'+date+':'+pair[0])},own=pair.includes(a.teamId);
      let u,v,result=null;
      if(own&&participate&&date>=a.joinedDate){const rival=pathways.club(pair.find(id=>id!==a.teamId));result=pathGame(s,rival,l.strength,date);u=pair[0]===a.teamId?result.our:result.opp;v=pair[0]===a.teamId?result.opp:result.our;a.results.push(result);addStats(a.stats,result.stats);}
      else{u=poisson(npc,4.5);v=poisson(npc,4.5);if(u===v)u++;}
      const home=a.standings.find(r=>r.teamId===pair[0]),away=a.standings.find(r=>r.teamId===pair[1]);home.rs+=u;home.ra+=v;away.rs+=v;away.ra+=u;home.w+=u>v?1:0;home.l+=u>v?0:1;away.w+=u>v?0:1;away.l+=u>v?1:0;
      if(l.id==='gg'&&a.stage===4)a.championId=u>v?pair[0]:pair[1];
      winners.push(u>v?pair[0]:pair[1]);
    }
    a.round++;
    if(a.stage>=2&&l.id!=='gg'){
      a.stageTables.push({stage:a.stage,standings:clone(a.standings)});
      if(winners.length>1){a.participants=winners;a.standings=alternativeRows(winners);return;}
      a.championId=winners[0];
      if(participate)log(s,(isJaba?(l.kind==='club'?'전일본 클럽선수권':a.stage===2?'도시대항야구':'사회인 일본선수권'):l.name+' 챔피언십')+' · 최종 결과',pathways.club(a.championId).name+' 우승. 본선은 대표 구단을 사용한 최종 라운드 축약이며 대진·시리즈 승수는 게임 설정입니다.','season');
      if(isJaba&&l.kind==='company'&&a.stage===2){a.stage=3;a.round=0;a.participants=sortedAlternative(a.stageTables.find(t=>t.stage===1).standings).slice(0,4).map(r=>r.teamId);a.standings=alternativeRows(a.participants);a.championId=null;return;}
      a.finished=true;return;
    }
    if(['atlantic','shikoku'].includes(l.id)&&a.stage===1&&a.round===l.rounds/2)a.stageTables.push({stage:0,standings:clone(a.standings)});
    let length=l.id==='gg'?[18,14,3,3][a.stage-1]:isJaba?12:l.rounds;
    if(a.round<length)return;
    const ranks=sortedAlternative(a.standings);a.stageTables.push({stage:a.stage,standings:clone(a.standings)});
    if(l.id==='gg'&&a.stage<4){
      a.participants=ranks.slice(0,[8,4,4][a.stage-1]).map(r=>r.teamId);a.stage++;a.round=0;a.standings=alternativeRows(a.participants);
      if(participate)log(s,'경기도리그 Stage '+a.stage,(a.participants.includes(a.teamId)?'다음 단계에 진출했습니다.':'소속팀이 단계별 컷에서 탈락했습니다. 남은 기간에는 훈련하며 복귀 제안을 기다립니다.'),'season');
    }else if(l.id!=='gg'){
      let selected=ranks.slice(0,l.id==='shikoku'?2:4).map(r=>r.teamId);
      if(['atlantic','shikoku'].includes(l.id)){
        const first=a.stageTables.find(t=>t.stage===0)?.standings;
        const groups=l.id==='atlantic'?[l.clubs.slice(0,5),l.clubs.slice(5)]:[l.clubs];
        if(first)selected=groups.flatMap(group=>{
          const ids=group.map(c=>c.id),half1=sortedAlternative(first.filter(r=>ids.includes(r.teamId)))[0].teamId;
          const half2=sortedAlternative(a.standings.filter(r=>ids.includes(r.teamId)).map(r=>{const p=first.find(x=>x.teamId===r.teamId);return {teamId:r.teamId,w:r.w-p.w,l:r.l-p.l,rs:r.rs-p.rs,ra:r.ra-p.ra};}))[0].teamId;
          return [half1,half2===half1?ranks.find(r=>ids.includes(r.teamId)&&r.teamId!==half1).teamId:half2];
        });
      }
      a.participants=selected;a.stage=2;a.round=0;a.standings=alternativeRows(selected);
    }else a.finished=true;
  }
  function jabaGameDate(a){return a.leagueId==='jaba-club'?['09-07','09-07'][a.round]:a.stage===2?['09-05','09-06'][a.round]:['11-09','11-10'][a.round];}
  function processAlternativeUntil(s,a,through,participate=true){
    const l=pathways.byId(a.leagueId);for(let date=pathways.dateAt(a.processedDate,1);date<=through;date=pathways.dateAt(date,1)){
      if(l.kind!=='independent'&&a.stage>=2){while(!a.finished&&date.slice(5)===jabaGameDate(a))advanceAlternativeDay(s,a,date,participate);}
      else if(date.slice(5)>=l.start&&l.days.includes(new Date(date+'T12:00:00Z').getUTCDay()))advanceAlternativeDay(s,a,date,participate);
      a.processedDate=date;
    }
  }
  function getAlternativeStatus(s){
    const a=s.amateur.alternative;
    const npbWait=s.amateur.jabaSince===null?0:Math.max(0,2-(s.season-s.amateur.jabaSince+(s.phase==='seasonEnd'?1:0)));
    return {active:!!a,current:a?clone(a):null,league:a?clone(pathways.byId(a.leagueId)):null,club:a?clone(pathways.club(a.teamId)):null,npbWait,history:clone(s.amateur.alternativeHistory),offers:getAlternativeOffers(s)};
  }
  function getAlternativeOffers(s){
    if(!s.freeAgency.active||s.phase!=='active'||s.amateur.alternative||s.week>6||s.amateur.alternativeHistory.some(a=>a.season===s.season))return [];
    if(!s.freeAgency.international)return [];
    const rating=overall(s),date=getSeasonSchedule(s).weeks[s.week].startDate;
    return pathways.LEAGUES.flatMap(l=>{
      if(rating<l.strength-18)return [];
      const clubs=l.clubs.map(c=>({c,score:seedValue(s.id+':tryout:'+s.season+':'+c.id)%100})).sort((a,b)=>b.score-a.score).slice(0,2);
      return clubs.map(({c})=>({leagueId:l.id,teamId:c.id,joinedDate:date,reason:l.kind==='company'?'가상 채용·등록 심사를 통과한 직원 선수 제안':l.kind==='club'?'등록 클럽팀의 선수 모집 제안':'독립구단 트라이아웃 통과 제안'}));
    });
  }
  function joinAlternative(input,teamId){
    const s=validateSave(input),offer=getAlternativeOffers(s).find(o=>o.teamId===teamId);if(!offer)fail('입단할 수 있는 트라이아웃 제안을 선택해 주세요.');
    const a=blankAlternative(s,offer.leagueId,teamId,offer.joinedDate);processAlternativeUntil(s,a,pathways.dateAt(offer.joinedDate,-1),false);
    if(a.finished||!a.participants.includes(teamId))fail('해당 구단은 현재 대회 일정을 마쳤습니다.');
    s.amateur.alternative=a;s.amateur.extendedSeason=s.season;
    if(pathways.byId(a.leagueId).kind!=='independent')s.amateur.jabaSince=s.season;
    s.schedule=makeSchedule(s);
    log(s,'새로운 무대 · '+pathways.byId(a.leagueId).name,pathways.club(teamId).name+'에 합류합니다. KBO·NPB·MLB 기록과 서비스를 추가하지 않고 별도 경기 기록을 쌓습니다.'+(pathways.byId(a.leagueId).kind!=='independent'?' JABA 등록 후 2시즌은 NPB 재계약을 제한하며 복귀 협상은 시즌 후 드래프트 이후 창에서 진행합니다.':''),'contract');return s;
  }
  function closeAlternative(s,reason){
    const a=s.amateur.alternative;if(!a)return;
    s.amateur.alternativeHistory.push({...clone(a),leftWeek:s.week,reason});s.amateur.alternative=null;
  }
  function leaveAlternative(input){const s=validateSave(input);if(!s.amateur.alternative)fail('소속된 독립·사회인 구단이 없습니다.');closeAlternative(s,'personal');log(s,'개인훈련으로 전환','소속 구단의 방출·등록 말소 동의를 받은 게임 경로로 개인훈련을 시작합니다. JABA 등록에 따른 NPB 재계약 제한은 유지됩니다.','contract');return s;}
  function playAlternativeWeek(s){
    const a=s.amateur.alternative;if(!a)return 0;
    const w=getSeasonSchedule(s).weeks[s.week-1],before=a.stats.g;processAlternativeUntil(s,a,w.endDate);
    if(pathways.byId(a.leagueId).kind==='company'){const pay=3600/s.schedule.weekCount;a.income+=pay;s.totalSalary+=pay;}
    return a.stats.g-before;
  }
  function alternativeMarketScore(s){
    const rows=s.amateur.alternative?[s.amateur.alternative]:s.amateur.alternativeHistory.filter(a=>a.season===s.season);
    const st=blankStats();rows.forEach(a=>addStats(st,a.stats));
    if(s.role==='batter')return st.pa<12?0:clamp((Number(rateStats(st,s.role).ops)-.6)*75+st.hr*.8+st.sb*.25,0,100)*Math.min(1,st.pa/80);
    return st.outs<9?0:clamp((5-st.er*27/st.outs)*15+st.so*.25+(st.sv+st.hld),0,100)*Math.min(1,st.outs/90);
  }
  function getAlternativeReturnOffers(s){
    if(!s.freeAgency.active||s.phase!=='seasonEnd'||s.age>=40||!s.amateur.alternative&&!s.amateur.alternativeHistory.some(a=>a.season===s.season))return [];
    const rating=overall(s),score=alternativeMarketScore(s),previous=s.seasons.filter(v=>v.stage==='pro').at(-1);
    const market={rng:seedValue(s.id+':alternative-return:'+s.season)};random(market);if(random(market)>clamp(.1+Math.max(0,rating-45)*.006+score*.004,.03,.8))return [];
    const origin=team(s.freeAgency.originTeamId).leagueId;
    return TEAMS.filter(t=>t.leagueId!=='highschool'&&(s.freeAgency.international||t.leagueId===origin)&&!(t.leagueId==='npb'&&s.amateur.jabaSince!==null&&s.season-s.amateur.jabaSince+1<2)).map(t=>({t,value:rating+score*.4+s.scouting.interest[t.id]*.4-t.competition+seedValue(s.id+':return-club:'+s.season+':'+t.id)%30})).filter(v=>v.value>=20).sort((a,b)=>b.value-a.value).slice(0,2).map(({t})=>({teamId:t.id,years:[1],annualSalary:Math.max(100,Math.round(salaryOffer({...s,stats:previous?.stats||s.stats},t.id)*.6/100)*100),reason:'독립·사회인 성적과 현재 기량을 평가한 다음 시즌 복귀 제안'}));
  }
  function signAlternativeReturn(input,teamId){
    let s=validateSave(input);const offer=getAlternativeReturnOffers(s).find(o=>o.teamId===teamId);if(!offer)fail('도착한 다음 시즌 복귀 제안을 선택해 주세요.');
    const origin=s.freeAgency.originTeamId,originLeague=team(origin).leagueId,prior=clone(s.contract),qualified=contractRights({...s,contract:{...prior,internationalVeteran:false}},false).domestic;
    closeAlternative(s,'pro');s=continueUnsignedSeason(s);s.teamId=teamId;s.leagueId=team(teamId).leagueId;s.freeAgency=blankFreeAgency();prior.faService[originLeague]=prior.leagueService[originLeague];if(originLeague!==s.leagueId)prior.internationalVeteran=true;
    s.contract=newContract(s,1,prior);s.contract.annualSalary=offer.annualSalary;s.salary=offer.annualSalary;s.scheduleTeamIds=TEAMS.filter(t=>t.leagueId===s.leagueId).map(t=>t.id);s.schedule=null;s.schedule=makeSchedule(s);s.standings=blankStandings(s.scheduleTeamIds);
    s.transfers.faSignings.push({date:s.schedule.year+'-01-01',fromTeamId:origin,toTeamId:teamId,qualified});log(s,'다시 프로의 유니폼',team(teamId).name+'와 다음 시즌 1년 계약을 맺었습니다. 독립·사회인 기간의 프로 서비스는 가산하지 않습니다.','contract');return s;
  }
  function getScoutingReport(s){
    const score=s.amateur.alternative?alternativeMarketScore(s):seasonMarketScore(s),chance=clamp(.05+score*.0045+Math.max(0,overall(s)-55)*.002,.05,.65);
    return {chance,encounter:s.scouting.encounter?clone(s.scouting.encounter):null,visits:clone(s.scouting.visits),clubs:TEAMS.filter(t=>t.leagueId!=='highschool'&&s.scouting.interest[t.id]>0).map(t=>({teamId:t.id,interest:s.scouting.interest[t.id]})).sort((a,b)=>b.interest-a.interest)};
  }
  function recordScoutVisit(s){
    const roll=seedValue(s.id+':visit:'+s.season+':'+s.week)/4294967296;
    if(!(s.stage==='highschool'?getSchoolSeasonStats(s).g:s.stats.g+(s.amateur.alternative?.stats.g||0))||roll>=getScoutingReport(s).chance)return null;
    let candidates=TEAMS.filter(t=>t.leagueId!=='highschool'&&t.id!==s.teamId);
    if(s.stage==='highschool'){
      const domestic=seedValue(s.id+':visitor-region:'+s.season+':'+s.week)%4<3;
      candidates=candidates.filter(t=>(t.leagueId===SCHOOL_PATHS[s.schoolCountry].leagueId)===domestic);
    }
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
  function chooseDraftPlan(input,plan) {
    const s=validateSave(input);
    if(s.stage!=='highschool'||s.age!==18||s.phase==='retired'||!['domestic','overseas'].includes(plan)||s.mobility.draftPlan===plan)fail('졸업 학년의 진로를 확인해 주세요.');
    s.mobility.draftPlan=plan;
    s.draftTeamId=s.phase==='seasonEnd'&&plan==='domestic'?selectDraftTeam(s):null;
    log(s,'졸업 후 진로 상담',plan==='domestic'?'국내 드래프트 참가 경로를 선택했습니다.':'국내 드래프트에 참가하지 않고 해외 구단의 평가를 받습니다. 제안이 없으면 국내 참가로 돌아갈 수 있습니다.','career');
    return s;
  }
  function getGraduationOffers(s) {
    if(s.stage!=='highschool'||s.age!==18||s.phase!=='seasonEnd'||s.mobility.draftPlan!=='overseas')return [];
    const home=SCHOOL_PATHS[s.schoolCountry].leagueId,score=seasonMarketScore(s),rating=overall(s);
    if(rating<50)return [];
    return ['mlb','npb'].filter(l=>l!==home).flatMap(leagueId=>{
      const ranked=TEAMS.filter(t=>t.leagueId===leagueId).map(t=>({t,value:s.scouting.interest[t.id]*.8+score*.5+(rating-45)*.65+seedValue(s.id+':amateur:'+s.season+':'+t.id)%25})).sort((a,b)=>b.value-a.value);
      return ranked.filter(v=>v.value>=28&&(score>=15||s.scouting.interest[v.t.id]>=15)).slice(0,score>=55?2:1).map(({t})=>({teamId:t.id,years:[1],annualSalary:salaryOffer({...s,stage:'pro'},t.id),reason:leagueId==='mlb'?'국제 아마추어·마이너 진출 제안':'해외 아마추어·육성 진출 제안'}));
    });
  }
  // Real deadlines; later MLB seasons explicitly reuse the 2026 template.
  function getTradeRules(leagueId,year=2026) {
    if(!['kbo','npb','mlb'].includes(leagueId))fail('프로 리그를 확인해 주세요.');
    return {deadline:year+(leagueId==='mlb'?'-08-03':'-07-31'),template:leagueId==='mlb'&&year!==2026,
      window:leagueId==='kbo'?'포스트시즌 종료 다음 날~7월 31일':leagueId==='npb'?'연맹 선수권 시즌 종료 다음 날~7월 31일':'2026년 8월 3일 18시(미 동부) 마감',
      detail:leagueId==='kbo'?'계약 승계 · 일반 거부권 없음 · 현금 트레이드 신인 1년 제한 · 타 구단 FA 계약 후 1년 제한 · 이전비 200만 원':leagueId==='npb'?'계약 승계 · 일반 거부권 없음 · 웨이버 양도는 별도 제도':'10년 경력·동일 구단 5년은 서면 동의 · FA 계약 후 다음 6월 15일까지 선수 동의 필요(현금 5만 달러 이하)',
      source:leagueId==='kbo'?'https://www.koreabaseball.com/Kbo/Board/Ebook/EbookPublication.aspx':leagueId==='npb'?'https://npb.jp/news/detail/20260731_02.html':'https://www.mlbplayers.com/cba'};
  }
  function tradeDate(s){return s.phase==='seasonEnd'?s.schedule.year+'-12-01':getSeasonSchedule(s).weeks[s.week]?.startDate||s.schedule.endDate;}
  function anniversary(date){return (Number(date.slice(0,4))+1)+date.slice(4);}
  function tradeEligibility(s,date=tradeDate(s)) {
    const rules=getTradeRules(s.leagueId,s.schedule.year),offseason=date.slice(5)>='12-01';
    // No postseason simulation: Dec 1 represents a completed postseason, never regular-season end.
    const npbReopens=date>s.schedule.endDate;
    if(date>rules.deadline&&!(s.leagueId==='npb'?npbReopens:offseason))return {allowed:false,requiresConsent:false,reason:'트레이드 마감 이후입니다.'};
    if(s.leagueId==='kbo') {
      if(s.transfers.draftedOn&&date<anniversary(s.transfers.draftedOn))return {allowed:false,requiresConsent:false,reason:'신인 계약 후 1년: 현금 양도 제한(선수 간 교환은 예외)'};
      if(s.transfers.faSignings.some(f=>f.qualified&&team(f.fromTeamId).leagueId==='kbo'&&f.fromTeamId!==f.toTeamId&&team(f.toTeamId).leagueId==='kbo'&&date>=f.date&&date<anniversary(f.date)))return {allowed:false,requiresConsent:false,reason:'타 구단 FA 계약 체결일부터 1년간 양도 제한'};
    }
    let requiresConsent=false,reason='구단 간 계약 양도 · 선수에게 일반 거부권 없음';
    if(s.leagueId==='mlb') {
      const completed=s.seasons.filter(v=>v.season<s.season);
      if(s.phase==='seasonEnd')completed.push({season:s.season,teamId:s.teamId,stage:s.stage,leagueId:s.leagueId});
      const recent=completed.slice(-5);
      const tenureStart=recent[0]?.season;
      const tenFive=s.contract.leagueService.mlb+(s.phase==='seasonEnd'?1:0)>=10&&recent.length===5&&recent.every(v=>v.stage==='pro'&&v.leagueId==='mlb'&&v.teamId===s.teamId)&&!s.transfers.moves.some(m=>m.season>=tenureStart&&(m.fromTeamId!==s.teamId||m.toTeamId!==s.teamId));
      const recentFA=s.transfers.faSignings.filter(f=>f.qualified&&team(f.fromTeamId).leagueId==='mlb'&&f.toTeamId===s.teamId&&f.date<=date).at(-1);
      const june=recentFA?(Number(recentFA.date.slice(0,4))+(recentFA.date.slice(5)>'06-15'?1:0))+'-06-15':null;
      const earlyFA=!!recentFA&&date<=june;
      requiresConsent=tenFive||earlyFA;
      if(requiresConsent)reason=tenFive?'MLB 10년·동일 구단 5년: 서면 동의권':'MLB FA 계약 후 다음 6월 15일까지: 현금 5만 달러 이하·서면 동의 조건';
    }
    return {allowed:true,requiresConsent,reason};
  }
  function getTradeStatus(s) {
    const unavailable={eligible:false,offers:[],context:'계약·보류권이 있는 프로 선수의 구단 간 현금 트레이드입니다.'};
    if(s.stage!=='pro'||s.freeAgency.active||s.phase==='retired'||s.age>=40)return unavailable;
    const rights=contractRights(s,s.phase==='seasonEnd');if(s.phase==='seasonEnd'&&rights.domestic)return unavailable;
    const date=tradeDate(s),eligibility=tradeEligibility(s,date),rules=getTradeRules(s.leagueId,s.schedule.year);
    if(!eligibility.allowed)return {...unavailable,context:eligibility.reason,rules,date};
    const base={eligible:true,offers:[],date,rules,requiresConsent:eligibility.requiresConsent,consentReason:eligibility.reason};
    if(s.transfers.moves.some(m=>m.season===s.season&&m.week===s.week)||s.phase==='active'&&(!s.week||s.week%4!==0))return {...base,context:'구단의 전력 재편 검토: 시즌 중에는 4주마다 협의를 평가합니다.'};
    const rows=s.standings.slice().sort((a,b)=>(b.w/(b.w+b.l||1)-a.w/(a.w+a.l||1))||b.w-a.w||(b.rs-b.ra)-(a.rs-a.ra));
    const rank=rows.findIndex(r=>r.teamId===s.teamId)+1,score=seasonMarketScore(s),rating=overall(s);
    const opportunities=seasonOpportunities(s,s.season,getSeasonSchedule(s),s.week,s.teamId);
    const limited=s.role==='batter'?s.stats.g<opportunities*.55:s.pitchingRole==='starter'?s.stats.starts<opportunities/6*.625:s.stats.g<opportunities*(s.pitchingRole==='closer'?.14:.21);
    const rebuilding=rank>Math.ceil(rows.length*.65)&&(s.age>=26||rating>=60||score>=35);
    const context=team(s.teamId).name+' '+rank+'위 · '+(rebuilding?'전력 재편 검토':limited?'출전 기회 조정':'주요 전력 유지');
    if(!limited&&!rebuilding)return {...base,context};
    const chance=Math.min(.9,.2+(rebuilding?.35:0)+(limited?.25:0)+score/500);
    const roll={rng:seedValue(s.id+':trade-roll:'+s.season+':'+s.week)};random(roll);
    if(random(roll)>=chance*(s.phase==='active'?.25:1))return {...base,context};
    const candidates=rows.filter(row=>row.teamId!==s.teamId).map(row=>{
      const t=team(row.teamId),targetRank=rows.indexOf(row)+1,need=seedValue(s.id+':trade-need:'+s.season+':'+t.id+':'+(s.position||s.pitchingRole))%100;
      const contender=targetRank<=Math.ceil(rows.length/2),opening=limited&&(t.competition<team(s.teamId).competition||need>=60);
      const fits=rebuilding&&contender&&(rating>=55||score>=35)||opening;
      return {t,targetRank,need,fits,reason:rebuilding&&contender?'하위권 구단의 전력 재편 · 상위권 구단의 즉시 전력 보강':'출전 기회 조정 · 포지션/보직 수요',value:need+s.scouting.interest[t.id]+(contender?score*.3:15)};
    }).filter(v=>v.fits).sort((a,b)=>b.value-a.value).slice(0,1);
    return {...base,context,offers:candidates.filter(v=>!eligibility.requiresConsent||!s.mobility.declinedTrades.includes(v.t.id)).map(v=>({teamId:v.t.id,years:[s.phase==='active'?s.contract.yearsLeft:Math.max(1,rights.yearsLeft)],annualSalary:s.phase==='active'||rights.yearsLeft>0?s.salary:salaryOffer(s,v.t.id),reason:v.reason,targetRank:v.targetRank,cash:s.leagueId==='mlb'?50000:Math.max(100,Math.round(s.salary*.5/100)*100)*(s.leagueId==='npb'?1000:1),relocation:s.leagueId==='kbo'?200:0}))};
  }
  function declineTrade(input,teamId) {
    const s=validateSave(input),status=getTradeStatus(s);
    if(!status.offers.some(o=>o.teamId===teamId))fail('응답할 트레이드 협의가 없습니다.');
    if(!status.requiresConsent)fail('이 계약 양도에는 선수의 일반적인 거부권이 없습니다.');
    s.mobility.declinedTrades.push(teamId);log(s,'트레이드 동의권 행사',team(teamId).name+' 이적에 서면 동의하지 않고 현재 구단에 남습니다.','contract');return s;
  }
  function recordTrade(s,offer,offseason=false) {
    s.transfers.moves.push({season:s.season,week:s.week,date:tradeDate(s),fromTeamId:s.teamId,toTeamId:offer.teamId,stats:clone(s.stats),cash:offer.cash,relocation:offer.relocation,offseason,lastStartDate:s.role==='pitcher'&&s.pitchingRole==='starter'?s.lastWeek?.games.filter(g=>g.played).at(-1)?.date||null:null});
    log(s,'트레이드 승인·공시',team(s.teamId).name+' → '+team(offer.teamId).name+' · 현금 '+offer.cash.toLocaleString('ko-KR')+(s.leagueId==='mlb'?'달러':s.leagueId==='npb'?'엔':'만원')+'(구단 간 지급). 계약·연봉·경력을 승계합니다.'+(offer.relocation?' 양 구단이 각 100만원씩 부담한 이전비 200만원을 받았습니다.':''),'contract');
  }
  function applyTrade(s,offer) {
    recordTrade(s,offer);s.teamId=offer.teamId;s.schedule=makeSchedule(s);s.trust=48;s.mobility.declinedTrades=[];
    s.lastWeek={games:[],summary:['구단 간 트레이드 승인·공시: '+team(offer.teamId).name+'에 합류합니다.','기존 시즌 기록과 연봉을 승계하며 다음 경기부터 새 팀에서 출전합니다.'],gains:[],gamesPlayed:0};
    return s;
  }
  function executeTrade(input,teamId) {
    const s=validateSave(input);if(s.phase!=='active'||s.pendingEvent)fail('주간 사건 선택을 마친 뒤 합류해 주세요.');
    const offer=getTradeStatus(s).offers.find(o=>o.teamId===teamId);if(!offer)fail('공시할 트레이드가 없습니다.');
    return applyTrade(s,offer);
  }
  function seasonOpportunities(s,season,calendar,week,finalTeam) {
    const moves=s.transfers.moves.filter(m=>m.season===season&&!m.offseason);if(!moves.length)return calendar.weeks.slice(0,week).reduce((n,w)=>n+w.games.filter(g=>g.home===finalTeam||g.away===finalTeam).length,0);
    let club=moves[0].fromTeamId,count=0;
    calendar.weeks.slice(0,week).forEach((w,i)=>{for(const m of moves)if(m.week===i)club=m.toTeamId;count+=w.games.filter(g=>g.home===club||g.away===club).length;});return count;
  }
  function transferCalendar(s,season,leagueId) {
    if(season===s.season&&leagueId===s.leagueId)return getSeasonSchedule(s);
    const old=s.seasons.find(v=>v.season===season),legacySeason=old?.scheduledGames===112;
    return getSeasonSchedule({...s,season,leagueId,scheduleTeamIds:legacySeason?Object.values(LEGACY_TEAM_MAP):TEAMS.filter(t=>t.leagueId===leagueId).map(t=>t.id),schedule:{kind:legacySeason?'legacy':'standard',year:2026+season-1}});
  }
  function getFreeAgentStatus(s) {
    if(!s.freeAgency.active)return {active:false,offers:[],weeks:0,detail:''};
    const previous=s.seasons.filter(v=>v.stage==='pro').at(-1),gap=previous?s.season-previous.season-1:0;
    const waiting=gap*s.schedule.weekCount+s.week,rating=overall(s),score=Math.max(previous?seasonMarketScore({...s,stats:previous.stats})*.75**gap:0,alternativeMarketScore(s)*.85);
    const detail=s.amateur.alternative?'주요 프로리그와 계약하지 않은 상태로 독립·사회인 경기를 치릅니다. 이곳의 경기와 근로소득은 별도로 기록하고 주요 프로 연봉·통산·서비스는 가산하지 않습니다.':'무소속 개인훈련 중입니다. 연봉·공식경기·서비스 기간은 늘지 않습니다. 2주차부터 4주 단위로 구단 문의를 평가하며 시즌 후반에는 협상을 마감합니다.';
    if(s.phase!=='active'||s.week<2||s.week>=Math.floor(s.schedule.weekCount*.8))return {active:true,weeks:waiting,offers:[],detail};
    if(s.amateur.alternative&&pathways.byId(s.amateur.alternative.leagueId).kind!=='independent'||s.amateur.alternativeHistory.some(a=>a.season===s.season&&pathways.byId(a.leagueId).kind!=='independent'))return {active:true,weeks:waiting,offers:[],detail:'JABA 등록 선수는 시즌 후 드래프트 이후 협상 창에서 다음 시즌 계약을 평가합니다. NPB 재계약은 등록 후 2시즌 제한도 적용합니다.'};
    const round=Math.floor(s.week/4),chance=clamp(.1+Math.max(0,rating-40)*.004+score*.002-gap*.08,.03,.65);
    const market={rng:seedValue(s.id+':unsigned-market:'+s.season+':'+round)};random(market);
    if(random(market)>=chance)return {active:true,weeks:waiting,offers:[],detail};
    const ranked=TEAMS.filter(t=>t.leagueId!=='highschool'&&(s.freeAgency.international||t.leagueId===team(s.freeAgency.originTeamId).leagueId)&&!(t.leagueId==='npb'&&s.amateur.jabaSince!==null&&s.season-s.amateur.jabaSince<2)).map(t=>({t,value:rating*.65+score*.35+s.scouting.interest[t.id]*.5-t.competition*.35+seedValue(s.id+':unsigned-need:'+s.season+':'+round+':'+t.id)%40-Math.min(25,waiting*.3)})).filter(v=>v.value>=30).sort((a,b)=>b.value-a.value).slice(0,score>=60?2:1);
    const offers=ranked.filter(v=>!s.freeAgency.declined.includes(v.t.id)).filter(({t})=>s.week<getSeasonSchedule({...s,freeAgency:{...s.freeAgency,active:false},leagueId:t.leagueId,scheduleTeamIds:TEAMS.filter(v=>v.leagueId===t.leagueId).map(v=>v.id),schedule:null}).weeks.length).map(({t})=>({teamId:t.id,years:[1],annualSalary:Math.max(100,Math.round(salaryOffer({...s,stats:previous?previous.stats:s.stats},t.id)*Math.max(.4,1-waiting*.008)/100)*100),reason:(s.amateur.alternative?'독립리그 실전·':'개인훈련·')+'기량·최근 실적을 평가한 1년 복귀 제안'}));
    return {active:true,weeks:waiting,offers,detail};
  }
  function declineFreeAgentOffer(input,teamId) {
    const s=validateSave(input);if(!getFreeAgentStatus(s).offers.some(o=>o.teamId===teamId))fail('응답할 복귀 제안이 없습니다.');
    s.freeAgency.declined.push(teamId);log(s,'복귀 제안 보류',team(teamId).name+'의 이번 계약 문의를 거절하고 개인훈련을 이어갑니다.','contract');return s;
  }
  function signFreeAgent(input,teamId) {
    const s=validateSave(input),offer=getFreeAgentStatus(s).offers.find(o=>o.teamId===teamId);
    if(!offer)fail('도착한 복귀 제안을 선택해 주세요.');
    const oldLeague=s.leagueId,prior=clone(s.contract),origin=team(s.freeAgency.originTeamId).leagueId;
    const qualified=contractRights({...s,contract:{...s.contract,internationalVeteran:false}},false).domestic;
    closeAlternative(s,'pro');s.freeAgency.active=false;
    prior.faService[origin]=prior.leagueService[origin];if(team(teamId).leagueId!==origin)prior.internationalVeteran=true;
    s.teamId=teamId;s.leagueId=team(teamId).leagueId;
    if(oldLeague!==s.leagueId){
      s.scheduleTeamIds=TEAMS.filter(t=>t.leagueId===s.leagueId).map(t=>t.id);s.schedule=null;s.schedule=makeSchedule(s);s.standings=blankStandings(s.scheduleTeamIds);
      // Reconstruct only non-player results; no past appearances are created.
      const r={rng:seedValue(s.id+':unsigned-standings:'+s.season+':'+s.leagueId),leagueId:s.leagueId};
      for(const week of getSeasonSchedule(s).weeks.slice(0,s.week))for(const fixture of week.games){
        const a=team(fixture.home),b=team(fixture.away),result=finishTiedGame(r,poisson(r,4.4+(a.strength-b.strength)*.055),poisson(r,4.4+(b.strength-a.strength)*.055),a.strength,b.strength);
        const home=s.standings.find(v=>v.teamId===a.id),away=s.standings.find(v=>v.teamId===b.id);home.rs+=result.home;home.ra+=result.away;away.rs+=result.away;away.ra+=result.home;
        if(result.home>result.away){home.w++;away.l++;}else if(result.home<result.away){away.w++;home.l++;}else{home.t++;away.t++;}
      }
    }
    s.schedule=null;s.schedule=makeSchedule(s);
    s.transfers.faSignings.push({date:tradeDate(s),fromTeamId:s.freeAgency.originTeamId,toTeamId:teamId,qualified});
    s.contract=newContract(s,1,prior);s.contract.annualSalary=offer.annualSalary;s.salary=offer.annualSalary;
    s.freeAgency.active=false;s.freeAgency.joinedWeek=s.week;s.freeAgency.declined=[];s.trust=48;s.morale=Math.max(60,s.morale);s.pendingEvent=null;
    s.lastWeek={games:[],summary:['개인훈련 뒤 '+team(teamId).name+'와 계약했습니다.','다음 주부터 출전 경쟁에 합류하며 지난 주차 기록은 소급 생성하지 않습니다.'],gains:[],gamesPlayed:0};
    log(s,'무소속에서 프로 복귀',team(teamId).name+'와 1년 계약 · 연 '+s.salary.toLocaleString('ko-KR')+'만원. 개인훈련 기간의 서비스는 가산하지 않습니다.','contract');return s;
  }
  function continueUnsignedSeason(s) {
    const carry=s.amateur.alternative?{leagueId:s.amateur.alternative.leagueId,teamId:s.amateur.alternative.teamId}:null;
    closeAlternative(s,'season');
    archive(s);s.season++;s.age++;s.week=0;s.phase='active';s.stats=blankStats();s.lastWeek=null;s.pendingEvent=null;s.schedule=null;s.schedule=makeSchedule(s);s.standings=blankStandings(s.scheduleTeamIds);
    if(carry){s.amateur.extendedSeason=s.season;s.schedule=makeSchedule(s);const date=getSeasonSchedule(s).weeks[0].startDate;s.amateur.alternative=blankAlternative(s,carry.leagueId,carry.teamId,date);processAlternativeUntil(s,s.amateur.alternative,pathways.dateAt(date,-1),false);}
    s.injury=null;s.injurySeasonLoss=0;s.buffs={growth:0,protection:0};s.usedItems=[];s.roleChangedWeek=false;s.fatigue=8;s.freeAgency.declined=[];s.freeAgency.joinedWeek=null;
    Object.keys(s.scouting.interest).forEach(id=>s.scouting.interest[id]=Math.floor(s.scouting.interest[id]*.65));s.scouting.encounter=null;
    log(s,carry?'독립·사회인 새 시즌':'무소속으로 맞은 새 시즌',carry?pathways.club(carry.teamId).name+'에서 새 시즌을 시작합니다. 주요 프로 서비스는 유지하고 해당 무대 기록은 새 시즌으로 구분합니다.':'프로 출전과 연봉 없이 개인훈련을 이어갑니다. 나이는 들지만 서비스 기간은 유지됩니다.','career');return s;
  }
  function enterFreeAgency(input) {const s=validateSave(input);return nextSeason(s,s.teamId,1,false,'unattached');}
  function contractOptions(s) {
    if(s.freeAgency.active)return [];
    if(s.phase!=='seasonEnd'||s.age>=40)return [];
    if(s.stage==='highschool')return s.age===18&&s.mobility.draftPlan==='overseas'?[]:[{teamId:s.age<18?s.teamId:s.draftTeamId,years:[1],reason:s.age<18?'고교 진급':SCHOOL_PATHS[s.schoolCountry].leagueId.toUpperCase()+' 신인 지명 입단'}];
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
    if(s.freeAgency.active)return {label:'FA 미아 · 무소속',detail:getFreeAgentStatus(s).detail,canChooseTeam:false,yearsLeft:0,serviceYears:s.contract.serviceYears,faEligible:true,draftTeamId:null,options:[]};
    const options=contractOptions(s);
    if(s.stage==='highschool')return {label:s.age===18?(s.mobility.draftPlan==='overseas'?'졸업·해외 도전':'졸업·신인 드래프트'):'고교 '+(s.age-15)+'학년',detail:s.mobility.draftPlan==='overseas'?'국내 드래프트 불참 경로입니다. 성적·관찰 이력에 따라 해외 제안을 받습니다.':s.draftTeamId?team(s.draftTeamId).name+'의 지명을 받았습니다.':s.age===18?'시즌 종료 후 국내 드래프트 참가 또는 해외 도전을 선택합니다.':'졸업 전까지 같은 학교에서 성장합니다.',canChooseTeam:false,yearsLeft:0,serviceYears:0,faEligible:false,draftTeamId:s.draftTeamId,options};
    const r=contractRights(s,s.phase==='seasonEnd');
    const threshold=s.contract.faService[s.leagueId]===null?(s.leagueId==='mlb'?6:8):(s.leagueId==='mlb'?0:4);
    const since=s.contract.faService[s.leagueId]===null?r.service:r.service-s.contract.faService[s.leagueId];
    const label=r.yearsLeft>0?'계약 '+r.yearsLeft+'년 잔여':r.domestic?'FA 자격':'구단 보류권';
    const serviceDetail=' 리그 서비스 '+r.service+'시즌 · '+(s.contract.internationalVeteran?'계약 종료 후 국제 FA.':'FA 기준까지 '+Math.max(0,threshold-since)+'시즌'+(s.leagueId==='npb'&&s.contract.faService.npb===null?' / 해외 FA까지 '+Math.max(0,9-r.service)+'시즌.':'.'));
    const detail=(r.yearsLeft>0?'계약은 유지되며 규약이 허용하는 기간에 구단 간 트레이드 대상이 될 수 있습니다.':r.domestic?(r.international?'국내·해외 구단과 1~4년 계약이 가능합니다.':'NPB 국내 FA: 해외 FA는 첫 취득 9시즌 또는 FA 행사 후 4시즌입니다.'):s.leagueId==='mlb'&&r.service>=3?'연봉 조정 대상 구간입니다.':'매년 현재 구단과 연봉을 갱신합니다.')+serviceDetail;
    return {label,detail,canChooseTeam:r.domestic,yearsLeft:Math.max(0,r.yearsLeft),serviceYears:s.contract.serviceYears+(s.phase==='seasonEnd'?1:0),faEligible:r.domestic,draftTeamId:null,options};
  }
  function nextSeason(input,teamId,years=1,deferFA=false,route='contract') {
    const s=validateSave(input);if(s.phase!=='seasonEnd')fail('시즌 종료 후에 계약할 수 있습니다.');if(s.age>=40)return retire(s);
    if(s.freeAgency.active){if(route!=='unattached'||teamId!==s.teamId||years!==1||deferFA)fail('무소속 상태에서는 도착한 복귀 제안을 선택해 주세요.');return continueUnsignedSeason(s);}
    const compulsory=getTradeStatus(s);
    if(route==='contract'&&teamId===s.teamId&&!deferFA&&compulsory.offers.length&&!compulsory.requiresConsent){
      const own=contractOptions(s)[0];if(!own.years.includes(years)&&!(years===1&&contractRights(s,true).yearsLeft>0))fail('계약 기간을 확인해 주세요.');
      route='trade';teamId=compulsory.offers[0].teamId;years=compulsory.offers[0].years[0];
    }
    if(!['contract','posting','overseas','trade','unattached'].includes(route)||route!=='contract'&&deferFA)fail('이적 경로를 확인해 주세요.');
    const posting=route==='posting',overseas=route==='overseas',trade=route==='trade',unsigned=route==='unattached';
    if(unsigned&&(s.stage!=='pro'||!contractRights(s,true).domestic||teamId!==s.teamId||years!==1))fail('FA 자격을 얻고 계약이 종료된 후에 무소속을 선택할 수 있습니다.');
    const options=posting?getPostingStatus(s).offers:overseas?getGraduationOffers(s):trade?getTradeStatus(s).offers:contractOptions(s),offer=options.find(v=>v.teamId===teamId);
    if(!offer)fail('현재 계약·보류권·드래프트 조건에서 선택할 수 없는 구단입니다.');
    const oldTeam=s.teamId,oldLeague=s.leagueId,oldStage=s.stage,prior=s.contract?clone(s.contract):null;
    const qualified=prior?contractRights({...s,contract:{...prior,internationalVeteran:false}},true).domestic:false;
    let rights=prior?contractRights(s,true):null;
    if(typeof deferFA!=='boolean'||(deferFA&&(!rights||!rights.domestic||rights.yearsLeft>0||teamId!==s.teamId||years!==1)))fail('FA 유보는 자격 취득 후 현재 구단에 1년 잔류할 때만 가능합니다.');
    if(rights&&rights.yearsLeft>0)years=rights.yearsLeft;
    if(!offer.years.includes(years))fail('계약 기간을 확인해 주세요.');
    if(trade)recordTrade(s,offer,true);
    archive(s);
    if(prior){prior.serviceYears++;prior.leagueService[oldLeague]++;}
    s.teamId=teamId;s.leagueId=team(teamId).leagueId;s.stage=s.leagueId==='highschool'?'highschool':'pro';s.season++;s.age++;s.week=0;s.phase='active';
    if(s.stage==='highschool')s.contract=null;
    else if(prior&&rights.yearsLeft>0){s.contract=prior;s.contract.yearsLeft=rights.yearsLeft;}
    else {
      if(posting)prior.internationalVeteran=true;
      if(prior&&rights.domestic&&!deferFA&&!posting&&!unsigned){prior.faService[oldLeague]=prior.leagueService[oldLeague];if(oldLeague!==s.leagueId)prior.internationalVeteran=true;}
      s.contract=newContract(s,years,prior);
    }
    s.salary=s.contract?s.contract.annualSalary:0;
    if(oldStage==='highschool'&&s.stage==='pro'&&!overseas&&s.leagueId==='kbo')s.transfers.draftedOn=(2026+s.season-1)+'-01-01';
    if(prior&&rights.domestic&&!deferFA&&!posting&&!unsigned&&!trade)s.transfers.faSignings.push({date:(2026+s.season-1)+'-01-01',fromTeamId:oldTeam,toTeamId:teamId,qualified});
    s.freeAgency=blankFreeAgency();if(unsigned){s.freeAgency={...blankFreeAgency(),active:true,originTeamId:oldTeam,international:rights.international};s.contract.yearsLeft=0;s.contract.annualSalary=0;s.salary=0;}
    s.scheduleTeamIds=TEAMS.filter(t=>t.leagueId===s.leagueId).map(t=>t.id);s.schedule=null;s.schedule=makeSchedule(s);
    s.stats=blankStats();s.standings=blankStandings(s.scheduleTeamIds);s.injury=null;s.injurySeasonLoss=0;s.buffs={growth:0,protection:0};s.usedItems=[];s.roleChangedWeek=false;s.fatigue=8;s.morale=72;s.trust=oldTeam===teamId?Math.max(50,s.trust):48;
    s.lastWeek=null;s.pendingEvent=null;s.draftTeamId=null;
    s.scouting.declined=[];s.scouting.encounter=null;s.mobility.declinedTrades=[];Object.keys(s.scouting.interest).forEach(id=>s.scouting.interest[id]=Math.floor(s.scouting.interest[id]*.65));
    if(unsigned)log(s,'FA 미아 · 무소속 개인훈련','모든 제안을 보류하고 소속팀 없이 새 시즌을 시작합니다. 계약 문의를 기다리며 개인훈련할 수 있습니다.','contract');
    else log(s,posting?'MLB 포스팅 이적':overseas?'드래프트 불참 · 해외 진출':trade?'리그 내 트레이드':deferFA?'FA 재수 · 1년 재도전':oldStage==='highschool'&&s.stage==='pro'?'프로 입단':oldTeam===teamId?'새로운 시즌':'새로운 더그아웃',(s.stage==='highschool'?getSchoolName(teamId,s.schoolCountry,s.amateur.schoolMode):team(teamId).name)+(s.contract?'와 '+s.contract.yearsLeft+'년 계약 · 연간 '+s.salary.toLocaleString('ko-KR')+'만원 상당의 게임 보수입니다.':'에서 다음 학년을 시작합니다.')+(overseas?' 마이너·육성 단계를 프로 데뷔로 압축한 게임 경로입니다.':'')+(trade?' 구단 간 협의로 이동하며 기존 계약·서비스 이력을 승계합니다.':'')+(deferFA?' FA 행사 이력은 유지하고 다음 시즌 성적으로 시장 제안을 다시 평가합니다.':''),'contract');
    return s;
  }
  function retire(input) {
    const s = validateSave(input);
    if (s.phase === 'retired') fail('이미 종료된 커리어입니다.');
    if (!s.week && !s.seasons.length) fail('최소 한 주를 진행한 뒤 커리어를 마칠 수 있습니다.');
    closeAlternative(s,'retired');
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
  function migrateTransfers(s) {
    const t=blankTransfers(),rows=Array.isArray(s.seasons)?s.seasons:[];
    const first=rows.find(v=>v.stage==='pro')||(s.stage==='pro'?{season:s.season,leagueId:s.leagueId}:null);
    if(first?.leagueId==='kbo'&&(s.mobility?.draftPlan||'domestic')==='domestic')t.draftedOn=(2026+first.season-1)+'-01-01';
    // Old saves store exercised service but no signing day. Recover the game's Jan 1 convention.
    for(const league of ['kbo','npb','mlb']) {
      const service=s.contract?.faService?.[league];if(service===null||service===undefined)continue;
      const prior=rows.filter(v=>v.stage==='pro'&&v.leagueId===league)[service-1];if(!prior)continue;
      const next=rows.find(v=>v.season>prior.season&&v.stage==='pro')||(s.stage==='pro'&&!s.freeAgency?.active?{season:s.season,teamId:s.teamId}:null);
      if(next)t.faSignings.push({date:s.freeAgency?.joinedWeek&&next.season===s.season?getSeasonSchedule(s).weeks[s.freeAgency.joinedWeek]?.startDate:(2026+next.season-1)+'-01-01',fromTeamId:prior.teamId,toTeamId:next.teamId,qualified:service>=(league==='mlb'?6:8)});
    }
    t.faSignings.sort((a,b)=>a.date.localeCompare(b.date));return t;
  }
  function validateSave(input) {
    if(input&&(input.version===1||input.version===2))input=migrateLegacy(input);
    if(input&&input.version===VERSION&&!Object.hasOwn(input,'life'))input={...input,life:{owned:[],spent:0}};
    if(input&&input.version===VERSION&&!Object.hasOwn(input,'schoolCountry'))input={...input,schoolCountry:'kr',favoriteTeamId:null,scouting:blankScouting()};
    if(input&&input.version===VERSION&&!Object.hasOwn(input,'mobility'))input={...input,mobility:blankMobility()};
    if(input&&input.version===VERSION&&!Object.hasOwn(input,'freeAgency'))input={...input,freeAgency:blankFreeAgency()};
    if(input&&input.version===VERSION&&!Object.hasOwn(input,'transfers'))input={...input,transfers:migrateTransfers(input)};
    if(input&&input.version===VERSION&&!Object.hasOwn(input,'amateur'))input={...input,amateur:blankAmateur('legacy')};
    const err=label=>fail('저장 데이터가 올바르지 않습니다: '+label);
    const object=(v,keys,label)=>{if(!v||typeof v!=='object'||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v)))err(label);const actual=Object.keys(v);if(actual.length!==keys.length||keys.some(k=>!Object.hasOwn(v,k)))err(label+' 필드');};
    const number=(n,lo,hi,label,integral=false)=>{if(typeof n!=='number'||!Number.isFinite(n)||n<lo||n>hi||(integral&&!Number.isInteger(n)))err(label);};
    const str=(v,max,label,empty=false)=>{if(typeof v!=='string'||v.length>max||(!empty&&!v.length)||/[\u0000-\u001f\u007f]/.test(v))err(label);};
    const array=(v,max,label)=>{if(!Array.isArray(v)||v.length>max)err(label);};
    const validTeam=id=>{if(!team(id))err('구단');};
    object(input,STATE_KEYS,'전체 구조');const s=input;if(s.version!==VERSION)err('지원하지 않는 버전');
    object(s.amateur,['schoolMode','schoolCups','alternative','alternativeHistory','extendedSeason','jabaSince','pathPitchDate'],'경기 경로');
    if(!['real','legacy'].includes(s.amateur.schoolMode))err('학교 모드');
    array(s.amateur.schoolCups,20,'고교 대회');array(s.amateur.alternativeHistory,25,'독립·사회인 경력');
    if(s.amateur.extendedSeason!==null)number(s.amateur.extendedSeason,1,s.season,'경로 달력',true);
    if(s.amateur.jabaSince!==null)number(s.amateur.jabaSince,1,s.season,'JABA 등록 시즌',true);
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
    object(s.mobility,['draftPlan','declinedTrades'],'진로·이적');
    if(!['domestic','overseas'].includes(s.mobility.draftPlan))err('졸업 진로');
    array(s.mobility.declinedTrades,30,'트레이드 보류');if(new Set(s.mobility.declinedTrades).size!==s.mobility.declinedTrades.length||s.mobility.declinedTrades.some(id=>!proIds.includes(id)||id===s.teamId||team(id).leagueId!==s.leagueId))err('트레이드 구단');
    object(s.freeAgency,['active','originTeamId','international','joinedWeek','declined'],'무소속 상태');
    const fa=s.freeAgency;if(typeof fa.active!=='boolean'||typeof fa.international!=='boolean')err('무소속 구분');
    if(fa.originTeamId!==null&&!proIds.includes(fa.originTeamId))err('무소속 이전 구단');
    if(fa.joinedWeek!==null)number(fa.joinedWeek,1,s.week,'복귀 주차',true);
    array(fa.declined,52,'복귀 거절');if(new Set(fa.declined).size!==fa.declined.length||fa.declined.some(id=>!proIds.includes(id)))err('복귀 거절 구단');
    if(fa.active&&(s.stage!=='pro'||fa.originTeamId!==s.teamId||fa.joinedWeek!==null||s.salary!==0||s.pendingEvent!==null||STAT_KEYS.some(k=>s.stats[k]!==0)))err('무소속 활동');
    if(!fa.active&&(fa.declined.length||fa.originTeamId===null&&(fa.joinedWeek!==null||fa.international)||fa.originTeamId!==null&&fa.joinedWeek===null))err('복귀 상태');
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
    object(s.transfers,['draftedOn','faSignings','moves'],'계약 양도 이력');
    const validDate=d=>{if(typeof d!=='string'||!/^20\d\d-\d\d-\d\d$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d)err('계약 날짜');};
    if(s.transfers.draftedOn!==null){validDate(s.transfers.draftedOn);if(s.transfers.draftedOn>tradeDate(s))err('신인 계약 날짜');}
    array(s.transfers.faSignings,50,'FA 계약 일자');let lastSign='';
    s.transfers.faSignings.forEach(f=>{object(f,['date','fromTeamId','toTeamId','qualified'],'FA 계약');validDate(f.date);if(typeof f.qualified!=='boolean'||!proIds.includes(f.fromTeamId)||!proIds.includes(f.toTeamId)||f.date>tradeDate(s)||f.date<lastSign)err('FA 계약 이력');lastSign=f.date;});
    array(s.transfers.moves,250,'양도 이력');let lastMove=-1;
    s.transfers.moves.forEach(m=>{
      object(m,['season','week','date','fromTeamId','toTeamId','stats','cash','relocation','offseason','lastStartDate'],'양도');number(m.season,1,s.season,'양도 시즌',true);number(m.week,1,60,'양도 주차',true);validDate(m.date);
      if(m.lastStartDate!==null){validDate(m.lastStartDate);if(s.role!=='pitcher'||m.lastStartDate>=m.date)err('이적 전 선발 휴식');}
      if(typeof m.offseason!=='boolean'||!proIds.includes(m.fromTeamId)||!proIds.includes(m.toTeamId)||m.fromTeamId===m.toTeamId||team(m.fromTeamId).leagueId!==team(m.toTeamId).leagueId||m.season*100+m.week<=lastMove||m.season===s.season&&m.week>s.week)err('양도 순서·구단');lastMove=m.season*100+m.week;
      const league=team(m.toTeamId).leagueId,year=2026+m.season-1;
      if(Number(m.date.slice(0,4))!==year||m.offseason&&m.date!==year+'-12-01'||!m.offseason&&m.date>getTradeRules(league,year).deadline)err('양도 가능 기간');
      const q=transferCalendar(s,m.season,league);
      if(m.offseason?m.week!==q.weeks.length:m.date!==q.weeks[m.week]?.startDate)err('양도 공시 주차');
      if(league==='kbo'&&!tradeEligibility({...s,leagueId:league,schedule:{...s.schedule,year,endDate:q.endDate}},m.date).allowed)err('양도 계약 제한');
      number(m.cash,1,1000000000,'구단 간 양도 대금',true);if(m.relocation!==(league==='kbo'?200:0))err('이전비');
      if(m.date>tradeDate(s)&&m.season===s.season)err('양도 미래 날짜');
    });
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
    number(s.life.spent,0,Math.floor(s.totalSalary)+relocationIncome(s),'지출',true);if(s.life.spent!==lifeSpent)err('지출 합계');
    object(s.inventory,ITEMS.map(v=>v.id),'보관함');ITEMS.forEach(v=>number(s.inventory[v.id],0,99,'아이템 수',true));object(s.buffs,['growth','protection'],'효과');['growth','protection'].forEach(k=>number(s.buffs[k],0,3,'효과 남은 주',true));
    if(s.injury!==null){object(s.injury,['name','weeks'],'부상');if(s.injury.name!=='근육 피로 부상')err('부상 종류');number(s.injury.weeks,1,3,'부상 남은 주',true);}
    array(s.usedItems,1,'사용 아이템');if(s.usedItems.some(id=>!ITEMS.some(v=>v.id===id)))err('사용 아이템');if(typeof s.roleChangedWeek!=='boolean')err('보직 변경 상태');
    if(s.draftTeamId!==null){validTeam(s.draftTeamId);if(s.mobility.draftPlan!=='domestic'||s.stage!=='highschool'||s.age!==18||s.week!==s.schedule.weekCount||team(s.draftTeamId).leagueId!==SCHOOL_PATHS[s.schoolCountry].leagueId||s.draftTeamId!==selectDraftTeam(s))err('드래프트 지명');}
    if(s.stage==='highschool'&&s.age===18&&s.week===s.schedule.weekCount&&s.draftTeamId===null&&s.mobility.draftPlan==='domestic')err('드래프트 누락');
    if(s.stage==='highschool'){if(s.contract!==null||s.salary!==0)err('고교 계약');}
    else {
      object(s.contract,['yearsLeft','annualSalary','serviceYears','leagueService','faService','internationalVeteran'],'계약');const c=s.contract;
      number(c.yearsLeft,fa.active?0:1,fa.active?0:4,'계약 잔여 년',true);number(c.annualSalary,fa.active?0:1,fa.active?0:1000000,'계약 연봉');if(c.annualSalary!==s.salary)err('계약 보수');number(c.serviceYears,0,24,'서비스 연수',true);
      object(c.leagueService,['kbo','npb','mlb'],'리그 서비스');object(c.faService,['kbo','npb','mlb'],'FA 서비스');['kbo','npb','mlb'].forEach(k=>{number(c.leagueService[k],0,24,'리그 서비스',true);if(c.faService[k]!==null)number(c.faService[k],0,c.leagueService[k],'FA 행사 시점',true);});
      if(Object.values(c.leagueService).reduce((a,b)=>a+b,0)!==c.serviceYears||typeof c.internationalVeteran!=='boolean')err('서비스 합계');
      if(fa.active){const rights=contractRights(s,false);if(!rights.domestic||rights.international!==fa.international)err('무소속 FA 권리');}
    }
    const stats=(v,label,limit)=>{
      object(v,STAT_KEYS,label);STAT_KEYS.forEach(k=>number(v[k],0,100000,label+'/'+k,true));
      if(v.g>limit||v.h>v.ab||v.doubles+v.triples+v.hr>v.h||v.so>(s.role==='batter'?v.ab-v.h:v.outs)||(s.role==='batter'&&v.pa!==v.ab+v.bb+v.hbp+v.sf))err(label+' 타격 관계');
      if(v.starts>v.g||v.w+v.l+v.sv+v.hld>v.g||v.sv+v.hld>v.g-v.starts||v.er>v.ra||v.outs>v.g*27||v.r>v.h+v.bb+v.hbp||v.hr>v.r||v.hr>v.rbi||v.sb+v.cs>2*(v.h+v.bb+v.hbp-v.hr))err(label+' 기록 관계');
      if(s.role==='batter'){if(v.g*5<v.pa||['starts','outs','ha','er','ra','w','l','sv','hld'].some(k=>v[k]!==0))err(label+' 타자 기록');}
      else if(['ab','h','doubles','triples','hr','hbp','sf','rbi','r','sb','cs','pa'].some(k=>v[k]!==0))err(label+' 투수 기록');
    };
    const playedCounts=Object.fromEntries(s.scheduleTeamIds.map(id=>[id,0]));calendar.weeks.slice(0,s.week).forEach(w=>w.games.forEach(g=>{playedCounts[g.home]++;playedCounts[g.away]++;}));
    if(s.amateur.pathPitchDate!==null){validDate(s.amateur.pathPitchDate);if(s.role!=='pitcher'||s.amateur.pathPitchDate>calendar.weeks[Math.max(0,s.week-1)].endDate)err('마지막 경로 등판');}
    const validatePathResult=(r,label)=>{
      object(r,['date','opponentId','our','opp','stats'],label);validDate(r.date);str(r.opponentId,70,'경로 상대');number(r.our,0,100,'경로 득점',true);number(r.opp,0,100,'경로 실점',true);if(r.our===r.opp)err('경로 승패');stats(r.stats,label+' 선수 기록',1);
      if(r.stats.r>r.our||r.stats.rbi>r.our||r.stats.ra>r.opp||r.stats.w+r.stats.sv+r.stats.hld>(r.our>r.opp?1:0)||r.stats.l>(r.our<r.opp?1:0))err('경로 선수·팀 기록');
    };
    const pathRows=(rows,allowed,maxGames=160)=>{
      array(rows,20,'경로 순위');if(rows.length!==allowed.length||new Set(rows.map(r=>r.teamId)).size!==rows.length)err('경로 순위 구단');let w=0,l=0,rs=0,ra=0;
      rows.forEach(r=>{object(r,['teamId','w','l','rs','ra'],'경로 순위 행');if(!allowed.includes(r.teamId))err('경로 순위 소속');['w','l'].forEach(k=>number(r[k],0,maxGames,'경로 승패',true));['rs','ra'].forEach(k=>number(r[k],0,20000,'경로 득실',true));w+=r.w;l+=r.l;rs+=r.rs;ra+=r.ra;});if(w!==l||rs!==ra)err('경로 리그 합계');
    };
    const cupKeys=new Set();
    s.amateur.schoolCups.forEach(c=>{
      object(c,['season','id','status','results','pool'],'고교 대회 행');number(c.season,1,s.season,'고교 대회 시즌',true);const definition=pathways.SCHOOL_CUPS[s.schoolCountry].find(d=>d.id===c.id),key=c.season+':'+c.id;
      if(!definition||s.amateur.schoolMode!=='real'||cupKeys.has(key)||s.startAge+c.season-1>18||!['active','unqualified','out','champion'].includes(c.status))err('고교 대회 구분');cupKeys.add(key);array(c.results,definition.dates.length,'고교 대회 경기');array(c.pool,4,'고교 풀 순위');
      if(c.status==='unqualified'&&c.results.length||c.status==='champion'&&(definition.format==='double-pool'?![5,6].includes(c.results.length):c.results.length!==definition.dates.length)||c.status==='out'&&!c.results.length)err('고교 대회 결과');
      const own=c.season===s.season&&s.stage==='highschool'?s.teamId:s.seasons.find(v=>v.season===c.season&&v.stage==='highschool')?.teamId;
      c.results.forEach((r,i)=>{validatePathResult(r,'고교 대회');if(!definition.dates.includes(r.date.slice(5))||Number(r.date.slice(0,4))!==2026+c.season-1||i>0&&r.date<=c.results[i-1].date||!(team(r.opponentId)?.leagueId==='highschool'||((s.schoolCountry==='jp'&&['senbatsu','summer'].includes(c.id))||(s.schoolCountry==='us'&&c.id==='cifss'))&&pathways.NATIONAL_SCHOOLS.some(t=>t.id===r.opponentId&&t.country===s.schoolCountry))||r.opponentId===own||c.season===s.season&&r.date>calendar.weeks[Math.max(0,s.week-1)].endDate)err('고교 대회 대진·날짜');if(definition.format==='knockout'&&i<c.results.length-1&&r.our<r.opp)err('토너먼트 탈락 후 출전');});
      if(definition.format==='knockout'&&c.status==='champion'&&c.results.some(r=>r.our<r.opp))err('고교 우승');
      if(c.pool.length){const hs=TEAMS.filter(t=>t.leagueId==='highschool').map(t=>t.id),group=hs.indexOf(own)<4?hs.slice(0,4):hs.slice(4);pathRows(c.pool,group,3);}
    });
    const validateAlternative=(a,historical=false)=>{
      const fields=['season','leagueId','teamId','joinedWeek','joinedDate','processedDate','stage','round','participants','standings','stageTables','results','stats','finished','championId','income'];if(historical)fields.push('leftWeek','reason');object(a,fields,'독립·사회인 경력 행');
      const l=pathways.byId(a.leagueId);if(!l||!l.clubs.some(c=>c.id===a.teamId))err('독립·사회인 구단');const ids=l.clubs.map(c=>c.id);number(a.season,1,s.season,'독립 시즌',true);number(a.joinedWeek,0,60,'독립 입단 주차',true);validDate(a.joinedDate);validDate(a.processedDate);number(a.stage,1,4,'독립 단계',true);number(a.round,0,150,'독립 라운드',true);
      if(Number(a.joinedDate.slice(0,4))!==2026+a.season-1||a.processedDate<pathways.dateAt(a.joinedDate,-1)||a.processedDate>(2026+a.season-1)+'-12-10'||typeof a.finished!=='boolean'||a.championId!==null&&!ids.includes(a.championId))err('독립 일정');
      array(a.participants,ids.length,'독립 참가 구단');if(!a.participants.length||new Set(a.participants).size!==a.participants.length||a.participants.some(id=>!ids.includes(id)))err('독립 참가 목록');pathRows(a.standings,a.participants);array(a.stageTables,6,'독립 단계 이력');a.stageTables.forEach(t=>{object(t,['stage','standings'],'독립 단계');number(t.stage,0,4,'지난 단계',true);pathRows(t.standings,t.standings.map(r=>r.teamId));if(t.standings.some(r=>!ids.includes(r.teamId)))err('지난 단계 소속');});
      array(a.results,180,'독립 경기 결과');const total=blankStats();let lastDate='',sameDay=0;a.results.forEach(r=>{validatePathResult(r,'독립 경기');sameDay=r.date===lastDate?sameDay+1:1;if(!ids.includes(r.opponentId)||r.opponentId===a.teamId||r.date<lastDate||sameDay>(l.kind==='club'?2:1)||r.date<a.joinedDate||r.date>a.processedDate)err('독립 경기 시점');lastDate=r.date;addStats(total,r.stats);});stats(a.stats,'독립 합계',180);if(STAT_KEYS.some(k=>a.stats[k]!==total[k]))err('독립 합계 기록');
      number(a.income,0,l.kind==='company'?3600.00001:0,'근로 소득');if(historical){number(a.leftWeek,a.joinedWeek,60,'독립 말소 주차',true);if(!['personal','pro','season','retired'].includes(a.reason))err('독립 종료 사유');}
      else if(!s.freeAgency.active||s.phase==='retired'||a.season!==s.season||a.joinedWeek>s.week||s.amateur.extendedSeason!==s.season||a.processedDate>calendar.weeks[Math.max(0,s.week-1)].endDate)err('독립 현재 소속');
    };
    s.amateur.alternativeHistory.forEach(a=>validateAlternative(a,true));if(s.amateur.alternative!==null)validateAlternative(s.amateur.alternative);
    stats(s.stats,'시즌 기록',seasonOpportunities(s,s.season,calendar,s.week,s.teamId));stats(s.careerStats,'프로 통산',25*200);stats(s.schoolStats,'고교 통산',3*28);
    s.transfers.moves.forEach(m=>{
      stats(m.stats,'양도 전 기록',200);
      const final=m.season===s.season?s.stats:s.seasons.find(v=>v.season===m.season)?.stats;if(!final||STAT_KEYS.some(k=>m.stats[k]>final[k]))err('양도 기록 합계');
      if(!m.offseason){
        const other=s.transfers.moves.filter(v=>!v.offseason&&v.season===m.season),index=other.indexOf(m),next=other[index+1];
        if(next&&(next.fromTeamId!==m.toTeamId||STAT_KEYS.some(k=>next.stats[k]<m.stats[k])))err('양도 기록 연결');
        if(!next&&m.toTeamId!==(m.season===s.season?s.teamId:s.seasons.find(v=>v.season===m.season)?.teamId))err('양도 후 소속');
      }
    });
    array(s.seasons,25,'시즌 이력');const proPrevious=blankStats(),schoolPrevious=blankStats(),service={kbo:0,npb:0,mlb:0};
    s.seasons.forEach((v,i)=>{
      object(v,['season','age','teamId','stats','overall','wins','losses','ties','stage','leagueId','scheduledGames'],'시즌 이력');if(v.season!==i+1||v.age!==s.startAge+i||v.season>s.season)err('시즌 이력 순서');validTeam(v.teamId);
      if(team(v.teamId).leagueId!==v.leagueId||!['highschool','pro','unattached'].includes(v.stage)||(v.stage==='highschool')!==(v.leagueId==='highschool')||(v.stage==='highschool'&&v.age>18))err('이력 리그');
      number(v.scheduledGames,v.stage==='unattached'?0:1,200,'이력 일정',true);['wins','losses','ties'].forEach(k=>number(v[k],0,200,'이력 승패',true));number(v.overall,1,99,'이력 능력',true);
      let opportunity=v.wins+v.losses+v.ties;
      if(s.transfers.moves.some(m=>m.season===v.season&&!m.offseason)){
        const historical=transferCalendar(s,v.season,v.leagueId);
        opportunity=seasonOpportunities(s,v.season,historical,v.season===s.season?s.week:historical.weeks.length,v.teamId);
      }
      stats(v.stats,'이력 기록',opportunity);
      if(v.stage==='unattached'&&(v.scheduledGames!==0||v.wins+v.losses+v.ties!==0||STAT_KEYS.some(k=>v.stats[k]!==0)))err('무소속 시즌 기록');
      if(v.season<s.season){if(v.wins+v.losses+v.ties!==v.scheduledGames)err('지난 시즌 경기 수');addStats(v.stage==='highschool'?schoolPrevious:proPrevious,v.stats);if(v.stage==='pro')service[v.leagueId]++;}
      else if(s.phase!=='retired'||v.wins+v.losses+v.ties!==(fa.active?0:playedCounts[s.teamId])||STAT_KEYS.some(k=>v.stats[k]!==s.stats[k])||(v.stage==='unattached')!==fa.active)err('은퇴 시즌 기록');
    });
    if(s.seasons.length!==s.season-1+(s.phase==='retired'&&s.week>0?1:0))err('이력 개수');
    STAT_KEYS.forEach(k=>{if(s.careerStats[k]!==proPrevious[k]+(s.stage==='pro'?s.stats[k]:0)||s.schoolStats[k]!==schoolPrevious[k]+(s.stage==='highschool'?s.stats[k]:0))err('통산 합계');});
    if(s.contract&&Object.keys(service).some(k=>service[k]!==s.contract.leagueService[k]))err('서비스 이력');
    array(s.standings,30,'순위');if(s.standings.length!==s.scheduleTeamIds.length||new Set(s.standings.map(v=>v.teamId)).size!==s.scheduleTeamIds.length)err('순위 팀 수');
    let wins=0,losses=0,runs=0,allowed=0,ties=0;
    s.standings.forEach(v=>{object(v,['teamId','w','l','t','rs','ra'],'순위 행');if(!s.scheduleTeamIds.includes(v.teamId))err('순위 팀');['w','l','t'].forEach(k=>number(v[k],0,200,'팀 승패',true));['rs','ra'].forEach(k=>number(v[k],0,10000,'팀 득실점',true));if(v.w+v.l+v.t!==playedCounts[v.teamId])err('팀 경기 수');if(!['kbo','npb'].includes(s.leagueId)&&v.t)err('무승부 규칙');wins+=v.w;losses+=v.l;ties+=v.t;runs+=v.rs;allowed+=v.ra;});
    if(wins!==losses||runs!==allowed||ties%2)err('리그 합계');const our=s.standings.find(v=>v.teamId===s.teamId),lastTransfer=s.transfers.moves.filter(m=>m.season===s.season&&!m.offseason).at(-1),clubStats=Object.fromEntries(STAT_KEYS.map(k=>[k,s.stats[k]-(lastTransfer?.stats[k]||0)]));if(clubStats.w+clubStats.sv+clubStats.hld>our.w||clubStats.l>our.l||clubStats.r>our.rs||clubStats.rbi>our.rs||clubStats.ra>our.ra)err('선수 / 팀 기록');
    array(s.history,500,'로그');s.history.forEach(v=>{object(v,['season','week','title','text','type'],'로그 행');number(v.season,1,s.season,'로그 시즌',true);number(v.week,0,60,'로그 주차',true);str(v.title,100,'로그 제목');str(v.text,600,'로그 내용');if(!['career','week','choice','season','contract'].includes(v.type))err('로그 유형');});
    if(s.lastWeek!==null){
      const v=s.lastWeek;object(v,['games','summary','gains','gamesPlayed'],'주간 결과');array(v.games,20,'주간 경기');if(!s.week)err('시작 전 경기');const expected=fa.active||fa.joinedWeek===s.week||lastTransfer?.week===s.week?[]:calendar.weeks[s.week-1].games.filter(g=>g.home===s.teamId||g.away===s.teamId);if(v.games.length!==expected.length)err('주간 경기 수');
      v.games.forEach((g,i)=>{object(g,['date','opponentId','our','opp','result','played','line','highlight'],'경기');const fixture=expected[i],opponent=fixture.home===s.teamId?fixture.away:fixture.home;if(g.date!==fixture.date||g.opponentId!==opponent)err('경기 일정');number(g.our,0,100,'득점',true);number(g.opp,0,100,'실점',true);if(g.result!==(g.our>g.opp?'W':g.our<g.opp?'L':'D')||typeof g.played!=='boolean'||(g.result==='D'&&!['kbo','npb'].includes(s.leagueId)))err('경기 결과');str(g.line,160,'경기 기록');str(g.highlight,200,'하이라이트',true);});
      number(v.gamesPlayed,0,s.role==='batter'?v.games.length:4,'주간 출전',true);if(v.gamesPlayed!==v.games.filter(g=>g.played).length)err('주간 출전 합계');array(v.summary,6,'주간 요약');v.summary.forEach(t=>str(t,300,'요약'));array(v.gains,5,'능력 변화');const seen=new Set();v.gains.forEach(g=>{object(g,['key','delta'],'변화 행');if(!attrKeys.includes(g.key)||seen.has(g.key))err('변화 능력');seen.add(g.key);number(g.delta,-10,20,'변화량');});
    }else if(s.week>0)err('주간 결과 누락');
    if(s.pendingEvent!==null){if(s.phase!=='active')err('종료 후 사건');const expected=weekEvent(s);object(s.pendingEvent,['id','title','body','choices'],'사건');array(s.pendingEvent.choices,3,'선택지');if(!expected||['id','title','body'].some(k=>s.pendingEvent[k]!==expected[k])||s.pendingEvent.choices.length!==expected.choices.length)err('사건 내용');s.pendingEvent.choices.forEach((v,i)=>{object(v,['id','label','detail'],'선택지');if(['id','label','detail'].some(k=>v[k]!==expected.choices[i][k]))err('선택지 내용');});}
    return clone(s);
  }
  // Public definitions are immutable so UI code cannot change simulation rules accidentally.
  function freeze(value) { Object.values(value).forEach(v => { if (v && typeof v === 'object') freeze(v); }); return Object.freeze(value); }
  [TEAMS, STYLES, ATTRS, PLANS, LEAGUES, POSITIONS, PITCHING_ROLES, ITEMS,LIFE_ITEMS,SCHOOL_PATHS].forEach(freeze);
  return Object.freeze({ VERSION, TEAMS, LEAGUES, STYLES, ATTRS, PLANS, POSITIONS, PITCHING_ROLES, ITEMS, LIFE_ITEMS, PATHWAYS:pathways, getSchoolSeasonStats, getSchoolCareerStats, getSchoolCompetitions, getAlternativeStatus, getAlternativeOffers, joinAlternative, leaveAlternative, getAlternativeReturnOffers, signAlternativeReturn, getLifeShop, buyLifeItem, changePosition, changePitchingRole, buyItem, useItem, potentialSummary, ageDevelopment, getLeagueRules, getSeasonSchedule, getContractStatus, getContractOffer, getPostingStatus, getGraduationOffers, chooseDraftPlan, getTradeRules, tradeEligibility, getTradeStatus, executeTrade, declineTrade, getFreeAgentStatus, enterFreeAgency, signFreeAgent, declineFreeAgentOffer, contractOptions, createCareer, advanceWeek, advanceWeeks, careerGoal, getCareerAssessment, getRetirementStatus, SCHOOL_PATHS, getSchoolName, getScoutingReport, respondToScout, declineContract, resolveEvent, nextSeason, retire, validateSave, overall, rateStats, getOutlook });
});
