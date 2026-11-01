const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const D='/workspace/errday-7080-night/';
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await b.newPage();await pg.setViewport({width:900,height:600});await pg.goto('http://localhost:8080');await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:90000});
 await pg.evaluate(()=>{document.querySelector('#nick,input[type=text]').value='바손님';});await pg.click('#enter');await W(4000);await pg.addStyleTag({content:'#chat{display:none!important}'});
 await pg.evaluate(()=>{socket.emit('serve',{type:'whiskey'});});
 await pg.evaluate(()=>{rig.object3D.position.set(8.2,0,3);myYaw=0;camGoal=null;camYaw=-Math.PI/2;camPitch=.6;camDist=3.5;rig.object3D.traverse(o=>{if(o.isMesh)o.visible=false;});});await W(1500);
 await pg.screenshot({path:D+'bar_coasters.png'});await b.close();})();
