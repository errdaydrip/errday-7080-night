// 투네이션 후원 티커 위젯 스트림 듣기 (공식 API 아님: 위젯이 쓰는 웹소켓과 같은 방식)
// TOONATION_TICKER_URL 로 바꿀 수 있음. 끊기면 자동 재연결, 12초마다 #ping
const WS=require('ws');
const DEFAULT_URL='https://toon.at/widget/donation_ticker/f57b46ea2a24fd9601dc95c3eedd90e3/101';
function payloadOf(url){const m=/donation_ticker\/([0-9a-f]{16,64})(?:\/(\d+))?/i.exec(url||'');if(!m)return null;
 return Buffer.from(JSON.stringify({auth:m[1],service:'donationticker',type:+(m[2]||101)})).toString('base64');}
const decode=t=>String(t||'').replace(/\$7/g,';').replace(/\$6/g,'\\').replace(/\$5/g,'"').replace(/\$4/g,"'").replace(/\$3/g,'&').replace(/\$2/g,'>').replace(/\$1/g,'<').replace(/\$0/g,'$');
// 위젯 메시지 → [{name,amount,msg,t}] (후원(101)만, 기프티콘 제외)
function parse(obj,clean){const out=[];const one=o=>{if(!o||o.code!==101||!o.content||o.content.gifticon)return;const c=o.content;
  const amount=+c.amount||(c.amount_m?Math.round(c.amount_m*1e-6):0);const name=clean(decode(c.name).trim().slice(0,20))||'익명';
  out.push({name,amount,msg:clean(decode(c.message||'').replace(/\s+/g,' ').trim().slice(0,60)),t:Date.now()});};
 if(Array.isArray(obj.list))obj.list.forEach(one);else one(obj);return out;}
function start({url=process.env.TOONATION_TICKER_URL||DEFAULT_URL,clean=s=>s,onDonation,max=10,log=()=>{}}={}){
 const p=payloadOf(url);if(!p){log('ticker: bad url');return {list:[],stop(){}};}
 const st={list:[],ws:null,stopped:false,ping:null,backoff:2000};
 const connect=()=>{if(st.stopped)return;let ws;try{ws=new WS('wss://ws.toon.at/'+p,{headers:{Origin:'https://toon.at','User-Agent':'Mozilla/5.0'}});}catch(e){return retry();}st.ws=ws;
  ws.on('open',()=>{st.backoff=2000;log('ticker: connected');clearInterval(st.ping);st.ping=setInterval(()=>{try{ws.send('#ping');}catch(e){}},12000);});
  ws.on('message',d=>{const s=d.toString();if(s[0]==='#')return;let o;try{o=JSON.parse(s);}catch(e){return;}const ds=parse(o,clean);if(!ds.length)return;
   for(const x of ds){st.list.unshift(x);}st.list=st.list.slice(0,max);onDonation&&onDonation(st.list,ds);});
  ws.on('close',()=>{clearInterval(st.ping);retry();});ws.on('error',()=>{});};
 const retry=()=>{if(st.stopped)return;setTimeout(connect,st.backoff).unref();st.backoff=Math.min(st.backoff*2,60000);};
 connect();return {get list(){return st.list;},stop(){st.stopped=true;clearInterval(st.ping);try{st.ws&&st.ws.close();}catch(e){}}};}
// 후원 랭킹 위젯 (ranking/<id>) : 접속하면 {type:0,conf,data:[{rank,cash,acc|name}]} 한 번 + 바뀔 때마다 다시 옴
const RANK_URL='https://toon.at/widget/ranking/f57b46ea2a24fd9601dc95c3eedd90e3';
function rankPayload(url){const m=/ranking\/([0-9a-f]{16,64})/i.exec(url||'');return m?Buffer.from(JSON.stringify({auth:m[1],service:'rank'})).toString('base64'):null;}
function parseRank(o,clean){if(!o||!Array.isArray(o.data))return null;const c=o.conf||{};const n=Math.max(1,Math.min(10,+c.display_count||5));
 return {title:clean(String(c.title_text||'후원랭킹').slice(0,20)),list:o.data.slice(0,n).map((r,i)=>({rank:+r.rank||i+1,name:clean(decode(r.name||r.nickname||r.nick||r.acc||'익명').trim().slice(0,20)),cash:+r.cash||+r.amount||0}))};}
function startRank({url=RANK_URL,clean=s=>s,onRank,log=()=>{}}={}){const p=rankPayload(url);if(!p){log('rank: bad url');return {stop(){}};}
 const st={ws:null,stopped:false,ping:null,backoff:2000};
 const connect=()=>{if(st.stopped)return;let ws;try{ws=new WS('wss://ws.toon.at/'+p,{headers:{Origin:'https://toon.at','User-Agent':'Mozilla/5.0'}});}catch(e){return retry();}st.ws=ws;
  ws.on('open',()=>{st.backoff=2000;log('rank: connected');clearInterval(st.ping);st.ping=setInterval(()=>{try{ws.send('#ping');}catch(e){}},12000);});
  ws.on('message',d=>{const s=d.toString();if(s[0]==='#')return;let o;try{o=JSON.parse(s);}catch(e){return;}const r=parseRank(o,clean);if(r)onRank&&onRank(r);});
  ws.on('close',()=>{clearInterval(st.ping);retry();});ws.on('error',()=>{});};
 const retry=()=>{if(st.stopped)return;setTimeout(connect,st.backoff).unref();st.backoff=Math.min(st.backoff*2,60000);};
 connect();return {stop(){st.stopped=true;clearInterval(st.ping);try{st.ws&&st.ws.close();}catch(e){}}};}
module.exports={start,parse,payloadOf,DEFAULT_URL,RANK_URL,rankPayload,parseRank,startRank};
