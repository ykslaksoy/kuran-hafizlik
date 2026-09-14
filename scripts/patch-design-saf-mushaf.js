#!/usr/bin/env node
/**
 * Saf Mushaf (Pergamente) — recommended design direction.
 * Separates reading chrome from Vakitler dark-green prayer atmosphere:
 * warm parchment mushaf, refined ink chrome, soft gold accents.
 * Keeps ok-takibi / audio / 604-page mushaf behavior from prior patches.
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

// --- Edition copy: parchment reading, not dark-green mashup
replaceOnce(
  "edition description + keep ezan-vakti layout (sade page)",
  "id:'medine-hafs-sade',nameTr:'Medine Mushaf\\u0131 (Hafs)',descriptionTr:'Ezan Vakti mushaf sayfas\\u0131 \\u2014 ye\\u015fil atmosfer, sade tam sayfa, oklu takip',riwayetTr:'Hafs \\xb7 Medine 604 sayfa',fontId:'uthmanic-hafs',layoutMode:'ezan-vakti',popularityTr:1,isDefault:!0",
  "id:'medine-hafs-sade',nameTr:'Medine Mushaf\\u0131 (Hafs)',descriptionTr:'Saf mushaf \\u2014 krem pergamente, sade sayfa, oklu takip',riwayetTr:'Hafs \\xb7 Medine 604 sayfa',fontId:'uthmanic-hafs',layoutMode:'ezan-vakti',popularityTr:1,isDefault:!0"
);

// --- MushafReader StyleSheet: parchment atmosphere (from current ezan-dark chrome)
replaceOnce(
  "reader loading + root parchment",
  "loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#14352c',gap:12},loadingText:{color:'rgba(247,255,251,0.78)',fontSize:14},root:{flex:1,backgroundColor:'#14352c'},rootLandscape:{backgroundColor:'#14352c'},orbs:Object.assign({},o.default.absoluteFillObject,{zIndex:0}),orb:{position:'absolute',borderRadius:999,opacity:.22},orbTL:{width:220,height:220,top:-60,left:-70,backgroundColor:'#2f6b5a'},orbBR:{width:260,height:260,bottom:40,right:-90,backgroundColor:'#c4a484'},orbBL:{width:160,height:160,bottom:120,left:-40,backgroundColor:'#5fa88f'},landscapeMeta:{paddingVertical:6,paddingHorizontal:12,alignItems:'center',backgroundColor:'rgba(20,28,26,0.92)',borderBottomWidth:o.default.hairlineWidth,borderBottomColor:'rgba(255,255,255,0.12)'},landscapeMetaText:{fontSize:13,color:'rgba(247,255,251,0.9)',fontWeight:'500',textAlign:'center'},",
  "loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#ebe3d4',gap:12},loadingText:{color:'rgba(36,53,47,0.72)',fontSize:14},root:{flex:1,backgroundColor:'#ebe3d4'},rootLandscape:{backgroundColor:'#e6ddd0'},orbs:Object.assign({},o.default.absoluteFillObject,{zIndex:0}),orb:{position:'absolute',borderRadius:999,opacity:.28},orbTL:{width:240,height:240,top:-70,left:-80,backgroundColor:'#d7c6a4'},orbBR:{width:280,height:280,bottom:30,right:-100,backgroundColor:'#c9b896'},orbBL:{width:170,height:170,bottom:110,left:-50,backgroundColor:'#b7c4b0'},landscapeMeta:{paddingVertical:6,paddingHorizontal:12,alignItems:'center',backgroundColor:'rgba(250,246,238,0.94)',borderBottomWidth:o.default.hairlineWidth,borderBottomColor:'rgba(184,149,74,0.28)'},landscapeMetaText:{fontSize:13,color:'#24352f',fontWeight:'500',textAlign:'center',fontFamily:'Georgia, \"Literata\", serif'},"
);

replaceOnce(
  "topBar parchment glass",
  "topBar:{flexDirection:'row',alignItems:'center',paddingHorizontal:6,paddingVertical:10,backgroundColor:'rgba(20, 28, 26, 0.92)',borderBottomWidth:o.default.hairlineWidth,borderBottomColor:'rgba(255,255,255,0.12)'},",
  "topBar:{flexDirection:'row',alignItems:'center',paddingHorizontal:6,paddingVertical:10,backgroundColor:'rgba(250,246,238,0.94)',borderBottomWidth:o.default.hairlineWidth,borderBottomColor:'rgba(184,149,74,0.28)'},"
);

replaceOnce(
  "topIcon ink",
  "topIcon:{fontSize:20,color:'#f7fffb'},",
  "topIcon:{fontSize:20,color:'#24352f'},"
);

replaceOnce(
  "topTitle ink serif",
  "topTitle:{fontSize:16,fontWeight:'700',color:'#f7fffb',textAlign:'center',fontFamily:'Georgia, serif',letterSpacing:-.2},topSubtitle:{fontSize:12,color:'rgba(232,255,248,0.78)',marginTop:1,textAlign:'center'},",
  "topTitle:{fontSize:17,fontWeight:'700',color:'#1c2e28',textAlign:'center',fontFamily:'Georgia, \"Literata\", serif',letterSpacing:-.2},topSubtitle:{fontSize:12,color:'rgba(36,53,47,0.68)',marginTop:1,textAlign:'center'},"
);

replaceOnce(
  "toolbar parchment",
  "toolbar:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',paddingHorizontal:12,paddingVertical:8,backgroundColor:'rgba(15, 45, 38, 0.94)',borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,0.12)'},pageInfo:{fontSize:13,color:'rgba(247,255,251,0.9)',fontWeight:'600'},",
  "toolbar:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',paddingHorizontal:12,paddingVertical:8,backgroundColor:'rgba(245,239,228,0.96)',borderBottomWidth:1,borderBottomColor:'rgba(184,149,74,0.22)'},pageInfo:{fontSize:13,color:'#24352f',fontWeight:'600'},"
);

replaceOnce(
  "bottomBar parchment",
  "bottomBar:{backgroundColor:'rgba(20, 28, 26, 0.94)',borderTopWidth:o.default.hairlineWidth,borderTopColor:'rgba(255,255,255,0.12)',paddingHorizontal:12,paddingTop:10,paddingBottom:12,borderTopLeftRadius:20,borderTopRightRadius:20},bottomBarOverlay:{position:'absolute',left:0,right:0,bottom:0,zIndex:20,backgroundColor:'rgba(20, 28, 26, 0.96)',borderTopLeftRadius:20,borderTopRightRadius:20,borderTopWidth:o.default.hairlineWidth,borderColor:'rgba(255,255,255,0.12)'},",
  "bottomBar:{backgroundColor:'rgba(250,246,238,0.97)',borderTopWidth:o.default.hairlineWidth,borderTopColor:'rgba(184,149,74,0.28)',paddingHorizontal:12,paddingTop:10,paddingBottom:12,borderTopLeftRadius:18,borderTopRightRadius:18},bottomBarOverlay:{position:'absolute',left:0,right:0,bottom:0,zIndex:20,backgroundColor:'rgba(250,246,238,0.98)',borderTopLeftRadius:18,borderTopRightRadius:18,borderTopWidth:o.default.hairlineWidth,borderColor:'rgba(184,149,74,0.28)'},"
);

replaceOnce(
  "progress bronze on parchment",
  "progressTrack:{height:4,backgroundColor:'rgba(255,255,255,0.18)',borderRadius:2,marginBottom:12,marginTop:2,position:'relative'},progressFill:{position:'absolute',left:0,top:0,bottom:0,backgroundColor:'#9fd9cf',borderRadius:2},progressThumb:{position:'absolute',top:-6,width:16,height:16,borderRadius:8,backgroundColor:'#f7fffb',borderWidth:1,borderColor:'#9fd9cf',marginLeft:-8},",
  "progressTrack:{height:4,backgroundColor:'rgba(36,53,47,0.12)',borderRadius:2,marginBottom:12,marginTop:2,position:'relative'},progressFill:{position:'absolute',left:0,top:0,bottom:0,backgroundColor:'#3d6b5c',borderRadius:2},progressThumb:{position:'absolute',top:-6,width:16,height:16,borderRadius:8,backgroundColor:'#faf6ee',borderWidth:1,borderColor:'#b8954a',marginLeft:-8},"
);

replaceOnce(
  "floating page pill warm ink",
  "floatingPagePill:{position:'absolute',bottom:14,left:0,right:0,marginHorizontal:'auto',alignSelf:'center',backgroundColor:'rgba(20, 53, 44, 0.88)',paddingHorizontal:16,paddingVertical:8,borderRadius:999,zIndex:6,minWidth:96,alignItems:'center',borderWidth:1,borderColor:'rgba(159,217,207,0.45)'},floatingPageText:{color:'#f7fffb',fontSize:13,fontWeight:'700',letterSpacing:.3},",
  "floatingPagePill:{position:'absolute',bottom:14,left:0,right:0,marginHorizontal:'auto',alignSelf:'center',backgroundColor:'rgba(28,46,40,0.88)',paddingHorizontal:16,paddingVertical:8,borderRadius:14,zIndex:6,minWidth:96,alignItems:'center',borderWidth:1,borderColor:'rgba(184,149,74,0.45)'},floatingPageText:{color:'#faf6ee',fontSize:13,fontWeight:'700',letterSpacing:.3,fontFamily:'Georgia, \"Literata\", serif'},"
);

replaceOnce(
  "fixed arrow rail parchment",
  "fixedArrowRail:{width:36,backgroundColor:'rgba(15,45,38,0.55)',borderRightWidth:1,borderRightColor:'rgba(255,255,255,0.08)',position:'relative'},",
  "fixedArrowRail:{width:36,backgroundColor:'rgba(235,227,212,0.85)',borderRightWidth:1,borderRightColor:'rgba(184,149,74,0.22)',position:'relative'},"
);

// --- Mushaf page card: cream book leaf, not white-on-dark-green floaty card
replaceOnce(
  "ezanMinimal parchment leaf",
  "ezanMinimal:{width:'100%',flex:1,backgroundColor:'rgba(255,255,255,0.96)',paddingHorizontal:16,paddingTop:10,paddingBottom:14,borderRadius:24,borderWidth:1,borderColor:'rgba(255,255,255,0.55)',marginHorizontal:4,shadowColor:'#000',shadowOpacity:.18,shadowRadius:18,shadowOffset:{width:0,height:8},elevation:4},ezanMinimalLandscape:{paddingHorizontal:22,marginHorizontal:8}",
  "ezanMinimal:{width:'100%',flex:1,backgroundColor:'#faf6ee',paddingHorizontal:16,paddingTop:10,paddingBottom:14,borderRadius:18,borderWidth:1.5,borderColor:'rgba(184,149,74,0.42)',marginHorizontal:6,shadowColor:'#5c4a32',shadowOpacity:.12,shadowRadius:14,shadowOffset:{width:0,height:6},elevation:3},ezanMinimalLandscape:{paddingHorizontal:22,marginHorizontal:10}"
);

replaceOnce(
  "ezan header/footer ink-gold",
  "ezanHeader:{borderBottomColor:'rgba(20, 53, 44, 0.14)',marginBottom:10},ezanHeaderText:{color:'#14352c',fontWeight:'700'},ezanPageNum:{color:'#0f3d32',fontWeight:'800'},ezanFooter:{marginTop:10},ezanPageRingOuter:{borderColor:'#9fd9cf',backgroundColor:'transparent'},ezanPageRing:{borderColor:'#14352c',backgroundColor:'rgba(159, 217, 207, 0.35)'},ezanPageRingText:{color:'#0f2f28',fontWeight:'800'},ezanAyahMarker:{backgroundColor:'#0f3d32',color:'#f7fffb'},",
  "ezanHeader:{borderBottomColor:'rgba(184,149,74,0.28)',marginBottom:10},ezanHeaderText:{color:'#1c2e28',fontWeight:'700'},ezanPageNum:{color:'#3d6b5c',fontWeight:'800'},ezanFooter:{marginTop:10},ezanPageRingOuter:{borderColor:'#b8954a',backgroundColor:'transparent'},ezanPageRing:{borderColor:'#3d6b5c',backgroundColor:'rgba(184,149,74,0.18)'},ezanPageRingText:{color:'#1c2e28',fontWeight:'800'},ezanAyahMarker:{backgroundColor:'#3d6b5c',color:'#faf6ee'},"
);

// --- Kuran route splash
replaceOnce(
  "kuran splash parchment",
  "null==I)return(0,h.jsxs)(l.default,{style:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#14352c'},children:[(0,h.jsx)(s.Stack.Screen,{options:{title:'Mushaf',headerShown:!1}}),(0,h.jsx)(u.default,{size:\"large\",color:\"#9fd9cf\"})]",
  "null==I)return(0,h.jsxs)(l.default,{style:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#ebe3d4'},children:[(0,h.jsx)(s.Stack.Screen,{options:{title:'Mushaf',headerShown:!1}}),(0,h.jsx)(u.default,{size:\"large\",color:\"#3d6b5c\"})]"
);

// --- Home hub: warm parchment ground + serif brand
replaceOnce(
  "home hub container + brand",
  "const P='#2a6b66',R='#0d3b36';const w=o.default.create({container:{flex:1,backgroundColor:'#eef4f2'},content:{padding:16,paddingBottom:40},header:{alignItems:'center',marginBottom:12},brand:{fontSize:28,fontWeight:'800',color:R,letterSpacing:-.5},streakPill:{marginTop:10,backgroundColor:'#faf9f5',paddingHorizontal:14,paddingVertical:7,borderRadius:20,borderWidth:1.5,borderColor:'#c9a227'},streakText:{fontSize:13,fontWeight:'700',color:R},settingsSummary:{marginBottom:12,paddingVertical:12,paddingHorizontal:14,backgroundColor:'#faf9f5',borderRadius:12,borderWidth:1.5,borderColor:'rgba(201, 162, 39, 0.55)'},",
  "const P='#3d6b5c',R='#1c2e28';const w=o.default.create({container:{flex:1,backgroundColor:'#f3ebe0'},content:{padding:16,paddingBottom:40},header:{alignItems:'center',marginBottom:12},brand:{fontSize:32,fontWeight:'800',color:R,letterSpacing:-.6,fontFamily:'Georgia, \"Fraunces\", serif'},streakPill:{marginTop:10,backgroundColor:'#faf6ee',paddingHorizontal:14,paddingVertical:7,borderRadius:14,borderWidth:1.5,borderColor:'rgba(184,149,74,0.55)'},streakText:{fontSize:13,fontWeight:'700',color:R},settingsSummary:{marginBottom:12,paddingVertical:12,paddingHorizontal:14,backgroundColor:'rgba(250,246,238,0.92)',borderRadius:14,borderWidth:1.5,borderColor:'rgba(184,149,74,0.4)'},"
);

// --- Islamic ornament: ink-teal band (brand signal) without mushaf dark-green walls
replaceOnce(
  "islamic ornament warm band",
  "topBand:{width:'100%',backgroundColor:'#1b4332',borderRadius:16,paddingVertical:14,paddingHorizontal:12,alignItems:'center',borderWidth:2,borderColor:'#c9a227'},besmele:{color:'#f5f5f0',fontSize:15,lineHeight:28,textAlign:'center',writingDirection:'rtl',marginVertical:6,fontWeight:'600'},diamondRow:{flexDirection:'row',gap:8,opacity:.85},diamond:{width:6,height:6,backgroundColor:'#c9a227',transform:[{rotate:'45deg'}]},",
  "topBand:{width:'100%',backgroundColor:'#24352f',borderRadius:18,paddingVertical:16,paddingHorizontal:14,alignItems:'center',borderWidth:1.5,borderColor:'#b8954a'},besmele:{color:'#faf6ee',fontSize:16,lineHeight:30,textAlign:'center',writingDirection:'rtl',marginVertical:6,fontWeight:'600',fontFamily:'Georgia, \"Amiri\", serif'},diamondRow:{flexDirection:'row',gap:8,opacity:.9},diamond:{width:6,height:6,backgroundColor:'#b8954a',transform:[{rotate:'45deg'}]},"
);

// --- Hub tiles: softer corners / parchment surfaces via shared tile chrome
replaceOnce(
  "hub tile chrome",
  "tile:{width:'47%',minHeight:118,borderRadius:20,borderWidth:2,padding:14,shadowColor:'#0d3b36',shadowOffset:{width:0,height:5},shadowOpacity:.1,shadowRadius:10,elevation:3,overflow:'hidden'},",
  "tile:{width:'47%',minHeight:118,borderRadius:16,borderWidth:1.5,padding:14,shadowColor:'#5c4a32',shadowOffset:{width:0,height:4},shadowOpacity:.1,shadowRadius:12,elevation:2,overflow:'hidden'},"
);

replaceOnce(
  "hub tile title serif-ish",
  "title:{fontSize:16,fontWeight:'800',color:'#1a2e2a',letterSpacing:-.2},titleHero:{fontSize:20},subtitle:{marginTop:3,fontSize:12,fontWeight:'600',color:'#4a635e',lineHeight:16},",
  "title:{fontSize:16,fontWeight:'800',color:'#1c2e28',letterSpacing:-.2,fontFamily:'Georgia, \"Fraunces\", serif'},titleHero:{fontSize:20},subtitle:{marginTop:3,fontSize:12,fontWeight:'600',color:'#5a6f66',lineHeight:16},"
);

// --- Hub Kur'an tile copy
replaceOnce(
  "kuran tile subtitle",
  'subtitle:"Ezan Vakti mushaf \\xb7 ok"',
  'subtitle:"Saf mushaf \\xb7 okuma"'
);

// --- Vakitler: keep dark green prayer world; soften stark white panel → warm cream
replaceOnce(
  "vakitler timesPanel warm cream",
  "timesPanel:{backgroundColor:'rgba(255,255,255,0.94)',borderRadius:24,paddingVertical:6,paddingHorizontal:4,borderWidth:u.default.hairlineWidth,borderColor:'rgba(255,255,255,0.55)',shadowColor:'#000',shadowOpacity:.18,shadowRadius:18,shadowOffset:{width:0,height:8},elevation:4},",
  "timesPanel:{backgroundColor:'rgba(250,246,238,0.96)',borderRadius:22,paddingVertical:6,paddingHorizontal:4,borderWidth:u.default.hairlineWidth,borderColor:'rgba(184,149,74,0.28)',shadowColor:'#000',shadowOpacity:.16,shadowRadius:16,shadowOffset:{width:0,height:8},elevation:4},"
);

replaceOnce(
  "vakitler city serif already — active row softer",
  "timeRowActive:{backgroundColor:'rgba(159,217,207,0.55)',borderBottomWidth:0,marginHorizontal:6,paddingHorizontal:14,borderRadius:16},",
  "timeRowActive:{backgroundColor:'rgba(184,149,74,0.22)',borderBottomWidth:0,marginHorizontal:6,paddingHorizontal:14,borderRadius:14},"
);

replaceOnce(
  "vakitler activeDot ink",
  "activeDot:{width:8,height:8,borderRadius:4,backgroundColor:'#0f3d32'},",
  "activeDot:{width:8,height:8,borderRadius:4,backgroundColor:'#3d6b5c'},"
);

fs.writeFileSync(ENTRY, src);
console.log("patched entry,", n, "replacements");

// --- index.html: fonts + atmosphere + cache bust
let html = fs.readFileSync(INDEX, "utf8");
const FONT_BLOCK = `    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Literata:opsz,wght@7..72,500;7..72,700&display=swap" rel="stylesheet" />
    <style id="hafiz-saf-mushaf">
      :root {
        --hy-parchment: #ebe3d4;
        --hy-cream: #faf6ee;
        --hy-ink: #1c2e28;
        --hy-gold: #b8954a;
        --hy-sage: #3d6b5c;
      }
      html, body, #root {
        background: radial-gradient(120% 80% at 10% 0%, #f3ebe0 0%, #ebe3d4 45%, #e2d7c4 100%) !important;
      }
      body {
        font-family: Literata, Georgia, "Times New Roman", serif;
      }
    </style>
`;

if (!html.includes("id=\"hafiz-saf-mushaf\"")) {
  html = html.replace("<title>Hafız Yol</title>", `<title>Hafız Yol</title>\n${FONT_BLOCK}`);
}

html = html
  .replace(/content="2026-09-14-kuran-ezan-mushaf"/g, 'content="2026-09-14-saf-mushaf"')
  .replace(/content="2026-09-14-saf-mushaf"/g, 'content="2026-09-14-saf-mushaf"')
  .replace(/bust: kuranezan1/g, "bust: safmushaf1")
  .replace(/\?v=kuranezan1/g, "?v=safmushaf1")
  .replace(/var bust = 'kuranezan1';/, "var bust = 'safmushaf1';")
  .replace(/bust: safmushaf1/g, "bust: safmushaf1")
  .replace(/\?v=safmushaf1/g, "?v=safmushaf1")
  .replace(/var bust = 'safmushaf1';/, "var bust = 'safmushaf1';");

fs.writeFileSync(INDEX, html);
console.log("patched index.html");

if (fs.existsSync(SW)) {
  let sw = fs.readFileSync(SW, "utf8");
  const stamp = "saf-mushaf-2026-09-14";
  if (!sw.includes(stamp)) {
    sw = `/* ${stamp} */\n` + sw;
  }
  sw = sw.replace(/const BUILD = '[^']+';/, "const BUILD = 'safmushaf1';");
  fs.writeFileSync(SW, sw);
  console.log("patched sw.js");
}

console.log("done");
