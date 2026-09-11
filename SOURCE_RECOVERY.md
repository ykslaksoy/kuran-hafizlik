# Kaynak kurtarma raporu (2026-09-11)

Orijinal Expo/TypeScript kaynağı **kurtarılamadı**. Repo, canlı siteden indirilen çalışır web export’unu içerir.

## Aranan yerler

| Kaynak | Sonuç |
|---|---|
| Bu VM (`/workspace`, `/tmp`, `/home`, `/opt`) | Expo/TS yok |
| Git worktree / önceki branch | yalnızca `README.md` (`bed2ad3`, `186be12`) |
| npm cache | proje paketi yok |
| Kardeş cloud agent (`bc-2aef9e36`, `bc-4917bce6`) | kaynak yazılmamış; aynı sonuca varmış |
| GitHub `ykslaksoy/*` | `kuran-hafizlik` README-only; diğer repolar ilgisiz |
| Google Drive | Hafızyol/Expo zip veya klasör yok |
| hostthis.dev | `hafizyol.hostthis.dev` boş wildcard; varlık host’u değil |
| Expo / EAS | `expo.dev` proje 404 |
| https://hafizyol.vercel.app | derlenmiş Expo web export (200) |
| `*.js.map` | Vercel **403** (source map kapalı) |
| Metro bundle | 2.2 MB minify; `sourceMappingURL` yok |

Hipotez doğrulandı: canlı site önceki bir export; orijinal TS bu VM’de yok.

## Bundle’dan çıkarılan kimlik (SDK 52)

- Ad: Hafız Yol — slug `hafiz-yol` — sürüm `0.1.0`
- Scheme: `hafizyol` / `hafizyol-guardian`
- Bundle id: `com.hafizyol.student` / `com.hafizyol.guardian`
- EAS: `hafiz-yol-local`
- Build: `2026-09-06T09:58:39.416Z` (`mtpn2wxk`)
- React: 18.3.1

## Expo Router ekranları (60)

```
app/_layout.tsx
app/index.tsx
app/ai.tsx
app/analiz.tsx
app/ayarlar.tsx
app/bugun.tsx
app/calis.tsx
app/ezber-manzara.tsx
app/hedef-ezber.tsx
app/imsakiye.tsx
app/kuran.tsx
app/plan.tsx
app/pusula.tsx
app/ses-tanima.tsx
app/sosyal.tsx
app/student-profiles.tsx
app/tumu.tsx
app/vakitler.tsx
app/yonetici.tsx
app/cocuk-ezber/{_layout,index,baslangic,orta,ileri}.tsx
app/cocuk-namaz/{_layout,index,[id]}.tsx
app/e-hafizlik/{_layout,index,[id]}.tsx
app/ekstra-namaz-sureleri/{_layout,index}.tsx
app/guardian-{panel,ogrenciler,odevler,raporlar,canli-ders}.tsx
app/hesap/{_layout,index,giris,hoca,veli-anne,veli-baba,yardimci-hoca,yonetici}.tsx
app/muezzin/{_layout,index,muezzin,usta,pratik/[id]}.tsx
app/namaz-hocasi/{_layout,index,imam,bas-imam}.tsx
app/ogren/{_layout,index,amma,mahrec,seviye,lesson/[nodeId]}.tsx
```

## Kullanıcının yüklemesi gerekenler

1. Orijinal proje klasörü veya zip (Drive / yerel yedek).
2. Mümkünse Metro source map (`.js.map`) — Vercel production’da 403.
3. Vercel hesabını Cursor MCP’ye bağlamak (Connect Git şu an 403).

Minify bundle’dan 60 ekranı yeniden yazmak güvenilir değil; bu yüzden yapılmadı.
