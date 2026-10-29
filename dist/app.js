(function () {
  'use strict';
  const D = window.Dugout;
  const main = document.getElementById('main');
  if (!D) { main.innerHTML = '<div class="card"><h1>게임 파일을 불러오지 못했습니다.</h1><p>index.html과 core.js가 같은 폴더에 있는지 확인해 주세요.</p></div>'; return; }
  const SAVE = 'dugout.career.v1';
  let state = null, view = 'home', plan = 'balanced', busy = false, storageError = false;
  let creation = { name: '', role: 'batter', style: D.STYLES.batter[0].id, entry:'highschool', leagueId: 'highschool', teamId: 'hs-seoul', position:'CF', pitchingRole:'starter' };
  let transferLeague = 'kbo', transferTeam = '', legacyBackup = null, backupV2 = null, contractYears = 1, scheduleMonth = '', postingTeam = '', postingYears = 3;
  let toastTimer;
  const paths = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-8h6v8"/>',
    chart: '<path d="M4 3v17h17M9 15v-4m5 4V6m5 9v-7"/>',
    trophy: '<path d="M8 3h8v6a4 4 0 0 1-8 0ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 13v5m-4 3v-3h8v3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    book: '<path d="M12 5v16M3 3c4 0 6 0 9 2 3-2 5-2 9-2v16c-4 0-6 0-9 2-3-2-5-2-9-2Z"/>',
    settings: '<path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>',
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    bat: '<path d="m4 20 4-4M8 16 17 4a2 2 0 0 1 3 3L8 16ZM3 19l2 2"/>',
    ball: '<circle cx="12" cy="12" r="9"/><path d="M6 5c5 4 5 10 0 14M18 5c-5 4-5 10 0 14"/>',
    leaf: '<path d="M20 4C9 2 1 9 7 16c7 6 14-1 13-12ZM4 21 16 9"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    spark: '<path d="m13 2-8 12h6l-1 8 9-13h-7Z"/>',
    shield: '<path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
    plus: '<path d="M12 4v16M4 12h16"/>'
  };
  const icon = key => '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + (paths[key] || paths.ball) + '</svg>';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, x => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[x]));
  const team = id => D.TEAMS.find(t => t.id === id);
  const badge = id => { const t = team(id); return '<span class="club-badge" style="--club:' + t.color + '">' + esc(t.short.slice(0,1)) + '</span>'; };
  const leagueInfo = id => D.LEAGUES.find(l => l.id === id);
  const leagueTeams = id => D.TEAMS.filter(t => t.leagueId === id);
  const proLeagues = () => D.LEAGUES.filter(l=>l.id!=='highschool');
  const stageLabel = x => x.stage==='highschool'?'고교 '+(x.age-15)+'학년':'프로';
  const dateText = x => x?x.slice(5).replace('-', '/'):'';
  const calendar = () => D.getSeasonSchedule(state);
  const ties = row => row.t || 0;
  const roleName = s => s.role === 'batter' ? '타자 · ' + D.POSITIONS.find(p=>p.id===s.position).name : '투수 · ' + D.PITCHING_ROLES.find(p=>p.id===s.pitchingRole).name;
  const styleName = s => D.STYLES[s.role].find(v => v.id === s.style).name;
  const money = n => Number(n).toLocaleString('ko-KR') + '만 원';
  const lifeMoney=n=>n>=10000?(n/10000).toLocaleString('ko-KR',{maximumFractionDigits:2})+'억 원':money(n);
  const attrLabel = key => D.ATTRS[state.role].find(a => a.key === key)?.label || key;
  const scrollTop = () => window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  try {
    legacyBackup = localStorage.getItem(SAVE+'.backup-v1');
    backupV2 = localStorage.getItem(SAVE+'.backup-v2');
    const saved = localStorage.getItem(SAVE);
    if (saved) {
      const parsed = JSON.parse(saved);
      state = D.validateSave(parsed);
      if (parsed.version<D.VERSION) { preserveLegacy(saved); persist(); setTimeout(()=>toast('기존 커리어를 이어갑니다. 이전 저장 원본도 보관했습니다.'),500); }
    }
  }
  catch (error) { storageError = true; setTimeout(() => toast('저장 데이터를 읽지 못했습니다. 원본은 그대로 보관됩니다.'), 500); }

  function toast(message) {
    const el = document.getElementById('toast'); el.textContent = message; el.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 4000);
  }
  function persist() {
    try { localStorage.setItem(SAVE, JSON.stringify(state)); storageError = false; }
    catch (error) { storageError = true; toast('자동 저장이 불가능합니다. 저장 메뉴에서 파일을 내보내 주세요.'); }
  }
  function preserveLegacy(raw) {
    const version=JSON.parse(raw).version;
    if(version===1){if(legacyBackup)return;legacyBackup=raw;}
    else if(version===2){if(backupV2)return;backupV2=raw;}
    else return;
    try { localStorage.setItem(SAVE+'.backup-v'+version,raw); }
    catch { toast('이전 저장 원본을 저장 메뉴에서 파일로 내보내 주세요.'); }
  }
  function commit(next) { state = next; persist(); render(); }
  function title(label, description, extra = '') {
    return '<div class="page-title"><div><div class="eyebrow">YOUR BASEBALL STORY</div><h1>' + label + '</h1><p>' + description + '</p></div>' + extra + '</div>';
  }
  function intro() {
    const school=creation.entry==='highschool';
    const clubs=leagueTeams(creation.leagueId),club=team(creation.teamId)||clubs[0];
    const selectedStyle=D.STYLES[creation.role].find(s=>s.id===creation.style);
    const positions=creation.role==='batter'?D.POSITIONS:D.PITCHING_ROLES;
    const chosen=creation.role==='batter'?creation.position:creation.pitchingRole;
    return title('첫 유니폼부터, 마지막 시즌까지.','어린 재능이 자라고, 베테랑의 경험이 남는 나만의 야구 인생.','<span class="badge live">CAREER · v0.3</span>')+`
    <div class="intro-grid fade-in"><section class="hero"><div class="hero-copy"><div class="eyebrow">GROW INTO YOUR OWN LEGEND</div><h1>열여섯의 꿈이<br><em>당신의 이름을</em><br>남길 때까지.</h1><p>고교에서 시작해 프로의 부름을 받으세요.<br>전성기를 만들고, 오래 지키는 커리어.<br>성장과 몸 관리가 다음 시즌을 바꿉니다.</p></div><img class="hero-field" src="field.svg" alt="커리어가 시작될 야구장"><span class="hero-tag">FROM THE FIRST UNIFORM.</span></section>
    <form class="card create-card" id="create-form"><div class="card-kicker">PLAYER REGISTRATION</div><h2>새로운 선수 등록</h2><p>투수는 사이영상, 타자는 미국 명예의 전당을 향해. 40세까지 전설에 도전하세요.</p>
    <label class="form-label" for="player-name">선수 이름 <span>최대 20자</span></label><input id="player-name" name="playerName" type="text" maxlength="20" placeholder="어떤 이름으로 기억될까요?" value="${esc(creation.name)}" autocomplete="off" required>
    <div class="form-label">커리어의 출발점</div><div class="segmented" role="group" aria-label="커리어 시작 단계"><button type="button" class="segment ${school?'selected':''}" data-entry="highschool" aria-pressed="${school}">고교 1학년 · 16세</button><button type="button" class="segment ${!school?'selected':''}" data-entry="pro" aria-pressed="${!school}">프로 신인 · 19세</button></div><p class="style-detail">${school?'한국의 가상 고교에서 3년 성장한 뒤 KBO 신인 지명을 받습니다.':'한국·일본·미국 중 선택한 구단에 신인으로 입단합니다.'}</p>
    <div class="form-label">선수 유형</div><div class="segmented" role="group" aria-label="선수 유형">${['batter','pitcher'].map(r=>`<button type="button" class="segment ${creation.role===r?'selected':''}" data-role="${r}" aria-pressed="${creation.role===r}">${icon(r==='batter'?'bat':'ball')}${r==='batter'?'타자':'투수'}</button>`).join('')}</div>
    <div class="form-label">플레이 스타일</div><div class="choices style-choices">${D.STYLES[creation.role].map(st=>`<button type="button" class="choice ${creation.style===st.id?'selected':''}" data-style="${st.id}" aria-pressed="${creation.style===st.id}">${esc(st.name)}</button>`).join('')}</div><p class="style-detail">${esc(selectedStyle.description)}</p>
    <label class="form-label" for="creation-position">${creation.role==='batter'?'수비 위치':'투수 보직'} <span>커리어 중 변경 가능</span></label><select id="creation-position">${positions.map(v=>`<option value="${v.id}" ${chosen===v.id?'selected':''}>${esc(v.name)}</option>`).join('')}</select>
    ${school?'':`<div class="form-label">시작 리그</div><div class="segmented league-segment">${proLeagues().map(l=>`<button type="button" class="segment ${creation.leagueId===l.id?'selected':''}" data-league="${l.id}" aria-pressed="${creation.leagueId===l.id}">${l.country}<small>${l.name}</small></button>`).join('')}</div>`}
    <label class="form-label" for="team-select">${school?'나의 학교':'첫 번째 구단'} <span>${clubs.length}${school?'개교':'구단'} 중 선택</span></label><select id="team-select">${clubs.map(t=>`<option value="${t.id}" ${t.id===creation.teamId?'selected':''}>${esc(t.name)}</option>`).join('')}</select><div class="selected-club">${badge(club.id)}<div><strong>${esc(club.name)}</strong><small>${school?'고교 기록은 프로 통산과 따로 보관합니다.':'FA 자격을 얻기 전에는 소속팀의 보류권이 적용됩니다.'}</small></div></div>
    <button class="primary full" type="submit">나의 커리어 시작하기 ${icon('arrow')}</button><div class="helper">${school?'고교는 가상 8개교 · 주말 중심 28경기':'프로 구단명·2026 일정 기준 · 성적과 연봉은 게임 수치'}</div></form></div>
    <section class="steps"><div class="step"><span class="step-num">01</span><div><h3>어릴수록 더 빠르게</h3><p>좋은 훈련과 회복으로 빠르게 성장.</p></div></div><div class="step"><span class="step-num">02</span><div><h3>전성기를 오래 지키기</h3><p>30세부터 훈련과 회복으로 유지.</p></div></div><div class="step"><span class="step-num">03</span><div><h3>내 커리어의 계약</h3><p>보류권, FA와 다년 계약.</p></div></div></section>`;
  }
  function statItems(st) {
    const r = D.rateStats(st,state.role);
    if(state.role==='batter') return [['타율 · AVG',r.avg,'타격 정확도'],['홈런 · HR',st.hr,'담장을 넘긴 타구'],['타점 · RBI',st.rbi,'불러들인 점수'],['OPS',r.ops,'출루율 + 장타율']];
    const credit=state.pitchingRole==='closer'?['세이브 · SV',st.sv,'승리를 지킨 마무리']:state.pitchingRole==='reliever'?['홀드 · HLD',st.hld,'리드를 지킨 중계']:['이닝 · IP',r.ip,'소수 뒤는 아웃 수'];
    return [['평균자책점 · ERA',r.era,'9이닝당 자책점'],credit,['탈삼진 · K',st.so,'삼진으로 잡은 아웃'],['WHIP',r.whip,'이닝당 안타 + 볼넷']];
  }
  function statStrip(st) { return '<div class="stat-strip">' + statItems(st).map(([a,b,c]) => '<div class="stat-box"><label>' + a + '</label><strong>' + esc(b) + '</strong><small>' + c + '</small></div>').join('') + '</div>'; }
  function agePanel() {
    const older=state.age>=30;
    const ranges=[['16–18','성장 가속',state.age<19],['19–26','전성기 준비',state.age>=19&&state.age<=26],['27–29','성장 완만',state.age>=27&&state.age<30],['30–40','유지와 회복',older]];
    return `<section class="card age-card"><div class="card-head"><div><div class="card-kicker">THE SEASONS OF A PLAYER</div><h2>${state.age}세, ${older?'쌓아온 능력을 지키는 시기':'재능을 키우는 시기'}</h2></div><span class="badge">${stageLabel(state)}</span></div><div class="age-stages">${ranges.map(([age,label,active])=>`<div class="${active?'current':''}"><strong>${age}<small>세</small></strong><span>${label}</span></div>`).join('')}</div><p class="small muted">${older?'30세부터 훈련은 능력 유지에 집중합니다. 타고난 회복력은 하락을 늦추고, 나이와 누적 부상은 노화에 영향을 줍니다.':'젊은 선수는 같은 훈련으로 더 빠르게 성장합니다. 능력 상한에 가까워질수록 성장은 느려집니다.'} 부상 손실은 발생할 때만 작게 반영되며, 재활 중에는 반복되지 않습니다.</p></section>`;
  }
  function contractPanel() {
    const c=D.getContractStatus(state);
    return `<section class="card contract-status"><div class="card-head"><div><div class="card-kicker">MY CAREER</div><h3>${esc(c.label)}</h3></div>${icon('book')}</div><p>${esc(c.detail)}</p>${state.stage==='pro'?`<div class="contract-numbers"><div><span>시즌 연봉</span><strong>${money(state.salary)}</strong></div><div><span>서비스</span><strong>${c.serviceYears}시즌</strong></div></div>`:''}</section>`;
  }
  function upcoming() {
    const cal=calendar(), w=cal.weeks[state.week];
    if(!w)return '';
    const games=w.games.filter(g=>g.home===state.teamId||g.away===state.teamId);
    return `<section class="card upcoming"><div class="card-head"><div><div class="card-kicker">NEXT ON THE CALENDAR</div><h3>${dateText(w.startDate)} — ${dateText(w.endDate)}</h3></div><span class="badge">${games.length}경기</span></div>${games.length?`<div class="schedule-list">${games.map(g=>{const home=g.home===state.teamId;return `<div class="schedule-row"><time>${dateText(g.date)}</time><span class="venue ${home?'home-venue':''}">${home?'홈':'원정'}</span><strong>${esc(team(home?g.away:g.home).name)}</strong></div>`;}).join('')}</div>`:'<p class="small muted">이번 주는 정규경기가 없습니다. 훈련과 회복은 계속할 수 있습니다.</p>'}<button class="text-button" data-view="league">전체 시즌 일정 ${icon('arrow')}</button></section>`;
  }
  function development() {
    const editable=state.phase==='active'&&!state.pendingEvent;
    const opts=state.role==='batter'?D.POSITIONS:D.PITCHING_ROLES;
    const current=state.role==='batter'?state.position:state.pitchingRole;
    return title('훈련하고, 전설에 도전하세요.','훈련과 회복 선택으로 능력을 키우고 다음 경기를 준비하세요.',`<span class="badge">TRAINING POINTS · ${state.points} P</span>`)+`<div class="grid-gap">${agePanel()}<div class="record-grid">${goalPanel()}
      <section class="card"><div class="card-head"><div><div class="card-kicker">FIND YOUR ROLE</div><h2>${state.role==='batter'?'수비 위치 변경':'투수 보직 변경'}</h2></div></div><div class="current-role">${icon(state.role==='batter'?'shield':'ball')}<strong>${esc(roleName(state))}</strong></div><label class="form-label" for="role-select">다음 경기에서 맡을 역할</label><select id="role-select" ${!editable||state.roleChangedWeek?'disabled':''}>${opts.map(o=>`<option value="${o.id}" ${o.id===current?'selected':''}>${esc(o.name)}</option>`).join('')}</select><div class="role-descriptions">${opts.map(o=>`<p><strong>${esc(o.name)}</strong> ${esc(o.description)}</p>`).join('')}</div><button class="primary full" data-action="change-position" ${!editable||state.roleChangedWeek?'disabled':''}>${state.roleChangedWeek?'이번 주 역할 변경 완료':'새 역할로 변경하기'} ${icon('arrow')}</button><p class="table-note">한 주에 1회, 능력과 출전 평가에 실제로 반영됩니다.</p></section></div>
      <details class="card point-supplies"><summary>포인트 보조 아이템 · ${state.points} P</summary><section><div class="card-head"><div><div class="card-kicker">CLUBHOUSE SUPPLIES</div><h2>훈련실 아이템</h2></div><span class="points-badge">${state.points} P</span></div><p class="small muted">매주 12 P 획득 · 실제 결제 없음 · 구매 후 사용 버튼으로 적용</p>${state.injury?`<div class="injury-alert"><strong>${esc(state.injury.name)} · 회복까지 ${state.injury.weeks}주</strong><span>회복 아이템으로 복귀를 앞당길 수 있습니다.</span></div>`:''}<div class="item-grid">${D.ITEMS.map(it=>{const active=it.id==='growth'?state.buffs.growth:it.id==='protection'?state.buffs.protection:0; const owned=state.inventory[it.id];return `<article class="item-card"><div class="item-symbol">${icon(it.id==='recovery'?'leaf':it.id==='growth'?'spark':'shield')}</div><h3>${esc(it.name)}</h3><p>${esc(it.description)}</p><div class="item-state"><span>보유 ${owned}개</span><strong>${active?'효과 '+active+'주 남음':it.price+' P'}</strong></div><div class="item-actions"><button class="secondary" data-buy-item="${it.id}" ${!editable||state.points<it.price||owned>=99?'disabled':''}>${it.price} P 구매</button><button class="primary" data-use-item="${it.id}" ${!editable||!owned||state.usedItems.length||active?'disabled':''}>사용</button></div></article>`;}).join('')}</div><p class="table-note">${state.usedItems.length?'이번 주 아이템을 사용했습니다. 다음 주부터 다시 사용할 수 있습니다.':'아이템은 한 주에 하나만 사용할 수 있습니다. 활성 효과는 중첩되지 않습니다.'}${!editable?' 사건 선택 중이나 시즌 종료·은퇴 상태에서는 관리 행동을 할 수 없습니다.':''}</p></section></details></div>`;
  }
  function goalPanel() {
    const g=D.careerGoal(state);
    return '<details class="card career-goal"><summary><div class="card-head"><div><div class="card-kicker">CHASE YOUR LEGEND</div><h2>'+g.title+'</h2></div><span class="badge">'+(g.achieved?'목표 달성':g.eligible?'입성 조건 달성 · 은퇴 대기':'도전 중')+'</span></div></summary><div class="record-detail">'+g.metrics.map(([label,value,target])=>'<div><span>'+label+'</span><strong>'+value.toLocaleString()+' <small>/ '+target.toLocaleString()+'</small></strong><div class="meter"><i style="width:'+Math.min(100,value/target*100)+'%"></i></div></div>').join('')+'</div><p class="table-note">'+g.detail+'</p><p class="small muted">'+(state.leagueId==='mlb'?'MLB에서 전설의 기록을 쌓으세요.':'현재 리그에서 성장하고 FA로 MLB에 진출하세요. 프로 시작 시 MLB를 바로 선택할 수도 있습니다.')+'</p></details>';
  }
  function life() {
    const shop=D.getLifeShop(state),categories={training:'훈련용품',luxury:'취향과 사치',home:'집과 공간'};
    const canBuy=state.stage==='pro'&&state.phase!=='retired';
    return title('야구 밖의 내 생활.','연봉으로 번 돈을 쓰고, 나만의 일상을 채워보세요.')+`<div class="wallet-strip"><div><span>사용할 수 있는 돈</span><strong>${lifeMoney(shop.balance)}</strong></div><div><span>누적 수령액</span><strong>${lifeMoney(Math.floor(state.totalSalary))}</strong></div><div><span>누적 소비</span><strong>${lifeMoney(shop.spent)}</strong></div></div><p class="shop-note">${state.stage==='highschool'?'프로 입단 후 받은 연봉으로 구매할 수 있습니다.':'연봉은 주간 진행에 맞춰 나누어 들어옵니다.'} 진열은 매주 바뀝니다. 효과와 물품별 차이는 수치로 공개하지 않습니다.</p><div class="life-store">${Object.entries(categories).map(([category,label])=>`<section class="life-section"><h2>${label}</h2><div class="life-grid">${shop.offers.filter(i=>i.category===category).map(i=>`<article class="life-item"><span class="life-tag">${label}</span><h3>${esc(i.name)}</h3><p>${esc(i.description)}</p><div><strong>${lifeMoney(i.price)}</strong><button class="secondary" data-buy-life="${i.id}" ${!canBuy||shop.balance<i.price?'disabled':''}>${shop.balance<i.price?'잔액 부족':'구매'}</button></div></article>`).join('')||'<p class="small muted">이 분류의 물품을 모두 보유하고 있습니다.</p>'}</div></section>`).join('')}</div><details class="card owned-life" ${shop.owned.length?'open':''}><summary>내가 마련한 것들 <span>${shop.owned.length}개</span></summary><div class="owned-list">${shop.owned.length?shop.owned.map(i=>`<div><span><strong>${esc(i.name)}</strong><small>${categories[i.category]} · ${i.season}시즌 ${i.week}주</small></span><span>${lifeMoney(i.price)}</span></div>`).join(''):'<p class="small muted">첫 구매의 주인공은 무엇일까요?</p>'}</div></details>`;
  }
  function profile() {
    return `<section class="card player-card"><div class="player-top"><span class="card-kicker">${leagueInfo(state.leagueId).name} · PLAYER CARD</span><div class="overall">${D.overall(state)}<small>OVERALL</small></div></div><div class="jersey">${state.age}</div><h2 class="player-name">${esc(state.name)}</h2><p class="player-meta">${esc(team(state.teamId).name)}<br>${roleName(state)}</p><div class="attribute-caption">현재 능력</div><div class="attributes">${D.ATTRS[state.role].map(a=>`<div class="attribute"><span>${a.label}</span><span class="attribute-track"><i style="width:${state.attrs[a.key]}%"></i></span><strong>${Math.round(state.attrs[a.key])}</strong></div>`).join('')}</div><button class="profile-manage" data-view="development">포지션 · 아이템 관리 ${icon('arrow')}</button></section>`;
  }
  function condition() {
    const o=D.getOutlook(state);
    return `<section class="card"><div class="card-head"><h3>이번 주 컨디션</h3>${icon('leaf')}</div>${state.injury?`<div class="injury-alert"><strong>${esc(state.injury.name)}</strong><span>회복까지 ${state.injury.weeks}주 · 경기 결장</span><button class="text-button" data-view="development">회복 아이템 확인 ${icon('arrow')}</button></div>`:''}<div class="condition-grid">${[['누적 피로',state.fatigue],['감독 신뢰',state.trust],['사기',state.morale]].map(([label,value],i)=>`<div><div class="condition-row"><span>${label}</span><strong>${Math.round(value)}<span class="muted"> / 100</span></strong></div><div class="meter ${i===0&&value>=65?'danger':''}"><i style="width:${value}%"></i></div></div>`).join('')}</div><div class="outlook"><strong>${esc(o.label)}</strong><p>${esc(o.reason)}</p><p>현재 출전 가능성 ${Math.round(o.probability*100)}%</p></div>${state.buffs.growth||state.buffs.protection?`<div class="effect-chips">${state.buffs.growth?`<span>성장 보조 ${state.buffs.growth}주</span>`:''}${state.buffs.protection?`<span>부상 예방 ${state.buffs.protection}주</span>`:''}</div>`:''}</section>`;
  }
  function sortedTeams() { return [...state.standings].sort((a,b) => (b.w/Math.max(1,b.w+b.l)-a.w/Math.max(1,a.w+a.l)) || b.w-a.w || (b.rs-b.ra)-(a.rs-a.ra) || D.TEAMS.findIndex(t=>t.id===a.teamId)-D.TEAMS.findIndex(t=>t.id===b.teamId)); }
  function miniLeague() {
    return '<section class="card"><div class="card-head"><h3>리그 한눈에</h3><button class="text-button" data-view="league">전체 ' + icon('arrow') + '</button></div><table class="ranking-mini"><caption class="visually-hidden">현재 리그 상위 구단</caption><tbody>' + sortedTeams().slice(0,5).map((t,i)=>'<tr class="' + (t.teamId===state.teamId?'our-team':'') + '"><td>'+(i+1)+'</td><td>'+badge(t.teamId)+team(t.teamId).short+'</td><td>'+t.w+'승 '+t.l+'패</td></tr>').join('') + '</tbody></table></section>';
  }
  function training() {
    return '<section class="card"><div class="card-head"><div><div class="card-kicker">WEEKLY ROUTINE</div><h2>이번 주, 나를 만드는 훈련</h2></div><span class="badge">' + (state.week+1) + '주차</span></div><div class="training-grid" role="group" aria-label="주간 훈련 선택">' + D.PLANS[state.role].map((p,i) => '<button class="training-choice ' + (plan===p.id?'selected':'') + '" data-plan="' + p.id + '" aria-pressed="' + (plan===p.id) + '"' + (p.id==='rest'?' style="grid-column:1/-1;min-height:90px"':'') + '><div class="plan-top">' + icon(p.id==='rest'?'leaf':i===0?'target':i===1?'spark':i===2?'bat':'shield') + '<strong>' + p.name + '</strong><span class="radio-mark"></span></div><p>' + (state.age<30?p.description:p.id==='rest'?'피로 크게 감소 · 회복에 집중':p.id==='balanced'?'전 능력 유지에 집중 · 노화 부담 완화':'능력 유지 훈련 · 피로와 회복 상태에 주의') + '</p><span class="plan-cost">훈련 피로 ' + (p.fatigue>0?'+':'') + p.fatigue + ' · 경기 부하와 자연 회복은 별도</span></button>').join('') + '</div><div class="advance-row"><div><strong>' + (state.role==='batter'?'기회가 오면, 준비된 스윙을.':'다음 등판을 위한 한 주.') + '</strong><p>빠른 진행은 피로 60 이상·부상 시 자동 회복하며 주요 선택과 시즌 종료에서 멈춥니다.</p></div><button class="secondary" data-action="advance-one">1주</button><button class="secondary" data-action="advance-key">다음 주요 선택까지</button><button class="primary" data-action="advance" ' + (busy?'disabled':'') + '>' + (busy?'<span class="loading-dot"></span> 경기 진행 중':'4주 빠르게 진행 '+icon('arrow')) + '</button></div></section>';
  }
  function results() {
    const w = state.lastWeek;
    if (!w) return '<section class="card"><div class="section-heading"><h2>주간 경기 리포트</h2><span class="card-kicker">WEEKLY REPORT</span></div><div class="empty-state">'+icon('ball')+'<h3>첫 경기가 당신을 기다립니다.</h3><p>훈련을 선택하고 한 주를 진행하세요.<br>출전 기록과 성장의 변화를 이곳에서 확인할 수 있습니다.</p></div></section>';
    return '<section class="card fade-in"><div class="section-heading"><h2>'+state.week+'주차 경기 리포트</h2><span class="badge">'+w.gamesPlayed+'경기 출전</span></div><div class="result-overview">'+w.summary.map(esc).join('<br>')+'</div><div>'+w.games.map(g=>'<div class="game-row"><span class="result-tag '+(g.our<g.opp?'loss':g.our===g.opp?'draw':'')+'">'+(g.our===g.opp?'D':g.our>g.opp?'W':'L')+'</span><span>'+(g.date?'<small class="game-date">'+dateText(g.date)+'</small>':'')+esc(team(g.opponentId).name)+'</span><span class="game-score">'+g.our+' : '+g.opp+'</span><span class="game-line">'+esc(g.line)+(g.highlight?'<small class="game-highlight">'+esc(g.highlight)+'</small>':'')+'</span></div>').join('')+'</div><div class="growth-chips">'+w.gains.map(g=>'<span class="growth-chip '+(g.delta<0?'negative':'')+'">'+esc(attrLabel(g.key))+' '+(g.delta>0?'+':'')+g.delta.toFixed(2)+'</span>').join('')+'</div></section>';
  }
  function eventCard() {
    const e = state.pendingEvent;
    return '<section class="card event-card fade-in"><div class="eyebrow">A MOMENT THAT MATTERS · '+e.choices.length+' CHOICES</div><h2>'+esc(e.title)+'</h2><p>'+esc(e.body)+'</p><div class="event-choices">'+e.choices.map(c=>'<button class="event-choice" data-event-choice="'+esc(c.id)+'"><span><strong>'+esc(c.label)+'</strong><small>'+esc(c.detail)+'</small></span>'+icon('arrow')+'</button>').join('')+'</div></section>';
  }
  function postingCard() {
    if(state.stage!=='pro'||!['kbo','npb'].includes(state.leagueId)||state.age>=40)return '';
    const p=D.getPostingStatus(state);
    if(p.offers.length&&!p.offers.some(o=>o.teamId===postingTeam))postingTeam=p.offers[0].teamId;
    const offer=p.offers.find(o=>o.teamId===postingTeam);
    return `<section class="card"><div class="card-head"><div><div class="card-kicker">ROAD TO THE MAJORS</div><h2>MLB 포스팅 도전</h2></div><span class="badge">${p.eligible?p.offers.length+'개 구단 관심':'조건 확인'}</span></div><div class="role-descriptions">${p.checks.map(c=>`<p><strong>${c.met?'✓':'○'}</strong> ${esc(c.label)}</p>`).join('')}</div>${offer?`<p>소속 구단이 포스팅을 승인했습니다. 제안을 수락하면 다음 시즌 MLB에 합류합니다.</p><label class="form-label" for="posting-team">관심 MLB 구단</label><select id="posting-team">${p.offers.map(o=>`<option value="${o.teamId}" ${o.teamId===postingTeam?'selected':''}>${esc(team(o.teamId).name)} · 연 ${money(o.annualSalary)}</option>`).join('')}</select><label class="form-label" for="posting-years">계약 기간</label><select id="posting-years">${offer.years.map(y=>`<option value="${y}" ${y===postingYears?'selected':''}>${y}년</option>`).join('')}</select><p class="contract-explanation">연 ${money(offer.annualSalary)} · 총 ${money(offer.annualSalary*postingYears)}</p><button class="primary full" data-posting="${offer.teamId}" data-posting-years="${postingYears}">포스팅 계약 · MLB 진출 ${icon('arrow')}</button><p class="table-note">제안을 거절하고 아래에서 현재 구단과 다음 시즌을 이어가면 성적에 따라 다시 도전할 수 있습니다.</p>`:`<p class="small muted">미충족 조건을 채워 다음 시즌에 다시 도전하세요. 해외 FA 자격을 얻었다면 아래 FA 시장에서 MLB와 직접 계약할 수 있습니다.</p>`}<p class="table-note">${esc(p.detail)}</p></section>`;
  }
  function seasonEnd() {
    const standing=state.standings.find(t=>t.teamId===state.teamId),last=state.age>=40,c=D.getContractStatus(state);
    const header=`<section class="season-end-banner"><div class="eyebrow">${state.schedule.year} · ${stageLabel(state)} / COMPLETE</div><h2>${last?'마지막 정규시즌을 마쳤습니다.':state.stage==='highschool'&&state.age===18?'프로의 부름이 도착했습니다.':'한 시즌을, 당신의 기록으로.'}</h2><p>${esc(team(state.teamId).name)} · ${standing.w}승 ${standing.l}패 ${ties(standing)}무 · ${sortedTeams().findIndex(t=>t.teamId===state.teamId)+1}위</p><p>${state.age}세 · 종합 능력 ${D.overall(state)}${state.stage==='pro'?' · 시즌 연봉 '+money(state.salary):''}</p>${last?`<button class="primary gold" data-action="finish">커리어 마무리 ${icon('arrow')}</button>`:''}</section>`;
    if(last)return header;
    const posting=postingCard();
    const options=D.contractOptions(state);
    if(!c.canChooseTeam){const option=options[0];return header+posting+`<section class="card"><div class="card-kicker">THE NEXT CHAPTER</div><h2>${esc(c.label)}</h2><p class="contract-explanation">${esc(c.detail)}</p>${option?`<div class="selected-club">${badge(option.teamId)}<div><strong>${esc(team(option.teamId).name)}</strong><small>${esc(option.reason||'')}</small></div></div><button class="primary full" data-contract="${option.teamId}" data-contract-years="1">${state.stage==='highschool'?(state.age===18?'지명 구단에 입단하기':'다음 학년으로'):'같은 팀에서 다음 시즌'} ${icon('arrow')}</button>`:''}<p class="table-note">${state.stage==='highschool'?'고교 3년 뒤 프로 지명을 받는 게임 경로입니다. 실제 고교 대회·드래프트 전체를 재현하지는 않습니다.':'연봉 갱신과 자유 이적은 다릅니다. 보류권 또는 계약 잔여 기간이 있으면 구단을 임의로 바꿀 수 없습니다.'}</p></section>`;}
    const leagues=proLeagues().filter(l=>options.some(o=>team(o.teamId).leagueId===l.id));
    if(!leagues.some(l=>l.id===transferLeague))transferLeague=leagues[0].id;
    const choices=options.filter(o=>team(o.teamId).leagueId===transferLeague);
    if(!choices.some(o=>o.teamId===transferTeam))transferTeam=choices[0].teamId;
    const option=choices.find(o=>o.teamId===transferTeam),target=team(transferTeam);
    if(!option.years.includes(contractYears))contractYears=option.years[0];
    const quote=D.getContractOffer(state,target.id,contractYears), retryQuote=D.getContractOffer(state,state.teamId,1);
    return header+posting+`<section class="card"><div class="card-head"><div><div class="card-kicker">FREE AGENCY</div><h2>${esc(c.label)}</h2></div></div><p class="small muted">${esc(c.detail)}</p><button class="secondary renew-button" data-action="defer-fa">FA 재수 · 현재 팀에서 1년 더 도전</button><p class="table-note">1년 연봉 ${money(retryQuote.annualSalary)}. FA 권리를 보유하고 다음 시즌에 다시 협상합니다. 현재 시즌 성적이 다음 제안에 반영되므로 성적 하락 시 제안도 낮아질 수 있습니다. 일본 국내 FA를 유보하면 해외 FA도 기다릴 수 있습니다.</p><div class="form-label">계약 가능한 리그</div><div class="segmented league-segment">${leagues.map(l=>`<button class="segment ${transferLeague===l.id?'selected':''}" data-transfer-league="${l.id}" aria-pressed="${transferLeague===l.id}">${l.country}<small>${l.name}</small></button>`).join('')}</div><label class="form-label" for="contract-team">협상 구단</label><select id="contract-team">${choices.map(o=>`<option value="${o.teamId}" ${transferTeam===o.teamId?'selected':''}>${esc(team(o.teamId).name)}</option>`).join('')}</select><label class="form-label" for="contract-years">계약 기간</label><select id="contract-years">${option.years.map(y=>`<option value="${y}" ${y===contractYears?'selected':''}>${y}년 계약</option>`).join('')}</select><div class="transfer-summary">${badge(target.id)}<div><strong>${esc(target.name)}</strong><p>${esc(option.reason||'계약 기간 동안 소속팀과 연봉 유지')}</p><p>연 ${money(quote.annualSalary)} · ${contractYears}년 총 ${money(quote.total)}</p></div><button class="primary" data-contract="${target.id}" data-contract-years="${contractYears}">${contractYears}년 계약하기 ${icon('arrow')}</button></div><p class="table-note">등록·말소를 생략해 프로 완료 시즌마다 서비스 1년으로 계산합니다. FA 재취득 요건과 남은 계약 기간을 함께 확인합니다. 연봉은 공통 게임 수치입니다.</p></section>`;
  }
  function home() {
    const weeks=state.schedule.weekCount;
    const marker=`<div class="season-chip"><strong>${state.schedule.year}</strong><div><div class="tiny muted">${state.week}/${weeks}주 · ${state.schedule.gamesPerTeam}경기</div><div class="season-track"><i style="width:${state.week/weeks*100}%"></i></div></div></div>`;
    if(state.phase==='retired')return retired();
    return title(state.week===0?'새 시즌, 다시 첫 페이지.':'이번 주, 어떤 선수가 될까요?',esc(state.name)+' · '+state.age+'세 · '+stageLabel(state)+' · '+esc(team(state.teamId).name),marker)+`<div class="game-layout"><div class="main-column">${goalPanel()}${statStrip(state.stats)}${state.pendingEvent?eventCard():state.phase==='seasonEnd'?seasonEnd():training()+'<details class="card compact-upcoming"><summary>이번 주 일정</summary>'+upcoming()+'</details>'}${results()}</div><aside class="side-column">${profile()}<button class="wallet-link" data-view="life">내 생활 · ${lifeMoney(D.getLifeShop(state).balance)} ${icon("arrow")}</button>${contractPanel()}${condition()}${miniLeague()}</aside></div>`;
  }
  function recordCard(st, label, subtitle) {
    const details = state.role==='batter' ? [['경기',st.g],['타석',st.pa],['안타',st.h],['2루타',st.doubles],['3루타',st.triples],['볼넷',st.bb],['삼진',st.so],['득점',st.r],['도루',st.sb],['도루 실패',st.cs],['사구',st.hbp],['희생플라이',st.sf]] : [['등판',st.g],['선발',st.starts],['승리',st.w],['패배',st.l],['세이브',st.sv],['홀드',st.hld],['이닝',D.rateStats(st,state.role).ip],['피안타',st.ha],['볼넷',st.bb],['실점',st.ra],['자책점',st.er],['탈삼진',st.so]];
    return '<section class="card"><div class="card-head"><div><div class="card-kicker">'+subtitle+'</div><h2>'+label+'</h2></div></div>'+statStrip(st)+'<div class="record-detail">'+details.map(([a,b])=>'<div><span>'+a+'</span><strong>'+b+'</strong></div>').join('')+'</div></section>';
  }
  function records() {
    return title('숫자로 쌓인, 나의 이야기.','좋은 날도, 아쉬운 날도. 모든 경기는 기록으로 남습니다.')+'<div class="grid-gap"><div class="record-grid">'+recordCard(state.stats,'이번 시즌','SEASON '+String(state.season).padStart(2,'0'))+recordCard(state.careerStats,'프로 통산 기록','PRO CAREER')+'</div>'+recordCard(state.schoolStats,'고교 통산 기록','AMATEUR CAREER')+ (state.seasons.length?'<section class="card"><div class="card-head"><h2>지난 시즌</h2></div><div class="table-wrap"><table><thead><tr><th>시즌</th><th>소속</th><th>경기</th><th>'+(state.role==='batter'?'타율':'ERA')+'</th><th>'+(state.role==='batter'?'홈런':'탈삼진')+'</th><th>종합 능력</th></tr></thead><tbody>'+state.seasons.map(s=>'<tr><td>'+s.season+'시즌 · '+s.age+'세</td><td>'+team(s.teamId).name+'</td><td>'+s.stats.g+'</td><td>'+D.rateStats(s.stats,state.role)[state.role==='batter'?'avg':'era']+'</td><td>'+s.stats[state.role==='batter'?'hr':'so']+'</td><td>'+s.overall+'</td></tr>').join('')+'</tbody></table></div></section>':'')+'<div class="banner-note">타율은 안타 ÷ 타수, OPS는 출루율 + 장타율입니다. ERA는 9이닝당 자책점, WHIP은 이닝당 피안타와 볼넷입니다. 이닝 5.2는 5⅔이닝을 뜻합니다. 기회가 없으면 비율을 ‘—’로 표시합니다.</div></div>';
  }
  function league() {
    const info=leagueInfo(state.leagueId),cal=calendar(),games=cal.games.filter(g=>g.home===state.teamId||g.away===state.teamId);
    const months=[...new Set(games.map(g=>g.date.slice(0,7)))];
    if(!months.includes(scheduleMonth))scheduleMonth=(cal.weeks[Math.min(state.week,cal.weeks.length-1)]?.startDate||games[0]?.date||'').slice(0,7);
    if(!months.includes(scheduleMonth))scheduleMonth=months[0]||'';
    const shown=games.filter(g=>g.date.startsWith(scheduleMonth));
    const mode=state.schedule.kind==='legacy'?'이전 버전 일정':['official','official-adapted'].includes(state.schedule.sourceMode)?'2026 공식 대진·날짜':'기준 일정으로 생성';
    return title('경기 날짜 위에, 시즌이 쌓입니다.',`${state.schedule.year} · ${info.name} · ${team(state.teamId).short} ${state.schedule.gamesPerTeam}경기`)+`<div class="grid-gap"><section class="card"><div class="card-head"><div><div class="card-kicker">SEASON CALENDAR</div><h2>나의 경기 일정</h2></div><span class="badge">${mode}</span></div><p class="small muted">${esc(state.schedule.notes||'')} ${state.schedule.openingDate} — ${state.schedule.endDate}</p><label class="form-label" for="schedule-month">월 선택 <span>총 ${games.length}경기</span></label><select id="schedule-month">${months.map(m=>`<option value="${m}" ${m===scheduleMonth?'selected':''}>${m.replace('-','년 ')}월</option>`).join('')}</select><div class="schedule-list full-calendar">${shown.map(g=>{const isHome=g.home===state.teamId;return `<div class="schedule-row"><time>${dateText(g.date)}</time><span class="venue ${isHome?'home-venue':''}">${isHome?'홈':'원정'}</span><strong>${esc(team(isHome?g.away:g.home).name)}</strong></div>`;}).join('')}</div></section>
    <section class="card"><div class="banner-note">${esc(D.getLeagueRules(state.leagueId).description)}. 연장은 팀 득점으로 계산하며 개인 추가 타석·투구 기록은 생략합니다.</div><div class="card-head"><h2>${state.schedule.year} 시즌 순위</h2><span class="badge">${state.week}주차 종료</span></div>${state.schedule.kind==='legacy'?'<div class="banner-note">기존 저장의 진행 중인 시즌은 기록 보존을 위해 16주·112경기를 유지합니다. 다음 시즌부터 새 일정을 적용합니다.</div>':''}<div class="table-wrap"><table><thead><tr><th>순위 / 구단</th><th>경기</th><th>승</th><th>패</th><th>무</th><th>승률</th><th>득점</th><th>실점</th></tr></thead><tbody>${sortedTeams().map((t,i)=>`<tr class="${t.teamId===state.teamId?'our-team':''}"><td><span class="rank-number">${i+1}</span>${badge(t.teamId)}${esc(team(t.teamId).name)}</td><td>${t.w+t.l+ties(t)}</td><td>${t.w}</td><td>${t.l}</td><td>${ties(t)}</td><td>${t.w+t.l?(t.w/(t.w+t.l)).toFixed(3):'—'}</td><td>${t.rs}</td><td>${t.ra}</td></tr>`).join('')}</tbody></table></div><p class="table-note">경기 결과는 게임 시뮬레이션입니다. 표시 순위는 리그 전체 승률 → 승수 → 득실차 순이며, 실제 지구별 순위와 포스트시즌은 아직 포함하지 않습니다.</p></section><section class="card roadmap-teaser"><div><div class="card-kicker">COMING NEXT</div><h3>국가대표의 유니폼까지</h3><p>국제대회는 공식 자료 조사 후 후속 개발 일정에 편성했습니다.</p></div><button class="secondary" data-action="roadmap">국제대회 개발 계획</button></section></div>`;
  }
  function timeline() {
    return title('기록 사이에 남은 순간들.','당신의 선택으로 만들어진 커리어를 돌아보세요.')+'<section class="card"><div class="timeline">'+[...state.history].reverse().map(h=>'<article class="timeline-entry"><time>SEASON '+String(h.season).padStart(2,'0')+' · WEEK '+String(h.week).padStart(2,'0')+'</time><h3>'+esc(h.title)+'</h3><p>'+esc(h.text)+'</p></article>').join('')+'</div></section>';
  }
  function retired() {
    return '<div class="grid-gap"><section class="season-end-banner retired-card"><div class="eyebrow">A CAREER WORTH REMEMBERING</div><img src="ball.svg" width="55" height="55" alt="" style="margin:25px auto 10px"><h1>'+esc(state.name)+',<br>당신의 야구를 기억합니다.</h1><p>'+esc(styleName(state))+' · '+state.careerStats.g+'경기 · 최종 종합 능력 '+D.overall(state)+'<br>이 기록은 당신의 선택으로 만들어졌습니다.</p><div class="retired-actions"><button class="primary gold" data-action="export">기록 파일 보관 '+icon('download')+'</button><button class="secondary" data-action="new">다른 선수로 시작</button></div><p class="tiny">이번 선수의 커리어가 끝났습니다. 다른 역할과 선택으로 새로운 이야기를 만들어보세요.</p></section>'+goalPanel()+statStrip(state.careerStats)+'<section class="card"><div class="card-head"><h2>커리어의 마지막 페이지</h2><button class="text-button" data-view="timeline">연표 보기 '+icon('arrow')+'</button></div><div class="record-detail"><div><span>경기 출전</span><strong>'+state.careerStats.g+'</strong></div><div><span>완료 시즌</span><strong>'+state.seasons.length+'</strong></div><div><span>누적 연봉</span><strong style="font-size:17px">'+money(state.totalSalary)+'</strong></div></div></section></div>';
  }
  function render() {
    const labels = {home:'클럽하우스',records:'나의 기록실',development:'선수 관리',life:'라이프',league:'일정·순위',timeline:'커리어 연표'};
    document.getElementById('breadcrumb').textContent = labels[view];
    document.querySelectorAll('.nav-item[data-view]').forEach(el => { el.classList.toggle('active',el.dataset.view===view); if(el.dataset.view===view)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current'); });
    const save = document.getElementById('save-status'); save.innerHTML = '<i></i>'+ (storageError?'자동 저장 확인 필요':state?'진행 상황 자동 저장':'기기 자동 저장'); save.classList.toggle('error',storageError);
    if (!state) main.innerHTML=intro(); else main.innerHTML=({home,records,development,life,league,timeline}[view])();
  }
  function showDialog(heading, content) {
    const dialog = document.getElementById('dialog');
    dialog.innerHTML='<button class="modal-close" data-action="close-dialog" aria-label="닫기">'+icon('close')+'</button><h2 id="dialog-title">'+heading+'</h2>'+content;
    if (!dialog.open) dialog.showModal();
  }
  function closeDialog() { document.getElementById('dialog').close(); }
  function guide() {
    showDialog('한 선수의 야구 인생',`<p>고교 16세 또는 프로 19세로 시작해 40세 시즌까지 이어갑니다. 훈련을 고르고 4주씩 또는 다음 주요 선택까지 빠르게 진행하세요. 빠른 진행 중에는 자동으로 회복하며 사건 선택과 계약에서는 멈춥니다.</p><ul><li><strong>성장기:</strong> 어린 선수일수록 빠르게 성장하고 높은 능력에 도달하면 성장이 완만해집니다. 30세부터 훈련은 유지에 집중하며 회복력·누적 부상에 따라 노화가 달라집니다.</li><li><strong>부상:</strong> 발생할 때 관련 능력만 소폭 감소합니다. 부상 중 매주 반복해 깎지 않습니다. 피로는 경기력과 부상 위험에 영향을 줍니다.</li><li><strong>고교:</strong> 가상 8개교·주말 중심 28경기를 3년 진행합니다. 프로 지명 구단에 입단하며 고교 기록은 프로 통산과 분리됩니다.</li><li><strong>계약:</strong> FA 전에는 소속팀에 보류권이 있습니다. 프로 완료 시즌을 서비스 1년으로 간주합니다. KBO 고졸 첫 FA 8시즌, NPB 국내 8·해외 9, MLB 6을 적용합니다. KBO·NPB에서 FA를 행사하면 재취득 기간도 필요합니다.</li><li><strong>MLB 포스팅:</strong> 시즌 종료 후 경력·성적·신뢰 조건을 충족하면 MLB 제안을 받습니다. 게임 조건은 포스팅 화면에 표시합니다.</li><li><strong>FA 재수:</strong> 제안이 아쉬우면 현재 팀에서 1년 더 뛰고 FA 권리를 유지한 채 다시 협상하세요. 다음 시즌 성적에 따라 제안이 오르거나 낮아집니다.</li><li><strong>다년 계약:</strong> FA 때 1~4년을 선택합니다. 계약이 남아 있으면 팀과 연봉을 유지합니다. MLB 3시즌 이후에는 연봉 조정 단계를 반영합니다.</li><li><strong>선수 관리:</strong> 포지션 변경은 주간 1회입니다. 매주 12 P를 받아 아이템을 구매하고, 주간 1개 사용합니다.</li><li><strong>라이프:</strong> 받은 연봉으로 훈련용품·사치품·집을 구매할 수 있습니다. 진열은 매주 바뀌며 물품의 효과 수치는 공개하지 않습니다. 성장·회복 아이템은 기존 포인트로 구매합니다.</li><li><strong>경기 규칙:</strong> KBO 연장 11회·NPB 12회 뒤 동점이면 무승부, MLB는 연장 승부치기로 승패를 결정합니다. 연장 추가 개인 타석·이닝과 상세 투수 책임 시점은 생략합니다.</li><li><strong>이벤트:</strong> 시즌 7차례, 코치 면담과 스카우트·슬럼프·루틴 등 선택형 사건이 등장합니다. 추가 사건은 3개 선택지로 성장·신뢰·사기·피로·훈련 보조 효과가 달라집니다.</li><li><strong>일정:</strong> 기본 규모는 KBO 144·NPB 143·MLB 162경기입니다. 2026 MLB의 최종 취소 경기로 두 팀은 실제 161경기를 반영합니다. 기준 자료와 실제 대진 적용 여부는 일정·순위 화면에서 확인하세요. 미래 시즌은 기준 일정을 활용해 생성합니다.</li></ul><p>로스터 이동·외국인 제한·보상선수·트레이드·포스트시즌은 생략했습니다. 연봉과 성적은 게임 수치입니다. 기존 저장은 진행 중인 시즌의 기록과 일정을 보존해 전환합니다.</p><button class="secondary full" data-action="roadmap">국제대회 개발 계획</button><button class="primary full" data-action="close-dialog">준비됐어요 ${icon('arrow')}</button>`);
  }
  function roadmap() {
    const items=window.DugoutScheduleData?.INTERNATIONAL_ROADMAP||[];
    showDialog('국제대회 · 후속 개발 계획',`<p>이번 버전은 성장·계약·시즌 일정까지 적용했습니다. 국제대회는 아래 순서로 추가할 예정이며, 아직 플레이 기능은 없습니다.</p><div class="roadmap-list">${items.length?items.map((x,i)=>`<article><span class="badge">${esc(x.release||('후속 '+(i+1)))}</span><h3>${esc(x.name)}</h3><p>${esc(x.window||'')}</p><p>${esc(x.detail||x.status||'')}</p></article>`).join(''):'<article><h3>U-18 · WBC · 프리미어12 · 아시안게임 · 올림픽</h3><p>대표 선발, 구단 차출, 대회별 출전 조건과 일정 충돌 처리를 순차 개발합니다.</p></article>'}</div><p class="table-note">개발 순서는 계획이며 실제 개발 착수일·출시일은 확정하지 않았습니다.</p><button class="primary full" data-action="close-dialog">닫기</button>`);
  }
  function saveMenu() {
    showDialog('저장 및 게임 관리',`<p>진행과 선택은 이 브라우저에 자동 저장됩니다. 다른 브라우저로 옮기려면 파일로 내보내세요.</p><div class="menu-actions"><button class="secondary" data-action="export" ${!state?'disabled':''}>${icon('download')}저장 파일 내보내기</button><button class="secondary" data-action="import">${icon('upload')}저장 파일 가져오기</button>${legacyBackup?`<button class="secondary" data-action="export-legacy" data-backup-version="1">${icon('download')}v1 저장 원본 내보내기</button>`:''}${backupV2?`<button class="secondary" data-action="export-legacy" data-backup-version="2">${icon('download')}v2 저장 원본 내보내기</button>`:''}<button class="secondary" data-action="guide">${icon('book')}플레이 가이드</button><button class="secondary danger-text" data-action="new" ${!state?'disabled':''}>${icon('plus')}새로운 선수 시작하기</button></div>`);
  }
  function exportSave() {
    if (!state) return;
    const blob = new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob), a=document.createElement('a');a.href=url;a.download='dugout-season-'+state.season+'-week-'+state.week+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('현재 커리어를 파일로 내보냈습니다.');
  }
  function startNew() {
    if (state) showDialog('새로운 커리어를 시작할까요?','<p>진행 중인 선수는 한 명만 저장할 수 있습니다. 현재 기록을 보관하려면 먼저 파일로 내보내세요.</p><div class="menu-actions"><button class="secondary" data-action="export">'+icon('download')+'현재 기록 내보내기</button><button class="primary" data-action="confirm-new">새 선수 만들기</button><button class="secondary" data-action="close-dialog">계속 플레이하기</button></div>');
    else {view='home';render();closeDialog();}
  }
  document.addEventListener('input', e => {if(e.target.id==='player-name')creation.name=e.target.value;});
  document.addEventListener('change', e => {
    if(e.target.id==='creation-position'){if(creation.role==='batter')creation.position=e.target.value;else creation.pitchingRole=e.target.value;}
    if(e.target.id==='team-select'){creation.teamId=e.target.value;render();}
    if(e.target.id==='contract-team'){transferTeam=e.target.value;render();}
    if(e.target.id==='posting-team'){postingTeam=e.target.value;render();}
    if(e.target.id==='posting-years'){postingYears=Number(e.target.value);render();}
    if(e.target.id==='contract-years'){contractYears=Number(e.target.value);render();}
    if(e.target.id==='schedule-month'){scheduleMonth=e.target.value;render();}
  });
  document.addEventListener('submit', e => {
    if(e.target.id!=='create-form')return;e.preventDefault();
    try {const name=document.getElementById('player-name').value.trim();if(!name){document.getElementById('player-name').focus();return;}plan='balanced';view='home';commit(D.createCareer({...creation,name,position:creation.role==='batter'?creation.position:undefined,pitchingRole:creation.role==='pitcher'?creation.pitchingRole:undefined}));scrollTop();toast('첫 시즌이 시작됐습니다. 나만의 훈련을 골라보세요.');}catch(error){toast(error.message);}
  });
  document.addEventListener('click', async e => {
    const el=e.target.closest('button');if(!el||el.disabled||busy)return;
    try {
      if(el.dataset.view){if(!state){toast('선수를 등록하면 기록과 순위를 확인할 수 있습니다.');return;}view=el.dataset.view;render();scrollTop();return;}
      if(el.dataset.entry){creation.entry=el.dataset.entry;creation.leagueId=creation.entry==='highschool'?'highschool':'kbo';creation.teamId=leagueTeams(creation.leagueId)[0].id;render();return;}
      if(el.dataset.league){creation.leagueId=el.dataset.league;creation.teamId=leagueTeams(creation.leagueId)[0].id;render();return;}
      if(el.dataset.transferLeague){transferLeague=el.dataset.transferLeague;transferTeam=leagueTeams(transferLeague)[0].id;render();return;}
      if(el.dataset.buyItem){commit(D.buyItem(state,el.dataset.buyItem));toast('아이템을 구매했습니다. 사용 버튼으로 적용하세요.');return;}
      if(el.dataset.buyLife){const item=D.LIFE_ITEMS.find(i=>i.id===el.dataset.buyLife);commit(D.buyLifeItem(state,el.dataset.buyLife));toast(item.name+'을(를) 마련했습니다.');return;}
      if(el.dataset.useItem){commit(D.useItem(state,el.dataset.useItem));toast('아이템 효과를 적용했습니다.');return;}
      if(el.dataset.role){creation.role=el.dataset.role;creation.style=D.STYLES[creation.role][0].id;render();return;}
      if(el.dataset.style){creation.style=el.dataset.style;render();return;}
      if(el.dataset.club){creation.teamId=el.dataset.club;render();return;}
      if(el.dataset.plan){plan=el.dataset.plan;render();return;}
      if(el.dataset.eventChoice){commit(D.resolveEvent(state,el.dataset.eventChoice));toast('선택이 커리어에 반영됐습니다.');return;}
      if(el.dataset.posting){plan='balanced';scheduleMonth='';commit(D.nextSeason(state,el.dataset.posting,Number(el.dataset.postingYears),false,'posting'));scrollTop();toast('포스팅 계약 완료! MLB에서 새 시즌을 시작합니다.');return;}
      if(el.dataset.contract){plan='balanced';scheduleMonth='';commit(D.nextSeason(state,el.dataset.contract,Number(el.dataset.contractYears||1)));scrollTop();toast(state.stage==='highschool'?'새 학년이 시작됐습니다.':'새 시즌을 시작합니다. 연봉 '+money(state.salary));return;}
      switch(el.dataset.action){
        case 'advance-one':case 'advance-key':case 'advance': {
          busy=true;render();await new Promise(r=>setTimeout(r,0));
          try {const result=D.advanceWeeks(state,plan,el.dataset.action==='advance-one'?1:el.dataset.action==='advance-key'?60:4);state=result.state;persist();
            toast(result.weeks+'주 · '+result.games+'경기 출전 · 자동 회복 '+result.recoveries+'주');
          } finally {busy=false;render();}
          if(state.pendingEvent||state.phase==='seasonEnd')scrollTop();break;
        }
        case 'defer-fa':plan='balanced';scheduleMonth='';commit(D.nextSeason(state,state.teamId,1,true));scrollTop();toast('FA 재수 시작! 1년 뒤 새 성적으로 다시 협상합니다.');break;
        case 'finish':commit(D.nextSeason(state,state.teamId));scrollTop();break;
        case 'change-position':{const selected=document.getElementById('role-select').value;commit(state.role==='batter'?D.changePosition(state,selected):D.changePitchingRole(state,selected));toast('새 역할을 선택했습니다. 출전 전망을 확인하세요.');break;}
        case 'export-legacy':{const v=el.dataset.backupVersion||'1',raw=v==='2'?backupV2:legacyBackup;if(raw){const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='dugout-original-v'+v+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}break;}
        case 'roadmap':roadmap();break;
        case 'save-menu':saveMenu();break;
        case 'guide':guide();break;
        case 'close-dialog':closeDialog();break;
        case 'export':exportSave();break;
        case 'import':closeDialog();document.getElementById('import-file').click();break;
        case 'new':startNew();break;
        case 'confirm-new':state=null;view='home';plan='balanced';try{localStorage.removeItem(SAVE);}catch{}creation.name='';closeDialog();render();scrollTop();break;
      }
    } catch(error){busy=false;toast(error.message||'진행 중 문제가 발생했습니다. 저장 파일을 보관해 주세요.');}
  });
  document.getElementById('import-file').addEventListener('change',async e=>{
    const file=e.target.files[0];e.target.value='';if(!file)return;
    try {if(file.size>2*1024*1024)throw new Error('2MB 이하의 저장 파일을 선택해 주세요.');const raw=await file.text();const parsed=JSON.parse(raw);const incoming=D.validateSave(parsed);if(state&&!window.confirm('현재 커리어를 가져온 파일로 교체할까요? 필요한 기록은 먼저 내보내 주세요.'))return;if(parsed.version<D.VERSION)preserveLegacy(raw);view='home';plan='balanced';commit(incoming);scrollTop();toast('저장된 커리어를 불러왔습니다.');}catch(error){toast('가져오기 실패: '+error.message);}
  });
  document.getElementById('dialog').addEventListener('click', e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
  render();
})();
