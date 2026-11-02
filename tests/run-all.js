// npm test: 서버를 띄우고 tests/*.test.js 전부 실행 (브라우저 필요한 테스트는 CHROME 있을 때만)
const {spawn,spawnSync}=require('child_process'),fs=require('fs'),path=require('path');const PORT=process.env.PORT||8080;
const srv=spawn('node',['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT,BAN_MS:'3000',GRACE_MS:'1500',WAITER_OFF:'1',STATE_FILE:require('os').tmpdir()+'/errday-test-state.json'},stdio:'ignore'});
setTimeout(()=>{let fail=0;for(const f of fs.readdirSync(__dirname).filter(f=>f.endsWith('.test.js')).sort()){const r=spawnSync('node',[path.join(__dirname,f)],{env:{...process.env,PORT},encoding:'utf8',timeout:400000});
 const ok=r.status===0;if(!ok)fail++;console.log((ok?'PASS ':'FAIL ')+f+(ok?'':'\n'+(r.stdout||'')+(r.stderr||'')).slice(0,2000));}
 srv.kill();process.exit(fail?1:0);},1500);
