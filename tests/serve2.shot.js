const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const D='/workspace/errday-7080-night/';
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 const open=async(nick)=>{const ctx=await b.createBrowserContext();const pg=await ctx.newPage();await pg.setViewport({width:900,height:600});pg.on('pageerror',e=>console.log('ERR',nick,e.message));
  await pg.goto('http://localhost:8080');await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:90000});
  await pg.evaluate(n=>{document.querySelector('#nick,input[type=text]').value=n;},nick);await pg.click('#enter');await W(2500);return pg;};
 const acts=pg=>pg.evaluate(()=>[...document.querySelectorAll('#actBar [data-act]')].map(e=>e.dataset.act+':'+e.textContent));
 const g=await open('손님A');await g.evaluate(()=>sit(SEATS.find(s=>s.id==='BAR-2')));
 const t=await open('바텐더');await t.evaluate(()=>{rig.object3D.position.set(8.5,0,6.8);setRoute(11.02,2.3);});await W(12000);
 console.log('bt',await t.evaluate(()=>{const p=rig.object3D.position;return [p.x.toFixed(2),p.y.toFixed(2),p.z.toFixed(2)];}),await acts(t));
 await t.evaluate(()=>{camGoal=null;myYaw=-Math.PI/2;camYaw=Math.PI/2;camPitch=.3;});await W(1200);await t.screenshot({path:D+'screenshot_bar_serve.png'});
 console.log('shelfHidden',await t.evaluate(()=>window._shelfHid));
 await t.evaluate(()=>document.querySelector('[data-act=s-cocktail]').click());await W(2500);console.log('guest acts',await acts(g));
 await g.bringToFront();await g.evaluate(()=>{camGoal=null;camYaw=-Math.PI/2+1.1;camPitch=.3;});await W(800);await g.screenshot({path:D+'screenshot_bar_glass.png'});
 await g.click('[data-act=d-cocktail]');await W(2600);console.log('after drink',await g.evaluate(()=>JSON.stringify(GLASSES)));
 // pocha
 await t.bringToFront();await t.evaluate(()=>{rig.object3D.position.set(-.7,0,20.9);myYaw=Math.PI;camGoal=null;camYaw=0;camPitch=.25;});await W(1500);console.log('fridge',await acts(t));
 await t.evaluate(()=>document.querySelector('[data-act=p-soju]').click());await W(1000);await t.screenshot({path:D+'screenshot_pocha_fridge.png'});
 await t.evaluate(()=>rig.object3D.position.set(-4.2,0,15.3));await W(800);await t.evaluate(()=>document.querySelector('[data-act=place]').click());await W(700);
 console.log('st',await t.evaluate(()=>JSON.stringify([TABLE_ITEMS.Y2,myCarry,mySeat])));
 await t.evaluate(()=>rig.object3D.position.set(-.7,0,20.9));await W(800);console.log('st2',await t.evaluate(()=>JSON.stringify([TABLE_ITEMS.Y2,myCarry,mySeat,actKey])));await t.evaluate(()=>document.querySelector('[data-act=p-beer]').click());await W(700);await t.evaluate(()=>rig.object3D.position.set(-4.2,0,15.3));await W(800);await t.evaluate(()=>document.querySelector('[data-act=place]').click());await W(700);
 for(const k of ['dakbal','squid']){await t.evaluate(()=>rig.object3D.position.set(5.5,0,15.4));await W(800);await t.evaluate(k=>document.querySelector('[data-act=p-'+k+']').click(),k);await W(700);await t.evaluate(()=>rig.object3D.position.set(-4.2,0,15.3));await W(800);await t.evaluate(()=>document.querySelector('[data-act=place]').click());await W(700);}
 await g.bringToFront();await g.evaluate(()=>{stand();sit(SEATS.find(s=>s.id==='Y2-1'));});await W(1500);console.log('pocha seat acts',await acts(g));
 await g.evaluate(()=>{camGoal=null;camYaw=.3;camPitch=.6;camDist=3;});await W(1000);await g.screenshot({path:D+'screenshot_pocha_table.png'});
 await g.evaluate(()=>{stand();rig.object3D.position.set(-5,0,13);camGoal=null;camYaw=Math.PI;camPitch=.15;});await W(1200);await g.screenshot({path:D+'screenshot_pocha_tent.png'});
 await g.evaluate(()=>{const w=WAITERS[0];rig.object3D.position.set(w.x+1.2,0,w.z+.8);camGoal=null;camYaw=Math.atan2(1.2,.8)+.3;camPitch=.2;});await W(1500);console.log('waiter acts',await acts(g));await g.screenshot({path:D+'screenshot_waiter.png'});
 await b.close();process.exit();})();
