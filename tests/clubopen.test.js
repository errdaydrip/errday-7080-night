// node tests/clubopen.test.js — 관리자 나이트 문 열기/닫기: 관리자만, 모두에게 동기, 재시작 후 유지
const a=require('assert'),os=require('os'),path=require('path'),fs=require('fs'),{spawn}=require('child_process');const {io}=require('socket.io-client');const W=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=+(process.env.PORT||8080)+29,U='http://localhost:'+PORT,ST=path.join(os.tmpdir(),'clubopen-state.json');try{fs.unlinkSync(ST);}catch(e){}
const start=()=>spawn('node',['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT,STATE_FILE:ST,WAITER_OFF:'1',TICKER_OFF:'1'},stdio:'ignore'});
const em=(c,ev,d)=>new Promise(r=>c.emit(ev,d,r));const login=async()=>(await (await fetch(U+'/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:process.env.ADMIN_PASSWORD||'6651'})})).json()).token;
(async()=>{let srv=start();await W(1500);try{const tok=await login();
 const c=io(U,{forceNew:true}),o=io(U,{forceNew:true});let d1=null,d2=null;c.on('clubDoor',d=>d1=d);o.on('clubDoor',d=>d2=d);await W(500);a.strictEqual(d2.open,true,'open by default');
 a.strictEqual((await em(c,'setClubDoor',{token:'x',open:false})).ok,false,'admin only');a.strictEqual((await em(c,'setClubDoor',{token:tok,open:false})).ok,true);await W(200);a.deepStrictEqual([d1.open,d2.open,d2.by],[false,false,true]);
 c.close();o.close();srv.kill();await W(500);srv=start();await W(1500);const n=io(U,{forceNew:true});let d3=null;n.on('clubDoor',d=>d3=d);await W(500);a.strictEqual(d3.open,false,'closed persisted');
 a.strictEqual((await em(n,'setClubDoor',{token:await login(),open:true})).ok,true);n.close();console.log('clubopen OK');srv.kill();process.exit(0);}catch(e){console.error(e);srv.kill();process.exit(1);}})();
