// 나이트 → 극장 문: 걸어서 들어가면 극장 입구 안쪽으로 이동
const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const a=require('assert');const D='/workspace/errday-7080-night/';
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const pg=await b.newPage();await pg.setViewport({width:900,height:600});
 pg.on('pageerror',e=>console.log('ERR',e.message));await pg.goto('http://localhost:'+(process.env.PORT||8080));await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:120000});await pg.click('#enter');await W(2500);
 console.log('blocked near door?',await pg.evaluate(()=>{const C=THEATER.CLUB_DOOR;const r=[];for(let z=9;z<=11.55;z+=.25)r.push(blocked(C.x,z)?1:0);return r.join('');}));
 await pg.evaluate(()=>{rig.object3D.position.set(THEATER.CLUB_DOOR.x,0,9.9);camYaw=Math.PI;camPitch=.25;camDist=4;});await W(2500);await pg.screenshot({path:D+'clubdoor.png'});
 await pg.evaluate(()=>{keys.KeyW=true;camYaw=Math.PI;});for(let i=0;i<30;i++){await W(500);if(await pg.evaluate(()=>window.OUTSIDE))break;}await pg.evaluate(()=>{keys.KeyW=false;});
 const r=await pg.evaluate(()=>[rig.object3D.position.x.toFixed(2),rig.object3D.position.z.toFixed(2),!!window.OUTSIDE,$('where').textContent]);console.log('after',r);a(r[2]&&Math.abs(+r[0]-9.6)<1,'walked out through the theater-side door');
 await pg.evaluate(()=>{camYaw=Math.PI*1.2;camPitch=.3;camDist=5;});await W(2000);await pg.screenshot({path:D+'clubdoor_after.png'});console.log('clubdoor OK');await b.close();process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
