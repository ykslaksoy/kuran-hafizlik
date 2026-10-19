# Hafızyol kâriler ve zamanlama (doğrulanmış)

Tarih: 2026-10-19. Kaynaklar canlı çekildi; uydurma satır yok.

## 1. Şu an uygulamadaki kâriler

Ses: everyayah.com `data/{folder}/{sss}{aaa}.mp3`  
Kelime zamanı: `GET https://api.quran.com/api/v4/chapter_recitations/{quranId}/{sure}?segments=true`  
(QUL / quran.com word segments: `[kelimeNo, startMs, endMs]`)

| Uygulama adı | id | Ses kaynağı (doğrulama) | Kelime timing | Ayet timing | Not |
|---|---|---|---|---|---|
| **Mişari** (varsayılan) | `alafasy` | everyayah `Alafasy_128kbps/001001.mp3` **HTTP 200** (146830 B) | **Var** — quran.com recitation **id=7**, Fatiha 7 ayet / 29 kelime segmenti, Bakara 286 ayet / 6273 segment | Var (aynı yanıt `timestamp_from` / `timestamp_to`) | quran.com ayet sesi: `Alafasy/mp3/001001.mp3` |
| Abdülbasit | `abdulbasit` | everyayah `Abdul_Basit_Mujawwad_128kbps/001001.mp3` **200** | **Var** — quran.com **id=1** (Mujawwad), Fatiha 27 / Bakara 6050 segment | Var | |
| Minşevi | `minshawi` | everyayah `Minshawy_Mujawwad_64kbps/001001.mp3` **200** | **Var** — quran.com **id=8** (Mujawwad), Fatiha 32 / Bakara 6933 segment | Var | |
| Abdülbasit (Murattal) | `abdulbasit-murattal` | everyayah `Abdul_Basit_Murattal_192kbps/001001.mp3` **200** | **Var** — quran.com **id=2**, Fatiha 29 / Bakara 6381 segment | Var | |
| Husary | `husary` | everyayah `Husary_128kbps/001001.mp3` **200** | **Var** — quran.com **id=6**, Fatiha 29 / Bakara 6303 segment | Var | quran.com ayet URL: `//mirrors.quranicaudio.com/everyayah/Husary_64kbps/001001.mp3` |
| Sudais | `sudais` | everyayah `Abdurrahmaan_As-Sudais_192kbps/001001.mp3` **200** (75786 B). Eski klasör `Sudais_128kbps` **404** — düzeltildi. | **Var** — quran.com **id=3**, Fatiha 29 / Bakara 6341 segment | Var | quran.com ayet URL: `Sudais/mp3/001001.mp3` |
| Hoca (TTS) | `hoca-tts` | **Yok** (`folder: null`) | **Yok** | **Yok** | Listede «kelime timing yok · ok: ayet başı» |

## 2. Eklenebilecek popüler kâriler (uygulamada yok)

Yalnızca bu oturumda doğrulanan çağrılar:

| Kâri | Ses (açık kaynak) | quran.com / QUL kelime segmenti | Ayet zamanı | Sonuç |
|---|---|---|---|---|
| **Davut Kaya** | everyayah `Davut_Kaya_128kbps`, `DavutKaya_128kbps`, `Turkish_DavutKaya_128kbps` → **404**. quran.com `chapter_recitations` 1–199 taramasında `kaya`/`davut` **yok**. | Doğrulanamadı | Doğrulanamadı | Açık kaynak timing **yok**. Ezan Vakti `positions19` telifli; kopyalanmaz. |
| **Mahir el-Muaykılı** | everyayah `MaherAlMuaiqly128kbps/001001.mp3` **200**. quran.com ses: id **52**, **65**, **159** (`maher_almu3aiqly` / `maher_256`). | id 52/65/159 Fatiha **wordsegs=0** | id **159**: 7 ayet `timestamp_*` var; 52/65 ayet zamanı yok | Ses var; **kelime timing yok**. Ayet zamanı yalnızca id 159. |
| Abdurrahman Südeys | Zaten uygulamada (`sudais`) | id=3 kelime segmentleri var | Var | — |
| Husari / Husary | Zaten uygulamada (`husary`) | id=6 var | Var | — |
| Minshâvî | Zaten uygulamada (`minshawi`, Mujawwad). Murattal adayı: everyayah `Minshawy_Murattal_128kbps` **200**, quran.com **id=9** Fatiha 29 kelime segmenti. | id=9 var | Var | İkinci stil eklenebilir. |
| Abdulbasit | Zaten iki stilde var (Mujawwad + Murattal) | id=1 ve id=2 | Var | — |
| Saad el-Gamdi | everyayah `Ghamadi_40kbps/001001.mp3` **200**. quran.com **id=13** `sa3d_al-ghaamidi`. | id=13 Fatiha **wordsegs=0** | id=13: 7 ayet zamanı var | Ses + ayet zamanı var; **kelime timing yok**. |
| Ebu Bekir eş-Şatri | everyayah `Abu_Bakr_Ash-Shaatree_128kbps/001001.mp3` **200**. quran.com **id=4**. | id=4 Fatiha 29 kelime segmenti | Var | Eklenebilir (kelime timing var). |
| Yasser ed-Düsari | quran.com **id=97** | Fatiha 29 kelime segmenti | Var | everyayah klasörü bu oturumda denenmedi. |

## 3. Ok davranışı (son karar)

- Sayfa konumları (satır + glif) **kâriden bağımsız** (604 sayfa satır verisi).
- **Kelime** zamanları kâri bazlı (quran.com/QUL).
- Kelime süresi, o kelimenin **harflerine tecvid ağırlıklı** bölünür (med, şedde, gunne uzun; wasla / okunmayan elif atlanır).
- Ok, harfin glifinin **altına** atlar; kelime başında gerçek ms ile **yeniden senkron** (hata birikmez).
- Süreye göre satır içi interpolasyon **yok**.
- Kelime timing’i olmayan kâride ok **ayet başına** sabit + listede işaret.
- Aktif ayet `#97FF0A` / `#8097FF0A`; kutu kelime vurgusu yok.

## 4. Fatiha demo — doğrulanmış kaynaklar (2026-10-19)

Ses her zaman **everyayah `Alafasy_128kbps/00100n.mp3`** (uygulamanın Mişari kaydı). QUL ayet süreleri bu dosyalarla **±4 ms**.

| Seçenek (demo) | Düzey | Kaynak | Lisans / not | Ses eşleşmesi | Demo? |
|---|---|---|---|---|---|
| **Hafızyol hizalama · harf** (varsayılan) | Harf | everyayah PCM RMS + QUL kelime çapası + tecvid ağırlığı + enerji vadisi | Hafızyol türetilmiş tablo. Ses: everyayah. Çapa: quran.com/QUL. | **Evet** — aynı 7 MP3 | Asıl çözüm |
| **quran.com / QUL · kelime→harf** | Kelime → harf (aynı tecvid) | `GET api.quran.com/v4/chapter_recitations/7/1?segments=true` (200, 7 ayet / 29 kelime) | Quran.com / Tarteel QUL public API | **Evet** — `timestamp_to−from` = everyayah süre | Kıyas (ürüne gömülmez) |
| **quran.com / QUL · kelime** | Kelime (ok kelime başında) | Aynı QUL tablo | Aynı | Aynı | Kıyas |
| everyayah `timings_files` | — | Klasörde **Alafasy yok** (Husary, Sudais, … var) | VerseByVerseQuran.com; Alafasy dosyası yok | — | Yok |
| alquran.cloud `ar.alafasy` | Ses var, timing yok | `api.alquran.cloud/v1/surah/1/ar.alafasy` — yalnızca `audio` URL | islamic.network CDN | Farklı URL (`cdn.islamic.network/.../1.mp3`) | Yok |
| mp3quran.net read **123** مشاري العفاسي | **Ayet** (kelime yok) | `api/v3/ayat_timing?surah=1&read=123` (200) | mp3quran public API | **Hayır** — gapless sure; 1:1 = 4700 ms vs everyayah 6087 ms | Yok (kayıt uyuşmaz) |
| Tarteel `qul.tarteel.ai/api/v1/recitations/7` | — | HTTP **404** | — | — | Yok; QUL yüzeyi quran.com |

## 5. Ölçülen doğruluk (Hafızyol vs QUL, Fatiha / Mişari)

`scripts/build-fatiha-demo.js` + `dist/assets/timing/fatiha-align-qa.json`. 7 ayet, **125 harf**.

| Ayet | Kelime | Harf | everyayah ms | QUL ms | Δ ms | Konuşma (ms) | Kelime vadisi ort. | Son harf kuyruk |
|---|---|---|---|---|---|---|---|---|
| 1:1 | 4 | 16 | 6087 | 6090 | −3.5 | 35–6017 | 15 ms | 0 |
| 1:2 | 4 | 15 | 5590 | 5590 | +0.2 | 75–5520 | 24 ms | 0 |
| 1:3 | 2 | 10 | 4624 | 4620 | +3.7 | 55–4554 | 40 ms | 0 |
| 1:4 | 3 | 10 | 4650 | 4650 | −0.2 | 25–4580 | 56 ms | 0 |
| 1:5 | 4 | 19 | 6713 | 6710 | +3.5 | 55–6643 | 24 ms | 0 |
| 1:6 | 3 | 15 | 5590 | 5590 | +0.2 | 35–5520 | 42 ms | 0 |
| 1:7 | 9 | 40 | 13244 | 13240 | +4.1 | 25–13174 | 54 ms | 0 |

Yorum: QUL kelime süreleri everyayah Mişari ile neredeyse aynı kayıttır. Hafızyol katmanı kelime sınırını enerji vadisine **15–56 ms** çeker; harf içi med/şedde tecvid ağırlığı + yerel vadi. Interpolasyon yok; ok glif altına atlar.

## 6. Mishari harf-ok örnekleri (Fatiha 1:1)

Wasla (`ٱ`) atlandı.

### Hafızyol (varsayılan)

| Kelime | Harf | Pencere (ms) |
|---|---|---|
| بِسْمِ | ب | 35–260 |
| | س | 260–390 |
| | م | 390–600 |
| ٱللَّهِ | ل | 600–840 |
| | لّ | 840–1220 |
| | ه | 1220–1480 |
| ٱلرَّحْمَـٰنِ | ل | 1480–1640 |
| | رّ | 1640–2000 |
| | ح | 2000–2220 |
| | م | 2220–2360 |
| | ن | 2360–2570 |
| ٱلرَّحِيمِ | ل | 2570–3000 |
| | رّ | 3000–3900 |
| | ح | 3900–4380 |
| | ي (med) | 4380–5550 |
| | م | 5550–6017 |

### quran.com / QUL (kıyas, tecvid bölüşümü)

ب 0–204 · س 204–376 · م 376–580 · لّ 795–1194 · ي 4227–5392 · م 5392–5840.

1:2 / 1:3: QUL kelime çapasından tecvid bölüşümü; Hafızyol aynı kelimeleri PCM vadisine çeker (ort. 24–40 ms).