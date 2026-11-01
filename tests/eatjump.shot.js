const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const D='/workspace/errday-7080-night/';
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const open=async(nick,mob)=>{const ctx=await b.createBrowserContext();const pg=await ctx.newPage();await pg.setViewport(mob?{width:390,height:780,isMobile:true,hasTouch:true}:{width:900,height:600});pg.on('pageerror',e=>console.log('ERR',nick,e.message));
  await pg.goto('http://localhost:8080');await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:90000});
  await pg.evaluate(n=>{document.querySelector('#nick,input[type=text]').value=n;},nick);await pg.click('#enter');await W(2500);return pg;};
 const acts=pg=>pg.evaluate(()=>[...document.querySelectorAll('#actBar [data-act]')].map(e=>e.dataset.act+':'+e.textContent));
 const t=await open('서버');const g=await open('손님');
 for(const k of ['soju','dakbal']){await t.evaluate(k=>{const P=k==='soju'?[-.7,20.9]:[5.5,15.4];rig.object3D.position.set(P[0],0,P[1]);},k);await W(800);await t.evaluate(k=>document.querySelector('[data-act=p-'+k+']').click(),k);await W(700);await t.evaluate(()=>rig.object3D.position.set(-4.2,0,15.3));await W(800);await t.evaluate(()=>document.querySelector('[data-act=place]').click());await W(700);}
 await g.bringToFront();await g.evaluate(()=>sit(SEATS.find(s=>s.id==='Y2-1')));await W(1500);console.log('acts',await acts(g));
 await g.evaluate(()=>document.querySelector('[data-act=e-dakbal]').click());await W(900);await g.evaluate(()=>{camGoal=null;camPitch=.35;camDist=2.6;});await W(500);await g.screenshot({path:D+'screenshot_pocha_eat.png'});
 await W(2000);console.log('tbl',await g.evaluate(()=>JSON.stringify(TABLE_ITEMS.Y2)));
 await t.bringToFront();await t.evaluate(()=>{rig.object3D.position.set(8.8,0,7.6);setRoute(11.02,2.3);});await W(10000);console.log('bt pos',await t.evaluate(()=>{const p=rig.object3D.position;return [p.x,p.y,p.z].map(v=>v.toFixed(2))}),await acts(t));
 await t.evaluate(()=>{rig.object3D.position.set(8.3,0,8.6);camGoal=null;myYaw=0;camYaw=-2.6;camPitch=.35;camDist=4.5;});await W(1500);await t.screenshot({path:D+'screenshot_bar_steps.png'});
 const m=await open('점프',true);await m.evaluate(()=>{rig.object3D.position.set(0,0,3);});await W(800);await m.evaluate(()=>document.getElementById('jumpBtn').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})));await W(280);
 console.log('y mid',await m.evaluate(()=>rig.object3D.position.y.toFixed(2)));await m.screenshot({path:D+'screenshot_jump.png'});await W(1500);console.log('y end',await m.evaluate(()=>rig.object3D.position.y.toFixed(2)));
 await b.close();process.exit();})();
