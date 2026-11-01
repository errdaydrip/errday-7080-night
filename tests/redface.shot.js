const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const D='/workspace/errday-7080-night/';
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await b.newPage();pg.on('pageerror',e=>console.log('ERR',e.message));await pg.setViewport({width:900,height:600});await pg.goto('http://localhost:8080');await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:90000});
 await pg.evaluate(()=>{document.querySelector('#nick,input[type=text]').value='술꾼';});await pg.click('#enter');await W(4000);await pg.addStyleTag({content:'#chat{display:none!important}'});
 await pg.evaluate(()=>{const h=$('myAvatar')._h;const n=Date.now();for(let i=0;i<10;i++)h.drinks.push(n-i*1000);rig.object3D.position.set(0,0,4);myYaw=0;camGoal=null;camYaw=0;camPitch=.15;camDist=1.6;});await W(3000);
 await pg.screenshot({path:D+'red_face.png'});await b.close();})();
