const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await b.newPage();await pg.setViewport({width:900,height:600});pg.on('pageerror',e=>console.log('ERR',e.message));
 await pg.goto('http://localhost:8080');await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:90000});
 await pg.click('#enter');await W(2500);await pg.evaluate(()=>sit(SEATS.find(s=>s.table!=='BAR')));await W(2500);
 console.log('bar visible',await pg.evaluate(()=>!document.getElementById('drinkBar').classList.contains('hidden')));
 for(let i=0;i<4;i++){await pg.evaluate(()=>{window._lastDrink=0;$('myAvatar')._h.drinks.push(Date.now());});}
 await pg.click('#drinkBar button[data-drink="beer"]');await W(800);
 await pg.screenshot({path:'/workspace/errday-7080-night/screenshot_drink.png'});
 console.log('rosy',await pg.evaluate(()=>$('myAvatar')._h.rosy));await W(1800);console.log('cup gone',await pg.evaluate(()=>!$('myAvatar')._h.cup));
 await pg.evaluate(()=>stand());await W(500);console.log('bar hidden',await pg.evaluate(()=>document.getElementById('drinkBar').classList.contains('hidden')));await b.close();process.exit();})();
