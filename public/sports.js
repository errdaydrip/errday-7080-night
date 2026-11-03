// Sports centre west of the nightclub. Shop positions are shared with serving routes.
(function(root){
 const T={x0:-36,x1:-18,z0:-16,z1:22,h:7},DOOR={x:T.x1,z:16.3,half:2},ENTRY={x:-16.9,z:16.3},ARRIVE={x:-19.5,z:16.3};
 const SHOPS={hoe:{z:22.9},chicken:{z:26.7}};
 const GAMES={bowling:{name:'볼링',subtitle:'TEN PIN / 10 FRAMES',colour:'#8bdcfa',controls:'← → 조준 · ↑ ↓ 파워 · Space / 굴리기 · 10프레임'},billiards:{name:'포켓 당구',subtitle:'POCKET CHALLENGE',colour:'#8bf3c6',controls:'화면을 터치해 조준 · ← → 미세 조준 · ↑ ↓ 파워 · Space / 샷'},futsal:{name:'미니풋살',subtitle:'60 SECOND ATTACK',colour:'#b1f18d',controls:'방향키 / 드래그로 드리블 · Space / 슛 · 60초 공격'},tennis:{name:'테니스',subtitle:'VS COMPUTER / 7점 승부',colour:'#ffcb7d',controls:'← → 라켓 이동 · Space / 서브 · AI와 7점 승부'}};
 const facilities=[{id:'SP-BOWL1',game:'bowling',x:-32.5,z:-5,spot:{x:-32.5,z:3.7},box:{x0:-34,x1:-31,z0:-13,z1:2.5}}, {id:'SP-BOWL2',game:'bowling',x:-28.5,z:-5,spot:{x:-28.5,z:3.7},box:{x0:-30,x1:-27,z0:-13,z1:2.5}},
 {id:'SP-POOL',game:'billiards',x:-31.6,z:8.5,spot:{x:-31.6,z:11.5},box:{x0:-34,x1:-29.2,z0:7,z1:10}}, {id:'SP-TENNIS',game:'tennis',x:-22,z:5.5,spot:{x:-25.5,z:5.5},box:{x0:-24.7,x1:-19.3,z0:.5,z1:10.5}}, {id:'SP-FUTSAL',game:'futsal',x:-30.8,z:17.1,spot:{x:-25.5,z:17.1},box:{x0:-35,x1:-26.6,z0:13.5,z1:20.7}}];
 const vacancies=[{id:'SP-SOON1',name:'스크린골프 예정',x:-21,z:-12},{id:'SP-SOON2',name:'배드민턴 예정',x:-21,z:-7.5},{id:'SP-SOON3',name:'다목적룸 예정',x:-21,z:-3}];
 const inside=(x,z)=>x>T.x0&&x<T.x1&&z>T.z0&&z<T.z1;
 const obstacles=[{x0:T.x0-.1,x1:T.x0+.2,z0:T.z0,z1:T.z1},{x0:T.x0,x1:T.x1,z0:T.z0-.1,z1:T.z0+.2},{x0:T.x0,x1:T.x1,z0:T.z1-.2,z1:T.z1+.1},{x0:T.x1-.2,x1:T.x1+.1,z0:T.z0,z1:DOOR.z-DOOR.half},{x0:T.x1-.2,x1:T.x1+.1,z0:DOOR.z+DOOR.half,z1:T.z1},...facilities.map(f=>f.box),...vacancies.map(v=>({x0:-24,x1:-18,z0:v.z-1.9,z1:v.z+1.9}))];
 // Grid paths keep click-to-walk routes in the aisles around courts and lanes.
 const walkable=(x,z)=>{if(x<T.x0+.35||x>T.x1+1.5||z<T.z0+.35||z>T.z1-.35)return false;if(x>=T.x1-.3&&Math.abs(z-DOOR.z)>DOOR.half-.4)return false;return !obstacles.some(b=>x>b.x0-.28&&x<b.x1+.28&&z>b.z0-.28&&z<b.z1+.28);};
 function path(from,to){
  const step=.5,ox=T.x0+.5,oz=T.z0+.5,key=(x,z)=>x+','+z,point=(x,z)=>({x:ox+x*step,z:oz+z*step}),valid=(x,z)=>{const p=point(x,z);return walkable(p.x,p.z);};
  const nearest=p=>{const ix=Math.round((p.x-ox)/step),iz=Math.round((p.z-oz)/step);let best=null,dist=Infinity;for(let r=0;r<=3&&!best;r++)for(let x=ix-r;x<=ix+r;x++)for(let z=iz-r;z<=iz+r;z++)if(valid(x,z)){const q=point(x,z),d=Math.hypot(q.x-p.x,q.z-p.z);if(d<dist){dist=d;best={x,z};}}return best;};
  if(!walkable(to.x,to.z))return null;const start=nearest(from),end=nearest(to);if(!start||!end)return null;
  const startKey=key(start.x,start.z),goalKey=key(end.x,end.z),open=[{...start,g:0,f:0}],cost=new Map([[startKey,0]]),prev=new Map(),closed=new Set();let found=false;
  while(open.length){open.sort((a,b)=>a.f-b.f);const q=open.shift(),k=key(q.x,q.z);if(closed.has(k))continue;if(k===goalKey){found=true;break;}closed.add(k);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const x=q.x+dx,z=q.z+dz,nk=key(x,z);if(!valid(x,z)||(dx&&dz&&(!valid(q.x+dx,q.z)||!valid(q.x,q.z+dz))))continue;const g=q.g+Math.hypot(dx,dz);if(g>=(cost.get(nk)??Infinity))continue;cost.set(nk,g);prev.set(nk,k);open.push({x,z,g,f:g+Math.hypot(end.x-x,end.z-z)});}}
  if(!found)return null;const cells=[];let k=goalKey;while(k){const [x,z]=k.split(',').map(Number);cells.push(point(x,z));if(k===startKey)break;k=prev.get(k);}cells.reverse();const out=[];for(let i=0;i<cells.length;i++){const a=cells[i-1],b=cells[i],c=cells[i+1];if(!a||!c||Math.abs((b.x-a.x)*(c.z-b.z)-(b.z-a.z)*(c.x-b.x))>.001)out.push(b);}out.push({x:to.x,z:to.z});return out;
 }
 const api={path,walkable,T,DOOR,ENTRY,ARRIVE,SHOPS,GAMES,facilities,vacancies,inside,obstacles};if(typeof module!=='undefined')module.exports=api;else root.SPORTS=api;
})(typeof window!=='undefined'?window:this);
