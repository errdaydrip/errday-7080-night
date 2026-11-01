// preload: node -r ./tests/loadmon.js server.js  -> logs cpu%, rss, loop lag every 5s
const {monitorEventLoopDelay}=require('perf_hooks');const h=monitorEventLoopDelay({resolution:10});h.enable();let c=process.cpuUsage(),t=Date.now();
setInterval(()=>{const d=process.cpuUsage(c),dt=Date.now()-t;c=process.cpuUsage();t=Date.now();
 console.error('MON',JSON.stringify({cpu:+((d.user+d.system)/1000/dt*100).toFixed(1),rssMB:+(process.memoryUsage().rss/1048576).toFixed(0),lagP99ms:+(h.percentile(99)/1e6).toFixed(1)}));h.reset();},5000).unref();
