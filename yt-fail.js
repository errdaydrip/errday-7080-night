// 유튜브(및 기타) 재생 오류가 연속으로 나면 다음 곡으로 계속 넘기지 않고 멈춤
const LIMIT=3;
const YT_ERR={2:'잘못된 ID',5:'HTML5 오류',100:'삭제/비공개',101:'퍼가기 금지',150:'퍼가기 금지',153:'재생 설정 오류'};
function errLabel(code){
  if(code==null||code==='')return '';
  const n=+code;
  if(Number.isFinite(n)&&YT_ERR[n])return YT_ERR[n];
  return String(code);
}
// music을 제자리에서 바꾸고 {streak, stopped, message}를 반환
function applyError(music,nextIndex,now,streak,opts){
  const title=(music.playlist[music.index]||{}).title||'';
  const label=errLabel(opts&&opts.code);
  const tag=label?' (오류 '+label+')':'';
  const next=streak+1;
  if(next>=LIMIT){
    if(music.playing){
      music.pausedAt=now-(music.startedAt||now);
      music.playing=false;
    }
    return {streak:next,stopped:true,message:'⚠ 여러 곡이 연속으로 재생되지 않아 음악을 멈췄어요. 잠시 후 다시 재생해 주세요'+tag};
  }
  if(music.playlist.length){
    music.index=nextIndex();
    music.startedAt=now;
    music.pausedAt=0;
    music.playing=true;
  }
  return {streak:next,stopped:false,message:'⚠ 재생할 수 없는 곡이라 다음 곡으로 넘어가요: '+title+tag};
}
module.exports={LIMIT,applyError,errLabel};
