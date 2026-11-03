// Shared roller-rink layout and validated skate colours (browser and server).
(function(root) {
  const T = {x0:-2, x1:22, z0:29.7, z1:51.7, h:6};
  const DOOR = {x:10,z:T.z0,half:2.2};
  const OFFSET = {x:10,z:-18.3};
  const ENTRY = {x:10, z:29.05};
  const ARRIVE = {x:10, z:30.8};
  const EXIT = {x:10, z:30.5};
  const MENU=['ramen','tteokbokki','cola','cider'];
  const CHANGE = {x:1,z:31.4};
  const DJ = {h:.6,operatorH:1,consoleH:1.57,operatorZ0:48,operatorZ1:49,x0:5.5,x1:14.5,z0:46.7,z1:51.5,rampZ0:49.3,rampZ1:51.5,rampLength:5};
  const ramps=[-1,1].map(side=>({side,lowX:side<0?.5:19.5,topX:side<0?DJ.x0:DJ.x1,z:50.4}));
  const onDeck=(x,z)=>x>=DJ.x0&&x<=DJ.x1&&z>=DJ.z0&&z<=DJ.z1;
  const floorAt=(x,z)=>{
    if(x>=7.2&&x<=12.8&&z>=47.7&&z<=48.7)return DJ.consoleH;
    if(onDeck(x,z))return DJ.h+(DJ.operatorH-DJ.h)*Math.max(0,Math.min(1,(z-DJ.operatorZ0)/(DJ.operatorZ1-DJ.operatorZ0)));
    if(z>=DJ.rampZ0&&z<=DJ.rampZ1)for(const r of ramps){
      const k=(x-r.lowX)/(r.topX-r.lowX);if(k>=0&&k<=1)return DJ.operatorH*Math.max(0,k);
    }
    return null;
  };
  const SHOP = {x:18.5, z:31.1};
  const STAFF = {home:[16,32],source:[17,32]};
  const tables = [
    {id:'R1',x:19.4,z:42.4,service:[18.45,41.45]},
    {id:'R2',x:19.2,z:34,service:[18.25,33.05]},
    {id:'R3',x:19.2,z:38,service:[18.25,37.05]}
  ];
  const seats=[];
  tables.forEach(t=>[[0,-1.15,0],[1.15,0,-Math.PI/2],[0,1.15,Math.PI],[-1.15,0,Math.PI/2]].forEach(([dx,dz,yaw],i)=>seats.push({
    id:`${t.id}-${i}`,table:t.id,x:t.x+dx,z:t.z+dz,y:.03,yaw,stand:[t.x+dx*1.45,t.z+dz*1.45]
  })));
  const inside = (x,z) => x>T.x0 && x<T.x1 && z>T.z0 && z<T.z1;
  const near = (pos,point,r) => Array.isArray(pos) && Math.hypot(pos[0]-point.x,pos[2]-point.z)<r;
  const PALETTE = [
    ['#ff2d95','형광 핑크'],['#ff5252','형광 코랄'],['#ff8a00','형광 오렌지'],['#faff00','형광 옐로'],['#b6ff00','형광 라임'],
    ['#00ff66','형광 그린'],['#00ffd5','형광 민트'],['#00cfff','형광 시안'],['#2685ff','형광 블루'],['#bd4dff','형광 퍼플']
  ];
  function colour(value,fallback) {
    if(!/^#[0-9a-f]{6}$/i.test(value||''))return fallback;
    const number=parseInt(value.slice(1),16);
    const rgb=[number>>16,(number>>8)&255,number&255];
    let best=fallback,distance=Infinity;
    for(const [hex] of PALETTE){
      const n=parseInt(hex.slice(1),16);
      const d=(rgb[0]-(n>>16))**2+(rgb[1]-((n>>8)&255))**2+(rgb[2]-(n&255))**2;
      if(d<distance){distance=d;best=hex;}
    }
    return best;
  }
  const colours = o => ({
    skateBoot:colour(o.skateBoot,'#00cfff'),
    skateWheel:colour(o.skateWheel,'#ff2d95'),
    skateLace:colour(o.skateLace,'#faff00')
  });
  const obstacles = [
    {x0:-12.2,x1:-11.8,z0:48,z1:70}, {x0:11.8,x1:12.2,z0:48,z1:70},
    {x0:-12,x1:-2.2,z0:47.8,z1:48.2}, {x0:2.2,x1:12,z0:47.8,z1:48.2}, {x0:-12,x1:12,z0:69.8,z1:70.2},
    {x0:6,x1:11,z0:48.9,z1:49.9}, {x0:-2.8,x1:2.8,z0:66,z1:67,jumpTop:DJ.consoleH}
  ].map(o=>({...o,x0:o.x0+OFFSET.x,x1:o.x1+OFFSET.x,z0:o.z0+OFFSET.z,z1:o.z1+OFFSET.z}));
  obstacles.push(...tables.map(t=>({x0:t.x-.78,x1:t.x+.78,z0:t.z-.78,z1:t.z+.78})));
  const api = {MENU,CHANGE,DJ,ramps,onDeck,floorAt,STAFF,tables,seats,T,DOOR,OFFSET,PALETTE,ENTRY,ARRIVE,EXIT,SHOP,inside,near,colours,obstacles};
  if(typeof module!=='undefined') module.exports=api;
  else root.ROLLER=api;
})(typeof window!=='undefined'?window:this);
