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
   if(r.ids.some(id=>id!==r.guest&&!near(id,r.machine))){leave(r.ids[0],'참가자가 테이블을 떠났습니다');continue;}
   if(t-r.created>1200000||r.last.some(v=>t-v>120000)){leave(r.ids[0],'대기 또는 연결 시간이 만료되었습니다');continue;}
   if(r.status==='playing'){H.update(r.state,dt,r.inputs);if(r.state.over){r.status='finished';onResult(r.ids,r.state);broadcast(r);dispose(r);continue;}}
   if(frames%2===0)broadcast(r);
  }frames++;
 },1000/60);timer.unref();
 const invitations=new Map();
 const table=arcade.machines.find(m=>m.game==='hockey');
 function clearInvite(inv,message){
  clearTimeout(inv.timer);invitations.delete(inv.from);invitations.delete(inv.to);
  for(const id of [inv.from,inv.to])io.to(id).emit('hockeyInviteEnd',{message});
 }
 function inviteEvents(s){
  s.on('hockeyPeers',(_,reply)=>{
   if(typeof reply!=='function')return;
   reply(Object.entries(players).filter(([id,p])=>id!==s.id&&!p.gone&&!p.seat&&!members.has(id)&&!invitations.has(id)).map(([id,p])=>({id,nick:p.nick})));
  });
  s.on('hockeyInvite',(to,reply)=>{
   if(typeof reply!=='function')return;
   if(!near(s.id,table)||to===s.id||!players[to]||players[to].gone||players[to].seat||[to,s.id].some(id=>members.has(id)||invitations.has(id))||rooms.has(table.id))return reply(false);
   const inv={from:s.id,to,key:crypto.randomUUID()};invitations.set(s.id,inv);invitations.set(to,inv);
   inv.timer=setTimeout(()=>clearInvite(inv,'초대 시간이 지났어요'),20000);
   io.to(to).emit('hockeyOffer',{nick:players[s.id].nick,key:inv.key});reply(true);
  });
  s.on('hockeyAnswer',answer=>{
   const inv=invitations.get(s.id);if(!inv||inv.to!==s.id||inv.key!==answer?.key)return;
   if(!answer.accept)return clearInvite(inv,'대전 초대를 거절했어요');
   if(!near(inv.from,table)||!players[s.id]||players[s.id].seat||rooms.has(table.id))return clearInvite(inv,'지금은 경기를 시작할 수 없어요');
   clearInvite(inv,'');const ids=[inv.from,inv.to];
   const room={id:crypto.randomUUID(),machine:table,ids,guest:s.id,state:H.create(),status:'playing',inputs:[{},{}],last:[now(),now()],seq:0,created:now()};
   rooms.set(table.id,room);ids.forEach((id,i)=>{members.set(id,room);io.to(id).emit('hockeyAccepted',packet(room,i));});broadcast(room);
  });
  function cancel(){const inv=invitations.get(s.id);if(inv)clearInvite(inv,'초대가 취소되었어요');}
  s.on('hockeyCancelInvite',cancel);s.on('disconnect',cancel);
 }
 function attach(s){inviteEvents(s);s.on('hockeyJoin',(q,a)=>join(s,q,a));s.on('hockeyInput',q=>input(s,q));s.on('hockeyLeave',q=>{if(!q?.id||members.get(s.id)?.id===q.id)leave(s.id);});s.on('disconnect',()=>leave(s.id,'상대방의 연결이 끊겼습니다'));}
 return {attach,leave,close:()=>clearInterval(timer)};
};
