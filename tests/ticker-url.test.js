// node tests/ticker-url.test.js — 관리자 전광판 위젯 주소 저장·검증·재시작 후 유지, 후원 목록 유지
const a=require('assert'),fs=require('fs'),os=require('os'),path=require('path'),{spawn}=require('child_process');const {io}=require('socket.io-client');const W=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=+(process.env.PORT||8080)+23,U='http://localhost:'+PORT,ST=path.join(os.tmpdir(),'ticker-state.json');
fs.writeFileSync(ST,JSON.stringify({donList:[{name:'테스트',amount:1000,msg:'',t:1}]}));
const start=()=>spawn('node',['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT,STATE_FILE:ST,WAITER_OFF:'1',TICKER_OFF:'1'},stdio:'ignore'});
const em=(c,ev,d)=>new Promise(r=>c.emit(ev,d,r));
(async()=>{let srv=start();await W(1500);try{
 const tok=(await (await fetch(U+'/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:process.env.ADMIN_PASSWORD||'6651'})})).json()).token;
 const c=io(U,{forceNew:true});let dl=null;c.on('donations',l=>dl=l);await W(500);a.strictEqual(dl[0].name,'테스트','old donation list kept');
 a.strictEqual((await em(c,'getTicker','nope')).ok,false);a.strictEqual((await em(c,'setTicker',{token:'x',url:'https://toon.at/widget/donation_ticker/abcdefabcdefabcdef/101'})).ok,false,'admin only');
 a.strictEqual((await em(c,'setTicker',{token:tok,url:'https://example.com'})).ok,false,'bad url');
 const NU='https://toon.at/widget/donation_ticker/abcdefabcdefabcdef/101';a.strictEqual((await em(c,'setTicker',{token:tok,url:NU})).ok,true);
 a.strictEqual((await em(c,'getTicker',tok)).url,NU);let idle=null;c.on('tickerIdle',x=>idle=x);a.strictEqual((await em(c,'setTickerIdle',{token:'x',text:'a'})).ok,false);a.strictEqual((await em(c,'setTickerIdle',{token:tok,text:'  오늘도 즐밤!  '})).ok,true);await W(200);a.strictEqual(idle,'오늘도 즐밤!'); const RU='https://toon.at/widget/ranking/abcdefabcdefabcdef';a.strictEqual((await em(c,'setRank',{token:tok,url:'https://toon.at/widget/donation_ticker/abcdefabcdefabcdef'})).ok,false);a.strictEqual((await em(c,'setRank',{token:tok,url:RU})).ok,true);
 let bd=null;c.on('boards',b=>bd=b);a.strictEqual((await em(c,'setBoards',{token:'x',rank:false})).ok,false);a.strictEqual((await em(c,'setBoards',{token:tok,rank:false})).ok,true);await W(200);a.deepStrictEqual([bd.ticker,bd.rank],[true,false]);
 c.close();srv.kill();await W(500);srv=start();await W(1500);
 const tok2=(await (await fetch(U+'/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:process.env.ADMIN_PASSWORD||'6651'})})).json()).token;
 const c2=io(U,{forceNew:true});let idle2=null,bd2=null;c2.on('tickerIdle',x=>idle2=x);c2.on('boards',b=>bd2=b);await W(400);a.strictEqual(idle2,'오늘도 즐밤!','idle persisted');a.strictEqual((await em(c2,'getTicker',tok2)).url,NU,'ticker url persisted');a.strictEqual((await em(c2,'getTicker',tok2)).rankUrl,RU,'rank url persisted');a.strictEqual(bd2.rank,false,'board toggle persisted');c2.close();
 console.log('ticker-url OK');srv.kill();process.exit(0);}catch(e){console.error(e);srv.kill();process.exit(1);}})();
