(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DugoutData = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Club names checked against official league directories on 2026-10-14.
  // Strength and competition are fictional game balance values, not real rankings.
  const LEAGUES = Object.freeze([
    Object.freeze({ id: 'highschool', name: '고교', country: '한국', teamCount: 8 }),
    Object.freeze({ id: 'kbo', name: 'KBO', country: '한국', teamCount: 10 }),
    Object.freeze({ id: 'npb', name: 'NPB', country: '일본', teamCount: 12 }),
    Object.freeze({ id: 'mlb', name: 'MLB', country: '미국', teamCount: 30 })
  ]);

  function clubs(leagueId, rows) {
    return rows.map(([id, name, short, color, strength, competition]) => Object.freeze({
      id: leagueId + '-' + id, name, short, color, strength, competition, leagueId
    }));
  }

  const TEAMS = Object.freeze([
    ...[
      ['seoul', '서울 한빛고', '한빛고', '#d5b46c', 44, 40],
      ['busan', '부산 해강고', '해강고', '#58a9df', 42, 38],
      ['incheon', '인천 청해고', '청해고', '#80b7ad', 40, 36],
      ['daegu', '대구 태산고', '태산고', '#e68b72', 43, 39],
      ['gwangju', '광주 무등고', '무등고', '#84b978', 41, 37],
      ['daejeon', '대전 새빛고', '새빛고', '#b59ade', 38, 35],
      ['suwon', '수원 누리고', '누리고', '#dfab6a', 39, 36],
      ['jeju', '제주 바람고', '바람고', '#76c1cf', 37, 34]
    ].map(([id, name, short, color, strength, competition]) => Object.freeze({
      id: 'hs-' + id, name, short, color, strength, competition, leagueId: 'highschool', fictional: true
    })),
    ...clubs('kbo', [
      ['lg', 'LG 트윈스', 'LG', '#dc456a', 68, 66],
      ['doosan', '두산 베어스', '두산', '#8696c9', 61, 58],
      ['ssg', 'SSG 랜더스', 'SSG', '#e65968', 59, 56],
      ['kiwoom', '키움 히어로즈', '키움', '#b57194', 46, 45],
      ['kt', 'KT 위즈', 'KT', '#da6474', 55, 52],
      ['hanwha', '한화 이글스', '한화', '#f39554', 53, 50],
      ['kia', 'KIA 타이거즈', 'KIA', '#ed6b75', 64, 62],
      ['samsung', '삼성 라이온즈', '삼성', '#64a6e4', 60, 57],
      ['lotte', '롯데 자이언츠', '롯데', '#77c1df', 57, 54],
      ['nc', 'NC 다이노스', 'NC', '#c5a66b', 50, 47]
    ]),
    ...clubs('npb', [
      ['yomiuri', '요미우리 자이언츠', '요미우리', '#ed985a', 65, 64],
      ['hanshin', '한신 타이거스', '한신', '#e4cc5c', 67, 65],
      ['dena', '요코하마 DeNA 베이스타스', 'DeNA', '#6aa9e5', 60, 58],
      ['hiroshima', '히로시마 도요 카프', '히로시마', '#e57479', 57, 54],
      ['yakult', '도쿄 야쿠르트 스왈로스', '야쿠르트', '#7ebd87', 52, 50],
      ['chunichi', '주니치 드래건스', '주니치', '#88a8db', 47, 46],
      ['softbank', '후쿠오카 소프트뱅크 호크스', '소프트뱅크', '#e3b752', 70, 68],
      ['nipponham', '홋카이도 닛폰햄 파이터스', '닛폰햄', '#70b0d3', 58, 56],
      ['orix', '오릭스 버펄로스', '오릭스', '#c5b078', 63, 61],
      ['rakuten', '도호쿠 라쿠텐 골든이글스', '라쿠텐', '#c87d97', 54, 51],
      ['seibu', '사이타마 세이부 라이온스', '세이부', '#92a8c5', 49, 47],
      ['lotte', '지바 롯데 마린스', '지바 롯데', '#b8c5d5', 56, 53]
    ]),
    ...clubs('mlb', [
      ['orioles', '볼티모어 오리올스', '볼티모어', '#ec985d', 58, 57],
      ['redsox', '보스턴 레드삭스', '보스턴', '#d97883', 59, 57],
      ['yankees', '뉴욕 양키스', 'NYY', '#8dadd7', 68, 67],
      ['rays', '탬파베이 레이스', '탬파베이', '#89badb', 55, 53],
      ['bluejays', '토론토 블루제이스', '토론토', '#6ba6dc', 60, 58],
      ['whitesox', '시카고 화이트삭스', 'CWS', '#b6c0cd', 46, 45],
      ['guardians', '클리블랜드 가디언스', '클리블랜드', '#d87f8c', 57, 55],
      ['tigers', '디트로이트 타이거스', '디트로이트', '#dfa475', 54, 52],
      ['royals', '캔자스시티 로열스', '캔자스시티', '#7bb0de', 53, 51],
      ['twins', '미네소타 트윈스', '미네소타', '#ad94c4', 56, 54],
      ['athletics', '애슬레틱스', 'ATH', '#81b48b', 48, 46],
      ['astros', '휴스턴 애스트로스', '휴스턴', '#e8a16e', 65, 63],
      ['angels', '로스앤젤레스 에인절스', 'LAA', '#df7881', 51, 49],
      ['mariners', '시애틀 매리너스', '시애틀', '#75bfb9', 61, 59],
      ['rangers', '텍사스 레인저스', '텍사스', '#8b9ed4', 62, 60],
      ['braves', '애틀랜타 브레이브스', '애틀랜타', '#cb8eae', 66, 64],
      ['marlins', '마이애미 말린스', '마이애미', '#75c3d3', 47, 45],
      ['mets', '뉴욕 메츠', 'NYM', '#739fe0', 63, 61],
      ['phillies', '필라델피아 필리스', '필라델피아', '#e88189', 64, 62],
      ['nationals', '워싱턴 내셔널스', '워싱턴', '#d896a1', 50, 48],
      ['cubs', '시카고 컵스', 'CHC', '#84a8e0', 60, 58],
      ['reds', '신시내티 레즈', '신시내티', '#e87d84', 52, 50],
      ['brewers', '밀워키 브루어스', '밀워키', '#d2bc75', 58, 56],
      ['pirates', '피츠버그 파이리츠', '피츠버그', '#dac66c', 49, 47],
      ['cardinals', '세인트루이스 카디널스', '세인트루이스', '#de8c96', 57, 55],
      ['diamondbacks', '애리조나 다이아몬드백스', '애리조나', '#be929b', 59, 57],
      ['rockies', '콜로라도 로키스', '콜로라도', '#ac93cf', 45, 45],
      ['dodgers', '로스앤젤레스 다저스', 'LAD', '#7aa8e8', 70, 69],
      ['padres', '샌디에이고 파드리스', '샌디에이고', '#ccb576', 62, 60],
      ['giants', '샌프란시스코 자이언츠', '샌프란시스코', '#e4a06f', 56, 54]
    ])
  ]);

  const LEGACY_TEAM_MAP = Object.freeze({
    seoul: 'kbo-lg', busan: 'kbo-lotte', incheon: 'kbo-ssg', daegu: 'kbo-samsung',
    gwangju: 'kbo-kia', daejeon: 'kbo-hanwha', suwon: 'kbo-kt', jeju: 'kbo-nc'
  });

  return Object.freeze({ LEAGUES, TEAMS, LEGACY_TEAM_MAP });
});
