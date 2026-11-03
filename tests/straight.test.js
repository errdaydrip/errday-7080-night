// 포켓볼 스트레이트 풀 모드: 신청 시 모드 선택, 상태에 표시, 샷 동작
const a=require('assert'),os=require('os'),path=require('path'),{spawn}=require('child_process');const {io}=require('socket.io-client');const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const PORT=+(process.env.PORT||8080)+49,U='http://localhost:'+PORT;const srv=spawn('node',['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT,STATE_FILE:path.join(os.tmpdir(),'str.json'),WAITER_OFF:'1',TICKER_OFF:'1'},stdio:'ignore'});await W(1500);
 try{const E=(s,ev,d)=>new Promise(r=>s.emit(ev,d,r));const c=io(U,{forceNew:true}),o=io(U,{forceNew:true});await E(c,'join',{nick:'P1',clientId:'q1'});await E(o,'join',{nick:'P2',clientId:'q2'});o.emit('move',{pos:[-9,0,-6.4],rot:0});await W(150);
 let st=null;c.on('poolState',x=>{if(x.t===0)st=x;});const inv=new Promise(r=>o.once('poolInvite',r));a.ok((await E(c,'poolChallenge',{t:0,to:o.id,mode:'s'})).ok);a.strictEqual((await inv).mode,'s');await E(o,'poolAnswer',{from:c.id,accept:true});await W(200);
 a.strictEqual(st.mode,'s');a.strictEqual(st.max,4);const sh=new Promise(r=>c.once('poolShot',r));a.ok((await E(c,'poolShoot',{t:0,a:Math.PI/2,p:.05})).ok);const d=await sh;a.ok(/파울|다음/.test(d.state.msg),d.state.msg);
 c.close();o.close();console.log('straight OK');srv.kill();process.exit(0);}catch(e){console.error(e);srv.kill();process.exit(1);}})();
