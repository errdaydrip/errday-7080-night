// node tests/pocha.test.js (server on :8080)
const {io}=require('socket.io-client');const assert=require('assert');const W=ms=>new Promise(r=>setTimeout(r,ms));
const U='http://localhost:'+(process.env.PORT||8080);
(async()=>{const a=io(U,{forceNew:true}),b=io(U,{forceNew:true});await W(400);
 await new Promise(r=>a.emit('join',{nick:'Server1',clientId:'P1'},r));await new Promise(r=>b.emit('join',{nick:'Guest1',clientId:'P2'},r));
 let tb={},carry=[],dr=[],chats=[];b.on('table',t=>tb=t);b.on('carry',c=>carry.push(c));b.on('drink',d=>dr.push(d));b.on('chat',m=>chats.push(m));
 b.emit('seat','Y2-0');await W(200);b.emit('drink','soju');await W(300);assert(!dr.length,'empty table: no soju');
 a.emit('move',{pos:[0,0,4],rot:0});await W(100);a.emit('pickup','soju');await W(300);assert(!carry.length,'far from fridge');
 a.emit('move',{pos:[-.7,0,20.8],rot:0});await W(100);a.emit('pickup','soju');await W(300);assert.strictEqual(carry[0].kind,'soju');
 a.emit('move',{pos:[-3,0,17.5],rot:0});await W(600);a.emit('place');await W(300);assert.deepStrictEqual(tb.Y2,['soju',null,null,null]);
 a.emit('move',{pos:[5.5,0,15.5],rot:0});await W(600);a.emit('pickup','squid');await W(600);a.emit('move',{pos:[-3,0,17.5],rot:0});await W(100);a.emit('place');await W(300);assert.deepStrictEqual(tb.Y2,['soju','squid',null,null]);
 b.emit('drink','beer');await W(300);assert(!dr.length,'no beer on table');
 for(let i=0;i<4;i++){b.emit('drink','soju');await W(2100);}assert.strictEqual(dr.length,4);assert.deepStrictEqual(tb.Y2,[null,'squid',null,null],'soju gone in place, squid keeps slot');
 let eats=[];b.on('eat',e=>eats.push(e));b.emit('eat','dakbal');await W(300);assert(!eats.length,'no dakbal');
 b.emit('eat','squid');b.emit('eat','squid');await W(300);assert.strictEqual(eats.length,1,'rate limit');
 for(let i=0;i<3;i++){await W(2100);b.emit('eat','squid');}await W(300);assert.strictEqual(eats.length,4);assert.deepStrictEqual(tb.Y2,[null,null,null,null],'squid gone');
 // 통닭/모듬회
 a.emit('move',{pos:[5.5,0,15.5],rot:0});await W(600);a.emit('pickup','chicken');await W(300);const nc=carry.length;
 a.emit('move',{pos:[12.4,0,22],rot:0});await W(600);a.emit('pickup','chicken');await W(600);assert.strictEqual(carry.length,nc+1,'chicken pickup');assert.strictEqual(carry[carry.length-1].kind,'chicken');
 a.emit('move',{pos:[-3,0,17.5],rot:0});await W(600);a.emit('place');await W(300);
 a.emit('move',{pos:[12.4,0,15],rot:0});await W(600);a.emit('pickup','hoe');await W(600);a.emit('move',{pos:[-3,0,17.5],rot:0});await W(600);a.emit('place');await W(300);
 assert.deepStrictEqual(tb.Y2,['chicken','hoe',null,null]);
 for(let i=0;i<4;i++){await W(2100);b.emit('eat','chicken');}await W(300);assert.deepStrictEqual(tb.Y2,[null,'hoe',null,null],'chicken gone in place');
 for(let i=0;i<4;i++){await W(2100);b.emit('eat','hoe');}await W(300);assert.deepStrictEqual(tb.Y2,[null,null,null,null]);
 // max 4
 for(let i=0;i<5;i++){a.emit('move',{pos:[-.7,0,20.8],rot:0});await W(100);a.emit('pickup','beer');await W(600);a.emit('move',{pos:[-3,0,17.5],rot:0});await W(100);a.emit('place');await W(600);}
 assert.strictEqual(tb.Y2.filter(Boolean).length,4,'max 4');
 assert(!chats.filter(c=>!c.sys).length,'no chat');
 console.log('pocha OK');process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
