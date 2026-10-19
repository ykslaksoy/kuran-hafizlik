# Ezan Vakti Pro — Mushaf okuyucu teknik analizi

**Tarih:** 2026-10-19  
**APK:** `com.mobilexsoft.ezanvakti` (Ezan Vakti Pro / Azan Time Pro), sürüm **9.5.7-ps** (versionCode 736)  
**Kaynak:** APKPure üzerinden `apkeep` ile indirilen XAPK; `jadx` 1.5.1 + `apktool` 2.9.3 ile statik analiz  
**Not:** Eski `com.ezanvakti` paketi ayrı bir projedir; güncel uygulama **`com.mobilexsoft.ezanvakti`**.

---

## 1. Yöntem

1. `apkeep -a com.mobilexsoft.ezanvakti -d apk-pure` ile XAPK indirildi (~103 MB).
2. Base APK jadx ile decompile edildi; Kuran UI `ar.s` / `ar.c3` fragment’leri, ses `com.mobilexsoft.sesservisi.KuranService`, veri `hr.f` (`ResourceHelper`) üzerinden izlendi.
3. CDN’den doğrulanan paketler açıldı:
   - `https://download.ezanvaktipro.com/kuran/v4/quranv4.zip` → `quran.db3` (zip şifresi: Base64(`quranv4.zip`) = `cXVyYW52NC56aXA=`)
   - `https://download.ezanvaktipro.com/sesler/tables/{reciter}.zip` → `audioparts` SQL (zip şifresi: Base64(`{reciter}.zip`))
   - `https://download.ezanvaktipro.com/kuran/positionsV21.zip` → `positions.db_` (zip şifresi: `fsq_secret` string kaynağı)
   - `https://download.ezanvaktipro.com/kuran/v4/720.zip` → sayfa PNG’leri (şifre: Base64(`720.zip`))

Referans dosyalar: [`docs/rakip/ezanvakti/`](ezanvakti/).

---

## 2. Okuyucu mimarisi (özet)

| Katman | Davranış |
|--------|----------|
| **Varsayılan görünüm** | `SharedPreferences` `textmode=true` → **metin (Mushaf düzeni)** |
| **Sayfa görünümü** | `textmode=false` → ViewPager ile **604 sayfa** PNG (veya API 26+ **SVG** paketi) |
| **Sayfa oranı** | Mushaf alanı yüksekliği **15 satıra** bölünür: `lineHeight = pageHeight / 15.0f` (`ar.s.e1`) |
| **En-boy** | Portrede yaklaşık **0.6213768** (Medine mushaf oranı) |
| **Aktif ayet** | Ses çalarken `AYET_DEGISTI` broadcast + `KuranService` Handler ile ayet/part geçişi |
| **Oklu takip** | Sadece **hafız 5 ve 19** + `positions.db_` varsa; `ImageView @id/arrow` satır/kelime konumuna animasyonla taşınır |

Play Store’daki “MushafActivity” adı analitik/navigasyon string’i; asıl Kuran ekranı `com.mobilexsoft.ezanvakti.kuran.CepMainActivity` ve `ar.s` fragment’idir.

---

## 3. Sayfa düzeni: görsel vs metin

### 3.1 Sayfa görünümü (görsel Mushaf)

- **604** sayfa (`ViewPager` max progress, dosya varlığı kontrolü `604.png`).
- PNG paketleri ekran genişliğine göre indirilir (`cr.d`):
  - `< 480px` → `320.zip`
  - `< 720px` → `480.zip`
  - `< 1080px` → `720.zip`
  - `< 1440px` → `1080.zip`
  - `< 1920px` → `1440.zip`
  - aksi → `1920.zip`
- **URL örüntüsü:** `https://download.ezanvaktipro.com/kuran/v4/{320|480|720|1080|1440|1920}.zip`
- Açılan zip içinde `1.png` … `604.png`; cihazda `getExternalFilesDir("png")` veya dahili `files/png/`.
- **API 26+** ve PNG yoksa: `https://download.ezanvaktipro.com/kuran/v4/svg.zip` → vektör sayfa katmanı.
- Örnek sayfa: [`mushaf-page-001.png`](ezanvakti/mushaf-page-001.png).

### 3.2 Metin görünümü (sabit hat / 15 satır)

- Ayet metni `quran.db3` → `ayetler.Text` (Uthmani).
- **Fontlar** (`kuranfont` ayarı): `maviaykuran`, `q`, `ag`, `kk` (`res/font/`).
- **Hat seçimi** (`kuranscript`): 0–3 (radio; Medine / alternatif hatlar).
- Satır yüksekliği ekran Mushaf alanına göre **tam 15 satır** grid’ine oturtulur.
- Ayet konumu sayfada `ayetler` alanlarıyla normalize edilir:
  - `Sira` / `SiraSayisi` → kaç satır kapladığı
  - `StartOffset` / `EndOffset` → satır içi yatay oran (0–1)
  - `Sayfa`, `Sure`, `Ayet`, `Cuz`, `Hizb`

---

## 4. Aktif ayet vurgusu (renk)

| Kullanım | Hex | Not |
|----------|-----|-----|
| Sayfa üstü seçim overlay | **`#8097FF0A`** | `TextView` arka plan; `setAlpha(0.3f)` |
| Metin modu `BackgroundColorSpan` | **`#2097FF0A`** | Aktif ayet metni |
| Layout placeholder (geliştirme) | `#806caae3` | `kuran_tekli_cep.xml` satır şablonları |
| Secde işareti | `#f70202` üzerine ayrı arka plan | `ar.s.w0` |

Görsel özet: [`highlight-swatches.svg`](ezanvakti/highlight-swatches.svg).

Sayfa modunda overlay, ayetin `StartOffset`/`EndOffset` ve `SiraSayisi` değerlerine göre **ilk / ara / son satır** `TextView` bloklarıyla çizilir (`ar.s.t0`, `s0`).

---

## 5. Yeşil üçgen ok (oklu takip)

- Layout: `kuran_tekli_cep.xml` → `@id/arrow` (24×15 dp), başlangıçta `gone`.
- **Destek:** `hr.f.R()` → hafız **5** (Abdül Basit) veya **19** (Davut Kaya) ve `positions.db_` mevcut.
- Türkçe hafız listesinde “(Takipli)” etiketi: Saad Al Ghamdi (6) timing zip’i var; ok takibi DB’si **positions5 / positions19** tablolarıyla sınırlı.
- Konumlandırma (`ar.s.i1`):
  - `fr.j` kayıtları: `row` (0 tabanlı satır), `g()` / `b()` yatay oranlar, `duration` (ms).
  - `arrow.setY((row + 1) * lineHeight - lineHeight/4)`
  - `arrow.setX(...)` kelime başlangıç/bitiş oranından; gerekirse `ObjectAnimator` `TranslationX`.
- Ses pozisyonu: `MediaPlayer.getCurrentPosition()` ile `J0.p()` listesindeki segment süreleri karşılaştırılır (`ar.s` iç `A0()`).
- Animasyon kapalıysa (`animator_duration_scale == 0`) oklu takip devre dışı; toast: *“Cihaz animasyon ayarları kapalı olduğundan oklu takip yapılamamaktadır.”*

### positions.db_ şeması (oklu takip)

`https://download.ezanvaktipro.com/kuran/positionsV21.zip` → `positions.db_`

- `version` (ör. `2`)
- `positions5`, `positions19` tabloları:

| Kolon | Anlam |
|-------|--------|
| `ayetid` | `ayetler.Id` |
| `page` | Sayfa indeksi |
| `startoffset`, `endoffset` | Satır üzerinde yatay oran |
| `duration` | Segment süresi (ms) |
| `row` | 15 satırlık grid satırı |
| `no`, `location`, `lenght` | Kelime/offset metadata |

Örnek CSV: [`positions5-ayet-1001-sample.csv`](ezanvakti/positions5-ayet-1001-sample.csv).

---

## 6. Ses senkronizasyonu

### 6.1 Ayet / part zamanları (`audioparts`)

SQLite (`quran.db3`):

```sql
CREATE TABLE audioparts(
  surah INT, verse INT, reciter INT, part INT, time REAL
);
```

- `time`: ilgili **MP3 part dosyası içinde** ayet başlangıcının **saniye** cinsinden offset’i.
- `hr.f.s(verse, surah)` bu satırı okur; `time * 1000` (veya hafız &lt; 9 için ölçek) → `fr.a` başlangıç ms.
- `KuranService` Handler (mesaj `0`): `getCurrentPosition()` ≥ segment bitişi → `seekTo` sonraki ayet/part veya sonraki dosya.

Per-hafız güncelleme paketi:

- **URL:** `https://download.ezanvaktipro.com/sesler/tables/{reciter}.zip`
- Zip içi: `{reciter}.sql` → `DELETE` + `INSERT INTO audioparts ...`
- Örnek: [`audioparts-reciter6-sample.sql`](ezanvakti/audioparts-reciter6-sample.sql) (Saad Al Ghamdi, reciter=6).

### 6.2 MP3 dosya adları

**Yerel oynatma** (`KuranService`):

```text
{surah}-{verse}-{part}.mp3
```

Örnek: `1-1-1.mp3` (Fatiha 1, part 1).

**CDN indirme** (`KuranDownloadService`):

```text
https://download.ezanvaktipro.com/sesler/{reciter>8 ? reciter+"/" : ""}{reciter}_{surah%03d}-{part%02d|%03d}.mp3
```

- Hafız **19** (Davut Kaya) için part numarası **%03d** formatında.
- Önizleme URL örneği: `.../sesler/5_001-01.mp3` veya `.../sesler/9/9_001-01.mp3`.

### 6.3 Hafız listesi (kaynak: `res/values-tr/arrays.xml` → `hafizlar`)

| ID | İsim (TR) | Oklu takip / timing notu |
|----|-----------|---------------------------|
| 1 | Husayri | |
| 2 | Mishary Al-Alfasy | |
| 3 | Sudais Shraim | |
| 4 | AbuBakr Ash-Shatree | |
| 5 | Abdul Basit Abdul Samet | **Oklu takip** (`positions5`) |
| 6 | Saad Al Ghamdi (Takipli) | `tables/6.zip` doğrulandı |
| 7–18 | … | |
| 19 | Davut Kaya (Takipli) | **Oklu takip** (`positions19`) |
| 20 | Abdurrahman Al Ussi | |

Varsayılan hafız: `reciter=5` (`SharedPreferences`).

### 6.4 CDN kökleri (`vr.x1`)

| Fonksiyon | URL |
|-----------|-----|
| `h()` | `https://download.ezanvaktipro.com` |
| `i()` | `https://multimedia.ezanvaktipro.com` |
| Kuran DB / sayfalar | `{h()}/kuran/v4/...` |
| Ses / timing | `{h()}/sesler/...` |

Uygulama içi SQL yamaları: `assets/update_kuran.sql` (`ayetler` offset + `audioparts` düzeltmeleri).

---

## 7. Hafızyol için kopyalama önerisi

1. **Sabit metin + 15 satır grid**  
   - Sayfa yüksekliğini **15’e böl**; ayet kutularını `StartOffset`/`EndOffset`/`SiraSayisi` ile yerleştir (Ezan Vakti `quran.db3` ile aynı model veya eşdeğer JSON).

2. **Aktif ayet rengi**  
   - Metin: `#2097FF0A` arka plan span.  
   - Mushaf overlay: `#8097FF0A` ve **%30 alpha** (veya doğrudan ARGB ile eşdeğer görünüm).

3. **Üçgen ok**  
   - Sol kenarda 24×15 dp civarı ikon; `row` + yatay `startoffset`/`endoffset` ile konum.  
   - Ses tarafta: ayet başına `duration` ms listesi (`positions5` benzeri) + part başlangıçları (`audioparts.time`).

4. **Ses pipeline**  
   - Tek `MediaPlayer`; Handler ile `currentPosition` polling.  
   - Part sınırında `seekTo`; ayet değişiminde broadcast/UI güncelleme.

5. **Veri paketleri**  
   - Mushaf sayfaları: 604 PNG (veya vektör).  
   - Timing: hafız bazlı SQL/JSON (`surah`, `verse`, `part`, `time`).  
   - Oklu takip: ayet içi kelime/satır segmentleri (`row`, `startoffset`, `endoffset`, `duration`).

---

## 8. Sınırlamalar

- Analiz **9.5.7-ps** APK’sına dayanır; CDN içerikleri zamanla güncellenir.
- `positions` ve `audioparts` zip’leri şifrelidir; şifreler uygulama kaynaklarından türetilir (bu dokümanda özetlendi).
- Ok drawable kaynağı layout’ta `@null`; runtime’da kodla besleniyor olabilir — konum matematiği yukarıdaki smali/Java ile doğrulandı.

---

## 9. Eski paket (`com.ezanvakti`)

GitHub’daki [furkantektas/EzanVakti](https://github.com/furkantektas/EzanVakti) istemcisi `com.ezanvakti` Play linkine referans verir; **güncel Ezan Vakti Pro** ile aynı kod tabanı değildir. Bu rapor **`com.mobilexsoft.ezanvakti`** için geçerlidir.
