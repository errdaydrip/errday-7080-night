// 링크 자동 인식: 유튜브 / 직접 파일·스트림 / 사운드클라우드 / 비메오 / 그 외 사이트 안내
const net=require('net');
const FILE_RE=/\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|mp4|m4v|webm|mov|m3u8|m3u|pls)(\?|#|$)/i;
const BLOCK=[ // 재생/동기화 불가 사이트 → 이유
 [/(^|\.)spotify\.com$|^spotify\.link$/,'스포티파이','로그인·DRM 때문에 외부 재생은 30초 미리듣기만 되고 위치 맞추기가 안 돼요'],
 [/(^|\.)music\.apple\.com$|(^|\.)itunes\.apple\.com$/,'애플뮤직','구독 로그인·DRM이 필요해서 다른 사람 화면에서 재생할 수 없어요'],
 [/(^|\.)melon\.com$/,'멜론','멜론은 외부 재생(퍼가기)을 지원하지 않아요 (이용권·DRM)'],
 [/(^|\.)bugs\.co\.kr$/,'벅스','벅스는 외부 재생(퍼가기)을 지원하지 않아요 (이용권·DRM)'],
 [/(^|\.)genie\.co\.kr$/,'지니','지니는 외부 재생(퍼가기)을 지원하지 않아요 (이용권·DRM)'],
 [/(^|\.)vibe\.naver\.com$|(^|\.)flo\.com$|(^|\.)music-flo\.com$/,'바이브/플로','이용권·DRM 음원이라 외부 재생이 안 돼요'],
 [/(^|\.)twitch\.tv$/,'트위치','트위치는 이 사이트 주소에서만 퍼가기를 허용하고 생방송이라 모두 같은 위치로 맞출 수 없어요'],
 [/(^|\.)deezer\.com$|(^|\.)tidal\.com$|(^|\.)music\.amazon\./,'음원 스트리밍','구독 로그인·DRM이 필요해서 외부 재생이 안 돼요'],
 [/(^|\.)instagram\.com$|(^|\.)tiktok\.com$|(^|\.)facebook\.com$/,'SNS','로그인이 필요하거나 외부 재생 API가 없어서 동기화 재생이 안 돼요'],
];
function privateHost(h){h=h.replace(/^\[|\]$/g,'');if(/^(localhost|.*\.local|.*\.internal)$/i.test(h))return true;
 if(net.isIP(h)===4){const [a,b]=h.split('.').map(Number);return a===10||a===127||a===0||(a===169&&b===254)||(a===172&&b>=16&&b<32)||(a===192&&b===168);}
 if(net.isIP(h)===6)return /^(::1|fc|fd|fe80)/i.test(h);return false;}
function parseUrl(s){s=String(s||'').trim();if(!/^[a-z][a-z0-9+.-]*:/i.test(s))s='https://'+s;let u;try{u=new URL(s);}catch(e){return null;}
 if(!/^https?:$/.test(u.protocol)||privateHost(u.hostname))return null;return u;}
function parseYT(u){const h=u.hostname.replace(/^(www|m|music)\./,'');if(!/^(youtube\.com|youtu\.be|youtube-nocookie\.com)$/.test(h))return null;
 const list=u.searchParams.get('list');let v=u.searchParams.get('v');
 if(h==='youtu.be')v=u.pathname.slice(1).split('/')[0];const m=u.pathname.match(/^\/(shorts|embed|live|v)\/([\w-]{11})/);if(m)v=m[2];
 if(v&&!/^[\w-]{11}$/.test(v))v=null;if(!v&&!list)return null;return {list,v};}
async function getJSON(url){const r=await fetch(url,{signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}
const fileTitle=u=>decodeURIComponent(u.pathname.split('/').pop()||u.hostname).replace(/\.[a-z0-9]+$/i,'')||u.hostname;
async function probe(u){ // content-type 확인 (HEAD 실패 시 GET 앞부분)
 for(const method of ['HEAD','GET']){try{const r=await fetch(u.href,{method,redirect:'follow',signal:AbortSignal.timeout(8000),headers:{'User-Agent':'Mozilla/5.0',Range:'bytes=0-200000'}});
  const ct=(r.headers.get('content-type')||'').toLowerCase();const icy=r.headers.get('icy-name');
  if(method==='HEAD'&&(!r.ok||/html/.test(ct)))continue;
  let body='';if(/html/.test(ct))body=(await r.text()).slice(0,300000);else{try{r.body&&r.body.cancel();}catch(e){}}
  return {ct,icy,body,status:r.status};}catch(e){if(method==='GET')return {err:e.message};}}return {};}
// → {service, items:[{type,...,title}]} 또는 {error}
async function resolve(raw){const u=parseUrl(raw);if(!u)return {error:'http/https 인터넷 링크만 넣을 수 있어요'};
 const host=u.hostname.replace(/^www\./,'');
 const yt=parseYT(u);if(yt)return {service:'유튜브',yt};
 if(/(^|\.)soundcloud\.com$|^snd\.sc$/.test(host)){try{const j=await getJSON('https://soundcloud.com/oembed?format=json&url='+encodeURIComponent(u.href));
   const set=/\/sets\//.test(u.pathname)||/playlist/.test(j.html||'');return {service:'사운드클라우드',items:[{type:'sc',url:u.href,set,title:j.title||'SoundCloud'}]};}
  catch(e){return {error:'사운드클라우드 곡을 찾지 못했어요 (비공개·삭제 곡일 수 있어요)'};}}
 if(/(^|\.)vimeo\.com$/.test(host)){try{const j=await getJSON('https://vimeo.com/api/oembed.json?url='+encodeURIComponent(u.href));
   return {service:'비메오',items:[{type:'vimeo',vimeoId:String(j.video_id),url:u.href,title:j.title||'Vimeo',dur:j.duration||undefined}]};}
  catch(e){return {error:'비메오 영상을 찾지 못했어요 (비공개이거나 퍼가기가 막힌 영상일 수 있어요)'};}}
 for(const [re,name,why] of BLOCK)if(re.test(host))return {error:`${name} 링크는 넣을 수 없어요: ${why}. 같은 곡을 유튜브나 사운드클라우드 링크로 넣어 주세요.`};
 const isFile=FILE_RE.test(u.pathname);const p=await probe(u);
 const media=/^(audio|video)\//.test(p.ct||'')||/mpegurl|ogg|octet-stream/.test(p.ct||'')&&isFile||!!p.icy;
 if(isFile||media){if(p.err&&!isFile)return {error:'링크에 접속할 수 없어요'};if(p.status>=400)return {error:`파일을 불러올 수 없어요 (HTTP ${p.status})`};
  const live=/\.(m3u8|m3u|pls)(\?|$)/i.test(u.pathname)||/mpegurl/.test(p.ct||'')||!!p.icy;
  return {service:live?'인터넷 라디오/스트림':'음악·영상 파일',items:[{type:'url',url:u.href,live,hls:/\.m3u8(\?|$)/i.test(u.pathname)||/mpegurl/.test(p.ct||''),title:p.icy||fileTitle(u)}]};}
 if(p.body){ // 일반 웹페이지: og:audio / og:video / <audio src> 에서 파일 찾기
  const m=p.body.match(/<meta[^>]+property=["']og:(?:audio|video)(?::(?:secure_)?url)?["'][^>]+content=["']([^"']+)["']/i)||p.body.match(/<(?:audio|source)[^>]+src=["']([^"']+\.(?:mp3|m4a|ogg|wav|mp4|webm|m3u8)[^"']*)["']/i);
  if(m){const inner=parseUrl(new URL(m[1].replace(/&amp;/g,'&'),u.href).href);if(inner&&inner.href!==u.href&&!/\/\/(www\.)?(youtube|vimeo|soundcloud)/.test(inner.href)&&FILE_RE.test(inner.pathname)){const t=(p.body.match(/<title>([^<]{1,200})/i)||[])[1];
   const r=await resolve(inner.href);if(r.items){r.items.forEach(i=>{if(t)i.title=t.trim();});r.service=host+' (페이지 속 음원)';}return r;}
   if(inner&&(parseYT(inner)||/vimeo|soundcloud/.test(inner.hostname)))return resolve(inner.href);}
  return {error:`${host} 페이지에서 재생할 수 있는 음원을 찾지 못했어요. 유튜브·사운드클라우드·비메오 링크나 mp3 같은 파일 직접 링크를 넣어 주세요.`};}
 return {error:'링크를 열 수 없어요'+(p.status?` (HTTP ${p.status})`:'')};}
module.exports={resolve,parseUrl,parseYT,privateHost};
