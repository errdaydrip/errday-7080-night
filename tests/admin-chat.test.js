const p=require('puppeteer-core') /* npm i -D puppeteer-core socket.io-client */;const {io}=require('socket.io-client');const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const other=io('http://localhost:8080');const got=[];other.on('chat',m=>{if(!m.sys)got.push(m.nick+':'+m.text)});
const b=await p.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for(const [name,vp] of [['PC',{width:1280,height:720}],['MOB',{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}]]){
 const pg=await b.newPage();await pg.emulate({viewport:vp,userAgent:name==='MOB'?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 Safari/604.1':'Mozilla/5.0 Chrome'});
 pg.on('dialog',d=>d.accept(d.type()==='prompt'?'6651':undefined));pg.on('pageerror',e=>console.log(name,'ERR',e.message));
 await pg.goto('http://localhost:8080',{waitUntil:'load'});await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:90000});
 await pg.evaluate(n=>document.getElementById('nick').value=n,'관리자'+name);await pg.click('#enter');await W(800);
 await pg.click('#adminBtn');await W(800);
 if(name==='MOB'){await pg.click('#musicToggle');await W(300);await pg.click('#chatToggle');await W(300);}
 console.log(name,'admin?',await pg.evaluate(()=>!!adminToken&&!document.getElementById('adminCtl').classList.contains('hidden')));
 const vis=await pg.evaluate(()=>{const r=document.getElementById('chatIn').getBoundingClientRect();const el=document.elementFromPoint(r.x+10,r.y+r.height/2);return el&&el.id;});console.log(name,'top element at chat input:',vis);
 await pg.tap?0:0;await pg.click('#chatIn');await pg.keyboard.type('관리자 채팅 테스트 '+name);await pg.keyboard.press('Enter');await W(1500);
 // 음악 패널 열린 상태 (PC는 항상 열림)
}
console.log('other client got:',got);await b.close();process.exit();})();
