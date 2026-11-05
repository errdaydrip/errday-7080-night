(function(root){
 const W=480,H=600,cyan='#69ecff',pink='#ff72c9';
 function round(ctx,x,y,w,h,r,fill){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();
 }
 function line(ctx,x,y,x2,y2,color,width){
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
 }
 function disk(ctx,x,y,r,fill){
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
 }
 function text(ctx,label,x,y,size,color){
  ctx.textAlign='center';ctx.font='bold '+size+'px system-ui,sans-serif';ctx.fillStyle=color;ctx.fillText(label,x,y);
 }
 function paddle(ctx,p,r,color,dark){
  const x=p.x*W,y=p.y*H;
  disk(ctx,x+3,y+6,r,'#0008');
  disk(ctx,x,y,r,color);
  const face=ctx.createRadialGradient(x-r*.25,y-r*.36,2,x,y,r);
  face.addColorStop(0,color);face.addColorStop(.58,dark);face.addColorStop(1,'#11162f');
  disk(ctx,x,y,r-3,face);disk(ctx,x,y,r*.56,'#0a1429');disk(ctx,x-2,y-3,r*.43,color);
  disk(ctx,x-5,y-7,r*.29,'#f6ffff73');
 }
 function draw(ctx,state){
  const k=root.AIR_HOCKEY.K,left=k.left*W,right=k.right*W,top=k.top*H,bottom=k.bottom*H;
  const goalLeft=k.goal0*W,goalRight=k.goal1*W;
  const shell=ctx.createLinearGradient(0,0,W,H);
  shell.addColorStop(0,'#293452');shell.addColorStop(.46,'#101b38');shell.addColorStop(1,'#422047');
  ctx.fillStyle='#070a17';ctx.fillRect(0,0,W,H);
  round(ctx,10,35,460,530,26,shell);
  const surface=ctx.createLinearGradient(left,top,right,bottom);
  surface.addColorStop(0,'#153e60');surface.addColorStop(.5,'#0c213d');surface.addColorStop(1,'#331c43');
  round(ctx,left,top,right-left,bottom-top,15,surface);
  ctx.save();ctx.beginPath();ctx.roundRect(left,top,right-left,bottom-top,15);ctx.clip();
  for(let x=-490;x<right;x+=26)line(ctx,x,top,x+500,bottom,'#9bd9ff13',1);
  line(ctx,left,300,right,300,'#84dbff66',2);
  for(const radius of [53,62]){
   ctx.beginPath();ctx.arc(240,300,radius,0,Math.PI*2);ctx.strokeStyle='#83e9ff71';ctx.lineWidth=1.5;ctx.stroke();
  }
  disk(ctx,240,300,4,'#b6edfc');
  for(const [end,color] of [[top,cyan],[bottom,pink]]){
   ctx.beginPath();ctx.ellipse(240,end,103,63,0,0,Math.PI*2);ctx.strokeStyle=color+'75';ctx.lineWidth=2;ctx.stroke();
   for(let i=1;i<=3;i++){
    const y=end+(end===top?1:-1)*(12+i*9);
    line(ctx,left+13,y,left+56,y,color+'6a',2);line(ctx,right-56,y,right-13,y,color+'6a',2);
   }
  }
  ctx.restore();
  ctx.save();ctx.shadowBlur=13;ctx.shadowColor=cyan;
  line(ctx,left,top+15,left,bottom-15,cyan,3);line(ctx,right,top+15,right,bottom-15,cyan,3);
  ctx.shadowColor=pink;
  for(const y of [top,bottom]){
   line(ctx,left+15,y,goalLeft,y,pink,3);line(ctx,goalRight,y,right-15,y,pink,3);
  }
  for(const [y,color] of [[top,cyan],[bottom,pink]]){
   ctx.shadowColor=color;round(ctx,goalLeft,y-6,goalRight-goalLeft,12,4,color);
   line(ctx,goalLeft+6,y,goalRight-6,y,'#ffffffac',2);
  }
  ctx.restore();
  paddle(ctx,state.paddles[1],k.paddle*W,cyan,'#146b9e');
  paddle(ctx,state.paddles[0],k.paddle*W,pink,'#9e2868');
  const x=state.ball.x*W,y=state.ball.y*H,r=k.puck*W;
  ctx.save();ctx.shadowColor='#ffca68';ctx.shadowBlur=12;disk(ctx,x,y,r,'#ffdb91');ctx.restore();
  const metal=ctx.createRadialGradient(x-r*.3,y-r*.4,1,x,y,r);
  metal.addColorStop(0,'#f8f4cd');metal.addColorStop(.47,'#b6a16b');metal.addColorStop(1,'#3e3151');
  disk(ctx,x,y,r-2,metal);disk(ctx,x,y,r*.42,'#533c51');disk(ctx,x-2,y-2,r*.19,'#fff2bc');
  text(ctx,'내 점수 '+state.score,151,25,17,'#ffc4e5');
  text(ctx,'CPU '+state.opponent,329,25,17,'#b6f4ff');
  text(ctx,'NEON AIR HOCKEY',240,588,14,'#a9b8d7');
  if(state.serve){
   round(ctx,163,318,154,35,12,'#081427ce');
   text(ctx,state.serveSide===1?'CPU 서브':'서브 준비',240,342,17,'#e8faff');
  }
 }
 root.AIR_HOCKEY_VIEW={draw};
})(window);
