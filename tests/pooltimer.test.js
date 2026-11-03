// 당구 10초 턴 타이머(테스트는 1초) + 새 게임 전원 동의
const a=require('assert'),os=require('os'),path=require('path'),{spawn}=require('child_process');const {io}=require('socket.io-client');const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const PORT=+(process.env.PORT||8080)+41,U='http://localhost:'+PORT;const srv=spawn('node',['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT,POOL_TURN_MS:'1000',STATE_FILE:path.join(os.tmpdir(),'pt-state.json'),WAITER_OFF:'1',TICKER_OFF:'1'},stdio:'ignore'});await W(1500);
 try{const E=(s,ev,d)=>new Promise(r=>s.emit(ev,d,r));const c=io(U,{forceNew:true}),o=io(U,{forceNew:true});await E(c,'join',{nick:'A',clientId:'t1'});await E(o,'join',{nick:'B',clientId:'t2'});
 const inv=new Promise(r=>o.once('poolInvite',r));await E(c,'poolChallenge',{t:0,to:o.id});await inv;let st=null;c.on('poolState',x=>st=x);await E(o,'poolAnswer',{from:c.id,accept:true});await W(200);a.strictEqual(st.turn,0);
 await W(1700);a.strictEqual(st.turn,1,'timeout passes turn');a.ok(/시간 초과/.test(st.msg));
 await E(c,'poolNew',{t:0});await E(c,'poolNew',{t:0});await W(100);a.strictEqual(st.votes.length,0,'vote cancel');await E(c,'poolNew',{t:0});const v=await E(o,'poolNew',{t:0});a.strictEqual(v.n,2);await W(100);a.ok(/새 게임/.test(st.msg));
 c.close();o.close();console.log('pooltimer OK');srv.kill();process.exit(0);}catch(e){console.error(e);srv.kill();process.exit(1);}})();
