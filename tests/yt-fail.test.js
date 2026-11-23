const a=require('assert');
const {LIMIT,applyError,errLabel}=require('../yt-fail');

a.strictEqual(errLabel(153),'재생 설정 오류');
a.strictEqual(errLabel(150),'퍼가기 금지');
a.strictEqual(errLabel(99),'99');
a.strictEqual(errLabel(),'');

const pl=[{title:'A'},{title:'B'},{title:'C'}];
const next=()=> (m.index+1)%pl.length;
let m={playlist:pl,index:0,playing:true,startedAt:1000,pausedAt:0};

let r=applyError(m,next,2000,0,{code:153});
a.strictEqual(r.stopped,false);
a.strictEqual(r.streak,1);
a.strictEqual(m.index,1);
a.strictEqual(m.playing,true);
a.ok(/재생할 수 없는 곡/.test(r.message));
a.ok(/A/.test(r.message));
a.ok(/재생 설정 오류/.test(r.message));

r=applyError(m,next,3000,r.streak,{code:153});
a.strictEqual(r.stopped,false);
a.strictEqual(r.streak,2);
a.strictEqual(m.index,2);

r=applyError(m,next,4000,r.streak,{code:153});
a.strictEqual(r.stopped,true);
a.strictEqual(r.streak,LIMIT);
a.strictEqual(m.playing,false);
a.strictEqual(m.index,2,'멈출 때는 다음 곡으로 넘기지 않음');
a.strictEqual(m.startedAt,3000);
a.strictEqual(m.pausedAt,1000);
a.ok(/연속으로 재생되지 않아/.test(r.message));
a.ok(/음악을 멈췄/.test(r.message));

console.log('yt-fail OK');
