(function(){const S=SPORTS,T=S.T,root=E('a-entity',{id:'sportsWorld'}),groups=new Map(),cube=new THREE.BoxGeometry(1,1,1);
 const box=(x,y,z,w,h,d,c,glow=false)=>{const k=c+glow;if(!groups.has(k))groups.set(k,{c,glow,items:[]});groups.get(k).items.push([x,y,z,w,h,d]);};
 const text=(v,x,y,z,w,c='#7fe8f0',ry=0)=>E('a-entity',{position:`${x} ${y} ${z}`,rotation:`0 ${ry} 0`,ktext:`value:${v};color:#fff;glow:${c};size:64;width:${w}`},root);
 const cx=(T.x0+T.x1)/2,cz=(T.z0+T.z1)/2,depth=T.z1-T.z0,width=T.x1-T.x0;
 const brass='#ba9361',bronze='#57483e',stone='#d2c4af',walnut='#684a37',ink='#172d32',warm='#ffe3aa';
 function lettering(label,x,y,z,width,colour=warm,angle=0){
  return E('a-entity',{position:`${x} ${y} ${z}`,rotation:`0 ${angle} 0`,ktext:`value:${label};color:${colour};glow:#6e593c;size:90;width:${width};font:Georgia,serif`},root);
 }
 function glazing(x,y,z,w,h,rotation=0){
  E('a-box',{position:`${x} ${y} ${z}`,rotation:`0 ${rotation} 0`,width:w,height:h,depth:.04,
   material:'color:#98b6b0;opacity:.32;transparent:true;depthWrite:false;roughness:.12'},root);
 }
 // Polished limestone terrazzo, with fine stone chips and a restrained brass inlay.
 const terrazzo=canvasTex(256,256,(ctx,w,h)=>{
  ctx.fillStyle='#b7aea1';ctx.fillRect(0,0,w,h);
  let seed=19;const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
  for(let i=0;i<1100;i++){
   const x=rand()*w,y=rand()*h,r=.4+rand()*1.5;
   ctx.fillStyle=['#cfc7b7','#877f73','#ebe3d2','#a19b91'][i%4];
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+r*2,y+r*.4);ctx.lineTo(x+r*.5,y+r*1.7);ctx.fill();
  }
  ctx.strokeStyle='#999084';ctx.lineWidth=1;ctx.strokeRect(0,0,w,h);
 },8,16);
 const floor=E('a-plane',{position:`${cx} -.012 ${cz}`,rotation:'-90 0 0',width,height:depth,material:'color:#ffffff;roughness:.38'},root);
 texMesh(floor,terrazzo,{emissiveMap:terrazzo,emissive:new THREE.Color('#ffffff'),emissiveIntensity:.65});
 box(cx,-.11,cz,width,.16,depth,stone);
 box(T.x0,3.5,cz,.2,7,depth,ink);box(T.x1-.1,3.5,cz,.2,7,depth,ink);
 box(cx,3.5,T.z0,width,7,.2,ink);box(cx,7,cz,width,.15,depth,'#27312f');
 // Street-facing glazed bays and the open double door on the nightclub's frontage.
 const front=T.z1,left=S.DOOR.x-S.DOOR.half,right=S.DOOR.x+S.DOOR.half;
 for(const [lo,hi] of [[T.x0,left],[right,T.x1]]){
  const centre=(lo+hi)/2,width=hi-lo;
  box(centre,.28,front,width,.55,.34,stone);
  glazing(centre,1.93,front,width-.15,2.8);
  const bays=Math.ceil(width/1.8);
  for(let i=0;i<=bays;i++)box(lo+.03+(width-.06)*i/bays,1.95,front+.04,.07,3.15,.12,bronze);
  box(centre,3.42,front,width,.1,.16,brass);
 }
 box(cx,5.25,front,width,3.5,.36,stone);
 box(cx,5.65,front+.22,16.5,1.88,.12,ink);
 box(cx,6.65,front+.21,17.6,.07,.15,brass);
 lettering('ERRDAY SPORTS',cx,5.72,front+.32,12.6);
 lettering('A T H L E T I C    C L U B',cx,4.96,front+.33,5.7,'#ddd0b7');
 box(cx,3.69,front+.65,18.25,.24,1.55,bronze);
 box(cx,3.58,front+1.39,18.1,.045,.055,warm,true);
 for(const x of [T.x0+.35,T.x1-.35]){
  box(x,3.2,front+.19,.62,6.4,.6,stone);
  for(const dx of [-.2,-.1,0,.1,.2])box(x+dx,3.18,front+.51,.032,6.15,.04,brass);
 }
 for(const side of [-1,1]){
  const hinge=S.DOOR.x+side*S.DOOR.half;
  glazing(hinge,1.55,front-.97,1.94,3.05,side*90);
  box(hinge,1.53,front,.065,3.06,.09,brass);
  box(hinge,3.08,front-.96,.055,.045,1.94,brass);
  box(hinge,.05,front-.96,.055,.045,1.94,brass);
  box(hinge-side*.06,1.3,front-1.68,.04,.56,.055,brass);
 }
 // Paired evergreen planters frame the glazing without narrowing the doorway.
 for(const x of [T.x0+.95,T.x1-.65]){
  box(x,.35,front+.66,.68,.7,.68,bronze);
  box(x,.71,front+.66,.72,.055,.72,brass);
  box(x,.97,front+.66,.11,.55,.11,walnut);
  E('a-sphere',{position:`${x} 1.51 ${front+.66}`,radius:.43,scale:'1 1.35 1',
   'segments-width':10,'segments-height':7,material:'color:#36584a;emissive:#263e2c;emissiveIntensity:.45;flatShading:true'},root);
 }
 // The shared forecourt runs all the way to the nightclub sidewalk.
 box(-20.9,-.035,15.12,19.7,.065,6.22,'#a59b8b');
 for(let x=T.x0;x<-11.2;x+=1.5)box(x,.002,15.12,.018,.008,6.1,'#81786b');
 for(const z of [13.55,15.1,16.65])box(-20.9,.002,z,19.7,.008,.018,'#81786b');
 const desk=S.reception;
 box(desk.x,.52,desk.z,desk.width,1.04,desk.depth,walnut);
 box(desk.x,1.08,desk.z,desk.width+.1,.11,desk.depth+.1,stone);
 for(let i=0;i<14;i++)box(desk.x-.99+i*.15,.52,desk.z+.55,.055,.9,.03,bronze);
 lettering('RECEPTION',desk.x,1.65,desk.z,2.3);
 lettering('EXIT',S.DOOR.x,3.22,front-.18,1.65,warm,180);
 for(const x of [T.x0+.19,T.x1-.19]){
  box(x,1.05,cz,.17,2.1,depth-.45,walnut);
  box(x,2.12,cz,.19,.045,depth-.45,brass);
  for(let z=T.z0+.6;z<front-.4;z+=.32)box(x+(x<cx?.10:-.10),1.04,z,.045,2.0,.045,bronze);
 }
 for(let z=T.z0+2;z<front;z+=4){
  box(cx,6.85,z,16,.15,.26,walnut);box(cx,6.76,z,14.8,.035,.045,warm,true);
 }
 for(const x of [-20.35,-19.9])box(x,.002,cz,.025,.01,depth-1.1,brass);
 lettering('THE PLAYING HALL',cx,4.25,T.z0+.2,11.5);
 lettering('E R R D A Y     /     S P O R T S',cx,3.26,T.z0+.22,6,'#d5ccbb');
 for(const f of S.facilities){const g=S.GAMES[f.game],b=f.box;box(f.x,.012,f.z,b.x1-b.x0,.025,b.z1-b.z0,f.game==='bowling'?'#ad8a5a':f.game==='billiards'?'#192d3c':f.game==='tennis'?'#244f75':'#2c6d50');
  const plateX=f.spot.x,plateZ=f.spot.z-.42;
  box(plateX,.72,plateZ,.75,1.44,.08,ink);box(plateX,1.42,plateZ+.05,.72,.025,.035,brass);
  lettering(f.id.replace('SP-',''),plateX,1.19,plateZ+.055,.62);
  text(g.name,plateX,.86,plateZ+.06,.64,'');
  if(f.game==='bowling'){
   box(f.x,.05,f.z,2.3,.08,15,'#cead74');for(const dx of [-1.3,1.3])box(f.x+dx,.08,f.z,.2,.16,15,'#344152');for(let i=0;i<7;i++)box(f.x-1+i*.33,.097,f.z,.012,.015,14.5,'#a38459');
   for(let r=0;r<4;r++)for(let i=0;i<=r;i++){const x=f.x+(i-r/2)*.38,z=f.z-5.3-r*.43;box(x,.24,z,.15,.4,.15,'#eff6fb');box(x,.47,z,.1,.15,.1,'#eff6fb');box(x,.43,z,.11,.045,.11,'#ff729a');}
   box(f.x,2.2,b.z0,2.5,1.3,.15,'#101e34');text('10 PIN',f.x,2.3,b.z0+.11,2,'#78dfff');box(f.x,1.05,b.z1+.65,1,.25,.45,'#15263c');
  }else if(f.game==='billiards'){
   box(f.x,.85,f.z,4.8,.3,3,'#514334');box(f.x,1.02,f.z,4.35,.04,2.55,'#248d73');for(const dx of [-2.2,2.2])for(const dz of [-1.3,1.3])box(f.x+dx,.4,f.z+dz,.18,.8,.18,'#24323b');for(let i=0;i<7;i++)E('a-sphere',{position:`${f.x+(i%3-1)*.16} 1.1 ${f.z+Math.floor(i/3)*.15}`,radius:.07,'segments-width':8,'segments-height':6,color:['#fff','#f8d76a','#f6a6a8','#739fef'][i%4]},root);
  }else{
   const c='#d7f0e8',w=b.x1-b.x0,d=b.z1-b.z0;for(const dx of [-w/2+.12,w/2-.12])box(f.x+dx,.035,f.z,.04,.02,d-.24,c);for(const dz of [-d/2+.12,d/2-.12,0])box(f.x,.035,f.z+dz,w-.24,.02,.04,c);
   if(f.game==='tennis'){box(f.x,.65,f.z,w,.03,.04,'#d8ecf5');for(let i=0;i<16;i++)box(b.x0+.1+i*w/16,.35,f.z,.018,.6,.025,'#aecbd2');for(const dz of [-2,2])box(f.x,.04,f.z+dz,w,.02,.03,c);}
   else{for(const side of [-1,1]){const x=f.x+side*(w/2-.2);for(let i=0;i<12;i++)box(x,.7,f.z-1.2+i*.22,.025,1.35,.018,'#9bbeb8');for(let y=.2;y<1.4;y+=.22)box(x,y,f.z,.025,.018,2.4,'#9bbeb8');box(x,.7,f.z-1.25,.07,1.4,.07,'#d6eff4');box(x,.7,f.z+1.25,.07,1.4,.07,'#d6eff4');box(x,1.4,f.z,.07,.07,2.5,'#d6eff4');}E('a-sphere',{position:`${f.x} .14 ${f.z}`,radius:.13,'segments-width':12,'segments-height':8,color:'#edf5e9'},root);}
  }
 }
 for(const [index,v] of S.vacancies.entries()){
  box(v.x,1.6,v.z,6,3.2,3.8,walnut);
  box(v.x-3.04,1.45,v.z,.045,2.65,2.65,ink);
  box(v.x-3.08,2.82,v.z,.035,.03,2.75,brass);
  lettering('S U I T E   0'+(index+1),v.x-3.09,2.35,v.z,2.25,warm,-90);
  text(v.name,v.x-3.1,1.65,v.z,2.05,'',-90);
 }
 const lastSuite=S.vacancies[S.vacancies.length-1];
 lettering('CLUB STUDIOS',lastSuite.x,2.07,lastSuite.z+1.93,4.6);
 lettering('I   ·   I I   ·   I I I',lastSuite.x,1.3,lastSuite.z+1.94,2.1,'#d0be9d');
 const dummy=new THREE.Object3D();for(const {c,glow,items} of groups.values()){const material=glow?new THREE.MeshBasicMaterial({color:c}):new THREE.MeshStandardMaterial({color:c,roughness:.8,emissive:c,emissiveIntensity:.55}),mesh=new THREE.InstancedMesh(cube,material,items.length);items.forEach(([x,y,z,w,h,d],i)=>{dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});root.object3D.add(mesh);}
 OBSTACLES.push(...S.obstacles);
})();
