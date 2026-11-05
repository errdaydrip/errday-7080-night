// A bouncing ball and paddle contact, using table coordinates and metres for height.
(function(root){
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function create(){return {kind:'pingpong',level:1,t:0,score:0,opponent:0,over:false,won:false,event:0,serve:true,serveTime:0,x:.5,y:.94,strokeX:0,strokeY:0,ai:.5,aiTarget:.5,aiReaction:0,swing:0,aiSwing:0,ball:{x:.5,y:.72,z:.35,vx:0,vy:0,vz:0},last:0,bounces:0};}
 function point(s,player){if(player)s.score++;else s.opponent++;s.event++;s.serve=true;s.serveTime=0;s.ball={x:.5,y:.72,z:.35,vx:0,vy:0,vz:0};s.bounces=0;if(s.score>=7||s.opponent>=7){s.over=true;s.won=s.score>=7;}}
 function serve(s){s.serve=false;s.ball={x:s.x,y:.82,z:.38,vx:0,vy:-.72,vz:1.6};s.last=0;s.bounces=0;}
 function update(s,dt,input={}){
  if(s.over)return;
  dt=Math.min(.04,dt);s.t+=dt;s.swing=Math.max(0,s.swing-dt);s.aiSwing=Math.max(0,s.aiSwing-dt);
  const oldX=s.x,oldY=s.y;
  s.x=clamp(input.pointerX??s.x+(input.axisX??((input.right?1:0)-(input.left?1:0)))*dt,.1,.9);
  s.y=clamp(input.pointerY===undefined?s.y+(input.axisY??((input.down?1:0)-(input.up?1:0)))*dt*.5:.76+(input.pointerY-.5)*.36,.76,.94);
  // Short motion memory keeps a swipe effective between pointer events.
  const blend=1-Math.exp(-dt/.07);
  s.strokeX+=(clamp((s.x-oldX)/Math.max(dt,.001),-3,3)-s.strokeX)*blend;
  s.strokeY+=(clamp((s.y-oldY)/Math.max(dt,.001),-2,2)-s.strokeY)*blend;
  const progress=1-Math.exp(-Math.max(0,s.level-1)/8);
  const aiSpeed=.97+.41*progress,aiDelay=.095-.067*progress;
  s.aiReaction-=dt;
  if(s.aiReaction<=0){
   const ball=s.ball;
   const timeToReturn=ball.vy<0?clamp((.14-ball.y)/ball.vy,0,.65):0;
   const target=ball.vy>0?.5:ball.x+ball.vx*timeToReturn;
   s.aiTarget=clamp(target,.045,.955);
   s.aiReaction=aiDelay;
  }
  s.ai+=clamp(s.aiTarget-s.ai,-dt*aiSpeed,dt*aiSpeed);
  if(s.serve){s.serveTime+=dt;if(s.serveTime>.9)serve(s);return;}
  const b=s.ball,steps=8,h=dt/steps;
  for(let i=0;i<steps&&!s.serve;i++){
   const prevY=b.y;b.x+=b.vx*h;b.y+=b.vy*h;b.z+=b.vz*h;b.vz-=5.8*h;
   if((prevY-.5)*(b.y-.5)<0&&b.z<.16){point(s,s.last===1);break;}
   if(b.z<.025&&b.vz<0){
    if(b.x<.04||b.x>.96||b.y<.04||b.y>.96){point(s,s.last===1);break;}
    const expected=s.last===0?b.y<.5:b.y>.5;
    if(!expected){point(s,s.last===1);break;}
    if(++s.bounces>1){point(s,s.last===0);break;}
    b.z=.025;b.vz=-b.vz*.84;s.event++;
   }
   const player=b.vy>0,hit=player?b.y>=s.y-.04:b.y<=.14;
   if(hit&&s.bounces===1&&b.z>.04&&b.z<.62){
    const paddle=player?s.x:s.ai;
    if(Math.abs(b.x-paddle)<.13){
     const offset=(b.x-paddle)/.13;
     const force=player?clamp(Math.hypot(s.strokeX,s.strokeY*1.6)/1.6,0,1):.35;
     const speed=.65+force*.65;
     b.y=player?s.y-.045:.15;
     b.vy=player?-speed:.98+.23*progress;
     // Aim the arc at the opposing half, so harder shots still bounce on the table.
     let landing=.26;
     let aimX;
     if(!player){
      s.cpuReturns=(s.cpuReturns||0)+1;
      // Usually attack the open corner, with an occasional change down the other side.
      const openRight=s.x<=.5;
      const aimRight=s.cpuReturns%4===0?!openRight:openRight;
      aimX=aimRight?.91:.09;
      landing=s.cpuReturns%2===0?.79:.74;
     }
     const flight=Math.abs(landing-b.y)/Math.abs(b.vy);
     if(player)aimX=b.x+clamp(offset*.4+s.strokeX*.85,-1.15,1.15)*flight;
     const landingX=clamp(aimX,.075,.925);
     b.vx=(landingX-b.x)/flight;
     b.vz=clamp((2.9*flight*flight-b.z)/flight,.6,3);
     s.last=player?0:1;s.bounces=0;s.event++;if(player)s.swing=.22;else s.aiSwing=.22;
    }
   }
   if(b.y<-.1||b.y>1.1||b.z<-.35){point(s,s.last===1);break;}
  }
 }
 const api={create,update};if(typeof module!=='undefined')module.exports=api;else root.TABLE_TENNIS=api;
})(typeof window!=='undefined'?window:this);
