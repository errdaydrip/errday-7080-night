const assert=require('assert'),{io}=require('socket.io-client');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const emit=(s,name,data)=>new Promise((resolve,reject)=>s.timeout(2500).emit(name,data,(err,q)=>err?reject(err):resolve(q)));
(async()=>{
 const clients=[0,1,2].map(()=>io('http://localhost:'+(process.env.PORT||8080),{transports:['websocket'],forceNew:true}));
 let snapshot={};clients[0].on('rollerSocialState',q=>snapshot=q);
 try{
  for(let i=0;i<clients.length;i++){
   const s=clients[i];await new Promise(r=>s.connected?r():s.once('connect',r));
   assert((await emit(s,'join',{nick:'기차검증'+i,clientId:'train-'+Date.now()+'-'+i,last:{worldVersion:5,pos:[10,0,40-i*.85],rot:0,rollerSkates:true}})).ok);
  }
  const [leader,follower,rear]=clients;
  assert((await emit(follower,'rollerTrainJoin',leader.id)).ok);
  assert((await emit(rear,'rollerTrainJoin',follower.id)).ok);
  for(let i=0;i<20;i++){leader.emit('move',{pos:[10,0,40+i*.06],rot:0});await wait(50);}
  assert(snapshot[follower.id].pos[2]>40,'server moves follower');
  assert(snapshot[rear.id].pos[2]>39,'server moves rear carriage');
  follower.emit('move',{pos:[0,0,0],rot:0});await wait(100);
  assert(snapshot[follower.id].pos[0]>9,'client stale position cannot override follow');
  follower.emit('rollerTrainLeave');await wait(100);
  assert(!snapshot[follower.id]?.leader);
  assert((await emit(follower,'rollerBackwards',true)).ok);await wait(60);
  assert(snapshot[follower.id].backwards);
  assert((await emit(follower,'rollerBackwards',false)).ok);await wait(60);
  assert(!snapshot[follower.id]?.backwards);
  follower.close();await wait(100);assert(!snapshot[rear.id]?.leader,'disconnection releases rear carriage');
  console.log('network train chain, automatic movement, manual detach, backwards and disconnect OK');
 }finally{clients.forEach(s=>s.close());}
})().catch(e=>{console.error(e);process.exitCode=1});
