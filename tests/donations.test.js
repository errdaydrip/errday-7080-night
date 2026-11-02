// node tests/donations.test.js — 투네이션 티커 메시지 파싱 (네트워크 없이)
const a=require('assert');const D=require('../donations');const {clean}=require('../filter');
const p=JSON.parse(Buffer.from(D.payloadOf(D.DEFAULT_URL),'base64').toString());a.deepStrictEqual(p,{auth:'f57b46ea2a24fd9601dc95c3eedd90e3',service:'donationticker',type:101});
a.strictEqual(D.payloadOf('https://example.com/x'),null);
let r=D.parse({code:101,content:{name:'철수$3영희',amount:5000,message:'노래 좋아요'}},clean);a.deepStrictEqual([r[0].name,r[0].amount,r[0].msg],['철수&영희',5000,'노래 좋아요']);
r=D.parse({list:[{code:101,content:{name:'A',amount:1000}},{code:102,content:{name:'sub'}},{code:101,content:{name:'G',amount:1,gifticon:true}}]},clean);a.strictEqual(r.length,1,'donations only, no gifticon');
r=D.parse({conf:{}},clean);a.strictEqual(r.length,0);
r=D.parse({code:101,content:{name:'욕',amount:1000,message:'씨발 좋아'}},clean);a(!/씨발/.test(r[0].msg),'profanity filtered: '+r[0].msg);
console.log('donations OK');
