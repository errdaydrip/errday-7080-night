// Original small arcade games. Pure simulation, shared by browser and tests.
(function(root){
 const H=typeof module!=='undefined'?require('./air-hockey'):root.AIR_HOCKEY;
 const TT=typeof module!=='undefined'?require('./table-tennis'):root.TABLE_TENNIS;
 const FIRST_BEAT=2, MAX_LEVEL=5;
 const TRACKS=[
  {name:'네온 시티', melody:[60,64,67,72,69,67,64,62], wave:'triangle'},
  {name:'스타라이트', melody:[69,72,76,74,72,67,64,67], wave:'sine'},
  {name:'미드나잇 런', melody:[57,60,64,60,55,59,62,67], wave:'square'},
  {name:'디스코 웨이브', melody:[65,69,72,74,72,69,67,62], wave:'triangle'},
  {name:'선셋 드라이브', melody:[62,65,69,72,70,67,65,69], wave:'sine'},
  {name:'라이트 스텝', melody:[67,71,74,76,74,71,69,74], wave:'triangle'},
  {name:'전기 불꽃', melody:[64,67,71,76,74,71,69,67], wave:'sawtooth'},
  {name:'달빛 트랙', melody:[60,63,67,70,72,70,67,63], wave:'sine'}
 ];
 const PUMP_STEPS=[0,2,4,2,1,3,2,4,3,2,1,0,2,4,0,2];
 const isRhythm=kind=>kind==='rhythm'||kind==='ddr'||kind==='pump';
 const hasStages=kind=>isRhythm(kind)||kind==='breaker'||kind==='racer'||kind==='mole';
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),SHAPES=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]]];
 function create(kind,seed=Date.now(),level=1,track){
  if(kind==='pingpong')return TT.create();
  if(kind==='hockey')return H.create();
  let n=seed>>>0;const random=()=>{n=(1664525*n+1013904223)>>>0;return n/4294967296;};
  const s={kind,t:0,score:0,lives:3,over:false,won:false,event:0,random,cool:0,hit:0};
  if(hasStages(kind))s.level=level;
  if(kind==='blocks'){s.grid=Array.from({length:20},()=>Array(10).fill(0));s.lines=0;s.bag=[];s.next=null;spawn(s);}
  else if(kind==='shooter'){s.x=.5;s.bullets=[];s.shots=[];s.wave=0;wave(s);}
  else if(kind==='breaker'){
   s.x=.5;s.ball={x:.5,y:.72,vx:.26,vy:-.48};s.bricks=[];
   s.items=[];s.swipe=0;s.broken=0;s.wideUntil=0;s.slowUntil=0;s.halfWidth=.11;
   for(let row=0;row<level+4;row++){
    for(let col=0;col<8;col++){
     if(level>1&&(col+row*2+level)%9===0)continue;
     s.bricks.push({x:.08+col*.12,y:.13+row*.055,alive:true,row,hp:level>=3&&(col+row)%4===0?2:1});
    }
   }
  }
  else if(kind==='racer'){s.x=.5;s.cars=[];s.spawn=.7;s.distance=0;s.duration=25;s.roadSpeed=.36+(level-1)*.095;}
  else if(kind==='mole'){
   s.time=20;s.nextPop=.25;s.holes=Array(9).fill(null);
   s.combo=0;s.caught=0;s.goal=[10,15,20,25,30][level-1];
  }
  else if(isRhythm(kind)){
   s.health=100;s.combo=0;s.maxCombo=0;s.judgement='READY';s.lanes=kind==='pump'?5:4;
   const song=track??Math.floor(random()*TRACKS.length);
   s.track=TRACKS[song];
   s.bpm=[104,116,128,142,156][level-1];s.beat=60/s.bpm;s.window=[.205,.185,.165,.145,.13][level-1];
   s.notes=[];
   const count=24+level*4;
   const offset=Math.floor(random()*s.lanes);
   for(let i=0;i<count;i++){
    const lane=kind==='pump'?(PUMP_STEPS[(i+song)%PUMP_STEPS.length]+offset)%s.lanes:Math.floor(random()*s.lanes);
    s.notes.push({lane,at:FIRST_BEAT+i*s.beat,judged:false});
    if(level>1&&i%(7-level)===2%(7-level)&&i<count-1){
     s.notes.push({lane:(lane+1+Math.floor(random()*(s.lanes-1)))%s.lanes,at:FIRST_BEAT+(i+.5)*s.beat,judged:false});
    }
   }
   s.duration=FIRST_BEAT+count*s.beat;
  }
  else if(kind==='pingpong'){s.x=.5;s.y=.86;s.ai=.5;s.aiY=.14;s.opponent=0;s.ball={x:.5,y:.5,vx:0,vy:0};s.serve=true;}
  else throw Error('Unknown arcade game');
  return s;
 }
 function piece(s){if(!s.bag.length){s.bag=[0,1,2,3,4,5,6];for(let i=6;i>0;i--){const j=Math.floor(s.random()*(i+1));[s.bag[i],s.bag[j]]=[s.bag[j],s.bag[i]];}}return s.bag.pop();}
 function spawn(s){const k=s.next===null?piece(s):s.next;s.next=piece(s);s.shape=SHAPES[k].map(r=>r.slice());s.colour=k+1;s.px=Math.floor((10-s.shape[0].length)/2);s.py=0;s.fall=0;if(collide(s,s.shape,s.px,s.py))s.over=true;}
 function collide(s,p,x,y){return p.some((r,j)=>r.some((v,i)=>v&&(x+i<0||x+i>=10||y+j>=20||(y+j>=0&&s.grid[y+j][x+i]))));}
 function lock(s){s.shape.forEach((r,j)=>r.forEach((v,i)=>{if(v&&s.py+j>=0)s.grid[s.py+j][s.px+i]=s.colour;}));let lines=0;for(let y=19;y>=0;y--)if(s.grid[y].every(Boolean)){s.grid.splice(y,1);s.grid.unshift(Array(10).fill(0));lines++;y++;}s.lines+=lines;s.score+=[0,100,300,500,800][lines]||0;if(lines)s.event++;spawn(s);}
 function action(s,key){if(s.over||s.kind==='pingpong')return;if(s.kind==='hockey'){if(key==='fire')H.serve(s,0);return;}
  if(isRhythm(s.kind)&&/^lane[0-4]$/.test(key)&&+key.slice(4)<s.lanes){const lane=+key.slice(4),note=s.notes.find(n=>!n.judged&&n.lane===lane&&Math.abs(n.at-s.t)<s.window);if(note){const perfect=Math.abs(note.at-s.t)<s.window*.44;note.judged=true;note.hit=true;s.flashLane=lane;s.flashUntil=s.t+.16;s.combo++;s.maxCombo=Math.max(s.maxCombo,s.combo);s.score+=perfect?300:150;s.health=Math.min(100,s.health+2);s.judgement=perfect?'PERFECT':'GOOD';s.event++;}else{s.combo=0;s.health=Math.max(0,s.health-3);s.judgement='EARLY / LATE';s.event++;}return;}
  if(s.kind==='blocks'){
   if(key==='left'||key==='right'){const x=s.px+(key==='left'?-1:1);if(!collide(s,s.shape,x,s.py))s.px=x;}
   if(key==='rotate'){const p=s.shape[0].map((_,i)=>s.shape.map(r=>r[i]).reverse());for(const dx of [0,-1,1,-2,2])if(!collide(s,p,s.px+dx,s.py)){s.shape=p;s.px+=dx;break;}}
   if(key==='down'){if(!collide(s,s.shape,s.px,s.py+1)){s.py++;s.score++;}else lock(s);s.fall=0;}
   if(key==='fire'){while(!collide(s,s.shape,s.px,s.py+1)){s.py++;s.score+=2;}lock(s);}
  }else if(s.kind==='racer'&&(key==='left'||key==='right'))s.targetX=clamp((s.targetX??s.x)+(key==='left'?-.25:.25),.22,.78);
  else if(s.kind==='mole'&&/^tap[0-8]$/.test(key)){
   const mole=s.holes[+key.slice(3)];
   if(mole&&mole.hitAt===null&&s.t<mole.until-.14){
    mole.hitAt=s.t;s.caught++;
    s.score+=100+Math.min(10,s.combo++)*10;s.event++;
   }else if(!mole)s.combo=0;
  }
  else if(s.kind==='pingpong'&&key==='fire'&&s.serve){s.serve=false;s.ball={x:.5,y:.5,vx:(s.random()-.5)*.5,vy:.42};}
 }
 function wave(s){s.wave++;s.aliens=Array.from({length:24},(_,i)=>({x:.12+i%8*.105,y:.13+Math.floor(i/8)*.085,alive:true}));s.enemyTime=0;s.shift=0;}
 function lost(s){s.lives--;s.hit=.65;if(s.lives<=0)s.over=true;}
 function breaker(s,dt,input,dir){
  s.halfWidth=s.t<s.wideUntil?.16:.11;
  const oldX=s.x,target=input.pointerX??s.x+dir*dt*1.05;
  s.x=clamp(s.x+clamp(target-s.x,-2.7*dt,2.7*dt),s.halfWidth,1-s.halfWidth);
  const speed=(s.x-oldX)/Math.max(dt,.001);
  s.swipe+=(speed-s.swipe)*(1-Math.exp(-dt/.075));
  const b=s.ball,top=.075,paddleY=.865,r=.015;
  const steps=Math.max(1,Math.ceil(dt*240)),h=dt/steps*(s.t<s.slowUntil?.72:1);
  for(let step=0;step<steps;step++){
   const x=b.x,y=b.y;
   b.x+=b.vx*h;b.y+=b.vy*h;
   if(b.x<r||b.x>1-r){b.x=clamp(b.x,r,1-r);b.vx=b.x===r?Math.abs(b.vx):-Math.abs(b.vx);}
   if(b.y<top){b.y=top;b.vy=Math.abs(b.vy);}
   if(b.vy>0&&y<=paddleY&&b.y>=paddleY){
    const paddleX=oldX+(s.x-oldX)*(step+1)/steps;
    const offset=(b.x-paddleX)/s.halfWidth;
    if(Math.abs(offset)<1.12){
     const strike=.62*speed+.38*s.swipe;
     b.y=paddleY;b.vx=clamp(offset*.48+strike*.37,-.84,.84);
     b.vy=-(.51+s.level*.045+Math.min(.13,Math.abs(strike)*.065));s.event++;
    }
   }
   for(const q of s.bricks){
    if(!q.alive||Math.abs(b.x-q.x)>.065||Math.abs(b.y-q.y)>.033)continue;
    if(Math.abs(x-q.x)>=.065){b.x=x;b.vx*=-1;}else{b.y=y;b.vy*=-1;}
    if(--q.hp===0){
     q.alive=false;s.score+=50;
     if(++s.broken%6===0)s.items.push({x:q.x,y:q.y,type:['wide','slow','life'][(s.broken/6-1)%3]});
    }
    s.event++;break;
   }
   if(b.y>1.02){lost(s);s.ball={x:s.x,y:.74,vx:.25,vy:-.48-s.level*.045};break;}
  }
  for(const item of s.items){
   const y=item.y;item.y+=dt*.36;
   if(y<=.89&&item.y>=.89&&Math.abs(item.x-s.x)<s.halfWidth+.026){
    if(item.type==='wide')s.wideUntil=s.t+12;
    if(item.type==='slow')s.slowUntil=s.t+9;
    if(item.type==='life')s.lives=Math.min(5,s.lives+1);
    item.y=2;s.event++;
   }
  }
  s.items=s.items.filter(item=>item.y<1.05);
  if(s.bricks.every(q=>!q.alive)){s.won=true;s.over=true;}
 }
 function point(s,player){if(player){s.score++;s.event++;}else{s.opponent++;s.hit=.5;}s.serve=true;s.ball={x:.5,y:.5,vx:0,vy:0};if(s.score>=7||s.opponent>=7){s.over=true;s.won=s.score>=7;}}
 function update(s,dt,input={}){if(s.over)return;if(s.kind==='pingpong'){TT.update(s,dt,input);return;}if(s.kind==='hockey'){const p=s.paddles[0],speed=input.fire?2.4:1.2,target={x:input.pointerX??p.x+(input.axisX??((input.right?1:0)-(input.left?1:0)))*dt*speed,y:input.pointerY??p.y+(input.axisY??((input.down?1:0)-(input.up?1:0)))*dt*speed/H.K.aspect};if(s.serve&&s.serveSide===1&&s.serveTime>.7)H.serve(s,1);H.update(s,dt,[target,H.ai(s,dt)]);return;}s.t+=dt;s.cool=Math.max(0,s.cool-dt);s.hit=Math.max(0,s.hit-dt);const dir=(input.right?1:0)-(input.left?1:0);
  if(s.kind==='blocks'){s.fall+=dt;if(s.fall>=Math.max(.1,.72-s.lines*.015)){action(s,'down');s.fall=0;}return;}
  if(s.kind==='shooter'){
   s.x=clamp(input.pointerX??s.x+dir*dt*.75,.05,.95);if(input.fire&&s.cool<=0){s.bullets.push({x:s.x,y:.85});s.cool=.18;}
   s.shift=Math.sin(s.t*.7)*.065;s.enemyTime+=dt;
   if(s.enemyTime>Math.max(.32,1-s.wave*.08)){s.enemyTime=0;const a=s.aliens.filter(a=>a.alive);if(a.length){const q=a[Math.floor(s.random()*a.length)];s.shots.push({x:q.x+s.shift,y:q.y,vy:.28+s.wave*.025});}}
   for(const b of s.bullets){b.y-=dt*.9;for(const a of s.aliens)if(a.alive&&Math.abs(b.x-a.x-s.shift)<.04&&Math.abs(b.y-a.y)<.035){a.alive=false;b.y=-1;s.score+=100;s.event++;break;}}
   for(const b of s.shots){b.y+=dt*b.vy;if(s.hit<=0&&Math.abs(b.x-s.x)<.045&&Math.abs(b.y-.88)<.04){lost(s);b.y=2;}}
   s.bullets=s.bullets.filter(b=>b.y>0);s.shots=s.shots.filter(b=>b.y<1);if(s.aliens.every(a=>!a.alive))wave(s);return;
  }
  if(s.kind==='breaker'){breaker(s,dt,input,dir);return;}
  if(s.kind==='racer'){
   const target=clamp(input.pointerX??s.targetX??s.x,.22,.78);
   s.x+=clamp(target-s.x,-dt*1.95,dt*1.95);
   s.distance=Math.min(s.duration,s.distance+dt);s.score=Math.floor(s.distance*20);s.spawn-=dt;
   if(s.spawn<=0){
    const lane=Math.floor(s.random()*3);
    s.cars.push({x:.25+lane*.25,y:-.12,style:Math.floor(s.random()*3)});
    if(s.level>=3&&s.random()<s.level*.12)s.cars.push({x:.25+((lane+1)%3)*.25,y:-.12,style:Math.floor(s.random()*3)});
    s.spawn=1.42-s.level*.145;
   }
   for(const c of s.cars){
    c.y+=dt*s.roadSpeed;
    if(s.hit<=0&&Math.abs(c.x-s.x)<.09&&Math.abs(c.y-.83)<.103){lost(s);c.y=2;}
   }
   s.cars=s.cars.filter(c=>c.y<1.2);
   if(!s.over&&s.distance>=s.duration){s.over=true;s.won=true;}
   return;
  }
  if(s.kind==='mole'){
   s.time=Math.max(0,20-s.t);
   for(let i=0;i<s.holes.length;i++){
    const mole=s.holes[i];
    if(!mole)continue;
    if(mole.hitAt!==null?s.t>=mole.hitAt+.34:s.t>=mole.until){
     if(mole.hitAt===null)s.combo=0;
     s.holes[i]=null;
    }
   }
   if(s.t>=s.nextPop&&s.time>.35){
    const free=s.holes.flatMap((mole,i)=>mole?[]:[i]);
    if(free.length){
     const i=free[Math.floor(s.random()*free.length)];
     s.holes[i]={from:s.t,until:s.t+1.33-s.level*.13,hitAt:null};
    }
    s.nextPop=s.t+.99-s.level*.10;
   }
   if(s.time<=0){s.over=true;s.won=s.caught>=s.goal;}
   return;
  }
  if(isRhythm(s.kind)){for(const n of s.notes)if(!n.judged&&s.t>n.at+s.window){n.judged=true;s.health=Math.max(0,s.health-10);s.combo=0;s.judgement='MISS';s.hit=.2;s.event++;}if(s.health<=0||s.t>=s.duration){s.over=true;s.won=s.health>0;}return;}
  if(s.kind==='pingpong'){
   s.x=clamp(input.pointerX??s.x+dir*dt*.85,.08,.92);
   const b=s.ball;s.ai+=clamp(b.x-s.ai,-.43*dt,.43*dt);s.ai=clamp(s.ai,.1,.9);if(s.serve)return;
   const old=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;
   if(b.x<.025||b.x>.975){b.x=clamp(b.x,.025,.975);b.vx*=-1;}
   if(b.vy>0&&old<.84&&b.y>=.84&&Math.abs(b.x-s.x)<.13){b.y=.84;b.vy=-Math.min(.86,Math.abs(b.vy)+.025);b.vx=(b.x-s.x)*3;s.event++;}
   if(b.vy<0&&old>.16&&b.y<=.16&&Math.abs(b.x-s.ai)<.13){b.y=.16;b.vy=Math.min(.86,Math.abs(b.vy)+.025);b.vx=(b.x-s.ai)*2.8;}
   if(b.y<0||b.y>1)point(s,b.y<0);
  }
 }
 const api={create,action,update,collide,SHAPES,isRhythm,hasStages,TRACKS,MAX_LEVEL,FIRST_BEAT};if(typeof module!=='undefined')module.exports=api;else root.ARCADE_CORE=api;
})(typeof window!=='undefined'?window:this);
