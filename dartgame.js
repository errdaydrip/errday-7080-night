// 🎯 다트 규칙: 판정(세그먼트) + 501(더블 아웃) + 크리켓
const ORD=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
// x,y: 판 반지름=1 (더블 바깥선). y 위쪽이 +
function score(x,y){const r=Math.hypot(x,y);if(r<.05)return{n:25,m:2,pts:50,label:'BULL'};if(r<.11)return{n:25,m:1,pts:25,label:'25'};if(r>1)return{n:0,m:0,pts:0,label:'빗나감'};
 const deg=(90-Math.atan2(y,x)*180/Math.PI+9+360)%360,n=ORD[Math.floor(deg/18)%20];const m=r>.92?2:(r>.55&&r<.62)?3:1;return{n,m,pts:n*m,label:(m===2?'D':m===3?'T':'')+n};}
const CR=[20,19,18,17,16,15,25];
const ROUNDS=8;
function newGame(mode,rounds){return{rounds:rounds===8?8:3,mode:mode==='cricket'?'cricket':mode==='501'?'501':'high',players:[],turn:0,thrown:0,started:false,winner:null,t:Date.now()};}
function addPlayer(g,id,nick){if(g.players.find(p=>p.id===id))return true;if(g.started||g.players.length>=4)return false;g.players.push(g.mode==='high'?{id,nick,score:0,round:1}:g.mode==='501'?{id,nick,score:501,start:501}:{id,nick,pts:0,marks:Object.fromEntries(CR.map(n=>[n,0]))});return true;}
function next(g){g.thrown=0;g.turn=(g.turn+1)%g.players.length;const p=g.players[g.turn];if(p.start!=null)p.start=p.score;}
// 반환: {ok,err,hit,bust,win}
function throwDart(g,id,x,y,nick){
 if(g.mode==='high'){/* 하이스코어: 혼자서도 바로, 차례 없이 각자 3발씩 8라운드 */let p=g.players.find(q=>q.id===id);if(!p){g.players.push(p={id,nick:nick||'손님',score:0,round:1,thrown:0});if(g.players.length>6)g.players.splice(0,g.players.length-6);}
  g.t=Date.now();const h=score(x,y);p.score+=h.pts;p.thrown=(p.thrown||0)+1;let done=null;if(p.thrown>=3){p.thrown=0;p.round++;if(p.round>(g.rounds||ROUNDS)){done={nick:p.nick,score:p.score};g.players.splice(g.players.indexOf(p),1);}}
  return{ok:true,hit:h,player:p.nick,done,me:done?{score:done.score,round:(g.rounds||ROUNDS),thrown:3}:{score:p.score,round:p.round,thrown:p.thrown}};}
 if(g.winner)return{ok:false,err:'게임 끝 — 새 게임을 시작하세요'};const p=g.players[g.turn];if(!p||p.id!==id)return{ok:false,err:p?`${p.nick} 차례예요`:'참가자 없음'};
 g.started=true;g.t=Date.now();const h=score(x,y);let bust=false,win=false;
 let done=null;if(g.mode==='high'){p.score+=h.pts;if(g.thrown===2){p.round++;if(p.round>(g.rounds||ROUNDS)){done={nick:p.nick,score:p.score};if(g.players.every(o=>o.round>(g.rounds||ROUNDS))){const best=g.players.reduce((m,o)=>o.score>m.score?o:m);g.winner=best.nick;return{ok:true,hit:h,win:best.nick===p.nick,player:p.nick,done};}}}}
 else if(g.mode==='501'){const left=p.score-h.pts;if(left<0||left===1||(left===0&&h.m!==2)){bust=true;p.score=p.start;}else{p.score=left;if(left===0)win=true;}}
 else if(CR.includes(h.n)&&h.m){const have=p.marks[h.n],add=h.m,close=Math.min(3-have,add),extra=add-close;p.marks[h.n]=have+close;
  if(extra>0&&g.players.some(o=>o!==p&&o.marks[h.n]<3))p.pts+=extra*(h.n===25?25:h.n);
  if(CR.every(n=>p.marks[n]>=3)&&g.players.every(o=>o===p||o.pts<=p.pts))win=true;}
 if(win){g.winner=p.nick;return{ok:true,hit:h,win,player:p.nick};}
 g.thrown++;if(bust||g.thrown>=3){next(g);if(g.mode==='high')for(let k=0;k<g.players.length&&g.players[g.turn].round>(g.rounds||ROUNDS);k++)next(g);}return{ok:true,hit:h,bust,player:p.nick,done};}
const pub=g=>({mode:g.mode,rounds:g.rounds,turn:g.turn,thrown:g.thrown,started:g.started,winner:g.winner,players:g.players.map(p=>({nick:p.nick,id:p.id,score:p.score,round:p.round,thrown:p.thrown,pts:p.pts,marks:p.marks}))});
module.exports={ROUNDS,score,newGame,addPlayer,throwDart,pub,CR};
