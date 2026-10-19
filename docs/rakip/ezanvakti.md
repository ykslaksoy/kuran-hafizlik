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

---

## 5.1 Harf takibi — ok neyle sürülüyor?

**Kullanıcı algısı:** Ok, kâri o harfi okuduğu anda ilgili harfin altına geliyor.  
**Kod gerçeği:** Uygulama çalışma anında **konuşma tanıma, akustik eşleme veya ses spektrumu analizi yapmıyor**. Ok konumu, oynatıcıdaki **zaman çizelgesi** ile `positions.db_` içindeki **önceden üretilmiş** segment listesinin eşleştirilmesiyle ilerliyor.

### (a) Ses analizi / ML?

`ar`, `hr`, `fr`, `com.mobilexsoft.sesservisi` paketlerinde Kuran okuyucu yolunda şu API’lere **rastlanmadı** (jadx taraması): `AudioRecord`, `Visualizer`, `SpeechRecognizer`, TensorFlow Lite / `Interpreter`, ONNX.

Ses tarafı yalnızca `MediaPlayer` + `KuranService` içindeki `Handler`: `getCurrentPosition()` ile `audioparts` / segment bitiş zamanlarına göre `seekTo` ve mesaj `0` yeniden planlama (`sendEmptyMessageDelayed` / `sendEmptyMessageAtTime`). Bu, **dosya içi zaman damgası** senkronu; canlı harf tanıma değil.

### (b) `positions` verisi — cevap burada

Her kâri için tablo adı: **`positions` + `reciter` id** (`hr.f.d`):

```java
// hr/f.smali — tablo seçimi
new StringBuilder().append("positions").append(this.f83562b).toString();
// örnek: positions5, positions19
```

`ayetid = {fr.c.d()}` ile satırlar `no` sırasına göre okunur; `fr.j` (`Takip`) listesi `fr.c.Q(...)` → **`p()`** (sayfa/ok modu) ve metin modunda ek olarak **`e()`** (kelime/harf vurgusu).

| `fr.j` alanı | Kaynak kolon | Anlam (kod) |
|--------------|--------------|-------------|
| `e()` | `row` → `14 - row` | 15 satırlık Mushaf grid satırı (0 tabanlı) |
| `g()`, `b()` | `startoffset`, `endoffset` | **Piksel değil** — satır genişliğine çarpılan **yatay oran** (0–1); `× (2·n+o+m) / ayetId` (`n=1000`, `o=10`, `m=2`) |
| `a()` | `duration` | Segment süresi **ms**; `duration / ayetId × n`; 0 ise `0.001` |
| `d()` | (kümülatif) | Önceki segmentlerin `a()` toplamı — ayet içi **başlangıç offset ms** |
| `f()`, `c()` | `location`, `lenght` | `ayetler.Text` üzerinde **Java `String` karakter indeksi** ve uzunluk; `/(Sayfa+1)` ve `/(2n+2o−m)` ölçekleri (`hr.f.d` smali) |

`startoffset` / `endoffset` **harf indeksi değil**; sayfa PNG modunda okun X konumu için kullanılır. Metin modunda ok **glif konumu** `F0(TextView, l()+f(), c())` ile `Layout.getPrimaryHorizontal` / `measureText` üzerinden hesaplanır (`ar.s.j1` smali).

### Zamanlama: “harfe zaman atama” yok, segment bitişi var

Aktif segment indeksi `f24736n2`. Kalan animasyon süresi `A0()`:

```java
// ar.s — jadx decompile (CepBaseFragment)
    public final long A0() {
        long j11 = 0;
        if (this.f24736n2 == 0) {
            this.f24745q2 = this.f24749s0.s(this.J0.o(), this.J0.n());
            try {
                long currentPosition = this.f24761w1.getCurrentPosition() - this.f24745q2.b();
                for (int i11 = 0; i11 < this.J0.p().size() && currentPosition > this.J0.p().get(i11).a() + this.J0.p().get(i11).d(); i11++) {
                    this.f24736n2++;
                }
                // ...
                return (long) (((this.J0.p().get(this.f24736n2).a() - (currentPosition - this.J0.p().get(this.f24736n2).d())) - 100) / this.f24738o1);
            } catch (Exception e11) {
                e11.printStackTrace();
            }
        } else {
            try {
                j11 = (long) (this.J0.p().get(this.f24736n2).a() / this.f24738o1);
                return j11 - ((long) (((this.f24761w1.getCurrentPosition() - this.f24745q2.b()) - this.J0.p().get(this.f24736n2).d()) / this.f24738o1));
            } catch (Exception e12) {
                e12.printStackTrace();
            }
        }
        return j11;
    }
```

- `f24745q2`: `audioparts` ile ayetin MP3 içi başlangıcı (`hr.f.s`).
- `f24738o1`: oynatma hızı.
- İlk segmentte gecikme varsa `A0() < 1` → indeks atlanır (`i1` / `j1` / `l1` içinde `f24736n2++`).
- Segment bittiğinde `onAnimationEnd` → `f24736n2++` → bir sonraki harf/segment (`ar.s` iç sınıflar `c`, `e`).

**Özet:** Zaman, cihazda hesaplanan bir “harf başı timestamp tablosu” değil; **veritabanındaki `duration` + kümülatif `d()`** ile MP3 pozisyonu karşılaştırılıyor. Davranış “okunduğu anda” görünür çünkü `duration` değerleri o kârin ses kaydına **offline hizalanmış**.

### Ok hareketi — metin modu (`j1`)

`M1 == true` (oklu takip açık) ve liste `J0.p()`:

1. `A0()` → `ObjectAnimator` süresi (ms).
2. `jVar.f()` / `jVar.c()` → ayet metninde karakter aralığı.
3. `F0(textView, J0.l() + f, c)` → ekran X/Y.
4. `arrow.setY` / `setX`, sonra `TranslationX` animasyonu; bitişte `j1` tekrar çağrılır.

Sayfa PNG modu aynı zaman mantığını `i1()` ile `row` + `g()`/`b()` oranlarına uygular (`ObjectAnimator` `TranslationX`).

Handler `Z1`: mesaj `50` (`0x32`) — ok görünürlüğü; gecikme **2000 ms** (`0x7d0`). Bu, harf senkron periyodu değil; segment süresi animatörden gelir.

### `positions5` örnek satırları (ayet `Id=1001`, Fatiha 1)

Ham CSV: [`positions5-ayet-1001-sample.csv`](ezanvakti/positions5-ayet-1001-sample.csv). Ayet metni 37 karakter (`بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّح۪يمِ`); tabloda **6 segment** (`no` 0…5).

| no | duration (ham) | row | location → f() | lenght → c() | Metin dilimi (önceki ölçekleme) |
|----|----------------|-----|----------------|--------------|----------------------------------|
| 0 | 414.06… | 12 → UI satır 2 | 0 → 0 | 8072 → 4 | `بِسْ` |
| 1 | 259.99… | 12 | 8072 → 4 | 4036 → 2 | `مِ` |
| 2 | 747.10… | 12 | 14126 → 7 | 14126 → 7 | `اللّٰهِ` |
| 3 | 1022.06… | 12 | … | … | `الرَّحْمٰنِ` (devam) |
| 4–5 | … | 12 | … | … | kalan heceler |

`location`/`lenght` ham değerleri büyük tamsayılar; yüklemede `Sayfa` (bu ayet için 0) ve sabit `2018` böleniyle **Unicode birim indeksine** indirgenir. Segment her zaman tek harf değil; gerekirse kelime `split(" ")` ile alt parçalara bölünür ve `duration` karakter sayısı oranında dağıtılır (`hr.f.d` smali, `textmode` / `f83576p`).

### (c) Diğer bileşenler

- **`audioparts`:** Ayetin hangi MP3 part’ında ve kaçıncı ms’den başladığı (`fr.a` / `f24745q2`). Oklu takip için yeterli değil; segment listesi şart.
- **`quran.db3` `ayetler.Text`:** `location`/`lenght` eşlemesi için zorunlu.

### Manuel kayıt hipotezi (dinleyip oku harf harf ilerletme)

**Hipotez:** Davut Kaya (`positions19`) verisi, bir editörün sesi dinleyerek oku elle kaydırmasıyla üretilmiş; bu yüzden yalnızca onda ~%98 doğruluk.

**Sonuç: veri ve istemci kodu bu hipotezi desteklemiyor; eldeki kanıt otomatik (sunucu tarafı) hizalama + paylaşılan metin geometrisi ile uyumlu.** Kesin üretim aracı APK’da yok; aşağıdaki negatif/ pozitif bulgular `positionsV21.zip` içindeki `positions.db_` üzerinde (version=2).

#### İstemci: kayıt / editör yok

| Bulgu | Kaynak |
|--------|--------|
| `positions.db_` yalnızca CDN’den indirilir, zip açılır | `UpdateKuranService` → `positionsV21.zip` + `fsq_secret` |
| SQLite helper şeması boş; uygulama `INSERT`/`UPDATE positions*` yapmıyor | `dr.d` (`TakipVT`) `onCreate`/`onUpgrade` boş; `hr.f.d` yalnızca `SELECT` |
| Kuran UI’da ok konumu yazan ekran / “kaydet” akışı yok | `ar.s` / `c3` yalnızca okuma + animasyon |

Yani **manuel kayıt bu APK sürümünde yapılmıyor**; varsa üretim sunucu veya harici araçta.

#### Kâri bazlı tablolar

`positions5` (~95 440 satır) ve `positions19` (~90 672 satır) ayrı tablolar — bu, **kâri özel ses süreleri** için beklenen yapı; tek başına manuel kayıt kanıtı değil.

#### Veri izleri: otomatik hizalama

1. **`duration` kesirli ve rasyonel** — manuel tıklamada beklenen düz ms (500, 1200) yerine örnek: `410.9774603174603` ≈ `1294579/3150` ms; tüm tabloda tam sayı ms oranı **~0,1%**. Kesir paydalarda 7, 11, 13, 17, 19, 23 sık — tipik **örnek/saniye bölümü** artefaktı, insan reaksiyon süresi dağılımı değil.

2. **Aynı ayet, iki kâri: metin konumu paylaşılıyor, süre ayrışıyor** (Fatiha 1, `ayetid=1001`):

| no | `location` / `lenght` (5 = 19?) | `duration` pos5 | `duration` pos19 |
|----|----------------------------------|-----------------|------------------|
| 0 | 0 / 8072 — **aynı** | 414.06… | 410.98… |
| 1 | 8072 / 4036 — **aynı** | 259.99… | 182.45… |
| 2 | 14126 / 14126 — **aynı** | 747.10… | 1197.66… |
| 3 | 30270 / 22198 — **aynı** | 1022.06… | 1789.59… |
| 4 | **48432** vs **54486** / farklı `lenght` | 420.06… | 3532.60… |

İlk segmentlerde **`location`/`lenght` birebir aynı**, `duration` kâriden kâriye değişiyor. Bağımsız “dinle–ilerlet” oturumlarında metin indekslerinin bu kadar örtüşmesi beklenmez; **ortak segmentasyon + kâriye özel zaman** modeline uyuyor.

3. **`startoffset` aynı geometri, ince fark** — ör. seg 0: `0.004975149105367793` (5) vs `0.004975149105367804` (19); `endoffset` biraz ayrışır. Sayfa üzerindeki yatay oranlar **kâri sesine göre ince ayar** gibi, sıfırdan elle tıklama gibi değil.

4. **Kodlu `location` boşlukları** — `positions19` ayet 1001’de ardışık segmentler arasında **2018** birim boşluk; istemci böleni `2·1000 + 2·10 − 2 = 2018` (`hr.f.d`). Bu, ham alanların **sabit formülle** metin indeksine indirgenmesini gösterir.

5. **Segment sayısı kâriye göre değişir** — ~4512 ayette `positions5` vs `positions19` satır sayısı farklı (ör. 1001: 6 vs 5). Manuel tek şablon olsaydı sayılar daha sık özdeş kalırdı; fark, **ses hizalamasının segment sınırlarını kâride yeniden kesmesi** ile uyumlu.

6. **“Düzensiz insan” imzası zayıf** — `duration < 50 ms` satır **0**; ardışık özdeş `duration` en fazla **2** tekrar. Varyans ayet içinde yüksek olabilir (kısa hece + uzun kelime), bu **konuşma ritmi** ile uyumlu, düğme gecikmesi modeli ile zorunlu değil.

#### Davut’un ~%98 algısı neden?

Kodda Davut’a özel algoritma yok; yalnızca `positions19` + `reciter==19` + `R()`. Yüksek algı, **bu tablonun Davut sesine iyi hizalanmış olması** ve (kullanıcı gözlemi) metin modu + animasyon açık kullanım ile açıklanır. Abdul Basit (`positions5`) aynı mimariyle çalışır; Mishari’de tablo olmadığı için ok takibi hiç başlamaz.

**Özet:** Manuel dinle–kaydet hipotezi **çürütülmedi değil, desteklenmedi**; güçlü alternatif: **sunucuda üretilmiş `positions{N}` (metin/glif segmentleri + forced alignment / benzeri otomasyon)**. Davut verisi “özel insan kaydı” değil, **aynı üretim hattının `positions19` çıktısı** olarak değerlendirilmeli.

### Neden sadece hafız 5 ve 19?

```java
// hr.f — jadx decompile (ResourceHelper)
    public boolean R() {
        File databasePath = this.f83561a.getDatabasePath("positions.db_");
        int i11 = this.f83562b;
        if ((i11 != 5 && i11 != 19) || !databasePath.exists()) {
            return false;
        }
        // textmode + dil koşulu (V / j0)
        ...
    }
```

- Zip’te yalnızca **`positions5`** (Abdül Basit) ve **`positions19`** (Davut Kaya) tabloları var; `positions2` (Mishari) **yok**.
- Mishari (id **2**) için `hr.f.W(2)` yalnızca `audioparts` satır sayısı &gt; 6235 ile “takipli” timing zip’i olup olmadığını kontrol eder; **oklu harf DB’si bağlanmaz**.
- `c3` / `ar.s`: `R()` false veya `J0.p()` boş → `M1` açılmaz; ok hareketi çalışmaz.

### Hafızyol — Mishari için aynı davranış

Canlı ASR şart değil (Ezan Vakti de kullanmıyor). Gerekli veri:

1. **Mishari sesi** ile hizalı **`positions2`** (veya `positions{mishariId}`) tablosu: her ayet için `no`, `row`, `startoffset`, `endoffset`, `duration`, `location`, `lenght` — şema `positions5` ile aynı; değerler **Mishari MP3**’e göre üretilmeli (forced alignment / manuel annotation).
2. **`audioparts`** (reciter=2): ayet başları part içi saniye.
3. **`ayetler.Text`** + sayfa/satır metadata (`Sayfa`, `Sira`, …) — metin modu ok konumu için.
4. İsteğe bağlı: sayfa PNG modu için aynı `startoffset`/`endoffset`/`row` (Medine sayfa koordinat sistemi).

Üretim yolu: Mishari `surah-verse-part.mp3` + mevcut `audioparts` → otomatik alignment (Montreal Forced Aligner, Whisper timestamp, vb.) → `fr.j` alanlarına dönüştürüp SQLite’a yaz; istemci tarafında `A0()` + `j1`/`i1` mantığı birebir kopyalanabilir.

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
   - Konum: `location`/`lenght` + `Text` (metin) veya `row` + `startoffset`/`endoffset` (sayfa).  
   - Zaman: önceden hizalanmış `positions{N}` segment `duration` + `MediaPlayer.getCurrentPosition()` (canlı ASR yok).

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
