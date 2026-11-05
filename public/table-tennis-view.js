// Perspective tabletop drawn in the cabinet's existing 480 by 600 canvas.
(function(root){
 const project=(x,y,z=0)=>[240+(x-.5)*(224+230*y),184+314*y-z*(134+44*y)];
 function polygon(ctx,points,fill){
  ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 }
 function line(ctx,a,b,color,width=1){
  ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
 }
 function oval(ctx,x,y,rx,ry,fill){
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
 }
 function text(ctx,label,x,y,size,color){
  ctx.font='bold '+size+'px system-ui,sans-serif';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(label,x,y);
 }
 function racket(ctx,x,y,swing,near){
  const [px,py]=project(x,y,(near?.12:.36)+swing*.42);
  ctx.save();ctx.translate(px,py);ctx.rotate((near?-.64:.08)+swing*2);
  if(!near)ctx.scale(.67,.67);
  const wood=ctx.createLinearGradient(-9,0,9,0);
  wood.addColorStop(0,'#95602a');wood.addColorStop(.48,'#f1c781');wood.addColorStop(1,'#a66b35');
  polygon(ctx,[[-7,15],[7,15],[10,49],[-9,49]],wood);
  for(let i=-5;i<=6;i+=4)line(ctx,[i,21],[i+1,48],'#80512666');
  oval(ctx,2,3,29,34,'#a76b36');oval(ctx,0,0,29,34,'#ecc58b');
  const rubber=ctx.createRadialGradient(-11,-17,1,2,5,41);
  rubber.addColorStop(0,'#e75750');rubber.addColorStop(.55,'#ba272c');rubber.addColorStop(1,'#741018');
  oval(ctx,0,0,27,32,rubber);
  ctx.restore();
 }
 function ball(ctx,b){
  const [x,y]=project(b.x,b.y,b.z),r=4.4+Math.max(0,Math.min(1,b.y))*3.4;
  const light=ctx.createRadialGradient(x-r*.31,y-r*.36,.4,x,y,r);
  light.addColorStop(0,'#fff');light.addColorStop(.5,'#ffffec');light.addColorStop(1,'#b3b7bb');
  oval(ctx,x,y,r,r,light);
 }
 function draw(ctx,state){
  ctx.fillStyle='#05060a';ctx.fillRect(0,0,480,600);
  const floor=ctx.createRadialGradient(240,390,25,240,510,310);
  floor.addColorStop(0,'#9a4544');floor.addColorStop(.55,'#512b32');floor.addColorStop(1,'#17131d');
  polygon(ctx,[[0,286],[480,286],[480,600],[0,600]],floor);
  oval(ctx,250,548,205,33,'#100d19a0');
  for(const [x,y] of [[.1,.28],[.9,.28],[.085,.92],[.915,.92]]){
   const top=project(x,y),foot=project(x,y,-.53),w=5+8*y;
   polygon(ctx,[[top[0]-w,top[1]],[top[0]+w,top[1]],[foot[0]+w,foot[1]],[foot[0]-w,foot[1]]],'#39404a');
   line(ctx,[top[0]-w+2,top[1]],[foot[0]-w+2,foot[1]],'#79818b',2);
  }
  line(ctx,project(.085,.92,-.37),project(.915,.92,-.37),'#2a2f3b',11);
  const farLeft=project(0,0),farRight=project(1,0),nearRight=project(1,1),nearLeft=project(0,1);
  polygon(ctx,[nearLeft,nearRight,[nearRight[0],nearRight[1]+12],[nearLeft[0],nearLeft[1]+12]],'#545e68');
  const top=ctx.createLinearGradient(0,184,0,498);
  top.addColorStop(0,'#207fe3');top.addColorStop(.48,'#1466c3');top.addColorStop(1,'#084b9f');
  polygon(ctx,[farLeft,farRight,nearRight,nearLeft],top);
  for(const [a,b] of [[farLeft,farRight],[farRight,nearRight],[nearRight,nearLeft],[nearLeft,farLeft]])line(ctx,a,b,'#eff4f5',4);
  line(ctx,project(.5,0),project(.5,1),'#eef5ff',3);
  const b=state.ball;
  if(b.x>=0&&b.x<=1&&b.y>=0&&b.y<=1&&b.z>=0){
   const [sx,sy]=project(b.x,b.y);oval(ctx,sx,sy,7+b.z*3,2.8,'#03142b65');
  }
  racket(ctx,state.ai,.08,state.aiSwing,false);
  if(b.y<.5)ball(ctx,b);
  const netBottom=project(-.065,.5),netTop=project(-.065,.5,.16);
  const netRight=project(1.065,.5,.16),netEnd=project(1.065,.5);
  polygon(ctx,[netTop,netRight,netEnd,netBottom],'#07131fa6');
  for(let i=0;i<=48;i++){
   const x=-.065+1.13*i/48;
   line(ctx,project(x,.5,.16),project(x,.5),'#8aa9ba79',.65);
  }
  for(let i=1;i<8;i++)line(ctx,project(-.065,.5,i*.02),project(1.065,.5,i*.02),'#8aa9ba79',.65);
  line(ctx,netTop,netRight,'#e3e9ea',4);
  line(ctx,netTop,netBottom,'#b6c2cc',6);line(ctx,netRight,netEnd,'#b6c2cc',6);
  racket(ctx,state.x,state.y,state.swing,true);
  if(b.y>=.5)ball(ctx,b);
  ctx.fillStyle='#121d31';ctx.fillRect(98,12,132,68);ctx.fillRect(250,12,132,68);
  text(ctx,'내 점수',164,34,16,'#a9e8ff');
  text(ctx,'CPU · Lv. '+state.level,316,34,16,'#ffb9ad');
  text(ctx,String(state.score),164,68,30,'#f2f7ff');
  text(ctx,String(state.opponent),316,68,30,'#f2f7ff');
  if(state.rallyEnd)text(ctx,state.rallyEnd.reason,240,118,22,'#ffe2a8');
 }
 root.TABLE_TENNIS_VIEW={draw};
})(window);
