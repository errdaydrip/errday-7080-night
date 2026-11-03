(function(){const S=SPORTS,T=S.T,root=E('a-entity',{id:'sportsWorld'}),groups=new Map(),cube=new THREE.BoxGeometry(1,1,1);
 const box=(x,y,z,w,h,d,c,glow=false)=>{const k=c+glow;if(!groups.has(k))groups.set(k,{c,glow,items:[]});groups.get(k).items.push([x,y,z,w,h,d]);};
 const text=(v,x,y,z,w,c='#7fe8f0',ry=0)=>E('a-entity',{position:`${x} ${y} ${z}`,rotation:`0 ${ry} 0`,ktext:`value:${v};color:#fff;glow:${c};size:64;width:${w}`},root);
 const cx=(T.x0+T.x1)/2,cz=(T.z0+T.z1)/2,depth=T.z1-T.z0;
 box(cx,-.08,cz,18,.16,depth,'#1b2935');box(T.x0,3.5,cz,.2,7,depth,'#293f4c');box(cx,3.5,T.z0,18,7,.2,'#293f4c');box(cx,3.5,T.z1,18,7,.2,'#293f4c');box(cx,7,cz,18,.15,depth,'#122333');
 for(const [a,b] of [[T.z0,S.DOOR.z-S.DOOR.half],[S.DOOR.z+S.DOOR.half,T.z1]])box(T.x1,3.5,(a+b)/2,.2,7,b-a,'#243a49');box(T.x1,5.1,S.DOOR.z,.2,3.8,4,'#243a49');
 box(T.x1+.14,4.6,S.DOOR.z,.04,1.9,12,'#102b38');text('ERRDAY SPORTS',T.x1+.2,4.9,S.DOOR.z,10,'#66efbf',90);text('볼링 · 당구 · 미니풋살 · 테니스',T.x1+.21,3.8,S.DOOR.z,8,'#82bfff',90);
 for(const side of [-1,1]){box(T.x1,1.5,S.DOOR.z+side*2,.07,3,.06,'#70efdb',true);E('a-box',{position:`${T.x1-.9} 1.5 ${S.DOOR.z+side*2}`,rotation:`0 ${side*5} 0`,width:1.9,height:2.9,depth:.035,material:'color:#b7f6ff;opacity:.18;transparent:true;roughness:.1;depthWrite:false'},root);}
 // Paved approach from the old fish-shop frontage.
 box(-15.4,.01,S.DOOR.z,5.2,.02,4.1,'#43515c');for(let z=T.z0+2;z<T.z1;z+=4){box(cx,6.85,z,16,.035,.1,'#daeff5',true);box(-25.7,.02,z,.06,.02,3,'#78edc9',true);}
 text('SPORTS CLUB / PLAY FLOOR',cx,5.5,T.z0+.25,15,'#7beed2');
 for(const f of S.facilities){const g=S.GAMES[f.game],b=f.box;box(f.x,.012,f.z,b.x1-b.x0,.025,b.z1-b.z0,f.game==='bowling'?'#ad8a5a':f.game==='billiards'?'#192d3c':f.game==='tennis'?'#244f75':'#2c6d50');
  text(g.name+' / '+f.id.replace('SP-',''),f.x,3.2,f.z,Math.min(5,b.x1-b.x0+1),g.colour,90);
  if(f.game==='bowling'){
   box(f.x,.05,f.z,2.3,.08,15,'#cead74');for(const dx of [-1.3,1.3])box(f.x+dx,.08,f.z,.2,.16,15,'#344152');for(let i=0;i<7;i++)box(f.x-1+i*.33,.097,f.z,.012,.015,14.5,'#a38459');
   for(let r=0;r<4;r++)for(let i=0;i<=r;i++){const x=f.x+(i-r/2)*.38,z=-10.3-r*.43;box(x,.24,z,.15,.4,.15,'#eff6fb');box(x,.47,z,.1,.15,.1,'#eff6fb');box(x,.43,z,.11,.045,.11,'#ff729a');}
   box(f.x,2.2,-13,2.5,1.3,.15,'#101e34');text('10 PIN',f.x,2.3,-12.89,2,'#78dfff');box(f.x,1.05,3.15,1,.25,.45,'#15263c');
  }else if(f.game==='billiards'){
   box(f.x,.85,f.z,4.8,.3,3,'#514334');box(f.x,1.02,f.z,4.35,.04,2.55,'#248d73');for(const dx of [-2.2,2.2])for(const dz of [-1.3,1.3])box(f.x+dx,.4,f.z+dz,.18,.8,.18,'#24323b');for(let i=0;i<7;i++)E('a-sphere',{position:`${f.x+(i%3-1)*.16} 1.1 ${f.z+Math.floor(i/3)*.15}`,radius:.07,'segments-width':8,'segments-height':6,color:['#fff','#f8d76a','#f6a6a8','#739fef'][i%4]},root);
  }else{
   const c='#d7f0e8',w=b.x1-b.x0,d=b.z1-b.z0;for(const dx of [-w/2+.12,w/2-.12])box(f.x+dx,.035,f.z,.04,.02,d-.24,c);for(const dz of [-d/2+.12,d/2-.12,0])box(f.x,.035,f.z+dz,w-.24,.02,.04,c);
   if(f.game==='tennis'){box(f.x,.65,f.z,w,.03,.04,'#d8ecf5');for(let i=0;i<16;i++)box(b.x0+.1+i*w/16,.35,f.z,.018,.6,.025,'#aecbd2');for(const dz of [-2,2])box(f.x,.04,f.z+dz,w,.02,.03,c);}
   else{for(const side of [-1,1]){const x=f.x+side*(w/2-.2);for(let i=0;i<12;i++)box(x,.7,f.z-1.2+i*.22,.025,1.35,.018,'#9bbeb8');for(let y=.2;y<1.4;y+=.22)box(x,y,f.z,.025,.018,2.4,'#9bbeb8');box(x,.7,f.z-1.25,.07,1.4,.07,'#d6eff4');box(x,.7,f.z+1.25,.07,1.4,.07,'#d6eff4');box(x,1.4,f.z,.07,.07,2.5,'#d6eff4');}E('a-sphere',{position:`${f.x} .14 ${f.z}`,radius:.13,'segments-width':12,'segments-height':8,color:'#edf5e9'},root);}
  }
 }
 for(const v of S.vacancies){box(v.x,1.6,v.z,6,3.2,3.8,'#263746');box(-24.04,1.45,v.z,.03,2.5,2.3,'#3c5561');text('COMING SOON',-24.08,2.4,v.z,3.2,'#b4c9d1',-90);text(v.name,-24.09,1.55,v.z,3.3,'#78decb',-90);}
 const dummy=new THREE.Object3D();for(const {c,glow,items} of groups.values()){const material=glow?new THREE.MeshBasicMaterial({color:c}):new THREE.MeshStandardMaterial({color:c,roughness:.8,emissive:c,emissiveIntensity:.55}),mesh=new THREE.InstancedMesh(cube,material,items.length);items.forEach(([x,y,z,w,h,d],i)=>{dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});root.object3D.add(mesh);}
 OBSTACLES.push(...S.obstacles);
})();
