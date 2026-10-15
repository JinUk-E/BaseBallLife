(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./league-data.js'));
  else root.DugoutScheduleData = factory(root.DugoutData);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Data) {
  'use strict';
  // Date/home/away facts only. Sources and extraction details: ../SCHEDULE_SOURCES.md.
  const KBO_2026 = `03-28 ssg:kia,lg:kt,samsung:lotte,nc:doosan,hanwha:kiwoom
03-29 ssg:kia,lg:kt,samsung:lotte,nc:doosan,hanwha:kiwoom
03-31 lg:kia,hanwha:kt,nc:lotte,samsung:doosan,ssg:kiwoom
04-01 lg:kia,hanwha:kt,nc:lotte,samsung:doosan,ssg:kiwoom
04-02 lg:kia,hanwha:kt,nc:lotte,samsung:doosan,ssg:kiwoom
04-03 doosan:hanwha,kiwoom:lg,kia:nc,lotte:ssg,kt:samsung
04-04 doosan:hanwha,kiwoom:lg,kia:nc,lotte:ssg,kt:samsung
04-05 doosan:hanwha,kiwoom:lg,kia:nc,lotte:ssg,kt:samsung
04-07 ssg:hanwha,lotte:kt,nc:lg,kia:samsung,doosan:kiwoom
04-08 ssg:hanwha,lotte:kt,nc:lg,kia:samsung,doosan:kiwoom
04-10 hanwha:kia,kiwoom:lotte,samsung:nc,kt:doosan,lg:ssg
04-11 hanwha:kia,kiwoom:lotte,samsung:nc,kt:doosan,lg:ssg
04-12 hanwha:kia,kiwoom:lotte,samsung:nc,kt:doosan,lg:ssg
04-14 nc:kt,lg:lotte,ssg:doosan,hanwha:samsung,kia:kiwoom
04-15 nc:kt,lg:lotte,ssg:doosan,hanwha:samsung,kia:kiwoom
04-16 nc:kt,lg:lotte,ssg:doosan,hanwha:samsung,kia:kiwoom
04-17 doosan:kia,kt:kiwoom
04-18 lotte:hanwha,doosan:kia,samsung:lg,nc:ssg,kt:kiwoom
04-19 lotte:hanwha,doosan:kia,samsung:lg,nc:ssg,kt:kiwoom
04-21 lg:hanwha,kt:kia,kiwoom:nc,lotte:doosan,samsung:ssg
04-22 lg:hanwha,kt:kia,kiwoom:nc,lotte:doosan,samsung:ssg
04-23 lg:hanwha,kt:kia,kiwoom:nc,lotte:doosan,samsung:ssg
04-24 ssg:kt,doosan:lg,kia:lotte,hanwha:nc,kiwoom:samsung
04-25 ssg:kt,doosan:lg,kia:lotte,hanwha:nc,kiwoom:samsung
04-26 ssg:kt,doosan:lg,kia:lotte,hanwha:nc,kiwoom:samsung
04-28 nc:kia,kt:lg,hanwha:ssg,doosan:samsung,lotte:kiwoom
04-29 nc:kia,kt:lg,hanwha:ssg,doosan:samsung,lotte:kiwoom
04-30 nc:kia,kt:lg,hanwha:ssg,doosan:samsung,lotte:kiwoom
05-01 samsung:hanwha,kia:kt,ssg:lotte,lg:nc,kiwoom:doosan
05-02 samsung:hanwha,kia:kt,ssg:lotte,lg:nc,kiwoom:doosan
05-03 samsung:hanwha,kia:kt,ssg:lotte,lg:nc,kiwoom:doosan
05-05 kia:hanwha,kt:lotte,ssg:nc,lg:doosan,samsung:kiwoom
05-06 kia:hanwha,kt:lotte,ssg:nc,lg:doosan,samsung:kiwoom
05-07 kia:hanwha,ssg:nc,lg:doosan,samsung:kiwoom
05-08 lotte:kia,kiwoom:kt,hanwha:lg,doosan:ssg,nc:samsung
05-09 lotte:kia,kiwoom:kt,hanwha:lg,doosan:ssg,nc:samsung
05-10 lotte:kia,kiwoom:kt,hanwha:lg,doosan:ssg,nc:samsung
05-12 kiwoom:hanwha,lotte:nc,kia:doosan,kt:ssg,lg:samsung
05-13 kiwoom:hanwha,lotte:nc,kia:doosan,kt:ssg,lg:samsung
05-14 kiwoom:hanwha,lotte:nc,kia:doosan,kt:ssg,lg:samsung
05-15 kt:hanwha,samsung:kia,ssg:lg,doosan:lotte,nc:kiwoom
05-16 kt:hanwha,samsung:kia,ssg:lg,doosan:lotte,nc:kiwoom
05-17 kt:hanwha,samsung:kia,ssg:lg,doosan:lotte,nc:kiwoom
05-19 samsung:kt,kia:lg,hanwha:lotte,doosan:nc,kiwoom:ssg
05-20 kiwoom:ssg
05-21 samsung:kt,kia:lg,hanwha:lotte,doosan:nc,kiwoom:ssg
05-22 kt:nc,hanwha:doosan,kia:ssg,lotte:samsung,lg:kiwoom
05-23 kt:nc,hanwha:doosan,kia:ssg,lotte:samsung,lg:kiwoom
05-24 kt:nc,hanwha:doosan,kia:ssg,lotte:samsung,lg:kiwoom
05-26 kiwoom:kia,doosan:kt,lotte:lg
05-27 nc:hanwha,kiwoom:kia,doosan:kt,lotte:lg,ssg:samsung
05-28 nc:hanwha,kiwoom:kia,doosan:kt,lotte:lg,ssg:samsung
05-29 lg:kia,kiwoom:kt,nc:lotte,samsung:doosan,hanwha:ssg
05-30 lg:kia,kiwoom:kt,nc:lotte,samsung:doosan,hanwha:ssg
05-31 lg:kia,kiwoom:kt,nc:lotte,samsung:doosan,hanwha:ssg
06-02 doosan:hanwha,kt:lg,kia:lotte,samsung:nc,ssg:kiwoom
06-03 doosan:hanwha,kt:lg,kia:lotte,samsung:nc,ssg:kiwoom
06-04 doosan:hanwha,kt:lg,kia:lotte,samsung:nc,ssg:kiwoom
06-05 lotte:hanwha,ssg:kt,nc:lg,kia:samsung,doosan:kiwoom
06-06 lotte:hanwha,ssg:kt,nc:lg,kia:samsung,doosan:kiwoom
06-07 lotte:hanwha,ssg:kt,nc:lg,kia:samsung,doosan:kiwoom
06-09 hanwha:kia,kiwoom:nc,lotte:doosan,lg:ssg,kt:samsung
06-10 hanwha:kia,kiwoom:nc,lotte:doosan,lg:ssg,kt:samsung
06-11 hanwha:kia,kiwoom:nc,lotte:doosan,lg:ssg,kt:samsung
06-12 kiwoom:hanwha,lg:lotte,kt:nc,kia:doosan,samsung:ssg
06-13 kiwoom:hanwha,lg:lotte,kt:nc,kia:doosan,samsung:ssg
06-14 kiwoom:hanwha,lg:lotte,kia:doosan,samsung:ssg
06-16 nc:hanwha,doosan:kt,kia:lg,ssg:lotte,samsung:kiwoom
06-17 nc:hanwha,doosan:kt,kia:lg,ssg:lotte,samsung:kiwoom
06-18 nc:hanwha,doosan:kt,kia:lg,ssg:lotte,samsung:kiwoom
06-19 kt:kia,kiwoom:lotte,lg:doosan,nc:ssg,hanwha:samsung
06-20 kt:kia,kiwoom:lotte,lg:doosan,nc:ssg,hanwha:samsung
06-21 kt:kia,kiwoom:lotte,lg:doosan,nc:ssg,hanwha:samsung
06-23 kiwoom:kia,lotte:nc,hanwha:doosan,kt:ssg,lg:samsung
06-24 kiwoom:kia,lotte:nc,hanwha:doosan,kt:ssg,lg:samsung
06-25 kiwoom:kia,lotte:nc,hanwha:doosan,kt:ssg,lg:samsung
06-26 ssg:hanwha,doosan:kia,samsung:kt,lotte:lg,nc:kiwoom
06-27 ssg:hanwha,doosan:kia,samsung:kt,lotte:lg,nc:kiwoom
06-28 ssg:hanwha,doosan:kia,samsung:kt,lotte:lg,nc:kiwoom
06-30 kiwoom:lg,doosan:lotte,kia:ssg,nc:samsung
07-01 hanwha:kt,kiwoom:lg,doosan:lotte,kia:ssg,nc:samsung
07-02 hanwha:kt,kiwoom:lg,doosan:lotte,kia:ssg,nc:samsung
07-03 lg:hanwha,kt:lotte,kia:nc,kiwoom:doosan,ssg:samsung
07-04 lg:hanwha,kt:lotte,kia:nc,kiwoom:doosan,ssg:samsung
07-05 kt:lotte,kiwoom:doosan,ssg:samsung
07-07 lotte:kia,samsung:lg,hanwha:nc,doosan:ssg,kt:kiwoom
07-08 lotte:kia,samsung:lg,doosan:ssg,kt:kiwoom
07-09 lotte:kia,samsung:lg,hanwha:nc,doosan:ssg
07-16 ssg:kia,lg:kt,samsung:lotte,nc:doosan,hanwha:kiwoom
07-17 ssg:kia,lg:kt,nc:doosan,hanwha:kiwoom
07-18 ssg:kia,lg:kt,samsung:lotte,nc:doosan,hanwha:kiwoom
07-19 ssg:kia,lg:kt,samsung:lotte,nc:doosan,hanwha:kiwoom
07-21 kia:hanwha,lg:nc,kt:doosan,lotte:ssg,kiwoom:samsung
07-22 kia:hanwha,lotte:ssg,kiwoom:samsung
07-23 kia:hanwha,lg:nc,lotte:ssg,kiwoom:samsung
07-24 lotte:kt,hanwha:lg,ssg:nc,doosan:samsung,kia:kiwoom
07-25 lotte:kt,hanwha:lg,ssg:nc,doosan:samsung,kia:kiwoom
07-26 lotte:kt,hanwha:lg,ssg:nc,doosan:samsung,kia:kiwoom
07-28 samsung:kia,nc:kt,hanwha:lotte,ssg:doosan,lg:kiwoom
07-29 samsung:kia,nc:kt,hanwha:lotte,ssg:doosan,lg:kiwoom
07-30 samsung:kia,nc:kt,hanwha:lotte,ssg:doosan,lg:kiwoom
07-31 kt:hanwha,nc:kia,doosan:lg,kiwoom:ssg,lotte:samsung
08-01 kt:hanwha,doosan:lg,kiwoom:ssg
08-02 kt:hanwha,doosan:lg,kiwoom:ssg,lotte:samsung
08-04 samsung:hanwha,ssg:lg,lotte:kiwoom
08-11 doosan:hanwha,nc:kt,kiwoom:lg,ssg:lotte,kia:samsung
08-12 doosan:hanwha,nc:kt,kiwoom:lg,ssg:lotte,kia:samsung
08-13 doosan:hanwha,nc:kt,kiwoom:lg,ssg:lotte,kia:samsung
08-14 samsung:hanwha,lotte:nc,kia:doosan,lg:ssg,kt:kiwoom
08-15 samsung:hanwha,lotte:nc,kia:doosan,lg:ssg,kt:kiwoom
08-16 kia:doosan,lg:ssg,kt:kiwoom
08-18 hanwha:kia,lg:kt,nc:doosan,samsung:ssg,lotte:kiwoom
08-19 hanwha:kia,lg:kt,nc:doosan,samsung:ssg,lotte:kiwoom
08-20 hanwha:kia,lg:kt,nc:doosan,samsung:ssg,lotte:kiwoom
08-21 kiwoom:kia,ssg:kt,hanwha:lg,doosan:lotte,nc:samsung
08-22 kiwoom:kia,nc:samsung
08-23 kiwoom:kia,ssg:kt,hanwha:lg,doosan:lotte,nc:samsung
08-25 ssg:hanwha,kia:lotte,lg:nc,kt:doosan,kiwoom:samsung
08-26 ssg:hanwha,kia:lotte,lg:nc,kt:doosan,kiwoom:samsung
08-27 ssg:hanwha,lg:nc,kt:doosan,kiwoom:samsung
08-29 samsung:kt,lotte:lg,hanwha:nc,kia:ssg,doosan:kiwoom
08-30 hanwha:nc,doosan:kiwoom
09-01 kt:hanwha,nc:kia,doosan:lg,samsung:lotte,kiwoom:ssg
09-02 kt:hanwha,nc:kia,doosan:lg,samsung:lotte,kiwoom:ssg
09-03 kt:hanwha,doosan:lg,samsung:lotte,kiwoom:ssg
09-04 lotte:hanwha,kia:kt,kiwoom:nc,ssg:doosan,lg:samsung
09-05 lotte:hanwha,kia:kt,kiwoom:nc,ssg:doosan,lg:samsung
09-06 lotte:hanwha,kia:kt,kiwoom:nc,ssg:doosan,lg:samsung
09-08 samsung:kia,nc:lotte,hanwha:doosan,kt:ssg,lg:kiwoom
09-09 samsung:kt,hanwha:lg,kia:nc,doosan:ssg
09-10 ssg:hanwha,lotte:kt,kia:nc,doosan:kiwoom
09-11 lotte:kt,hanwha:nc,kia:ssg,samsung:kiwoom
09-12 kt:kia,samsung:lg,kiwoom:lotte,doosan:nc
09-13 kia:hanwha,samsung:lg,kt:lotte,doosan:nc
09-15 ssg:kia,hanwha:kt,nc:lg,samsung:lotte
09-16 hanwha:kt,nc:lg,lotte:ssg,doosan:samsung
09-17 nc:ssg,kia:kiwoom
09-18 kt:lg,lotte:nc,hanwha:samsung,doosan:kiwoom
09-19 lg:hanwha,nc:kia,kt:doosan,lotte:samsung
09-20 lg:hanwha,nc:kia,kt:doosan,lotte:samsung,ssg:kiwoom
09-22 ssg:kt,hanwha:lotte,samsung:nc,kiwoom:doosan
09-23 doosan:kia,hanwha:lotte,kt:nc
09-24 lg:lotte,kt:nc,ssg:samsung
09-25 nc:hanwha
09-26 nc:hanwha,kia:lg,kt:kiwoom
09-27 lotte:hanwha,doosan:kt,nc:kiwoom
09-29 samsung:hanwha,kia:kt,ssg:lg,doosan:nc,lotte:kiwoom
09-30 samsung:hanwha,kia:kt,ssg:lg,doosan:nc,lotte:kiwoom
10-01 samsung:hanwha,kia:kt,ssg:lg,doosan:nc
10-03 lg:kia,kt:lotte,samsung:doosan,nc:ssg,hanwha:kiwoom
10-04 lg:kia,kt:lotte,samsung:doosan,nc:ssg,hanwha:kiwoom
10-05 lg:kia,kt:lotte,samsung:doosan,nc:ssg,hanwha:kiwoom
10-06 kiwoom:kt,lg:nc,lotte:doosan,hanwha:ssg,kia:samsung
10-07 kiwoom:hanwha,lotte:kia,ssg:nc,lg:doosan,kt:samsung
10-09 nc:kia,lotte:lg,ssg:samsung
10-10 lotte:lg,hanwha:nc,kia:ssg
10-11 samsung:kt,kia:lotte
10-12 samsung:kt,kia:lg,doosan:lotte`;
  const NPB_2026 = `03-27 yomiuri:hanshin,dena:yakult,hiroshima:chunichi,lotte:seibu,orix:rakuten,softbank:nipponham
03-28 yomiuri:hanshin,dena:yakult,hiroshima:chunichi,lotte:seibu,orix:rakuten,softbank:nipponham
03-29 yomiuri:hanshin,dena:yakult,hiroshima:chunichi,lotte:seibu,orix:rakuten,softbank:nipponham
03-31 yakult:hiroshima,chunichi:yomiuri,hanshin:dena,nipponham:lotte,rakuten:softbank,seibu:orix
04-01 chunichi:yomiuri,hanshin:dena,nipponham:lotte,rakuten:softbank,seibu:orix
04-02 yakult:hiroshima,chunichi:yomiuri,hanshin:dena,nipponham:lotte,rakuten:softbank,seibu:orix
04-03 yomiuri:dena,yakult:chunichi,hiroshima:hanshin,nipponham:orix,seibu:rakuten,lotte:softbank
04-04 yomiuri:dena,yakult:chunichi,hiroshima:hanshin,nipponham:orix,seibu:rakuten,lotte:softbank
04-05 yomiuri:dena,yakult:chunichi,hiroshima:hanshin,nipponham:orix,seibu:rakuten,lotte:softbank
04-07 dena:chunichi,hanshin:yakult,hiroshima:yomiuri,rakuten:nipponham,orix:lotte,softbank:seibu
04-08 dena:chunichi,hanshin:yakult,hiroshima:yomiuri,rakuten:nipponham,orix:lotte,softbank:seibu
04-09 hanshin:yakult,rakuten:nipponham,orix:lotte,softbank:seibu
04-10 yomiuri:yakult,chunichi:hanshin,seibu:lotte
04-11 yomiuri:yakult,dena:hiroshima,chunichi:hanshin,nipponham:softbank,rakuten:orix,seibu:lotte
04-12 yomiuri:yakult,dena:hiroshima,chunichi:hanshin,nipponham:softbank,rakuten:orix,seibu:lotte
04-14 yakult:dena,chunichi:hiroshima,hanshin:yomiuri,lotte:nipponham,orix:seibu,softbank:rakuten
04-15 chunichi:hiroshima,lotte:nipponham,orix:seibu,softbank:rakuten
04-16 yakult:dena,hanshin:yomiuri,lotte:nipponham,orix:seibu,softbank:rakuten
04-17 yakult:yomiuri,hanshin:chunichi,hiroshima:dena,nipponham:seibu,rakuten:lotte,softbank:orix
04-18 yakult:yomiuri,hanshin:chunichi,hiroshima:dena,nipponham:seibu,rakuten:lotte,softbank:orix
04-19 yakult:yomiuri,hanshin:chunichi,hiroshima:dena,nipponham:seibu,rakuten:lotte,softbank:orix
04-21 yomiuri:chunichi,dena:hanshin,hiroshima:yakult,nipponham:rakuten,seibu:softbank,lotte:orix
04-22 yomiuri:chunichi,dena:hanshin,hiroshima:yakult,nipponham:rakuten,seibu:softbank,lotte:orix
04-23 hiroshima:yakult,nipponham:rakuten,seibu:softbank
04-24 dena:yomiuri,chunichi:yakult,orix:nipponham
04-25 dena:yomiuri,chunichi:yakult,hanshin:hiroshima,rakuten:seibu,orix:nipponham,softbank:lotte
04-26 dena:yomiuri,chunichi:yakult,hanshin:hiroshima,rakuten:seibu,orix:nipponham
04-28 yomiuri:hiroshima,yakult:hanshin,chunichi:dena,seibu:nipponham,lotte:rakuten,orix:softbank
04-29 yomiuri:hiroshima,yakult:hanshin,chunichi:dena,seibu:nipponham,lotte:rakuten,orix:softbank
04-30 yomiuri:hiroshima,yakult:hanshin,chunichi:dena,seibu:nipponham
05-01 yakult:dena,hanshin:yomiuri,hiroshima:chunichi,nipponham:orix,lotte:seibu,softbank:rakuten
05-02 yakult:dena,hanshin:yomiuri,hiroshima:chunichi,nipponham:orix,lotte:seibu,softbank:rakuten
05-03 yakult:dena,hanshin:yomiuri,nipponham:orix,lotte:seibu,softbank:rakuten
05-04 yomiuri:yakult,dena:hiroshima,chunichi:hanshin,rakuten:nipponham,seibu:softbank,orix:lotte
05-05 yomiuri:yakult,dena:hiroshima,chunichi:hanshin,rakuten:nipponham,seibu:softbank,orix:lotte
05-06 yomiuri:yakult,dena:hiroshima,chunichi:hanshin,rakuten:nipponham,seibu:softbank,orix:lotte
05-08 chunichi:yomiuri,hanshin:dena,hiroshima:yakult,seibu:rakuten,orix:nipponham,softbank:lotte
05-09 chunichi:yomiuri,hanshin:dena,hiroshima:yakult,seibu:rakuten,orix:nipponham,softbank:lotte
05-10 chunichi:yomiuri,hanshin:dena,hiroshima:yakult,seibu:rakuten,orix:nipponham,softbank:lotte
05-12 yomiuri:hiroshima,yakult:hanshin,dena:chunichi,rakuten:orix,lotte:nipponham,softbank:seibu
05-13 yomiuri:hiroshima,yakult:hanshin,dena:chunichi,lotte:nipponham,softbank:seibu
05-14 dena:chunichi,rakuten:orix,lotte:nipponham
05-15 yomiuri:dena,chunichi:yakult,hanshin:hiroshima,nipponham:seibu,rakuten:softbank,lotte:orix
05-16 yomiuri:dena,chunichi:yakult,hanshin:hiroshima,nipponham:seibu,rakuten:softbank,lotte:orix
05-17 yomiuri:dena,chunichi:yakult,hanshin:hiroshima,nipponham:seibu,rakuten:softbank,lotte:orix
05-19 yakult:yomiuri,hanshin:chunichi,hiroshima:dena,nipponham:rakuten,seibu:lotte,orix:softbank
05-20 hanshin:chunichi,hiroshima:dena,nipponham:rakuten,seibu:lotte,orix:softbank
05-21 yakult:yomiuri,hiroshima:dena
05-22 yomiuri:hanshin,chunichi:hiroshima,rakuten:lotte,seibu:orix,softbank:nipponham
05-23 yomiuri:hanshin,dena:yakult,chunichi:hiroshima,rakuten:lotte,seibu:orix,softbank:nipponham
05-24 yomiuri:hanshin,dena:yakult,chunichi:hiroshima,rakuten:lotte,seibu:orix,softbank:nipponham
05-26 yomiuri:softbank,yakult:seibu,dena:orix,chunichi:rakuten,hanshin:nipponham,hiroshima:lotte
05-27 yomiuri:softbank,yakult:seibu,dena:orix,chunichi:rakuten,hanshin:nipponham,hiroshima:lotte
05-28 yomiuri:softbank,yakult:seibu,dena:orix,chunichi:rakuten,hanshin:nipponham,hiroshima:lotte
05-29 nipponham:yomiuri,rakuten:yakult,seibu:dena,lotte:hanshin,orix:chunichi,softbank:hiroshima
05-30 nipponham:yomiuri,rakuten:yakult,seibu:dena,lotte:hanshin,orix:chunichi,softbank:hiroshima
05-31 nipponham:yomiuri,rakuten:yakult,seibu:dena,lotte:hanshin,orix:chunichi,softbank:hiroshima
06-02 yomiuri:orix,yakult:lotte,dena:rakuten,chunichi:softbank
06-03 yomiuri:orix,yakult:lotte,dena:rakuten,chunichi:softbank,hanshin:seibu,hiroshima:nipponham
06-04 yomiuri:orix,yakult:lotte,dena:rakuten,chunichi:softbank,hanshin:seibu,hiroshima:nipponham
06-05 yomiuri:lotte,yakult:nipponham,dena:softbank,chunichi:seibu,hanshin:rakuten,hiroshima:orix
06-06 yomiuri:lotte,yakult:nipponham,dena:softbank,chunichi:seibu,hanshin:rakuten,hiroshima:orix
06-07 yomiuri:lotte,yakult:nipponham,dena:softbank,chunichi:seibu,hiroshima:orix
06-09 nipponham:dena,rakuten:yomiuri,seibu:hiroshima,lotte:chunichi,orix:yakult,softbank:hanshin
06-10 nipponham:dena,rakuten:yomiuri,seibu:hiroshima,lotte:chunichi,orix:yakult,softbank:hanshin
06-11 nipponham:dena,rakuten:yomiuri,seibu:hiroshima,lotte:chunichi,orix:yakult,softbank:hanshin
06-12 nipponham:chunichi,rakuten:hiroshima,seibu:yomiuri,lotte:dena,orix:hanshin,softbank:yakult
06-13 nipponham:chunichi,rakuten:hiroshima,seibu:yomiuri,lotte:dena,orix:hanshin,softbank:yakult
06-14 nipponham:chunichi,rakuten:hiroshima,seibu:yomiuri,lotte:dena,orix:hanshin,softbank:yakult
06-16 hanshin:seibu,hiroshima:nipponham
06-17 hanshin:rakuten
06-19 yomiuri:chunichi,yakult:hiroshima,dena:hanshin,nipponham:softbank,lotte:rakuten,orix:seibu
06-20 yomiuri:chunichi,yakult:hiroshima,nipponham:softbank,orix:seibu
06-21 yomiuri:chunichi,yakult:hiroshima,dena:hanshin,nipponham:softbank,lotte:rakuten,orix:seibu
06-22 rakuten:seibu
06-23 chunichi:dena,hanshin:yakult,hiroshima:yomiuri,nipponham:lotte,rakuten:seibu,softbank:orix
06-24 chunichi:dena,nipponham:lotte,softbank:orix
06-25 chunichi:dena,rakuten:seibu,softbank:orix
06-26 seibu:nipponham
06-27 hiroshima:hanshin,seibu:nipponham,orix:rakuten
06-28 yakult:chunichi,dena:yomiuri,hiroshima:hanshin,seibu:nipponham,lotte:softbank,orix:rakuten
06-30 yomiuri:yakult,dena:hiroshima,hanshin:chunichi,nipponham:orix,rakuten:lotte,softbank:seibu
07-01 yomiuri:yakult,nipponham:orix,rakuten:lotte,softbank:seibu
07-02 dena:hiroshima,hanshin:chunichi,nipponham:orix,softbank:seibu
07-03 yakult:dena,chunichi:yomiuri,hanshin:hiroshima,rakuten:nipponham,orix:seibu,softbank:lotte
07-04 yakult:dena,chunichi:yomiuri,rakuten:nipponham,softbank:lotte
07-05 yakult:dena,chunichi:yomiuri,hanshin:hiroshima,rakuten:nipponham,orix:seibu,softbank:lotte
07-07 yomiuri:hanshin,dena:chunichi,hiroshima:yakult,seibu:rakuten,lotte:nipponham,orix:softbank
07-08 yomiuri:hanshin,dena:chunichi,hiroshima:yakult,seibu:rakuten,lotte:nipponham,orix:softbank
07-09 yomiuri:hanshin,dena:chunichi,hiroshima:yakult
07-10 dena:yomiuri,chunichi:hiroshima,hanshin:yakult,nipponham:seibu,lotte:orix,softbank:rakuten
07-11 dena:yomiuri,chunichi:hiroshima,hanshin:yakult,nipponham:seibu,lotte:orix,softbank:rakuten
07-12 dena:yomiuri,chunichi:hiroshima,hanshin:yakult,nipponham:seibu,lotte:orix,softbank:rakuten
07-14 yakult:yomiuri,chunichi:hanshin,hiroshima:dena,nipponham:softbank,rakuten:orix,seibu:lotte
07-15 yakult:yomiuri,chunichi:hanshin,hiroshima:dena,nipponham:softbank,rakuten:orix,seibu:lotte
07-16 yakult:yomiuri,chunichi:hanshin,nipponham:softbank,rakuten:orix,seibu:lotte
07-17 yomiuri:chunichi,dena:yakult,hiroshima:hanshin
07-18 yomiuri:chunichi,dena:yakult,hiroshima:hanshin,rakuten:seibu,lotte:softbank,orix:nipponham
07-19 yomiuri:chunichi,dena:yakult,hiroshima:hanshin,rakuten:seibu,lotte:softbank,orix:nipponham
07-20 yomiuri:hiroshima,yakult:chunichi,hanshin:dena,rakuten:seibu,lotte:softbank,orix:nipponham
07-21 yomiuri:hiroshima,yakult:chunichi,hanshin:dena,softbank:orix
07-22 yomiuri:hiroshima,yakult:chunichi,hanshin:dena,seibu:nipponham,lotte:rakuten,softbank:orix
07-23 seibu:nipponham,lotte:rakuten,softbank:orix
07-24 yakult:hiroshima,chunichi:dena,hanshin:yomiuri,seibu:softbank,orix:lotte
07-25 yakult:hiroshima,chunichi:dena,hanshin:yomiuri,nipponham:rakuten,seibu:softbank,orix:lotte
07-26 yakult:hiroshima,chunichi:dena,hanshin:yomiuri,nipponham:rakuten,seibu:softbank,orix:lotte
07-31 yomiuri:dena,yakult:hanshin,hiroshima:chunichi,nipponham:lotte,seibu:orix
08-01 yomiuri:dena,yakult:hanshin,hiroshima:chunichi,nipponham:lotte,rakuten:softbank,seibu:orix
08-02 yomiuri:dena,yakult:hanshin,hiroshima:chunichi,nipponham:lotte,rakuten:softbank,seibu:orix
08-03 orix:rakuten
08-04 dena:hanshin,chunichi:yakult,hiroshima:yomiuri,lotte:seibu,softbank:nipponham
08-05 dena:hanshin,chunichi:yakult,hiroshima:yomiuri,lotte:seibu,orix:rakuten,softbank:nipponham
08-06 dena:hanshin,chunichi:yakult,hiroshima:yomiuri,orix:rakuten,softbank:nipponham
08-07 yomiuri:yakult,dena:hiroshima,hanshin:chunichi,nipponham:rakuten,seibu:softbank,lotte:orix
08-08 yomiuri:yakult,dena:hiroshima,hanshin:chunichi,nipponham:rakuten,seibu:softbank,lotte:orix
08-09 yomiuri:yakult,dena:hiroshima,hanshin:chunichi,nipponham:rakuten,seibu:softbank,lotte:orix
08-11 yomiuri:hanshin,chunichi:dena,nipponham:seibu,rakuten:orix,softbank:lotte
08-12 yomiuri:hanshin,yakult:hiroshima,chunichi:dena,nipponham:seibu,rakuten:orix,softbank:lotte
08-13 yomiuri:hanshin,chunichi:dena,nipponham:seibu,rakuten:orix,softbank:lotte
08-14 yakult:dena,chunichi:yomiuri,hiroshima:hanshin,seibu:lotte,orix:nipponham,softbank:rakuten
08-15 yakult:dena,chunichi:yomiuri,hiroshima:hanshin,seibu:lotte,orix:nipponham,softbank:rakuten
08-16 yakult:dena,chunichi:yomiuri,hiroshima:hanshin,seibu:lotte,orix:nipponham,softbank:rakuten
08-18 dena:yomiuri,hanshin:yakult,hiroshima:chunichi,nipponham:softbank,rakuten:lotte,seibu:orix
08-19 dena:yomiuri,hanshin:yakult,hiroshima:chunichi,nipponham:softbank,rakuten:lotte,seibu:orix
08-20 dena:yomiuri,hanshin:yakult,hiroshima:chunichi,nipponham:softbank,rakuten:lotte,seibu:orix
08-21 yomiuri:hiroshima,dena:hanshin,chunichi:yakult,rakuten:seibu,lotte:nipponham
08-22 yomiuri:hiroshima,chunichi:yakult,rakuten:seibu,softbank:orix
08-23 yomiuri:hiroshima,dena:hanshin,chunichi:yakult,rakuten:seibu,lotte:nipponham,softbank:orix
08-25 yakult:yomiuri,chunichi:hanshin,hiroshima:dena,seibu:nipponham,lotte:softbank,orix:rakuten
08-26 yakult:yomiuri,chunichi:hanshin,hiroshima:dena,seibu:nipponham,lotte:softbank,orix:rakuten
08-27 yakult:yomiuri,chunichi:hanshin,hiroshima:dena,lotte:softbank,orix:rakuten
08-28 dena:chunichi,hanshin:yomiuri,hiroshima:yakult,nipponham:lotte,seibu:rakuten,orix:softbank
08-29 dena:chunichi,hanshin:yomiuri,hiroshima:yakult,nipponham:lotte,seibu:rakuten,orix:softbank
08-30 dena:chunichi,hanshin:yomiuri,hiroshima:yakult,nipponham:lotte,seibu:rakuten,orix:softbank
09-01 yomiuri:dena,yakult:hanshin,chunichi:hiroshima,nipponham:softbank,rakuten:orix,lotte:seibu
09-02 yomiuri:dena,yakult:hanshin,chunichi:hiroshima,nipponham:softbank,rakuten:orix
09-03 yakult:hanshin,chunichi:hiroshima
09-04 yakult:chunichi,hiroshima:yomiuri,rakuten:nipponham,orix:lotte,softbank:seibu
09-05 yakult:chunichi,hanshin:dena,hiroshima:yomiuri,rakuten:nipponham,orix:lotte,softbank:seibu
09-06 hanshin:dena,hiroshima:yomiuri,rakuten:nipponham,orix:lotte,softbank:seibu
09-08 yomiuri:chunichi,dena:yakult,lotte:rakuten,orix:seibu,softbank:nipponham
09-09 yomiuri:chunichi,dena:yakult,hanshin:hiroshima,lotte:rakuten,orix:seibu,softbank:nipponham
09-10 yomiuri:chunichi,dena:yakult,lotte:rakuten,orix:seibu,softbank:nipponham
09-11 hiroshima:dena,orix:seibu,softbank:lotte
09-12 yomiuri:hanshin,chunichi:yakult,hiroshima:dena,seibu:nipponham,orix:rakuten,softbank:lotte
09-13 yakult:hiroshima,dena:yomiuri,hanshin:chunichi,seibu:nipponham,softbank:lotte
09-14 yakult:hiroshima,dena:yomiuri,hanshin:chunichi
09-15 yakult:hiroshima,dena:yomiuri,hanshin:chunichi,nipponham:lotte,rakuten:seibu,orix:softbank
09-16 lotte:rakuten,orix:softbank
09-17 yakult:dena,hanshin:hiroshima,nipponham:seibu,lotte:rakuten,orix:softbank
09-18 yomiuri:chunichi,dena:yakult,hanshin:hiroshima
09-19 yomiuri:chunichi,dena:yakult,hanshin:hiroshima,nipponham:orix,rakuten:softbank,lotte:seibu
09-20 yomiuri:yakult,chunichi:hiroshima,hanshin:dena,nipponham:orix,rakuten:softbank
09-21 chunichi:hiroshima,hanshin:dena,nipponham:orix
09-22 yakult:hanshin,dena:chunichi,hiroshima:yomiuri,nipponham:rakuten,lotte:orix,softbank:seibu
09-23 yakult:hanshin,dena:chunichi,hiroshima:yomiuri,nipponham:rakuten,lotte:orix,softbank:seibu
09-24 hiroshima:yomiuri,nipponham:rakuten
09-25 yakult:chunichi,dena:hanshin,hiroshima:yomiuri,seibu:lotte,orix:softbank
09-26 yakult:chunichi,dena:hanshin,seibu:lotte,orix:nipponham,softbank:rakuten
09-27 yomiuri:yakult,dena:hiroshima,seibu:rakuten,lotte:nipponham,softbank:orix
09-28 dena:hiroshima,seibu:rakuten,lotte:nipponham
09-29 yomiuri:hiroshima,rakuten:lotte,seibu:orix
09-30 hanshin:yakult,rakuten:lotte
10-01 hanshin:yomiuri,hiroshima:chunichi,rakuten:softbank,lotte:nipponham
10-02 yakult:yomiuri,lotte:softbank
10-03 yomiuri:dena,yakult:chunichi,hiroshima:hanshin,rakuten:orix,lotte:softbank
10-04 yakult:hiroshima,dena:hanshin,lotte:rakuten
10-05 rakuten:softbank,lotte:seibu
10-06 hanshin:hiroshima,lotte:seibu
10-07 hanshin:hiroshima
10-08 hanshin:yakult`;
  // MLB: resumed June 16 game counted once on original date. Sep 27 BAL@NYY is filtered out for 2026; future fictional seasons retain it.
  const MLB_2026 = `03-25 giants:yankees
03-26 mets:pirates,brewers:whitesox,cubs:nationals,orioles:twins,reds:redsox,astros:angels,padres:tigers,cardinals:rays,phillies:rangers,dodgers:diamondbacks,mariners:guardians
03-27 giants:yankees,bluejays:athletics,marlins:rockies,braves:royals,astros:angels,padres:tigers,mariners:guardians,dodgers:diamondbacks
03-28 cardinals:rays,cubs:nationals,bluejays:athletics,orioles:twins,phillies:rangers,reds:redsox,mets:pirates,marlins:rockies,astros:angels,brewers:whitesox,braves:royals,giants:yankees,padres:tigers,dodgers:diamondbacks,mariners:guardians
03-29 orioles:twins,phillies:rangers,braves:royals,bluejays:athletics,reds:redsox,mets:pirates,marlins:rockies,astros:angels,brewers:whitesox,cardinals:rays,cubs:nationals,mariners:guardians
03-30 royals:twins,orioles:rangers,reds:pirates,phillies:nationals,marlins:whitesox,bluejays:rockies,braves:athletics,cubs:angels,brewers:rays,cardinals:mets,astros:redsox,padres:giants,mariners:yankees,diamondbacks:tigers,dodgers:guardians
03-31 orioles:rangers,reds:pirates,phillies:nationals,marlins:whitesox,bluejays:rockies,braves:athletics,cubs:angels,brewers:rays,cardinals:mets,astros:redsox,diamondbacks:tigers,padres:giants,mariners:yankees,dodgers:guardians
04-01 braves:athletics,orioles:rangers,reds:pirates,phillies:nationals,bluejays:rockies,marlins:whitesox,cardinals:mets,brewers:rays,astros:redsox,cubs:angels,diamondbacks:tigers,padres:giants,mariners:yankees,royals:twins,dodgers:guardians
04-02 royals:twins,diamondbacks:braves,giants:mets
04-03 nationals:dodgers,tigers:cardinals,yankees:marlins,redsox:padres,whitesox:bluejays,rangers:reds,guardians:cubs,twins:rays,rockies:phillies,pirates:orioles,angels:mariners,athletics:astros,diamondbacks:braves,giants:mets
04-04 tigers:cardinals,whitesox:bluejays,nationals:dodgers,athletics:astros,pirates:orioles,redsox:padres,rangers:reds,yankees:marlins,twins:rays,diamondbacks:braves,rockies:phillies,giants:mets,angels:mariners,royals:brewers,royals:brewers
04-05 nationals:dodgers,pirates:orioles,redsox:padres,yankees:marlins,twins:rays,whitesox:bluejays,royals:brewers,rangers:reds,rockies:phillies,athletics:astros,giants:mets,angels:mariners,diamondbacks:braves,tigers:cardinals,guardians:cubs,guardians:cubs
04-06 rays:cubs,guardians:royals,pirates:padres,marlins:reds,nationals:cardinals,redsox:brewers,bluejays:dodgers,twins:tigers,whitesox:orioles,rangers:mariners,rockies:astros,angels:braves,giants:phillies
04-07 guardians:royals,whitesox:orioles,mets:diamondbacks,pirates:padres,rays:cubs,marlins:reds,nationals:cardinals,redsox:brewers,yankees:athletics,bluejays:dodgers,twins:tigers,rangers:mariners,rockies:astros,angels:braves,giants:phillies
04-08 pirates:padres,guardians:royals,redsox:brewers,whitesox:orioles,rangers:mariners,bluejays:dodgers,rockies:astros,giants:phillies,nationals:cardinals,angels:braves,mets:diamondbacks,rays:cubs,marlins:reds,yankees:athletics,twins:tigers
04-09 marlins:reds,yankees:athletics,twins:tigers,mets:diamondbacks,royals:whitesox,padres:rockies
04-10 cubs:pirates,phillies:diamondbacks,tigers:marlins,reds:angels,bluejays:twins,mets:athletics,rays:yankees,orioles:giants,braves:guardians,royals:whitesox,brewers:nationals,cardinals:redsox,padres:rockies,mariners:astros,dodgers:rangers
04-11 phillies:diamondbacks,tigers:marlins,cubs:pirates,bluejays:twins,reds:angels,mets:athletics,royals:whitesox,rays:yankees,brewers:nationals,orioles:giants,cardinals:redsox,braves:guardians,padres:rockies,dodgers:rangers,mariners:astros
04-12 orioles:giants,phillies:diamondbacks,bluejays:twins,reds:angels,mets:athletics,tigers:marlins,rays:yankees,royals:whitesox,brewers:nationals,cardinals:redsox,cubs:pirates,padres:rockies,mariners:astros,dodgers:rangers,braves:guardians
04-13 mariners:astros,orioles:diamondbacks,pirates:nationals,phillies:cubs,yankees:angels,braves:marlins,twins:redsox,cardinals:guardians,athletics:rangers,dodgers:mets
04-14 orioles:diamondbacks,tigers:royals,pirates:nationals,reds:giants,phillies:cubs,yankees:angels,braves:marlins,twins:redsox,whitesox:rays,brewers:bluejays,cardinals:guardians,astros:rockies,padres:mariners,athletics:rangers,dodgers:mets
04-15 orioles:diamondbacks,cardinals:guardians,twins:redsox,tigers:royals,pirates:nationals,reds:giants,phillies:cubs,yankees:angels,braves:marlins,whitesox:rays,brewers:bluejays,astros:rockies,padres:mariners,athletics:rangers,dodgers:mets
04-16 pirates:nationals,reds:giants,tigers:royals,yankees:angels,brewers:bluejays,whitesox:rays,athletics:rangers,guardians:orioles,astros:rockies,padres:mariners
04-17 cubs:mets,guardians:orioles,phillies:braves,nationals:giants,pirates:rays,yankees:royals,marlins:brewers,redsox:tigers,astros:cardinals,twins:reds,rockies:dodgers,angels:padres,mariners:rangers,diamondbacks:bluejays,athletics:whitesox
04-18 yankees:royals,twins:reds,cubs:mets,pirates:rays,nationals:giants,athletics:whitesox,redsox:tigers,marlins:brewers,guardians:orioles,astros:cardinals,mariners:rangers,phillies:braves,rockies:dodgers,diamondbacks:bluejays,angels:padres
04-19 nationals:giants,pirates:rays,yankees:royals,guardians:orioles,marlins:brewers,astros:cardinals,twins:reds,cubs:mets,rockies:dodgers,athletics:whitesox,angels:padres,mariners:rangers,diamondbacks:bluejays,redsox:tigers,phillies:braves
04-20 redsox:tigers,guardians:astros,rays:reds,marlins:cardinals,nationals:braves,royals:orioles,cubs:phillies,rockies:dodgers,angels:bluejays,mariners:athletics
04-21 guardians:astros,rays:reds,marlins:cardinals,tigers:brewers,nationals:braves,redsox:yankees,mets:twins,royals:orioles,cubs:phillies,rangers:pirates,rockies:padres,angels:bluejays,mariners:athletics,diamondbacks:whitesox,giants:dodgers
04-22 marlins:cardinals,guardians:astros,rays:reds,royals:orioles,angels:bluejays,mariners:athletics,tigers:brewers,nationals:braves,redsox:yankees,mets:twins,cubs:phillies,rangers:pirates,rockies:padres,diamondbacks:whitesox,giants:dodgers
04-23 nationals:braves,tigers:brewers,cubs:phillies,rockies:padres,diamondbacks:whitesox,giants:dodgers,redsox:yankees,mets:twins,rangers:pirates
04-24 reds:tigers,orioles:redsox,bluejays:guardians,mets:rockies,rays:twins,braves:phillies,royals:angels,whitesox:nationals,brewers:pirates,rangers:athletics,astros:yankees,cardinals:mariners,dodgers:cubs,giants:marlins
04-25 orioles:redsox,cardinals:mariners,bluejays:guardians,giants:marlins,rays:twins,whitesox:nationals,diamondbacks:padres,rangers:athletics,royals:angels,astros:yankees,brewers:pirates,reds:tigers,dodgers:cubs,braves:phillies
04-26 orioles:redsox,braves:phillies,bluejays:guardians,reds:tigers,rays:twins,whitesox:nationals,astros:yankees,brewers:pirates,cardinals:mariners,rangers:athletics,diamondbacks:padres,giants:marlins,royals:angels,dodgers:cubs,mets:rockies,mets:rockies
04-27 guardians:rays,pirates:cardinals,bluejays:redsox,twins:mariners,whitesox:angels,rangers:yankees,padres:cubs,dodgers:marlins
04-28 guardians:rays,orioles:astros,reds:rockies,pirates:cardinals,phillies:giants,bluejays:redsox,mets:nationals,braves:tigers,twins:mariners,whitesox:angels,brewers:diamondbacks,rangers:yankees,athletics:royals,padres:cubs,dodgers:marlins
04-29 guardians:rays,whitesox:angels,twins:mariners,rangers:yankees,bluejays:redsox,dodgers:marlins,padres:cubs,reds:rockies,pirates:cardinals,mets:nationals,braves:tigers,brewers:diamondbacks,athletics:royals
04-30 braves:tigers,pirates:cardinals,reds:rockies,mets:nationals,brewers:diamondbacks,athletics:royals,twins:bluejays,orioles:astros,orioles:astros,phillies:giants,phillies:giants
05-01 cubs:diamondbacks,tigers:rangers,pirates:reds,nationals:brewers,yankees:orioles,redsox:astros,rays:giants,marlins:phillies,twins:bluejays,cardinals:dodgers,rockies:braves,angels:mets,athletics:guardians,padres:whitesox,mariners:royals
05-02 yankees:orioles,twins:bluejays,cubs:diamondbacks,athletics:guardians,pirates:reds,nationals:brewers,redsox:astros,marlins:phillies,rays:giants,cardinals:dodgers,tigers:rangers,rockies:braves,padres:whitesox,angels:mets,mariners:royals
05-03 twins:bluejays,redsox:astros,pirates:reds,yankees:orioles,nationals:brewers,rays:giants,marlins:phillies,cardinals:dodgers,cubs:diamondbacks,rockies:braves,athletics:guardians,angels:mets,mariners:royals,padres:whitesox,tigers:rangers
05-04 rockies:mets,tigers:redsox,rays:bluejays,marlins:phillies,yankees:orioles,cubs:reds,royals:guardians,cardinals:brewers,astros:dodgers,angels:whitesox,mariners:braves,giants:padres
05-05 tigers:redsox,rays:bluejays,phillies:athletics,marlins:orioles,nationals:twins,yankees:rangers,cubs:reds,royals:guardians,astros:dodgers,angels:whitesox,diamondbacks:pirates,mariners:braves,giants:padres
05-06 rays:bluejays,cardinals:brewers,astros:dodgers,giants:padres,angels:whitesox,mariners:braves,tigers:redsox,phillies:athletics,marlins:orioles,nationals:twins,yankees:rangers,cubs:reds,royals:guardians,rockies:mets,diamondbacks:pirates
05-07 yankees:rangers,nationals:twins,royals:guardians,cubs:reds,rockies:mets,diamondbacks:pirates,phillies:athletics,marlins:orioles,redsox:rays,padres:cardinals
05-08 reds:astros,phillies:rockies,orioles:athletics,bluejays:angels,redsox:rays,marlins:nationals,guardians:twins,royals:tigers,whitesox:mariners,brewers:yankees,rangers:cubs,diamondbacks:mets,padres:cardinals,dodgers:braves,giants:pirates
05-09 bluejays:angels,orioles:athletics,reds:astros,marlins:nationals,phillies:rockies,guardians:twins,rangers:cubs,royals:tigers,whitesox:mariners,brewers:yankees,diamondbacks:mets,padres:cardinals,giants:pirates,dodgers:braves
05-10 marlins:nationals,orioles:athletics,redsox:rays,phillies:rockies,bluejays:angels,reds:astros,guardians:twins,whitesox:mariners,brewers:yankees,rangers:cubs,giants:pirates,diamondbacks:mets,padres:cardinals,dodgers:braves,royals:tigers
05-11 guardians:angels,orioles:yankees,bluejays:rays,rangers:diamondbacks,astros:mariners,dodgers:giants
05-12 guardians:angels,orioles:yankees,reds:nationals,pirates:rockies,redsox:phillies,bluejays:rays,mets:tigers,braves:cubs,whitesox:royals,twins:marlins,brewers:padres,rangers:diamondbacks,astros:mariners,athletics:cardinals,dodgers:giants
05-13 orioles:yankees,guardians:angels,reds:nationals,pirates:rockies,redsox:phillies,bluejays:rays,mets:tigers,braves:cubs,whitesox:royals,twins:marlins,brewers:padres,rangers:diamondbacks,astros:mariners,athletics:cardinals,dodgers:giants
05-14 pirates:rockies,reds:nationals,mets:tigers,twins:marlins,brewers:padres,astros:mariners,athletics:cardinals,redsox:phillies,braves:cubs,whitesox:royals,dodgers:giants
05-15 pirates:phillies,nationals:orioles,tigers:bluejays,guardians:reds,rays:marlins,twins:brewers,braves:redsox,mets:yankees,whitesox:cubs,astros:rangers,cardinals:royals,rockies:diamondbacks,angels:dodgers,mariners:padres,athletics:giants
05-16 tigers:bluejays,cardinals:royals,rockies:diamondbacks,nationals:orioles,pirates:phillies,rays:marlins,guardians:reds,astros:rangers,whitesox:cubs,twins:brewers,mariners:padres,braves:redsox,mets:yankees,angels:dodgers,athletics:giants
05-17 rays:marlins,nationals:orioles,pirates:phillies,braves:redsox,guardians:reds,tigers:bluejays,mets:yankees,astros:rangers,whitesox:cubs,twins:brewers,cardinals:royals,rockies:diamondbacks,athletics:giants,angels:dodgers,mariners:padres
05-18 tigers:guardians,rays:orioles,phillies:reds,marlins:braves,nationals:mets,yankees:bluejays,royals:redsox,twins:astros,cubs:brewers,rockies:rangers,angels:athletics,padres:dodgers,diamondbacks:giants,mariners:whitesox
05-19 marlins:braves,tigers:guardians,rays:orioles,phillies:reds,nationals:mets,yankees:bluejays,royals:redsox,twins:astros,cubs:brewers,cardinals:pirates,rockies:rangers,angels:athletics,padres:dodgers,diamondbacks:giants,mariners:whitesox
05-20 phillies:reds,rays:orioles,twins:astros,rockies:rangers,diamondbacks:giants,mariners:whitesox,tigers:guardians,marlins:braves,nationals:mets,yankees:bluejays,royals:redsox,cubs:brewers,cardinals:pirates,padres:dodgers,angels:athletics
05-21 tigers:guardians,cardinals:pirates,nationals:mets,marlins:braves,yankees:bluejays,angels:athletics,diamondbacks:rockies
05-22 cubs:astros,phillies:guardians,yankees:rays,bluejays:pirates,redsox:twins,marlins:mets,orioles:tigers,braves:nationals,royals:mariners,brewers:dodgers,angels:rangers,diamondbacks:rockies,padres:athletics,giants:whitesox
05-23 cubs:astros,bluejays:pirates,phillies:guardians,giants:whitesox,royals:mariners,redsox:twins,braves:nationals,marlins:mets,brewers:dodgers,padres:athletics,angels:rangers,diamondbacks:rockies,reds:cardinals,reds:cardinals
05-24 bluejays:pirates,redsox:twins,phillies:guardians,yankees:rays,marlins:mets,royals:mariners,brewers:dodgers,cubs:astros,giants:whitesox,diamondbacks:rockies,padres:athletics,braves:nationals,angels:rangers,orioles:tigers,orioles:tigers
05-25 pirates:cubs,orioles:rays,whitesox:twins,brewers:cardinals,royals:yankees,mets:reds,giants:diamondbacks,guardians:nationals,padres:phillies,rangers:astros,bluejays:marlins,dodgers:rockies,athletics:mariners
05-26 guardians:nationals,orioles:rays,tigers:angels,pirates:cubs,redsox:braves,bluejays:marlins,mets:reds,whitesox:twins,royals:yankees,brewers:cardinals,rangers:astros,athletics:mariners,padres:phillies,giants:diamondbacks,dodgers:rockies
05-27 bluejays:marlins,guardians:nationals,brewers:cardinals,athletics:mariners,giants:diamondbacks,padres:phillies,orioles:rays,tigers:angels,pirates:cubs,redsox:braves,mets:reds,whitesox:twins,royals:yankees,rangers:astros,dodgers:rockies
05-28 tigers:angels,whitesox:twins,redsox:braves,orioles:bluejays,pirates:cubs,rangers:astros
05-29 reds:braves,nationals:padres,pirates:twins,orioles:bluejays,guardians:redsox,rays:angels,mets:marlins,cardinals:cubs,whitesox:tigers,rangers:royals,astros:brewers,rockies:giants,athletics:yankees,mariners:diamondbacks,dodgers:phillies
05-30 whitesox:tigers,nationals:padres,rangers:royals,orioles:bluejays,pirates:twins,guardians:redsox,rays:angels,mets:marlins,astros:brewers,cardinals:cubs,reds:braves,rockies:giants,athletics:yankees,mariners:diamondbacks,dodgers:phillies
05-31 orioles:bluejays,nationals:padres,pirates:twins,guardians:redsox,rays:angels,reds:braves,mets:marlins,whitesox:tigers,astros:brewers,rangers:royals,rockies:giants,athletics:yankees,mariners:diamondbacks,dodgers:phillies,cardinals:cubs
06-01 rays:tigers,nationals:marlins,reds:royals,twins:whitesox,brewers:giants,cardinals:rangers,angels:rockies,diamondbacks:dodgers,mariners:mets
06-02 rays:tigers,phillies:padres,redsox:orioles,nationals:marlins,yankees:guardians,reds:royals,braves:bluejays,twins:whitesox,brewers:giants,cardinals:rangers,cubs:athletics,astros:pirates,angels:rockies,diamondbacks:dodgers,mariners:mets
06-03 nationals:marlins,rays:tigers,twins:whitesox,mariners:mets,phillies:padres,redsox:orioles,yankees:guardians,reds:royals,braves:bluejays,brewers:giants,cardinals:rangers,cubs:athletics,astros:pirates,angels:rockies,diamondbacks:dodgers
06-04 phillies:padres,redsox:orioles,yankees:guardians,brewers:giants,braves:bluejays,twins:royals,cubs:athletics,astros:pirates,diamondbacks:dodgers
06-05 cubs:giants,tigers:mariners,phillies:whitesox,yankees:redsox,bluejays:orioles,marlins:rays,braves:pirates,astros:athletics,cardinals:reds,rangers:guardians,twins:royals,rockies:brewers,diamondbacks:nationals,padres:mets,dodgers:angels
06-06 tigers:mariners,twins:royals,cardinals:reds,cubs:giants,bluejays:orioles,phillies:whitesox,diamondbacks:nationals,astros:athletics,braves:pirates,marlins:rays,rangers:guardians,rockies:brewers,dodgers:angels,padres:mets
06-07 braves:pirates,phillies:whitesox,yankees:redsox,bluejays:orioles,tigers:mariners,marlins:rays,astros:athletics,twins:royals,cardinals:reds,rangers:guardians,rockies:brewers,diamondbacks:nationals,dodgers:angels,padres:mets,cubs:giants
06-08 orioles:mariners,rays:redsox,guardians:yankees,bluejays:phillies,angels:astros,padres:reds,giants:nationals,athletics:brewers
06-09 orioles:mariners,pirates:dodgers,rays:redsox,tigers:twins,marlins:diamondbacks,guardians:yankees,bluejays:phillies,mets:cardinals,royals:rangers,whitesox:braves,rockies:cubs,angels:astros,padres:reds,giants:nationals,athletics:brewers
06-10 rays:redsox,guardians:yankees,giants:nationals,padres:reds,orioles:mariners,pirates:dodgers,tigers:twins,marlins:diamondbacks,bluejays:phillies,mets:cardinals,royals:rangers,whitesox:braves,rockies:cubs,athletics:brewers,angels:astros
06-11 mets:cardinals,tigers:twins,marlins:diamondbacks,royals:rangers,rockies:cubs,pirates:dodgers,orioles:mariners
06-12 pirates:marlins,nationals:mariners,orioles:padres,guardians:tigers,redsox:rangers,reds:diamondbacks,mets:braves,bluejays:yankees,whitesox:dodgers,brewers:phillies,royals:astros,twins:cardinals,angels:rays,athletics:rockies,giants:cubs
06-13 twins:cardinals,bluejays:yankees,orioles:padres,nationals:mariners,pirates:marlins,reds:diamondbacks,guardians:tigers,redsox:rangers,mets:braves,whitesox:dodgers,royals:astros,brewers:phillies,athletics:rockies,giants:cubs,angels:rays
06-14 pirates:marlins,orioles:padres,nationals:mariners,bluejays:yankees,reds:diamondbacks,mets:braves,royals:astros,twins:cardinals,whitesox:dodgers,brewers:phillies,athletics:rockies,giants:cubs,angels:rays,redsox:rangers
06-15 phillies:marlins,nationals:royals,reds:mets,cardinals:padres,cubs:rockies,rangers:twins,astros:tigers,diamondbacks:angels,athletics:pirates,dodgers:rays
06-16 phillies:marlins,nationals:royals,redsox:bluejays,yankees:whitesox,reds:mets,braves:giants,brewers:guardians,cardinals:padres,cubs:rockies,rangers:twins,astros:tigers,diamondbacks:angels,athletics:pirates,mariners:orioles,dodgers:rays
06-17 reds:mets,nationals:royals,phillies:marlins,astros:tigers,cardinals:padres,dodgers:rays,diamondbacks:angels,redsox:bluejays,yankees:whitesox,braves:giants,brewers:guardians,cubs:rockies,athletics:pirates,mariners:orioles
06-18 redsox:bluejays,brewers:guardians,rangers:twins,mariners:orioles,phillies:mets,yankees:whitesox,royals:cardinals,athletics:angels
06-19 cubs:bluejays,tigers:whitesox,yankees:reds,rays:nationals,marlins:giants,braves:brewers,rangers:padres,astros:guardians,royals:cardinals,rockies:pirates,athletics:angels,diamondbacks:twins,dodgers:orioles,mariners:redsox
06-20 tigers:whitesox,yankees:reds,cubs:bluejays,rangers:padres,rays:nationals,marlins:giants,braves:brewers,astros:guardians,phillies:mets,rockies:pirates,athletics:angels,dodgers:orioles,mariners:redsox,diamondbacks:twins
06-21 yankees:reds,braves:brewers,rays:nationals,tigers:whitesox,marlins:giants,astros:guardians,royals:cardinals,rangers:padres,rockies:pirates,diamondbacks:twins,athletics:angels,dodgers:orioles,mariners:redsox,phillies:mets
06-22 tigers:yankees,rays:royals,marlins:rangers,nationals:phillies,bluejays:astros,reds:brewers,twins:dodgers,whitesox:guardians,cardinals:diamondbacks,rockies:redsox,angels:orioles,padres:braves
06-23 bluejays:astros,pirates:mariners,rays:royals,marlins:rangers,tigers:yankees,nationals:phillies,mets:cubs,reds:brewers,twins:dodgers,whitesox:guardians,cardinals:diamondbacks,rockies:redsox,angels:orioles,padres:braves,giants:athletics
06-24 marlins:rangers,whitesox:guardians,rockies:redsox,angels:orioles,pirates:mariners,rays:royals,tigers:yankees,nationals:phillies,bluejays:astros,reds:brewers,twins:dodgers,cardinals:diamondbacks,padres:braves,giants:athletics,mets:cubs,mets:cubs
06-25 rays:royals,pirates:mariners,giants:athletics,tigers:astros,nationals:phillies,bluejays:rangers,mets:cubs,redsox:yankees
06-26 tigers:astros,pirates:reds,orioles:nationals,bluejays:rangers,guardians:mariners,rays:diamondbacks,mets:phillies,redsox:yankees,whitesox:royals,brewers:cubs,twins:rockies,cardinals:marlins,angels:athletics,padres:dodgers,giants:braves
06-27 tigers:astros,redsox:yankees,bluejays:rangers,pirates:reds,mets:phillies,whitesox:royals,rays:diamondbacks,orioles:nationals,guardians:mariners,twins:rockies,brewers:cubs,cardinals:marlins,padres:dodgers,giants:braves,angels:athletics
06-28 orioles:nationals,pirates:reds,bluejays:rangers,tigers:astros,guardians:mariners,rays:diamondbacks,mets:phillies,twins:rockies,whitesox:royals,brewers:cubs,cardinals:marlins,angels:athletics,giants:braves,padres:dodgers,redsox:yankees
06-29 orioles:whitesox,phillies:pirates,yankees:tigers,bluejays:mets,redsox:nationals,guardians:rangers,brewers:reds,cubs:padres,astros:twins,rockies:marlins,athletics:dodgers,mariners:angels,diamondbacks:giants
06-30 orioles:whitesox,guardians:rangers,phillies:pirates,yankees:tigers,bluejays:mets,redsox:nationals,braves:cardinals,royals:rays,brewers:reds,cubs:padres,astros:twins,rockies:marlins,athletics:dodgers,mariners:angels,diamondbacks:giants
07-01 orioles:whitesox,guardians:rangers,redsox:nationals,yankees:tigers,cubs:padres,bluejays:mets,phillies:pirates,braves:cardinals,royals:rays,astros:twins,brewers:reds,rockies:marlins,athletics:dodgers,diamondbacks:giants
07-02 phillies:pirates,brewers:reds,rockies:marlins,guardians:whitesox,braves:cardinals,royals:rays,rangers:tigers,mariners:angels,dodgers:padres
07-03 cubs:cardinals,nationals:pirates,yankees:twins,reds:orioles,guardians:whitesox,braves:mets,rockies:giants,astros:rays,angels:redsox,athletics:marlins,diamondbacks:brewers,dodgers:padres,mariners:bluejays
07-04 nationals:pirates,yankees:twins,rangers:tigers,mariners:bluejays,reds:orioles,astros:rays,guardians:whitesox,cubs:cardinals,braves:mets,rockies:giants,royals:phillies,angels:redsox,athletics:marlins,diamondbacks:brewers,dodgers:padres
07-05 braves:mets,nationals:pirates,reds:orioles,yankees:twins,guardians:whitesox,cubs:cardinals,royals:phillies,astros:rays,rangers:tigers,rockies:giants,diamondbacks:brewers,athletics:marlins,mariners:bluejays,dodgers:padres,angels:redsox
07-06 royals:phillies,rays:yankees,nationals:astros,braves:mets,cardinals:brewers,padres:diamondbacks,giants:bluejays,dodgers:rockies
07-07 orioles:cubs,tigers:athletics,pirates:braves,marlins:mariners,rays:yankees,nationals:astros,mets:royals,reds:phillies,twins:guardians,whitesox:redsox,rangers:angels,padres:diamondbacks,giants:bluejays,dodgers:rockies,cardinals:brewers,cardinals:brewers
07-08 giants:bluejays,orioles:cubs,tigers:athletics,pirates:braves,marlins:mariners,rays:yankees,nationals:astros,mets:royals,reds:phillies,twins:guardians,whitesox:redsox,cardinals:brewers,rangers:angels,dodgers:rockies,padres:diamondbacks
07-09 pirates:braves,mets:royals,rays:yankees,orioles:cubs,twins:guardians,whitesox:redsox,tigers:athletics,marlins:mariners,reds:phillies,cardinals:brewers,rangers:angels,padres:diamondbacks,giants:rockies
07-10 tigers:phillies,nationals:yankees,orioles:royals,reds:cubs,rays:mariners,marlins:guardians,mets:redsox,whitesox:athletics,rangers:astros,twins:angels,cardinals:braves,padres:bluejays,dodgers:diamondbacks,giants:rockies
07-11 twins:angels,whitesox:athletics,giants:rockies,nationals:yankees,mets:redsox,rays:mariners,marlins:guardians,tigers:phillies,orioles:royals,rangers:astros,reds:cubs,cardinals:braves,padres:bluejays,dodgers:diamondbacks,pirates:brewers,pirates:brewers
07-12 pirates:brewers,orioles:royals,nationals:yankees,reds:cubs,mets:redsox,rays:mariners,tigers:phillies,marlins:guardians,twins:angels,whitesox:athletics,cardinals:braves,rangers:astros,giants:rockies,dodgers:diamondbacks,padres:bluejays
07-16 phillies:mets
07-17 yankees:dodgers,braves:rangers,bluejays:whitesox,brewers:marlins,cubs:twins,astros:orioles,royals:padres,rockies:reds,angels:tigers,athletics:nationals,diamondbacks:cardinals,mariners:giants,redsox:rays,redsox:rays
07-18 cubs:twins,phillies:mets,bluejays:whitesox,rockies:reds,astros:orioles,royals:padres,diamondbacks:cardinals,redsox:rays,braves:rangers,brewers:marlins,mariners:giants,athletics:nationals,angels:tigers,guardians:pirates,guardians:pirates
07-19 bluejays:whitesox,redsox:rays,phillies:mets,braves:rangers,guardians:pirates,astros:orioles,royals:padres,brewers:marlins,cubs:twins,rockies:reds,athletics:nationals,angels:tigers,mariners:giants,diamondbacks:cardinals,yankees:dodgers,yankees:dodgers
07-20 guardians:twins,yankees:pirates,bluejays:rays,redsox:orioles,phillies:dodgers,braves:padres,royals:giants,brewers:mets,cubs:tigers,rangers:whitesox,astros:marlins,rockies:nationals,diamondbacks:athletics,mariners:reds,angels:cardinals
07-21 guardians:twins,phillies:dodgers,bluejays:rays,braves:padres,royals:giants,brewers:mets,cubs:tigers,rangers:whitesox,astros:marlins,rockies:nationals,angels:cardinals,diamondbacks:athletics,mariners:reds
07-22 royals:giants,brewers:mets,rockies:nationals,diamondbacks:athletics,mariners:reds,angels:cardinals,guardians:twins,phillies:dodgers,bluejays:rays,braves:padres,rangers:whitesox,cubs:tigers,astros:marlins,redsox:orioles,redsox:orioles,yankees:pirates,yankees:pirates
07-23 braves:padres,guardians:twins,bluejays:rays,cardinals:diamondbacks,tigers:royals
07-24 brewers:rockies,tigers:royals,pirates:cubs,nationals:diamondbacks,phillies:yankees,orioles:braves,mets:dodgers,rays:guardians,marlins:padres,redsox:bluejays,whitesox:astros,rangers:mariners,twins:athletics,cardinals:reds,giants:angels
07-25 tigers:royals,nationals:diamondbacks,giants:angels,redsox:bluejays,marlins:padres,phillies:yankees,rays:guardians,pirates:cubs,orioles:braves,twins:athletics,whitesox:astros,brewers:rockies,mets:dodgers,cardinals:reds,rangers:mariners
07-26 rays:guardians,nationals:diamondbacks,pirates:cubs,redsox:bluejays,orioles:braves,tigers:royals,mets:dodgers,marlins:padres,twins:athletics,whitesox:astros,brewers:rockies,cardinals:reds,rangers:mariners,giants:angels,phillies:yankees
07-27 rangers:mariners,tigers:orioles,pirates:diamondbacks,marlins:phillies,nationals:bluejays,mets:braves,whitesox:yankees,cardinals:cubs,angels:astros,athletics:redsox,giants:brewers
07-28 tigers:orioles,pirates:diamondbacks,rays:rangers,marlins:phillies,nationals:bluejays,twins:royals,whitesox:yankees,cardinals:cubs,angels:astros,athletics:redsox,padres:rockies,giants:brewers,dodgers:mariners,reds:guardians,reds:guardians
07-29 marlins:phillies,pirates:diamondbacks,nationals:bluejays,tigers:orioles,giants:brewers,padres:rockies,rays:rangers,reds:guardians,twins:royals,whitesox:yankees,cardinals:cubs,angels:astros,athletics:redsox,dodgers:mariners,mets:braves,mets:braves
07-30 rays:rangers,twins:royals,whitesox:yankees,cardinals:cubs,reds:pirates,mets:marlins,braves:nationals,athletics:redsox,padres:giants,dodgers:mariners
07-31 cubs:yankees,reds:pirates,orioles:phillies,bluejays:cardinals,guardians:diamondbacks,rays:whitesox,mets:marlins,braves:nationals,astros:rangers,rockies:royals,angels:brewers,athletics:tigers,padres:giants,dodgers:redsox,mariners:twins
08-01 bluejays:cardinals,mariners:twins,rays:whitesox,mets:marlins,reds:pirates,orioles:phillies,astros:rangers,guardians:diamondbacks,braves:nationals,cubs:yankees,rockies:royals,padres:giants,dodgers:redsox,angels:brewers,athletics:tigers
08-02 orioles:phillies,braves:nationals,bluejays:cardinals,guardians:diamondbacks,reds:pirates,rays:whitesox,mets:marlins,astros:rangers,cubs:yankees,rockies:royals,angels:brewers,athletics:tigers,padres:giants,mariners:twins,dodgers:redsox
08-03 phillies:nationals,yankees:cardinals,brewers:pirates,cubs:dodgers,rangers:giants,astros:bluejays,rockies:rays,diamondbacks:padres
08-04 orioles:angels,guardians:mets,reds:athletics,phillies:nationals,yankees:cardinals,redsox:whitesox,braves:marlins,royals:twins,brewers:pirates,cubs:dodgers,rangers:giants,astros:bluejays,rockies:rays,diamondbacks:padres,mariners:tigers
08-05 astros:bluejays,cubs:dodgers,rangers:giants,rockies:rays,orioles:angels,guardians:mets,reds:athletics,phillies:nationals,yankees:cardinals,redsox:whitesox,braves:marlins,royals:twins,brewers:pirates,diamondbacks:padres,mariners:tigers
08-06 orioles:angels,reds:athletics,guardians:mets,brewers:pirates,cubs:bluejays,mariners:tigers,phillies:nationals,redsox:whitesox,braves:marlins,royals:twins,diamondbacks:padres
08-07 pirates:mets,phillies:bluejays,nationals:reds,yankees:braves,redsox:athletics,marlins:angels,whitesox:guardians,brewers:twins,royals:cubs,cardinals:rockies,rangers:orioles,diamondbacks:dodgers,padres:astros,mariners:rays,giants:tigers
08-08 yankees:braves,redsox:athletics,marlins:angels,phillies:bluejays,pirates:mets,nationals:reds,royals:cubs,brewers:twins,padres:astros,giants:tigers,cardinals:rockies,rangers:orioles,whitesox:guardians,diamondbacks:dodgers,mariners:rays
08-09 nationals:reds,redsox:athletics,pirates:mets,phillies:bluejays,yankees:braves,marlins:angels,royals:cubs,whitesox:guardians,brewers:twins,cardinals:rockies,rangers:orioles,giants:tigers,diamondbacks:dodgers,mariners:rays,padres:astros
08-10 bluejays:redsox,braves:mets,twins:orioles,cardinals:phillies,angels:rangers,diamondbacks:rockies,athletics:rays,padres:brewers,giants:astros,dodgers:royals
08-11 tigers:guardians,marlins:pirates,nationals:cubs,yankees:mariners,bluejays:redsox,braves:mets,twins:orioles,whitesox:reds,cardinals:phillies,angels:rangers,diamondbacks:rockies,athletics:rays,padres:brewers,giants:astros,dodgers:royals
08-12 twins:orioles,cardinals:phillies,athletics:rays,diamondbacks:rockies,giants:astros,padres:brewers,tigers:guardians,marlins:pirates,nationals:cubs,yankees:mariners,bluejays:redsox,braves:mets,whitesox:reds,dodgers:royals,angels:rangers
08-13 tigers:guardians,whitesox:reds,marlins:pirates,yankees:mariners,bluejays:redsox,nationals:cubs,twins:phillies,angels:rangers,dodgers:brewers
08-14 cubs:cardinals,reds:marlins,pirates:redsox,tigers:whitesox,mets:nationals,guardians:padres,rays:orioles,braves:diamondbacks,bluejays:yankees,astros:mariners,angels:royals,athletics:rangers,dodgers:brewers,giants:rockies
08-15 tigers:whitesox,cubs:cardinals,bluejays:yankees,giants:rockies,mets:nationals,rays:orioles,reds:marlins,guardians:padres,astros:mariners,twins:phillies,pirates:redsox,braves:diamondbacks,dodgers:brewers,angels:royals,athletics:rangers
08-16 rays:orioles,pirates:redsox,braves:diamondbacks,bluejays:yankees,mets:nationals,guardians:padres,tigers:whitesox,reds:marlins,twins:phillies,cubs:cardinals,giants:rockies,athletics:rangers,angels:royals,dodgers:brewers,astros:mariners
08-17 rays:orioles,phillies:marlins,pirates:tigers,redsox:diamondbacks,mets:padres,royals:athletics,twins:braves,cubs:whitesox,rockies:dodgers,reds:cardinals,reds:cardinals
08-18 orioles:yankees,pirates:tigers,guardians:giants,reds:cardinals,rays:bluejays,phillies:marlins,redsox:diamondbacks,mets:padres,royals:athletics,twins:braves,brewers:mariners,rangers:nationals,cubs:whitesox,astros:angels,rockies:dodgers
08-19 pirates:tigers,mets:padres,twins:braves,cubs:whitesox,redsox:diamondbacks,phillies:marlins,orioles:yankees,guardians:giants,reds:cardinals,rays:bluejays,royals:athletics,brewers:mariners,rangers:nationals,astros:angels,rockies:dodgers
08-20 reds:cardinals,guardians:giants,rays:bluejays,royals:athletics,whitesox:braves,brewers:mariners,orioles:yankees,rangers:nationals,astros:angels
08-21 brewers:braves,phillies:cardinals,yankees:bluejays,redsox:giants,marlins:nationals,orioles:rays,whitesox:mets,royals:tigers,astros:athletics,rangers:angels,rockies:guardians,diamondbacks:reds,padres:twins,dodgers:pirates,mariners:cubs
08-22 yankees:bluejays,brewers:braves,marlins:nationals,phillies:cardinals,orioles:rays,rangers:angels,astros:athletics,whitesox:mets,royals:tigers,dodgers:pirates,mariners:cubs,redsox:giants,diamondbacks:reds,rockies:guardians,padres:twins
08-23 orioles:rays,phillies:cardinals,yankees:bluejays,marlins:nationals,royals:tigers,astros:athletics,whitesox:mets,rangers:angels,rockies:guardians,redsox:giants,dodgers:pirates,mariners:cubs,padres:twins,diamondbacks:reds,brewers:braves
08-24 tigers:rays,marlins:redsox,nationals:rockies,whitesox:rangers,angels:guardians,diamondbacks:cubs,padres:pirates,athletics:twins,mariners:phillies,giants:reds
08-25 tigers:rays,marlins:redsox,nationals:rockies,yankees:astros,bluejays:royals,mets:brewers,braves:dodgers,whitesox:rangers,cardinals:orioles,angels:guardians,diamondbacks:cubs,padres:pirates,athletics:twins,mariners:phillies,giants:reds
08-26 tigers:rays,diamondbacks:cubs,giants:reds,angels:guardians,padres:pirates,mariners:phillies,marlins:redsox,nationals:rockies,yankees:astros,bluejays:royals,mets:brewers,braves:dodgers,whitesox:rangers,cardinals:orioles,athletics:twins
08-27 nationals:rockies,cardinals:orioles,yankees:astros,bluejays:royals,mets:brewers,braves:dodgers,giants:diamondbacks
08-28 cubs:reds,tigers:dodgers,nationals:marlins,guardians:royals,mets:astros,rays:padres,bluejays:mariners,braves:rockies,yankees:redsox,brewers:rangers,twins:whitesox,cardinals:pirates,angels:phillies,athletics:orioles,giants:diamondbacks
08-29 tigers:dodgers,twins:whitesox,cardinals:pirates,cubs:reds,bluejays:mariners,nationals:marlins,guardians:royals,mets:astros,rays:padres,braves:rockies,brewers:rangers,athletics:orioles,angels:phillies,giants:diamondbacks,giants:diamondbacks,yankees:redsox,yankees:redsox
08-30 nationals:marlins,braves:rockies,yankees:redsox,bluejays:mariners,guardians:royals,tigers:dodgers,rays:padres,twins:whitesox,brewers:rangers,cardinals:pirates,mets:astros,athletics:orioles,angels:phillies,cubs:reds
08-31 braves:giants,reds:padres,rays:mets,redsox:mariners,nationals:marlins,twins:tigers,cubs:brewers,rangers:athletics,astros:whitesox,rockies:orioles,angels:yankees,diamondbacks:phillies
09-01 reds:padres,pirates:giants,rays:mets,guardians:bluejays,redsox:mariners,nationals:braves,twins:tigers,royals:marlins,cubs:brewers,rangers:athletics,astros:whitesox,rockies:orioles,angels:yankees,diamondbacks:phillies,dodgers:cardinals
09-02 reds:padres,nationals:braves,rangers:athletics,rockies:orioles,diamondbacks:phillies,redsox:mariners,pirates:giants,rays:mets,guardians:bluejays,twins:tigers,royals:marlins,cubs:brewers,astros:whitesox,angels:yankees,dodgers:cardinals
09-03 pirates:giants,guardians:bluejays,astros:whitesox,orioles:redsox,cubs:brewers,royals:marlins,rangers:rays,mariners:athletics,dodgers:cardinals
09-04 reds:brewers,phillies:braves,pirates:angels,orioles:redsox,mets:giants,marlins:cubs,whitesox:twins,rangers:rays,astros:diamondbacks,royals:bluejays,rockies:cardinals,padres:yankees,dodgers:nationals,mariners:athletics,guardians:tigers,guardians:tigers
09-05 mets:giants,marlins:cubs,phillies:braves,guardians:tigers,pirates:angels,reds:brewers,orioles:redsox,rangers:rays,royals:bluejays,whitesox:twins,astros:diamondbacks,padres:yankees,rockies:cardinals,dodgers:nationals,mariners:athletics
09-06 reds:brewers,phillies:braves,orioles:redsox,pirates:angels,guardians:tigers,mets:giants,marlins:cubs,astros:diamondbacks,royals:bluejays,rangers:rays,rockies:cardinals,mariners:athletics,padres:yankees,whitesox:twins,dodgers:nationals
09-07 phillies:braves,marlins:mets,redsox:angels,orioles:guardians,royals:diamondbacks,brewers:cubs,tigers:twins,padres:nationals,giants:cardinals,dodgers:reds,athletics:bluejays
09-08 orioles:guardians,tigers:twins,phillies:astros,marlins:mets,redsox:angels,yankees:rockies,braves:rays,royals:diamondbacks,whitesox:pirates,brewers:cubs,padres:nationals,mariners:rangers,athletics:bluejays,giants:cardinals,dodgers:reds
09-09 tigers:twins,athletics:bluejays,giants:cardinals,padres:nationals,mariners:rangers,orioles:guardians,phillies:astros,marlins:mets,redsox:angels,yankees:rockies,braves:rays,royals:diamondbacks,whitesox:pirates,brewers:cubs,dodgers:reds
09-10 braves:rays,phillies:astros,mariners:rangers,yankees:rockies,whitesox:pirates
09-11 cubs:pirates,tigers:rockies,nationals:angels,yankees:mets,bluejays:orioles,redsox:royals,rays:astros,marlins:dodgers,braves:phillies,brewers:reds,twins:guardians,cardinals:whitesox,athletics:mariners,diamondbacks:rangers,giants:padres
09-12 tigers:rockies,yankees:mets,cubs:pirates,bluejays:orioles,nationals:angels,giants:padres,redsox:royals,twins:guardians,marlins:dodgers,rays:astros,brewers:reds,braves:phillies,cardinals:whitesox,diamondbacks:rangers,athletics:mariners
09-13 tigers:rockies,nationals:angels,braves:phillies,yankees:mets,bluejays:orioles,rays:astros,marlins:dodgers,twins:guardians,brewers:reds,cardinals:whitesox,cubs:pirates,redsox:royals,athletics:mariners,diamondbacks:rangers,giants:padres
09-14 reds:dodgers,guardians:whitesox,bluejays:tigers,mets:orioles,cubs:braves,twins:yankees,cardinals:giants,rockies:padres,angels:mariners,diamondbacks:marlins
09-15 reds:dodgers,rays:athletics,guardians:whitesox,pirates:brewers,nationals:phillies,bluejays:tigers,mets:orioles,cubs:braves,twins:yankees,cardinals:giants,rangers:redsox,astros:royals,rockies:padres,angels:mariners,diamondbacks:marlins
09-16 guardians:whitesox,cardinals:giants,twins:yankees,bluejays:tigers,reds:dodgers,rays:athletics,pirates:brewers,nationals:phillies,mets:orioles,cubs:braves,rangers:redsox,astros:royals,rockies:padres,angels:mariners,diamondbacks:marlins
09-17 pirates:brewers,reds:dodgers,rays:athletics,rockies:padres,astros:royals,mets:phillies,whitesox:tigers,rangers:redsox,angels:twins
09-18 reds:cubs,pirates:royals,orioles:brewers,guardians:athletics,rays:redsox,mets:phillies,whitesox:tigers,rangers:bluejays,rockies:mariners,astros:braves,cardinals:nationals,angels:twins,padres:marlins,diamondbacks:yankees,dodgers:giants
09-19 whitesox:tigers,orioles:brewers,rays:redsox,mets:phillies,guardians:athletics,reds:cubs,pirates:royals,rangers:bluejays,astros:braves,cardinals:nationals,rockies:mariners,diamondbacks:yankees,padres:marlins,dodgers:giants,angels:twins
09-20 mets:phillies,pirates:royals,reds:cubs,guardians:athletics,rays:redsox,astros:braves,whitesox:tigers,cardinals:nationals,rangers:bluejays,rockies:mariners,angels:twins,dodgers:giants,padres:marlins,diamondbacks:yankees,orioles:brewers
09-21 orioles:bluejays,tigers:nationals,giants:twins
09-22 tigers:nationals,pirates:cardinals,phillies:brewers,redsox:guardians,braves:reds,royals:whitesox,cubs:marlins,rangers:mets,rockies:diamondbacks,athletics:angels,mariners:astros,giants:twins,dodgers:padres,yankees:rays,yankees:rays
09-23 tigers:nationals,giants:twins,pirates:cardinals,phillies:brewers,yankees:rays,redsox:guardians,braves:reds,royals:whitesox,cubs:marlins,rangers:mets,rockies:diamondbacks,athletics:angels,dodgers:padres,mariners:astros,orioles:bluejays,orioles:bluejays
09-24 pirates:cardinals,royals:whitesox,cubs:marlins,rangers:mets,rockies:diamondbacks,phillies:brewers,redsox:guardians,yankees:rays,braves:reds,athletics:astros,mariners:angels,dodgers:padres
09-25 tigers:pirates,phillies:rays,nationals:mets,bluejays:reds,marlins:braves,royals:guardians,whitesox:rockies,brewers:cardinals,twins:rangers,athletics:astros,padres:diamondbacks,mariners:angels,giants:dodgers,redsox:cubs,redsox:cubs,yankees:orioles,yankees:orioles
09-26 nationals:mets,tigers:pirates,bluejays:reds,giants:dodgers,twins:rangers,marlins:braves,royals:guardians,whitesox:rockies,brewers:cardinals,phillies:rays,padres:diamondbacks,athletics:astros,mariners:angels
09-27 nationals:mets,phillies:rays,redsox:cubs,athletics:astros,giants:dodgers,bluejays:reds,royals:guardians,tigers:pirates,padres:diamondbacks,mariners:angels,twins:rangers,whitesox:rockies,marlins:braves,brewers:cardinals,yankees:orioles`;
  const GAMES_PER_TEAM = Object.freeze({ highschool: 28, kbo: 144, npb: 143, mlb: 162 });
  const INTERNATIONAL_ROADMAP = Object.freeze([
    Object.freeze({ name: 'U-18 대표팀', window: '고교 16~18세 / 해당 연도 대회', status: '계획', release: 'v0.4', detail: '고교 성적·나이 기준 발탁, 대표팀 기록 분리, 소속팀 일정 충돌 처리부터 구현.' }),
    Object.freeze({ name: '월드 베이스볼 클래식', window: '2026년 3월 5~17일 기준', status: '계획', release: 'v0.5', detail: '20개국 조별리그와 8강 토너먼트, 투구수·휴식 규정과 프로리그 출전 공백 구현.' }),
    Object.freeze({ name: '아시안게임', window: '2026년 9월 21~27일 야구 일정 기준', status: '계획', release: 'v0.6', detail: '8개국 예선·슈퍼라운드·메달전, 대회별 발탁 기준과 시즌 중 차출 구현.' }),
    Object.freeze({ name: 'WBSC 프리미어12 · 올림픽', window: '2027 프리미어12 / LA28', status: '조사·계획', release: 'v0.7', detail: '해당 대회의 공식 참가 방식·예선·자격 규정을 데이터화한 뒤 추가. 미래 회차 일자는 임의 확정하지 않음.' })
  ]);
  function unpack(text, leagueId, year) {
    return text.trim().split('\n').flatMap(line => {
      const [md, pairs] = line.split(' ');
      return pairs.split(',').map(pair => {
        const [home, away] = pair.split(':');
        return { date: year + '-' + md, home: leagueId + '-' + home, away: leagueId + '-' + away };
      });
    });
  }
  function dayString(date) { return date.toISOString().slice(0, 10); }
  function rounds(ids) {
    const ring = ids.slice(), result = [];
    for (let round = 0; round < ids.length - 1; round++) {
      result.push(Array.from({ length: ids.length / 2 }, (_, i) => [ring[i], ring[ids.length - 1 - i]]));
      ring.splice(1, 0, ring.pop());
    }
    return result;
  }
  function highschoolGames(ids, year) {
    // Fictional 8-school developmental league: four round robins, 28 games per school.
    const pairs = rounds(ids), dates = [];
    const day = new Date(Date.UTC(year, 2, 21));
    while (dates.length < 28) {
      const dow = day.getUTCDay();
      if (dow === 0 || dow === 6) dates.push(dayString(day));
      day.setUTCDate(day.getUTCDate() + 1);
    }
    return dates.flatMap((date, round) => pairs[round % pairs.length].map(([a, b], i) => {
      const flip = (Math.floor(round / pairs.length) + i) % 2;
      return { date, home: flip ? b : a, away: flip ? a : b };
    }));
  }
  function createSchedule(leagueId, year = 2026, teamIds) {
    if (!Object.prototype.hasOwnProperty.call(GAMES_PER_TEAM, leagueId)) throw new Error('지원하지 않는 리그입니다.');
    if (!Number.isInteger(year) || year < 1900 || year > 2200) throw new Error('일정 연도가 올바르지 않습니다.');
    const expected = Data.TEAMS.filter(t => t.leagueId === leagueId).map(t => t.id);
    const ids = teamIds ? teamIds.slice() : expected.slice();
    if (ids.length !== expected.length || new Set(ids).size !== ids.length || ids.some(id => !expected.includes(id))) {
      throw new Error('전체 리그 구단이 필요합니다. 이전 8구단 저장 일정은 별도 경로를 사용하세요.');
    }
    let games, sourceMode, notes;
    if (leagueId === 'highschool') {
      games = highschoolGames(ids, year); sourceMode = 'fictional';
      notes = '가상 고교 8팀의 성장용 주말리그: 팀당 28경기. 실제 고교 대진·대회 통합 일정이 아닙니다.';
    } else if (leagueId === 'kbo' || leagueId === 'npb') {
      games = unpack(leagueId === 'kbo' ? KBO_2026 : NPB_2026, leagueId, year);
      sourceMode = year === 2026 ? 'official' : 'modeled';
      notes = year === 2026
        ? '2026년 공식 자료의 실제 정규시즌 경기 날짜·홈·원정 대진. 취소 경기는 제외하고 재편성된 개최일을 사용합니다.'
        : '2026년 공식 정규시즌 대진의 월·일을 현재 커리어 연도로 옮긴 가상 일정입니다. 해당 연도 실제 일정이 아닙니다.';
    } else {
      games = unpack(MLB_2026, leagueId, year);
      sourceMode = year === 2026 ? 'official-adapted' : 'modeled';
      if (year === 2026) games = games.filter(game => !(game.date === '2026-09-27' && game.home === 'mlb-yankees' && game.away === 'mlb-orioles'));
      notes = year === 2026
        ? '2026년 실제 정규시즌 2,429경기입니다. 최종전 우천 취소로 양키스·볼티모어는 161경기, 나머지는 162경기입니다. 6월 16일 SF@ATL 서스펜디드 경기는 원래 날짜에 한 경기로 처리합니다.'
        : '2026년 공식 대진을 바탕으로 한 162경기 게임용 템플릿의 월·일을 현재 연도로 옮겼습니다. 해당 연도 실제 일정이 아닙니다.';
      for (const game of games) {
        if (game.date.slice(5) === '09-27' && game.home === 'mlb-yankees' && game.away === 'mlb-orioles') game.realWorldNote = '미래 가상 시즌용 경기: 2026년에 취소된 대진을 포함';
        if (game.date.slice(5) === '06-16' && game.home === 'mlb-braves' && game.away === 'mlb-giants') game.realWorldNote = '2026 실제 서스펜디드 경기 — 원래 날짜에 한 경기로 처리';
      }
    }
    games.sort((a, b) => a.date.localeCompare(b.date));
    const perDay = new Map();
    for (const game of games) {
      const key = game.date + '/' + game.home + '/' + game.away;
      const sequence = (perDay.get(key) || 0) + 1;
      perDay.set(key, sequence); game.gameNumber = sequence;
    }
    const gamesPerTeamById = Object.fromEntries(ids.map(id => [id, 0]));
    for (const game of games) { gamesPerTeamById[game.home]++; gamesPerTeamById[game.away]++; }
    return { leagueId, year, games, gamesPerTeam: GAMES_PER_TEAM[leagueId], gamesPerTeamById,
      openingDate: games[0].date, endDate: games[games.length - 1].date,
      sourceMode, templateYear: 2026, notes };
  }
  return Object.freeze({ GAMES_PER_TEAM, INTERNATIONAL_ROADMAP, createSchedule });
});
