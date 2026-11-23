const a=require('assert');
const {SKIP_DELAY_MS,nextSkipWait,shouldSkipError,applyError}=require('../yt-fail');

a.strictEqual(nextSkipWait(1000,0),0);
a.strictEqual(nextSkipWait(1000,undefined),0);
a.strictEqual(nextSkipWait(2000,1000),500); // 1500-(2000-1000)
a.strictEqual(nextSkipWait(2500,1000),0);
a.strictEqual(nextSkipWait(2000,1000,800),0);
a.strictEqual(nextSkipWait(1500,1000,800),300);
a.ok(SKIP_DELAY_MS>=1000);
a.strictEqual(shouldSkipError(undefined),false);
a.strictEqual(shouldSkipError(null),false);
a.strictEqual(shouldSkipError(''),false);
a.strictEqual(shouldSkipError('foo'),false);
a.strictEqual(shouldSkipError(0),false);
a.strictEqual(shouldSkipError(150),true);
a.strictEqual(shouldSkipError('153'),true);
a.strictEqual(shouldSkipError(101),true);
a.strictEqual(shouldSkipError(2),true);
a.strictEqual(shouldSkipError(99),false);


const pl=[{title:'A'},{title:'B'},{title:'C'}];
const next=()=> (m.index+1)%pl.length;
let m={playlist:pl,index:0,playing:true,startedAt:1000,pausedAt:0};

let r=applyError(m,next,2000);
a.strictEqual(r.stopped,false);
a.strictEqual(r.skipped,true);
a.strictEqual(m.index,1);
a.strictEqual(m.playing,true);
a.strictEqual(m.startedAt,2000);

r=applyError(m,next,3500);
a.strictEqual(r.stopped,false);
a.strictEqual(m.index,2);
r=applyError(m,next,5000);
a.strictEqual(r.stopped,false,'세 번 연속 실패해도 멈추지 않음');
a.strictEqual(m.playing,true);
a.strictEqual(m.index,0);

console.log('yt-fail OK');
