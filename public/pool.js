/* 🎱 당구 물리 (서버·브라우저 공용, 결정적 계산) — 2D 탑뷰, 단위 m
   테이블 안쪽: x ∈ [-L/2, L/2], y ∈ [-Wd/2, Wd/2] */
(function(root){
const L=2.4,Wd=1.2,R=.045,PR=.085,DT=1/240,FR=.55 /* 굴림 감속 m/s² */,CR=.78 /* 쿠션 반발 */,BR=.96 /* 공끼리 반발 */,VMAX=6;
const POCKETS=[[-L/2,-Wd/2],[0,-Wd/2-.02],[L/2,-Wd/2],[-L/2,Wd/2],[0,Wd/2+.02],[L/2,Wd/2]];
const HEAD=[-L/4,0],FOOT=[L/4,0];
function rack(){const b=[{n:0,x:HEAD[0],y:0,in:false}];/* 삼각 랙: 8번 가운데 */
 const order=[1,9,2,10,8,3,11,4,12,5,13,6,14,7,15];let k=0;const d=R*2*1.0005,h=d*Math.sqrt(3)/2;
 for(let row=0;row<5;row++)for(let i=0;i<=row;i++){b.push({n:order[k++],x:FOOT[0]+row*h,y:(i-row/2)*d,in:false});}
 return b;}
function clone(b){return b.map(o=>({n:o.n,x:o.x,y:o.y,in:o.in}));}
/* 샷 시뮬레이션: 큐볼에 각도 a(라디안), 세기 p(0..1) */
function simulate(balls,a,p,opt){opt=opt||{};const B=clone(balls),v=B.map(()=>[0,0]);const cue=B.findIndex(o=>o.n===0);const sp=Math.max(.05,Math.min(1,p))*VMAX;
 v[cue]=[Math.cos(a)*sp,Math.sin(a)*sp];const pocketed=[];let firstHit=null,cushionAfter=false,steps=0;const frames=opt.frames?[]:null;const FE=opt.every||4;
 const live=()=>B.some((o,i)=>!o.in&&(v[i][0]!==0||v[i][1]!==0));
 while(live()&&steps<240*25){steps++;
  for(let i=0;i<B.length;i++){const o=B[i];if(o.in)continue;const w=v[i];if(w[0]===0&&w[1]===0)continue;
   o.x+=w[0]*DT;o.y+=w[1]*DT;const s=Math.hypot(w[0],w[1]),ns=s-FR*DT;if(ns<=.004){w[0]=0;w[1]=0;}else{w[0]*=ns/s;w[1]*=ns/s;}
   /* 포켓 */for(const q of POCKETS){if(Math.hypot(o.x-q[0],o.y-q[1])<PR){o.in=true;w[0]=0;w[1]=0;pocketed.push(o.n);break;}}
   if(o.in)continue;
   /* 쿠션 (포켓 입구 근처 제외) */const nearP=POCKETS.some(q=>Math.hypot(o.x-q[0],o.y-q[1])<PR*1.6);
   if(!nearP){if(o.x<-L/2+R){o.x=-L/2+R;w[0]=-w[0]*CR;if(firstHit!==null)cushionAfter=true;}if(o.x>L/2-R){o.x=L/2-R;w[0]=-w[0]*CR;if(firstHit!==null)cushionAfter=true;}
    if(o.y<-Wd/2+R){o.y=-Wd/2+R;w[1]=-w[1]*CR;if(firstHit!==null)cushionAfter=true;}if(o.y>Wd/2-R){o.y=Wd/2-R;w[1]=-w[1]*CR;if(firstHit!==null)cushionAfter=true;}}
   else{/* 포켓 입구에서 바깥으로 너무 나가면 안쪽으로 */o.x=Math.max(-L/2-R,Math.min(L/2+R,o.x));o.y=Math.max(-Wd/2-R,Math.min(Wd/2+R,o.y));}}
  /* 공끼리 충돌 (같은 질량, 탄성) */
  for(let i=0;i<B.length;i++){const a1=B[i];if(a1.in)continue;for(let j=i+1;j<B.length;j++){const b1=B[j];if(b1.in)continue;const dx=b1.x-a1.x,dy=b1.y-a1.y,d=Math.hypot(dx,dy);if(d>=2*R||d===0)continue;
   const nx=dx/d,ny=dy/d,ov=(2*R-d)/2;a1.x-=nx*ov;a1.y-=ny*ov;b1.x+=nx*ov;b1.y+=ny*ov;const rv=(v[j][0]-v[i][0])*nx+(v[j][1]-v[i][1])*ny;if(rv>=0)continue;
   const imp=-(1+BR)/2*rv;v[i][0]-=imp*nx;v[i][1]-=imp*ny;v[j][0]+=imp*nx;v[j][1]+=imp*ny;if(firstHit===null&&(B[i].n===0||B[j].n===0))firstHit=B[i].n===0?B[j].n:B[i].n;}}
  if(frames&&steps%FE===0)frames.push(B.map(o=>o.in?null:[o.x,o.y]));}
 if(frames)frames.push(B.map(o=>o.in?null:[o.x,o.y]));
 return{balls:B,pocketed,firstHit,cushionAfter,frames,steps};}
function spotCue(balls){const c=balls.find(o=>o.n===0);c.in=false;let x=HEAD[0],y=0;for(let k=0;k<40;k++){if(!balls.some(o=>o.n!==0&&!o.in&&Math.hypot(o.x-x,o.y-y)<2*R+.002))break;y=((k%2)?1:-1)*Math.ceil((k+1)/2)*R*2.2;if(Math.abs(y)>Wd/2-R){x-=R*2.2;y=0;}}c.x=x;c.y=y;}
const kind=n=>n===0?'cue':n===8?'eight':n<8?'solid':'stripe';
const API={L,Wd,R,PR,POCKETS,rack,simulate,spotCue,kind,clone};
if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.POOL=API;})(this);
