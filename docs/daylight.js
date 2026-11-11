const clock = new Intl.DateTimeFormat('zh-CN', {
  timeZone:'Asia/Shanghai', hourCycle:'h23', hour:'2-digit', minute:'2-digit', second:'2-digit'
});

export function beijingTime(date = new Date()) {
  const parts = Object.fromEntries(clock.formatToParts(date).map(part => [part.type, part.value]));
  return {hour:Number(parts.hour)+Number(parts.minute)/60+Number(parts.second)/3600,
    label:`${parts.hour}:${parts.minute}`, iso:date.toISOString()};
}

const night = {top:'#101c38',bottom:'#344466',text:'#e6f2ff',muted:'#aebed5',accent:'#9ccde1',
  sky:'#9db8ec',ground:'#687b99',sun:'#b9d4ff',sea:'#243d60',road:'#7888a0',
  key:1.45,ambient:.38,environment:.13,stars:1,lamp:1,day:0};
const dawn = {top:'#b9bed5',bottom:'#f1c9c0',text:'#344660',muted:'#65748f',accent:'#8faec9',
  sky:'#b9d5f4',ground:'#b7a8b5',sun:'#ffd7ba',sea:'#7fabbc',road:'#d0bec1',
  key:2.4,ambient:.75,environment:.32,stars:.12,lamp:.35,day:.5};
const day = {top:'#d8ecf6',bottom:'#f4f5e7',text:'#23475b',muted:'#56798e',accent:'#70a9ba',
  sky:'#d5efff',ground:'#b4b5a7',sun:'#fff1d8',sea:'#85bac3',road:'#dfd6c4',
  key:2.4,ambient:.65,environment:.32,stars:0,lamp:0,day:1};
const dusk = {top:'#838db4',bottom:'#f2c5b3',text:'#303d5c',muted:'#52627f',accent:'#be8b86',
  sky:'#b7c6ea',ground:'#b7a0ac',sun:'#ffb17e',sea:'#7793ad',road:'#c3aeb0',
  key:2.5,ambient:.63,environment:.3,stars:.18,lamp:.55,day:.45};
const stops = [[0,night],[5,night],[6,dawn],[7,day],[16,day],[18,dusk],[19.5,night],[24,night]];

function mixColor(a,b,t) {
  const left = parseInt(a.slice(1),16), right = parseInt(b.slice(1),16);
  const channels = [16,8,0].map(shift => Math.round(((left>>shift)&255)*(1-t)+((right>>shift)&255)*t));
  return '#'+channels.map(channel=>channel.toString(16).padStart(2,'0')).join('');
}

export function lightingAtHour(value) {
  const hour = ((value%24)+24)%24;
  const index = stops.findIndex((stop,i)=>i>0 && hour<stop[0]);
  const [start,a] = stops[index-1], [end,b] = stops[index];
  let blend = (hour-start)/(end-start);
  blend = blend*blend*(3-2*blend);
  const state = {hour,phase:hour<5||hour>=19.5?'night':hour<7?'dawn':hour<16?'day':'dusk'};
  for(const key of Object.keys(a)) state[key] = typeof a[key]==='number'
    ? a[key]+(b[key]-a[key])*blend : mixColor(a[key],b[key],blend);
  return state;
}
