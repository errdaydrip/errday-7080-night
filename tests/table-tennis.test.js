const assert = require('assert');
const tennis = require('../public/table-tennis');

function returnShot(x, y) {
  const state = tennis.create();
  Object.assign(state, {serve:false, y:.9, last:1, bounces:1});
  state.ball = {x:.5, y:.859, z:.3, vx:0, vy:.8, vz:0};
  tennis.update(state, 1/60, {pointerX:x, pointerY:y});
  return state.ball;
}

const gentle = returnShot(.5, .89);
const right = returnShot(.55, .85);
const left = returnShot(.45, .85);
assert(Math.abs(right.vy) > Math.abs(gentle.vy), 'a faster swipe produces a faster return');
assert(right.vx > .25 && left.vx < -.25, 'opposite swipes steer returns in opposite directions');
assert(right.vz > 0 && gentle.vz > 0, 'both strokes lift the ball over the net');
const state = tennis.create();
for (let frame = 0; frame < 1800; frame++) {
  tennis.update(state, 1/60, {pointerX:state.ball.x});
  assert(Number.isFinite(state.ball.z) && Number.isFinite(state.ball.x));
}
console.log('table tennis stroke strength, direction and stable simulation OK');
const novice = tennis.create();
const advanced = tennis.create();
advanced.level = 6;
novice.ball.x = advanced.ball.x = .9;
tennis.update(novice, 1/60);
tennis.update(advanced, 1/60);
assert(advanced.ai > novice.ai, 'higher CPU level moves faster');
assert(advanced.aiReaction < novice.aiReaction, 'higher CPU level reacts sooner');

// The CPU can anticipate a wide shot and return it from either corner.
for (const side of [0, 1]) {
  const state = tennis.create();
  Object.assign(state, {serve:false, last:0, bounces:1, x:side ? .9 : .1});
  state.ball = {x:side ? .67 : .33, y:.4, z:.24, vx:side ? .8 : -.8, vy:-.8, vz:1.1};
  for (let frame = 0; frame < 30 && state.last === 0 && !state.serve; frame++) {
    tennis.update(state, 1/60);
  }
  assert.strictEqual(state.last, 1, 'CPU gets to the wide shot before it passes');
  assert(side ? state.ball.vx < -.6 : state.ball.vx > .6, 'CPU returns crosscourt from the corner');
  for (let frame = 0; frame < 80 && state.bounces === 0 && !state.serve; frame++) {
    tennis.update(state, 1/60);
  }
  assert.strictEqual(state.bounces, 1, 'crosscourt shot lands legally');
  assert(side ? state.ball.x < .16 : state.ball.x > .84, 'return lands near the opposite corner');
}
const changeUp = tennis.create();
Object.assign(changeUp, {serve:false, last:0, bounces:1, x:.9, ai:.91, cpuReturns:3});
changeUp.ball = {x:.91,y:.141,z:.22,vx:0,vy:-.8,vz:0};
tennis.update(changeUp, 1/60);
assert.strictEqual(changeUp.last,1);
assert(Math.abs(changeUp.ball.vx)<.05,'CPU can also return straight from the same corner');
for (let frame = 0; frame < 80 && changeUp.bounces === 0 && !changeUp.serve; frame++) {
  tennis.update(changeUp, 1/60);
}
assert.strictEqual(changeUp.bounces, 1, 'straight shot lands legally');
assert(changeUp.ball.x > .84 && changeUp.ball.y > .76, 'straight return lands deep on the same side');
console.log('CPU anticipates wide shots and mixes legal crosscourt and straight returns');
