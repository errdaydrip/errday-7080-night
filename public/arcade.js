// Shared physical layout. The arcade sits beside the rink, across from the red car.
(function(root){
 const T={x0:-22,x1:-2.8,z0:29.7,z1:55.7,h:6.2};
 const DOOR={x:-7,z:T.z0,half:2};
 const ENTRY={x:DOOR.x,z:28.7},ARRIVE={x:DOOR.x,z:31.3};
 const GAMES={
  blocks:{name:'블록 퍼즐',subtitle:'테트리스 방식',colour:'#b58aff',controls:'← → 이동 · ↑ 회전 · ↓ 빠르게 · Space 즉시 내리기'},
  shooter:{name:'갤럭시 슈터',subtitle:'갤러그 스타일',colour:'#4eeaff',controls:'← → 이동 · Space / 발사 버튼'},
  breaker:{name:'네온 벽돌깨기',subtitle:'NEON BREAKER',colour:'#ff65ba',controls:'← → 패들 이동 · 공을 놓치지 마세요'},
  racer:{name:'터보 레이서',subtitle:'TURBO RUN',colour:'#ffd465',controls:'← → 차선 변경 · 자동차를 피하세요'},
  hoops:{name:'버저 비터',subtitle:'BASKET SHOT',colour:'#ff945e',controls:'Space / 슛 버튼을 눌러 움직이는 골대를 맞히세요'},
  reflex:{name:'라이트 터치',subtitle:'LIGHT TAP',colour:'#76ffd5',controls:'빛나는 패널을 클릭·터치 · 키보드 1~9'},
  rhythm:{name:'비트 스테이션',subtitle:'4 KEY RHYTHM',colour:'#ed8bff',controls:'D F J K 또는 방향키 · 노트가 판정선에 닿을 때 누르세요'},
  ddr:{name:'댄스 스테이지',subtitle:'DDR 스타일',colour:'#73f4ed',controls:'← ↓ ↑ → 또는 터치 발판 · 박자에 맞춰 누르세요'},
  pingpong:{name:'탁구',subtitle:'VS COMPUTER · 7점 승부',colour:'#7bafff',controls:'← → 라켓 이동 · Space / 서브 · AI와 7점 승부'},
  hockey:{name:'에어하키',subtitle:'VS COMPUTER · 7점 승부',colour:'#ff75c9',controls:'방향키 / 드래그로 말렛 이동 · AI와 7점 승부'}
 };
 const machines=[];for(const [side,x,yaw] of [[-1,-20.5,Math.PI/2],[1,-4.3,-Math.PI/2]])Object.keys(GAMES).slice(0,8).forEach((game,i)=>machines.push({id:`AC-${side<0?'L':'R'}${i}`,game,x,z:33+i*1.65,yaw,spot:{x:x-side*1.65,z:33+i*1.65},box:{x0:x-.65,x1:x+.65,z0:32.25+i*1.65,z1:33.75+i*1.65}}));
 machines.push({id:'AC-PING',game:'pingpong',x:-16.8,z:51.4,yaw:0,spot:{x:-16.8,z:48.7},box:{x0:-18.3,x1:-15.3,z0:49.6,z1:53.2}},
 {id:'AC-HOCKEY',game:'hockey',x:-8.1,z:51.4,yaw:0,spot:{x:-8.1,z:48.7},box:{x0:-9.6,x1:-6.6,z0:49.6,z1:53.2}});
 const inside=(x,z)=>x>T.x0&&x<T.x1&&z>T.z0&&z<T.z1;
 const obstacles=[{x0:T.x0-.1,x1:T.x0+.15,z0:T.z0,z1:T.z1},{x0:T.x1-.15,x1:T.x1+.1,z0:T.z0,z1:T.z1},{x0:T.x0,x1:T.x1,z0:T.z1-.15,z1:T.z1+.1},{x0:T.x0,x1:DOOR.x-DOOR.half,z0:T.z0-.1,z1:T.z0+.15},{x0:DOOR.x+DOOR.half,x1:T.x1,z0:T.z0-.1,z1:T.z0+.15},...machines.map(m=>m.box)];
 const api={T,DOOR,ENTRY,ARRIVE,GAMES,machines,inside,obstacles};if(typeof module!=='undefined')module.exports=api;else root.ARCADE=api;
})(typeof window!=='undefined'?window:this);
