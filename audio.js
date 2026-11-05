(function(root){
  'use strict';
  const CUES=[
    [[0,'charge'],[.65,'laser'],[1.15,'dash'],[2.1,'laser'],[3.3,'win']],
    [[0,'charge'],[.45,'bridge'],[1.1,'jump'],[1.9,'jump'],[2.7,'land'],[3.4,'win']],
    [[0,'charge'],[.5,'tractor'],[1.6,'robot'],[2.7,'robot'],[3.4,'win']],
    [[0,'ghost'],[.75,'dash'],[1.8,'ghost'],[3.3,'win']],
    [[0,'shield'],[.8,'impact'],[1.6,'impact'],[2.5,'impact'],[3.4,'win']],
    [[0,'charge'],[.6,'cannon'],[1.85,'reflect'],[2.8,'explosion'],[3.5,'win']],
    [[0,'charge'],[.6,'missile'],[1.5,'laser'],[2.25,'explosion'],[2.8,'explosion'],[3.5,'win']],
    [[0,'charge'],[.7,'chain'],[1.25,'chain'],[2.3,'lock'],[3.4,'win']],
    [[0,'charge'],[.8,'gravity'],[2,'reverse'],[3.15,'explosion'],[3.6,'win']],
    [[0,'boss'],[.7,'charge'],[1.5,'jump'],[2.25,'slash'],[3.05,'explosion'],[3.65,'fanfare']]
  ];
  class GameAudio{
    constructor(){this.context=null;this.master=null;this.enabled=true;this.volume=.45;this.pending=[];this.lastTap=[-1,-1,-1];this.lastWarning=-1;}
    unlock(){if(!this.enabled)return;try{if(!this.context){const Audio=root.AudioContext||root.webkitAudioContext;if(!Audio)return;this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=this.volume*.3;const limiter=this.context.createDynamicsCompressor();limiter.threshold.value=-15;limiter.knee.value=20;limiter.ratio.value=6;limiter.attack.value=.004;limiter.release.value=.15;this.master.connect(limiter);limiter.connect(this.context.destination);}if(this.context.state==='suspended')this.context.resume();}catch(_){} }
    configure(enabled,volume){this.enabled=enabled;this.volume=Math.max(0,Math.min(1,volume));if(this.master)this.master.gain.setTargetAtTime(enabled?this.volume*.3:0,this.context.currentTime,.04);if(!enabled)this.pending.length=0;}
    pause(){this.context?.suspend?.();}
    resume(){if(this.enabled)this.unlock();}
    reset(){this.pending.length=0;this.lastWarning=-1;}
    begin(type,success,start,player=0){if(!this.enabled)return;const cues=success?CUES[type]:[[0,'fail']];for(const [offset,name] of cues)this.pending.push({at:start+offset,name,player});}
    update(time){if(!this.enabled)return;const ready=this.pending.filter(c=>c.at<=time);this.pending=this.pending.filter(c=>c.at>time);for(const cue of ready)this.play(cue.name,cue.player);}
    tap(time,player){if(time-this.lastTap[player]<.075)return;this.lastTap[player]=time;this.play('tap',player);}
    beep(second){if(second===this.lastWarning)return;this.lastWarning=second;if(second>0&&second<=10)this.play('warning');}
    oscillator(freq,end,duration=.18,type='sine',gain=.12,delay=0){const c=this.context;if(!c||!this.enabled)return;const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.001,gain),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};}
    noise(duration=.2,gain=.1,cutoff=1400){const c=this.context;if(!c||!this.enabled)return;const buffer=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const source=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=cutoff;g.gain.value=gain;source.connect(filter);filter.connect(g);g.connect(this.master);source.start();source.onended=()=>{source.disconnect();filter.disconnect();g.disconnect();};}
    play(name,player=0){if(!this.enabled||!this.context||this.context.state==='suspended')return;const p=1+player*.018,osc=(f,e,d,t='sine',g=.12,delay=0)=>this.oscillator(f*p,e*p,d,t,g,delay);switch(name){
      case 'tap':osc(650,950,.035,'sine',.025);break;
      case 'charge':osc(170,510,.35,'sine',.13);osc(340,1020,.35,'triangle',.035);break;
      case 'laser':osc(1500,180,.16,'sawtooth',.08);break;
      case 'dash':this.noise(.22,.12,3200);osc(220,80,.14,'triangle',.07);break;
      case 'bridge':[420,560,700].forEach((f,i)=>osc(f,f*.98,.14,'sine',.08,i*.07));break;
      case 'jump':osc(230,650,.16,'sine',.09);break;
      case 'land':this.noise(.12,.09,600);osc(110,55,.14,'sine',.13);break;
      case 'tractor':osc(250,420,.6,'triangle',.06);osc(505,845,.6,'sine',.04);break;
      case 'robot':osc(900,900,.08,'square',.035);osc(1200,1200,.09,'sine',.06,.1);break;
      case 'ghost':osc(380,900,.24,'sine',.08);osc(760,230,.22,'sine',.06,.13);break;
      case 'shield':osc(200,600,.36,'triangle',.08);osc(820,820,.3,'sine',.035);break;
      case 'impact':this.noise(.12,.13,1000);osc(180,70,.15,'sine',.1);osc(950,600,.1,'sine',.04);break;
      case 'cannon':this.noise(.4,.13,1800);osc(160,65,.35,'sawtooth',.09);break;
      case 'reflect':osc(1300,1900,.15,'sine',.13);osc(1900,900,.22,'sine',.07,.09);break;
      case 'missile':this.noise(.5,.09,2200);osc(130,330,.4,'triangle',.045);break;
      case 'explosion':this.noise(.45,.23,750);osc(100,30,.45,'sine',.2);break;
      case 'chain':[0,.07,.14].forEach(d=>{osc(980,650,.065,'square',.028,d);osc(1500,1450,.09,'sine',.04,d);});break;
      case 'lock':osc(470,250,.12,'triangle',.08);osc(720,720,.14,'sine',.07,.1);break;
      case 'gravity':osc(90,290,.65,'sine',.13);osc(480,120,.65,'triangle',.045);break;
      case 'reverse':osc(130,1100,.45,'triangle',.09);osc(1100,200,.4,'sine',.07,.12);break;
      case 'boss':osc(65,95,.7,'sine',.15);osc(140,130,.65,'triangle',.05);break;
      case 'slash':this.noise(.25,.17,5200);osc(1450,120,.23,'sawtooth',.07);break;
      case 'win':[660,880].forEach((f,i)=>osc(f,f,.13,'sine',.07,i*.1));break;
      case 'fanfare':[440,554,659,880].forEach((f,i)=>osc(f,f,.25,'sine',.08,i*.08));break;
      case 'fail':osc(250,150,.18,'triangle',.1);break;
      case 'warning':osc(800,800,.08,'sine',.07);break;
    }}
  }
  GameAudio.CUES=CUES;root.GameAudio=GameAudio;if(typeof module!=='undefined')module.exports=GameAudio;
})(typeof window!=='undefined'?window:globalThis);
