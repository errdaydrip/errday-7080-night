// 1980s Korean roller rink. Skates are chosen on entry.
AFRAME.registerComponent('roller-sparkle',{
  schema:{phase:{default:0}},
  tick(t){const mesh=this.el.getObject3D('mesh');if(!mesh)return;const v=.35+.65*Math.max(0,Math.sin(t/230+this.data.phase*1.7));mesh.material.color.setRGB(v,v,Math.min(1,v+.12));}
});
(function buildRollerRink() {
  const R=ROLLER;
  const box=(parent,x,y,z,w,h,d,color,glow=false) => E('a-box',{
    position:`${x} ${y} ${z}`,width:w,height:h,depth:d,
    material:`color:${color};roughness:.65${glow?`;emissive:${color};emissiveIntensity:.8`:''}`
  },parent);
  const sign=(parent,text,x,y,z,width,color='#ff69b4') => {
    const el=E('a-entity',{position:`${x} ${y} ${z}`,ktext:`value:${text};color:#fff9e8;glow:${color};size:64;width:${width}`},parent);
    el.addEventListener('loaded',()=>{const mesh=el.getObject3D('mesh');if(mesh)mesh.material.side=THREE.FrontSide;});
    return el;
  };
  const hall=E('a-entity',{id:'rollerWorld',position:`${R.OFFSET.x} 0 ${R.OFFSET.z}`});
  const entrance=E('a-entity',{position:'0 0 48',rotation:'0 180 0'},hall);
  // A single-storey facade with a real opening and hinged glass doors.
  [-1,1].forEach(side=>{
    box(entrance,side*7.1,3,0,9.8,6,.2,'#101426');
    box(entrance,side*7.1,1.1,.12,9.8,.6,.04,'#31132e');
    box(entrance,side*2.2,1.5,.12,.08,3,.12,'#3be9ef',true);
  });
  box(entrance,0,4.5,0,4.4,3,.2,'#101426');
  box(entrance,0,3.4,.45,8,.18,1.3,'#242638');
  box(entrance,0,3.53,1.05,8,.05,.05,'#ff3cac',true);
  sign(entrance,'추억의 롤라장',0,4.55,.2,7.5);
  sign(entrance,'ERRDAY ROLLER RINK',0,3.9,.2,4.2,'#39e1d1');
  const glassDoors=[-1,1].map(side=>{
    const hinge=E('a-entity',{position:`${side*2.2} 0 .05`},entrance);
    const centre=-side*1.1;
    E('a-box',{position:`${centre} 1.45 0`,width:2.1,height:2.85,depth:.035,
      material:'color:#91dce6;opacity:.16;transparent:true;metalness:.1;roughness:.08;depthWrite:false;side:double'},hinge);
    box(hinge,centre,2.9,0,2.2,.04,.07,'#b2c9d6');
    box(hinge,centre,.03,0,2.2,.04,.07,'#b2c9d6');
    box(hinge,0,1.45,0,.045,2.9,.07,'#b2c9d6');
    box(hinge,-side*2.2,1.45,0,.045,2.9,.07,'#b2c9d6');
    box(hinge,-side*1.95,1.35,.07,.035,.48,.04,'#eefbff');
    return {hinge,side};
  });
  const closed=sign(entrance,'CLOSED',0,1.7,.14,2.7,'#ff4444');
  window.setRollerDoorVis=(open,showClosed=!open)=>{
    glassDoors.forEach(({hinge,side})=>hinge.setAttribute('rotation',`0 ${open?side*100:0} 0`));
    closed.setAttribute('visible',showClosed);
  };
  window.setRollerDoorVis(true);
  box(hall,0,-.08,59,24,.16,22,'#1c1122');
  const wood=canvasTex(512,512,(c,w,h)=>{
    c.fillStyle='#20151f';c.fillRect(0,0,w,h);
    for(let r=0;r<16;r++){
      c.fillStyle=r%2?'#2b1c28':'#30202d';c.fillRect(0,r*32,w,30);
      c.strokeStyle='#130d16';c.lineWidth=1;
      for(let x=(r%2)*85;x<w;x+=170)c.strokeRect(x,r*32,170,32);
    }
  },6,6);
  texMesh(E('a-plane',{position:'0 .006 59',rotation:'-90 0 0',width:23.5,height:21.5,material:'roughness:.4'},hall),wood);
  [[-12,59,.2,22],[12,59,.2,22],[0,70,24,.2]].forEach(([x,z,w,d])=>{
    box(hall,x,3,z,w,6,d,'#090b19');
    box(hall,x,1.1,z,w,.7,d+.015,'#341027');
    box(hall,x,2.05,z,w,.045,d+.025,'#ffbd68',true);
  });
  box(hall,0,6,59,24,.14,22,'#050713');
  sign(hall,'ERRDAY ROLLER RINK',0,4.9,69.8,9).setAttribute('rotation','0 180 0');
  sign(hall,'EXIT',0,3.3,48.25,3.6,'#39e1d1');

  // Oval track markings, low enough to remain walkable across the whole rink.
  [1,.76].forEach(scale=>{
    E('a-ring',{position:'-1 .018 59',rotation:'-90 0 0',scale:`${8.5*scale} ${7.8*scale} 1`,
      'radius-inner':.985,'radius-outer':1,material:'shader:flat;color:#38dce9;side:double','segments-theta':80},hall);
  });
  // A staffed snack corner and three dining tables, with the same seats and serving rules as the pocha.
  box(hall,8.5,.5,49.4,5,1,1,'#46263c');
  box(hall,8.5,1.04,49.4,5.2,.08,1.2,'#bf9a69');
  box(hall,8.5,.85,49.96,4.5,.05,.025,'#39e1d1',true);
  sign(hall,'매점 · 컵라면 / 사이다',8.5,2.6,49.95,4.3,'#ffe184');
  for(let i=0;i<5;i++){
    const cup=makeItem('ramen');cup.position.set(6.8+i*.36,1.1,49.4);cup.scale.setScalar(1.35);hall.object3D.add(cup);
    const bottle=makeItem('cider');bottle.position.set(9+i*.3,1.1,49.4);bottle.scale.setScalar(1.5);hall.object3D.add(bottle);
  }
  sign(hall,'테이블에 앉아 주문하세요',8.5,1.8,49.96,3.5,'#39e1d1');
  for(const table of R.tables){
    const x=table.x-R.OFFSET.x,z=table.z-R.OFFSET.z;
    E('a-cylinder',{position:`${x} .73 ${z}`,radius:.77,height:.08,material:'color:#7b2948;roughness:.5'},hall);
    E('a-cylinder',{position:`${x} .35 ${z}`,radius:.065,height:.7,color:'#c8b7ad'},hall);
    E('a-cylinder',{position:`${x} .035 ${z}`,radius:.45,height:.06,color:'#302532'},hall);
    sign(hall,table.id,x,.55,z-.77,.38,'#ffe184');
    window.POCHA_TABLES[table.id]=[table.x,table.z,.78,1.8];
  }
  for(const seat of R.seats){
    const x=seat.x-R.OFFSET.x,z=seat.z-R.OFFSET.z;
    if(seat.table!=='RB'){
      E('a-cylinder',{position:`${x} .48 ${z}`,radius:.28,height:.13,color:'#e19b4b'},hall);
      E('a-cylinder',{position:`${x} .22 ${z}`,radius:.045,height:.44,color:'#aaa3a0'},hall);
    }
    const hit=E('a-box',{position:`${seat.x} .5 ${seat.z}`,width:.6,height:.6,depth:.6,
      material:'opacity:0;transparent:true;depthWrite:false'});
    hit.classList.add('seat');hit.dataset.seat=seat.id;SEATS.push({...seat,el:hit});
  }
  window.createAlba({home:R.STAFF.home,roller:true});
  // Raised DJ deck, with a smooth skate ramp on both sides and a walkway behind the console.
  box(hall,0,.6,67.4,9,1.2,4.8,'#241a32');
  box(hall,0,1.21,65.02,9,.04,.04,'#39e1d1',true);
  // The operator stands higher than the fixed-height console, so the torso clears the LP equipment.
  box(hall,0,1.6,68.55,9,.8,2.5,'#241a32');
  const slopeGeometry=new THREE.BufferGeometry();
  slopeGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array([-4.5,1.2,66.3,4.5,1.2,66.3,-4.5,2,67.3,4.5,1.2,66.3,4.5,2,67.3,-4.5,2,67.3]),3));
  slopeGeometry.computeVertexNormals();hall.object3D.add(new THREE.Mesh(slopeGeometry,new THREE.MeshStandardMaterial({color:'#241a32',side:THREE.DoubleSide,roughness:.7})));
  for(const r of R.ramps){
    const length=R.DJ.rampLength,h=R.DJ.operatorH,half=(R.DJ.rampZ1-R.DJ.rampZ0)/2;
    const geometry=new THREE.BufferGeometry(),dx=r.topX-r.lowX;
    const vertices=new Float32Array([0,0,-half,dx,h,-half,0,0,half,dx,h,-half,dx,h,half,0,0,half]);
    geometry.setAttribute('position',new THREE.BufferAttribute(vertices,3));geometry.computeVertexNormals();
    const ramp=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#40324e',side:THREE.DoubleSide,roughness:.7}));
    ramp.name=`rollerRamp${r.side<0?'Left':'Right'}`;
    ramp.position.set(r.lowX-R.OFFSET.x,.008,r.z-R.OFFSET.z);hall.object3D.add(ramp);
    for(const edge of [-1,1])E('a-box',{position:`${(r.lowX+r.topX)/2-R.OFFSET.x} ${h/2+.025} ${r.z+edge*(half-.04)-R.OFFSET.z}`,width:Math.hypot(length,h),height:.035,depth:.035,rotation:`0 0 ${Math.atan2(h,dx)*180/Math.PI}`,material:'color:#39e1d1;emissive:#39e1d1;emissiveIntensity:1'},hall);
  }
  const h0=window.heightAt;window.heightAt=(x,z)=>R.floorAt(x,z)??h0(x,z);
  const console=E('a-entity',{id:'rollerDJ',position:'0 1.2 66.5'},hall);
  box(console,0,.48,0,5.6,.96,1,'#1b1826');
  box(console,0,.99,0,5.7,.08,1.1,'#3f394b');
  box(console,0,.35,-.51,5.3,.045,.025,'#ff3cac',true);
  sign(console,'DJ MUSIC BOX',0,.64,-.52,4,'#39e1d1').setAttribute('rotation','0 180 0');
  for(const x of [-1.65,1.65]){
    box(console,x,1.07,0,1.4,.08,.9,'#26232f');
    const lp=E('a-entity',{position:`${x} 1.13 0`,'if-music':'mode:spin;speed:200'},console);
    E('a-cylinder',{radius:.38,height:.025,color:'#090910'},lp);
    for(const r of [.2,.27,.34])E('a-torus',{position:'0 .015 0',rotation:'90 0 0',radius:r,'radius-tubular':.002,color:'#45404b'},lp);
    E('a-cylinder',{position:'0 .018 0',radius:.12,height:.007,color:x<0?'#ff2d95':'#00ffd5'},lp);
    box(lp,.21,.025,0,.07,.008,.025,'#ffffff');
    box(console,x+.47,1.17,-.16,.035,.035,.46,'#cfd9e5').setAttribute('rotation','0 25 0');
  }
  box(console,0,1.08,0,1,.1,.8,'#14131d');
  for(let i=0;i<8;i++){
    E('a-cylinder',{position:`${-.32+(i%4)*.21} 1.17 ${-.2+Math.floor(i/4)*.21}`,radius:.04,height:.06,color:'#c9c4d1'},console);
    E('a-box',{position:`${-.35+i*.1} 1.15 .28`,width:.055,height:.02,depth:.06,material:'color:#00ff66;emissive:#00ff66;emissiveIntensity:.8','if-music':`mode:led;i:${i}`},console);
  }
  const change=E('a-entity',{id:'rollerChange',position:`${R.CHANGE.x} 0 ${R.CHANGE.z}`});
  box(change,0,.4,0,2.4,.8,.65,'#251c35');
  box(change,0,.81,0,2.5,.06,.75,'#00cfff',true);
  sign(change,'🛼 롤러 교체',0,2,-.05,2.6,'#00ffd5');
  for(const side of [-1,1]){const skate=makeRollerSkate(R.colours({}));skate.position.set(side*.35,.99,0);skate.scale.setScalar(1.6);change.object3D.add(skate);}
  OBSTACLES.push({x0:R.CHANGE.x-1.2,x1:R.CHANGE.x+1.2,z0:R.CHANGE.z-.325,z1:R.CHANGE.z+.325});
  const disco=E('a-entity',{id:'rollerMirrorBall',position:'-1 5 59',spin:'speed:18'},hall);
  E('a-sphere',{radius:.65,'segments-width':16,'segments-height':12,
    material:'color:#f6fbff;emissive:#c9e5ff;emissiveIntensity:.75;metalness:.35;roughness:.1;flatShading:true'},disco);
  for(let row=1;row<9;row++)for(let col=0;col<16;col++){
    const theta=row/9*Math.PI,phi=col/16*Math.PI*2;
    E('a-plane',{position:`${.66*Math.sin(theta)*Math.cos(phi)} ${.66*Math.cos(theta)} ${.66*Math.sin(theta)*Math.sin(phi)}`,
      rotation:`${(theta-Math.PI/2)*180/Math.PI} ${(Math.PI/2-phi)*180/Math.PI} 0`,width:.105,height:.105,material:'shader:flat;color:#effaff;side:double',
      'roller-sparkle':`phase:${row*16+col}`},disco);
  }
  const colours=['#ff69b4','#39e1d1','#ffe184','#a57bff'];
  for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2,x=-1+Math.cos(a)*8,z=59+Math.sin(a)*7;
    E('a-circle',{position:`${x} .025 ${z}`,rotation:'-90 0 0',radius:.35,
      material:`color:${colours[i%4]};emissive:${colours[i%4]};emissiveIntensity:.7`,blink:`i:${i%3}`},hall);
    E('a-sphere',{position:`${x} 5.6 ${z}`,radius:.1,
      material:`color:${colours[i%4]};emissive:${colours[i%4]};emissiveIntensity:1`},hall);
  }
  window.makeTickerBoard({id:'rollerTicker',position:'0 3.9 69.65',rotation:'0 180 0',scale:'.95 .75 1'},hall);
  window.makeRankBoard({id:'rollerRanking',position:'8.5 3.2 69.6',rotation:'0 180 0',scale:'.85 .85 1'},hall);
  // Emissive strips and light beams create the atmosphere without a bank of expensive lights.
  for(const side of [-1,1]){
    for(let i=0;i<7;i++){
      const z=50+i*3,colour=colours[i%4];
      box(hall,side*11.78,3.1,z,.04,3.4,.05,colour,true);
      box(hall,side*11.72,.11,z,.05,.045,2.6,colour,true);
      E('a-entity',{position:`${side*11.7} 3.3 ${z}`,rotation:`0 ${side<0?90:-90} 0`,
        ktext:`value:${i%2?'★':'➤'};color:${colour};glow:${colour};size:100;width:1`},hall);
    }
    box(hall,side*10.9,5.75,59,.06,.06,20,'#ff3cac',true);
  }
  for(let z=50;z<=68;z+=3){
    box(hall,0,5.72,z,21.8,.045,.045,z%2?'#39e1d1':'#ff3cac',true);
  }
  for(let i=0;i<6;i++){
    const beam=E('a-entity',{position:`${i%2?-7:7} 5.5 ${52+Math.floor(i/2)*6}`,sweep:`phase:${i}`},hall);
    E('a-cone',{position:'0 -2.5 0','radius-top':.035,'radius-bottom':1.3,height:5,openEnded:true,
      material:`shader:flat;color:${colours[i%4]};opacity:.065;transparent:true;depthWrite:false;side:double`},beam);
  }
  E('a-torus',{position:'-1 5 59',rotation:'90 0 0',radius:1.1,'radius-tubular':.025,
    material:'color:#39e1d1;emissive:#39e1d1;emissiveIntensity:1.5'},hall);
  E('a-entity',{position:'0 4.5 51',light:'type:point;color:#8d4aff;intensity:.45;distance:12'},hall);
  E('a-entity',{position:'-1 5 59',light:'type:point;color:#ff3cac;intensity:.65;distance:17'},hall);
  OBSTACLES.push(...R.obstacles);
})();
