'use strict';
const D=require('../dist/core.js');
const keys=D.ATTRS.batter.map(a=>a.key);

// Controlled game-balance experiment, not a prediction of real baseball records.
// Hold ability, fatigue, morale and trust fixed so training and playing time do
// not hide each ability's effect. Rates use actual opportunities, not season caps.
function sample({rating=65,attrs={},seeds=16,leagueId='kbo'}={}){
 const totals={g:0,pa:0,ab:0,h:0,hr:0,bb:0,so:0,sb:0,cs:0,hbp:0,doubles:0,triples:0},seasons=[];
 for(let seed=1;seed<=seeds;seed++){
  let s=D.createCareer({name:'타격 비교',role:'batter',entry:'pro',leagueId,seed});
  for(const key of keys)s.attrs[key]=s.potential.caps[key]=attrs[key]??rating;
  while(s.phase==='active'){
   if(s.pendingEvent){s=D.resolveEvent(s,s.pendingEvent.choices[0].id);continue;}
   for(const key of keys)s.attrs[key]=attrs[key]??rating;
   s.fatigue=10;s.morale=70;s.trust=100;
   s=D.advanceWeek(s,'balanced');
  }
  D.validateSave(s);seasons.push({...s.stats});
  for(const key of Object.keys(totals))totals[key]+=s.stats[key];
 }
 const round=n=>Math.round(n*1000)/1000;
 return {rating,attrs,seeds,leagueId,totals,seasons,
  avg:round(totals.h/totals.ab),hrPerAB:round(totals.hr/totals.ab),bbPerPA:round(totals.bb/totals.pa),soPerAB:round(totals.so/totals.ab),
  sbPerReach:round(totals.sb/(totals.h+totals.bb+totals.hbp-totals.hr)),
  hrPer144Games:round(totals.hr/totals.g*144),sbPer144Games:round(totals.sb/totals.g*144),
  hrRange:[Math.min(...seasons.map(s=>s.hr)),Math.max(...seasons.map(s=>s.hr))],sbRange:[Math.min(...seasons.map(s=>s.sb)),Math.max(...seasons.map(s=>s.sb))]};
}
if(require.main===module){
 const fs=require('node:fs'),path=require('node:path'),rows=[50,70,85,99].map(rating=>sample({rating}));
 const output={policy:'KBO, 16 seeds per tier, abilities capped at the fixed rating, fatigue 10, morale 70, trust 100, balanced plan; 144-game paces normalize appearances and are not guaranteed season totals.',rows};
 if(process.argv[2]){const destination=path.resolve(process.argv[2]);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(output,null,2)+'\n');}
 console.table(rows.map(({rating,avg,hrPer144Games,sbPer144Games,hrRange,sbRange})=>({rating,avg,hrPer144Games,sbPer144Games,hrRange:hrRange.join('–'),sbRange:sbRange.join('–')})));
}
module.exports={sample};
