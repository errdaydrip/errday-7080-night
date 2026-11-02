// 🎯 다트 규칙: 판정(세그먼트) + 하이스코어(3R/8R, 3발씩 합계)
const ORD=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
// x,y: 판 반지름=1 (더블 바깥선). y 위쪽이 +
function score(x,y){const r=Math.hypot(x,y);if(r<.05)return{n:25,m:2,pts:50,label:'BULL'};if(r<.11)return{n:25,m:1,pts:25,label:'25'};if(r>1)return{n:0,m:0,pts:0,label:'빗나감'};
 const deg=(90-Math.atan2(y,x)*180/Math.PI+9+360)%360,n=ORD[Math.floor(deg/18)%20];const m=r>.92?2:(r>.55&&r<.62)?3:1;return{n,m,pts:n*m,label:(m===2?'D':m===3?'T':'')+n};}
function newGame(rounds){return{mode:'high',rounds:rounds===8?8:3,players:[],t:Date.now()};}
// 혼자서도 바로, 차례 없이 각자 3발씩 rounds 라운드
function throwDart(g,id,x,y,nick){let p=g.players.find(q=>q.id===id);if(!p){g.players.push(p={id,nick:nick||'손님',score:0,round:1,thrown:0});if(g.players.length>6)g.players.splice(0,g.players.length-6);}
 g.t=Date.now();const h=score(x,y);p.score+=h.pts;p.thrown++;let done=null;if(p.thrown>=3){p.thrown=0;p.round++;if(p.round>g.rounds){done={nick:p.nick,score:p.score};g.players.splice(g.players.indexOf(p),1);}}
 return{ok:true,hit:h,player:p.nick,done,me:done?{score:done.score,round:g.rounds+1,thrown:0}:{score:p.score,round:p.round,thrown:p.thrown}};}
const pub=g=>({mode:'high',rounds:g.rounds,players:g.players.map(p=>({nick:p.nick,id:p.id,score:p.score,round:p.round,thrown:p.thrown}))});
module.exports={score,newGame,throwDart,pub};
