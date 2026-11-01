// node tests/resume.test.js — 앱 재시작(새 소켓, 같은 clientId) 복원: 유예시간 안이면 같은 사람으로 다시 붙고, 지나도 기억한 위치로
const {io}=require('socket.io-client');const a=require('assert');const W=ms=>new Promise(r=>setTimeout(r,ms));
const U='http://localhost:'+(process.env.PORT||8080);const c=()=>io(U,{forceNew:true});const join=(s,p)=>new Promise(r=>s.emit('join',p,r));
(async()=>{const w=c();let online=[];w.on('online',n=>online.push(n));const sys=[];w.on('chat',m=>m.sys&&sys.push(m.text));await W(300);
 const s1=c();await W(300);a((await join(s1,{nick:'Resumer',clientId:'R-1'})).ok);s1.emit('move',{pos:[3,0,18],rot:.5});s1.emit('seat','Y3-1');await W(300);
 s1.disconnect();await W(400);
 // 앱이 다시 열림 (유예시간 안): 같은 clientId → 유령 없이 이어붙음
 const s2=c();await W(300);const r=await join(s2,{nick:'Resumer',clientId:'R-1'});a(r.ok&&r.resume,'resume');a.deepStrictEqual(r.resume.pos,[3,0,18]);a.strictEqual(r.resume.seat,'Y3-1');
 a.strictEqual(sys.filter(x=>x==='Resumer 님 입장!').length,1,'no duplicate join');console.log('step1');
 // 유예시간 지나서 다시 열림: 서버엔 없지만 앱이 기억한 last 로 복원
 s2.disconnect();await W(2600);a(sys.includes('Resumer 님 퇴장'),'left after grace');
 const s3=c();await W(300);const r3=await join(s3,{nick:'Resumer',clientId:'R-1',last:{t:Date.now(),pos:[-5,0,17],rot:1,seat:'Y1-2',carry:'soju',drinks:[1]}});
 a(r3.ok&&r3.resume,'resume from app memory');a.deepStrictEqual(r3.resume.pos,[-5,0,17]);a.strictEqual(r3.resume.seat,'Y1-2');a.strictEqual(r3.resume.carry,'soju');
 // 잘못된 값은 안전하게
 s3.disconnect();await W(2600);const s4=c();await W(300);const r4=await join(s4,{nick:'Resumer',clientId:'R-1',last:{pos:['x'],carry:'gun'}});a.deepStrictEqual(r4.resume.pos,[0,0,4]);a.strictEqual(r4.resume.carry,null);
 // 처음 오는 사람은 resume 없음
 const s5=c();await W(300);const r5=await join(s5,{nick:'Newbie',clientId:'N-1'});a(r5.ok&&!r5.resume);
 console.log('resume OK');process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
