// server must run on :8080
const {io}=require('socket.io-client');const a=require('assert');const W=ms=>new Promise(r=>setTimeout(r,ms));
const U='http://localhost:8080';const join=(s,p)=>new Promise(r=>s.emit('join',p,r));
(async()=>{const s=io(U,{forceNew:true});await W(400);
 a.deepStrictEqual(await join(s,{nick:'개 새끼',clientId:'f1'}),{ok:false,error:'bad'});
 a.deepStrictEqual(await join(s,{nick:'착한손님',clientId:'f1'}),{ok:true});
 const got=new Promise(r=>s.on('chat',m=>{if(!m.sys)r(m.text);}));s.emit('chat','야 씨발 노래 좋다');
 a.strictEqual(await got,'야 *** 노래 좋다');console.log('filter-socket ok');s.close();process.exit();})();
