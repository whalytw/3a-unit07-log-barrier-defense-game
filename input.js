(function(root){
  'use strict';
  class InputRouter{
    constructor(surface,action,onTouch=()=>{}){
      this.surface=surface;this.action=action;this.onTouch=onTouch;this.pointers=new Map();this.last=new WeakMap();
      surface.addEventListener('pointerdown',e=>this.down(e),{passive:false});
      for(const name of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(name,e=>this.release(e.pointerId));
      surface.addEventListener('click',e=>this.click(e));
      if(!root.PointerEvent){surface.addEventListener('touchstart',e=>{for(const t of e.changedTouches)this.down({target:t.target,pointerId:t.identifier+1000,preventDefault:()=>e.preventDefault()});},{passive:false});for(const name of ['touchend','touchcancel'])surface.addEventListener(name,e=>{for(const t of e.changedTouches)this.release(t.identifier+1000);});}
    }
    target(e){const b=e.target.closest?.('button[data-action]');return b&&this.surface.contains(b)&&!b.disabled?b:null;}
    down(e){const b=this.target(e);if(!b||this.pointers.has(e.pointerId))return;e.preventDefault();this.pointers.set(e.pointerId,b);this.last.set(b,Date.now());b.classList.add('pressed');try{this.surface.setPointerCapture(e.pointerId);}catch(_){}this.onTouch(this.pointers.size,b);this.action(b.dataset.action,b);}
    release(id){const b=this.pointers.get(id);if(!b)return;this.pointers.delete(id);if(![...this.pointers.values()].includes(b))b.classList.remove('pressed');this.onTouch(this.pointers.size,b);}
    click(e){const b=this.target(e);if(!b)return;if(e.detail!==0&&Date.now()-(this.last.get(b)||0)<900){e.preventDefault();return;}this.action(b.dataset.action,b);}
    clear(){for(const id of [...this.pointers.keys()])this.release(id);}
  }
  root.InputRouter=InputRouter;if(typeof module!=='undefined')module.exports=InputRouter;
})(typeof window!=='undefined'?window:globalThis);
