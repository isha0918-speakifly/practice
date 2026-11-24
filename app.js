const KEY='speakifly.v2', DAILY=20, DAYS=30, QUIZ_EVERY=6;
const S=window.SENTENCES, G=window.GLOSSARY, $=id=>document.getElementById(id);
const ymd=()=>{const x=new Date();return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
const dayDiff=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);
let st=null; try{st=JSON.parse(localStorage.getItem(KEY))}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}};
const show=id=>['welcome','practice','quiz','done'].forEach(s=>$(s).classList.toggle('hidden',s!==id));
const LI=()=>st.lang==='gu'?2:1;
const cur=()=>S[st.next].replace(/\{N\}/g,st.name);
const norm=w=>w.toLowerCase().replace(/[^a-z']/g,'');
function speak(t,r){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=r||.9;speechSynthesis.speak(u)}
function lookup(w){w=norm(w);for(const c of [w,w.replace(/es$/,''),w.replace(/s$/,'')]) if(G[c]) return c;return null}
const wordsIn=s=>[...new Set(s.split(' ').map(lookup).filter(Boolean))];

let lang='hi';
document.querySelectorAll('.lang').forEach(b=>b.onclick=()=>{lang=b.dataset.l;document.querySelectorAll('.lang').forEach(x=>x.classList.toggle('sel',x===b))});
$('startBtn').onclick=()=>{
  let n=$('nameInput').value.trim(); if(!n){$('nameInput').focus();return}
  n=n[0].toUpperCase()+n.slice(1);
  st={name:n,lang,start:ymd(),today:ymd(),doneToday:0,next:0,seen:[],pq:null}; save(); render();
};
$('nameInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('startBtn').click()});

function init(){
  if(!st||!st.name){show('welcome');return}
  if(st.today!==ymd()){st.today=ymd();st.doneToday=0;save()}
  render();
}
function render(){
  $('who').textContent=st&&st.name?'👋 '+st.name:'';
  if(st.pq&&st.pq.length) return startQuiz();
  const day=dayDiff(st.start,ymd())+1;
  if(day>DAYS||st.next>=S.length){
    show('done');$('doneTitle').textContent='Well done, '+st.name+'!';
    $('doneText').textContent='You completed your 30-day journey and practised '+st.next+' sentences. Keep speaking!';return;
  }
  if(st.doneToday>=DAILY){
    show('done');$('doneTitle').textContent='Great job today, '+st.name+'!';
    $('doneText').textContent='You finished today’s practice (Day '+day+' of '+DAYS+'). Come back tomorrow for more.';return;
  }
  show('practice');resetRec();
  $('dayInfo').textContent='Day '+day+'/'+DAYS;
  $('countInfo').textContent='Sentence '+(st.doneToday+1)+' of '+DAILY+' today';
  $('barFill').style.width=(st.doneToday/DAILY*100)+'%';
  const box=$('sentence');box.innerHTML='';
  cur().split(' ').forEach((w,i)=>{
    if(i)box.append(' ');
    if(lookup(w)){const b=document.createElement('button');b.className='hw';b.textContent=w;b.onclick=()=>speak(w.replace(/[^\w']/g,''),.7);box.append(b)}else box.append(w);
  });
  const wd=$('words');wd.innerHTML='';
  wordsIn(cur()).forEach(k=>{
    const d=document.createElement('div');d.className='wcard';
    const b=document.createElement('button');b.textContent='🔊';b.onclick=()=>speak(k,.7);
    const t=document.createElement('div');t.className='t';
    const e=document.createElement('b');e.textContent=k;
    const m=document.createElement('div');m.className='m';m.textContent=G[k][LI()];
    const s=document.createElement('small');s.textContent=G[k][0];
    t.append(e,m,s);d.append(b,t);wd.append(d);
  });
}
$('listenBtn').onclick=()=>speak(cur(),.9);
$('modelBtn').onclick=()=>speak(cur(),.9);
$('slowBtn').onclick=()=>speak(cur(),.6);

let mr=null,chunks=[],stream=null,recog=null,spoken='',url=null,audio=null;
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function resetRec(){$('result').classList.add('hidden');$('status').textContent='';$('recBtn').textContent='🎤 Start recording';$('recBtn').classList.remove('on');spoken='';if(url){URL.revokeObjectURL(url);url=null}}
$('recBtn').onclick=async()=>{
  if(mr&&mr.state==='recording'){mr.stop();if(recog)try{recog.stop()}catch(e){};return}
  try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}
  catch(e){$('status').textContent='Microphone not available. Please allow microphone access (open the page over https).';return}
  resetRec();chunks=[];mr=new MediaRecorder(stream);
  mr.ondataavailable=e=>chunks.push(e.data);
  mr.onstop=()=>{stream.getTracks().forEach(t=>t.stop());url=URL.createObjectURL(new Blob(chunks,{type:mr.mimeType}));audio=new Audio(url);
    $('recBtn').textContent='🎤 Record again';$('recBtn').classList.remove('on');$('status').textContent='Recording saved.';setTimeout(showResult,600)};
  if(SR){recog=new SR();recog.lang='en-US';recog.continuous=true;recog.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++)spoken+=' '+e.results[i][0].transcript};try{recog.start()}catch(e){}}
  mr.start();$('recBtn').textContent='⏹ Stop recording';$('recBtn').classList.add('on');$('status').textContent='Recording… read the sentence aloud.';
};
function showResult(){
  $('result').classList.remove('hidden');const m=$('match');m.innerHTML='';
  if(!SR){m.textContent='Listen to yourself and compare with the model voice.';return}
  const heard=new Set(spoken.split(/\s+/).map(norm).filter(Boolean));let ok=0;const ws=cur().split(' ');
  ws.forEach(w=>{const s=document.createElement('span');s.textContent=w;const g=heard.has(norm(w));s.className=g?'ok':'bad';if(g)ok++;m.append(s,' ')});
  const p=document.createElement('p');p.className='muted';
  p.textContent=heard.size?ok+' of '+ws.length+' words clear. Green = clear, red = practise again.':'No speech detected. Try again, or listen to your recording.';
  m.append(p);
}
$('mineBtn').onclick=()=>{speechSynthesis.cancel();if(audio){audio.currentTime=0;audio.play()}};
$('nextBtn').onclick=()=>{
  if(audio)audio.pause();
  wordsIn(cur()).forEach(w=>{if(!st.seen.includes(w))st.seen.push(w)});
  st.next++;st.doneToday++;
  if((st.doneToday%QUIZ_EVERY===0||st.doneToday===DAILY)&&st.seen.length){
    st.pq=st.seen.slice().sort(()=>Math.random()-.5).slice(0,4);st.seen=[];
  }
  save();render();
};

let qs=[],qi=0,score=0;
const shuffle=a=>a.slice().sort(()=>Math.random()-.5);
function startQuiz(){qs=st.pq.slice();qi=0;score=0;show('quiz');askQ()}
function askQ(){
  $('qNext').classList.add('hidden');
  $('qCount').textContent='Question '+(qi+1)+' of '+qs.length;
  const k=qs[qi];$('qWord').textContent='What does “'+k+'” mean?';speak(k,.7);
  const others=shuffle(Object.keys(G).filter(x=>x!==k)).slice(0,3);
  const box=$('qOpts');box.innerHTML='';
  shuffle([k,...others]).forEach(o=>{
    const b=document.createElement('button');b.className='opt';b.textContent=G[o][LI()];
    const s=document.createElement('small');s.textContent=G[o][0];b.append(s);
    b.onclick=()=>{
      [...box.children].forEach(c=>c.disabled=true);
      if(o===k){b.classList.add('right');score++}else{b.classList.add('wrong');
        [...box.children].forEach((c,i)=>{});box.querySelectorAll('.opt').forEach(c=>{if(c.firstChild.textContent===G[k][LI()])c.classList.add('right')})}
      $('qNext').textContent=qi+1<qs.length?'Next →':'Finish ('+score+'/'+qs.length+') → Continue';
      $('qNext').classList.remove('hidden');
    };
    box.append(b);
  });
}
$('qNext').onclick=()=>{qi++;if(qi<qs.length)askQ();else{st.pq=null;save();render()}};
init();
