// Shared rink social state is transient. Each follower uses the leader's travelled path.
const R = require('./public/roller');
const GAP = .85;
const distance = (a,b) => Math.hypot(a[0]-b[0],a[2]-b[2]);
function eligible(player) {
 return player && !player.gone && !player.seat && player.rollerSkates &&
  R.inside(player.pos[0],player.pos[2]);
}
function behind(follower,leader) {
 if (!eligible(follower) || !eligible(leader)) return false;
 const dx=follower.pos[0]-leader.pos[0], dz=follower.pos[2]-leader.pos[2];
 const d=Math.hypot(dx,dz);
 return d>.45 && d<1.8 && Math.abs(follower.pos[1]-leader.pos[1])<.3 &&
  (dx*Math.sin(leader.rot)+dz*Math.cos(leader.rot))/d<-.55;
}
function clearPath(a,b) {
 const steps=Math.max(1,Math.ceil(distance(a,b)/.12));
 for(let i=1;i<=steps;i++) {
  const k=i/steps,x=a[0]+(b[0]-a[0])*k,z=a[2]+(b[2]-a[2])*k,y=a[1]+(b[1]-a[1])*k;
  if(!R.inside(x,z))return false;
  if(R.obstacles.some(o=>!(o.jumpTop!==undefined&&y>=o.jumpTop-.1)&&
   x>o.x0-.2&&x<o.x1+.2&&z>o.z0-.2&&z<o.z1+.2))return false;
 }
 return true;
}
function create({io,players,dirty}) {
 const modes=new Map(),paths=new Map();
 const state=id=>{if(!modes.has(id))modes.set(id,{leader:null,backwards:false});return modes.get(id);};
 function publicState() {
  return Object.fromEntries([...modes].filter(([id,m])=>players[id]&&(m.leader||m.backwards)).map(([id,m])=>[id,{...m,pos:players[id].pos,rot:players[id].rot}]));
 }
 let lastBroadcast='';
 function broadcast(){const data=publicState(),key=JSON.stringify(data);if(key!==lastBroadcast){lastBroadcast=key;io.emit('rollerSocialState',data);}}
 function leave(id) {const m=modes.get(id);if(m?.leader){m.leader=null;broadcast();}}
 function remove(id) {
  modes.delete(id);paths.delete(id);
  for(const m of modes.values())if(m.leader===id)m.leader=null;
  broadcast();
 }
 function connect(id,leaderId) {
  if(id===leaderId||!behind(players[id],players[leaderId]))return false;
  if([...modes.entries()].some(([other,m])=>other!==id&&m.leader===leaderId))return false;
  const visited=new Set([id]);let next=leaderId;
  while(next){if(visited.has(next))return false;visited.add(next);next=modes.get(next)?.leader;}
  if(!clearPath(players[id].pos,players[leaderId].pos))return false;
  const m=state(id);m.leader=leaderId;m.backwards=false;
  if(!paths.has(leaderId))paths.set(leaderId,[players[id].pos.slice(),players[leaderId].pos.slice()]);
  broadcast();return true;
 }
 function sample(id) {
  const p=players[id];if(!eligible(p)){paths.delete(id);return;}
  let trail=paths.get(id);if(!trail){trail=[];paths.set(id,trail);}
  if(!trail.length||distance(trail[trail.length-1],p.pos)>.025)trail.push(p.pos.slice());
  if(trail.length>240)trail.splice(0,trail.length-240);
 }
 function target(id) {
  const trail=paths.get(id)||[];let remaining=GAP;
  for(let i=trail.length-1;i>0;i--){
   const newer=trail[i],older=trail[i-1],length=distance(newer,older);
   if(length>=remaining){const k=remaining/length;return newer.map((v,j)=>v+(older[j]-v)*k);}
   remaining-=length;
  }
  return null;
 }
 function tick(dt) {
  for(const id of Object.keys(players))sample(id);
  const updated=new Set();
  function follow(id,depth=0) {
   if(updated.has(id)||depth>100)return;updated.add(id);
   const m=modes.get(id);if(!m?.leader)return;
   follow(m.leader,depth+1);
   const p=players[id],leader=players[m.leader];
   if(!eligible(p)||!eligible(leader)||distance(p.pos,leader.pos)>5){m.leader=null;return;}
   const goal=target(m.leader);if(!goal)return;
   const d=distance(p.pos,goal),k=d?Math.min(1,dt*8/d):0;
   const next=p.pos.map((v,j)=>v+(goal[j]-v)*k);
   if(Math.abs(next[1]-p.pos[1])>.3||!clearPath(p.pos,next)){m.leader=null;return;}
   p.pos=next;p.rot=Math.atan2(leader.pos[0]-p.pos[0],leader.pos[2]-p.pos[2]);
   p.rollerMotion=d>.04?'skate':'idle';p.dance=0;dirty.add(id);sample(id);
  }
  for(const id of modes.keys())follow(id);
  for(const [id,m] of modes)if(!eligible(players[id])){m.leader=null;m.backwards=false;}
 }
 let previous=Date.now(),frames=0;
 const timer=setInterval(()=>{const t=Date.now();tick(Math.min(.1,(t-previous)/1000));previous=t;if(frames++%2===0)broadcast();},50);timer.unref();
 function attach(socket) {
  socket.emit('rollerSocialState',publicState());
  socket.on('rollerTrainJoin',(leader,ack)=>{
   const ok=typeof leader==='string'&&connect(socket.id,leader);
   if(typeof ack==='function')ack({ok,error:ok?null:'앞사람 등 뒤의 빈자리에 가까이 와 주세요'});
  });
  socket.on('rollerTrainLeave',()=>leave(socket.id));
  socket.on('rollerBackwards',(on,ack)=>{
   const ok=eligible(players[socket.id])&&typeof on==='boolean';
   if(ok){leave(socket.id);state(socket.id).backwards=on;broadcast();}
   if(typeof ack==='function')ack({ok});
  });
  socket.on('seat',()=>leave(socket.id));
  socket.on('bye',()=>remove(socket.id));
  socket.on('disconnect',()=>remove(socket.id));
 }
 return {attach,tick,connect,leave,isFollowing:id=>!!modes.get(id)?.leader,close:()=>clearInterval(timer)};
}
module.exports={create,eligible,behind,clearPath};
