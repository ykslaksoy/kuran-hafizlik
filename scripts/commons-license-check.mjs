#!/usr/bin/env node
/** Wikimedia Commons lisans meta verisi (API, User-Agent). */
const FILES = [
  "Seyh Hamdullah - Page of Ottoman Calligraphy - Walters W6724B - Full Page.jpg",
  "Seyh Hamdullah - Page of Ottoman Calligraphy - Walters W6722B - Full Page.jpg",
  "Copied by Kadıasker Mustafa İzzet Efendi - Qur’an - Google Art Project.jpg",
  "First pages of the Quran written by Şeyh Hamdullah in 1503-1504, Topkapi A. 5.jpg",
  "Left, opening page from the Qur'an copied by Shaykh Hamdallah (AKM 00262) (cropped).jpg",
  "Page from the Qur'an manuscript (TIEM 402, f. 1b).jpg",
  "Khalili Collection Islamic Art mss 0028 fol 2b-3a.jpg",
  "Copied by Mehmed Şevki Efendi - Qur’an - Google Art Project.jpg",
];

const UA = "HafizyolPreview/1.0 (license research; contact: preview@hafizyol.local)";

function stripHtml(s) {
  return String(s || "").replace(/<[^>]+>/g, "").trim();
}

async function meta(title) {
  const q = new URL("https://commons.wikimedia.org/w/api.php");
  q.searchParams.set("action", "query");
  q.searchParams.set("titles", `File:${title}`);
  q.searchParams.set("prop", "imageinfo");
  q.searchParams.set("iiprop", "url|size|extmetadata");
  q.searchParams.set("format", "json");
  const res = await fetch(q, { headers: { "User-Agent": UA } });
  const d = await res.json();
  const page = Object.values(d.query.pages)[0];
  const ii = page.imageinfo?.[0] || {};
  const m = ii.extmetadata || {};
  return {
    title,
    url: ii.url,
    width: ii.width,
    height: ii.height,
    license: stripHtml(m.LicenseShortName?.value),
    usage: stripHtml(m.UsageTerms?.value),
    artist: stripHtml(m.Artist?.value),
    credit: stripHtml(m.Credit?.value),
    attribution: stripHtml(m.Attribution?.value),
  };
}

async function main() {
  for (const f of FILES) {
    try {
      const r = await meta(f);
      console.log(JSON.stringify(r, null, 0));
    } catch (e) {
      console.log(JSON.stringify({ title: f, error: String(e) }));
    }
  }
}

main();
