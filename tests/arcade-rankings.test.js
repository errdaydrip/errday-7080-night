const assert = require('assert');
const {io} = require('socket.io-client');
const A = require('../public/arcade');
const {createRankings} = require('../arcade-rankings');
const board = createRankings(A.GAMES);
for (let i = 0; i < 8; i++) board.record('blocks', 'p'+i, '선수'+i, (i+1)*100, i);
assert.strictEqual(board.publicScores().blocks.length, 6);
assert.deepStrictEqual(board.publicScores().blocks.map(row => row.score), [800,700,600,500,400,300]);
board.record('blocks', 'p7', '새이름', 100, 100);
assert.deepStrictEqual(board.publicScores().blocks[0], {nick:'새이름', score:800});
board.record('blocks', 'p6', '선수6', 900, 101);
assert.strictEqual(board.publicScores().blocks[0].score, 900);
const restored = createRankings(A.GAMES);
restored.restore(JSON.parse(JSON.stringify(board.export())));
assert.deepStrictEqual(restored.publicScores(), board.publicScores());
assert.deepStrictEqual(board.record('toString', 'x', 'x', 100), {changed:false, rank:0});
assert(Math.abs((A.T.x1-A.T.x0)*(A.T.z1-A.T.z0) - (19.2*26)/2) < 1e-8);

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  const sockets = [], url = 'http://localhost:'+(process.env.PORT||8080);
  const emit = (socket, event, data) => new Promise((resolve,reject) => {
    socket.timeout(3000).emit(event,data,(error,response) => error ? reject(error) : resolve(response));
  });
  async function player(index, pos) {
    const socket = io(url, {forceNew:true});sockets.push(socket);
    await new Promise(resolve => socket.once('connect',resolve));
    const id = 'rank-'+Date.now()+'-'+index;
    const result = await emit(socket,'join',{nick:'랭킹'+index,clientId:id,last:{worldVersion:5,pos,rollerSkates:false}});
    assert(result.ok);return socket;
  }
  try {
    const observer = await player('관객', [0,0,4]);
    let scores;
    observer.on('arcadeRankings', payload => { scores=payload; });
    assert.strictEqual((await emit(observer,'arcadeStart',{machineId:'AC-L0'})).ok,false);
    const machine=A.machines[0], pos=[machine.spot.x,0,machine.spot.z];
    for (let i=0;i<7;i++) {
      const socket=await player(i,pos);
      assert.strictEqual((await emit(socket,'arcadeStart',{machineId:'missing'})).ok,false);
      const session=await emit(socket,'arcadeStart',{machineId:machine.id});assert(session.ok);
      await wait(110);
      assert.strictEqual((await emit(socket,'arcadeFinish',{token:'wrong',score:100})).ok,false);
      assert.strictEqual((await emit(socket,'arcadeFinish',{token:session.token,score:-1})).ok,false);
      assert((await emit(socket,'arcadeFinish',{token:session.token,score:(i+1)*100})).ok);
      assert.strictEqual((await emit(socket,'arcadeFinish',{token:session.token,score:9999})).ok,false);
    }
    await wait(100);
    assert.strictEqual(scores.blocks.length,6);
    assert.deepStrictEqual(scores.blocks.map(row=>row.score),[700,600,500,400,300,200]);
    assert(scores.blocks.every(row=>Object.keys(row).sort().join(',')==='nick,score'));
    console.log('shared top-six rankings, player bests, session validation and save restoration OK');
  } finally { sockets.forEach(socket=>socket.close()); }
})().catch(error=>{console.error(error);process.exitCode=1;});
