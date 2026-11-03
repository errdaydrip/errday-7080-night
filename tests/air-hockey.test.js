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

for(const x of [.078,.922])for(const y of [.098,.902]){
 const s=H.create();s.serve=false;s.ball={x,y,vx:0,vy:0};
 for(let i=0;i<120;i++)H.update(s,1/60);
 assert(Math.hypot(s.ball.vx,s.ball.vy)>.1,'stationary corner puck escapes');
}
console.log('impact, goals, rail and rounded-corner physics OK');
// The old rounded cushion still pinned the puck against a stationary corner paddle.
for (const x of [.077, .923]) for (const y of [.097, .903]) {
 for (const speed of [0, .05, 1]) {
  const state = H.create();
  state.serve = false;
  state.ball = {x, y, vx:(x < .5 ? -1 : 1)*speed, vy:(y < .5 ? -1 : 1)*speed};
  const paddle = state.paddles[y < .5 ? 1 : 0];
  paddle.x = x < .5 ? .125 : .875;
  paddle.y = y < .5 ? .135 : .865;
  for (let frame = 0; frame < 180; frame++) H.update(state, 1/60);
  assert(Math.hypot(state.ball.x-x, (state.ball.y-y)*1.25) > .08, 'paddle-pinned corner puck escapes');
  assert.strictEqual(state.score + state.opponent, 0, 'release does not award a point');
 }
}
