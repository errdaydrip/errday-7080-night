const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const D='/workspace/errday-7080-night/';
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 const pg=await b.newPage();await pg.setViewport({width:900,height:600});pg.on('pageerror',e=>console.log('ERR',e.message));
 const U='http://localhost:'+(process.env.PORT||8080);await pg.goto(U);await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:120000});await pg.click('#enter');await W(3000);
 // 다른 손님 하나 (이름표 확인용)
 const pg2=await b.newPage();await pg2.goto(U);await pg2.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:120000});await pg2.click('#enter');await W(2500);await pg2.evaluate(()=>{rig.object3D.position.set(23,0,15);});
 await pg.bringToFront();
 await pg.evaluate(()=>sit(SEATS.find(s=>s.id==='TH-13')));await W(9000);
 console.log('theater',await pg.evaluate(()=>[camYaw.toFixed(3),camPitch.toFixed(3),JSON.stringify(THEATER.aim(SEATS.find(s=>s.id==='TH-13'))),[...document.querySelectorAll('.nameLabel')].map(d=>d.style.display).join(',')]));
 await pg.screenshot({path:D+'b3_theater.png'});
 await pg.evaluate(()=>stand());await W(1500);console.log('labels after stand',await pg.evaluate(()=>[...document.querySelectorAll('.nameLabel')].map(d=>d.style.display).join(',')));
 await pg.evaluate(()=>{rig.object3D.position.set(0,0,18.5);camYaw=-0.4;camPitch=1.0;camDist=8;});await W(3000);await pg.screenshot({path:D+'b3_pocha.png'});
 await pg.evaluate(()=>{rig.object3D.position.set(-11,0,0);camYaw=-Math.PI/2;camPitch=.3;camDist=4.5;});await W(3000);await pg.screenshot({path:D+'b3_wall.png'});
 console.log('hidden walls',await pg.evaluate(()=>WALLS?[WALLS.length,WALLS.filter(w=>w.h).length]:null));
 await pg.evaluate(()=>{rig.object3D.position.set(-3,0,0);camYaw=0.3;camPitch=.7;camDist=8;});await W(7000);
 console.log('waiters',await pg.evaluate(()=>[JSON.stringify(TABLE_ITEMS.T1),WAITERS.map(w=>!!w.job+':'+w.x.toFixed(1)+','+w.z.toFixed(1)).join(' ')]));await pg.screenshot({path:D+'b3_club.png'});
 await b.close();process.exit();})();
