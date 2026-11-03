// Shared roller-rink layout and validated skate colours (browser and server).
(function(root) {
  const T = {x0:-12, x1:12, z0:48, z1:70, h:6};
  const ENTRY = {x:10, z:29.05};
  const ARRIVE = {x:0, z:54.5};
  const EXIT = {x:0, z:50};
  const SHOP = {x:8.5, z:51.5};
  const inside = (x,z) => x>T.x0 && x<T.x1 && z>T.z0 && z<T.z1;
  const near = (pos,point,r) => Array.isArray(pos) && Math.hypot(pos[0]-point.x,pos[2]-point.z)<r;
  const colours = o => ({
    skateBoot: /^#[0-9a-f]{6}$/i.test(o.skateBoot||'') ? o.skateBoot : '#f5f5f5',
    skateWheel: /^#[0-9a-f]{6}$/i.test(o.skateWheel||'') ? o.skateWheel : '#ff69b4',
    skateLace: /^#[0-9a-f]{6}$/i.test(o.skateLace||'') ? o.skateLace : '#2f7bff'
  });
  const obstacles = [
    {x0:-12.2,x1:-11.8,z0:48,z1:70}, {x0:11.8,x1:12.2,z0:48,z1:70},
    {x0:-12,x1:12,z0:47.8,z1:48.2}, {x0:-12,x1:12,z0:69.8,z1:70.2},
    {x0:6,x1:11,z0:52.5,z1:53.5}, {x0:-2.8,x1:2.8,z0:67.8,z1:69.6}
  ];
  const api = {T,ENTRY,ARRIVE,EXIT,SHOP,inside,near,colours,obstacles};
  if(typeof module!=='undefined') module.exports=api;
  else root.ROLLER=api;
})(typeof window!=='undefined'?window:this);
