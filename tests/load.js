// node tests/load.js N [secs]  — server must expose /health; measures received msgs/bytes per client
const {io}=require('socket.io-client');const N=+process.argv[2]||20,T=+(process.argv[3]||15)*1000;
const U='http://localhost:'+(process.env.PORT||8080);let msgs=0,bytes=0;const socks=[];
(async()=>{for(let i=0;i<N;i++){const s=io(U,{forceNew:true,transports:['websocket']});socks.push(s);
 s.on('connect',()=>{s.io.engine.on('packet',p=>{msgs++;bytes+=typeof p.data==='string'?p.data.length:(p.data&&p.data.byteLength)||0;});
  s.emit('join',{nick:'b'+i,clientId:'L'+i});});
 await new Promise(r=>setTimeout(r,20));}
 await new Promise(r=>setTimeout(r,1500));msgs=0;bytes=0;const t0=Date.now();
 const st=socks.map((s,i)=>({x:Math.random()*10-5,z:Math.random()*10-5,a:0,moving:Math.random()<.5}));
 const iv=setInterval(()=>socks.forEach((s,i)=>{const b=st[i];if(Math.random()<.01)b.moving=!b.moving;if(!b.moving)return;b.a+=.05;b.x+=Math.cos(b.a)*.3;b.z+=Math.sin(b.a)*.3;
  s.emit('move',{pos:[b.x,0,b.z],rot:b.a,dance:0});if(Math.random()<.002)s.emit('chat','hello '+i);}),100);
 await new Promise(r=>setTimeout(r,T));clearInterval(iv);const sec=(Date.now()-t0)/1000;
 console.log(JSON.stringify({N,perClientMsgsPerSec:+(msgs/N/sec).toFixed(1),totalOutKBps:+(bytes/sec/1024).toFixed(1)}));socks.forEach(s=>s.close());process.exit(0);})();
