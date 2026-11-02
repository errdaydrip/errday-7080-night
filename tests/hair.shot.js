// 헤어 6종 앞/옆 스크린샷 (미리보기 렌더러로 정면/측면)
const p=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));const fs=require('fs');const D='/workspace/errday-7080-night/';
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const pg=await b.newPage();await pg.setViewport({width:900,height:900});
 pg.on('pageerror',e=>console.log('ERR',e.message));await pg.goto('http://localhost:'+(process.env.PORT||8080));await pg.waitForFunction(()=>!document.getElementById('enter').disabled,{timeout:120000});
 const url=await pg.evaluate(()=>{const cv=document.createElement('canvas');cv.width=2040;cv.height=300;const r=new THREE.WebGLRenderer({canvas:cv,antialias:true});r.setScissorTest(true);r.setClearColor('#2a0a1e');
  const sc=new THREE.Scene();sc.add(new THREE.AmbientLight('#fff',1.4));const dl=new THREE.DirectionalLight('#fff',1.6);dl.position.set(1,2,3);sc.add(dl);
  const list=[['m','m1','#24306e','none'],['m','m2','#e0262e','sunglasses'],['m','m3','#f5f5f5','glasses'],['f','f1','#ff69b4','glasses'],['f','f2','#ffd400','none'],['f','f3','#2f7bff','none']];
  list.forEach(([g,h,c,acc],i)=>[0,1].forEach(side=>{const ch=makeChibi({gender:g,style:'suit',top:c,bottom:'#1a1a1a',hair:h,acc,skin:'#f2c29a'});ch.root.rotation.y=side?Math.PI/2:0;sc.add(ch.root);
   const cm=new THREE.PerspectiveCamera(26,1,.1,20);cm.position.set(0,1.25,3.4);cm.lookAt(0,1.2,0);const x=(i*2+side)*170;r.setViewport(x,0,170,300);r.setScissor(x,0,170,300);cm.aspect=170/300;cm.updateProjectionMatrix();r.render(sc,cm);sc.remove(ch.root);}));
  return cv.toDataURL();});
 fs.writeFileSync(D+'hair_grid.png',Buffer.from(url.split(',')[1],'base64'));console.log('hair shot done');await b.close();process.exit(0);})();
