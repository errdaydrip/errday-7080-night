// ---------- 야장 극장 (옛 비디오방+만화방 자리를 합친 건물) : 순수 데이터/계산 (브라우저+node 테스트 공용) ----------
(function(root){
 const T={x0:14,x1:25,z0:12.6,z1:23.6,h:6.3,wall:.2,door:{z0:16.9,z1:19.3},
  screen:{x:24.75,z:18.1,y:3.1,w:8.8,h:4.95}};
 // 좌석: 스크린(+x)을 바라보는 3줄, 가운데 통로(문 앞) 비움
 const seats=[];const rows=[16.2,17.5,18.8],cols=[13.7,14.6,15.5,16.4,19.8,20.7,21.6,22.5].map(z=>z+.0);
 rows.forEach((x,r)=>cols.forEach((z,c)=>{if(z<T.z0+.9||z>T.z1-.9)return;seats.push({id:`TH-${r}${c}`,table:'TH',x,z,y:.42+r*.12,yaw:Math.PI/2,stand:[x-.55,z],row:r});}));
 // 바닥: 뒷줄일수록 약간 높게 (계단식)
 const floorAt=(x,z)=>{if(!inside(x,z))return null;if(x<16.85)return 0;if(x<18.15)return .12;return .24;};
 const inside=(x,z)=>x>T.x0+T.wall&&x<T.x1-T.wall&&z>T.z0+T.wall&&z<T.z1-T.wall;
 // 벽 충돌 (문 구멍 제외) + 건물 밖 동쪽 공간 막기
 const W=T.wall,D=T.door;
 const obstacles=[
  {x0:T.x0-.1,x1:T.x0+W,z0:T.z0-.6,z1:D.z0}, {x0:T.x0-.1,x1:T.x0+W,z0:D.z1,z1:T.z1+.6}, // 앞벽 (문 양옆)
  {x0:T.x0,x1:40,z0:T.z0-6,z1:T.z0+W},{x0:T.x0,x1:40,z0:T.z1-W,z1:T.z1+20},           // 옆벽 + 바깥
  {x0:T.x1-W-.1,x1:40,z0:T.z0,z1:T.z1}];                                                     // 뒷벽(스크린)
 // 카메라 가림 상자 [x0,y0,z0,x1,y1,z1]
 const camOcc=[[T.x0-.1,0,T.z0,T.x0+W,T.h,D.z0],[T.x0-.1,0,D.z1,T.x0+W,T.h,T.z1],[T.x0-.1,2.7,D.z0,T.x0+W,T.h,D.z1],
  [T.x0,0,T.z0-.1,T.x1,T.h,T.z0+W],[T.x0,0,T.z1-W,T.x1,T.h,T.z1+.1],[T.x1-W,0,T.z0,T.x1+.1,T.h,T.z1],[T.x0,T.h-.1,T.z0,T.x1,T.h+.3,T.z1]];
 const corners=()=>{const s=T.screen;return[[s.x,s.y+s.h/2,s.z-s.w/2],[s.x,s.y+s.h/2,s.z+s.w/2],[s.x,s.y-s.h/2,s.z+s.w/2],[s.x,s.y-s.h/2,s.z-s.w/2]];}; // 좌상,우상,우하,좌하 (안에서 볼 때)
 // 직사각형(w×h px) → 화면상의 사각형(p0..p3) 으로 보내는 CSS matrix3d (투영 호모그래피)
 function quadMatrix(w,h,p){const [x0,y0]=p[0],[x1,y1]=p[1],[x2,y2]=p[2],[x3,y3]=p[3];
  const dx1=x1-x2,dx2=x3-x2,dy1=y1-y2,dy2=y3-y2,sx=x0-x1+x2-x3,sy=y0-y1+y2-y3,den=dx1*dy2-dx2*dy1;if(Math.abs(den)<1e-9)return null;
  const g=(sx*dy2-dx2*sy)/den,hh=(dx1*sy-sx*dy1)/den;
  const a=x1-x0+g*x1,b=x3-x0+hh*x3,d=y1-y0+g*y1,e=y3-y0+hh*y3;
  const M=[a/w,d/w,0,g/w, b/h,e/h,0,hh/h, 0,0,1,0, x0,y0,0,1];return M;}
 // 앉았을 때 시선: 카메라는 (머리 위 기준점 + dir*거리)에 있고 -dir 을 봄 → dir 을 (기준점-스크린중심) 방향으로 두면 거리와 상관없이 정중앙을 봄
 const CAM_LIFT=.55,HEAD_SIT=.95;
 function aim(seat){const S=T.screen,hx=seat.x,hy=(seat.y||0)+HEAD_SIT+CAM_LIFT,hz=seat.z;const dx=hx-S.x,dy=hy-S.y,dz=hz-S.z,l=Math.hypot(dx,dy,dz);return{yaw:Math.atan2(dx,dz),pitch:Math.asin(dy/l)};}
 // 자막 토글 상태: 극장 안 + 영상(유튜브/비메오)일 때만 사용 가능
 function subsUI(cur,pref,inTheater){if(!inTheater)return{visible:false,enabled:false,on:false,note:''};
  if(!cur)return{visible:true,enabled:false,on:false,note:'재생 중인 영상 없음'};
  if(cur.type!=='yt'&&cur.type!=='vimeo')return{visible:true,enabled:false,on:false,note:'오디오 곡이라 자막 없음'};
  return{visible:true,enabled:true,on:!!pref,note:''};}
 // 자막 트랙 고르기: 한국어 우선, 없으면 첫 번째(기본)
 function pickTrack(list,key){if(!Array.isArray(list)||!list.length)return null;key=key||'languageCode';return list.find(t=>/^ko/i.test(t[key]||''))||list[0];}
 // 스크린(폭 w, 높이 h)을 거리 D에서 여백(margin) 두고 다 보이게 하는 세로 시야각(도). 가로가 좁은 세로폰이면 폭 기준으로 넓힘
 function fitFov(D,aspect,base,margin){margin=margin||1.2;const S=T.screen,r=Math.PI/180;const v1=2*Math.atan(S.h*margin/2/D)/r,v2=2*Math.atan(Math.tan(Math.atan(S.w*margin/2/D))/aspect)/r;return Math.max(base||0,v1,v2);}
 // 나이트 → 극장 바로가기 문 (포차 출구 오른쪽, 클럽 앞벽 안쪽). 들어서면 극장 입구 안쪽으로 순간이동
 const CLUB_DOOR={x:-.2,z:11.85,w:1.4,h:2.6},ARRIVE={x:14.9,z:18.1,yaw:Math.PI/2};
 const clubDoorHit=(x,z)=>Math.abs(x-CLUB_DOOR.x)<CLUB_DOOR.w/2&&z>11.3&&z<12;
 const api={CLUB_DOOR,ARRIVE,clubDoorHit,fitFov,aim,subsUI,pickTrack,CAM_LIFT,T,seats,inside,floorAt,obstacles,camOcc,corners,quadMatrix};
 if(typeof module!=='undefined')module.exports=api;else root.THEATER=api;
})(typeof window!=='undefined'?window:this);
