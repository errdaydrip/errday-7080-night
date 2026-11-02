// 야장 알바: 포차 테이블 착석 → 🛎 주문하기 → 메뉴 → 알바 배달
const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const a=require('assert');const D='/workspace/errday-7080-night/';
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const pg=await b.newPage();await pg.setViewport({width:900,height:600});
 pg.on('pageerror',e=>console.log('ERR',e.message));await pg.goto('http://localhost:'+(process.env.PORT||8080));await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:120000});await pg.click('#enter');await W(3000);
 a(!(await pg.evaluate(()=>[...document.querySelectorAll('#actBar button')].some(b=>/주문하기/.test(b.textContent)))),'no order btn standing');
 await pg.evaluate(()=>{const s=SEATS.find(x=>x.id==='Y1-0');sit(s);});await pg.waitForFunction(()=>(refreshAct(true),[...document.querySelectorAll('#actBar button')].some(b=>/주문하기/.test(b.textContent))),{timeout:10000});
 await pg.evaluate(()=>[...document.querySelectorAll('#actBar button')].find(b=>/주문하기/.test(b.textContent)).click());await W(400);
 a(await pg.evaluate(()=>!$('orderMenu').classList.contains('hidden')&&$('orderMenu').querySelectorAll('.olist button').length===6),'anju menu 6');
 await pg.evaluate(()=>{camYaw=Math.PI*0.75;camPitch=.5;camDist=7;});await W(1200);await pg.screenshot({path:D+'alba_menu.png'});
 await pg.click('#orderMenu .otab[data-tab=drink]');await W(200);a.strictEqual(await pg.evaluate(()=>$('orderMenu').querySelectorAll('.olist button').length),2);
 await pg.click('#orderMenu .olist button[data-k=soju]');await W(1500);await pg.screenshot({path:D+'alba_walk.png'});
 await pg.waitForFunction(()=>(TABLE_ITEMS.Y1||[]).includes('soju'),{timeout:40000});await W(800);await pg.screenshot({path:D+'alba_done.png'});
 await pg.evaluate(()=>stand&&stand());await W(800);a(!(await pg.evaluate(()=>[...document.querySelectorAll('#actBar button')].some(b=>/주문하기/.test(b.textContent)))),'hidden after stand');
 console.log('alba shot OK');await b.close();process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
