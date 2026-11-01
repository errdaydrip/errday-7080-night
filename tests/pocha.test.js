// node tests/pocha.test.js (server on :8080)
const {io}=require('socket.io-client');const assert=require('assert');const W=ms=>new Promise(r=>setTimeout(r,ms));
const U='http://localhost:'+(process.env.PORT||8080);
(async()=>{const a=io(U,{forceNew:true}),b=io(U,{forceNew:true});await W(400);
 await new Promise(r=>a.emit('join',{nick:'Server1',clientId:'P1'},r));await new Promise(r=>b.emit('join',{nick:'Guest1',clientId:'P2'},r));
 let tb={},carry=[],dr=[],chats=[];b.on('table',t=>tb=t);b.on('carry',c=>carry.push(c));b.on('drink',d=>dr.push(d));b.on('chat',m=>chats.push(m));
 b.emit('seat','Y2-0');await W(200);b.emit('drink','soju');await W(300);assert(!dr.length,'empty table: no soju');
 a.emit('move',{pos:[0,0,4],rot:0});await W(100);a.emit('pickup','soju');await W(300);assert(!carry.length,'far from fridge');
 a.emit('move',{pos:[-.7,0,20.8],rot:0});await W(100);a.emit('pickup','soju');await W(300);assert.strictEqual(carry[0].kind,'soju');
 a.emit('move',{pos:[-3,0,17.5],rot:0});await W(600);a.emit('place');await W(300);assert.deepStrictEqual(tb.Y2,['soju']);
 a.emit('move',{pos:[5.5,0,15.5],rot:0});await W(600);a.emit('pickup','squid');await W(600);a.emit('move',{pos:[-3,0,17.5],rot:0});await W(100);a.emit('place');await W(300);assert.deepStrictEqual(tb.Y2,['soju','squid']);
 b.emit('drink','beer');await W(300);assert(!dr.length,'no beer on table');b.emit('drink','soju');await W(300);assert.strictEqual(dr[0].type,'soju');assert.deepStrictEqual(tb.Y2,['soju','squid'],'bottle stays');
 await W(1100);b.emit('clearTable');await W(300);assert.deepStrictEqual(tb.Y2,[]);assert(!chats.filter(c=>!c.sys).length,'no chat');
 console.log('pocha OK');process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
