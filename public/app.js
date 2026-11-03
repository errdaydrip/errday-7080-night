const CID=localStorage.getItem('cid')||(()=>{const v=(crypto.randomUUID?crypto.randomUUID():Date.now()+''+Math.random()).toString();localStorage.setItem('cid',v);return v;})();
// ===== ERRDAY 나이트클럽: 아바타 · 이동 · 채팅 · 음악 =====
const socket=io({transports:['websocket','polling']});const $=id=>document.getElementById(id);
const COLORS=['#2b3352','#9a9cc0','#2a3f9e','#2fb8b0','#2f8f45','#e2525c','#c8102e','#ffd400','#ff69b4','#7b2cbf','#ff8c00','#f5f5f5','#ff2fa6','#9cf03a','#4fc3ff','#b04cff'];
const JOINT={basic:'#2f7bff',suit:'#1a1a1a',disco:'#ffd700',hanbok:'#ffffff',aerobic:'#ff2fa6'};
let me={nick:'',gender:'m',style:'suit',outfit:'#2b3352',skin:'#f2c29a'},myId=null,joined=false,mySeat=null,adminToken=sessionStorage.getItem('adminToken');
try{Object.assign(me,JSON.parse(localStorage.getItem('profile')||'{}'));}catch(e){}delete me.hat;if(!['basic','suit','disco','hanbok','aerobic'].includes(me.style))me.style='suit';
me.rollerSkates=false;Object.assign(me,ROLLER.colours(me));
let rollerSelectOpen=false,rollerDraft=null,rollerTravelPending=false,lastRollerMotion='';
let adminAccess=false,adminAccessPending=!!adminToken,rollerPreview=null;
window.ROLLER_OPEN=true;window.IN_ROLLER=false;
const SKATE_ANIMATION={idle:'Idle_Loop',skate:'Skate_Loop',run:'Skate_Run',jump:'Skate_Jump'};
const others={};const scene=document.querySelector('a-scene');
const humanOpts=p=>({...LOOKS.resolve(p),...ROLLER.colours(p),rollerSkates:!!p.rollerSkates,outfit:p.outfit||null,skin:p.skin||'#f2c29a',gender:p.gender==='f'?'f':'m',style:['basic','suit','disco','hanbok','aerobic'].includes(p.style)?p.style:'suit'});
const SKINS=['#f2c29a','#ffdcc0','#d9a074','#a8724a'];
const STYLE_NAMES={m:{basic:'기본',suit:'정장',disco:'디스코',hanbok:'한복',aerobic:'에어로빅'},f:{basic:'기본',suit:'정장',disco:'디스코',hanbok:'한복',aerobic:'에어로빅'}};
// 모바일 성능: 픽셀 비율 낮추기
/* 모바일 화질: 예전엔 픽셀비율 1.25 고정 + 안티앨리어싱 꺼짐 → 깨져 보임. 이제 최대 2 로 시작하고 프레임이 떨어지면 자동으로 낮춤 */
scene.addEventListener('loaded',()=>{const R=scene.renderer;if(!R)return;
 /* 글자 텍스처 선명하게: 비스듬히 봐도 덜 뭉개지게 최대 이방성 필터 */const AN=R.capabilities.getMaxAnisotropy?R.capabilities.getMaxAnisotropy():4;setInterval(()=>scene.object3D.traverse(o=>{const m=o.material,t=m&&m.map;if(t&&t.isCanvasTexture&&t.anisotropy!==AN){t.anisotropy=AN;t.needsUpdate=true;}}),1500);
 if(!IS_MOBILE)return;const MAXPR=Math.min(2,devicePixelRatio||1),STEPS=[MAXPR,1.75,1.5].filter((v,i,a)=>v<=MAXPR&&a.indexOf(v)===i); /* 글자 흐림 방지: 최소 1.5 까지만 낮춤 */
 let lvl=+(localStorage.getItem('prLvl2')||0);if(!(lvl>=0&&lvl<STEPS.length))lvl=0;const apply=()=>{R.setPixelRatio(STEPS[lvl]);const s=scene.canvas;if(s)R.setSize(s.clientWidth,s.clientHeight,false);window.MOBILE_PR=STEPS[lvl];};apply();
 let fr=0,t0=performance.now(),good=0;(function mon(){requestAnimationFrame(mon);if(document.hidden){t0=performance.now();fr=0;return;}fr++;const now=performance.now();if(now-t0<3000)return;const fps=fr*1000/(now-t0);fr=0;t0=now;
  if(fps<38&&lvl<STEPS.length-1){lvl++;good=0;apply();localStorage.setItem('prLvl2',lvl);}else if(fps>56){if(++good>=4&&lvl>0){lvl--;good=0;apply();localStorage.setItem('prLvl2',lvl);}}else good=0;})();});
// ---------- 입장 화면 ----------
const palHtml=k=>LOOKS.PALETTE.map(([c,n])=>`<span class="swatch ${k}" data-v="${c}" title="${n}" style="background:${c}"></span>`).join('');$('swTop').innerHTML=palHtml('tp');$('swBot').innerHTML=palHtml('bt');
$('accs').innerHTML=LOOKS.ACC.map(a=>`<button class="opt a" data-v="${a}">${LOOKS.ACC_NAME[a]}</button>`).join('');
function renderHairs(){$('hairs').innerHTML=LOOKS.HAIR[me.gender==='f'?'f':'m'].map(([k,n])=>`<button class="opt h${(me.hair||'')===k?' sel':''}" data-v="${k}">${n}</button>`).join('');}
function fillLook(){const r=LOOKS.resolve(me);me.top=r.top;me.bottom=r.bottom;me.acc=r.acc;me.hair=r.hair;me.face=r.face;me.beard=r.beard;}
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
 if(b.classList.contains('g')){const rb=()=>LOOKS.BEARDS[Math.floor(Math.random()*LOOKS.BEARDS.length)];if(me.gender===b.dataset.v){me.face=((+me.face||0)+1)%LOOKS.FACES;} /* 같은 성별 버튼 다시 누르면 다음 얼굴 */else{me.gender=b.dataset.v;me.hair='';me.face=0;resetCol();}me.beard=me.gender==='m'?rb():'';}if(b.classList.contains('s')){me.style=b.dataset.v;resetCol();} /* 의상 바꿔도 직접 고른 머리는 그대로 (안 고른 상태면 의상 기본 머리) */
 if(b.classList.contains('sk'))me.skin=b.dataset.v;else if(b.classList.contains('tp')){me.top=b.dataset.v;delete me.outfit;}else if(b.classList.contains('bt')){me.bottom=b.dataset.v;delete me.outfit;}
 if(b.classList.contains('h'))me.hair=b.dataset.v;if(b.classList.contains('a'))me.acc=b.dataset.v;me.nick=$('nick').value;syncOpts();});
$('enter').onclick=()=>{if(window.enterFullscreenMobile&&!window.AUTO_JOIN)enterFullscreenMobile();me.nick=$('nick').value.trim()||('손님'+Math.floor(Math.random()*1000));$('nick').value=me.nick;localStorage.setItem('profile',JSON.stringify(me));
 $('entry').classList.add('hidden');$('hud').classList.remove('hidden');chatBottom();
 const ev=joined?'profile':'join';socket.emit(ev,{...me,clientId:CID,last:lastState()},r=>{if(r&&!r.ok){nickErr(r.error);return;}joined=true;localStorage.setItem('joinedAt',Date.now());enterOk();if(r&&r.resume)setTimeout(()=>resumeState(r.resume),50);});};
// 앱(설치 모드)이 백그라운드에서 종료됐다 다시 열려도 이어서: 위치·자리·들고있는 것까지 localStorage 에 (6시간)
const RESUME_MS=6*3600*1000;
function lastState(){try{const v=JSON.parse(localStorage.getItem('lastState')||sessionStorage.getItem('lastState')||'null');return v&&Date.now()-v.t<RESUME_MS?v:null;}catch(e){return null;}}
function saveState(){if(!joined||window.BYE)return;try{const p=rig.object3D.position,m=$('myAvatar');localStorage.setItem('lastState',JSON.stringify({t:Date.now(),worldVersion:2,pos:[p.x,p.y,p.z],rot:myYaw,seat:mySeat,rollerSkates:!!me.rollerSkates,carry:myCarry||null,drinks:(m._h&&m._h.drinks)||[]}));}catch(e){}}
setInterval(saveState,1000);addEventListener('pagehide',saveState);addEventListener('freeze',saveState);
// 돌아왔을 때: 소켓 즉시 재연결 + 음악 위치 다시 맞춤
function wake(){if(!socket.connected)socket.connect();if(joined){setTimeout(()=>{applyMusic(true);},300);}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveState();else wake();});addEventListener('pageshow',e=>{if(e.persisted)wake();});addEventListener('resume',wake);addEventListener('focus',wake);
// 새로 열렸는데(앱이 OS에 의해 종료된 경우) 최근에 입장했었다면 입장 화면 없이 자동 입장
function autoJoinOk(){try{const a=+localStorage.getItem('joinedAt')||0;return !!me.nick&&Date.now()-a<RESUME_MS&&!sessionStorage.getItem('noAuto');}catch(e){return false;}}
if(autoJoinOk()){$('entry').classList.add('hidden');const tryAuto=()=>{if($('enter').disabled)return setTimeout(tryAuto,200);window.AUTO_JOIN=true;$('enter').onclick();};tryAuto();}
function resumeState(r){me.rollerSkates=!!r.rollerSkates;const m=$('myAvatar');if(m._h)m._h.setSkates(me.rollerSkates);if(m._h&&r.drinks)m._h.drinks=r.drinks.slice();if(r.carry!==undefined){myCarry=r.carry;if(m._h)m._h.carry(r.carry);if(typeof refreshAct==='function')refreshAct(true);}
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
 const h=await makeHuman(root,humanOpts(p));if(!h||root._tok!==token){if(h)h.dispose();return;}root._h=h;HUMANS.add(h);h.after=(t,c)=>dartPose(root,mine?myId:p.id,c);}
function upsertOther(p){if(p.id===myId)return;let o=others[p.id];
 if(!o){const el=document.createElement('a-entity');$('others').appendChild(el);o=others[p.id]={el,target:new THREE.Vector3(...(p.pos||[0,0,4])),rot:p.rot||0};el.object3D.position.copy(o.target);}
 const key=[p.nick,p.gender,p.style,p.outfit,p.top,p.bottom,p.acc,p.hair,p.face,p.beard,p.skin,p.skateBoot,p.skateWheel,p.skateLace,p.rollerSkates].join('|');if(o.key!==key){o.key=key;buildAvatar(o.el,p);}if(p.drinks&&o.el._h&&!(o.el._h.drinks||[]).length)o.el._h.drinks=p.drinks.slice();if(p.pos){if(ROLLER.inside(o.target.x,o.target.z)!==ROLLER.inside(p.pos[0],p.pos[2]))o.el.object3D.position.set(...p.pos);o.target.set(...p.pos);}o.data=p;o.dance=p.dance||0;applySeatPose(o,p.seat);}
function applySeatPose(o,seat){o.seat=seat;const s=SEATS.find(x=>x.id===seat);if(s){o.target.set(s.x,s.y||0,s.z);o.rot=s.yaw;}}
AFRAME.registerComponent('others-lerp',{tick(){for(const id in others){const o=others[id],p=o.el.object3D.position,d=p.distanceTo(o.target);p.lerp(o.target,.15);
 let r=o.rot-o.el.object3D.rotation.y;r=Math.atan2(Math.sin(r),Math.cos(r));o.el.object3D.rotation.y+=r*.2;
 const h=o.el._h;if(!h)continue;
 if(o.data&&o.data.rollerSkates&&!o.seat)h.play(SKATE_ANIMATION[o.data.rollerMotion]||'Idle_Loop');
 else h.play(o.seat?'Sitting_Idle_Loop':(d>.03?'Walk_Loop':(o.dance?'Dance_'+o.dance:'Idle_Loop')));}}});
scene.setAttribute('others-lerp','');
function bubble(id,text){const el=id===myId?$('myAvatar'):others[id]&&others[id].el;if(!el)return;const b=el.querySelector('.bubble');if(!b)return;
 b.setAttribute('cbubble',{value:text.slice(0,200)});b.setAttribute('visible',true);
 clearTimeout(b._t);b._t=setTimeout(()=>b.setAttribute('visible',false),Math.min(15000,10000+text.length*150));}
// ---------- 3인칭 카메라 · 이동 · 클릭 이동 · 자동 앉기 ----------
const rig=$('rig'),cam=$('cam'),myAv=$('myAvatar'),marker=$('marker');
const keys={};let camGoal=null,myDance=0,idleT=0,camYaw=0,camPitch=.4,camDist=IS_MOBILE?5.5:4.5,myYaw=Math.PI,goal=null,goalSeat=null,stillT=0,moving=false;
let jumpV=null;function jump(){if(!joined||rollerSelectOpen||!$('entry').classList.contains('hidden')||mySeat||jumpV!==null)return;jumpV=5;}window.jump=jump;
const typing=()=>document.activeElement&&document.activeElement.tagName==='INPUT';
window.addEventListener('keydown',e=>{if(rollerSelectOpen||typing()||!$('entry').classList.contains('hidden'))return;keys[e.code]=true;if(/Key[WASD]|Arrow/.test(e.code)){route=[];goal=null;goalSeat=null;marker.setAttribute('visible',false);}
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
function tapAt(x,y){if(!joined||rollerSelectOpen||!$('entry').classList.contains('hidden'))return;const r=scene.canvas.getBoundingClientRect();v2.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);ray.setFromCamera(v2,scene.camera);
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
const BOUND={x0:-11.4,x1:13.4,z0:-11.4,z1:51.2},ROOM_IN={x0:-11.8,x1:11.8,z0:-11.8,z1:11.8,y1:7.8},ROOM_ROLLER={...ROLLER.T,y1:5.8},ROOM_OUT={x0:-13.5,x1:25.5,z0:12.2,z1:30.2,y1:14};let ROOM=ROOM_IN;
const isOut=z=>z>12;
// 앞벽(문 구멍 제외)은 사각 장애물
{const D=window.DOOR,dl=D.x-D.w/2,dr=D.x+D.w/2;OBSTACLES.push({x0:11.6,x1:14,z0:-12.5,z1:12.15},{x0:-12.5,x1:dl,z0:11.85,z1:12.15},{x0:dr,x1:THEATER.CLUB_DOOR.x-THEATER.CLUB_DOOR.w/2,z0:11.85,z1:12.15},{x0:THEATER.CLUB_DOOR.x+THEATER.CLUB_DOOR.w/2,x1:12.5,z0:11.85,z1:12.15});}
// 카메라 충돌: 벽·바·무대 구조물을 상자(AABB)로 근사해 머리→카메라 광선 검사 (모바일에서도 가벼움)
const CAM_OCC=[[10-.65,0,-1.65,10+.65,1.3,6.15],[9.4,1.2,6,10.6,2.3,6.15],[9.45,0,7.45,10.55,1.3,7.75],[11.4,0,-1.6,12.5,3.9,7.6],[-3.6,0,-11.8,3.6,4.9,-11.45],[-5.6,.7,-11.6,-3.5,5.5,-11.05],[3.5,.7,-11.6,5.6,5.5,-11.05],[-5.6,4.8,-11.4,5.6,5.5,-11],[1.65,.7,-9.45,4.35,1.95,-8.55],[TENT.x0-.1,TENT.e-.1,TENT.z0-.1,TENT.x1+.1,TENT.r+.2,TENT.z1+.1],[TENT.x0,.4,TENT.z1-.1,TENT.x1,TENT.e,TENT.z1+.1],[-.6,0,15.3,2.2,1.1,16.7],THEATER.camOcc[THEATER.camOcc.length-1]];const CAM_SKIP=new Set([3]); // 벽은 카메라를 막지 않음 (대신 가리는 벽을 숨김)
function camHit(ox,oy,oz,dr,max,bt){let t=max;const lim=[[dr.y,oy,.25,ROOM.y1-.1]];
 if(window.IN_ROLLER){
  const doorDistance=dr.z<0?(ROLLER.DOOR.z-oz)/dr.z:Infinity;
  const throughDoor=(window.ROLLER_OPEN||adminAccess)&&Math.abs(ox+dr.x*doorDistance-ROLLER.DOOR.x)<ROLLER.DOOR.half-.1;
  lim.push([dr.x,ox,ROLLER.T.x0+.35,ROLLER.T.x1-.35],[dr.z,oz,throughDoor?ROLLER.T.z0-6:ROLLER.T.z0+.35,ROLLER.T.z1-.35]);
 }
 for(const [v,o,a,b] of lim){if(v>1e-6)t=Math.min(t,(b-o)/v);else if(v<-1e-6)t=Math.min(t,(a-o)/v);}
 const O=[ox,oy,oz],D=[dr.x,dr.y,dr.z];for(const bx of (window.IN_THEATER?CAM_OCC.concat(THEATER.camOcc):CAM_OCC)){if(bx===CAM_OCC[3]||(bt&&bx===CAM_OCC[0]))continue;let t0=0,t1=t,ok=true;for(let i=0;i<3&&ok;i++){const lo=bx[i],hi=bx[i+3];
  if(Math.abs(D[i])<1e-6){if(O[i]<lo||O[i]>hi)ok=false;}else{let a=(lo-O[i])/D[i],b=(hi-O[i])/D[i];if(a>b)[a,b]=[b,a];t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1)ok=false;}}
  if(ok&&t0>0)t=Math.min(t,t0);}return t;}
const clampX=x=>window.IN_ROLLER?Math.max(ROLLER.T.x0+.5,Math.min(ROLLER.T.x1-.5,x)):Math.max(window.OUTSIDE?-12.35:BOUND.x0,Math.min(window.OUTSIDE?THEATER.T.x1-.45:BOUND.x1,x)),clampZ=z=>window.IN_ROLLER?Math.max(ROLLER.T.z0-1,Math.min(ROLLER.T.z1-.5,z)):Math.max(BOUND.z0,Math.min(BOUND.z1,z));
function blocked(x,z,ignoreSeatTable){
 if(z>ROLLER.T.z0&&!ROLLER.inside(x,z))return true;
 if(!window.IN_ROLLER&&ROLLER.inside(x,z)&&!window.ROLLER_OPEN&&!adminAccess)return true;
 if(window.IN_ROLLER&&!me.rollerSkates)return true;const p0=rig.object3D.position;if(heightAt(x,z)-Math.max(p0.y,heightAt(p0.x,p0.z))>.2)return true;for(const o of OBSTACLES){if(o.r!==undefined){if(ignoreSeatTable&&Math.hypot(o.x-ignoreSeatTable.x,o.z-ignoreSeatTable.z)<.01)continue;if(Math.hypot(x-o.x,z-o.z)<o.r+.25)return true;}
 else if(x>o.x0-.25&&x<o.x1+.25&&z>o.z0-.25&&z<o.z1+.25)return true;}return false;}
function seatTaken(s){return Object.values(others).some(o=>o.seat===s.id);}
function nearestSeat(maxD){const p=rig.object3D.position;let best=null,bd=maxD;for(const s of SEATS){const d=Math.hypot(s.x-p.x,s.z-p.z);if(d<bd&&!seatTaken(s)){bd=d;best=s;}}return best;}
function tableCenter(t){const ss=SEATS.filter(s=>s.table===t);return{x:ss.reduce((a,s)=>a+s.x,0)/ss.length,z:ss.reduce((a,s)=>a+s.z,0)/ss.length};}
function sit(s){if(!s||seatTaken(s))return;mySeat=s.id;goal=null;goalSeat=null;marker.setAttribute('visible',false);rig.object3D.position.set(s.x,s.y||0,s.z);myYaw=s.yaw;{const bar=s.table==='BAR';camGoal=s.table==='TH'?THEATER.aim(s):bar?{yaw:myYaw+Math.PI,pitch:.4}:{yaw:myYaw,pitch:.4};}
 socket.emit('seat',s.id);socket.emit('move',{pos:[s.x,s.y||0,s.z],rot:myYaw});updateWhere();}
function stand(){if(!mySeat)return;camGoal=null;const s=SEATS.find(x=>x.id===mySeat);mySeat=null;if(s.stand)rig.object3D.position.set(s.stand[0],0,s.stand[1]);else{const c=tableCenter(s.table);
 rig.object3D.position.set(clampX(s.x+(s.x-c.x)*.45),0,clampZ(s.z+(s.z-c.z)*.45));}route=[];socket.emit('seat',null);updateWhere();}
function updateWhere(){document.body.classList.toggle('seated',!!mySeat);document.body.classList.toggle('thseat',!!(mySeat&&mySeat.startsWith('TH-')));const t=mySeat&&mySeat.split('-')[0];$('where').textContent=window.IN_ROLLER?'🛼 추억의 롤라장':t==='BAR'?'🍸 바 스툴':t==='TH'?'🎬 극장':window.IN_THEATER?'🎬 극장':t&&t[0]==='Y'?'🏮 야장':t?'🛋 테이블':'🌐 로비';}
AFRAME.registerComponent('my-sync',{tick(t,dt){dt=Math.min(dt||16,50)/1000;const p=rig.object3D.position;moving=false;
 if(joined&&!rollerSelectOpen&&$('entry').classList.contains('hidden')){let f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),r=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  let mx=0,mz=0,ignore=null,spd=1;if(joyX||joyY){f=-joyY;r=joyX;spd=Math.min(1,Math.hypot(f,r));}
  if(f||r){if(mySeat)stand();const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw),rx=Math.cos(camYaw),rz=-Math.sin(camYaw);mx=fx*f+rx*r;mz=fz*f+rz*r;}
  else if(goal&&!mySeat){mx=goal.x-p.x;mz=goal.z-p.z;const d=Math.hypot(mx,mz);if(goalSeat&&!goalSeat.stand)ignore=tableCenter(goalSeat.table);
   if(d<.12&&route.length){goal=route.shift();}else if(d<.12||(goalSeat&&d<.8)){if(goalSeat){sit(goalSeat);}goal=null;mx=mz=0;marker.setAttribute('visible',false);}}
  const l=Math.hypot(mx,mz);
  if(l>1e-4&&!mySeat){mx/=l;mz/=l;const sp=4*dt*spd*((keys.ShiftLeft||window.RUN_HOLD)?1.8:1); /* 달리기: PC 왼쪽 Shift / 모바일 달리기 버튼 누르고 있기 */let nx=clampX(p.x+mx*sp),nz=clampZ(p.z+mz*sp);
   if(!blocked(nx,nz,ignore)){p.x=nx;p.z=nz;moving=true;}
   else if(!blocked(nx,p.z,ignore)){p.x=nx;moving=true;}else if(!blocked(p.x,nz,ignore)){p.z=nz;moving=true;}
   else if(goal){goal=null;goalSeat=null;marker.setAttribute('visible',false);sys('앞이 막혀서 멈췄어요');}
   const target=Math.atan2(mx,mz);let d=target-myYaw;d=Math.atan2(Math.sin(d),Math.cos(d));myYaw+=d*Math.min(1,dt*12);}
  // 멈춘 채 의자 0.8m 이내면 자동으로 앉기
  if(!mySeat&&!moving&&!goal){stillT+=dt;if(stillT>.6){const s=nearestSeat(.8);if(s)sit(s);stillT=0;}}else stillT=0;
  {const ss=mySeat&&SEATS.find(q=>q.id===mySeat);const hy=mySeat?(ss.y||0):heightAt(p.x,p.z);if(mySeat)jumpV=null;else if(jumpV===null&&p.y-hy>.25)jumpV=0;if(jumpV!==null){jumpV-=14*dt;p.y+=jumpV*dt;if(p.y<=hy&&jumpV<0){p.y=hy;jumpV=null;}}else p.y+=(hy-p.y)*Math.min(1,dt*14);}if(!mySeat)$('prompt').classList.add('hidden');}
 if(!mySeat&&!moving&&!goal&&joined&&!rollerSelectOpen){idleT+=dt;if(idleT>3&&!myDance&&!me.rollerSkates)myDance=1+Math.floor(Math.random()*3);}else{idleT=0;myDance=0;}
 let rollerMotion='idle';
 if(moving)rollerMotion=(keys.ShiftLeft||window.RUN_HOLD)?'run':'skate';
 if(jumpV!==null)rollerMotion='jump';
 myAv.object3D.rotation.y=myYaw;
 if(myAv._h){
  if(me.rollerSkates&&!mySeat)myAv._h.play(SKATE_ANIMATION[rollerMotion]);
  else myAv._h.play(mySeat?'Sitting_Idle_Loop':(moving?'Walk_Loop':(myDance?'Dance_'+myDance:'Idle_Loop')));
 }
 {const roller=ROLLER.inside(p.x,p.z);if(roller!==window.IN_ROLLER){window.IN_ROLLER=roller;applyVolume();updateWhere();}
 if(roller&&joined&&!me.rollerSkates&&!rollerSelectOpen&&!rollerTravelPending)openRollerSelection();
 if(me.rollerSkates&&rollerMotion!==lastRollerMotion){lastRollerMotion=rollerMotion;socket.emit('rollerMotion',rollerMotion);}
 if(window.CLUB_OPEN===false&&joined&&!adminAccess&&!adminAccessPending&&!isOut(p.z)){ejectFromClub();} /* 문 닫힘: 클럽 안이면 밖으로 */const out=isOut(p.z);ROOM=roller?ROOM_ROLLER:out?ROOM_OUT:ROOM_IN;if(out!==window.OUTSIDE){window.OUTSIDE=out;applyVolume();}const th=THEATER.inside(p.x,p.z);if(th!==!!window.IN_THEATER){window.IN_THEATER=th;applyVolume();updateWhere();applySubs();}}
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
/* 시스템/게임 알림은 채팅창에 쌓지 않고 화면 위쪽에 잠깐 떴다 사라짐 (채팅창은 사람 대화만) */
function sys(t){let b=document.getElementById('toast');if(!b){b=document.createElement('div');b.id='toast';document.body.appendChild(b);}const d=document.createElement('div');d.textContent=t;b.appendChild(d);while(b.children.length>3)b.firstChild.remove();setTimeout(()=>d.remove(),2800);}
$('chatIn').addEventListener('focus',()=>{for(const k in keys)keys[k]=false;});
$('chatIn').addEventListener('keydown',e=>e.stopPropagation());
/* 모바일 채팅 입력 중: 먹기/마시기/점프/조이스틱 숨기고 채팅창 크게 */
$('chatIn').addEventListener('focus',()=>{clearTimeout(window._typT);document.body.classList.add('typing');const m=$('msgs');setTimeout(()=>{m.scrollTop=m.scrollHeight;},50);});
$('chatIn').addEventListener('blur',()=>{window._typT=setTimeout(()=>document.body.classList.remove('typing'),150);});
{const jb=$('jumpBtn');if(jb)jb.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();jump();});}
$('chatForm').onsubmit=e=>{e.preventDefault();const t=$('chatIn').value.trim();if(t)socket.emit('chat',t);$('chatIn').value='';};
socket.on('chatHistory',h=>{$('msgs').innerHTML='';if(!h||!h.length)return;const hm=t=>{const d=new Date(t);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};for(const m of h)addMsg(`<span style="opacity:.55"><small style="color:#888">${hm(m.t)}</small> <b style="color:#ffd84a">${esc(m.nick)}</b>: ${esc(m.text)}</span>`);addMsg('<div style="text-align:center;color:#888;font-size:11px;opacity:.8">— 이전 채팅 —</div>');;chatBottom();});
socket.on('chat',m=>{if(m.sys){sys(m.text);return;}bubble(m.id,m.text);addMsg(`<b style="color:#ffd84a" data-kid="${esc(m.id||'')}" data-knick="${esc(m.nick)}">${esc(m.nick)}</b>: ${esc(m.text)}`);});
socket.on('online',n=>{const e=document.getElementById('onlineCnt');if(e)e.textContent='👥 '+n+'명';});
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
socket.on('drink',({id,type})=>{if(id===myId)return;const el=others[id]&&others[id].el;if(el&&el._h)el._h.drink(type);setTimeout(()=>sfxNear('ka',id),2000);});
const GLASS_EL={};let GLASSES={},TABLE_ITEMS={};const TABLE_EL={};
const ITEM_NAME={soju:'🍶 소주',beer:'🍺 맥주',dakbal:'🍗 닭발',kkom:'🐍 꼼장어',fish:'🐟 생선구이',squid:'🦑 오징어볶음',chicken:'🍗 통닭',hoe:'🐟 모듬회',fruit:'🍉 과일안주'};
function myTable(){const m=/^([YT]\d)-/.exec(mySeat||'');return m?m[1]:null;}
function isBarSeat(){return !!mySeat&&mySeat.startsWith('BAR-');}
function canDrink(type){if(!mySeat)return false;if(isBarSeat())return GLASSES[mySeat]===type;if(type==='whiskey'||type==='cocktail')return false;const t=myTable();if(t)return (TABLE_ITEMS[t]||[]).includes(type);return false;}
// "캬~" 효과음 (Web Audio 합성, 내 화면에서만)
/* 효과음: 술 마시면 '캬~', 안주 먹으면 'Yum yum~'. 음소거면 전부 끔, 볼륨 슬라이더는 음악만 */
const SFX={ka:'/sfx/ka.mp3',yum:'/sfx/yum.mp3'},SFXA={};for(const k in SFX){SFXA[k]=new Audio(SFX[k]);SFXA[k].preload='auto';}
function sfx(k,g=1){if(muted||!SFXA[k]||g<=0)return;try{const a=SFXA[k].cloneNode();a.volume=Math.min(1,(window.OUTSIDE?.7:1)*(k==='ka'?.8:1)*g); /* 캐 20% 줄임 */const pr=a.play();pr&&pr.catch(()=>{});}catch(e){}}
function kya(){sfx('ka');}function chew(){sfx('yum');}
/* 다른 사람 먹고 마시는 소리: 가까이(7m 안)만 들리고 멀수록 작게 */
function sfxNear(k,id){const el=others[id]&&others[id].el;if(!el)return;const p=rig.object3D.position,q=el.object3D.position,d=Math.hypot(p.x-q.x,p.z-q.z);if(d>7)return;sfx(k,Math.pow(1-d/7,1.5)*.9);}
window.kya=kya;window.chew=chew;window.sfx=sfx;
function drink(type){if(!canDrink(type))return;const n=Date.now();if(n-(window._lastDrink||0)<2000)return;window._lastDrink=n;const m=$('myAvatar');if(m._h)m._h.drink(type);socket.emit('drink',type);setTimeout(kya,2000);}
function eat(k){const t=myTable();if(!t||!(TABLE_ITEMS[t]||[]).includes(k))return;const n=Date.now();if(n-(window._lastEat||0)<2000)return;window._lastEat=n;const m=$('myAvatar');if(m._h)m._h.drink('eat');socket.emit('eat',k);setTimeout(chew,600);}
window.eat=eat;
socket.on('eat',({id})=>{if(id===myId)return;const el=others[id]&&others[id].el;if(el&&el._h)el._h.drink('eat');setTimeout(()=>sfxNear('yum',id),600);});
function inBarZone(){const B=window.BAR_ZONE,p=rig.object3D.position;return !mySeat&&B&&p.x>=B.x0&&p.x<=B.x1&&p.z>=B.z0&&p.z<=B.z1;}
const near=(o,r)=>{const p=rig.object3D.position;return o&&!mySeat&&Math.hypot(p.x-o.x,p.z-o.z)<r;};
function nearTable(){const p=rig.object3D.position;let best=null,bd=1e9;for(const k in (window.POCHA_TABLES||{})){const [x,z,,r]=POCHA_TABLES[k],d=Math.hypot(p.x-x,p.z-z);if(d<(r||1.7)&&d<bd){bd=d;best=k;}}return best;}
socket.on('glasses',g=>{GLASSES=g||{};for(const k in GLASS_EL)if(GLASSES[k]!==GLASS_EL[k].kind){GLASS_EL[k].parent.remove(GLASS_EL[k]);delete GLASS_EL[k];}
 for(const k in GLASSES)if(!GLASS_EL[k]){const s=SEATS.find(q=>q.id===k);if(!s)continue;const g3=(GLASSES[k]==='cocktail'?cocktailGlass:rockGlass)(new THREE.Group());g3.kind=GLASSES[k];g3.position.set(9.68,1.3,s.z);g3.scale.setScalar(1.6);scene.object3D.add(g3);GLASS_EL[k]=g3;}refreshAct(true);});
const SLOT=[[-.22,-.22],[.22,-.22],[-.22,.22],[.22,.22],[0,-.28],[0,.28],[-.28,0],[.28,0]];
let TABLE_USES={};socket.on('tableUses',u=>{TABLE_USES=u||{};});
function usesTxt(k){const t=myTable();const it=TABLE_ITEMS[t]||[],i=it.indexOf(k);const n=i<0?0:((TABLE_USES[t]||[])[i]||6);return n;}
socket.on('table',t=>{TABLE_ITEMS=t||{};for(const k in TABLE_ITEMS){if(TABLE_EL[k])TABLE_EL[k].parent.remove(TABLE_EL[k]);const g=new THREE.Group(),c=(window.POCHA_TABLES||{})[k];if(!c)continue;g.position.set(c[0],c[2]||.7,c[1]);
 TABLE_ITEMS[k].forEach((it,i)=>{if(!it||!SLOT[i])return;const m=makeItem(it);m.position.set(SLOT[i][0],0,SLOT[i][1]);g.add(m);});scene.object3D.add(g);TABLE_EL[k]=g;}refreshAct(true);});
socket.on('carry',({id,kind})=>{if(id===myId){myCarry=kind;const m=$('myAvatar');if(m._h)m._h.carry(kind);refreshAct(true);return;}const el=others[id]&&others[id].el;if(el&&el._h)el._h.carry(kind);});
let myCarry=null;
socket.on('pour',({id,kind})=>{const el=others[id]&&others[id].el;if(el&&el._h)el._h.drink('pour');});
function serve(kind){if(!inBarZone())return;const n=Date.now();if(n-(window._lastServe||0)<3000)return;window._lastServe=n;const m=$('myAvatar');if(m._h)m._h.drink('pour');
 const p=rig.object3D.position;socket.emit('serve',{x:p.x,z:p.z,kind});}
window.serve=serve;window.drink=drink;
function actions(){const A=[];
 if(window.IN_ROLLER){
  if(near(ROLLER.ARRIVE,2.5))A.push(['🛼 롤러 꾸미기',()=>openRollerSelection(),'roller-style']);
  if(near(ROLLER.ARRIVE,2.5)||near(ROLLER.EXIT,2.5))A.push(['🚪 거리로 나가기',()=>rollerTravel('exit'),'roller-exit']);
  if(near(ROLLER.SHOP,2.5))A.push(['🍜 컵라면 먹기',()=>rollerSnack('ramen'),'roller-ramen'],['🥤 사이다 마시기',()=>rollerSnack('cider'),'roller-cider']);
  return A;
 }
 if(near(ROLLER.ENTRY,2.5))A.push((window.ROLLER_OPEN||adminAccess)?['🛼 롤라장 입장',()=>rollerTravel('enter'),'roller-enter']:['🛼 롤라장 영업 종료',null,'roller-closed']);
if(mySeat&&mySeat.startsWith('TAXI')){A.push(['🏠 집으로 돌아가기',()=>goHome(),'home'],['🚪 내리기',()=>stand(),'getoff']);return A;}if(mySeat){if(isBarSeat()){if(GLASSES[mySeat])A.push([GLASSES[mySeat]==='cocktail'?'🍸 칵테일':'🥃 위스키',()=>drink(GLASSES[mySeat]),'d-'+GLASSES[mySeat]]);}
  else{for(const k of ['soju','beer'])if(canDrink(k))A.push([ITEM_NAME[k],()=>drink(k),'d-'+k,usesTxt(k)]);const t=myTable();if(t&&myCarry)A.push(['🍽 테이블에 놓기',()=>socket.emit('place'),'place']);if(t)for(const k of ['dakbal','kkom','fish','squid','chicken','hoe','fruit'])if((TABLE_ITEMS[t]||[]).includes(k))A.push([ITEM_NAME[k]+' 먹기',()=>eat(k),'e-'+k,usesTxt(k)]);if(t&&t[0]==='Y'){A.push(['🛎 주문하기',()=>openOrder(),'order']);if(ORDER_NOTE)A.push([ORDER_NOTE,null,'lbl']);if(MY_ORDERS.length)A.push(['⏳ 주문: '+MY_ORDERS.map(o=>ITEM_NAME[o.kind]).join(', ')+' · 알바가 준비 중',null,'lbl']);}}
  return A;}
 if(inBarZone()){A.push(['🍸 바텐더 서빙:',null,'lbl'],['🥃 위스키',()=>serve('whiskey'),'s-whiskey'],['🍸 칵테일',()=>serve('cocktail'),'s-cocktail']);return A;}
 if(!mySeat&&((window.WAITERS||[]).some(w=>w.near)||(window.ALBA&&near(window.ALBA,2))))A.push(['💝 후원하기',()=>window.open('https://toon.at/donate/errdaydrip','_blank','noopener'),'donate']);
 const nt=nearTable();if(myCarry&&nt)A.push(['🍽 테이블에 놓기',()=>socket.emit('place'),'place']);
 {const DB=(window.DARTS||[]).findIndex(d=>near(d,1.2));if(DB>=0){const g=(window.DART_G||[])[DB],me=g&&g.players.findIndex(p=>p.id===myId);
  A.push([`🎯 조준해서 던지기 (${DB+1}번)`,()=>dartAim(DB),'dart'+DB]);
  A.push(['하이스코어 (3R)',()=>socket.emit('dartNew',{b:DB,mode:'high',rounds:3},r=>r&&!r.ok&&r.err&&sys(`🎯 ${(r.err)}`)),'dhi3'],['하이스코어 (8R)',()=>socket.emit('dartNew',{b:DB,mode:'high',rounds:8},r=>r&&!r.ok&&r.err&&sys(`🎯 ${(r.err)}`)),'dhi8']);}}
 {const TS=SEATS.filter(q=>q.table==='TAXI');if(TS.length&&TS.some(q=>near({x:q.x,z:q.z-.9},1.9))){const f=TS.find(q=>!seatTaken(q));if(f)A.push(['🚕 택시 타기',()=>{const g=TS.find(q=>!seatTaken(q));g&&sit(g);},'taxi']);else A.push(['🚕 만석',null,'lbl']);}}
 if(window.POOLT&&!mySeat){const pp=rig.object3D.position;let bi=-1,bd=2.6;POOLT.forEach((q,i)=>{const d=Math.hypot(q.x-pp.x,q.z-pp.z);if(d<bd){bd=d;bi=i;}});if(bi>=0)A.push([POOLT[bi].kind==='carom'?'🔴 4구 치기':'🎱 포켓볼 치기',()=>poolOpen(bi),'pool']);}
 if(near(window.FRIDGE,1.6))for(const k of ['soju','beer'])A.push([ITEM_NAME[k]+' 꺼내기',()=>socket.emit('pickup',k),'p-'+k]);
 if(near(window.COOK,2.2))for(const k of ['dakbal','kkom','fish','squid'])A.push([ITEM_NAME[k],()=>socket.emit('pickup',k),'p-'+k]);
 if(near({x:-11.6,z:20.5},2.2))A.push(['🍗 통닭 가져가기',()=>socket.emit('pickup','chicken'),'p-chicken']);if(near({x:-11.6,z:15},2.2))A.push(['🐟 모듬회 가져가기',()=>socket.emit('pickup','hoe'),'p-hoe']);
 if(myCarry&&!A.length)A.push(['들고 있음: '+ITEM_NAME[myCarry],null,'lbl']);
 return A;}
let actKey='';function refreshAct(force){const A=actions().sort((a,b)=>(a[2]==='place')-(b[2]==='place')),k=A.map(a=>a[2]+a[0]+(a[3]||'')).join('|')+myCarry;if(!force&&k===actKey)return;actKey=k;const bar=$('actBar');bar.innerHTML='';bar.classList.toggle('hidden',!A.length);
 for(const [t,f,id,n] of A){const b=document.createElement(f?'button':'span');b.textContent=t;if(n){const c=n>=4?'#3ee05a':n>=2?'#ffd23a':'#ff3b3b';b.classList.add('uses');b.style.background=`linear-gradient(rgba(30,10,40,.9),rgba(30,10,40,.9)) padding-box,conic-gradient(${c} 0 ${n*100/6}%,#3a3a3a 0) border-box`;b.title=n+'/6';}b.dataset.act=id;if(f)b.addEventListener('click',e=>{e.stopPropagation();f();});else b.className='lbl';bar.appendChild(b);}}
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
function applyVolume(){const v=(window.OUTSIDE&&!window.IN_THEATER&&!window.IN_ROLLER?volume*.5:volume)*(window.POOL_DUCK||1);audio.volume=v/100;audio.muted=muted;extVol();if(ytReady){yt.setVolume(v);muted?yt.mute():yt.unMute();}}
const isAud=c=>c&&(c.type==='mp3'||c.type==='url');let hls=null,hlsUrl=null;
function loadScript(src){return new Promise((ok,no)=>{const e=document.createElement('script');e.src=src;e.onload=ok;e.onerror=no;document.head.appendChild(e);});}
function setAudioSrc(cur){if(cur.type==='url'&&cur.hls&&!audio.canPlayType('application/vnd.apple.mpegurl')){if(hlsUrl===cur.url)return;hlsUrl=cur.url;
  (window.Hls?Promise.resolve():loadScript('https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js')).then(()=>{if(hls)hls.destroy();hls=new Hls();hls.loadSource(cur.url);hls.attachMedia(audio);
   hls.on(Hls.Events.ERROR,(e,d)=>{if(d.fatal&&hlsUrl===cur.url){sys('⚠ 스트림 재생 불가 → 다음 곡');socket.emit('music',{type:'error',index:music.index});}});}).catch(()=>{});return;}
 if(hls){hls.destroy();hls=null;}hlsUrl=null;if(audio.src!==new URL(cur.url,location.href).href)audio.src=cur.url;}
// 외부 플레이어 (사운드클라우드 / 비메오): 숨은 iframe
let ext=null; // {type,key,api,ready,el}
function extStop(){if(!ext)return;try{ext.type==='sc'?ext.api.pause():ext.api.destroy();}catch(e){}if(ext.el)ext.el.remove();ext=null;}
function extVol(){if(!ext||!ext.ready)return;const v=muted?0:(window.OUTSIDE&&!window.IN_THEATER&&!window.IN_ROLLER?volume*.5:volume)*(window.POOL_DUCK||1);try{ext.type==='sc'?ext.api.setVolume(v):ext.api.setVolume(v/100);}catch(e){}}
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
$('adminBtn').onclick=async()=>{if(adminToken){if(confirm('관리자 로그아웃할까요?')){adminToken=null;sessionStorage.removeItem('adminToken');syncAdminAccess();renderMusic();}return;}
 const pw=await askPw();if(!pw)return;const r=await fetch('/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
 const j=await r.json();if(j.token){adminToken=j.token;sessionStorage.setItem('adminToken',j.token);sys('관리자 로그인 완료');syncAdminAccess();renderMusic();renderPresets();}else alert(j.error);};
const cmd=(type,extra)=>socket.emit('music',{type,token:adminToken,...extra});
document.querySelectorAll('#adminCtl > button[data-c]').forEach(b=>b.onclick=()=>cmd(b.dataset.c));
$('clearAllBtn').onclick=()=>{if(!music.playlist.length){sys('재생목록이 이미 비어 있어요');return;}if(confirm(`재생목록 ${music.playlist.length}곡을 모두 삭제할까요? (되돌릴 수 없어요)`))cmd('clearAll');};
$('pl').onclick=e=>{const b=e.target;if(b.dataset.sel)cmd('select',{index:+b.dataset.sel});if(b.dataset.del&&confirm('이 곡을 삭제할까요?'))cmd('delete',{index:+b.dataset.del});};
function adminFail(r){if(r.status===403){adminToken=null;sessionStorage.removeItem('adminToken');syncAdminAccess();renderMusic();}}
$('file').onchange=async()=>{const f=$('file').files[0];if(!f)return;if(f.size>30*1024*1024){$('upMsg').textContent='30MB 초과';return;}
 const fd=new FormData();fd.append('by',me.nick||'관리자');fd.append('file',f);$('upMsg').textContent='업로드 중...';
 const r=await fetch('/upload',{method:'POST',headers:{'x-admin-token':adminToken},body:fd});const j=await r.json();$('upMsg').textContent=r.ok?'완료!':(j.error||'실패');adminFail(r);$('file').value='';};
$('ytForm').onsubmit=async e=>{e.preventDefault();const url=$('ytUrl').value.trim();if(!url)return;$('upMsg').textContent='링크 확인 중...';
 const r=await fetch('/link',{method:'POST',headers:{'Content-Type':'application/json','x-admin-token':adminToken},body:JSON.stringify({url,by:me.nick||'관리자'})});
 const j=await r.json();$('upMsg').textContent=r.ok?`✅ ${j.service} 인식 · ${j.added>1?j.added+'곡':'「'+(j.title||'')+'」'} 추가!`:(j.error||'실패');adminFail(r);if(r.ok)$('ytUrl').value='';};
// 점프 버튼: 오른쪽 끝, 액션바 바로 위
/* 모바일: 점프·달리기 버튼은 항상 같은 자리, 다른 버튼들은 달리기 버튼 위로 쌓임 */
setInterval(()=>{const j=document.getElementById('jumpBtn'),a=document.getElementById('actBar'),rb=document.getElementById('runBtn');if(!j)return;j.style.bottom='';if(rb)rb.style.bottom='';
 const mob=getComputedStyle(j).display!=='none';if(!mob){if(a){a.style.bottom='';a.style.right='';}return;}const jr=j.getBoundingClientRect();let top=jr.top;
 if(rb){rb.style.bottom=(innerHeight-jr.top+10)+'px';if(getComputedStyle(rb).display!=='none')top=rb.getBoundingClientRect().top;}
 if(a){a.style.bottom=(innerHeight-top+10)+'px';a.style.right=getComputedStyle(j).right;}},200);
{const rb=$('runBtn');if(rb){const on=e=>{e.preventDefault();e.stopPropagation();window.RUN_HOLD=true;rb.classList.add('on');},off=e=>{window.RUN_HOLD=false;rb.classList.remove('on');};rb.addEventListener('pointerdown',on);['pointerup','pointercancel','pointerleave'].forEach(ev=>rb.addEventListener(ev,off));window.addEventListener('blur',off);}}

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

/* 나이트 입장 문: 관리자가 닫으면 클럽 안 사람 전부 야장 포차로 내보내고 새로 못 들어옴 */
window.CLUB_OPEN=true;const DOOR_BLOCK=[];
function setClubDoor(open,announce){const was=window.CLUB_OPEN;window.CLUB_OPEN=open;for(const b of DOOR_BLOCK){const i=OBSTACLES.indexOf(b);if(i>=0)OBSTACLES.splice(i,1);}DOOR_BLOCK.length=0;
 if(!open&&!adminAccess){for(const D of [window.DOOR,THEATER.CLUB_DOOR]){const b={x0:D.x-D.w/2-.1,x1:D.x+D.w/2+.1,z0:11.7,z1:12.3};OBSTACLES.push(b);DOOR_BLOCK.push(b);}}
 window.setClubDoorVis&&window.setClubDoorVis(open||adminAccess);const bt=$('clubDoorBtn');if(bt)bt.textContent='🚪 나이트 문: '+(open?'열림':'닫힘');
 if(announce&&was!==open)sys(open?'🚪 나이트클럽 문이 열렸어요!':'🚪 나이트클럽 문이 닫혔어요');}
function ejectFromClub(){if(mySeat){const s=mySeat;mySeat=null;socket.emit('seat',null);camGoal=null;}route=[];goal=null;goalSeat=null;marker.setAttribute('visible',false);
 const D=window.DOOR;rig.object3D.position.set(D.x+(Math.random()-.5)*3,0,14+Math.random()*1.5);myYaw=0;updateWhere();}
window.ejectFromClub=ejectFromClub;
window.DART_THROW={};
/* 🎯 다트 자세: 게임 참가 중이면 보드를 보고 팔 들기, 던질 때 팔 휘두르기 (모두에게 보임) */
function dartPose(root,id,c){if(!id)return;const G=window.DART_G||[],D=window.DARTS||[];let b=-1;for(let i=0;i<G.length;i++){const g=G[i];if(g&&g.players&&g.players.some(p=>p.id===id)){b=i;break;}}
 if(b<0||!D[b]){c.root.rotation.y=0;return;}const wp=root.object3D.getWorldPosition(new THREE.Vector3()),wy=new THREE.Euler().setFromQuaternion(root.object3D.getWorldQuaternion(new THREE.Quaternion()),'YXZ').y,bx=11.94,bz=D[b].z;if(Math.hypot(wp.x-D[b].x,wp.z-bz)>2.2){c.root.rotation.y=0;return;}
 const yaw=Math.atan2(bx-wp.x,bz-wp.z);c.root.rotation.y=yaw-wy+(window.DART_YAWOFF||0);
 const a=c.arms[0],e=(performance.now()-(window.DART_THROW[id]||0))/1000;let x=-1.75;if(e<.5){x=e<.25?-1.75-(e/.25)*.9:-2.65+((e-.25)/.25)*1.9;}
 a.rotation.set(x,0,-.15);c.arms[1].rotation.set(-.2,0,.25);}
window.DART_G=[];socket.on('dartState',d=>{if(d.hit&&d.hit.id)window.DART_THROW[d.hit.id]=performance.now();window.DART_G[d.b]=d.g;const h=d.hit&&d.hit.id===myId?d.hit:null; /* 다른 사람 다트는 점수판 숫자만 갱신, 꽂히는 다트·알림은 내 것만 */window.dartState&&window.dartState({...d,hit:h});if(h&&h.win)setTimeout(()=>window.dartAimClose(),1300);if(h&&(h.bust||h.win))sys(`🎯 ${h.label}${h.bust?' (버스트!)':''}${h.win?' 🏆 승리!':''}`);});
/* 조준: 판 위를 드래그(또는 마우스 이동)해서 위치를 정하고 손을 떼면 던짐. 조준점은 살짝 흔들림 */
function dartAim(b){if(document.getElementById('dartAim'))return;const o=document.createElement('div');o.id='dartAim';o.innerHTML='<div class="dah">🎯 판 위를 누르고 끌어 조준 → 손 떼면 던지기</div><canvas width="640" height="640"></canvas><button type="button">닫기</button>';document.body.appendChild(o);
 const cv=o.querySelector('canvas'),c=cv.getContext('2d'),img=window.DART_IMG;let ax=0,ay=0,down=false,raf=0;const S=320,R=S/2*0.86; /* 판(더블 바깥선)=R */
 const pos=e=>{const r=cv.getBoundingClientRect();ax=((e.clientX-r.left)/r.width*S-S/2)/R;ay=-((e.clientY-r.top)/r.height*S-S/2)/R;};
 const draw=t=>{c.setTransform(2,0,0,2,0,0);c.clearRect(0,0,S,S);if(img)c.drawImage(img,S/2-R/200*256,S/2-R/200*256,R/200*512,R/200*512);o._sx=(o._sx??ax)+(ax-(o._sx??ax))*.12;o._sy=(o._sy??ay)+(ay-(o._sy??ay))*.12; /* 조준점이 손가락을 늦게 따라옴 */const w=down?.13:.07,wx=o._sx+(Math.sin(t/110)+Math.sin(t/47)*.5)*w,wy=o._sy+(Math.cos(t/150)+Math.cos(t/61)*.5)*w;o._w=[wx,wy];
  const px=S/2+wx*R,py=S/2-wy*R;c.strokeStyle='#00ffcc';c.lineWidth=2;c.beginPath();c.arc(px,py,9,0,7);c.moveTo(px-15,py);c.lineTo(px+15,py);c.moveTo(px,py-15);c.lineTo(px,py+15);c.stroke();raf=requestAnimationFrame(draw);};raf=requestAnimationFrame(draw);
 const close=()=>{cancelAnimationFrame(raf);o.remove();};o._close=close;o.querySelector('button').onclick=close;
 cv.addEventListener('pointerdown',e=>{e.preventDefault();down=true;cv.setPointerCapture(e.pointerId);pos(e);});cv.addEventListener('pointermove',e=>{if(down||e.pointerType==='mouse')pos(e);});
 cv.addEventListener('pointerup',e=>{if(!down)return;down=false;const [x,y]=o._w||[ax,ay];socket.emit('dart',{b,x,y},r=>{if(r&&r.ok&&r.done)setTimeout(()=>window.dartAimClose(),1300); /* 게임 끝나면 조준 화면 자동으로 닫힘 */if(r&&r.ok&&r.me)sys(r.done?`🏁 끝! 총 ${r.done.score}점`:(r.me.thrown?`R${r.me.round} · ${r.me.thrown}/3발`:`R${r.me.round-1} 끝 · 3/3발`)+` · 합계 ${r.me.score}점 (+${r.hit.pts} ${r.hit.label})`);if(r&&!r.ok&&r.err)sys(`🎯 ${(r.err)}`);});});}
window.dartAim=dartAim;window.dartAimClose=()=>{const o=document.getElementById('dartAim');o&&o._close&&o._close();};
socket.on('clubDoor',d=>setClubDoor(!!(d&&d.open),!!(d&&d.by)));
$('clubDoorBtn').onclick=()=>{if(!adminToken)return;const open=!window.CLUB_OPEN;if(!open&&!confirm('나이트 문을 닫을까요? 일반 이용자는 야장 포차로 나가고 관리자는 계속 이용할 수 있어요.'))return;socket.emit('setClubDoor',{token:adminToken,open},r=>{if(!(r&&r.ok))sys('실패: '+((r&&r.err)||'?'));});};
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
 if(E.contains(document.activeElement))return;E.innerHTML=PRESETS.map((p,i)=>`<div class="prow"><input class="pn" maxlength="20" value="${esc(p.name)}" placeholder="이름"><input class="pu" maxlength="300" value="${esc(p.url)}" placeholder="유튜브 재생목록 주소"></div>`).join('')+'<button type="button" id="presetSave">💾 버튼 저장</button><div class="prow trow"><input class="pu" id="tickerIdle" maxlength="120" placeholder="💜 LED 전광판 문구"><button type="button" id="tickerIdleSave">💾 전광판 글자</button><button type="button" id="tickerIdleClear">🗑 지우기</button></div><div class="prow trow"><input class="pu" id="rankUrl" maxlength="300" placeholder="투네이션 후원 랭킹(ranking) 위젯 주소"><button type="button" id="rankSave">💾 랭킹 링크</button></div><div class="prow trow"><button type="button" id="tgTicker"></button><button type="button" id="tgRank"></button></div>';
 const tgl=()=>{const B=window.BOARDS||{ticker:true,rank:true};$('tgTicker').textContent='💜 전광판 '+(B.ticker?'ON':'OFF');$('tgRank').textContent='🏆 랭킹판 '+(B.rank?'ON':'OFF');};tgl();window.renderBoardsUi=tgl;
 ['ticker','rank'].forEach(k=>{$(k==='ticker'?'tgTicker':'tgRank').onclick=e=>{e.stopPropagation();const B=window.BOARDS||{ticker:true,rank:true};socket.emit('setBoards',{token:adminToken,[k]:!B[k]},r=>{if(!(r&&r.ok))sys('변경 실패: '+((r&&r.err)||'?'));});};});
 $('rankSave').onclick=e=>{e.stopPropagation();socket.emit('setRank',{token:adminToken,url:$('rankUrl').value},r=>sys(r&&r.ok?'💾 랭킹 링크 저장됨 (다시 연결)':'저장 실패: '+((r&&r.err)||'?')));};
 {const i=$('tickerIdle');if(i)i.value=window.TICKER_IDLE||'';}
 $('tickerIdleClear').onclick=e=>{e.stopPropagation();if(!confirm('전광판 글자를 지울까요?'))return;$('tickerIdle').value='';socket.emit('setTickerIdle',{token:adminToken,text:''},r=>sys(r&&r.ok?'🗑 전광판 글자 지움':'실패: '+((r&&r.err)||'?')));};
 $('tickerIdleSave').onclick=e=>{e.stopPropagation();socket.emit('setTickerIdle',{token:adminToken,text:$('tickerIdle').value},r=>sys(r&&r.ok?'💾 전광판 글자 저장됨 (모두에게 반영)':'저장 실패: '+((r&&r.err)||'?')));};
 if(adminToken)socket.emit('getTicker',adminToken,r=>{const j=$('rankUrl');if(r&&r.ok&&j&&document.activeElement!==j)j.value=r.rankUrl||'';});
 $('presetSave').onclick=e=>{e.stopPropagation();const list=[...E.querySelectorAll('.prow:not(.trow)')].map(r=>({name:r.querySelector('.pn').value,url:r.querySelector('.pu').value}));socket.emit('setPresets',{token:adminToken,list},r=>sys(r&&r.ok?'💾 프리셋 저장됨 (모두에게 반영)':'저장 실패: '+((r&&r.err)||'?')));};}
socket.on('presets',p=>{PRESETS=p||[];renderPresets();});
socket.on('boards',b=>{window.BOARDS=b;window.setBoards&&window.setBoards(b);window.renderBoardsUi&&window.renderBoardsUi();});socket.on('ranking',r=>{window.setRanking&&window.setRanking(r);});socket.on('tickerIdle',t=>{window.setTickerIdle&&window.setTickerIdle(t);const i=$('tickerIdle');if(i&&document.activeElement!==i)i.value=t||'';});socket.on('donations',l=>{window.setDonations&&window.setDonations(l);});

/* 관리자: 채팅 기록 전체 삭제 (서버 기록 + 모든 사람 채팅창) */
setInterval(()=>{const b=$('chatClear');if(b)b.style.display=adminToken?'':'none';},800);
$('chatClear').addEventListener('click',e=>{e.stopPropagation();e.preventDefault();if(!adminToken||!confirm('모든 사람의 채팅 기록을 지울까요?'))return;socket.emit('clearChat',{token:adminToken},r=>{if(!r||!r.ok){sys('채팅 지우기 실패: '+((r&&r.err)||'관리자 다시 로그인'));}});});
['pointerdown','touchstart','mousedown'].forEach(ev=>$('chatClear').addEventListener(ev,e=>e.stopPropagation(),{passive:true}));
socket.on('chatCleared',()=>{$('msgs').innerHTML='';sys('🧹 채팅 기록이 지워졌어요');});

/* 🚕 택시 '집으로 돌아가기' = 게임 종료 (서버에서 바로 퇴장 처리, 유령 안 남음) */
function goHome(){if(!confirm('집으로 돌아갈까요? (게임에서 나가요)'))return;window.BYE=true;
 /* 다음 접속 땐 처음부터 (이름·캐릭터 창). 외형(profile)은 창에 미리 채워지도록 유지 */
 try{['lastState','joinedAt'].forEach(k=>{localStorage.removeItem(k);sessionStorage.removeItem(k);});}catch(e){}
 try{audio.pause();yt&&yt.pauseVideo&&yt.pauseVideo();}catch(e){}
 const end=()=>{if(window._byeDone)return;window._byeDone=true;try{socket.disconnect();}catch(e){}
  const d=document.createElement('div');d.id='byeScreen';d.innerHTML='<div class="bx"><div class="bt">🚕 안녕히 가세요!</div><div class="bs">오늘 밤도 즐거우셨나요? 또 놀러 오세요 ✨</div><button type="button">다시 들어가기</button></div>';document.body.appendChild(d);d.querySelector('button').onclick=()=>location.reload();};
 socket.timeout(1500).emit('bye',()=>end());setTimeout(end,1600);}
window.goHome=goHome;

/* ---------- 🎱 당구: 탑뷰 화면에서 직접 조준(큐볼 주위로 돌리기) + 파워바 드래그 → 놓으면 샷 ---------- */
let SHARED=[0,1].map(t=>({t,max:t?2:4,kind:t?'carom':'pool',goal:10,balls:t?POOL.rackCarom():POOL.rack(),players:[],turn:0,scores:{},msg:''})),POOLT_I=0,PRAC=true,PRACS=null,POOLS=SHARED[0],poolAnim=null;
const poolMe=()=>PRAC?0:POOLS.players.findIndex(p=>p.id===myId),poolMyTurn=()=>{const i=poolMe();return i>=0&&POOLS.turn===i&&!POOLS.over&&!poolAnim;};
const isCar=()=>POOLS.kind==='carom',cueN=()=>isCar()&&!PRAC?POOLS.turn%2:0;
let poolMode=localStorage.getItem('caromMode')==='3'?'3':'4',pocketMode=localStorage.getItem('pocketMode')==='s'?'s':'8';const selMode=()=>POOLT_I?poolMode:pocketMode;const curMode=()=>POOLS.mode||(isCar()?'4':'8');const modeName=m=>m==='s'?'스트레이트':m==='8'?'8볼':m+'구';
const poolNewPrac=()=>({t:-1,tab:POOLT_I,kind:POOLT_I?'carom':'pool',mode:selMode(),sc:0,balls:POOLT_I?POOL.rackCarom(poolMode):POOL.rack(),players:[{id:myId,nick:me.nick||'나'}],turn:0,scores:{},msg:'연습 중',practice:true});
const poolIn=()=>SHARED.findIndex(S=>S.players.some(p=>p.id===myId));
function poolPlay(before,a,p,final,mine,t,op){const SR=POOL.simulate(before,a,p,{frames:true,...(op||{})}),fr=SR.frames,EVS=SR.ev||[];let ei=0;if(document.getElementById('poolUI')&&((t<0&&PRAC)||(!PRAC&&t===POOLT_I)))poolSfx('cue',p);const anim={balls:before,fr:null};const vis=()=>document.getElementById('poolUI')&&((t<0&&PRAC)||(!PRAC&&t===POOLT_I));if(vis())poolAnim=anim;const t0=performance.now();
 const step=()=>{const i=Math.floor((performance.now()-t0)/1000*60);{const ui=vis();let fac=ui?1:0;if(!ui&&t>=0&&window.POOLT&&!document.getElementById('poolUI')){const q=POOLT[t]||POOLT[0],pp=rig.object3D.position,dd=Math.hypot(q.x-pp.x,q.z-pp.z);fac=dd<7?Math.pow(1-dd/7,1.5)*.8:0;}let n=0;while(ei<EVS.length&&EVS[ei].f<=i){const e=EVS[ei++];if(fac>0&&n<4){poolSfx(e.k,e.g*fac);n++;}}}if(i>=fr.length){if(poolAnim===anim)poolAnim=null;if(t>=0){SHARED[t]=final;window.poolRender&&window.poolRender(final.balls,t);if(!PRAC&&t===POOLT_I)POOLS=final;}else PRACS=final,POOLS=PRAC?final:POOLS;poolDraw();
   if(final.over&&t>=0){const best=final.over.win;window.poolWinner&&window.poolWinner('🏆 우승: '+best,t);if(mine)poolBanner(final);}else if(mine&&final.msg)sys('🎱 '+final.msg);return;}
  anim.fr=fr[i];if(t>=0)window.poolRenderFrame&&window.poolRenderFrame(before,fr[i],t);if(poolAnim===anim)poolDraw();requestAnimationFrame(step);};step();}
socket.on('poolState',st=>{const t=st.t||0;st._dl=st.left?performance.now()+st.left:0;SHARED[t]=st;if(!poolAnim)window.poolRender&&window.poolRender(st.balls,t);if(!PRAC&&t===POOLT_I&&!poolAnim)POOLS=st;
 if(!PRAC&&t===POOLT_I&&!st.players.some(p=>p.id===myId)&&document.getElementById('poolUI')){PRAC=true;if(!PRACS||PRACS.tab!==POOLT_I)PRACS=poolNewPrac();POOLS=PRACS;}poolDraw();});
socket.on('poolShot',d=>{const t=d.state.t||0;d.state._dl=d.state.left?performance.now()+d.state.left:0;poolPlay(d.before,d.a,d.p,d.state,d.state.players.some(p=>p.id===myId),t,{cue:d.cue||0,carom:!!d.carom,sx:d.sx||0,sy:d.sy||0});});
socket.on('poolStart',d=>{POOLT_I=(d&&d.t)||0;PRAC=false;POOLS=SHARED[POOLT_I];if(!document.getElementById('poolUI'))poolOpen(POOLT_I,true);poolDraw();});
socket.on('poolWin',st=>{const t=st.t||0;SHARED[t]=st;if(!PRAC&&t===POOLT_I)POOLS=st;window.poolWinner&&window.poolWinner('🏆 우승: '+st.over.win,t);if(st.players.some(p=>p.id===myId))poolBanner(st);poolDraw();});
socket.on('poolEnded',d=>{sys('🎱 '+(d&&d.msg||'같이 치기가 끝났어요'));});
socket.on('poolChallengeResult',d=>{if(d&&d.msg)sys('🎱 '+d.msg);});
socket.on('poolInvite',d=>{const old=document.getElementById('poolInv');if(old)old.remove();const o=document.createElement('div');o.id='poolInv';let left=d.sec||20;
 o.innerHTML=`<div class="pih">🎱 같이 치기 신청</div><div><b>${esc(d.nick)}</b>님이 ${d.kind==='carom'?(d.mode||'4')+'구':'포켓볼 '+modeName(d.mode||'8')} 같이 치자고 해요</div><div class="pit"></div><div class="pib"><button type="button" class="ok">수락</button><button type="button" class="no">거절</button></div>`;document.body.appendChild(o);
 const tk=()=>{o.querySelector('.pit').textContent=`${left}초 안에 답해 주세요`;};tk();const iv=setInterval(()=>{left--;tk();if(left<=0)done(false,true);},1000);
 function done(acc,silent){clearInterval(iv);o.remove();if(silent)return;socket.emit('poolAnswer',{from:d.from,accept:acc},r=>{if(r&&!r.ok&&r.err)sys('🎱 '+r.err);});}
 o.querySelector('.ok').onclick=()=>done(true);o.querySelector('.no').onclick=()=>done(false);});
socket.on('poolInviteGone',()=>{const o=document.getElementById('poolInv');if(o)o.remove();});
function poolInviteUI(){if(document.getElementById('poolPick'))return;const S=SHARED[POOLT_I];const mine=S.players.some(p=>p.id===myId);const room=(S.max||4)-Math.max(S.players.length,1);
 if(S.players.length&&!mine)return sys('🎱 게임 중이에요 — 대기열에 들어가세요');if(mine&&S.shots>0)return sys('🎱 게임이 이미 시작됐어요');if(room<=0)return sys('🎱 만석 (4명)');
 const busy=new Set(SHARED.flatMap(x=>x.players.map(p=>p.id).concat((x.queue||[]).map(q=>q.id))));const TQ=(window.POOLT||[])[POOLT_I]||{x:-9,z:-8.9};const L=Object.entries(others).filter(([id,o])=>{if(!o.data||!o.data.nick||o.gone||busy.has(id))return false;const q=o.el.object3D.position;const dd=(window.POOLT||[]).map(T=>Math.hypot(q.x-T.x,q.z-T.z));return dd[POOLT_I]<=3&&!dd.some((v,i)=>i!==POOLT_I&&v<dd[POOLT_I]);});
 const o=document.createElement('div');o.id='poolPick';o.innerHTML=`<div class="pih">🎱 같이 치기 신청 (${modeName(selMode())}) <button type="button" class="x">✕</button></div><div class="pis">이 테이블 근처에 있는 사람만 보여요 · 최대 ${room}명 더</div><div class="pil">${L.length?L.map(([id,q])=>`<label><input type="checkbox" value="${id}"> ${esc(q.data.nick)}</label>`).join(''):'<i>이 테이블 근처에 신청할 수 있는 사람이 없어요</i>'}</div><div class="pib"><button type="button" class="ok">신청 보내기</button></div>`;
 document.getElementById('poolUI').appendChild(o);o.querySelector('.x').onclick=()=>o.remove();
 o.querySelectorAll('input').forEach(c=>c.onchange=()=>{const n=o.querySelectorAll('input:checked').length;if(n>room){c.checked=false;sys(`🎱 최대 ${room}명까지`);}});
 o.querySelector('.ok').onclick=()=>{const ids=[...o.querySelectorAll('input:checked')].map(c=>c.value);if(!ids.length)return sys('🎱 한 명 이상 골라 주세요');
  ids.forEach(to=>socket.emit('poolChallenge',{t:POOLT_I,to,mode:selMode()},r=>{if(r&&!r.ok&&r.err)sys('🎱 '+r.err);}));sys(`🎱 같이 치기 신청 보냄 (${ids.length}명) · 20초 기다려요`);o.remove();};}
function poolBanner(f){const W=new Set(String(f.over.win).split(', '));const rows=f.players.map(p=>({nick:p.nick,sc:f.scores[p.id]||0,r:W.has(p.nick)?'🏆 우승':'패'})).sort((x,y)=>(y.r==='🏆 우승')-(x.r==='🏆 우승')||y.sc-x.sc).concat((f.forfeits||[]).map(q=>({nick:q.nick,sc:q.score,r:'🏳 기권패'})));
 const o=document.createElement('div');o.id='poolWin';o.innerHTML=`<div class="pw1">🏆 우승: ${esc(f.over.win)}</div>`+rows.map(x=>`<div class="${x.r==='🏆 우승'?'w':''}">${x.r} · ${esc(x.nick)} — ${x.sc}${f.kind==='carom'||f.mode==='s'?'점':'개'}</div>`).join('')+`<div class="pw2">${esc(f.msg||'')}</div>`;document.body.appendChild(o);setTimeout(()=>o.remove(),6000);}
const CAROM3_RULES='· 2명 대결 (신청한 사람 흰 공 vs 받은 사람 노란 공), 공 3개 (흰·노랑·빨강)<br>· 내 공으로 상대 공과 빨간 공을 모두 맞히고, 두 번째 공을 맞히기 전에 쿠션을 3번 이상 닿으면 +1점, 한 번 더<br>· 못 하면 차례 넘김 (감점 없음)<br>· 10점 먼저 내면 우승<br>· 당점: 위=밀어치기, 아래=끌어치기, 좌우=회전 (쿠션 각도 바뀜)<br>· 한 차례 15초, 넘기면 다음 사람<br>· 새 게임은 모두 동의해야 시작<br>· 게임 중 나가면 기권패';
const CAROM_RULES='· 2명 대결 (신청한 사람 흰 공 vs 받은 사람 노란 공), 다른 사람은 대기열<br>· 내 공으로 빨간 공 2개를 한 번에 맞히면 +1점, 한 번 더<br>· 상대 공(흰/노랑)을 맞히면 파울 -1점, 차례 넘김<br>· 빨간 공 하나만 맞히거나 못 맞히면 차례 넘김<br>· 10점 먼저 내면 우승<br>· 당점: 위=밀어치기, 아래=끌어치기, 좌우=회전 (쿠션 각도 바뀜)<br>· 한 차례 15초, 넘기면 다음 사람<br>· 새 게임은 모두 동의해야 시작<br>· 게임 중 나가면 기권패';
const STRAIGHT_RULES='· 2~4명이 차례대로 친다<br>· 아무 공이나 넣으면 1개=1점 (8번도 1점), 넣으면 한 번 더<br>· 못 넣으면 다음 사람<br>· 파울 = 흰 공이 아무 공도 못 맞히거나 구멍에 빠짐 → -1점, 차례 넘김, 다음 사람이 흰 공을 원하는 곳에 놓고 침<br>· 8점 먼저 내면 우승 (공이 다 떨어지면 점수 많은 사람 우승)<br>· 당점: 위=밀어치기, 아래=끌어치기, 좌우=회전<br>· 한 차례 15초, 넘기면 다음 사람<br>· 새 게임은 모두 동의해야 시작<br>· 게임 중 나가면 기권패';
const POOL_RULES='· 2~4명이 차례대로 (2명 이상이면 1·3번째 vs 2·4번째 편)<br>· 처음 공을 넣은 편이 그 공 종류로 정해짐: 솔리드(1~7) 또는 스트라이프(9~15)<br>· 내 편 공을 아무 포켓에나 넣으면 한 번 더, 못 넣으면 다음 사람<br>· 내 공을 다 넣은 뒤 8번 공을 아무 포켓에 넣으면 승리<br>· 8번 공을 먼저 넣으면(또는 흰 공과 같이 빠지면) 패배<br>· 파울 = 흰 공이 아무 공도 못 맞히거나 구멍에 빠짐 → 차례 넘김, 다음 사람이 흰 공을 원하는 곳에 놓고 침<br>· 당점: 위=밀어치기, 아래=끌어치기, 좌우=회전<br>· 한 차례 15초, 넘기면 다음 사람<br>· 새 게임은 모두 동의해야 시작<br>· 게임 중 나가면 기권패';
let PAC=null;function poolSfx(k,g=1){if(muted||g<=0)return;try{PAC=PAC||new (window.AudioContext||window.webkitAudioContext)();if(PAC.state==='suspended')PAC.resume();const A=PAC,t=A.currentTime,out=A.createGain();out.connect(A.destination);
 const vol=Math.min(1,.15+.85*g)*(window.OUTSIDE?.7:1);const tone=(f,f2,d,type,v)=>{const o=A.createOscillator(),gg=A.createGain();o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f2,t+d);gg.gain.setValueAtTime(v*vol,t);gg.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(gg);gg.connect(out);o.start(t);o.stop(t+d+.02);};
 const noise=(d,fq,v)=>{const b=A.createBuffer(1,Math.ceil(A.sampleRate*d),A.sampleRate),c=b.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=(Math.random()*2-1)*Math.pow(1-i/c.length,3);const s=A.createBufferSource();s.buffer=b;const f=A.createBiquadFilter();f.type='bandpass';f.frequency.value=fq;const gg=A.createGain();gg.gain.value=v*vol;s.connect(f);f.connect(gg);gg.connect(out);s.start(t);};
 if(k==='cue'){noise(.05,2500,.9);tone(320,120,.08,'triangle',.5);}else if(k==='ball'){tone(2400,1900,.05,'sine',.55);noise(.03,4000,.6);}else if(k==='cush'){tone(140,70,.12,'sine',.6);noise(.06,500,.4);}else if(k==='pocket'){tone(220,70,.25,'triangle',.6);noise(.18,350,.5);setTimeout(()=>{try{tone(160,90,.12,'sine',.35);}catch(e){}},140);}}catch(e){}}
window.poolSfx=poolSfx;
const poolRev=()=>localStorage.getItem('poolAimRev')!=='0';const poolHintTxt=()=>matchMedia('(pointer:fine)').matches?'🖱 조준 · 클릭 유지 → 놓으면 샷':poolRev()?'손가락 쪽이 큐 · 바 당겼다 놓으면 샷':'끄는 쪽으로 조준 · 바 당겼다 놓으면 샷';
let poolAim=0,poolPow=0,poolHold=false,poolSX=0,poolSY=0;
function poolSfxSend(t,a,p,op){try{const r=POOL.simulate(POOL.clone(PRACS.balls),a,p,{frames:true,...op});const e=[[0,'cue',p]].concat((r.ev||[]).slice(0,39).map(x=>[Math.round(x.f/60*1000),x.k,+x.g.toFixed(2)]));socket.emit('poolSfx',{t,e});}catch(_){}}
socket.on('poolSfx',d=>{if(!window.POOLT||!d||!d.e||document.getElementById('poolUI'))return;const q=POOLT[d.t]||POOLT[0],pp=rig.object3D.position,dd=Math.hypot(q.x-pp.x,q.z-pp.z);if(dd>7)return;const fac=Math.pow(1-dd/7,1.5)*.8;d.e.forEach(([ms,k,g])=>setTimeout(()=>poolSfx(k,g*fac),ms));});
function poolShootLocal(a,p){poolSfxSend(POOLT_I,a,p,PRACS.kind==='carom'?{carom:true,cue:0,sx:poolSX,sy:poolSY}:{sx:poolSX,sy:poolSY});if(PRACS.kind==='carom'){const before=POOL.clone(PRACS.balls);const r=POOL.simulate(POOL.clone(before),a,p,{carom:true,cue:0,sx:poolSX,sy:poolSY});const f={...PRACS,balls:r.balls};
  if(PRACS.mode==='3'){if(r.hits.includes(1)&&r.hits.includes(2)&&r.c2>=3){f.sc=(PRACS.sc||0)+1;f.msg=`👍 3쿠션 성공! +1 (${f.sc}점)`;}else f.msg=r.hits.length>=2?`공 2개 맞힘, 쿠션 ${r.c2}번 (3번 필요)`:r.hits.length?'공 하나만 맞음':'안 맞음';}
  else if(r.hits.includes(1)){f.msg='노란 공 맞힘 (실전이면 파울 -1)';}else if(r.hits.includes(2)&&r.hits.includes(3)){f.sc=(PRACS.sc||0)+1;f.msg=`👍 빨간 공 둘 다! +1 (${f.sc}점)`;}else f.msg=r.hits.length?'빨간 공 하나만 맞음':'안 맞음';
  poolPlay(before,a,p,f,false,-1,{carom:true,cue:0,sx:poolSX,sy:poolSY});return;}
 const before=POOL.clone(PRACS.balls);const r=POOL.simulate(POOL.clone(before),a,p,{sx:poolSX,sy:poolSY});const pk=r.pocketed;const f={...PRACS,balls:r.balls,msg:'연습 중',bih:pk.includes(0)||r.firstHit===null,shots:(PRACS.shots||0)+1,groups:{...(PRACS.groups||{})}};
 {const ob=pk.filter(n=>n&&n!==8);if(PRACS.mode!=='s'&&f.groups[0]===undefined&&ob.length&&!pk.includes(0)&&(PRACS.shots||0)>0){const g=ob[0]<8?'solid':'stripe';f.groups={0:g,1:g==='solid'?'stripe':'solid'};}}
 if(pk.includes(0)){POOL.spotCue(f.balls);f.msg='파울: 흰 공 빠짐 → 🖐 원하는 곳에 놓기';}else if(r.firstHit===null)f.msg='파울: 아무 공도 못 맞힘 → 🖐 원하는 곳에 놓기';else if(pk.length)f.msg=`${pk.length}개 들어감!`;
 if((PRACS.mode!=='s'&&pk.includes(8))||f.balls.filter(o=>!o.in&&o.n).length===0){f.msg+=' · 새로 배치';setTimeout(()=>{if(PRACS===f){PRACS=poolNewPrac();if(PRAC)POOLS=PRACS;poolDraw();}},2000);}
 poolPlay(before,a,p,f,false,-1,{sx:poolSX,sy:poolSY});}
function poolOpen(t,shared){if(document.getElementById('poolUI'))return;if(t===undefined){const ps=window.POOLT||[];let bi=0,bd=1e9;
  const rig=document.getElementById('rig');const pp=rig?rig.object3D.position:{x:0,z:0};ps.forEach((q,i)=>{const d=Math.hypot(q.x-pp.x,q.z-pp.z);if(d<bd){bd=d;bi=i;}});t=bi;}
 POOLT_I=t;const inT=poolIn();if(inT>=0){POOLT_I=inT;PRAC=false;POOLS=SHARED[inT];}else{PRAC=true;if(!PRACS||PRACS.tab!==POOLT_I)PRACS=poolNewPrac();POOLS=PRACS;}
 const o=document.createElement('div');o.id='poolUI';
 o.innerHTML='<div class="ph"><span id="poolStat"></span></div><div id="poolHud"></div><canvas id="poolCv" width="1200" height="660"></canvas><div class="pbw"><div id="poolBar"><div id="poolFill"></div><span id="poolHint"></span></div></div><div class="pbtn"><button type="button" id="poolJoin">🎱 같이</button><button type="button" id="poolMode"></button><button type="button" id="poolCtl">조작변경</button><button type="button" id="poolRule">❓ 규칙</button><button type="button" id="poolNew">🔄 새로</button><button type="button" id="poolClose">닫기</button></div><div id="poolRules"></div><div id="poolSpin"><canvas width="120" height="120"></canvas><div>당점</div></div>';
 document.body.appendChild(o);const cv=o.querySelector('#poolCv');window.POOL_DUCK=.3;applyVolume();
 if(matchMedia('(max-width:700px)').matches)o.classList.add('narrow');o.querySelector('#poolHint').textContent=poolHintTxt();
 {const sc=o.querySelector('#poolSpin canvas');const setS=e=>{const b=sc.getBoundingClientRect();let x=((e.clientX-b.left)/b.width-.5)*2/.8,y=-((e.clientY-b.top)/b.height-.5)*2/.8;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}if(l<.15){x=0;y=0;}poolSX=x;poolSY=y;poolDraw();};sc.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();sc.setPointerCapture(e.pointerId);sc._d=1;setS(e);});sc.addEventListener('pointermove',e=>{if(sc._d)setS(e);});sc.addEventListener('pointerup',()=>sc._d=0);}
 {const cb=o.querySelector('#poolCtl');if(matchMedia('(pointer:fine)').matches&&!matchMedia('(pointer:coarse)').matches)cb.style.display='none';cb.onclick=()=>{localStorage.setItem('poolAimRev',poolRev()?'0':'1');o.querySelector('#poolHint').textContent=poolHintTxt();sys(poolRev()?'🎱 조작: 손가락 쪽이 큐 (기본)':'🎱 조작: 끄는 쪽으로 샷');};}
 o.querySelector('#poolMode').onclick=()=>{if(!PRAC)return sys('🔴 게임 중엔 모드를 못 바꿔요');if(POOLT_I){poolMode=poolMode==='4'?'3':'4';localStorage.setItem('caromMode',poolMode);}else{pocketMode=pocketMode==='8'?'s':'8';localStorage.setItem('pocketMode',pocketMode);}PRACS=poolNewPrac();POOLS=PRACS;poolDraw();};
 o.querySelector('#poolJoin').onclick=()=>{const S=SHARED[POOLT_I],mine=S.players.some(p=>p.id===myId),qi=(S.queue||[]).findIndex(q=>q.id===myId);
  if(qi>=0)return socket.emit('poolQueue',{t:POOLT_I,join:false},()=>sys('🎱 대기 취소'));if(S.players.length&&!mine)return socket.emit('poolQueue',{t:POOLT_I,join:true},r=>{if(r&&r.ok)sys(`🎱 대기 ${r.pos}번째 — 이번 게임 끝나면 시작`);else if(r&&r.err)sys('🎱 '+r.err);});poolInviteUI();};o.querySelector('#poolRule').onclick=()=>{o.querySelector('#poolRules').classList.toggle('on');poolDraw();};
 const toTable=e=>{const b=cv.getBoundingClientRect(),sx=(e.clientX-b.left)/b.width*1200,sy=(e.clientY-b.top)/b.height*660;return[(sx-600)/POOLK,(sy-330)/POOLK];};
 const aim=e=>{if(!poolMyTurn())return;const c=POOLS.balls.find(q=>q.n===cueN());const [x,y]=toTable(e);poolAim=(e.pointerType==='mouse'||!poolRev())?Math.atan2(y-c.y,x-c.x):Math.atan2(c.y-y,c.x-x); /* 모바일: 손가락 쪽에 큐, 반대 방향으로 샷 */poolDraw();};
 const canPlace=()=>!isCar()&&POOLS.bih&&poolMyTurn();const cueB=()=>POOLS.balls.find(q=>q.n===0);
 const placeMove=e=>{const c=cueB();let [x,y]=toTable(e);x=Math.max(-POOL.L/2+POOL.R,Math.min(POOL.L/2-POOL.R,x));y=Math.max(-POOL.Wd/2+POOL.R,Math.min(POOL.Wd/2-POOL.R,y));c.x=x;c.y=y;c.in=false;poolDraw();};
 const placeEnd=()=>{cv._p=false;const c=cueB();if(POOLS.balls.some(o=>o.n!==0&&!o.in&&Math.hypot(o.x-c.x,o.y-c.y)<2*POOL.R+.002)){c.x=cv._p0[0];c.y=cv._p0[1];poolDraw();return sys('🖐 다른 공과 겹쳐요');}
  if(!PRAC)socket.emit('poolPlace',{t:POOLT_I,x:c.x,y:c.y},r=>{if(r&&!r.ok){c.x=cv._p0[0];c.y=cv._p0[1];poolDraw();if(r.err)sys('🖐 '+r.err);}});};
 cv.addEventListener('pointerdown',e=>{e.preventDefault();cv.setPointerCapture(e.pointerId);if(canPlace()){const c=cueB(),[x,y]=toTable(e);if(Math.hypot(x-c.x,y-c.y)<POOL.R*3.5){cv._p=true;cv._p0=[c.x,c.y];placeMove(e);return;}}if(e.pointerType==='mouse'){if(e.button!==0)return;aim(e);if(!poolMyTurn())return sys('🎱 아직 차례가 아니에요');poolHold=true;cv._m=true;const t0=performance.now();const up=()=>{if(!cv._m)return;const ph=((performance.now()-t0)/1300)%2;poolPow=ph<1?ph:2-ph;poolDraw();requestAnimationFrame(up);};up();return;}cv._d=true;aim(e);});
 cv.addEventListener('pointermove',e=>{if(cv._p)return placeMove(e);if(cv._d||e.pointerType==='mouse')aim(e);});cv.addEventListener('pointerup',e=>{if(cv._p)return placeEnd();cv._d=false;if(cv._m){cv._m=false;rel();}});cv.addEventListener('pointercancel',()=>{cv._d=false;if(cv._m){cv._m=false;poolHold=false;poolPow=0;poolDraw();}});
 const bar=o.querySelector('#poolBar'),setP=e=>{const b=bar.getBoundingClientRect();poolPow=Math.max(0,Math.min(1,(e.clientX-b.left)/b.width));poolDraw();};
 bar.addEventListener('pointerdown',e=>{e.preventDefault();if(!poolMyTurn()){sys('🎱 아직 차례가 아니에요');return;}bar.setPointerCapture(e.pointerId);poolHold=true;setP(e);});
 bar.addEventListener('pointermove',e=>{if(poolHold)setP(e);});
 const rel=()=>{if(!poolHold)return;poolHold=false;const p=poolPow;poolPow=0;poolDraw();if(p<.03)return;if(PRAC)poolShootLocal(poolAim,p);else socket.emit('poolShoot',{t:POOLT_I,a:poolAim,p,sx:poolSX,sy:poolSY},r=>{if(r&&!r.ok&&r.err)sys('🎱 '+r.err);});};
 bar.addEventListener('pointerup',rel);bar.addEventListener('pointercancel',()=>{poolHold=false;poolPow=0;poolDraw();});
 o.querySelector('#poolClose').onclick=()=>poolClose();o.querySelector('#poolNew').onclick=()=>{if(!PRAC)return socket.emit('poolNew',{t:POOLT_I},()=>{});PRACS=poolNewPrac();POOLS=PRACS;poolDraw();};poolDraw();}
function poolClose(auto){const o=document.getElementById('poolUI');if(!o)return;o.remove();window.POOL_DUCK=1;applyVolume();socket.emit('poolLeave');PRAC=true;poolAnim=null;}
window.poolOpen=poolOpen;window.poolClose=poolClose;setInterval(()=>{if(!PRAC&&document.getElementById('poolUI')&&!poolAnim)poolDraw();},500);
const POOLK=1200/(POOL.L+.3);
function poolDraw(){const cv=document.getElementById('poolCv');if(!cv)return;const c=cv.getContext('2d'),K=POOLK,X=x=>600+x*K,Y=y=>330+y*K;
 c.fillStyle='#4a240c';c.fillRect(0,0,1200,660);c.fillStyle=isCar()?'#1d4fa8':'#0f6b3a';c.fillRect(X(-POOL.L/2),Y(-POOL.Wd/2),POOL.L*K,POOL.Wd*K);
 c.fillStyle='#000';if(!isCar())POOL.POCKETS.forEach(([x,y])=>{c.beginPath();c.arc(X(x),Y(y),POOL.PR*K,0,7);c.fill();});
 c.strokeStyle='rgba(255,255,255,.15)';c.beginPath();c.moveTo(X(-POOL.L/4),Y(-POOL.Wd/2));c.lineTo(X(-POOL.L/4),Y(POOL.Wd/2));c.stroke();
 const COL=n=>isCar()?['#f4f1e6','#f2c418','#d12a1f','#d12a1f'][n]:['#f4f1e6','#f2c418','#1f4fd1','#d12a1f','#5a2a9a','#ff7a1a','#1f8a3a','#8a1a1a','#111'][n<=8?n:n-8];
 const B=poolAnim&&poolAnim.fr?poolAnim.balls.map((o,i)=>({n:o.n,in:!poolAnim.fr[i],x:poolAnim.fr[i]?poolAnim.fr[i][0]:0,y:poolAnim.fr[i]?poolAnim.fr[i][1]:0})):POOLS.balls;
 const cue=B.find(o=>o.n===cueN()&&!o.in);if(cue&&!isCar()&&POOLS.bih&&poolMyTurn()){c.strokeStyle='#3cff8a';c.lineWidth=4;c.setLineDash([6,6]);c.beginPath();c.arc(X(cue.x),Y(cue.y),POOL.R*K*2.2,0,7);c.stroke();c.setLineDash([]);}
 if(poolMyTurn()&&cue&&!cue.in){/* 조준선: 처음 맞는 공/쿠션까지 + 맞은 뒤 갈 방향 (나만 보임) */const dx=Math.cos(poolAim),dy=Math.sin(poolAim);let tmin=3,hit=null;
  for(const o of B){if(o===cue||o.in)continue;const ox=o.x-cue.x,oy=o.y-cue.y,t=ox*dx+oy*dy;if(t<=0)continue;const d2=ox*ox+oy*oy-t*t,rr=4*POOL.R*POOL.R;if(d2>rr)continue;const th=t-Math.sqrt(rr-d2);if(th<tmin){tmin=th;hit=o;}}
  const tx=dx>0?(POOL.L/2-POOL.R-cue.x)/dx:dx<0?(-POOL.L/2+POOL.R-cue.x)/dx:9,ty=dy>0?(POOL.Wd/2-POOL.R-cue.y)/dy:dy<0?(-POOL.Wd/2+POOL.R-cue.y)/dy:9;let wall=null;if(Math.min(tx,ty)<tmin){tmin=Math.min(tx,ty);hit=null;wall=tx<ty?'x':'y';}
  const gx=cue.x+dx*tmin,gy=cue.y+dy*tmin;const dl=(x0,y0,x1,y1,col,w)=>{c.setLineDash([8,8]);c.strokeStyle=col;c.lineWidth=w||3;c.beginPath();c.moveTo(X(x0),Y(y0));c.lineTo(X(x1),Y(y1));c.stroke();c.setLineDash([]);};
  dl(cue.x,cue.y,gx,gy,'rgba(255,255,255,.75)');c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=2;c.beginPath();c.arc(X(gx),Y(gy),POOL.R*K,0,7);c.stroke();
  const LN=.38;
  if(hit){const nx=(hit.x-gx)/(2*POOL.R),ny=(hit.y-gy)/(2*POOL.R),dn=dx*nx+dy*ny;dl(hit.x,hit.y,hit.x+nx*LN*(.4+dn),hit.y+ny*LN*(.4+dn),'rgba(255,230,90,.9)');
   let cx=dx-dn*nx,cy=dy-dn*ny;cx+=dx*poolSY*.55*dn;cy+=dy*poolSY*.55*dn;const cl=Math.hypot(cx,cy);if(cl>.03)dl(gx,gy,gx+cx/cl*LN*Math.min(1,cl+.2),gy+cy/cl*LN*Math.min(1,cl+.2),'rgba(150,220,255,.85)');}
  else if(wall){const r0x=wall==='x'?-dx:dx,r0y=wall==='y'?-dy:dy,an=poolSX*.32,rx=r0x*Math.cos(an)-r0y*Math.sin(an),ry=r0x*Math.sin(an)+r0y*Math.cos(an);dl(gx,gy,gx+rx*LN,gy+ry*LN,'rgba(150,220,255,.85)');}
  /* 큐대 (파워만큼 뒤로) */const back=POOL.R*1.5+.04+poolPow*.35;c.strokeStyle='#e0c090';c.lineWidth=10;c.lineCap='round';c.beginPath();c.moveTo(X(cue.x-dx*back),Y(cue.y-dy*back));c.lineTo(X(cue.x-dx*(back+1.1)),Y(cue.y-dy*(back+1.1)));c.stroke();
  c.strokeStyle='#2a6aff';c.lineWidth=10;c.beginPath();c.moveTo(X(cue.x-dx*back),Y(cue.y-dy*back));c.lineTo(X(cue.x-dx*(back+.03)),Y(cue.y-dy*(back+.03)));c.stroke();}
 for(const o of B){if(o.in)continue;const x=X(o.x),y=Y(o.y),r=POOL.R*K;c.fillStyle=o.n>8?'#fff':COL(o.n);c.beginPath();c.arc(x,y,r,0,7);c.fill();if(o.n>8){c.fillStyle=COL(o.n);c.fillRect(x-r,y-r*.5,r*2,r);}
  if(o.n){c.fillStyle='#fff';c.beginPath();c.arc(x,y,r*.45,0,7);c.fill();c.fillStyle='#000';c.font=`bold ${Math.round(r*.6)}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(o.n,x,y+1);}}
 {const H=document.getElementById('poolHud');if(H){const B0=POOLS.balls,left=B0.filter(o=>!o.in&&o.n!==0),objL=left.filter(o=>o.n!==8).length,eightIn=!left.some(o=>o.n===8);
  const CAR=isCar(),myB=CAR&&!PRAC?(POOLS.players.findIndex(p=>p.id===myId)%2?'노란':'흰'):'흰';const ST=!CAR&&curMode()==='s';const GN=g=>g==='solid'?'솔리드(1~7)':'스트라이프(9~15)';const myT=PRAC?0:(POOLS.players.findIndex(p=>p.id===myId)<0?-1:POOLS.players.findIndex(p=>p.id===myId)%2),myG=(POOLS.groups||{})[myT],myLeft=myG?left.filter(o=>(myG==='solid'?o.n<8:o.n>8)).length:0;const tgt=ST?`🎯 아무 공 넣기 (1개=1점)${PRAC?'':' · 8점'}`:CAR?(curMode()==='3'?`🎯 ${myB} 공: 상대 공+빨강, 쿠션 3번`:`🎯 ${myB} 공: 빨간 공 2개 맞히기`)+(PRAC?'':' · '+(POOLS.goal||10)+'점'):eightIn?'':PRAC?(objL?'🎯 8번 빼고 아무 공 ('+objL+'개)':'🎯 8번 공만 남음!'):myT<0?'':!myG?'🎯 아무 공 (넣은 종류가 내 공)':myLeft?`🎯 내 공 ${myLeft}개 남음`:'🎯 이제 8번 공!';
  if(PRAC&&CAR){H.innerHTML=`<div>🔴 ${curMode()}구 연습 · 득점 <b>${POOLS.sc||0}</b></div><div>${tgt}</div>`;}else if(PRAC){H.innerHTML=`<div>🎱 ${modeName(curMode())} 연습 · 남은 공 <b>${left.length}</b> · 넣은 공 <b>${15-left.length}</b></div><div>${tgt}</div>`;}
  else{const P=POOLS.players,sec=POOLS._dl&&!POOLS.over?Math.ceil(Math.max(0,POOLS._dl-performance.now())/1000):null;
   H.innerHTML=P.map((p,i)=>`<div class="${i===POOLS.turn?'on':''}">${i===POOLS.turn?'▶ ':''}${CAR?(i%2?'🟡':'⚪'):''}${esc(p.nick)}${p.id===myId?' (나)':''}${!CAR&&!ST&&(POOLS.groups||{})[i%2]?' '+((POOLS.groups[i%2]==='solid')?'●':'◐'):''} — <b>${POOLS.scores[p.id]||0}</b>${CAR||ST?'점':'개'}</div>`).join('')+(CAR?`<div>🔴 ${curMode()}구 대결</div><div>${tgt}</div>`:`<div>남은 공 <b>${left.length}</b> · ${tgt}</div>`)+(sec!==null&&!poolAnim?`<div class="tm${sec<=3?' hot':''}">⏱ ${sec}초 · ${P[POOLS.turn]&&P[POOLS.turn].id===myId?'내 차례!':esc((P[POOLS.turn]||{}).nick||'')+' 차례'}</div>`:'')+((POOLS.queue||[]).length?`<div class="q">대기: ${POOLS.queue.map(q=>esc(q.nick)).join(', ')}</div>`:'');}}}
 {const sc=document.querySelector('#poolSpin canvas');if(sc){const g=sc.getContext('2d');g.clearRect(0,0,120,120);g.fillStyle=isCar()&&cueN()===1?'#f2c418':'#f4f1e6';g.beginPath();g.arc(60,60,48,0,7);g.fill();g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=1;g.beginPath();g.moveTo(12,60);g.lineTo(108,60);g.moveTo(60,12);g.lineTo(60,108);g.stroke();g.fillStyle='#e0261a';g.beginPath();g.arc(60+poolSX*48*.8,60-poolSY*48*.8,8,0,7);g.fill();}}
 {const mb=document.getElementById('poolMode');if(mb){mb.style.display='';mb.textContent=`🔁 ${modeName(PRAC?selMode():curMode())}`;mb.disabled=!PRAC;}}
 {const H=document.getElementById('poolHud');if(H&&!isCar()&&curMode()==='8'){const T=PRAC?0:POOLS.players.findIndex(p=>p.id===myId);if(T>=0||PRAC){const t=PRAC?0:T%2,G=POOLS.groups||{},mg=G[t],og=G[1-t],B0=POOLS.balls.filter(o=>!o.in);const GN=g=>g==='solid'?'솔리드 (1~7)':'스트라이프 (9~15)';
   const COLB=n=>['#f4f1e6','#f2c418','#1f4fd1','#d12a1f','#5a2a9a','#ff7a1a','#1f8a3a','#8a1a1a','#111'][n<=8?n:n-8];const icons=g=>B0.filter(o=>g==='solid'?o.n>0&&o.n<8:o.n>8).map(o=>`<span class="mb${o.n>8?' st':''}" style="--c:${COLB(o.n)}">${o.n}</span>`).join('');
   const mine=mg?B0.filter(o=>mg==='solid'?o.n>0&&o.n<8:o.n>8).length:-1;
   const div=document.createElement('div');div.className='grp';div.innerHTML=!mg?'<div>내 공: <b>미정</b></div>':`<div>내 공: <b>${GN(mg)}</b> ${mine?icons(mg):'<b class="e8">이제 8번!</b>'}</div><div class="op">${PRAC?'나머지':'상대'}: ${GN(og)} (${B0.filter(o=>og==='solid'?o.n>0&&o.n<8:o.n>8).length}개)</div>`;H.appendChild(div);}}}
 {const H=document.getElementById('poolHud');if(H&&!isCar()&&POOLS.bih&&poolMyTurn()&&!poolAnim){const d=document.createElement('div');d.className='bih';d.textContent='🖐 흰 공을 원하는 곳에 놓으세요';H.prepend(d);}}
 const st=document.getElementById('poolStat');if(st){const P=POOLS.players,cur=P[POOLS.turn];
  st.textContent=PRAC?`혼자 연습 (나만 보여요)${POOLS.msg?' · '+POOLS.msg:''}`:``+P.map(p=>`${p.nick} ${POOLS.scores[p.id]||0}개`).join(' / ')+(cur?` · 차례: ${cur.nick}${cur.id===myId?' (나!)':''}`:'')+(!PRAC&&POOLS._dl&&!POOLS.over&&!poolAnim?` · ⏱ ${Math.ceil(Math.max(0,POOLS._dl-performance.now())/1000)}초`:'')+(POOLS.msg?` · ${POOLS.msg}`:'');}
 {const j=document.getElementById('poolJoin'),n=document.getElementById('poolNew'),S=SHARED[POOLT_I];if(j){const mine=S.players.some(p=>p.id===myId),qi=(S.queue||[]).findIndex(q=>q.id===myId),other=S.players.length&&!mine;j.disabled=!!(mine&&(S.shots>0||S.players.length>=(S.max||4)));j.textContent=qi>=0?`⏳ ${qi+1}번째·취소`:other?`🎱 대기하기${(S.queue||[]).length?'('+S.queue.length+')':''}`:mine?(S.players.length>=(S.max||4)?'🎱 만석':S.shots>0?'🎱 게임 중':'🎱 같이'):'🎱 같이';}if(n){const mine=S.players.some(p=>p.id===myId),vt=(S.votes||[]).includes(myId);n.style.display=PRAC||mine?'':'none';n.textContent=PRAC?'🔄 새로':`🔄 동의 ${(S.votes||[]).length}/${S.players.length}${vt?'✓':''}`;}
  const R=document.getElementById('poolRules');if(R)R.innerHTML=isCar()?(curMode()==='3'?(PRAC?'<b>3구 연습</b><br>· 나만 보이는 테이블<br><br><b>같이 치기 규칙</b><br>':'<b>3구 규칙</b><br>')+CAROM3_RULES:(PRAC?'<b>4구 연습</b><br>· 나만 보이는 테이블<br>· 흰 공으로 빨간 공 2개를 한 번에 맞혀 보세요<br><br><b>같이 치기 규칙</b><br>':'<b>4구 규칙</b><br>')+CAROM_RULES):(PRAC?`<b>${modeName(curMode())} 연습</b><br>· 나만 보이는 테이블, 자유롭게 연습<br>· 파울(못 맞힘/흰 공 빠짐)이면 흰 공을 원하는 곳에 놓고 다시 쳐요<br>· 공을 다 넣으면${curMode()==='8'?' (또는 8번이 들어가면)':''} 새로 배치<br><br><b>같이 치기 규칙</b><br>`:`<b>${modeName(curMode())} 규칙</b><br>`)+(curMode()==='s'?STRAIGHT_RULES:POOL_RULES);}
 const f=document.getElementById('poolFill');if(f){f.style.width=(poolPow*100)+'%';f.style.background=poolPow>.75?'#ff3b3b':poolPow>.4?'#ffd23a':'#3ee05a';}}

/* 👥 접속자 목록: 인원수 누르면 열고/닫기 */
{const oc=$('onlineCnt');if(oc){oc.style.cursor='pointer';oc.title='접속자 보기';const stop=e=>e.stopPropagation();['pointerdown','touchstart','mousedown'].forEach(ev=>oc.addEventListener(ev,stop,{passive:true}));
 let tmr=null;const render=()=>{const p=document.getElementById('userList');if(!p)return;const L=[(me.nick||'손님')+' (나)',...Object.values(others).map(o=>o.data&&o.data.nick).filter(Boolean)];
  p.querySelector('.ulb').innerHTML=L.map(n=>`<div>• ${esc(n)}</div>`).join('');p.querySelector('.ulh span').textContent=`👥 접속자 ${L.length}명`;};
 const close=()=>{const p=document.getElementById('userList');if(p)p.remove();clearInterval(tmr);};
 oc.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();if(document.getElementById('userList'))return close();const p=document.createElement('div');p.id='userList';p.innerHTML='<div class="ulh"><span></span><button type="button">✕</button></div><div class="ulb"></div>';
  ['pointerdown','touchstart','mousedown','click'].forEach(ev=>p.addEventListener(ev,stop,{passive:true}));p.querySelector('button').onclick=close;$('chat').appendChild(p);render();tmr=setInterval(render,1000);});}}


// ---------- Roller rink entry, customization and shared snack animations ----------
function resetRollerMovement(){
 route=[];goal=null;goalSeat=null;jumpV=null;moving=false;joyX=joyY=0;
 for(const k in keys)keys[k]=false;
 marker.setAttribute('visible',false);lastRollerMotion='';
}
function applyRollerPosition(d){
 if(!d||!Array.isArray(d.pos))return;
 resetRollerMovement();rig.object3D.position.set(...d.pos);me.rollerSkates=!!d.rollerSkates;
 if(myAv._h)myAv._h.setSkates(me.rollerSkates);
 window.IN_ROLLER=ROLLER.inside(d.pos[0],d.pos[2]);window.OUTSIDE=isOut(d.pos[2]);
 camYaw=window.IN_ROLLER?Math.PI:0;myYaw=window.IN_ROLLER?0:Math.PI;camPitch=.4;applyVolume();updateWhere();saveState();
}
function rollerTravel(direction){
 if(rollerTravelPending)return;rollerTravelPending=true;
 // Flush the latest position before the server checks entrance proximity.
 const p=rig.object3D.position;socket.emit('move',{pos:[p.x,p.y,p.z],rot:myYaw});
 socket.timeout(5000).emit('rollerTravel',direction,(err,r)=>{
  rollerTravelPending=false;if(err||!r||!r.ok){sys((r&&r.err)||'연결을 확인하고 다시 시도해 주세요');return;}
  applyRollerPosition(r);
  if(direction==='enter')openRollerSelection();
 });
}
function openRollerSelection(){
 if(rollerSelectOpen||!joined)return;
 const position=rig.object3D.position;socket.emit('move',{pos:[position.x,position.y,position.z],rot:myYaw});
 resetRollerMovement();window.RUN_HOLD=false;rollerDraft=ROLLER.colours(me);rollerSelectOpen=true;
 $('hud').classList.add('hidden');$('rollerSelect').classList.remove('hidden');$('rollerSelect').scrollTop=0;
 renderRollerColours();updateRollerPreview();
}
function closeRollerSelection(){
 rollerSelectOpen=false;rollerDraft=null;$('rollerSelect').classList.add('hidden');$('hud').classList.remove('hidden');
 if(rollerPreview)cancelAnimationFrame(rollerPreview.frame);
}
function renderRollerColours(){
 for(const [key,id] of [['skateBoot','rollerBootColours'],['skateWheel','rollerWheelColours'],['skateLace','rollerLaceColours']]){
  $(id).innerHTML='';
  for(const [colour,name] of ROLLER.PALETTE){
   const b=document.createElement('button');b.type='button';b.style.background=colour;b.title=name;
   b.setAttribute('aria-label',name);b.setAttribute('aria-pressed',String(rollerDraft[key]===colour));
   b.onclick=()=>{rollerDraft[key]=colour;renderRollerColours();updateRollerPreview();};$(id).appendChild(b);
  }
 }
}
function updateRollerPreview(){
 if(!rollerPreview){
  const canvas=$('rollerPreview'),renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(2,devicePixelRatio));
  const scene=new THREE.Scene();scene.add(new THREE.AmbientLight('#fff',1.6));
  const light=new THREE.DirectionalLight('#d7ffff',2);light.position.set(1,2,3);scene.add(light);
  const camera=new THREE.PerspectiveCamera(35,1,.01,10);camera.position.set(.35,.32,.9);camera.lookAt(0,-.01,0);
  rollerPreview={renderer,scene,camera,group:null,frame:0};
 }
 const p=rollerPreview;
 if(p.group){
  p.scene.remove(p.group);const materials=new Set();
  p.group.traverse(o=>{if(o.isMesh){o.geometry.dispose();materials.add(o.material);}});materials.forEach(m=>m.dispose());
 }
 p.group=new THREE.Group();
 for(const side of [-1,1]){const skate=makeRollerSkate(rollerDraft);skate.position.x=side*.12;skate.rotation.y=side*.13;p.group.add(skate);}
 p.scene.add(p.group);cancelAnimationFrame(p.frame);
 const draw=t=>{
  if(!rollerSelectOpen)return;
  const canvas=$('rollerPreview'),w=canvas.clientWidth,h=canvas.clientHeight;
  p.renderer.setSize(w,h,false);p.camera.aspect=w/h;p.camera.updateProjectionMatrix();
  p.group.rotation.y=Math.sin(t/1800)*.25;p.renderer.render(p.scene,p.camera);p.frame=requestAnimationFrame(draw);
 };
 p.frame=requestAnimationFrame(draw);
}
function finishRollerSelection(){
 const b=$('rollerConfirm');b.disabled=true;
 socket.timeout(5000).emit('rollerEquip',{on:true,...rollerDraft},(err,r)=>{
  b.disabled=false;if(err||!r||!r.ok){sys((r&&r.err)||'스케이트 착용에 실패했어요');return;}
  me.rollerSkates=true;Object.assign(me,ROLLER.colours(r));localStorage.setItem('profile',JSON.stringify(me));
  closeRollerSelection();buildAvatar(myAv,{...me,id:myId},true);saveState();applyMusic(true);refreshAct(true);
  sys(IS_MOBILE?'🛼 입장 완료! 달리기·점프 버튼을 이용하세요':'🛼 입장 완료! Shift로 달리기 · Space로 점프');
 });
}
$('rollerConfirm').onclick=finishRollerSelection;
$('rollerCancel').onclick=()=>{const leave=!me.rollerSkates;closeRollerSelection();if(leave)rollerTravel('exit');};
function syncAdminAccess(){
 const token=adminToken;adminAccessPending=!!token;
 socket.timeout(5000).emit('adminAccess',token,(err,r)=>{
  if(token!==adminToken)return;
  adminAccess=!!(!err&&r&&r.ok);adminAccessPending=false;
  if(!adminAccess&&adminToken){adminToken=null;sessionStorage.removeItem('adminToken');renderMusic();}
  setClubDoor(window.CLUB_OPEN,false);
  window.setRollerDoorVis&&window.setRollerDoorVis(window.ROLLER_OPEN||adminAccess,!window.ROLLER_OPEN);refreshAct(true);
 });
}
socket.on('connect',syncAdminAccess);
socket.on('disconnect',()=>{adminAccess=false;adminAccessPending=!!adminToken;});
socket.on('accessPosition',d=>{mySeat=null;socket.emit('seat',null);applyRollerPosition(d);});
socket.on('rollerPosition',d=>applyRollerPosition(d));
socket.on('rollerDoor',d=>{
 window.ROLLER_OPEN=!!d.open;window.setRollerDoorVis&&window.setRollerDoorVis(d.open||adminAccess,!d.open);
 $('rollerDoorBtn').textContent='🛼 롤라장 문: '+(d.open?'열림':'닫힘');refreshAct(true);
});
$('rollerDoorBtn').onclick=()=>{
 if(!adminToken)return;socket.emit('setRollerDoor',{token:adminToken,open:!window.ROLLER_OPEN},r=>{
  if(!r||!r.ok)sys((r&&r.err)||'문 설정에 실패했어요');
 });
};
socket.on('rollerMotion',d=>{const o=others[d.id];if(o&&o.data)o.data.rollerMotion=d.motion;});
function rollerSnack(kind){socket.emit('rollerSnack',kind,r=>{if(!r||!r.ok)sys((r&&r.err)||'다시 시도해 주세요');});}
socket.on('rollerSnack',d=>{
 const el=d.id===myId?myAv:others[d.id]&&others[d.id].el;
 if(el&&el._h)el._h.drink(d.kind);
 if(d.kind==='ramen')setTimeout(()=>d.id===myId?chew():sfxNear('yum',d.id),600);
 if(d.id===myId)sys(d.kind==='ramen'?'🍜 따끈한 컵라면!':'🥤 시원한 사이다!');
});
