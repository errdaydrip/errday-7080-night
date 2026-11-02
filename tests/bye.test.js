// node tests/bye.test.js — 택시 '집으로 돌아가기': bye 하면 유예 없이 바로 퇴장
const a=require('assert'),os=require('os'),path=require('path'),{spawn}=require('child_process');const {io}=require('socket.io-client');const W=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=+(process.env.PORT||8080)+35,U='http://localhost:'+PORT;const srv=spawn('node',['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT,STATE_FILE:path.join(os.tmpdir(),'bye-state.json'),WAITER_OFF:'1',TICKER_OFF:'1',GRACE_MS:'30000'},stdio:'ignore'});
(async()=>{await W(1500);try{const c=io(U,{forceNew:true}),o=io(U,{forceNew:true});let left=null;o.on('leave',id=>left=id);
 await new Promise(r=>c.emit('join',{nick:'집에감',clientId:'b1'},r));await W(200);const id=c.id;await new Promise(r=>c.emit('bye',r));c.disconnect();await W(500);a.strictEqual(left,id,'left immediately (no 30s ghost)');
 const n=io(U,{forceNew:true});let ps=null;n.on('init',d=>ps=d.players);await W(500);a.ok(!Object.values(ps).some(p=>p.nick==='집에감'));c.close();o.close();n.close();console.log('bye OK');srv.kill();process.exit(0);}catch(e){console.error(e);srv.kill();process.exit(1);}})();
