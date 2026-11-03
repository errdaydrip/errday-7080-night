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
 const E=(s,ev,d)=>new Promise(r=>s.emit(ev,d,r));const AT=s=>s.emit('move',{pos:[-9,0,-7.6],rot:0});const once=(s,ev)=>new Promise(r=>s.once(ev,r));
 await new Promise(r=>sp.emit('join',{nick:'구경',clientId:'p0'},r));
 const ids={};c.on('connect',()=>{});ids.o=o.id;ids.c=c.id;
 a.strictEqual((await E(c,'poolChallenge',{t:0,to:o.id})).ok,false,'far target rejected');AT(c);AT(o);AT(sp);await W(150);
 // 초대 → 거절 알림
 let inv=once(o,'poolInvite');a.ok((await E(c,'poolChallenge',{t:0,to:o.id})).ok);let iv=await inv;a.strictEqual(iv.t,0);let res=once(c,'poolChallengeResult');await E(o,'poolAnswer',{from:c.id,accept:false});a.strictEqual((await res).ok,false,'declined');
 // 초대 → 수락 → 2인 게임 (TABLE 2)
 inv=once(o,'poolInvite');await E(c,'poolChallenge',{t:0,to:o.id});await inv;let st1=once(c,'poolStart');a.ok((await E(o,'poolAnswer',{from:c.id,accept:true})).ok);a.strictEqual((await st1).t,0);
 a.strictEqual((await E(o,'poolShoot',{t:0,a:0,p:1})).ok,false,'not your turn');
 a.ok((await E(c,'poolShoot',{t:0,a:0,p:1})).ok);await W(300);a.ok(S.length>=1&&S[0].state.t===0,'spectator sees shot on table 2');
 // 3번째 사람 합류 (같은 테이블, 판 유지)
 const sp3=io(U,{forceNew:true});await new Promise(r=>sp3.emit('join',{nick:'셋째',clientId:'p3'},r));a.strictEqual((await E(o,'poolChallenge',{t:0,to:sp3.id})).ok,false,'no invite mid-game');
 let gs=null;sp.on('poolState',x=>{if(x.t===0)gs=x;});a.strictEqual((await E(sp3,'poolQueue',{join:true})).pos,1);await W(200);a.strictEqual(gs.players.length,2,'no mid-game join');a.strictEqual(gs.queue.length,1,'queued');
 // 다른 테이블에 사람 있는 상태로 테이블1 침범 불가
 a.strictEqual((await E(sp,'poolChallenge',{t:0,to:c.id})).ok,false,'busy table');a.strictEqual((await E(sp,'poolQueue',{join:true})).pos,2);let vv=await E(c,'poolNew',{t:0});a.deepStrictEqual([vv.n,vv.m],[1,2],'vote 1/2');
 // 나가면 남은 2명 계속
 sp3.emit('poolLeave');await W(300);a.strictEqual(gs.players.length,2);a.strictEqual(gs.queue.length,1);
 const ns=once(sp,'poolStart'),pw=once(sp,'poolWin');c.disconnect();const wst=await pw;a.strictEqual(wst.over.win,'큐2','remaining player wins');a.ok(/기권패/.test(wst.msg));await W(400);await ns;await W(200);a.deepStrictEqual(gs.players.map(p=>p.nick),['구경','큐2'],'next game from queue');a.strictEqual(gs.shots,0);
 const rep=P.simulate(S[0].before,S[0].a,S[0].p);a.deepStrictEqual(rep.balls.filter(x=>x.n!==0),S[0].state.balls.filter(x=>x.n!==0),'replay matches server');
 c.close();o.close();sp.close();sp3.close();console.log('pool OK');srv.kill();process.exit(0);}catch(e){console.error(e);srv.kill();process.exit(1);}})();
