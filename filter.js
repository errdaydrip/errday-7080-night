// 심한 욕설/비하어 필터 (서버). 정규화: 소문자, 글자 사이 공백·특수문자·숫자 제거.
const KO=[
 '[씨시쉬싀씌쒸ㅆㅅ][이]?[발빨바팔벌뻘벨불붕]', // 씨발 계열 (시발점 등은 아래 예외)
 '[ㅆㅅ]ㅂ','ㅂㅅ','ㅄ','ㅈㄹ','ㅈ같','ㄴㄱㅁ',
 '좆','좃같','좇같','존나','졸라','씹[새쌔할년놈창팔]','썅',
 '[병븅빙븽][신딱]','[개게][새쌔세쉐색섀][끼기캬]','개새','개색','개년','개놈','개좆',
 '니[미애]미?','니엄마','느금','느개비','니애비','엠창','애미','애비없','에미',
 '지랄','염병','창녀','걸레년','미친[년놈]','또라이','후장','보지털','자지털'
];
const EN=['fuck','fuk','fck','motherf','bitch','cunt','nigger','nigga','faggot','fag','asshole','dick?head','pussy','whore','slut','bastard'];
// 정상 단어 예외: 정규화 문자열 기준으로 매칭 위치를 무시
const ALLOW=['시발점','시발역','시발택시','다시발','시발전','신병','병신청','병신고','병신문','병신호','병신발','니미터','개새기다','개새로','개색깔','애미안','애비뉴','에미넴','에미상','에미레이트','개년도','개놈들이','지랄탄','fagot','dickens','scunthorpe','니미츠','시발생','시발표','시발견','시발사','시발령','시발매','시발음','니미소','시바견','시바이누','시바스','이시바'];
const RE=new RegExp(KO.concat(EN).join('|'),'g');
const SUB={'@':'a','$':'s','0':'o','1':'i','!':'i','3':'e','5':'s','€':'e'};
function norm(text){const chars=[],map=[];const s=String(text);
 for(let i=0;i<s.length;i++){let c=s[i].toLowerCase();
  if(/[a-z가-힣ㄱ-ㅎㅏ-ㅣ]/.test(c)){chars.push(c);map.push(i);}
  else if(SUB[c]&&chars.length&&/[a-z]/.test(chars[chars.length-1])){chars.push(SUB[c]);map.push(i);} // 영어 단어 안의 치환 문자
 }return{n:chars.join(''),map};}
function findSpans(text){const{n,map}=norm(text);const allow=[];
 for(const w of ALLOW){let k=n.indexOf(w);while(k>=0){allow.push([k,k+w.length]);k=n.indexOf(w,k+1);}}
 const spans=[];let m;RE.lastIndex=0;
 while((m=RE.exec(n))){const a=m.index,b=a+m[0].length;if(!allow.some(([x,y])=>a>=x&&b<=y))spans.push([map[a],map[b-1]+1]);}
 return spans;}
function clean(text){const sp=findSpans(text);if(!sp.length)return String(text);let out='',last=0;
 for(const[a,b]of sp.sort((x,y)=>x[0]-y[0])){if(a<last)continue;out+=String(text).slice(last,a)+'***';last=b;}return out+String(text).slice(last);}
const isBad=t=>findSpans(t).length>0;
module.exports={clean,isBad,norm};
