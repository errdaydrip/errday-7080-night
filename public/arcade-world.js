// Modern arcade: static cabinet parts are batched to keep rendering light.
(function(){
 const A=ARCADE,T=A.T,root=E('a-entity',{id:'arcadeWorld'}),batches=new Map();
 const box=(x,y,z,w,h,d,c,glow=false,ry=0)=>{const key=c+glow;if(!batches.has(key))batches.set(key,{c,glow,list:[]});batches.get(key).list.push({x,y,z,w,h,d,ry});};
 const text=(value,x,y,z,width,colour='#64f5eb',ry=0)=>E('a-entity',{position:`${x} ${y} ${z}`,rotation:`0 ${ry} 0`,ktext:`value:${value};color:#fff;glow:${colour};size:64;width:${width}`},root);
 const cx=(T.x0+T.x1)/2,cz=(T.z0+T.z1)/2,depth=T.z1-T.z0;
 box(cx,-.08,cz,T.x1-T.x0,.16,depth,'#334862');
 box(T.x0,3.1,cz,.2,6.2,depth,'#526b84');box(T.x1,3.1,cz,.2,6.2,depth,'#526b84');box(cx,3.1,T.z1,T.x1-T.x0,6.2,.2,'#526b84');
 box(cx,6.2,cz,T.x1-T.x0,.14,depth,'#111a30');
 // A wide glass entrance across from the red car, next to the roller rink.
 for(const [l,r] of [[T.x0,A.DOOR.x-A.DOOR.half],[A.DOOR.x+A.DOOR.half,T.x1]]){
  box((l+r)/2,1.5,T.z0,r-l,3,.18,'#263047');box((l+r)/2,1.45,T.z0-.11,r-l-.16,2.5,.025,'#314863');
  for(let x=l+.35;x<r;x+=1.1)box(x,1.4,T.z0-.14,.025,2.6,.03,'#71e9f3',true);
 }
 box(cx,4.6,T.z0,T.x1-T.x0,3.2,.25,'#171d34');box(cx,5.95,T.z0-.2,T.x1-T.x0,.055,.08,'#ff64ba',true);
 box(cx,3.17,T.z0-.3,T.x1-T.x0,.06,.06,'#62f9e5',true);
 text('ERRDAY ARCADE',cx,4.8,T.z0-.23,15,'#74fbea',180);
 text('PLAY · WIN · REPEAT',cx,3.82,T.z0-.24,7,'#bb9cff',180);
 for(const side of [-1,1]){
  const glass=E('a-box',{position:`${A.DOOR.x+side*2} 1.45 ${T.z0+.9}`,rotation:`0 ${side*85} 0`,width:1.9,height:2.85,depth:.035,material:'color:#acf9ff;opacity:.18;transparent:true;roughness:.1;depthWrite:false'},root);
  box(A.DOOR.x+side*2,1.5,T.z0,.06,3,.1,'#74fbea',true);
 }
 text('WELCOME / 입장',A.DOOR.x,3.35,T.z0-.4,3.7,'#74fbea',180);
 text('EXIT',A.DOOR.x,2.9,T.z0+.25,2,'#74fbea');
 text('LEVEL UP YOUR DAY',cx,4.7,T.z1-.15,14,'#af9dff',180);
 text('TABLE SPORTS',cx,3.8,48.5,8,'#64f5eb',180);
 // Floor lanes, wall panels, and bright architectural LED strips.
 for(let z=31;z<T.z1;z+=2){box(cx,.006,z,17,.012,.025,'#394364');box(cx,5.96,z,15,.025,.055,'#e5f5ff',true);}
 for(const x of [-18.6,-10.8,-6.2])box(x,.02,38.5,.035,.025,13,'#69eade',true);
 for(const x of [T.x0+.12,T.x1-.12]){box(x,1,cz,.025,.035,21,'#b991ff',true);box(x,3.4,cz,.025,.035,21,'#60e9ed',true);}
 const screenTextures={};
 function screenTexture(kind){if(screenTextures[kind])return screenTextures[kind];const g=A.GAMES[kind];return screenTextures[kind]=canvasTex(256,256,(c,w,h)=>{
  c.fillStyle='#080e24';c.fillRect(0,0,w,h);c.strokeStyle=g.colour;c.lineWidth=4;c.strokeRect(8,8,w-16,h-16);c.fillStyle=g.colour;c.font='bold 22px sans-serif';c.textAlign='center';c.fillText(g.subtitle.split(' · ')[0],w/2,38);
  if(kind==='blocks'){for(let i=0;i<24;i++){c.fillStyle=['#a786ff','#51e8ee','#ff75bc'][i%3];c.fillRect(40+i%6*28,185-Math.floor(i/6)*27,24,23);}}
  else if(kind==='shooter'){for(let i=0;i<15;i++){c.fillStyle=i%2?'#ff70bb':'#69f5dd';c.fillRect(40+i%5*38,65+Math.floor(i/5)*32,23,15);}c.fillStyle='#fff';c.beginPath();c.moveTo(128,168);c.lineTo(114,191);c.lineTo(142,191);c.fill();}
  else{c.strokeStyle=g.colour;c.lineWidth=8;c.beginPath();c.arc(128,126,48,0,Math.PI*2);c.stroke();c.fillStyle='#fff';c.font='bold 46px sans-serif';c.fillText(kind==='racer'?'GO':kind==='hoops'?'02':kind==='reflex'?'9':'★',128,144);}
  c.fillStyle='#fff';c.font='bold 16px sans-serif';c.fillText('PRESS PLAY',128,236);
 },1,1);}
 const screenGeo=new THREE.PlaneGeometry(.98,.98);
 for(const m of A.machines){
  const g=A.GAMES[m.game];
  if(m.game==='pingpong'||m.game==='hockey'){
   box(m.x,.74,m.z,3,.18,3.6,'#17233a');box(m.x,.86,m.z,2.85,.06,3.5,m.game==='pingpong'?'#286ead':'#dfedf3',m.game==='hockey');
   for(const dx of [-1.3,1.3])for(const dz of [-1.5,1.5])box(m.x+dx,.36,m.z+dz,.12,.72,.12,'#28324a');
   box(m.x,.91,m.z,.025,.02,3.4,'#ffffff',true);
   if(m.game==='pingpong'){box(m.x,1.02,m.z,2.9,.25,.025,'#b9edf0');for(let i=0;i<15;i++)box(m.x-1.4+i*.2,1.03,m.z,.012,.25,.03,'#ffffff');}
   else{for(const dx of [-1.47,1.47])box(m.x+dx,.98,m.z,.08,.18,3.6,g.colour,true);for(const dz of [-1.78,1.78])box(m.x,.98,m.z+dz,3,.18,.08,g.colour,true);for(const dz of [-1.25,1.25]){box(m.x,.99,m.z+dz,.3,.1,.3,'#ff5798',true);}}
   text(g.name,m.x,2.25,m.z,3.7,g.colour,180);text('VS COMPUTER',m.x,1.75,m.z,2.7,g.colour,180);continue;
  }
  // Cabinet dimensions are symmetric; screen and controls face the central aisle.
  box(m.x,.66,m.z,1.25,1.32,1.5,'#273f5b');box(m.x,1.7,m.z,1.15,.85,1.4,'#405674');box(m.x,2.35,m.z,1.3,.35,1.5,g.colour,true);
  const facing=m.yaw>0?1:-1;
  box(m.x+facing*.61,1.04,m.z,.4,.12,1.35,'#263852');box(m.x+facing*.83,1.16,m.z-.3,.07,.2,.07,g.colour,true);
  for(let k=0;k<3;k++)box(m.x+facing*.82,1.12,m.z+.05+k*.21,.1,.045,.1,k%2?'#ff7cbb':'#67f7e9',true);
  if(m.game==='ddr'){box(m.x+facing*1.8,.06,m.z,1.7,.12,1.7,'#172844');for(const [dx,dz] of [[0,-.5],[0,.5],[-.5,0],[.5,0]])box(m.x+facing*1.8+dx,.14,m.z+dz,.43,.04,.43,g.colour,true);}
  for(const dz of [-.68,.68])box(m.x+facing*.66,1.6,m.z+dz,.04,1.6,.04,g.colour,true);
  const panel=E('a-entity',{position:`${m.x+facing*.6} 1.72 ${m.z}`,rotation:`0 ${m.yaw*180/Math.PI} 0`},root);
  panel.setObject3D('mesh',new THREE.Mesh(screenGeo,new THREE.MeshBasicMaterial({map:screenTexture(m.game)})));
  text(g.name,m.x+facing*.67,2.36,m.z,1.25,g.colour,m.yaw*180/Math.PI);
 }
 // One draw call per cabinet colour, rather than one per decorative part.
 const cube=new THREE.BoxGeometry(1,1,1),dummy=new THREE.Object3D();
 for(const {c,glow,list} of batches.values()){
  const material=glow?new THREE.MeshBasicMaterial({color:c}):new THREE.MeshStandardMaterial({color:c,roughness:.75,emissive:c,emissiveIntensity:.65});const mesh=new THREE.InstancedMesh(cube,material,list.length);
  list.forEach((q,i)=>{dummy.position.set(q.x,q.y,q.z);dummy.scale.set(q.w,q.h,q.d);dummy.rotation.set(0,q.ry,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});root.object3D.add(mesh);
 }
 OBSTACLES.push(...A.obstacles);
})();
