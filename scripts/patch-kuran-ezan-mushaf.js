#!/usr/bin/env node
/**
 * Make Kur'an/mushaf reading match Ezan Vakti (PrayerTimes) chrome:
 * dark green atmosphere, soft orbs, dark overlay bars, white page card.
 * Also: default edition → ezan-vakti layout, full 604-page mushaf intact,
 * and ok-takibi tracking triangle + audio sync fixes from PR #3.
 */
const fs = require("fs");
const path = require("path");

const ENTRY = path.resolve(
  __dirname,
  "..",
  "dist/_expo/static/js/web/entry-a0324b1a9e2452bea2896449b9d2b456.js"
);
const INDEX = path.resolve(__dirname, "..", "dist/index.html");
const SW = path.resolve(__dirname, "..", "dist/sw.js");

let src = fs.readFileSync(ENTRY, "utf8");
let n = 0;

function replaceOnce(label, from, to) {
  const i = src.indexOf(from);
  if (i < 0) {
    console.error("MISSING:", label);
    console.error("needle:", from.slice(0, 160));
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

function replaceAll(label, from, to, expected) {
  const count = src.split(from).length - 1;
  if (count !== expected) {
    console.error(`COUNT ${label}: got ${count}, expected ${expected}`);
    process.exit(1);
  }
  src = src.split(from).join(to);
  n += count;
  console.log("ok:", label, `(×${count})`);
}

// --- 1) Default Medine Hafs → ezan-vakti layout (sade sayfa = Ezan Vakti mushaf)
replaceOnce(
  "default edition layoutMode",
  "id:'medine-hafs-sade',nameTr:'Medine Mushaf\\u0131 (Hafs)',descriptionTr:'Ezan Vakti mushaf sayfas\\u0131 \\u2014 krem zemin, \\xe7er\\xe7eve, oklu takip',riwayetTr:'Hafs \\xb7 Medine 604 sayfa',fontId:'uthmanic-hafs',layoutMode:'mushaf',popularityTr:1,isDefault:!0",
  "id:'medine-hafs-sade',nameTr:'Medine Mushaf\\u0131 (Hafs)',descriptionTr:'Ezan Vakti mushaf sayfas\\u0131 \\u2014 ye\\u015fil atmosfer, sade tam sayfa, oklu takip',riwayetTr:'Hafs \\xb7 Medine 604 sayfa',fontId:'uthmanic-hafs',layoutMode:'ezan-vakti',popularityTr:1,isDefault:!0"
);

// --- 2) ok-takibi: keep page fixed while tracking / listening
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
replaceAll(
  "fillHeight keep page while tracking",
  "fillHeight:He||zt?void 0:",
  "fillHeight:He?void 0:",
  1
);

// --- 3) ok-takibi: green ▲ inside active ayah line
replaceOnce(
  "lineRow jsxs + inline triangle",
  "(0,f.jsx)(o.default,{style:[P.lineRow,null==H&&{minHeight:d},null!=H&&{flexGrow:1,justifyContent:'center'},E&&{backgroundColor:O},y&&P.bismillahRow,F&&!E&&{backgroundColor:`${R}14`,borderLeftWidth:2,borderLeftColor:R}],children:j?.length?(0,f.jsx)(n.default,{style:[P.lineFlow,{fontSize:l,lineHeight:Math.round(.95*d),fontFamily:b},(y||j.length<=5&&t.lines.length<=10)&&P.lineFlowCentered],children:I(j,a,t,l,u,b,p,w,A,T,B,L,V,G)}):(0,f.jsx)(o.default,{style:[P.lineContent,y&&P.bismillahContent],children:(0,f.jsx)(n.default,{style:[P.lineText,P.fallbackText,{fontSize:l,lineHeight:Math.round(.92*d),fontFamily:b,letterSpacing:p},y&&P.bismillahText,A&&P.hiddenText],children:A?'\\xb7 \\xb7 \\xb7 \\xb7 \\xb7':S?.join(' ')??''})})}),c&&!V?(0,f.jsx)(o.default,{style:P.trackArrowRow,pointerEvents:\"none\",children:(0,f.jsx)(n.default,{style:[P.trackArrowBelow,{color:D}],children:x})}):null]},`line-${s}`)",
  "(0,f.jsxs)(o.default,{style:[P.lineRow,null==H&&{minHeight:d},null!=H&&{flexGrow:1,justifyContent:'center'},E&&{backgroundColor:O},y&&P.bismillahRow,F&&!E&&{backgroundColor:`${R}14`,borderLeftWidth:2,borderLeftColor:R}],children:[j?.length?(0,f.jsx)(n.default,{style:[P.lineFlow,{fontSize:l,lineHeight:Math.round(.95*d),fontFamily:b},(y||j.length<=5&&t.lines.length<=10)&&P.lineFlowCentered],children:I(j,a,t,l,u,b,p,w,A,T,B,L,V,G)}):(0,f.jsx)(o.default,{style:[P.lineContent,y&&P.bismillahContent],children:(0,f.jsx)(n.default,{style:[P.lineText,P.fallbackText,{fontSize:l,lineHeight:Math.round(.92*d),fontFamily:b,letterSpacing:p},y&&P.bismillahText,A&&P.hiddenText],children:A?'\\xb7 \\xb7 \\xb7 \\xb7 \\xb7':S?.join(' ')??''})}),c&&!V?(0,f.jsx)(o.default,{style:P.trackArrowRow,pointerEvents:\"none\",children:(0,f.jsx)(n.default,{style:[P.trackArrowBelow,{color:D}],children:x})}):null]})]},`line-${s}`)"
);
replaceOnce(
  "lineRow relative overflow",
  "lineRow:{justifyContent:'center',paddingVertical:3,width:'100%',borderRadius:2},",
  "lineRow:{justifyContent:'center',paddingVertical:3,width:'100%',borderRadius:2,position:'relative',overflow:'visible'},"
);
replaceOnce(
  "trackArrowRow absolute",
  "trackArrowRow:{alignItems:'center',justifyContent:'center',height:14,marginTop:-2,marginBottom:2},",
  "trackArrowRow:{position:'absolute',left:0,right:0,bottom:0,alignItems:'center',justifyContent:'center',height:22,zIndex:5,pointerEvents:'none'},"
);
replaceOnce(
  "trackArrowBelow larger",
  "trackArrowBelow:{color:C,fontSize:14,fontWeight:'900',lineHeight:14,textAlign:'center',includeFontPadding:!1},",
  "trackArrowBelow:{color:C,fontSize:26,fontWeight:'900',lineHeight:22,textAlign:'center',includeFontPadding:!1},"
);

// --- 4) ok-takibi: audio sync without CORS stalls
replaceOnce(
  "drop crossOrigin on Audio",
  "u.preload='auto',u.crossOrigin='anonymous',u.src=t,",
  "u.preload='auto',u.src=t,"
);
replaceOnce(
  "tighter progress threshold",
  "(a-f>=.012||a>=.99||f<0)&&(f=a,o?.(a))},b=()=>{if(s||r||n!==i)return void h('aborted');if(A)return;const t=Number.isFinite(u.duration)&&u.duration>0?u.duration:0,a=Number.isFinite(u.currentTime)?u.currentTime:0;(!u.paused&&!u.ended||a>0)&&(y=!0),t>0?p(a/t):y&&p(Math.min(.92,(Date.now()-w)/45e3)),u.ended&&(p(1),h('ok'))},M=setInterval(()=>{s||(r||n!==i?h('aborted'):Date.now()-w>12e4?h('failed'):A||(b(),!y&&Date.now()-w>12e3&&h('failed')))},120);",
  "(a-f>=.006||a>=.99||f<0)&&(f=a,o?.(a))},b=()=>{if(s||r||n!==i)return void h('aborted');const t=Number.isFinite(u.duration)&&u.duration>0?u.duration:0,a=Number.isFinite(u.currentTime)?u.currentTime:0;(!u.paused&&!u.ended||a>0)&&(y=!0);if(u.ended||t>0&&a>=Math.max(0,t-.08))return p(1),void h('ok');if(A)return;t>0?p(a/t):y&&p(Math.min(.92,(Date.now()-w)/45e3))},M=setInterval(()=>{s||(r||n!==i?h('aborted'):Date.now()-w>12e4?h('failed'):A||(b(),!y&&Date.now()-w>2e4&&h('failed')))},120);"
);

// --- 5) MushafReader chrome → Ezan Vakti atmosphere
replaceOnce(
  "reader loading bg",
  "loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#ffffff',gap:12},loadingText:{color:'#888',fontSize:14},root:{flex:1,backgroundColor:'#ffffff'},rootLandscape:{backgroundColor:'#ffffff'},",
  "loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#14352c',gap:12},loadingText:{color:'rgba(247,255,251,0.78)',fontSize:14},root:{flex:1,backgroundColor:'#14352c'},rootLandscape:{backgroundColor:'#14352c'},"
);
replaceOnce(
  "topBar ezan glass",
  "topBar:{flexDirection:'row',alignItems:'center',paddingHorizontal:6,paddingVertical:8,backgroundColor:'#ffffff',borderBottomWidth:o.default.hairlineWidth,borderBottomColor:'#e0e0e0'},",
  "topBar:{flexDirection:'row',alignItems:'center',paddingHorizontal:6,paddingVertical:10,backgroundColor:'rgba(20, 28, 26, 0.92)',borderBottomWidth:o.default.hairlineWidth,borderBottomColor:'rgba(255,255,255,0.12)'},"
);
replaceOnce(
  "topIcon color",
  "topIcon:{fontSize:20,color:'#555'},",
  "topIcon:{fontSize:20,color:'#f7fffb'},"
);
replaceOnce(
  "topTitle colors",
  "topTitle:{fontSize:15,fontWeight:'700',color:'#222',textAlign:'center'},topSubtitle:{fontSize:12,color:'#777',marginTop:1,textAlign:'center'},",
  "topTitle:{fontSize:16,fontWeight:'700',color:'#f7fffb',textAlign:'center',fontFamily:'Georgia, serif',letterSpacing:-.2},topSubtitle:{fontSize:12,color:'rgba(232,255,248,0.78)',marginTop:1,textAlign:'center'},"
);
replaceOnce(
  "toolbar ezan",
  "toolbar:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',paddingHorizontal:12,paddingVertical:8,backgroundColor:'rgba(245, 240, 230, 0.96)',borderBottomWidth:1,borderBottomColor:'#c9baa8'},pageInfo:{fontSize:13,color:'#444',fontWeight:'600'},",
  "toolbar:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',paddingHorizontal:12,paddingVertical:8,backgroundColor:'rgba(15, 45, 38, 0.94)',borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,0.12)'},pageInfo:{fontSize:13,color:'rgba(247,255,251,0.9)',fontWeight:'600'},"
);
replaceOnce(
  "scroll + pageContainer transparent",
  "scroll:{flex:1,backgroundColor:'#ffffff'},pageContainer:{padding:0,paddingBottom:8,flexGrow:1,width:'100%'},",
  "scroll:{flex:1,backgroundColor:'transparent'},pageContainer:{padding:10,paddingBottom:16,flexGrow:1,width:'100%'},"
);
replaceOnce(
  "bottomBar ezan",
  "bottomBar:{backgroundColor:'#ffffff',borderTopWidth:o.default.hairlineWidth,borderTopColor:'#e0e0e0',paddingHorizontal:12,paddingTop:8,paddingBottom:10},bottomBarOverlay:{position:'absolute',left:0,right:0,bottom:0,zIndex:20,backgroundColor:'rgba(255,255,255,0.98)'},",
  "bottomBar:{backgroundColor:'rgba(20, 28, 26, 0.94)',borderTopWidth:o.default.hairlineWidth,borderTopColor:'rgba(255,255,255,0.12)',paddingHorizontal:12,paddingTop:10,paddingBottom:12,borderTopLeftRadius:20,borderTopRightRadius:20},bottomBarOverlay:{position:'absolute',left:0,right:0,bottom:0,zIndex:20,backgroundColor:'rgba(20, 28, 26, 0.96)',borderTopLeftRadius:20,borderTopRightRadius:20,borderTopWidth:o.default.hairlineWidth,borderColor:'rgba(255,255,255,0.12)'},"
);
replaceOnce(
  "progress track on dark",
  "progressTrack:{height:4,backgroundColor:'#e8e8e8',borderRadius:2,marginBottom:12,marginTop:2,position:'relative'},progressFill:{position:'absolute',left:0,top:0,bottom:0,backgroundColor:'#bdbdbd',borderRadius:2},progressThumb:{position:'absolute',top:-6,width:16,height:16,borderRadius:8,backgroundColor:'#fff',borderWidth:1,borderColor:'#ccc',marginLeft:-8},",
  "progressTrack:{height:4,backgroundColor:'rgba(255,255,255,0.18)',borderRadius:2,marginBottom:12,marginTop:2,position:'relative'},progressFill:{position:'absolute',left:0,top:0,bottom:0,backgroundColor:'#9fd9cf',borderRadius:2},progressThumb:{position:'absolute',top:-6,width:16,height:16,borderRadius:8,backgroundColor:'#f7fffb',borderWidth:1,borderColor:'#9fd9cf',marginLeft:-8},"
);
replaceOnce(
  "floating page pill",
  "floatingPagePill:{position:'absolute',bottom:10,left:0,right:0,marginHorizontal:'auto',alignSelf:'center',backgroundColor:'rgba(45, 36, 26, 0.55)',paddingHorizontal:14,paddingVertical:6,borderRadius:14,zIndex:6,width:88,alignItems:'center'},floatingPageText:{color:'#f5f0e6',fontSize:12,fontWeight:'700'},",
  "floatingPagePill:{position:'absolute',bottom:14,left:0,right:0,marginHorizontal:'auto',alignSelf:'center',backgroundColor:'rgba(20, 53, 44, 0.88)',paddingHorizontal:16,paddingVertical:8,borderRadius:999,zIndex:6,minWidth:96,alignItems:'center',borderWidth:1,borderColor:'rgba(159,217,207,0.45)'},floatingPageText:{color:'#f7fffb',fontSize:13,fontWeight:'700',letterSpacing:.3},"
);
replaceOnce(
  "fixed arrow rail transparent",
  "fixedArrowRail:{width:36,backgroundColor:'#f3f3f3',borderRightWidth:1,borderRightColor:'#e0e0e0',position:'relative'},",
  "fixedArrowRail:{width:36,backgroundColor:'rgba(15,45,38,0.55)',borderRightWidth:1,borderRightColor:'rgba(255,255,255,0.08)',position:'relative'},"
);
replaceOnce(
  "landscape meta dark",
  "landscapeMeta:{paddingVertical:6,paddingHorizontal:12,alignItems:'center',backgroundColor:'#ffffff',borderBottomWidth:o.default.hairlineWidth,borderBottomColor:'#e0e0e0'},landscapeMetaText:{fontSize:13,color:'#444',fontWeight:'500',textAlign:'center'},",
  "landscapeMeta:{paddingVertical:6,paddingHorizontal:12,alignItems:'center',backgroundColor:'rgba(20,28,26,0.92)',borderBottomWidth:o.default.hairlineWidth,borderBottomColor:'rgba(255,255,255,0.12)'},landscapeMetaText:{fontSize:13,color:'rgba(247,255,251,0.9)',fontWeight:'500',textAlign:'center'},"
);

// Inject soft orbs + styles into MushafReader (like PrayerTimesScreen)
replaceOnce(
  "inject ambient orbs into reader root",
  "return(0,Ce.jsxs)(d.default,{style:[Re.root,He&&Re.rootLandscape],children:[hr&&!Ga&&null==Ja&&(0,Ce.jsxs)(d.default,{style:Re.topBar,",
  "return(0,Ce.jsxs)(d.default,{style:[Re.root,He&&Re.rootLandscape],children:[(0,Ce.jsxs)(d.default,{style:Re.orbs,pointerEvents:\"none\",children:[(0,Ce.jsx)(d.default,{style:[Re.orb,Re.orbTL]}),(0,Ce.jsx)(d.default,{style:[Re.orb,Re.orbBR]}),(0,Ce.jsx)(d.default,{style:[Re.orb,Re.orbBL]})]}),hr&&!Ga&&null==Ja&&(0,Ce.jsxs)(d.default,{style:Re.topBar,"
);
replaceOnce(
  "add orb styles",
  "root:{flex:1,backgroundColor:'#14352c'},rootLandscape:{backgroundColor:'#14352c'},landscapeMeta:",
  "root:{flex:1,backgroundColor:'#14352c'},rootLandscape:{backgroundColor:'#14352c'},orbs:Object.assign({},o.default.absoluteFillObject,{zIndex:0}),orb:{position:'absolute',borderRadius:999,opacity:.22},orbTL:{width:220,height:220,top:-60,left:-70,backgroundColor:'#2f6b5a'},orbBR:{width:260,height:260,bottom:40,right:-90,backgroundColor:'#c4a484'},orbBL:{width:160,height:160,bottom:120,left:-40,backgroundColor:'#5fa88f'},landscapeMeta:"
);

// --- 6) MushafPageView ezan-vakti page = white card like Vakitler timesPanel
replaceOnce(
  "ezanMinimal white card",
  "ezanMinimal:{width:'100%',flex:1,backgroundColor:O,paddingHorizontal:14,paddingTop:4,paddingBottom:12,borderWidth:1.5,borderColor:'rgba(201, 162, 39, 0.55)'},ezanMinimalLandscape:{paddingHorizontal:20}",
  "ezanMinimal:{width:'100%',flex:1,backgroundColor:'rgba(255,255,255,0.96)',paddingHorizontal:16,paddingTop:10,paddingBottom:14,borderRadius:24,borderWidth:1,borderColor:'rgba(255,255,255,0.55)',marginHorizontal:4,shadowColor:'#000',shadowOpacity:.18,shadowRadius:18,shadowOffset:{width:0,height:8},elevation:4},ezanMinimalLandscape:{paddingHorizontal:22,marginHorizontal:8}"
);
replaceOnce(
  "ezan header/footer tokens",
  "ezanHeader:{borderBottomColor:'rgba(42, 107, 102, 0.25)',marginBottom:8},ezanHeaderText:{color:T,fontWeight:'600'},ezanPageNum:{color:L,fontWeight:'700'},ezanFooter:{marginTop:8},ezanPageRingOuter:{borderColor:T,backgroundColor:'transparent'},ezanPageRing:{borderColor:B,backgroundColor:'rgba(42, 107, 102, 0.08)'},ezanPageRingText:{color:L},ezanAyahMarker:{backgroundColor:'#9a7348',color:'#fff'},",
  "ezanHeader:{borderBottomColor:'rgba(20, 53, 44, 0.14)',marginBottom:10},ezanHeaderText:{color:'#14352c',fontWeight:'700'},ezanPageNum:{color:'#0f3d32',fontWeight:'800'},ezanFooter:{marginTop:10},ezanPageRingOuter:{borderColor:'#9fd9cf',backgroundColor:'transparent'},ezanPageRing:{borderColor:'#14352c',backgroundColor:'rgba(159, 217, 207, 0.35)'},ezanPageRingText:{color:'#0f2f28',fontWeight:'800'},ezanAyahMarker:{backgroundColor:'#0f3d32',color:'#f7fffb'},"
);

// --- 7) Kuran route loading splash matches ezan
replaceOnce(
  "kuran route splash",
  "null==I)return(0,h.jsxs)(l.default,{style:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#f5ecd8'},children:[(0,h.jsx)(s.Stack.Screen,{options:{title:'Mushaf',headerShown:!1}}),(0,h.jsx)(u.default,{size:\"large\",color:\"#2d6a4f\"})]",
  "null==I)return(0,h.jsxs)(l.default,{style:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#14352c'},children:[(0,h.jsx)(s.Stack.Screen,{options:{title:'Mushaf',headerShown:!1}}),(0,h.jsx)(u.default,{size:\"large\",color:\"#9fd9cf\"})]"
);

// Soften media icon colors for dark bottom bar (best-effort common hex in media row area)
// Leave media icons as-is if they use Icon components with explicit colors elsewhere.

fs.writeFileSync(ENTRY, src);
console.log("patched entry,", n, "replacements");

// Force reader to always render ezan-vakti page chrome (full mushaf pages, sade)
replaceOnce(
  "force MushafPageView layoutMode",
  "highlightSerlevha:mt,layoutMode:Ze,trackAyahBg:qe.ayahBg",
  "highlightSerlevha:mt,layoutMode:'ezan-vakti',trackAyahBg:qe.ayahBg"
);

// Bust caches (script query + SW build id)
let html = fs.readFileSync(INDEX, "utf8");
html = html
  .replace(/content="2026-09-13-amentu-v2"/g, 'content="2026-09-14-kuran-ezan-mushaf"')
  .replace(/content="2026-09-14-kuran-ezan-mushaf"/g, 'content="2026-09-14-kuran-ezan-mushaf"')
  .replace(/bust: amentu2/, "bust: kuranezan1")
  .replace(/\?v=amentu2/g, "?v=kuranezan1")
  .replace(/var bust = 'amentu2';/, "var bust = 'kuranezan1';");
fs.writeFileSync(INDEX, html);
console.log("patched index.html");

if (fs.existsSync(SW)) {
  let sw = fs.readFileSync(SW, "utf8");
  const stamp = "kuran-ezan-mushaf-2026-09-14";
  if (!sw.includes(stamp)) {
    sw = `/* ${stamp} */\n` + sw;
  }
  sw = sw.replace(/const BUILD = '[^']+';/, "const BUILD = 'kuranezan1';");
  fs.writeFileSync(SW, sw);
  console.log("patched sw.js");
}

console.log("done");
