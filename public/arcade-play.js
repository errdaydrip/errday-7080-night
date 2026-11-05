// Playable cabinet UI. World movement pauses while a game is open.
(function(){
 const C=ARCADE_CORE,A=ARCADE,overlay=document.createElement('section');overlay.id='arcadeOverlay';overlay.className='hidden';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','arcadeTitle');
 overlay.innerHTML='<div class="arcade-shell"><header class="arcade-head"><div><div class="arcade-kicker">ERRDAY ARCADE / PLAYER ONE</div><h2 id="arcadeTitle"></h2></div><div class="arcade-head-actions"><button type="button" class="arcade-close" id="arcadePause">일시정지</button><button type="button" class="arcade-close" id="arcadeClose" aria-label="게임 종료">나가기 ✕</button></div></header><div class="arcade-info"><span>점수 <strong id="arcadeScore">0</strong></span><span>내 최고 <strong id="arcadeBest">0</strong></span><span id="arcadeStatus"></span></div><p class="arcade-instructions" id="arcadeHelp"></p><div class="arcade-stage"><canvas id="arcadeCanvas" width="480" height="600" tabindex="0" aria-label="오락실 게임 화면"></canvas><div class="arcade-cover" id="arcadeCover"><h3 id="arcadeCoverTitle">READY?</h3><p id="arcadeCoverText">준비되면 시작하세요</p><button type="button" class="arcade-start" id="arcadeStart">게임 시작</button></div></div><div class="arcade-controls" id="arcadeControls"></div><p class="arcade-footer">무료 플레이 · 게임별 개인 최고 기록으로 순위 집계</p></div>';
 document.body.appendChild(overlay);
 const $=id=>document.getElementById(id),canvas=$('arcadeCanvas'),ctx=canvas.getContext('2d'),W=480,H=600;
 let state=null,machine=null,gameMeta=null,input={},running=false,paused=false,frame=0,last=0,best=0,saved=false,focusBefore=null,repeat=0,audio=null,rhythmBus=null,lastEvent=0,lastBeat=null,sessionToken=null,startPending=false,openVersion=0;
 let hockeyMode='practice',hockeyMatch=null,hockeyJoining=false,netSeq=0,netSend=0,netServe=false,netTarget={x:.5,y:.82},netFrom=null,netTo=null,netAt=0;
 const pumpArrows=['↙','↖','●','↗','↘'];
 const pumpColours=['#4edbff','#8878ff','#ffd968','#ff7794','#6ce1ff'];
 const pumpTop=70,pumpLine=495,pumpLaneWidth=88,pumpLeft=20;
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
 function unlockAudio(){
  try{
   audio=audio||new (window.AudioContext||window.webkitAudioContext)();
   if(audio.state!=='running')audio.resume().catch(()=>{});
  }catch(e){}
 }
 function rhythmTone(type,from,to,length,amplitude,delay=0){
  const level=typeof volume==='number'?Math.max(0,Math.min(1,volume/100)):1;
  if(!audio||audio.state!=='running'||!level||(typeof muted!=='undefined'&&muted))return;
  if(!rhythmBus){
   rhythmBus=audio.createDynamicsCompressor();
   rhythmBus.threshold.value=-10;rhythmBus.ratio.value=6;rhythmBus.connect(audio.destination);
  }
  const at=audio.currentTime+delay,osc=audio.createOscillator(),gain=audio.createGain();
  osc.type=type;osc.frequency.setValueAtTime(from,at);osc.frequency.exponentialRampToValueAtTime(to,at+length);
  gain.gain.setValueAtTime(.0001,at);
  gain.gain.linearRampToValueAtTime(Math.max(.0001,amplitude*level),at+.006);
  gain.gain.exponentialRampToValueAtTime(.0001,at+length);
  osc.connect(gain);gain.connect(rhythmBus);osc.start(at);osc.stop(at+length);
 }
 function rhythmBeat(step){
  if(step<0){
   if(step%2===0)rhythmTone('triangle',730,500,.10,.28);
   return;
  }
  const track=state.track,beat=Math.floor(step/2);
  const frequency=midi=>440*2**((midi-69)/12);
  const pitch=track.melody[beat%track.melody.length];
  if(step%2===0){
   rhythmTone('sine',beat%4===0?170:125,47,.17,.78);
   rhythmTone('triangle',frequency(pitch-24),frequency(pitch-24),.19,.34);
  }
  const at=C.FIRST_BEAT+step*state.beat/2;
  if(step%2===0||state.notes.some(note=>Math.abs(note.at-at)<.001)){
   const hz=frequency(pitch+(step%2?7:0));
   rhythmTone(track.wave,hz,hz,.17,.25);
  }else rhythmTone('sine',3300,1800,.035,.11);
 }
 function rhythmEffect(cue){
  if(cue==='PERFECT'){
   rhythmTone('triangle',880,1100,.095,.33);
   rhythmTone('sine',1320,1320,.10,.25,.035);
  }else if(cue==='GOOD')rhythmTone('triangle',660,880,.10,.30);
  else if(cue==='MISS'||cue==='EARLY / LATE')rhythmTone('triangle',230,130,.12,.20);
 }
 function setRhythmMusic(playing){if(C.isRhythm(state?.kind)){window.ARCADE_DUCK=playing?0:1;applyVolume();}}
 function save(){
  if(saved||!state||hockeyMatch||hockeyJoining)return;
  saved=true;
  best=Math.max(best,totalScore());
  try{localStorage.setItem('arcade-best-'+state.kind,String(best));}catch(e){}
  $('arcadeBest').textContent=best;
  if(!running||!sessionToken||state.score<=0)return;
  const token=sessionToken;
  socket.timeout(5000).emit('arcadeFinish',{token,score:totalScore()},(error,result)=>{
   if(error||!result?.ok){sys(result?.error||'순위 저장 연결을 확인해 주세요');return;}
   if(window.ARCADE_PLAYING&&sessionToken===token&&state?.over&&result.rank>0&&result.rank<=3&&!['pingpong','hockey'].includes(state.kind)){
    $('arcadeCoverText').textContent='점수 '+totalScore()+' · 현재 '+result.rank+'위'+(nextStage()?' · 다음 Lv.'+(stageLevel+1):'');
   }
  });
 }
 function cover(title,desc,button){$('arcadeCoverTitle').textContent=title;$('arcadeCoverText').textContent=desc;$('arcadeStart').textContent=button;$('arcadeCover').classList.remove('hidden');}
 let tableLevel=1,stageLevel=1,stageScore=0,trackOrder=[];
 function totalScore(){return stageScore+state.score;}
 function nextStage(){return C.hasStages(state.kind)&&state.won&&stageLevel<C.MAX_LEVEL;}
 function finishRound(){
  const wonTable=tableGame()&&state.won;
  const advance=nextStage();
  if(wonTable)tableLevel=Math.max(tableLevel,state.level+1);
  setRhythmMusic(false);
  save();
  const score=state.kind==='pingpong'
   ?'내 점수 '+state.score+' · CPU '+state.opponent
   :'점수 '+totalScore()+(state.opponent===undefined?'':' : '+state.opponent);
  const detail=advance?' · 다음 Lv.'+(stageLevel+1):wonTable?' · 다음 CPU Lv.'+tableLevel:'';
  cover(state.won?'CLEAR!':'GAME OVER',score+detail,advance||wonTable?'다음 단계':state.won&&C.hasStages(state.kind)?'레벨 1부터':'다시 도전');
 }
 function shuffleTracks(){
  trackOrder=C.TRACKS.map((_,i)=>i);
  for(let i=trackOrder.length-1;i>0;i--){
   const j=Math.floor(Math.random()*(i+1));
   [trackOrder[i],trackOrder[j]]=[trackOrder[j],trackOrder[i]];
  }
 }
 function createGame(kind){
  const game=C.create(kind,Date.now(),stageLevel,trackOrder[stageLevel-1]);
  if(kind==='pingpong'||kind==='hockey')game.level=tableLevel;
  return game;
 }
 function touchPad(container){
  const pad=document.createElement('div');pad.className='arcade-touch-pad';
  pad.innerHTML='<span aria-hidden="true">↑<br>←　→<br>↓</span>';
  container.append(pad);
 }
 function controls(){const table=['hockey','pingpong'].includes(state.kind);const rhythm=C.isRhythm(state.kind),bs=table?[['up','↑'],['left','←'],['down','↓'],['right','→']]:state.kind==='pump'?pumpArrows.map((arrow,i)=>['lane'+i,arrow]):rhythm?[['lane0','←'],['lane1','↓'],['lane2','↑'],['lane3','→']]:state.kind==='blocks'?[['left','←'],['down','↓'],['rotate','↻'],['right','→'],['fire','내리기']]:state.kind==='mole'?[]:state.kind==='hockey'?[['left','←'],['up','↑'],['down','↓'],['right','→'],['fire','서브 / 강타']]:[['left','←'],['right','→'],...(['shooter','pingpong'].includes(state.kind)?[['fire',state.kind==='shooter'?'발사':'서브']]:[])];
  const el=$('arcadeControls');el.innerHTML='';if(table){touchPad(el);return;}for(const [key,label] of bs){const b=document.createElement('button');b.type='button';b.dataset.input=key;b.textContent=label;b.setAttribute('aria-label',label==='←'?'왼쪽':label==='→'?'오른쪽':label==='↓'?'아래':label==='↑'?'위':label);b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);delete input.pointerX;delete input.pointerY;press(key)};const release=()=>{input[key]=false;};b.onpointerup=release;b.onpointercancel=release;el.appendChild(b);}

 }
 function press(key){if(!running||paused||!state||state.over)return;if(C.isRhythm(state.kind)&&audio?.state!=='running')unlockAudio();input[key]=true;if(hockeyMatch){if(key==='fire')netServe=true;}else C.action(state,key);repeat=.13;}
 function togglePause(){if(hockeyMatch){input={};sys('실시간 대전은 일시정지할 수 없어요');return;}if(!running||state?.over)return;paused=!paused;input={};if(!paused)unlockAudio();setRhythmMusic(!paused);if(paused)cover('PAUSED','잠시 쉬어가세요','계속하기');else{$('arcadeCover').classList.add('hidden');last=performance.now();canvas.focus();}}
 function start(){
  unlockAudio();
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
   if(nextStage()){stageScore=totalScore();stageLevel++;}
   else if(C.hasStages(state.kind)&&state.won){stageScore=0;stageLevel=1;shuffleTracks();}
   state=createGame(machine.game);window.ARCADE_ACTIVE_STATE=state;
   setRhythmMusic(true);
   saved=false;lastEvent=0;lastBeat=null;input={};running=true;paused=false;
   last=performance.now();$('arcadeCover').classList.add('hidden');canvas.focus();
  });
 }
 function close(){if(!window.ARCADE_PLAYING)return;if(machine?.game==='hockey')socket.emit('hockeyCancelInvite');if(hockeyMatch)socket.emit('hockeyLeave',{id:hockeyMatch.id});save();hockeyMatch=null;hockeyJoining=false;window.ARCADE_HOCKEY_MATCH=null;openVersion++;startPending=false;cancelAnimationFrame(frame);frame=0;running=false;paused=false;input={};state=null;window.ARCADE_ACTIVE_STATE=null;window.ARCADE_PLAYING=false;overlay.classList.add('hidden');document.body.classList.remove('arcade-playing');scene.play();scene.renderer.setAnimationLoop(scene.render);window.ARCADE_DUCK=1;applyVolume();resetRollerMovement();if(focusBefore?.isConnected)focusBefore.focus();refreshAct(true);}
 function openGame(m,invited=false){
  if(!joined||!m||!invited&&(!A.inside(rig.object3D.position.x,rig.object3D.position.z)||Math.hypot(rig.object3D.position.x-m.spot.x,rig.object3D.position.z-m.spot.z)>2.1))return false;
  if(window.ARCADE_PLAYING)close();hockeyMode='practice';hockeyMatch=null;netFrom=null;netTo=null;openVersion++;sessionToken=null;startPending=false;$('arcadeStart').disabled=false;gameMeta=A.GAMES[m.game];machine=m;tableLevel=1;stageLevel=1;stageScore=0;if(C.isRhythm(m.game))shuffleTracks();state=createGame(m.game);window.ARCADE_ACTIVE_STATE=state;focusBefore=document.activeElement;window.ARCADE_PLAYING=true;scene.pause();scene.renderer.setAnimationLoop(null);window.ARCADE_DUCK=C.isRhythm(m.game)?1:.3;applyVolume();resetRollerMovement();window.RUN_HOLD=false;myDance=0;myYaw=m.yaw??Math.atan2(m.x-m.spot.x,m.z-m.spot.z);socket.emit('move',{pos:rig.object3D.position.toArray(),rot:myYaw,dance:0});input={};saved=false;running=false;paused=false;try{best=+localStorage.getItem('arcade-best-'+m.game)||0;}catch(e){best=0;}
  $('arcadeTitle').textContent=gameMeta.name;$('arcadeHelp').textContent=IS_MOBILE?({blocks:'← → 이동 · ↻ 회전 · ↓ 빠르게 · 내리기',shooter:'화면을 드래그하거나 ← →로 이동 · 발사 버튼 누르기',breaker:'화면을 드래그하거나 ← →로 패들 이동',racer:'자동차를 터치해 좌우로 끌거나 ← →로 이동하세요',pump:'화살표가 아래 판정선에 닿으면 그 칸이나 아래 버튼을 터치하세요',mole:'올라온 두더지를 터치해서 목표를 달성하세요',rhythm:'노트가 판정선에 닿을 때 방향 버튼을 터치하세요',ddr:'박자에 맞춰 아래 발판을 터치하세요',pingpong:'화면을 드래그해 라켓 이동 · 서브 버튼',hockey:'패들을 드래그해 밀어보세요 · 빠르게 밀수록 강타 · 서브 버튼'}[m.game]||gameMeta.controls):gameMeta.controls;$('arcadeBest').textContent=best;overlay.classList.toggle('table-game',['hockey','pingpong'].includes(m.game));overlay.classList.toggle('pump-game',m.game==='pump');controls();overlay.classList.remove('hidden');document.body.classList.add('arcade-playing');cover(gameMeta.name,gameMeta.subtitle,m.game==='hockey'?'게임시작':'게임 시작');$('arcadeStart').focus();last=performance.now();cancelAnimationFrame(frame);frame=requestAnimationFrame(loop);return true;
 };
 window.openArcadeGame=id=>openGame(A.machines.find(q=>q.id===id));
 window.closeArcadeGame=close;$('arcadePause').onclick=togglePause;$('arcadeClose').onclick=close;$('arcadeStart').onclick=start;

 function keyFor(e){if(state.kind==='pump')return {KeyZ:'lane0',KeyQ:'lane1',KeyS:'lane2',KeyE:'lane3',KeyC:'lane4'}[e.code];if(C.isRhythm(state.kind))return {ArrowLeft:'lane0',ArrowDown:'lane1',ArrowUp:'lane2',ArrowRight:'lane3',KeyD:'lane0',KeyF:'lane1',KeyJ:'lane2',KeyK:'lane3'}[e.code];if(state.kind==='mole'&&/^Digit[1-9]$/.test(e.code))return'tap'+(+e.code.slice(5)-1);return{ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowDown:'down',KeyS:'down',ArrowUp:['hockey','pingpong'].includes(state.kind)?'up':'rotate',KeyW:['hockey','pingpong'].includes(state.kind)?'up':'rotate',Space:'fire'}[e.code];}
 window.addEventListener('keydown',e=>{if(!window.ARCADE_PLAYING)return;if(e.code==='Tab'||(document.activeElement?.tagName==='BUTTON'&&['Enter','Space'].includes(e.code)))return;e.preventDefault();e.stopImmediatePropagation();if(e.code==='Escape'){close();return;}if(e.code==='KeyP'){if(!e.repeat)togglePause();return;}if(e.code==='Enter'&&!running){start();return;}const key=keyFor(e);if(key&&!e.repeat){delete input.pointerX;delete input.pointerY;press(key)}},true);
 window.addEventListener('keyup',e=>{if(!window.ARCADE_PLAYING)return;if(e.code==='Tab'||(document.activeElement?.tagName==='BUTTON'&&['Enter','Space'].includes(e.code)))return;e.preventDefault();e.stopImmediatePropagation();const key=keyFor(e);if(key)input[key]=false;},true);
 window.addEventListener('blur',()=>{if(window.ARCADE_PLAYING&&running&&!paused)togglePause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&window.ARCADE_PLAYING&&running&&!paused)togglePause()});
 let pointerId=null,pointerBounds=null,pointerPad=false;
 function pointer(e){const r=pointerBounds||canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;if(state.kind==='pump'){
   if(e.type==='pointerdown'&&Math.abs(y*H-pumpLine)<60&&x*W>=pumpLeft&&x*W<pumpLeft+pumpLaneWidth*5){
    press('lane'+Math.floor((x*W-pumpLeft)/pumpLaneWidth));
   }
  }else if(state.kind==='mole'){
   if(e.type==='pointerdown'){
    const col=Math.floor((x*W-15)/150),row=Math.floor((y*H-112)/145);
    if(col>=0&&col<3&&row>=0&&row<3)press('tap'+(row*3+col));
   }
  }else if(['shooter','breaker','racer','pingpong','hockey'].includes(state.kind)){input.pointerX=Math.max(.05,Math.min(.95,x));input.pointerY=state.kind==='hockey'?Math.max(.56,Math.min(.865,pointerPad ? .56+y*.305 : y)):Math.max(.05,Math.min(.95,y));if(state.kind==='racer')state.targetX=input.pointerX;if(state.kind==='shooter')input.fire=true;}}
 function tableGame(){return state&&['hockey','pingpong'].includes(state.kind);}
 function pointerStart(e){
  if(!running||paused||state.over||e.target.closest('button')||(!tableGame()&&e.target!==canvas))return;
  e.preventDefault();
  const pad=e.target.closest('.arcade-touch-pad');
  pointerPad=Boolean(pad);
  pointerBounds=(pad||(tableGame()&&e.target!==canvas?overlay:canvas)).getBoundingClientRect();
  pointerId=e.pointerId;overlay.setPointerCapture(e.pointerId);pointer(e);
 }
 overlay.addEventListener('pointerdown',pointerStart);
 overlay.addEventListener('pointermove',e=>{if(e.pointerId===pointerId&&running&&!paused)pointer(e)});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])overlay.addEventListener(name,e=>{if(e.pointerId!==pointerId)return;pointerId=null;pointerBounds=null;pointerPad=false;input.fire=false;});
 function loop(now){if(!window.ARCADE_PLAYING)return;const dt=Math.min(.04,(now-last)/1000);last=now;

  if(running&&!paused&&!state.over&&!hockeyMatch){repeat-=dt;if(state.kind==='blocks'&&repeat<=0){for(const k of ['left','right','down'])if(input[k])C.action(state,k);repeat=input.down?.06:.13;}C.update(state,dt,input);if(C.isRhythm(state.kind)){const beat=Math.floor((state.t-C.FIRST_BEAT)*2/state.beat+1e-8);if(beat!==lastBeat){lastBeat=beat;rhythmBeat(beat);}}if(state.event!==lastEvent){lastEvent=state.event;if(tableGame())tableSound(state.kind,state.sound);else if(C.isRhythm(state.kind))rhythmEffect(state.judgement);else sound();}if(state.over)finishRound();}

  draw();$('arcadeScore').textContent=totalScore();$('arcadeStatus').textContent=state.health!==undefined?'Lv. '+state.level+' · '+state.track.name+' · '+state.bpm+' BPM · ENERGY '+state.health+'%':state.time!==undefined?'Lv. '+state.level+' · '+state.caught+'/'+state.goal+' · '+Math.ceil(state.time)+'초':state.opponent!==undefined?(hockeyMatch?((hockeyMatch.names[1-hockeyMatch.side]||'상대')+' '+state.opponent):(tableGame()?'CPU Lv.'+state.level+' · ':'AI ')+state.opponent)+' / 7점':state.kind==='blocks'?'LINE '+state.lines:(C.hasStages(state.kind)?'Lv. '+state.level+' · ':'')+'LIFE '+state.lives;
  frame=requestAnimationFrame(loop);
 }
 function pumpArrow(lane,x,y,active){
  const color=pumpColours[lane];
  ctx.save();ctx.shadowColor=color;ctx.shadowBlur=active?20:8;
  box(x-31,y-29,62,58,active?color:'#0a1329',13);
  ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
  text(pumpArrows[lane],x,y+17,47,active?'#101627':color);
  ctx.restore();
 }
 function drawPump(){
  const background=ctx.createLinearGradient(0,0,0,H);
  background.addColorStop(0,'#050918');background.addColorStop(.5,'#10132c');background.addColorStop(1,'#070c1e');
  ctx.fillStyle=background;ctx.fillRect(0,0,W,H);
  for(let i=0;i<37;i++)ball((i*179)%W,(i*119)%H,1+i%2*.5,'#a5c6ff42');
  text('PUMP  /  5 STEP',240,24,15,'#b9edff');
  box(20,36,440,12,'#22304d',6);
  const energy=440*state.health/100;if(energy>0)box(20,36,energy,12,'#68f5c2',6);
  for(let lane=0;lane<5;lane++){
   const x=pumpLeft+lane*pumpLaneWidth;
   box(x+4,pumpTop,pumpLaneWidth-8,pumpLine-pumpTop+36,lane%2?'#141c38':'#101731',7);
   line(x+8,pumpTop,x+8,pumpLine+35,pumpColours[lane]+'45',1);
  }
  line(pumpLeft,pumpLine,460,pumpLine,'#b4f6ff',3);
  for(let lane=0;lane<5;lane++){
   const flash=state.flashLane===lane&&state.t<state.flashUntil;
   pumpArrow(lane,pumpLeft+(lane+.5)*pumpLaneWidth,pumpLine,flash);
  }
  for(const note of state.notes){
   if(note.judged)continue;
   const y=pumpLine+(state.t-note.at)*240;
   if(y>=pumpTop+29&&y<=pumpLine+49)pumpArrow(note.lane,pumpLeft+(note.lane+.5)*pumpLaneWidth,y,true);
  }
  box(147,244,186,74,'#071223d4',14);
  text(state.judgement,240,274,23,state.judgement==='MISS'?'#ff8b9d':'#8ef9ff');
  text('COMBO '+state.combo,240,302,18,'#f2f7ff');
  text(state.track.name+'  /  '+state.bpm+' BPM',240,575,16,'#b5c8ef');
 }
 function drawBreaker(){
  const glow=ctx.createLinearGradient(0,0,W,H);
  glow.addColorStop(0,'#201544');glow.addColorStop(.55,'#0f1832');glow.addColorStop(1,'#052334');
  ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
  for(let y=55;y<H;y+=28)line(10,y,W-10,y,'#80b2ff15',1);
  line(6,45,6,H,'#48cbe8',3);line(W-6,45,W-6,H,'#ad70ff',3);
  text('NEON BREAKER   /   STAGE '+state.level,240,28,17,'#bcf7ff');
  for(const q of state.bricks){
   if(!q.alive)continue;
   const x=q.x*W,y=q.y*H,color=colours[q.row%colours.length];
   box(x-25,y-13,50,29,color+'37',6);
   box(x-23,y-12,46,23,color,4);
   box(x-19,y-10,38,4,'#ffffff9c',3);
   box(x-19,y+5,38,4,'#17224c47',3);
   if(q.hp>1)text('◆',x,y+5,13,'#1b2048');
  }
  const labels={wide:['WIDE','#68f5c5'],slow:['SLOW','#90c7ff'],life:['+1','#ff8cb8']};
  for(const item of state.items){
   const [label,color]=labels[item.type];
   const x=item.x*W,y=item.y*H;
   box(x-28,y-16,56,32,color+'45',12);box(x-25,y-13,50,26,color,10);
   text(label,x,y+4,12,'#142039');
  }
  const px=state.x*W,width=state.halfWidth*W;
  box(px-width,.88*H-5,width*2,22,'#4dffeb44',10);
  box(px-width,.88*H,width*2,12,'#78ffec',6);
  box(px-width+8,.88*H+2,width*2-16,4,'#e1fffb',3);
  const b=state.ball;
  for(let i=4;i>=1;i--)ball((b.x-b.vx*i*.009)*W,(b.y-b.vy*i*.009)*H,6-i*.75,'#86eaff50');
  ball(b.x*W,b.y*H,11,'#68dafa44');ball(b.x*W,b.y*H,7,'#fff');
  if(state.t<state.wideUntil||state.t<state.slowUntil){
   text([state.t<state.wideUntil?'WIDE':'',state.t<state.slowUntil?'SLOW':''].filter(Boolean).join('  +  '),240,574,16,'#8ff8ff');
  }
 }
 function drawRacer(){
  const offset=state.distance*state.roadSpeed*H;
  const asphalt=ctx.createLinearGradient(72,0,408,0);
  asphalt.addColorStop(0,'#16283d');asphalt.addColorStop(.5,'#263e57');asphalt.addColorStop(1,'#16283d');
  box(0,0,W,H,'#080c20',0);
  ctx.fillStyle=asphalt;ctx.fillRect(65,0,350,H);
  for(let i=0;i<18;i++){
   const y=(i*47+offset)%846-100;
   for(const x of [12,431]){
    box(x,y,37,32,i%2?'#142242':'#152a46',4);
    box(x+5,y+6,27,3,i%2?'#b06fff':'#51d9e8',2);
   }
  }
  for(const x of [65,415]){
   line(x,0,x,H,'#58cdfb4d',10);line(x,0,x,H,'#7feaff',3);
   for(let y=-100;y<H+88;y+=88)box(x-4,y+(offset%88),8,28,'#eb7ab9',1);
  }
  for(const x of [180,300])for(let y=-94;y<H;y+=94){
   box(x-2,y+(offset%94),4,40,'#8faecb92',2);
  }
  const car=(x,y,color,player)=>{
   box(x-28,y-30,56,78,'#010812aa',10);
   for(const dx of [-28,21]){
    box(x+dx,y-25,7,17,'#080b14',2);box(x+dx,y+13,7,18,'#080b14',2);
   }
   box(x-24,y-38,48,76,color,11);
   box(x-19,y-34,38,17,color,7);
   box(x-15,y-13,30,30,'#101a36',7);
   box(x-11,y-10,22,12,'#a5ddf3',4);
   box(x-11,y+6,22,6,'#5d89a7',2);
   for(const dx of [-19,10]){
    box(x+dx,y-33,9,6,player?'#e4fcff':'#ffe3a8',3);
    box(x+dx,y+27,9,6,'#ff3d75',3);
   }
   if(player){line(x,y-28,x,y-17,'#f5ffff',3);line(x,y+21,x,y+32,'#f5ffff',3);}
  };
  for(const c of state.cars)car(c.x*W,c.y*H,['#fa678d','#b285fb','#ffd26f'][c.style],false);
  car(state.x*W,.83*H,state.hit>0?'#ffd86a':'#51edc9',true);
  box(140,12,200,52,'#081427e6',12);
  text('TURBO RUN   /   STAGE '+state.level,240,32,14,'#aaf3ff');
  box(156,44,168,7,'#304761',3);
  if(state.distance>0)box(156,44,168*state.distance/state.duration,7,'#6bffe3',3);
 }
 function oval(x,y,rx,ry,color){
  ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
 }
 function drawMoles(){
  const field=ctx.createLinearGradient(0,95,0,H);
  field.addColorStop(0,'#98d86a');field.addColorStop(1,'#367d48');
  ctx.fillStyle=field;ctx.fillRect(0,0,W,H);
  for(let i=0;i<95;i++){
   const x=(i*137)%W,y=86+(i*89)%480;
   oval(x,y,3+i%3,1.7,i%7===0?'#fff0a8':'#3d814c55');
   if(i%7===0)ball(x,y,1.6,'#ed965a');
  }
  box(0,0,W,96,'#123b53',0);
  text('MOLE GARDEN  /  STAGE '+state.level,240,30,17,'#adffc1');
  text('잡은 수 '+state.caught+' / '+state.goal,240,61,24);
  box(48,73,384,10,'#091f35',5);
  if(state.caught)box(48,73,384*Math.min(1,state.caught/state.goal),10,'#7ef088',5);
  for(let i=0;i<9;i++){
   const x=90+i%3*150,y=213+Math.floor(i/3)*145,mole=state.holes[i];
   oval(x+2,y+7,68,33,'#2d713a66');
   oval(x,y,65,30,'#805232');oval(x,y-4,62,28,'#cc985b');
   for(let j=0;j<7;j++){
    const angle=j*Math.PI/3;
    oval(x+Math.cos(angle)*53,y+Math.sin(angle)*22,7,4,'#d7a76c');
   }
   oval(x,y-5,47,21,'#391f20');oval(x,y-1,40,13,'#24131b');
   if(mole){
    const hit=mole.hitAt!==null;
    const rise=Math.min(1,(state.t-mole.from)/.15);
    const fall=hit?Math.min(1,(mole.hitAt+.34-state.t)/.22):Math.min(1,(mole.until-state.t)/.18);
    const lift=Math.max(0,Math.min(rise,fall)),top=y-57*lift;
    ctx.save();ctx.beginPath();ctx.rect(x-60,y-110,120,115);ctx.clip();
    oval(x,top+32,43,39,'#52332c');
    oval(x,top+30,40,36,hit?'#b77758':'#966347');
    oval(x-15,top+11,17,9,'#cc9b736e');
    oval(x,top+33,28,16,'#e7b386');
    oval(x,top+26,12,7,'#44282a');
    oval(x-3,top+24,4,2,'#d1a49e');
    if(hit){
     for(const dx of [-16,16]){
      line(x+dx-5,top+13,x+dx+5,top+21,'#472630',3);
      line(x+dx+5,top+13,x+dx-5,top+21,'#472630',3);
     }
     oval(x,top+44,7,5,'#622d34');
     text('✦',x-39,top+11,20,'#fff18a');text('✧',x+39,top+3,24,'#fff5a7');
    }else{
     oval(x-16,top+17,4,6,'#2f1d22');oval(x+16,top+17,4,6,'#2f1d22');
     box(x-8,top+40,16,8,'#fff2db',3);line(x,top+41,x,top+47,'#a47156',1);
    }
    oval(x-30,top+59,13,9,'#704735');oval(x+30,top+59,13,9,'#704735');
    ctx.restore();
   }
   oval(x,y+18,51,9,'#b47e48');
   text(i+1,x,y+22,12,'#ffecb1');
  }
  box(20,562,440,26,'#153850',12);
  if(state.time>0)box(23,565,434*state.time/20,20,'#e9b845',10);
  text(Math.ceil(state.time)+'초  ·  '+state.combo+' 콤보',240,581,15,'#fff');
 }
 function drawShooter(){
  const space=ctx.createRadialGradient(355,132,16,240,320,480);
  space.addColorStop(0,'#304174');space.addColorStop(.4,'#152043');space.addColorStop(1,'#030514');
  ctx.fillStyle=space;ctx.fillRect(0,0,W,H);
  for(let i=0;i<70;i++){
   const speed=14+i%4*12,y=(i*73+state.t*speed)%H,x=(i*89)%W;
   if(i%8===0)line(x,y-7,x,y+2,'#85b7ff55',1);
   ball(x,y,1+i%3*.35,i%3===0?'#e5e5ff':'#668bb9');
  }
  oval(402,105,89,66,'#4766a728');oval(398,101,74,55,'#41598335');
  for(const a of state.aliens){
   if(!a.alive)continue;
   const x=(a.x+state.shift)*W,y=a.y*H,color=['#ea7cb8','#ac94ff','#5de5dd'][Math.floor(a.y*12)%3];
   ctx.save();ctx.translate(x,y);
   ctx.fillStyle=color;ctx.beginPath();
   ctx.moveTo(-22,-5);ctx.lineTo(-11,-2);ctx.lineTo(-7,-12);ctx.lineTo(7,-12);
   ctx.lineTo(11,-2);ctx.lineTo(22,-5);ctx.lineTo(15,10);ctx.lineTo(-15,10);ctx.closePath();ctx.fill();
   box(-7,-7,14,11,'#1a2448',4);box(-5,-4,10,4,'#e7fbff',2);
   line(-17,9,17,9,'#ffffff88',2);
   ctx.restore();
  }
  for(const b of state.bullets){
   const x=b.x*W,y=b.y*H;
   box(x-5,y-9,10,24,'#55eafa55',4);box(x-2,y-8,4,19,'#d5ffff',2);
  }
  for(const b of state.shots){
   const x=b.x*W,y=b.y*H;
   ball(x,y,8,'#ff689849');ball(x,y,4,'#ffacce');
  }
  const x=state.x*W,y=.88*H,flame=13+Math.sin(state.t*46)*5;
  oval(x,y+20,12,flame,'#50ccff55');oval(x,y+21,5,flame*.7,'#a2edff');
  ctx.fillStyle=state.hit>0?'#ff8eb4':'#62b4ed';
  ctx.beginPath();ctx.moveTo(x,y-26);ctx.lineTo(x+12,y-1);ctx.lineTo(x+24,y+11);
  ctx.lineTo(x+21,y+19);ctx.lineTo(x,y+13);ctx.lineTo(x-21,y+19);ctx.lineTo(x-24,y+11);ctx.lineTo(x-12,y-1);ctx.closePath();ctx.fill();
  oval(x,y-1,7,13,'#e6fbff');oval(x,y-2,4,9,'#305985');
  for(const side of [-1,1])ball(x+side*17,y+10,3,'#c4ffe9');
  box(14,10,452,36,'#09142cd9',10);
  text('GALAXY SHOOTER',26,34,15,'#b4eaff','left');
  text('WAVE '+state.wave,450,34,16,'#c3b6ff','right');
 }
 function draw(){ctx.fillStyle='#080e20';ctx.fillRect(0,0,W,H);const g=gameMeta;
  ctx.strokeStyle='#1a2944';ctx.lineWidth=1;for(let x=0;x<W;x+=40)line(x,0,x,H,'#14243c',1);for(let y=0;y<H;y+=40)line(0,y,W,y,'#14243c',1);
  if(state.kind==='blocks'){
   const cell=25,ox=50,oy=45;box(ox-3,oy-3,256,506,'#17243d');for(let y=0;y<20;y++)for(let x=0;x<10;x++)box(ox+x*cell,oy+y*cell,23,23,state.grid[y][x]?colours[state.grid[y][x]-1]:'#0a1327',3);
   state.shape.forEach((r,j)=>r.forEach((v,i)=>{if(v&&state.py+j>=0)box(ox+(state.px+i)*cell,oy+(state.py+j)*cell,23,23,colours[state.colour-1],3)}));text('NEXT',380,70,18,'#95b1d3');C.SHAPES[state.next].forEach((r,j)=>r.forEach((v,i)=>{if(v)box(330+i*24,100+j*24,21,21,colours[state.next],3)}));text('LINES',380,240,16,'#95b1d3');text(state.lines,380,280,34);text('LEVEL',380,350,16,'#95b1d3');text(1+Math.floor(state.lines/10),380,390,34);
  }else if(state.kind==='shooter'){
   drawShooter();
  }else if(state.kind==='breaker'){
   drawBreaker();
  }else if(state.kind==='racer'){
   drawRacer();
  }else if(state.kind==='mole'){
   drawMoles();
  }else if(state.kind==='pump'){
   drawPump();
  }else if(C.isRhythm(state.kind)){
   const arrows=['←','↓','↑','→'];for(let i=0;i<4;i++){box(30+i*107,60,98,485,i%2?'#152642':'#101f38',3);text(arrows[i],79+i*107,530,45,g.colour);}line(30,504,450,504,'#fff',3);for(const n of state.notes){const y=(.84-(n.at-state.t)*.42)*H;if(!n.judged&&y>50&&y<560){box(39+n.lane*107,y-20,80,38,colours[n.lane],8);text(arrows[n.lane],79+n.lane*107,y+13,34,'#11233b');}}text(state.judgement,240,32,19,'#a7f7e3');text(state.combo+' COMBO',240,588,18,'#d8b9ff');
  }else if(state.kind==='pingpong'){
   TABLE_TENNIS_VIEW.draw(ctx,state);
  }else if(state.kind==='hockey'){
   AIR_HOCKEY_VIEW.draw(ctx,state);
  }
  if(state.hit>0){ctx.fillStyle='rgba(255,76,120,.12)';ctx.fillRect(0,0,W,H);}
 }
})();
