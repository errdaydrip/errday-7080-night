// 헤어 6종 정면/옆/뒤 + 알바(흰티·청바지) 정면 스크린샷
const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const fs=require('fs');const D='/workspace/errday-7080-night/';
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const pg=await b.newPage();await pg.setViewport({width:900,height:900});
 pg.on('pageerror',e=>console.log('ERR',e.message));await pg.goto('http://localhost:'+(process.env.PORT||8080));await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:120000});
 const shot=async(fn,arg)=>{const url=await pg.evaluate(fn,arg);return Buffer.from(url.split(',')[1],'base64');};
 const R=()=>{window._R=window._R||(()=>{const cv=document.createElement('canvas');const r=new THREE.WebGLRenderer({canvas:cv,antialias:true,preserveDrawingBuffer:true});r.setScissorTest(true);r.setClearColor('#f4f0ee');return r;})();};
 fs.writeFileSync(D+'hair_grid.png',await shot(()=>{const cv=document.createElement('canvas');cv.width=3*260;cv.height=6*260;const r=new THREE.WebGLRenderer({canvas:cv,antialias:true});r.setScissorTest(true);r.setClearColor('#f4f0ee');
  const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight('#fff','#887',1.3));const dl=new THREE.DirectionalLight('#fff',1.5);dl.position.set(1,2,3);sc.add(dl);const d2=new THREE.DirectionalLight('#fff',.7);d2.position.set(-2,1,-3);sc.add(d2);
  const list=[['m','m1'],['m','m2'],['m','m3'],['f','f1'],['f','f2'],['f','f3']];
  list.forEach(([g,h],row)=>[0,Math.PI/2,Math.PI].forEach((ry,col)=>{const ch=makeChibi({gender:g,style:'suit',top:'#f5f5f5',bottom:'#1a1a1a',hair:h,acc:'none',skin:'#e8b48c'});ch.root.rotation.y=ry;sc.add(ch.root);
   const cm=new THREE.PerspectiveCamera(30,1,.1,20);cm.position.set(0,1.36,1.95);cm.lookAt(0,1.22,0);const x=col*260,y=(5-row)*260;r.setViewport(x,y,260,260);r.setScissor(x,y,260,260);r.render(sc,cm);sc.remove(ch.root);}));
  return cv.toDataURL();}));
 fs.writeFileSync(D+'alba_front.png',await shot(()=>{const cv=document.createElement('canvas');cv.width=400;cv.height=500;const r=new THREE.WebGLRenderer({canvas:cv,antialias:true});r.setClearColor('#f4f0ee');
  const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight('#fff','#887',1.3));const dl=new THREE.DirectionalLight('#fff',1.5);dl.position.set(1,2,3);sc.add(dl);
  const ch=makeChibi({...LOOKS.resolve({gender:'f',style:'aerobic',top:'#f5f5f5',bottom:'#2f5fa8',hair:'f2'}),gender:'f',style:'aerobic',tee:true,skin:'#f6d2b0'});sc.add(ch.root);
  const cm=new THREE.PerspectiveCamera(30,.8,.1,20);cm.position.set(0,.8,3.6);cm.lookAt(0,.7,0);r.render(sc,cm);return cv.toDataURL();}));
 console.log('hair shot done');await b.close();process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
