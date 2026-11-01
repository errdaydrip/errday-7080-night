const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await b.newPage();await pg.setViewport({width:700,height:900});pg.on('pageerror',e=>console.log('ERR',e.message));
 for(const [g,col,file] of [['m','#ff2fa6','aerobic_male.png'],['f','#4fc3ff','aerobic_female.png'],['f','#9cf03a','aerobic_picker.png']]){
  await pg.goto('http://localhost:8080');await pg.evaluate((g,col)=>{localStorage.setItem('profile',JSON.stringify({nick:'',gender:g,style:'aerobic',outfit:col,skin:'#f2c29a'}));},g,col);await pg.reload();
  await W(4000);const el=file.includes('picker')?await pg.$('#entry'):await pg.$('#preview');await el.screenshot({path:file});}
 await b.close();process.exit();})();
