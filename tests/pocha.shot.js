const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const D='/workspace/errday-7080-night/';
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await b.newPage();await pg.setViewport({width:900,height:600});pg.on('pageerror',e=>console.log('ERR',e.message));
 await pg.goto('http://localhost:8080');await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:120000});
 await pg.click('#enter');await W(2500);
 // 문 쪽: 안에서 문 바라보기
 await pg.evaluate(()=>{rig.object3D.position.set(DOOR.x+1.2,0,8.5);myYaw=Math.PI;camYaw=Math.PI;camPitch=.12;});await W(2000);await pg.screenshot({path:D+'screenshot_door.png'});
 // 탭 이동으로 바깥까지 걸어가기
 await pg.evaluate(()=>setRoute(1,18));for(let i=0;i<8;i++){await W(1000);if(0)console.log(await pg.evaluate(()=>[rig.object3D.position.x.toFixed(2),rig.object3D.position.z.toFixed(2),!!goal,route.length,goal&&goal.z]));}console.log('walked to',await pg.evaluate(()=>[rig.object3D.position.x.toFixed(2),rig.object3D.position.z.toFixed(2),$('where').textContent]));
 await pg.evaluate(()=>{rig.object3D.position.set(2,0,23);camYaw=0.6;camPitch=.5;camDist=10;});await W(2500);await pg.screenshot({path:D+'screenshot_pocha.png'});
 await pg.evaluate(()=>sit(SEATS.find(s=>s.id==='Y2-3')));await W(3500);console.log(await pg.evaluate(()=>$('where').textContent));await pg.screenshot({path:D+'screenshot_pocha_sit.png'});
 await pg.evaluate(()=>{stand();setRoute(0,4);});await W(10000);console.log('back',await pg.evaluate(()=>[rig.object3D.position.z.toFixed(2)]));
 await b.close();process.exit();})();
