const a=require('assert');const{clean,isBad}=require('../filter');
const bad=['씨발','시발','씨 발','시1발','ㅅㅂ','ㅆㅂ','ㅂㅅ','ㅈㄹ','병신','븅신','개새끼','개 새 끼','좆같네','니미','느금마','fuck you','f.u.c.k','FUCK','지랄하네','엠창','bitch','씨빨','병신년','ㅄ'];
const good=['안녕하세요','시발점에서 출발','신병 훈련','다시 발견했어','병 신청했어','개새로운 노래','껌 씹어','오늘 신나요','신발 예쁘다','hello','scunthorpe','보지마세요','색깔 이쁘다','에미넴 좋아','노래 좋다','시바견 귀여워','어머니 미소','어머니미소','시방 뭐해'];
for(const t of bad)a.ok(isBad(t),'should block: '+t);
for(const t of good)a.ok(!isBad(t),'false positive: '+t);
a.strictEqual(clean('야 씨발 진짜 좋다'),'야 *** 진짜 좋다');
a.strictEqual(clean('이 노래 시발점'),'이 노래 시발점');
a.strictEqual(clean('ㅅㅂ 좋네'),'*** 좋네');
console.log('filter ok');
