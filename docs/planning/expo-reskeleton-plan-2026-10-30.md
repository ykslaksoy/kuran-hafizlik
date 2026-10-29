# Expo Router — 60 ekran iskelet taslağı (2026-10-30)

**Durum:** Planlama belgesi yalnızca Project store’da. **`app/` kodu repo’ya Yüksel onayı olmadan commit edilmez.**  
**Kaynak envanteri:** [`SOURCE_RECOVERY.md`](https://github.com/ykslaksoy/kuran-hafizlik/blob/cursor/w569-sade2-restored-9fed/SOURCE_RECOVERY.md) § Expo Router ekranları (60).  
**Zip yoksa:** Aşağıdaki «Zip’siz yeniden yazım» sütunu — **Evet** = bundle’dan güvenilir geri yazım mümkün değil; **Kısmi** = mevcut `dist/` + patch ile geçici; **Hayır** = zip gelince mostly restore.

**Öncelik:** **P0** = mushaf + ses/ok + shell; **P1** = Yüksel audit modülleri (Çalış, Öğren, Vakitler, Pusula, Plan, Analiz, Çocuk, Müezzin, İmam, Veli/Hoca, Ayarlar, Hat, şartlar); **P2** = sosyal, yönetici, ek modüller.

---

## Özet

| Öncelik | Ekran sayısı | Zip’siz tam rewrite |
|---------|--------------|---------------------|
| P0 | 4 | Zorunlu (zip veya yıllar süren reverse) |
| P1 | 48 | Evet (çoğu) |
| P2 | 8 | Evet |

**Öneri sırası (zip gelirse):** `_layout` → `index` → `kuran` → `ayarlar` → `calis` / `ogren` → vakit/pusula/plan/analiz → çocuk/müezzin/namaz-hocasi → guardian/hesap.

---

## Kök ve shell (19)

| # | Dosya | Route | Amaç | Bağımlılıklar | P | Zip’siz rewrite |
|---|--------|-------|------|---------------|---|-----------------|
| 1 | `app/_layout.tsx` | (shell) | Root layout, font, paket guard, onboarding gate | expo-router, AsyncStorage onboarding, APP_PACKAGES | P0 | Evet |
| 2 | `app/index.tsx` | `/` | Ana hub / launch hedefi | user progress, appearance settings | P0 | Evet |
| 3 | `app/kuran.tsx` | `/kuran` | Mushaf okuyucu, mod parametreleri | MushafReader, QCF/dist overlay, audio, timing | P0 | Kısmi (dist mushaf var) |
| 4 | `app/ayarlar.tsx` | `/ayarlar` | Ayarlar, mushaf edition, tema, legal | settings hooks, legal-links | P1 | Evet |
| 5 | `app/calis.tsx` | `/calis` | Çalışma modu launcher + modül | StudyModeLauncher, FASIKUL | P1 | Evet |
| 6 | `app/bugun.tsx` | `/bugun` | Günlük plan / görevler | useUserProgress, plan | P1 | Evet |
| 7 | `app/plan.tsx` | `/plan` | Hafızlık planı | PLAN_TEMPLATES, progress | P1 | Evet |
| 8 | `app/analiz.tsx` | `/analiz` | İstatistik, seri, haftalık rapor | sessions, mistake history | P1 | Evet |
| 9 | `app/ogren/_layout.tsx` | `/ogren/*` | Öğren stack layout | ogren modül | P1 | Evet |
| 10 | `app/ogren/index.tsx` | `/ogren` | Öğren hub | elifba path, modules | P1 | Evet |
| 11 | `app/vakitler.tsx` | `/vakitler` | Namaz vakitleri | konum, prayer backgrounds | P1 | Evet |
| 12 | `app/pusula.tsx` | `/pusula` | Kıble pusulası | sensors / web fallback | P1 | Evet |
| 13 | `app/imsakiye.tsx` | `/imsakiye` | İmsakiye / takvim | vakit API veya local | P1 | Evet |
| 14 | `app/hedef-ezber.tsx` | `/hedef-ezber` | Hedef sure listesi → kuran | hedef ezber catalog | P1 | Evet |
| 15 | `app/ezber-manzara.tsx` | `/ezber-manzara` | Ezber manzara / interval UI | ezber settings | P1 | Evet |
| 16 | `app/ses-tanima.tsx` | `/ses-tanima` | STT test / ayar | speech recognition | P1 | Evet |
| 17 | `app/ai.tsx` | `/ai` | AI koç özellik listesi | STT, mistakes | P1 | Evet |
| 18 | `app/student-profiles.tsx` | `/student-profiles` | Öğrenci profilleri | profiles store | P1 | Evet |
| 19 | `app/tumu.tsx` | `/tumu` | Tüm modüller listesi | FASIKUL_MODULLER | P2 | Evet |
| 20 | `app/sosyal.tsx` | `/sosyal` | Sosyal (gelecek) | feature flags | P2 | Evet |
| 21 | `app/yonetici.tsx` | `/yonetici` | Yönetici panel giriş | role session | P2 | Evet |

*(Not: ogren alt ekranları ayrı tabloda — kök sayım 21 dosya; toplam 60’a alt rotalarla tamamlanır.)*

---

## Öğren (`app/ogren/`) — 5 dosya (layout index sayıldı)

| # | Dosya | Route | Amaç | Bağımlılıklar | P | Zip’siz rewrite |
|---|--------|-------|------|---------------|---|-----------------|
| 22 | `app/ogren/amma.tsx` | `/ogren/amma` | Amme cüzü dersi | lesson graph | P1 | Evet |
| 23 | `app/ogren/mahrec.tsx` | `/ogren/mahrec` | Mahreç dersleri | tajweed | P1 | Evet |
| 24 | `app/ogren/seviye.tsx` | `/ogren/seviye` | Seviye seçimi | XP / hearts | P1 | Evet |
| 25 | `app/ogren/lesson/[nodeId].tsx` | `/ogren/lesson/:nodeId` | Tek ders düğümü | elifba content | P1 | Evet |

---

## Çocuk ezber (5)

| # | Dosya | Route | Amaç | Bağımlılıklar | P | Zip’siz rewrite |
|---|--------|-------|------|---------------|---|-----------------|
| 26 | `app/cocuk-ezber/_layout.tsx` | stack | Çocuk ezber layout | — | P1 | Evet |
| 27 | `app/cocuk-ezber/index.tsx` | `/cocuk-ezber` | Liste / hub | cocuk ezber store | P1 | Evet |
| 28 | `app/cocuk-ezber/baslangic.tsx` | `/cocuk-ezber/baslangic` | Başlangıç seviye | → kuran mode | P1 | Evet |
| 29 | `app/cocuk-ezber/orta.tsx` | `/cocuk-ezber/orta` | Orta seviye | → kuran | P1 | Evet |
| 30 | `app/cocuk-ezber/ileri.tsx` | `/cocuk-ezber/ileri` | İleri seviye | → kuran | P1 | Evet |

---

## Çocuk namaz (3)

| # | Dosya | Route | Amaç | Bağımlılıklar | P | Zip’siz rewrite |
|---|--------|-------|------|---------------|---|-----------------|
| 31 | `app/cocuk-namaz/_layout.tsx` | stack | Layout | — | P1 | Evet |
| 32 | `app/cocuk-namaz/index.tsx` | `/cocuk-namaz` | Dua/sure listesi | cocuk namaz store | P1 | Evet |
| 33 | `app/cocuk-namaz/[id].tsx` | `/cocuk-namaz/:id` | Pratik ekranı | ezber flow, TTS | P1 | Evet |

---

## E-hafızlık (3)

| # | Dosya | Route | Amaç | Bağımlılıklar | P | Zip’siz rewrite |
|---|--------|-------|------|---------------|---|-----------------|
| 34 | `app/e-hafizlik/_layout.tsx` | stack | Layout | — | P2 | Evet |
| 35 | `app/e-hafizlik/index.tsx` | `/e-hafizlik` | Katalog | e-hafizlik content | P2 | Evet |
| 36 | `app/e-hafizlik/[id].tsx` | `/e-hafizlik/:id` | Ders detay | — | P2 | Evet |

---

## Ekstra namaz sureleri (2)

| # | Dosya | Route | Amaç | Bağımlılıklar | P | Zip’siz rewrite |
|---|--------|-------|------|---------------|---|-----------------|
| 37 | `app/ekstra-namaz-sureleri/_layout.tsx` | stack | Layout | — | P1 | Evet |
| 38 | `app/ekstra-namaz-sureleri/index.tsx` | `/ekstra-namaz-sureleri` | Sure listesi → kuran | ekstra store | P1 | Evet |

---

## Guardian — Veli/Hoca (5)

| # | Dosya | Route | Amaç | Bağımlılıklar | P | Zip’siz rewrite |
|---|--------|-------|------|---------------|---|-----------------|
| 39 | `app/guardian-panel.tsx` | `/guardian-panel` | Veli ana panel | guardian package | P1 | Evet |
| 40 | `app/guardian-ogrenciler.tsx` | `/guardian-ogrenciler` | Öğrenci listesi | profiles | P1 | Evet |
| 41 | `app/guardian-odevler.tsx` | `/guardian-odevler` | Ödev takibi | assignments | P1 | Evet |
| 42 | `app/guardian-raporlar.tsx` | `/guardian-raporlar` | Raporlar | analytics | P1 | Evet |
| 43 | `app/guardian-canli-ders.tsx` | `/guardian-canli-ders` | Canlı ders | realtime (?) | P1 | Evet |

---

## Hesap / rol kayıt (8)

| # | Dosya | Route | Amaç | Bağımlılıklar | P | Zip’siz rewrite |
|---|--------|-------|------|---------------|---|-----------------|
| 44 | `app/hesap/_layout.tsx` | stack | Hesap layout | — | P1 | Evet |
| 45 | `app/hesap/index.tsx` | `/hesap` | Hesap hub | auth local demo | P1 | Evet |
| 46 | `app/hesap/giris.tsx` | `/hesap/giris` | Giriş / kayıt | terms notice | P1 | Evet |
| 47 | `app/hesap/hoca.tsx` | `/hesap/hoca` | Hoca kayıt | role meta | P1 | Evet |
| 48 | `app/hesap/veli-anne.tsx` | `/hesap/veli-anne` | Veli (anne) | — | P1 | Evet |
| 49 | `app/hesap/veli-baba.tsx` | `/hesap/veli-baba` | Veli (baba) | — | P1 | Evet |
| 50 | `app/hesap/yardimci-hoca.tsx` | `/hesap/yardimci-hoca` | Yardımcı hoca | — | P1 | Evet |
| 51 | `app/hesap/yonetici.tsx` | `/hesap/yonetici` | Yönetici hesap | — | P2 | Evet |

---

## Müezzin (5)

| # | Dosya | Route | Amaç | Bağımlılıklar | P | Zip’siz rewrite |
|---|--------|-------|------|---------------|---|-----------------|
| 52 | `app/muezzin/_layout.tsx` | stack | Layout | — | P1 | Evet |
| 53 | `app/muezzin/index.tsx` | `/muezzin` | Müezzin hub | muezzin module | P1 | Evet |
| 54 | `app/muezzin/muezzin.tsx` | `/muezzin/muezzin` | Ezan pratiği | audio | P1 | Evet |
| 55 | `app/muezzin/usta.tsx` | `/muezzin/usta` | Usta seviye | — | P1 | Evet |
| 56 | `app/muezzin/pratik/[id].tsx` | `/muezzin/pratik/:id` | Tek pratik | — | P1 | Evet |

---

## Namaz hocası / İmam (4)

| # | Dosya | Route | Amaç | Bağımlılıklar | P | Zip’siz rewrite |
|---|--------|-------|------|---------------|---|-----------------|
| 57 | `app/namaz-hocasi/_layout.tsx` | stack | Layout | — | P1 | Evet |
| 58 | `app/namaz-hocasi/index.tsx` | `/namaz-hocasi` | Namaz hocası hub | (web `/imam` alias?) | P1 | Evet |
| 59 | `app/namaz-hocasi/imam.tsx` | `/namaz-hocasi/imam` | İmam rehberi | — | P1 | Evet |
| 60 | `app/namaz-hocasi/bas-imam.tsx` | `/namaz-hocasi/bas-imam` | Baş imam modu | — | P1 | Evet |

---

## P0 derinlemesine (zip olmadan en riskli)

| Ekran | Neden P0 | Dist’te geçici |
|--------|----------|----------------|
| `kuran.tsx` / MushafReader | Ses+ok, Hat çift yazı, deep link query | `qcf-mushaf.js`, `hy-player.js`, `quran-timing.js` |
| `_layout.tsx` | Onboarding her URL’de aynı açılış (audit **Hatalı**) | Deep Link QA: `serve.js` + hash/path bootstrap |
| `index.tsx` | Launch / hub routing | — |
| Ses pipeline | Tam Kur'an timing | Fatiha JSON only |

**Sonuç:** Zip olmadan **60/60 ekran için tam rewrite gerekir** (Evet); mushaf **davranışının ~%40’ı** dist patch ile sürdürülebilir, geri kalan **React ekran mantığı** zip veya reskeleton şart.

---

## Onay kapısı (Yüksel)

1. Zip yüklendi → `app/` commit dalı (`cursor/source-recovery-*`), EAS/export yenileme.  
2. Zip yok → yalnızca store plan + dist patch PR’ları (#21/#22); **main merge yok**.  
3. İlk kod commit: P0 `_layout` + `kuran` iskeleti onayı sonrası.

**İlgili:** [`source-recovery-2026-10-30.md`](./source-recovery-2026-10-30.md) · [`app-audit-2026-10-30.md`](./app-audit-2026-10-30.md)
