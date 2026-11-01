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
a.strictEqual(TH.corners().length,4);console.log('theater OK');
