// 1980s Korean roller rink. Skates are chosen on entry.
(function buildRollerRink() {
  const R=ROLLER, T=R.T;
  const box=(parent,x,y,z,w,h,d,color,glow=false) => E('a-box',{
    position:`${x} ${y} ${z}`,width:w,height:h,depth:d,
    material:`color:${color};roughness:.65${glow?`;emissive:${color};emissiveIntensity:.8`:''}`
  },parent);
  const sign=(parent,text,x,y,z,width,color='#ff69b4') => E('a-entity',{
    position:`${x} ${y} ${z}`,ktext:`value:${text};color:#fff9e8;glow:${color};size:64;width:${width}`
  },parent);
  const entrance=E('a-entity',{position:`${R.ENTRY.x} 0 29.7`,rotation:'0 180 0'});
  const building=E('a-entity',{position:'10 0 31.2'});
  box(building,0,2.9,0,5,5.8,3,'#304856');
  box(building,0,5.9,0,5.3,.25,3.3,'#172b39');
  [-1.3,1.3].forEach(x=>box(building,x,4.65,-1.52,1.2,.9,.04,'#ffce88',true));
  box(entrance,0,1.5,0,2.4,3,.18,'#163b4b');
  box(entrance,0,1.4,.12,1.8,2.5,.08,'#171528');
  [-1,1].forEach(s=>box(entrance,s*1.05,1.6,.2,.06,2.8,.06,'#39e1d1',true));
  sign(entrance,'추억의 롤라장',0,3.5,.2,4.5);
  sign(entrance,'입장 · 롤러 선택',0,2.4,.2,1.8,'#39e1d1');
  const closed=sign(entrance,'CLOSED',0,1.5,.22,1.7,'#ff4444');
  window.setRollerDoorVis=open=>closed.setAttribute('visible',!open);
  closed.setAttribute('visible',false);

  const hall=E('a-entity',{id:'rollerWorld'});
  box(hall,0,-.08,59,24,.16,22,'#b77740');
  const wood=canvasTex(512,512,(c,w,h)=>{
    c.fillStyle='#b67d48';c.fillRect(0,0,w,h);
    for(let r=0;r<16;r++){
      c.fillStyle=r%2?'#bd8853':'#c6915c';c.fillRect(0,r*32,w,30);
      c.strokeStyle='#88552e';c.lineWidth=1;
      for(let x=(r%2)*85;x<w;x+=170)c.strokeRect(x,r*32,170,32);
    }
  },6,6);
  texMesh(E('a-plane',{position:'0 .006 59',rotation:'-90 0 0',width:23.5,height:21.5,material:'roughness:.4'},hall),wood);
  [[-12,59,.2,22],[12,59,.2,22],[0,48,24,.2],[0,70,24,.2]].forEach(([x,z,w,d])=>{
    box(hall,x,3,z,w,6,d,'#26354b');
    box(hall,x,1.1,z,w,.7,d+.015,'#b85e70');
    box(hall,x,2.05,z,w,.045,d+.025,'#ffbd68',true);
  });
  box(hall,0,6,59,24,.14,22,'#171828');
  sign(hall,'추억의 롤라장 · 1980',0,4.9,69.8,9).setAttribute('rotation','0 180 0');
  sign(hall,'거리로 나가기 · 롤러 꾸미기',0,2.8,48.25,5,'#39e1d1');
  [-1,1].forEach(s=>box(hall,s*1.6,1.5,48.3,.06,3,.06,'#39e1d1',true));
  // Oval track markings, low enough to remain walkable across the whole rink.
  [1,.76].forEach(scale=>{
    E('a-ring',{position:'-1 .018 59',rotation:'-90 0 0',scale:`${9.5*scale} ${7.8*scale} 1`,
      'radius-inner':.985,'radius-outer':1,material:'shader:flat;color:#fff3bb;side:double','segments-theta':80},hall);
  });
  for(let z=51;z<68;z+=3.4)for(const x of [-11.5,11.5]){
    box(hall,x,.48,z,.7,.16,2,'#b85e70');
    box(hall,x,.8,z,.12,.65,2,'#b85e70');
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
  E('a-entity',{position:'0 4.5 50',light:'type:point;color:#ffe1b2;intensity:1;distance:12'},hall);
  E('a-entity',{position:'-1 5 59',light:'type:point;color:#c4ceff;intensity:1;distance:17'},hall);
  OBSTACLES.push(...R.obstacles);
})();
