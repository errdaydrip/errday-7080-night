// node tests/theater.test.js — 극장 레이아웃/충돌/투영 계산
const a=require('assert');const TH=require('../public/theater.js');const T=TH.T;
const hit=(x,z)=>TH.obstacles.some(o=>x>o.x0-.25&&x<o.x1+.25&&z>o.z0-.25&&z<o.z1+.25);
a(TH.seats.length>=20,'seats');TH.seats.forEach(s=>{a(TH.inside(s.x,s.z),'seat inside '+s.id);a(!hit(s.x,s.z),'seat free '+s.id);a(!hit(...s.stand),'stand free '+s.id);a.strictEqual(s.table,'TH');
 a(Math.abs(TH.floorAt(s.x,s.z)-(s.y-.42))<1e-9,'seat height matches floor '+s.id);});
a.strictEqual(new Set(TH.seats.map(s=>s.id)).size,TH.seats.length,'unique ids');
// 문 통과 경로: 거리(x=13)에서 문 중앙을 지나 통로로 스크린 앞까지 막힘 없음
const mz=(T.door.z0+T.door.z1)/2;for(let x=12.5;x<=20.5;x+=.1)a(!hit(x,mz),'door path blocked at '+x.toFixed(1));
// 계단 높이차 < .2 (blocked() 규칙)
let prev=0;for(let x=13;x<=21.4;x+=.05){const f=TH.floorAt(x,mz)??0;a(Math.abs(f-prev)<=.2,'step');prev=f;}
// 문 이외에는 거리에서 들어갈 수 없음, 극장 옆 바깥(동쪽 빈 공간)도 막힘
for(let z=T.z0;z<=T.z1;z+=.1)if(z<T.door.z0-.3||z>T.door.z1+.3)a(hit(T.x0+.05,z),'wall '+z.toFixed(1));
a(hit(18,T.z1+1)&&hit(18,T.z0-1)&&hit(T.x1,18),'outside sealed');
// 기존 거리(x<=13.4)·야장 영역은 극장 장애물에 안 걸림
for(let z=12.3;z<=25.4;z+=.2)for(let x=-11;x<=13.3;x+=.5)a(!hit(x,z)||x>13.4,'street ok');
// 투영 호모그래피: 단위 사각형 모서리가 목표 점으로 감
const pts=[[100,50],[700,80],[650,420],[120,400]],M=TH.quadMatrix(640,360,pts);
const ap=(x,y)=>{const X=M[0]*x+M[4]*y+M[12],Y=M[1]*x+M[5]*y+M[13],Wv=M[3]*x+M[7]*y+M[15];return[X/Wv,Y/Wv];};
[[0,0],[640,0],[640,360],[0,360]].forEach(([x,y],i)=>{const [X,Y]=ap(x,y);a(Math.abs(X-pts[i][0])<1e-6&&Math.abs(Y-pts[i][1])<1e-6,'corner '+i);});
a.strictEqual(TH.corners().length,4);
// 앉으면 시선이 스크린 정중앙: 카메라 C=H+dir*d 에서 -dir 방향이 스크린 중심을 정확히 향함 (줄마다 높이 달라도, 거리 상관없이)
const S=T.screen;TH.seats.forEach(s=>{const {yaw,pitch}=TH.aim(s);const dir=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)];
 const H=[s.x,s.y+.95+TH.CAM_LIFT,s.z];[1,2.5,4.5,5.5].forEach(d=>{const C=H.map((h,i)=>h+dir[i]*d),v=[S.x-C[0],S.y-C[1],S.z-C[2]],l=Math.hypot(...v);
  const cos=-(v[0]*dir[0]+v[1]*dir[1]+v[2]*dir[2])/l;a(cos>1-1e-9,'aim '+s.id+' d'+d);a(C[1]>.25,'cam above floor');});});
a.notStrictEqual(TH.aim(TH.seats[0]).pitch,TH.aim(TH.seats[TH.seats.length-1]).pitch,'per-row pitch');
// 자막 토글
a.deepStrictEqual(TH.subsUI({type:'yt'},true,false).visible,false,'hidden outside theater');
a(TH.subsUI({type:'yt'},true,true).enabled&&TH.subsUI({type:'yt'},true,true).on);a(!TH.subsUI({type:'yt'},false,true).on);
a(TH.subsUI({type:'vimeo'},true,true).enabled);const au=TH.subsUI({type:'url'},true,true);a(au.visible&&!au.enabled&&au.note);a(!TH.subsUI({type:'sc'},true,true).enabled);
a.strictEqual(TH.pickTrack([{languageCode:'en'},{languageCode:'ko'}]).languageCode,'ko');a.strictEqual(TH.pickTrack([{languageCode:'en'}]).languageCode,'en');a.strictEqual(TH.pickTrack([]),null);
a.strictEqual(TH.pickTrack([{language:'ja'},{language:'ko-KR'}],'language').language,'ko-KR');
// 폰 세로/가로: 계산한 시야각이면 스크린 폭·높이가 여백 두고 화면 안에 들어감
[[9/19.5,70],[19.5/9,55],[16/9,70],[3/4,70]].forEach(([asp,base])=>[6,9,11].forEach(D=>{const f=TH.fitFov(D,asp,base)*Math.PI/180,th=Math.tan(f/2);
 a(T.screen.h/2/D<=th/1.19,'height fits '+asp+' '+D);a(T.screen.w/2/D<=th*asp/1.19,'width fits '+asp+' '+D);a(TH.fitFov(D,asp,base)>=base);}));
// 나이트→극장 문: 포장마차 문처럼 진짜 뚫린 문, 극장 쪽 벽 끝 (포차 문과 따로)
{const CD=TH.CLUB_DOOR,PD={x:-3.3,w:2};a(CD.x-CD.w/2>PD.x+PD.w/2+.5,'not overlapping pocha exit');a.strictEqual(CD.z,12,'on club front wall like pocha door');a.strictEqual(CD.w,PD.w,'same size as pocha door');
 a(Math.abs(T.x0-CD.x)<Math.abs(T.x0-PD.x)&&CD.x+CD.w/2<12,'nearer the theater, inside club wall');a(TH.clubDoorHit(CD.x,11.55)&&!TH.clubDoorHit(PD.x,11.55));}
console.log('theater OK');
