const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await b.newPage();await pg.setViewport({width:900,height:600});pg.on('pageerror',e=>console.log('ERR',e.message));
 await pg.goto('http://localhost:8080');await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:90000});
 await pg.click('#enter');await W(2500);await pg.evaluate(()=>sit(SEATS.find(s=>s.table!=='BAR')));await W(3000);
 await pg.screenshot({path:'/workspace/errday-7080-night/screenshot_sit_front4.png'});
 await pg.evaluate(()=>stand());await W(2500);console.log(await pg.evaluate(()=>[camYaw,myYaw]));await b.close();process.exit();})();
