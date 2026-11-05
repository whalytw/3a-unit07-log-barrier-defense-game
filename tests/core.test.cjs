const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../math.js');
const InputRouter=require('../input.js');

function inside(q,x){const a=q.answer;return (x>a.lo||(a.lc&&x===a.lo))&&(x<a.hi||(a.hc&&x===a.hi));}
test('all generated answer intervals match the actual logarithmic conditions',()=>{
  let checked=0;
  for(let seed=1;seed<=200;seed++)for(const qs of M.campaign(seed))for(const q of qs){
    assert.equal(M.acceptAnswer(q,q.answer),true);
    for(let n=-40;n<=100;n++){const x=n/4;assert.equal(inside(q,x),q.check(x),`${q.plain}: x=${x}, ${q.answerText}`);checked++;}
    for(const x of [q.answer.lo,q.answer.hi].filter(Number.isFinite))assert.equal(inside(q,x),q.check(x),`endpoint ${q.plain}: ${x}`);
  }
  assert.equal(checked,846000);
});
test('three players get the same type, difficulty and points with different numbers',()=>{
  for(let seed=1;seed<100;seed++){const ps=M.campaign(seed);assert.deepEqual(M.campaign(seed).map(p=>p.map(q=>q.html)),ps.map(p=>p.map(q=>q.html)));for(let i=0;i<10;i++){assert.equal(new Set(ps.map(p=>p[i].html)).size,3);assert.equal(new Set(ps.map(p=>p[i].points)).size,1);assert.equal(new Set(ps.map(p=>p[i].params.variant)).size,1);}for(const qs of ps)assert.equal(qs.reduce((s,q)=>s+q.points,0),100);}
});
test('open and closed endpoints and infinity are graded correctly',()=>{const q=M.makeQuestion(7,2);assert.equal(M.acceptAnswer(q,{lo:2,hi:7,lc:false,hc:true}),true);assert.equal(M.acceptAnswer(q,{lo:2,hi:7,lc:true,hc:true}),false);assert.equal(M.acceptAnswer(q,{lo:2,hi:7,lc:false,hc:false}),false);const r=M.makeQuestion(0,2);assert.equal(M.acceptAnswer(r,{lo:2,hi:Infinity,lc:false,hc:true}),true);});
test('score deductions do not compound when hints and retries are combined',()=>{for(const points of [5,10,20]){assert.equal(M.scoreFor(points,0,false),points);assert.equal(M.scoreFor(points,1,false),points*.8);assert.equal(M.scoreFor(points,2,false),points*.6);assert.equal(M.scoreFor(points,0,true),points*.6);assert.equal(M.scoreFor(points,5,true),points*.6);}});

class Classes{constructor(){this.v=new Set();}add(v){this.v.add(v);}remove(v){this.v.delete(v);}contains(v){return this.v.has(v);}}
class Button{constructor(player,action='plus'){this.player=player;this.dataset={action};this.classList=new Classes();this.disabled=false;}closest(){return this;}}
function rig(){const handlers={},root={addEventListener:(n,f)=>handlers[n]=f,contains:()=>true,setPointerCapture:()=>{}},calls=[],router=new InputRouter(root,(action,b)=>calls.push([b.player,action]));return{router,calls,handlers};}
function down(r,b,id,primary=false){r.handlers.pointerdown({target:b,pointerId:id,isPrimary:primary,preventDefault(){}});}
test('three non-primary overlapping touches stay independent and synthetic clicks are deduplicated',()=>{const r=rig(),bs=[0,1,2].map(i=>new Button(i));bs.forEach((b,i)=>down(r,b,i+10,i===0));assert.equal(r.router.pointers.size,3);assert.deepEqual(r.calls,[[0,'plus'],[1,'plus'],[2,'plus']]);for(const b of bs)r.handlers.click({target:b,detail:1,preventDefault(){}});assert.equal(r.calls.length,3);down(r,bs[0],10);assert.equal(r.calls.length,3);r.handlers.pointerup({pointerId:11});assert.equal(bs[1].classList.contains('pressed'),false);assert.equal(bs[0].classList.contains('pressed'),true);r.handlers.pointercancel({pointerId:10});r.handlers.lostpointercapture({pointerId:12});assert.equal(r.router.pointers.size,0);down(r,bs[2],13);assert.equal(r.calls.length,4);r.router.clear();assert.equal(bs[2].classList.contains('pressed'),false);});
test('rapid interleaved taps and click-only keyboard input are each accepted once',()=>{const r=rig(),bs=[0,1,2].map(i=>new Button(i));for(let i=0;i<60;i++){const b=bs[i%3];down(r,b,i);r.handlers.pointerup({pointerId:i});}assert.equal(r.calls.length,60);r.handlers.click({target:bs[0],detail:0,preventDefault(){}});assert.equal(r.calls.length,61);});
