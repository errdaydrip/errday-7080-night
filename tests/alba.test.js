// node tests/alba.test.js — 야장 알바 주문: 포차 테이블에 앉아야 주문, 알바가 가져와서 모두에게 동기
const {io}=require('socket.io-client');const a=require('assert');const W=ms=>new Promise(r=>setTimeout(r,ms));const U='http://localhost:'+(process.env.PORT||8080);
const ord=(c,k)=>new Promise(r=>c.emit('order',k,r));
(async()=>{const c=io(U,{forceNew:true}),o=io(U,{forceNew:true});await W(400);
 await new Promise(r=>c.emit('join',{nick:'Orderer',clientId:'AL1'},r));await new Promise(r=>o.emit('join',{nick:'Watcher',clientId:'AL2'},r));
 let tb={},jobs=[],done=[];o.on('table',t=>tb=t);o.on('albaJob',j=>jobs.push(j));c.on('albaDone',d=>done.push(d));
 let r=await ord(c,'soju');a(!r.ok&&/앉아야/.test(r.err),'standing: refused');
 c.emit('seat','T1-0');await W(200);r=await ord(c,'soju');a(!r.ok,'club table: refused');
 c.emit('stand');c.emit('seat','Y4-0');await W(300);r=await ord(c,'pizza');a(!r.ok,'unknown item refused');
 r=await ord(c,'soju');a(r.ok&&r.id,'soju ordered '+JSON.stringify(r));await W(800);r=await ord(c,'dakbal');a(r.ok,'anju ordered');
 await W(200);a(jobs.length>=1&&jobs[0].table==='Y4'&&jobs[0].kind==='soju','job broadcast to others');const j=jobs[0];a(j.leg1>0&&j.leg2>0&&Array.isArray(j.to));
 a(!(tb.Y4||[]).includes('soju'),'not placed before alba arrives');
 const t0=Date.now();while(done.length<2&&Date.now()-t0<30000)await W(200);a.strictEqual(done.length,2,'both delivered');
 await W(300);a((tb.Y4||[]).includes('soju')&&tb.Y4.includes('dakbal'),'placed on table for all: '+JSON.stringify(tb.Y4));
 let dr=[];o.on('drink',d=>dr.push(d));c.emit('drink','soju');await W(400);a(dr.length===1,'existing consume logic works');
 console.log('alba OK');process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
