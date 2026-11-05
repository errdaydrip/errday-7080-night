(function(){
 const panel=document.createElement('div');panel.id='rollerSocialControls';panel.hidden=true;
 panel.innerHTML='<button type="button" id="rollerTrainButton" aria-pressed="false">기차놀이</button><button type="button" id="rollerBackButton" aria-pressed="false">뒤로타기</button>';
 $('hud').append(panel);
 const train=$('rollerTrainButton'),back=$('rollerBackButton');
 let states={},armed=false,pending=false,tryingAt=0,manualUntil=0;
 function own(){return states[myId]||{};}
 function manual(){
  armed=false;manualUntil=performance.now()+500;
  if(own().leader){states[myId]={...own(),leader:null};socket.emit('rollerTrainLeave');}
 }
 train.onclick=()=>{
  if(own().leader){manual();return;}
  armed=!armed;
  if(armed)sys('앞사람 등 뒤에 가까이 가면 연결돼요 · 직접 이동하면 연결이 풀려요');
 };
 back.onclick=()=>{
  if(pending)return;manual();pending=true;
  const on=!own().backwards;
  socket.timeout(4000).emit('rollerBackwards',on,(error,result)=>{
   pending=false;if(error||!result?.ok)sys('롤러를 신고 서 있는 상태에서 이용해 주세요');
  });
 };
 socket.on('rollerSocialState',data=>{states=data||{};});
 socket.on('disconnect',()=>{states={};armed=false;pending=false;});
 function tick(dt,hasInput){
  const p=rig.object3D.position,inside=ROLLER.inside(p.x,p.z)&&joined&&me.rollerSkates&&!mySeat;
  panel.hidden=!inside||rollerSelectOpen||window.ARCADE_PLAYING;
  if(!inside){manual();return false;}
  if(hasInput&&own().leader)manual();
  const m=own();
  train.textContent=m.leader?'기차 해제':armed?'기차 연결 대기':'기차놀이';
  train.setAttribute('aria-pressed',String(armed||!!m.leader));back.setAttribute('aria-pressed',String(!!m.backwards));
  if(m.leader&&performance.now()>manualUntil){
   resetRollerMovement();p.lerp(new THREE.Vector3(...m.pos),1-Math.exp(-dt*16));myYaw=m.rot;
   moving=(m.pos[0]-p.x)**2+(m.pos[2]-p.z)**2>.0001;
   return true;
  }
  if(armed&&!pending&&performance.now()-tryingAt>700){
   const candidates=Object.entries(others).filter(([id,o])=>{
    const d=states[id];if(d?.leader===myId||Object.values(states).some(s=>s.leader===id))return false;
    if(!o.data?.rollerSkates||o.seat||!ROLLER.inside(o.target.x,o.target.z))return false;
    const dx=p.x-o.target.x,dz=p.z-o.target.z,dist=Math.hypot(dx,dz),rot=o.rot||0;
    return dist>.45&&dist<1.8&&(dx*Math.sin(rot)+dz*Math.cos(rot))/dist<-.55;
   }).sort((a,b)=>p.distanceTo(a[1].target)-p.distanceTo(b[1].target));
   if(candidates.length){
    tryingAt=performance.now();pending=true;
    socket.timeout(4000).emit('rollerTrainJoin',candidates[0][0],(error,result)=>{
     pending=false;if(!error&&result?.ok){armed=false;resetRollerMovement();sys('기차에 연결됐어요 · 방향키나 이동 조작으로 해제할 수 있어요');}
    });
   }
  }
  return false;
 }
 function pose(id,c){
  const m=states[id];if(!m)return;
  if(m.leader){c.torso.rotation.x=.12;c.arms.forEach((arm,i)=>arm.rotation.set(-1.35,0,i?.18:-.18));}
  else if(m.backwards)c.torso.rotation.x=-.12;
 }
 window.rollerSocial={tick,manual,pose,backwards:()=>!!own().backwards};
})();
