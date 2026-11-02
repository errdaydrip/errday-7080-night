// 캐릭터 만들기 화면: 상의/하의/헤어/액세서리 미리보기
const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const D='/workspace/errday-7080-night/';
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const pg=await b.newPage();await pg.setViewport({width:900,height:1100});
 pg.on('pageerror',e=>console.log('ERR',e.message));await pg.goto('http://localhost:'+(process.env.PORT||8080));await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:120000});
 const combos=[['m','disco','m2','sunglasses',2,7],['m','suit','m3','glasses',1,0],['m','hanbok','m1','none',6,0],['f','suit','f1','glasses',9,0],['f','disco','f2','sunglasses',4,7],['f','hanbok','f3','none',1,9]];
 for(const [g,st,h,ac,t,bt] of combos){await pg.click(`.opt.g[data-v="${g}"]`);await pg.click(`.opt.s[data-v="${st}"]`);await pg.click(`.opt.h[data-v="${h}"]`);await pg.click(`.opt.a[data-v="${ac}"]`);
  await pg.click(`#swTop .swatch:nth-child(${t+1})`);await pg.click(`#swBot .swatch:nth-child(${bt+1})`);await W(800);
  const el=await pg.$('#preview');await el.screenshot({path:D+`look_${g}_${st}_${h}.png`});console.log(g,st,h,ac,await pg.evaluate(()=>JSON.stringify([me.top,me.bottom,me.hair,me.acc])));}
 await pg.screenshot({path:D+'look_entry.png'});await b.close();process.exit(0);})();
