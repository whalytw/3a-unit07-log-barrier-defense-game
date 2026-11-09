const test=require('node:test'),assert=require('node:assert/strict');
const Guard=require('../touch-guard.js'),InputRouter=require('../input.js');

function target({editor=false,surface=false,type='text'}={}){
  const node={tagName:editor?'INPUT':'BUTTON',type,isContentEditable:false};
  node.closest=selector=>selector==='input,textarea,[contenteditable]'?(editor?node:null):(surface?node:null);
  return node;
}
function event(t,extra={}){return {target:t,prevented:false,stopped:false,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...extra};}
function setup(){
  const handlers={},attrs=new Map(),doc={documentElement:{hasAttribute:k=>attrs.has(k),setAttribute:(k,v)=>attrs.set(k,v)},addEventListener:(name,fn)=>handlers[name]=fn};
  Guard.install(doc);return {handlers,send:(name,e)=>{handlers[name](e);return e;}};
}
test('long-press context menus, selection and drag are canceled while name editing remains available',()=>{
  const g=setup();
  for(const name of ['contextmenu','selectstart','dragstart','auxclick','dblclick']){
    assert.equal(g.send(name,event(target())).prevented,true,name);
    assert.equal(g.send(name,event(target({editor:true}))).prevented,false,name+' editor');
  }
  assert.equal(Guard.isEditable(target({editor:true,type:'checkbox'})),false);
});
test('touch hold is canceled only on pointer-driven controls without adding an answer action',()=>{
  const g=setup();
  assert.equal(g.send('touchstart',event(target({surface:true}))).prevented,true);
  assert.equal(g.send('touchstart',event(target())).prevented,false,'native buttons retain clicks');
  assert.equal(g.send('touchstart',event(target({editor:true,surface:true}))).prevented,false,'native editing remains available');
});
test('source and context-menu shortcuts are canceled while fullscreen and ordinary editing keys are preserved',()=>{
  const g=setup(),button=target();
  for(const keys of [{key:'u',ctrlKey:true},{key:'U',ctrlKey:true},{key:'ContextMenu'},{key:'F10',shiftKey:true}])assert.equal(g.send('keydown',event(button,keys)).prevented,true);
  for(const keys of [{key:'F11'},{key:'Escape'},{key:'Tab'},{key:'Enter'},{key:' '},{key:'r',ctrlKey:true},{key:'c',ctrlKey:true},{key:'v',ctrlKey:true},{key:'u',ctrlKey:true,shiftKey:true}])assert.equal(g.send('keydown',event(button,keys)).prevented,false,JSON.stringify(keys));
});
function rig(){
  const handlers={},calls=[],surface={addEventListener:(name,fn)=>handlers[name]=fn,contains:()=>true,setPointerCapture(){}},router=new InputRouter(surface,(action,b)=>calls.push([b.player,action]));
  const buttons=[0,1,2].map(player=>({player,dataset:{action:'plus'},disabled:false,classList:{add(){},remove(){}},closest(){return this;}}));
  return {handlers,calls,router,buttons};
}
test('a context menu and a pen side button do not interrupt three held independent contacts',()=>{
  const g=setup(),r=rig();
  r.buttons.forEach((b,i)=>{const e=event(b,{pointerId:i+10,button:0,isPrimary:i===0});g.send('pointerdown',e);r.handlers.pointerdown(e);});
  assert.equal(r.router.pointers.size,3);assert.equal(r.calls.length,3);
  assert.equal(g.send('contextmenu',event(target())).prevented,true);
  const side=g.send('pointerdown',event(target(),{pointerId:99,button:2,pointerType:'pen'}));
  assert.equal(side.stopped,true);assert.equal(r.router.pointers.size,3);
  r.buttons.forEach(b=>r.handlers.click(event(b,{button:0,detail:1})));
  assert.equal(r.calls.length,3,'compatibility clicks are still deduplicated');
  r.handlers.pointercancel({pointerId:11});
  r.handlers.pointerdown(event(r.buttons[1],{pointerId:20,button:0,isPrimary:false}));
  assert.equal(r.calls.length,4);assert.equal(r.router.pointers.size,3);
});
test('secondary buttons never modify an answer even when the router is used without the page guard',()=>{
  const r=rig();
  for(const button of [1,2,5]){
    r.handlers.pointerdown(event(r.buttons[0],{pointerId:button,button}));
    r.handlers.click(event(r.buttons[0],{button,detail:1}));
  }
  assert.equal(r.calls.length,0);assert.equal(r.router.pointers.size,0);
  r.handlers.click(event(r.buttons[0],{button:0,detail:0}));assert.equal(r.calls.length,1,'keyboard activation remains available');
});
