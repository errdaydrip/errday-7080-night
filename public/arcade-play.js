// Playable cabinet UI. World movement pauses while a game is open.
(function(){
 const C=ARCADE_CORE,A=ARCADE,overlay=document.createElement('section');overlay.id='arcadeOverlay';overlay.className='hidden';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','arcadeTitle');
 overlay.innerHTML='<div class="arcade-shell"><header class="arcade-head"><div><div class="arcade-kicker">ERRDAY ARCADE / PLAYER ONE</div><h2 id="arcadeTitle"></h2></div><div class="arcade-head-actions"><button type="button" class="arcade-close" id="arcadePause">일시정지</button><button type="button" class="arcade-close" id="arcadeClose" aria-label="게임 종료">나가기 ✕</button></div></header><div class="arcade-info"><span>점수 <strong id="arcadeScore">0</strong></span><span>내 최고 <strong id="arcadeBest">0</strong></span><span id="arcadeStatus"></span></div><p class="arcade-instructions" id="arcadeHelp"></p><div class="arcade-stage"><canvas id="arcadeCanvas" width="480" height="600" tabindex="0" aria-label="오락실 게임 화면"></canvas><div class="arcade-cover" id="arcadeCover"><h3 id="arcadeCoverTitle">READY?</h3><p id="arcadeCoverText">준비되면 시작하세요</p><button type="button" class="arcade-start" id="arcadeStart">게임 시작</button></div></div><div class="arcade-controls" id="arcadeControls"></div><p class="arcade-footer">무료 플레이 · 게임별 개인 최고 기록으로 순위 집계</p></div>';
 document.body.appendChild(overlay);
 const $=id=>document.getElementById(id),canvas=$('arcadeCanvas'),ctx=canvas.getContext('2d'),W=480,H=600;
 let state=null,machine=null,gameMeta=null,input={},running=false,paused=false,frame=0,last=0,best=0,saved=false,focusBefore=null,repeat=0,audio=null,lastEvent=0,lastBeat=-99,sessionToken=null,startPending=false,openVersion=0;
 let hockeyMode='practice',hockeyMatch=null,hockeyJoining=false,netSeq=0,netSend=0,netServe=false,netTarget={x:.5,y:.82},netFrom=null,netTo=null,netAt=0;
 const colours=['#69ecfa','#b08cff','#ff85c4','#83edbc','#ffd16c','#8baaff','#ff9875'];
 const text=(v,x,y,size=22,c='#fff',align='center')=>{ctx.font=`bold ${size}px system-ui,sans-serif`;ctx.fillStyle=c;ctx.textAlign=align;ctx.fillText(v,x,y);};
 const box=(x,y,w,h,c,r=7)=>{ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
 const ball=(x,y,r,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();};
 const line=(x,y,a,b,c,width=2)=>{ctx.strokeStyle=c;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.stroke();};
 function sound(){if(typeof muted!=='undefined'&&muted)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(660,audio.currentTime);o.frequency.exponentialRampToValueAtTime(990,audio.currentTime+.06);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.09);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.1);}catch(e){}}
 function tableSound(kind,cue){
  if(typeof muted!=='undefined'&&muted)return;
  try{
   audio=audio||new (window.AudioContext||window.webkitAudioContext)();
   if(audio.state==='suspended')audio.resume().catch(()=>{});
   const t=audio.currentTime;
   function tone(hz,end,duration,gain,delay=0){
    const oscillator=audio.createOscillator(),envelope=audio.createGain(),at=t+delay;
    oscillator.type='triangle';oscillator.frequency.setValueAtTime(hz,at);
    oscillator.frequency.exponentialRampToValueAtTime(end,at+duration);
    envelope.gain.setValueAtTime(gain,at);envelope.gain.exponentialRampToValueAtTime(.001,at+duration);
    oscillator.connect(envelope);envelope.connect(audio.destination);oscillator.start(at);oscillator.stop(at+duration);
   }
   if(cue==='point'){tone(540,540,.13,.2);tone(810,810,.2,.19,.09);}
   else if(cue==='lost'){tone(440,330,.13,.16);tone(300,220,.18,.14,.08);}
   else if(cue==='hit')tone(kind==='pingpong'?1250:510,kind==='pingpong'?770:240,.075,.23);
   else if(cue==='bounce')tone(870,550,.055,.16);
   else if(cue==='net')tone(185,90,.09,.12);
   else tone(cue==='serve'?570:395,190,.065,.16);
  }catch(e){}
 }
 function rhythmBeat(beat){if(typeof muted!=='undefined'&&muted)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();audio.resume();const now=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(beat%2?120:180,now);osc.frequency.exponentialRampToValueAtTime(45,now+.12);gain.gain.setValueAtTime(.085,now);gain.gain.exponentialRampToValueAtTime(.001,now+.16);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(now+.17);if(beat>=0){const melody=audio.createOscillator(),g=audio.createGain(),notes=[262,330,392,523,440,392,330,294];melody.type='triangle';melody.frequency.value=notes[beat%8];g.gain.setValueAtTime(.022,now);g.gain.exponentialRampToValueAtTime(.001,now+.25);melody.connect(g);g.connect(audio.destination);melody.start();melody.stop(now+.26);}}catch(e){}}
 function save(){
  if(saved||!state||hockeyMatch||hockeyJoining)return;
  saved=true;
  best=Math.max(best,state.score);
  try{localStorage.setItem('arcade-best-'+state.kind,String(best));}catch(e){}
  $('arcadeBest').textContent=best;
  if(!running||!sessionToken||state.score<=0)return;
  const token=sessionToken;
  socket.timeout(5000).emit('arcadeFinish',{token,score:state.score},(error,result)=>{
   if(error||!result?.ok){sys(result?.error||'순위 저장 연결을 확인해 주세요');return;}
   if(window.ARCADE_PLAYING&&sessionToken===token&&state?.over&&result.rank>0&&result.rank<=3&&!['pingpong','hockey'].includes(state.kind)){
    $('arcadeCoverText').textContent='점수 '+state.score+' · 현재 '+result.rank+'위';
   }
  });
 }
 function cover(title,desc,button){$('arcadeCoverTitle').textContent=title;$('arcadeCoverText').textContent=desc;$('arcadeStart').textContent=button;$('arcadeCover').classList.remove('hidden');}
 let tableLevel=1;
 function finishRound(){
  const wonTable=tableGame()&&state.won;
  if(wonTable){
   tableLevel=Math.max(tableLevel,state.level+1);
  }
  save();
  const score=state.kind==='pingpong'
   ?'내 점수 '+state.score+' · CPU '+state.opponent
   :'점수 '+state.score+(state.opponent===undefined?'':' : '+state.opponent);
  cover(state.won?'CLEAR!':'GAME OVER',score+(wonTable?' · 다음 CPU Lv.'+tableLevel:''),wonTable?'다음 단계':'다시 도전');
 }
 function createGame(kind){
  const game=C.create(kind);
  if(kind==='pingpong'||kind==='hockey')game.level=tableLevel;
  return game;
 }
 function joystick(container){
  const stick=document.createElement('button');stick.type='button';stick.className='arcade-joystick';
  stick.setAttribute('aria-label','상하좌우 원형 조이스틱');
  stick.innerHTML='<span class="joystick-arrows" aria-hidden="true">↑<br>←　→<br>↓</span><span class="joystick-knob"></span>';
  const knob=stick.querySelector('.joystick-knob');let active=null;
  function move(event){
   const r=stick.getBoundingClientRect(),dx=event.clientX-r.left-r.width/2,dy=event.clientY-r.top-r.height/2;
   const radius=r.width*.32,distance=Math.hypot(dx,dy),scale=distance>radius?radius/distance:1;
   const x=dx*scale/radius,y=dy*scale/radius;
   delete input.pointerX;delete input.pointerY;
   input.axisX=Math.abs(x)>.12?x:0;input.axisY=Math.abs(y)>.12?y:0;
   knob.style.transform='translate('+dx*scale+'px,'+dy*scale+'px)';
  }
  stick.onpointerdown=event=>{
   if(!running||paused||state.over)return;
   event.preventDefault();event.stopPropagation();active=event.pointerId;stick.setPointerCapture(active);move(event);
  };
  stick.onpointermove=event=>{if(event.pointerId===active){event.preventDefault();event.stopPropagation();if(running&&!paused)move(event);}};
  function release(event){if(event.pointerId!==active)return;active=null;delete input.axisX;delete input.axisY;knob.style.transform='';}
  stick.onpointerup=release;stick.onpointercancel=release;stick.onlostpointercapture=release;
  container.append(stick);
 }
 function controls(){const table=['hockey','pingpong'].includes(state.kind);const rhythm=['rhythm','ddr'].includes(state.kind),bs=table?[['up','↑'],['left','←'],['down','↓'],['right','→']]:rhythm?[['lane0','←'],['lane1','↓'],['lane2','↑'],['lane3','→']]:state.kind==='blocks'?[['left','←'],['down','↓'],['rotate','↻'],['right','→'],['fire','내리기']]:state.kind==='hoops'?[['fire','슛']]:state.kind==='reflex'?[]:state.kind==='hockey'?[['left','←'],['up','↑'],['down','↓'],['right','→'],['fire','서브 / 강타']]:[['left','←'],['right','→'],...(['shooter','pingpong'].includes(state.kind)?[['fire',state.kind==='shooter'?'발사':'서브']]:[])];
  const el=$('arcadeControls');el.innerHTML='';if(table){joystick(el);return;}for(const [key,label] of bs){if(state.kind==='reflex')continue;const b=document.createElement('button');b.type='button';b.dataset.input=key;b.textContent=label;b.setAttribute('aria-label',label==='←'?'왼쪽':label==='→'?'오른쪽':label==='↓'?'아래':label==='↑'?'위':label);b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);delete input.pointerX;delete input.pointerY;press(key)};const release=()=>{input[key]=false;};b.onpointerup=release;b.onpointercancel=release;el.appendChild(b);}

 }
 function press(key){if(!running||paused||!state||state.over)return;input[key]=true;if(hockeyMatch){if(key==='fire')netServe=true;}else C.action(state,key);repeat=.13;}
 function togglePause(){if(hockeyMatch){input={};sys('실시간 대전은 일시정지할 수 없어요');return;}if(!running||state?.over)return;paused=!paused;input={};if(paused)cover('PAUSED','잠시 쉬어가세요','계속하기');else{$('arcadeCover').classList.add('hidden');last=performance.now();canvas.focus();}}
 function start(){
  try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();audio.resume();}catch(e){}
  if(paused){togglePause();return;}
  if(startPending)return;

  startPending=true;
  const version=openVersion,button=$('arcadeStart');
  button.disabled=true;
  socket.timeout(5000).emit('arcadeStart',{machineId:machine.id},(error,result)=>{
   if(version!==openVersion||!window.ARCADE_PLAYING)return;
   startPending=false;button.disabled=false;
   if(error||!result?.ok){cover('연결 확인',result?.error||'다시 시도해 주세요','다시 시작');return;}
   sessionToken=result.token;
   state=createGame(machine.game);window.ARCADE_ACTIVE_STATE=state;
   saved=false;lastEvent=0;lastBeat=-99;input={};running=true;paused=false;
   last=performance.now();$('arcadeCover').classList.add('hidden');canvas.focus();
  });
 }
 function close(){if(!window.ARCADE_PLAYING)return;if(machine?.game==='hockey')socket.emit('hockeyCancelInvite');if(hockeyMatch)socket.emit('hockeyLeave',{id:hockeyMatch.id});save();hockeyMatch=null;hockeyJoining=false;window.ARCADE_HOCKEY_MATCH=null;openVersion++;startPending=false;cancelAnimationFrame(frame);frame=0;running=false;paused=false;input={};state=null;window.ARCADE_ACTIVE_STATE=null;window.ARCADE_PLAYING=false;overlay.classList.add('hidden');document.body.classList.remove('arcade-playing');scene.play();scene.renderer.setAnimationLoop(scene.render);window.ARCADE_DUCK=1;applyVolume();resetRollerMovement();if(focusBefore?.isConnected)focusBefore.focus();refreshAct(true);}
 function openGame(m,invited=false){
  if(!joined||!m||!invited&&(!A.inside(rig.object3D.position.x,rig.object3D.position.z)||Math.hypot(rig.object3D.position.x-m.spot.x,rig.object3D.position.z-m.spot.z)>2.1))return false;
  if(window.ARCADE_PLAYING)close();hockeyMode='practice';hockeyMatch=null;netFrom=null;netTo=null;openVersion++;sessionToken=null;startPending=false;$('arcadeStart').disabled=false;gameMeta=A.GAMES[m.game];machine=m;if(m.game==='pingpong'||m.game==='hockey')tableLevel=1;state=createGame(m.game);window.ARCADE_ACTIVE_STATE=state;focusBefore=document.activeElement;window.ARCADE_PLAYING=true;scene.pause();scene.renderer.setAnimationLoop(null);window.ARCADE_DUCK=.3;applyVolume();resetRollerMovement();window.RUN_HOLD=false;myDance=0;myYaw=m.yaw??Math.atan2(m.x-m.spot.x,m.z-m.spot.z);socket.emit('move',{pos:rig.object3D.position.toArray(),rot:myYaw,dance:0});input={};saved=false;running=false;paused=false;try{best=+localStorage.getItem('arcade-best-'+m.game)||0;}catch(e){best=0;}
  $('arcadeTitle').textContent=gameMeta.name;$('arcadeHelp').textContent=IS_MOBILE?({blocks:'← → 이동 · ↻ 회전 · ↓ 빠르게 · 내리기',shooter:'화면을 드래그하거나 ← →로 이동 · 발사 버튼 누르기',breaker:'화면을 드래그하거나 ← →로 패들 이동',racer:'← →로 차선을 바꿔 자동차를 피하세요',hoops:'슛 버튼을 눌러 움직이는 골대를 맞히세요',reflex:'빛나는 패널을 터치하세요',rhythm:'노트가 판정선에 닿을 때 방향 버튼을 터치하세요 · 125 BPM',ddr:'박자에 맞춰 아래 발판을 터치하세요 · 125 BPM',pingpong:'화면을 드래그해 라켓 이동 · 서브 버튼',hockey:'패들을 드래그해 밀어보세요 · 빠르게 밀수록 강타 · 서브 버튼'}[m.game]||gameMeta.controls):gameMeta.controls;$('arcadeBest').textContent=best;overlay.classList.toggle('table-game',['hockey','pingpong'].includes(m.game));controls();overlay.classList.remove('hidden');document.body.classList.add('arcade-playing');cover(gameMeta.name,gameMeta.subtitle,m.game==='hockey'?'게임시작':'게임 시작');$('arcadeStart').focus();last=performance.now();cancelAnimationFrame(frame);frame=requestAnimationFrame(loop);return true;
 };
 window.openArcadeGame=id=>openGame(A.machines.find(q=>q.id===id));
 window.closeArcadeGame=close;$('arcadePause').onclick=togglePause;$('arcadeClose').onclick=close;$('arcadeStart').onclick=start;

 function keyFor(e){if(['rhythm','ddr'].includes(state.kind))return {ArrowLeft:'lane0',ArrowDown:'lane1',ArrowUp:'lane2',ArrowRight:'lane3',KeyD:'lane0',KeyF:'lane1',KeyJ:'lane2',KeyK:'lane3'}[e.code];if(state.kind==='reflex'&&/^Digit[1-9]$/.test(e.code))return'tap'+(+e.code.slice(5)-1);return{ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowDown:'down',KeyS:'down',ArrowUp:['hockey','pingpong'].includes(state.kind)?'up':'rotate',KeyW:['hockey','pingpong'].includes(state.kind)?'up':'rotate',Space:'fire'}[e.code];}
 window.addEventListener('keydown',e=>{if(!window.ARCADE_PLAYING)return;if(e.code==='Tab'||(document.activeElement?.tagName==='BUTTON'&&['Enter','Space'].includes(e.code)))return;e.preventDefault();e.stopImmediatePropagation();if(e.code==='Escape'){close();return;}if(e.code==='KeyP'){if(!e.repeat)togglePause();return;}if(e.code==='Enter'&&!running){start();return;}const key=keyFor(e);if(key&&!e.repeat){delete input.pointerX;delete input.pointerY;press(key)}},true);
 window.addEventListener('keyup',e=>{if(!window.ARCADE_PLAYING)return;if(e.code==='Tab'||(document.activeElement?.tagName==='BUTTON'&&['Enter','Space'].includes(e.code)))return;e.preventDefault();e.stopImmediatePropagation();const key=keyFor(e);if(key)input[key]=false;},true);
 window.addEventListener('blur',()=>{if(window.ARCADE_PLAYING&&running&&!paused)togglePause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&window.ARCADE_PLAYING&&running&&!paused)togglePause()});
 let pointerId=null,pointerBounds=null;
 function pointer(e){const r=pointerBounds||canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;if(state.kind==='reflex'){if(e.type==='pointerdown'&&y>=.18&&y<.84)C.action(state,'tap'+(Math.floor((y-.18)/.22)*3+Math.min(2,Math.floor(x*3))));}else if(['shooter','breaker','pingpong','hockey'].includes(state.kind)){input.pointerX=Math.max(.05,Math.min(.95,x));input.pointerY=state.kind==='hockey'?Math.max(.56,Math.min(.865,y)):Math.max(.05,Math.min(.95,y));if(state.kind==='shooter')input.fire=true;}}
 function tableGame(){return state&&['hockey','pingpong'].includes(state.kind);}
 function pointerStart(e){
  if(!running||paused||e.target.closest('button')||(!tableGame()&&e.target!==canvas))return;
  e.preventDefault();delete input.axisX;delete input.axisY;pointerBounds=(tableGame()&&e.target!==canvas?overlay:canvas).getBoundingClientRect();pointerId=e.pointerId;overlay.setPointerCapture(e.pointerId);pointer(e);
 }
 overlay.addEventListener('pointerdown',pointerStart);
 overlay.addEventListener('pointermove',e=>{if(e.pointerId===pointerId&&running&&!paused)pointer(e)});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])overlay.addEventListener(name,()=>{pointerId=null;pointerBounds=null;input.fire=false;});
 function loop(now){if(!window.ARCADE_PLAYING)return;const dt=Math.min(.04,(now-last)/1000);last=now;

  if(running&&!paused&&!state.over&&!hockeyMatch){repeat-=dt;if(state.kind==='blocks'&&repeat<=0){for(const k of ['left','right','down'])if(input[k])C.action(state,k);repeat=input.down?.06:.13;}if(state.kind==='hoops'&&input.fire&&state.cool<=0)C.action(state,'fire');C.update(state,dt,input);if(['rhythm','ddr'].includes(state.kind)){const beat=Math.floor((state.t-2)/.48);if(beat!==lastBeat){lastBeat=beat;rhythmBeat(beat);}}if(state.event!==lastEvent){lastEvent=state.event;if(tableGame())tableSound(state.kind,state.sound);else sound();}if(state.over)finishRound();}

  draw();$('arcadeScore').textContent=state.score;$('arcadeStatus').textContent=state.health!==undefined?'ENERGY '+state.health+'%':state.time!==undefined?Math.ceil(state.time)+'초':state.opponent!==undefined?(hockeyMatch?((hockeyMatch.names[1-hockeyMatch.side]||'상대')+' '+state.opponent):(tableGame()?'CPU Lv.'+state.level+' · ':'AI ')+state.opponent)+' / 7점':state.kind==='blocks'?'LINE '+state.lines:'LIFE '+state.lives;
  frame=requestAnimationFrame(loop);
 }
 function draw(){ctx.fillStyle='#080e20';ctx.fillRect(0,0,W,H);const g=gameMeta;
  ctx.strokeStyle='#1a2944';ctx.lineWidth=1;for(let x=0;x<W;x+=40)line(x,0,x,H,'#14243c',1);for(let y=0;y<H;y+=40)line(0,y,W,y,'#14243c',1);
  if(state.kind==='blocks'){
   const cell=25,ox=50,oy=45;box(ox-3,oy-3,256,506,'#17243d');for(let y=0;y<20;y++)for(let x=0;x<10;x++)box(ox+x*cell,oy+y*cell,23,23,state.grid[y][x]?colours[state.grid[y][x]-1]:'#0a1327',3);
   state.shape.forEach((r,j)=>r.forEach((v,i)=>{if(v&&state.py+j>=0)box(ox+(state.px+i)*cell,oy+(state.py+j)*cell,23,23,colours[state.colour-1],3)}));text('NEXT',380,70,18,'#95b1d3');C.SHAPES[state.next].forEach((r,j)=>r.forEach((v,i)=>{if(v)box(330+i*24,100+j*24,21,21,colours[state.next],3)}));text('LINES',380,240,16,'#95b1d3');text(state.lines,380,280,34);text('LEVEL',380,350,16,'#95b1d3');text(1+Math.floor(state.lines/10),380,390,34);
  }else if(state.kind==='shooter'){
   for(let i=0;i<45;i++)ball((i*89)%480,(i*73+state.t*32)%600,1.3,'#6886b5');for(const a of state.aliens)if(a.alive){const x=(a.x+state.shift)*W,y=a.y*H;box(x-15,y-9,30,18,colours[Math.floor(a.y*20)%7],3);box(x-21,y-4,8,17,'#8bf5dc',2);box(x+13,y-4,8,17,'#8bf5dc',2);box(x-8,y-5,5,5,'#101a2e',0);box(x+4,y-5,5,5,'#101a2e',0);}for(const b of state.bullets)box(b.x*W-2,b.y*H,4,17,'#8df7ee',2);for(const b of state.shots)ball(b.x*W,b.y*H,4,'#ff75a7');ctx.fillStyle=state.hit>0?'#ff759e':'#88ecff';ctx.beginPath();ctx.moveTo(state.x*W,.84*H);ctx.lineTo(state.x*W-19,.91*H);ctx.lineTo(state.x*W+19,.91*H);ctx.fill();text('WAVE '+state.wave,60,30,14,'#acc4e2');
  }else if(state.kind==='breaker'){
   for(const q of state.bricks)if(q.alive)box(q.x*W-24,q.y*H-13,48,26,colours[q.row%7],5);box(state.x*W-51,.88*H,102,12,'#71e9f5',6);ball(state.ball.x*W,state.ball.y*H,7,'#fff');
  }else if(state.kind==='racer'){
   box(70,0,340,H,'#18263d',0);for(const x of [180,300])for(let y=-60;y<H;y+=100)box(x-2,(y+state.t*180)%700-50,4,48,'#7f95b4',0);const car=(x,y,c)=>{box(x-23,y-38,46,76,c,10);box(x-16,y-20,32,25,'#bce6ff',5);for(const dx of [-27,23])box(x+dx,y-22,5,44,'#070b16',2);};for(const c of state.cars)car(c.x*W,c.y*H,'#ff739f');car(state.x*W,.83*H,state.hit>0?'#ffd86a':'#73f3d4');text(Math.floor(state.distance)+' / 60s',240,40,18);
  }else if(state.kind==='hoops'){
   line(40,560,440,560,'#9f6f50',4);box(state.hoop*W-55,.16*H,110,60,'#273d5b');line(state.hoop*W-40,.28*H,state.hoop*W+40,.28*H,'#ff9770',7);for(let i=-2;i<=2;i++)line(state.hoop*W+i*16,.28*H,state.hoop*W+i*10,.37*H,'#e2edff',1);for(const b of state.balls){ball(b.x*W,b.y*H,16,'#ed8a48');line(b.x*W-14,b.y*H,b.x*W+14,b.y*H,'#482e25',2);}ball(240,540,19,'#f3a258');text('TIME YOUR SHOT',240,72,18,'#ffce99');
  }else if(state.kind==='reflex'){
   text('LIGHT TAP',240,65,26,'#7cf5d9');for(let i=0;i<9;i++){const x=i%3*160,y=.18*H+Math.floor(i/3)*.22*H;box(x+12,y+10,136,112,i===state.target?'#79f7dc':'#203451',14);text(i+1,x+80,y+80,40,i===state.target?'#122b39':'#6684a8');}text('COMBO '+state.combo,240,560,20,'#a3baff');
  }else if(state.kind==='rhythm'||state.kind==='ddr'){
   const arrows=['←','↓','↑','→'];for(let i=0;i<4;i++){box(30+i*107,60,98,485,i%2?'#152642':'#101f38',3);text(arrows[i],79+i*107,530,45,g.colour);}line(30,504,450,504,'#fff',3);for(const n of state.notes){const y=(.84-(n.at-state.t)*.42)*H;if(!n.judged&&y>50&&y<560){box(39+n.lane*107,y-20,80,38,colours[n.lane],8);text(arrows[n.lane],79+n.lane*107,y+13,34,'#11233b');}}text(state.judgement,240,32,19,'#a7f7e3');text(state.combo+' COMBO',240,588,18,'#d8b9ff');
  }else if(state.kind==='pingpong'){
   TABLE_TENNIS_VIEW.draw(ctx,state);
  }else if(state.kind==='hockey'){
   AIR_HOCKEY_VIEW.draw(ctx,state);
  }
  if(state.hit>0){ctx.fillStyle='rgba(255,76,120,.12)';ctx.fillRect(0,0,W,H);}
 }
})();
