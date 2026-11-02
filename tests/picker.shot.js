// 캐릭터 만들기: 여자 + 양갈래 선택 화면
const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const D='/workspace/errday-7080-night/';const a=require('assert');
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const pg=await b.newPage();await pg.setViewport({width:1000,height:800});
 pg.on('pageerror',e=>console.log('ERR',e.message));await pg.goto('http://localhost:'+(process.env.PORT||8080));await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:120000});
 await pg.click('button.g[data-v="f"]');await W(300);await pg.click('#hairs button[data-v="f4"]');await W(1500);
 a.strictEqual(await pg.evaluate(()=>me.hair),'f4');await pg.screenshot({path:D+'picker.png'});console.log('picker OK');await b.close();process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
