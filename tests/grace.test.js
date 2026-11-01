// GRACE_MS=1500 node server.js ; node tests/grace.test.js
const {io}=require('socket.io-client');const assert=require('assert');const W=ms=>new Promise(r=>setTimeout(r,ms));
const U='http://localhost:'+(process.env.PORT||8080);const c=()=>io(U,{forceNew:true});
const join=(s,p)=>new Promise(r=>s.emit('join',p,r));
(async()=>{const w=c();const ev=[];const mine=new Set();w.on('leave',id=>mine.has(id)&&ev.push('leave:'+id));w.on('chat',m=>m.sys&&/Grace/.test(m.text)&&ev.push(m.text));w.on('rekey',r=>ev.push('rekey'));await W(400);
 const a=c();await W(300);assert((await join(a,{nick:'Grace',clientId:'G1'})).ok);const aid=a.id;mine.add(aid);
 a.emit('move',{pos:[1,0,2],rot:1});a.emit('seat','Y1-0');await W(200);ev.length=0;
 a.disconnect();await W(500);assert(!ev.some(e=>/퇴장|leave/.test(e)),'no leave during grace');
 const a2=c();await W(300);const r=await join(a2,{nick:'Grace',clientId:'G1'});mine.add(a2.id);assert(r.ok&&r.resume,'resumed');
 assert.deepStrictEqual(r.resume.pos,[1,0,2]);assert.strictEqual(r.resume.seat,'Y1-0');
 await W(2000);assert(!ev.some(e=>/퇴장|입장|leave/.test(e)),'no spam: '+ev);assert(ev.includes('rekey'));
 const b=c();await W(300);assert.strictEqual((await join(b,{nick:'grace',clientId:'X'})).ok,false,'nick reserved');
 a2.disconnect();await W(500);const b2=c();await W(300);assert.strictEqual((await join(b2,{nick:'grace',clientId:'X'})).ok,false,'nick reserved during grace');
 await W(1800);assert(ev.includes('leave:'+a2.id)||ev.some(e=>e==='Grace 님 퇴장'),'removed after grace');assert(ev.includes('Grace 님 퇴장'));
 assert.strictEqual((await join(b2,{nick:'grace',clientId:'X'})).ok,true,'nick free after');
 console.log('grace OK');process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
