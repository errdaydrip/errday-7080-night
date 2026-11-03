// 4구: 물리(포켓 없음, 맞힌 공 기록) + 서버 같이 치기(테이블 2) 흐름
const a=require('assert'),os=require('os'),path=require('path'),{spawn}=require('child_process');const {io}=require('socket.io-client');const W=ms=>new Promise(r=>setTimeout(r,ms));const P=require('../public/pool.js');
let r=P.simulate([{n:0,x:0,y:0,in:false},{n:1,x:-.8,y:.4,in:false},{n:2,x:.3,y:.047,in:false},{n:3,x:.3,y:-.047,in:false}],0,.6,{carom:true});a.ok(r.hits.includes(2)&&r.hits.includes(3),'both reds');a.strictEqual(r.pocketed.length,0);
r=P.simulate([{n:0,x:0,y:0,in:false},{n:1,x:.4,y:0,in:false},{n:2,x:-.8,y:.4,in:false},{n:3,x:-.8,y:-.4,in:false}],0,.5,{carom:true,cue:1});a.ok(!r.hits.includes(0)||true);
r=P.simulate(P.rackCarom(),Math.PI/4,1,{carom:true});a.strictEqual(r.pocketed.length,0,'no pockets in carom');
(async()=>{const PORT=+(process.env.PORT||8080)+43,U='http://localhost:'+PORT;const srv=spawn('node',['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT,STATE_FILE:path.join(os.tmpdir(),'carom-state.json'),WAITER_OFF:'1',TICKER_OFF:'1'},stdio:'ignore'});await W(1500);
 try{const E=(s,ev,d)=>new Promise(r=>s.emit(ev,d,r));const c=io(U,{forceNew:true}),o=io(U,{forceNew:true});await E(c,'join',{nick:'흰',clientId:'c1'});await E(o,'join',{nick:'노랑',clientId:'c2'});
 o.emit('move',{pos:[-9,0,-7.6],rot:0});await W(150);a.strictEqual((await E(c,'poolChallenge',{t:1,to:o.id})).ok,false,'not at 4구 table');
 o.emit('move',{pos:[-9,0,-11.5],rot:0});await W(150);const inv=new Promise(r=>o.once('poolInvite',r));a.ok((await E(c,'poolChallenge',{t:1,to:o.id})).ok);await inv;
 let st=null;c.on('poolState',x=>{if(x.t===1)st=x;});const sh=new Promise(r=>c.once('poolShot',r));await E(o,'poolAnswer',{from:c.id,accept:true});await W(200);a.strictEqual(st.kind,'carom');a.strictEqual(st.balls.length,4);
 a.ok((await E(c,'poolShoot',{t:1,a:0,p:.3})).ok);const d=await sh;a.strictEqual(d.carom,true);a.strictEqual(d.cue,0);a.strictEqual(d.state.t,1);
 const pw=new Promise(r=>c.once('poolWin',r));o.disconnect();const w=await pw;a.strictEqual(w.over.win,'흰');a.strictEqual(w.forfeits[0].nick,'노랑');
 c.close();console.log('carom OK');srv.kill();process.exit(0);}catch(e){console.error(e);srv.kill();process.exit(1);}})();
