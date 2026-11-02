// 캐릭터 꾸미기 옵션 (브라우저 + 서버 + 테스트 공용)
(function(root){
 const PALETTE=[['#1a1a1a','검정'],['#f5f5f5','흰색'],['#e0262e','빨강'],['#ff8c00','주황'],['#ffd400','노랑'],['#2f9e44','초록'],['#2f7bff','파랑'],['#24306e','남색'],['#7b2cbf','보라'],['#ff69b4','분홍']];
 const STYLES=['basic','suit','disco','hanbok','aerobic'],ACC=['none','glasses','sunglasses'],ACC_NAME={none:'없음',glasses:'안경',sunglasses:'선글라스'};
 const HAIR={m:[['','기본'],['m1','크롭'],['m2','가르마'],['m3','쉐이브']],f:[['','기본'],['f1','단발'],['f2','포니테일'],['f3','긴머리']]};
 // 성별/의상별 기본 상의·하의 색
 const DEF={m:{basic:['#f5f5f5','#2f7bff'],suit:['#24306e','#24306e'],disco:['#f5f5f5','#2f7bff'],hanbok:['#2f9e44','#1a1a1a'],aerobic:['#f5f5f5','#ff69b4']},
            f:{basic:['#f5f5f5','#2f7bff'],suit:['#7b2cbf','#7b2cbf'],disco:['#2f7bff','#2f7bff'],hanbok:['#ffd400','#e0262e'],aerobic:['#f5f5f5','#ff69b4']}};
 const HEX=/^#[0-9a-fA-F]{6}$/;
 // 예전 저장값(outfit 한 가지 색)도 그대로: 옛날 색은 상의로 (여자 한복은 치마가 주색이라 하의로)
 function resolve(o){o=o||{};const g=o.gender==='f'?'f':'m',st=STYLES.includes(o.style)?o.style:'suit',d=DEF[g][st];
  const legacy=HEX.test(o.outfit||'')?o.outfit:null,legacyBottom=g==='f'&&st==='hanbok';
  const top=HEX.test(o.top||'')?o.top:(legacy&&!legacyBottom?legacy:d[0]);
  const bottom=HEX.test(o.bottom||'')?o.bottom:(legacy&&legacyBottom?legacy:d[1]);
  const acc=ACC.includes(o.acc)?o.acc:'none';const hair=HAIR[g].some(h=>h[0]===o.hair)?o.hair:'';
  return{gender:g,style:st,top,bottom,acc,hair};}
 const api={PALETTE,STYLES,ACC,ACC_NAME,HAIR,DEF,resolve,HEX};
 if(typeof module!=='undefined')module.exports=api;else root.LOOKS=api;
})(typeof window!=='undefined'?window:this);
