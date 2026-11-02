// node tests/waiter.test.js — 웨이터 리필 (자체 서버를 짧은 시간 설정으로 띄움)
const a=require('assert');const {refill,needs}=require('../waiter');const {spawn}=require('child_process'),path=require('path');
const E=[null,null,null,null];a.deepStrictEqual(refill(E,4).map(i=>i.k),['beer','beer','beer','fruit']);
a.deepStrictEqual(refill([{k:'soju',u:2},null,{k:'squid',u:1},null],4).map(i=>i.k),['soju','beer','squid','beer']);
a.strictEqual(refill([{k:'soju',u:2},null,null,null],4)[0].u,2,'keeps existing');a(!needs(refill(E,4)));a(needs([null,{k:'beer',u:1},null,null]));
const PORT=8097,{io}=require('socket.io-client'),W=ms=>new Promise(r=>setTimeout(r,ms));
const srv=spawn('node',['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT,WAITER_WALK_MS:'300',WAITER_PLACE_MS:'200',WAITER_TICK_MS:'150',REFILL_DELAY_MS:'0'},stdio:'ignore'});
(async()=>{await W(1500);const c=io('http://localhost:'+PORT,{forceNew:true});let tb={},jobs=[];c.on('table',t=>tb=t);c.on('waiterJob',j=>jobs.push(j));
 await new Promise(r=>c.emit('join',{nick:'Tester',clientId:'WT1'},r));await W(5000);
 for(const k of ['T1','T2','T3','T4','T5','T6'])a.deepStrictEqual(tb[k],['beer','beer','beer','fruit'],'filled '+k);
 for(const k of ['Y1','Y2','Y3','Y4','Y5'])a.deepStrictEqual(tb[k],[null,null,null,null],'pocha untouched '+k);
 a(jobs.every(j=>/^T\d$/.test(j.table)&&j.walk===300&&typeof j.t0==='number'&&(j.w===0||j.w===1)),'jobs broadcast');
 // 맥주 6번 마셔서 한 칸 비우면 → 그 칸만 맥주로
 c.emit('seat','T1-0');for(let i=0;i<6;i++){c.emit('drink','beer');await W(2100);}
 await W(2500);a.deepStrictEqual(tb.T1,['beer','beer','beer','fruit'],'refilled');a(jobs.some(j=>j.table==='T1'&&j.walk===300),'T1 job broadcast');
 let eats=0;c.on('eat',()=>eats++);c.emit('eat','fruit');await W(400);a.strictEqual(eats,1,'fruit edible');
 console.log('waiter OK');srv.kill();process.exit(0);})().catch(e=>{console.error(e);srv.kill();process.exit(1);});
