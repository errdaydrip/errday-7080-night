const express=require('express'),http=require('http'),path=require('path'),fs=require('fs'),multer=require('multer');
const {Server}=require('socket.io');
const PORT=process.env.PORT||8080, UP=path.join(__dirname,'uploads');
fs.mkdirSync(UP,{recursive:true});
const ADMIN_PW=String(process.env.ADMIN_PASSWORD||'6651'); // 제작자가 정한 고정 비밀번호
const tokens=new Set();const isAdmin=t=>!!t&&tokens.has(t);
const app=express(),server=http.createServer(app),io=new Server(server,{maxHttpBufferSize:1e6});
app.use(express.static(path.join(__dirname,'public')));
app.use(express.json());
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
 for(const it of items){if(!it.title)it.title=await ytTitle(it.id);music.playlist.push({type:'yt',id:'yt_'+it.id+'_'+Date.now(),videoId:it.id,title:it.title,by:req.body.by||'관리자'});}
 if(music.index<0){music.index=music.playlist.length-items.length;music.playing=true;music.startedAt=Date.now();music.pausedAt=0;}
 broadcastMusic();res.json({added:items.length});});
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
 music.playlist.push(t); if(music.index<0){music.index=music.playlist.length-1;music.playing=true;music.startedAt=Date.now();}
 broadcastMusic(); res.json(t);
}));
const state=()=>({...music,serverNow:Date.now()});
function broadcastMusic(){io.emit('music',state());}
io.on('connection',s=>{
 s.emit('init',{id:s.id,players,music:state()});
 s.on('join',p=>{players[s.id]={nick:String(p.nick||'손님').slice(0,16),gender:p.gender,outfit:p.outfit,skin:p.skin,style:p.style,pos:[0,0,4],rot:0,seat:null};io.emit('player',{id:s.id,...players[s.id]});
  io.emit('chat',{sys:true,text:players[s.id].nick+' 님 입장!'});});
 s.on('profile',p=>{const pl=players[s.id];if(!pl)return;Object.assign(pl,{nick:String(p.nick||pl.nick).slice(0,16),gender:p.gender,outfit:p.outfit,skin:p.skin,style:p.style});io.emit('player',{id:s.id,...pl});});
 s.on('move',m=>{const pl=players[s.id];if(!pl)return;pl.pos=m.pos;pl.rot=m.rot;pl.dance=(+m.dance|0)%4;s.broadcast.volatile.emit('move',{id:s.id,pos:m.pos,rot:m.rot,dance:pl.dance});});
 s.on('seat',seat=>{const pl=players[s.id];if(!pl)return;pl.seat=seat;io.emit('seat',{id:s.id,seat});});
 s.on('chat',text=>{const pl=players[s.id];if(!pl)return;text=String(text).slice(0,200);if(!text.trim())return;
  io.emit('chat',{id:s.id,nick:pl.nick,text});});
 s.on('music',cmd=>{if(!cmd||!isAdmin(cmd.token)&&cmd.type!=='ended'&&cmd.type!=='error')return;const now=Date.now();
  if(cmd.type==='play'&&!music.playing&&music.index>=0){music.startedAt=now-music.pausedAt;music.playing=true;}
  else if(cmd.type==='pause'&&music.playing){music.pausedAt=now-music.startedAt;music.playing=false;}
  else if(cmd.type==='skip'||cmd.type==='ended'||cmd.type==='error'){ if(cmd.type!=='skip'&&cmd.index!==music.index)return;
   if(cmd.type==='error')io.emit('chat',{sys:true,text:'⚠ 재생할 수 없는 곡이라 다음 곡으로 넘어가요: '+(music.playlist[music.index]||{}).title});
   if(cmd.type==='ended'&&Date.now()-music.startedAt<3000)return;
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
server.listen(PORT,'0.0.0.0',()=>{console.log('ERRDAY 7080 나이트 서버: http://localhost:'+PORT);console.log('관리자 로그인: 사용 가능 (고정 비밀번호)');
 const n=require('os').networkInterfaces();for(const k in n)for(const a of n[k])if(a.family==='IPv4'&&!a.internal)console.log('같은 Wi-Fi 친구 접속: http://'+a.address+':'+PORT);});
