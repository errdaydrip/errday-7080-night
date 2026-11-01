const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const D='/workspace/errday-7080-night/';
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await b.newPage();await pg.setViewport({width:900,height:600});await pg.goto('http://localhost:8080');await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:90000});
 await pg.evaluate(()=>{document.querySelector('#nick,input[type=text]').value='구경꾼';});await pg.click('#enter');await W(3000);
 console.log(await pg.evaluate(()=>JSON.stringify(TABLE_ITEMS)));
 await pg.evaluate(()=>{rig.object3D.position.set(-4.4,0,14.9);myYaw=0;camGoal=null;camYaw=Math.PI*0.8;camPitch=.75;camDist=2.2;});await W(1500);await pg.screenshot({path:D+'screenshot_pocha_table.png'});
 await pg.evaluate(()=>{rig.object3D.position.set(-5,0,18.3);myYaw=Math.PI;camGoal=null;camYaw=.0;camPitch=.1;camDist=6;});await W(1500);await pg.screenshot({path:D+'screenshot_pocha_tent.png'});
 await b.close();})();
