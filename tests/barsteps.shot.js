const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const D='/workspace/errday-7080-night/';
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await b.newPage();await pg.setViewport({width:900,height:600});await pg.goto('http://localhost:8080');await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:90000});
 await pg.evaluate(()=>{document.querySelector('#nick,input[type=text]').value='바';});await pg.click('#enter');await W(2500);
 await pg.evaluate(()=>{document.getElementById('hud').style.display='none';rig.object3D.position.set(11,0,7.3);setRoute(11.02,2.3);});await W(8000);
 console.log(await pg.evaluate(()=>{const p=rig.object3D.position;return [p.x,p.y,p.z].map(v=>v.toFixed(2))}));
 await pg.evaluate(()=>{camGoal=null;camYaw=-2.2;camPitch=.35;camDist=6;});await W(1500);await pg.screenshot({path:D+'screenshot_bar_steps.png'});await b.close();process.exit();})();
