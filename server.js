const express=require('express'),http=require('http'),path=require('path'),fs=require('fs'),multer=require('multer');
const {Server}=require('socket.io');
const PORT=process.env.PORT||8080, UP=path.join(__dirname,'uploads');
fs.mkdirSync(UP,{recursive:true});
const ADMIN_PW=String(process.env.ADMIN_PASSWORD||'6651'); // 제작자가 정한 고정 비밀번호
const tokens=new Set();const isAdmin=t=>!!t&&tokens.has(t);
const app=express(),server=http.createServer(app),io=new Server(server,{maxHttpBufferSize:1e6});
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
function pub(){const o={};for(const id in players){const {cid,lastDrink,lastServe,lastAct,...r}=players[id];o[id]=r;}return o;}
function nickTaken(n,cid,sid){n=n.trim().toLowerCase();for(const id in players){const q=players[id];if(id!==sid&&q.cid!==cid&&q.nick.trim().toLowerCase()===n)return true;}return false;}
function sweep(){for(const id in players){const so=io.sockets.sockets.get(id);if(!so||!so.connected){const pl=players[id];delete players[id];io.emit('leave',id);io.emit('chat',{sys:true,text:pl.nick+' 님 퇴장'});}}}
setInterval(sweep,15000).unref();
const chatHist=[];
const BZ={x0:10.55,x1:11.4,z0:-1.6,z1:6.75},BAR_Z={};for(let k=0;k<5;k++)BAR_Z['BAR-'+k]=3-3.5+k*1.4;
const glasses={};const glassPub=()=>{const o={};for(const k in glasses)o[k]=glasses[k].type||'whiskey';return o;};
const DRINKS=['soju','beer','whiskey','cocktail'];
const TABLES={Y1:[-7.6,16.4],Y2:[-3,16.4],Y3:[-7.6,20.2],Y4:[-3,20.2],Y5:[2.6,21.5]};const tables={};for(const k in TABLES)tables[k]={items:[],t:0};
const PICK={soju:{x:-0.7,z:21.5,r:1.8},beer:{x:-0.7,z:21.5,r:1.8}};for(const f of ['dakbal','kkom','fish','squid'])PICK[f]={x:5.5,z:16.5,r:2.4};
const tablePub=()=>{const o={};for(const k in tables)o[k]=tables[k].items.slice();return o;};
const pochaTable=seat=>{const m=/^(Y\d)-/.exec(seat||'');return m&&tables[m[1]]?m[1]:null;};
function canDrink(seat,type){if(BAR_Z[seat]!==undefined)return !!glasses[seat]&&(glasses[seat].type||'whiskey')===type;if(type==='whiskey'||type==='cocktail')return false;const tb=pochaTable(seat);if(tb)return tables[tb].items.includes(type);return true;}
setInterval(()=>{const n=Date.now();let ch=false;for(const k in tables)if(tables[k].items.length&&n-tables[k].t>1200000){tables[k].items=[];ch=true;}if(ch)io.emit('table',tablePub());},10000).unref();
setInterval(()=>{const n=Date.now();let ch=false;for(const k in glasses)if(n-glasses[k].t>60000){delete glasses[k];ch=true;}if(ch)io.emit('glasses',glassPub());},2000).unref();
io.on('connection',s=>{
 s.emit('init',{id:s.id,players:pub(),music:state()});s.emit('chatHistory',chatHist);
 s.on('join',(p,ack)=>{p=p||{};const cid=String(p.clientId||s.id).slice(0,64);const nick=String(p.nick||'손님').trim().slice(0,16)||'손님';
  if(isBad(nick)){if(typeof ack==='function')ack({ok:false,error:'bad'});return;}
  if(nickTaken(nick,cid,s.id)){if(typeof ack==='function')ack({ok:false,error:'nick'});s.emit('nickTaken',nick);return;}
  for(const id in players){if(id!==s.id&&players[id].cid===cid){delete players[id];io.emit('leave',id);const os=io.sockets.sockets.get(id);if(os)os.disconnect(true);}}
  const re=!!players[s.id];players[s.id]={cid,nick,gender:p.gender,outfit:p.outfit,skin:p.skin,style:p.style,pos:[0,0,4],rot:0,seat:null};io.emit('player',{id:s.id,...players[s.id]});
  if(typeof ack==='function')ack({ok:true});if(!re)io.emit('chat',{sys:true,text:nick+' 님 입장!'});});
 s.on('profile',(p,ack)=>{const pl=players[s.id];if(!pl)return;const nn=String(p.nick||pl.nick).trim().slice(0,16)||pl.nick;if(isBad(nn)){if(typeof ack==='function')ack({ok:false,error:'bad'});return;}if(nickTaken(nn,pl.cid,s.id)){if(typeof ack==='function')ack({ok:false,error:'nick'});s.emit('nickTaken',nn);return;}if(typeof ack==='function')ack({ok:true});Object.assign(pl,{nick:nn,gender:p.gender,outfit:p.outfit,skin:p.skin,style:p.style});io.emit('player',{id:s.id,...pl});});
 s.on('move',m=>{const pl=players[s.id];if(!pl)return;pl.pos=m.pos;pl.rot=m.rot;pl.dance=(+m.dance|0)%4;s.broadcast.volatile.emit('move',{id:s.id,pos:m.pos,rot:m.rot,dance:pl.dance});});
 s.on('seat',seat=>{const pl=players[s.id];if(!pl)return;pl.seat=seat;io.emit('seat',{id:s.id,seat});});
 s.emit('glasses',glassPub());
 s.emit('table',tablePub());
 s.on('drink',type=>{const pl=players[s.id];if(!pl||!pl.seat||!DRINKS.includes(type))return;if(!canDrink(pl.seat,type))return;const n=Date.now();if(n-(pl.lastDrink||0)<2000)return;pl.lastDrink=n;
  if(BAR_Z[pl.seat]!==undefined){delete glasses[pl.seat];io.emit('glasses',glassPub());}const tb=pochaTable(pl.seat);if(tb)tables[tb].t=n;io.emit('drink',{id:s.id,type});});
 s.on('serve',q=>{const pl=players[s.id];if(!pl||pl.seat)return;const kind=q&&q.kind==='cocktail'?'cocktail':'whiskey';const x=+(q&&q.x),z=+(q&&q.z);if(!(x>=BZ.x0-.2&&x<=BZ.x1+.2&&z>=BZ.z0-.2&&z<=BZ.z1+.2))return;
  const n=Date.now();if(n-(pl.lastServe||0)<3000)return;pl.lastServe=n;s.broadcast.emit('pour',{id:s.id,kind});
  const seated=Object.values(players).filter(o=>o.seat&&BAR_Z[o.seat]!==undefined&&!glasses[o.seat]).map(o=>o.seat);
  const cand=seated.length?seated:Object.keys(BAR_Z).filter(k=>!glasses[k]);if(!cand.length)return;
  cand.sort((a,b)=>Math.abs(BAR_Z[a]-z)-Math.abs(BAR_Z[b]-z));const seat=cand[0];
  setTimeout(()=>{glasses[seat]={t:Date.now(),type:kind};io.emit('glasses',glassPub());},1400);});
 s.on('pickup',kind=>{const pl=players[s.id];if(!pl||pl.seat)return;const src=PICK[kind];if(!src)return;const p=pl.pos||[0,0,0];if(Math.hypot(p[0]-src.x,p[2]-src.z)>src.r)return;
  const n=Date.now();if(n-(pl.lastAct||0)<500)return;pl.lastAct=n;pl.carry=kind;io.emit('carry',{id:s.id,kind});});
 s.on('place',()=>{const pl=players[s.id];if(!pl||!pl.carry)return;const p=pl.pos||[0,0,0];let best=pochaTable(pl.seat),bd=1.9;if(!best)for(const k in TABLES){const t=TABLES[k],d=Math.hypot(p[0]-t[0],p[2]-t[1]);if(d<bd){bd=d;best=k;}}
  if(!best)return;const n=Date.now();if(n-(pl.lastAct||0)<500)return;pl.lastAct=n;const tb=tables[best];if(tb.items.length>=8)return;tb.items.push(pl.carry);tb.t=n;pl.carry=null;io.emit('carry',{id:s.id,kind:null});io.emit('table',tablePub());});
 s.on('clearTable',()=>{const pl=players[s.id];if(!pl)return;const p=pl.pos||[0,0,0];let best=pochaTable(pl.seat);if(!best)for(const k in TABLES){const t=TABLES[k];if(Math.hypot(p[0]-t[0],p[2]-t[1])<1.9)best=k;}
  if(!best||!tables[best].items.length)return;const n=Date.now();if(n-(pl.lastAct||0)<1000)return;pl.lastAct=n;tables[best].items=[];io.emit('table',tablePub());});
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
 s.on('disconnect',()=>{const pl=players[s.id];delete players[s.id];io.emit('leave',s.id);if(pl)io.emit('chat',{sys:true,text:pl.nick+' 님 퇴장'});});
});
server.listen(PORT,'0.0.0.0',()=>{tick();ensureDefault();
 const ext=process.env.RENDER_EXTERNAL_URL;if(ext)setInterval(()=>fetch(ext.replace(/\/$/,'')+'/health').catch(()=>{}),10*60*1000);console.log('ERRDAY 7080 나이트 서버: http://localhost:'+PORT);console.log('관리자 로그인: 사용 가능 (고정 비밀번호)');
 const n=require('os').networkInterfaces();for(const k in n)for(const a of n[k])if(a.family==='IPv4'&&!a.internal)console.log('같은 Wi-Fi 친구 접속: http://'+a.address+':'+PORT);});
