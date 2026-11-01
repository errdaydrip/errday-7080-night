const p=require('puppeteer-core');const {io}=require('socket.io-client');const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await p.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const pg=await b.newPage();await pg.goto('http://localhost:8080');await W(4000);
const bot=io('http://localhost:8080',{transports:['websocket']});await new Promise(r=>bot.on('connect',r));await new Promise(r=>bot.emit('join',{nick:'mover',clientId:'MV'},r));
let a=0;const iv=setInterval(()=>{a+=.05;bot.emit('move',{pos:[Math.cos(a)*3,0,Math.sin(a)*3],rot:a});},100);await W(1500);
const xs=await pg.evaluate(async id=>{const out=[];for(let i=0;i<60;i++){const o=others[id];out.push(o?+o.el.object3D.position.x.toFixed(3):null);await new Promise(r=>requestAnimationFrame(r));}return out;},bot.id);
clearInterval(iv);console.log(JSON.stringify(xs));const d=xs.slice(1).map((x,i)=>Math.abs(x-xs[i]));console.log('maxStep',Math.max(...d).toFixed(3),'zeroSteps',d.filter(v=>v<1e-4).length,'/',d.length);
await pg.screenshot({path:'smooth.png'});await b.close();process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
