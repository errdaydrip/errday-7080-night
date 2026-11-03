const assert = require('assert');
const {io} = require('socket.io-client');
const url = 'http://localhost:' + (process.env.PORT || 8080);

async function restore(version, pos, expected) {
  const socket = io(url, {forceNew:true});
  try {
    await new Promise(resolve => socket.once('connect', resolve));
    const clientId = 'retired-sports-' + version + '-' + Math.random();
    const result = await new Promise((resolve, reject) => {
      socket.timeout(3000).emit('join', {
        nick: '복원' + Math.floor(Math.random() * 1000000),
        clientId,
        last: {worldVersion:version, pos, rollerSkates:false}
      }, (error, response) => error ? reject(error) : resolve(response));
    });
    assert(result.ok);
    assert.deepStrictEqual(result.resume.pos, expected);
  } finally {
    socket.close();
  }
}

(async () => {
  const entrance = [-3.3, 0, 13.4];
  await restore(2, [-32, 0, 8], entrance);
  await restore(3, [-25, 0, -10], entrance);
  await restore(3, [-19, 0, 15], entrance);
  await restore(3, [-12.2, 0, 15], [-12.2, 0, 15]);
  await restore(3, [-7, 0, 40], [-7, 0, 40]);
  await restore(4, [-3.3, 0, 13.4], entrance);
  console.log('retired sports saves relocate safely; street and arcade saves preserved');
})().catch(error => { console.error(error); process.exitCode = 1; });
