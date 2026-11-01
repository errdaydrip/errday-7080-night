// BAN_MS=3000 node server.js ; node tests/kick.test.js
const {io}=require('socket.io-client');const assert=require('assert');const W=ms=>new Promise(r=>setTimeout(r,ms));
const U=process.env.URL||('http://localhost:'+(process.env.PORT||8080));const c=()=>io(U,{forceNew:true,reconnection:false});
const join=(s,p)=>new Promise(r=>s.emit('join',p,r));const em=(s,e,a)=>new Promise(r=>s.emit(e,a,r));
(async()=>{const tok=(await (await fetch(U+'/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:process.env.PW||'6651'})})).json()).token;assert(tok);
 const t=Date.now()%10000;const adm=c();await W(300);assert((await join(adm,{nick:'Adm'+t,clientId:'KADM'+t})).ok);
 const v=c();await W(300);const vn='Vic'+t;assert((await join(v,{nick:vn,clientId:'KV'+t})).ok);const vid=v.id;
 const kicked=new Promise(r=>v.once('kicked',r));const left=[],chats=[];adm.on('leave',id=>left.push(id));adm.on('chat',m=>chats.push(m.text));
 assert.strictEqual((await em(adm,'adminKick',{token:'bad',id:vid})).ok,false,'non-admin rejected');
 assert.strictEqual((await em(adm,'adminKick',{token:tok,id:adm.id})).ok,false,'no self kick');
 const l=await em(adm,'adminList',tok);assert(l.ok&&l.list.some(p=>p.id===vid));
 assert((await em(adm,'adminKick',{token:tok,id:vid})).ok);await kicked;await W(500);
 assert(!v.connected,'disconnected');assert(left.includes(vid),'avatar removed at once');assert(chats.some(x=>x.includes(vn+' 님이 강퇴')));
 const v2=c();await W(300);const r=await join(v2,{nick:'Other'+t,clientId:'KV'+t});assert.strictEqual(r.error,'kicked','same client blocked');
 const v3=c();await W(300);const r3=await join(v3,{nick:vn,clientId:'NEW'+t});assert.strictEqual(r3.error,'kicked','same nick blocked');
 console.log('kick ok');process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
