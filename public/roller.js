// Shared roller-rink layout and validated skate colours (browser and server).
(function(root) {
  const T = {x0:-2, x1:22, z0:29.7, z1:51.7, h:6};
  const DOOR = {x:10,z:T.z0,half:2.2};
  const OFFSET = {x:10,z:-18.3};
  const ENTRY = {x:10, z:29.05};
  const ARRIVE = {x:10, z:30.8};
  const EXIT = {x:10, z:30.5};
  const SHOP = {x:18.5, z:33.2};
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
    {x0:6,x1:11,z0:52.5,z1:53.5}, {x0:-2.8,x1:2.8,z0:67.8,z1:69.6}
  ].map(o=>({x0:o.x0+OFFSET.x,x1:o.x1+OFFSET.x,z0:o.z0+OFFSET.z,z1:o.z1+OFFSET.z}));
  const api = {T,DOOR,OFFSET,PALETTE,ENTRY,ARRIVE,EXIT,SHOP,inside,near,colours,obstacles};
  if(typeof module!=='undefined') module.exports=api;
  else root.ROLLER=api;
})(typeof window!=='undefined'?window:this);
