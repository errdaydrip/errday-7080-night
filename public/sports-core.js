// Small original sports simulations, with AI tennis, cue-ball physics and ten-pin scoring.
(function(root){const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function rack(s){s.pins=[];for(let row=0;row<4;row++)for(let i=0;i<=row;i++)s.pins.push({x:.5+(i-row/2)*.072,y:.29-row*.064,fallen:false,vx:0,vy:0});}
 function bowlingScore(rolls){let score=0,i=0;for(let f=0;f<10&&i<rolls.length;f++){const a=rolls[i]||0,b=rolls[i+1]||0;if(a===10){score+=10+b+(rolls[i+2]||0);i++;}else if(a+b===10){score+=10+(rolls[i+2]||0);i+=2;}else{score+=a+b;i+=2;}}return score;}
 function create(kind,seed){if(kind==='tennis'){const s=ARCADE_CORE_LOCAL().create('pingpong',seed);s.kind='tennis';return s;}
  const s={kind,t:0,score:0,event:0,hit:0,over:false,won:false,cool:0};
  if(kind==='bowling'){s.aim=0;s.power=.7;s.frame=0;s.frames=[[]];s.rolls=[];s.ball=null;s.shotTime=0;s.standing=10;rack(s);}
  else if(kind==='billiards'){s.angle=-Math.PI/2;s.power=.65;s.balls=[{x:.5,y:.77,vx:0,vy:0,cue:true,alive:true}];for(let row=0;row<3;row++)for(let i=0;i<=row;i++)s.balls.push({x:.5+(i-row/2)*.075,y:.28-row*.067,vx:0,vy:0,cue:false,alive:true});s.shots=0;}
  else if(kind==='futsal'){s.x=.5;s.y=.8;s.ball={x:.5,y:.75,vx:0,vy:0,free:false};s.keeper=.5;s.defenders=[{x:.3,y:.42},{x:.7,y:.52}];s.time=60;}
  else throw Error('Unknown sports game');return s;
 }
 function ARCADE_CORE_LOCAL(){return typeof module!=='undefined'?require('./arcade-core'):root.ARCADE_CORE;}
 function moving(s){return s.balls.some(b=>b.alive&&Math.hypot(b.vx,b.vy)>.012);}
 function action(s,key){if(s.over)return;if(s.kind==='tennis'){s.kind='pingpong';ARCADE_CORE_LOCAL().action(s,key);s.kind='tennis';return;}
  if(s.kind==='bowling'&&key==='fire'&&!s.ball){s.ball={x:.5,y:.92,vx:s.aim*.5,vy:-(.75+s.power*.75)};s.shotTime=0;s.before=s.pins.filter(p=>!p.fallen).length;s.event++;}
  if(s.kind==='billiards'&&key==='fire'&&!moving(s)){const cue=s.balls[0];cue.vx=Math.cos(s.angle)*(.45+s.power*1.1);cue.vy=Math.sin(s.angle)*(.45+s.power*1.1);s.shots++;s.event++;}
  if(s.kind==='futsal'&&key==='fire'&&!s.ball.free){const aim=.5-s.ball.x;s.ball.vx=aim*.5;s.ball.vy=-1.25;s.ball.free=true;s.cool=.3;s.event++;}
 }
 function rollDone(s){const down=s.before-s.pins.filter(p=>!p.fallen).length;s.rolls.push(down);const f=s.frames[s.frame];f.push(down);s.score=bowlingScore(s.rolls);s.ball=null;let reset=false;
  if(s.frame<9){if(down===10||f.length===2){s.frame++;s.frames.push([]);reset=true;}}
  else if(f.length===1){reset=down===10;}
  else if(f.length===2){if(f[0]===10)reset=down===10;else if(f[0]+f[1]===10)reset=true;else s.over=true;}
  else{s.over=true;}if(reset)rack(s);if(s.over)s.won=true;s.event++;
 }
 function update(s,dt,input={}){if(s.over)return;if(s.kind==='tennis'){s.kind='pingpong';ARCADE_CORE_LOCAL().update(s,dt,input);s.kind='tennis';return;}s.t+=dt;s.hit=Math.max(0,s.hit-dt);s.cool=Math.max(0,s.cool-dt);const dir=(input.right?1:0)-(input.left?1:0),vertical=(input.down?1:0)-(input.up?1:0);
  if(s.kind==='bowling'){
   if(!s.ball){s.aim=clamp(input.pointerX!==undefined?(input.pointerX-.5)*1.6:s.aim+dir*dt*.6,-.7,.7);s.power=clamp(s.power-vertical*dt*.35,.3,1);return;}
   s.shotTime+=dt;const b=s.ball;b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=Math.exp(-dt*.35);if(b.x<.08||b.x>.92){b.gutter=true;b.x=clamp(b.x,.045,.955);}
   for(const p of s.pins){if(!p.fallen&&!b.gutter&&Math.hypot(b.x-p.x,b.y-p.y)<.062){p.fallen=true;p.vx=b.vx*.6+(p.x-b.x)*5;p.vy=b.vy*.65;s.event++;}if(p.fallen){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-dt*3);p.vy*=Math.exp(-dt*3);for(const q of s.pins)if(!q.fallen&&Math.hypot(p.x-q.x,p.y-q.y)<.07){q.fallen=true;q.vx=p.vx*.7+(q.x-p.x)*3;q.vy=p.vy*.7;s.event++;}}}
   if(s.shotTime>2.6)rollDone(s);return;
  }
  if(s.kind==='billiards'){
   const cue=s.balls[0];if(!moving(s)){if(!cue.alive){cue.alive=true;cue.x=.5;cue.y=.77;}s.angle+=dir*dt*1.2;s.power=clamp(s.power-vertical*dt*.4,.2,1);if(input.pointerX!==undefined)s.angle=Math.atan2((input.pointerY??.3)-cue.y,input.pointerX-cue.x);}
   const pockets=[[.07,.08],[.93,.08],[.07,.5],[.93,.5],[.07,.92],[.93,.92]];
   for(let step=0;step<4;step++){const d=dt/4;for(const b of s.balls)if(b.alive){b.x+=b.vx*d;b.y+=b.vy*d;b.vx*=Math.exp(-d*1.25);b.vy*=Math.exp(-d*1.25);if(Math.hypot(b.vx,b.vy)<.012)b.vx=b.vy=0;if(pockets.some(p=>Math.hypot(b.x-p[0],b.y-p[1])<.052)){b.alive=false;b.vx=b.vy=0;if(b.cue){s.score=Math.max(0,s.score-10);s.hit=.4;}else{s.score+=100;s.event++;}continue;}if(b.x<.09||b.x>.91){b.x=clamp(b.x,.09,.91);b.vx*=-.85;}if(b.y<.1||b.y>.9){b.y=clamp(b.y,.1,.9);b.vy*=-.85;}}
    for(let i=0;i<s.balls.length;i++)for(let j=i+1;j<s.balls.length;j++){const a=s.balls[i],b=s.balls[j];if(!a.alive||!b.alive)continue;const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy);if(l>0&&l<.06){const nx=dx/l,ny=dy/l,v=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(v>0){a.vx-=v*nx;a.vy-=v*ny;b.vx+=v*nx;b.vy+=v*ny;}const shift=(.06-l)/2+.0001;a.x-=nx*shift;a.y-=ny*shift;b.x+=nx*shift;b.y+=ny*shift;}}
   }
   if(s.balls.slice(1).every(b=>!b.alive)){s.over=true;s.won=true;}return;
  }
  if(s.kind==='futsal'){
   s.time=Math.max(0,60-s.t);s.x=clamp(input.pointerX??s.x+dir*dt*.55,.1,.9);s.y=clamp(input.pointerY??s.y+vertical*dt*.55,.22,.9);s.keeper+=clamp(s.ball.x-s.keeper,-.35*dt,.35*dt);s.keeper=clamp(s.keeper,.32,.68);
   s.defenders.forEach((d,i)=>{d.x=.5+Math.sin(s.t*(.8+i*.2)+i*3)*.29;if(!s.ball.free&&Math.hypot(s.x-d.x,s.y-d.y)<.08){s.x=.5;s.y=.85;s.hit=.4;}});
   const b=s.ball;if(!b.free){b.x=s.x;b.y=s.y-.065;}else{b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=Math.exp(-dt*.5);b.vy*=Math.exp(-dt*.5);if(b.y<.12&&b.vy<0&&Math.abs(b.x-s.keeper)<.09){b.vy=.6;s.hit=.3;}for(const d of s.defenders)if(Math.hypot(b.x-d.x,b.y-d.y)<.06&&b.vy<0)b.vx+=(b.x<d.x?-.5:.5);if(b.y<.055){if(b.x>.3&&b.x<.7){s.score++;s.event++;}b.free=false;s.x=.5;s.y=.8;}else if(b.x<.04||b.x>.96||b.y>.95)b.free=false;}
   if(s.time<=0){s.over=true;s.won=s.score>0;}return;
  }
 }
 const api={create,action,update,moving,bowlingScore};if(typeof module!=='undefined')module.exports=api;else root.SPORTS_CORE=api;
})(typeof window!=='undefined'?window:this);
