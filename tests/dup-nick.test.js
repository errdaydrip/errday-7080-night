// node tests/dup-nick.test.js  (server must run on :8080)
const {io}=require('socket.io-client');const assert=require('assert');const W=ms=>new Promise(r=>setTimeout(r,ms));
const U='http://localhost:'+(process.env.PORT||8080);const c=()=>io(U,{forceNew:true});
const join=(s,p)=>new Promise(r=>s.emit('join',p,r));
(async()=>{const a=c(),b=c(),w=c();const left=[];w.on('leave',id=>left.push(id));await W(500);
 assert.deepStrictEqual(await join(a,{nick:'Tester',clientId:'A'}),{ok:true});const aid=a.id;
 assert.strictEqual((await join(b,{nick:' tester ',clientId:'B'})).ok,false,'dup nick rejected');
 assert.strictEqual((await join(b,{nick:'Other',clientId:'B'})).ok,true);
 const a2=c();await W(300);assert.strictEqual((await join(a2,{nick:'Tester',clientId:'A'})).ok,true,'same client rejoin');
 await W(500);assert(left.includes(aid),'old socket leave');assert(!a.connected,'old socket disconnected');
 const w2=c();const snap=await new Promise(r=>w2.on('init',r));const nicks=Object.values(snap.players).map(p=>p.nick);
 assert.strictEqual(nicks.filter(n=>n==='Tester').length,1);assert(!Object.values(snap.players).some(p=>p.cid),'cid hidden');
 console.log('dup-nick OK');process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
