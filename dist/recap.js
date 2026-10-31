(function(root,factory){
  'use strict';
  const api=factory(typeof module==='object'&&module.exports?require('./core.js'):root.Dugout);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.DugoutRecap=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(D){
  'use strict';
  const num=n=>Number(n||0).toLocaleString('ko-KR');
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const year=(s,season)=>s.schedule.year+season-s.season;
  const teamName=(s,id)=>{
    const t=D.TEAMS.find(t=>t.id===id);
    return t?.leagueId==='highschool'?D.getSchoolName(id,s.schoolCountry,s.amateur.schoolMode):t?.name||D.PATHWAYS.club(id)?.name||'나의 팀';
  };
  const metrics=(st,role)=>{
    const r=D.rateStats(st,role);
    return role==='batter'?[['안타',num(st.h)],['홈런',num(st.hr)],['타율',r.avg],['도루',num(st.sb)]]:[['승리',num(st.w)],['탈삼진',num(st.so)],['이닝',r.ip],['평균자책점',r.era]];
  };
  function build(s){
    if(s.phase!=='retired')return [];
    const ending=D.getCareerAssessment(s),batter=s.role==='batter',rows=s.seasons.slice().sort((a,b)=>a.season-b.season);
    if(s.week>0&&!rows.some(r=>r.season===s.season))rows.push({season:s.season,age:s.age,teamId:s.teamId,leagueId:s.leagueId,stage:s.freeAgency.active?'unattached':s.stage,stats:s.stats});
    const pro=rows.filter(r=>r.stage!=='unattached'&&['kbo','npb','mlb'].includes(r.leagueId));
    const played=pro.filter(r=>r.stats.g>0),first=rows[0],last=played.at(-1),startYear=year(s,1),endYear=s.schedule.year;
    const cards=[],add=c=>cards.push({lines:[],metrics:[],subtitle:'',footnote:'',...c});
    add({id:'cover',tone:'night',eyebrow:'THE LAST OUT · CAREER RECAP',title:'마지막 아웃 뒤,\n남은 이름.',hero:s.name,heroLabel:ending.title,subtitle:ending.description,lines:[`${startYear} — ${endYear} · ${s.startAge}세부터 ${s.age}세까지`],footnote:'당신이 고른 매주가, 하나의 야구 인생이 되었습니다.'});
    const school=s.startAge===16||first?.stage==='highschool',schoolStats=D.getSchoolCareerStats(s);
    const initialTeam=(s.transfers?.moves||[]).find(m=>m.season===first?.season)?.fromTeamId||first?.teamId||s.teamId;
    add({id:'origin',tone:'paper',eyebrow:'01 · THE FIRST UNIFORM',title:school?'모든 건,\n첫 유니폼에서.':'아무도 몰랐던\n이름 하나.',hero:String(startYear),heroLabel:`${s.startAge}세 · ${teamName(s,initialTeam)}`,subtitle:school?'아직 완성되지 않은 스윙과 공. 그래도 꿈은 이미 야구장보다 컸습니다.':'프로라는 이름 앞에 설렘과 긴장을 함께 품고 섰습니다.',metrics:school?(batter?[['안타',num(schoolStats.h)],['홈런',num(schoolStats.hr)]]:[['탈삼진',num(schoolStats.so)],['이닝',D.rateStats(schoolStats,s.role).ip]]):[],lines:school?[`고교 ${num(schoolStats.g)}경기 · 프로 통산과 별도 기록`]:[batter?'첫 안타를 기다리던 마음을 기억합니다.':'첫 아웃을 기다리던 마음을 기억합니다.']});
    if(played.length){
      const debut=played[0];
      add({id:'debut',tone:'night',eyebrow:'02 · HELLO, PROFESSIONAL',title:'꿈꾸던 무대에,\n내 이름이 불렸다.',hero:String(year(s,debut.season)),heroLabel:`${debut.age}세 · ${debut.leagueId.toUpperCase()}`,subtitle:teamName(s,debut.teamId),metrics:metrics(debut.stats,s.role),footnote:'첫 프로 출전 시즌의 기록입니다.'});
      const score=r=>batter?r.stats.h+r.stats.hr*3+r.stats.sb*.7+r.stats.rbi*.5:r.stats.outs/3+r.stats.so*.5+r.stats.w*5+r.stats.sv*3+r.stats.hld*2-r.stats.er*.7;
      const peak=played.reduce((best,r)=>score(r)>score(best)?r:best);
      add({id:'peak',tone:'gold',eyebrow:'03 · MY GOLDEN SEASON',title:batter?'배트 끝에서,\n계절이 빛났다.':'마운드 위에서,\n계절이 빛났다.',hero:String(year(s,peak.season)),heroLabel:`${peak.age}세 · ${teamName(s,peak.teamId)}`,subtitle:'가장 빛났던 시즌을 한 장에.',metrics:batter?[['안타',num(peak.stats.h)],['홈런',num(peak.stats.hr)],['타점',num(peak.stats.rbi)],['OPS',D.rateStats(peak.stats,s.role).ops]]:metrics(peak.stats,s.role),footnote:'시즌 기록을 바탕으로 고른 커리어 하이라이트.'});
    }
    // A midseason trade keeps season totals together; the uniform timeline also includes its other club.
    const uniforms=[];
    for(const r of pro){
      const moves=(s.transfers?.moves||[]).filter(m=>m.season===r.season).slice().sort((a,b)=>a.week-b.week);
      for(const id of [...moves.flatMap(m=>[m.fromTeamId,m.toTeamId]),r.teamId])if(uniforms.at(-1)!==id)uniforms.push(id);
    }
    const distinct=[...new Set(uniforms)],leagueCount=new Set(played.map(r=>r.leagueId)).size;
    if(distinct.length){
      add({id:'uniforms',tone:'paper',eyebrow:'04 · DIFFERENT COLORS, SAME NAME',title:distinct.length>1?'유니폼은 달라도,\n이름은 하나.':played.length>=5?'오래 입은 유니폼,\n쌓여 간 이름.':'처음 품은 유니폼,\n남겨진 내 이름.',hero:String(distinct.length),heroLabel:'함께한 주요 프로 구단',subtitle:`${leagueCount}개 프로 리그 · 출전한 ${played.length}시즌`,lines:distinct.slice(0,4).map(id=>teamName(s,id)),footnote:distinct.length>4?`그리고 ${distinct.length-4}개 구단에 남긴 발자취.`:'이적 시즌의 개인 기록은 시즌 전체 합계로 기억합니다.'});
    }
    const turningPoints=s.history.filter(h=>/프로 입단|포스팅 이적|해외 진출|트레이드 승인|프로 복귀|새로운 무대|FA 미아/.test(h.title));
    if(turningPoints.length){
      const moments=turningPoints.slice(-4);
      add({id:'moments',tone:'paper',eyebrow:'THE MOMENTS THAT MADE ME',title:'선택의 순간들이\n나를 만들었다.',hero:String(turningPoints.length),heroLabel:'기록에 남은 커리어의 전환점',subtitle:'새로운 도전과 돌아온 기회. 지나온 순간을 다시 펼칩니다.',lines:moments.map(h=>`${year(s,h.season)} · ${h.title}`),footnote:turningPoints.length>4?'최근 전환점 4개 · 전체 내용은 커리어 연표에서 확인하세요.':'실제로 저장된 커리어 기록에서 골랐습니다.'});
    }
    const alternatives=(s.amateur.alternativeHistory||[]).filter(a=>a.results.length),unsigned=rows.filter(r=>r.stage==='unattached');
    if(alternatives.length||unsigned.length){
      const names=[...new Set(alternatives.map(a=>D.PATHWAYS.club(a.teamId)?.name).filter(Boolean))];
      add({id:'comeback',tone:'night',eyebrow:'05 · KEEP THE DREAM ALIVE',title:'끝인 줄 알았던 날,\n다시 공을 들었다.',hero:String(alternatives.reduce((n,a)=>n+a.stats.g,0)),heroLabel:'독립·사회인 무대 출전 경기',subtitle:'계약이 멈춘 날에도, 야구를 향한 마음은 멈추지 않았습니다.',lines:names.length?names.slice(0,3):['무소속 개인훈련으로 다음 기회를 준비했습니다.'],footnote:'독립·사회인 기록은 주요 프로 통산에 합산하지 않습니다.'});
    }
    add({id:'totals',tone:'night',eyebrow:'06 · EVERY GAME COUNTS',title:'하루는 짧았고,\n기록은 쌓였다.',hero:num(s.careerStats.g),heroLabel:'주요 프로 통산 경기',subtitle:played.length?`${played.length}개의 출전 시즌, 그 안의 수많은 선택.`:'프로 기록 밖에서도 당신의 야구는 이어졌습니다.',metrics:metrics(s.careerStats,s.role),footnote:'KBO · NPB · MLB 합계. 고교·독립·사회인 기록은 별도.'});
    const awards=D.careerGoal(s).awards||[];
    if(ending.played.some(l=>l.tier>=3)||awards.length){
      add({id:'legacy',tone:'gold',eyebrow:'07 · A NAME TO REMEMBER',title:'누군가의 기억에,\n남을 이름.',hero:s.name,heroLabel:ending.title,subtitle:ending.description,lines:ending.played.filter(l=>l.stats.g).slice(0,3).map(l=>l.title),footnote:awards.length?`사이영상 ${awards.length}회 · 게임 수상 기준`:'게임 기록에 따른 평가이며 실제 명예의 전당 투표와 다릅니다.'});
    }
    if(s.life.owned.length){
      const owned=s.life.owned.map(o=>({...o,item:D.LIFE_ITEMS.find(i=>i.id===o.id)})).sort((a,b)=>b.price-a.price);
      add({id:'life',tone:'paper',eyebrow:'08 · LIFE OUTSIDE THE LINES',title:'야구 밖에도,\n내 삶이 있었다.',hero:String(owned.length),heroLabel:'내 손으로 마련한 것들',subtitle:'원정에서 돌아올 집, 첫 계약을 기념한 물건. 숫자보다 오래 남을 일상.',lines:owned.slice(0,3).map(o=>o.item.name),footnote:owned.length>3?`그리고 ${owned.length-3}개의 작은 사치와 일상.`:'효과가 아닌, 내 야구 인생의 소장품으로.'});
    }
    if(last){
      add({id:'last-season',tone:'paper',eyebrow:'09 · THE FINAL SEASON',title:'마지막 시즌도,\n나답게 뛰었다.',hero:String(year(s,last.season)),heroLabel:`${last.age}세 · ${teamName(s,last.teamId)}`,subtitle:'마지막으로 주요 프로 경기에 나섰던 계절.',metrics:metrics(last.stats,s.role),footnote:`은퇴는 ${endYear}년, ${s.age}세. 마지막 출전 시즌과 다를 수 있습니다.`});
    }
    add({id:'goodbye',tone:'night',eyebrow:'THANK YOU FOR EVERY INNING',title:'경기는 끝나도,\n이야기는 남는다.',hero:s.name,heroLabel:`${s.age}세 · ${ending.title}`,subtitle:ending.tier>=3?'환호가 잦아든 자리에도, 당신이 남긴 이름은 오래 머뭅니다.':'모든 선수가 전설이 되지는 않습니다. 그래도 이 야구 인생의 주인공은 당신이었습니다.',lines:[`${startYear} — ${endYear}`,batter?`${num(s.careerStats.h)}안타 · ${num(s.careerStats.hr)}홈런`:`${num(s.careerStats.w)}승 · ${num(s.careerStats.so)}탈삼진`],footnote:'이 커리어는 여기, 당신의 더그아웃에 남습니다.'});
    return cards.map((c,i)=>({...c,eyebrow:c.eyebrow.replace(/^\d+ · /,''),index:i,total:cards.length,name:s.name}));
  }
  function palette(card,colors=['#153d32','#e9ce75']){
    return card.tone==='night'?{bg:colors[0],ink:'#fff8e8',accent:colors[1]}:card.tone==='gold'?{bg:'#edcb78',ink:'#243c32',accent:'#8a352a'}:{bg:'#f3eddf',ink:'#243c32',accent:'#9a4432'};
  }
  function html(card,colors){
    const p=palette(card,colors),numeric=/^[\d,]+$/.test(card.hero);
    return `<article class="recap-card recap-${card.tone}" aria-label="${card.index+1} / ${card.total} · ${escape(card.title.replace(/\n/g,' '))}" style="--recap-bg:${p.bg};--recap-ink:${p.ink};--recap-accent:${p.accent}"><div class="recap-field" aria-hidden="true"><i></i><i></i><i></i></div><header class="recap-mast"><span>DUGOUT / MY BASEBALL LIFE</span><span>${String(card.index+1).padStart(2,'0')}</span></header><div class="recap-copy"><p class="recap-kicker">${escape(card.eyebrow)}</p><h3>${escape(card.title).replace(/\n/g,'<br>')}</h3><p class="recap-subtitle">${escape(card.subtitle)}</p><div class="recap-hero ${numeric?'recap-number':''}">${escape(card.hero)}</div><p class="recap-hero-label">${escape(card.heroLabel)}</p>${card.metrics.length?`<dl class="recap-metrics">${card.metrics.map(([label,value])=>`<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>`:''}${card.lines.length?`<div class="recap-lines">${card.lines.map(line=>`<p>${escape(line)}</p>`).join('')}</div>`:''}</div><footer class="recap-card-footer"><p>${escape(card.footnote)}</p><span>${escape(card.name)} · CAREER ARCHIVE</span></footer></article>`;
  }
  // Plain SVG text, no foreignObject or remote assets: safe to turn into a local PNG.
  function wrap(text,limit,maxLines=4){
    const lines=[];let line='',size=0;
    for(const c of String(text)){const w=/[\x00-\x7f]/.test(c)?.55:1;if(c==='\n'||size+w>limit){lines.push(line);line='';size=0;if(c==='\n')continue;}line+=c;size+=w;}
    if(line)lines.push(line);
    return lines.slice(0,maxLines).map((v,i)=>i===maxLines-1&&lines.length>maxLines?v.slice(0,-1)+'…':v);
  }
  function svg(card,colors){
    const p=palette(card,colors),numeric=/^[\d,]+$/.test(card.hero),parts=[];
    const text=(value,x,y,size,color=p.ink,weight=400)=>parts.push(`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}">${escape(value)}</text>`);
    const lines=(value,y,size,limit,max,color=p.ink,weight=400)=>wrap(value,limit,max).forEach((v,i)=>text(v,86,y+i*size*1.35,size,color,weight));
    text('DUGOUT / MY BASEBALL LIFE',86,108,28);text(String(card.index+1).padStart(2,'0')+' / '+card.total,864,108,28);
    parts.push(`<path d="M86 152H994" stroke="${p.ink}" opacity=".25"/>`);
    lines(card.eyebrow,233,28,50,1,p.accent,700);lines(card.title,360,76,12,3,p.ink,700);
    lines(card.subtitle,638,34,25,3);
    lines(card.hero,923,numeric?170:88,numeric?9:10,2,p.accent,700);lines(card.heroLabel,1130,32,26,2,p.ink,700);
    card.metrics.forEach(([label,value],i)=>{const x=86+i%2*470,y=1270+Math.floor(i/2)*155;text(label,x,y,29);text(value,x,y+72,60,p.ink,700);});
    card.lines.slice(0,4).forEach((v,i)=>lines(v,card.metrics.length?1630+i*48:1290+i*85,card.metrics.length?29:40,card.metrics.length?28:21,1));
    lines(card.footnote,1780,26,32,2);text(card.name+' · CAREER ARCHIVE',86,1880,25);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><rect width="1080" height="1920" fill="${p.bg}"/><g fill="none" stroke="${p.accent}" opacity=".09" stroke-width="3"><circle cx="1050" cy="1300" r="500"/><circle cx="1050" cy="1300" r="650"/><path d="M540 1630 920 1250 540 870 160 1250Z"/></g><g font-family="'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif">${parts.join('')}</g></svg>`;
  }
  return Object.freeze({build,html,svg,palette});
});
