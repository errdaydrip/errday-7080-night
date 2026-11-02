// node tests/clearchat.test.js — 관리자만 채팅 기록 전체 삭제, 모두에게 알림
const a=require('assert'),os=require('os'),path=require('path'),{spawn}=require('child_process');const {io}=require('socket.io-client');const W=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=+(process.env.PORT||8080)+33,U='http://localhost:'+PORT;const srv=spawn('node',['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT,STATE_FILE:path.join(os.tmpdir(),'cc-state.json'),WAITER_OFF:'1',TICKER_OFF:'1'},stdio:'ignore'});
(async()=>{await W(1500);try{const tok=(await (await fetch(U+'/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:process.env.ADMIN_PASSWORD||'6651'})})).json()).token;
 const c=io(U,{forceNew:true});await new Promise(r=>c.emit('join',{nick:'cc',clientId:'cc1'},r));c.emit('chat','hello');await W(300);let cleared=0;c.on('chatCleared',()=>cleared++);
 a.strictEqual((await new Promise(r=>c.emit('clearChat',{token:'x'},r))).ok,false);a.strictEqual((await new Promise(r=>c.emit('clearChat',{token:tok},r))).ok,true);await W(200);a.strictEqual(cleared,1);
 const n=io(U,{forceNew:true});let h=null;n.on('chatHistory',x=>h=x);await W(500);a.strictEqual(h.length,0);c.close();n.close();console.log('clearchat OK');srv.kill();process.exit(0);}catch(e){console.error(e);srv.kill();process.exit(1);}})();
