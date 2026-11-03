// 1980s Korean roller rink. Skates are chosen on entry.
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
  sign(entrance,'ROLLER DISCO · 1980',0,3.9,.2,4.2,'#39e1d1');
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
  sign(hall,'추억의 롤라장 · 1980',0,4.9,69.8,9).setAttribute('rotation','0 180 0');
  sign(hall,'EXIT · 롤러 꾸미기',0,3.3,48.25,3.6,'#39e1d1');

  // Oval track markings, low enough to remain walkable across the whole rink.
  [1,.76].forEach(scale=>{
    E('a-ring',{position:'-1 .018 59',rotation:'-90 0 0',scale:`${9.5*scale} ${7.8*scale} 1`,
      'radius-inner':.985,'radius-outer':1,material:'shader:flat;color:#38dce9;side:double','segments-theta':80},hall);
  });
  for(let z=51;z<68;z+=3.4)for(const x of [-11.5,11.5]){
    box(hall,x,.48,z,.7,.16,2,'#341027');
    box(hall,x,.8,z,.12,.65,2,'#341027');
  }
  box(hall,8.5,.85,53,5,1.7,1,'#e6c589');
  box(hall,8.5,1.74,53,5.2,.1,1.2,'#694b36');
  sign(hall,'매점 · 컵라면 / 사이다',8.5,2.8,53,4.3,'#ffe184').setAttribute('rotation','0 180 0');
  for(let i=0;i<5;i++){
    const cup=makeCup('ramen');cup.position.set(6.8+i*.36,2.1,53);cup.scale.setScalar(1.5);hall.object3D.add(cup);
    const bottle=makeCup('cider');bottle.position.set(9+i*.3,2.15,53);bottle.scale.setScalar(1.6);hall.object3D.add(bottle);
  }
  sign(hall,'컵라면과 사이다로 잠깐 쉬어 가요',8.2,2.2,52.4,3.5,'#39e1d1').setAttribute('rotation','0 180 0');
  box(hall,0,.7,68.6,5.6,1.4,1.8,'#583347');
  sign(hall,'DJ MUSIC BOX',0,1.2,67.65,4,'#39e1d1').setAttribute('rotation','0 180 0');
  [-1.2,1.2].forEach(x=>{
    E('a-cylinder',{position:`${x} 1.45 68.3`,radius:.45,height:.06,color:'#10121a'},hall);
    E('a-cylinder',{position:`${x} 1.49 68.3`,radius:.13,height:.01,color:'#ff69b4'},hall);
  });
  const disco=E('a-entity',{position:'-1 5 59',spin:'speed:18'},hall);
  E('a-sphere',{radius:.65,'segments-width':16,'segments-height':12,
    material:'color:#dbe5f4;metalness:1;roughness:.15;flatShading:true'},disco);
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
  for(let x=-3;x<=3;x+=1.2)for(let z=57;z<=62;z+=1.2){
    const i=Math.round((x+3)/1.2+(z-57)/1.2),colour=colours[i%4];
    E('a-box',{position:`${x} .012 ${z}`,width:1.12,height:.018,depth:1.12,
      material:`color:#08091c;emissive:${colour};emissiveIntensity:.2;roughness:.35`,blink:`i:${i%3}`},hall);
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
