/**
 * KC AI Chatbot Widget — Standalone Embeddable
 * 한국초저온용기(주) AI 상담 챗봇
 *
 * Usage: <script src="kc-chatbot.js"></script> before </body>
 * Self-contained: injects its own CSS, loads marked.js CDN, creates all DOM.
 */
(function(){
'use strict';

/* ========================================================================
   PRODUCT DATA
   ======================================================================== */
var kcProducts = {
  'ld': { name:'LD Series', desc:'소형 실험실용 LN\u2082 듀어', specs:['4~50L','LN\u2082 저장/분주','경량'], url:'bio-ld-series.html', img:'bio-images/ld-series-hires.png' },
  'xt': { name:'XT Series', desc:'Extended Time 장기 보관', specs:['업계 최저 증발률','Cane 타입','정액/배아/세포'], url:'bio-xt-series.html', img:'bio-images/xt-series-hires.png' },
  'hc': { name:'HC Series', desc:'고용량 Canister 보관', specs:['최대 1,260 바이알','Cane/Canister','대용량'], url:'bio-hc-series.html', img:'bio-images/hc-series-hires.png' },
  'ls': { name:'LS Series', desc:'스테인리스 바이알 저장', specs:['750~6,000 바이알','-190\u00B0C vapor','원격 모니터링 옵션'], url:'bio-ls-series.html', img:'bio-images/ls-series-hires.png' },
  'labs': { name:'LABS Series', desc:'대용량 자동화 바이오뱅크', specs:['최대 93,000 바이알','CS \u00B10.1\u00B0C','턴테이블 4구역'], url:'bio-labs-series.html', img:'bio-images/labs-family-hires.png' },
  'revolution': { name:'Revolution Series', desc:'cGMP 프리미엄 바이오 저장', specs:['-190\u00B0C vapor','자동 LN\u2082 \u2713','RFID/감사추적 \u2713','FDA 21 CFR Part 11 \u2713'], url:'bio-revolution-series.html', img:'bio-images/revolution-hires.png' },
  'cx': { name:'CX/DX Series', desc:'드라이쉬퍼 운송', specs:['Vapor Phase','IATA 규정','단거리 운송'], url:'bio-icb-dual-series.html', img:'bio-images/icb-dual-series-hires.png' },
  'icb-dual': { name:'ICB Dual', desc:'IATA 승인 Vapor Shipper', specs:['10일+ 유지','Store-Ship-Store','항공 기내 승인'], url:'bio-icb-dual-series.html', img:'bio-images/icb-dual-series-hires.png' },
  'ai-shield': { name:'AI Shield', desc:'소규모 목장 휴대용', specs:['1.5L/3L','열 보호 기술','소/말/돼지/양'], url:'bio-ai.html', img:'bio-images/AIS_Group_Freezersr-600x400.png' },
  'ai-mid': { name:'ICB 34/35 + XT 21-AI', desc:'중규모 번식장', specs:['34~35L','정사각 AI 전용','100~1,000두'], url:'bio-ai.html', img:'bio-images/icb-series-hires.png' },
  'ai-large': { name:'LABS 80K AI', desc:'대규모 정액은행', specs:['80,000 스트로','CS 컨트롤러','자동화'], url:'bio-ai.html', img:'bio-images/LABS-80K-AI_ICBiomedical_Web-500x520.png' }
};

/* ========================================================================
   STATE
   ======================================================================== */
var isOpen = false;
var chatHistory = [];
var GEMINI_KEY = localStorage.getItem('kc-gemini-key') || window.KC_GEMINI_KEY || '';
var markedReady = false;
var welcomeShown = false;

/* ========================================================================
   LOAD MARKED.JS
   ======================================================================== */
function loadMarked(cb){
  if(window.marked){ markedReady = true; if(cb) cb(); return; }
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
  s.onload = function(){ markedReady = true; if(cb) cb(); };
  s.onerror = function(){ if(cb) cb(); };
  document.head.appendChild(s);
}

/* ========================================================================
   INJECT CSS
   ======================================================================== */
function injectStyles(){
  var css = document.createElement('style');
  css.id = 'kc-chatbot-styles';
  css.textContent = [
'/* ---- KC Chatbot Widget ---- */',
'#kc-chatbot-btn {',
'  position:fixed; bottom:20px; right:20px; z-index:99999;',
'  width:56px; height:56px; border-radius:50%; border:none; cursor:pointer;',
'  background:linear-gradient(135deg,#06b6d4,#10b981);',
'  box-shadow:0 4px 20px rgba(6,182,212,0.35);',
'  display:flex; align-items:center; justify-content:center;',
'  transition:transform .2s,box-shadow .2s;',
'  outline:none;',
'}',
'#kc-chatbot-btn:hover { transform:scale(1.08); box-shadow:0 6px 28px rgba(6,182,212,0.5); }',
'#kc-chatbot-btn svg { width:26px; height:26px; fill:#fff; transition:transform .25s; }',
'',
'/* Pulse ring */',
'#kc-chatbot-btn::before {',
'  content:""; position:absolute; inset:-6px; border-radius:50%;',
'  border:2px solid rgba(6,182,212,0.5);',
'  animation:kcPulseRing 2s ease-out infinite;',
'}',
'@keyframes kcPulseRing {',
'  0%{transform:scale(1);opacity:.7}',
'  70%{transform:scale(1.35);opacity:0}',
'  100%{transform:scale(1.35);opacity:0}',
'}',
'',
'/* Chat window */',
'#kc-chatbot-window {',
'  position:fixed; bottom:88px; right:20px; z-index:99999;',
'  width:380px; height:560px;',
'  background:#060d1b;',
'  border-radius:20px;',
'  border:1px solid rgba(6,182,212,0.15);',
'  box-shadow:0 8px 40px rgba(0,0,0,0.5), 0 0 30px rgba(6,182,212,0.08);',
'  display:flex; flex-direction:column;',
'  overflow:hidden;',
'  transform:translateY(20px) scale(0.95);',
'  opacity:0;',
'  pointer-events:none;',
'  transition:transform .3s cubic-bezier(.4,0,.2,1), opacity .3s cubic-bezier(.4,0,.2,1);',
'}',
'#kc-chatbot-window.kc-open {',
'  transform:translateY(0) scale(1);',
'  opacity:1;',
'  pointer-events:auto;',
'}',
'',
'/* Header */',
'#kc-chatbot-header {',
'  flex-shrink:0;',
'  padding:16px 18px;',
'  background:linear-gradient(135deg,rgba(6,182,212,0.12),rgba(16,185,129,0.08));',
'  border-bottom:1px solid rgba(6,182,212,0.1);',
'  display:flex; align-items:center; justify-content:space-between;',
'}',
'#kc-chatbot-header-title {',
'  display:flex; align-items:center; gap:8px;',
'  font-family:"Noto Sans KR","Inter",system-ui,sans-serif;',
'  font-size:15px; font-weight:600; color:#e2e8f0;',
'}',
'#kc-chatbot-header-title .kc-sparkle { font-size:18px; }',
'#kc-chatbot-minimize {',
'  background:none; border:none; cursor:pointer; color:rgba(255,255,255,0.5);',
'  width:28px; height:28px; display:flex; align-items:center; justify-content:center;',
'  border-radius:6px; transition:background .15s,color .15s;',
'}',
'#kc-chatbot-minimize:hover { background:rgba(255,255,255,0.08); color:#fff; }',
'',
'/* Messages area */',
'#kc-chatbot-messages {',
'  flex:1; overflow-y:auto; padding:16px;',
'  display:flex; flex-direction:column; gap:14px;',
'  scrollbar-width:thin; scrollbar-color:rgba(6,182,212,0.2) transparent;',
'}',
'#kc-chatbot-messages::-webkit-scrollbar { width:5px; }',
'#kc-chatbot-messages::-webkit-scrollbar-track { background:transparent; }',
'#kc-chatbot-messages::-webkit-scrollbar-thumb { background:rgba(6,182,212,0.2); border-radius:3px; }',
'',
'/* Message rows */',
'.kc-msg-row { display:flex; gap:10px; animation:kcFadeIn .3s ease; }',
'.kc-msg-row.kc-user { justify-content:flex-end; }',
'.kc-msg-row.kc-bot { align-items:flex-start; }',
'',
'@keyframes kcFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }',
'',
'/* Avatar */',
'.kc-avatar {',
'  flex-shrink:0; width:32px; height:32px; border-radius:50%;',
'  display:flex; align-items:center; justify-content:center;',
'  font-size:10px; font-weight:700; color:#fff;',
'  background:linear-gradient(135deg,#06b6d4,#10b981);',
'  overflow:hidden;',
'}',
'.kc-avatar img { width:100%; height:100%; object-fit:cover; border-radius:50%; }',
'',
'/* Bubbles */',
'.kc-bubble {',
'  max-width:82%;',
'  border-radius:16px;',
'  padding:10px 14px;',
'  font-family:"Noto Sans KR","Inter",system-ui,sans-serif;',
'  font-size:13.5px;',
'  line-height:1.65;',
'  word-break:keep-all;',
'  overflow-wrap:break-word;',
'}',
'.kc-bubble.kc-bot-bubble {',
'  background:rgba(6,182,212,0.06);',
'  border:1px solid rgba(6,182,212,0.12);',
'  color:#cbd5e1;',
'  border-top-left-radius:4px;',
'}',
'.kc-bubble.kc-user-bubble {',
'  background:rgba(16,185,129,0.12);',
'  border:1px solid rgba(16,185,129,0.3);',
'  color:#a7f3d0;',
'  border-top-right-radius:4px;',
'}',
'',
'/* Markdown styling inside bot bubbles */',
'.kc-bubble.kc-bot-bubble strong, .kc-bubble.kc-bot-bubble b { color:#6ee7b7; font-weight:600; }',
'.kc-bubble.kc-bot-bubble em { color:#67e8f9; }',
'.kc-bubble.kc-bot-bubble ul, .kc-bubble.kc-bot-bubble ol { margin:6px 0 6px 18px; padding:0; }',
'.kc-bubble.kc-bot-bubble li { margin:3px 0; }',
'.kc-bubble.kc-bot-bubble code {',
'  background:rgba(6,182,212,0.1); padding:1px 5px; border-radius:4px;',
'  font-size:12px; color:#67e8f9; font-family:"Fira Code",monospace;',
'}',
'.kc-bubble.kc-bot-bubble pre {',
'  background:rgba(0,0,0,0.3); border:1px solid rgba(6,182,212,0.1);',
'  border-radius:8px; padding:10px; margin:8px 0; overflow-x:auto;',
'}',
'.kc-bubble.kc-bot-bubble pre code { background:none; padding:0; }',
'.kc-bubble.kc-bot-bubble p { margin:0 0 6px; }',
'.kc-bubble.kc-bot-bubble p:last-child { margin-bottom:0; }',
'.kc-bubble.kc-bot-bubble a { color:#67e8f9; text-decoration:underline; }',
'',
'/* Typing indicator */',
'.kc-typing { display:flex; align-items:center; gap:5px; padding:4px 0; }',
'.kc-typing span {',
'  width:7px; height:7px; border-radius:50%;',
'  background:rgba(6,182,212,0.5);',
'  animation:kcTypingWave 1.4s ease-in-out infinite;',
'}',
'.kc-typing span:nth-child(2) { animation-delay:0.15s; }',
'.kc-typing span:nth-child(3) { animation-delay:0.3s; }',
'@keyframes kcTypingWave {',
'  0%,60%,100%{transform:translateY(0);opacity:.4}',
'  30%{transform:translateY(-8px);opacity:1}',
'}',
'',
'/* Suggested chips */',
'.kc-chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }',
'.kc-chip {',
'  background:transparent;',
'  border:1px solid rgba(6,182,212,0.3);',
'  color:#67e8f9;',
'  font-family:"Noto Sans KR","Inter",system-ui,sans-serif;',
'  font-size:12.5px;',
'  padding:6px 14px;',
'  border-radius:20px;',
'  cursor:pointer;',
'  transition:background .15s,border-color .15s,color .15s;',
'  white-space:nowrap;',
'}',
'.kc-chip:hover {',
'  background:rgba(6,182,212,0.12);',
'  border-color:rgba(6,182,212,0.5);',
'  color:#a5f3fc;',
'}',
'',
'/* Product card glassmorphism */',
'.kc-product-card {',
'  background:rgba(6,182,212,0.04);',
'  backdrop-filter:blur(12px);',
'  -webkit-backdrop-filter:blur(12px);',
'  border:1px solid rgba(6,182,212,0.12);',
'  border-radius:14px;',
'  overflow:hidden;',
'  margin-top:4px;',
'  animation:kcFadeIn .4s ease;',
'}',
'.kc-product-card-img {',
'  display:flex; justify-content:center; padding:16px 16px 8px;',
'  background:rgba(255,255,255,0.02);',
'}',
'.kc-product-card-img img {',
'  max-height:140px; max-width:100%; object-fit:contain;',
'}',
'.kc-product-card-body { padding:12px 16px 16px; }',
'.kc-product-card-badge {',
'  display:inline-block;',
'  font-size:9px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em;',
'  padding:2px 8px; border-radius:10px;',
'  background:rgba(6,182,212,0.1); color:#67e8f9;',
'  margin-bottom:4px;',
'}',
'.kc-product-card-name {',
'  font-family:"Noto Sans KR","Inter",system-ui,sans-serif;',
'  font-size:15px; font-weight:700; color:#e2e8f0; margin:2px 0 4px;',
'}',
'.kc-product-card-desc {',
'  font-family:"Noto Sans KR","Inter",system-ui,sans-serif;',
'  font-size:12px; color:rgba(255,255,255,0.5); margin:0 0 8px;',
'}',
'.kc-product-card-specs { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:12px; }',
'.kc-product-card-spec {',
'  font-size:10px; padding:3px 8px; border-radius:6px;',
'  background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.15);',
'  color:#6ee7b7;',
'  font-family:"Noto Sans KR","Inter",system-ui,sans-serif;',
'}',
'.kc-product-card-link {',
'  display:inline-flex; align-items:center; gap:4px;',
'  font-family:"Noto Sans KR","Inter",system-ui,sans-serif;',
'  font-size:12px; font-weight:500; color:#06b6d4;',
'  text-decoration:none; transition:color .15s;',
'}',
'.kc-product-card-link:hover { color:#22d3ee; }',
'',
'/* Input area */',
'#kc-chatbot-input-area {',
'  flex-shrink:0;',
'  padding:12px 14px;',
'  border-top:1px solid rgba(6,182,212,0.1);',
'  background:rgba(6,13,27,0.8);',
'  display:flex; gap:8px; align-items:center;',
'}',
'#kc-chatbot-input {',
'  flex:1;',
'  background:rgba(255,255,255,0.05);',
'  border:1px solid rgba(6,182,212,0.15);',
'  border-radius:12px;',
'  padding:10px 14px;',
'  color:#e2e8f0;',
'  font-family:"Noto Sans KR","Inter",system-ui,sans-serif;',
'  font-size:13.5px;',
'  outline:none;',
'  transition:border-color .2s;',
'}',
'#kc-chatbot-input::placeholder { color:rgba(255,255,255,0.25); }',
'#kc-chatbot-input:focus { border-color:rgba(6,182,212,0.4); }',
'#kc-chatbot-send {',
'  flex-shrink:0; width:38px; height:38px; border-radius:10px;',
'  background:linear-gradient(135deg,#06b6d4,#10b981);',
'  border:none; cursor:pointer;',
'  display:flex; align-items:center; justify-content:center;',
'  transition:transform .15s,opacity .15s;',
'  opacity:.85;',
'}',
'#kc-chatbot-send:hover { transform:scale(1.06); opacity:1; }',
'#kc-chatbot-send svg { width:18px; height:18px; fill:#fff; }',
'',
'/* Mobile full screen */',
'@media(max-width:480px){',
'  #kc-chatbot-window {',
'    top:0!important; left:0!important; right:0!important; bottom:0!important;',
'    width:100%!important; height:100%!important;',
'    border-radius:0!important;',
'    max-height:100vh!important; max-height:100dvh!important;',
'  }',
'  #kc-chatbot-window.kc-open {',
'    transform:translateY(0) scale(1);',
'  }',
'  #kc-chatbot-btn.kc-hidden-mobile { display:none; }',
'  #kc-chatbot-input-area {',
'    padding-bottom:max(12px, env(safe-area-inset-bottom));',
'  }',
'}'
  ].join('\n');
  document.head.appendChild(css);
}

/* ========================================================================
   BUILD DOM
   ======================================================================== */
var chatWindow, chatMessages, chatInput, chatBtn;

function buildDOM(){
  // --- Floating button ---
  chatBtn = document.createElement('button');
  chatBtn.id = 'kc-chatbot-btn';
  chatBtn.setAttribute('aria-label','KC AI \uC0C1\uB2F4 \uC5F4\uAE30');
  setChatIcon();
  document.body.appendChild(chatBtn);

  // --- Chat window ---
  chatWindow = document.createElement('div');
  chatWindow.id = 'kc-chatbot-window';

  // Header
  var header = document.createElement('div');
  header.id = 'kc-chatbot-header';

  var titleWrap = document.createElement('div');
  titleWrap.id = 'kc-chatbot-header-title';
  var sparkle = document.createElement('span');
  sparkle.className = 'kc-sparkle';
  sparkle.textContent = '\u2728';
  titleWrap.appendChild(sparkle);
  titleWrap.appendChild(document.createTextNode(' KC AI \uC0C1\uB2F4'));
  header.appendChild(titleWrap);

  var minBtn = document.createElement('button');
  minBtn.id = 'kc-chatbot-minimize';
  var minSvg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  minSvg.setAttribute('width','16');
  minSvg.setAttribute('height','16');
  minSvg.setAttribute('viewBox','0 0 24 24');
  minSvg.setAttribute('fill','none');
  minSvg.setAttribute('stroke','currentColor');
  minSvg.setAttribute('stroke-width','2');
  var minPath = document.createElementNS('http://www.w3.org/2000/svg','path');
  minPath.setAttribute('d','M18 6L6 18M6 6l12 12');
  minSvg.appendChild(minPath);
  minBtn.appendChild(minSvg);
  minBtn.onclick = function(){ toggleChat(); };
  header.appendChild(minBtn);

  chatWindow.appendChild(header);

  // Messages area
  chatMessages = document.createElement('div');
  chatMessages.id = 'kc-chatbot-messages';
  chatWindow.appendChild(chatMessages);

  // Input area
  var inputArea = document.createElement('div');
  inputArea.id = 'kc-chatbot-input-area';

  chatInput = document.createElement('input');
  chatInput.id = 'kc-chatbot-input';
  chatInput.type = 'text';
  chatInput.placeholder = '\uBA54\uC2DC\uC9C0\uB97C \uC785\uB825\uD558\uC138\uC694...';
  chatInput.autocomplete = 'off';
  chatInput.addEventListener('keydown', function(e){
    if(e.key === 'Enter' && !e.isComposing) handleSend();
  });
  inputArea.appendChild(chatInput);

  var sendBtn = document.createElement('button');
  sendBtn.id = 'kc-chatbot-send';
  sendBtn.setAttribute('aria-label','\uBCF4\uB0B4\uAE30');
  var sendSvg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  sendSvg.setAttribute('viewBox','0 0 24 24');
  var sendPath = document.createElementNS('http://www.w3.org/2000/svg','path');
  sendPath.setAttribute('d','M2.01 21L23 12 2.01 3 2 10l15 2-15 2z');
  sendSvg.appendChild(sendPath);
  sendBtn.appendChild(sendSvg);
  sendBtn.onclick = function(){ handleSend(); };
  inputArea.appendChild(sendBtn);

  chatWindow.appendChild(inputArea);
  document.body.appendChild(chatWindow);

  // Button click handler
  chatBtn.onclick = function(){ toggleChat(); };
}

function setChatIcon(){
  while(chatBtn.firstChild) chatBtn.removeChild(chatBtn.firstChild);
  var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');
  var p1 = document.createElementNS('http://www.w3.org/2000/svg','path');
  p1.setAttribute('d','M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z');
  svg.appendChild(p1);
  var p2 = document.createElementNS('http://www.w3.org/2000/svg','path');
  p2.setAttribute('d','M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z');
  svg.appendChild(p2);
  chatBtn.appendChild(svg);
}

function setCloseIcon(){
  while(chatBtn.firstChild) chatBtn.removeChild(chatBtn.firstChild);
  var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');
  svg.setAttribute('fill','none');
  svg.setAttribute('stroke','#fff');
  svg.setAttribute('stroke-width','2.5');
  svg.setAttribute('stroke-linecap','round');
  var p1 = document.createElementNS('http://www.w3.org/2000/svg','line');
  p1.setAttribute('x1','18'); p1.setAttribute('y1','6');
  p1.setAttribute('x2','6'); p1.setAttribute('y2','18');
  svg.appendChild(p1);
  var p2 = document.createElementNS('http://www.w3.org/2000/svg','line');
  p2.setAttribute('x1','6'); p2.setAttribute('y1','6');
  p2.setAttribute('x2','18'); p2.setAttribute('y2','18');
  svg.appendChild(p2);
  chatBtn.appendChild(svg);
}

/* ========================================================================
   TOGGLE
   ======================================================================== */
function toggleChat(){
  isOpen = !isOpen;
  if(isOpen){
    chatWindow.classList.add('kc-open');
    setCloseIcon();
    if(window.innerWidth <= 480) chatBtn.classList.add('kc-hidden-mobile');
    if(!welcomeShown) showWelcome();
    setTimeout(function(){ chatInput.focus(); }, 350);
  } else {
    chatWindow.classList.remove('kc-open');
    setChatIcon();
    chatBtn.classList.remove('kc-hidden-mobile');
  }
}

/* ========================================================================
   AVATAR HELPER
   ======================================================================== */
function createAvatar(){
  var av = document.createElement('div');
  av.className = 'kc-avatar';
  var img = document.createElement('img');
  img.src = 'Logo/logo-kc.png';
  img.alt = 'KC';
  img.onerror = function(){
    if(img.parentNode) img.parentNode.removeChild(img);
    av.textContent = 'KC';
  };
  av.appendChild(img);
  return av;
}

/* ========================================================================
   MESSAGE HELPERS
   ======================================================================== */
function renderMarkdown(text){
  if(markedReady && window.marked){
    return marked.parse(text);
  }
  // Fallback: escape HTML and convert newlines
  var escaped = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return escaped.replace(/\n/g,'<br>');
}

function addBotMessage(text, skipMarkdown){
  var row = document.createElement('div');
  row.className = 'kc-msg-row kc-bot';
  row.appendChild(createAvatar());
  var bubble = document.createElement('div');
  bubble.className = 'kc-bubble kc-bot-bubble';
  if(skipMarkdown){
    bubble.textContent = text;
  } else {
    // Markdown rendering: content comes from controlled Gemini API with system prompt, not arbitrary user input
    var rendered = renderMarkdown(text);
    var temp = document.createElement('div');
    temp.innerHTML = rendered;  // eslint-disable-line -- trusted source (Gemini API response with system prompt)
    while(temp.firstChild) bubble.appendChild(temp.firstChild);
  }
  row.appendChild(bubble);
  chatMessages.appendChild(row);
  scrollBottom();
  return row;
}

function addUserMessage(text){
  var row = document.createElement('div');
  row.className = 'kc-msg-row kc-user';
  var bubble = document.createElement('div');
  bubble.className = 'kc-bubble kc-user-bubble';
  bubble.textContent = text;
  row.appendChild(bubble);
  chatMessages.appendChild(row);
  scrollBottom();
}

function scrollBottom(){
  requestAnimationFrame(function(){
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

/* ========================================================================
   TYPING INDICATOR
   ======================================================================== */
var typingRow = null;

function showTyping(){
  typingRow = document.createElement('div');
  typingRow.className = 'kc-msg-row kc-bot';
  typingRow.appendChild(createAvatar());
  var dots = document.createElement('div');
  dots.className = 'kc-typing';
  for(var i=0;i<3;i++) dots.appendChild(document.createElement('span'));
  typingRow.appendChild(dots);
  chatMessages.appendChild(typingRow);
  scrollBottom();
}

function hideTyping(){
  if(typingRow && typingRow.parentNode){
    typingRow.parentNode.removeChild(typingRow);
  }
  typingRow = null;
}

/* ========================================================================
   PRODUCT CARD
   ======================================================================== */
function addProductCard(key){
  var p = kcProducts[key];
  if(!p) return;

  var row = document.createElement('div');
  row.className = 'kc-msg-row kc-bot';
  row.appendChild(createAvatar());

  var card = document.createElement('div');
  card.className = 'kc-product-card';
  card.style.maxWidth = '280px';

  // Image
  var imgWrap = document.createElement('div');
  imgWrap.className = 'kc-product-card-img';
  var img = document.createElement('img');
  img.src = p.img;
  img.alt = p.name;
  img.onerror = function(){ imgWrap.style.display = 'none'; };
  imgWrap.appendChild(img);
  card.appendChild(imgWrap);

  // Body
  var body = document.createElement('div');
  body.className = 'kc-product-card-body';

  var badge = document.createElement('span');
  badge.className = 'kc-product-card-badge';
  badge.textContent = 'IC Biomedical';
  body.appendChild(badge);

  var name = document.createElement('div');
  name.className = 'kc-product-card-name';
  name.textContent = p.name;
  body.appendChild(name);

  var desc = document.createElement('div');
  desc.className = 'kc-product-card-desc';
  desc.textContent = p.desc;
  body.appendChild(desc);

  var specs = document.createElement('div');
  specs.className = 'kc-product-card-specs';
  p.specs.forEach(function(s){
    var sp = document.createElement('span');
    sp.className = 'kc-product-card-spec';
    sp.textContent = s;
    specs.appendChild(sp);
  });
  body.appendChild(specs);

  var btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:4px;';

  var link = document.createElement('a');
  link.className = 'kc-product-card-link';
  link.href = p.url;
  link.textContent = '\uC0C1\uC138 \uBCF4\uAE30 ';
  var arrowSvg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  arrowSvg.setAttribute('width','14');
  arrowSvg.setAttribute('height','14');
  arrowSvg.setAttribute('viewBox','0 0 24 24');
  arrowSvg.setAttribute('fill','none');
  arrowSvg.setAttribute('stroke','currentColor');
  arrowSvg.setAttribute('stroke-width','2');
  var arrowPath = document.createElementNS('http://www.w3.org/2000/svg','path');
  arrowPath.setAttribute('d','M5 12h14M12 5l7 7-7 7');
  arrowSvg.appendChild(arrowPath);
  link.appendChild(arrowSvg);
  btnRow.appendChild(link);

  var quoteBtn = document.createElement('a');
  quoteBtn.className = 'kc-product-card-link kc-product-card-quote';
  quoteBtn.href = 'javascript:void(0)';
  quoteBtn.textContent = '\uACAC\uC801 \uC694\uCCAD ';
  quoteBtn.style.cssText = 'color:#10b981;cursor:pointer;';
  quoteBtn.addEventListener('mouseover', function(){ this.style.color='#34d399'; });
  quoteBtn.addEventListener('mouseout', function(){ this.style.color='#10b981'; });
  (function(k){ quoteBtn.addEventListener('click', function(){ showQuoteForm(k); }); })(key);
  var quoteSvg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  quoteSvg.setAttribute('width','14');
  quoteSvg.setAttribute('height','14');
  quoteSvg.setAttribute('viewBox','0 0 24 24');
  quoteSvg.setAttribute('fill','none');
  quoteSvg.setAttribute('stroke','currentColor');
  quoteSvg.setAttribute('stroke-width','2');
  var quotePath = document.createElementNS('http://www.w3.org/2000/svg','path');
  quotePath.setAttribute('d','M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2');
  quoteSvg.appendChild(quotePath);
  quoteBtn.appendChild(quoteSvg);
  btnRow.appendChild(quoteBtn);

  body.appendChild(btnRow);

  card.appendChild(body);
  row.appendChild(card);
  chatMessages.appendChild(row);
  scrollBottom();
}

/* ========================================================================
   WELCOME
   ======================================================================== */
function showWelcome(){
  welcomeShown = true;
  addBotMessage('\uC548\uB155\uD558\uC138\uC694! \uD55C\uAD6D\uCD08\uC800\uC628\uC6A9\uAE30 AI \uC0C1\uB2F4\uC0AC\uC785\uB2C8\uB2E4. \uBB34\uC5C7\uC774\uB4E0 \uBB3C\uC5B4\uBCF4\uC138\uC694!', true);

  // Chips
  var chipRow = document.createElement('div');
  chipRow.className = 'kc-msg-row kc-bot';
  var spacer = document.createElement('div');
  spacer.style.width = '42px';
  spacer.style.flexShrink = '0';
  chipRow.appendChild(spacer);

  var chips = document.createElement('div');
  chips.className = 'kc-chips';

  var suggestions = [
    '\uBC14\uC774\uC624\uBC45\uD06C \uC7A5\uBE44 \uCD94\uCC9C',
    '\uC561\uCCB4\uD5EC\uB968 \uACF5\uAE09 \uAC00\uB2A5?',
    '\uD68C\uC0AC \uC18C\uAC1C\uD574\uC918',
    '\uC81C\uD488 \uCC3E\uAE30 \uB3C4\uC640\uC918'
  ];

  suggestions.forEach(function(text){
    var chip = document.createElement('button');
    chip.className = 'kc-chip';
    chip.textContent = text;
    chip.onclick = function(){
      if(chipRow.parentNode) chipRow.parentNode.removeChild(chipRow);
      sendMessage(text);
    };
    chips.appendChild(chip);
  });

  chipRow.appendChild(chips);
  chatMessages.appendChild(chipRow);
  scrollBottom();
}

/* ========================================================================
   GEMINI API — FULL SYSTEM PROMPT
   ======================================================================== */
var systemPrompt = [
'KC BIOBANKING AI KNOWLEDGE BASE',
'=================================',
'Company: \uD55C\uAD6D\uCD08\uC800\uC628\uC6A9\uAE30(\uC8FC) / Korea Cryogenics Co., Ltd.',
'Official Partner: IC Biomedical (USA)',
'CEO: \uC774\uD76C\uB780 (Lee Hee-ran)',
'Business Registration: 214-81-19072',
'Founded: 1990 (30+ years of cryogenic expertise)',
'Address: \uACBD\uAE30\uB3C4 \uC131\uB0A8\uC2DC \uC911\uC6D0\uAD6C \uB454\uCD0C\uB300\uB85C 560 \uBCBD\uC0B0\uD14C\uD06C\uB178\uD53C\uC544 201\uD638',
'Phone: 031-737-8171~4 | FAX: 031-737-8175',
'Email: info@koreacryo.com',
'Hours: Mon-Fri 09:00-18:00',
'Key Stats: 100+ research/medical institution partners, 99.9% equipment uptime',
'',
'=====================================',
'COMPANY SERVICES & ENGINEERING',
'=====================================',
'',
'ENGINEERING CAPABILITIES',
'- Consulting & System Design: Engineers design optimal biobank layouts considering facility scale, traffic flow, and gas safety.',
'- Automatic LN2 Filling System: 24/7 automated level maintenance via high-efficiency vacuum piping and auto-fill control \u2014 no human intervention.',
'- Monitoring & Safety System: O2 concentration detection, emergency alarms, real-time remote monitoring to protect researchers and samples.',
'- Stable Gas Supply: Uninterrupted LN2 supply through established logistics infrastructure, with regular preventive maintenance.',
'',
'TURNKEY SYSTEM',
'Complete biobank from design to operation: Bulk LN2 storage tank + overhead vacuum piping with valve control + cryogenic freezers (20+ units simultaneously). 24/7 real-time temperature and liquid level monitoring.',
'',
'GAS SUPPLY PARTNERS: Air Products, Praxair, Linde, Air Liquide',
'',
'CLIENT SECTORS',
'- Hospitals: Pathology, blood/tumor banks, clinical medicine, diagnostic labs, tissue banks, dermatology, dentistry',
'- Pharma & Research: Animal cells, MCB/WCB, cord blood banks, stem cell banks, vaccine/cell therapy research',
'- Government & Resource Banks: KRISS, KGSC, human resource banks, strain/seed/sperm banks',
'- Universities & Education: University labs, R&D centers',
'',
'AFTER-SALES SERVICE (A/S)',
'- 24h Emergency Response: On-site dispatch within 24 hours, 4-engineer dedicated team',
'- 5yr Vacuum Warranty: Vacuum insulation 5-year warranty, controller 2-year warranty, backup equipment support',
'- 14+ Spare Parts: Solenoid valves, sensors, controllers \u2014 14+ critical parts always in stock',
'- Manufacturer-certified engineers perform installation, calibration, and repair',
'',
'VALIDATION & COMPLIANCE',
'- Calibration: NIST-traceable standard equipment, Fluke Process Calibrator loop checks (temperature sensor + 4-20mA control signal), sensor adjustment per manufacturer manual',
'- IQ (Installation Qualification): Environment, utilities, component specs, documentation verification',
'- OQ (Operational Qualification): Function tests (controller, data logging), alarm tests, power failure tests',
'- PQ (Performance Qualification): 72-hour continuous worst-case temperature mapping, door-open recovery verification, customer URS-based custom protocols',
'- Manufacturer-certified engineers, FDA/KFDA audit-ready standardized protocols and reports',
'- One-stop: Equipment procurement > Installation > Calibration > Validation > Maintenance',
'',
'O2 MONITORING \u2014 PUREAIRE AIRCHECK',
'- 10yr+ sensor life (no calibration needed), Zirconium Oxide O2 Cell',
'- 90dB alarm (non-mutable), dual alarm at 19.5% and 18.0%',
'- Operates at -40C, 4-20mA output for external system integration',
'- LED 70m extension display, CE certified, 3-year warranty',
'',
'STORAGE METHODS',
'- Rack/Box Type: Vial > Box (5x5, 9x9, 10x10) > Rack > Freezer. LIMS-compatible. For GMP pharma, large biobanks. Products: LABS, LS Series.',
'- Cane Type: Vial > Cane > Canister > Freezer. Quick access, economical for small-scale. For university labs, small labs. Products: XT, TW, HC Series.',
'',
'=====================================',
'PRODUCT LINE: REVOLUTION SERIES (FLAGSHIP)',
'=====================================',
'Premium auto-control cryogenic freezers for biobanks, pharma, cell therapy.',
'',
'CERTIFICATIONS: ISO 13485 (manufactured in Cartersville, Georgia), cGMP, FDA 21 CFR Part 11, EU MDR',
'',
'KEY TECHNOLOGY \u2014 RADIANCE TEMPERATURE MANAGEMENT',
'- Atomizing nozzles spray ultra-fine LN2 droplets uniformly throughout the chamber',
'- Eliminates temperature stratification \u2014 consistent protection regardless of sample position',
'- Temperature range: -20C to -190C (user-configurable)',
'- AI algorithm learns usage patterns and auto-optimizes LN2 supply',
'- 5 RTD temperature sensors for real-time mapping; SMS/email alerts, external BMS integration',
'- Heat leakage: 0.008 KW vs mechanical compressor 1-3 KW (125-375x better)',
'- Power failure: Maintains temperature for 72 hours (mechanical rises +20C/hour)',
'',
'TWO CONFIGURATIONS',
'- Revolution (Standard): Manual carousel, Radiance control, FDA 21 CFR Part 11/cGMP, audit trail, dual authentication. For university labs, small biobanks, clinical labs.',
'- Revolution-SA (Premium): Motorized auto-carousel with rack learning, Radiance AI (adaptive temp control), multi-level user access per quadrant. For pharma GMP, hospital biobanks, large clinical storage.',
'',
'SECURITY: RFID badge + password dual authentication, unlimited user profiles, granular permissions, full audit trail (ID + timestamp), electronic lock with auto-lock timer.',
'',
'CONTROL: Large touchscreen, industrial PLC platform, dual level sensing (RTD + differential pressure), web server remote access, Modbus interface, auto-defrost on lid open, built-in LED lighting.',
'',
'300 SERIES SPECS',
'- 313-P: 16,900 vials, 12 large + 4 mini racks, 54.3L LN2, 759mm ID, 1465mm H, 209.6 kg',
'- 315-P: 19,500 vials, 12 large + 4 mini racks, 67.0L LN2, 759mm ID, 1615mm H, 222.3 kg',
'',
'400 SERIES SPECS',
'- 413-P: 36,400 vials, 24 large + 16 mini racks, 133L LN2, 1012mm ID, 1419mm H, 307 kg',
'- 415-P: 42,000 vials, 24 large + 16 mini racks, 102L LN2, 1012mm ID, 1574mm H, 334.5 kg',
'- 413-R: 39,000 vials, 26 large + 16 mini racks (enhanced layout)',
'- 415-R: 45,000 vials, 26 large + 16 mini racks',
'',
'600 SERIES SPECS',
'- 613-P: 85,475 vials, 54 large + 39 mini racks, 225L LN2, 1470mm ID, 1469mm H, 576.6 kg',
'- 615-P: 98,625 vials (MAX), 56 large + 39 mini racks, 319L LN2, 1470mm ID, 1625mm H, 615.9 kg',
'- 613-R: 83,200 vials, 60 large + 16 mini racks',
'- 615-R: 96,000 vials, 60 large + 16 mini racks',
'',
'UPCOMING: Revolution-Q \u2014 Fully automated rack positioning, AI-based sample tracking, LIMS integration (in development).',
'',
'=====================================',
'PRODUCT LINE: LABS SERIES',
'=====================================',
'Large-scale stainless steel LN2 storage systems. 371L-1,595L capacity, up to 93,000 vials.',
'',
'KEY FEATURES',
'- H-Type Turntable: 4 independent storage zones, single-pivot aluminum (maintenance-free)',
'- Hinged lockable lid with auto-defog on open',
'- CS Controller: 0.1C resolution temperature monitoring, low-level alarm, remote alert',
'- Quick Chill: Auto cooling correction after lid close',
'- 100/81-cell rack system: Accommodates 2ml vials to 500ml bags',
'- Stainless steel body, Made in USA',
'',
'MODELS',
'- LABS-20K: 371L, 19,500 vials, 14 racks, 295 kg empty, 34" OD',
'- LABS-38K: 623L, 37,700 vials, 26 racks, 422 kg empty, 42" OD',
'- LABS-40K (most popular): 698L, 41,600 vials, 30 racks, 417 kg empty, 45" OD',
'- LABS-80K: 1,269L, 79,300 vials, 58 racks, 703 kg empty, 59.5" OD',
'- LABS-94K: 1,595L, 93,000 vials, 60 racks, 771 kg empty, 59.5" OD',
'',
'BAG CAPACITY (LABS-94K): Up to 6,856 x 25ml bags, 3,864 x 50ml bags, 2,304 x 250ml bags, 1,932 x 500ml bags',
'',
'=====================================',
'PRODUCT LINE: LS SERIES',
'=====================================',
'Box-type rack vial storage systems. Up to 6,000 vials, vapor phase -190C.',
'',
'KEY FEATURES',
'- Computer-compatible box racks with index position rings for accurate sample tracking',
'- Vapor phase storage: -190C at rack top without direct LN2 contact (cross-contamination prevention)',
'- Liquid or vapor phase dual operation',
'- Protective aluminum exterior with impact-resistant bumper design',
'- CS100 controller option on LS4800/LS6000 for remote monitoring',
'',
'MODELS',
'- LS750: 35L, 750 vials, 130-day hold, 0.27 L/day evap, 17.7 kg, 457mm dia, 686mm H',
'- LS3000: 81L, 3,000 vials, 106-day hold, 0.76 L/day evap, 31.8 kg, 683mm dia, 732mm H',
'- LS4800: 130L, 4,800 vials, 130-day hold, 1.00 L/day evap, 40.8 kg, 683mm dia, 892mm H (CS100 option)',
'- LS6000: 165L, 6,000 vials, 165-day hold, 1.00 L/day evap, 54.9 kg, 683mm dia, 991mm H (CS100 option)',
'',
'=====================================',
'PRODUCT LINE: LD SERIES',
'=====================================',
'Liquid nitrogen dewars for storage and dispensing. 4L to 50L.',
'',
'KEY FEATURES',
'- High-strength aluminum body with ribbed construction',
'- Magnaforming neck tube (electromagnetic forming) minimizes heat loss',
'- High-vacuum insulation, durable coating',
'- LWD (Liquid Withdrawal Device) compatible on 25LD/35LD/50LD: Max 8 L/min flow, 0.5 bar, tool-free clamp',
'',
'USE CASES: LN2 dispensing, cryotherapy (dermatology), metal shrink fitting, lab supply',
'',
'MODELS',
'- 4LD: 4L, 10-day hold, 0.40 L/day, 30.5mm neck, 3.0 kg',
'- 5LD: 5L, 6-day hold, 0.77 L/day, 38.1mm neck, 3.5 kg',
'- 10LD: 10L, 45-day hold, 0.22 L/day, 31.8mm neck, 5.4 kg',
'- 25LD: 25L, 109-day hold, 0.23 L/day, 50.8mm neck, 9.5 kg (LWD compatible)',
'- Classic-25: 25L, 119-day hold, 0.21 L/day (lowest evaporation), 50.8mm neck, 10.2 kg',
'- 35LD: 35L, 120-day hold (longest), 0.29 L/day, 50.8mm neck, 12.7 kg (LWD compatible)',
'- 50LD: 50L, 102-day hold, 0.49 L/day, 63.5mm neck, 17.6 kg (LWD compatible)',
'',
'=====================================',
'PRODUCT LINE: XT SERIES',
'=====================================',
'Extended Time design for long-term cane storage. Up to 340-day hold, 0.09 L/day evaporation.',
'',
'KEY FEATURES',
'- High-vacuum insulation extends LN2 retention 2-3x vs standard models',
'- 6-canister configuration, compatible with straws and vials',
'- Optimized for reproductive medicine, stem cells, gene banks',
'',
'MODELS (XTL \u2014 Straw-specialized)',
'- 3XTL: 3L, 27-day hold, 0.11 L/day, 6 canisters, 750 straws, 3.2 kg',
'- 8XTL: 8L, 80-day hold, 0.10 L/day, 6 canisters, 750 straws, 8.9 kg',
'',
'MODELS (XT \u2014 Vial/general)',
'- 10XT: 10L, 100-day hold, 0.10 L/day, 6 canisters, 150 vials, 7.5 kg',
'- 20XT (recommended): 20.7L, 230-day hold, 0.09 L/day, 6 canisters, 150 vials, 11.8 kg',
'- 34XT: 34L, 340-day hold, 0.10 L/day, 6 canisters, 150 vials, 15.8 kg',
'',
'=====================================',
'PRODUCT LINE: HC SERIES',
'=====================================',
'High-Capacity cane storage. Wide neck tubes for larger canisters. Up to 17,200 straws (0.25cc).',
'',
'NOTE: 35HC, 35VHC, 34HC have been replaced by ICB Series (ICB 35-10, ICB 35-6, ICB 34).',
'',
'MODELS',
'- 12HCL: 12L, 60-day hold, 0.20 L/day, 6 canisters, 490 straws (0.5cc), 3.6" neck',
'- 20HC: 20L, 87-day hold, 0.23 L/day, 6 canisters, 570 vials (5/cane), 3.6" neck',
'- 38HC: 38L, 120-day hold, 0.32 L/day, 10 canisters, 17,200 straws (0.25cc) / 6,000 straws (0.5cc), 5.0" neck',
'- 38VHC: 38L, 120-day hold, 0.32 L/day, 10 canisters, 1,512 vials (6/cane), 5.0" neck',
'',
'=====================================',
'PRODUCT LINE: ICB SERIES',
'=====================================',
'Next-generation LN2 freezers. 21L-48L, 7 models, up to 218-day hold, up to 21,564 straws.',
'',
'KEY FEATURES',
'- Industry-standard canister compatibility',
'- Standard shipping container compatible (ICB 20/24: 368mm diameter)',
'- Multiple storage configurations: straws (0.25cc/0.5cc), vials, bulk racks',
'- High-strength stainless exterior, multi-layer vacuum insulation, IATA-compliant safety design',
'',
'MODELS \u2014 Compact (21-34L)',
'- ICB 20: 21L, 210-day hold, 0.10 L/day, 6 canisters (1.65"), 1,872 straws (0.5cc), 252 vials, 11.8 kg',
'- ICB 24: 24L, 218-day hold (longest), 0.11 L/day, 6 canisters (1.89"), 1,380 straws, 288 vials, 12.7 kg',
'- ICB 34: 34L, 189-day hold, 0.18 L/day, 6 canisters (2.8"), 4,800 straws (0.5cc bulk), 684 vials, 16.8 kg',
'',
'MODELS \u2014 Large (35L)',
'- ICB 35-6: 35L, 130-day hold, 6 large canisters (3.7"), 21,564 straws (0.25cc bulk), 1,260 vials, 16.8 kg',
'- ICB 35-10: 35L, 130-day hold, 10 standard canisters (2.64"), 16,400 straws (0.25cc bulk), 1,020 vials, 16.8 kg',
'',
'MODELS \u2014 Maximum (48L)',
'- ICB 47-6: 48L, 123-day hold, 6 large canisters (4.0"), 21,564 straws (0.25cc bulk), 1,260 vials, 20 kg',
'- ICB 47-10: 48L, 123-day hold, 10 standard canisters (2.8"), 17,900 straws (0.25cc bulk), 1,140 vials, 20 kg',
'',
'=====================================',
'PRODUCT LINE: ICB DUAL SERIES',
'=====================================',
'Store.Ship.Store. \u2014 One vessel for the entire sample lifecycle. LN2 storage > Vapor shipping > Re-storage without sample transfer.',
'',
'KEY FEATURES',
'- Zero sample transfer: Same vessel throughout store-ship-store cycle',
'- IATA-compliant vapor shipping mode',
'- Cost savings: No separate shipping vessel needed',
'- All models support 30-day vapor shipping hold',
'',
'MODELS \u2014 Compact',
'- ICB20 Dual: 21L, 210-day store / 30-day ship, 0.10 L/day, 6 canisters (41.9mm), 660 straws (0.5cc), 15.4 kg filled',
'- ICB22 Dual: 22L, 122-day store / 30-day ship, 0.18 L/day, 6 canisters (76.2mm), 2,400 straws, 15.9 kg filled',
'- ICB34 Dual: 34L, 188-day store / 30-day ship, 0.18 L/day, 6 canisters (71.2mm), 2,100 straws, 20.4 kg filled',
'',
'MODELS \u2014 Large',
'- ICB47-6 Dual: 48L, 123-day store / 30-day ship, 6 canisters (101.6mm), 3,900 straws, 26.8 kg filled',
'- ICB47-10 Dual: 48L, 123-day store / 30-day ship, 10 canisters (71.1mm), 3,200 straws, 26.8 kg filled',
'',
'=====================================',
'PRODUCT LINE: AI / LIVESTOCK (\uCD95\uC0B0)',
'=====================================',
'Specialized cryogenic equipment for artificial insemination programs (cattle, horses, pigs, sheep).',
'',
'AI SHIELD TECHNOLOGY',
'- Patented insulated canisters maintain internal temperature during ambient exposure',
'- After 40 exposures: ~60% sperm viability (vs ~25% with standard canisters = 2.4x improvement)',
'- Directly improves conception rates',
'',
'AI SHIELD MODELS',
'- AIS 1.5: 1.5L LN2, 25-day hold, 1 canister, 50 straws, 3.2 kg',
'- AIS 3: 3.0L LN2, 30-day hold, 2 canisters, 100 straws, 4.5 kg',
'',
'LIVESTOCK ICB MODELS (with AI-specific hold times)',
'- ICB 20: 20L, 60-day hold, 6 canisters, 792 straws, 14.5 kg',
'- ICB 24: 24L, 150-day hold, 6 canisters, 792 straws, 18.6 kg',
'- ICB 34: 34L, 200-day hold, 6 canisters, 792 straws, 22.7 kg',
'- ICB 35-6: 35L, 210-day hold, 6 canisters, 792 straws, 24.5 kg',
'- ICB 35-10: 35L, 270-day hold, 10 canisters, 1,320 straws, 25.0 kg',
'',
'LIVESTOCK XT MODELS',
'- XT 10: 10L, 66-day hold, 6 canisters, 792 straws, 9.8 kg',
'- XT 20: 20L, 128-day hold, 6 canisters, 792 straws, 14.1 kg',
'- XT 21-AI: 21L, 180-day hold, 6 canisters, 792 straws, 16.8 kg',
'- XT 34: 34L, 238-day hold, 6 canisters, 792 straws, 22.2 kg',
'',
'BULK FREEZERS FOR SEMEN BANKS',
'- LABS 80K AI: 475L, 150-day hold, 36 canisters, 80,000 straws, 172 kg',
'- AI 91K: 680L, 210-day hold, 42 canisters, 91,000 straws, 220 kg',
'',
'TANK SELECTION GUIDE (LIVESTOCK)',
'1. Calculate storage capacity: ~132 straws per canister (0.5ml basis)',
'2. Assess usage: Farm field use vs semen bank storage vs shipping',
'3. Check LN2 refill cycle: Remote areas need longer hold times (ICB 35, XT 34)',
'4. Shipping needs: Frequent vehicle transport = lightweight model; air shipping = ICB Dual (IATA compliant)',
'5. Tank lifespan: 10-15 years with proper care. Avoid direct concrete contact, minimize transport shock.',
'',
'COMPETITIVE ADVANTAGE (IC BIOMEDICAL)',
'- Manufactured in Cartersville, Georgia, USA with US materials',
'- Thicker neck tube design than competitors for superior durability',
'- Reinforced structure withstands internal vessel movement during LN2-filled transport',
'',
'=====================================',
'QUICK REFERENCE: PRODUCT SELECTION BY USE CASE',
'=====================================',
'',
'SMALL LAB / DAILY LN2 USE: LD Series (4-50L dewars)',
'LONG-TERM CANE STORAGE (small): XT Series (up to 340-day hold)',
'HIGH-CAPACITY CANE STORAGE: HC Series / ICB Series',
'BOX/RACK VIAL STORAGE (mid-scale): LS Series (up to 6,000 vials)',
'LARGE-SCALE BIOBANK: LABS Series (up to 93,000 vials)',
'PREMIUM AUTOMATED BIOBANK: Revolution Series (up to 98,625 vials, cGMP/FDA compliant)',
'SAMPLE SHIPPING: ICB Dual Series (Store.Ship.Store, IATA compliant)',
'LIVESTOCK AI: AI Shield + ICB/XT Series + LABS Bulk Freezers',
'',
'CONTACT FOR ALL INQUIRIES',
'Phone: 031-737-8171',
'Email: info@koreacryo.com',
'Free consulting available for biobank construction and equipment selection.',
'',
'================================================================================',
'SECTION: KC COMPANY OVERVIEW & HISTORY',
'================================================================================',
'',
'COMPANY: \uD55C\uAD6D\uCD08\uC800\uC628\uC6A9\uAE30(\uC8FC) / Korea Cryogenics Co., Ltd.',
'CEO: \uC774\uD76C\uB780 (Lee Hee-ran)',
'FOUNDED: 1986 (established), 1990 (incorporated as corporation)',
'BUSINESS REG: 214-81-19072',
'SUBSIDIARY: ROTURN',
'ADDRESS: \uACBD\uAE30\uB3C4 \uC131\uB0A8\uC2DC \uC911\uC6D0\uAD6C \uB454\uCD0C\uB300\uB85C 560 \uBCBD\uC0B0\uD14C\uD06C\uB178\uD53C\uC544 201\uD638',
'PHONE: 031-737-8171~4 / FAX: 031-737-8175',
'EMAIL: info@koreacryo.com',
'HOURS: Mon-Fri 09:00-18:00',
'POSITIONING: Korea\'s leading cryogenic infrastructure company \u2014 storage, supply, engineering. 35+ year track record, 200,000+ vessels sold.',
'',
'KEY MILESTONES:',
'- 1986: Company founded \u2014 start of Korea\'s cryogenic industry',
'- 1990: Incorporated as Korea Cryogenics Co., Ltd.',
'- 1991: Korea\'s first cryogenic vessel A/S facility built (Yongin)',
'- 1994: Taylor-Wharton, Cryofab & TOMCO2 Korea Sole Agent contracts',
'- 2001: Luxfer Korea Sole Agent (Medical & Special Gas)',
'- 2003: Taylor-Wharton first factory registration in Korea; AirSep oxygen generator KFDA approval',
'- 2005: Presidential Award for gas safety promotion',
'- 2008: KSTAR (Korea\'s artificial sun) liquid helium supply',
'- 2009: Gas facility construction license (Type 1) registered',
'- 2011: Medical device manufacturing license; GMP certification (KTL-AA-110015)',
'- 2014: ISO 9001 certification; GMP renewal (KTL-ABB-209001)',
'- 2017: Samsung Electronics Pyeongtaek P1 CO2 Supply System contract',
'- 2019: LN2 cryogenic freezer medical device approval; GMP certification',
'- 2020: Hyundai XCIENT hydrogen truck fuel storage system supply (world\'s first mass-produced heavy hydrogen truck, 60-unit pilot)',
'- 2021: IC Biomedical Korea partnership',
'- 2022: Samsung Electronics USA Taylor Project contract (overseas expansion)',
'- 2023: Korea\'s first LH2 bulk storage tank supply, KGSC registration',
'- 2025: 15 LH2 storage tanks delivered; Samsung P4 contract; 200,000+ vessel sales milestone',
'',
'BRAND STORY:',
'- K = compression (chevrons converging like gas cooling to a single point)',
'- C = protection (layered arcs representing double-wall vessel cross-section)',
'- \u00B0 = temperature control (gas molecule / temperature unit)',
'- Brand Colors: Cryo Cyan (technology, trust, transparency), Steel Gray (durability, equipment essence)',
'',
'GLOBAL PARTNERS:',
'- Taylor-Wharton (USA, est. 1742): Cryogenic vessels, 35-year exclusive Korean distributor',
'- Luxfer (UK): Ultra-high purity gas cylinders, 6N+ purity',
'- Cryofab (USA): Custom cryogenic equipment, 50+ year craftsman',
'- IC Biomedical (USA): Biobanking equipment',
'- Thunderbird (USA): Medical oxygen cylinders',
'- TOMCO2 Systems (USA): CO2 supply systems',
'- Turbines, Inc. (subsidiary): Cryogenic flow meters',
'- HL Cryogenics (est. 1992): Vacuum insulated piping (2026 new partnership)',
'- PureAire (USA): Gas safety monitoring',
'',
'KEY CLIENTS: Samsung Electronics (semiconductor fabs P1-P4), SK E&S (liquid hydrogen), Pohang Accelerator Lab, Samsung Display, SK Hynix, KSTAR/Korea Fusion Energy Institute, Agency for Defense Development',
'',
'================================================================================',
'SECTION: CRYOGENIC STORAGE TANKS (cryo-equipment.html)',
'================================================================================',
'',
'PRODUCT: Liquefied Gas Storage Tanks \u2014 Taylor-Wharton Korea exclusive distributor (40 years)',
'TAGLINE: Korea\'s first KGSC-registered LH2 bulk tank. One-stop cryogenic solution from design review to KGSC registration, installation, and commissioning.',
'',
'CERTIFICATIONS: KGSC, ASME, AD 2000, TPED, ISO 9001, National Board',
'',
'PRODUCT LINEUP:',
'1. LH2 Bulk Tank (Hero product): Liquid hydrogen storage at -253\u00B0C. 3,000-60,000L. NER \u2264 0.5%/day. KGSC factory registration + design stage inspection passed.',
'2. Bulk Storage Tanks (VTM): LN2/LO2/LAr/LCO2 large-capacity storage. 3,000-60,000L. Vertical/Horizontal.',
'3. Microbulk (MB): Small-site optimized, auto-refill without cylinder replacement. 450-3,000L.',
'4. Liquid Cylinders (XL): Portable cryogenic cylinders for labs/medical/food. 120-500L.',
'5. Vaporizers & VIP: Ambient/Steam/Electric vaporizers with vacuum-insulated piping connections. Custom configurations.',
'',
'TANK STRUCTURE: Double-wall vacuum insulated \u2014 outer shell, vacuum space, MLI/Perlite insulation, inner vessel.',
'',
'MANUFACTURING: Taylor-Wharton Malaysia (Shah Alam) factory, ASME/KGSC standards. Shipped via Breakbulk vessel from Port Klang to Busan. KC handles customs, KGSC registration, on-site installation with Fisher control valves and instrumentation piping.',
'',
'GAS PROPERTIES (for BOG/holding time calculation):',
'- LH2: BP -253\u00B0C, density 70.8 kg/m3, latent heat 446 kJ/kg',
'- LN2: BP -196\u00B0C, density 808 kg/m3, latent heat 199 kJ/kg',
'- LAr: BP -186\u00B0C, density 1,395 kg/m3, latent heat 161 kJ/kg',
'- LO2: BP -183\u00B0C, density 1,141 kg/m3, latent heat 213 kJ/kg',
'- LNG: BP -162\u00B0C, density 422 kg/m3, latent heat 510 kJ/kg',
'',
'HYDROGEN INFRASTRUCTURE: KC supplies LH2 bulk tanks to hydrogen refueling stations. Tanks store at -253\u00B0C, vaporized hydrogen supplied to 700 bar high-pressure dispensers for vehicles. 24/7 uninterrupted operation.',
'',
'TARGET INDUSTRIES: Hydrogen refueling stations, semiconductor fabs, research labs, hospitals, industrial gas suppliers, food processing.',
'',
'================================================================================',
'SECTION: LIQUID HELIUM (liquid-helium.html)',
'================================================================================',
'',
'PRODUCT: Liquid Helium Supply & Equipment \u2014 Cryofab Korea exclusive partner',
'STATS: 95% domestic market share, 2,000+ vessels supplied, Cryofab est. 1971 (50+ years, NJ USA)',
'',
'TECHNICAL:',
'- LHe boiling point: 4.2K (-268.95\u00B0C) \u2014 colder than cosmic microwave background (2.7K)',
'- Superfluid transition (Lambda Point): 2.17K \u2014 viscosity becomes zero, climbs walls',
'- Helium is the only element with no triple point and remains liquid at absolute zero',
'- Dilution refrigerator reaches 2 mK (0.002K), 1,350x colder than space',
'',
'KEY APPLICATIONS:',
'- Superconducting magnet cooling (MRI, NMR, particle accelerators) at 4.2K for zero electrical resistance',
'- Fusion research (KSTAR, ITER tokamak magnet cooling)',
'- Advanced research (quantum computing, superconductor research, low-temp physics)',
'- Medical MRI (~30% of global helium consumption)',
'',
'PRODUCT LINEUP:',
'1. CMSH Series (Multishield LHe Containers): 30L-3,000L. 304 stainless steel. Custom fabrication. Minimizes helium loss via Multishield design.',
'2. Transfer Lines: CFCL (lab standard, efficient stable transfer), CFHT (neon/hydrogen high-vacuum flexible hose), CFUL (medium-high pressure non-jacketed line), CFFL (neoprene-insulated economy hose). Double-wall vacuum-insulated with STS304 outer jacket and flexible corrugated inner tube.',
'3. Dewar Flask: Double-wall all-stainless steel. Styrofoam lid, bottom drain option, casters, handles. Stores LN2, LAr, LO2.',
'4. CFN Series (Narrow Neck Flask): Minimizes evaporation loss through narrow neck design. For long-term storage.',
'5. CFL Series (Wide Mouth Flask): Wide opening for easy sample access. Optimized for lab environments.',
'',
'KEY CUSTOMERS: KSTAR (Korea Fusion Energy Institute), Pohang Accelerator Lab (PLS-II synchrotron), Seoul National University (Low Temp Physics), KAIST (Superconductivity Center), Samsung Seoul Hospital (MRI cooling), Samsung Semiconductor.',
'',
'================================================================================',
'SECTION: ULTRA-HIGH PURITY GAS CYLINDERS (specialty-gas.html)',
'================================================================================',
'',
'PRODUCT: Luxfer Ultra-High Purity Gas Cylinders \u2014 Korea exclusive distributor',
'PARTNER: Luxfer Gas Cylinders (100+ countries, #1 market share, ISO 9001)',
'MAX PURITY: 6N (99.9999%), MAX PRESSURE: 300 bar',
'',
'KEY TECHNOLOGIES:',
'- L6X\u00AE Aluminum Alloy: Luxfer proprietary alloy with extreme corrosion resistance + lightweight. Contamination-free storage.',
'- SGS\u00AE (Semiconductor Grade Specification): Designed for semiconductor fabs. Internal electropolishing (EP) treatment enables ppb-level impurity control.',
'- Fab Safety Standard: Handles toxic, corrosive, pyrophoric gases. TPED, DOT, TC global certifications.',
'',
'WHY ALUMINUM OVER STEEL:',
'- 40% lighter weight',
'- Non-magnetic (safe near MRI/semiconductor inspection equipment)',
'- Natural Al2O3 oxide film blocks moisture/reactive gas corrosion',
'- Higher thermal conductivity for efficient heat dissipation during filling',
'- CO2 purity variation: Aluminum 0.3 ppm vs Steel 9 ppm',
'- O2 stability over 3 months: Aluminum maintains 21% vs Steel drops to 15% (severe: 6%)',
'- Steel suffers H2CO3 carbonic acid corrosion, pitting corrosion, and sponge-like surface adsorption (memory effect)',
'',
'SEMICONDUCTOR PROCESS GASES SUPPLIED:',
'- Etching: CF4, SF6, Cl2, HBr, NF3',
'- Deposition (CVD/ALD): SiH4, TEOS, WF6, NH3, N2O',
'- Doping (ion implantation): AsH3, PH3, B2H6, BF3',
'- Cleaning/Purge: N2 (UHP), Ar (UHP), He (UHP), HF',
'',
'TARGET: Samsung semiconductor fabs (key client), semiconductor/display manufacturers requiring 6N purity for nanometer-scale processes.',
'',
'================================================================================',
'SECTION: HEALTHCARE / MEDICAL GAS (healthcare.html)',
'================================================================================',
'',
'PRODUCT: Medical Aluminum Oxygen Cylinders & Emergency Oxygen Respirators',
'PARTNER: Thunderbird Cylinders (USA) \u2014 spun off from Luxfer\'s medical cylinder division. KC is Korea official partner.',
'STATS: 100,000+ cylinders supplied, GMP certified facility, 20+ years safe supply',
'',
'PRODUCT LINEUP:',
'1. Medical Aluminum Cylinders: M004 to M265 range. DOT/TC certified, Korea Gas Safety Corporation inspected, CGA standard. For hospital rooms, ER, OR, home care.',
'2. O2Care 300: 2.9L portable oxygen respirator with carrying bag. Includes emergency mask + cannula. Medical device classified.',
'3. O2Care 500: 4.6L with mobile cart. Includes emergency mask + cannula.',
'4. Accessories: Oxygen regulators (aluminum exterior, brass internal, CGA, dial flow control), oxygen valves (nickel-plated, safety valve built-in), mobile carts, bed hooks.',
'',
'WHY ALUMINUM: 30%+ lighter than steel, zero internal corrosion, MRI-compatible (non-magnetic), gas purity maintained.',
'',
'CERTIFICATIONS: GMP (2011 initial, 2014 renewal), Medical Device License (MFDS 2010), Presidential Citation for gas safety (2005), Korea Gas Safety Corporation inspected, gas liability insurance.',
'',
'KEY CUSTOMERS: National Cancer Center, Seoul Asan Hospital, Boramae Hospital, Korea Disease Control and Prevention Agency (KDCA).',
'',
'================================================================================',
'SECTION: GAS ENGINEERING (gas-engineering.html)',
'================================================================================',
'',
'PRODUCT: Gas piping design, installation, and maintenance for semiconductor fabs and industrial facilities',
'STATS: 20+ years engineering experience, Samsung fabs P1-P4, $17B overseas project (Taylor TX), 20+ year zero-accident record',
'',
'CORE SERVICES:',
'- High-purity gas piping design and routing for semiconductor fabs',
'- On-site construction, commissioning, and post-operation maintenance (one-stop)',
'- Bulk tank installation with heavy cranes (dozens of tons CO2 storage tanks)',
'',
'SAMSUNG PYEONGTAEK CAMPUS: CO2 bulk tank supply and installation for P1 through P4 fabs. Continuous contracts demonstrating reliability.',
'',
'TAYLOR PROJECT (USA): Samsung Electronics\' $17B semiconductor foundry in Taylor, Texas. Sub-5nm advanced process. KC applies Korea Pyeongtaek know-how to US site \u2014 specialty gas piping design, construction, safety systems. ~11,000 km technology transfer.',
'',
'CO2 SUPPLY SYSTEM (TOMCO2 Partnership):',
'- Applications: Semiconductor wafer cleaning (ultra-pure CO2), food rapid cooling, industrial welding shielding gas',
'- Water Treatment (TOMCO PSF System): Converts CO2 to carbonic acid (H2CO3) for safe pH control in water purification. Replaces hazardous sulfuric/hydrochloric acid. 95%+ CO2 conversion rate, pH control to 5.50. Installed at 9 water treatment plants nationwide including Seoul Arisu purification centers. No separate contact basin needed.',
'',
'FLOW METERS (Turbines, Inc.):',
'- Positive Displacement (PD) flow meters for cryogenic fluids',
'- Range: -269\u00B0C (LHe) to LPG/LNG',
'- Accuracy: \u00B10.15%',
'- Models: CDS-1000, TMC Meter',
'- KC technical sales team provides selection through installation and A/S',
'',
'REFERENCE CLIENTS: Samsung Electronics (semiconductor fab), Samsung Display (OLED line), SK Hynix (memory semiconductor), Pohang Accelerator Lab (particle accelerator), Korea Fusion Energy Institute (KSTAR), Agency for Defense Development.',
'',
'FAB IMPACT: Gas supply stoppage = entire fab shutdown. Hourly loss \u2265 \u20A95 billion. KC maintains 99.9999% purity, real-time leak detection with immediate shutoff, 20+ years zero gas accidents.',
'',
'================================================================================',
'SECTION: VACUUM INSULATED PIPING (vacuum-piping.html)',
'================================================================================',
'',
'PRODUCT: Vacuum Insulated Piping (VIP) systems for cryogenic fluid transfer',
'NEW PARTNERSHIP (2026): KC x HL Cryogenics (est. 1992, ASME/CE/ISO9001)',
'HL CRYO PARTNERS: Linde, Air Liquide, Air Products',
'',
'TECHNICAL SPECS:',
'- Construction: STS304/316L double-pipe structure',
'- Vacuum: 1x10^-4 Torr',
'- Insulation: Triple insulation \u2014 high vacuum (blocks convection) + MLI super-insulation (blocks radiation) + heat bridge minimization (blocks conduction)',
'- Heat loss: 0.31-1.9 W/m (90% less than conventional insulated piping)',
'- Design life: 10+ years',
'- Fluids: LN2 (-196\u00B0C), LO2 (-183\u00B0C), LAr (-186\u00B0C), LHe (-269\u00B0C), LH2 (-253\u00B0C)',
'',
'PRODUCT TYPES:',
'1. Static Flexible: Factory-evacuated spool units, no on-site vacuum work needed. 1x10^-4 Torr, 10-year life, max 18.29m/line, Bayonet connection.',
'2. Dyna Flexible: Jump line connection with continuous vacuum pump evacuation. Permanent use. Pump life 10 years, replaceable.',
'3. Rigid Pipe: Hard pipe fixed piping. Increased insulation layers possible for long-distance systems. Standard 15A-50A (65A+ custom). Heat loss 0.31-0.75 W/m. Max pressure 200 Psig.',
'',
'STANDARD SIZES (Inner dia / Outer dia / Heat loss / Max pressure / Weight):',
'- S625: 15.9mm / 45.7mm / 0.96 W/m / 13.8 bar / 1.3 kg/m',
'- S1250: 31.8mm / 66.0mm / 1.9 W/m / 8.6 bar / 2.1 kg/m',
'- SR50: 12.7mm / 60.9mm / 0.31 W/m / 13.78 bar / 6.0 kg/m',
'- SR100: 25.4mm / 73.7mm / 0.45 W/m / 10.3 bar / 6.7 kg/m',
'- SR200: 50.8mm / 114.3mm / 0.75 W/m / 10.3 bar / 10.4 kg/m',
'Material: STS304',
'',
'CONNECTION TYPES: Bayonet (quick clamp + O-ring, factory-evacuated, easy relocation) vs Weld (flexible on-site modification, high-pressure capable, lower cost but longer install time).',
'',
'HL CRYOGENICS PRODUCT PORTFOLIO (being introduced to Korea via KC):',
'- Vacuum Insulated Pipes, Flexible Hoses, Valves (shutoff/pressure/flow/check), Phase Separators, Dynamic Vacuum Pump Systems, Mini Tank Series (1-7.5m3)',
'',
'EXPANSION INDUSTRIES: Air separation plants (ASU), bio-pharma, aerospace (liquid propellant piping), semiconductor/display, LNG plants, hydrogen energy (LH2 piping), food/beverage rapid cooling, automotive.',
'',
'WHY KC VIP: Turnkey solution (design-fabrication-installation-vacuum test-A/S), custom spool fabrication from on-site measurement, ASME/CE/ISO9001 certified, Korea\'s only cryogenic specialist with rapid field response, energy cost savings via minimized evaporation loss.',
'',
'================================================================================',
'SECTION: CAREERS & COMPANY CULTURE (careers.html)',
'================================================================================',
'',
'EMPLOYEES: ~30 (indicated by counter)',
'DEPARTMENTS: Manufacturing/Production (welding, QC, assembly), Design/Engineering (mechanical design, thermal analysis, AutoCAD), Sales/Technical Sales (B2B, technical proposals, customer management), Construction/Field Management (VIP installation, gas facility, PM, safety), Admin Support (finance, HR, general affairs), Quality/Safety (QC/QA, ASME/KGS certification, ISO).',
'BENEFITS: 5-day work week, 4 major insurances, retirement pay (1+ year), education/certification support, seniority-based pay + performance bonus, parking available.',
'CULTURE QUOTE: "Cryogenics is a demanding field. That\'s why we need better people, and that\'s why we stay together longer."',
'',
'\uC751\uB2F5 \uADDC\uCE59:',
'1. \uD55C\uAD6D\uC5B4\uB85C \uB2F5\uBCC0 (\uACE0\uAC1D\uC774 \uC601\uC5B4\uBA74 \uC601\uC5B4\uB85C)',
'2. KC\uC758 \uBAA8\uB4E0 \uC0AC\uC5C5 \uC601\uC5ED\uC5D0 \uB300\uD574 \uB2F5\uBCC0 \uAC00\uB2A5 (\uBC14\uC774\uC624\uBC45\uD0B9, \uADF9\uC800\uC628 \uC7A5\uBE44, \uC561\uCCB4\uD5EC\uB968, \uD2B9\uC218\uAC00\uC2A4, \uC758\uB8CC\uAC00\uC2A4, \uAC00\uC2A4\uC5D4\uC9C0\uB2C8\uC5B4\uB9C1, \uC9C4\uACF5\uBC30\uAD00)',
'3. \uC9C8\uBB38\uC5D0 \uAC00\uC7A5 \uC801\uD569\uD55C 1~2\uAC1C \uC81C\uD488/\uC11C\uBE44\uC2A4\uB97C \uCD94\uCC9C',
'4. \uCD94\uCC9C \uC774\uC720\uB97C \uAC04\uACB0\uD558\uAC8C \uC124\uBA85 (2~3\uBB38\uC7A5)',
'5. \uC751\uB2F5\uC5D0 \uB9C8\uD06C\uB2E4\uC6B4 \uD3EC\uB9F7 \uC0AC\uC6A9 (\uAD75\uAC8C, \uBAA9\uB85D \uB4F1)',
'6. \uBC14\uC774\uC624\uBC45\uD0B9 \uC81C\uD488 \uCD94\uCC9C \uC2DC \uC751\uB2F5 \uB9C8\uC9C0\uB9C9\uC5D0 [PRODUCT:productKey] \uD3EC\uD568',
'   \uAC00\uB2A5\uD55C \uD0A4: ld, xt, hc, ls, labs, revolution, cx, icb-dual, ai-shield, ai-mid, ai-large',
'7. \uBC14\uC774\uC624\uBC45\uD0B9 \uC678 \uC81C\uD488/\uC11C\uBE44\uC2A4\uBA74 [PRODUCT:none]',
'8. \uACFC\uC7A5\uD558\uC9C0 \uB9D0\uACE0, \uC2A4\uD399 \uAE30\uBC18\uC73C\uB85C \uC815\uD655\uD558\uAC8C \uB2F5\uBCC0',
'9. \uCE5C\uADFC\uD558\uC9C0\uB9CC \uC804\uBB38\uC801\uC778 \uD1A4',
'10. \uBAA8\uB4E0 \uC218\uCE58\uB294 \uC6F9\uC0AC\uC774\uD2B8 \uB370\uC774\uD130 \uAE30\uC900\uC73C\uB85C \uC815\uD655\uD558\uAC8C',
'11. \uD68C\uC0AC \uC5F0\uD601, \uD30C\uD2B8\uB108, \uC778\uC99D \uB4F1 \uC77C\uBC18 \uC815\uBCF4\uB3C4 \uC815\uD655\uD558\uAC8C \uB2F5\uBCC0',
'12. KC\uAC00 \uCDE8\uAE09\uD558\uC9C0 \uC54A\uB294 \uC81C\uD488/\uC11C\uBE44\uC2A4\uB97C \uBB3C\uC5B4\uBCF4\uBA74 \uC194\uC9C1\uD558\uAC8C "\uC800\uD76C\uAC00 \uCDE8\uAE09\uD558\uC9C0 \uC54A\uB294 \uBD84\uC57C\uC785\uB2C8\uB2E4"\uB77C\uACE0 \uB2F5\uBCC0\uD558\uACE0, \uD574\uB2F9 \uBD84\uC57C \uC804\uBB38 \uC5C5\uCCB4\uB97C \uCC3E\uC544\uBCF4\uC2DC\uAE38 \uAD8C\uC720. \uC808\uB300 \uBAA8\uB974\uB294 \uAC83\uC744 \uC544\uB294 \uCC99\uD558\uC9C0 \uC54A\uAE30.',
'13. KC\uAC00 \uCDE8\uAE09\uD558\uC9C0 \uC54A\uB294 \uAC83\uB4E4: \uC218\uC18C, \uC804\uAE30\uCC28 \uCDA9\uC804, \uBC18\uB3C4\uCCB4 \uC7A5\uBE44 \uC790\uCCB4, \uC77C\uBC18 \uB0C9\uC7A5/\uB0C9\uB3D9 (\uADF9\uC800\uC628\uC774 \uC544\uB2CC), \uC2DD\uD488 \uB0C9\uB3D9, \uC5D0\uC5B4\uCEE8/HVAC, \uC758\uC57D\uD488 \uC790\uCCB4 \uC81C\uC870, \uC77C\uBC18 \uD654\uD559\uBB3C\uC9C8',
'14. \uAC00\uACA9 \uBB38\uC758 \uC2DC: "\uAC00\uACA9\uC740 \uBAA8\uB378, \uAD6C\uC131, \uC218\uB7C9\uC5D0 \uB530\uB77C \uB2E4\uB974\uBBC0\uB85C \uC804\uBB38\uAC00 \uC0C1\uB2F4\uC744 \uCD94\uCC9C\uB4DC\uB9BD\uB2C8\uB2E4. 031-737-8171 \uB610\uB294 info@koreacryo.com\uC73C\uB85C \uBB38\uC758\uD574\uC8FC\uC138\uC694."',
'15. \uACBD\uC7C1\uC0AC \uBE44\uAD50 \uC9C8\uBB38: \uD2B9\uC815 \uACBD\uC7C1\uC0AC\uB97C \uBE44\uD558\uD558\uC9C0 \uB9D0\uACE0, KC/IC Biomedical\uC758 \uAC15\uC810\uB9CC \uAC1D\uAD00\uC801\uC73C\uB85C \uC124\uBA85'
].join('\n');

async function callGemini(userText){
  if(!GEMINI_KEY){
    var k = prompt('Gemini API Key\uB97C \uC785\uB825\uD558\uC138\uC694 (\uCD5C\uCD08 1\uD68C):');
    if(k && k.trim()){
      GEMINI_KEY = k.trim();
      localStorage.setItem('kc-gemini-key', GEMINI_KEY);
    } else {
      throw new Error('API key required');
    }
  }

  chatHistory.push({role:'user', parts:[{text: userText}]});

  var body = {
    system_instruction: {parts:[{text: systemPrompt}]},
    contents: chatHistory,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
      thinkingConfig: {thinkingBudget: 0}
    }
  };

  var res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_KEY, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });

  var data = await res.json();
  var aiText = '';

  if(data.candidates && data.candidates[0] && data.candidates[0].content){
    var parts = data.candidates[0].content.parts;
    aiText = parts[parts.length - 1].text;
  } else {
    throw new Error('No response');
  }

  chatHistory.push({role:'model', parts:[{text: aiText}]});

  var productKey = null;
  var match = aiText.match(/\[PRODUCT:([a-z\-]+)\]/);
  if(match && match[1] !== 'none'){
    productKey = match[1];
  }

  var displayText = aiText.replace(/\[PRODUCT:[a-z\-]+\]/g, '').trim();
  return {message: displayText, productKey: productKey};
}

/* ========================================================================
   SEND HANDLER
   ======================================================================== */
function sendMessage(text){
  addUserMessage(text);
  showTyping();
  chatInput.value = '';

  callGemini(text).then(function(response){
    hideTyping();
    addBotMessage(response.message);
    if(response.productKey && kcProducts[response.productKey]){
      setTimeout(function(){ addProductCard(response.productKey); }, 300);
    }
  }).catch(function(){
    hideTyping();
    addBotMessage('\uC8C4\uC1A1\uD569\uB2C8\uB2E4, \uC77C\uC2DC\uC801\uC778 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.\n031-737-8171', true);
  });
}

function handleSend(){
  var text = chatInput.value.trim();
  if(!text || text.length < 2) return;
  sendMessage(text);
}

/* ========================================================================
   QUOTE REQUEST (견적 요청)
   ======================================================================== */
function showQuoteForm(productKey){
  var product = kcProducts[productKey];
  if(!product) return;

  addBotMessage('**' + product.name + '** 견적을 요청해주세요! 아래 정보를 입력하시면 담당자가 빠르게 연락드리겠습니다.');

  var formWrap = document.createElement('div');
  formWrap.style.cssText = 'margin:8px 0 16px 42px;max-width:320px;padding:20px;border-radius:16px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);';

  var fields = [
    {id:'kc-q-name', label:'\uC131\uD568', placeholder:'\uD64D\uAE38\uB3D9', type:'text'},
    {id:'kc-q-phone', label:'\uC5F0\uB77D\uCC98', placeholder:'010-0000-0000', type:'tel'},
    {id:'kc-q-email', label:'\uC774\uBA54\uC77C', placeholder:'name@company.com', type:'email'},
    {id:'kc-q-org', label:'\uC18C\uC18D \uAE30\uAD00', placeholder:'OO\uBCD1\uC6D0 / \uC5F0\uAD6C\uC18C', type:'text'},
    {id:'kc-q-note', label:'\uC694\uCCAD \uC0AC\uD56D', placeholder:'\uC218\uB7C9, \uBAA8\uB378, \uB0A9\uAE30 \uB4F1', type:'text'}
  ];

  fields.forEach(function(f){
    var label = document.createElement('div');
    label.textContent = f.label;
    label.style.cssText = 'font-size:11px;color:rgba(16,185,129,0.7);margin-bottom:4px;margin-top:10px;font-weight:600;';
    var input = document.createElement('input');
    input.type = f.type;
    input.id = f.id;
    input.placeholder = f.placeholder;
    input.style.cssText = 'width:100%;padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#e2e8f0;font-size:13px;outline:none;font-family:inherit;box-sizing:border-box;';
    input.addEventListener('focus', function(){ this.style.borderColor='rgba(16,185,129,0.3)'; });
    input.addEventListener('blur', function(){ this.style.borderColor='rgba(255,255,255,0.08)'; });
    formWrap.appendChild(label);
    formWrap.appendChild(input);
  });

  var hiddenProduct = document.createElement('input');
  hiddenProduct.type = 'hidden';
  hiddenProduct.id = 'kc-q-product';
  hiddenProduct.value = product.name;
  formWrap.appendChild(hiddenProduct);

  var submitBtn = document.createElement('button');
  submitBtn.textContent = '\uACAC\uC801 \uC694\uCCAD \uBCF4\uB0B4\uAE30';
  submitBtn.style.cssText = 'width:100%;margin-top:16px;padding:10px;border-radius:12px;border:none;background:linear-gradient(135deg,#10b981,#059669);color:white;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.25s;font-family:inherit;';
  submitBtn.addEventListener('mouseover', function(){ this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(16,185,129,0.3)'; });
  submitBtn.addEventListener('mouseout', function(){ this.style.transform=''; this.style.boxShadow=''; });
  (function(k){ submitBtn.addEventListener('click', function(){ submitQuote(k); }); })(productKey);
  formWrap.appendChild(submitBtn);

  chatMessages.appendChild(formWrap);
  scrollBottom();
}

function submitQuote(productKey){
  var product = kcProducts[productKey];
  var name = document.getElementById('kc-q-name').value.trim();
  var phone = document.getElementById('kc-q-phone').value.trim();
  var email = document.getElementById('kc-q-email').value.trim();
  var org = document.getElementById('kc-q-org').value.trim();
  var note = document.getElementById('kc-q-note').value.trim();

  if(!name || (!phone && !email)){
    alert('\uC131\uD568\uACFC \uC5F0\uB77D\uCC98(\uC804\uD654 \uB610\uB294 \uC774\uBA54\uC77C)\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.');
    return;
  }

  if(typeof emailjs === 'undefined'){
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    s.onload = function(){
      try { emailjs.init('sQsYCTrE1oUQdNLYN'); } catch(e){}
      sendQuoteEmail(product.name, name, phone, email, org, note);
    };
    document.head.appendChild(s);
  } else {
    sendQuoteEmail(product.name, name, phone, email, org, note);
  }
}

function sendQuoteEmail(productName, name, phone, email, org, note){
  var params = {
    from_name: name,
    reply_to: email || 'noreply@koreacryo.com',
    subject: '[AI\uCC57\uBD07 \uACAC\uC801\uC694\uCCAD] ' + productName + ' - ' + name,
    message: '\uC81C\uD488: ' + productName + '\n\uC131\uD568: ' + name + '\n\uC5F0\uB77D\uCC98: ' + phone + '\n\uC774\uBA54\uC77C: ' + email + '\n\uC18C\uC18D: ' + org + '\n\uC694\uCCAD\uC0AC\uD56D: ' + note
  };

  emailjs.send('service_v89smv9', 'template_xweueym', params)
    .then(function(){
      addBotMessage('\u2705 **\uACAC\uC801 \uC694\uCCAD\uC774 \uC804\uC1A1\uB418\uC5C8\uC2B5\uB2C8\uB2E4!**\n\n' + name + '\uB2D8, \uB2F4\uB2F9\uC790\uAC00 \uD655\uC778 \uD6C4 \uBE60\uB974\uAC8C \uC5F0\uB77D\uB4DC\uB9AC\uACA0\uC2B5\uB2C8\uB2E4.\n\n\uD83D\uDCDE \uAE09\uD55C \uBB38\uC758: 031-737-8171');
    }, function(){
      addBotMessage('\u26A0\uFE0F \uC804\uC1A1\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uC9C1\uC811 \uC5F0\uB77D \uBD80\uD0C1\uB4DC\uB9BD\uB2C8\uB2E4.\n\uD83D\uDCDE 031-737-8171\n\uD83D\uDCE7 info@koreacryo.com');
    });
}

/* ========================================================================
   INIT
   ======================================================================== */
function init(){
  injectStyles();
  buildDOM();
  loadMarked();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
