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
app.post('/youtube',async(req,res)=>{if(!isAdmin(req.get('x-admin-token')))return res.status(403).json({error:'관리자만 추가 가능'});
 const {list,v}=parseYT(String(req.body.url||''));let items=[];
 try{if(list)items=await ytPlaylist(list);}catch(e){}
 if(!items.length&&v)items=[{id:v,title:null}];
 if(!items.length)return res.status(400).json({error:list?'재생목록을 읽지 못했어요 (비공개/믹스 목록은 안 될 수 있음)':'유튜브 링크를 확인해 주세요'});
 if(music.isDefault){music.playlist=[];music.index=-1;music.isDefault=false;music.shuffle=false;played=new Set();}
 for(const it of items){if(!it.title)it.title=await ytTitle(it.id);music.playlist.push({type:'yt',id:'yt_'+it.id+'_'+Date.now(),videoId:it.id,title:it.title,by:req.body.by||'관리자'});}
 if(music.index<0){music.index=music.playlist.length-items.length;music.playing=true;music.startedAt=Date.now();music.pausedAt=0;}
 broadcastMusic();res.json({added:items.length});});
const {advance}=require('./playback');
const STATE=process.env.STATE_FILE||path.join(__dirname,'data','state.json');
const durations={}; // videoId 또는 mp3 id -> 초 (클라이언트가 알려줌)
const durOf=t=>t&&(t.dur||durations[t.type==='yt'?t.videoId:t.id]);
const {clean:cleanText,isBad}=require('./filter');
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
 if(music.isDefault){music.playlist=[];music.index=-1;music.isDefault=false;music.shuffle=false;played=new Set();}
 music.playlist.push(t); if(music.index<0){music.index=music.playlist.length-1;music.playing=true;music.startedAt=Date.now();}
 broadcastMusic(); res.json(t);
}));
function save(){try{fs.mkdirSync(path.dirname(STATE),{recursive:true});fs.writeFileSync(STATE,JSON.stringify({music,durations,played:[...played]}));}catch(e){}}
function load(){try{const j=JSON.parse(fs.readFileSync(STATE,'utf8'));Object.assign(music,j.music);Object.assign(durations,j.durations||{});played=new Set(j.played||[]);
 music.playlist=music.playlist.filter(t=>t.type!=='mp3'||fs.existsSync(path.join(UP,t.id)));if(music.index>=music.playlist.length)music.index=music.playlist.length?0:-1;}catch(e){}}
load();
const DEFAULT_LIST='PL1cIIyrjZ9L3YEUl8DAz_R6uTf2-80wWY';let defLoading=false;
async function ensureDefault(){if(music.playlist.length||defLoading)return;defLoading=true;try{const items=await ytPlaylist(DEFAULT_LIST);
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
function sweep(){for(const id in players){const so=io.sockets.sockets.get(id);if((!so||!so.connected)&&!players[id].gone){const pl=players[id];delete players[id];io.emit('leave',id);io.emit('chat',{sys:true,text:pl.nick+' 님 퇴장'});}}}
setInterval(sweep,15000).unref();
const chatHist=[];const GRACE_MS=+process.env.GRACE_MS||30000;
const BZ={x0:10.55,x1:11.4,z0:-1.6,z1:6.75},BAR_Z={};for(let k=0;k<5;k++)BAR_Z['BAR-'+k]=3-3.5+k*1.4;
const glasses={};const glassPub=()=>{const o={};for(const k in glasses)o[k]=glasses[k].type||'whiskey';return o;};
const DRINKS=['soju','beer','whiskey','cocktail'];
const TABLES={Y1:[-7.6,16.4],Y2:[-3,16.4],Y3:[-7.6,20.2],Y4:[-3,20.2],Y5:[2.6,21.5],T1:[-7,-4,2.4],T2:[-7,2,2.4],T3:[-7,7.5,2.4],T4:[4.5,6,2.4],T5:[0,8.5,2.4],T6:[-2.5,3.5,2.4]};const tables={};for(const k in TABLES)tables[k]={items:[null,null,null,null],t:0};
const PICK={soju:{x:-0.7,z:21.5,r:1.8},beer:{x:-0.7,z:21.5,r:1.8}};for(const f of ['dakbal','kkom','fish','squid'])PICK[f]={x:0.8,z:16.0,r:2.4};PICK.chicken={x:-11.6,z:20.5,r:2.4};PICK.hoe={x:-11.6,z:15,r:2.4};
const usesPub=()=>{const o={};for(const k in tables)o[k]=tables[k].items.map(i=>i?i.u:0);return o;};const tablePub=()=>{const o={};for(const k in tables)o[k]=tables[k].items.map(i=>i?i.k:null);return o;};
const FOODS=['dakbal','kkom','fish','squid','chicken','hoe'],MAX_ITEMS=4,USES=4;
function useItem(tb,kind){const t=tables[tb],i=t.items.findIndex(x=>x&&x.k===kind);if(i<0)return false;if(--t.items[i].u<=0)t.items[i]=null;t.t=Date.now();(io.emit('tableUses',usesPub()),io.emit('table',tablePub()));return true;}
const pochaTable=seat=>{const m=/^([YT]\d)-/.exec(seat||'');return m&&tables[m[1]]?m[1]:null;};
function canDrink(seat,type){if(BAR_Z[seat]!==undefined)return !!glasses[seat]&&(glasses[seat].type||'whiskey')===type;if(type==='whiskey'||type==='cocktail')return false;const tb=pochaTable(seat);if(tb)return tables[tb].items.some(i=>i&&i.k===type);return false;}
setInterval(()=>{const n=Date.now();let ch=false;for(const k in tables)if(tables[k].items.some(Boolean)&&n-tables[k].t>1200000){tables[k].items=[null,null,null,null];ch=true;}if(ch)(io.emit('tableUses',usesPub()),io.emit('table',tablePub()));},10000).unref();
setInterval(()=>{const n=Date.now();let ch=false;for(const k in glasses)if(n-glasses[k].t>60000){delete glasses[k];ch=true;}if(ch)io.emit('glasses',glassPub());},2000).unref();
// 위치는 이동마다 바로 보내지 않고 0.1초마다 바뀐 사람만 묶어서 한 번에 방송 (N² 메시지 → 틱당 1개)
const dirty=new Set();const r2=v=>Math.round(v*100)/100;
setInterval(()=>{if(!dirty.size)return;const a=[];for(const id of dirty){const p=players[id];if(p&&!p.gone)a.push(id,r2(p.pos[0]),r2(p.pos[1]),r2(p.pos[2]),r2(p.rot),p.dance|0);}dirty.clear();if(a.length)io.volatile.emit('m',a);},100).unref();
io.on('connection',s=>{
 s.emit('init',{id:s.id,players:pub(),music:state()});s.emit('chatHistory',chatHist);
 s.onAny(()=>{const pl=players[s.id];if(pl)pl.seen=Date.now();});
 s.on('adminCleanup',(tok,ack)=>{if(typeof ack!=='function')ack=()=>{};if(!isAdmin(tok))return ack({ok:false,error:'관리자만 가능'});
  const now=Date.now(),seenCid=new Map(),rm=[];
  for(const id in players){const pl=players[id],so=io.sockets.sockets.get(id);
   if(!so||!so.connected||pl.gone||(id!==s.id&&now-(pl.seen||pl.joinedAt||now)>60000)){rm.push(id);continue;}
   const o=seenCid.get(pl.cid);if(o){const keep=(players[o].seen||0)>=(pl.seen||0)?o:id,drop=keep===o?id:o;rm.push(drop);seenCid.set(pl.cid,keep);}else seenCid.set(pl.cid,id);}
  for(const id of new Set(rm)){const pl=players[id];if(!pl)continue;clearTimeout(pl.timer);delete players[id];dirty.delete(id);io.emit('leave',id);const so=io.sockets.sockets.get(id);if(so&&id!==s.id)so.disconnect(true);}
  io.emit('snapshot',pub());ack({ok:true,removed:new Set(rm).size});});
 s.on('join',(p,ack)=>{p=p||{};const cid=String(p.clientId||s.id).slice(0,64);const nick=String(p.nick||'손님').trim().slice(0,16)||'손님';
  if(isBad(nick)){if(typeof ack==='function')ack({ok:false,error:'bad'});return;}
  if(nickTaken(nick,cid,s.id)){if(typeof ack==='function')ack({ok:false,error:'nick'});s.emit('nickTaken',nick);return;}
  let prev=null,prevId=null;for(const id in players){if(id!==s.id&&players[id].cid===cid){if(!prev){prev=players[id];prevId=id;}delete players[id];const os=io.sockets.sockets.get(id);if(os)os.disconnect(true);}}
  if(prev){clearTimeout(prev.timer);prev.timer=null;prev.gone=null;}
  const L=p.last&&typeof p.last==='object'?p.last:null,cur=players[s.id]||prev;
  const base=cur?{pos:cur.pos,rot:cur.rot,seat:cur.seat,carry:cur.carry||null,drinks:cur.drinks||[]}
   :L?{pos:Array.isArray(L.pos)&&L.pos.length===3&&L.pos.every(Number.isFinite)?L.pos:[0,0,4],rot:+L.rot||0,seat:typeof L.seat==='string'?L.seat.slice(0,16):null,carry:PICK[L.carry]?L.carry:null,drinks:Array.isArray(L.drinks)?L.drinks.filter(Number.isFinite).slice(-20):[]}
   :{pos:[0,0,4],rot:0,seat:null,carry:null,drinks:[]};
  const re=!!cur;players[s.id]={...(cur||{}),seen:Date.now(),joinedAt:Date.now(),cid,nick,gender:p.gender,outfit:p.outfit,skin:p.skin,style:p.style,...base};
  if(prevId)io.emit('rekey',{old:prevId,id:s.id});io.emit('player',{id:s.id,...pub()[s.id]});
  if(typeof ack==='function')ack(re?{ok:true,resume:base}:{ok:true});if(!re)io.emit('chat',{sys:true,text:nick+' 님 입장!'});});
 s.on('profile',(p,ack)=>{const pl=players[s.id];if(!pl)return;const nn=String(p.nick||pl.nick).trim().slice(0,16)||pl.nick;if(isBad(nn)){if(typeof ack==='function')ack({ok:false,error:'bad'});return;}if(nickTaken(nn,pl.cid,s.id)){if(typeof ack==='function')ack({ok:false,error:'nick'});s.emit('nickTaken',nn);return;}if(typeof ack==='function')ack({ok:true});Object.assign(pl,{nick:nn,gender:p.gender,outfit:p.outfit,skin:p.skin,style:p.style});io.emit('player',{id:s.id,...pl});});
 s.on('move',m=>{const pl=players[s.id];if(!pl||!m||!Array.isArray(m.pos)||m.pos.length!==3||!m.pos.every(Number.isFinite))return;pl.pos=m.pos;pl.rot=+m.rot||0;pl.dance=(+m.dance|0)%4;dirty.add(s.id);});
 s.on('seat',seat=>{const pl=players[s.id];if(!pl)return;pl.seat=seat;io.emit('seat',{id:s.id,seat});});
 s.emit('glasses',glassPub());
 s.emit('tableUses',usesPub());s.emit('table',tablePub());
 s.on('drink',type=>{const pl=players[s.id];if(!pl||!pl.seat||!DRINKS.includes(type))return;if(!canDrink(pl.seat,type))return;const n=Date.now();if(n-(pl.lastDrink||0)<2000)return;pl.lastDrink=n;
  pl.drinks=(pl.drinks||[]).filter(x=>n-x<1800000).concat(n).slice(-20);
  if(BAR_Z[pl.seat]!==undefined){delete glasses[pl.seat];io.emit('glasses',glassPub());}const tb=pochaTable(pl.seat);if(tb)useItem(tb,type);io.emit('drink',{id:s.id,type});});
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
 s.on('chat',text=>{const pl=players[s.id];if(!pl)return;text=String(text).slice(0,200);if(!text.trim())return;text=cleanText(text);
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
  else if(cmd.type==='delete'&&music.playlist[cmd.index]){const [t]=music.playlist.splice(cmd.index,1);if(t.type==='mp3')fs.unlink(path.join(UP,t.id),()=>{});
   if(cmd.index<music.index)music.index--;else if(cmd.index===music.index){if(!music.playlist.length){music.index=-1;music.playing=false;}else{music.index%=music.playlist.length;music.startedAt=now;music.pausedAt=0;}}}
  broadcastMusic();});
 s.on('disconnect',()=>{const pl=players[s.id];if(!pl)return;pl.gone=Date.now();clearTimeout(pl.timer);
  pl.timer=setTimeout(()=>{if(players[s.id]!==pl||!pl.gone)return;delete players[s.id];io.emit('leave',s.id);io.emit('chat',{sys:true,text:pl.nick+' 님 퇴장'});},GRACE_MS);});
});
server.listen(PORT,'0.0.0.0',()=>{tick();ensureDefault();
 const ext=process.env.RENDER_EXTERNAL_URL;if(ext)setInterval(()=>fetch(ext.replace(/\/$/,'')+'/health').catch(()=>{}),10*60*1000);console.log('ERRDAY 7080 나이트 서버: http://localhost:'+PORT);console.log('관리자 로그인: 사용 가능 (고정 비밀번호)');
 const n=require('os').networkInterfaces();for(const k in n)for(const a of n[k])if(a.family==='IPv4'&&!a.internal)console.log('같은 Wi-Fi 친구 접속: http://'+a.address+':'+PORT);});
