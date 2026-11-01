// 나이트 웨이터 테이블 리필 규칙 (서버/테스트 공용)
// 완전히 빈 테이블 → 맥주 3 + 과일안주 1, 일부 차 있으면 빈 칸만 맥주로
function refill(items,uses){const empty=items.every(i=>!i);if(empty)return['beer','beer','beer','fruit'].map(k=>({k,u:uses}));
 return items.map(i=>i||{k:'beer',u:uses});}
const needs=items=>items.some(i=>!i);
module.exports={refill,needs};
