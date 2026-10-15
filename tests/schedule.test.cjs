'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const data=require('../dist/league-data.js');
const schedules=require('../dist/schedule-data.js');

test('Schedule_AllLeaguesAndFutureYears_ConserveGamesIncludingOddNPBSeason',()=>{
  for(const year of [2026,2027,2028,2050]){
    for(const [leagueId,perTeam] of [['highschool',28],['kbo',144],['npb',143],['mlb',162]]){
      const expected=data.TEAMS.filter(t=>t.leagueId===leagueId).map(t=>t.id);
      const calendar=schedules.createSchedule(leagueId,year);
      assert.equal(calendar.gamesPerTeam,perTeam);
      const canceledMlb=leagueId==='mlb'&&year===2026;
      assert.equal(calendar.games.length,expected.length*perTeam/2-(canceledMlb?1:0));
      const counts=Object.fromEntries(expected.map(id=>[id,0]));
      const daily=new Map(), identities=new Set();
      for(const game of calendar.games){
        assert.ok(expected.includes(game.home)&&expected.includes(game.away));
        assert.notEqual(game.home,game.away);
        assert.equal(new Date(game.date+'T00:00:00Z').toISOString().slice(0,10),game.date);
        assert.equal(Number(game.date.slice(0,4)),year);
        const identity=[game.date,game.home,game.away,game.gameNumber].join('/');
        assert.ok(!identities.has(identity),'duplicate game '+identity);
        identities.add(identity);
        for(const team of [game.home,game.away]){
          counts[team]++;
          const key=game.date+'/'+team;
          daily.set(key,(daily.get(key)||0)+1);
          assert.ok(daily.get(key)<=2,'team scheduled for more than doubleheader '+key);
        }
      }
      for(const [id,count] of Object.entries(counts))assert.equal(count,perTeam-(canceledMlb&&['mlb-yankees','mlb-orioles'].includes(id)?1:0),id);
      assert.equal(calendar.openingDate,calendar.games[0].date);
      assert.equal(calendar.endDate,calendar.games.at(-1).date);
      assert.deepEqual(calendar,schedules.createSchedule(leagueId,year));
      if(year!==2026&&leagueId!=='highschool')assert.equal(calendar.sourceMode,'modeled');
      if(leagueId==='highschool')assert.equal(calendar.sourceMode,'fictional');
    }
  }
});

test('Schedule_ActualMLB2026_AccountsForCancellationAndSuspendedGameOnce',()=>{
  const calendar=schedules.createSchedule('mlb',2026);
  assert.equal(calendar.sourceMode,'official-adapted');
  assert.equal(calendar.games.length,2429);
  assert.equal(calendar.gamesPerTeamById['mlb-yankees'],161);
  assert.equal(calendar.gamesPerTeamById['mlb-orioles'],161);
  assert.equal(calendar.games.filter(g=>g.date==='2026-09-27'&&g.home==='mlb-yankees'&&g.away==='mlb-orioles').length,0);
  for(const date of ['2026-06-16','2026-06-17'])assert.equal(calendar.games.filter(g=>g.date===date&&g.home==='mlb-braves'&&g.away==='mlb-giants').length,1);
});

test('Schedule_2026KBOAndNPB_UseOfficialCalendarAndNumberEveryGame',()=>{
  for(const leagueId of ['kbo','npb']){
    const schedule=schedules.createSchedule(leagueId,2026);
    assert.equal(schedule.sourceMode,'official');
    assert.ok(schedule.games.every(g=>Number.isInteger(g.gameNumber)&&g.gameNumber>=1&&g.gameNumber<=2));
  }
});

test('Schedule_InvalidLeagueYearAndParticipantSet_Reject',()=>{
  for(const args of [['other',2026],['kbo',2026.5],['kbo',1800],['npb',2201],['kbo',2026,[]]])assert.throws(()=>schedules.createSchedule(...args));
  const kbo=data.TEAMS.filter(t=>t.leagueId==='kbo').map(t=>t.id);
  assert.throws(()=>schedules.createSchedule('kbo',2026,kbo.slice(0,8)));
  const repeated=kbo.slice();repeated[1]=repeated[0];
  assert.throws(()=>schedules.createSchedule('kbo',2026,repeated));
});
