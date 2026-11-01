// node tests/chat-history.test.js  (server must run on :8080)
const {io}=require('socket.io-client');const assert=require('assert');const W=ms=>new Promise(r=>setTimeout(r,ms));
const U='http://localhost:'+(process.env.PORT||8080);
(async()=>{const a=io(U,{forceNew:true});await W(300);await new Promise(r=>a.emit('join',{nick:'Hist',clientId:'H'},r));
 for(let i=0;i<55;i++)a.emit('chat','msg<b>'+i);await W(800);
 const b=io(U,{forceNew:true});const h=await new Promise(r=>b.on('chatHistory',r));
 assert.strictEqual(h.length,50);assert.strictEqual(h[49].text,'msg<b>54');assert.strictEqual(h[0].nick,'Hist');assert(h[0].t>0);
 assert(!h.some(m=>m.sys),'no sys');console.log('chat-history OK');process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
