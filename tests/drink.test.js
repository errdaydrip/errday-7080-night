// node tests/drink.test.js  (server must run on :8080)
const {io}=require('socket.io-client');const assert=require('assert');const W=ms=>new Promise(r=>setTimeout(r,ms));
const U='http://localhost:'+(process.env.PORT||8080);
(async()=>{const a=io(U,{forceNew:true}),b=io(U,{forceNew:true});await W(400);
 await new Promise(r=>a.emit('join',{nick:'Drinker',clientId:'D1'},r));await new Promise(r=>b.emit('join',{nick:'Watcher',clientId:'D2'},r));
 const got=[],chats=[];b.on('drink',d=>got.push(d));b.on('chat',m=>chats.push(m));
 a.emit('drink','soju');await W(300);assert.strictEqual(got.length,0,'standing: ignored');
 a.emit('seat','T1_0');await W(200);a.emit('drink','soju');a.emit('drink','beer');a.emit('drink','makgeolli');await W(400);
 assert.strictEqual(got.length,1,'rate-limited');assert.strictEqual(got[0].type,'soju');assert.strictEqual(got[0].id,a.id);
 await W(2000);a.emit('drink','makgeolli');await W(300);assert.strictEqual(got.length,1,'makgeolli rejected');
 a.emit('drink','beer');await W(300);assert.strictEqual(got.length,2);assert.strictEqual(got[1].type,'beer');
 assert(!chats.length,'no chat posts');console.log('drink OK');a.close();b.close();})().catch(e=>{console.error(e);process.exit(1);});
// 바텐더 위스키
(async()=>{await W(6000);const a=io(U,{forceNew:true}),c=io(U,{forceNew:true});await W(400);
 await new Promise(r=>a.emit('join',{nick:'Bartender',clientId:'B1'},r));await new Promise(r=>c.emit('join',{nick:'Guest',clientId:'B2'},r));
 let gl={},pours=0,dr=[];c.on('glasses',g=>gl=g);c.on('pour',()=>pours++);c.on('drink',d=>dr.push(d));
 c.emit('seat','BAR-2');await W(200);c.emit('drink','whiskey');await W(300);assert(!dr.length,'no glass, no whiskey');
 a.emit('serve',{x:0,z:0});await W(1800);assert(!gl['BAR-2'],'outside zone rejected');
 c.emit('drink','soju');await W(300);assert(!dr.length,'no soju at bar');a.emit('serve',{x:11,z:0,kind:'cocktail'});a.emit('serve',{x:11,z:0});await W(1800);assert.strictEqual(pours,1);assert.strictEqual(gl['BAR-2'],'cocktail','cocktail at customer');
 c.emit('drink','whiskey');await W(300);assert(!dr.length,'wrong type');await W(1800);
 c.emit('drink','cocktail');await W(400);assert.strictEqual(dr[0].type,'cocktail');assert(!gl['BAR-2'],'glass consumed');
 console.log('bartender OK');process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
