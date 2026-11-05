// Shared air-hockey physics. Distances and velocities use table-width units.
(function(root){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const K={aspect:1.25,left:.05,right:.95,top:.075,bottom:.925,paddle:.09,puck:.034,maxPaddle:3.2,maxPuck:2.25,goal0:.33,goal1:.67};
 function create(){return {kind:'hockey',t:0,score:0,opponent:0,over:false,won:false,event:0,hit:0,serve:true,serveSide:0,serveTime:0,paddles:[{x:.5,y:.82,vx:0,vy:0},{x:.5,y:.18,vx:0,vy:0}],ball:{x:.5,y:.68,vx:0,vy:0}};}
 function serve(s,side){if(!s.over&&s.serve&&side===s.serveSide){s.serve=false;s.ball.vx=0;s.ball.vy=side===0?-.44:.44;s.sound='serve';s.event++;}}
 function goal(s,side){if(side===0)s.score++;else s.opponent++;s.sound=side===0?'point':'lost';s.event++;s.serve=true;s.serveSide=1-side;s.serveTime=0;s.ball={x:.5,y:s.serveSide===0?.68:.32,vx:0,vy:0};if(s.score>=7||s.opponent>=7){s.over=true;s.won=s.score>=7;}}
 function target(p,i,dt,t){const r=K.paddle;let x=clamp(Number.isFinite(t?.x)?t.x:p.x,K.left+r,K.right-r),y=clamp(Number.isFinite(t?.y)?t.y:p.y,i===0?.5+r/K.aspect:K.top+r/K.aspect,i===0?K.bottom-r/K.aspect:.5-r/K.aspect);
  const dx=x-p.x,dy=(y-p.y)*K.aspect,d=Math.hypot(dx,dy),k=d?Math.min(1,K.maxPaddle*dt/d):0;p.vx=dx*k/dt;p.vy=dy*k/dt;p.x+=dx*k;p.y+=dy*k/K.aspect;
 }
 function update(s,dt,targets=[]){if(s.over||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.1,dt);const steps=Math.ceil(dt*240),h=dt/steps,paths=s.paddles.map((p,i)=>{const end={...p};target(end,i,dt,targets[i]);return {x:p.x,y:p.y,dx:end.x-p.x,dy:end.y-p.y};});
  for(let j=0;j<steps&&!s.over;j++){
   s.t+=h;for(let i=0;i<2;i++){const p=paths[i],k=(j+1)/steps;target(s.paddles[i],i,h,{x:p.x+p.dx*k,y:p.y+p.dy*k});}
   if(s.serve){s.serveTime+=h;if(s.serveTime>=1)serve(s,s.serveSide);continue;}
   const b=s.ball;b.x+=b.vx*h;b.y+=b.vy*h/K.aspect;
   for(const p of s.paddles){const dx=b.x-p.x,dy=(b.y-p.y)*K.aspect,d=Math.hypot(dx,dy),r=K.paddle+K.puck;if(d>=r)continue;
    const nx=d>1e-8?dx/d:0,ny=d>1e-8?dy/d:(p===s.paddles[0]?-1:1);b.x=p.x+nx*(r+.0001);b.y=p.y+ny*(r+.0001)/K.aspect;
    const closing=(b.vx-p.vx)*nx+(b.vy-p.vy)*ny;
    if(closing<0){b.vx-=1.65*closing*nx;b.vy-=1.65*closing*ny;const speed=Math.hypot(b.vx,b.vy);if(speed>K.maxPuck){b.vx*=K.maxPuck/speed;b.vy*=K.maxPuck/speed;}s.sound='hit';s.event++;}
   }
   if(b.x<K.left+K.puck){b.x=K.left+K.puck;b.vx=Math.abs(b.vx)*.96;s.sound='rail';s.event++;}else if(b.x>K.right-K.puck){b.x=K.right-K.puck;b.vx=-Math.abs(b.vx)*.96;s.sound='rail';s.event++;}
   const inGoal=b.x>K.goal0+K.puck&&b.x<K.goal1-K.puck;
   if(b.y<K.top+K.puck/K.aspect){if(inGoal){if(b.y<K.top-K.puck/K.aspect){goal(s,0);continue;}}else{b.y=K.top+K.puck/K.aspect;b.vy=Math.abs(b.vy)*.96;s.sound='rail';s.event++;}}
   if(b.y>K.bottom-K.puck/K.aspect){if(inGoal){if(b.y>K.bottom+K.puck/K.aspect){goal(s,1);continue;}}else{b.y=K.bottom-K.puck/K.aspect;b.vy=-Math.abs(b.vy)*.96;s.sound='rail';s.event++;}}
   const radius=.13;
   for(const [cx,cy,sx,sy] of [[K.left+radius,K.top+radius/K.aspect,-1,-1],[K.right-radius,K.top+radius/K.aspect,1,-1],[K.left+radius,K.bottom-radius/K.aspect,-1,1],[K.right-radius,K.bottom-radius/K.aspect,1,1]]){
    if((b.x-cx)*sx<=0||(b.y-cy)*sy<=0)continue;
    const dx=b.x-cx,dy=(b.y-cy)*K.aspect,d=Math.hypot(dx,dy),limit=radius-K.puck;
    if(d<limit)continue;
    const nx=dx/d,ny=dy/d,out=b.vx*nx+b.vy*ny;
    b.x=cx+nx*(limit-.001);b.y=cy+ny*(limit-.001)/K.aspect;
    if(out>0){b.vx-=1.9*out*nx;b.vy-=1.9*out*ny;}
    if(Math.hypot(b.vx,b.vy)<.3){b.vx=-nx*.35;b.vy=-ny*.35;}
   }
   const drag=Math.exp(-.075*h);b.vx*=drag;b.vy*=drag;
  }
  releaseCorner(s,dt);
 }
 function releaseCorner(s,dt){
  const b=s.ball;
  const nearX=b.x<K.left+.18||b.x>K.right-.18;
  const nearY=b.y<K.top+.18/K.aspect||b.y>K.bottom-.18/K.aspect;
  if(s.serve||!nearX||!nearY){s.cornerWatch=null;return;}
  const watch=s.cornerWatch;
  if(!watch||Math.hypot(b.x-watch.x,(b.y-watch.y)*K.aspect)>.025){
   s.cornerWatch={x:b.x,y:b.y,time:0};return;
  }
  watch.time+=dt;
  if(watch.time<.4)return;
  const sx=b.x<.5?1:-1,sy=b.y<.5?1:-1;
  const cx=sx>0?K.left+.13:K.right-.13;
  const cy=sy>0?K.top+.13/K.aspect:K.bottom-.13/K.aspect;
  // Paddle separation followed by wall clamping can pin the puck between both.
  // Release along the inward diagonal to a point clear of both paddles.
  for(let offset=.03;offset<=.3;offset+=.03){
   const x=cx+sx*offset,y=cy+sy*offset/K.aspect;
   if(s.paddles.some(p=>Math.hypot(x-p.x,(y-p.y)*K.aspect)<K.paddle+K.puck+.005))continue;
   b.x=x;b.y=y;b.vx=sx*.45;b.vy=sy*.45;s.sound='rail';s.event++;break;
  }
  s.cornerWatch=null;
 }
 function ai(s,dt){const p=s.paddles[1],b=s.ball,attack=!s.serve&&b.y<.48;const tx=attack?b.x:.5+(b.x-.5)*.7,ty=attack?clamp(b.y-.055,.14,.4):.18;
  // A modest reaction speed leaves practice playable; the same collisions determine its shots.
  const limit=.65*dt,dx=tx-p.x,dy=(ty-p.y)*K.aspect,d=Math.hypot(dx,dy),k=d?Math.min(1,limit/d):0;return {x:p.x+dx*k,y:p.y+dy*k/K.aspect};
 }
 const api={K,create,serve,update,ai};if(typeof module!=='undefined')module.exports=api;else root.AIR_HOCKEY=api;
})(typeof window!=='undefined'?window:this);
