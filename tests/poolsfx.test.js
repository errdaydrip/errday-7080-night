// 당구 소리 이벤트 중계 (본인 제외, 형식 정리)
const a=require('assert'),os=require('os'),path=require('path'),{spawn}=require('child_process');const {io}=require('socket.io-client');const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const PORT=+(process.env.PORT||8080)+47,U='http://localhost:'+PORT;const srv=spawn('node',['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT,STATE_FILE:path.join(os.tmpdir(),'psfx.json'),WAITER_OFF:'1',TICKER_OFF:'1'},stdio:'ignore'});await W(1500);
 try{const E=(s,ev,d)=>new Promise(r=>s.emit(ev,d,r));const c=io(U,{forceNew:true}),o=io(U,{forceNew:true});await E(c,'join',{nick:'S1',clientId:'s1'});await E(o,'join',{nick:'S2',clientId:'s2'});
 let mine=0,got=null;c.on('poolSfx',()=>mine++);o.on('poolSfx',d=>got=d);c.emit('poolSfx',{t:1,e:[[0,'cue',.5],[100,'evil',9]]});await W(300);
 a.ok(got&&got.t===1);a.deepStrictEqual(got.e,[[0,'cue',.5],[100,'ball',1]]);a.strictEqual(mine,0,'not echoed to self');
 c.close();o.close();console.log('poolsfx OK');srv.kill();process.exit(0);}catch(e){console.error(e);srv.kill();process.exit(1);}})();
