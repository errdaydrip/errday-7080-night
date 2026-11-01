const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const tag=process.env.TAG||'after';
 for(const [w,h,n] of [[390,844,'portrait'],[844,390,'landscape']]){
 const pg=await b.newPage();await pg.setViewport({width:w,height:h,isMobile:true,hasTouch:true,deviceScaleFactor:1});pg.on('pageerror',e=>console.log('ERR',e.message));
 await pg.goto(process.env.URL||'http://localhost:8080');await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:90000});
 await pg.tap('#enter');await W(3000);
 console.log(n,await pg.evaluate(()=>{const c=document.querySelector('a-scene').camera;const r=id=>{const e=document.getElementById(id);if(!e)return null;const b=e.getBoundingClientRect();return [Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)]};return {fov:c.fov,aspect:c.aspect.toFixed(2),mob:r('mob'),jump:r('jumpBtn'),chatT:r('chatToggle'),fs:r('fsBtn')}}));
 await pg.screenshot({path:`/workspace/errday-7080-night/${n}_${tag}.png`});await pg.close();}
 await b.close();process.exit();})();
