(function(root){
  'use strict';
  const DURATIONS=Array.from({length:9},(_,i)=>270+i*15),DEFAULT_DURATION=300,DURATION_VERSION=2;
  function savedDuration(saved={}){
    const value=Number(saved.duration);
    if(saved.durationVersion!==DURATION_VERSION&&value===270)return DEFAULT_DURATION;
    return DURATIONS.includes(value)?value:DEFAULT_DURATION;
  }
  function orderBounds(p,moved,drags=new Map()){
    if(!p.loChosen||!p.hiChosen)return false;
    if(p.lo>p.hi){
      for(const [left,right] of [['lo','hi'],['lc','hc'],['loLast','hiLast']]){
        const value=p[left];p[left]=p[right];p[right]=value;
      }
      // Each finger keeps its physical endpoint when the left/right roles exchange.
      for(const drag of drags.values())if(drag.p===p)drag.b=drag.b==='lo'?'hi':'lo';
      return true;
    }
    if(p.lo===p.hi&&Number.isFinite(p.lo)){
      if(moved==='hi'){
        if(p.hi<20)p.hi++;else p.lo--;
      }else{
        if(p.lo>-9)p.lo--;else p.hi++;
      }
      p.loLast=p.lo;p.hiLast=p.hi;
    }
    return false;
  }
  const api={DURATIONS,DEFAULT_DURATION,DURATION_VERSION,savedDuration,orderBounds};
  root.GameControls=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
