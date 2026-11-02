// node tests/playlist.test.js — 마지막 곡 다음엔 첫 곡으로 (전체 반복), 관리자 전체삭제
const a=require('assert');const {advance}=require('../playback');
// 전체 반복: 서버와 같은 순차 next (index+1)%n → 벽시계 기준으로 끝까지 가면 처음부터
{const pl=[{id:'a'},{id:'b'},{id:'c'}],D={a:10,b:20,c:30};const m={playlist:pl,index:2,playing:true,startedAt:0,pausedAt:0};
 const ch=advance(m,t=>D[t.id],30*1000+1,()=>(m.index+1)%pl.length);a(ch);a.strictEqual(m.index,0,'last → first');a.strictEqual(m.startedAt,30000);
 const m2={playlist:pl,index:0,playing:true,startedAt:0,pausedAt:0};advance(m2,t=>D[t.id],(60+60+5)*1000,()=>(m2.index+1)%pl.length);a.strictEqual(m2.index,0,'two full loops later back on first');a.strictEqual(m2.startedAt,120000);
 const one={playlist:[{id:'a'}],index:0,playing:true,startedAt:0,pausedAt:0};advance(one,t=>D[t.id],25000,()=>(one.index+1)%1);a.strictEqual(one.index,0);a.strictEqual(one.startedAt,20000,'single song repeats');}
const {io}=require('socket.io-client');const W=ms=>new Promise(r=>setTimeout(r,ms));const U='http://localhost:'+(process.env.PORT||8080);
(async()=>{const tok=(await (await fetch(U+'/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:process.env.ADMIN_PASSWORD||'6651'})})).json()).token;a(tok,'admin login');
 const c=io(U,{forceNew:true});let mu=null,sys=[];c.on('music',m=>mu=m);c.on('chat',m=>m.sys&&sys.push(m.text));await W(500);
 c.emit('music',{type:'clearAll',token:'nope'});await W(300);const before=mu;
 c.emit('music',{type:'clearAll',token:tok});await W(500);a(mu&&mu.playlist.length===0&&mu.index===-1&&!mu.playing,'cleared for everyone');a(sys.some(t=>/모두 비웠/.test(t)));
 await W(2500);a.strictEqual(mu.playlist.length,0,'stays empty (default list not reloaded)');
 console.log('playlist OK');process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
