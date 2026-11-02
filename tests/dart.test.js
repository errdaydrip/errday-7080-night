// node tests/dart.test.js — 다트: 세그먼트 판정, 하이스코어 3R(기본)/8R, 서버 동기/차례
const a=require('assert'),os=require('os'),path=require('path'),{spawn}=require('child_process');const {io}=require('socket.io-client');const W=ms=>new Promise(r=>setTimeout(r,ms));const DG=require('../dartgame');
const P=(n,ring)=>{const i=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5].indexOf(n),ang=(90-i*18)*Math.PI/180,r={s:.4,t:.58,d:.96}[ring];return[Math.cos(ang)*r,Math.sin(ang)*r];};
a.strictEqual(DG.score(0,0).pts,50);a.strictEqual(DG.score(0,.08).pts,25);a.strictEqual(DG.score(...P(20,'t')).pts,60);a.strictEqual(DG.score(...P(19,'d')).pts,38);a.strictEqual(DG.score(...P(6,'s')).pts,6);a.strictEqual(DG.score(0,1.1).pts,0);
let g=DG.newGame(8);a.strictEqual(g.mode,'high');a.strictEqual(DG.newGame().rounds,3);let last;for(let i=0;i<24;i++){last=DG.throwDart(g,'A',...P(20,'t'),'a');DG.throwDart(g,'B',...P(1,'s'),'b');}
a.strictEqual(last.done.score,1440,'solo, no turns');a.ok(!g.players.find(p=>p.id==='A'),'track cleared after finish');
(async()=>{const PORT=+(process.env.PORT||8080)+31,U='http://localhost:'+PORT;const srv=spawn('node',['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT,STATE_FILE:path.join(os.tmpdir(),'dart-state.json'),WAITER_OFF:'1',TICKER_OFF:'1'},stdio:'ignore'});await W(1500);
 try{const c=io(U,{forceNew:true}),o=io(U,{forceNew:true});const A=[],B=[];c.on('dartState',d=>A.push(d));o.on('dartState',d=>B.push(d));
 await new Promise(r=>c.emit('join',{nick:'다트왕',clientId:'d1'},r));await new Promise(r=>o.emit('join',{nick:'둘째',clientId:'d2'},r));await W(300);
 a.ok((await new Promise(r=>c.emit('dartNew',{b:1,rounds:8},r))).ok);await W(100);const h=await new Promise(r=>c.emit('dart',{b:1,x:0,y:0},r));a.ok(h.ok&&h.me.thrown===1,'solo starts immediately');await W(750);a.ok((await new Promise(r=>o.emit('dart',{b:1,x:0,y:0},r))).ok,'other player throws without waiting');
 await W(300);const la=A[A.length-1],lb=B[B.length-1];a.deepStrictEqual(la,lb,'synced');a.strictEqual(la.b,1);a.strictEqual(la.g.players[0].score,h.hit.pts);a.strictEqual(la.g.players.length,2);a.strictEqual(la.g.mode,'high');
 for(let i=0;i<9;i++){await W(720);await new Promise(r=>c.emit('dart',{b:0,x:0,y:0},r));}await W(300);const L=A.filter(d=>d.b===0).pop();a.strictEqual(L.recs.length,1,'record after finish');a.strictEqual(L.recs[0].rounds,3);a.strictEqual(L.recs[0].nick,'다트왕');
 c.close();o.close();console.log('dart OK');srv.kill();process.exit(0);}catch(e){console.error(e);srv.kill();process.exit(1);}})();
