const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await b.newPage();await pg.setViewport({width:900,height:600});pg.on('pageerror',e=>console.log('ERR',e.message));
 await pg.goto('http://localhost:8080');await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:90000});
 await pg.evaluate(()=>{document.querySelector('#nick,input[type=text]').value='dbg';});await pg.click('#enter');await W(2500);
 console.log(await pg.evaluate(()=>JSON.stringify(OBSTACLES.filter(o=>o.x0!==undefined?(11>=o.x0&&11<=o.x1&&5.8>=o.z0&&5.8<=o.z1):Math.hypot(11-o.x,5.8-o.z)<(o.r||0)+.4))));console.log(await pg.evaluate(()=>[heightAt(0,3),heightAt(11,2),heightAt(11,5.9),heightAt(11,-1.3),blocked(11,6.5),blocked(11,5.8)]));
 await pg.evaluate(()=>{rig.object3D.position.set(0,0,3);jump();});const ys=[];for(let i=0;i<12;i++){await W(150);ys.push(await pg.evaluate(()=>rig.object3D.position.y.toFixed(2)));}console.log(ys.join(' '));
 await pg.evaluate(()=>{rig.object3D.position.set(11,0,7.2);setRoute(11.02,2.3);});await W(6000);console.log(await pg.evaluate(()=>{const p=rig.object3D.position;return [p.x,p.y,p.z].map(v=>v.toFixed(2))}));
 await b.close();})();
