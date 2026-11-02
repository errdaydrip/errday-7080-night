// node tests/presets.test.js — 재생목록 프리셋 3개: 가짜 유튜브(YT_MOCK_FILE)로 교체·저장·반복·전체삭제 확인
const a=require('assert'),fs=require('fs'),os=require('os'),path=require('path'),{spawn}=require('child_process');const {io}=require('socket.io-client');const W=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=+(process.env.PORT||8080)+17,U='http://localhost:'+PORT,MOCK=path.join(os.tmpdir(),'yt-mock.json'),ST=path.join(os.tmpdir(),'preset-state.json');try{fs.unlinkSync(ST);}catch(e){}
fs.writeFileSync(MOCK,JSON.stringify({'PL1cIIyrjZ9L3YEUl8DAz_R6uTf2-80wWY':[{id:'aaaaaaaaaaa',title:'곡A',dur:2},{id:'bbbbbbbbbbb',title:'곡B',dur:2}],NEWLIST:[{id:'ccccccccccc',title:'곡C',dur:100}]}));
const start=()=>spawn('node',['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT,YT_MOCK_FILE:MOCK,STATE_FILE:ST,WAITER_OFF:'1'},stdio:'ignore'});
(async()=>{let srv=start();await W(1500);try{
 const tok=(await (await fetch(U+'/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:process.env.ADMIN_PASSWORD||'6651'})})).json()).token;
 const c=io(U,{forceNew:true});let pre=null,mu=null;c.on('presets',p=>pre=p);c.on('music',m=>mu=m);await W(500);
 a.deepStrictEqual(pre.map(p=>p.name),['7080mix','뮤직비디오','탑골나이트']);
 const em=(ev,d)=>new Promise(r=>c.emit(ev,d,r));
 a(!(await em('loadPreset',{token:'x',i:0})).ok,'non-admin refused');
 let r=await em('loadPreset',{token:tok,i:0});a(r.ok&&r.count===2,JSON.stringify(r));await W(300);
 a.deepStrictEqual(mu.playlist.map(t=>t.videoId),['aaaaaaaaaaa','bbbbbbbbbbb']);a.strictEqual(mu.index,0);a(mu.playing);a.strictEqual(mu.playlist[0].dur,2,'duration kept for wall-clock sync');
 // 반복: 2초짜리 2곡 → 약 4.5초 뒤 다시 첫 곡
 await W(4600);a.strictEqual(mu.index,0,'looped back to first');
 r=await em('loadPreset',{token:tok,i:1});a(!r.ok,'unknown list errors cleanly');
 a(!(await em('setPresets',{token:tok,list:[{name:'x',url:'nope'},pre[1],pre[2]]})).ok,'bad url refused');
 r=await em('setPresets',{token:tok,list:[{name:'새목록',url:'https://www.youtube.com/playlist?list=NEWLIST'},pre[1],pre[2]]});a(r.ok);await W(300);a.strictEqual(pre[0].name,'새목록','synced');
 c.emit('music',{type:'clearAll',token:tok});await W(400);a.strictEqual(mu.playlist.length,0);
 r=await em('loadPreset',{token:tok,i:0});a(r.ok);await W(300);a.strictEqual(mu.playlist[0].title,'곡C','preset works after clear-all');
 c.close();srv.kill();await W(500);srv=start();await W(1500);const c2=io(U,{forceNew:true});let p2=null;c2.on('presets',p=>p2=p);await W(600);a.strictEqual(p2[0].name,'새목록','presets persisted to disk');c2.close();
 console.log('presets OK');srv.kill();process.exit(0);}catch(e){console.error(e);srv.kill();process.exit(1);}})();
