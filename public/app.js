const CID=localStorage.getItem('cid')||(()=>{const v=(crypto.randomUUID?crypto.randomUUID():Date.now()+''+Math.random()).toString();localStorage.setItem('cid',v);return v;})();
// ===== ERRDAY 나이트클럽: 아바타 · 이동 · 채팅 · 음악 =====
const socket=io({transports:['websocket','polling']});const $=id=>document.getElementById(id);
const COLORS=['#2b3352','#9a9cc0','#2a3f9e','#2fb8b0','#2f8f45','#e2525c','#c8102e','#ffd400','#ff69b4','#7b2cbf','#ff8c00','#f5f5f5','#ff2fa6','#9cf03a','#4fc3ff','#b04cff'];
const JOINT={suit:'#1a1a1a',disco:'#ffd700',hanbok:'#ffffff',aerobic:'#ff2fa6'};
let me={nick:'',gender:'m',style:'suit',outfit:'#2b3352',skin:'#f2c29a'},myId=null,joined=false,mySeat=null,adminToken=sessionStorage.getItem('adminToken');
try{Object.assign(me,JSON.parse(localStorage.getItem('profile')||'{}'));}catch(e){}delete me.hat;if(!['suit','disco','hanbok','aerobic'].includes(me.style))me.style='suit';
const others={};const scene=document.querySelector('a-scene');
const humanOpts=p=>({...LOOKS.resolve(p),outfit:p.outfit||null,skin:p.skin||'#f2c29a',gender:p.gender==='f'?'f':'m',style:['suit','disco','hanbok','aerobic'].includes(p.style)?p.style:'suit'});
const SKINS=['#f2c29a','#ffdcc0','#d9a074','#a8724a'];
const STYLE_NAMES={m:{suit:'정장',disco:'디스코',hanbok:'한복',aerobic:'에어로빅'},f:{suit:'정장',disco:'디스코',hanbok:'한복',aerobic:'에어로빅'}};
// 모바일 성능: 픽셀 비율 낮추기
scene.addEventListener('loaded',()=>{if(IS_MOBILE&&scene.renderer)scene.renderer.setPixelRatio(Math.min(1.25,devicePixelRatio));});
// ---------- 입장 화면 ----------
const palHtml=k=>LOOKS.PALETTE.map(([c,n])=>`<span class="swatch ${k}" data-v="${c}" title="${n}" style="background:${c}"></span>`).join('');$('swTop').innerHTML=palHtml('tp');$('swBot').innerHTML=palHtml('bt');
$('accs').innerHTML=LOOKS.ACC.map(a=>`<button class="opt a" data-v="${a}">${LOOKS.ACC_NAME[a]}</button>`).join('');
function renderHairs(){$('hairs').innerHTML=LOOKS.HAIR[me.gender==='f'?'f':'m'].map(([k,n])=>`<button class="opt h${(me.hair||'')===k?' sel':''}" data-v="${k}">${n}</button>`).join('');}
function fillLook(){const r=LOOKS.resolve(me);me.top=r.top;me.bottom=r.bottom;me.acc=r.acc;me.hair=r.hair;}
$('skins').innerHTML=SKINS.map(c=>`<span class="swatch sk" data-v="${c}" style="background:${c}"></span>`).join('');
function renderStyles(){$('styles').innerHTML=Object.entries(STYLE_NAMES[me.gender==='f'?'f':'m']).map(([k,v])=>`<button class="opt s${me.style===k?' sel':''}" data-v="${k}">${v}</button>`).join('');}
// 미리보기 (작은 3D 캔버스)
let pv=null;function initPreview(){const cv=$('preview');const r=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true});r.setPixelRatio(Math.min(2,devicePixelRatio));r.setSize(cv.clientWidth||150,cv.clientHeight||162,false);
 const sc=new THREE.Scene();sc.add(new THREE.AmbientLight('#fff',1.4));const dl=new THREE.DirectionalLight('#fff',1.6);dl.position.set(1,2,3);sc.add(dl);
 const cm=new THREE.PerspectiveCamera(30,(cv.clientWidth||150)/(cv.clientHeight||162),.1,20);cm.position.set(0,.85,3.6);cm.lookAt(0,.75,0);pv={r,sc,cm,c:null,t:0};
 (function loop(){requestAnimationFrame(loop);if($('entry').classList.contains('hidden')||!pv.c)return;pv.t+=1/60;pv.c.root.rotation.y=Math.sin(pv.t*.8)*.6;animateChibi(pv.c,'idle',pv.t,{});r.render(sc,cm);})();}
function updatePreview(){if(!pv)initPreview();if(pv.c)pv.sc.remove(pv.c.root);pv.c=makeChibi(humanOpts(me));pv.sc.add(pv.c.root);}
function syncOpts(){fillLook();renderHairs();$('nick').value=me.nick;document.querySelectorAll('#swTop .swatch').forEach(b=>b.classList.toggle('sel',b.dataset.v===me.top));document.querySelectorAll('#swBot .swatch').forEach(b=>b.classList.toggle('sel',b.dataset.v===me.bottom));document.querySelectorAll('.opt.a').forEach(b=>b.classList.toggle('sel',b.dataset.v===me.acc));document.querySelectorAll('.opt.g').forEach(b=>b.classList.toggle('sel',b.dataset.v===me.gender));renderStyles();
 document.querySelectorAll('#skins .swatch').forEach(b=>b.classList.toggle('sel',b.dataset.v===me.skin));updatePreview();}
syncOpts();
$('entry').addEventListener('click',e=>{const b=e.target;const resetCol=()=>{const d=LOOKS.DEF[me.gender==='f'?'f':'m'][me.style];me.top=d[0];me.bottom=d[1];delete me.outfit;};
 if(b.classList.contains('g')){me.gender=b.dataset.v;me.hair='';resetCol();}if(b.classList.contains('s')){me.style=b.dataset.v;resetCol();}
 if(b.classList.contains('sk'))me.skin=b.dataset.v;else if(b.classList.contains('tp')){me.top=b.dataset.v;delete me.outfit;}else if(b.classList.contains('bt')){me.bottom=b.dataset.v;delete me.outfit;}
 if(b.classList.contains('h'))me.hair=b.dataset.v;if(b.classList.contains('a'))me.acc=b.dataset.v;me.nick=$('nick').value;syncOpts();});
$('enter').onclick=()=>{if(window.enterFullscreenMobile&&!window.AUTO_JOIN)enterFullscreenMobile();me.nick=$('nick').value.trim()||('손님'+Math.floor(Math.random()*1000));localStorage.setItem('profile',JSON.stringify(me));
 $('entry').classList.add('hidden');$('hud').classList.remove('hidden');chatBottom();
 const ev=joined?'profile':'join';socket.emit(ev,{...me,clientId:CID,last:lastState()},r=>{if(r&&!r.ok){nickErr(r.error);return;}joined=true;localStorage.setItem('joinedAt',Date.now());enterOk();if(r&&r.resume)setTimeout(()=>resumeState(r.resume),50);});};
// 앱(설치 모드)이 백그라운드에서 종료됐다 다시 열려도 이어서: 위치·자리·들고있는 것까지 localStorage 에 (6시간)
const RESUME_MS=6*3600*1000;
function lastState(){try{const v=JSON.parse(localStorage.getItem('lastState')||sessionStorage.getItem('lastState')||'null');return v&&Date.now()-v.t<RESUME_MS?v:null;}catch(e){return null;}}
function saveState(){if(!joined)return;try{const p=rig.object3D.position,m=$('myAvatar');localStorage.setItem('lastState',JSON.stringify({t:Date.now(),pos:[p.x,p.y,p.z],rot:myYaw,seat:mySeat,carry:myCarry||null,drinks:(m._h&&m._h.drinks)||[]}));}catch(e){}}
setInterval(saveState,1000);addEventListener('pagehide',saveState);addEventListener('freeze',saveState);
// 돌아왔을 때: 소켓 즉시 재연결 + 음악 위치 다시 맞춤
function wake(){if(!socket.connected)socket.connect();if(joined){setTimeout(()=>{applyMusic(true);},300);}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveState();else wake();});addEventListener('pageshow',e=>{if(e.persisted)wake();});addEventListener('resume',wake);addEventListener('focus',wake);
// 새로 열렸는데(앱이 OS에 의해 종료된 경우) 최근에 입장했었다면 입장 화면 없이 자동 입장
function autoJoinOk(){try{const a=+localStorage.getItem('joinedAt')||0;return !!me.nick&&Date.now()-a<RESUME_MS&&!sessionStorage.getItem('noAuto');}catch(e){return false;}}
if(autoJoinOk()){$('entry').classList.add('hidden');const tryAuto=()=>{if($('enter').disabled)return setTimeout(tryAuto,200);window.AUTO_JOIN=true;$('enter').onclick();};tryAuto();}
function resumeState(r){const m=$('myAvatar');if(m._h&&r.drinks)m._h.drinks=r.drinks.slice();if(r.carry!==undefined){myCarry=r.carry;if(m._h)m._h.carry(r.carry);if(typeof refreshAct==='function')refreshAct(true);}
 const s=r.seat&&SEATS.find(x=>x.id===r.seat);if(s){for(const id in others)if(others[id].data&&others[id].data.nick===me.nick&&id!==myId)removeOther(id); /* 재접속 전 내 예전 접속이 자리를 쥔 것처럼 보이는 문제 */mySeat=null;sit(s);}else if(r.pos){rig.object3D.position.set(...r.pos);if(Number.isFinite(r.rot))myYaw=r.rot;}}
function nickErr(why){if(why==='kicked')return;$('entry').classList.remove('hidden');$('hud').classList.add('hidden');alert(why==='bad'?'사용할 수 없는 닉네임이에요':'이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해 주세요.');$('nick').focus();}
function enterOk(){
 buildAvatar($('myAvatar'),{...me,id:myId},true);$('enter').textContent='입장하기 (소리 켜짐)';userGesture=true;applyMusic(true);
 if(window.AUTO_JOIN){window.AUTO_JOIN=false;sys('🔄 이어서 입장했어요');}}
$('setBtn').onclick=()=>{$('enter').textContent='저장';$('entry').classList.remove('hidden');};
// 모바일: 채팅/음악 패널은 같은 자리라 하나만 열림 (음악 패널이 채팅을 가리던 문제 수정)
$('chatToggle').onclick=()=>{const h=$('hud');h.classList.toggle('showChat');if(h.classList.contains('showChat')){h.classList.remove('showMusic');clearTimeout(chatHoldT);chatHold=0;chatBottom(true);}};
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
  if(cam&&cv&&this.el.isConnected&&!(mySeat&&mySeat.startsWith('TH-'))){this.el.object3D.getWorldPosition(_lp);_lp.project(cam);const r=cv.getBoundingClientRect();
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
 const key=[p.nick,p.gender,p.style,p.outfit,p.top,p.bottom,p.acc,p.hair,p.skin].join('|');if(o.key!==key){o.key=key;buildAvatar(o.el,p);}if(p.drinks&&o.el._h&&!(o.el._h.drinks||[]).length)o.el._h.drinks=p.drinks.slice();o.data=p;o.dance=p.dance||0;applySeatPose(o,p.seat);}
function applySeatPose(o,seat){o.seat=seat;const s=SEATS.find(x=>x.id===seat);if(s){o.target.set(s.x,s.y||0,s.z);o.rot=s.yaw;}}
AFRAME.registerComponent('others-lerp',{tick(){for(const id in others){const o=others[id],p=o.el.object3D.position,d=p.distanceTo(o.target);p.lerp(o.target,.15);
 let r=o.rot-o.el.object3D.rotation.y;r=Math.atan2(Math.sin(r),Math.cos(r));o.el.object3D.rotation.y+=r*.2;
 const h=o.el._h;if(h)h.play(o.seat?'Sitting_Idle_Loop':(d>.03?'Walk_Loop':(o.dance?'Dance_'+o.dance:'Idle_Loop')));}}});
scene.setAttribute('others-lerp','');
function bubble(id,text){const el=id===myId?$('myAvatar'):others[id]&&others[id].el;if(!el)return;const b=el.querySelector('.bubble');if(!b)return;
 b.setAttribute('cbubble',{value:text.slice(0,200)});b.setAttribute('visible',true);
 clearTimeout(b._t);b._t=setTimeout(()=>b.setAttribute('visible',false),Math.min(15000,10000+text.length*150));}
// ---------- 3인칭 카메라 · 이동 · 클릭 이동 · 자동 앉기 ----------
const rig=$('rig'),cam=$('cam'),myAv=$('myAvatar'),marker=$('marker');
const keys={};let camGoal=null,myDance=0,idleT=0,camYaw=0,camPitch=.4,camDist=IS_MOBILE?5.5:4.5,myYaw=Math.PI,goal=null,goalSeat=null,stillT=0,moving=false;
let jumpV=null;function jump(){if(!joined||mySeat||jumpV!==null)return;jumpV=5;}window.jump=jump;
const typing=()=>document.activeElement&&document.activeElement.tagName==='INPUT';
window.addEventListener('keydown',e=>{if(typing())return;keys[e.code]=true;if(/Key[WASD]|Arrow/.test(e.code)){route=[];goal=null;goalSeat=null;marker.setAttribute('visible',false);}
 if(e.code==='Space'){e.preventDefault();jump();}
 if(e.code==='KeyE'){mySeat?stand():(()=>{const s=nearestSeat(1.6);if(s)sit(s);})();}if(e.code==='Escape')stand();});
window.addEventListener('keyup',e=>{keys[e.code]=false;});window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
// 포인터: 드래그=회전, 짧은 탭=이동, 두 손가락=줌
const ptrs=new Map();let down=null,pinch0=0,dist0=0,zoom0=1,thZoom=1;const inThSeat=()=>!!(mySeat&&mySeat.startsWith('TH-'));
scene.addEventListener('loaded',()=>{const c=scene.canvas;
 c.addEventListener('pointerdown',e=>{ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});try{c.setPointerCapture(e.pointerId);}catch(_){}
  if(ptrs.size===1)down={x:e.clientX,y:e.clientY,t:performance.now(),moved:0};else{down=null;const [a,b]=[...ptrs.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);dist0=camDist;zoom0=thZoom;}});
 c.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(ptrs.size===2){const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch0){if(inThSeat())thZoom=Math.max(.6,Math.min(1.8,zoom0*pinch0/d));else camDist=Math.max(2,Math.min(10,dist0*pinch0/d));}return;}
  if(down){down.moved+=Math.abs(dx)+Math.abs(dy);if(down.moved>8){camGoal=null;const T=e.pointerType==='touch',sg=T?1.3:1;camYaw-=dx*.006*sg;camPitch=Math.max(mySeat&&mySeat.startsWith('TH-')?-.4:.05,Math.min(1.2,camPitch+dy*.005*sg));}}});
 const up=e=>{ptrs.delete(e.pointerId);if(down&&e.type==='pointerup'&&down.moved<=8&&performance.now()-down.t<600)tapAt(e.clientX,e.clientY);if(ptrs.size===0)down=null;pinch0=0;};
 c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);
 c.addEventListener('wheel',e=>{e.preventDefault();if(inThSeat()){thZoom=Math.max(.6,Math.min(1.8,thZoom*(1+e.deltaY*.001)));return;}camDist=Math.max(2,Math.min(10,camDist+e.deltaY*.004));},{passive:false});});
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
function setRoute(x,z){const p=rig.object3D.position,onSt=(X,Z)=>X>=STAGE.x0-.3&&X<=STAGE.x1+.3&&Z<=STAGE.sz1&&heightAt(X,Z)>.35,up=onSt(x,z),me_up=onSt(p.x,p.z);route=[];
 const bottom=new THREE.Vector3(0,0,STAGE.sz1+.35),top=new THREE.Vector3(0,0,STAGE.sz0-.35);
 if(up&&!me_up)route=[bottom,top];else if(!up&&me_up)route=[top,bottom];
 if(isOut(z)!==isOut(p.z)){const D0=window.DOOR,D1=THEATER.CLUB_DOOR,dd=d=>Math.abs(p.x-d.x)+Math.abs(x-d.x),D=dd(D1)<dd(D0)?D1:D0,a=new THREE.Vector3(D.x,0,11.1),b=new THREE.Vector3(D.x,0,12.9);if(isOut(z))route.push(a,b);else route.push(b,a);}
 {const inZ=(X,Z)=>{const B=window.BAR_ZONE;return B&&X>=B.x0-.1&&X<=B.x1&&Z>=B.z0&&Z<=B.z1;},N=(p.z+z)/2<2.25,A=new THREE.Vector3(9.9,0,N?-2.4:6.8),Bv=new THREE.Vector3(11.02,0,N?-2.4:6.8);
  if(inZ(x,z)&&!inZ(p.x,p.z))route.push(A,Bv);else if(!inZ(x,z)&&inZ(p.x,p.z))route.push(Bv,A);}
 route.push(new THREE.Vector3(x,0,z));goal=route.shift();showMarker(x,z,heightAt(x,z));}
function showMarker(x,z,y=0){marker.object3D.position.set(x,y+.06,z);marker.setAttribute('visible',true);}
const BOUND={x0:-11.4,x1:13.4,z0:-11.4,z1:25.4},ROOM_IN={x0:-11.8,x1:11.8,z0:-11.8,z1:11.8,y1:7.8},ROOM_OUT={x0:-13.5,x1:25.5,z0:12.2,z1:25.8,y1:14};let ROOM=ROOM_IN;
const isOut=z=>z>12;
// 앞벽(문 구멍 제외)은 사각 장애물
{const D=window.DOOR,dl=D.x-D.w/2,dr=D.x+D.w/2;OBSTACLES.push({x0:11.6,x1:14,z0:-12.5,z1:12.15},{x0:-12.5,x1:dl,z0:11.85,z1:12.15},{x0:dr,x1:THEATER.CLUB_DOOR.x-THEATER.CLUB_DOOR.w/2,z0:11.85,z1:12.15},{x0:THEATER.CLUB_DOOR.x+THEATER.CLUB_DOOR.w/2,x1:12.5,z0:11.85,z1:12.15});}
// 카메라 충돌: 벽·바·무대 구조물을 상자(AABB)로 근사해 머리→카메라 광선 검사 (모바일에서도 가벼움)
const CAM_OCC=[[10-.65,0,-1.65,10+.65,1.3,6.15],[9.4,1.2,6,10.6,2.3,6.15],[9.45,0,7.45,10.55,1.3,7.75],[11.4,0,-1.6,12.5,3.9,7.6],[-3.6,0,-11.8,3.6,4.9,-11.45],[-5.6,.7,-11.6,-3.5,5.5,-11.05],[3.5,.7,-11.6,5.6,5.5,-11.05],[-5.6,4.8,-11.4,5.6,5.5,-11],[1.65,.7,-9.45,4.35,1.95,-8.55],[TENT.x0-.1,TENT.e-.1,TENT.z0-.1,TENT.x1+.1,TENT.r+.2,TENT.z1+.1],[TENT.x0,.4,TENT.z1-.1,TENT.x1,TENT.e,TENT.z1+.1],[-.6,0,15.3,2.2,1.1,16.7],THEATER.camOcc[THEATER.camOcc.length-1]];const CAM_SKIP=new Set([3]); // 벽은 카메라를 막지 않음 (대신 가리는 벽을 숨김)
function camHit(ox,oy,oz,dr,max,bt){let t=max;const lim=[[dr.y,oy,.25,ROOM.y1-.1]];
 for(const [v,o,a,b] of lim){if(v>1e-6)t=Math.min(t,(b-o)/v);else if(v<-1e-6)t=Math.min(t,(a-o)/v);}
 const O=[ox,oy,oz],D=[dr.x,dr.y,dr.z];for(const bx of (window.IN_THEATER?CAM_OCC.concat(THEATER.camOcc):CAM_OCC)){if(bx===CAM_OCC[3]||(bt&&bx===CAM_OCC[0]))continue;let t0=0,t1=t,ok=true;for(let i=0;i<3&&ok;i++){const lo=bx[i],hi=bx[i+3];
  if(Math.abs(D[i])<1e-6){if(O[i]<lo||O[i]>hi)ok=false;}else{let a=(lo-O[i])/D[i],b=(hi-O[i])/D[i];if(a>b)[a,b]=[b,a];t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1)ok=false;}}
  if(ok&&t0>0)t=Math.min(t,t0);}return t;}
const clampX=x=>Math.max(window.OUTSIDE?-12.35:BOUND.x0,Math.min(window.OUTSIDE?THEATER.T.x1-.45:BOUND.x1,x)),clampZ=z=>Math.max(BOUND.z0,Math.min(BOUND.z1,z));
function blocked(x,z,ignoreSeatTable){const p0=rig.object3D.position;if(heightAt(x,z)-Math.max(p0.y,heightAt(p0.x,p0.z))>.2)return true;for(const o of OBSTACLES){if(o.r!==undefined){if(ignoreSeatTable&&Math.hypot(o.x-ignoreSeatTable.x,o.z-ignoreSeatTable.z)<.01)continue;if(Math.hypot(x-o.x,z-o.z)<o.r+.25)return true;}
 else if(x>o.x0-.25&&x<o.x1+.25&&z>o.z0-.25&&z<o.z1+.25)return true;}return false;}
function seatTaken(s){return Object.values(others).some(o=>o.seat===s.id);}
function nearestSeat(maxD){const p=rig.object3D.position;let best=null,bd=maxD;for(const s of SEATS){const d=Math.hypot(s.x-p.x,s.z-p.z);if(d<bd&&!seatTaken(s)){bd=d;best=s;}}return best;}
function tableCenter(t){const ss=SEATS.filter(s=>s.table===t);return{x:ss.reduce((a,s)=>a+s.x,0)/ss.length,z:ss.reduce((a,s)=>a+s.z,0)/ss.length};}
function sit(s){if(!s||seatTaken(s))return;mySeat=s.id;goal=null;goalSeat=null;marker.setAttribute('visible',false);rig.object3D.position.set(s.x,s.y||0,s.z);myYaw=s.yaw;{const bar=s.table==='BAR';camGoal=s.table==='TH'?THEATER.aim(s):bar?{yaw:myYaw+Math.PI,pitch:.4}:{yaw:myYaw,pitch:.4};}
 socket.emit('seat',s.id);socket.emit('move',{pos:[s.x,s.y||0,s.z],rot:myYaw});updateWhere();}
function stand(){if(!mySeat)return;camGoal=null;const s=SEATS.find(x=>x.id===mySeat);mySeat=null;if(s.stand)rig.object3D.position.set(s.stand[0],0,s.stand[1]);else{const c=tableCenter(s.table);
 rig.object3D.position.set(clampX(s.x+(s.x-c.x)*.45),0,clampZ(s.z+(s.z-c.z)*.45));}route=[];socket.emit('seat',null);updateWhere();}
function updateWhere(){document.body.classList.toggle('thseat',!!(mySeat&&mySeat.startsWith('TH-')));const t=mySeat&&mySeat.split('-')[0];$('where').textContent=t==='BAR'?'🍸 바 스툴':t==='TH'?'🎬 극장':window.IN_THEATER?'🎬 극장':t&&t[0]==='Y'?'🏮 야장':t?'🛋 테이블':'🌐 로비';}
AFRAME.registerComponent('my-sync',{tick(t,dt){dt=Math.min(dt||16,50)/1000;const p=rig.object3D.position;moving=false;
 if(joined){let f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),r=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  let mx=0,mz=0,ignore=null,spd=1;if(joyX||joyY){f=-joyY;r=joyX;spd=Math.min(1,Math.hypot(f,r));}
  if(f||r){if(mySeat)stand();const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw),rx=Math.cos(camYaw),rz=-Math.sin(camYaw);mx=fx*f+rx*r;mz=fz*f+rz*r;}
  else if(goal&&!mySeat){mx=goal.x-p.x;mz=goal.z-p.z;const d=Math.hypot(mx,mz);if(goalSeat&&!goalSeat.stand)ignore=tableCenter(goalSeat.table);
   if(d<.12&&route.length){goal=route.shift();}else if(d<.12||(goalSeat&&d<.8)){if(goalSeat){sit(goalSeat);}goal=null;mx=mz=0;marker.setAttribute('visible',false);}}
  const l=Math.hypot(mx,mz);
  if(l>1e-4&&!mySeat){mx/=l;mz/=l;const sp=4*dt*spd;let nx=clampX(p.x+mx*sp),nz=clampZ(p.z+mz*sp);
   if(!blocked(nx,nz,ignore)){p.x=nx;p.z=nz;moving=true;}
   else if(!blocked(nx,p.z,ignore)){p.x=nx;moving=true;}else if(!blocked(p.x,nz,ignore)){p.z=nz;moving=true;}
   else if(goal){goal=null;goalSeat=null;marker.setAttribute('visible',false);sys('앞이 막혀서 멈췄어요');}
   const target=Math.atan2(mx,mz);let d=target-myYaw;d=Math.atan2(Math.sin(d),Math.cos(d));myYaw+=d*Math.min(1,dt*12);}
  // 멈춘 채 의자 0.8m 이내면 자동으로 앉기
  if(!mySeat&&!moving&&!goal){stillT+=dt;if(stillT>.6){const s=nearestSeat(.8);if(s)sit(s);stillT=0;}}else stillT=0;
  {const ss=mySeat&&SEATS.find(q=>q.id===mySeat);const hy=mySeat?(ss.y||0):heightAt(p.x,p.z);if(mySeat)jumpV=null;else if(jumpV===null&&p.y-hy>.25)jumpV=0;if(jumpV!==null){jumpV-=14*dt;p.y+=jumpV*dt;if(p.y<=hy&&jumpV<0){p.y=hy;jumpV=null;}}else p.y+=(hy-p.y)*Math.min(1,dt*14);}if(!mySeat)$('prompt').classList.add('hidden');}
 if(!mySeat&&!moving&&!goal&&joined){idleT+=dt;if(idleT>3&&!myDance)myDance=1+Math.floor(Math.random()*3);}else{idleT=0;myDance=0;}
 myAv.object3D.rotation.y=myYaw;if(myAv._h)myAv._h.play(mySeat?'Sitting_Idle_Loop':(moving?'Walk_Loop':(myDance?'Dance_'+myDance:'Idle_Loop')));
 {const out=isOut(p.z);ROOM=out?ROOM_OUT:ROOM_IN;if(out!==window.OUTSIDE){window.OUTSIDE=out;applyVolume();}const th=THEATER.inside(p.x,p.z);if(th!==!!window.IN_THEATER){window.IN_THEATER=th;applyVolume();updateWhere();applySubs();}}
 const tx=p.x,ty=p.y+(mySeat?.95:1.1)+(mySeat&&mySeat.startsWith('TH-')?THEATER.CAM_LIFT:0),tz=p.z;let d=camDist;
 if(camGoal){let d=camGoal.yaw-camYaw;d=Math.atan2(Math.sin(d),Math.cos(d));const k=1-Math.exp(-dt*5);camYaw+=d*k;camPitch+=(camGoal.pitch-camPitch)*k;if(Math.abs(d)<.002&&Math.abs(camGoal.pitch-camPitch)<.002)camGoal=null;}
 const dir=new THREE.Vector3(Math.sin(camYaw)*Math.cos(camPitch),Math.sin(camPitch),Math.cos(camYaw)*Math.cos(camPitch));
 {const bt=!mySeat&&p.x>10.45&&p.x<11.6&&p.z>-2.2&&p.z<7.5;const hit=camHit(tx,ty,tz,dir,d,bt);const want=Math.max(1.0,Math.min(d,hit-.3));if(this.cd===undefined||want<this.cd)this.cd=want;else this.cd+=(want-this.cd)*Math.min(1,dt*6);d=this.cd;}
 const cx=tx+dir.x*d,cy=ty+dir.y*d,cz=tz+dir.z*d;cam.object3D.position.set(cx,cy,cz);{const hide=cx>11.25&&cz>-2.5&&cz<8.5;if(hide!==window._shelfHid){window._shelfHid=hide;for(const e of (window.SHELF_EL||[]))e.object3D.visible=!hide;}}cam.object3D.lookAt(2*cx-tx,2*cy-ty,2*cz-tz);hideWalls(tx,ty,tz,cx,cy,cz);theaterFov(cx,cy,cz);
 if(joined&&(!this.last||t-this.last>100)){this.last=t;const k=p.x.toFixed(2)+p.z.toFixed(2)+p.y.toFixed(2)+myYaw.toFixed(2)+myDance;if(k!==this.k){this.k=k;socket.emit('move',{pos:[p.x,p.y,p.z],rot:myYaw,dance:myDance});}}}});
scene.setAttribute('my-sync','');
// 가상 조이스틱 (모바일): 카메라 기준 방향, 거리=속도
let joyX=0,joyY=0,joyId=null;{const J=$('mob'),K=$('joyKnob'),R=60;
 const mv=e=>{const r=J.getBoundingClientRect();let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;const l=Math.hypot(x,y);if(l>R){x*=R/l;y*=R/l;}
  K.style.transform=`translate(${x}px,${y}px)`;joyX=x/R;joyY=y/R;if(Math.hypot(joyX,joyY)<.15)joyX=joyY=0;};
 const end=e=>{if(e.pointerId!==joyId)return;joyId=null;joyX=joyY=0;K.style.transform='';};
 J.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(joyId!==null)return;joyId=e.pointerId;J.setPointerCapture(e.pointerId);goal=null;goalSeat=null;marker.setAttribute('visible',false);mv(e);});
 J.addEventListener('pointermove',e=>{if(e.pointerId===joyId){e.preventDefault();mv(e);}});
 J.addEventListener('pointerup',end);J.addEventListener('pointercancel',end);J.addEventListener('lostpointercapture',end);}
// ---------- 채팅 (전체) ----------
let chatHold=0,chatHoldT=null;
function chatAtBottom(m){return m.scrollHeight-m.scrollTop-m.clientHeight<24;}
function chatPoke(){const m=$('msgs');if(!m)return;clearTimeout(chatHoldT);if(chatAtBottom(m)){chatHold=0;return;}chatHold=1;chatHoldT=setTimeout(()=>{chatHold=0;chatBottom(true);},5000);}
(()=>{const m=$('msgs');if(!m)return;for(const ev of ['wheel','touchstart','touchmove','mousedown'])m.addEventListener(ev,()=>setTimeout(chatPoke,50),{passive:true});
 m.addEventListener('scroll',()=>{if(chatHold)chatPoke();},{passive:true});})();
function chatBottom(force){const m=$('msgs');if(!m)return;if(chatHold&&force!==true)return;const f=()=>{m.scrollTop=m.scrollHeight;};f();requestAnimationFrame(()=>{f();requestAnimationFrame(f);});setTimeout(f,60);setTimeout(f,300);}
function addMsg(html,force){const m=$('msgs');const near=force||!chatHold;const d=document.createElement('div');d.innerHTML=html;m.appendChild(d);while(m.children.length>100)m.firstChild.remove();if(near)chatBottom();}
window.addEventListener('resize',()=>chatBottom());
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function sys(t){addMsg(`<i style="color:#aaa">${esc(t)}</i>`);}
$('chatIn').addEventListener('focus',()=>{for(const k in keys)keys[k]=false;});
$('chatIn').addEventListener('keydown',e=>e.stopPropagation());
{const jb=$('jumpBtn');if(jb)jb.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();jump();});}
$('chatForm').onsubmit=e=>{e.preventDefault();const t=$('chatIn').value.trim();if(t)socket.emit('chat',t);$('chatIn').value='';};
socket.on('chatHistory',h=>{$('msgs').innerHTML='';if(!h||!h.length)return;const hm=t=>{const d=new Date(t);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};for(const m of h)addMsg(`<span style="opacity:.55"><small style="color:#888">${hm(m.t)}</small> <b style="color:#ffd84a">${esc(m.nick)}</b>: ${esc(m.text)}</span>`);addMsg('<div style="text-align:center;color:#888;font-size:11px;opacity:.8">— 이전 채팅 —</div>');;chatBottom();});
socket.on('chat',m=>{if(m.sys){sys(m.text);return;}bubble(m.id,m.text);addMsg(`<b style="color:#ffd84a" data-kid="${esc(m.id||'')}" data-knick="${esc(m.nick)}">${esc(m.nick)}</b>: ${esc(m.text)}`);});
socket.on('online',n=>{const e=document.getElementById('onlineCnt');if(e)e.textContent=' · 👥 '+n+'명';});
// ---------- 네트워크 ----------
socket.on('init',d=>{myId=d.id;clearOthers();for(const id in d.players)upsertOther({id,...d.players[id]});setMusic(d.music);if(joined){saveState();socket.emit('join',{...me,clientId:CID,last:lastState()},r=>{if(r&&!r.ok){joined=false;nickErr(r.error);}});}});
socket.on('rekey',({old,id})=>{if(id===myId){if(others[old])removeOther(old);return;}if(!others[old])return;others[id]=others[old];delete others[old];});
socket.on('disconnect',clearOthers);
socket.on('player',upsertOther);
socket.on('snapshot',ps=>{for(const id in others)if(!ps[id])removeOther(id);for(const id in ps)if(id!==myId)upsertOther({id,...ps[id]});});
socket.on('m',a=>{for(let i=0;i<a.length;i+=6){const o=others[a[i]];if(o){o.dance=a[i+5]||0;if(!o.seat){o.target.set(a[i+1],a[i+2],a[i+3]);o.rot=a[i+4];}}}});
socket.on('move',m=>{const o=others[m.id];if(o){o.dance=m.dance||0;if(!o.seat){o.target.set(...m.pos);o.rot=m.rot;}}});
socket.on('seat',({id,seat})=>{const o=others[id];if(o)applySeatPose(o,seat);});
function removeOther(id){const o=others[id];if(o){try{if(o.el._h){HUMANS.delete(o.el._h);o.el._h.dispose();}}catch(e){}o.el.remove();delete others[id];}}
function clearOthers(){for(const id in others)removeOther(id);}
socket.on('leave',removeOther);
socket.on('drink',({id,type})=>{if(id===myId)return;const el=others[id]&&others[id].el;if(el&&el._h)el._h.drink(type);});
const GLASS_EL={};let GLASSES={},TABLE_ITEMS={};const TABLE_EL={};
const ITEM_NAME={soju:'🍶 소주',beer:'🍺 맥주',dakbal:'🍗 닭발',kkom:'🐍 꼼장어',fish:'🐟 생선구이',squid:'🦑 오징어볶음',chicken:'🍗 통닭',hoe:'🐟 모듬회',fruit:'🍉 과일안주'};
function myTable(){const m=/^([YT]\d)-/.exec(mySeat||'');return m?m[1]:null;}
function isBarSeat(){return !!mySeat&&mySeat.startsWith('BAR-');}
function canDrink(type){if(!mySeat)return false;if(isBarSeat())return GLASSES[mySeat]===type;if(type==='whiskey'||type==='cocktail')return false;const t=myTable();if(t)return (TABLE_ITEMS[t]||[]).includes(type);return false;}
// "캬~" 효과음 (Web Audio 합성, 내 화면에서만)
let AC=null;function kya(){if(muted)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const t=AC.currentTime,v=(volume/100)*(window.OUTSIDE?.5:1)*.5;if(v<=0)return;
 const len=.75,buf=AC.createBuffer(1,AC.sampleRate*len,AC.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 const n=AC.createBufferSource();n.buffer=buf;const bp=AC.createBiquadFilter();bp.type='bandpass';bp.Q.value=1.2;bp.frequency.setValueAtTime(3200,t);bp.frequency.exponentialRampToValueAtTime(900,t+len);
 const ng=AC.createGain();ng.gain.setValueAtTime(0,t);ng.gain.linearRampToValueAtTime(v*.9,t+.04);ng.gain.exponentialRampToValueAtTime(.001,t+len);n.connect(bp).connect(ng).connect(AC.destination);n.start(t);
 const o=AC.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(520,t+.05);o.frequency.exponentialRampToValueAtTime(260,t+.6);const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1400;
 const og=AC.createGain();og.gain.setValueAtTime(0,t);og.gain.linearRampToValueAtTime(v*.25,t+.08);og.gain.exponentialRampToValueAtTime(.001,t+.6);o.connect(lp).connect(og).connect(AC.destination);o.start(t);o.stop(t+.7);}catch(e){}}
window.kya=kya;
function drink(type){if(!canDrink(type))return;const n=Date.now();if(n-(window._lastDrink||0)<2000)return;window._lastDrink=n;const m=$('myAvatar');if(m._h)m._h.drink(type);socket.emit('drink',type);setTimeout(kya,2000);}
function eat(k){const t=myTable();if(!t||!(TABLE_ITEMS[t]||[]).includes(k))return;const n=Date.now();if(n-(window._lastEat||0)<2000)return;window._lastEat=n;const m=$('myAvatar');if(m._h)m._h.drink('eat');socket.emit('eat',k);}
window.eat=eat;
socket.on('eat',({id})=>{if(id===myId)return;const el=others[id]&&others[id].el;if(el&&el._h)el._h.drink('eat');});
function inBarZone(){const B=window.BAR_ZONE,p=rig.object3D.position;return !mySeat&&B&&p.x>=B.x0&&p.x<=B.x1&&p.z>=B.z0&&p.z<=B.z1;}
const near=(o,r)=>{const p=rig.object3D.position;return o&&!mySeat&&Math.hypot(p.x-o.x,p.z-o.z)<r;};
function nearTable(){const p=rig.object3D.position;let best=null,bd=1e9;for(const k in (window.POCHA_TABLES||{})){const [x,z,,r]=POCHA_TABLES[k],d=Math.hypot(p.x-x,p.z-z);if(d<(r||1.7)&&d<bd){bd=d;best=k;}}return best;}
socket.on('glasses',g=>{GLASSES=g||{};for(const k in GLASS_EL)if(GLASSES[k]!==GLASS_EL[k].kind){GLASS_EL[k].parent.remove(GLASS_EL[k]);delete GLASS_EL[k];}
 for(const k in GLASSES)if(!GLASS_EL[k]){const s=SEATS.find(q=>q.id===k);if(!s)continue;const g3=(GLASSES[k]==='cocktail'?cocktailGlass:rockGlass)(new THREE.Group());g3.kind=GLASSES[k];g3.position.set(9.68,1.3,s.z);g3.scale.setScalar(1.6);scene.object3D.add(g3);GLASS_EL[k]=g3;}refreshAct(true);});
const SLOT=[[-.22,-.22],[.22,-.22],[-.22,.22],[.22,.22],[0,-.28],[0,.28],[-.28,0],[.28,0]];
let TABLE_USES={};socket.on('tableUses',u=>{TABLE_USES=u||{};});
function usesTxt(k){const t=myTable();const it=TABLE_ITEMS[t]||[],i=it.indexOf(k);const n=i<0?0:((TABLE_USES[t]||[])[i]||4);return n;}
socket.on('table',t=>{TABLE_ITEMS=t||{};for(const k in TABLE_ITEMS){if(TABLE_EL[k])TABLE_EL[k].parent.remove(TABLE_EL[k]);const g=new THREE.Group(),c=(window.POCHA_TABLES||{})[k];if(!c)continue;g.position.set(c[0],c[2]||.7,c[1]);
 TABLE_ITEMS[k].forEach((it,i)=>{if(!it||!SLOT[i])return;const m=makeItem(it);m.position.set(SLOT[i][0],0,SLOT[i][1]);g.add(m);});scene.object3D.add(g);TABLE_EL[k]=g;}refreshAct(true);});
socket.on('carry',({id,kind})=>{if(id===myId){myCarry=kind;const m=$('myAvatar');if(m._h)m._h.carry(kind);refreshAct(true);return;}const el=others[id]&&others[id].el;if(el&&el._h)el._h.carry(kind);});
let myCarry=null;
socket.on('pour',({id,kind})=>{const el=others[id]&&others[id].el;if(el&&el._h)el._h.drink('pour');});
function serve(kind){if(!inBarZone())return;const n=Date.now();if(n-(window._lastServe||0)<3000)return;window._lastServe=n;const m=$('myAvatar');if(m._h)m._h.drink('pour');
 const p=rig.object3D.position;socket.emit('serve',{x:p.x,z:p.z,kind});}
window.serve=serve;window.drink=drink;
function actions(){const A=[];if(mySeat){if(isBarSeat()){if(GLASSES[mySeat])A.push([GLASSES[mySeat]==='cocktail'?'🍸 칵테일':'🥃 위스키',()=>drink(GLASSES[mySeat]),'d-'+GLASSES[mySeat]]);}
  else{for(const k of ['soju','beer'])if(canDrink(k))A.push([ITEM_NAME[k],()=>drink(k),'d-'+k,usesTxt(k)]);const t=myTable();if(t&&myCarry)A.push(['🍽 테이블에 놓기',()=>socket.emit('place'),'place']);if(t)for(const k of ['dakbal','kkom','fish','squid','chicken','hoe','fruit'])if((TABLE_ITEMS[t]||[]).includes(k))A.push([ITEM_NAME[k]+' 먹기',()=>eat(k),'e-'+k,usesTxt(k)]);if(t&&t[0]==='Y'){A.push(['🛎 주문하기',()=>openOrder(),'order']);if(ORDER_NOTE)A.push([ORDER_NOTE,null,'lbl']);if(MY_ORDERS.length)A.push(['⏳ 주문: '+MY_ORDERS.map(o=>ITEM_NAME[o.kind]).join(', ')+' · 알바가 준비 중',null,'lbl']);}}
  return A;}
 if(inBarZone()){A.push(['🍸 바텐더 서빙:',null,'lbl'],['🥃 위스키',()=>serve('whiskey'),'s-whiskey'],['🍸 칵테일',()=>serve('cocktail'),'s-cocktail']);return A;}
 if(!mySeat&&(window.WAITERS||[]).some(w=>w.near))A.push(['💝 후원하기',()=>window.open('https://toon.at/donate/errdaydrip','_blank','noopener'),'donate']);
 const nt=nearTable();if(myCarry&&nt)A.push(['🍽 테이블에 놓기',()=>socket.emit('place'),'place']);
 if(near(window.FRIDGE,1.6))for(const k of ['soju','beer'])A.push([ITEM_NAME[k]+' 꺼내기',()=>socket.emit('pickup',k),'p-'+k]);
 if(near(window.COOK,2.2))for(const k of ['dakbal','kkom','fish','squid'])A.push([ITEM_NAME[k],()=>socket.emit('pickup',k),'p-'+k]);
 if(near({x:-11.6,z:20.5},2.2))A.push(['🍗 통닭 가져가기',()=>socket.emit('pickup','chicken'),'p-chicken']);if(near({x:-11.6,z:15},2.2))A.push(['🐟 모듬회 가져가기',()=>socket.emit('pickup','hoe'),'p-hoe']);
 if(myCarry&&!A.length)A.push(['들고 있음: '+ITEM_NAME[myCarry],null,'lbl']);
 return A;}
let actKey='';function refreshAct(force){const A=actions().sort((a,b)=>(a[2]==='place')-(b[2]==='place')),k=A.map(a=>a[2]+a[0]+(a[3]||'')).join('|')+myCarry;if(!force&&k===actKey)return;actKey=k;const bar=$('actBar');bar.innerHTML='';bar.classList.toggle('hidden',!A.length);
 for(const [t,f,id,n] of A){const b=document.createElement(f?'button':'span');b.textContent=t;if(n){const c=n>=3?'#3ee05a':n===2?'#ffd23a':'#ff3b3b';b.classList.add('uses');b.style.background=`linear-gradient(rgba(30,10,40,.9),rgba(30,10,40,.9)) padding-box,conic-gradient(${c} 0 ${n*25}%,#3a3a3a 0) border-box`;b.title=n+'/4';}b.dataset.act=id;if(f)b.addEventListener('click',e=>{e.stopPropagation();f();});else b.className='lbl';bar.appendChild(b);}}
setInterval(()=>refreshAct(),200);
// ---------- 공유 음악 (MP3 업로드 + 유튜브) ----------
let music={playlist:[],index:-1,playing:false},offset=0,userGesture=false;const audio=$('audio');
let muted=localStorage.getItem('muted')==='1',volume=+(localStorage.getItem('vol')||80);$('vol').value=volume;
let yt=null,ytReady=false,ytVid=null;
window.onYouTubeIframeAPIReady=()=>{yt=new YT.Player('yt',{width:200,height:200,playerVars:{autoplay:0,cc_load_policy:0,cc_lang_pref:'ko',hl:'ko',controls:0,disablekb:1,playsinline:1,rel:0},
 events:{onReady:()=>{ytReady=true;applyMusic(true);},onStateChange:e=>{if(e.data===YT.PlayerState.PLAYING){applySubs();}if(e.data===YT.PlayerState.PLAYING||e.data===YT.PlayerState.CUED){const d=yt.getDuration();if(d>1)reportDur(d);}if(e.data===YT.PlayerState.ENDED)socket.emit('music',{type:'ended',index:music.index});},
  onError:e=>{const code=e.data;sys('⚠ 유튜브 재생 불가('+({2:'잘못된 ID',5:'HTML5 오류',100:'삭제/비공개',101:'퍼가기 금지',150:'퍼가기 금지'}[code]||code)+') → 다음 곡');socket.emit('music',{type:'error',index:music.index});}}});};
function setMusic(m){music=m;offset=m.serverNow-Date.now();window.SERVER_OFFSET=offset;window.MUSIC_PLAYING=!!(m.playing&&m.playlist[m.index]);renderMusic();applyMusic(true);}
socket.on('music',setMusic);
function curDur(){const c=music.playlist[music.index];return c&&(c.dur||(music.durations||{})[c.type==='yt'?c.videoId:c.id]);}
function reportDur(sec){const c=music.playlist[music.index];if(c&&sec>1&&!curDur())socket.emit('duration',{index:music.index,sec});}
function curPos(){return music.playing?(Date.now()+offset-music.startedAt)/1000:(music.pausedAt||0)/1000;}
const ICON={yt:'📺 ',sc:'☁️ ',vimeo:'🎬 ',url:'🔗 '};function renderMusic(){const cur=music.playlist[music.index];window.theaterScreen&&window.theaterScreen(cur,!!music.playing);typeof applySubs==='function'&&applySubs();$('shufBtn').textContent=music.shuffle?'🔀 랜덤 켬':'🔀 랜덤 끔';$('shufBtn').classList.toggle('sel',!!music.shuffle);$('now').textContent=cur?(music.shuffle?'🔀 ':'')+(music.playing?'▶ ':'⏸ ')+(ICON[cur.type]||'')+(cur.live?'📻 ':'')+cur.title:'재생목록이 비었어요 · 관리자가 곡을 추가하면 재생돼요';
 $('pl').classList.toggle('hidden',!adminToken);$('pl').innerHTML=!adminToken?'':music.playlist.map((t,i)=>`<li class="${i===music.index?'cur':''}">${ICON[t.type]||''}${esc(t.title)} <small>(${esc(t.by)})</small>${adminToken?` <button data-sel="${i}">▶</button><button data-del="${i}">🗑</button>`:''}</li>`).join('');
 $('adminCtl').classList.toggle('hidden',!adminToken);const fold=localStorage.getItem('admFold')==='1';$('admFold').classList.toggle('hidden',!adminToken);$('music').classList.toggle('fold',!!adminToken&&fold);$('admFold').textContent=fold?'⚙ 관리자 ▼':'⚙ 관리자 ▲';$('adminBtn').textContent=adminToken?'🔑ON':'🔑';$('muteBtn').textContent=muted?'🔇':'🔊';}
function applyVolume(){const v=window.OUTSIDE&&!window.IN_THEATER?volume*.5:volume;audio.volume=v/100;audio.muted=muted;extVol();if(ytReady){yt.setVolume(v);muted?yt.mute():yt.unMute();}}
const isAud=c=>c&&(c.type==='mp3'||c.type==='url');let hls=null,hlsUrl=null;
function loadScript(src){return new Promise((ok,no)=>{const e=document.createElement('script');e.src=src;e.onload=ok;e.onerror=no;document.head.appendChild(e);});}
function setAudioSrc(cur){if(cur.type==='url'&&cur.hls&&!audio.canPlayType('application/vnd.apple.mpegurl')){if(hlsUrl===cur.url)return;hlsUrl=cur.url;
  (window.Hls?Promise.resolve():loadScript('https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js')).then(()=>{if(hls)hls.destroy();hls=new Hls();hls.loadSource(cur.url);hls.attachMedia(audio);
   hls.on(Hls.Events.ERROR,(e,d)=>{if(d.fatal&&hlsUrl===cur.url){sys('⚠ 스트림 재생 불가 → 다음 곡');socket.emit('music',{type:'error',index:music.index});}});}).catch(()=>{});return;}
 if(hls){hls.destroy();hls=null;}hlsUrl=null;if(audio.src!==new URL(cur.url,location.href).href)audio.src=cur.url;}
// 외부 플레이어 (사운드클라우드 / 비메오): 숨은 iframe
let ext=null; // {type,key,api,ready,el}
function extStop(){if(!ext)return;try{ext.type==='sc'?ext.api.pause():ext.api.destroy();}catch(e){}if(ext.el)ext.el.remove();ext=null;}
function extVol(){if(!ext||!ext.ready)return;const v=muted?0:(window.OUTSIDE&&!window.IN_THEATER?volume*.5:volume);try{ext.type==='sc'?ext.api.setVolume(v):ext.api.setVolume(v/100);}catch(e){}}
async function extEnsure(cur){const key=cur.type+'|'+cur.url+'|'+cur.id;if(ext&&ext.key===key)return ext;extStop();
 const me_={type:cur.type,key,ready:false};ext=me_;const wrap=$('ytWrap');
 try{if(cur.type==='sc'){if(!window.SC)await loadScript('https://w.soundcloud.com/player/api.js');
   const f=document.createElement('iframe');f.allow='autoplay';f.src='https://w.soundcloud.com/player/?auto_play=false&visual=false&url='+encodeURIComponent(cur.url);wrap.appendChild(f);me_.el=f;
   const w=SC.Widget(f);me_.api=w;const E=SC.Widget.Events;
   w.bind(E.READY,()=>{me_.ready=true;w.getDuration(ms=>{if(!cur.set&&ms>1000)reportDur(ms/1000);});extVol();applyMusic(true);});
   const end=()=>socket.emit('music',{type:'ended',index:music.index});w.bind(E.FINISH,()=>{if(!cur.set)return end();w.getSounds(ss=>w.getCurrentSoundIndex(i=>{if(i>=ss.length-1)end();}));});
   w.bind(E.ERROR,()=>{sys('⚠ 사운드클라우드 재생 불가 → 다음 곡');socket.emit('music',{type:'error',index:music.index});});}
  else{if(!window.Vimeo)await loadScript('https://player.vimeo.com/api/player.js');
   const d=document.createElement('div');wrap.appendChild(d);me_.el=d;const pl=new Vimeo.Player(d,{id:+cur.vimeoId,width:200,autoplay:false,controls:false,playsinline:true});me_.api=pl;
   pl.ready().then(()=>{me_.ready=true;applySubs();pl.getDuration().then(reportDur).catch(()=>{});extVol();applyMusic(true);}).catch(()=>{sys('⚠ 비메오 재생 불가 → 다음 곡');socket.emit('music',{type:'error',index:music.index});});
   pl.on('ended',()=>socket.emit('music',{type:'ended',index:music.index}));}}
 catch(e){sys('⚠ 플레이어를 불러오지 못했어요 → 다음 곡');socket.emit('music',{type:'error',index:music.index});}return me_;}
function extApply(cur,force,pos,wantPlay){if(!ext||!ext.ready)return;const a=ext.api,d=curDur();extVol();
 if(d>1&&pos>=d-0.5){a.pause();return;}
 const set=t=>{if(force||Math.abs(t-pos)>2.5){cur.type==='sc'?a.seekTo(pos*1000):a.setCurrentTime(pos).catch(()=>{});}
  if(wantPlay){const p=a.play();if(p&&p.catch)p.catch(()=>$('unmute').classList.remove('hidden'));}else a.pause();};
 if(cur.type==='sc'){if(cur.set&&!force){wantPlay?a.play():a.pause();return;}a.getPosition(ms=>set(ms/1000));}else a.getCurrentTime().then(set).catch(()=>set(-99));}
function applyMusic(force){applyVolume();const cur=music.playlist[music.index];
 if(!isAud(cur)){audio.pause();if(hls){hls.destroy();hls=null;hlsUrl=null;}}
 if(!cur||cur.type!=='yt'){if(ytReady&&ytVid){yt.stopVideo();ytVid=null;}}
 if(!cur||(cur.type!=='sc'&&cur.type!=='vimeo'))extStop();
 if(!cur)return;const pos=curPos(),wantPlay=music.playing&&!muted&&userGesture;
 if(cur.type==='sc'||cur.type==='vimeo'){extEnsure(cur).then(()=>extApply(cur,force,pos,wantPlay));return;}
 if(isAud(cur)){setAudioSrc(cur);
  const go=()=>{if(!cur.live&&(force||Math.abs(audio.currentTime-pos)>1.5)){if(isFinite(audio.duration)){reportDur(audio.duration);if(pos>=audio.duration-0.5){audio.pause();return;}audio.currentTime=pos;}}
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
audio.addEventListener('error',()=>{if(music.playlist[music.index]&&isAud(music.playlist[music.index])&&audio.src){sys('⚠ 링크 재생 불가 → 다음 곡');socket.emit('music',{type:'error',index:music.index});}});
setInterval(()=>{if(music.playing&&!muted&&userGesture)applyMusic(false);},5000);
// ---------- 관리자 ----------
function askPw(){return new Promise(ok=>{const d=document.createElement('div');d.id='pwBox';d.innerHTML='<form><div>🔑 관리자 비밀번호</div><input type="password" autocomplete="off" inputmode="numeric" maxlength="40"><div><button>확인</button> <button type="button">취소</button></div></form>';
 document.body.appendChild(d);const f=d.querySelector('form'),i=d.querySelector('input');i.focus();const done=v=>{d.remove();ok(v);};
 f.onsubmit=e=>{e.preventDefault();done(i.value);};d.querySelector('button[type=button]').onclick=()=>done('');i.onkeydown=e=>{e.stopPropagation();if(e.key==='Escape')done('');};});}
$('admFold').onclick=()=>{localStorage.setItem('admFold',localStorage.getItem('admFold')==='1'?'0':'1');renderMusic();};
$('adminBtn').onclick=async()=>{if(adminToken){if(confirm('관리자 로그아웃할까요?')){adminToken=null;sessionStorage.removeItem('adminToken');renderMusic();}return;}
 const pw=await askPw();if(!pw)return;const r=await fetch('/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
 const j=await r.json();if(j.token){adminToken=j.token;sessionStorage.setItem('adminToken',j.token);sys('관리자 로그인 완료');renderMusic();}else alert(j.error);};
const cmd=(type,extra)=>socket.emit('music',{type,token:adminToken,...extra});
document.querySelectorAll('#adminCtl > button[data-c]').forEach(b=>b.onclick=()=>cmd(b.dataset.c));
$('clearAllBtn').onclick=()=>{if(!music.playlist.length){sys('재생목록이 이미 비어 있어요');return;}if(confirm(`재생목록 ${music.playlist.length}곡을 모두 삭제할까요? (되돌릴 수 없어요)`))cmd('clearAll');};
$('pl').onclick=e=>{const b=e.target;if(b.dataset.sel)cmd('select',{index:+b.dataset.sel});if(b.dataset.del&&confirm('이 곡을 삭제할까요?'))cmd('delete',{index:+b.dataset.del});};
function adminFail(r){if(r.status===403){adminToken=null;sessionStorage.removeItem('adminToken');renderMusic();}}
$('file').onchange=async()=>{const f=$('file').files[0];if(!f)return;if(f.size>30*1024*1024){$('upMsg').textContent='30MB 초과';return;}
 const fd=new FormData();fd.append('by',me.nick||'관리자');fd.append('file',f);$('upMsg').textContent='업로드 중...';
 const r=await fetch('/upload',{method:'POST',headers:{'x-admin-token':adminToken},body:fd});const j=await r.json();$('upMsg').textContent=r.ok?'완료!':(j.error||'실패');adminFail(r);$('file').value='';};
$('ytForm').onsubmit=async e=>{e.preventDefault();const url=$('ytUrl').value.trim();if(!url)return;$('upMsg').textContent='링크 확인 중...';
 const r=await fetch('/link',{method:'POST',headers:{'Content-Type':'application/json','x-admin-token':adminToken},body:JSON.stringify({url,by:me.nick||'관리자'})});
 const j=await r.json();$('upMsg').textContent=r.ok?`✅ ${j.service} 인식 · ${j.added>1?j.added+'곡':'「'+(j.title||'')+'」'} 추가!`:(j.error||'실패');adminFail(r);if(r.ok)$('ytUrl').value='';};
// 점프 버튼: 오른쪽 끝, 액션바 바로 위
setInterval(()=>{const j=document.getElementById('jumpBtn'),a=document.getElementById('actBar');if(!j)return;let top=innerHeight-70;if(a&&!a.classList.contains('hidden')&&a.offsetHeight){top=Math.min(top,a.getBoundingClientRect().top);}j.style.bottom=(innerHeight-top+10)+'px';},200);

// ---------- 화면 비율별 시야각 / 전체화면 ----------
(function(){
 const sc=document.querySelector('a-scene');
 function fitFov(){const w=innerWidth,h=innerHeight,a=w/h;const v=70,maxH=95;let f=v;
  if(a>1){f=2*Math.atan(Math.tan(maxH*Math.PI/360)/a)*180/Math.PI;f=Math.max(48,Math.min(v,f));}
  const c=document.getElementById('cam');c.setAttribute('camera','fov',f);
  window.BASE_FOV=f;const o=sc.camera;if(o&&o.isPerspectiveCamera){o.fov=f;o.aspect=a;o.updateProjectionMatrix();}
  if(sc.renderer){sc.resize&&sc.resize();}}
 let t;const later=()=>{clearTimeout(t);fitFov();t=setTimeout(fitFov,350);};
 addEventListener('resize',later);addEventListener('orientationchange',later);
 if(screen.orientation)screen.orientation.addEventListener('change',later);
 if(window.visualViewport)visualViewport.addEventListener('resize',later);
 if(sc.hasLoaded)fitFov();else sc.addEventListener('loaded',fitFov);
 const de=document.documentElement,touch=matchMedia('(pointer:coarse)').matches;
 const canFs=!!(de.requestFullscreen||de.webkitRequestFullscreen),standalone=matchMedia('(display-mode: fullscreen),(display-mode: standalone)').matches||navigator.standalone;
 const isFs=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
 function goFs(){if(standalone||isFs()||!canFs)return;try{const p=(de.requestFullscreen?de.requestFullscreen({navigationUI:'hide'}):de.webkitRequestFullscreen());if(p&&p.catch)p.catch(()=>{});}catch(e){}}
 function exitFs(){try{(document.exitFullscreen||document.webkitExitFullscreen).call(document);}catch(e){}}
 const btn=document.getElementById('fsBtn'),hint=document.getElementById('fsHint');
 let entered=false,optOut=false;
 // 모바일: 크롬 전체화면 API는 '상단에서 드래그…' 안내를 강제로 띄움 → 모바일에선 API를 안 쓰고 앱 설치(홈 화면) 전체화면을 안내
 let installEvt=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;});
 if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
 const isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const hintTxt=()=>isIOS?'📱 Safari 공유 버튼 → <b>홈 화면에 추가</b> 후 그 아이콘으로 열면 안내 문구 없이 전체화면이에요':'📱 크롬 메뉴(⋮) → <b>홈 화면에 추가 / 앱 설치</b> 후 그 아이콘으로 열면 안내 문구 없이 전체화면이에요';
 const showHint=()=>{hint.querySelector('span').innerHTML=hintTxt();hint.classList.remove('hidden');};
 window.enterFullscreenMobile=()=>{if(!touch)return;entered=true;document.body.classList.add('pfs');scrollTo(0,0);};
 btn.onclick=()=>{if(touch){if(isFs()){exitFs();return;}if(installEvt){installEvt.prompt();installEvt.userChoice.finally(()=>{installEvt=null;});return;}if(hint.classList.contains('hidden'))showHint();else hint.classList.add('hidden');return;}
  if(!canFs)return;if(isFs()){optOut=true;exitFs();}else{optOut=false;goFs();}};
 document.getElementById('fsHintX').onclick=()=>hint.classList.add('hidden');
 if(standalone)btn.style.display='none';
 document.addEventListener('fullscreenchange',later);const fsCls=()=>document.body.classList.toggle('fs',isFs()&&touch);document.addEventListener('fullscreenchange',fsCls);document.addEventListener('webkitfullscreenchange',fsCls);
})();

$('cleanBtn').onclick=()=>{if(!adminToken)return;socket.emit('adminCleanup',adminToken,r=>{if(r&&r.ok)sys(`🔄 유령 정리 완료: ${r.removed}명 제거`);else{sys('정리 실패: '+((r&&r.error)||'오류'));}});};

// 관리자 강퇴
let kickedOut=false;socket.on('kicked',k=>{kickedOut=true;localStorage.removeItem('joinedAt');socket.io.opts.reconnection=false;socket.io.reconnection(false);const d=document.createElement('div');d.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.88);color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;font-size:20px;padding:20px';d.innerHTML='🚫 관리자에 의해 강퇴되었습니다<br><small style="color:#aaa">'+((k&&k.min)||10)+'분 후에 다시 들어올 수 있어요</small>';document.body.appendChild(d);});
function doKick(id,nick){if(!adminToken||!id)return;if(id===myId){alert('자기 자신은 강퇴할 수 없어요');return;}if(!confirm(nick+' 님을 강퇴할까요? (10분간 재입장 차단)'))return;socket.emit('adminKick',{token:adminToken,id},r=>{if(!(r&&r.ok))sys('강퇴 실패: '+((r&&r.error)||'오류'));loadKickList();});}
function loadKickList(){const box=$('kickList');if(!box)return;if(!adminToken){box.innerHTML='';return;}socket.emit('adminList',adminToken,r=>{if(!r||!r.ok){box.innerHTML='';return;}box.innerHTML='<b>👥 접속자 ('+r.list.length+')</b>'+r.list.map(p=>`<div class="krow">${esc(p.nick)}${p.id===r.me?' <small>(나)</small>':` <button data-kick="${esc(p.id)}" data-kn="${esc(p.nick)}">강퇴</button>`}</div>`).join('');});}
(function(){const ac=$('adminCtl');const box=document.createElement('div');box.id='kickList';box.style.cssText='max-height:150px;overflow:auto;font-size:12px;margin-top:4px;width:100%';ac.appendChild(box);
 box.addEventListener('click',e=>{const b=e.target.closest('[data-kick]');if(b)doKick(b.dataset.kick,b.dataset.kn);});
 $('msgs').addEventListener('click',e=>{const b=e.target.closest('[data-kid]');if(b&&adminToken&&b.dataset.kid)doKick(b.dataset.kid,b.dataset.knick);});
 for(const ev of ['online','player','leave','snapshot'])socket.on(ev,()=>{clearTimeout(loadKickList._t);loadKickList._t=setTimeout(loadKickList,300);});
 setInterval(()=>{if(adminToken&&!$('adminCtl').classList.contains('hidden'))loadKickList();},10000);setTimeout(loadKickList,1500);})();

// ---------- 극장 스크린: 클럽과 같은 (숨은) 영상 플레이어를 스크린 위치에 원근 투영해 보여줌 → 소리/싱크가 하나 ----------
(function(){const wrap=$('ytWrap'),PW=640,PH=360,v=new THREE.Vector3();let shown=false;
 const hide=()=>{if(!shown)return;shown=false;wrap.classList.remove('theater');wrap.style.transform='';};
 AFRAME.registerComponent('theater-screen',{tick(){const cur=music.playlist[music.index];
  if(!window.IN_THEATER||!cur||(cur.type!=='yt'&&cur.type!=='vimeo')){hide();return;}
  const cam=this.el.sceneEl.camera;if(!cam)return;const cv=this.el.sceneEl.canvas,r=cv.getBoundingClientRect();const pts=[];
  for(const c of THEATER.corners()){v.set(c[0],c[1],c[2]).applyMatrix4(cam.matrixWorldInverse);if(v.z>-.05){hide();return;}v.applyMatrix4(cam.projectionMatrix);pts.push([r.left+(v.x+1)/2*r.width,r.top+(1-v.y)/2*r.height]);}
  const M=THEATER.quadMatrix(PW,PH,pts);if(!M){hide();return;}shown=true;wrap.classList.add('theater');wrap.style.transform=`matrix3d(${M.join(',')})`;}});
 document.querySelector('a-scene').setAttribute('theater-screen','');})();

// ---------- 극장 자막 켜기/끄기 (극장 안에서만 보임, 선택은 기억) ----------
let subsPref=localStorage.getItem('subs')==='1',subsKey='';
function applySubs(){const btn=$('subsBtn');if(!btn)return;const cur=music.playlist[music.index],u=THEATER.subsUI(cur,subsPref,!!window.IN_THEATER);
 btn.classList.toggle('hidden',!u.visible);btn.disabled=!u.enabled;btn.textContent=u.enabled?(u.on?'💬 자막 켬':'💬 자막 끔'):'💬 자막 · '+u.note;btn.classList.toggle('sel',u.on);{const m=$('subsMob');if(m){m.disabled=!u.enabled;m.classList.toggle('sel',u.on);m.innerHTML='💬<br><small>'+(u.enabled?(u.on?'자막 켬':'자막 끔'):'자막 없음')+'</small>';m.title=u.note||'';}}
 const want=u.on;
 if(cur&&cur.type==='yt'&&ytReady){try{if(want){yt.loadModule('captions');const tr=THEATER.pickTrack(yt.getOption('captions','tracklist'));if(tr)yt.setOption('captions','track',{languageCode:tr.languageCode});else setTimeout(()=>{if(subsPref&&window.IN_THEATER){const t2=THEATER.pickTrack(yt.getOption('captions','tracklist'));if(t2)yt.setOption('captions','track',{languageCode:t2.languageCode});}},1500);}
  else{yt.unloadModule('captions');yt.setOption('captions','track',{});}}catch(e){}}
 if(cur&&cur.type==='vimeo'&&ext&&ext.ready&&ext.type==='vimeo'){const a=ext.api;if(want)a.getTextTracks().then(l=>{const t=THEATER.pickTrack(l,'language');if(t)a.enableTextTrack(t.language,t.kind).catch(()=>{});}).catch(()=>{});else a.disableTextTrack().catch(()=>{});}}
$('subsMob').onclick=e=>{e.stopPropagation();$('subsBtn').onclick();};$('subsBtn').onclick=()=>{subsPref=!subsPref;localStorage.setItem('subs',subsPref?'1':'0');applySubs();sys(subsPref?'자막을 켰어요 (영상에 자막이 없으면 안 나와요)':'자막을 껐어요');};
applySubs();

window.WAITER_JOBS={};socket.on('waiterJob',j=>{WAITER_JOBS[j.w]=j;});

// ---------- 모든 벽: 카메라와 내 캐릭터 사이에 낀 벽은 잠깐 숨김 (바 쪽 벽과 같은 방식) ----------
let WALLS=null,_wallsAt=0;const _ray=new THREE.Ray(),_hv=new THREE.Vector3(),_bb=new THREE.Box3();
function collectWalls(){const L=[];const sc=document.querySelector('a-scene').object3D;sc.updateMatrixWorld(true);
 sc.traverse(o=>{if(!o.isMesh||!o.geometry)return;for(let p=o;p;p=p.parent){if(p.userData&&p.userData.human)return;if(p.el&&(p.el.id==='rig'||p.el.id==='cam'||p.el.classList&&p.el.classList.contains('seat')))return;}
  _bb.setFromObject(o);const sx=_bb.max.x-_bb.min.x,sy=_bb.max.y-_bb.min.y,sz=_bb.max.z-_bb.min.z;
  if(window.isWallBox&&window.isWallBox(sx,sy,sz))L.push({o,b:_bb.clone(),h:false});});return L;}
window.isWallBox=(sx,sy,sz)=>sy>=1.9&&Math.min(sx,sz)<=3.2&&Math.max(sx,sz)>=1.2&&!(sx>3.2&&sz>3.2);
function hideWalls(tx,ty,tz,cx,cy,cz){const n=performance.now();if(!WALLS||(n-_wallsAt>4000&&n<60000)){if(document.querySelector('a-scene').hasLoaded){WALLS=collectWalls();_wallsAt=n;}else return;}
 _ray.origin.set(tx,ty,tz);_hv.set(cx-tx,cy-ty,cz-tz);const len=_hv.length();if(len<1e-4)return;_ray.direction.copy(_hv).divideScalar(len);
 const TT=THEATER.T,inTh=!!window.IN_THEATER;for(const w of WALLS){if(inTh&&w.b.max.x>TT.x0-.6&&w.b.min.z<TT.z1+.2&&w.b.max.z>TT.z0-.2){if(w.h){w.h=false;w.o.visible=true;}continue;}const pt=_ray.intersectBox(w.b,_hv);const hit=!!pt&&_ray.origin.distanceTo(pt)<len+.3&&!w.b.containsPoint(_ray.origin);if(hit!==w.h){w.h=hit;w.o.visible=!hit;}}}

// 극장 좌석: 화면 비율(세로/가로 폰)에 맞춰 스크린 전체가 여유 있게 들어오도록 시야각 조절 (+두 손가락/휠 줌)
let _fovNow=0;function theaterFov(cx,cy,cz){const o=scene.camera;if(!o||!o.isPerspectiveCamera)return;const base=window.BASE_FOV||70;let want=base;
 if(inThSeat()){const S=THEATER.T.screen;want=THEATER.fitFov(Math.hypot(S.x-cx,S.y-cy,S.z-cz),o.aspect||innerWidth/innerHeight,base)*thZoom;want=Math.max(25,Math.min(125,want));}
 if(Math.abs(want-o.fov)>.05){o.fov+= (want-o.fov)*.2;o.updateProjectionMatrix();}}

// ---------- 야장 주문 (포차 테이블에 앉으면 🛎 주문하기 → 알바가 가져다 줌) ----------
const ORDER_MENU={anju:['dakbal','kkom','fish','squid','chicken','hoe'],drink:['soju','beer']};var MY_ORDERS=[],ORDER_NOTE='';let _onT=0;/* 주문 관련 안내는 채팅창이 아니라 행동바에만 잠깐 표시 */function orderNote(t){ORDER_NOTE=t;clearTimeout(_onT);_onT=setTimeout(()=>{ORDER_NOTE='';refreshAct(true);},3000);refreshAct(true);}let orderTab='anju';window.ALBA_JOB=null;
function renderOrder(){const m=$('orderMenu');m.querySelectorAll('.otab').forEach(b=>b.classList.toggle('on',b.dataset.tab===orderTab));const L=m.querySelector('.olist');L.innerHTML='';
 for(const k of ORDER_MENU[orderTab]){const b=document.createElement('button');b.textContent=ITEM_NAME[k];b.dataset.k=k;b.onclick=e=>{e.stopPropagation();placeOrder(k);};L.appendChild(b);}}
function openOrder(){const m=$('orderMenu');if(!m.classList.contains('hidden')){m.classList.add('hidden');return;}renderOrder();m.classList.remove('hidden');}
function placeOrder(k){socket.emit('order',k,r=>{if(r&&r.ok){MY_ORDERS.push({id:r.id,kind:k});$('orderMenu').classList.add('hidden');refreshAct(true);}else orderNote('주문 실패: '+((r&&r.err)||'?'));});}
document.querySelectorAll('#orderMenu .otab').forEach(b=>b.onclick=e=>{e.stopPropagation();orderTab=b.dataset.tab;renderOrder();});$('orderClose').onclick=e=>{e.stopPropagation();$('orderMenu').classList.add('hidden');};
socket.on('albaJob',j=>{window.ALBA_JOB=j;});
socket.on('albaDone',d=>{const i=MY_ORDERS.findIndex(o=>o.id===d.id);if(i>=0){MY_ORDERS.splice(i,1);orderNote(d.ok?`✅ ${ITEM_NAME[d.kind]} 나왔어요`:'자리가 꽉 차서 못 놨어요');refreshAct(true);}});
setInterval(()=>{const t=mySeat&&myTable();if(!(t&&t[0]==='Y'))$('orderMenu').classList.add('hidden');},300);

// ---------- 재생목록 프리셋 3개 (관리자) : 모바일=버튼만, PC=버튼+이름/주소 편집 ----------
let PRESETS=[];
function renderPresets(){const B=document.querySelector('#presetBox .pbtns'),E=document.querySelector('#presetBox .presetEdit');if(!B)return;B.innerHTML='';
 PRESETS.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.textContent='🎛 '+p.name;b.title='재생목록을 이 목록으로 교체';b.onclick=e=>{e.stopPropagation();if(!adminToken)return;if(!confirm(`지금 재생목록을 '${p.name}'으로 통째로 바꿀까요?`))return;b.disabled=true;sys(`🎛 '${p.name}' 불러오는 중…`);socket.emit('loadPreset',{token:adminToken,i},r=>{b.disabled=false;if(!(r&&r.ok))sys('불러오기 실패: '+((r&&r.err)||'?'));});};B.appendChild(b);});
 if(E.contains(document.activeElement))return;E.innerHTML=PRESETS.map((p,i)=>`<div class="prow"><input class="pn" maxlength="20" value="${esc(p.name)}" placeholder="이름"><input class="pu" maxlength="300" value="${esc(p.url)}" placeholder="유튜브 재생목록 주소"></div>`).join('')+'<button type="button" id="presetSave">💾 버튼 저장</button>';
 $('presetSave').onclick=e=>{e.stopPropagation();const list=[...E.querySelectorAll('.prow')].map(r=>({name:r.querySelector('.pn').value,url:r.querySelector('.pu').value}));socket.emit('setPresets',{token:adminToken,list},r=>sys(r&&r.ok?'💾 프리셋 저장됨 (모두에게 반영)':'저장 실패: '+((r&&r.err)||'?')));};}
socket.on('presets',p=>{PRESETS=p||[];renderPresets();});
