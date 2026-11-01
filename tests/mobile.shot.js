// 모바일(세로/가로) 극장 좌석 화면 + 핀치 줌 + 전체화면 API 미사용 확인
const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const D='/workspace/errday-7080-night/';
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 for(const [n,w,h] of [['portrait',390,844],['landscape',844,390]]){const pg=await b.newPage();await pg.emulate({viewport:{width:w,height:h,isMobile:true,hasTouch:true,deviceScaleFactor:1},userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'});
  pg.on('pageerror',e=>console.log('ERR',e.message));await pg.evaluateOnNewDocument(()=>{window.__fsCalls=0;const o=Element.prototype.requestFullscreen;Element.prototype.requestFullscreen=function(){window.__fsCalls++;return o?o.apply(this,arguments):Promise.resolve();};});
  await pg.goto('http://localhost:'+(process.env.PORT||8080));await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:120000});await pg.tap('#enter');await W(2500);
  await pg.tap('#fsBtn');await W(500);
  console.log(n,'fsCalls',await pg.evaluate(()=>[window.__fsCalls,!document.getElementById('fsHint').classList.contains('hidden'),document.querySelector('#fsHint span').textContent.slice(0,30)]));
  await pg.evaluate(()=>{document.getElementById('fsHint').classList.add('hidden');sit(SEATS.find(s=>s.id===(innerWidth>innerHeight?'TH-04':'TH-13')));});await W(9000);
  console.log(n,'fov',await pg.evaluate(()=>[document.querySelector('a-scene').camera.fov.toFixed(1),window.BASE_FOV&&BASE_FOV.toFixed(1)]));
  await pg.screenshot({path:D+'m_'+n+'.png'});
  // 두 손가락 줌 (포인터 이벤트 2개로 벌리기 = 확대)
  await pg.evaluate((cx,cy)=>{const c=scene.canvas;const ev=(t,id,x)=>c.dispatchEvent(new PointerEvent(t,{pointerId:id,clientX:x,clientY:cy,pointerType:'touch',bubbles:true}));
   ev('pointerdown',1,cx-40);ev('pointerdown',2,cx+40);for(let d=40;d<=120;d+=10){ev('pointermove',2,cx+d);}ev('pointerup',1,cx-120);ev('pointerup',2,cx+120);},w/2,h/2);await W(2500);
  console.log(n,'after pinch zoom-in fov',await pg.evaluate(()=>document.querySelector('a-scene').camera.fov.toFixed(1)));await pg.screenshot({path:D+'m_'+n+'_zoom.png'});
  await pg.close();}
 await b.close();process.exit();})();
