// 캐릭터 만들기: 여자 + 양갈래 선택 화면
const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const D='/workspace/errday-7080-night/';const a=require('assert');
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const pg=await b.newPage();await pg.setViewport({width:1000,height:800});
 pg.on('pageerror',e=>console.log('ERR',e.message));await pg.goto('http://localhost:'+(process.env.PORT||8080));await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:120000});
 await pg.click('button.g[data-v="f"]');await W(300);await pg.click('#hairs button[data-v="f4"]');await W(1500);
 a.strictEqual(await pg.evaluate(()=>me.hair),'f4');
 for(const st of ['disco','hanbok','basic']){await pg.click(`button.s[data-v="${st}"]`);await W(200);a.strictEqual(await pg.evaluate(()=>me.hair),'f4','hair kept after outfit '+st);a(await pg.evaluate(()=>!!document.querySelector('#hairs button.sel[data-v="f4"]')),'picker shows kept hair');}
 await pg.click('button.g[data-v="m"]');await W(200);a.strictEqual(await pg.evaluate(()=>me.hair),'','gender switch resets incompatible hair');
 await pg.click('#hairs button[data-v="m2"]');await pg.click('button.s[data-v="disco"]');await W(200);a.strictEqual(await pg.evaluate(()=>me.hair),'m2');await pg.screenshot({path:D+'picker.png'});console.log('picker OK');await b.close();process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
