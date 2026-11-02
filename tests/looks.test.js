// node tests/looks.test.js — 상의/하의 색, 액세서리, 헤어 (예전 저장값 호환 + 서버 동기)
const a=require('assert');const L=require('../public/looks.js');
a.strictEqual(L.PALETTE.length,10);a(L.PALETTE.every(([c])=>L.HEX.test(c)));
for(const g of ['m','f'])for(const st of L.STYLES){const d=L.DEF[g][st];a(d&&L.HEX.test(d[0])&&L.HEX.test(d[1]),g+st);}
a.strictEqual(L.HAIR.m.filter(h=>h[0]).length,3);a.strictEqual(L.HAIR.f.filter(h=>h[0]).length,3);
// 예전 데이터 (outfit 한 색): 남자 디스코는 상의로 (바지가 바뀌던 버그)
let r=L.resolve({gender:'m',style:'disco',outfit:'#ff8c00'});a.strictEqual(r.top,'#ff8c00');a.strictEqual(r.bottom,L.DEF.m.disco[1]);
r=L.resolve({gender:'f',style:'hanbok',outfit:'#e0262e'});a.strictEqual(r.bottom,'#e0262e','hanbok chima keeps old color');
r=L.resolve({gender:'m',style:'suit',top:'#e0262e',bottom:'#1a1a1a',acc:'sunglasses',hair:'m2'});a.deepStrictEqual([r.top,r.bottom,r.acc,r.hair],['#e0262e','#1a1a1a','sunglasses','m2']);
r=L.resolve({gender:'f',hair:'m2',acc:'crown',top:'red'});a.strictEqual(r.hair,'');a.strictEqual(r.acc,'none');a.strictEqual(r.top,L.DEF.f.suit[0]);
a.strictEqual(L.resolve({}).style,'suit');
a.strictEqual(L.STYLES[0],'basic','<기본> first');r=L.resolve({gender:'f',style:'basic'});a.deepStrictEqual([r.top,r.bottom],['#f5f5f5','#2f7bff']);r=L.resolve({gender:'m',style:'basic',top:'#e0262e',bottom:'#1a1a1a'});a.deepStrictEqual([r.style,r.top,r.bottom],['basic','#e0262e','#1a1a1a']);
// 서버 동기: 다른 사람에게 상의/하의/액세서리/헤어 전달
const {io}=require('socket.io-client');const W=ms=>new Promise(x=>setTimeout(x,ms));const U='http://localhost:'+(process.env.PORT||8080);
(async()=>{const w=io(U,{forceNew:true});const seen={};w.on('player',p=>seen[p.id]=p);const s=io(U,{forceNew:true});await W(400);
 await new Promise(x=>s.emit('join',{nick:'꾸미기',clientId:'LK1',gender:'f',style:'disco',top:'#ffd400',bottom:'#24306e',acc:'glasses',hair:'f3'},x));await W(400);
 const p=seen[s.id];a(p,'broadcast');a.deepStrictEqual([p.top,p.bottom,p.acc,p.hair],['#ffd400','#24306e','glasses','f3']);
 s.emit('profile',{nick:'꾸미기',gender:'f',style:'disco',top:'#2f9e44',bottom:'#ff69b4',acc:'sunglasses',hair:'f1'},()=>{});await W(400);
 const p2=seen[s.id];a.deepStrictEqual([p2.top,p2.bottom,p2.acc,p2.hair],['#2f9e44','#ff69b4','sunglasses','f1'],'profile update synced');
 const s2=io(U,{forceNew:true});await W(300);await new Promise(x=>s2.emit('join',{nick:'해커',clientId:'LK2',top:'javascript:',acc:'<b>',hair:'zz'},x));await W(300);
 const q=seen[s2.id];a.strictEqual(q.acc,'none');a.strictEqual(q.hair,'');a(L.HEX.test(q.top));
 console.log('looks OK');process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
