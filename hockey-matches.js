// One server-authoritative two-player match per physical air-hockey table.
const H=require('./public/air-hockey'),crypto=require('crypto');
module.exports=function({io,players,arcade,onResult,now=Date.now}){
 const rooms=new Map(),members=new Map();
 const near=(id,m)=>{const p=players[id];return p&&!p.gone&&!p.seat&&arcade.inside(p.pos[0],p.pos[2])&&Math.hypot(p.pos[0]-m.spot.x,p.pos[2]-m.spot.z)<2.1;};
 function packet(r,side){return {id:r.id,seq:r.seq,side,status:r.status,names:r.ids.map(id=>players[id]?.nick||'상대방'),state:r.state,reason:r.reason||''};}
 function broadcast(r){r.seq++;r.ids.forEach((id,i)=>io.to(id).emit('hockeyState',packet(r,i)));}
 function dispose(r){rooms.delete(r.machine.id);for(const id of r.ids)members.delete(id);}
 function leave(id,reason='상대방이 경기를 나갔습니다'){
  const r=members.get(id);if(!r)return;r.status='ended';r.reason=reason;broadcast(r);dispose(r);
 }
 function join(s,request,ack){if(typeof ack!=='function')return;const m=arcade.machines.find(m=>m.id===request?.machineId&&m.game==='hockey');
  if(!m||!near(s.id,m))return ack({ok:false,error:'에어하키 테이블 앞에서 참가해 주세요'});
  const current=members.get(s.id);if(current)return ack({ok:true,...packet(current,current.ids.indexOf(s.id))});
  let r=rooms.get(m.id);if(r&&r.ids.length===2)return ack({ok:false,error:'경기 중입니다. 잠시 후 참가해 주세요'});
  if(r&&r.ids.some(id=>players[id]?.cid===players[s.id].cid))return ack({ok:false,error:'서로 다른 이용자가 참가해 주세요'});
  if(!r){r={id:crypto.randomBytes(12).toString('hex'),machine:m,ids:[],state:H.create(),status:'waiting',inputs:[{},{}],last:[now(),now()],seq:0,created:now()};rooms.set(m.id,r);}
  r.ids.push(s.id);members.set(s.id,r);delete s.data.arcadeSession;
  if(r.ids.length===2){r.status='playing';r.last=[now(),now()];}
  ack({ok:true,...packet(r,r.ids.length-1)});broadcast(r);
 }
 function input(s,q){const r=members.get(s.id);if(!r||r.id!==q?.id||r.status!=='playing')return;const i=r.ids.indexOf(s.id),old=r.inputs[i];
  if(!Number.isSafeInteger(q.seq)||q.seq<0||q.seq<=(old.seq??-1)||!Number.isFinite(q.x)||!Number.isFinite(q.y))return;
  r.inputs[i]={x:Math.max(0,Math.min(1,q.x)),y:Math.max(0,Math.min(1,q.y)),seq:q.seq};r.last[i]=now();if(q.serve===true)H.serve(r.state,i);
 }
 let previous=now(),frames=0;
 const timer=setInterval(()=>{const t=now(),dt=Math.min(.05,(t-previous)/1000);previous=t;
  for(const r of rooms.values()){
   if(r.ids.some(id=>!near(id,r.machine))){leave(r.ids[0],'참가자가 테이블을 떠났습니다');continue;}
   if(t-r.created>1200000||r.last.some(v=>t-v>120000)){leave(r.ids[0],'대기 또는 연결 시간이 만료되었습니다');continue;}
   if(r.status==='playing'){H.update(r.state,dt,r.inputs);if(r.state.over){r.status='finished';onResult(r.ids,r.state);broadcast(r);dispose(r);continue;}}
   if(frames%2===0)broadcast(r);
  }frames++;
 },1000/60);timer.unref();
 function attach(s){s.on('hockeyJoin',(q,a)=>join(s,q,a));s.on('hockeyInput',q=>input(s,q));s.on('hockeyLeave',q=>{if(!q?.id||members.get(s.id)?.id===q.id)leave(s.id);});s.on('disconnect',()=>leave(s.id,'상대방의 연결이 끊겼습니다'));}
 return {attach,leave,close:()=>clearInterval(timer)};
};
