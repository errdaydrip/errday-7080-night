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
