// Playable cabinet UI. World movement pauses while a game is open.
(function(){
 const C=ARCADE_CORE,A=ARCADE,overlay=document.createElement('section');overlay.id='arcadeOverlay';overlay.className='hidden';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','arcadeTitle');
 overlay.innerHTML='<div class="arcade-shell"><header class="arcade-head"><div><div class="arcade-kicker">ERRDAY ARCADE / PLAYER ONE</div><h2 id="arcadeTitle"></h2></div><button type="button" class="arcade-close" id="arcadeClose" aria-label="게임 종료">나가기 ✕</button></header><div class="arcade-info"><span>점수 <strong id="arcadeScore">0</strong></span><span>내 최고 <strong id="arcadeBest">0</strong></span><span id="arcadeStatus"></span></div><p class="arcade-instructions" id="arcadeHelp"></p><div class="arcade-modes hidden" id="arcadeModes"><button type="button" id="hockeyPractice" aria-pressed="true">연습 · 컴퓨터 상대</button><button type="button" id="hockeyDuel" aria-pressed="false">실시간 1대1 대전</button></div><div class="arcade-stage"><canvas id="arcadeCanvas" width="480" height="600" tabindex="0" aria-label="오락실 게임 화면"></canvas><div class="arcade-cover" id="arcadeCover"><h3 id="arcadeCoverTitle">READY?</h3><p id="arcadeCoverText">준비되면 시작하세요</p><button type="button" class="arcade-start" id="arcadeStart">게임 시작</button></div></div><div class="arcade-controls" id="arcadeControls"></div><p class="arcade-footer">무료 플레이 · 게임별 개인 최고 기록으로 순위 집계</p></div>';
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
 function controls(){const rhythm=['rhythm','ddr'].includes(state.kind),bs=rhythm?[['lane0','←'],['lane1','↓'],['lane2','↑'],['lane3','→']]:state.kind==='blocks'?[['left','←'],['down','↓'],['rotate','↻'],['right','→'],['fire','내리기']]:state.kind==='hoops'?[['fire','슛']]:state.kind==='reflex'?[]:state.kind==='hockey'?[['left','←'],['up','↑'],['down','↓'],['right','→'],['fire','서브 / 강타']]:[['left','←'],['right','→'],...(['shooter','pingpong'].includes(state.kind)?[['fire',state.kind==='shooter'?'발사':'서브']]:[])];
  const el=$('arcadeControls');el.innerHTML='';for(const [key,label] of bs){if(state.kind==='reflex')continue;const b=document.createElement('button');b.type='button';b.dataset.input=key;b.textContent=label;b.setAttribute('aria-label',label==='←'?'왼쪽':label==='→'?'오른쪽':label==='↓'?'아래':label==='↑'?'위':label);b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);press(key)};const release=()=>{input[key]=false;};b.onpointerup=release;b.onpointercancel=release;el.appendChild(b);}
  const p=document.createElement('button');p.className='arcade-pause';p.type='button';p.textContent='일시정지';p.onclick=togglePause;el.appendChild(p);
 }
 function press(key){if(!running||paused||!state||state.over)return;input[key]=true;if(hockeyMatch){if(key==='fire')netServe=true;}else C.action(state,key);repeat=.13;}
 function togglePause(){if(hockeyMatch){input={};sys('실시간 대전은 일시정지할 수 없어요');return;}if(!running||state?.over)return;paused=!paused;input={};if(paused)cover('PAUSED','잠시 쉬어가세요','계속하기');else{$('arcadeCover').classList.add('hidden');last=performance.now();canvas.focus();}}
 function start(){
  try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();audio.resume();}catch(e){}
  if(paused){togglePause();return;}
  if(startPending)return;
  if(machine.game==='hockey'&&hockeyMode==='duel'){joinHockey();return;}
  startPending=true;
  const version=openVersion,button=$('arcadeStart');
  button.disabled=true;
  socket.timeout(5000).emit('arcadeStart',{machineId:machine.id},(error,result)=>{
   if(version!==openVersion||!window.ARCADE_PLAYING)return;
   startPending=false;button.disabled=false;
   if(error||!result?.ok){cover('연결 확인',result?.error||'다시 시도해 주세요','다시 시작');return;}
   sessionToken=result.token;
   state=C.create(machine.game);window.ARCADE_ACTIVE_STATE=state;
   saved=false;lastEvent=0;lastBeat=-99;input={};running=true;paused=false;
   last=performance.now();$('arcadeCover').classList.add('hidden');canvas.focus();
  });
 }
 function close(){if(!window.ARCADE_PLAYING)return;if(hockeyMatch)socket.emit('hockeyLeave',{id:hockeyMatch.id});save();hockeyMatch=null;hockeyJoining=false;window.ARCADE_HOCKEY_MATCH=null;openVersion++;startPending=false;cancelAnimationFrame(frame);frame=0;running=false;paused=false;input={};state=null;window.ARCADE_ACTIVE_STATE=null;window.ARCADE_PLAYING=false;overlay.classList.add('hidden');document.body.classList.remove('arcade-playing');scene.play();scene.renderer.setAnimationLoop(scene.render);window.ARCADE_DUCK=1;applyVolume();resetRollerMovement();if(focusBefore?.isConnected)focusBefore.focus();refreshAct(true);}
 function openGame(m){
  if(!joined||!m||!A.inside(rig.object3D.position.x,rig.object3D.position.z)||Math.hypot(rig.object3D.position.x-m.spot.x,rig.object3D.position.z-m.spot.z)>2.1)return false;
  if(window.ARCADE_PLAYING)close();hockeyMode='practice';hockeyMatch=null;netFrom=null;netTo=null;openVersion++;sessionToken=null;startPending=false;$('arcadeStart').disabled=false;gameMeta=A.GAMES[m.game];machine=m;state=C.create(m.game);window.ARCADE_ACTIVE_STATE=state;focusBefore=document.activeElement;window.ARCADE_PLAYING=true;scene.pause();scene.renderer.setAnimationLoop(null);window.ARCADE_DUCK=.3;applyVolume();resetRollerMovement();window.RUN_HOLD=false;myDance=0;myYaw=m.yaw??Math.atan2(m.x-m.spot.x,m.z-m.spot.z);socket.emit('move',{pos:rig.object3D.position.toArray(),rot:myYaw,dance:0});input={};saved=false;running=false;paused=false;try{best=+localStorage.getItem('arcade-best-'+m.game)||0;}catch(e){best=0;}
  $('arcadeTitle').textContent=gameMeta.name;$('arcadeHelp').textContent=IS_MOBILE?({blocks:'← → 이동 · ↻ 회전 · ↓ 빠르게 · 내리기',shooter:'화면을 드래그하거나 ← →로 이동 · 발사 버튼 누르기',breaker:'화면을 드래그하거나 ← →로 패들 이동',racer:'← →로 차선을 바꿔 자동차를 피하세요',hoops:'슛 버튼을 눌러 움직이는 골대를 맞히세요',reflex:'빛나는 패널을 터치하세요',rhythm:'노트가 판정선에 닿을 때 방향 버튼을 터치하세요 · 125 BPM',ddr:'박자에 맞춰 아래 발판을 터치하세요 · 125 BPM',pingpong:'화면을 드래그해 라켓 이동 · 서브 버튼',hockey:'패들을 드래그해 밀어보세요 · 빠르게 밀수록 강타 · 서브 버튼'}[m.game]||gameMeta.controls):gameMeta.controls;$('arcadeBest').textContent=best;$('arcadeModes').classList.toggle('hidden',m.game!=='hockey');setHockeyMode('practice',false);controls();overlay.classList.remove('hidden');document.body.classList.add('arcade-playing');cover(gameMeta.name,gameMeta.subtitle,m.game==='hockey'?'연습게임 시작':'게임 시작');$('arcadeStart').focus();last=performance.now();cancelAnimationFrame(frame);frame=requestAnimationFrame(loop);return true;
 };
 window.openArcadeGame=id=>openGame(A.machines.find(q=>q.id===id));
 window.closeArcadeGame=close;$('arcadeClose').onclick=close;$('arcadeStart').onclick=start;

 function setHockeyMode(mode,show=true){
  if(machine?.game!=='hockey')return;
  if(startPending||hockeyJoining)return;
  if(hockeyMatch){socket.emit('hockeyLeave',{id:hockeyMatch.id});hockeyMatch=null;window.ARCADE_HOCKEY_MATCH=null;}
  if(running)save();hockeyMode=mode;running=false;paused=false;input={};state=C.create('hockey');window.ARCADE_ACTIVE_STATE=state;netFrom=null;netTo=null;
  const pauseButton=$('arcadeControls').querySelector('.arcade-pause');if(pauseButton){pauseButton.disabled=mode==='duel';pauseButton.textContent=mode==='duel'?'실시간 경기':'일시정지';}
  $('hockeyPractice').setAttribute('aria-pressed',String(mode==='practice'));$('hockeyDuel').setAttribute('aria-pressed',String(mode==='duel'));
  $('arcadeStart').disabled=false;
  if(show)cover(mode==='practice'?'연습게임':'실시간 1대1 대전',mode==='practice'?'컴퓨터와 7점 승부 · 패들을 빠르게 밀어 강타하세요':'같은 테이블의 다른 참가자를 기다립니다 · 먼저 7점이면 승리',mode==='practice'?'연습게임 시작':'대전 참가');
 }
 $('hockeyPractice').onclick=()=>setHockeyMode('practice');$('hockeyDuel').onclick=()=>setHockeyMode('duel');
 function viewHockey(q,side){const v=JSON.parse(JSON.stringify(q));if(side===1){[v.score,v.opponent]=[v.opponent,v.score];v.won=v.over&&v.score>=7;v.serveSide=1-v.serveSide;v.paddles.reverse();for(const p of [...v.paddles,v.ball]){p.x=1-p.x;p.y=1-p.y;p.vx=-p.vx;p.vy=-p.vy;}}return v;}
 function receiveHockey(q){
  if(!window.ARCADE_PLAYING||machine?.game!=='hockey'||hockeyMode!=='duel'||(!hockeyMatch&&!hockeyJoining))return;
  if(hockeyMatch&&(q.id!==hockeyMatch.id||q.seq<=hockeyMatch.seq))return;
  hockeyMatch=q;window.ARCADE_HOCKEY_MATCH=q;const v=viewHockey(q.state,q.side);netFrom=state;netTo=v;netAt=performance.now();state=JSON.parse(JSON.stringify(v));window.ARCADE_ACTIVE_STATE=state;saved=true;paused=false;
  if(q.status==='waiting'){running=false;cover('상대방 기다리는 중','같은 에어하키 테이블에서 대전 참가를 누르면 시작합니다','대기 중…');$('arcadeStart').disabled=true;}
  else if(q.status==='playing'){if(!running)netTarget={...v.paddles[0]};running=true;$('arcadeStart').disabled=false;$('arcadeCover').classList.add('hidden');}
  else{running=false;input={};if(q.status==='finished'){best=Math.max(best,v.score);$('arcadeBest').textContent=best;try{localStorage.setItem('arcade-best-hockey',String(best));}catch(e){}}$('arcadeStart').disabled=false;cover(q.status==='finished'?(v.won?'승리!':'경기 종료'): '대전 종료',q.status==='finished'?v.score+' : '+v.opponent+' · 7점 승부 종료':q.reason,'다시 대전 참가');}
 }
 function joinHockey(){
  if(hockeyMatch&&['waiting','playing'].includes(hockeyMatch.status))return;
  hockeyMatch=null;hockeyJoining=true;startPending=true;netSeq=0;netSend=0;netServe=false;input={};const version=openVersion;$('arcadeStart').disabled=true;
  socket.timeout(5000).emit('hockeyJoin',{machineId:machine.id},(error,q)=>{
   if(version!==openVersion||!window.ARCADE_PLAYING){if(q?.ok)socket.emit('hockeyLeave',{id:q.id});return;}
   hockeyJoining=false;startPending=false;
   if(error||!q?.ok){if(hockeyMatch)return;$('arcadeStart').disabled=false;cover('대전 참가',q?.error||'연결을 확인하고 다시 참가해 주세요','다시 참가');return;}
   // A room update can arrive before the acknowledgement.
   if(!hockeyMatch){hockeyJoining=true;receiveHockey(q);hockeyJoining=false;}
  });
 }
 socket.on('hockeyState',receiveHockey);
 socket.on('disconnect',()=>{if(!hockeyMatch)return;hockeyMatch.status='ended';running=false;input={};$('arcadeStart').disabled=false;cover('연결 끊김','다시 연결되면 대전에 재참가해 주세요','다시 참가');});
 function tickHockey(now,dt){
  if(!netTo)return;
  const k=Math.min(1,(now-netAt)/34);
  if(netFrom&&netFrom.event===netTo.event)for(let i=0;i<3;i++){const p=i===2?state.ball:state.paddles[i],a=i===2?netFrom.ball:netFrom.paddles[i],b=i===2?netTo.ball:netTo.paddles[i];p.x=a.x+(b.x-a.x)*k;p.y=a.y+(b.y-a.y)*k;}
  if(!running||hockeyMatch.status!=='playing')return;
  const speed=input.fire?2.4:1.2;
  netTarget.x=Math.max(.125,Math.min(.875,input.pointerX??netTarget.x+((input.right?1:0)-(input.left?1:0))*dt*speed));
  netTarget.y=Math.max(.56,Math.min(.865,input.pointerY??netTarget.y+((input.down?1:0)-(input.up?1:0))*dt*speed/1.25));
  if(now-netSend>=33){netSend=now;const flip=hockeyMatch.side===1;socket.emit('hockeyInput',{id:hockeyMatch.id,seq:++netSeq,x:flip?1-netTarget.x:netTarget.x,y:flip?1-netTarget.y:netTarget.y,serve:netServe});netServe=false;}
  if(state.event!==lastEvent){lastEvent=state.event;sound();}
 }
 function keyFor(e){if(['rhythm','ddr'].includes(state.kind))return {ArrowLeft:'lane0',ArrowDown:'lane1',ArrowUp:'lane2',ArrowRight:'lane3',KeyD:'lane0',KeyF:'lane1',KeyJ:'lane2',KeyK:'lane3'}[e.code];if(state.kind==='reflex'&&/^Digit[1-9]$/.test(e.code))return'tap'+(+e.code.slice(5)-1);return{ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowDown:'down',KeyS:'down',ArrowUp:state.kind==='hockey'?'up':'rotate',KeyW:state.kind==='hockey'?'up':'rotate',Space:'fire'}[e.code];}
 window.addEventListener('keydown',e=>{if(!window.ARCADE_PLAYING)return;if(e.code==='Tab'||(document.activeElement?.tagName==='BUTTON'&&['Enter','Space'].includes(e.code)))return;e.preventDefault();e.stopImmediatePropagation();if(e.code==='Escape'){close();return;}if(e.code==='KeyP'){if(!e.repeat)togglePause();return;}if(e.code==='Enter'&&!running){start();return;}const key=keyFor(e);if(key&&!e.repeat){delete input.pointerX;delete input.pointerY;press(key)}},true);
 window.addEventListener('keyup',e=>{if(!window.ARCADE_PLAYING)return;if(e.code==='Tab'||(document.activeElement?.tagName==='BUTTON'&&['Enter','Space'].includes(e.code)))return;e.preventDefault();e.stopImmediatePropagation();const key=keyFor(e);if(key)input[key]=false;},true);
 window.addEventListener('blur',()=>{if(window.ARCADE_PLAYING&&running&&!paused)togglePause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&window.ARCADE_PLAYING&&running&&!paused)togglePause()});
 let pointerId=null;
 function pointer(e){const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;if(state.kind==='reflex'){if(e.type==='pointerdown'&&y>=.18&&y<.84)C.action(state,'tap'+(Math.floor((y-.18)/.22)*3+Math.min(2,Math.floor(x*3))));}else if(['shooter','breaker','pingpong','hockey'].includes(state.kind)){input.pointerX=Math.max(.05,Math.min(.95,x));input.pointerY=state.kind==='hockey'?Math.max(.56,Math.min(.865,y)):Math.max(.05,Math.min(.95,y));if(state.kind==='shooter')input.fire=true;if(state.serve){if(hockeyMatch)netServe=true;else C.action(state,'fire');}}}
 canvas.addEventListener('pointerdown',e=>{if(!running||paused)return;e.preventDefault();pointerId=e.pointerId;canvas.setPointerCapture(e.pointerId);pointer(e)});canvas.addEventListener('pointermove',e=>{if(e.pointerId===pointerId&&running&&!paused)pointer(e)});for(const name of ['pointerup','pointercancel'])canvas.addEventListener(name,()=>{pointerId=null;input.fire=false;});
 function loop(now){if(!window.ARCADE_PLAYING)return;const dt=Math.min(.04,(now-last)/1000);last=now;
  if(hockeyMatch)tickHockey(now,dt);
  if(running&&!paused&&!state.over&&!hockeyMatch){repeat-=dt;if(state.kind==='blocks'&&repeat<=0){for(const k of ['left','right','down'])if(input[k])C.action(state,k);repeat=input.down?.06:.13;}if(state.kind==='hoops'&&input.fire&&state.cool<=0)C.action(state,'fire');C.update(state,dt,input);if(['rhythm','ddr'].includes(state.kind)){const beat=Math.floor((state.t-2)/.48);if(beat!==lastBeat){lastBeat=beat;rhythmBeat(beat);}}if(state.event!==lastEvent){lastEvent=state.event;sound();}if(state.over){save();cover(state.won?'CLEAR!':'GAME OVER','점수 '+state.score+(state.opponent!==undefined?' : '+state.opponent:''),'다시 도전');}}
  draw();$('arcadeScore').textContent=state.score;$('arcadeStatus').textContent=state.health!==undefined?'ENERGY '+state.health+'%':state.time!==undefined?Math.ceil(state.time)+'초':state.opponent!==undefined?(hockeyMatch?((hockeyMatch.names[1-hockeyMatch.side]||'상대')+' '+state.opponent):'AI '+state.opponent)+' / 7점':state.kind==='blocks'?'LINE '+state.lines:'LIFE '+state.lives;
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
  }else{
   const hockey=state.kind==='hockey';box(hockey?24:20,45,hockey?432:440,hockey?510:520,hockey?'#d5e7ed':'#206291',18);ctx.setLineDash([9,9]);line(25,300,455,300,hockey?'#547493':'#caefff',2);ctx.setLineDash([]);if(hockey){ctx.strokeStyle='#7b9cba';ctx.lineWidth=3;ctx.beginPath();ctx.arc(240,300,70,0,7);ctx.stroke();box(.33*W,39,.34*W,12,'#ff87ba',2);box(.33*W,549,.34*W,12,'#73caff',2);for(let i=0;i<2;i++){const p=state.paddles[i],r=AIR_HOCKEY.K.paddle*W;ball(p.x*W+2,p.y*H+4,r+2,'#0005');ball(p.x*W,p.y*H,r,i?'#5496eb':'#ef5f9c');ball(p.x*W,p.y*H,r*.65,i?'#2466b4':'#bc2866');ball(p.x*W-4,p.y*H-5,r*.32,i?'#83bcff':'#ffaccd');}ball(state.ball.x*W,state.ball.y*H,AIR_HOCKEY.K.puck*W,'#15283b');}else{box(state.x*W-51,.84*H,102,13,'#fc8d9c');box(state.ai*W-51,.16*H-13,102,13,'#96e9ff');ball(state.ball.x*W,state.ball.y*H,8,'#fff6d0');}text(state.score+' : '+state.opponent,240,32,20,'#c0e6ff');if(state.serve)text(state.kind==='hockey'&&state.serveSide===1?'상대 서브':'SPACE / 서브',240,350,23,hockey?'#243f5d':'#d4f5ff');
  }
  if(state.hit>0){ctx.fillStyle='rgba(255,76,120,.12)';ctx.fillRect(0,0,W,H);}
 }
})();
