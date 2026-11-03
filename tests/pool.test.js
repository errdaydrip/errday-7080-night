// node tests/pool.test.js — 당구: 결정적 물리, 포켓/쿠션, 혼자 연습, 2인 차례, 스크래치, 8번 규칙, 동기화
const a=require('assert'),os=require('os'),path=require('path'),{spawn}=require('child_process');const {io}=require('socket.io-client');const W=ms=>new Promise(r=>setTimeout(r,ms));const P=require('../public/pool.js');
let b=P.rack();a.strictEqual(b.length,16);const r1=P.simulate(b,0,1),r2=P.simulate(b,0,1);a.deepStrictEqual(r1.balls,r2.balls,'deterministic');a.strictEqual(r1.firstHit!==null,true);
// 큐볼을 포켓으로 바로: 스크래치
let t=[{n:0,x:P.L/2-.3,y:P.Wd/2-.3,in:false},{n:3,x:-.5,y:0,in:false}];let r=P.simulate(t,Math.PI/4,.6);a.ok(r.pocketed.includes(0),'cue into corner pocket');
// 쿠션 반사 후 멈춤
t=[{n:0,x:0,y:0,in:false}];r=P.simulate(t,0,.5);a.ok(!r.balls[0].in&&Math.abs(r.balls[0].x)<P.L/2);
(async()=>{const PORT=+(process.env.PORT||8080)+37,U='http://localhost:'+PORT;const srv=spawn('node',['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT,STATE_FILE:path.join(os.tmpdir(),'pool-state.json'),WAITER_OFF:'1',TICKER_OFF:'1'},stdio:'ignore'});await W(1500);
 try{const c=io(U,{forceNew:true}),o=io(U,{forceNew:true}),sp=io(U,{forceNew:true});const S=[];sp.on('poolShot',d=>S.push(d));
 await new Promise(r=>c.emit('join',{nick:'큐1',clientId:'p1'},r));await new Promise(r=>o.emit('join',{nick:'큐2',clientId:'p2'},r));
 let j=await new Promise(r=>c.emit('poolJoin',{},r));a.ok(j.ok);a.strictEqual(j.state.players.length,1);
 a.ok((await new Promise(r=>c.emit('poolShoot',{a:0,p:1},r))).ok,'solo shot');await W(300);a.strictEqual(S.length,1,'spectator gets shot');
 const rep=P.simulate(S[0].before,S[0].a,S[0].p);a.deepStrictEqual(rep.balls.filter(x=>x.n!==0),S[0].state.balls.filter(x=>x.n!==0),'replay matches server');
 j=await new Promise(r=>o.emit('poolJoin',{},r));a.ok(j.ok);a.strictEqual(j.state.players.length,2);a.strictEqual(j.state.balls.filter(x=>x.in).length,0,'new rack for 2p');
 a.strictEqual((await new Promise(r=>o.emit('poolShoot',{a:0,p:1},r))).ok,false,'not your turn');await W(4000);
 a.ok((await new Promise(r=>c.emit('poolShoot',{a:Math.PI/2,p:.08},r))).ok);await W(2500);const last=S[S.length-1].state;
 a.strictEqual(last.turn,1,'turn passes when nothing pocketed');
 const sp3=io(U,{forceNew:true});await new Promise(r=>sp3.emit('join',{nick:'구경',clientId:'p3'},r));a.strictEqual((await new Promise(r=>sp3.emit('poolJoin',{},r))).ok,false,'full');
 c.disconnect();await W(400);let st=null;o.on('poolState',x=>st=x);await W(10);sp.emit('poolLeave');await W(300);
 c.close();o.close();sp.close();sp3.close();console.log('pool OK');srv.kill();process.exit(0);}catch(e){console.error(e);srv.kill();process.exit(1);}})();
