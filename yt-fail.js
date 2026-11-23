// 재생 불가 곡은 다음 곡으로 넘김. 연속 실패해도 멈추지 않음. 안내 메시지는 내지 않음.
const SKIP_DELAY_MS=1500;
function nextSkipWait(now,lastAt,delay){
  const d=delay==null?SKIP_DELAY_MS:delay;
  if(!lastAt)return 0;
  return Math.max(0,d-(now-lastAt));
}
function applyError(music,nextIndex,now){
  if(music.playlist.length){
    music.index=nextIndex();
    music.startedAt=now;
    music.pausedAt=0;
    music.playing=true;
  }
  return {skipped:true,stopped:false};
}
module.exports={SKIP_DELAY_MS,nextSkipWait,applyError};
