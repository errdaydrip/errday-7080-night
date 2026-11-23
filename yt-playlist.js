/* 유튜브 재생목록 HTML → {id,title,dur?}[]
   2026년 이후 목록 페이지는 playlistVideoRenderer 대신 lockupViewModel(contentId)를 씀. */
function clockDur(t){if(!t)return 0;const p=String(t).split(':').map(n=>+n);if(!p.length||p.some(n=>!Number.isFinite(n)))return 0;if(p.length===2)return p[0]*60+p[1];if(p.length===3)return p[0]*3600+p[1]*60+p[2];return 0;}
function extractInitialData(html){const i=String(html).indexOf('ytInitialData');if(i<0)return null;const j=html.indexOf('{',i);if(j<0)return null;let d=0;for(let k=j;k<html.length;k++){const c=html[k];if(c==='{')d++;else if(c==='}'){d--;if(d===0){try{return JSON.parse(html.slice(j,k+1));}catch(e){return null;}}}}return null;}
function walk(o,fn){if(!o)return;if(Array.isArray(o)){o.forEach(x=>walk(x,fn));return;}if(typeof o!=='object')return;fn(o);for(const k in o)walk(o[k],fn);}
function parsePlaylistHtml(html){const out=[],seen=new Set();
 const push=(id,title,dur)=>{if(!id||typeof id!=='string'||id.length!==11||seen.has(id))return;if(!/^[\w-]{11}$/.test(id))return;seen.add(id);const item={id,title:title||null};if(dur>0)item.dur=dur;out.push(item);};
 const data=extractInitialData(html);
 if(data)walk(data,o=>{
  const lv=o.lockupViewModel;if(lv&&lv.contentId&&(!lv.contentType||lv.contentType==='LOCKUP_CONTENT_TYPE_VIDEO')){
   const title=lv.metadata&&lv.metadata.lockupMetadataViewModel&&lv.metadata.lockupMetadataViewModel.title&&lv.metadata.lockupMetadataViewModel.title.content;
   const blob=JSON.stringify(lv.contentImage||{});const dm=/"text":"(\d+:\d{2}(?::\d{2})?)"/.exec(blob);
   push(lv.contentId,title,clockDur(dm&&dm[1]));return;}
  const r=o.playlistVideoRenderer;if(r&&r.videoId){const title=r.title&&((r.title.runs&&r.title.runs[0]&&r.title.runs[0].text)||r.title.simpleText);push(r.videoId,title,+(r.lengthSeconds||0)||clockDur(r.lengthText&&r.lengthText.simpleText));}
 });
 if(!out.length){ /* 예전 페이지 문자열 패턴 */
  const re=/"playlistVideoRenderer":\{"videoId":"([\w-]{11})".*?"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/g;let m;
  while((m=re.exec(html))){let title=m[2];try{title=JSON.parse('"'+m[2]+'"');}catch(e){}push(m[1],title);}
 }
 return out.slice(0,200);}
module.exports={parsePlaylistHtml,clockDur,extractInitialData};
