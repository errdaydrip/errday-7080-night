const assert=require('assert'),H=require('../public/air-hockey'),{io}=require('socket.io-client'),A=require('../public/arcade');
// The same incoming puck must leave faster when struck by a faster paddle.
function strike(speed){const s=H.create();s.serve=false;s.ball={x:.5,y:.67,vx:0,vy:.3};s.paddles[0].y=.76;for(let i=0;i<12;i++)H.update(s,1/240,[{x:.5,y:s.paddles[0].y-speed/240/1.25},{x:.5,y:.18}]);return s.ball;}
const soft=strike(.15),hard=strike(2);assert(hard.vy<0);assert(Math.hypot(hard.vx,hard.vy)>Math.hypot(soft.vx,soft.vy)*1.5,'fast swipe transfers more energy');
assert(H.K.paddle*480>=34,'larger visible and physical paddle');
const tunnel=H.create();tunnel.serve=false;tunnel.ball={x:.5,y:.6,vx:0,vy:4.2};H.update(tunnel,.1);assert(tunnel.ball.vy<0,'fast puck cannot tunnel through paddle');
const wall=H.create();wall.serve=false;wall.ball={x:.1,y:.4,vx:-4.2,vy:0};H.update(wall,.1);assert(wall.ball.x>=.077&&wall.ball.vx>0,'rail reflection');
const bound=H.create();H.update(bound,.01,[{x:NaN,y:Infinity},{x:-100,y:100}]);for(const p of bound.paddles)assert(Number.isFinite(p.x)&&Number.isFinite(p.y));assert(bound.paddles[1].y<.5);assert(Math.hypot(bound.paddles[1].vx,bound.paddles[1].vy)<=H.K.maxPaddle+.001);
const win=H.create();for(let i=0;i<7;i++){win.serve=false;win.ball={x:.5,y:.04,vx:0,vy:-1};H.update(win,.02);}assert(win.over&&win.won&&win.score===7);assert.strictEqual(win.opponent,0);
const noGoal=H.create();noGoal.serve=false;noGoal.ball={x:.2,y:.1,vx:0,vy:-2};H.update(noGoal,.05);assert.strictEqual(noGoal.score,0);assert(noGoal.ball.vy>0);
const wait=ms=>new Promise(r=>setTimeout(r,ms)),url='http://localhost:'+(process.env.PORT||8080),emit=(s,e,d)=>new Promise((r,j)=>s.timeout(3000).emit(e,d,(err,q)=>err?j(err):r(q)));
(async()=>{const clients=[0,1,2].map(()=>io(url,{forceNew:true,transports:['websocket']})),updates=[[],[],[]];clients.forEach((s,i)=>s.on('hockeyState',q=>updates[i].push(q)));try{
 for(let i=0;i<3;i++){const s=clients[i];await new Promise(r=>s.connected?r():s.once('connect',r));await emit(s,'join',{nick:'하키검증'+i,clientId:'hockey-'+Date.now()+'-'+i});}
 assert(!(await emit(clients[0],'hockeyJoin',{machineId:'AC-HOCKEY'})).ok,'must be at table');
 for(const s of clients){s.emit('move',{pos:[A.ENTRY.x,0,A.ENTRY.z],rot:0});assert((await emit(s,'arcadeTravel','enter')).ok);s.emit('move',{pos:[-5.2,0,48.7],rot:0});}
 const first=await emit(clients[0],'hockeyJoin',{machineId:'AC-HOCKEY'});assert(first.ok&&first.status==='waiting');
 const second=await emit(clients[1],'hockeyJoin',{machineId:'AC-HOCKEY'});assert(second.ok&&second.status==='playing');assert.strictEqual(second.id,first.id);assert.strictEqual(second.side,1);
 assert(!(await emit(clients[2],'hockeyJoin',{machineId:'AC-HOCKEY'})).ok,'third player cannot steal active match');
 clients[2].emit('hockeyInput',{id:first.id,seq:1,x:0,y:0,score:7});
 clients[0].emit('hockeyInput',{id:first.id,seq:1,x:.7,y:.8,serve:true,score:7});await wait(200);
 const x=updates[0].at(-1),y=updates[1].find(q=>q.seq===x.seq);assert(y);assert.deepStrictEqual(x.state,y.state,'both players receive identical authoritative snapshot');assert.strictEqual(x.state.score,0,'client cannot submit scores');assert(!x.state.serve);assert(x.state.paddles[0].x>.5);
 clients[0].emit('hockeyInput',{id:first.id,seq:1,x:.1,y:.9});await wait(80);assert(updates[0].at(-1).state.paddles[0].x>.6,'replayed input rejected');
 clients[0].emit('hockeyLeave',{id:'old-match'});await wait(60);assert.strictEqual(updates[1].at(-1).status,'playing','stale leave ignored');
 clients[0].close();await wait(100);assert.strictEqual(updates[1].at(-1).status,'ended');assert(/연결/.test(updates[1].at(-1).reason));
 assert((await emit(clients[2],'hockeyJoin',{machineId:'AC-HOCKEY'})).ok,'table released after disconnect');
 clients[2].emit('hockeyLeave');await wait(80);const rematch=await emit(clients[1],'hockeyJoin',{machineId:'AC-HOCKEY'});assert(rematch.ok);assert((await emit(clients[2],'hockeyJoin',{machineId:'AC-HOCKEY'})).ok);
 // Play an entire server match through legal controls with both paddles clear of the goals.
 const seq=[0,0];let ranks=null;clients[1].on('arcadeRankings',q=>ranks=q);
 const driver=setInterval(()=>[clients[1],clients[2]].forEach((s,i)=>s.emit('hockeyInput',{id:rematch.id,seq:++seq[i],x:.15,y:i===0?.8:.2,serve:true})),33);
 try{const until=Date.now()+45000;while(Date.now()<until&&updates[1].at(-1)?.status!=='finished')await wait(100);assert.strictEqual(updates[1].at(-1).status,'finished','actual physics reaches seven points');assert(updates[1].at(-1).state.score===7||updates[1].at(-1).state.opponent===7);await wait(60);assert(ranks?.hockey?.some(q=>q.score===7),'completed server match updates shared rank');}finally{clearInterval(driver);}

 console.log('air-hockey physics, impact strength, goals, server pairing, shared state, validation and disconnect OK');
}finally{clients.forEach(s=>s.close());}})().catch(e=>{console.error(e);process.exitCode=1});
