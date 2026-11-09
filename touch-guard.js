(function(root){
  'use strict';
  const GAME_SURFACE='button[data-action],.numberline canvas,[data-pad]';
  function isEditable(target){
    const el=target?.nodeType===3?target.parentElement:target;
    const field=el?.closest?.('input,textarea,[contenteditable]');
    if(!field)return false;
    if(field.isContentEditable||field.tagName==='TEXTAREA')return true;
    return field.tagName==='INPUT'&&!['checkbox','radio','button','submit','reset','range','color','file','image','hidden'].includes((field.type||'text').toLowerCase());
  }
  const isSecondaryPointer=e=>typeof e.button==='number'&&e.button!==0;
  function isBrowserShortcut(e){
    const key=(e.key||'').toLowerCase();
    return key==='contextmenu'||(e.shiftKey&&key==='f10')||
      (e.ctrlKey&&!e.shiftKey&&!e.altKey&&!e.metaKey&&key==='u');
  }
  function install(doc){
    const active=doc.documentElement;
    if(active?.hasAttribute('data-touch-guard'))return;
    active?.setAttribute('data-touch-guard','on');
    const capture={capture:true,passive:false};
    const cancelOutsideEditor=e=>{if(!isEditable(e.target))e.preventDefault();};
    for(const name of ['contextmenu','selectstart','dragstart','auxclick','dblclick'])doc.addEventListener(name,cancelOutsideEditor,capture);
    // These events are independent of pointerdown. Keep the other players' contacts alive.
    doc.addEventListener('pointerdown',e=>{
      if(isSecondaryPointer(e)&&!isEditable(e.target)){e.preventDefault();e.stopPropagation();}
    },capture);
    // Cancel browser press-and-hold only on controls with their own pointer handlers.
    // Ordinary buttons, checkboxes, text entry and scrollable dialogs keep native clicks.
    doc.addEventListener('touchstart',e=>{
      if(!isEditable(e.target)&&e.target.closest?.(GAME_SURFACE))e.preventDefault();
    },capture);
    doc.addEventListener('keydown',e=>{if(isBrowserShortcut(e))e.preventDefault();},capture);
  }
  const api={install,isEditable,isSecondaryPointer,isBrowserShortcut};
  root.TouchGuard=api;
  if(root.document)install(root.document);
  if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
