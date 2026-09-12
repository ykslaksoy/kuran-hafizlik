# Hafız Yol (`hafizyol`)

Kur’an öğrenme ve hafızlık uygulaması — Android, iOS ve web (PWA).

Canlı: https://hafizyol.vercel.app

## Bu repoda ne var?

`dist/` içinde **2026-09-06** tarihli Expo web export’unun birebir kopyası var (`expo export --platform web`). Bu ağaç `npm start` ile yerelde açılır ve Vercel’de statik site olarak yayınlanabilir.

Amentü (Çocuk Namaz) **Mishary Rashid Alafasy** kaydı çalar (`dist/assets/audio/amentu-mishari-v1.mp3`: Bakara 285 + Âl-i İmrân 8, EveryAyah). Kur’an tilavet varsayılanı da Mişari (`alafasy`); ayarlardan değiştirilebilir.

**Orijinal Expo / TypeScript kaynağı bu ortamda bulunamadı.** `app/*.tsx` yok. Ayrıntı: [SOURCE_RECOVERY.md](./SOURCE_RECOVERY.md).

## Çalıştırma

```bash
npm start
# http://127.0.0.1:3000
```

Bağımlılık kurulumu (`npm install`) yalnızca kayıt içindir; web export’u sunmak için gerekmez.

## Vercel

`vercel.json` `dist/` klasörünü çıktı olarak verir. Connect Git sonrası production branch: `main`.

## Kaynak yükleme

Orijinal proje klasörünü (veya zip’i) bu reponun köküne koyun:

- `app/` (60 Expo Router ekranı)
- `package.json` / lockfile (orijinal)
- `app.json` / `app.config.ts`
- `assets/` kaynak dosyaları
- `tsconfig.json`, `babel.config.js`, `metro.config.js`, `eas.json`

Sonra `npx expo export --platform web` ile `dist/` yenilenebilir.
