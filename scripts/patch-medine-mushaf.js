#!/usr/bin/env node
/**
 * Medine 604×15 mushaf + PR #2 ok takibi.
 *
 * - Sabit 15 satır grid (pageHeight/15)
 * - Sure serlevhası (compact, satır yuvasında)
 * - Yatay kaydırarak sayfa geçişi
 * - Açılışta doğrudan hedef sayfa (tarama/scroll yok)
 * - Aktif ayet #97FF0A (Ezan Vakti #8097FF0A overlay)
 * - Ok HARF altında: QUL/quran.com kelime zamanı + tecvid ağırlıklı harf
 * - Kelime başında gerçek ms ile yeniden senkron (hata birikmez)
 * - Kelime timing yoksa ok ayet başına sabit + listede işaret
 * - Sayfa bitince otomatik sonraki sayfa + çalmaya devam
 * - Kutu kelime vurgusu yok
 * - Varsayılan hafız: Mişari (Alafasy / everyayah)
 * - Telifli Ezan Vakti PNG/ses kopyalanmaz
 */
const fs = require("fs");
const path = require("path");

const ENTRY_SRC = path.resolve(
  __dirname,
  "..",
  "dist/_expo/static/js/web/entry-a0324b1a9e2452bea2896449b9d2b456.js"
);
const ENTRY_OUT = path.resolve(
  __dirname,
  "..",
  "dist/_expo/static/js/web/entry-medine604-a0324b1a9e2452bea2896449b9d2b456.js"
);
const INDEX = path.resolve(__dirname, "..", "dist/index.html");
const SW = path.resolve(__dirname, "..", "dist/sw.js");

let src = fs.readFileSync(ENTRY_SRC, "utf8");
let n = 0;

function replaceOnce(label, from, to) {
  const i = src.indexOf(from);
  if (i < 0) {
    console.error("MISSING:", label);
    console.error("needle:", from.slice(0, 180));
    process.exit(1);
  }
  if (src.indexOf(from, i + 1) >= 0) {
    console.error("AMBIGUOUS:", label);
    process.exit(1);
  }
  src = src.slice(0, i) + to + src.slice(i + from.length);
  n += 1;
  console.log("ok:", label);
}

// ---------------------------------------------------------------------------
// PR #2 — ok takibi (metin sabit, timeupdate/ended, üçgen satırda)
// ---------------------------------------------------------------------------
replaceOnce(
  "no auto-scroll while tracking",
  "(0,a.useEffect)(()=>{pt&&(zt&&!He||(Ga||'listening'===Ja)&&kr())},[St,kr,He,pt,Ga,Ja,zt])",
  "(0,a.useEffect)(()=>{pt&&!zt&&(Ga||'listening'===Ja)&&kr()},[St,kr,He,pt,Ga,Ja,zt])"
);
replaceOnce(
  "drop xr(n) during ayah jump",
  "(t||n!==Zn.current)&&(Zn.current=n,xr(n))",
  "(t||n!==Zn.current)&&(Zn.current=n)"
);
replaceOnce(
  "guard span before jump",
  "s=n.spans[o];l(s.ayahIndex,s.wordIndex,!1)",
  "s=n.spans[o];s&&l(s.ayahIndex,s.wordIndex,!1)"
);
replaceOnce(
  "scrollEnabled without zt",
  "scrollEnabled:Ga||He||zt,",
  "scrollEnabled:Ga||He,"
);
replaceOnce(
  "fillHeight keep page while tracking",
  "fillHeight:He||zt?void 0:",
  "fillHeight:He?void 0:"
);
replaceOnce(
  "drop crossOrigin on Audio",
  "u.preload='auto',u.crossOrigin='anonymous',u.src=t,",
  "u.preload='auto',u.src=t,"
);
replaceOnce(
  "tighter progress + ended threshold + currentTime",
  "(a-f>=.012||a>=.99||f<0)&&(f=a,o?.(a))},b=()=>{if(s||r||n!==i)return void h('aborted');if(A)return;const t=Number.isFinite(u.duration)&&u.duration>0?u.duration:0,a=Number.isFinite(u.currentTime)?u.currentTime:0;(!u.paused&&!u.ended||a>0)&&(y=!0),t>0?p(a/t):y&&p(Math.min(.92,(Date.now()-w)/45e3)),u.ended&&(p(1),h('ok'))},M=setInterval(()=>{s||(r||n!==i?h('aborted'):Date.now()-w>12e4?h('failed'):A||(b(),!y&&Date.now()-w>12e3&&h('failed')))},120);",
  "(a-f>=.006||a>=.99||f<0)&&(f=a,o?.(a,u.currentTime))},b=()=>{if(s||r||n!==i)return void h('aborted');const t=Number.isFinite(u.duration)&&u.duration>0?u.duration:0,a=Number.isFinite(u.currentTime)?u.currentTime:0;(!u.paused&&!u.ended||a>0)&&(y=!0);if(u.ended||t>0&&a>=Math.max(0,t-.08))return p(1,a),void h('ok');if(A)return;t>0?p(a/t,a):y&&p(Math.min(.92,(Date.now()-w)/45e3),a)},M=setInterval(()=>{s||(r||n!==i?h('aborted'):Date.now()-w>12e4?h('failed'):A||(b(),!y&&Date.now()-w>2e4&&h('failed')))},120);"
);
replaceOnce(
  "progress callback passes currentTime",
  "a=>{!w&&a>0&&(w=!0),t.onAyahProgress?.(f,a)}",
  "(a,q)=>{!w&&a>0&&(w=!0),t.onAyahProgress?.(f,a,q)}"
);

// ---------------------------------------------------------------------------
// 15 satır sabit grid
// ---------------------------------------------------------------------------
replaceOnce("force 15-line height math", "rr=Math.max(pt.lines.length,1)", "rr=15");
replaceOnce(
  "always render 15 line slots",
  "children:t.lines.map((i,s)=>{",
  "children:Array.from({length:15},(i,s)=>{"
);
replaceOnce(
  "fixed line wrapper height",
  "style:null!=H?{flexGrow:1,justifyContent:'center'}:void 0",
  "style:{height:d,minHeight:d,maxHeight:d,justifyContent:'center',overflow:'hidden',position:'relative'}"
);
replaceOnce(
  "compact serlevha in line slot",
  "C?(0,f.jsx)(z,{name:C.name,surahNumber:C.surah,compact:N,fontFamily:b,letterSpacing:p}):null",
  "C?(0,f.jsx)(z,{name:C.name,surahNumber:C.surah,compact:!0,fontFamily:b,letterSpacing:p}):null"
);

// ---------------------------------------------------------------------------
// Satır + ok (sol üçgen, offset), kutu yok
// ---------------------------------------------------------------------------
replaceOnce(
  "lineRow jsxs + left offset triangle",
  "(0,f.jsx)(o.default,{style:[P.lineRow,null==H&&{minHeight:d},null!=H&&{flexGrow:1,justifyContent:'center'},E&&{backgroundColor:O},y&&P.bismillahRow,F&&!E&&{backgroundColor:`${R}14`,borderLeftWidth:2,borderLeftColor:R}],children:j?.length?(0,f.jsx)(n.default,{style:[P.lineFlow,{fontSize:l,lineHeight:Math.round(.95*d),fontFamily:b},(y||j.length<=5&&t.lines.length<=10)&&P.lineFlowCentered],children:I(j,a,t,l,u,b,p,w,A,T,B,L,V,G)}):(0,f.jsx)(o.default,{style:[P.lineContent,y&&P.bismillahContent],children:(0,f.jsx)(n.default,{style:[P.lineText,P.fallbackText,{fontSize:l,lineHeight:Math.round(.92*d),fontFamily:b,letterSpacing:p},y&&P.bismillahText,A&&P.hiddenText],children:A?'\\xb7 \\xb7 \\xb7 \\xb7 \\xb7':S?.join(' ')??''})})}),c&&!V?(0,f.jsx)(o.default,{style:P.trackArrowRow,pointerEvents:\"none\",children:(0,f.jsx)(n.default,{style:[P.trackArrowBelow,{color:D}],children:x})}):null]",
  "(0,f.jsxs)(o.default,{style:[P.lineRow,{height:d,minHeight:d,maxHeight:d,justifyContent:'center'},E&&{backgroundColor:O},y&&P.bismillahRow,F&&!E&&{backgroundColor:`${R}14`,borderLeftWidth:2,borderLeftColor:R}],children:[j?.length?(0,f.jsx)(n.default,{style:[P.lineFlow,{fontSize:l,lineHeight:Math.round(.92*d),fontFamily:b},(y||(j.length<=5))&&P.lineFlowCentered],children:I(j,a,t,l,u,b,p,w,A,T,B,L,V,G)}):(0,f.jsx)(o.default,{style:[P.lineContent,y&&P.bismillahContent],children:(0,f.jsx)(n.default,{style:[P.lineText,P.fallbackText,{fontSize:l,lineHeight:Math.round(.92*d),fontFamily:b,letterSpacing:p},y&&P.bismillahText,A&&P.hiddenText],children:A?'\\xb7 \\xb7 \\xb7 \\xb7 \\xb7':S?.join(' ')??''})}),!window.hyQuranTiming&&c&&!V?(0,f.jsx)(o.default,{style:[P.trackArrowRow,{left:j&&j.length?`${Math.round(100*(1-(.5+Math.max(0,j.findIndex(x=>x.ayahIndex===a.ayahIndex&&x.wordIndex===a.wordIndex)))/j.length))}%`:'2%'}],pointerEvents:\"none\",children:(0,f.jsx)(n.default,{style:[P.trackArrowBelow,{color:D}],children:x})}):null]})]"
);
replaceOnce(
  "lineRow relative overflow",
  "lineRow:{justifyContent:'center',paddingVertical:3,width:'100%',borderRadius:2},",
  "lineRow:{justifyContent:'center',paddingVertical:0,width:'100%',borderRadius:2,position:'relative',overflow:'visible'},"
);
replaceOnce(
  "trackArrowRow left overlay",
  "trackArrowRow:{alignItems:'center',justifyContent:'center',height:14,marginTop:-2,marginBottom:2},",
  "trackArrowRow:{position:'absolute',top:'50%',marginTop:-11,width:22,height:22,alignItems:'center',justifyContent:'center',zIndex:6,pointerEvents:'none'},"
);
replaceOnce(
  "trackArrowBelow larger left triangle",
  "trackArrowBelow:{color:C,fontSize:14,fontWeight:'900',lineHeight:14,textAlign:'center',includeFontPadding:!1},",
  "trackArrowBelow:{color:C,fontSize:22,fontWeight:'900',lineHeight:22,textAlign:'center',includeFontPadding:!1,textShadowColor:'#0a2a12',textShadowOffset:{width:0,height:0},textShadowRadius:3},"
);

// ---------------------------------------------------------------------------
// Ezan Vakti #97FF0A alphas
// ---------------------------------------------------------------------------
replaceOnce(
  "track accent EV green",
  "ayahBg:'rgba(165, 214, 167, 0.62)',arrow:'#2e7d32'",
  "ayahBg:'#8097FF0A',arrow:'#97FF0A'"
);
replaceOnce(
  "pageview default highlight",
  "y='rgba(165, 214, 167, 0.62)',C='#2e7d32'",
  "y='#8097FF0A',C='#97FF0A'"
);
// Ok glifi ▲ olarak kalır; konum hyQuranTiming overlay ile harfin altında.

// ---------------------------------------------------------------------------
// No word-box highlight
// ---------------------------------------------------------------------------
replaceOnce(
  "no word box background",
  "S||(v>.45?N=p(v):D&&(N='rgba(198, 40, 40, 0.06)'))",
  "S||(N='transparent')"
);

// ---------------------------------------------------------------------------
// Açılışta doğrudan hedef sayfa (tarama scroll yok)
// ---------------------------------------------------------------------------
replaceOnce(
  "no scan scroll on layout",
  "onLayout:e=>{xt.current=e.nativeEvent.layout.height,Ga?xr(Lt.startLine):kr()}",
  "onLayout:e=>{xt.current=e.nativeEvent.layout.height,Ga&&xr(Lt.startLine)}"
);

// ---------------------------------------------------------------------------
// Sayfa bitince otomatik sonraki sayfa + çal
// ---------------------------------------------------------------------------
replaceOnce(
  "auto-next ref",
  "tr=(0,a.useRef)(null),nr=(0,a.useRef)(null)",
  "tr=(0,a.useRef)(null),nr=(0,a.useRef)(null),hyN=(0,a.useRef)(!1)"
);
replaceOnce(
  "onPageDone after recitation loop",
  "}while(t.loop&&!r&&a===i)},e.resumeRecitation",
  "}while(t.loop&&!r&&a===i);!r&&a===i&&t.onPageDone?.()},e.resumeRecitation"
);
replaceOnce(
  "wire onPageDone + deps",
  "onAyahFailed:a=>{e===On.current&&vt(`Ses kesildi \\xb7 ${a.surah}:${a.ayah}`)}});else{const t=async(a,t)=>{",
  "onAyahFailed:a=>{e===On.current&&vt(`Ses kesildi \\xb7 ${a.surah}:${a.ayah}`)},onPageDone:()=>{if(e!==On.current||o||Na>=603)return;hyN.current=!0,Fa(Na+1)}});else{const t=async(a,t)=>{"
);
replaceOnce(
  "auto-play after page turn deps",
  "},[pt,ot.loop,ot.reciterId,ot.speed,br,xr,Ja,kt]),uo=(0,a.useCallback)(()=>{",
  "},[pt,ot.loop,ot.reciterId,ot.speed,br,xr,Ja,kt,Na]),uo=(0,a.useCallback)(()=>{"
);
replaceOnce(
  "auto-play effect after const chain",
  "po=Na>0,yo=Na<u.MUSHAF_PAGE_COUNT-1;if(!Ve||Za||!Oa)",
  "po=Na>0,yo=Na<u.MUSHAF_PAGE_COUNT-1;(0,a.useEffect)(()=>{if(!hyN.current||!pt||Za)return;const e=setTimeout(()=>{hyN.current=!1,co()},200);return()=>clearTimeout(e)},[pt,Za,Na,co]);if(!Ve||Za||!Oa)"
);

// ---------------------------------------------------------------------------
// Yatay kaydırma (pageStack)
// ---------------------------------------------------------------------------
replaceOnce(
  "horizontal swipe on pageStack",
  "style:Re.pageStack,",
  "style:Re.pageStack,onTouchStart:e=>{hyN._sx=e.nativeEvent.pageX},onTouchEnd:e=>{const t=hyN._sx;if(null==t)return;const n=e.nativeEvent.pageX-t;hyN._sx=null;n>72&&po&&no(Na-1);n<-72&&yo&&no(Na+1)},"
);

// ---------------------------------------------------------------------------
// Kâriler: quran.com id + kelime timing + Sudais klasör düzeltmesi
// ---------------------------------------------------------------------------
replaceOnce(
  "reciter list + timing flags",
  "const a=e.QURAN_RECITERS=[{id:'alafasy',nameTr:'Mi\\u015fari',folder:'Alafasy_128kbps',styleTr:'Murattal \\u2014 varsay\\u0131lan'},{id:'abdulbasit',nameTr:'Abd\\xfclbasit',folder:'Abdul_Basit_Mujawwad_128kbps',styleTr:'Mujawwad (makaml\\u0131)'},{id:'minshawi',nameTr:'Min\\u015fevi',folder:'Minshawy_Mujawwad_64kbps',styleTr:'Mujawwad (makaml\\u0131)'},{id:'abdulbasit-murattal',nameTr:'Abd\\xfclbasit',folder:'Abdul_Basit_Murattal_192kbps',styleTr:'Murattal (talim)'},{id:'husary',nameTr:'Husary',folder:'Husary_128kbps',styleTr:'Murattal'},{id:'sudais',nameTr:'Sudais',folder:'Sudais_128kbps',styleTr:'Murattal'},{id:'hoca-tts',nameTr:'Hoca (TTS)',folder:null,styleTr:'Sentez ses \\u2014 yedek'}];",
  "const a=e.QURAN_RECITERS=[{id:'alafasy',nameTr:'Mi\\u015fari',folder:'Alafasy_128kbps',styleTr:'Murattal \\u2014 varsay\\u0131lan',quranId:7,wordTiming:!0},{id:'abdulbasit',nameTr:'Abd\\xfclbasit',folder:'Abdul_Basit_Mujawwad_128kbps',styleTr:'Mujawwad (makaml\\u0131)',quranId:1,wordTiming:!0},{id:'minshawi',nameTr:'Min\\u015fevi',folder:'Minshawy_Mujawwad_64kbps',styleTr:'Mujawwad (makaml\\u0131)',quranId:8,wordTiming:!0},{id:'abdulbasit-murattal',nameTr:'Abd\\xfclbasit',folder:'Abdul_Basit_Murattal_192kbps',styleTr:'Murattal (talim)',quranId:2,wordTiming:!0},{id:'husary',nameTr:'Husary',folder:'Husary_128kbps',styleTr:'Murattal',quranId:6,wordTiming:!0},{id:'sudais',nameTr:'Sudais',folder:'Abdurrahmaan_As-Sudais_192kbps',styleTr:'Murattal',quranId:3,wordTiming:!0},{id:'hoca-tts',nameTr:'Hoca (TTS)',folder:null,styleTr:'Sentez ses \\u2014 kelime timing yok',quranId:null,wordTiming:!1}];"
);
replaceOnce(
  "picker marks missing word timing",
  "s.QURAN_RECITERS.map(h=>{const y=h.id===t,x=h.id===s.DEFAULT_QURAN_RECITER_ID;return(0,f.jsx)(o.default,{style:[u.row,y&&u.rowActive],onPress:()=>n(h.id),children:(0,f.jsxs)(c.default,{style:u.rowText,children:[(0,f.jsxs)(l.default,{style:[u.name,y&&u.nameActive],children:[h.nameTr,x?' \\xb7 Varsay\\u0131lan':'',y?' \\u2713':'']}),(0,f.jsx)(l.default,{style:u.style,children:h.styleTr})]})},h.id)})",
  "s.QURAN_RECITERS.map(h=>{const y=h.id===t,x=h.id===s.DEFAULT_QURAN_RECITER_ID;return(0,f.jsx)(o.default,{style:[u.row,y&&u.rowActive],onPress:()=>n(h.id),children:(0,f.jsxs)(c.default,{style:u.rowText,children:[(0,f.jsxs)(l.default,{style:[u.name,y&&u.nameActive],children:[h.nameTr,x?' \\xb7 Varsay\\u0131lan':'',h.wordTiming?'':' \\xb7 ok: ayet ba\\u015f\\u0131',y?' \\u2713':'']}),(0,f.jsx)(l.default,{style:u.style,children:h.wordTiming?h.styleTr:h.styleTr+' \\xb7 kelime timing yok'})]})},h.id)})"
);

// ---------------------------------------------------------------------------
// Harf glifleri + kelime zamanına göre ok (oransal ilerleme yok)
// ---------------------------------------------------------------------------
replaceOnce(
  "split word into letter glyphs",
  "F.push((0,f.jsxs)(n.default,{style:[P.word,{fontSize:d,fontFamily:h,letterSpacing:x,color:$,fontWeight:'400',backgroundColor:N}],children:[A.text,G?'':' ']},`w-${T}-${B}`))",
  "F.push((0,f.jsxs)(n.default,{style:[P.word,{fontSize:d,fontFamily:h,letterSpacing:x,color:$,fontWeight:'400',backgroundColor:N}],children:[(window.hyQuranTiming?window.hyQuranTiming.glyphs(A.text):[{i:0,ch:A.text}]).map(z=>(0,f.jsx)(n.default,{nativeID:`hy-l-${T}-${B}-${z.i}`,style:{fontFamily:h,fontSize:d},children:z.ch},`l-${T}-${B}-${z.i}`)),G?'':' ']},`w-${T}-${B}`))"
);
replaceOnce(
  "enrich spans + prefetch + pin/jump by word timing",
  "const t=(0,Se.collectAyahWordSpans)(pt,a.surah,a.ayah),n=t.length>0?t:[{ayahIndex:a.ayahIndex,wordIndex:0}];Un.current={spans:n,surah:a.surah,ayah:a.ayah};const r=n[0];vt(`${a.surahName} ${a.surah}:${a.ayah}`),l(r.ayahIndex,r.wordIndex,!0)",
  "const t=(0,Se.collectAyahWordSpans)(pt,a.surah,a.ayah).map(s=>{const w=pt.ayahs[s.ayahIndex];return Object.assign({},s,{text:w&&w.words[s.wordIndex]&&w.words[s.wordIndex].text||''})}),n=t.length>0?t:[{ayahIndex:a.ayahIndex,wordIndex:0,text:''}];Un.current={spans:n,surah:a.surah,ayah:a.ayah};window.hyQuranTiming&&window.hyQuranTiming.prefetchSurah(ot.reciterId,a.surah);const r=n[0];vt(`${a.surahName} ${a.surah}:${a.ayah}`),l(r.ayahIndex,r.wordIndex,!0),window.hyQuranTiming&&window.hyQuranTiming.setActive({ayahIndex:r.ayahIndex,wordIndex:r.wordIndex,letterIndex:0})"
);
replaceOnce(
  "onAyahProgress uses real word+letter timing",
  "onAyahProgress:(a,t)=>{if(e!==On.current)return;const n=Un.current;if(!n||n.surah!==a.surah||n.ayah!==a.ayah)return;const r=n.spans.length,o=Math.min(r-1,Math.max(0,Math.floor(t*r))),s=n.spans[o];s&&l(s.ayahIndex,s.wordIndex,!1)}",
  "onAyahProgress:(a,t,q)=>{if(e!==On.current)return;const n=Un.current;if(!n||n.surah!==a.surah||n.ayah!==a.ayah)return;const hy=window.hyQuranTiming;if(!hy||!hy.hasWordTiming(ot.reciterId))return void hy?.setActive({ayahIndex:n.spans[0].ayahIndex,wordIndex:n.spans[0].wordIndex,letterIndex:0});const hit=hy.atTime(ot.reciterId,a.surah,a.ayah,q,n.spans);if(!hit)return;l(hit.ayahIndex,hit.wordIndex,!1);hy.setActive(hit)}"
);

fs.writeFileSync(ENTRY_OUT, src);
console.log("wrote", ENTRY_OUT, n, "replacements");

// Cache bust
let html = fs.readFileSync(INDEX, "utf8");
html = html
  .replace(/content="2026-09-13-amentu-v2"/g, 'content="2026-10-19-fatiha1"')
  .replace(/content="2026-10-19-medine604"/g, 'content="2026-10-19-fatiha1"')
  .replace(/bust: amentu2/, "bust: fatiha1")
  .replace(/bust: medine604/, "bust: fatiha1")
  .replace(/entry-a0324b1a9e2452bea2896449b9d2b456\.js\?v=amentu2/g, "entry-medine604-a0324b1a9e2452bea2896449b9d2b456.js?v=fatiha1")
  .replace(/entry-medine604-a0324b1a9e2452bea2896449b9d2b456\.js\?v=medine604/g, "entry-medine604-a0324b1a9e2452bea2896449b9d2b456.js?v=fatiha1")
  .replace(/quran-timing\.js\?v=medine604/g, "quran-timing.js?v=fatiha1")
  .replace(/var bust = 'amentu2';/, "var bust = 'fatiha1';")
  .replace(/var bust = 'medine604';/, "var bust = 'fatiha1';");
if (!html.includes("fatiha1")) {
  console.error("index.html bust failed");
  process.exit(1);
}
// swipe helper for mouse + touch (aria-label edge hits)
if (!html.includes("quran-timing.js")) {
  html = html.replace(
    '<script src="/_expo/static/js/web/entry-medine604-a0324b1a9e2452bea2896449b9d2b456.js?v=fatiha1" defer></script>',
    '<script src="/assets/timing/quran-timing.js?v=fatiha1"></script>\n  <script src="/_expo/static/js/web/entry-medine604-a0324b1a9e2452bea2896449b9d2b456.js?v=fatiha1" defer></script>'
  );
}
if (!html.includes("hyMedineSwipe")) {
  html = html.replace(
    "</body>",
    `<script>
(function(){
  var x0=null;
  function onKuran(){return /kuran/i.test(location.pathname+location.hash+location.search)||!!document.querySelector('[aria-label="Sonraki sayfa"]')}
  function go(dx){
    if(Math.abs(dx)<72||!onKuran())return;
    var sel=dx<0?'[aria-label="Sonraki sayfa"]':'[aria-label="Önceki sayfa"]';
    var el=document.querySelector(sel);
    el&&el.click();
  }
  window.hyMedineSwipe=1;
  document.addEventListener('touchstart',function(e){x0=e.changedTouches[0].clientX},{passive:true});
  document.addEventListener('touchend',function(e){if(x0==null)return;var dx=e.changedTouches[0].clientX-x0;x0=null;go(dx)},{passive:true});
  document.addEventListener('pointerdown',function(e){if(e.pointerType==='mouse'&&e.button===0)x0=e.clientX},{passive:true});
  document.addEventListener('pointerup',function(e){if(x0==null)return;var dx=e.clientX-x0;x0=null;if(e.pointerType==='mouse')go(dx)},{passive:true});
})();
</script>
</body>`
  );
}
fs.writeFileSync(INDEX, html);
console.log("patched index.html");

if (fs.existsSync(SW)) {
  let sw = fs.readFileSync(SW, "utf8");
  sw = sw.replace(/const BUILD = '[^']+';/, "const BUILD = 'fatiha1';");
  if (!sw.includes("medine-mushaf-2026-10-19")) {
    sw = "/* medine-mushaf-2026-10-19 */\n" + sw;
  }
  fs.writeFileSync(SW, sw);
  console.log("patched sw.js");
}

console.log("done");
