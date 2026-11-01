// ===== ERRDAY 나이트클럽: 공간 구성 (CC0 3D 모델 + 기본 도형 + 캔버스 텍스처) =====
const IS_MOBILE=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)||(window.matchMedia&&matchMedia('(pointer:coarse)').matches);
window.MUSIC_PLAYING=false;
// ---------- 공통 컴포넌트 ----------
AFRAME.registerComponent('spin',{schema:{speed:{default:20}},tick(t,dt){this.el.object3D.rotation.y+=this.data.speed*dt/57300;}});
AFRAME.registerComponent('sweep',{schema:{phase:{default:0}},tick(t){const o=this.el.object3D;o.rotation.z=Math.sin(t/900+this.data.phase)*0.6;o.rotation.x=Math.cos(t/1300+this.data.phase)*0.4;}});
AFRAME.registerComponent('blink',{schema:{i:{default:0}},tick(t){const m=this.el.getObject3D('mesh');if(!m)return;const sp=window.MUSIC_PLAYING?350:900;m.material.emissiveIntensity=((Math.floor(t/sp)+this.data.i)%3)===0?1:0.15;}});
AFRAME.registerComponent('if-music',{schema:{mode:{default:'spin'},speed:{default:200},i:{default:0}},
 tick(t,dt){const on=window.MUSIC_PLAYING,o=this.el.object3D,d=this.data;
  if(d.mode==='spin'&&on)o.rotation.y+=d.speed*dt/57300;
  if(d.mode==='led'){const m=this.el.getObject3D('mesh');if(m)m.material.emissiveIntensity=on?(((Math.floor(t/180)+d.i)%4)<2?1.2:.1):.15;}
  if(d.mode==='bulb'){const m=this.el.getObject3D('mesh');if(m)m.material.emissiveIntensity=((Math.floor(t/(on?250:700))+d.i)%3)===0?.2:1;}}});
// 한글/영문 캔버스 텍스트
AFRAME.registerComponent('ktext',{schema:{value:{default:''},color:{default:'#fff'},glow:{default:'#ff3cac'},bg:{default:''},size:{default:48},width:{default:2},font:{default:'"Malgun Gothic",sans-serif'},top:{default:false}},
 update(){const d=this.data,c=document.createElement('canvas'),x=c.getContext('2d'),F=`bold ${d.size}px ${d.font}`;x.font=F;
  const w=Math.max(64,x.measureText(d.value).width+d.size),h=d.size*1.7;c.width=w;c.height=h;x.font=F;
  if(d.bg){x.fillStyle=d.bg;x.beginPath();x.roundRect(0,0,w,h,h/3);x.fill();}
  x.textAlign='center';x.textBaseline='middle';x.shadowColor=d.glow||'transparent';x.shadowBlur=d.glow?d.size/3:0;x.fillStyle=d.color;x.fillText(d.value,w/2,h/2);if(d.glow)x.fillText(d.value,w/2,h/2);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const old=this.el.getObject3D('mesh');if(old){old.material.map.dispose();old.geometry.dispose();}
  this.el.setObject3D('mesh',new THREE.Mesh(new THREE.PlaneGeometry(d.width,d.width*h/w),new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.DoubleSide,depthWrite:false,depthTest:!d.top})));
  if(d.top)this.el.getObject3D('mesh').renderOrder=999;}});
AFRAME.registerComponent('billboard',{tick(){const cam=this.el.sceneEl.camera;if(!cam)return;const p=new THREE.Vector3();cam.getWorldPosition(p);this.el.object3D.lookAt(p);}});
// ---------- 캔버스 텍스처 ----------
function canvasTex(w,h,draw,rx,ry){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=4;return t;}
const TEX={
 wall:()=>canvasTex(256,512,(x,w,h)=>{x.fillStyle='#3a0d12';x.fillRect(0,0,w,h);
  const g=x.createLinearGradient(0,0,w,0);g.addColorStop(0,'#2a1208');g.addColorStop(.5,'#4a1d0c');g.addColorStop(1,'#2a1208');x.fillStyle=g;x.fillRect(0,h*.62,w,h*.38); // 하단 나무 웨인스코팅
  x.fillStyle='#5c0f1a';x.fillRect(20,30,w-40,h*.55);x.strokeStyle='#d4a017';x.lineWidth=5;x.strokeRect(20,30,w-40,h*.55);x.lineWidth=2;x.strokeRect(32,42,w-64,h*.55-24); // 벨벳 패널 + 금테
  for(let i=0;i<40;i++){x.fillStyle='rgba(0,0,0,.08)';x.fillRect(Math.random()*w,0,2,h*.6);}
  x.fillStyle='#d4a017';x.fillRect(0,h*.62-6,w,6);x.strokeStyle='#1a0904';x.lineWidth=3;x.strokeRect(14,h*.66,w-28,h*.3);},12,1),
 carpet:()=>canvasTex(256,256,(x,w,h)=>{x.fillStyle='#4a0a1e';x.fillRect(0,0,w,h);x.strokeStyle='#b8860b';x.lineWidth=3;
  for(const [cx,cy] of [[0,0],[w,0],[0,h],[w,h],[w/2,h/2]]){x.beginPath();x.moveTo(cx,cy-50);x.lineTo(cx+50,cy);x.lineTo(cx,cy+50);x.lineTo(cx-50,cy);x.closePath();x.stroke();x.fillStyle='#7a1430';x.beginPath();x.arc(cx,cy,14,0,7);x.fill();}
  x.fillStyle='#2a0612';for(let i=0;i<600;i++)x.fillRect(Math.random()*w,Math.random()*h,1,1);},10,10),
 wood:()=>canvasTex(256,64,(x,w,h)=>{x.fillStyle='#3b1a0a';x.fillRect(0,0,w,h);for(let i=0;i<30;i++){x.strokeStyle=`rgba(${90+Math.random()*40},${40+Math.random()*20},10,.5)`;x.beginPath();x.moveTo(0,Math.random()*h);x.bezierCurveTo(w/3,Math.random()*h,w*2/3,Math.random()*h,w,Math.random()*h);x.stroke();}},2,1),
 brick:(w,h)=>canvasTex(256,256,(x,W,H)=>{x.fillStyle='#4a2a22';x.fillRect(0,0,W,H);for(let r=0;r<16;r++)for(let c=-1;c<5;c++){x.fillStyle=`rgb(${100+Math.random()*40},${45+Math.random()*20},${35+Math.random()*15})`;x.fillRect(c*64+(r%2)*32+2,r*16+2,60,12);}},w/2,h/2),
 asphalt:()=>canvasTex(256,256,(x,W,H)=>{x.fillStyle='#24252a';x.fillRect(0,0,W,H);for(let i=0;i<3000;i++){const v=20+Math.random()*40;x.fillStyle=`rgb(${v},${v},${v+4})`;x.fillRect(Math.random()*W,Math.random()*H,2,2);}x.strokeStyle='rgba(0,0,0,.5)';x.beginPath();x.moveTo(0,90);x.bezierCurveTo(80,120,160,60,256,110);x.stroke();},6,4),
 tarp:()=>canvasTex(256,256,(x,W,H)=>{const g=x.createLinearGradient(0,0,W,0);g.addColorStop(0,'#d2561c');g.addColorStop(.5,'#e06a22');g.addColorStop(1,'#c44a18');x.fillStyle=g;x.fillRect(0,0,W,H);for(let i=0;i<60;i++){x.fillStyle=`rgba(60,20,0,${Math.random()*.15})`;x.beginPath();x.arc(Math.random()*W,Math.random()*H,5+Math.random()*25,0,7);x.fill();}x.fillStyle='rgba(150,20,10,.5)';for(let i=0;i<W;i+=64)x.fillRect(i,0,8,H);},3,2),
 facade:(w,h,col)=>canvasTex(256,256,(x,W,H)=>{x.fillStyle=col;x.fillRect(0,0,W,H);for(let r=0;r<4;r++)for(let c=0;c<3;c++){const lit=Math.random()<.45;x.fillStyle=lit?['#ffd27a','#ffe9b0','#9ad0ff'][Math.floor(Math.random()*3)]:'#15161c';x.fillRect(20+c*80,20+r*60,50,36);x.strokeStyle='#222';x.strokeRect(20+c*80,20+r*60,50,36);}},Math.max(1,Math.round(w/4)),Math.max(1,Math.round(h/4))),
 ceiling:()=>canvasTex(128,128,(x,w,h)=>{x.fillStyle='#0d0308';x.fillRect(0,0,w,h);x.strokeStyle='#3a1a08';x.lineWidth=3;x.strokeRect(0,0,w,h);},8,8)};
// ---------- 모델 로더 (한 번 받고 복제) ----------
const MODEL_CACHE={};let LOADING_TOTAL=0,LOADING_DONE=0;
function progress(){const el=document.getElementById('loadTxt');if(el)el.textContent=`3D 모델 불러오는 중… ${LOADING_DONE}/${LOADING_TOTAL}`;
 if(LOADING_DONE>=LOADING_TOTAL){const l=document.getElementById('loading');if(l)l.classList.add('hidden');const b=document.getElementById('enter');if(b){b.disabled=false;}document.dispatchEvent(new Event('models-ready'));}}
function loadModel(url){if(!MODEL_CACHE[url]){LOADING_TOTAL++;progress();MODEL_CACHE[url]=new THREE.GLTFLoader().loadAsync(url).then(g=>{LOADING_DONE++;progress();return g;}).catch(e=>{console.error('모델 실패',url,e);LOADING_DONE++;progress();return null;});}return MODEL_CACHE[url];}
// 정적 소품: 바닥 중심 정렬 + 크기 + 색 입히기
function prop(name,{pos=[0,0,0],yaw=0,scale=2.2,tint=null,parent=null,emissive=null,force=false}={}){
 const holder=document.createElement('a-entity');holder.object3D.position.set(...pos);holder.object3D.rotation.y=yaw;(parent||document.getElementById('world')).appendChild(holder);
 loadModel(`/models/kenney/${name}.glb`).then(g=>{if(!g)return;const o=g.scene.clone(true);o.scale.setScalar(scale);
  const bx=new THREE.Box3().setFromObject(o),c=bx.getCenter(new THREE.Vector3());o.position.set(-c.x,-bx.min.y,-c.z);
  if(tint||emissive)o.traverse(n=>{if(n.isMesh){n.material=n.material.clone();if(tint&&(force||!/metal|leg|wood/i.test(n.material.name)))n.material.color.set(tint);if(emissive){n.material.emissive=new THREE.Color(emissive);n.material.emissiveIntensity=.8;}}});
  holder.object3D.add(o);});return holder;}
function E(tag,attrs,parent){const e=document.createElement(tag);for(const k in attrs)e.setAttribute(k,attrs[k]);(parent||document.getElementById('world')).appendChild(e);return e;}
function texMesh(el,tex,extra={}){el.addEventListener('loaded',()=>{const m=el.getObject3D('mesh');if(m){m.material.map=tex;Object.assign(m.material,extra);m.material.needsUpdate=true;}});if(el.hasLoaded)el.emit('loaded');}
window.SEATS=[];window.OBSTACLES=[]; // {x,z,r} 원형 / {x0,x1,z0,z1} 사각
// ---------- 공간 ----------
(function build(){
 E('a-entity',{light:'type:ambient;color:#6a3a50;intensity:0.9'});
 E('a-entity',{light:'type:hemisphere;color:#ff9ad5;groundColor:#2a0010;intensity:0.5'});
 texMesh(E('a-plane',{rotation:'-90 0 0',width:24,height:24,material:'roughness:1'}),TEX.carpet());
 [['0 4 -12','0 0 0',24],['-12 4 0','0 90 0',24],['12 4 0','0 -90 0',24]].forEach(([p,r,w])=>texMesh(E('a-plane',{position:p,rotation:r,width:w,height:8,material:'roughness:.9'}),TEX.wall()));
 texMesh(E('a-plane',{rotation:'90 0 0',position:'0 8 0',width:24,height:24}),TEX.ceiling());
 // 몰딩(금색 띠) + 천장 컬러 조명
 [['0 7.85 -11.95',24,0],['0 7.85 11.95',24,0],['-11.95 7.85 0',24,90],['11.95 7.85 0',24,90]].forEach(([p,w,r])=>E('a-box',{position:p,rotation:`0 ${r} 0`,width:w,height:.25,depth:.1,material:'color:#d4a017;metalness:.8;roughness:.3'}));
 const cc=['#ff2d75','#00d5ff','#ffd400','#a64dff','#3cff8f'];let ci=0;
 for(let x=-10;x<=10;x+=2.5)for(let z=-9;z<=10;z+=2.5)E('a-sphere',{position:`${x} 7.85 ${z}`,radius:.1,'segments-width':6,'segments-height':4,material:`shader:standard;color:${cc[ci%5]};emissive:${cc[ci%5]};emissiveIntensity:1`,blink:'i:'+(ci++%3)});
 for(let x=-8;x<=8;x+=8)E('a-entity',{position:`${x} 7.5 4`,light:`type:point;color:${cc[(x/8+1)|0]};intensity:${IS_MOBILE?0.8:1.2};distance:12`});
 // 벽 브래킷 조명
 for(let z=-8;z<=10;z+=6)[-11.9,11.9].forEach(x=>{E('a-sphere',{position:`${x} 3.3 ${z}`,radius:.15,material:'color:#ffdd99;emissive:#ffaa44;emissiveIntensity:1'});E('a-box',{position:`${x} 3.1 ${z}`,width:.1,height:.15,depth:.3,color:'#d4a017'});});
 // 미러볼
 const ball=E('a-entity',{position:'0 6.4 -3',spin:'speed:40'});
 E('a-sphere',{radius:.7,'segments-width':16,'segments-height':12,material:'flatShading:true;metalness:1;roughness:0.15;color:#ddd;emissive:#555'},ball);
 for(let i=0;i<50;i++){const th=Math.random()*6.28,ph=Math.random()*3.14;
  E('a-plane',{width:.12,height:.12,material:'shader:flat;side:double;color:#fff',position:`${.72*Math.sin(ph)*Math.cos(th)} ${.72*Math.cos(ph)} ${.72*Math.sin(ph)*Math.sin(th)}`},ball);}
 E('a-cylinder',{position:'0 7.4 -3',radius:.02,height:1.2,color:'#888'});
 // 스윕 스포트라이트
 ['#ff0055','#00e5ff','#ffd400','#7cff00'].forEach((c,i)=>{const x=-6+i*4;
  const g=E('a-entity',{position:`${x} 7.8 -4`,sweep:'phase:'+i*1.6});
  E('a-entity',{light:`type:spot;color:${c};intensity:2.5;angle:25;penumbra:.5;distance:20`,rotation:'-90 0 0'},g);
  E('a-cone',{position:'0 -3.5 0','radius-bottom':1.4,'radius-top':.05,height:7,material:`color:${c};opacity:.1;transparent:true;shader:flat;side:double;depthWrite:false`},g);});
 // 댄스 플로어
 const cols=['#ff0066','#00ccff','#ffcc00','#9900ff'];
 E('a-box',{position:'0 .01 -3.5',width:6.4,depth:6.4,height:.02,material:'color:#d4a017;metalness:.8'});
 for(let x=0;x<6;x++)for(let z=0;z<6;z++)E('a-box',{position:`${-3+x+.5} .03 ${-6.5+z+.5}`,width:.96,depth:.96,height:.04,material:`color:#111;emissive:${cols[(x+z)%4]};emissiveIntensity:.3`,blink:'i:'+((x*7+z*3)%5)});
 buildBar();buildStage();buildTables();
 // 화분
 [[-11,-11],[11,-11],[-11,11],[11,11],[-6,-7],[6,-7]].forEach(([x,z])=>{prop('pottedPlant',{pos:[x,0,z],scale:2.6});OBSTACLES.push({x,z,r:.5});});
})();
function buildBar(){
 const X=10,Z=3;
 const counter=E('a-box',{position:`${X} .6 ${Z-.7}`,width:1,height:1.2,depth:7.6,material:'roughness:.6'});texMesh(counter,TEX.wood());
 E('a-box',{position:`${X} 1.22 ${Z-.75}`,width:1.25,height:.06,depth:7.7,material:'color:#c9a24a;metalness:.8;roughness:.25'});
 E('a-box',{position:`${X-.51} .15 ${Z-.7}`,width:.02,height:.05,depth:7.6,material:'color:#ff3cac;emissive:#ff3cac;emissiveIntensity:1'});
 E('a-box',{position:`${X-.51} 1.1 ${Z-.7}`,width:.02,height:.04,depth:7.6,material:'color:#00e5ff;emissive:#00e5ff;emissiveIntensity:1'});
 // 뒷선반 + 술병
 window.SHELF_EL=[];
 const back=E('a-box',{position:'11.7 2.2 '+Z,width:.5,height:3.2,depth:9,material:'roughness:.6'});texMesh(back,TEX.wood());SHELF_EL.push(back);
 SHELF_EL.push(E('a-box',{position:'11.6 2.2 '+Z,width:.05,height:3,depth:8.8,material:'color:#331100;emissive:#ff9933;emissiveIntensity:.25;metalness:1;roughness:.1'})); // 거울 느낌
 const bt=['wine-red','wine-white','soda-bottle','wine-red','cocktail','glass-wine'];
 for(let s=0;s<3;s++){SHELF_EL.push(E('a-box',{position:`11.35 ${1.2+s*.85} ${Z}`,width:.4,height:.04,depth:8.6,material:'color:#c9a24a;metalness:.8'}));
  for(let k=0;k<12;k++)SHELF_EL.push(prop(bt[(k+s)%bt.length],{pos:[11.35,1.22+s*.85,Z-4+k*.72],scale:.5}));}
 for(let k=0;k<5;k++){const sx=X-1.1,sz=Z-3.5+k*1.4,el=prop('stoolBar',{pos:[sx,0,sz],scale:2.2,tint:'#8b0018'});el.dataset.seat='BAR-'+k;el.classList.add('seat');E('a-cylinder',{position:`9.68 1.258 ${sz}`,radius:.13,height:.012,'segments-radial':20,material:'color:#2a1608;roughness:.9'});E('a-ring',{position:`9.68 1.265 ${sz}`,rotation:'-90 0 0','radius-inner':.1,'radius-outer':.115,material:'color:#c9a24a;metalness:.7;shader:flat'});
  SEATS.push({id:'BAR-'+k,table:'BAR',x:sx,z:sz,y:.52,yaw:Math.PI/2,el,stand:[sx-.8,sz]});} // 바 스툴도 좌석 (바 쪽을 봄)
 E('a-entity',{position:'11.4 4.3 '+Z,rotation:'0 -90 0',ktext:'value:BAR;color:#fff;glow:#00e5ff;size:90;width:2;font:Georgia,serif'});
 window.BAR_ZONE={x0:10.55,x1:11.4,z0:-1.6,z1:6.75};
 // 바텐더 단상 (0.6m) + 양쪽 끝 계단
 const PH=.6,PZ0=-.9,PZ1=5.4,SL=1.0,NS=4;window.BAR_PLAT={x0:10.55,x1:11.5,z0:PZ0,z1:PZ1,s:SL,h:PH};
 E('a-box',{position:`11.025 ${PH/2} ${(PZ0+PZ1)/2}`,width:.95,height:PH,depth:PZ1-PZ0,material:'color:#2a1a10;roughness:.8'});
 E('a-box',{position:`10.56 ${PH-.01} ${(PZ0+PZ1)/2}`,width:.02,height:.02,depth:PZ1-PZ0,material:'color:#ffd84a;emissive:#ffd84a;emissiveIntensity:.8'});
 for(const dir of [-1,1])for(let i=0;i<NS;i++){const h=PH*(NS-i)/(NS+1)+0.0,d=SL/NS,zc=(dir<0?PZ0:PZ1)+dir*(i+.5)*d;
  E('a-box',{position:`11.025 ${h/2} ${zc}`,width:.95,height:h,depth:d,material:'color:'+(i%2?'#3a2416':'#4a2e1a')+';roughness:.85'});
  E('a-box',{position:`11.025 ${h} ${zc-dir*d/2+dir*.02}`,width:.95,height:.015,depth:.03,material:'color:#ffd84a;emissive:#ffd84a;emissiveIntensity:.6'});}
 OBSTACLES.push({x0:X-.7,x1:X+.55,z0:Z-4.7,z1:Z+3.1},{x0:11.5,x1:12,z0:Z-4.7,z1:Z+4.7});
}
function buildStage(){
 const Z=-9.6,H=.7;
 const st=E('a-box',{position:`0 ${H/2} ${Z}`,width:11,height:H,depth:4});texMesh(st,TEX.wood());
 E('a-box',{position:`0 ${H+.01} ${Z}`,width:11,height:.02,depth:4,material:'color:#3a1206;metalness:.4;roughness:.35'});
 [[0,Z+2,11,0],[-5.5,Z,4,90],[5.5,Z,4,90]].forEach(([x,z,w,r])=>E('a-box',{position:`${x} ${H-.05} ${z}`,rotation:`0 ${r} 0`,width:w,height:.06,depth:.06,material:'color:#ffcc33;emissive:#ffaa00;emissiveIntensity:1'}));
 E('a-box',{position:`0 .35 ${Z+2.05}`,width:11,height:.04,depth:.04,material:'color:#ff3cac;emissive:#ff3cac;emissiveIntensity:1'});
 for(let i=0;i<3;i++)E('a-box',{position:`0 ${.12+i*.2} ${Z+2.75-i*.25}`,width:2.5,height:.24+i*.2,depth:.25,color:'#2a0d05'});
 // 배경판 + 마키 전구 + 유일한 무대 글자
 E('a-box',{position:'0 2.8 -11.6',width:7,height:4,depth:.1,color:'#14020f'});
 E('a-entity',{position:'0 3.1 -11.5',ktext:'value:ERRDAY NIGHTCLUB;color:#fff3c4;glow:#ff3cac;size:110;width:6.2;font:Georgia,serif'});
 let i=0;for(let x=-3.4;x<=3.41;x+=.4){[1,4.75].forEach(y=>E('a-sphere',{position:`${x} ${y} -11.5`,radius:.07,'segments-width':6,'segments-height':4,material:'color:#ffe;emissive:#ffcc55;emissiveIntensity:1','if-music':'mode:bulb;i:'+(i++%3)}));}
 for(let y=1.3;y<4.6;y+=.4)[-3.4,3.4].forEach(x=>E('a-sphere',{position:`${x} ${y} -11.5`,radius:.07,'segments-width':6,'segments-height':4,material:'color:#ffe;emissive:#ffcc55;emissiveIntensity:1','if-music':'mode:bulb;i:'+(i++%3)}));
 // 벨벳 커튼
 [-1,1].forEach(s=>{for(let k=0;k<7;k++)E('a-cylinder',{position:`${s*(3.8+k*.25)} 2.95 -11.3`,radius:.16,height:4.5,'segments-radial':8,material:'color:#8b0010;roughness:.9'});
  E('a-sphere',{position:`${s*4.4} 1.6 -11.0`,radius:.12,color:'#d4a017'});});
 E('a-box',{position:'0 5.15 -11.2',width:11,height:.6,depth:.3,material:'color:#a00018;roughness:.9'});
 for(let k=0;k<11;k++)E('a-sphere',{position:`${-5+k} 4.85 -11.05`,radius:.12,color:'#d4a017'});
 // 마이크
 const mic=E('a-entity',{position:`-2 ${H} ${Z+1}`});
 E('a-cylinder',{position:'0 .02 0',radius:.2,height:.04,color:'#222'},mic);E('a-cylinder',{position:'0 .75 0',radius:.02,height:1.5,color:'#ccc',metalness:1},mic);
 E('a-cylinder',{position:'0 1.55 .05',radius:.035,height:.15,rotation:'60 0 0',color:'#ccc',metalness:1},mic);E('a-sphere',{position:'0 1.62 .1',radius:.06,color:'#555'},mic);
 // 무대 스포트
 [[-4,'#ff66cc'],[0,'#ffffff'],[4,'#66ccff']].forEach(([x,c])=>{const sp=E('a-entity',{position:`${x} 7 ${Z+5}`,light:`type:spot;color:${c};intensity:3;angle:22;penumbra:.4;distance:15`});
  const tgt=E('a-entity',{position:`${x*.3} 0 ${Z}`});sp.addEventListener('loaded',()=>{const L=sp.getObject3D('light');if(L)L.target=tgt.object3D;});
  E('a-cylinder',{position:`${x} 7 ${Z+5}`,radius:.2,height:.4,rotation:'40 0 0',color:'#111'});});
 // DJ 부스
 const B=E('a-entity',{position:`3 ${H} ${Z+.6}`});
 E('a-box',{position:'0 .5 0',width:2.6,height:1,depth:.8,material:'color:#111;metalness:.5'},B);
 E('a-box',{position:'0 .5 .41',width:2.6,height:.08,depth:.02,material:'color:#00e5ff;emissive:#00e5ff;emissiveIntensity:1'},B);
 E('a-box',{position:'0 .2 .41',width:2.6,height:.05,depth:.02,material:'color:#ff3cac;emissive:#ff3cac;emissiveIntensity:1'},B);
 E('a-box',{position:'0 1.03 0',width:2.6,height:.06,depth:.8,color:'#2a2a2a'},B);
 [-.8,.8].forEach(x=>{E('a-box',{position:`${x} 1.09 0`,width:.75,height:.06,depth:.6,color:'#333'},B);
  const plat=E('a-entity',{position:`${x} 1.13 0`,'if-music':'mode:spin;speed:200'},B);
  E('a-cylinder',{radius:.26,height:.02,color:'#0a0a0a'},plat);E('a-cylinder',{position:'0 .012 0',radius:.08,height:.005,color:'#d00'},plat);
  E('a-box',{position:'.12 .015 0',width:.05,height:.006,depth:.02,color:'#fff'},plat);
  E('a-box',{position:`${x+.3} 1.15 -.2`,width:.03,height:.03,depth:.35,rotation:'0 20 0',color:'#ccc'},B);});
 E('a-box',{position:'0 1.1 0',width:.6,height:.08,depth:.55,color:'#222'},B);
 for(let k=0;k<6;k++)E('a-cylinder',{position:`${-.2+(k%3)*.2} 1.16 ${-.1+Math.floor(k/3)*.2}`,radius:.03,height:.04,material:'color:#999;emissive:#ffaa00;emissiveIntensity:.2'},B);
 for(let k=0;k<8;k++)E('a-box',{position:`${-.25+k*.07} 1.15 .22`,width:.04,height:.02,depth:.03,material:`color:#0f0;emissive:${k<5?'#00ff44':k<7?'#ffdd00':'#ff0000'};emissiveIntensity:.2`,'if-music':'mode:led;i:'+k},B);
 // 스피커 (Kenney)
 [1.1,4.9].forEach(x=>prop('speaker',{pos:[x,H,Z+.3],scale:3,tint:'#1a1a1a',force:true}));[-5,5].forEach(x=>prop('speaker',{pos:[x,0,-6.8],scale:3.4,tint:'#1a1a1a',force:true}));
 // 무대는 올라갈 수 있음: 계단(가운데 앞)으로만 오르내림. DJ 부스·스피커·마이크는 장애물
 OBSTACLES.push({x0:1.55,x1:4.45,z0:-10.6,z1:-8.55},{x:1.1,z:-9.3,r:.35},{x:4.9,z:-9.3,r:.35},{x:-2,z:-8.6,r:.2},{x0:-6,x1:6,z0:-12,z1:-11.15});
 window.STAGE={x0:-5.5,x1:5.5,z0:-11.6,z1:Z+2,h:H,sx0:-1.25,sx1:1.25,sz0:Z+2,sz1:Z+2.9};
 window.heightAt=(x,z)=>{const s=STAGE;if(x>=s.x0&&x<=s.x1&&z>=s.z0&&z<=s.z1)return s.h;if(x>=s.sx0&&x<=s.sx1&&z>s.sz0&&z<=s.sz1)return s.h*(1-(z-s.sz0)/(s.sz1-s.sz0));return 0;};
 window.DJ_SPOT={x:3,y:H,z:Z-.15};
}
function buildTables(){
 const tables=[[-7,-4],[-7,2],[-7,7.5],[4.5,6],[0,8.5],[-2.5,3.5]];
 tables.forEach(([tx,tz],ti)=>{const id='T'+(ti+1);
  prop('rugRound',{pos:[tx,.005,tz],scale:3.6,tint:'#5a0a22'});
  prop('tableRound',{pos:[tx,0,tz],scale:2.2,tint:'#2a1206'});
  prop('lampRoundTable',{pos:[tx,.81,tz],scale:1.3,emissive:'#ffb347'});
  E('a-entity',{position:`${tx} 1.25 ${tz}`,light:`type:point;color:#ffb347;intensity:${IS_MOBILE?0:.5};distance:3`});
  window.POCHA_TABLES=window.POCHA_TABLES||{};POCHA_TABLES[id]=[tx,tz,.81,2.3];
  E('a-entity',{position:`${tx} 1.7 ${tz}`,ktext:`value:${ti+1}번 테이블;color:#ffd84a;size:40;width:.9`,billboard:''});
  OBSTACLES.push({x:tx,z:tz,r:.85});
  for(let s=0;s<4;s++){const a=s*Math.PI/2+Math.PI/4,sx=tx+Math.cos(a)*1.45,sz=tz+Math.sin(a)*1.45;
   const yaw=Math.atan2(tx-sx,tz-sz); // 테이블 쪽을 바라봄 (모델 정면 +z)
   const sofa=s%2===0,seatId=id+'-'+s;
   const el=sofa?prop('loungeSofa',{pos:[sx,0,sz],yaw,scale:2.1,tint:'#7a0019'}):prop('chairRounded',{pos:[sx,0,sz],yaw,scale:2.3,tint:'#7a0019'});
   el.dataset.seat=seatId;el.classList.add('seat');
   SEATS.push({id:seatId,table:id,x:sx,z:sz,yaw,el});}
 });
}
// ---------- 귀여운 2등신 캐릭터 (코드로 직접 만든 오리지널 디자인) ----------
const RED_FACE=new THREE.Color('#ff2a2a');
// opts: {gender:'m'|'f', style:'suit'|'disco'|'hanbok', outfit:'#색', skin:'#피부색', dj:bool}
const TOON_GRAD=(()=>{const c=document.createElement('canvas');c.width=4;c.height=1;const x=c.getContext('2d');['#777','#aaa','#ddd','#fff'].forEach((v,i)=>{x.fillStyle=v;x.fillRect(i,0,1,1);});
 const t=new THREE.CanvasTexture(c);t.minFilter=t.magFilter=THREE.NearestFilter;return t;})();
const SPARKLE=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='#bbb';x.fillRect(0,0,64,64);
 for(let i=0;i<90;i++){x.fillStyle=['#fff','#ddd','#888','#fff7c0'][i%4];x.beginPath();x.arc(Math.random()*64,Math.random()*64,1+Math.random()*2,0,7);x.fill();}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);return t;})();
function shade(hex,k){const c=new THREE.Color(hex);if(k<1)c.multiplyScalar(k);else c.lerp(new THREE.Color('#fff'),k-1);return '#'+c.getHexString();}
// --- 캔버스 무늬 텍스처 ---
function patTex(draw,rx=1,ry=1,size=128){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);return t;}
const PINSTRIPE=patTex((x,s)=>{x.fillStyle='#fff';x.fillRect(0,0,s,s);x.fillStyle='rgba(230,235,255,1)';for(let i=0;i<s;i+=16)x.fillRect(i,0,2,s);x.globalCompositeOperation='multiply';},3,1);
const PIN_BASE=patTex((x,s)=>{x.fillStyle='#888';x.fillRect(0,0,s,s);x.fillStyle='#f4f6ff';for(let i=4;i<s;i+=16)x.fillRect(i,0,2,s);},3,1);
const IRIDESCENT=patTex((x,s)=>{const cs=['#2ad1c9','#7b5cff','#3aa0ff','#c06cff','#5ff2d0','#ffffff'];x.fillStyle='#5a7fd0';x.fillRect(0,0,s,s);for(let i=0;i<900;i++){x.fillStyle=cs[i%cs.length];x.beginPath();x.arc(Math.random()*s,Math.random()*s,1.5+Math.random()*2.5,0,7);x.fill();}},2,2);
const SEQUIN_BLUE=patTex((x,s)=>{const cs=['#9fc4ff','#ffffff','#6f8fd8','#c9dcff','#4a66b8'];x.fillStyle='#7d9be0';x.fillRect(0,0,s,s);for(let i=0;i<900;i++){x.fillStyle=cs[i%cs.length];x.beginPath();x.arc(Math.random()*s,Math.random()*s,1.5+Math.random()*2,0,7);x.fill();}},2,2);
const SAEKDONG=patTex((x,s)=>{const cs=['#e8443a','#f7a531','#f5e04a','#5cc45a','#3b8fe0','#8a4fd0','#f07ab8','#ffffff'];const h=s/cs.length;cs.forEach((c,i)=>{x.fillStyle=c;x.fillRect(0,i*h,s,h);});},1,1);
const SKIN_DEF='#f2c29a';
// 의상별 기본 색 (레퍼런스 그림 기준)
window.OUTFIT_DEFAULTS={m:{suit:'#2b3352',disco:'#2fb8b0',hanbok:'#2f8f45'},f:{suit:'#9a9cc0',disco:'#2a3f9e',hanbok:'#e2525c'}};
function chibiMats(o){const T=(c,ex={})=>new THREE.MeshToonMaterial({color:c,gradientMap:TOON_GRAD,...ex});
 const shinyOf=(map,col)=>new THREE.MeshStandardMaterial({color:col||'#fff',map,metalness:.25,roughness:.35,emissive:new THREE.Color(col||'#fff').multiplyScalar(.35),emissiveMap:map});
 return {T,shinyOf,skin:T(o.skin||SKIN_DEF),eye:new THREE.MeshBasicMaterial({color:'#3b2516'}),hl:new THREE.MeshBasicMaterial({color:'#fff'}),
  white:T('#fbfbf7'),black:T('#1d1a1a'),brown:T('#5a3a22'),dbrown:T('#3a2416'),nose:T('#f08a5a'),
  blush:new THREE.MeshBasicMaterial({color:'#ff9b8a',transparent:true,opacity:.35,depthWrite:false}),
  silver:new THREE.MeshStandardMaterial({color:'#dfe3ea',metalness:.35,roughness:.3,emissive:'#6a6e78'}),
  hair:T(o.dj?'#2a1a10':'#3b2417')};}
const G={sph:(r,ws=28,hs=20)=>new THREE.SphereGeometry(r,ws,hs),cap:(r,l)=>new THREE.CapsuleGeometry(r,l,8,18),cyl:(a,b,h,s=28)=>new THREE.CylinderGeometry(a,b,h,s,1),box:(x,y,z)=>new THREE.BoxGeometry(x,y,z)};
function mesh(g,m,p=[0,0,0],s=null,r=null){const o=new THREE.Mesh(g,m);o.position.set(...p);if(s)o.scale.set(...s);if(r)o.rotation.set(...r);return o;}
function makeChibi(opts){const M=chibiMats(opts),f=opts.gender==='f',st=['suit','disco','hanbok'].includes(opts.style)?opts.style:'suit';
 const col=opts.outfit||OUTFIT_DEFAULTS[f?'f':'m'][st];
 const root=new THREE.Group(),hips=new THREE.Group();hips.position.y=.42;root.add(hips);
 const torso=new THREE.Group();hips.add(torso);
 // 의상별 재질
 let top,sleeve,pants,shoe,cuff=null;
 if(!f&&st==='suit'){top=M.T(col,{map:PIN_BASE});sleeve=top;pants=top;shoe=M.T('#5b2a1a');}
 if(!f&&st==='disco'){top=M.shinyOf(SPARKLE,'#f4f4f8');sleeve=top;pants=M.shinyOf(IRIDESCENT,col);shoe=M.silver;}
 if(!f&&st==='hanbok'){top=M.T(col);sleeve=top;pants=M.T('#6b4128');shoe=M.black;}
 if(f&&st==='suit'){top=M.T(col);sleeve=top;pants=M.skin;shoe=M.T('#1f2a4d');}
 if(f&&st==='disco'){top=M.T(col);sleeve=top;pants=M.T(col);shoe=M.silver;cuff=M.T('#8a5bd6');}
 if(f&&st==='hanbok'){top=M.T('#b9e08a');sleeve=M.T('#fff',{map:SAEKDONG});pants=M.skin;shoe=M.T('#fff');}
 // 몸통 (짧고 둥근 원통)
 torso.add(mesh(G.cap(.17,.22),top,[0,.27,0],[1.12,1,.8]));
 torso.add(mesh(G.cyl(.07,.08,.08),M.skin,[0,.53,0]));
 // 머리
 const head=new THREE.Group();head.position.y=.54;head.scale.setScalar(1.12);torso.add(head);
 head.add(mesh(G.sph(.31,40,30),M.skin,[0,.26,0],[1.06,.96,.98]));
 [-1,1].forEach(s=>{
  head.add(mesh(G.sph(.04,18,14),M.eye,[s*.115,.28,.285],[1,1.15,.45]));head.add(mesh(G.sph(.012,8,6),M.hl,[s*.115+.012,.297,.302]));
  head.add(mesh(new THREE.TorusGeometry(.05,.008,6,14,Math.PI*.9),M.dbrown,[s*.115,.285,.29],null,[0,0,Math.PI*.05])); // 눈꺼풀 선
  head.add(mesh(G.cap(.011,.06),M.dbrown,[s*.12,.37,.275],null,[0,0,Math.PI/2+s*.12])); // 눈썹
  head.add(mesh(new THREE.CircleGeometry(.05,20),M.blush,[s*.2,.2,.255],null,[0,s*.6,0]));
  head.add(mesh(G.sph(.065),M.skin,[s*.32,.25,0],[.55,1,.9])); // 귀
 });
 head.add(mesh(G.sph(.03,14,10),M.nose,[0,.215,.315],[1,1,1.1]));
 head.add(mesh(new THREE.TorusGeometry(.045,.008,6,14,Math.PI),M.dbrown,[0,.15,.29],null,[0,0,Math.PI]));
 hair(head,M,opts,st);
 // 팔 (짧게, 비스듬히 벌림) + 공 모양 손
 const arms=[-1,1].map(s=>{const a=new THREE.Group();a.position.set(s*.2,.43,0);torso.add(a);
  const wide=st==='hanbok';
  const arm=new THREE.Group();arm.rotation.z=s*.55;a.add(arm);
  arm.add(wide?mesh(G.cyl(.065,.09,.2),sleeve,[0,-.1,0]):mesh(G.cap(.06,.13),sleeve,[0,-.09,0]));
  if(cuff)arm.add(mesh(G.cyl(.065,.065,.035),cuff,[0,-.18,0]));
  if(!f&&st==='suit')arm.add(mesh(G.cyl(.062,.062,.03),M.white,[0,-.18,0]));
  arm.add(mesh(G.sph(.07),M.skin,[0,-.24,0]));return a;});
 // 다리
 const legs=[-1,1].map(s=>{const l=new THREE.Group();l.position.set(s*.085,0,0);hips.add(l);
  if(!f&&st==='disco'||f&&st==='disco'){l.add(mesh(G.cyl(.07,.115,.34),f?M.shinyOf(SEQUIN_BLUE,'#c9d6ff'):pants,[0,-.17,0]));if(f)l.add(mesh(G.cyl(.07,.08,.14),pants,[0,-.06,0]));}
  else if(!f&&st==='hanbok'){l.add(mesh(G.sph(.12),pants,[0,-.15,0],[1,1.45,1]));l.add(mesh(G.cyl(.055,.055,.08),M.white,[0,-.33,0]));}
  else l.add(mesh(G.cap(.065,.18),pants,[0,-.17,0]));
  if(shoe===M.silver){l.add(mesh(G.box(.13,.07,.2),M.silver,[0,-.4,.03]));l.add(mesh(G.sph(.075),M.silver,[0,-.35,.04],[1,.6,1.3]));}
  else l.add(mesh(G.sph(.075),shoe,[0,-.37,.035],[1,.6,1.45]));
  return l;});
 outfit(torso,hips,M,{...opts,style:st,col});
 if(opts.waiter){torso.add(mesh(G.box(.16,.26,.02),M.white,[0,.3,.142]));torso.add(mesh(G.box(.05,.035,.03),M.T('#c8102e'),[0,.47,.15]));[-1,1].forEach(s=>torso.add(mesh(G.cone?G.cone:new THREE.ConeGeometry(.03,.06,8),M.T('#c8102e'),[s*.04,.47,.15],null,[0,0,s*Math.PI/2])));
  torso.add(mesh(G.box(.09,.03,.01),new THREE.MeshBasicMaterial({color:'#ffd84a'}),[.1,.38,.15]));
  const tr=new THREE.Group();tr.position.set(0,-.26,.12);tr.add(mesh(G.cyl(.17,.17,.015,24),M.silver,[0,0,0]));tr.add(mesh(G.cyl(.03,.025,.1,12),new THREE.MeshStandardMaterial({color:'#f2b632',transparent:true,opacity:.85}),[.05,.06,0]));tr.add(mesh(G.cyl(.02,.02,.06,10),new THREE.MeshStandardMaterial({color:'#2e9a4a'}),[-.06,.04,.03]));arms[1].children[0].add(tr);}
 if(opts.dj){const g=new THREE.Group();g.position.set(0,.28,.3);head.add(g);
  [-1,1].forEach(s=>g.add(mesh(G.cyl(.07,.07,.02,20),new THREE.MeshStandardMaterial({color:'#111',metalness:1,roughness:.1}),[s*.11,0,0],null,[Math.PI/2,0,0])));g.add(mesh(G.box(.08,.015,.01),M.black));
  head.add(mesh(new THREE.TorusGeometry(.4,.025,8,24,Math.PI),M.black,[0,.3,0],null,[0,Math.PI/2,0]));
  [-1,1].forEach(s=>head.add(mesh(G.cyl(.09,.09,.07,20),new THREE.MeshStandardMaterial({color:'#ff3cac',emissive:'#ff3cac',emissiveIntensity:.5}),[s*.37,.25,0],null,[0,0,Math.PI/2])));}
 return {root,hips,torso,head,arms,legs,M};}
function T2(M,c){return M.T(c);}
function curls(head,H,pts,r){pts.forEach(([x,y,z,k=1])=>head.add(mesh(G.sph(r*k,18,14),H,[x,y,z])));}
function hair(head,M,o,st){const H=M.hair,f=o.gender==='f';
 if(o.dj||(!f&&st==='disco')){ // 큰 아프로
  head.add(mesh(G.sph(.45,32,24),H,[0,.47,-.17],[1.05,.92,.85]));head.add(mesh(new THREE.SphereGeometry(.335,32,24,0,Math.PI*2,0,Math.PI*.42),H,[0,.33,0]));return;}
 const cap=mesh(new THREE.SphereGeometry(.335,36,22,0,Math.PI*2,0,Math.PI*.42),H,[0,.33,0],[1.04,.97,1.02]);head.add(mesh(new THREE.SphereGeometry(.33,32,24,Math.PI,Math.PI),H,[0,.26,-.005],[1.05,.97,1]));head.add(cap);
 if(!f&&st==='suit'){ // 짧은 옆가르마
  head.add(mesh(G.sph(.14),H,[.05,.55,.15],[1.9,.6,1]));head.add(mesh(G.sph(.1),H,[-.19,.5,.13],[1,.6,.9]));
  [-1,1].forEach(s=>head.add(mesh(G.box(.05,.14,.12),H,[s*.3,.32,.02])));return;}
 if(!f&&st==='hanbok'){ // 갓 (차양 넓은 검은 갓 + 높은 모자 + 끈)
  const gat=new THREE.MeshStandardMaterial({color:'#151515',roughness:.6,transparent:true,opacity:.95});
  head.add(mesh(G.cyl(.62,.62,.012,40),gat,[0,.53,0]));head.add(mesh(G.cyl(.16,.18,.3,28),gat,[0,.69,0]));head.add(mesh(G.sph(.16,20,10),gat,[0,.84,0],[1,.25,1]));
  head.add(mesh(G.cyl(.36,.36,.06,32,1),gat,[0,.5,0]));
  [-1,1].forEach(s=>head.add(mesh(G.cyl(.006,.006,.42,6),M.black,[s*.25,.29,.12],null,[0,0,s*.25])));return;}
 if(f&&st==='suit'){ // 풍성한 웨이브
  curls(head,H,[[-.3,.3,-.05],[.3,.3,-.05],[-.33,.1,-.08],[.33,.1,-.08],[-.3,-.08,-.1,.9],[.3,-.08,-.1,.9],[0,.15,-.28,1.3],[-.18,0,-.25],[.18,0,-.25],[0,.5,-.05,1.3],[-.2,.48,.1],[.2,.48,.1]],.16);return;}
 if(f&&st==='disco'){ // 곱슬곱슬 큰 머리
  const pts=[];for(let i=0;i<34;i++){const th=Math.random()*Math.PI*2,ph=Math.acos(1-Math.random()*1.25),r=.36;const x=r*Math.sin(ph)*Math.cos(th),y=r*Math.cos(ph),z=r*Math.sin(ph)*Math.sin(th);if(z>.18&&y<.25)continue;pts.push([x*1.15,.28+y,z*1.05-.04]);}
  [[-.36,.05,-.05],[.36,.05,-.05],[-.3,-.12,-.1],[.3,-.12,-.1],[0,.0,-.32]].forEach(p=>pts.push(p));curls(head,H,pts,.12);return;}
 if(f&&st==='hanbok'){ // 가르마 + 낮은 쪽머리 + 비녀
  head.add(mesh(G.sph(.12),H,[0,.1,-.33],[1.25,.85,.9]));
  const pin=T2(M,'#4f8f4a');head.add(mesh(G.cyl(.012,.012,.62,10),pin,[0,.1,-.36],null,[0,0,Math.PI/2]));head.add(mesh(G.sph(.03),pin,[-.32,.1,-.36]));return;}
}
function outfit(torso,hips,M,o){const f=o.gender==='f',st=o.style,col=o.col;
 if(!f&&st==='suit'){torso.add(mesh(G.box(.11,.2,.02),M.white,[0,.38,.15]));torso.add(mesh(G.box(.045,.2,.02),T2(M,'#7a1424'),[0,.34,.162]));torso.add(mesh(G.box(.06,.04,.025),T2(M,'#7a1424'),[0,.44,.163]));
  const lap=T2(M,new THREE.Color(col).multiplyScalar(.7));[-1,1].forEach(s=>torso.add(mesh(G.box(.05,.22,.02),lap,[s*.07,.37,.155],null,[0,0,s*.4])));
  torso.add(mesh(G.box(.05,.03,.02),M.white,[-.11,.36,.15]));[.2,.27].forEach(y=>[-1,1].forEach(s=>torso.add(mesh(G.sph(.012),M.black,[s*.04,y,.165]))));}
 if(!f&&st==='disco'){torso.add(mesh(G.box(.09,.16,.01),M.skin,[0,.4,.155]));[-1,1].forEach(s=>torso.add(mesh(new THREE.ConeGeometry(.07,.17,3),M.white,[s*.08,.45,.14],[1,1,.25],[0,0,s*2.3])));
  hips.add(mesh(G.cyl(.18,.18,.05),M.brown,[0,.08,0],[1.05,1,.85]));hips.add(mesh(G.box(.05,.035,.02),M.silver,[0,.08,.16]));}
 if(!f&&st==='hanbok'){torso.add(mesh(G.cap(.18,.2),M.T(col),[0,.24,0],[1.15,1,.85])); // 저고리 아래로 덮기
  torso.add(mesh(G.box(.035,.22,.015),M.white,[-.03,.42,.15],null,[0,0,.65]));
  const gor=T2(M,'#3a2416');torso.add(mesh(G.box(.04,.26,.012),gor,[.04,.22,.165],null,[0,0,.12]));torso.add(mesh(G.box(.04,.2,.012),gor,[.08,.24,.163],null,[0,0,-.2]));torso.add(mesh(G.sph(.03),gor,[.05,.35,.165],[1.4,.8,.5]));}
 if(f&&st==='suit'){[-1,1].forEach(s=>torso.add(mesh(G.sph(.1),M.T(col),[s*.19,.44,0],[1.2,.6,1]))); // 어깨 뽕
  torso.add(mesh(G.box(.1,.16,.02),M.white,[0,.41,.15]));const lap=T2(M,new THREE.Color(col).multiplyScalar(.8));[-1,1].forEach(s=>torso.add(mesh(G.box(.05,.2,.02),lap,[s*.07,.4,.157],null,[0,0,s*.4])));
  [.2,.27].forEach(y=>torso.add(mesh(G.sph(.013),M.black,[.03,y,.165])));
  hips.add(mesh(G.cyl(.19,.2,.26),M.T(col),[0,-.03,0],[1,1,.85]));}
 if(f&&st==='disco'){[-1,1].forEach(s=>torso.add(mesh(new THREE.ConeGeometry(.07,.15,3),M.T(col),[s*.08,.47,.13],[1,1,.25],[0,0,s*2.3])));
  torso.add(mesh(G.box(.012,.38,.012),M.silver,[0,.28,.155]));[-1,1].forEach(s=>torso.add(mesh(G.box(.06,.008,.01),M.silver,[s*.09,.18,.15],null,[0,0,s*.3])));}
 if(f&&st==='hanbok'){torso.add(mesh(G.box(.035,.18,.015),M.white,[-.03,.44,.15],null,[0,0,.65]));torso.add(mesh(G.box(.035,.14,.015),M.white,[.04,.43,.15],null,[0,0,-.65]));
  const gor=T2(M,'#7a2f8a');torso.add(mesh(G.box(.04,.34,.012),gor,[.03,.2,.21],null,[0,0,.1]));torso.add(mesh(G.box(.04,.28,.012),gor,[.07,.22,.208],null,[0,0,-.18]));torso.add(mesh(G.sph(.035),gor,[.04,.37,.2],[1.4,.8,.5]));
  const chima=new THREE.Mesh(new THREE.CylinderGeometry(.2,.4,.7,36,1,true),T2(M,col));chima.material.side=THREE.DoubleSide;chima.position.y=-.05;hips.add(chima);
  hips.add(mesh(new THREE.CircleGeometry(.4,36),chima.material,[0,-.4,0],null,[Math.PI/2,0,0]));
  hips.add(mesh(G.cyl(.205,.205,.04),M.white,[0,.31,0]));}
}
// 코드 애니메이션
function animateChibi(c,state,t,o){const k=t*Math.PI*2;let bob=0,armA=0,legA=0,lean=0,tilt=0,armUp=0,sway=0,sit=0,twist=0,ph0=0;
 if(state==='walk'){const p=k*1.8;legA=Math.sin(p)*.7;armA=-Math.sin(p)*.8;bob=Math.abs(Math.sin(p))*.04;lean=.08;tilt=Math.sin(p)*.05;}
 else if(state.startsWith('dance')){const on=window.MUSIC_PLAYING,bpm=on?124:96,p=t*bpm/60*Math.PI; // 음악 나오면 비트에 맞춰 더 신나게
  if(state==='dance2'){ // 디스코 손가락 (토요일 밤의 열기 포즈)
   bob=Math.abs(Math.sin(p))*.06;sway=Math.sin(p)*.12;tilt=Math.sin(p)*.12;legA=Math.sin(p)*.2;armUp=2;}
  else if(state==='dance3'){ // 고고 트위스트
   bob=Math.abs(Math.sin(p*2))*.03;sway=Math.sin(p)*.05;tilt=Math.sin(p/2)*.1;armUp=3;twist=Math.sin(p)*.5;legA=Math.sin(p)*.15;}
  else{bob=Math.abs(Math.sin(p))*.08;armUp=1;sway=Math.sin(p/2)*.18;tilt=Math.sin(p)*.15;legA=Math.sin(p)*.25;}
  ph0=p;}
 else if(state==='sit'){sit=1;tilt=Math.sin(k*.4)*.05;}
 else{bob=Math.sin(k*.5)*.012;tilt=Math.sin(k*.35)*.05;armA=Math.sin(k*.5)*.06;}
 c.hips.position.y=.42+bob+(sit?.04:0);c.hips.position.z=sit?-.08:0;c.torso.rotation.x=lean-(sit?.08:0);c.torso.rotation.z=sway;c.head.rotation.z=tilt;c.head.rotation.x=armUp?Math.abs(Math.sin(ph0))*.15:0;c.hips.rotation.y=twist;c.torso.rotation.y=-twist*.6;
 c.arms.forEach((a,i)=>{const s=i?1:-1;if(armUp===1){const ph=Math.sin(ph0+(i?Math.PI:0));a.rotation.set(-.4,0,s*(1.9+ph*.6));}
  else if(armUp===2){const up=Math.sin(ph0/2)>0;a.rotation.set(0,0,(i===(up?1:0))?s*2.6:s*-.3);}
  else if(armUp===3){a.rotation.set(-1.2+Math.sin(ph0+(i?Math.PI:0))*.3,0,s*.4);}else{a.rotation.set(sit?-.5:armA*s*-1,0,sit?s*.1:s*.08);}});
 c.legs.forEach((l,i)=>{const s=i?1:-1;l.rotation.x=sit?-1.45:legA*s;l.rotation.z=0;});}
window.makeHuman=async function(holder,opts){const c=makeChibi(opts);holder.object3D.add(c.root);let state='idle',t=Math.random()*10;
 const map={Idle_Loop:'idle',Walk_Loop:'walk',Sitting_Idle_Loop:'sit',Dance_Loop:'dance1',Dance_1:'dance1',Dance_2:'dance2',Dance_3:'dance3'};
 const h={root:c.root,chibi:c,cur:null,play(name){this.cur=name;state=map[name]||'idle';},drinks:[],cup:null,dT:-1,
  carry(kind){if(this.held){this.held.parent.remove(this.held);this.held=null;}this.carryKind=kind||null;if(kind){this.held=makeItem(kind,true);c.arms[0].children[0].add(this.held);}},
  drink(type){if(this.cup){this.cup.parent.remove(this.cup);}this.cup=makeCup(type);c.arms[1].children[0].add(this.cup);this.dT=0;this.d0=performance.now();this.pouring=type==='pour';if(this.pouring||type==='eat')return;const n=Date.now();this.drinks=this.drinks.filter(x=>n-x<1800000);this.drinks.push(n);},
  mixer:{timeScale:1,update(dt){t+=dt*h.mixer.timeScale;animateChibi(c,state,t,opts);if(h.after)h.after(t,c);
   if(h.dT>=0){h.dT=(performance.now()-h.d0)/1000;const q=h.dT/2,r=q<.3?q/.3:q<.75?1:Math.max(0,1-(q-.75)/.25),e=r*r*(3-2*r);
    const a=c.arms[1];if(h.pouring){a.rotation.x=a.rotation.x*(1-e)-1.5*e;a.rotation.z=a.rotation.z*(1-e)+.5*e;if(h.cup)h.cup.rotation.x=e*1.6;c.head.rotation.x+=.2*e;}else{a.rotation.x=a.rotation.x*(1-e)-2.3*e;a.rotation.z=a.rotation.z*(1-e)+.35*e;c.head.rotation.x+=-.4*e*(q>.25&&q<.8?1:.6);}
    if(q>=1){h.dT=-1;if(h.cup){h.cup.parent.remove(h.cup);h.cup=null;}}}
   const n=Date.now(),k=h.drinks.filter(x=>n-x<300000).length,lv=Math.min(1,Math.max(0,(k-2)/4));c.M.blush.opacity=.35+.5*lv;c.M.blush.color.set(lv>0?'#ff5a5a':'#ff9b8a');h.rosy=lv;
   if(!c.faceM){c.faceM=c.M.skin.clone();c.faceBase=c.faceM.color.clone();c.head.children.forEach(m=>{if(m.material===c.M.skin)m.material=c.faceM;});}
   const last=h.drinks[h.drinks.length-1]||0,drunk=h.drinks.filter(x=>n-x<1800000).length>=10&&n-last<30000;const want=drunk?1:0;h.red=(h.red||0)+(want-(h.red||0))*.05;c.faceM.color.copy(c.faceBase).lerp(RED_FACE,h.red*.75);}},
  dispose(){holder.object3D.remove(c.root);c.root.traverse(n=>{if(n.isMesh){n.geometry.dispose();}});}};h.play('Idle_Loop');animateChibi(c,'idle',0,opts);return h;};
function makeCup(type){const g=new THREE.Group();g.position.set(0,-.3,.06);
 if(type==='whiskey'||type==='rock'){return rockGlass(g);}
 if(type==='cocktail'){return cocktailGlass(g);}
 if(type==='eat'){const wd=new THREE.MeshStandardMaterial({color:'#c8a165',roughness:.7});g.add(mesh(G.cyl(.006,.004,.24,6),wd,[-.012,.06,0]));g.add(mesh(G.cyl(.006,.004,.24,6),wd,[.012,.06,0]));g.add(mesh(G.box(.05,.035,.04),new THREE.MeshStandardMaterial({color:'#b5341a',roughness:.5}),[0,.19,0]));return g;}
 if(type==='pour'){g.add(mesh(G.cyl(.045,.05,.22,14),new THREE.MeshStandardMaterial({color:'#7a3d0a',transparent:true,opacity:.85,roughness:.15}),[0,.02,0]));g.add(mesh(G.cyl(.015,.02,.09,10),new THREE.MeshStandardMaterial({color:'#7a3d0a'}),[0,.17,0]));g.add(mesh(G.box(.06,.06,.005),new THREE.MeshBasicMaterial({color:'#f3e2b0'}),[0,.02,.05]));return g;}
 if(type==='beer'){const glass=new THREE.MeshStandardMaterial({color:'#f2b632',transparent:true,opacity:.85,roughness:.2});g.add(mesh(G.cyl(.06,.055,.15,16),glass,[0,0,0]));g.add(mesh(G.cyl(.062,.062,.04,16),new THREE.MeshToonMaterial({color:'#fffdf2'}),[0,.09,0]));g.add(mesh(new THREE.TorusGeometry(.04,.012,6,12),glass,[.07,0,0],null,[0,0,Math.PI/2]));}
 else{g.add(mesh(G.cyl(.035,.028,.06,14),new THREE.MeshStandardMaterial({color:'#e8f4ff',transparent:true,opacity:.7,roughness:.1}),[0,0,0]));g.add(mesh(G.cyl(.03,.026,.03,14),new THREE.MeshBasicMaterial({color:'#ffffff'}),[0,-.005,0]));}
 return g;}
function rockGlass(g){const gl=new THREE.MeshPhysicalMaterial({color:'#f4faff',transparent:true,opacity:.28,roughness:.03,metalness:0,side:THREE.DoubleSide,depthWrite:false});
 g.add(mesh(new THREE.CylinderGeometry(.052,.047,.085,24,1,true),gl,[0,0,0]));
 g.add(mesh(G.cyl(.047,.047,.016,24),new THREE.MeshStandardMaterial({color:'#e8f2fa',transparent:true,opacity:.6,roughness:.05}),[0,-.035,0]));
 g.add(mesh(new THREE.TorusGeometry(.052,.0025,6,24),new THREE.MeshStandardMaterial({color:'#ffffff',transparent:true,opacity:.85}),[0,.0425,0],null,[Math.PI/2,0,0]));
 g.add(mesh(G.cyl(.046,.046,.022,24),new THREE.MeshStandardMaterial({color:'#d8841c',transparent:true,opacity:.92,emissive:'#7a3a00',emissiveIntensity:.6,roughness:.1}),[0,-.016,0]));
 g.add(mesh(G.box(.036,.034,.036),new THREE.MeshStandardMaterial({color:'#eaf8ff',transparent:true,opacity:.75,roughness:.05,emissive:'#9fd8ff',emissiveIntensity:.2}),[.006,-.002,.004],null,[.25,.6,.15]));return g;}
function cocktailGlass(g){const gl=new THREE.MeshStandardMaterial({color:'#eef6ff',transparent:true,opacity:.45,roughness:.05});
 g.add(mesh(G.cyl(.006,.006,.07,8),gl,[0,-.02,0]));g.add(mesh(G.cyl(.03,.03,.005,12),gl,[0,-.055,0]));
 const cone=new THREE.Mesh(new THREE.ConeGeometry(.055,.06,16,1,true),new THREE.MeshStandardMaterial({color:'#ff4fa0',transparent:true,opacity:.8,emissive:'#80104a',side:THREE.DoubleSide}));cone.rotation.x=Math.PI;cone.position.y=.045;g.add(cone);
 g.add(mesh(G.cyl(.008,.008,.008,8),new THREE.MeshStandardMaterial({color:'#ffd84a',emissive:'#806000'}),[.03,.08,0]));return g;}
// 포차 아이템 (병/접시) — 손에 들거나 테이블에 놓음
const FOOD_COL={dakbal:'#b0281a',kkom:'#7a3a20',fish:'#c08a40',squid:'#d23a10',chicken:'#c8801e',hoe:'#f08060'};
function makeItem(kind,inHand){const g=new THREE.Group();if(inHand)g.position.set(0,-.32,.08);
 if(kind==='soju'||kind==='beer'){const m=new THREE.MeshStandardMaterial({color:kind==='soju'?'#2e9a4a':'#5a2c0c',transparent:true,opacity:.88,roughness:.15});
  g.add(mesh(G.cyl(.04,.04,.18,12),m,[0,.09,0]));g.add(mesh(G.cyl(.015,.03,.07,10),m,[0,.21,0]));g.add(mesh(G.box(.06,.05,.005),new THREE.MeshBasicMaterial({color:kind==='soju'?'#e8f4ff':'#f3c040'}),[0,.09,.041]));if(inHand)g.position.y=-.42;}
 else{g.add(makeFood(kind));if(inHand)g.position.y=-.36;}
 return g;}
function makeFood(kind){const g=new THREE.Group(),T=c=>new THREE.MeshToonMaterial({color:c}),S=(c,r=.5,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
 const R=(a,b)=>a+Math.random()*(b-a);let seed=kind.length*7;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280;};const r=(a,b)=>a+rnd()*(b-a);
 const sesame=(n,rad,y)=>{for(let i=0;i<n;i++){const a=r(0,6.28),d=r(0,rad);g.add(mesh(new THREE.SphereGeometry(.004,4,3),S('#fff7dc'),[Math.cos(a)*d,y+r(0,.02),Math.sin(a)*d],[1,.5,1]));}};
 const scal=(n,rad,y,c='#3fa83a')=>{for(let i=0;i<n;i++){const a=r(0,6.28),d=r(0,rad);g.add(mesh(new THREE.TorusGeometry(.009,.003,4,8),T(c),[Math.cos(a)*d,y,Math.sin(a)*d],null,[Math.PI/2,0,0]));}};
 if(kind==='dakbal'){g.add(mesh(G.cyl(.14,.12,.02,20),S('#f4f4f0',.35),[0,.01,0]));
  for(let i=0;i<9;i++){const f=new THREE.Group(),m=T(['#c4200e','#d8301a','#b01a0a'][i%3]);f.add(mesh(G.cyl(.011,.013,.07,6),m,[0,0,0],null,[Math.PI/2,0,0]));
   for(const t of [-.5,0,.5]){const toe=new THREE.Group();toe.position.set(0,0,.035);toe.rotation.y=t;toe.add(mesh(G.cyl(.006,.008,.045,5),m,[0,0,.022],null,[Math.PI/2,0,0]));toe.add(mesh(new THREE.ConeGeometry(.004,.012,4),T('#2a1a10'),[0,0,.05],null,[Math.PI/2,0,0]));f.add(toe);}
   const a=i/9*6.28+r(0,.5),d=i<6?.07:.02;f.position.set(Math.cos(a)*d,.03+(i<6?0:.025),Math.sin(a)*d);f.rotation.set(r(-.4,.4),a+r(-1,1),r(-.4,.4));g.add(f);}
  sesame(25,.1,.06);scal(6,.08,.065);}
 else if(kind==='chicken'){const bk=S('#8a5a2a',.9);g.add(mesh(new THREE.CylinderGeometry(.15,.12,.07,16,1,true),new THREE.MeshStandardMaterial({color:'#8a5a2a',roughness:.9,side:THREE.DoubleSide}),[0,.035,0]));g.add(mesh(G.cyl(.12,.12,.01,16),bk,[0,.005,0]));
  for(let i=0;i<6;i++){const a=i/6*6.28;g.add(mesh(G.box(.14,.002,.12),T('#f6d84a'),[Math.cos(a)*.07,.055,Math.sin(a)*.07],null,[r(-.3,.3),a,.5]));}
  for(let i=0;i<9;i++){const a=r(0,6.28),d=i<6?r(.04,.08):r(0,.03);const pc=new THREE.Group();pc.add(mesh(new THREE.SphereGeometry(.035,8,6),T(['#c8801e','#b06a16','#d8942a'][i%3]),[0,0,0],[1.3,.8,1]));
   if(i%3==0){pc.add(mesh(G.cyl(.008,.01,.05,6),T('#f0e0c0'),[.05,0,0],null,[0,0,Math.PI/2]));}
   for(let k=0;k<5;k++)pc.add(mesh(new THREE.SphereGeometry(.01,4,3),T('#a05a10'),[r(-.03,.03),r(.01,.025),r(-.03,.03)]));
   pc.position.set(Math.cos(a)*d,.07+(i<6?0:.035),Math.sin(a)*d);pc.rotation.set(r(-.5,.5),r(0,6),r(-.5,.5));g.add(pc);}
  const dish=new THREE.Group();dish.position.set(.21,0,.05);g.add(dish);dish.add(mesh(G.cyl(.06,.05,.025,14),S('#f4f4f0',.3),[0,.012,0]));
  for(let i=0;i<7;i++)dish.add(mesh(G.box(.022,.022,.022),T('#f8f2c8'),[r(-.03,.03),.035,r(-.03,.03)],null,[r(0,1),r(0,1),0]));}
 else if(kind==='hoe'){g.add(mesh(G.cyl(.17,.15,.02,24),S('#1a1a1a',.3),[0,.01,0]));
  for(let i=0;i<14;i++){const a=r(0,6.28),d=r(0,.06);g.add(mesh(G.cyl(.002,.002,.06,3),T('#ffffff'),[Math.cos(a)*d,.025,Math.sin(a)*d],null,[Math.PI/2,r(0,3),0]));}
  g.add(mesh(new THREE.SphereGeometry(.05,8,6),T('#f4f4f4'),[0,.025,0],[1,.35,1]));
  g.add(mesh(new THREE.CircleGeometry(.045,10),T('#3a9a3a'),[-.02,.045,.0],null,[-Math.PI/2+.3,0,0]));
  for(let i=0;i<6;i++){const a=-1+i*.38;const sl=mesh(G.box(.07,.012,.035),T(i%2?'#f47a50':'#ff9068'),[Math.cos(a)*.11,.035,Math.sin(a)*.11],null,[0,-a,.25]);g.add(sl);for(let k=0;k<2;k++)g.add(mesh(G.box(.072,.002,.004),T('#ffe0d0'),[Math.cos(a)*.11,.043,Math.sin(a)*.11+(k-.5)*.012],null,[0,-a,.25]));}
  for(let i=0;i<6;i++){const a=2.3+i*.38;g.add(mesh(G.box(.07,.01,.035),T('#f6f2ea'),[Math.cos(a)*.11,.033,Math.sin(a)*.11],null,[0,-a,.25]));}
  g.add(mesh(new THREE.SphereGeometry(.015,8,6),T('#8ac040'),[.06,.03,-.08],[1,.6,1]));
  const cj=new THREE.Group();cj.position.set(.22,0,.06);g.add(cj);cj.add(mesh(G.cyl(.04,.035,.025,12),S('#f4f4f0',.3),[0,.012,0]));cj.add(mesh(G.cyl(.033,.033,.005,12),T('#c8281a'),[0,.024,0]));}
 else if(kind==='kkom'){g.add(mesh(G.cyl(.15,.15,.015,20),S('#2a2a2a',.6,.7),[0,.02,0]));g.add(mesh(G.box(.42,.012,.24),S('#6b4a2a',.9),[0,.006,0]));
  g.add(mesh(new THREE.TorusGeometry(.15,.01,6,24),S('#333',.4,.8),[0,.03,0],null,[Math.PI/2,0,0]));
  for(let i=0;i<10;i++){const a=r(0,6.28),d=r(0,.1);g.add(mesh(new THREE.TorusGeometry(.022,.009,6,10,r(2.5,4)),T(['#8a3014','#a2401a','#7a2810'][i%3]),[Math.cos(a)*d,.04,Math.sin(a)*d],null,[Math.PI/2+r(-.3,.3),0,r(0,6)]));}
  for(let i=0;i<6;i++){const a=r(0,6.28),d=r(0,.11);g.add(mesh(G.box(.035,.004,.012),T('#f4ecd6'),[Math.cos(a)*d,.045,Math.sin(a)*d],null,[0,r(0,3),0]));}
  for(let i=0;i<5;i++){const a=r(0,6.28),d=r(0,.11);g.add(mesh(G.box(.02,.005,.01),T(i%2?'#1e8a28':'#d01818'),[Math.cos(a)*d,.05,Math.sin(a)*d],null,[0,r(0,3),0]));}
  scal(6,.1,.05);for(let i=0;i<3;i++)g.add(mesh(new THREE.SphereGeometry(.02,6,4),new THREE.MeshBasicMaterial({color:'#fff',transparent:true,opacity:.25}),[r(-.06,.06),.1+i*.04,r(-.06,.06)]));}
 else if(kind==='fish'){g.add(mesh(G.box(.34,.015,.13),S('#f2f0ea',.35),[0,.008,0]));const f=new THREE.Group();f.position.y=.035;g.add(f);
  const body=mesh(new THREE.SphereGeometry(.05,14,10),T('#7a5a32'),[0,0,0],[2.6,.55,1]);f.add(body);
  f.add(mesh(new THREE.SphereGeometry(.05,14,10),T('#c8c0b0'),[0,-.008,0],[2.5,.4,.9]));
  f.add(mesh(new THREE.ConeGeometry(.032,.05,8),T('#6a4a28'),[.15,0,0],[1,1,.3],[0,0,Math.PI/2]));
  f.add(mesh(new THREE.ConeGeometry(.04,.045,3),T('#4a3418'),[-.155,0,0],[1,1,.25],[0,0,-Math.PI/2]));
  f.add(mesh(new THREE.SphereGeometry(.007,6,4),T('#111'),[.115,.01,.03]));f.add(mesh(new THREE.ConeGeometry(.012,.03,3),T('#4a3418'),[0,.028,0],[1,1,.3]));
  for(let i=0;i<4;i++)f.add(mesh(G.box(.006,.002,.06),T('#2a1608'),[-.06+i*.04,.028,0],null,[0,.5,0]));
  for(let i=0;i<5;i++)f.add(mesh(G.box(.012,.002,.05),T('#1a2a40'),[-.08+i*.04,.024,0],null,[0,-.3,0]));
  g.add(mesh(new THREE.CylinderGeometry(.025,.025,.012,12,1,false,0,Math.PI),T('#f7e14a'),[.13,.02,.045],null,[0,0,0]));g.add(mesh(G.box(.04,.005,.03),T('#e8e8e0'),[-.12,.018,.045]));}
 else{g.add(mesh(G.cyl(.14,.12,.02,20),S('#f4f4f0',.35),[0,.01,0]));g.add(mesh(G.cyl(.11,.11,.005,20),T('#c8280e'),[0,.022,0]));
  for(let i=0;i<8;i++){const a=r(0,6.28),d=r(0,.09);g.add(mesh(new THREE.TorusGeometry(.02,.008,6,12),T(['#f0d8c8','#e66a40','#d85030'][i%3]),[Math.cos(a)*d,.035,Math.sin(a)*d],null,[Math.PI/2+r(-.5,.5),r(-.3,.3),0]));}
  for(let i=0;i<6;i++){const a=r(0,6.28),d=r(0,.09),t=new THREE.Group();t.position.set(Math.cos(a)*d,.035,Math.sin(a)*d);t.rotation.y=r(0,6);for(let k=0;k<4;k++)t.add(mesh(G.cyl(.004-k*.0007,.004-k*.0007,.015,5),T('#e05a38'),[k*.012,0,Math.sin(k)*.006],null,[0,0,Math.PI/2]));g.add(t);}
  for(let i=0;i<5;i++){const a=r(0,6.28),d=r(0,.1);g.add(mesh(G.box(.03,.005,.014),T(['#f4ecd6','#2e9a3a','#f08a1a'][i%3]),[Math.cos(a)*d,.045,Math.sin(a)*d],null,[0,r(0,3),0]));}
  scal(5,.09,.05);sesame(15,.09,.05);}
 return g;}
window.makeFood=makeFood;window.makeItem=makeItem;window.cocktailGlass=cocktailGlass;
window.rockGlass=rockGlass;window.makeCup=makeCup;window.makeChibi=makeChibi;window.animateChibi=animateChibi;
AFRAME.registerComponent('mixers',{tick(t,dt){for(const h of window.HUMANS||[])h.mixer.update(Math.min(dt,50)/1000);}});
window.HUMANS=new Set();
(async function dj(){const holder=E('a-entity',{position:`${DJ_SPOT.x} ${DJ_SPOT.y+.25} ${DJ_SPOT.z}`,scale:'1.15 1.15 1.15'});
 const h=await makeHuman(holder,{outfit:'#8a5bd6',skin:'#e0a77a',gender:'m',dj:true,style:'disco'});HUMANS.add(h);
 AFRAME.registerComponent('dj-state',{tick(){h.play(window.MUSIC_PLAYING?'Dance_Loop':'Idle_Loop');}});holder.setAttribute('dj-state','');})();
document.querySelector('a-scene').setAttribute('mixers','');
// ---------- 출입문 + 바깥 야장 포장마차 (1980년대 골목) ----------
const DOOR={x:-3.3,w:2,h:3,z:12};window.DOOR=DOOR;
function hand(v,o={}){return `value:${v};color:${o.c||'#fff'};glow:${o.g||''};bg:${o.bg||''};size:${o.s||64};width:${o.w||1.2};font:"Nanum Pen Script","Gaegu","Malgun Gothic",cursive`;}
(function buildOutside(){
 const W=document.getElementById('world');const dl=DOOR.x-DOOR.w/2,dr=DOOR.x+DOOR.w/2;
 // 앞벽을 문 구멍 있게 다시 만듦 (원래 앞벽 숨김)
 // 앞벽(z=12)은 아래에서 문 구멍 있게 생성
 const seg=(x0,x1,y0,y1,inside)=>{const w=x1-x0,h=y1-y0,el=E('a-plane',{position:`${(x0+x1)/2} ${(y0+y1)/2} ${inside?11.99:12.01}`,rotation:inside?'0 180 0':'0 0 0',width:w,height:h,material:inside?'roughness:.9':'color:#3b3532;roughness:1'});
  if(inside){const t=TEX.wall();t.repeat.set(w/2,h/8);t.offset.y=(y0)/8;texMesh(el,t);}else texMesh(el,TEX.brick(w,h));};
 [true,false].forEach(i=>{seg(-12,dl,0,8,i);seg(dr,12,0,8,i);seg(dl,dr,DOOR.h,8,i);});
 // 문틀 + 열린 문짝
 [[dl-.06,DOOR.h/2,.12,DOOR.h],[dr+.06,DOOR.h/2,.12,DOOR.h],[DOOR.x,DOOR.h+.06,DOOR.w+.24,.12]].forEach(([x,y,w,h])=>E('a-box',{position:`${x} ${y} 12`,width:w,height:h,depth:.3,material:'color:#d4a017;metalness:.7;roughness:.3'}));
 E('a-box',{position:`${dl+.05} ${DOOR.h/2-.05} 12.5`,rotation:'0 90 0',width:.95,height:DOOR.h-.15,depth:.05,material:'color:#5a1010;roughness:.6'});
 E('a-box',{position:`${dr-.05} ${DOOR.h/2-.05} 12.5`,rotation:'0 90 0',width:.95,height:DOOR.h-.15,depth:.05,material:'color:#5a1010;roughness:.6'});
 // 안쪽 EXIT 네온, 바깥 ERRDAY 간판
 E('a-entity',{position:`${DOOR.x} ${DOOR.h+.5} 11.9`,rotation:'0 180 0',ktext:'value:EXIT · 포장마차 →;color:#d6ffe0;glow:#00ff66;size:70;width:1.9'});
 E('a-box',{position:`${DOOR.x} ${DOOR.h+.9} 12.15`,width:3.4,height:.9,depth:.12,color:'#120208'});
 E('a-entity',{position:`${DOOR.x} ${DOOR.h+.9} 12.23`,ktext:'value:ERRDAY;color:#fff0f8;glow:#ff3cac;size:110;width:3;font:Georgia,serif'});
 E('a-entity',{position:`${DOOR.x} ${DOOR.h+.9} 12.8`,light:`type:point;color:#ff3cac;intensity:.8;distance:5`});
 // 바닥(아스팔트) + 하늘 + 주변 건물
 texMesh(E('a-plane',{rotation:'-90 0 0',position:'0 0 19.05',width:26,height:14.1,material:'roughness:1'}),TEX.asphalt());
 E('a-sky',{color:'#070b1c',radius:120});
 for(let i=0;i<70;i++){const th=Math.random()*Math.PI-Math.PI/2*0,ph=.15+Math.random()*1.1;E('a-sphere',{radius:.25,'segments-width':4,'segments-height':3,position:`${100*Math.cos(ph)*Math.cos(th)} ${100*Math.sin(ph)} ${20+100*Math.cos(ph)*Math.sin(th)}`,material:'shader:flat;color:#fff'});}
 E('a-sphere',{position:'-30 45 90',radius:4,material:'shader:flat;color:#fff6d0'});
 const bld=(x,z,w,h,d,ry,col,sign)=>{const b=E('a-box',{position:`${x} ${h/2} ${z}`,rotation:`0 ${ry} 0`,width:w,height:h,depth:d,material:'roughness:1'});{const ft=TEX.facade(w,h,col);texMesh(b,ft,{emissiveMap:ft,emissive:new THREE.Color('#ffffff'),emissiveIntensity:.55});}
  if(sign){const s=E('a-entity',{position:`${x} ${sign[1]} ${z}`,rotation:`0 ${ry} 0`});E('a-entity',{position:`0 0 ${d/2+.06}`,ktext:hand(sign[0],{c:'#fff',g:sign[2],bg:'#1a1a1a',s:70,w:sign[3]||2.6})},s);}};
 // 천막 뒤는 열린 거리: 인도 + 차선
 texMesh(E('a-plane',{rotation:'-90 0 0',position:'0 .005 28',width:40,height:4,material:'roughness:1'}),TEX.asphalt());
 E('a-box',{position:'0 .06 29.2',width:40,height:.12,depth:1.6,material:'color:#8a8680;roughness:1'});
 for(let x=-16;x<=16;x+=3)E('a-plane',{rotation:'-90 0 0',position:`${x} .012 25.6`,width:1.4,height:.12,material:'shader:flat;color:#e8d070'});
 // 천막 (낡은 주황 방수포)
 const T={x0:-10,x1:4.2,z0:14,z1:22.3,e:4.5,r:5.6};window.TENT=T;const cx=(T.x0+T.x1)/2,cz=(T.z0+T.z1)/2,hw=(T.z1-T.z0)/2,sl=Math.hypot(hw,T.r-T.e);const ang=Math.atan2(T.r-T.e,hw)*57.3;
 const tarp=()=>TEX.tarp();
 [-1,1].forEach(s=>texMesh(E('a-plane',{position:`${cx} ${(T.e+T.r)/2} ${cz+s*hw/2}`,rotation:`${-90+s*-ang*0+ (s<0?ang:-ang)} 0 0`,width:T.x1-T.x0+.4,height:sl+.2,material:'side:double;roughness:1'}),tarp()));
 texMesh(E('a-plane',{position:`${cx} ${T.e/2+.4} ${T.z1}`,rotation:'0 180 0',width:T.x1-T.x0,height:T.e-.8,material:'side:double;roughness:1;opacity:.92;transparent:true'}),tarp());
 texMesh(E('a-plane',{position:`${T.x0} ${T.e/2+.4} ${cz}`,rotation:'0 90 0',width:T.z1-T.z0,height:T.e-.8,material:'side:double;roughness:1;opacity:.92;transparent:true'}),tarp());
 [[T.x0,T.z0],[T.x1,T.z0],[T.x0,T.z1],[T.x1,T.z1],[cx,T.z1]].forEach(([x,z])=>{E('a-cylinder',{position:`${x} ${T.e/2} ${z}`,radius:.04,height:T.e,'segments-radial':6,color:'#777'});OBSTACLES.push({x,z,r:.12});});
 // 앞 처마 차양 + 천막에 칠한 글씨
 [-1,1].forEach(s=>texMesh(E('a-plane',{position:`${cx} ${T.e-.35} ${T.z0+s*.01}`,rotation:`0 ${s>0?180:0} 0`,width:T.x1-T.x0,height:.7,material:'side:double;roughness:1'}),TEX.tarp()));
 [[cx-3.2,'포장마차',2.6,'#fff3d0'],[cx+2.6,'술, 안주는 셀프 입니다',4.2,'#fffbe0']].forEach(([x,t,w,c])=>{E('a-entity',{position:`${x} ${T.e-.35} ${T.z0-.03}`,rotation:'0 180 0',ktext:hand(t,{c,s:90,w})});E('a-entity',{position:`${x} ${T.e-.35} ${T.z0+.03}`,ktext:hand(t,{c,s:90,w})});});
 E('a-entity',{position:`${cx} ${T.e/2+1.2} ${T.z1+.03}`,ktext:hand('술, 안주는 셀프 입니다',{c:'#fffbe0',s:90,w:4.2})});
 E('a-entity',{position:`-.7 3.0 ${T.z1-.05}`,rotation:'0 180 0',ktext:hand('술, 안주는 셀프 입니다',{c:'#fffbe0',s:90,w:3.2})});
 // 백열전구 줄 (비닐 전선)
 let bi=0;[[T.x0+.3,T.z0+2],[T.x0+.3,T.z1-2.2]].forEach(([x0,z])=>{for(let x=x0;x<T.x1;x+=1.2){const y=T.e+.15-Math.sin((x-x0)/(T.x1-x0)*Math.PI)*.25;
  E('a-sphere',{position:`${x} ${y} ${z}`,radius:.09,'segments-width':8,'segments-height':6,material:'color:#ffe4a0;emissive:#ffb040;emissiveIntensity:1'});E('a-cylinder',{position:`${x} ${y+.12} ${z}`,radius:.005,height:.2,color:'#222'});bi++;}});
 E('a-entity',{position:`${cx} ${T.e-.2} ${cz}`,light:`type:point;color:#ffa040;intensity:${IS_MOBILE?1.5:2};distance:14;decay:1.2`});
 // 메뉴판 (손글씨)
 const menu=E('a-entity',{position:`${T.x0+.05} 1.75 ${cz}`,rotation:'0 90 0'});
 E('a-plane',{width:2.6,height:1.5,material:'color:#efe2bf;roughness:1'},menu);
 E('a-entity',{position:'-.65 .52 .01',ktext:hand('안 주',{c:'#b01010',s:70,w:.7})},menu);
 ['닭발','꼼장어','생선구이','오징어볶음'].forEach((v,i)=>E('a-entity',{position:`-.65 ${.2-i*.28} .01`,ktext:hand(v,{c:'#222',s:64,w:.5+v.length*.13})},menu));
 E('a-entity',{position:'.65 .52 .01',ktext:hand('술',{c:'#1040a0',s:70,w:.4})},menu);
 ['소주','맥주'].forEach((v,i)=>E('a-entity',{position:`.65 ${.2-i*.32} .01`,ktext:hand(v,{c:'#222',s:64,w:.5+v.length*.13})},menu));
 E('a-entity',{position:'5.5 2.35 16.5',billboard:'',ktext:hand('안주 · 닭발 · 꼼장어 · 생선구이 · 오징어볶음',{c:'#fff',bg:'#7a1a10',s:56,w:3.2})});
 // 포장마차 수레 + 연탄불 + 김
 const C=E('a-entity',{position:'5.5 0 16.5'});
 E('a-box',{position:'0 .5 0',width:2.6,height:.9,depth:1.1,material:'color:#c9c2b0;metalness:.5;roughness:.5'},C);
 E('a-box',{position:'0 .97 0',width:2.8,height:.06,depth:1.3,material:'color:#8a8070;metalness:.6;roughness:.35'},C);
 [[-1.1,-.4],[1.1,-.4]].forEach(([x,z])=>E('a-cylinder',{position:`${x} .25 ${z+.95}`,radius:.25,height:.08,rotation:'90 0 0',color:'#222'},C));
 E('a-entity',{position:'0 .55 .56',ktext:hand('원조 실비 포차',{c:'#c01818',s:70,w:1.8})},C);
 E('a-cylinder',{position:'-.6 1.1 0',radius:.32,height:.22,material:'color:#555;metalness:.8;roughness:.3'},C);
 E('a-cylinder',{position:'-.6 1.22 0',radius:.3,height:.02,material:'color:#b5772a;emissive:#7a3010;emissiveIntensity:.4'},C); // 오뎅 국물
 for(let k=0;k<5;k++)E('a-cylinder',{position:`${-.75+k*.08} 1.35 ${(k%2)*.1-.05}`,radius:.008,height:.35,rotation:'0 0 12',color:'#d9b97a'},C);
 E('a-box',{position:'.55 1.06 0',width:1.1,height:.1,depth:.7,material:'color:#333;emissive:#ff4400;emissiveIntensity:.5'},C); // 석쇠
 for(let k=0;k<4;k++)E('a-box',{position:`${.2+k*.24} 1.14 0`,width:.18,height:.04,depth:.08,material:'color:#a8501e'},C);
 for(let k=0;k<6;k++)E('a-sphere',{position:`${-.6+(k%3-1)*.1} 1.5 0`,radius:.18,material:'color:#fff;opacity:.18;transparent:true;depthWrite:false;shader:flat','steam':'i:'+k},C);
 // 석유 등잔(남포등)
 E('a-cylinder',{position:'1.2 1.15 -.4',radius:.06,height:.25,material:'color:#fff2c0;emissive:#ff9a30;emissiveIntensity:1;opacity:.85;transparent:true'},C);
 E('a-entity',{position:'1.2 1.6 -.4',light:`type:point;color:#ff9a40;intensity:${IS_MOBILE?0:.9};distance:5`},C);
 [[-1.35,-.6],[1.35,-.6],[-1.35,.6],[1.35,.6]].forEach(([x,z])=>E('a-cylinder',{position:`${x} 1.6 ${z}`,radius:.025,height:1.2,color:'#777'},C));
 texMesh(E('a-box',{position:'0 2.25 0',width:3,height:.05,depth:1.5,material:'roughness:1'},C),TEX.tarp());
 OBSTACLES.push({x0:4.1,x1:6.9,z0:15.8,z1:17.2});
 // 가로등
 const L=E('a-entity',{position:'9 0 22'});E('a-cylinder',{position:'0 2.5 0',radius:.07,height:5,color:'#3a4048'},L);
 E('a-box',{position:'-.5 4.95 0',width:1.1,height:.07,depth:.07,color:'#3a4048'},L);E('a-cone',{position:'-1 4.85 0','radius-bottom':.3,'radius-top':.08,height:.2,color:'#2a2a2a'},L);
 E('a-sphere',{position:'-1 4.75 0',radius:.12,material:'color:#fff;emissive:#ffe6b0;emissiveIntensity:1'},L);
 E('a-entity',{position:'-1 4.6 0',light:'type:spot;color:#ffd9a0;intensity:2.2;angle:45;penumbra:.6;distance:12',rotation:'-90 0 0'},L);OBSTACLES.push({x:9,z:22,r:.15});
 // 업소용 술냉장고 (유리문)
 {const F=E('a-entity',{position:'-.7 0 22.0'});E('a-box',{position:'0 1 0',width:1.3,height:2,depth:.7,material:'color:#d8dde2;metalness:.5;roughness:.4'},F);
  E('a-box',{position:'0 1 -.36',width:1.15,height:1.75,depth:.02,material:'color:#bfe8ff;opacity:.35;transparent:true;emissive:#9fd8ff;emissiveIntensity:.35'},F);
  for(let r=0;r<4;r++){E('a-box',{position:`0 ${.35+r*.42} -.1`,width:1.15,height:.02,depth:.5,color:'#999'},F);for(let k=0;k<7;k++)E('a-cylinder',{position:`${-.48+k*.16} ${.46+r*.42} -.15`,radius:.035,height:.2,'segments-radial':8,material:`color:${r<2?'#2e9a4a':'#5a2c0c'};opacity:.9;transparent:true;roughness:.15`},F);}
  E('a-entity',{position:'0 2.2 -.37',rotation:'0 180 0',ktext:hand('시원한 소주 · 맥주',{c:'#fff',bg:'#1040a0',s:56,w:1.4})},F);
  E('a-entity',{position:'0 1.2 -.9',light:`type:point;color:#bfe8ff;intensity:${IS_MOBILE?0:.6};distance:3`},F);
  OBSTACLES.push({x0:-1.4,x1:0,z0:21.6,z1:22.4});window.FRIDGE={x:-.7,z:21.5};window.COOK={x:5.5,z:16.5};}
 // 플라스틱 빨간 테이블 + 목욕탕 의자
 const tables=[[-7.6,16.4],[-3,16.4],[-7.6,20.2],[-3,20.2],[2.6,21.5]];
 tables.forEach(([tx,tz],ti)=>{const id='Y'+(ti+1);
  E('a-box',{position:`${tx} .68 ${tz}`,width:.9,height:.04,depth:.9,material:'color:#c41a1a;roughness:.5'});
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>E('a-cylinder',{position:`${tx+a*.38} .34 ${tz+b*.38}`,radius:.03,height:.66,'segments-radial':6,color:'#a81414'}));
  E('a-entity',{position:`${tx} 1.55 ${tz}`,ktext:`value:야장 ${ti+1}번;color:#ffe08a;size:40;width:.8`,billboard:''});
  OBSTACLES.push({x:tx,z:tz,r:.55});window.POCHA_TABLES=window.POCHA_TABLES||{};POCHA_TABLES[id]=[tx,tz];
  for(let s=0;s<4;s++){const a=s*Math.PI/2,sx=tx+Math.cos(a)*.78,sz=tz+Math.sin(a)*.78,yaw=Math.atan2(tx-sx,tz-sz),seatId=id+'-'+s;
   const el=E('a-entity',{position:`${sx} 0 ${sz}`});E('a-cylinder',{position:'0 .2 0',radius:.17,'radius-bottom':.2,height:.4,'segments-radial':10,material:'color:#d01e1e;roughness:.5'},el);
   el.dataset.seat=seatId;el.classList.add('seat');SEATS.push({id:seatId,table:id,x:sx,z:sz,yaw,el});}});
})();
AFRAME.registerComponent('steam',{schema:{i:{default:0}},tick(t){const o=this.el.object3D,k=((t/1800+this.data.i/6)%1);o.position.y=1.35+k*1.1;o.scale.setScalar(.5+k*1.4);const m=this.el.getObject3D('mesh');if(m)m.material.opacity=.22*(1-k);}});
if(document.fonts)document.fonts.load('64px "Nanum Pen Script"').then(()=>document.querySelectorAll('[ktext]').forEach(e=>{const k=e.components.ktext;if(k&&/Nanum/.test(k.data.font))k.update();})).catch(()=>{});

// 바텐더 단상 높이
{const h0=window.heightAt;window.heightAt=(x,z)=>{const P=window.BAR_PLAT;if(P&&x>=P.x0&&x<=P.x1){if(z>=P.z0&&z<=P.z1)return P.h;const o=z<P.z0?P.z0-z:z-P.z1;if(o<P.s)return P.h*Math.ceil(4-o/P.s*4)/5;}return h0(x,z);};}

// ---------- NPC 웨이터 (서버 시간 기준 순찰 → 모든 사용자에게 비슷한 위치) ----------
window.WAITERS=[];
(async function waiters(){const defs=[{name:'웨이터 김 · 부킹왕',skin:'#f2c29a',route:[[-4.6,1.4],[-4.6,5.8],[2.2,5.9],[2.2,1.4]],sp:.55,ph:0},
 {name:'웨이터 최 · 나이트 황제',skin:'#f5cfa8',route:[[-10,-5.5],[-10,10.5],[-4.8,10.5],[-4.8,-5.5]],sp:.5,ph:4}];
 for(const d of defs){const holder=E('a-entity',{});const h=await makeHuman(holder,{outfit:'#151515',skin:d.skin,gender:'m',style:'suit',waiter:true});HUMANS.add(h);
  E('a-entity',{position:'0 1.85 0',billboard:'',ktext:`value:${d.name};color:#fff;glow:#ff3cac;size:36;width:1.4`},holder);
  const segs=[];let L=0;for(let i=0;i<d.route.length;i++){const a=d.route[i],b=d.route[(i+1)%d.route.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);segs.push({a,b,l,s:L});L+=l;}
  WAITERS.push({...d,holder,h,segs,L,hold:0,x:d.route[0][0],z:d.route[0][1]});}
 AFRAME.registerComponent('waiter-walk',{tick(t,dt){dt=Math.min(dt||16,50)/1000;const now=(Date.now()+(window.SERVER_OFFSET||0))/1000,rig=document.getElementById('rig');const pp=rig&&rig.object3D.position;
  for(const w of WAITERS){const near=pp&&Math.hypot(pp.x-w.x,pp.z-w.z)<2;if(near)w.hold+=dt;else w.hold=Math.max(0,w.hold-dt*.5);w.near=near;
   const d=(((now-w.hold)*w.sp+w.ph)%w.L+w.L)%w.L;const sg=w.segs.find(q=>d>=q.s&&d<q.s+q.l)||w.segs[0];const k=(d-sg.s)/sg.l;w.x=sg.a[0]+(sg.b[0]-sg.a[0])*k;w.z=sg.a[1]+(sg.b[1]-sg.a[1])*k;
   const o=w.holder.object3D;o.position.set(w.x,0,w.z);const yaw=near?Math.atan2(pp.x-w.x,pp.z-w.z):Math.atan2(sg.b[0]-sg.a[0],sg.b[1]-sg.a[1]);let dy=yaw-o.rotation.y;dy=Math.atan2(Math.sin(dy),Math.cos(dy));o.rotation.y+=dy*Math.min(1,dt*6);
   w.h.play(near?'Idle_Loop':'Walk_Loop');w.h.root.rotation.x=near&&w.hold<1.2?Math.sin(w.hold/1.2*Math.PI)*.35:0;}}});
 document.querySelector('a-scene').setAttribute('waiter-walk','');})();

// ---------- 80년대 거리 보강: 낮은 상가 + 주차된 자동차 ----------
(function street80(){
 const shop=(x,z,w,h,d,ry,col,sign,sc)=>{const g=E('a-entity',{position:`${x} 0 ${z}`,rotation:`0 ${ry} 0`});
  const b=E('a-box',{position:`0 ${h/2} 0`,width:w,height:h,depth:d,material:'roughness:1'},g);const ft=TEX.facade(w,h,col);texMesh(b,ft,{emissiveMap:ft,emissive:new THREE.Color('#ffffff'),emissiveIntensity:.45});
  E('a-box',{position:`0 ${h+.15} 0`,width:w+.2,height:.3,depth:d+.2,color:'#3a302a'},g);
  E('a-box',{position:`0 1.2 ${d/2+.02}`,width:w*.8,height:2.2,depth:.04,material:'color:#2a2a30;metalness:.6'},g);
  for(let k=0;k<8;k++)E('a-box',{position:`0 ${.2+k*.27} ${d/2+.05}`,width:w*.8,height:.02,depth:.02,color:'#555'},g);
  E('a-box',{position:`0 2.75 ${d/2+.12}`,width:w*.85,height:.6,depth:.12,material:`color:#111;emissive:${sc};emissiveIntensity:.25`},g);
  E('a-entity',{position:`0 2.75 ${d/2+.19}`,ktext:hand(sign,{c:'#fff',g:sc,s:70,w:Math.min(w*.8,2.8)})},g);};
 [[-7.5,31.2,'다방',  '#ff6688','#6b5a4a'],[-1.5,31.2,'전파사','#66ccff','#5a5a62'],[4.5,31.2,'연탄가게','#ffcc55','#6a4a3a'],[10,31.2,'오락실','#a8ff60','#4a4f6a']].forEach(([x,z,l,sc,c])=>shop(x,z,5,4.2+((x*7)%3+3)%2*1.4,3,0,c,l,sc));
 [[15,'횟집','#33aaff'],[22,'통닭','#ff5533']].forEach(([z,l,sc])=>{shop(15.6,z,5,4.6,3,-90,'#5e5048',l,sc);shop(-17.6,z,5,4.6,3,90,'#544a52',l==='통닭'?'비디오':'만화방',l==='통닭'?'#66ddff':'#ff77cc');E('a-box',{position:`13.2 .5 ${z}`,width:.6,height:1,depth:2.4,material:`color:${l==='통닭'?'#c8a070':'#e0e4e8'};roughness:.7`});OBSTACLES.push({x0:12.9,x1:13.5,z0:z-1.2,z1:z+1.2});});
 // 횟집 수족관
 E('a-box',{position:'13.75 .9 13.2',width:.7,height:1.2,depth:1.4,material:'color:#5ac8ff;opacity:.45;transparent:true;metalness:.2;roughness:.05;emissive:#1060a0;emissiveIntensity:.4'});OBSTACLES.push({x0:13.4,x1:14.1,z0:12.5,z1:13.9});
 window.AQFISH=[];for(let k=0;k<5;k++){const f=E('a-entity',{position:`13.75 ${.6+k*.13} 13.2`});E('a-sphere',{radius:.07,scale:'1.8 .7 .5',color:['#e86a40','#c0c8d0','#ff9a50','#8090a0','#d84a30'][k]},f);E('a-cone',{position:'-.14 0 0',rotation:'0 0 90','radius-bottom':.05,height:.08,scale:'1 1 .3',color:'#777'},f);window.AQFISH.push(f);}
 AFRAME.registerComponent('aq-swim',{tick(t){(window.AQFISH||[]).forEach((f,k)=>{const a=t/1000*(.6+k*.15)+k;f.object3D.position.z=13.2+Math.sin(a)*.5;f.object3D.rotation.y=Math.cos(a)>0?-Math.PI/2:Math.PI/2;});}});document.querySelector('a-scene').setAttribute('aq-swim','');
 const car=(x,z,ry,col,truck)=>{const g=E('a-entity',{position:`${x} 0 ${z}`,rotation:`0 ${ry} 0`}),L=truck?4.2:4.1,W=1.6;
  E('a-box',{position:'0 .55 0',width:W,height:.55,depth:L,material:`color:${col};metalness:.4;roughness:.45`},g);
  if(truck){E('a-box',{position:`0 1.15 ${L/2-.75}`,width:W,height:.75,depth:1.3,material:`color:${col};metalness:.4;roughness:.45`},g);
   E('a-box',{position:`0 1.2 ${L/2-.09}`,width:W*.86,height:.45,depth:.02,material:'color:#9ac;metalness:.9;roughness:.1'},g);
   [-1,1].forEach(s=>E('a-box',{position:`${s*W/2} 1.05 ${-L/4+.1}`,width:.05,height:.45,depth:L*.62,color:'#8a9098'},g));E('a-box',{position:`0 1.05 ${-L/2}`,width:W,height:.45,depth:.05,color:'#8a9098'},g);
   for(let k=0;k<3;k++)E('a-box',{position:`${-.4+k*.4} 1.0 -1`,width:.35,height:.35,depth:.5,color:'#b08850'},g);}
  else{E('a-box',{position:'0 1.07 -.15',width:W*.92,height:.5,depth:2.1,material:`color:${col};metalness:.4;roughness:.45`},g);
   [[0,1.08,.92,W*.82,.42,.02],[0,1.08,-1.22,W*.82,.4,.02]].forEach(([a,b,c,w,h,d])=>E('a-box',{position:`${a} ${b} ${c}`,width:w,height:h,depth:d,material:'color:#9ac;metalness:.9;roughness:.1'},g));
   [-1,1].forEach(s=>E('a-box',{position:`${s*W*.465} 1.08 -.15`,width:.02,height:.38,depth:1.8,material:'color:#9ac;metalness:.9;roughness:.1'},g));}
  [-1,1].forEach(s=>{E('a-box',{position:`${s*.55} .6 ${L/2+.01}`,width:.32,height:.18,depth:.02,material:'color:#fff;emissive:#ffeebb;emissiveIntensity:.8'},g);
   E('a-box',{position:`${s*.6} .6 ${-L/2-.01}`,width:.25,height:.14,depth:.02,material:'color:#c00;emissive:#ff0000;emissiveIntensity:.6'},g);
   [-1,1].forEach(t=>E('a-cylinder',{position:`${s*W/2} .3 ${t*L*.32}`,radius:.3,height:.2,rotation:'0 0 90',color:'#111'},g));});
  E('a-box',{position:`0 .35 ${L/2+.05}`,width:W+.05,height:.12,depth:.1,material:'color:#ccc;metalness:.9'},g);E('a-box',{position:`0 .35 ${-L/2-.05}`,width:W+.05,height:.12,depth:.1,material:'color:#ccc;metalness:.9'},g);
  E('a-box',{position:`0 .5 ${L/2+.07}`,width:.5,height:.12,depth:.01,color:'#e8e0a0'},g);
  const c=Math.cos(ry*Math.PI/180),sn=Math.sin(ry*Math.PI/180),hx=Math.abs(c)*W/2+Math.abs(sn)*L/2,hz=Math.abs(sn)*W/2+Math.abs(c)*L/2;OBSTACLES.push({x0:x-hx,x1:x+hx,z0:z-hz,z1:z+hz});};
 car(1.6,24.1,90,'#d8d2c0');car(6.6,24.1,90,'#2f5fa8',true);car(-11.0,24.0,0,'#8a1e1e');
})();
// ---------- 포차 이모 (조리대 뒤에서 볶는 중) ----------
(async function imo(){const C=window.COOK;const holder=E('a-entity',{position:`${C.x+.4} 0 ${C.z-1.05}`});
 const h=await makeHuman(holder,{outfit:'#d0607a',skin:'#e8b48e',gender:'f',style:'hanbok'});HUMANS.add(h);
 const c=h.chibi,T=c.torso;T.add(new THREE.Mesh(new THREE.BoxGeometry(.3,.42,.02),new THREE.MeshStandardMaterial({color:'#f4f0e6'})));T.children[T.children.length-1].position.set(0,.16,.15);
 const sc=new THREE.Mesh(new THREE.SphereGeometry(.34,16,10,0,Math.PI*2,0,Math.PI*.3),new THREE.MeshStandardMaterial({color:'#e23b4c'}));c.head.add(sc);sc.position.set(0,.2,0);sc.scale.set(1.05,1,1.05);
 const kn=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),sc.material);c.head.add(kn);kn.position.set(0,.22,.3);
 const pan=new THREE.Group();pan.add(new THREE.Mesh(new THREE.CylinderGeometry(.22,.14,.08,16),new THREE.MeshStandardMaterial({color:'#333',metalness:.8,roughness:.3})));
 const fd=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.03,12),new THREE.MeshStandardMaterial({color:'#b8321c'}));fd.position.y=.03;pan.add(fd);
 const hdl=new THREE.Mesh(new THREE.BoxGeometry(.04,.03,.3),pan.children[0].material);hdl.position.set(0,0,-.3);pan.add(hdl);
 const SC=document.querySelector('a-scene');const pw=new THREE.Group();pw.position.set(C.x+.4,1.0,C.z-.3);pw.add(pan);SC.object3D.add(pw);
 E('a-entity',{position:'0 1.75 0',billboard:'',ktext:`value:포차 이모;color:#fff;glow:#ff7a30;size:36;width:1`},holder);
 h.play('Idle_Loop');h.after=(t,c)=>{const f=(t%2.4)/2.4;c.arms.forEach((a,i)=>{a.rotation.x=-1.1+(i?Math.sin(t*6)*.25:0);a.rotation.z=i?.25:-.25;});
  const flip=f>.8?Math.sin((f-.8)/.2*Math.PI):0;pan.position.y=flip*.06;pan.rotation.x=Math.sin(t*6)*.08;fd.position.y=.03+flip*.25;fd.rotation.x=flip*Math.PI;c.head.rotation.x=.25;};
 OBSTACLES.push({x:C.x+.4,z:C.z-1.05,r:.35});})();

// ---------- 통닭 아저씨 / 횟집 아저씨 ----------
async function shopGuy(z,name,outfit,apron,band,kind){const holder=E('a-entity',{position:`13.85 0 ${z}`,rotation:'0 -90 0'});
 const h=await makeHuman(holder,{outfit,skin:'#d9a07a',gender:'m',style:'suit'});HUMANS.add(h);const c=h.chibi,T=c.torso;
 const ap=new THREE.Mesh(new THREE.BoxGeometry(.32,.46,.02),new THREE.MeshStandardMaterial({color:apron,roughness:kind==='hoe'?.25:.8}));T.add(ap);ap.position.set(0,.14,.15);
 const hb=new THREE.Mesh(new THREE.TorusGeometry(.33,.04,6,20),new THREE.MeshStandardMaterial({color:band}));c.head.add(hb);hb.position.set(0,.12,0);hb.rotation.x=Math.PI/2;
 if(kind==='hoe')[-1,1].forEach(s=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.3,10),new THREE.MeshStandardMaterial({color:'#e8e8e0',roughness:.3}));b.position.set(13.85-.0,0.15,z+s*.12);document.querySelector('a-scene').object3D.add(b);});
 const SC=document.querySelector('a-scene').object3D,tool=new THREE.Group();tool.position.set(13.25,1.02,z);SC.add(tool);
 const knife=new THREE.Group();knife.add(new THREE.Mesh(new THREE.BoxGeometry(.03,.01,.22),new THREE.MeshStandardMaterial({color:'#ddd',metalness:.9,roughness:.2})));const kh=new THREE.Mesh(new THREE.BoxGeometry(.03,.025,.1),new THREE.MeshStandardMaterial({color:'#3a2010'}));kh.position.z=-.15;knife.add(kh);
 if(kind==='hoe'){tool.add(new THREE.Mesh(new THREE.BoxGeometry(.4,.04,.6),new THREE.MeshStandardMaterial({color:'#e8dcc0'})));const fish=new THREE.Mesh(new THREE.SphereGeometry(.08,10,8),new THREE.MeshToonMaterial({color:'#c0c8d0'}));fish.scale.set(.7,.5,2.2);fish.position.y=.05;tool.add(fish);
  const sl=new THREE.Mesh(new THREE.BoxGeometry(.08,.012,.04),new THREE.MeshToonMaterial({color:'#f6f2ea'}));sl.position.set(-.1,.03,.2);tool.add(sl);}
 else{const pot=new THREE.Mesh(new THREE.CylinderGeometry(.22,.2,.22,16),new THREE.MeshStandardMaterial({color:'#666',metalness:.8,roughness:.3}));pot.position.y=.11;tool.add(pot);const oil=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.01,16),new THREE.MeshStandardMaterial({color:'#d8a030',emissive:'#804000',emissiveIntensity:.4}));oil.position.y=.2;tool.add(oil);
  const bsk=new THREE.Mesh(new THREE.CylinderGeometry(.13,.12,.12,10,1,true),new THREE.MeshStandardMaterial({color:'#bbb',wireframe:true}));tool.add(bsk);var basket=bsk;
  for(let i=0;i<4;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.04,6,5),new THREE.MeshToonMaterial({color:'#c8801e'}));p.position.set(-.05+i*.03,0,(i%2)*.04-.02);bsk.add(p);}}
 tool.add(knife);knife.visible=kind==='hoe';
 E('a-entity',{position:'0 1.75 0',billboard:'',ktext:`value:${name};color:#fff;glow:${kind==='hoe'?'#30a0ff':'#ff7a30'};size:36;width:1.2`},holder);
 h.play('Idle_Loop');h.after=(t,c)=>{c.head.rotation.x=.3;c.arms.forEach((a,i)=>{a.rotation.z=i?.25:-.25;a.rotation.x=-1.0+(i?0:Math.sin(t*(kind==='hoe'?9:3))*.25);});
  if(kind==='hoe'){const k=Math.abs(Math.sin(t*4.5));knife.position.set(0,.04+k*.06,.1);knife.rotation.x=-k*.3;}
  else{const f=(t%3)/3;basket.position.y=.25-(f<.7?.12:.12-Math.sin((f-.7)/.3*Math.PI)*.15);}};
 OBSTACLES.push({x:13.85,z,r:.35});}
shopGuy(22,'통닭 아저씨','#ececec','#f2f2ea','#ffffff','chicken');shopGuy(15,'횟집 아저씨','#2a4a7a','#2a6ab0','#d02020','hoe');
