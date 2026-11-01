// 벽시계 기반 "가상 라디오": 아무도 접속하지 않아도 경과 시간으로 현재 곡/위치를 계산
// music: {playlist,index,playing,startedAt,pausedAt,shuffle}, durOf(track)->초|undefined, next()->다음 index
function advance(music,durOf,now,next){
  if(!music.playing||music.index<0||!music.playlist.length)return false;
  let changed=false,guard=0;
  while(guard++<5000){const t=music.playlist[music.index];const d=t&&durOf(t);
    if(!d||d<=0)break; // 길이 모름 → 클라이언트가 알려줄 때까지 대기
    const endAt=music.startedAt+d*1000; if(now<endAt)break;
    music.index=next();music.startedAt=endAt;music.pausedAt=0;changed=true;}
  return changed;}
module.exports={advance};
