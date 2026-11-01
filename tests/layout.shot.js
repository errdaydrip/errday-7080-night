const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const D='/workspace/errday-7080-night/';
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await b.newPage();pg.on('pageerror',e=>console.log('ERR',e.message));await pg.setViewport({width:900,height:600});await pg.goto('http://localhost:8080');await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:90000});
 await pg.evaluate(()=>{document.querySelector('#nick,input[type=text]').value='구경꾼';});await pg.click('#enter');await W(4000);await pg.addStyleTag({content:'#chat{display:none!important}'});
 const set=(a)=>pg.evaluate(a=>{rig.object3D.position.set(a[0],0,a[1]);myYaw=a[2];camGoal=null;camYaw=a[3];camPitch=a[4];camDist=a[5];rig.object3D.traverse(o=>{if(o.isMesh)o.visible=false;});},a);
 await set([0,26.5,0,0.15,.55,3.5]);await W(1500);await pg.screenshot({path:D+'pocha_layout.png'});
 await set([7.2,18.4,Math.PI,-0.5,.3,3]);await W(1500);await pg.screenshot({path:D+'screenshot_imo.png'});
 await set([-3,19.5,Math.PI,0,-0.25,3]);await W(1500);await pg.screenshot({path:D+'tent_letter.png'});await b.close();})();
