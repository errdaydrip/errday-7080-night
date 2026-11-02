// 후원 전광판 스크린샷 (가짜 후원 목록)
const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const D='/workspace/errday-7080-night/';
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const pg=await b.newPage();await pg.setViewport({width:1000,height:620});
 pg.on('pageerror',e=>console.log('ERR',e.message));await pg.goto('http://localhost:'+(process.env.PORT||8080));await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:120000});await pg.click('#enter');await W(3000);
 await pg.evaluate(()=>{setDonations([{name:'디스코킹',amount:10000,msg:'노래 최고!'},{name:'포차단골',amount:3000,msg:''},{name:'밤의황제',amount:50000,msg:'오늘 다 내가 쏜다'}]);rig.object3D.position.set(0,0,2);camYaw=0;camPitch=-.05;camDist=5;document.querySelector('a-camera,[camera]').setAttribute('camera','fov',75);});await W(2500);
 await pg.screenshot({path:D+'ticker.png'});
 await pg.evaluate(()=>setDonations([{name:'새손님',amount:20000,msg:'깜빡깜빡 테스트',t:2},{name:'디스코킹',amount:10000,msg:'노래 최고!'},{name:'포차단골',amount:3000,msg:''},{name:'밤의황제',amount:50000,msg:'오늘 다 내가 쏜다'}]));
 const st=await pg.evaluate(()=>TICKER_STATE());if(!st.blinking)throw new Error('should blink on new donation');await W(300);await pg.screenshot({path:D+'ticker_blink.png'});
 await W(2500);const s2=await pg.evaluate(()=>TICKER_STATE());if(s2.blinking||!/새손님/.test(s2.L1))throw new Error('after blink shows new donation '+JSON.stringify(s2));await pg.screenshot({path:D+'ticker_new.png'});console.log('ticker shot');await b.close();process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
