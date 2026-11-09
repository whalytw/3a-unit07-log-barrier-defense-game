const test=require('node:test'),assert=require('node:assert/strict'),C=require('../controls.js');
function interval(lo=11,hi=6){return {lo,hi,lc:true,hc:false,loChosen:true,hiChosen:true,loLast:lo,hiLast:hi};}
test('crossed endpoints exchange their numbers, closure and remembered finite values together',()=>{
  const p=interval();assert.equal(C.orderBounds(p,'lo'),true);
  assert.deepEqual(p,{lo:6,hi:11,lc:false,hc:true,loChosen:true,hiChosen:true,loLast:6,hiLast:11});
});
test('two held fingers keep their physical endpoints through crossings without changing another player',()=>{
  const p=interval(),other=interval(1,8),left={p,b:'lo'},right={p,b:'hi'},third={p:other,b:'lo'},drags=new Map([[10,left],[11,right],[12,third]]);
  C.orderBounds(p,'lo',drags);assert.equal(left.b,'hi');assert.equal(right.b,'lo');assert.equal(third.b,'lo');
  p[left.b]=12;p[left.b+'Last']=12;C.orderBounds(p,left.b,drags);assert.deepEqual([p.lo,p.hi],[6,12]);
  p[right.b]=13;p[right.b+'Last']=13;C.orderBounds(p,right.b,drags);assert.deepEqual([p.lo,p.hi],[12,13]);assert.equal(right.b,'hi');assert.equal(left.b,'lo');
  assert.deepEqual([other.lo,other.hi],[1,8]);assert.equal(drags.size,3);
});
test('coincident integer endpoints retain a one-unit gap including both input limits',()=>{
  for(let n=-9;n<=20;n++)for(const moved of ['lo','hi']){
    const p=interval(n,n);C.orderBounds(p,moved);assert.equal(p.hi-p.lo,1);assert.ok(p.lo>=-9&&p.hi<=20);assert.equal(p.loLast,p.lo);assert.equal(p.hiLast,p.hi);
  }
  const p=interval();p.hiChosen=false;C.orderBounds(p,'lo');assert.deepEqual([p.lo,p.hi,p.hiChosen],[11,6,false],'an unchosen hidden endpoint does not move the chosen value');
});
test('all finite endpoint combinations and one-sided intervals remain ordered',()=>{
  for(let lo=-9;lo<=20;lo++)for(let hi=-9;hi<=20;hi++){
    const p=interval(lo,hi);C.orderBounds(p,'lo');assert.ok(p.lo<p.hi);if(lo!==hi)assert.deepEqual([p.lo,p.hi],[Math.min(lo,hi),Math.max(lo,hi)]);
  }
  for(const [lo,hi] of [[-Infinity,4],[1,Infinity],[-Infinity,Infinity]]){const p=interval(lo,hi);C.orderBounds(p,'lo');assert.deepEqual([p.lo,p.hi],[lo,hi]);}
});
test('duration offers nine 15-second steps and migrates the old default to five minutes once',()=>{
  assert.equal(C.DEFAULT_DURATION,300);assert.deepEqual(C.DURATIONS,[270,285,300,315,330,345,360,375,390]);
  assert.equal(C.savedDuration(),300);assert.equal(C.savedDuration({duration:270}),300);
  for(const n of C.DURATIONS)assert.equal(C.savedDuration({duration:String(n),durationVersion:C.DURATION_VERSION}),n);
  assert.equal(C.savedDuration({duration:330}),330);assert.equal(C.savedDuration({duration:390}),390);assert.equal(C.savedDuration({duration:299}),300);
});
