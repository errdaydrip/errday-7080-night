// 모바일: 극장 좌석 자막 버튼(점프 자리) + 앱 재시작(새로고침) 시 자동 이어서 입장
const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const a=require('assert');
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const pg=await b.newPage();
 await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true},userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile'});pg.on('pageerror',e=>console.log('ERR',e.message));
 const U='http://localhost:'+(process.env.PORT||8080);await pg.goto(U);await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:120000});
 await pg.evaluate(()=>{document.getElementById('nick').value='이어하기';});await pg.tap('#enter');await W(2500);
 const vis=id=>pg.evaluate(i=>getComputedStyle(document.getElementById(i)).display!=='none',id);
 a(await vis('jumpBtn'));a(!(await vis('subsMob')));
 await pg.evaluate(()=>sit(SEATS.find(s=>s.id==='TH-22')));await W(1000);
 a(!(await vis('jumpBtn')),'jump hidden in seat');a(await vis('subsMob'),'subs in jump spot');a(!(await vis('subsBtn')),'top subs hidden');
 const st=await pg.evaluate(()=>{const m=document.getElementById('subsMob');const before=m.textContent;m.click();return [before,m.textContent,localStorage.getItem('subs'),m.disabled];});console.log('subsMob',st);
 a(st[3]||st[0]!==st[1],'toggles or disabled for audio');
 await pg.evaluate(()=>stand());await W(500);a(await vis('jumpBtn'),'jump back');a(!(await vis('subsMob')));
 await pg.evaluate(()=>sit(SEATS.find(s=>s.id==='TH-22')));await W(1500);
 // 앱 재시작 흉내: 새로고침 → 입장 화면 없이 자동 입장, 같은 자리
 await pg.reload();await W(1000);a(!(await vis('entry')),'no entry screen');
 for(let i=0;i<40;i++){await W(1500);const d=await pg.evaluate(()=>[joined,mySeat,document.getElementById('enter').disabled,localStorage.getItem('joinedAt'),!!me.nick,window.AUTO_JOIN]);if(i%5==0)console.log(d);if(d[0]&&d[1])break;}
 const r=await pg.evaluate(()=>[mySeat,me.nick,document.getElementById('where').textContent,[...document.querySelectorAll('#msgs div')].map(d=>d.textContent).filter(t=>/이어서|이어하기/.test(t))]);console.log('after reload',r);
 a.strictEqual(r[0],'TH-22');a.strictEqual(r[1],'이어하기');a(await vis('subsMob'));
 console.log('resume shot OK');await b.close();process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
