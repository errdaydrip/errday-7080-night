// 웨이터는 손님 옆에 있어도 멈추거나 따라오지 않고 순찰을 계속함
const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const a=require('assert');
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const pg=await b.newPage();await pg.setViewport({width:800,height:500});
 pg.on('pageerror',e=>console.log('ERR',e.message));await pg.goto('http://localhost:'+(process.env.PORT||8080));await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:120000});await pg.click('#enter');await W(3000);
 const res=[];for(let i=0;i<6;i++){const r=await pg.evaluate(()=>{const w=WAITERS[0];rig.object3D.position.set(w.x+.6,0,w.z+.3);return [w.x,w.z,!!w.job];});await W(700);
  const r2=await pg.evaluate(()=>{const w=WAITERS[0];return [w.x,w.z,w.near,w.h.current||''];});res.push(Math.hypot(r2[0]-r[0],r2[1]-r[1]));}
 console.log('moved per step',res.map(v=>v.toFixed(2)).join(' '));a(res.every(v=>v>.05),'waiter keeps walking next to player');
 const src=await pg.evaluate(()=>[...document.scripts].map(s=>s.src).join());a(src);
 console.log('waiter-ignore OK');await b.close();process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
