(function (root) {
  'use strict';
  const EVENTS = ['雷射突襲','斷橋逃生','救援小機器人','幻影誘敵','彈幕防衛','巨砲反擊','追蹤飛彈','拘束重裝機','重力逆轉','核心決戰'];
  const TAGS = ['真數警戒區','真數警戒區','真數警戒區','真數警戒區','結界啟動','結界啟動','結界啟動','結界啟動','逆轉魔王','逆轉魔王'];
  function rng(seed) { let a=seed>>>0; return function(){a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}; }
  const minus = n => n < 0 ? '−'+Math.abs(n) : ''+n;
  const lin = a => a===0?'x':a>0?'x − '+a:'x + '+(-a);
  const neg = b => b===0?'−x':minus(b)+' − x';
  const log = (x,b) => 'log'+(b?'<sub>'+b+'</sub>':'')+'('+x+')';
  const interval = (lo,hi,lc=false,hc=false) => ({lo,hi,lc:Number.isFinite(lo)&&lc,hc:Number.isFinite(hi)&&hc});
  function formatAnswer(a) {
    if(a.lo===-Infinity&&a.hi===Infinity)return '所有實數';
    if(a.lo===-Infinity)return 'x '+(a.hc?'≤':'＜')+' '+minus(a.hi);
    if(a.hi===Infinity)return 'x '+(a.lc?'≥':'＞')+' '+minus(a.lo);
    return minus(a.lo)+' '+(a.lc?'≤':'＜')+' x '+(a.hc?'≤':'＜')+' '+minus(a.hi);
  }
  function acceptAnswer(q,a) {return a.lo===q.answer.lo&&a.hi===q.answer.hi&&(!Number.isFinite(a.lo)||a.lc===q.answer.lc)&&(!Number.isFinite(a.hi)||a.hc===q.answer.hc);}
  function scoreFor(points,errors,hinted){return Math.round(points*(hinted||errors>=2?.6:errors===1?.8:1));}
  function makeQuestion(type,a,variant=0) {
    const q={type,event:EVENTS[type],tag:TAGS[type],points:type<4?5:type<8?10:20,hint:'',steps:[],instruction:type<4?'設定所有對數都有意義的 x 範圍':'設定不等式的完整解集',params:{a,variant}};
    let b,c,u,n;
    switch(type){
      case 0:q.html=log(lin(a));q.answer=interval(a,Infinity);q.domain=x=>x>a;q.check=q.domain;q.hint='對數的真數必須大於 0；先看 '+lin(a)+' ＞ 0。';q.steps=[lin(a)+' ＞ 0','x ＞ '+minus(a),'左端空心，往右延伸。'];break;
      case 1:b=a+5;q.html=log(neg(b));q.answer=interval(-Infinity,b);q.domain=x=>x<b;q.check=q.domain;q.hint=neg(b)+' 必須大於 0。把 x 移到右邊再想。';q.steps=[neg(b)+' ＞ 0','x ＜ '+minus(b),'右端空心，往左延伸。'];break;
      case 2:u=a+4;q.html=log(lin(a))+' + '+log(neg(u));q.answer=interval(a,u);q.domain=x=>x>a&&x<u;q.check=q.domain;q.hint='兩個真數都要大於 0，最後取交集。';q.steps=[lin(a)+' ＞ 0 → x ＞ '+minus(a),neg(u)+' ＞ 0 → x ＜ '+minus(u),'交集：'+formatAnswer(q.answer)];break;
      case 3:b=a-2;q.html=log(lin(a))+' + '+log(lin(b));q.answer=interval(a,Infinity);q.domain=x=>x>a&&x>b;q.check=q.domain;q.hint='兩個條件都是 x 大於某數，要同時滿足。';q.steps=['x ＞ '+minus(a)+'，且 x ＞ '+minus(b),'取較嚴格的下界：x ＞ '+minus(a),'左端空心，右端 ＋∞。'];break;
      case 4:q.html=log(lin(a))+' ＜ 1';q.answer=interval(a,a+10);q.domain=x=>x>a;q.check=x=>q.domain(x)&&Math.log10(x-a)<1-1e-10;q.hint='1 = log 10。別忘了真數 '+lin(a)+' ＞ 0。';q.steps=['真數條件：x ＞ '+minus(a),log(lin(a))+' ＜ log 10 → '+lin(a)+' ＜ 10','交集：'+formatAnswer(q.answer)];break;
      case 5:b=a-6;q.html=log(lin(b))+' ≥ 1';q.answer=interval(b+10,Infinity,true);q.domain=x=>x>b;q.check=x=>q.domain(x)&&Math.log10(x-b)>=1-1e-10;q.hint='1 = log 10，真數至少要多少？注意「≥」包含端點。';q.steps=['真數條件：x ＞ '+minus(b),lin(b)+' ≥ 10 → x ≥ '+minus(b+10),'符合真數條件，所以 '+formatAnswer(q.answer)];break;
      case 6:b=a+6;q.html=log(neg(b))+' ＞ 0';q.answer=interval(-Infinity,b-1);q.domain=x=>x<b;q.check=x=>q.domain(x)&&Math.log10(b-x)>1e-10;q.hint='0 = log 1，所以 '+neg(b)+' ＞ 1。';q.steps=['真數條件：x ＜ '+minus(b),neg(b)+' ＞ 1 → x ＜ '+minus(b-1),'交集：'+formatAnswer(q.answer)];break;
      case 7:c=2*a;q.html=log(c===0?'2x':c>0?'2x − '+c:'2x + '+(-c))+' ≤ 1';q.answer=interval(a,a+5,false,true);q.domain=x=>x>a;q.check=x=>q.domain(x)&&Math.log10(2*(x-a))<=1+1e-10;q.hint='真數必須大於 0，且不能超過 10；10 ÷ 2 = 5。';q.steps=['0 ＜ 2('+lin(a)+') ≤ 10','同除以 2：0 ＜ '+lin(a)+' ≤ 5','所以 '+formatAnswer(q.answer)];break;
      case 8:n=variant%2===0?1:2;c=2**n;q.html=log(lin(a),'<span class="frac"><span>1</span><span>2</span></span>')+' ≥ −'+n;q.answer=interval(a,a+c,false,true);q.domain=x=>x>a;q.check=x=>q.domain(x)&&Math.log(x-a)/Math.log(.5)>=-n-1e-10;q.hint='底數 1/2 小於 1，去掉對數時方向反轉；(1/2)^(−'+n+') = '+c+'。';q.steps=['真數條件：x ＞ '+minus(a),'底數小於 1，方向反轉：'+lin(a)+' ≤ '+c,'交集：'+formatAnswer(q.answer)];break;
      case 9:b=a+2;q.html=log(lin(a),'2')+' + '+log(lin(b),'2')+' ≤ 3';q.answer=interval(b,a+4,false,true);q.domain=x=>x>a&&x>b;q.check=x=>q.domain(x)&&Math.log2((x-a)*(x-b))<=3+1e-10;q.hint='兩個真數相差 2；2³ = 8，而 4 × 2 = 8。先找真數條件。';q.instruction='心算線索：兩真數相差 2；4 × 2 = 8';q.steps=['兩個真數都大於 0 → x ＞ '+minus(b),'合併對數：('+lin(a)+')('+lin(b)+') ≤ 8','在真數範圍內，乘積隨 x 增加；4 × 2 = 8 → x ≤ '+minus(a+4),'交集：'+formatAnswer(q.answer)];break;
      default:throw new Error('Unknown question type');
    }
    q.answerText=formatAnswer(q.answer);q.plain=q.html.replace(/<sub>([\s\S]*?)<\/sub>/g,(_,b)=>b.includes('frac')?'_(1/2)':'_'+b).replace(/<[^>]+>/g,'').replace(/&[^;]+;/g,'');return q;
  }
  function campaign(seed) {
    const random=rng(seed),players=[[],[],[]];
    for(let t=0;t<10;t++) {const pool=t===2?[-2,-1,0,1]:t===9?[0,1,2,3]:[0,1,2,3];for(let j=pool.length-1;j>0;j--){const k=Math.floor(random()*(j+1));[pool[j],pool[k]]=[pool[k],pool[j]];}const v=Math.floor(random()*2);players.forEach((p,i)=>p.push(makeQuestion(t,pool[i],v)));}
    return players;
  }
  const api={EVENTS,TAGS,rng,makeQuestion,campaign,formatAnswer,acceptAnswer,scoreFor,interval};root.LogMath=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
