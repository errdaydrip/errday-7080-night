const assert=require('assert');const {advance}=require('../playback');
const pl=[{type:'yt',videoId:'a'},{type:'yt',videoId:'b'},{type:'yt',videoId:'c'}];const D={a:100,b:200,c:50};
const durOf=t=>D[t.videoId];
let m={playlist:pl,index:0,playing:true,startedAt:0,shuffle:false};const nx=()=>(m.index+1)%3;
assert.equal(advance(m,durOf,50e3,nx),false);assert.equal(m.index,0);
advance(m,durOf,150e3,nx);assert.equal(m.index,1);assert.equal(m.startedAt,100e3);
m={...m,index:0,startedAt:0};advance(m,durOf,(350*2+120)*1000,nx); // 2바퀴 + 120초 → b의 20초 지점
assert.equal(m.index,1);assert.equal(m.startedAt,(700+100)*1000);
m={...m,index:0,startedAt:0,playing:false};assert.equal(advance(m,durOf,1e9,nx),false);
m={playlist:[{type:'yt',videoId:'z'}],index:0,playing:true,startedAt:0};assert.equal(advance(m,()=>undefined,1e9,()=>0),false);
console.log('playback tests OK');
