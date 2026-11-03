const express=require('express'),http=require('http'),path=require('path'),fs=require('fs'),multer=require('multer');
const {Server}=require('socket.io');
const ROLLER=require('./public/roller.js');const ARCADE=require('./public/arcade.js');const SPORTS=require('./public/sports.js');
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
let clubOpen=true,rollerOpen=true;let rankUrl=DON.RANK_URL,rankData=null,rankWs=null,boards={ticker:true,rank:true};
const boardsPub=()=>({...boards,idle:tickerIdle});
function startRank(){if(rankWs)rankWs.stop();rankWs=process.env.TICKER_OFF||!boards.rank?null:DON.startRank({url:rankUrl,clean:t=>cleanText(t),onRank:r=>{rankData=r;save();io.emit('ranking',rankData);},log:m=>console.log(m)});}
function startTicker(){if(donTicker)donTicker.stop();donTicker=process.env.TICKER_OFF||!boards.ticker?null:DON.start({url:tickerUrl,clean:t=>cleanText(t),onDonation:(l,ds)=>{donList=[...ds,...donList].slice(0,10);save();io.emit('donations',donList);},log:m=>console.log(m)});}
const STATE=process.env.STATE_FILE||path.join(__dirname,'data','state.json');
const durations={}; // videoId 또는 mp3 id -> 초 (클라이언트가 알려줌)
const durOf=t=>t&&(t.dur||durations[t.type==='yt'?t.videoId:t.id]);
const {clean:cleanText,isBad}=require('./filter');
const STYLES=['basic','suit','disco','hanbok','aerobic'],HEX=/^#[0-9a-fA-F]{6}$/;const LOOKS=require('./public/looks.js');const look=p=>{const r=LOOKS.resolve(p);return{gender:r.gender,style:r.style,outfit:HEX.test(p.outfit)?p.outfit:'',top:r.top,bottom:r.bottom,acc:r.acc,hair:r.hair,face:r.face,beard:r.beard,...ROLLER.colours(p),skin:HEX.test(p.skin)?p.skin:''};};
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
function save(){try{fs.mkdirSync(path.dirname(STATE),{recursive:true});fs.writeFileSync(STATE,JSON.stringify({music,durations,played:[...played],presets,tickerUrl,donList,tickerIdle,rankUrl,rankData,boards,clubOpen,rollerOpen}));}catch(e){}}
function load(){try{const j=JSON.parse(fs.readFileSync(STATE,'utf8'));Object.assign(music,j.music);Object.assign(durations,j.durations||{});played=new Set(j.played||[]);if(Array.isArray(j.presets)&&j.presets.length===3)presets=j.presets;if(typeof j.tickerUrl==='string'&&DON.payloadOf(j.tickerUrl))tickerUrl=j.tickerUrl;if(typeof j.rankUrl==='string'&&DON.rankPayload(j.rankUrl))rankUrl=j.rankUrl;if(j.rankData&&Array.isArray(j.rankData.list))rankData=j.rankData;if(j.clubOpen===false)clubOpen=false;if(j.rollerOpen===false)rollerOpen=false;if(j.boards)boards={ticker:j.boards.ticker!==false,rank:j.boards.rank!==false};if(typeof j.tickerIdle==='string')tickerIdle=j.tickerIdle.slice(0,120);if(Array.isArray(j.donList))donList=j.donList.slice(0,10);
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
const DRINKS=['soju','beer','whiskey','cocktail','cola','cider'];
const TABLES={Y1:[-7.6,16.4],Y2:[-3,16.4],Y3:[-7.6,20.2],Y4:[-3,20.2],Y5:[2.2,19.6],T1:[-7,-4,2.4],T2:[-7,2,2.4],T3:[-7,7.5,2.4],T4:[4.5,6,2.4],T5:[0,8.5,2.4],T6:[-2.5,3.5,2.4]};for(const t of ROLLER.tables)TABLES[t.id]=[t.x,t.z,1.8];const tables={};for(const k in TABLES)tables[k]={items:[null,null,null,null],t:0};
const PICK={soju:{x:-0.7,z:21.5,r:1.8},beer:{x:-0.7,z:21.5,r:1.8}};for(const f of ['dakbal','kkom','fish','squid'])PICK[f]={x:0.8,z:16.0,r:2.4};PICK.chicken={x:-11.6,z:SPORTS.SHOPS.chicken.z,r:2.4};PICK.hoe={x:-11.6,z:SPORTS.SHOPS.hoe.z,r:2.4};
const usesPub=()=>{const o={};for(const k in tables)o[k]=tables[k].items.map(i=>i?i.u:0);return o;};const tablePub=()=>{const o={};for(const k in tables)o[k]=tables[k].items.map(i=>i?i.k:null);return o;};
const FOODS=['dakbal','kkom','fish','squid','chicken','hoe','fruit','ramen','tteokbokki'],MAX_ITEMS=4,USES=6; /* 음식·술 한 개당 6번 */
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
const ALBA_SRC=k=>k==='soju'||k==='beer'?[-0.7,20.7]:k==='chicken'?[-10.5,SPORTS.SHOPS.chicken.z]:k==='hoe'?[-10.5,SPORTS.SHOPS.hoe.z]:[0.8,16.9];
const albaWorkers={pocha:{queue:[],job:null},roller:{queue:[],job:null}};
let albaSeq=0;
function albaPending(tb){const worker=albaWorkers[tb[0]==='R'?'roller':'pocha'];return worker.queue.filter(o=>o.table===tb).length+(worker.job&&worker.job.table===tb&&!worker.job.done?1:0);}
function albaNext(venue='pocha'){
 const worker=albaWorkers[venue];if(worker.job||!worker.queue.length)return;
 const roller=venue==='roller',o=worker.queue.shift(),n=Date.now(),src=roller?ROLLER.STAFF.source:ALBA_SRC(o.kind),c=TABLES[o.table];
 const home=roller?ROLLER.STAFF.home:ALBA_HOME,speed=roller?ALBA_SP*1.8:ALBA_SP;
 const dx=src[0]-c[0],dz=src[1]-c[1],l=Math.hypot(dx,dz)||1;
 const to=roller?ROLLER.tables.find(t=>t.id===o.table).service:[+(c[0]+dx/l).toFixed(2),+(c[1]+dz/l).toFixed(2)];
 const ms=(a,b)=>Math.round(Math.hypot(a[0]-b[0],a[1]-b[1])/speed*1000);
 const j={...o,t0:n,home,src,to,c:[c[0],c[1]],leg1:ms(home,src),pick:ALBA_PICK,leg2:ms(src,to),place:ALBA_PLACE,leg3:ms(to,home)};
 if(roller){
  j.route2=[src,[17,to[1]],to];j.route3=[to,[17,to[1]],[17,32],home];
  j.leg2=j.route2.slice(1).reduce((sum,p,i)=>sum+ms(j.route2[i],p),0);
  j.leg3=j.route3.slice(1).reduce((sum,p,i)=>sum+ms(j.route3[i],p),0);
 }
 worker.job=j;io.emit(roller?'rollerAlbaJob':'albaJob',j);
 setTimeout(()=>{
  const t=tables[j.table],i=t.items.indexOf(null);j.done=true;
  if(i>=0){t.items[i]={k:j.kind,u:USES};t.t=Date.now();io.emit('tableUses',usesPub());io.emit('table',tablePub());}
  io.emit('albaDone',{id:j.id,by:j.by,ok:i>=0,kind:j.kind,table:j.table});
 },j.leg1+j.pick+j.leg2+j.place/2).unref();
 setTimeout(()=>{worker.job=null;albaNext(venue);},j.leg1+j.pick+j.leg2+j.place+(roller?j.leg3:0)).unref();
}
if(!process.env.WAITER_OFF)setInterval(waiterTick,+process.env.WAITER_TICK_MS||4000).unref();
const pochaTable=seat=>{const m=/^([YTR]\d)-/.exec(seat||'');return m&&tables[m[1]]?m[1]:null;};
function canDrink(seat,type){if(BAR_Z[seat]!==undefined)return !!glasses[seat]&&(glasses[seat].type||'whiskey')===type;if(type==='whiskey'||type==='cocktail')return false;const tb=pochaTable(seat);if(tb)return tables[tb].items.some(i=>i&&i.k===type);return false;}
setInterval(()=>{const n=Date.now();let ch=false;for(const k in tables)if(tables[k].items.some(Boolean)&&n-tables[k].t>1200000){tables[k].items=[null,null,null,null];ch=true;}if(ch)(io.emit('tableUses',usesPub()),io.emit('table',tablePub()));},10000).unref();
setInterval(()=>{const n=Date.now();let ch=false;for(const k in glasses)if(n-glasses[k].t>60000){delete glasses[k];ch=true;}if(ch)io.emit('glasses',glassPub());},2000).unref();
// 위치는 이동마다 바로 보내지 않고 0.1초마다 바뀐 사람만 묶어서 한 번에 방송 (N² 메시지 → 틱당 1개)
const dirty=new Set();const r2=v=>Math.round(v*100)/100;
function ejectClubPlayer(id){
 const pl=players[id];if(!pl)return;
 pl.pos=[-3.3,0,14.5];pl.seat=null;pl.dance=0;dirty.add(id);
 io.to(id).emit('accessPosition',{pos:pl.pos,rollerSkates:false});io.emit('seat',{id,seat:null});
}
setInterval(()=>{if(!dirty.size)return;const a=[];for(const id of dirty){const p=players[id];if(p&&!p.gone)a.push(id,r2(p.pos[0]),r2(p.pos[1]),r2(p.pos[2]),r2(p.rot),p.dance|0);}dirty.clear();if(a.length)io.volatile.emit('m',a);},100).unref();
const bans=[];const BAN_MS=+process.env.BAN_MS||600000;const ipOf=so=>String(so.handshake.headers['x-forwarded-for']||so.handshake.address||'').split(',')[0].trim();
const banned=(cid,ip,nick)=>{const n=Date.now();for(let i=bans.length-1;i>=0;i--)if(bans[i].until<n)bans.splice(i,1);return bans.find(b=>b.cid===cid||b.nick===nick||(process.env.BAN_IP==='1'&&ip&&b.ip===ip));};
/* 🎯 다트: 판마다 하이스코어(3R/8R), 조준 좌표 + 손떨림, 서버가 판정 */
const DG=require('./dartgame');const dartGames=[0,1,2].map(()=>DG.newGame(3)),dartWins={},dartRecs=[[],[],[]]; /* 판마다 끝난 게임 기록만 */
const dartTopR=R=>dartRecs.flat().filter(r=>r.rounds===R).sort((p,q)=>q.score-p.score||p.t-q.t).slice(0,6).map(r=>({nick:r.nick,total:r.score,rounds:r.rounds}));const dartTop=()=>({r3:dartTopR(3),r8:dartTopR(8)}); /* 하이스코어판: 오른쪽 3R, 왼쪽 8R — 끝난 게임 기록 하나하나(합산 아님) 상위 6 */
const dartEmit=(b,extra)=>io.emit('dartState',{b,g:DG.pub(dartGames[b]),recs:dartRecs[b],top:dartTop(),...(extra||{})});
/* 🎱 당구: 서버가 물리 계산(결정적) → 모두에게 샷(각도·세기·결과) 보내 같은 장면 재생 */
const POOL=require('./public/pool.js');const poolMax=()=>pool.kind==='carom'?2:4;const POOL_POS=[[-9,-7.6],[-9,-10.4]],CAROM_GOAL=+(process.env.CAROM_GOAL||10);const pools=['pool','carom'].map(kind=>({kind,balls:kind==='carom'?POOL.rackCarom():POOL.rack(),players:[],turn:0,groups:{},scores:{},queue:[],forfeits:[],shots:0,votes:{},deadline:0,busy:0,msg:'',over:null,t:Date.now()}));let pool=pools[0];const useT=t=>{t=t===1?1:0;pool=pools[t];return t;};
const poolPub=()=>({t:pools.indexOf(pool),kind:pool.kind,mode:pool.mode||(pool.kind==='carom'?'4':'8'),max:poolMax(),goal:CAROM_GOAL,balls:pool.balls,players:pool.players.map(p=>({id:p.id,nick:p.nick})),turn:pool.turn,scores:pool.scores,groups:pool.groups,bih:!!pool.bih,queue:pool.queue.map(q=>({id:q.id,nick:q.nick})),shots:pool.shots,forfeits:pool.forfeits,votes:Object.keys(pool.votes),left:pool.deadline?Math.max(0,pool.deadline-Date.now()):0,msg:pool.msg,over:pool.over});
function poolReset(keep){pool.balls=pool.kind==='carom'?POOL.rackCarom(pool.mode):POOL.rack();pool.turn=0;pool.scores={};pool.groups={};pool.bih=false;pool.forfeits=[];pool.shots=0;pool.votes={};pool.deadline=Date.now()+POOL_TURN;pool.msg='';pool.over=null;if(!keep)pool.players=[];}
function poolLeave(id){let any=false;for(const P of pools){pool=P;if(poolLeave1(id)){any=true;io.emit('poolState',poolPub());}}return false&&any;}
function poolLeave1(id){const qi=pool.queue.findIndex(p=>p.id===id);if(qi>=0)pool.queue.splice(qi,1);const i=pool.players.findIndex(p=>p.id===id);if(i<0)return qi>=0;const lf=pool.players[i];if(!pool.over)pool.forfeits.push({nick:lf.nick,score:pool.scores[lf.id]||0});pool.players.splice(i,1);if(pool.players.length<2){const o=pool.players[0];if(o&&!pool.over){pool.over={win:o.nick,forfeit:lf.nick};pool.deadline=0;pool.msg=`🏳 ${lf.nick} 기권패 · 🏆 ${o.nick} 우승`;io.emit('poolWin',poolPub());const P0=pool;setTimeout(()=>{pool=P0;if(pool.over&&pool.over.forfeit===lf.nick){poolNext(pool.players.slice());io.emit('poolState',poolPub());}},6000);}else if(!o)poolNext([]);}else{if(pool.turn>i)pool.turn--;pool.turn%=pool.players.length;pool.deadline=Date.now()+POOL_TURN;delete pool.votes[lf.id];pool.msg=`🏳 ${lf.nick} 기권패 · 차례: ${pool.players[pool.turn].nick}`;}return true;}
const poolInv={},POOL_TURN=+(process.env.POOL_TURN_MS||15000);
setInterval(()=>{for(const P of pools){if(P.players.length<2||P.over||!P.deadline||Date.now()<P.deadline||Date.now()<P.busy)continue;pool=P;const was=P.players[P.turn];P.turn=(P.turn+1)%P.players.length;P.bih=false;P.deadline=Date.now()+POOL_TURN;P.msg=`⏰ ${was.nick} 시간 초과 → 차례: ${P.players[P.turn].nick}`;io.emit('poolState',poolPub());}},500);
function poolNext(prev){const M=poolMax(),q=pool.queue.splice(0,M);let pl=q;if(q.length===1)pl=q.concat((prev||[]).filter(p=>players[p.id]&&!q.some(x=>x.id===p.id))).slice(0,M);poolReset();if(pl.length>=2){pool.players=pl.map(p=>({id:p.id,nick:p.nick}));pool.msg=`🎱 다음 게임 시작! 차례: ${pool.players[0].nick}`;for(const p of pool.players)io.to(p.id).emit('poolStart',{t:0});}else pool.queue.unshift(...q);}/* targetId -> {from,t} */
function caromShot(id,a,p,sx,sy){const pl=pool.players[pool.turn];if(!pl||pl.id!==id)return{ok:false,err:'내 차례가 아니에요'};if(pool.over)return{ok:false,err:'게임 끝'};if(Date.now()<pool.busy)return{ok:false,err:'공이 아직 움직여요'};
 a=+a;p=+p;if(!Number.isFinite(a)||!Number.isFinite(p))return{ok:false};p=Math.max(.05,Math.min(1,p));const cue=pool.turn%2,opp=1-cue;const before=POOL.clone(pool.balls);const r=POOL.simulate(before,a,p,{carom:true,cue,sx,sy});
 let keep=false,msg='',over=null;const sc=pool.scores;
 if(pool.mode!=='3'&&r.hits.includes(opp)){sc[id]=Math.max(0,(sc[id]||0)-1);msg=`❌ ${pl.nick} 상대 공 맞힘 (파울 -1)`;}
 else if(pool.mode==='3'){if(r.hits.includes(opp)&&r.hits.includes(2)&&r.c2>=3){sc[id]=(sc[id]||0)+1;keep=true;msg=`👍 ${pl.nick} 3쿠션 성공 +1 (${sc[id]}점) · 한 번 더!`;if(sc[id]>=CAROM_GOAL){over={win:pl.nick};msg=`🏆 ${pl.nick} ${CAROM_GOAL}점 달성! 우승`;}}else msg=r.hits.length>=2?`${pl.nick} 쿠션 ${r.c2}번 (3번 필요)`:'';}
 else if(r.hits.includes(2)&&r.hits.includes(3)){sc[id]=(sc[id]||0)+1;keep=true;msg=`👍 ${pl.nick} +1 (${sc[id]}점) · 한 번 더!`;if(sc[id]>=CAROM_GOAL){over={win:pl.nick};msg=`🏆 ${pl.nick} ${CAROM_GOAL}점 달성! 우승`;}}
 pool.balls=r.balls;if(!keep&&!over)pool.turn=(pool.turn+1)%pool.players.length;if(!over&&!keep)msg=(msg?msg+' · ':'')+`다음: ${pool.players[pool.turn].nick}`;
 pool.msg=msg;pool.over=over;pool.shots++;pool.t=Date.now();pool.busy=Date.now()+r.steps/240*1000+300;pool.deadline=over?0:pool.busy+POOL_TURN;
 return{ok:true,shot:{by:id,nick:pl.nick,a,p,before,cue,carom:true,sx,sy},msg,over};}
function eightShot(id,a,p,sx,sy){const pl=pool.players[pool.turn];if(!pl||pl.id!==id)return{ok:false,err:'내 차례가 아니에요'};if(pool.over)return{ok:false,err:'게임 끝'};if(Date.now()<pool.busy)return{ok:false,err:'공이 아직 움직여요'};
 a=+a;p=+p;if(!Number.isFinite(a)||!Number.isFinite(p))return{ok:false};p=Math.max(.05,Math.min(1,p));const before=POOL.clone(pool.balls);const r=POOL.simulate(before,a,p,{sx,sy});
 const team=i=>i%2,T=team(pool.turn),G=pool.groups;const pk=r.pocketed,scratch=pk.includes(0),eight=pk.includes(8),objs=pk.filter(n=>n!==0&&n!==8);
 const names=t=>pool.players.filter((q,i)=>team(i)===t).map(q=>q.nick).join(', ');const left=g=>r.balls.filter(o=>!o.in&&POOL.kind(o.n)===g).length;
 if(G[T]===undefined&&objs.length&&!scratch&&pool.shots>0){const g=POOL.kind(objs[0]);G[T]=g;G[1-T]=g==='solid'?'stripe':'solid';}
 const mine=G[T];const own=objs.filter(n=>mine?POOL.kind(n)===mine:true);for(const q of pool.players)pool.scores[q.id]=pool.scores[q.id]||0;pool.scores[id]+=own.length;
 let keep=!scratch&&own.length>0,msg='',over=null;const gname=g=>g==='solid'?'솔리드(1~7)':'스트라이프(9~15)';
 if(eight){const cleared=mine&&left(mine)===0&&!scratch;if(cleared){over={win:names(T)};msg=`🎱 8번 마무리! 🏆 ${over.win} 우승`;}else{over={win:names(1-T)||'없음'};msg=`💥 ${pl.nick} 8번 공 먼저 넣음 → 패배 · 🏆 ${over.win} 우승`;}}
 else if(scratch)msg='⚠️ 파울: 흰 공 빠짐';else if(r.firstHit===null)msg='⚠️ 파울: 아무 공도 못 맞힘';else if(own.length)msg=`👍 ${pl.nick} ${own.length}개 넣음 · 한 번 더!`;
 if(!over&&G[T]&&objs.length&&own.length===objs.length&&!msg.includes('내 공'))msg+=` (내 공: ${gname(G[T])})`;
 pool.balls=r.balls;if(scratch&&!over)POOL.spotCue(pool.balls);if(!keep&&!over)pool.turn=(pool.turn+1)%pool.players.length;
 if(!over&&!keep&&!scratch)msg=(msg?msg+' · ':'')+`다음: ${pool.players[pool.turn].nick}`;
 pool.bih=!over&&(scratch||r.firstHit===null);if(pool.bih)msg+=' · 🖐 '+pool.players[pool.turn].nick+' 흰 공 자유 배치';pool.msg=msg;pool.over=over;pool.shots++;pool.t=Date.now();pool.busy=Date.now()+r.steps/240*1000+300;pool.deadline=over?0:pool.busy+POOL_TURN;
 return{ok:true,shot:{by:id,nick:pl.nick,a,p,before,sx,sy},msg,over};}
const STRAIGHT_GOAL=+(process.env.STRAIGHT_GOAL||8);
function straightShot(id,a,p,sx,sy){const pl=pool.players[pool.turn];if(!pl||pl.id!==id)return{ok:false,err:'내 차례가 아니에요'};if(pool.over)return{ok:false,err:'게임 끝'};if(Date.now()<pool.busy)return{ok:false,err:'공이 아직 움직여요'};
 a=+a;p=+p;if(!Number.isFinite(a)||!Number.isFinite(p))return{ok:false};p=Math.max(.05,Math.min(1,p));const before=POOL.clone(pool.balls);const r=POOL.simulate(before,a,p,{sx,sy});
 const pk=r.pocketed,scratch=pk.includes(0),objs=pk.filter(n=>n!==0),foul=scratch||r.firstHit===null;const sc=pool.scores;let keep=false,msg='',over=null;
 if(foul){sc[id]=Math.max(0,(sc[id]||0)-1);msg=`❌ ${pl.nick} 파울 (${scratch?'흰 공 빠짐':'아무 공도 못 맞힘'}) -1`;}
 else if(objs.length){sc[id]=(sc[id]||0)+objs.length;keep=true;msg=`👍 ${pl.nick} +${objs.length} (${sc[id]}점) · 한 번 더!`;}
 pool.balls=r.balls;if(scratch)POOL.spotCue(pool.balls);const left=pool.balls.filter(o=>!o.in&&o.n!==0).length;
 if((sc[id]||0)>=STRAIGHT_GOAL){over={win:pl.nick};msg=`🏆 ${pl.nick} ${STRAIGHT_GOAL}점 달성! 우승`;}
 else if(!left){const best=Math.max(...pool.players.map(q=>sc[q.id]||0));over={win:pool.players.filter(q=>(sc[q.id]||0)===best).map(q=>q.nick).join(', ')};msg=`공이 다 들어감 · 🏆 ${over.win} 우승 (${best}점)`;}
 if(!keep&&!over)pool.turn=(pool.turn+1)%pool.players.length;if(!over&&!keep)msg=(msg?msg+' · ':'')+`다음: ${pool.players[pool.turn].nick}`;
 pool.bih=!over&&(foul);if(pool.bih)msg+=' · 🖐 '+pool.players[pool.turn].nick+' 흰 공 자유 배치';pool.msg=msg;pool.over=over;pool.shots++;pool.t=Date.now();pool.busy=Date.now()+r.steps/240*1000+300;pool.deadline=over?0:pool.busy+POOL_TURN;
 return{ok:true,shot:{by:id,nick:pl.nick,a,p,before,sx,sy},msg,over};}
function poolShot(id,a,p,sx,sy){sx=Math.max(-1,Math.min(1,+sx||0));sy=Math.max(-1,Math.min(1,+sy||0));if(pool.kind==='carom')return caromShot(id,a,p,sx,sy);if(pool.mode==='s')return straightShot(id,a,p,sx,sy);return eightShot(id,a,p,sx,sy);const pl=pool.players[pool.turn];if(!pl||pl.id!==id)return{ok:false,err:'내 차례가 아니에요'};if(pool.over)return{ok:false,err:'게임 끝'};if(Date.now()<pool.busy)return{ok:false,err:'공이 아직 움직여요'};
 a=+a;p=+p;if(!Number.isFinite(a)||!Number.isFinite(p))return{ok:false};p=Math.max(.05,Math.min(1,p));const before=POOL.clone(pool.balls);const r=POOL.simulate(before,a,p,{sx,sy});
 const pk=r.pocketed,scratch=pk.includes(0),eight=pk.includes(8),objs=pk.filter(n=>n!==0&&n!==8);pool.scores[id]=(pool.scores[id]||0)+objs.length;
 let keep=!scratch&&objs.length>0,msg='',over=null;
 if(eight){const rest=r.balls.filter(o=>!o.in&&o.n!==0&&o.n!==8).length;const early=rest>0||scratch;
  const cand=pool.players.filter(q=>!(early&&q.id===id));const best=Math.max(...cand.map(q=>pool.scores[q.id]||0),0);const win=cand.filter(q=>(pool.scores[q.id]||0)===best).map(q=>q.nick);
  over={win:win.join(', ')||pl.nick};msg=(early?`🎱 ${pl.nick} 8번 공 먼저 넣음 → 탈락! `:`🎱 8번 마무리! `)+`🏆 ${over.win} 승리 (${best}개)`;}
 else if(scratch)msg='⚠️ 흰 공 빠짐! 다시 놓고 차례 넘김';else if(objs.length)msg=`👍 ${pl.nick} ${objs.length}개 넣음 · 한 번 더!`;
 pool.balls=r.balls;if(scratch&&!over)POOL.spotCue(pool.balls);if(!keep&&!over)pool.turn=(pool.turn+1)%pool.players.length;
 if(!over&&!keep&&!scratch)msg=`다음: ${pool.players[pool.turn].nick}`;
 pool.msg=msg;pool.over=over;pool.shots++;pool.t=Date.now();pool.busy=Date.now()+r.steps/240*1000+300;pool.deadline=over?0:pool.busy+POOL_TURN;
 return{ok:true,shot:{by:id,nick:pl.nick,a,p,before,sx,sy},msg,over};}
io.on('connection',s=>{
 [0,1,2].forEach(b=>s.emit('dartState',{b,g:DG.pub(dartGames[b]),recs:dartRecs[b],top:dartTop()}));
 const bOf=v=>Math.max(0,Math.min(2,v|0)),A=f=>typeof f==='function'?f:()=>{};
 s.on('dartNew',(d,ack)=>{ack=A(ack);const pl=players[s.id];if(!pl||!d)return ack({ok:false});const b=bOf(d.b),g=dartGames[b],R=d.rounds===8?8:3;
  if(g.rounds===R){g.players=g.players.filter(p=>p.id!==s.id);g.players.push({id:s.id,nick:pl.nick,score:0,round:1,thrown:0});dartEmit(b);return ack({ok:true});} /* 내 기록만 새로 */
  if(g.players.some(p=>p.id!==s.id)&&Date.now()-g.t<180000)return ack({ok:false,err:'다른 사람이 이 판에서 게임 중이에요'});dartGames[b]=DG.newGame(R);dartGames[b].players.push({id:s.id,nick:pl.nick,score:0,round:1,thrown:0});dartEmit(b);ack({ok:true});});
 s.on('dart',(d,ack)=>{ack=A(ack);const pl=players[s.id];if(!pl||!d)return ack({ok:false});const now=Date.now();if(now-(pl.dartT||0)<700)return ack({ok:false,err:'천천히!'});pl.dartT=now;
  const b=bOf(d.b);const g=dartGames[b];
  let x=+d.x,y=+d.y;if(!Number.isFinite(x)||!Number.isFinite(y))return ack({ok:false});x=Math.max(-1.3,Math.min(1.3,x));y=Math.max(-1.3,Math.min(1.3,y));
  const j=()=>(Math.random()+Math.random()+Math.random()-1.5)*.17; /* 손떨림 크게 */x+=j();y+=j();const r=DG.throwDart(g,s.id,x,y,pl.nick);
  if(r.done){dartRecs[b].push({nick:r.done.nick,score:r.done.score,rounds:g.rounds,t:Date.now()});dartRecs[b].sort((p,q)=>q.score-p.score||p.t-q.t);dartRecs[b].length=Math.min(dartRecs[b].length,10);const k=`${r.done.nick} (${g.rounds}R)`;dartWins[k]=Math.max(dartWins[k]||0,r.done.score);} /* 랭킹 = 하이스코어(8라운드 합계) 최고점 */dartEmit(b,{hit:{x,y,...r.hit,id:s.id,nick:pl.nick,bust:!!r.bust,win:!!r.win}});ack({ok:true,hit:r.hit,me:r.me,done:r.done});});
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
  const base=cur?{pos:cur.pos,rot:cur.rot,seat:cur.seat,rollerSkates:!!cur.rollerSkates,carry:cur.carry||null,drinks:cur.drinks||[]}
   :L?{pos:Array.isArray(L.pos)&&L.pos.length===3&&L.pos.every(Number.isFinite)?L.pos:[0,0,4],rot:+L.rot||0,rollerSkates:L.rollerSkates===true,seat:typeof L.seat==='string'?L.seat.slice(0,16):null,carry:PICK[L.carry]?L.carry:null,drinks:Array.isArray(L.drinks)?L.drinks.filter(Number.isFinite).slice(-20):[]}
   :{pos:[0,0,4],rot:0,seat:null,carry:null,drinks:[]};
  const re=!!cur;players[s.id]={...(cur||{}),seen:Date.now(),joinedAt:Date.now(),cid,nick,...look(p),...base};
  const rp=players[s.id];rp.rollerSkates=ROLLER.inside(rp.pos[0],rp.pos[2])&&!!base.rollerSkates;
  if(!cur&&L&&L.worldVersion!==2&&rp.pos[0]>-12&&rp.pos[0]<12&&rp.pos[2]>48&&rp.pos[2]<70){
   rp.pos=[rp.pos[0]+ROLLER.OFFSET.x,rp.pos[1],rp.pos[2]+ROLLER.OFFSET.z];rp.rollerSkates=!!base.rollerSkates;
  }
  if(ROLLER.inside(rp.pos[0],rp.pos[2])&&!rp.rollerSkates)rp.pos=[ROLLER.ARRIVE.x,0,ROLLER.ARRIVE.z];
  if(!clubOpen&&!isAdmin(s.data.adminToken)&&rp.pos[2]<12&&!SPORTS.inside(rp.pos[0],rp.pos[2])){rp.pos=[-3.3,0,14.5];rp.seat=null;}
  if(typeof rp.seat==='string'&&rp.seat.startsWith('R')){const seat=ROLLER.seats.find(seat=>seat.id===rp.seat);if(seat)rp.pos=[seat.x,seat.y,seat.z];else{rp.seat=null;rp.pos=[Math.max(ROLLER.T.x0+1,Math.min(ROLLER.T.x1-1,rp.pos[0])),0,rp.pos[2]];}}
  base.seat=rp.seat;
  Object.assign(base,{pos:rp.pos,rollerSkates:rp.rollerSkates});
  if(prevId)io.emit('rekey',{old:prevId,id:s.id});io.emit('player',{id:s.id,...pub()[s.id]});
  if(typeof ack==='function')ack(re||L?{ok:true,resume:base}:{ok:true});/* 유예시간이 지나도 앱이 기억한 위치/자리로 복원 */if(!re)io.emit('chat',{sys:true,text:nick+' 님 입장!'});bcOnline(true);});
 s.on('profile',(p,ack)=>{const pl=players[s.id];if(!pl)return;const nn=String(p.nick||pl.nick).trim().slice(0,16)||pl.nick;if(isBad(nn)){if(typeof ack==='function')ack({ok:false,error:'bad'});return;}if(nickTaken(nn,pl.cid,s.id)){if(typeof ack==='function')ack({ok:false,error:'nick'});s.emit('nickTaken',nn);return;}if(typeof ack==='function')ack({ok:true});Object.assign(pl,{nick:nn,...look(p)});io.emit('player',{id:s.id,...pl});});
 s.on('adminAccess',(token,ack)=>{
  s.data.adminToken=isAdmin(token)?token:null;
  const pl=players[s.id];if(!s.data.adminToken&&!clubOpen&&pl&&pl.pos[2]<12&&!SPORTS.inside(pl.pos[0],pl.pos[2]))ejectClubPlayer(s.id);
  if(typeof ack==='function')ack({ok:!!s.data.adminToken});
 });
 s.on('move',m=>{
  const pl=players[s.id];
  if(!pl||!m||!Array.isArray(m.pos)||m.pos.length!==3||!m.pos.every(Number.isFinite))return;
  const admin=isAdmin(s.data.adminToken),wasRoller=ROLLER.inside(pl.pos[0],pl.pos[2]),willRoller=ROLLER.inside(m.pos[0],m.pos[2]);
  if(!clubOpen&&!admin&&m.pos[2]<12&&!SPORTS.inside(m.pos[0],m.pos[2])){
   if(pl.pos[2]<12)ejectClubPlayer(s.id);
   else{pl.seat=null;io.emit('seat',{id:s.id,seat:null});s.emit('accessPosition',{pos:pl.pos,rollerSkates:!!pl.rollerSkates});}
   return;
  }
  if(wasRoller!==willRoller){
   const throughDoor=Math.abs(m.pos[0]-ROLLER.DOOR.x)<ROLLER.DOOR.half-.2&&Math.abs(m.pos[2]-ROLLER.DOOR.z)<1.2&&ROLLER.near(pl.pos,ROLLER.ENTRY,3.5);
   if(!throughDoor||(willRoller&&!rollerOpen&&!admin)){
    s.emit('rollerPosition',{pos:pl.pos,rollerSkates:!!pl.rollerSkates});return;
   }
   pl.rollerSkates=false;pl.rollerMotion='idle';pl.dance=0;
   pl.pos=willRoller?[m.pos[0],0,ROLLER.ARRIVE.z]:m.pos;
   s.emit('rollerPosition',{pos:pl.pos,rollerSkates:false});io.emit('player',{id:s.id,...pub()[s.id]});dirty.add(s.id);return;
  }
  if(willRoller&&!pl.rollerSkates){
   s.emit('rollerPosition',{pos:pl.pos,rollerSkates:false});return;
  }
  const wasArcade=ARCADE.inside(pl.pos[0],pl.pos[2]),willArcade=ARCADE.inside(m.pos[0],m.pos[2]);
  if(wasArcade!==willArcade){const d=ARCADE.DOOR,through=Math.abs(m.pos[0]-d.x)<d.half-.2&&Math.abs(m.pos[2]-d.z)<1.2&&Math.hypot(pl.pos[0]-d.x,pl.pos[2]-d.z)<3.5;if(!through){s.emit('arcadePosition',{pos:pl.pos,rollerSkates:!!pl.rollerSkates});return;}}
  const wasSports=SPORTS.inside(pl.pos[0],pl.pos[2]),willSports=SPORTS.inside(m.pos[0],m.pos[2]);
  if(wasSports!==willSports){const d=SPORTS.DOOR,through=Math.abs(m.pos[2]-d.z)<d.half-.2&&Math.abs(m.pos[0]-d.x)<1.4&&Math.hypot(pl.pos[0]-d.x,pl.pos[2]-d.z)<3.5;if(!through){s.emit('sportsPosition',{pos:pl.pos,rollerSkates:!!pl.rollerSkates});return;}}
  pl.pos=m.pos;pl.rot=+m.rot||0;pl.dance=(+m.dance|0)%4;dirty.add(s.id);
 });
 s.on('seat',seat=>{
  const pl=players[s.id];if(!pl)return;
  if(typeof seat==='string'&&/^R/.test(seat)){
   const target=ROLLER.seats.find(s=>s.id===seat);
   if(!target||!ROLLER.near(pl.pos,target,1.9)||Object.entries(players).some(([id,p])=>id!==s.id&&!p.gone&&p.seat===seat)){
    s.emit('seatRejected',{seat,error:'자리에 가까이 오거나 비어 있는 의자를 골라 주세요'});return;
   }
   pl.pos=[target.x,target.y,target.z];dirty.add(s.id);
  }
  pl.seat=seat;io.emit('seat',{id:s.id,seat});
 });
 s.emit('glasses',glassPub());
 s.emit('tableUses',usesPub());s.emit('table',tablePub());waiterJobs.forEach(j=>j&&s.emit('waiterJob',j));s.emit('tickerIdle',tickerIdle);s.emit('boards',boardsPub());s.emit('clubDoor',{open:clubOpen});s.emit('rollerDoor',{open:rollerOpen});if(rankData)s.emit('ranking',rankData);for(const [venue,worker] of Object.entries(albaWorkers))if(worker.job)s.emit(venue==='roller'?'rollerAlbaJob':'albaJob',worker.job);
 s.on('drink',type=>{const pl=players[s.id];if(!pl||!pl.seat||!DRINKS.includes(type))return;if(!canDrink(pl.seat,type))return;const n=Date.now();if(n-(pl.lastDrink||0)<2000)return;pl.lastDrink=n;
  if(!['cola','cider'].includes(type))pl.drinks=(pl.drinks||[]).filter(x=>n-x<1800000).concat(n).slice(-20);
  if(BAR_Z[pl.seat]!==undefined){delete glasses[pl.seat];io.emit('glasses',glassPub());}const tb=pochaTable(pl.seat);if(tb)useItem(tb,type);io.emit('drink',{id:s.id,type});});
 s.emit('presets',presets);
 s.on('getTicker',(tok,ack)=>{if(typeof ack==='function')ack(isAdmin(tok)?{ok:true,rankUrl}:{ok:false});});
 s.on('setTickerIdle',(d,ack)=>{ack=typeof ack==='function'?ack:()=>{};if(!d||!isAdmin(d.token))return ack({ok:false,err:'관리자만'});tickerIdle=cleanText(String(d.text||'').replace(/\s+/g,' ').trim().slice(0,120));save();io.emit('tickerIdle',tickerIdle);io.emit('boards',boardsPub());ack({ok:true,text:tickerIdle});});
 s.on('setRank',(d,ack)=>{ack=typeof ack==='function'?ack:()=>{};if(!d||!isAdmin(d.token))return ack({ok:false,err:'관리자만'});const u=String(d.url||'').trim().slice(0,300);if(!DON.rankPayload(u))return ack({ok:false,err:'투네이션 ranking 위젯 주소가 아니에요'});
  rankUrl=u;rankData=null;save();io.emit('ranking',null);startRank();ack({ok:true,url:rankUrl});});
 for(const P of pools){pool=P;s.emit('poolState',poolPub());}
 s.on('poolChallenge',(d,ack)=>{ack=typeof ack==='function'?ack:()=>{};const T=useT(d&&d.t),me=players[s.id],to=d&&d.to,tp=players[to];if(!me)return ack({ok:false});
  const inT=pool.players.some(p=>p.id===s.id);if(pool.players.length&&!inT)return ack({ok:false,err:'게임 중이에요 — 대기열에 들어가세요'});if(inT&&pool.shots>0)return ack({ok:false,err:'게임이 이미 시작됐어요 — 다음 게임에 함께'});if(pool.players.length>=poolMax())return ack({ok:false,err:`만석 (${poolMax()}명)`});if(!inT&&pools.some(P=>P.players.some(p=>p.id===s.id)))return ack({ok:false,err:'다른 테이블에서 치는 중이에요'});if(!tp||to===s.id)return ack({ok:false,err:'상대가 없어요'});if(pools.some(P=>P.players.some(p=>p.id===to)))return ack({ok:false,err:'상대가 이미 치는 중이에요'});{const q=tp.pos||[0,0,0],dd=POOL_POS.map(TP=>Math.hypot(q[0]-TP[0],q[2]-TP[1]));if(dd[T]>3||dd.some((v,i)=>i!==T&&v<dd[T]))return ack({ok:false,err:'당구대 근처에 있는 사람만 신청할 수 있어요'});}if(poolInv[to])return ack({ok:false,err:'상대가 다른 신청을 받는 중'});
  const tm=setTimeout(()=>{if(poolInv[to]&&poolInv[to].from===s.id){delete poolInv[to];s.emit('poolChallengeResult',{ok:false,msg:`${tp.nick}님이 응답하지 않았어요 (시간 초과)`});io.to(to).emit('poolInviteGone');}},20000);
  const MODE=pool.kind==='carom'?(d.mode==='3'?'3':'4'):(d.mode==='s'?'s':'8');poolInv[to]={from:s.id,tm,T,MODE};io.to(to).emit('poolInvite',{from:s.id,nick:me.nick,sec:20,t:T,mode:MODE,kind:pool.kind});ack({ok:true});});
 s.on('poolAnswer',(d,ack)=>{ack=typeof ack==='function'?ack:()=>{};const inv=poolInv[s.id];if(!inv||!d||inv.from!==d.from)return ack({ok:false,err:'신청이 만료됐어요'});clearTimeout(inv.tm);delete poolInv[s.id];useT(inv.T);
  const ch=players[inv.from],me=players[s.id];if(!ch||!me)return ack({ok:false,err:'상대가 나갔어요'});
  if(!d.accept){io.to(inv.from).emit('poolChallengeResult',{ok:false,msg:`${me.nick}님이 같이 치기 신청을 거절했어요`});return ack({ok:true});}
  const inT=pool.players.some(p=>p.id===inv.from);if((pool.players.length&&!inT)||pool.players.length>=poolMax()){io.to(inv.from).emit('poolChallengeResult',{ok:false,msg:pool.players.length>=poolMax()?'만석이라 못 들어와요':'당구대가 이미 사용 중이에요'});return ack({ok:false,err:pool.players.length>=poolMax()?'만석':'당구대가 이미 사용 중이에요'});}
  if(pools.some(P=>P.players.some(p=>p.id===s.id)))return ack({ok:false,err:'이미 치는 중이에요'});
  if(inT&&pool.shots>0){if(!pool.queue.some(q=>q.id===s.id))pool.queue.push({id:s.id,nick:me.nick});io.emit('poolState',poolPub());io.to(inv.from).emit('poolChallengeResult',{ok:true,msg:`${me.nick}님 수락 → 게임 중이라 대기 ${pool.queue.length}번째`});return ack({ok:true,queued:pool.queue.length});}
  if(!inT){if(inv.MODE)pool.mode=inv.MODE;poolReset();pool.players=[{id:inv.from,nick:ch.nick}];}pool.players.push({id:s.id,nick:me.nick});pool.msg=`🎱 ${me.nick} 합류! (${pool.players.length}명) · 차례: ${pool.players[pool.turn].nick}`;
  io.emit('poolState',poolPub());io.to(inv.from).emit('poolChallengeResult',{ok:true,msg:`${me.nick}님이 수락했어요`});io.to(inv.from).emit('poolStart',{t:inv.T});s.emit('poolStart',{t:inv.T});ack({ok:true});});
 s.on('poolLeave',()=>poolLeave(s.id));
 s.on('poolPlace',(d,ack)=>{ack=typeof ack==='function'?ack:()=>{};if(!d)return ack({ok:false});useT(d.t);const pl=pool.players[pool.turn];if(!pl||pl.id!==s.id||!pool.bih||pool.over||Date.now()<pool.busy)return ack({ok:false,err:'지금은 놓을 수 없어요'});
  const x=+d.x,y=+d.y;if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>POOL.L/2-POOL.R||Math.abs(y)>POOL.Wd/2-POOL.R)return ack({ok:false,err:'테이블 안에 놓아 주세요'});
  if(pool.balls.some(o=>o.n!==0&&!o.in&&Math.hypot(o.x-x,o.y-y)<2*POOL.R+.002))return ack({ok:false,err:'다른 공과 겹쳐요'});const c=pool.balls.find(o=>o.n===0);c.x=x;c.y=y;c.in=false;io.emit('poolState',poolPub());ack({ok:true});});
 s.on('poolSfx',d=>{if(!players[s.id]||!d||!Array.isArray(d.e))return;const now=Date.now();if(now-(s.data.psT||0)<400)return;s.data.psT=now;const e=d.e.slice(0,40).filter(x=>Array.isArray(x)&&x.length===3).map(([ms,k,g])=>[Math.max(0,Math.min(25000,+ms||0)),['cue','ball','cush','pocket'].includes(k)?k:'ball',Math.max(0,Math.min(1,+g||0))]);s.broadcast.emit('poolSfx',{t:d.t===1?1:0,e});});
 s.on('poolQueue',(d,ack)=>{ack=typeof ack==='function'?ack:()=>{};useT(d&&d.t);const me=players[s.id];if(!me)return ack({ok:false});const qi=pool.queue.findIndex(q=>q.id===s.id);
  if(d&&d.join===false){if(qi>=0)pool.queue.splice(qi,1);io.emit('poolState',poolPub());return ack({ok:true});}
  if(pool.players.some(p=>p.id===s.id))return ack({ok:false,err:'이미 치는 중이에요'});if(qi<0)pool.queue.push({id:s.id,nick:me.nick});
  if(!pool.players.length&&pool.queue.length>=2)poolNext([]);io.emit('poolState',poolPub());ack({ok:true,pos:pool.queue.findIndex(q=>q.id===s.id)+1});});
 s.on('poolNew',(d,ack)=>{ack=typeof ack==='function'?ack:()=>{};useT(d&&d.t);if(!pool.players.some(p=>p.id===s.id))return ack({ok:false});const v=pool.votes;if(v[s.id])delete v[s.id];else v[s.id]=1;const n=pool.players.filter(p=>v[p.id]).length,m=pool.players.length;if(n>=m){poolReset(true);pool.msg='🔄 모두 동의 — 새 게임!';}else pool.msg=`🔄 새 게임 동의 ${n}/${m}`;io.emit('poolState',poolPub());ack({ok:true,n,m});});
 s.on('poolShoot',(d,ack)=>{ack=typeof ack==='function'?ack:()=>{};if(!d)return ack({ok:false});const T=useT(d.t);const r=poolShot(s.id,d.a,d.p,d.sx,d.sy);if(!r.ok)return ack(r);io.emit('poolShot',{...r.shot,state:poolPub()});ack({ok:true});
  if(r.over){const prev=pool.players.slice();setTimeout(()=>{useT(T);poolNext(prev);io.emit('poolState',poolPub());},6000);}});
 s.on('clearChat',(d,ack)=>{ack=typeof ack==='function'?ack:()=>{};if(!d||!isAdmin(d.token))return ack({ok:false,err:'관리자만'});chatHist.length=0;io.emit('chatCleared');ack({ok:true});});
 // Roller access and food are validated on the server for every connected player.
 s.on('setRollerDoor',(d,ack)=>{
  ack=typeof ack==='function'?ack:()=>{};
  if(!d||!isAdmin(d.token)||typeof d.open!=='boolean')return ack({ok:false,err:'관리자만 가능'});
  rollerOpen=d.open;save();io.emit('rollerDoor',{open:rollerOpen});ack({ok:true,open:rollerOpen});
 });
 s.on('rollerTravel',(d,ack)=>{
  ack=typeof ack==='function'?ack:()=>{};const pl=players[s.id];
  if(!pl||pl.seat)return ack({ok:false,err:'자리에서 일어나 주세요'});
  const direction=typeof d==='string'?d:d&&d.direction;
  const admin=isAdmin(s.data.adminToken)||isAdmin(d&&d.token);
  if(direction==='enter'){
   if(!rollerOpen&&!admin)return ack({ok:false,err:'롤라장 문이 닫혀 있어요'});
   if(!ROLLER.near(pl.pos,ROLLER.ENTRY,2.5))return ack({ok:false,err:'택시 옆 롤라장 입구로 와 주세요'});
   pl.pos=[ROLLER.ARRIVE.x,0,ROLLER.ARRIVE.z];pl.rollerSkates=false;
  }else if(direction==='exit'){
   if(!ROLLER.inside(pl.pos[0],pl.pos[2])||!(ROLLER.near(pl.pos,ROLLER.ARRIVE,2.8)||ROLLER.near(pl.pos,ROLLER.EXIT,2.8)))return ack({ok:false,err:'롤라장 출구로 와 주세요'});
   pl.pos=[ROLLER.ENTRY.x,0,ROLLER.ENTRY.z-.8];pl.rollerSkates=false;
  }else return ack({ok:false});
  pl.dance=0;pl.rollerMotion='idle';io.emit('player',{id:s.id,...pub()[s.id]});
  ack({ok:true,pos:pl.pos,rollerSkates:pl.rollerSkates});
 });
 s.on('sportsTravel',(direction,ack)=>{ack=typeof ack==='function'?ack:()=>{};const pl=players[s.id];if(!pl||pl.seat)return ack({ok:false,err:'자리에서 일어나 주세요'});const near=(q,r)=>Math.hypot(pl.pos[0]-q.x,pl.pos[2]-q.z)<r;
  if(direction==='enter'){if(!near(SPORTS.ENTRY,2.5))return ack({ok:false,err:'횟집 옆 스포츠센터 유리문으로 와 주세요'});pl.pos=[SPORTS.ARRIVE.x,0,SPORTS.ARRIVE.z];}
  else if(direction==='exit'){if(!SPORTS.inside(pl.pos[0],pl.pos[2])||!near(SPORTS.ARRIVE,3))return ack({ok:false,err:'출입문으로 와 주세요'});pl.pos=[SPORTS.ENTRY.x,0,SPORTS.ENTRY.z];}else return ack({ok:false});pl.rollerSkates=false;pl.dance=0;io.emit('player',{id:s.id,...pub()[s.id]});dirty.add(s.id);ack({ok:true,pos:pl.pos,rollerSkates:false});});
 s.on('arcadeTravel',(direction,ack)=>{ack=typeof ack==='function'?ack:()=>{};const pl=players[s.id];if(!pl||pl.seat)return ack({ok:false,err:'자리에서 일어나 주세요'});const near=(q,r)=>Math.hypot(pl.pos[0]-q.x,pl.pos[2]-q.z)<r;
  if(direction==='enter'){if(!near(ARCADE.ENTRY,2.5))return ack({ok:false,err:'빨간 자동차 앞 오락실 입구로 와 주세요'});pl.pos=[ARCADE.ARRIVE.x,0,ARCADE.ARRIVE.z];}
  else if(direction==='exit'){if(!ARCADE.inside(pl.pos[0],pl.pos[2])||!near(ARCADE.ARRIVE,3))return ack({ok:false,err:'출입문으로 와 주세요'});pl.pos=[ARCADE.ENTRY.x,0,ARCADE.ENTRY.z];}else return ack({ok:false});
  pl.rollerSkates=false;pl.dance=0;io.emit('player',{id:s.id,...pub()[s.id]});dirty.add(s.id);ack({ok:true,pos:pl.pos,rollerSkates:false});});
 s.on('rollerEquip',(d,ack)=>{
  ack=typeof ack==='function'?ack:()=>{};const pl=players[s.id];
  if(!pl||pl.seat||!ROLLER.inside(pl.pos[0],pl.pos[2])||!(ROLLER.near(pl.pos,ROLLER.ARRIVE,2.3)||ROLLER.near(pl.pos,ROLLER.CHANGE,2.2)))return ack({ok:false,err:'입구 또는 롤러 교체 코너에서 이용해 주세요'});
  pl.rollerSkates=!!(d&&d.on);Object.assign(pl,ROLLER.colours(d||{}));pl.rollerMotion='idle';
  io.emit('player',{id:s.id,...pub()[s.id]});ack({ok:true,rollerSkates:pl.rollerSkates,...ROLLER.colours(pl)});
 });
 s.on('rollerMotion',motion=>{
  const pl=players[s.id];if(!pl||!pl.rollerSkates||!ROLLER.inside(pl.pos[0],pl.pos[2]))return;
  if(!['idle','skate','run','jump'].includes(motion)||pl.rollerMotion===motion)return;
  pl.rollerMotion=motion;io.emit('rollerMotion',{id:s.id,motion});
 });
 s.on('setClubDoor',(d,ack)=>{
  ack=typeof ack==='function'?ack:()=>{};
  if(!d||!isAdmin(d.token)||typeof d.open!=='boolean')return ack({ok:false,err:'관리자만'});
  clubOpen=d.open;save();
  if(!clubOpen)for(const [id,pl] of Object.entries(players)){
   const client=io.sockets.sockets.get(id);
   if(pl.pos[2]>=12||SPORTS.inside(pl.pos[0],pl.pos[2])||isAdmin(client&&client.data.adminToken))continue;
   ejectClubPlayer(id);
  }
  io.emit('clubDoor',{open:clubOpen,by:true});ack({ok:true,open:clubOpen});
 });
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
 s.on('order',(kind,ack)=>{
  ack=typeof ack==='function'?ack:()=>{};const pl=players[s.id];if(!pl)return ack({ok:false,err:'입장 먼저'});
  const tb=pochaTable(pl.seat);if(!tb||!['Y','R'].includes(tb[0]))return ack({ok:false,err:'테이블에 앉아야 주문할 수 있어요'});
  const roller=tb[0]==='R',venue=roller?'roller':'pocha',worker=albaWorkers[venue];
  const allowed=roller?ROLLER.MENU:ORDER_ANJU.concat(ORDER_DRINK);
  if(!allowed.includes(kind))return ack({ok:false,err:'없는 메뉴'});
  if(roller&&!ROLLER.near(pl.pos,{x:TABLES[tb][0],z:TABLES[tb][1]},2.2))return ack({ok:false,err:'매점 테이블에 앉아 주세요'});
  const n=Date.now();if(n-(pl.lastOrder||0)<700)return ack({ok:false,err:'천천히 주문해 주세요'});
  if(worker.queue.filter(o=>o.by===s.id).length+(worker.job&&!worker.job.done&&worker.job.by===s.id?1:0)>=3)return ack({ok:false,err:'주문은 3개까지 기다릴 수 있어요'});
  if(tables[tb].items.filter(i=>!i).length<=albaPending(tb))return ack({ok:false,err:'테이블이 꽉 찼어요'});
  pl.lastOrder=n;const order={id:++albaSeq,by:s.id,nick:pl.nick,table:tb,kind};worker.queue.push(order);
  ack({ok:true,id:order.id,queue:worker.queue.length+(worker.job?1:0)});
  if(!roller)io.emit('albaQueue',worker.queue.length);albaNext(venue);
 });
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
 s.on('bye',ack=>{poolLeave(s.id);const pl=players[s.id];if(pl){clearTimeout(pl.timer);delete players[s.id];dirty&&dirty.delete&&dirty.delete(s.id);io.emit('leave',s.id);io.emit('chat',{sys:true,text:pl.nick+' 님 퇴장'});bcOnline();}s.data.kicked=true;if(typeof ack==='function')ack({ok:true});});
 s.on('disconnect',()=>{poolLeave(s.id);const pl=players[s.id];if(!pl||s.data.kicked)return;pl.gone=Date.now();clearTimeout(pl.timer);
  pl.timer=setTimeout(()=>{if(players[s.id]!==pl||!pl.gone)return;delete players[s.id];io.emit('leave',s.id);io.emit('chat',{sys:true,text:pl.nick+' 님 퇴장'});bcOnline();},GRACE_MS);bcOnline();});
});
server.listen(PORT,'0.0.0.0',()=>{tick();ensureDefault();
 const ext=process.env.RENDER_EXTERNAL_URL;if(ext)setInterval(()=>fetch(ext.replace(/\/$/,'')+'/health').catch(()=>{}),10*60*1000);console.log('ERRDAY 7080 나이트 서버: http://localhost:'+PORT);console.log('관리자 로그인: 사용 가능 (고정 비밀번호)');
 const n=require('os').networkInterfaces();for(const k in n)for(const a of n[k])if(a.family==='IPv4'&&!a.internal)console.log('같은 Wi-Fi 친구 접속: http://'+a.address+':'+PORT);});
