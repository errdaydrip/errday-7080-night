// Entry customization, multiplayer skates, admin access and non-alcoholic snacks.
const assert=require('assert');
const {io}=require('socket.io-client');
const R=require('../public/roller');
const U='http://localhost:'+(process.env.PORT||8080);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const emit=(s,event,data)=>new Promise((resolve,reject)=>s.timeout(3000).emit(event,data,(err,r)=>err?reject(err):resolve(r)));
(async()=>{
 const a=io(U,{forceNew:true}),b=io(U,{forceNew:true});
 const observed={players:{},snacks:[],doors:[],motion:[]};
 b.on('player',p=>observed.players[p.id]=p);
 b.on('rollerSnack',d=>observed.snacks.push(d));
 b.on('rollerDoor',d=>observed.doors.push(d.open));
 b.on('rollerMotion',d=>observed.motion.push(d));
 try{
  await Promise.all([new Promise(r=>a.on('connect',r)),new Promise(r=>b.on('connect',r))]);
  const unique=Date.now();
  await emit(a,'join',{nick:'롤러'+unique,clientId:'roller-'+unique});
  await emit(b,'join',{nick:'관객'+unique,clientId:'roller-watch-'+unique});
  const login=await fetch(U+'/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:process.env.ADMIN_PASSWORD||'6651'})});
  const {token}=await login.json();
  assert.strictEqual((await emit(a,'setRollerDoor',{token:'invalid',open:false})).ok,false);
  assert.strictEqual((await emit(a,'setRollerDoor',{token,open:true})).ok,true);
  assert.strictEqual((await emit(a,'rollerTravel','enter')).ok,false,'must be at street entrance');
  a.emit('move',{pos:[R.ENTRY.x,0,R.ENTRY.z],rot:0});
  assert.strictEqual((await emit(a,'setRollerDoor',{token,open:false})).ok,true);
  assert.strictEqual((await emit(a,'rollerTravel','enter')).ok,false,'closed entrance');
  await emit(a,'setRollerDoor',{token,open:true});
  const entry=await emit(a,'rollerTravel','enter');
  assert(entry.ok);assert.deepStrictEqual(entry.pos,[R.ARRIVE.x,0,R.ARRIVE.z]);assert.strictEqual(entry.rollerSkates,false);
  let correction=null;a.once('rollerPosition',d=>correction=d);
  a.emit('move',{pos:[0,0,59],rot:0});await wait(150);
  assert.deepStrictEqual(correction.pos,entry.pos,'cannot move until skates selected');
  const equipped=await emit(a,'rollerEquip',{on:true,skateBoot:'#2f7bff',skateWheel:'#ffd400',skateLace:'invalid'});
  assert(equipped.ok);assert.strictEqual(equipped.skateLace,'#2f7bff');
  await wait(100);
  const seen=observed.players[a.id];assert(seen.rollerSkates);assert.strictEqual(seen.skateBoot,'#2f7bff');assert.strictEqual(seen.skateWheel,'#ffd400');
  a.emit('rollerMotion','run');a.emit('rollerMotion','jump');await wait(100);
  assert.deepStrictEqual(observed.motion.slice(-2).map(x=>x.motion),['run','jump']);
  assert.strictEqual((await emit(a,'rollerSnack','cider')).ok,false,'must reach shop');
  a.emit('move',{pos:[R.SHOP.x,0,R.SHOP.z],rot:0});
  assert.strictEqual((await emit(a,'rollerEquip',{on:false})).ok,false,'cannot remove skates away from entrance');
  assert.strictEqual((await emit(a,'rollerSnack','ramen')).ok,true);
  assert.strictEqual((await emit(a,'rollerSnack','cider')).ok,false,'shared snack cooldown');
  await wait(2250);assert.strictEqual((await emit(a,'rollerSnack','cider')).ok,true);await wait(100);
  assert.deepStrictEqual(observed.snacks.map(d=>d.kind),['ramen','cider']);
  // Changing outfits keeps the chosen skate colours and equipped state.
  await emit(a,'profile',{nick:'롤러'+unique,style:'disco',skateBoot:'#2f7bff',skateWheel:'#ffd400'});await wait(100);
  assert.strictEqual(observed.players[a.id].rollerSkates,true);
  await emit(a,'setRollerDoor',{token,open:false});
  a.emit('move',{pos:[R.ARRIVE.x,0,R.ARRIVE.z],rot:0});
  const exit=await emit(a,'rollerTravel','exit');assert(exit.ok,'exit stays available when closed');assert.strictEqual(exit.rollerSkates,false);
  const resume=await emit(a,'join',{nick:'롤러'+unique,clientId:'roller-'+unique});
  assert.strictEqual(resume.resume.rollerSkates,false);
  await emit(a,'setRollerDoor',{token,open:true});
  console.log('roller OK');
 }finally{a.close();b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
