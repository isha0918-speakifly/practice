const KEY='speakingPractice.v1', DAILY=20, DAYS=30;
const S=window.SENTENCES, G=window.GLOSSARY, $=id=>document.getElementById(id);
const ymd=d=>{const x=d||new Date();return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
const dayDiff=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);
let st=null; try{st=JSON.parse(localStorage.getItem(KEY))}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}};
const show=id=>['welcome','practice','done'].forEach(s=>$(s).classList.toggle('hidden',s!==id));

function speak(text,rate){
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text); u.lang='en-US'; u.rate=rate||0.9; speechSynthesis.speak(u);
}
const norm=w=>w.toLowerCase().replace(/[^a-z']/g,'');
function lookup(w){
  w=norm(w);
  for(const c of [w,w.replace(/es$/,''),w.replace(/s$/,''),w.replace(/ies$/,'y')]) if(G[c]) return c;
  return null;
}

function init(){
  if(!st||!st.name){show('welcome');return}
  const today=ymd();
  if(st.today!==today){st.today=today;st.doneToday=0;save()}
  render();
}
$('startBtn').onclick=()=>{
  const n=$('nameInput').value.trim(); if(!n){$('nameInput').focus();return}
  st={name:n,start:ymd(),today:ymd(),doneToday:0,next:0}; save(); render();
};
$('nameInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('startBtn').click()});

function render(){
  const day=dayDiff(st.start,ymd())+1;
  if(day>DAYS||st.next>=S.length){
    show('done'); $('doneTitle').textContent='Well done, '+st.name+'! 🎉';
    $('doneText').textContent='Your 30-day practice is complete. You practised '+st.next+' sentences in total.'; return;
  }
  if(st.doneToday>=DAILY){
    show('done'); $('doneTitle').textContent='Great job today, '+st.name+'! ✅';
    $('doneText').textContent='You finished today’s '+DAILY+' sentences (Day '+day+' of '+DAYS+'). Come back tomorrow for the next '+DAILY+'.'; return;
  }
  show('practice'); resetRec();
  $('hello').textContent='Hi, '+st.name;
  $('dayInfo').textContent='Day '+day+' of '+DAYS;
  $('countInfo').textContent='Sentence '+(st.doneToday+1)+' of '+DAILY+' today · '+st.next+' of '+S.length+' done overall';
  $('barFill').style.width=(st.doneToday/DAILY*100)+'%';
  const sent=S[st.next], box=$('sentence'); box.innerHTML=''; const found=[];
  sent.split(' ').forEach((w,i)=>{
    const k=lookup(w);
    if(i) box.appendChild(document.createTextNode(' '));
    if(k){
      const b=document.createElement('button'); b.className='hw'; b.textContent=w; b.onclick=()=>speak(w,.7);
      box.appendChild(b); if(!found.includes(k)) found.push(k);
    } else box.appendChild(document.createTextNode(w));
  });
  const wd=$('words'); wd.innerHTML='';
  found.forEach(k=>{
    const d=document.createElement('div'); d.className='wcard';
    const b=document.createElement('button'); b.textContent='🔊'; b.onclick=()=>speak(k,.7);
    const t=document.createElement('span'); t.innerHTML='<b></b> — <span></span>';
    t.children[0].textContent=k; t.children[1].textContent=G[k];
    d.append(b,t); wd.appendChild(d);
  });
}

$('listenBtn').onclick=()=>speak(S[st.next],.9);
$('modelBtn').onclick=()=>speak(S[st.next],.9);
$('slowBtn').onclick=()=>speak(S[st.next],.6);

let mr=null,chunks=[],stream=null,recog=null,spoken='',url=null,audio=null;
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function resetRec(){
  $('result').classList.add('hidden'); $('status').textContent=''; $('recBtn').textContent='🎤 Start recording';
  $('recBtn').classList.remove('on'); spoken=''; if(url){URL.revokeObjectURL(url);url=null}
}
$('recBtn').onclick=async()=>{
  if(mr&&mr.state==='recording'){mr.stop();if(recog)try{recog.stop()}catch(e){};return}
  try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}
  catch(e){$('status').textContent='Microphone not available. Please allow microphone access (the page must be opened over https).';return}
  resetRec(); chunks=[]; mr=new MediaRecorder(stream);
  mr.ondataavailable=e=>chunks.push(e.data);
  mr.onstop=()=>{
    stream.getTracks().forEach(t=>t.stop());
    url=URL.createObjectURL(new Blob(chunks,{type:mr.mimeType})); audio=new Audio(url);
    $('recBtn').textContent='🎤 Record again'; $('recBtn').classList.remove('on');
    $('status').textContent='Recording saved.'; setTimeout(showResult,600);
  };
  if(SR){
    recog=new SR(); recog.lang='en-US'; recog.interimResults=false; recog.continuous=true;
    recog.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++) spoken+=' '+e.results[i][0].transcript};
    try{recog.start()}catch(e){}
  }
  mr.start(); $('recBtn').textContent='⏹ Stop recording'; $('recBtn').classList.add('on'); $('status').textContent='Recording… read the sentence aloud.';
};
function showResult(){
  $('result').classList.remove('hidden'); const m=$('match'); m.innerHTML='';
  if(!SR){m.textContent='Listen to yourself and compare with the model voice.';return}
  const heard=new Set(spoken.split(/\s+/).map(norm).filter(Boolean)); let ok=0; const ws=S[st.next].split(' ');
  ws.forEach((w,i)=>{
    const s=document.createElement('span'); s.textContent=w; const good=heard.has(norm(w));
    s.className=good?'ok':'bad'; if(good) ok++; m.append(s,' ');
  });
  const p=document.createElement('p'); p.className='muted';
  p.textContent=heard.size?ok+' of '+ws.length+' words were recognised clearly. Green = clear, red underlined = practise again.':'No speech was detected. Try again, or just listen to your recording.';
  m.appendChild(p);
}
$('mineBtn').onclick=()=>{speechSynthesis.cancel();if(audio){audio.currentTime=0;audio.play()}};
$('nextBtn').onclick=()=>{
  if(audio)audio.pause(); st.next++; st.doneToday++; save(); render();
};
init();
