// Original small arcade games. Pure simulation, shared by browser and tests.
(function(root){
 const H=typeof module!=='undefined'?require('./air-hockey'):root.AIR_HOCKEY;
 const TT=typeof module!=='undefined'?require('./table-tennis'):root.TABLE_TENNIS;
 const BEAT=.48, FIRST_BEAT=2;
 const PUMP_STEPS=[0,2,4,2,1,3,2,4,3,2,1,0,2,4,0,2];
 const isRhythm=kind=>kind==='rhythm'||kind==='ddr'||kind==='pump';
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),SHAPES=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]]];
 function create(kind,seed=Date.now()){
  if(kind==='pingpong')return TT.create();
  if(kind==='hockey')return H.create();
  let n=seed>>>0;const random=()=>{n=(1664525*n+1013904223)>>>0;return n/4294967296;};
  const s={kind,t:0,score:0,lives:3,over:false,won:false,event:0,random,cool:0,hit:0};
  if(kind==='blocks'){s.grid=Array.from({length:20},()=>Array(10).fill(0));s.lines=0;s.bag=[];s.next=null;spawn(s);}
  else if(kind==='shooter'){s.x=.5;s.bullets=[];s.shots=[];s.wave=0;wave(s);}
  else if(kind==='breaker'){s.x=.5;s.ball={x:.5,y:.72,vx:.3,vy:-.48};s.bricks=Array.from({length:40},(_,i)=>({x:.075+i%8*.12,y:.14+Math.floor(i/8)*.065,alive:true,row:Math.floor(i/8)}));}
  else if(kind==='racer'){s.x=.5;s.cars=[];s.spawn=0;s.distance=0;}
  else if(kind==='reflex'){s.target=Math.floor(random()*9);s.time=30;s.targetAge=0;s.combo=0;}
  else if(isRhythm(kind)){
   s.health=100;s.combo=0;s.maxCombo=0;s.judgement='READY';s.lanes=kind==='pump'?5:4;
   s.notes=Array.from({length:84},(_,i)=>({
    lane:kind==='pump'?PUMP_STEPS[i%PUMP_STEPS.length]:Math.floor(random()*4),
    at:FIRST_BEAT+i*BEAT,judged:false
   }));
   s.duration=44;
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
  if(isRhythm(s.kind)&&/^lane[0-4]$/.test(key)&&+key.slice(4)<s.lanes){const lane=+key.slice(4),note=s.notes.find(n=>!n.judged&&n.lane===lane&&Math.abs(n.at-s.t)<.18);if(note){const perfect=Math.abs(note.at-s.t)<.08;note.judged=true;note.hit=true;s.flashLane=lane;s.flashUntil=s.t+.16;s.combo++;s.maxCombo=Math.max(s.maxCombo,s.combo);s.score+=perfect?300:150;s.health=Math.min(100,s.health+2);s.judgement=perfect?'PERFECT':'GOOD';s.event++;}else{s.combo=0;s.health=Math.max(0,s.health-3);s.judgement='EARLY / LATE';}return;}
  if(s.kind==='blocks'){
   if(key==='left'||key==='right'){const x=s.px+(key==='left'?-1:1);if(!collide(s,s.shape,x,s.py))s.px=x;}
   if(key==='rotate'){const p=s.shape[0].map((_,i)=>s.shape.map(r=>r[i]).reverse());for(const dx of [0,-1,1,-2,2])if(!collide(s,p,s.px+dx,s.py)){s.shape=p;s.px+=dx;break;}}
   if(key==='down'){if(!collide(s,s.shape,s.px,s.py+1)){s.py++;s.score++;}else lock(s);s.fall=0;}
   if(key==='fire'){while(!collide(s,s.shape,s.px,s.py+1)){s.py++;s.score+=2;}lock(s);}
  }else if(s.kind==='racer'&&(key==='left'||key==='right'))s.x=clamp(s.x+(key==='left'?-.25:.25),.25,.75);
  else if(s.kind==='reflex'&&/^tap[0-8]$/.test(key)){const k=+key.slice(3);if(k===s.target){s.score+=10+Math.min(20,s.combo++);s.target=(s.target+1+Math.floor(s.random()*8))%9;s.targetAge=0;s.event++;}else{s.combo=0;s.score=Math.max(0,s.score-5);}}
  else if(s.kind==='pingpong'&&key==='fire'&&s.serve){s.serve=false;s.ball={x:.5,y:.5,vx:(s.random()-.5)*.5,vy:.42};}
 }
 function wave(s){s.wave++;s.aliens=Array.from({length:24},(_,i)=>({x:.12+i%8*.105,y:.13+Math.floor(i/8)*.085,alive:true}));s.enemyTime=0;s.shift=0;}
 function lost(s){s.lives--;s.hit=.65;if(s.lives<=0)s.over=true;}
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
  if(s.kind==='breaker'){
   s.x=clamp(input.pointerX??s.x+dir*dt*.8,.1,.9);const b=s.ball;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x<.018||b.x>.982){b.x=clamp(b.x,.018,.982);b.vx*=-1;}if(b.y<.07){b.y=.07;b.vy=Math.abs(b.vy);}
   if(b.vy>0&&b.y>.865&&b.y<.91&&Math.abs(b.x-s.x)<.12){b.y=.865;b.vy=-Math.abs(b.vy);b.vx=(b.x-s.x)*4;}
   for(const q of s.bricks)if(q.alive&&Math.abs(b.x-q.x)<.055&&Math.abs(b.y-q.y)<.032){q.alive=false;b.vy*=-1;s.score+=50;s.event++;break;}
   if(b.y>1.02){lost(s);s.ball={x:s.x,y:.72,vx:.26,vy:-.48};}if(s.bricks.every(q=>!q.alive)){s.won=true;s.over=true;}return;
  }
  if(s.kind==='racer'){
   s.distance+=dt;s.score=Math.floor(s.distance*20);s.spawn-=dt;if(s.spawn<=0){s.cars.push({x:.25+Math.floor(s.random()*3)*.25,y:-.12});s.spawn=Math.max(.42,1.05-s.distance*.008);}
   for(const c of s.cars){c.y+=dt*(.32+Math.min(.3,s.distance*.003));if(s.hit<=0&&Math.abs(c.x-s.x)<.08&&Math.abs(c.y-.83)<.09){lost(s);c.y=2;}}s.cars=s.cars.filter(c=>c.y<1.2);if(s.distance>=60){s.over=true;s.won=true;}return;
  }
  if(s.kind==='reflex'){s.time=Math.max(0,30-s.t);s.targetAge+=dt;if(s.targetAge>1.15){s.target=(s.target+1+Math.floor(s.random()*8))%9;s.targetAge=0;s.combo=0;}if(s.time<=0)s.over=true;return;}
  if(isRhythm(s.kind)){for(const n of s.notes)if(!n.judged&&s.t>n.at+.18){n.judged=true;s.health=Math.max(0,s.health-10);s.combo=0;s.judgement='MISS';s.hit=.2;}if(s.health<=0||s.t>=s.duration){s.over=true;s.won=s.health>0;}return;}
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
 const api={create,action,update,collide,SHAPES,isRhythm,BEAT,FIRST_BEAT};if(typeof module!=='undefined')module.exports=api;else root.ARCADE_CORE=api;
})(typeof window!=='undefined'?window:this);
