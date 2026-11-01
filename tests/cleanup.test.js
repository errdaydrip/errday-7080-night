// GRACE_MS=30000 node server.js ; node tests/cleanup.test.js
const {io}=require('socket.io-client');const assert=require('assert');const W=ms=>new Promise(r=>setTimeout(r,ms));
const U='http://localhost:'+(process.env.PORT||8080);const c=()=>io(U,{forceNew:true});
const join=(s,p)=>new Promise(r=>s.emit('join',p,r));const em=(s,e,a)=>new Promise(r=>s.emit(e,a,r));
(async()=>{const tok=(await (await fetch(U+'/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:process.env.PW||'6651'})})).json()).token;assert(tok,'login');
 const adm=c();await W(300);assert((await join(adm,{nick:'Adm'+Date.now()%1000,clientId:'ADM'})).ok);
 const g=c();await W(300);assert((await join(g,{nick:'Ghost'+Date.now()%1000,clientId:'GH'})).ok);const gid=g.id;g.disconnect();await W(300);
 const u=c();await W(300);assert((await join(u,{nick:'Usr'+Date.now()%1000,clientId:'US'})).ok);
 const snap=new Promise(r=>u.once('snapshot',r));const left=[];u.on('leave',id=>left.push(id));
 assert.strictEqual((await em(u,'adminCleanup','bad')).ok,false,'non-admin rejected');
 const r=await em(adm,'adminCleanup',tok);assert(r.ok&&r.removed>=1,JSON.stringify(r));
 const s=await snap;assert(!s[gid],'ghost gone from snapshot');assert(s[u.id]&&s[adm.id],'live kept');assert(left.includes(gid));
 console.log('cleanup ok removed',r.removed);process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
