// LED 전광판 스크린샷 + 관리자 입력칸
const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const D='/workspace/errday-7080-night/';
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const pg=await b.newPage();await pg.setViewport({width:1000,height:620});
 pg.on('pageerror',e=>console.log('ERR',e.message));pg.on('dialog',d=>d.accept('6651'));await pg.goto('http://localhost:'+(process.env.PORT||8080));await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:120000});await pg.click('#enter');await W(3000);
 await pg.evaluate(()=>{setTickerIdle('🎉 오늘 밤 7080 나이트 OPEN! 신청곡 받아요 🎶');rig.object3D.position.set(0,0,2);camYaw=0;camPitch=-.05;camDist=5;});await W(2500);
 const st=await pg.evaluate(()=>TICKER_STATE());if(!/OPEN/.test(st.text))throw new Error('text not applied');
 await pg.screenshot({path:D+'ticker.png'});
 await pg.evaluate(()=>{const r=document.querySelector('.presetEdit');r.style.display='flex';const pb=document.getElementById('presetBox');let n=pb;while(n){n.classList&&n.classList.remove('hidden');n.style&&(n.style.display=n.style.display==='none'?'':n.style.display);n=n.parentElement;}});
 await pg.evaluate(()=>{const b=document.querySelector('#presetBox');b.scrollIntoView();});await W(300);
 try{const el=await pg.$('#presetBox');await el.screenshot({path:D+'ticker_admin.png'});}catch(e){console.log('admin shot skipped');}console.log('ticker shot');await b.close();process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
