(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.DugoutPathways=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Names and competition structures: PATHWAYS_RESEARCH.md. Ratings, draws and dates are game models.
  const SCHOOLS={
    kr:{region:'한국 대표 8교 · 권역 대진 압축',names:['덕수고','부산고','인천고','경북고','광주제일고','대전고','유신고','제주고'],source:'https://result.sports.or.kr/BA/'},
    jp:{region:'오사카부 대표 8교 · 예선 압축',names:['오사카 도인','리세이샤','오사카 가이세이학원','긴키대 부속','간사이 소카','나니와','오사카상업대 사카이','우에노미야'],source:'https://www.ohbl.sakura.ne.jp/'},
    us:{region:'캘리포니아 CIF-SS D1 · 본선 16교 중 선택 가능한 8교',names:['St. John Bosco','Oaks Christian','Sierra Canyon','Cypress','Harvard-Westlake','Temecula Valley','Huntington Beach','La Mirada'],source:'https://cifss.org/wp-content/uploads/2026/05/Baseball-Division-1-Bracket-5.26.26.pdf'}
  };
  // The original eight IDs stay stable; expanded careers use game-grouped eight-team regions.
  const BASE_IDS=['hs-seoul','hs-busan','hs-incheon','hs-daegu','hs-gwangju','hs-daejeon','hs-suwon','hs-jeju'];
  const KR_EXTRA=[
    ['서울고','휘문고','장충고','배명고','신일고','충암고','선린인터넷고'],
    ['경남고','부산공업고','개성고','부경고','마산고','김해고','물금고'],
    ['동산고','제물포고','김포과학기술고','소래고','인창고','상동고','충훈고'],
    ['대구고','대구상원고','경주고','포항제철고','도개고','예일메디텍고','대구북구SC'],
    ['광주동성고','광주진흥고','화순고','순천효천고BC','군산상일고','전주고','인상고'],
    ['북일고','세광고','청주고','공주고','천안CSBC','세종BC','전북인공지능고'],
    ['야탑고','라온고','장안고','경기항공고','경민IT고','청담고','세원고'],
    ['강릉고','강원고','원주고','설악고','마산용마고','창원공고야구단','진영고']
  ];
  const JP_EXTRA=['오사카 가쿠게이','긴코 오사카','오사카 산다이 부속','오사카 가쿠인대 고교','다이세이 가쿠인대 고교','세쓰','덴노지','조쇼가쿠엔','에이신가쿠엔','히가시오사카대 가시와라','하나조노','메이세이','오사카 타이이쿠대 나미쇼','한난대 고교','간사이 오쿠라','우에노미야 타이시','오사카 국제','오사카 덴쓰대 고교','도시샤 고리','간다이이치','도카이대 오사카 교세이','사쿠라노미야','고코쿠','오테몬 가쿠인'];
  const US_EXTRA=['Norco','Maranatha','Notre Dame/Sherman Oaks','Ayala','Corona','Etiwanda','Orange Lutheran','Santiago/Corona'];
  const SCHOOL_GROUP_NAMES={kr:['서울','부산·경남','인천·경기','대구·경북','광주·전라','대전·충청','경기','강원·제주·경남'],jp:['오사카 A','오사카 B','오사카 C','오사카 D'],us:['CIF-SS A','CIF-SS B']};
  function schoolIds(country){return BASE_IDS.concat(Array.from({length:country==='kr'?56:country==='jp'?24:8},(_,i)=>'hs-extra-'+i));}
  function schoolGroup(country,id){const ids=schoolIds(country),index=ids.indexOf(id);if(index<0)return [];if(country==='kr'){const g=index<8?index:Math.floor((index-8)/7);return [BASE_IDS[g],...Array.from({length:7},(_,i)=>'hs-extra-'+(g*7+i))];}return ids.slice(Math.floor(index/8)*8,Math.floor(index/8)*8+8);}
  function schoolRegion(country,id){const ids=schoolIds(country),index=ids.indexOf(id),g=country==='kr'?(index<8?index:Math.floor((index-8)/7)):Math.floor(index/8);return SCHOOL_GROUP_NAMES[country]?.[g]||'';}
  function schoolName(country,id){const index=schoolIds(country).indexOf(id);if(index<0)return null;if(index<8)return SCHOOLS[country].names[index];return country==='kr'?KR_EXTRA[Math.floor((index-8)/7)][(index-8)%7]:country==='jp'?JP_EXTRA[index-8]:US_EXTRA[index-8];}
  function expandedCups(country){if(country==='jp')return SCHOOL_CUPS.jp.map(c=>c.id==='osaka'?{...c,dates:['07-04','07-08','07-11','07-15','07-18']}:c);if(country!=='kr')return SCHOOL_CUPS[country];const dates={emart:['03-28','03-31','04-03','04-07','04-11'],golden:['05-02','05-09','05-16','05-23','05-30'],blue:['06-13','06-20','06-27','07-04','07-11'],president:['07-19','07-22','07-25','07-28','08-01'],phoenix:['08-08','08-11','08-15','08-19','08-22']};return SCHOOL_CUPS.kr.map(c=>({...c,dates:dates[c.id]}));}
  const cups=(rows)=>rows.map(([id,name,dates,format,qualifier])=>({id,name,dates,format,qualifier}));
  const NATIONAL_SCHOOLS=['요코하마','지벤 와카야마','센다이 이쿠에이','겐다이 다카사키','하나마키 히가시','고료','오키나와 쇼가쿠','야마나시 가쿠인'].map((name,i)=>({id:'jp-national-'+i,country:'jp',name,strength:48,competition:48})).concat(['Norco','Maranatha','Notre Dame/Sherman Oaks','Ayala','Corona','Etiwanda','Orange Lutheran','Santiago/Corona'].map((name,i)=>({id:'us-national-'+i,country:'us',name,strength:48,competition:48})));
  const SCHOOL_CUPS={
    kr:cups([
      ['emart','신세계 이마트배',['03-28','04-04','04-11'],'knockout','open'],
      ['golden','황금사자기 · 주말리그 왕중왕전',['05-16','05-23','05-30'],'knockout','rank4'],
      ['blue','청룡기 · 주말리그 왕중왕전',['06-27','07-04','07-11'],'knockout','rank4'],
      ['president','대통령배',['07-18','07-25','08-01'],'knockout','rank4'],
      ['phoenix','봉황대기',['08-08','08-15','08-22'],'knockout','open']
    ]),
    jp:cups([
      ['senbatsu','봄 센바쓰 고시엔',['03-19','03-23','03-26','03-29','03-31'],'knockout','selection'],
      ['osaka','여름 고시엔 · 오사카 예선',['07-04','07-11','07-18'],'knockout','open'],
      ['summer','여름 고시엔',['08-05','08-08','08-11','08-14','08-18','08-22'],'knockout','osaka'],
      ['autumn','가을 오사카·긴키대회',['09-19','09-26','10-03','10-10','10-17','10-24'],'knockout','underclass']
    ]),
    us:cups([
      ['cifss','CIF Southern Section Division 1',['05-12','05-15','05-19','05-22','05-26','05-30'],'double-pool','rank4'],
      ['regional','CIF Southern California Regional',['06-02','06-04','06-06'],'knockout','cifss']
    ])
  };
  function league(id,name,country,kind,strength,format,start,days,rounds,names,source){return {id,name,country,kind,strength,format,start,days,rounds,source,clubs:names.map(([key,label])=>({id:id+'-'+key,name:label,leagueId:id,strength,competition:strength}))};}
  const LEAGUES=[
    league('gg','독립야구단 경기도리그','kr','independent',43,'9팀→8팀→4팀 · 16/14/3경기 · 포스트시즌','03-20',[1,5],null,[['yeoncheon','연천 미라클'],['suwon','수원 파인이그스'],['hwaseong','화성 코리요'],['seongnam','성남 맥파이스'],['gapyeong','가평 웨일스'],['goyang','고양 PIC'],['pocheon','포천 몬스터'],['dongducheon','동두천 프리우스'],['ansan','안산 웨이브스']],'https://gnews.gg.go.kr/news/news_detail.do?number=202603200909383796C049&s_code=C049'),
    league('shikoku','시코쿠 아일랜드리그 plus','jp','independent',46,'전·후기와 챔피언십 · 게임 일정 48경기 축약','04-04',[2,3,5,6,0],48,[['tokushima','도쿠시마 인디고삭스'],['kagawa','가가와 올리브가이너스'],['ehime','에히메 만다린파이리츠'],['kochi','고치 파이팅독스']],'https://www.iblj.co.jp/'),
    league('bc','루트인 BC리그','jp','independent',48,'2026 정회원 9구단 · 게임 일정 64경기 축약','04-04',[2,3,5,6,0],72,[['fukushima','후쿠시마 레드홉스'],['ibaraki','이바라키 애스트로플래닛츠'],['chiba','지바 스카이세일러즈'],['tochigi','도치기 골든브레이브스'],['saitama','사이타마 무사시 히트베어스'],['kanagawa','가나가와 퓨처드림스'],['gunma','군마 다이아몬드페가수스'],['yamanashi','야마나시 파이어윈즈'],['shinano','시나노 그랜드세로우즈']],'https://bc-l.jp/teams.php'),
    league('atlantic','Atlantic League','us','independent',58,'2026 참가 10구단 · 126경기 · 전후기 지구 우승 경쟁','04-21',[2,3,4,5,6,0],126,[['hagerstown','Hagerstown Flying Boxcars'],['lancaster','Lancaster Stormers'],['longisland','Long Island Ducks'],['statenisland','Staten Island FerryHawks'],['york','York Revolution'],['charleston','Charleston Dirty Birds'],['gastonia','Gastonia Ghost Peppers'],['highpoint','High Point Rockers'],['lexington','Lexington Legends'],['maryland','Southern Maryland Blue Crabs']],'https://atlanticleague.com/atlantic-league-announces-2026-schedule/'),
    league('american','American Association','us','independent',54,'12구단 · 100경기 · Miles Wolff Cup','05-12',[2,3,4,5,6,0],100,[['chicago','Chicago Dogs'],['cleburne','Cleburne Railroaders'],['fargo','Fargo-Moorhead RedHawks'],['gary','Gary SouthShore RailCats'],['kane','Kane County Cougars'],['kansas','Kansas City Monarchs'],['lake','Lake Country DockHounds'],['lincoln','Lincoln Saltdogs'],['milwaukee','Milwaukee Milkmen'],['siouxcity','Sioux City Explorers'],['siouxfalls','Sioux Falls Canaries'],['winnipeg','Winnipeg Goldeyes']],'https://aabaseball.com/teams/'),
    league('jaba-company','JABA 사회인 · 기업팀','jp','company',57,'지역예선 → 도시대항 / 사회인 일본선수권 · 기업팀 표본','03-07',[6,0],null,[['toyota','도요타자동차'],['toshiba','도시바'],['honda','Honda'],['eneos','ENEOS'],['ntt-east','NTT 동일본'],['jr-east','JR 동일본'],['nippon-life','일본생명'],['yamaha','야마하']],'https://www.jaba.or.jp/2026jaba/'),
    league('jaba-club','JABA 사회인 · 클럽팀','jp','club',40,'지역예선 → 전일본 클럽야구선수권 · 등록 클럽 표본','03-07',[6,0],null,[['rebase','CLUB REBASE'],['abc','全足利クラブ'],['yamato','大和高田クラブ'],['matsuyama','松山フェニックス']],'https://www.jaba.or.jp/2026jaba/')
  ];
  const byId=id=>LEAGUES.find(l=>l.id===id),club=id=>LEAGUES.flatMap(l=>l.clubs).find(c=>c.id===id);
  const dateAt=(date,n)=>new Date(Date.parse(date+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
  function pairs(ids,round){const ring=ids.slice();if(ring.length%2)ring.push(null);for(let i=0;i<round%(ring.length-1);i++)ring.splice(1,0,ring.pop());return Array.from({length:ring.length/2},(_,i)=>[ring[i],ring[ring.length-1-i]]).filter(p=>p.every(Boolean));}
  function schoolSchedule(country,year,ids,expanded=false){
    const start=year+(country==='us'?'-02-01':'-03-01'),end=year+(country==='jp'?'-10-31':country==='us'?'-06-06':'-08-30');
    const dates=[];if(expanded&&country==='kr'){for(const startDate of ['03-07','06-06']){const anchor=year+'-'+startDate,first=dateAt(anchor,-((new Date(anchor+'T12:00:00Z').getUTCDay()+1)%7));for(let i=0;i<7;i++)dates.push(dateAt(first,i*7));}}else for(let d=year+(country==='us'?'-02-07':'-03-21');dates.length<28;d=dateAt(d,1))if([0,6].includes(new Date(d).getUTCDay()))dates.push(d);
    const games=dates.flatMap((date,i)=>pairs(ids,i).map(([home,away])=>({date,home,away,gameNumber:1})));
    return {leagueId:'highschool',year,templateYear:2026,games,gamesPerTeam:dates.length,gamesPerTeamById:Object.fromEntries(ids.map(id=>[id,dates.length])),openingDate:start,endDate:end,sourceMode:'modeled',notes:expanded&&country==='kr'?'실제 학교를 게임용 8개 권역에 배치한 가상 대진 · 전반기 7경기 + 후반기 7경기 · 전국대회 별도':'실제 학교·대회 구조 기반 압축 게임. 지역 경기·연습경기 28경기의 대진은 가상이며 주요 대회 기록은 별도로 집계합니다.'};
  }
  function freeze(o){Object.values(o).forEach(v=>{if(v&&typeof v==='object')freeze(v);});return Object.freeze(o);}
  return freeze({SCHOOLS,SCHOOL_CUPS,NATIONAL_SCHOOLS,LEAGUES,byId,club,dateAt,pairs,schoolSchedule,schoolIds,schoolGroup,schoolRegion,schoolName,expandedCups});
});
