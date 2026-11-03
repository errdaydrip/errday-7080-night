// A bouncing ball and paddle contact, using table coordinates and metres for height.
(function(root){
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function create(){return {kind:'pingpong',t:0,score:0,opponent:0,over:false,won:false,event:0,serve:true,serveTime:0,x:.5,ai:.5,swing:0,aiSwing:0,ball:{x:.5,y:.72,z:.35,vx:0,vy:0,vz:0},last:0,bounces:0};}
 function point(s,player){if(player)s.score++;else s.opponent++;s.event++;s.serve=true;s.serveTime=0;s.ball={x:.5,y:.72,z:.35,vx:0,vy:0,vz:0};s.bounces=0;if(s.score>=7||s.opponent>=7){s.over=true;s.won=s.score>=7;}}
 function serve(s){s.serve=false;s.ball={x:s.x,y:.82,z:.38,vx:0,vy:-.72,vz:1.6};s.last=0;s.bounces=0;}
 function update(s,dt,input={}){
  if(s.over)return;
  dt=Math.min(.04,dt);s.t+=dt;s.swing=Math.max(0,s.swing-dt);s.aiSwing=Math.max(0,s.aiSwing-dt);
  const old=s.x;s.x=clamp(input.pointerX??s.x+((input.right?1:0)-(input.left?1:0))*dt,.1,.9);
  s.ai+=clamp(s.ball.x-s.ai,-dt*.6,dt*.6);
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
   const player=b.vy>0,hit=player?b.y>=.86:b.y<=.14;
   if(hit&&s.bounces===1&&b.z>.04&&b.z<.62){
    const paddle=player?s.x:s.ai;
    if(Math.abs(b.x-paddle)<.13){
     b.y=player?.85:.15;b.vy=player?-.82:.82;b.vz=1.65;
     b.vx=clamp((b.x-paddle)*2+(player?(s.x-old)/Math.max(dt,.001)*.12:0),-.32,.32);
     s.last=player?0:1;s.bounces=0;s.event++;if(player)s.swing=.22;else s.aiSwing=.22;
    }
   }
   if(b.y<-.1||b.y>1.1||b.z<-.35){point(s,s.last===1);break;}
  }
 }
 const api={create,update};if(typeof module!=='undefined')module.exports=api;else root.TABLE_TENNIS=api;
})(typeof window!=='undefined'?window:this);
