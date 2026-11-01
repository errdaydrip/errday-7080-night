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
AFRAME.registerComponent('ktext',{schema:{value:{default:''},color:{default:'#fff'},glow:{default:'#ff3cac'},bg:{default:''},size:{default:48},width:{default:2},font:{default:'"Malgun Gothic",sans-serif'}},
 update(){const d=this.data,c=document.createElement('canvas'),x=c.getContext('2d'),F=`bold ${d.size}px ${d.font}`;x.font=F;
  const w=Math.max(64,x.measureText(d.value).width+d.size),h=d.size*1.7;c.width=w;c.height=h;x.font=F;
  if(d.bg){x.fillStyle=d.bg;x.beginPath();x.roundRect(0,0,w,h,h/3);x.fill();}
  x.textAlign='center';x.textBaseline='middle';x.shadowColor=d.glow||'transparent';x.shadowBlur=d.glow?d.size/3:0;x.fillStyle=d.color;x.fillText(d.value,w/2,h/2);if(d.glow)x.fillText(d.value,w/2,h/2);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const old=this.el.getObject3D('mesh');if(old){old.material.map.dispose();old.geometry.dispose();}
  this.el.setObject3D('mesh',new THREE.Mesh(new THREE.PlaneGeometry(d.width,d.width*h/w),new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.DoubleSide,depthWrite:false})));}});
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
 [['0 4 -12','0 0 0',24],['0 4 12','0 180 0',24],['-12 4 0','0 90 0',24],['12 4 0','0 -90 0',24]].forEach(([p,r,w])=>texMesh(E('a-plane',{position:p,rotation:r,width:w,height:8,material:'roughness:.9'}),TEX.wall()));
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
 const counter=E('a-box',{position:`${X} .6 ${Z}`,width:1,height:1.2,depth:9,material:'roughness:.6'});texMesh(counter,TEX.wood());
 E('a-box',{position:`${X} 1.22 ${Z}`,width:1.25,height:.06,depth:9.2,material:'color:#c9a24a;metalness:.8;roughness:.25'});
 E('a-box',{position:`${X-.51} .15 ${Z}`,width:.02,height:.05,depth:9,material:'color:#ff3cac;emissive:#ff3cac;emissiveIntensity:1'});
 E('a-box',{position:`${X-.51} 1.1 ${Z}`,width:.02,height:.04,depth:9,material:'color:#00e5ff;emissive:#00e5ff;emissiveIntensity:1'});
 // 뒷선반 + 술병
 const back=E('a-box',{position:'11.7 2.2 '+Z,width:.5,height:3.2,depth:9,material:'roughness:.6'});texMesh(back,TEX.wood());
 E('a-box',{position:'11.6 2.2 '+Z,width:.05,height:3,depth:8.8,material:'color:#331100;emissive:#ff9933;emissiveIntensity:.25;metalness:1;roughness:.1'}); // 거울 느낌
 const bt=['wine-red','wine-white','soda-bottle','wine-red','cocktail','glass-wine'];
 for(let s=0;s<3;s++){E('a-box',{position:`11.35 ${1.2+s*.85} ${Z}`,width:.4,height:.04,depth:8.6,material:'color:#c9a24a;metalness:.8'});
  for(let k=0;k<12;k++)prop(bt[(k+s)%bt.length],{pos:[11.35,1.22+s*.85,Z-4+k*.72],scale:.5});}
 for(let k=0;k<6;k++){const sx=X-1.1,sz=Z-3.5+k*1.4,el=prop('stoolBar',{pos:[sx,0,sz],scale:2.2,tint:'#8b0018'});el.dataset.seat='BAR-'+k;el.classList.add('seat');
  SEATS.push({id:'BAR-'+k,table:'BAR',x:sx,z:sz,y:.52,yaw:Math.PI/2,el,stand:[sx-.8,sz]});} // 바 스툴도 좌석 (바 쪽을 봄)
 for(let k=0;k<4;k++)prop(['cocktail','glass-wine'][k%2],{pos:[X,1.25,Z-3+k*2],scale:.35});
 E('a-entity',{position:'11.4 4.3 '+Z,rotation:'0 -90 0',ktext:'value:BAR;color:#fff;glow:#00e5ff;size:90;width:2;font:Georgia,serif'});
 OBSTACLES.push({x0:X-.7,x1:12,z0:Z-4.7,z1:Z+4.7});
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
  prop(['wine-red','cocktail'][ti%2],{pos:[tx+.3,.81,tz+.2],scale:.4});
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
 if(opts.dj){const g=new THREE.Group();g.position.set(0,.28,.3);head.add(g);
  [-1,1].forEach(s=>g.add(mesh(G.cyl(.07,.07,.02,20),new THREE.MeshStandardMaterial({color:'#111',metalness:1,roughness:.1}),[s*.11,0,0],null,[Math.PI/2,0,0])));g.add(mesh(G.box(.08,.015,.01),M.black));
  head.add(mesh(new THREE.TorusGeometry(.4,.025,8,24,Math.PI),M.black,[0,.3,0],null,[0,Math.PI/2,0]));
  [-1,1].forEach(s=>head.add(mesh(G.cyl(.09,.09,.07,20),new THREE.MeshStandardMaterial({color:'#ff3cac',emissive:'#ff3cac',emissiveIntensity:.5}),[s*.37,.25,0],null,[0,0,Math.PI/2])));}
 return {root,hips,torso,head,arms,legs};}
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
 const h={root:c.root,cur:null,play(name){this.cur=name;state=map[name]||'idle';},mixer:{timeScale:1,update(dt){t+=dt*h.mixer.timeScale;animateChibi(c,state,t,opts);}},
  dispose(){holder.object3D.remove(c.root);c.root.traverse(n=>{if(n.isMesh){n.geometry.dispose();}});}};h.play('Idle_Loop');animateChibi(c,'idle',0,opts);return h;};
window.makeChibi=makeChibi;window.animateChibi=animateChibi;
AFRAME.registerComponent('mixers',{tick(t,dt){for(const h of window.HUMANS||[])h.mixer.update(Math.min(dt,50)/1000);}});
window.HUMANS=new Set();
(async function dj(){const holder=E('a-entity',{position:`${DJ_SPOT.x} ${DJ_SPOT.y+.25} ${DJ_SPOT.z}`,scale:'1.15 1.15 1.15'});
 const h=await makeHuman(holder,{outfit:'#8a5bd6',skin:'#e0a77a',gender:'m',dj:true,style:'disco'});HUMANS.add(h);
 AFRAME.registerComponent('dj-state',{tick(){h.play(window.MUSIC_PLAYING?'Dance_Loop':'Idle_Loop');}});holder.setAttribute('dj-state','');})();
document.querySelector('a-scene').setAttribute('mixers','');
