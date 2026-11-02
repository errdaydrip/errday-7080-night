const express=require('express'),http=require('http'),path=require('path'),fs=require('fs'),multer=require('multer');
const {Server}=require('socket.io');
const PORT=process.env.PORT||8080, UP=path.join(__dirname,'uploads');
fs.mkdirSync(UP,{recursive:true});
const ADMIN_PW=String(process.env.ADMIN_PASSWORD||'6651'); // 제작자가 정한 고정 비밀번호
const tokens=new Set();const isAdmin=t=>!!t&&tokens.has(t);
const app=express(),server=http.createServer(app),io=new Server(server,{maxHttpBufferSize:1e6,transports:['websocket','polling']});
app.use(express.static(path.join(__dirname,'public')));
app.use(express.json());
app.get('/health',(req,res)=>res.json({ok:true,uptime:process.uptime(),playing:music.playing,players:Object.keys(players).length,isDefault:!!music.isDefault,track:(music.playlist[music.index]||{}).title||null}));
app.post('/admin/login',(req,res)=>{if(req.body&&req.body.password===ADMIN_PW){const t=require('crypto').randomBytes(16).toString('hex');tokens.add(t);return res.json({token:t});}res.status(401).json({error:'비밀번호가 틀렸어요'});});
app.use('/uploads',express.static(UP));
// ---- 유튜브: 링크 → 영상 ID 목록 (API 키 없이, 최선 노력) ----
function parseYT(u){try{const x=new URL(u);const list=x.searchParams.get('list');let v=x.searchParams.get('v');
 if(/youtu\.be$/.test(x.hostname))v=x.pathname.slice(1);if(/\/shorts\//.test(x.pathname))v=x.pathname.split('/')[2];return {list,v};}catch(e){return {};}}
async function ytTitle(id){try{const r=await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent('https://www.youtube.com/watch?v='+id));if(r.ok)return (await r.json()).title;}catch(e){}return '유튜브 '+id;}
async function ytPlaylist(list){const r=await fetch('https://www.youtube.com/playlist?list='+encodeURIComponent(list)+'&hl=ko',{headers:{'User-Agent':'Mozilla/5.0','Accept-Language':'ko'}});
 const html=await r.text();const out=[],seen=new Set();const re=/"playlistVideoRenderer":\{"videoId":"([\w-]{11})".*?"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/g;let m;
 while((m=re.exec(html))){if(!seen.has(m[1])){seen.add(m[1]);out.push({id:m[1],title:JSON.parse('"'+m[2]+'"')});}}
 if(!out.length){const re2=/"videoId":"([\w-]{11})"/g;while((m=re2.exec(html)))if(!seen.has(m[1])){seen.add(m[1]);out.push({id:m[1],title:null});}}
 return out.slice(0,200);}
// 재생목록 전체(제목+길이): YOUTUBE_API_KEY 있으면 공식 API, 없으면 페이지 파싱(최대 ~100곡). 테스트는 YT_MOCK_FILE
const isoDur=d=>{const m=/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(d||'');return m?(+m[1]||0)*3600+(+m[2]||0)*60+(+m[3]||0):0;};
async function ytPlaylistFull(list){
 if(process.env.YT_MOCK_FILE){const j=JSON.parse(fs.readFileSync(process.env.YT_MOCK_FILE,'utf8'));if(!j[list])throw new Error('not found');return j[list];}
 const K=process.env.YOUTUBE_API_KEY;
 if(K){const out=[];let page='';do{const r=await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${encodeURIComponent(list)}&key=${K}${page?'&pageToken='+page:''}`);const j=await r.json();if(!r.ok)throw new Error((j.error&&j.error.message)||r.status);
   for(const it of j.items||[]){const id=it.snippet&&it.snippet.resourceId&&it.snippet.resourceId.videoId;if(id&&!/^(Deleted|Private) video$/.test(it.snippet.title))out.push({id,title:it.snippet.title});}page=j.nextPageToken;}while(page&&out.length<200);
  for(let i=0;i<out.length;i+=50){try{const r=await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${out.slice(i,i+50).map(o=>o.id).join(',')}&key=${K}`);const j=await r.json();for(const v of j.items||[]){const o=out.find(x=>x.id===v.id);if(o)o.dur=isoDur(v.contentDetails.duration);}}catch(e){}}
  return out;}
 const r=await fetch('https://www.youtube.com/playlist?list='+encodeURIComponent(list)+'&hl=ko',{headers:{'User-Agent':'Mozilla/5.0','Accept-Language':'ko'}});const html=await r.text();
 const parts=html.split('"playlistVideoRenderer":{').slice(1),out=[],seen=new Set();
 for(const c of parts){const id=(/^"videoId":"([\w-]{11})"/.exec(c)||[])[1];if(!id||seen.has(id))continue;seen.add(id);const t=/"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/.exec(c),l=/"lengthSeconds":"(\d+)"/.exec(c);
  out.push({id,title:t?JSON.parse('"'+t[1]+'"'):null,dur:l?+l[1]:0});}
 if(!out.length)for(const o of await ytPlaylist(list))out.push(o);return out.slice(0,200);}
const PRESET_DEF=[{name:'7080mix',url:'https://www.youtube.com/playlist?list=PL1cIIyrjZ9L3YEUl8DAz_R6uTf2-80wWY'},{name:'뮤직비디오',url:'https://www.youtube.com/playlist?list=PLFHMiSLBhKxo'},{name:'탑골나이트',url:'https://www.youtube.com/playlist?list=PLak-Kzc3H_lQ'}];
let presets=PRESET_DEF.map(p=>({...p}));
const links=require('./links');
async function addLink(req,res){if(!isAdmin(req.get('x-admin-token')))return res.status(403).json({error:'관리자만 추가 가능'});
 const url=String(req.body.url||'').slice(0,2000);const r=await links.resolve(url).catch(e=>({error:'링크 확인 실패: '+e.message}));
 if(r.error)return res.status(400).json({error:r.error});let items=[];const by=String(req.body.by||'관리자').slice(0,20);
 if(r.yt){const {list,v}=r.yt;try{if(list)items=await ytPlaylist(list);}catch(e){}
  if(!items.length&&v)items=[{id:v,title:null}];
  if(!items.length)return res.status(400).json({error:list?'재생목록을 읽지 못했어요 (비공개/믹스 목록은 안 될 수 있음)':'유튜브 링크를 확인해 주세요'});
  for(const it of items){if(!it.title)it.title=await ytTitle(it.id);}
  items=items.map(it=>({type:'yt',videoId:it.id,title:it.title}));}
 else items=r.items;
 music.cleared=false;if(music.isDefault){music.playlist=[];music.index=-1;music.isDefault=false;music.shuffle=false;played=new Set();}
 const stamp=Date.now();items.forEach((it,i)=>{it.title=String(it.title||'?').slice(0,200);music.playlist.push({...it,id:it.type+'_'+(it.videoId||'')+'_'+stamp+'_'+i,by});});
 if(music.index<0){music.index=music.playlist.length-items.length;music.playing=true;music.startedAt=Date.now();music.pausedAt=0;}
 broadcastMusic();res.json({added:items.length,service:r.service,title:items.length===1?items[0].title:undefined});}
app.post('/link',addLink);app.post('/youtube',addLink);
const {advance}=require('./playback');
// 투네이션 후원 전광판: 최근 후원 목록을 모두에게
const DON=require('./donations');let donList=[],tickerIdle='',tickerUrl=process.env.TOONATION_TICKER_URL||DON.DEFAULT_URL,donTicker=null;
let clubOpen=true;let rankUrl=DON.RANK_URL,rankData=null,rankWs=null,boards={ticker:true,rank:true};
const boardsPub=()=>({...boards,idle:tickerIdle});
function startRank(){if(rankWs)rankWs.stop();rankWs=process.env.TICKER_OFF||!boards.rank?null:DON.startRank({url:rankUrl,clean:t=>cleanText(t),onRank:r=>{rankData=r;save();io.emit('ranking',rankData);},log:m=>console.log(m)});}
function startTicker(){if(donTicker)donTicker.stop();donTicker=process.env.TICKER_OFF||!boards.ticker?null:DON.start({url:tickerUrl,clean:t=>cleanText(t),onDonation:(l,ds)=>{donList=[...ds,...donList].slice(0,10);save();io.emit('donations',donList);},log:m=>console.log(m)});}
const STATE=process.env.STATE_FILE||path.join(__dirname,'data','state.json');
const durations={}; // videoId 또는 mp3 id -> 초 (클라이언트가 알려줌)
const durOf=t=>t&&(t.dur||durations[t.type==='yt'?t.videoId:t.id]);
const {clean:cleanText,isBad}=require('./filter');
const STYLES=['basic','suit','disco','hanbok','aerobic'],HEX=/^#[0-9a-fA-F]{6}$/;const LOOKS=require('./public/looks.js');const look=p=>{const r=LOOKS.resolve(p);return{gender:r.gender,style:r.style,outfit:HEX.test(p.outfit)?p.outfit:'',top:r.top,bottom:r.bottom,acc:r.acc,hair:r.hair,face:r.face,beard:r.beard,skin:HEX.test(p.skin)?p.skin:''};};
const players={}; // id -> {nick,gender,outfit,skin,style,pos,rot,seat}
const music={playlist:[],index:-1,playing:false,startedAt:0,pausedAt:0,shuffle:false};
let played=new Set(); // 랜덤 재생: 이미 튼 곡 id
function nextIndex(){const n=music.playlist.length;if(!n)return -1;if(!music.shuffle)return (music.index+1)%n;
 const cur=music.playlist[music.index];if(cur)played.add(cur.id);let left=music.playlist.map((t,i)=>i).filter(i=>!played.has(music.playlist[i].id)&&i!==music.index);
 if(!left.length){played=new Set(cur?[cur.id]:[]);left=music.playlist.map((t,i)=>i).filter(i=>i!==music.index);if(!left.length)return music.index;}
 return left[Math.floor(Math.random()*left.length)];}
const upload=multer({storage:multer.diskStorage({destination:UP,filename:(r,f,cb)=>cb(null,Date.now()+'_'+Math.random().toString(36).slice(2,7)+'.mp3')}),
 limits:{fileSize:30*1024*1024},fileFilter:(r,f,cb)=>cb(null,/audio|mpeg|mp3/i.test(f.mimetype)||/\.mp3$/i.test(f.originalname))});
app.post('/upload',(req,res,next)=>isAdmin(req.get('x-admin-token'))?next():res.status(403).json({error:'관리자만 업로드 가능'}),(req,res)=>upload.single('file')(req,res,err=>{
 if(err) return res.status(400).json({error:err.code==='LIMIT_FILE_SIZE'?'30MB 초과':String(err.message)});
 if(!req.file) return res.status(400).json({error:'mp3 파일만 가능'});
 const name=Buffer.from(req.file.originalname,'latin1').toString('utf8');
 const t={type:'mp3',id:req.file.filename,title:name.replace(/\.mp3$/i,''),url:'/uploads/'+req.file.filename,by:req.body.by||'?'};
 music.cleared=false;if(music.isDefault){music.playlist=[];music.index=-1;music.isDefault=false;music.shuffle=false;played=new Set();}
 music.playlist.push(t); if(music.index<0){music.index=music.playlist.length-1;music.playing=true;music.startedAt=Date.now();}
 broadcastMusic(); res.json(t);
}));
function save(){try{fs.mkdirSync(path.dirname(STATE),{recursive:true});fs.writeFileSync(STATE,JSON.stringify({music,durations,played:[...played],presets,tickerUrl,donList,tickerIdle,rankUrl,rankData,boards,clubOpen}));}catch(e){}}
function load(){try{const j=JSON.parse(fs.readFileSync(STATE,'utf8'));Object.assign(music,j.music);Object.assign(durations,j.durations||{});played=new Set(j.played||[]);if(Array.isArray(j.presets)&&j.presets.length===3)presets=j.presets;if(typeof j.tickerUrl==='string'&&DON.payloadOf(j.tickerUrl))tickerUrl=j.tickerUrl;if(typeof j.rankUrl==='string'&&DON.rankPayload(j.rankUrl))rankUrl=j.rankUrl;if(j.rankData&&Array.isArray(j.rankData.list))rankData=j.rankData;if(j.clubOpen===false)clubOpen=false;if(j.boards)boards={ticker:j.boards.ticker!==false,rank:j.boards.rank!==false};if(typeof j.tickerIdle==='string')tickerIdle=j.tickerIdle.slice(0,120);if(Array.isArray(j.donList))donList=j.donList.slice(0,10);
 music.playlist=music.playlist.filter(t=>t.type!=='mp3'||fs.existsSync(path.join(UP,t.id)));if(music.index>=music.playlist.length)music.index=music.playlist.length?0:-1;}catch(e){}}
load();startRank(); /* 후원 티커 연결은 끔: 일반 LED 전광판으로 바뀜 */
const DEFAULT_LIST='PL1cIIyrjZ9L3YEUl8DAz_R6uTf2-80wWY';let defLoading=false;
async function ensureDefault(){if(music.playlist.length||defLoading||music.cleared)return; /* 관리자가 전체삭제했으면 기본목록 다시 안 채움 */defLoading=true;try{const items=await ytPlaylist(DEFAULT_LIST);
  if(items.length&&!music.playlist.length){music.playlist=items.map(it=>({type:'yt',id:'yt_'+it.id+'_def',videoId:it.id,title:it.title||'YouTube',by:'기본 재생목록'}));
   music.isDefault=true;music.shuffle=true;played=new Set();music.index=Math.floor(Math.random()*items.length);music.playing=true;music.startedAt=Date.now();music.pausedAt=0;broadcastMusic();fillTitles();}}
 catch(e){console.log('default playlist fail',e.message);}finally{defLoading=false;}}
async function fillTitles(){for(const t of music.playlist){if(!music.isDefault)return;if(t.title==='YouTube'){try{t.title=await ytTitle(t.videoId)||'YouTube';}catch(e){}}}broadcastMusic();}
setInterval(ensureDefault,60000).unref();
let timer=null;
function tick(){const ch=advance(music,durOf,Date.now(),nextIndex);if(ch){io.emit('music',state());save();}schedule();}
function schedule(){clearTimeout(timer);const t=music.playlist[music.index],d=durOf(t);
 if(music.playing&&d)timer=setTimeout(tick,Math.max(500,music.startedAt+d*1000-Date.now()+300));}
const state=()=>{advance(music,durOf,Date.now(),nextIndex);return {...music,durations,serverNow:Date.now()};};
function broadcastMusic(){if(!music.playlist.length)setTimeout(ensureDefault,0);io.emit('music',state());save();schedule();}
function pub(){const o={};for(const id in players){const {cid,seen,joinedAt,lastDrink,lastServe,lastAct,lastEat,gone,timer,...r}=players[id];o[id]=r;}return o;}
function nickTaken(n,cid,sid){n=n.trim().toLowerCase();for(const id in players){const q=players[id];if(id!==sid&&q.cid!==cid&&q.nick.trim().toLowerCase()===n)return true;}return false;}
let lastOnline=-1;function online(){let n=0;for(const id in players)if(!players[id].gone)n++;return n;}
function bcOnline(force){const n=online();if(force||n!==lastOnline){lastOnline=n;io.emit('online',n);}}
setInterval(()=>bcOnline(false),1000).unref();
function sweep(){for(const id in players){const so=io.sockets.sockets.get(id);if((!so||!so.connected)&&!players[id].gone){const pl=players[id];delete players[id];io.emit('leave',id);io.emit('chat',{sys:true,text:pl.nick+' 님 퇴장'});}}bcOnline();}
setInterval(sweep,15000).unref();
const chatHist=[];const GRACE_MS=+process.env.GRACE_MS||30000;
const BZ={x0:10.55,x1:11.4,z0:-1.6,z1:6.75},BAR_Z={};for(let k=0;k<5;k++)BAR_Z['BAR-'+k]=3-3.5+k*1.4;
const glasses={};const glassPub=()=>{const o={};for(const k in glasses)o[k]=glasses[k].type||'whiskey';return o;};
const DRINKS=['soju','beer','whiskey','cocktail'];
const TABLES={Y1:[-7.6,16.4],Y2:[-3,16.4],Y3:[-7.6,20.2],Y4:[-3,20.2],Y5:[2.2,19.6],T1:[-7,-4,2.4],T2:[-7,2,2.4],T3:[-7,7.5,2.4],T4:[4.5,6,2.4],T5:[0,8.5,2.4],T6:[-2.5,3.5,2.4]};const tables={};for(const k in TABLES)tables[k]={items:[null,null,null,null],t:0};
const PICK={soju:{x:-0.7,z:21.5,r:1.8},beer:{x:-0.7,z:21.5,r:1.8}};for(const f of ['dakbal','kkom','fish','squid'])PICK[f]={x:0.8,z:16.0,r:2.4};PICK.chicken={x:-11.6,z:20.5,r:2.4};PICK.hoe={x:-11.6,z:15,r:2.4};
const usesPub=()=>{const o={};for(const k in tables)o[k]=tables[k].items.map(i=>i?i.u:0);return o;};const tablePub=()=>{const o={};for(const k in tables)o[k]=tables[k].items.map(i=>i?i.k:null);return o;};
const FOODS=['dakbal','kkom','fish','squid','chicken','hoe','fruit'],MAX_ITEMS=4,USES=4;
function useItem(tb,kind){const t=tables[tb],i=t.items.findIndex(x=>x&&x.k===kind);if(i<0)return false;if(--t.items[i].u<=0)t.items[i]=null;t.t=Date.now();(io.emit('tableUses',usesPub()),io.emit('table',tablePub()));return true;}
// 웨이터 리필: 서버가 일을 정하고 모두에게 같은 시각으로 알림 → 모든 화면에서 같은 웨이터가 같은 테이블로 감
const {refill:wRefill,needs:wNeeds}=require('./waiter');const W_WALK=+process.env.WAITER_WALK_MS||5000,W_PLACE=+process.env.WAITER_PLACE_MS||1500,W_DELAY=process.env.REFILL_DELAY_MS!==undefined?+process.env.REFILL_DELAY_MS:20000;
const waiterJobs=[null,null];
function waiterTick(){const n=Date.now();for(let w=0;w<waiterJobs.length;w++){if(waiterJobs[w])continue;
  const busy=waiterJobs.filter(Boolean).map(j=>j.table);const tb=Object.keys(tables).filter(k=>k[0]==='T'&&!busy.includes(k)&&wNeeds(tables[k].items)&&n-tables[k].t>=W_DELAY).sort((a,b)=>tables[a].t-tables[b].t)[0];if(!tb)return;
  const job={w,table:tb,t0:n,walk:W_WALK,place:W_PLACE};waiterJobs[w]=job;io.emit('waiterJob',job);
  setTimeout(()=>{const t=tables[tb];t.items=wRefill(t.items,USES);t.t=Date.now();io.emit('tableUses',usesPub());io.emit('table',tablePub());},W_WALK+W_PLACE/2).unref();
  setTimeout(()=>{waiterJobs[w]=null;},W_WALK*2+W_PLACE+200).unref();}}
// 야장 알바: 포차 테이블에 앉은 손님 주문 → 가져와서 테이블에 놓음 (서버 시계 기준, 한 명이 순서대로)
const ALBA_HOME=[0.2,18.4],ALBA_SP=+process.env.ALBA_SPEED||1.6,ALBA_PICK=+process.env.ALBA_PICK_MS||800,ALBA_PLACE=+process.env.ALBA_PLACE_MS||1000;
const ORDER_ANJU=['dakbal','kkom','fish','squid','chicken','hoe'],ORDER_DRINK=['soju','beer'];
const ALBA_SRC=k=>k==='soju'||k==='beer'?[-0.7,20.7]:k==='chicken'?[-10.5,20.5]:k==='hoe'?[-10.5,15]:[0.8,16.9];
let albaQ=[],albaJob=null,albaSeq=0;
function albaPending(tb){return albaQ.filter(o=>o.table===tb).length+(albaJob&&albaJob.table===tb&&!albaJob.done?1:0);}
function albaNext(){if(albaJob||!albaQ.length)return;const o=albaQ.shift(),n=Date.now(),src=ALBA_SRC(o.kind),c=TABLES[o.table];
 const dx=src[0]-c[0],dz=src[1]-c[1],l=Math.hypot(dx,dz)||1,to=[+(c[0]+dx/l*1.0).toFixed(2),+(c[1]+dz/l*1.0).toFixed(2)];
 const ms=(a,b)=>Math.round(Math.hypot(a[0]-b[0],a[1]-b[1])/ALBA_SP*1000);
 const j={...o,t0:n,home:ALBA_HOME,src,to,c:[c[0],c[1]],leg1:ms(ALBA_HOME,src),pick:ALBA_PICK,leg2:ms(src,to),place:ALBA_PLACE,leg3:ms(to,ALBA_HOME)};albaJob=j;io.emit('albaJob',j);
 setTimeout(()=>{const t=tables[j.table],i=t.items.indexOf(null);j.done=true;if(i>=0){t.items[i]={k:j.kind,u:USES};t.t=Date.now();io.emit('tableUses',usesPub());io.emit('table',tablePub());}
  io.emit('albaDone',{id:j.id,by:j.by,ok:i>=0,kind:j.kind,table:j.table});},j.leg1+j.pick+j.leg2+j.place/2).unref();
 setTimeout(()=>{albaJob=null;albaNext();},j.leg1+j.pick+j.leg2+j.place).unref();} // 복귀 걸음은 화면에서만 (다음 주문은 바로 시작)
if(!process.env.WAITER_OFF)setInterval(waiterTick,+process.env.WAITER_TICK_MS||4000).unref();
const pochaTable=seat=>{const m=/^([YT]\d)-/.exec(seat||'');return m&&tables[m[1]]?m[1]:null;};
function canDrink(seat,type){if(BAR_Z[seat]!==undefined)return !!glasses[seat]&&(glasses[seat].type||'whiskey')===type;if(type==='whiskey'||type==='cocktail')return false;const tb=pochaTable(seat);if(tb)return tables[tb].items.some(i=>i&&i.k===type);return false;}
setInterval(()=>{const n=Date.now();let ch=false;for(const k in tables)if(tables[k].items.some(Boolean)&&n-tables[k].t>1200000){tables[k].items=[null,null,null,null];ch=true;}if(ch)(io.emit('tableUses',usesPub()),io.emit('table',tablePub()));},10000).unref();
setInterval(()=>{const n=Date.now();let ch=false;for(const k in glasses)if(n-glasses[k].t>60000){delete glasses[k];ch=true;}if(ch)io.emit('glasses',glassPub());},2000).unref();
// 위치는 이동마다 바로 보내지 않고 0.1초마다 바뀐 사람만 묶어서 한 번에 방송 (N² 메시지 → 틱당 1개)
const dirty=new Set();const r2=v=>Math.round(v*100)/100;
setInterval(()=>{if(!dirty.size)return;const a=[];for(const id of dirty){const p=players[id];if(p&&!p.gone)a.push(id,r2(p.pos[0]),r2(p.pos[1]),r2(p.pos[2]),r2(p.rot),p.dance|0);}dirty.clear();if(a.length)io.volatile.emit('m',a);},100).unref();
const bans=[];const BAN_MS=+process.env.BAN_MS||600000;const ipOf=so=>String(so.handshake.headers['x-forwarded-for']||so.handshake.address||'').split(',')[0].trim();
const banned=(cid,ip,nick)=>{const n=Date.now();for(let i=bans.length-1;i>=0;i--)if(bans[i].until<n)bans.splice(i,1);return bans.find(b=>b.cid===cid||b.nick===nick||(process.env.BAN_IP==='1'&&ip&&b.ip===ip));};
io.on('connection',s=>{
 s.on('adminKick',(q,ack)=>{if(typeof ack!=='function')ack=()=>{};q=q||{};if(!isAdmin(q.token))return ack({ok:false,error:'관리자만 가능'});const id=String(q.id||'');if(id===s.id)return ack({ok:false,error:'자기 자신은 강퇴할 수 없어요'});
  const pl=players[id];if(!pl)return ack({ok:false,error:'이미 나간 사람이에요'});const so=io.sockets.sockets.get(id);
  bans.push({cid:pl.cid,ip:so?ipOf(so):pl.ip,nick:pl.nick,until:Date.now()+BAN_MS});clearTimeout(pl.timer);delete players[id];dirty.delete(id);
  for(const oid in players)if(players[oid].cid===pl.cid){delete players[oid];io.emit('leave',oid);const o=io.sockets.sockets.get(oid);if(o){o.emit('kicked',{min:Math.round(BAN_MS/60000)});o.disconnect(true);}}
  if(so){so.emit('kicked',{min:Math.round(BAN_MS/60000)});setTimeout(()=>so.disconnect(true),200);}
  io.emit('leave',id);io.emit('chat',{sys:true,text:pl.nick+' 님이 강퇴되었습니다'});bcOnline();ack({ok:true});});
 s.on('adminList',(tok,ack)=>{if(typeof ack!=='function')return;if(!isAdmin(tok))return ack({ok:false});ack({ok:true,me:s.id,list:Object.entries(players).filter(([,p])=>!p.gone).map(([id,p])=>({id,nick:p.nick}))});});
 s.emit('init',{id:s.id,players:pub(),music:state()});s.emit('chatHistory',chatHist);
 const touch=()=>{const pl=players[s.id];if(pl)pl.seen=Date.now();};s.onAny(touch);s.conn.on('packet',touch);s.conn.on('heartbeat',touch);
 s.on('adminCleanup',(tok,ack)=>{if(typeof ack!=='function')ack=()=>{};if(!isAdmin(tok))return ack({ok:false,error:'관리자만 가능'});
  const now=Date.now(),seenCid=new Map(),rm=[];
  for(const id in players){const pl=players[id],so=io.sockets.sockets.get(id);
   if(!so||!so.connected||pl.gone||(id!==s.id&&now-(pl.seen||pl.joinedAt||now)>60000)){rm.push(id);continue;}
   const o=seenCid.get(pl.cid);if(o){const keep=(players[o].seen||0)>=(pl.seen||0)?o:id,drop=keep===o?id:o;rm.push(drop);seenCid.set(pl.cid,keep);}else seenCid.set(pl.cid,id);}
  for(const id of new Set(rm)){const pl=players[id];if(!pl)continue;clearTimeout(pl.timer);delete players[id];dirty.delete(id);io.emit('leave',id);const so=io.sockets.sockets.get(id);if(so&&id!==s.id)so.disconnect(true);}
  io.emit('snapshot',pub());bcOnline();ack({ok:true,removed:new Set(rm).size});});
 s.on('join',(p,ack)=>{p=p||{};const cid=String(p.clientId||s.id).slice(0,64);const nick=String(p.nick||'손님').trim().slice(0,16)||'손님';
  if(isBad(nick)){if(typeof ack==='function')ack({ok:false,error:'bad'});return;}
  const bn=banned(cid,ipOf(s),nick);if(bn){if(typeof ack==='function')ack({ok:false,error:'kicked',min:Math.ceil((bn.until-Date.now())/60000)});s.emit('kicked',{min:Math.ceil((bn.until-Date.now())/60000)});setTimeout(()=>s.disconnect(true),200);return;}
  if(nickTaken(nick,cid,s.id)){if(typeof ack==='function')ack({ok:false,error:'nick'});s.emit('nickTaken',nick);return;}
  let prev=null,prevId=null;for(const id in players){if(id!==s.id&&players[id].cid===cid){if(!prev){prev=players[id];prevId=id;}delete players[id];const os=io.sockets.sockets.get(id);if(os)os.disconnect(true);}}
  if(prev){clearTimeout(prev.timer);prev.timer=null;prev.gone=null;}
  const L=p.last&&typeof p.last==='object'?p.last:null,cur=players[s.id]||prev;
  const base=cur?{pos:cur.pos,rot:cur.rot,seat:cur.seat,carry:cur.carry||null,drinks:cur.drinks||[]}
   :L?{pos:Array.isArray(L.pos)&&L.pos.length===3&&L.pos.every(Number.isFinite)?L.pos:[0,0,4],rot:+L.rot||0,seat:typeof L.seat==='string'?L.seat.slice(0,16):null,carry:PICK[L.carry]?L.carry:null,drinks:Array.isArray(L.drinks)?L.drinks.filter(Number.isFinite).slice(-20):[]}
   :{pos:[0,0,4],rot:0,seat:null,carry:null,drinks:[]};
  const re=!!cur;players[s.id]={...(cur||{}),seen:Date.now(),joinedAt:Date.now(),cid,nick,...look(p),...base};
  if(prevId)io.emit('rekey',{old:prevId,id:s.id});io.emit('player',{id:s.id,...pub()[s.id]});
  if(typeof ack==='function')ack(re||L?{ok:true,resume:base}:{ok:true});/* 유예시간이 지나도 앱이 기억한 위치/자리로 복원 */if(!re)io.emit('chat',{sys:true,text:nick+' 님 입장!'});bcOnline(true);});
 s.on('profile',(p,ack)=>{const pl=players[s.id];if(!pl)return;const nn=String(p.nick||pl.nick).trim().slice(0,16)||pl.nick;if(isBad(nn)){if(typeof ack==='function')ack({ok:false,error:'bad'});return;}if(nickTaken(nn,pl.cid,s.id)){if(typeof ack==='function')ack({ok:false,error:'nick'});s.emit('nickTaken',nn);return;}if(typeof ack==='function')ack({ok:true});Object.assign(pl,{nick:nn,...look(p)});io.emit('player',{id:s.id,...pl});});
 s.on('move',m=>{const pl=players[s.id];if(!pl||!m||!Array.isArray(m.pos)||m.pos.length!==3||!m.pos.every(Number.isFinite))return;pl.pos=m.pos;pl.rot=+m.rot||0;pl.dance=(+m.dance|0)%4;dirty.add(s.id);});
 s.on('seat',seat=>{const pl=players[s.id];if(!pl)return;pl.seat=seat;io.emit('seat',{id:s.id,seat});});
 s.emit('glasses',glassPub());
 s.emit('tableUses',usesPub());s.emit('table',tablePub());waiterJobs.forEach(j=>j&&s.emit('waiterJob',j));s.emit('tickerIdle',tickerIdle);s.emit('boards',boardsPub());s.emit('clubDoor',{open:clubOpen});if(rankData)s.emit('ranking',rankData);if(albaJob)s.emit('albaJob',albaJob);
 s.on('drink',type=>{const pl=players[s.id];if(!pl||!pl.seat||!DRINKS.includes(type))return;if(!canDrink(pl.seat,type))return;const n=Date.now();if(n-(pl.lastDrink||0)<2000)return;pl.lastDrink=n;
  pl.drinks=(pl.drinks||[]).filter(x=>n-x<1800000).concat(n).slice(-20);
  if(BAR_Z[pl.seat]!==undefined){delete glasses[pl.seat];io.emit('glasses',glassPub());}const tb=pochaTable(pl.seat);if(tb)useItem(tb,type);io.emit('drink',{id:s.id,type});});
 s.emit('presets',presets);
 s.on('getTicker',(tok,ack)=>{if(typeof ack==='function')ack(isAdmin(tok)?{ok:true,rankUrl}:{ok:false});});
 s.on('setTickerIdle',(d,ack)=>{ack=typeof ack==='function'?ack:()=>{};if(!d||!isAdmin(d.token))return ack({ok:false,err:'관리자만'});tickerIdle=cleanText(String(d.text||'').replace(/\s+/g,' ').trim().slice(0,120));save();io.emit('tickerIdle',tickerIdle);io.emit('boards',boardsPub());ack({ok:true,text:tickerIdle});});
 s.on('setRank',(d,ack)=>{ack=typeof ack==='function'?ack:()=>{};if(!d||!isAdmin(d.token))return ack({ok:false,err:'관리자만'});const u=String(d.url||'').trim().slice(0,300);if(!DON.rankPayload(u))return ack({ok:false,err:'투네이션 ranking 위젯 주소가 아니에요'});
  rankUrl=u;rankData=null;save();io.emit('ranking',null);startRank();ack({ok:true,url:rankUrl});});
 s.on('setClubDoor',(d,ack)=>{ack=typeof ack==='function'?ack:()=>{};if(!d||!isAdmin(d.token)||typeof d.open!=='boolean')return ack({ok:false,err:'관리자만'});clubOpen=d.open;save();io.emit('clubDoor',{open:clubOpen,by:true});ack({ok:true,open:clubOpen});});
 s.on('setBoards',(d,ack)=>{ack=typeof ack==='function'?ack:()=>{};if(!d||!isAdmin(d.token))return ack({ok:false,err:'관리자만'});const was={...boards};
  if(typeof d.ticker==='boolean')boards.ticker=d.ticker;if(typeof d.rank==='boolean')boards.rank=d.rank;save();if(was.rank!==boards.rank)startRank();io.emit('boards',boardsPub());ack({ok:true,boards});});
 s.on('setPresets',(d,ack)=>{ack=typeof ack==='function'?ack:()=>{};if(!d||!isAdmin(d.token)||!Array.isArray(d.list)||d.list.length!==3)return ack({ok:false,err:'관리자만'});
  const L=d.list.map(p=>({name:String(p&&p.name||'').trim().slice(0,20),url:String(p&&p.url||'').trim().slice(0,300)}));if(L.some(p=>!p.name||!parseYT(p.url).list))return ack({ok:false,err:'이름과 유튜브 재생목록 주소(list=)를 확인해 주세요'});
  presets=L;save();io.emit('presets',presets);ack({ok:true});});
 s.on('loadPreset',async(d,ack)=>{ack=typeof ack==='function'?ack:()=>{};if(!d||!isAdmin(d.token)||!presets[d.i])return ack({ok:false,err:'관리자만'});const P=presets[d.i],list=parseYT(P.url).list;
  let items=[];try{items=await ytPlaylistFull(list);}catch(e){return ack({ok:false,err:'재생목록을 읽지 못했어요: '+e.message});}if(!items.length)return ack({ok:false,err:'재생목록이 비었거나 비공개예요'});
  for(const t of music.playlist)if(t.type==='mp3')fs.unlink(path.join(UP,t.id),()=>{});const stamp=Date.now();
  music.playlist=items.map((it,i)=>{if(it.dur)durations[it.id]=it.dur;return {type:'yt',id:'yt_'+it.id+'_'+stamp+'_'+i,videoId:it.id,title:String(it.title||'YouTube').slice(0,200),by:'🎛 '+P.name,...(it.dur?{dur:it.dur}:{})};});
  Object.assign(music,{index:0,playing:true,startedAt:Date.now(),pausedAt:0,isDefault:false,cleared:false,shuffle:false});played=new Set();
  io.emit('chat',{sys:true,text:`🎛 재생목록을 '${P.name}' (${items.length}곡)으로 바꿨어요`});broadcastMusic();ack({ok:true,count:items.length});
  if(items.some(it=>!it.title))(async()=>{for(const t of music.playlist){if(t.title==='YouTube'){t.title=await ytTitle(t.videoId);}}broadcastMusic();})();});
 s.on('order',(kind,ack)=>{ack=typeof ack==='function'?ack:()=>{};const pl=players[s.id];if(!pl)return ack({ok:false,err:'입장 먼저'});if(!ORDER_ANJU.includes(kind)&&!ORDER_DRINK.includes(kind))return ack({ok:false,err:'없는 메뉴'});
  const tb=pochaTable(pl.seat);if(!tb||tb[0]!=='Y')return ack({ok:false,err:'포차 테이블에 앉아야 주문할 수 있어요'});const n=Date.now();if(n-(pl.lastOrder||0)<700)return ack({ok:false,err:'천천히 주문해 주세요'});
  if(albaQ.filter(o=>o.by===s.id).length+(albaJob&&!albaJob.done&&albaJob.by===s.id?1:0)>=3)return ack({ok:false,err:'주문은 3개까지 기다릴 수 있어요'});
  if(tables[tb].items.filter(i=>!i).length<=albaPending(tb))return ack({ok:false,err:'테이블이 꽉 찼어요'});pl.lastOrder=n;const o={id:++albaSeq,by:s.id,nick:pl.nick,table:tb,kind};albaQ.push(o);ack({ok:true,id:o.id,queue:albaQ.length+(albaJob?1:0)});io.emit('albaQueue',albaQ.length);albaNext();});
 s.on('eat',kind=>{const pl=players[s.id];if(!pl||!FOODS.includes(kind))return;const tb=pochaTable(pl.seat);if(!tb||!tables[tb].items.some(i=>i&&i.k===kind))return;const n=Date.now();if(n-(pl.lastEat||0)<2000)return;pl.lastEat=n;useItem(tb,kind);io.emit('eat',{id:s.id,kind});});
 s.on('serve',q=>{const pl=players[s.id];if(!pl||pl.seat)return;const kind=q&&q.kind==='cocktail'?'cocktail':'whiskey';const x=+(q&&q.x),z=+(q&&q.z);if(!(x>=BZ.x0-.2&&x<=BZ.x1+.2&&z>=BZ.z0-.2&&z<=BZ.z1+.2))return;
  const n=Date.now();if(n-(pl.lastServe||0)<3000)return;pl.lastServe=n;s.broadcast.emit('pour',{id:s.id,kind});
  const seated=Object.values(players).filter(o=>o.seat&&BAR_Z[o.seat]!==undefined&&!glasses[o.seat]).map(o=>o.seat);
  const cand=seated.length?seated:Object.keys(BAR_Z).filter(k=>!glasses[k]);if(!cand.length)return;
  cand.sort((a,b)=>Math.abs(BAR_Z[a]-z)-Math.abs(BAR_Z[b]-z));const seat=cand[0];
  setTimeout(()=>{glasses[seat]={t:Date.now(),type:kind};io.emit('glasses',glassPub());},1400);});
 s.on('pickup',kind=>{const pl=players[s.id];if(!pl||pl.seat)return;const src=PICK[kind];if(!src)return;const p=pl.pos||[0,0,0];if(Math.hypot(p[0]-src.x,p[2]-src.z)>src.r)return;
  const n=Date.now();if(n-(pl.lastAct||0)<500)return;pl.lastAct=n;pl.carry=kind;io.emit('carry',{id:s.id,kind});});
 s.on('place',()=>{const pl=players[s.id];if(!pl||!pl.carry)return;const p=pl.pos||[0,0,0];let best=pochaTable(pl.seat),bd=1e9;if(!best)for(const k in TABLES){const t=TABLES[k],d=Math.hypot(p[0]-t[0],p[2]-t[1]);if(d<(t[2]||1.9)&&d<bd){bd=d;best=k;}}
  if(!best)return;const n=Date.now();if(n-(pl.lastAct||0)<500)return;pl.lastAct=n;const tb=tables[best];const fs=tb.items.indexOf(null);if(fs<0){s.emit('chat',{sys:true,text:'테이블이 꽉 찼어요 (최대 '+MAX_ITEMS+'개)'});return;}tb.items[fs]={k:pl.carry,u:USES};tb.t=n;pl.carry=null;io.emit('carry',{id:s.id,kind:null});(io.emit('tableUses',usesPub()),io.emit('table',tablePub()));});
 s.on('chat',text=>{const pl=players[s.id];if(!pl)return;text=String(text).slice(0,200);if(!text.trim())return;if(text.includes(ADMIN_PW)&&/^\s*(\/?(admin|관리자)\s*)?\d+\s*$/i.test(text)||text.trim()===ADMIN_PW){s.emit('chat',{sys:true,text:'🔒 비밀번호는 채팅에 보내지 않았어요. 🔑 버튼으로 로그인하세요'});return;}text=cleanText(text);
  const t=Date.now();chatHist.push({nick:pl.nick,text,t});if(chatHist.length>50)chatHist.shift();io.emit('chat',{id:s.id,nick:pl.nick,text,t});});
 s.on('duration',d=>{const t=music.playlist[d&&d.index];const sec=+(d&&d.sec);if(!t||!(sec>1&&sec<36000))return;const k=t.type==='yt'?t.videoId:t.id;if(durations[k])return;durations[k]=sec;broadcastMusic();});
 s.on('music',cmd=>{if(!cmd||!isAdmin(cmd.token)&&cmd.type!=='ended'&&cmd.type!=='error')return;const now=Date.now();
  if(cmd.type==='play'&&!music.playing&&music.index>=0){music.startedAt=now-music.pausedAt;music.playing=true;}
  else if(cmd.type==='pause'&&music.playing){music.pausedAt=now-music.startedAt;music.playing=false;}
  else if(cmd.type==='skip'||cmd.type==='ended'||cmd.type==='error'){ if(cmd.type!=='skip'&&cmd.index!==music.index)return;
   if(cmd.type==='error')io.emit('chat',{sys:true,text:'⚠ 재생할 수 없는 곡이라 다음 곡으로 넘어가요: '+(music.playlist[music.index]||{}).title});
   if(cmd.type==='ended'&&(Date.now()-music.startedAt<3000||durOf(music.playlist[music.index])))return; // 길이를 알면 서버 시계가 넘김
   if(music.playlist.length){music.index=nextIndex();music.startedAt=now;music.pausedAt=0;music.playing=true;}}
  else if(cmd.type==='select'&&music.playlist[cmd.index]){music.index=cmd.index;music.startedAt=now;music.pausedAt=0;music.playing=true;}
  else if(cmd.type==='shuffleToggle'){music.shuffle=!music.shuffle;played=new Set();}
  else if(cmd.type==='shuffleNow'&&music.playlist.length>1){const cur=music.playlist[music.index];const rest=music.playlist.filter(t=>t!==cur);
   for(let i=rest.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}music.playlist=cur?[cur,...rest]:rest;music.index=cur?0:music.index;}
  else if(cmd.type==='clearAll'){for(const t of music.playlist)if(t.type==='mp3')fs.unlink(path.join(UP,t.id),()=>{});music.playlist=[];music.index=-1;music.playing=false;music.startedAt=0;music.pausedAt=0;music.isDefault=false;music.cleared=true;played=new Set();io.emit('chat',{sys:true,text:'🗑 관리자가 재생목록을 모두 비웠어요'});}
  else if(cmd.type==='delete'&&music.playlist[cmd.index]){const [t]=music.playlist.splice(cmd.index,1);if(t.type==='mp3')fs.unlink(path.join(UP,t.id),()=>{});
   if(cmd.index<music.index)music.index--;else if(cmd.index===music.index){if(!music.playlist.length){music.index=-1;music.playing=false;}else{music.index%=music.playlist.length;music.startedAt=now;music.pausedAt=0;}}}
  broadcastMusic();});
 s.on('disconnect',()=>{const pl=players[s.id];if(!pl||s.data.kicked)return;pl.gone=Date.now();clearTimeout(pl.timer);
  pl.timer=setTimeout(()=>{if(players[s.id]!==pl||!pl.gone)return;delete players[s.id];io.emit('leave',s.id);io.emit('chat',{sys:true,text:pl.nick+' 님 퇴장'});bcOnline();},GRACE_MS);bcOnline();});
});
server.listen(PORT,'0.0.0.0',()=>{tick();ensureDefault();
 const ext=process.env.RENDER_EXTERNAL_URL;if(ext)setInterval(()=>fetch(ext.replace(/\/$/,'')+'/health').catch(()=>{}),10*60*1000);console.log('ERRDAY 7080 나이트 서버: http://localhost:'+PORT);console.log('관리자 로그인: 사용 가능 (고정 비밀번호)');
 const n=require('os').networkInterfaces();for(const k in n)for(const a of n[k])if(a.family==='IPv4'&&!a.internal)console.log('같은 Wi-Fi 친구 접속: http://'+a.address+':'+PORT);});
