(function(root){
  'use strict';
  const FRAME_FPS=8,SUCCESS_SECONDS=4,IDLE_FRAMES=8;
  const STANCES=['拳擊護臉','側身掌法','光刃防守'];
  // Fixed atlas foot baselines keep the planted feet on the platform across each loop.
  const FOOT_BASELINES=[[.9493,.9336,.9375,.9336],[.9335,.9727,.957,.9453],[.9605,.9375,.9336,.9219]];
  const DISTRICTS=['外城入口','高架斷橋','運輸碼頭','霓虹巷弄','城防廣場','巨砲平台','高空航道','工業機庫','重力反應室','中樞核心'];
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,p)=>a+(b-a)*p;
  function makeImage(src){if(typeof Image==='undefined')return {complete:false,naturalWidth:0};const im=new Image();im.src=src;return im;}
  const characters=['cyan','violet','amber'].map(n=>makeImage('assets/hero-'+n+'-actions-24.png'));
  const idles=['cyan','violet','amber'].map(n=>makeImage('assets/hero-'+n+'-idle-8.png'));
  const backgrounds=['a','b'].map(n=>makeImage('assets/districts-'+n+'.png'));
  const poseFrame=(seconds)=>Math.floor(Math.max(0,seconds)*FRAME_FPS+1e-8)%8;
  const idleFrame=(seconds,player=0)=>poseFrame(seconds+player/FRAME_FPS);
  function poseCell(pose,seconds,player=0){const frame=pose===0?idleFrame(seconds,player):poseFrame(seconds);return {column:frame%4,row:(pose===0?0:(pose-1)*2)+Math.floor(frame/4),rows:pose===0?2:6};}
  const districtCell=type=>({atlas:type<5?0:1,column:(type%5)%2,row:Math.floor((type%5)/2)});
  function line(c,x,y,xx,yy,color,width=2){c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  function ring(c,x,y,r,ry,color,width=2){c.beginPath();c.ellipse(x,y,Math.max(.1,r),Math.max(.1,ry),0,0,Math.PI*2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  function glowDot(c,x,y,r,color){c.beginPath();c.arc(x,y,Math.max(.1,r),0,Math.PI*2);c.fillStyle=color;c.fill();}
  function drawBackground(c,type,w,h){const cell=districtCell(type),im=backgrounds[cell.atlas];if(!im.complete||!im.naturalWidth)return false;const sw=im.naturalWidth/2,sh=im.naturalHeight/3;let cw=sw,ch=sh;if(sw/sh>w/h)cw=sh*w/h;else ch=sw*h/w;c.drawImage(im,cell.column*sw+(sw-cw)/2,cell.row*sh+(sh-ch)/2,cw,ch,0,0,w,h);const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#050d1b10');g.addColorStop(.6,'#07162b00');g.addColorStop(1,'#06122b55');c.fillStyle=g;c.fillRect(0,0,w,h);return true;}
  function drawPose(c,player,pose,seconds,size){const im=(pose===0?idles:characters)[player];if(!im.complete||!im.naturalWidth)return false;const cell=poseCell(pose,seconds,player),sw=im.naturalWidth/4,sh=im.naturalHeight/cell.rows;c.drawImage(im,cell.column*sw,cell.row*sh,sw,sh,-size/2,-size*FOOT_BASELINES[player][pose],size,size);return true;}
  function atmosphere(c,type,time,w,h,color,gentle){c.save();c.globalAlpha=gentle?.14:.26;const f=h-21;switch(type){
    case 0:line(c,(time*45)%w,15,(time*45)%w,f,color,1);break;
    case 1:for(let i=0;i<5;i++){const x=(i*137-time*15+w*10)%w;line(c,x,f+5,x+42,f+5,color,1);}break;
    case 2:for(let i=0;i<3;i++)ring(c,460+i*28,30+i*20,7+Math.sin(time+i)*2,3,color,1);break;
    case 3:for(let i=0;i<18;i++){const x=(i*97)%w,y=(i*43+time*75)%h;line(c,x,y,x-4,y+12,'#a2e8ff',1);}break;
    case 4:for(let i=0;i<3;i++){const x=90+i*210;line(c,x,f,x+15*Math.sin(time+i),40,color,1);}break;
    case 5:ring(c,485,55,16+5*Math.sin(time*2),5,'#ff95b1',1);break;
    case 6:for(let i=0;i<7;i++){const x=(i*110-time*22+w*10)%w;ring(c,x,h*.65+(i%3)*13,65,8,'#c2eaff',1);}break;
    case 7:for(let i=0;i<6;i++){const x=45+i*100;glowDot(c,x,28,3+Math.sin(time*2+i),color);}break;
    case 8:for(let i=0;i<3;i++)ring(c,400,h*.4,45+i*18,12+i*4,color,1);break;
    case 9:for(let i=0;i<15;i++){const x=300+Math.sin(i*9+time*.5)*240,y=h-(i*29+time*30)%h;glowDot(c,x,y,1+(i%3),color);}break;
  }c.restore();}
  function streaks(c,x,y,p,color,n=9){for(let i=0;i<n;i++){const yy=y+(i-n/2)*9,len=25+(i%4)*16;line(c,x-len-((p*100+i*11)%60),yy,x-((p*100+i*11)%60),yy,color,i%3===0?3:1);}}
  function sparks(c,x,y,p,color,n=18,spread=85){if(p<0||p>1)return;c.save();c.globalAlpha=1-p;for(let i=0;i<n;i++){const a=i*2.39996,r=p*(spread+((i*17)%50));const xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r;line(c,xx,yy,xx+Math.cos(a)*(5+6*(1-p)),yy+Math.sin(a)*(5+6*(1-p)),color,i%3===0?3:1);}c.restore();}
  function energy(c,type,p,w,h,color,gentle){const floor=h-21,size=Math.min(h*.86,360),cx=255,cy=floor-size*.45;c.save();c.globalCompositeOperation='lighter';c.lineCap='round';c.globalAlpha=gentle?.38:.7;
    const charge=clamp(p/.24),fade=clamp((1-p)/.2);if(p<.3){for(let i=0;i<3;i++)ring(c,220,floor,35+i*22+charge*18,4+i*3,color+'99',1.4);for(let i=0;i<8;i++){const a=i*Math.PI/4+p*9;glowDot(c,220+Math.cos(a)*(55-35*charge),floor-20+Math.sin(a)*22,2,color);}}
    switch(type){
      case 0:{const x=mix(160,410,clamp((p-.18)/.65));streaks(c,x,floor-size*.32,p,color,gentle?5:13);for(let i=0;i<6;i++)ring(c,x-i*19,floor,12+i*3,3,color+'88',1);sparks(c,470,floor,p-.3,'#ff86b9',12,90);break;}
      case 1:{for(let i=0;i<6;i++){const x=70+i*100,ph=clamp((p-i*.08)*2);ring(c,x,floor,22+ph*38,4+ph*6,color,1);line(c,x,floor,x,floor-20*Math.sin(ph*Math.PI),color,2);}streaks(c,mix(80,510,p),floor-35,p,color,5);break;}
      case 2:{const rr=clamp((p-.2)/.62),x=mix(490,280,rr),y=floor-8-Math.sin(rr*Math.PI)*Math.min(80,h*.3);for(let i=0;i<12;i++){const t=i/12,xx=mix(210,x,t),yy=mix(floor-size*.52,y-10,t)+Math.sin(t*14-p*24)*6;glowDot(c,xx,yy,2.3,color);}sparks(c,280,floor-30,(p-.72)/.28,color,gentle?10:24,70);break;}
      case 3:{for(let i=0;i<16;i++){const xx=(i*79+p*160)%600,yy=floor-size*((i%7)/8);line(c,xx,yy,xx+12+(i%4)*7,yy,color+'aa',2);if(i%4===0)c.strokeRect(xx,yy,8,8);}streaks(c,mix(230,450,p),floor-size*.3,p,color,9);break;}
      case 4:{for(let i=0;i<3;i++){const impact=(p*2.2+i*.22)%1;if(impact>.75){const q=(impact-.75)*4;ring(c,cx+size*.45,cy,8+q*39,8+q*23,color,2);sparks(c,cx+size*.45,cy,q,color,gentle?8:16,55);}}break;}
      case 5:{const px=295,py=cy;if(p>.35&&p<.7){const q=(p-.35)/.35;c.save();c.globalAlpha*=Math.sin(q*Math.PI);for(let i=0;i<8;i++){const a=i*Math.PI/4+q;line(c,px+Math.cos(a)*12,py+Math.sin(a)*12,px+Math.cos(a)*60,py+Math.sin(a)*60,color,3);}c.restore();}sparks(c,495,h*.25,(p-.74)/.26,color,gentle?12:28,100);break;}
      case 6:{for(let i=0;i<4;i++){const pp=clamp((p-i*.09)*1.8),x=mix(610,310+i*25,pp),y=mix(35+i*28,Math.max(40,h*.35)+i*17,pp)+Math.sin(pp*Math.PI)*25;for(let k=0;k<6;k++)ring(c,x+14+k*8,y-k*3,3+k,2+k*.5,'#c6d4f055',1);sparks(c,x,y,(p-.52-i*.08)*4,color,gentle?7:15,60);}break;}
      case 7:{const x=mix(530,410,clamp(p/.35)),y=floor-size*.4;for(let i=0;i<3;i++){const a=p*8+i*Math.PI*2/3;ring(c,x,y,65+5*Math.sin(a),20+i*20,color,1.5);}if(p>.5)for(let i=0;i<4;i++)glowDot(c,x+(i%2?68:-68),y+(i<2?-70:65),4+Math.sin(p*20)*2,color);break;}
      case 8:{const x=435,y=Math.max(60,h*.35);for(let i=0;i<3;i++){c.save();c.translate(x,y);c.rotate(p*Math.PI*2*(i%2?-1:1)+i);ring(c,0,0,50+i*14,14+i*4,color,2);c.restore();}const pp=p<.5?clamp(p*2):1-clamp((p-.5)*2);for(let i=0;i<7;i++){glowDot(c,x+Math.sin(i+p*12)*8,mix(22,floor-size*.3,pp)+(p<.5?-1:1)*i*9,2+(i%2),color);}break;}
      case 9:{const bx=470,by=Math.max(50,h*.3);if(p>.5){c.save();c.translate(bx,by);c.rotate(-1.1+p*1.4);for(let i=0;i<4;i++){c.beginPath();c.arc(0,0,55+i*18,-1.8,-.2);c.strokeStyle=i%2?color:'#ecfaff';c.lineWidth=3+i;c.stroke();}c.restore();}sparks(c,bx,by,(p-.74)/.26,color,gentle?18:40,170);if(p>.77){const q=(p-.77)/.23;ring(c,bx,by,20+q*200,20+q*100,color,4*(1-q)+1);}break;}
    }
    if(p>.85){const q=(p-.85)/.15;c.globalAlpha*=1-q;for(let i=0;i<(gentle?8:20);i++){const x=100+(i*83)%430,y=floor-q*(35+i%5*12);glowDot(c,x,y,1.5+(i%3),color);}}
    c.restore();
  }
  const api={FRAME_FPS,SUCCESS_SECONDS,IDLE_FRAMES,STANCES,DISTRICTS,characters,idles,backgrounds,poseFrame,idleFrame,poseCell,districtCell,drawBackground,drawPose,atmosphere,energy};root.GameArt=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
