// 왼쪽 벽 후원 랭킹판 스크린샷
const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const D='/workspace/errday-7080-night/';
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const pg=await b.newPage();await pg.setViewport({width:1000,height:620});
 await pg.goto('http://localhost:'+(process.env.PORT||8080));await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:120000});await pg.click('#enter');await W(3000);
 await pg.evaluate(()=>{if(!window.__live)setRanking({title:'후원랭킹',list:[{rank:1,name:'mu*****l@gmail.com',cash:1000},{rank:2,name:'er*******p@gmail.com',cash:1000},{rank:3,name:'ap*****h@naver.com',cash:1000}]});rig.object3D.position.set(0,0,5);camYaw=Math.PI;camPitch=-.2;camDist=4;});await W(2500);
 await pg.screenshot({path:D+'ranking.png'});console.log('rank shot');await b.close();process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
