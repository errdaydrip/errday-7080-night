// Compact casino-style arcade: static cabinet parts are batched to keep rendering light.
(function(){
 const A=ARCADE,T=A.T,root=E('a-entity',{id:'arcadeWorld'}),batches=new Map();
 const box=(x,y,z,w,h,d,c,glow=false,ry=0)=>{const key=c+glow;if(!batches.has(key))batches.set(key,{c,glow,list:[]});batches.get(key).list.push({x,y,z,w,h,d,ry});};
 const text=(value,x,y,z,width,colour='#b68c52',ry=0)=>E('a-entity',{position:`${x} ${y} ${z}`,rotation:`0 ${ry} 0`,ktext:`value:${value};color:#fff;glow:${colour};size:64;width:${width}`},root);
 const cx=(T.x0+T.x1)/2,cz=(T.z0+T.z1)/2,depth=T.z1-T.z0;
 box(cx,-.08,cz,T.x1-T.x0,.16,depth,'#26171f');
 box(T.x0,3.1,cz,.2,6.2,depth,'#19171d');box(T.x1,3.1,cz,.2,6.2,depth,'#19171d');box(cx,3.1,T.z1,T.x1-T.x0,6.2,.2,'#19171d');
 box(cx,6.2,cz,T.x1-T.x0,.14,depth,'#110e14');
 // A wide glass entrance across from the red car, next to the roller rink.
 for(const [l,r] of [[T.x0,A.DOOR.x-A.DOOR.half],[A.DOOR.x+A.DOOR.half,T.x1]]){
  box((l+r)/2,1.5,T.z0,r-l,3,.18,'#201820');box((l+r)/2,1.45,T.z0-.11,r-l-.16,2.5,.025,'#301c26');
  for(let x=l+.35;x<r;x+=1.1)box(x,1.4,T.z0-.14,.025,2.6,.03,'#bd965d',true);
 }
 box(cx,4.6,T.z0,T.x1-T.x0,3.2,.25,'#120f15');box(cx,5.95,T.z0-.2,T.x1-T.x0,.055,.08,'#aa834f',true);
 box(cx,3.17,T.z0-.3,T.x1-T.x0,.06,.06,'#d3ae70',true);
 text('ERRDAY ARCADE',cx,4.8,T.z0-.23,8.3,'#c2a16c',180);
 text('PLAY · WIN · REPEAT',cx,3.82,T.z0-.24,5.2,'#997a55',180);
 for(const side of [-1,1]){
  const glass=E('a-box',{position:`${A.DOOR.x+side*2} 1.45 ${T.z0+.9}`,rotation:`0 ${side*85} 0`,width:1.9,height:2.85,depth:.035,material:'color:#acf9ff;opacity:.18;transparent:true;roughness:.1;depthWrite:false'},root);
  box(A.DOOR.x+side*2,1.5,T.z0,.06,3,.1,'#c7a366',true);
 }
 text('WELCOME / 입장',A.DOOR.x,3.35,T.z0-.4,3.7,'#c7a366',180);
 text('EXIT',A.DOOR.x,2.9,T.z0+.25,2,'#c7a366');
 text('THE ARCADE LOUNGE',cx,5.55,T.z1-.15,7.6,'#b99560',180);
 text('PLAY · SCORE · RANK',cx,5.15,47.8,5.6,'#b99560',180);
 // Burgundy patterned carpet, brass wall mouldings and warm ceiling fixtures.
 const carpet=canvasTex(256,256,(c,w,h)=>{
  c.fillStyle='#26151e';c.fillRect(0,0,w,h);
  c.strokeStyle='#5d3c37';c.lineWidth=1;
  for(let y=-64;y<320;y+=64)for(let x=-64;x<320;x+=64){
   c.beginPath();c.moveTo(x+32,y);c.lineTo(x+64,y+32);c.lineTo(x+32,y+64);c.lineTo(x,y+32);c.closePath();c.stroke();
   c.fillStyle='#9e7950';c.fillRect(x+30,y+30,3,3);
  }
 },6,16);
 const carpetPlane=E('a-plane',{position:`${cx} .006 ${cz}`,rotation:'-90 0 0',width:T.x1-T.x0-.35,height:depth-.35,material:'roughness:1'},root);
 texMesh(carpetPlane,carpet,{emissiveMap:carpet,emissive:new THREE.Color('#ffffff'),emissiveIntensity:.25});
 for(let z=31;z<T.z1;z+=4){
  box(cx,5.96,z,T.x1-T.x0-1,.035,.065,'#b18b56',true);
  for(const x of [T.x0+.18,T.x1-.18]){
   box(x,3.1,z,.035,3.1,.045,'#9d7a4d');
   box(x,4.64,z+1.6,.035,.045,3.2,'#9d7a4d');
  }
 }
 for(const x of [T.x0+.14,T.x1-.14]){
  box(x,1,cz,.045,.045,depth-1,'#b99560');box(x,4.68,cz,.045,.06,depth-1,'#b99560');
 }
 for(const z of [35.5,42,49]){
  box(cx,5.5,z,.07,.9,.07,'#ac8755');
  E('a-torus',{position:`${cx} 5.08 ${z}`,rotation:'90 0 0',radius:.55,'radius-tubular':.025,'segments-tubular':20,'segments-radial':6,material:'color:#d7b47c;shader:flat'},root);
  for(const dx of [-.4,0,.4])E('a-sphere',{position:`${cx+dx} 5.04 ${z}`,radius:.085,'segments-width':8,'segments-height':6,material:'shader:flat;color:#ffe0a5'},root);
 }
 const rankTextures=new Map();
 function rankTexture(game){
  if(rankTextures.has(game))return rankTextures.get(game);
  const canvas=document.createElement('canvas');canvas.width=576;canvas.height=720;
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;
  const board={canvas,texture,last:null};rankTextures.set(game,board);return board;
 }
 function drawRanking(game,rows){
  const board=rankTexture(game),list=Array.isArray(rows)?rows.slice(0,6):[],key=JSON.stringify(list);
  if(board.last===key)return;board.last=key;
  const c=board.canvas.getContext('2d');
  c.fillStyle='#100d12';c.fillRect(0,0,576,720);
  c.strokeStyle='#b7975b';c.lineWidth=4;c.strokeRect(10,10,556,700);
  c.textAlign='center';c.fillStyle='#ead3a0';c.font='bold 42px sans-serif';c.fillText('TOP 6',288,65);
  c.font='bold 30px sans-serif';c.fillText(A.GAMES[game].name,288,112);
  for(let i=0;i<6;i++){
   const row=list[i],y=145+i*86;
   c.fillStyle=i%2?'#1e1820':'#17131b';c.fillRect(22,y,532,77);
   c.fillStyle=['#f3d584','#cfd7df','#cb9974'][i]||'#c0b7aa';
   c.textAlign='left';c.font='bold 34px sans-serif';c.fillText(String(i+1),38,y+48);
   let nick=row?.nick||'기록 대기';c.font='28px sans-serif';
   while(nick.length>1&&c.measureText(nick).width>230)nick=nick.slice(0,-2)+'…';
   c.fillText(nick,100,y+47);
   c.textAlign='right';c.font='bold 29px sans-serif';c.fillStyle='#efe4cc';
   c.fillText(row?row.score.toLocaleString('ko-KR'):'—',532,y+47);
  }
  c.fillStyle='#ad9572';c.textAlign='center';c.font='21px sans-serif';c.fillText('PERSONAL BEST / SHARED RANK',288,694);
  board.texture.needsUpdate=true;
 }
 window.setArcadeRankings=rankings=>{
  for(const game of Object.keys(A.GAMES))drawRanking(game,rankings?.[game]);
 };
 function rankingBoard(machine){
  const table=machine.game==='pingpong'||machine.game==='hockey';
  const width=table?2:1.4,height=width*1.25;
  const facing=machine.yaw>0?1:-1;
  const x=table?machine.x:machine.x+facing*.72;
  const y=table?3.9:3.65,z=table?machine.z+1.2:machine.z;
  if(table){
   box(x,y,z,width+.1,height+.1,.06,'#100d12');
   for(const side of [-1,1]){box(x+side*width/2,y,z-.04,.035,height,.025,'#bb995f');box(x,y+side*height/2,z-.04,width,.035,.025,'#bb995f');}
  }else{
   box(x-facing*.025,y,z,.06,height+.1,width+.1,'#100d12');
   for(const side of [-1,1]){box(x+facing*.025,y,z+side*width/2,.025,height,.035,'#bb995f');box(x+facing*.025,y+side*height/2,z,.025,.035,width,'#bb995f');}
  }
  const entity=E('a-entity',{id:'rank-'+machine.id,position:`${x+(table?0:facing*.055)} ${y} ${z-(table?.055:0)}`,rotation:`0 ${table?180:machine.yaw*180/Math.PI} 0`},root);
  entity.setObject3D('mesh',new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:rankTexture(machine.game).texture,toneMapped:false})));
 }
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
  rankingBoard(m);
  if(m.game==='pingpong'||m.game==='hockey'){
   box(m.x,.74,m.z,3,.18,3.6,'#1a131a');box(m.x,.86,m.z,2.85,.06,3.5,m.game==='pingpong'?'#174a3b':'#5b253c',false);
   for(const dx of [-1.3,1.3])for(const dz of [-1.5,1.5])box(m.x+dx,.36,m.z+dz,.12,.72,.12,'#28324a');
   box(m.x,.91,m.z,.025,.02,3.4,'#ffffff',true);
   if(m.game==='pingpong'){box(m.x,1.02,m.z,2.9,.25,.025,'#b9edf0');for(let i=0;i<15;i++)box(m.x-1.4+i*.2,1.03,m.z,.012,.25,.03,'#ffffff');}
   else{for(const dx of [-1.47,1.47])box(m.x+dx,.98,m.z,.08,.18,3.6,'#aa8654',true);for(const dz of [-1.78,1.78])box(m.x,.98,m.z+dz,3,.18,.08,'#aa8654',true);for(const dz of [-1.25,1.25]){E('a-cylinder',{position:`${m.x} .99 ${m.z+dz}`,radius:.24,height:.12,material:`color:${dz<0?'#ff5798':'#5496eb'};roughness:.35`},root);E('a-cylinder',{position:`${m.x} 1.08 ${m.z+dz}`,radius:.12,height:.12,color:'#e8d9c4'},root);}}
   text(g.name,m.x,2.25,m.z,3.7,g.colour,180);text(m.game==='hockey'?'PRACTICE / 1 vs 1':'VS COMPUTER',m.x,1.75,m.z,2.7,g.colour,180);continue;
  }
  // Cabinet dimensions are symmetric; screen and controls face the central aisle.
  box(m.x,.66,m.z,1.25,1.32,1.5,'#171419');box(m.x,1.7,m.z,1.15,.85,1.4,'#2a1b25');box(m.x,2.35,m.z,1.3,.35,1.5,'#241922');
  const facing=m.yaw>0?1:-1;
  box(m.x+facing*.61,1.04,m.z,.4,.12,1.35,'#29352e');box(m.x+facing*.83,1.16,m.z-.3,.07,.2,.07,g.colour,true);
  for(let k=0;k<3;k++)box(m.x+facing*.82,1.12,m.z+.05+k*.21,.1,.045,.1,k%2?'#ff7cbb':'#67f7e9',true);
  if(m.game==='ddr'){box(m.x+facing*1.8,.06,m.z,1.7,.12,1.7,'#172844');for(const [dx,dz] of [[0,-.5],[0,.5],[-.5,0],[.5,0]])box(m.x+facing*1.8+dx,.14,m.z+dz,.43,.04,.43,g.colour,true);}
  for(const dz of [-.68,.68])box(m.x+facing*.66,1.6,m.z+dz,.04,1.6,.04,'#ab8756',true);
  const panel=E('a-entity',{position:`${m.x+facing*.6} 1.72 ${m.z}`,rotation:`0 ${m.yaw*180/Math.PI} 0`},root);
  panel.setObject3D('mesh',new THREE.Mesh(screenGeo,new THREE.MeshBasicMaterial({map:screenTexture(m.game)})));
  text(g.name,m.x+facing*.67,2.36,m.z,1.25,'#b99560',m.yaw*180/Math.PI);
 }
 // One draw call per cabinet colour, rather than one per decorative part.
 const cube=new THREE.BoxGeometry(1,1,1),dummy=new THREE.Object3D();
 for(const {c,glow,list} of batches.values()){
  const material=glow?new THREE.MeshBasicMaterial({color:c}):new THREE.MeshStandardMaterial({color:c,roughness:.75,emissive:c,emissiveIntensity:.28});const mesh=new THREE.InstancedMesh(cube,material,list.length);
  list.forEach((q,i)=>{dummy.position.set(q.x,q.y,q.z);dummy.scale.set(q.w,q.h,q.d);dummy.rotation.set(0,q.ry,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});root.object3D.add(mesh);
 }
 window.setArcadeRankings(window.ARCADE_RANKINGS);
 OBSTACLES.push(...A.obstacles);
})();
