const CID=localStorage.getItem('cid')||(()=>{const v=(crypto.randomUUID?crypto.randomUUID():Date.now()+''+Math.random()).toString();localStorage.setItem('cid',v);return v;})();
// ===== ERRDAY 나이트클럽: 아바타 · 이동 · 채팅 · 음악 =====
const socket=io();const $=id=>document.getElementById(id);
const COLORS=['#2b3352','#9a9cc0','#2a3f9e','#2fb8b0','#2f8f45','#e2525c','#c8102e','#ffd400','#ff69b4','#7b2cbf','#ff8c00','#f5f5f5'];
const JOINT={suit:'#1a1a1a',disco:'#ffd700',hanbok:'#ffffff'};
let me={nick:'',gender:'m',style:'suit',outfit:'#2b3352',skin:'#f2c29a'},myId=null,joined=false,mySeat=null,adminToken=sessionStorage.getItem('adminToken');
try{Object.assign(me,JSON.parse(localStorage.getItem('profile')||'{}'));}catch(e){}delete me.hat;if(!['suit','disco','hanbok'].includes(me.style))me.style='suit';
const others={};const scene=document.querySelector('a-scene');
const humanOpts=p=>({outfit:p.outfit||null,skin:p.skin||'#f2c29a',gender:p.gender==='f'?'f':'m',style:['suit','disco','hanbok'].includes(p.style)?p.style:'suit'});
const SKINS=['#f2c29a','#ffdcc0','#d9a074','#a8724a'];
const STYLE_NAMES={m:{suit:'정장',disco:'디스코',hanbok:'한복'},f:{suit:'정장',disco:'디스코',hanbok:'한복'}};
// 모바일 성능: 픽셀 비율 낮추기
scene.addEventListener('loaded',()=>{if(IS_MOBILE&&scene.renderer)scene.renderer.setPixelRatio(Math.min(1.25,devicePixelRatio));});
// ---------- 입장 화면 ----------
$('sw').innerHTML=COLORS.map(c=>`<span class="swatch" data-v="${c}" style="background:${c}"></span>`).join('');
$('skins').innerHTML=SKINS.map(c=>`<span class="swatch sk" data-v="${c}" style="background:${c}"></span>`).join('');
function renderStyles(){$('styles').innerHTML=Object.entries(STYLE_NAMES[me.gender==='f'?'f':'m']).map(([k,v])=>`<button class="opt s${me.style===k?' sel':''}" data-v="${k}">${v}</button>`).join('');}
// 미리보기 (작은 3D 캔버스)
let pv=null;function initPreview(){const cv=$('preview');const r=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true});r.setPixelRatio(Math.min(2,devicePixelRatio));r.setSize(cv.clientWidth||150,cv.clientHeight||162,false);
 const sc=new THREE.Scene();sc.add(new THREE.AmbientLight('#fff',1.4));const dl=new THREE.DirectionalLight('#fff',1.6);dl.position.set(1,2,3);sc.add(dl);
 const cm=new THREE.PerspectiveCamera(30,(cv.clientWidth||150)/(cv.clientHeight||162),.1,20);cm.position.set(0,.85,3.6);cm.lookAt(0,.75,0);pv={r,sc,cm,c:null,t:0};
 (function loop(){requestAnimationFrame(loop);if($('entry').classList.contains('hidden')||!pv.c)return;pv.t+=1/60;pv.c.root.rotation.y=Math.sin(pv.t*.8)*.6;animateChibi(pv.c,'idle',pv.t,{});r.render(sc,cm);})();}
function updatePreview(){if(!pv)initPreview();if(pv.c)pv.sc.remove(pv.c.root);pv.c=makeChibi(humanOpts(me));pv.sc.add(pv.c.root);}
function syncOpts(){$('nick').value=me.nick;document.querySelectorAll('.opt.g').forEach(b=>b.classList.toggle('sel',b.dataset.v===me.gender));renderStyles();
 document.querySelectorAll('#sw .swatch').forEach(b=>b.classList.toggle('sel',b.dataset.v===me.outfit));document.querySelectorAll('#skins .swatch').forEach(b=>b.classList.toggle('sel',b.dataset.v===me.skin));updatePreview();}
syncOpts();
$('entry').addEventListener('click',e=>{const b=e.target;if(b.classList.contains('g')){me.gender=b.dataset.v;me.outfit=OUTFIT_DEFAULTS[me.gender][me.style];}if(b.classList.contains('s')){me.style=b.dataset.v;me.outfit=OUTFIT_DEFAULTS[me.gender==='f'?'f':'m'][me.style];}
 if(b.classList.contains('sk'))me.skin=b.dataset.v;else if(b.classList.contains('swatch'))me.outfit=b.dataset.v;me.nick=$('nick').value;syncOpts();});
$('enter').onclick=()=>{me.nick=$('nick').value.trim()||('손님'+Math.floor(Math.random()*1000));localStorage.setItem('profile',JSON.stringify(me));
 $('entry').classList.add('hidden');$('hud').classList.remove('hidden');chatBottom();
 const ev=joined?'profile':'join';socket.emit(ev,{...me,clientId:CID},r=>{if(r&&!r.ok){nickErr();return;}joined=true;enterOk();});};
function nickErr(){$('entry').classList.remove('hidden');$('hud').classList.add('hidden');alert('이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해 주세요.');$('nick').focus();}
function enterOk(){
 buildAvatar($('myAvatar'),{...me,id:myId},true);$('enter').textContent='입장하기 (소리 켜짐)';userGesture=true;applyMusic(true);}
$('setBtn').onclick=()=>{$('enter').textContent='저장';$('entry').classList.remove('hidden');};
// 모바일: 채팅/음악 패널은 같은 자리라 하나만 열림 (음악 패널이 채팅을 가리던 문제 수정)
$('chatToggle').onclick=()=>{const h=$('hud');h.classList.toggle('showChat');if(h.classList.contains('showChat'))h.classList.remove('showMusic');};
$('musicToggle').onclick=()=>{const h=$('hud');h.classList.toggle('showMusic');if(h.classList.contains('showMusic'))h.classList.remove('showChat');};
$('chatIn').addEventListener('focus',()=>{$('hud').classList.add('showChat');$('hud').classList.remove('showMusic');});
// 이름표: 머리/머리카락(아프로·갓 등) 실제 높이에 맞춰 위치 (앉기/춤 포즈도 추적)
const _bx=new THREE.Box3(),_v=new THREE.Vector3();
function labelLayer(){let L=document.getElementById('labelLayer');if(!L){L=document.createElement('div');L.id='labelLayer';L.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:5;overflow:hidden';document.body.appendChild(L);}return L;}
const _lp=new THREE.Vector3();
AFRAME.registerComponent('tag-follow',{init(){this.n=0;this.y=1.78;const d=this.div=document.createElement('div');d.className='nameLabel';
  d.style.cssText='position:absolute;left:0;top:0;transform:translate(-50%,-100%);color:#fff;font:bold 14px "Malgun Gothic",sans-serif;white-space:nowrap;text-shadow:0 0 6px #ff3cac,0 0 3px #ff3cac,0 1px 2px #000;will-change:transform';
  d.textContent=this.el.dataset.nick||'';labelLayer().appendChild(d);},
 remove(){this.div.remove();},
 tick(){const m=this.el.getObject3D('mesh');if(m)m.visible=false;const sc=this.el.sceneEl,cam=sc.camera,cv=sc.canvas;
  if(cam&&cv&&this.el.isConnected){this.el.object3D.getWorldPosition(_lp);_lp.project(cam);const r=cv.getBoundingClientRect();
   if(_lp.z<1&&_lp.z>-1){this.div.style.display='';this.div.style.transform=`translate(${r.left+(_lp.x+1)/2*r.width}px,${r.top+(1-_lp.y)/2*r.height}px) translate(-50%,-100%)`;}else this.div.style.display='none';}
  else this.div.style.display='none';
  const root=this.el.parentNode,h=root&&root._h;if(!h||!h.root)return;
 if(this.n++%6===0){_bx.setFromObject(h.root,true);if(!_bx.isEmpty()){_v.set(0,_bx.max.y,0);const ry=root.object3D.getWorldPosition(new THREE.Vector3()).y;
  const s=root.object3D.getWorldScale(new THREE.Vector3()).y||1;this.y=(_bx.max.y-ry)/s+.22;}}
 const p=this.el.object3D.position;p.y+=(this.y-p.y)*.3;const b=root.querySelector('.bubble');if(b)b.object3D.position.y=p.y+.36;}});
// ---------- 아바타 (CC0 3D 모델) ----------
async function buildAvatar(root,p,mine){if(root._h){HUMANS.delete(root._h);root._h.dispose();root._h=null;}
 root.querySelectorAll('.tag,.bubble').forEach(e=>e.remove());const token=root._tok=Math.random();
 const tag=document.createElement('a-entity');tag.classList.add('tag');tag.setAttribute('position','0 1.78 0');tag.setAttribute('billboard','');
 tag.setAttribute('ktext',`value:${(p.nick||'').replace(/;/g,' ')};color:#fff;glow:#ff3cac;size:40;width:.9;top:true`);tag.dataset.nick=p.nick||'';tag.setAttribute('tag-follow','');root.appendChild(tag);
 const bub=document.createElement('a-entity');bub.classList.add('bubble');bub.setAttribute('position','0 2.12 0');bub.setAttribute('billboard','');bub.setAttribute('visible',false);root.appendChild(bub);
 const h=await makeHuman(root,humanOpts(p));if(!h||root._tok!==token){if(h)h.dispose();return;}root._h=h;HUMANS.add(h);}
function upsertOther(p){if(p.id===myId)return;let o=others[p.id];
 if(!o){const el=document.createElement('a-entity');$('others').appendChild(el);o=others[p.id]={el,target:new THREE.Vector3(...(p.pos||[0,0,4])),rot:p.rot||0};el.object3D.position.copy(o.target);}
 const key=[p.nick,p.gender,p.style,p.outfit,p.skin].join('|');if(o.key!==key){o.key=key;buildAvatar(o.el,p);}o.data=p;o.dance=p.dance||0;applySeatPose(o,p.seat);}
function applySeatPose(o,seat){o.seat=seat;const s=SEATS.find(x=>x.id===seat);if(s){o.target.set(s.x,s.y||0,s.z);o.rot=s.yaw;}}
AFRAME.registerComponent('others-lerp',{tick(){for(const id in others){const o=others[id],p=o.el.object3D.position,d=p.distanceTo(o.target);p.lerp(o.target,.15);
 let r=o.rot-o.el.object3D.rotation.y;r=Math.atan2(Math.sin(r),Math.cos(r));o.el.object3D.rotation.y+=r*.2;
 const h=o.el._h;if(h)h.play(o.seat?'Sitting_Idle_Loop':(d>.03?'Walk_Loop':(o.dance?'Dance_'+o.dance:'Idle_Loop')));}}});
scene.setAttribute('others-lerp','');
function bubble(id,text){const el=id===myId?$('myAvatar'):others[id]&&others[id].el;if(!el)return;const b=el.querySelector('.bubble');if(!b)return;
 b.setAttribute('ktext',`value:${text.slice(0,30).replace(/;/g,' ')};color:#000;glow:;bg:#fff;size:36;width:1.4;top:true`);b.setAttribute('visible',true);
 clearTimeout(b._t);b._t=setTimeout(()=>b.setAttribute('visible',false),5000);}
// ---------- 3인칭 카메라 · 이동 · 클릭 이동 · 자동 앉기 ----------
const rig=$('rig'),cam=$('cam'),myAv=$('myAvatar'),marker=$('marker');
const keys={};let camGoal=null,myDance=0,idleT=0,camYaw=0,camPitch=.4,camDist=IS_MOBILE?5.5:4.5,myYaw=Math.PI,goal=null,goalSeat=null,stillT=0,moving=false;
const typing=()=>document.activeElement&&document.activeElement.tagName==='INPUT';
window.addEventListener('keydown',e=>{if(typing())return;keys[e.code]=true;if(/Key[WASD]|Arrow/.test(e.code)){route=[];goal=null;goalSeat=null;marker.setAttribute('visible',false);}
 if(e.code==='KeyE'){mySeat?stand():(()=>{const s=nearestSeat(1.6);if(s)sit(s);})();}if(e.code==='Escape')stand();});
window.addEventListener('keyup',e=>{keys[e.code]=false;});window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
// 포인터: 드래그=회전, 짧은 탭=이동, 두 손가락=줌
const ptrs=new Map();let down=null,pinch0=0,dist0=0;
scene.addEventListener('loaded',()=>{const c=scene.canvas;
 c.addEventListener('pointerdown',e=>{ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});c.setPointerCapture(e.pointerId);
  if(ptrs.size===1)down={x:e.clientX,y:e.clientY,t:performance.now(),moved:0};else{down=null;const [a,b]=[...ptrs.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);dist0=camDist;}});
 c.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(ptrs.size===2){const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch0)camDist=Math.max(2,Math.min(10,dist0*pinch0/d));return;}
  if(down){down.moved+=Math.abs(dx)+Math.abs(dy);if(down.moved>8){camGoal=null;const T=e.pointerType==='touch',sg=T?1.3:1;camYaw-=dx*.006*sg;camPitch=Math.max(.05,Math.min(1.2,camPitch+dy*.005*sg));}}});
 const up=e=>{ptrs.delete(e.pointerId);if(down&&e.type==='pointerup'&&down.moved<=8&&performance.now()-down.t<600)tapAt(e.clientX,e.clientY);if(ptrs.size===0)down=null;pinch0=0;};
 c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);
 c.addEventListener('wheel',e=>{e.preventDefault();camDist=Math.max(2,Math.min(10,camDist+e.deltaY*.004));},{passive:false});});
const ray=new THREE.Raycaster(),v2=new THREE.Vector2(),floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function tapAt(x,y){if(!joined)return;const r=scene.canvas.getBoundingClientRect();v2.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);ray.setFromCamera(v2,scene.camera);
 // 의자/소파를 눌렀나?
 const hits=ray.intersectObjects(SEATS.map(s=>s.el.object3D),true);
 if(hits.length){let o=hits[0].object;while(o&&!(o.el&&o.el.dataset&&o.el.dataset.seat))o=o.parent;const s=o&&SEATS.find(q=>q.id===o.el.dataset.seat);
  if(s){if(seatTaken(s)){sys('이미 누가 앉은 자리예요');return;}if(mySeat)stand();goalSeat=s;setRoute(s.x,s.z);return;}}
 const pt=new THREE.Vector3(),sp=new THREE.Vector3();let onStage=false;
 if(ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-STAGE.h),sp)&&heightAt(sp.x,sp.z)>=STAGE.h-.01){pt.copy(sp);onStage=true;}
 else if(!ray.ray.intersectPlane(floorPlane,pt))return;
 if(mySeat)stand();goalSeat=null;setRoute(clampX(pt.x),clampZ(pt.z));}
// 무대 ↔ 바닥 이동은 계단을 거쳐서
let route=[];
function setRoute(x,z){const p=rig.object3D.position,up=heightAt(x,z)>.35,me_up=heightAt(p.x,p.z)>.35;route=[];
 const bottom=new THREE.Vector3(0,0,STAGE.sz1+.35),top=new THREE.Vector3(0,0,STAGE.sz0-.35);
 if(up&&!me_up)route=[bottom,top];else if(!up&&me_up)route=[top,bottom];
 route.push(new THREE.Vector3(x,0,z));goal=route.shift();showMarker(x,z,heightAt(x,z));}
function showMarker(x,z,y=0){marker.object3D.position.set(x,y+.06,z);marker.setAttribute('visible',true);}
const BOUND={x0:-11.4,x1:11.4,z0:-11.4,z1:11.4},ROOM={x0:-11.8,x1:11.8,z0:-11.8,z1:11.8,y1:7.8};
const clampX=x=>Math.max(BOUND.x0,Math.min(BOUND.x1,x)),clampZ=z=>Math.max(BOUND.z0,Math.min(BOUND.z1,z));
function blocked(x,z,ignoreSeatTable){const p0=rig.object3D.position;if(Math.abs(heightAt(x,z)-heightAt(p0.x,p0.z))>.2)return true;for(const o of OBSTACLES){if(o.r!==undefined){if(ignoreSeatTable&&Math.hypot(o.x-ignoreSeatTable.x,o.z-ignoreSeatTable.z)<.01)continue;if(Math.hypot(x-o.x,z-o.z)<o.r+.25)return true;}
 else if(x>o.x0-.25&&x<o.x1+.25&&z>o.z0-.25&&z<o.z1+.25)return true;}return false;}
function seatTaken(s){return Object.values(others).some(o=>o.seat===s.id);}
function nearestSeat(maxD){const p=rig.object3D.position;let best=null,bd=maxD;for(const s of SEATS){const d=Math.hypot(s.x-p.x,s.z-p.z);if(d<bd&&!seatTaken(s)){bd=d;best=s;}}return best;}
function tableCenter(t){const ss=SEATS.filter(s=>s.table===t);return{x:ss.reduce((a,s)=>a+s.x,0)/ss.length,z:ss.reduce((a,s)=>a+s.z,0)/ss.length};}
function sit(s){if(!s||seatTaken(s))return;mySeat=s.id;goal=null;goalSeat=null;marker.setAttribute('visible',false);rig.object3D.position.set(s.x,s.y||0,s.z);myYaw=s.yaw;{const bar=s.table==='BAR';camGoal=bar?{yaw:myYaw+Math.PI,pitch:.4}:{yaw:myYaw,pitch:.4};}
 socket.emit('seat',s.id);socket.emit('move',{pos:[s.x,s.y||0,s.z],rot:myYaw});updateWhere();}
function stand(){if(!mySeat)return;camGoal=null;const s=SEATS.find(x=>x.id===mySeat);mySeat=null;if(s.stand)rig.object3D.position.set(s.stand[0],0,s.stand[1]);else{const c=tableCenter(s.table);
 rig.object3D.position.set(clampX(s.x+(s.x-c.x)*.45),0,clampZ(s.z+(s.z-c.z)*.45));}route=[];socket.emit('seat',null);updateWhere();}
function updateWhere(){const t=mySeat&&mySeat.split('-')[0];$('where').textContent=t==='BAR'?'🍸 바 스툴':t?'🛋 '+t.slice(1)+'번 테이블':'🌐 로비';}
AFRAME.registerComponent('my-sync',{tick(t,dt){dt=Math.min(dt||16,50)/1000;const p=rig.object3D.position;moving=false;
 if(joined){let f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),r=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  let mx=0,mz=0,ignore=null;
  if(f||r){if(mySeat)stand();const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw),rx=Math.cos(camYaw),rz=-Math.sin(camYaw);mx=fx*f+rx*r;mz=fz*f+rz*r;}
  else if(goal&&!mySeat){mx=goal.x-p.x;mz=goal.z-p.z;const d=Math.hypot(mx,mz);if(goalSeat&&!goalSeat.stand)ignore=tableCenter(goalSeat.table);
   if(d<.12&&route.length){goal=route.shift();}else if(d<.12||(goalSeat&&d<.8)){if(goalSeat){sit(goalSeat);}goal=null;mx=mz=0;marker.setAttribute('visible',false);}}
  const l=Math.hypot(mx,mz);
  if(l>1e-4&&!mySeat){mx/=l;mz/=l;const sp=4*dt;let nx=clampX(p.x+mx*sp),nz=clampZ(p.z+mz*sp);
   if(!blocked(nx,nz,ignore)){p.x=nx;p.z=nz;moving=true;}
   else if(!blocked(nx,p.z,ignore)){p.x=nx;moving=true;}else if(!blocked(p.x,nz,ignore)){p.z=nz;moving=true;}
   else if(goal){goal=null;goalSeat=null;marker.setAttribute('visible',false);sys('앞이 막혀서 멈췄어요');}
   const target=Math.atan2(mx,mz);let d=target-myYaw;d=Math.atan2(Math.sin(d),Math.cos(d));myYaw+=d*Math.min(1,dt*12);}
  // 멈춘 채 의자 0.8m 이내면 자동으로 앉기
  if(!mySeat&&!moving&&!goal){stillT+=dt;if(stillT>.6){const s=nearestSeat(.8);if(s)sit(s);stillT=0;}}else stillT=0;
  {const ss=mySeat&&SEATS.find(q=>q.id===mySeat);const hy=mySeat?(ss.y||0):heightAt(p.x,p.z);p.y+=(hy-p.y)*Math.min(1,dt*14);}if(!mySeat)$('prompt').classList.add('hidden');}
 if(!mySeat&&!moving&&!goal&&joined){idleT+=dt;if(idleT>3&&!myDance)myDance=1+Math.floor(Math.random()*3);}else{idleT=0;myDance=0;}
 myAv.object3D.rotation.y=myYaw;if(myAv._h)myAv._h.play(mySeat?'Sitting_Idle_Loop':(moving?'Walk_Loop':(myDance?'Dance_'+myDance:'Idle_Loop')));
 const tx=p.x,ty=p.y+(mySeat?.95:1.1),tz=p.z;let d=camDist;
 if(camGoal){let d=camGoal.yaw-camYaw;d=Math.atan2(Math.sin(d),Math.cos(d));camYaw+=d*.08;camPitch+=(camGoal.pitch-camPitch)*.08;if(Math.abs(d)<.002&&Math.abs(camGoal.pitch-camPitch)<.002)camGoal=null;}
 const dir=new THREE.Vector3(Math.sin(camYaw)*Math.cos(camPitch),Math.sin(camPitch),Math.cos(camYaw)*Math.cos(camPitch));
 for(;d>1.2;d-=.1){const cx=tx+dir.x*d,cy=ty+dir.y*d,cz=tz+dir.z*d;if(cx>ROOM.x0&&cx<ROOM.x1&&cz>ROOM.z0&&cz<ROOM.z1&&cy<ROOM.y1)break;}
 const cx=tx+dir.x*d,cy=ty+dir.y*d,cz=tz+dir.z*d;cam.object3D.position.set(cx,cy,cz);cam.object3D.lookAt(2*cx-tx,2*cy-ty,2*cz-tz);
 if(joined&&(!this.last||t-this.last>100)){this.last=t;const k=p.x.toFixed(2)+p.z.toFixed(2)+p.y.toFixed(2)+myYaw.toFixed(2)+myDance;if(k!==this.k){this.k=k;socket.emit('move',{pos:[p.x,p.y,p.z],rot:myYaw,dance:myDance});}}}});
scene.setAttribute('my-sync','');
document.querySelectorAll('#mob button[data-k]').forEach(b=>{const k=b.dataset.k;const on=v=>e=>{e.preventDefault();keys[k]=v;if(v){goal=null;goalSeat=null;marker.setAttribute('visible',false);}};
 b.addEventListener('pointerdown',on(true));b.addEventListener('pointerup',on(false));b.addEventListener('pointerleave',on(false));b.addEventListener('pointercancel',on(false));});
// ---------- 채팅 (전체) ----------
function chatBottom(){const m=$('msgs');if(!m)return;const f=()=>{m.scrollTop=m.scrollHeight;};f();requestAnimationFrame(()=>{f();requestAnimationFrame(f);});setTimeout(f,60);setTimeout(f,300);}
function addMsg(html,force){const m=$('msgs');const near=force||m.scrollHeight-m.scrollTop-m.clientHeight<80;const d=document.createElement('div');d.innerHTML=html;m.appendChild(d);while(m.children.length>100)m.firstChild.remove();if(near)chatBottom();}
window.addEventListener('resize',()=>chatBottom());
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function sys(t){addMsg(`<i style="color:#aaa">${esc(t)}</i>`);}
$('chatIn').addEventListener('focus',()=>{for(const k in keys)keys[k]=false;});
$('chatIn').addEventListener('keydown',e=>e.stopPropagation());
$('chatForm').onsubmit=e=>{e.preventDefault();const t=$('chatIn').value.trim();if(t)socket.emit('chat',t);$('chatIn').value='';};
socket.on('chatHistory',h=>{$('msgs').innerHTML='';if(!h||!h.length)return;const hm=t=>{const d=new Date(t);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};for(const m of h)addMsg(`<span style="opacity:.55"><small style="color:#888">${hm(m.t)}</small> <b style="color:#ffd84a">${esc(m.nick)}</b>: ${esc(m.text)}</span>`);addMsg('<div style="text-align:center;color:#888;font-size:11px;opacity:.8">— 이전 채팅 —</div>');;chatBottom();});
socket.on('chat',m=>{if(m.sys){sys(m.text);return;}bubble(m.id,m.text);addMsg(`<b style="color:#ffd84a">${esc(m.nick)}</b>: ${esc(m.text)}`);});
// ---------- 네트워크 ----------
socket.on('init',d=>{myId=d.id;clearOthers();for(const id in d.players)upsertOther({id,...d.players[id]});setMusic(d.music);if(joined)socket.emit('join',{...me,clientId:CID},r=>{if(r&&!r.ok){joined=false;nickErr();}});});
socket.on('disconnect',clearOthers);
socket.on('player',upsertOther);
socket.on('move',m=>{const o=others[m.id];if(o){o.dance=m.dance||0;if(!o.seat){o.target.set(...m.pos);o.rot=m.rot;}}});
socket.on('seat',({id,seat})=>{const o=others[id];if(o)applySeatPose(o,seat);});
function removeOther(id){const o=others[id];if(o){try{if(o.el._h){HUMANS.delete(o.el._h);o.el._h.dispose();}}catch(e){}o.el.remove();delete others[id];}}
function clearOthers(){for(const id in others)removeOther(id);}
socket.on('leave',removeOther);
// ---------- 공유 음악 (MP3 업로드 + 유튜브) ----------
let music={playlist:[],index:-1,playing:false},offset=0,userGesture=false;const audio=$('audio');
let muted=localStorage.getItem('muted')==='1',volume=+(localStorage.getItem('vol')||80);$('vol').value=volume;
let yt=null,ytReady=false,ytVid=null;
window.onYouTubeIframeAPIReady=()=>{yt=new YT.Player('yt',{width:200,height:200,playerVars:{autoplay:0,controls:0,disablekb:1,playsinline:1,rel:0},
 events:{onReady:()=>{ytReady=true;applyMusic(true);},onStateChange:e=>{if(e.data===YT.PlayerState.PLAYING||e.data===YT.PlayerState.CUED){const d=yt.getDuration();if(d>1)reportDur(d);}if(e.data===YT.PlayerState.ENDED)socket.emit('music',{type:'ended',index:music.index});},
  onError:e=>{const code=e.data;sys('⚠ 유튜브 재생 불가('+({2:'잘못된 ID',5:'HTML5 오류',100:'삭제/비공개',101:'퍼가기 금지',150:'퍼가기 금지'}[code]||code)+') → 다음 곡');socket.emit('music',{type:'error',index:music.index});}}});};
function setMusic(m){music=m;offset=m.serverNow-Date.now();window.MUSIC_PLAYING=!!(m.playing&&m.playlist[m.index]);renderMusic();applyMusic(true);}
socket.on('music',setMusic);
function curDur(){const c=music.playlist[music.index];return c&&(c.dur||(music.durations||{})[c.type==='yt'?c.videoId:c.id]);}
function reportDur(sec){const c=music.playlist[music.index];if(c&&sec>1&&!curDur())socket.emit('duration',{index:music.index,sec});}
function curPos(){return music.playing?(Date.now()+offset-music.startedAt)/1000:(music.pausedAt||0)/1000;}
function renderMusic(){const cur=music.playlist[music.index];$('shufBtn').textContent=music.shuffle?'🔀 랜덤 켬':'🔀 랜덤 끔';$('shufBtn').classList.toggle('sel',!!music.shuffle);$('now').textContent=cur?(music.shuffle?'🔀 ':'')+(music.playing?'▶ ':'⏸ ')+(cur.type==='yt'?'📺 ':'')+cur.title:'재생 중인 곡 없음';
 $('pl').classList.toggle('hidden',!adminToken);$('pl').innerHTML=!adminToken?'':music.playlist.map((t,i)=>`<li class="${i===music.index?'cur':''}">${t.type==='yt'?'📺 ':''}${esc(t.title)} <small>(${esc(t.by)})</small>${adminToken?` <button data-sel="${i}">▶</button><button data-del="${i}">🗑</button>`:''}</li>`).join('');
 $('adminCtl').classList.toggle('hidden',!adminToken);$('adminBtn').textContent=adminToken?'🔑ON':'🔑';$('muteBtn').textContent=muted?'🔇':'🔊';}
function applyVolume(){audio.volume=volume/100;audio.muted=muted;if(ytReady){yt.setVolume(volume);muted?yt.mute():yt.unMute();}}
function applyMusic(force){applyVolume();const cur=music.playlist[music.index];
 if(!cur||cur.type!=='mp3'){audio.pause();}
 if(!cur||cur.type!=='yt'){if(ytReady&&ytVid){yt.stopVideo();ytVid=null;}}
 if(!cur)return;const pos=curPos(),wantPlay=music.playing&&!muted&&userGesture;
 if(cur.type==='mp3'){if(!audio.src.endsWith(cur.url))audio.src=cur.url;
  const go=()=>{if(force||Math.abs(audio.currentTime-pos)>1.5){if(isFinite(audio.duration)){reportDur(audio.duration);if(pos>=audio.duration-0.5){audio.pause();return;}audio.currentTime=pos;}}
   if(wantPlay)audio.play().then(()=>$('unmute').classList.add('hidden')).catch(()=>$('unmute').classList.remove('hidden'));else audio.pause();};
  audio.readyState>=1?go():audio.addEventListener('loadedmetadata',go,{once:true});}
 else if(ytReady){if(ytVid!==cur.videoId){ytVid=cur.videoId;wantPlay?yt.loadVideoById(cur.videoId,pos):yt.cueVideoById(cur.videoId,pos);}
  else{const d=yt.getDuration&&yt.getDuration();if(d>1)reportDur(d);if(d>1&&pos>=d-0.5){yt.pauseVideo();return;} // 곡 끝 지남: 처음부터 다시 틀지 않고 서버의 다음 곡을 기다림
   if(force||Math.abs(yt.getCurrentTime()-pos)>2)yt.seekTo(pos,true);wantPlay?yt.playVideo():yt.pauseVideo();}
  if(wantPlay)setTimeout(()=>{const st=yt.getPlayerState&&yt.getPlayerState();if(music.playing&&!muted&&st!==1&&st!==3)$('unmute').classList.remove('hidden');else $('unmute').classList.add('hidden');},2500);}}
$('unmute').onclick=()=>{userGesture=true;muted=false;localStorage.setItem('muted','0');renderMusic();applyMusic(true);$('unmute').classList.add('hidden');};
$('muteBtn').onclick=()=>{muted=!muted;localStorage.setItem('muted',muted?'1':'0');userGesture=true;renderMusic();applyMusic(true);};
$('vol').oninput=()=>{volume=+$('vol').value;localStorage.setItem('vol',volume);applyVolume();};
audio.addEventListener('ended',()=>socket.emit('music',{type:'ended',index:music.index}));
audio.addEventListener('error',()=>{if(music.playlist[music.index]&&music.playlist[music.index].type==='mp3'&&audio.src){socket.emit('music',{type:'error',index:music.index});}});
setInterval(()=>{if(music.playing&&!muted&&userGesture)applyMusic(false);},5000);
// ---------- 관리자 ----------
$('adminBtn').onclick=async()=>{if(adminToken){if(confirm('관리자 로그아웃할까요?')){adminToken=null;sessionStorage.removeItem('adminToken');renderMusic();}return;}
 const pw=prompt('관리자 비밀번호');if(!pw)return;const r=await fetch('/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
 const j=await r.json();if(j.token){adminToken=j.token;sessionStorage.setItem('adminToken',j.token);sys('관리자 로그인 완료');renderMusic();}else alert(j.error);};
const cmd=(type,extra)=>socket.emit('music',{type,token:adminToken,...extra});
document.querySelectorAll('#adminCtl > button').forEach(b=>b.onclick=()=>cmd(b.dataset.c));
$('pl').onclick=e=>{const b=e.target;if(b.dataset.sel)cmd('select',{index:+b.dataset.sel});if(b.dataset.del&&confirm('이 곡을 삭제할까요?'))cmd('delete',{index:+b.dataset.del});};
function adminFail(r){if(r.status===403){adminToken=null;sessionStorage.removeItem('adminToken');renderMusic();}}
$('file').onchange=async()=>{const f=$('file').files[0];if(!f)return;if(f.size>30*1024*1024){$('upMsg').textContent='30MB 초과';return;}
 const fd=new FormData();fd.append('by',me.nick||'관리자');fd.append('file',f);$('upMsg').textContent='업로드 중...';
 const r=await fetch('/upload',{method:'POST',headers:{'x-admin-token':adminToken},body:fd});const j=await r.json();$('upMsg').textContent=r.ok?'완료!':(j.error||'실패');adminFail(r);$('file').value='';};
$('ytForm').onsubmit=async e=>{e.preventDefault();const url=$('ytUrl').value.trim();if(!url)return;$('upMsg').textContent='유튜브 불러오는 중...';
 const r=await fetch('/youtube',{method:'POST',headers:{'Content-Type':'application/json','x-admin-token':adminToken},body:JSON.stringify({url,by:me.nick||'관리자'})});
 const j=await r.json();$('upMsg').textContent=r.ok?`${j.added}곡 추가!`:(j.error||'실패');adminFail(r);if(r.ok)$('ytUrl').value='';};
