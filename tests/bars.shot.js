const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const D='/workspace/errday-7080-night/';
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await b.newPage();pg.on('pageerror',e=>console.log('ERR',e.message));await pg.setViewport({width:900,height:600});await pg.goto('http://localhost:8080');await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:90000});
 await pg.evaluate(()=>{document.querySelector('#nick,input[type=text]').value='바구경';});await pg.click('#enter');await W(4000);await pg.addStyleTag({content:'#chat{display:none!important}'});
 await pg.evaluate(()=>{socket.listeners('tableUses')[0]({Y4:[4,3,2,1]});socket.listeners('table')[0]({Y4:['soju','beer','dakbal','squid']});
  sit(SEATS.find(q=>q.id==='Y4-0'));socket.listeners('tableUses')[0]({Y4:[4,3,2,1]});socket.listeners('table')[0]({Y4:['soju','beer','dakbal','squid']});});await W(1500);
 await pg.screenshot({path:D+'item_bars.png'});await b.close();})();
