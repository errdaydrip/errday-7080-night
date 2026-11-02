// node tests/dart.test.js — 다트: 던지면 모두에게 같은 결과 + 랭킹, 1.5초 쿨다운
const a=require('assert'),os=require('os'),path=require('path'),{spawn}=require('child_process');const {io}=require('socket.io-client');const W=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=+(process.env.PORT||8080)+31,U='http://localhost:'+PORT;
const srv=spawn('node',['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT,STATE_FILE:path.join(os.tmpdir(),'dart-state.json'),WAITER_OFF:'1',TICKER_OFF:'1'},stdio:'ignore'});
(async()=>{await W(1500);try{const c=io(U,{forceNew:true}),o=io(U,{forceNew:true});const A=[],B=[];c.on('dart',d=>A.push(d));o.on('dart',d=>B.push(d));
 await new Promise(r=>c.emit('join',{nick:'다트왕',clientId:'d1'},r));c.emit('dart');c.emit('dart');await W(400);
 a.strictEqual(A.length,1,'cooldown');a.deepStrictEqual(A[0],B[0],'same for all');a.ok(A[0].pts>=0&&A[0].pts<=60);a.strictEqual(A[0].top[0].nick,'다트왕');a.strictEqual(A[0].top[0].total,A[0].pts);
 await W(1300);c.emit('dart');await W(300);a.strictEqual(A.length,2);a.strictEqual(A[1].top[0].total,A[0].pts+A[1].pts);
 const n=io(U,{forceNew:true});let t=null;n.on('dartTop',x=>t=x);await W(400);a.strictEqual(t[0].throws,2);
 c.close();o.close();n.close();console.log('dart OK');srv.kill();process.exit(0);}catch(e){console.error(e);srv.kill();process.exit(1);}})();
