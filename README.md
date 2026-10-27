# odimovi

Kendi film ve dizilerini yükleyip web ve mobilde izleyebileceğin platform.

| Klasör | İçerik |
| --- | --- |
| `apps/web` | Next.js web sitesi: katalog, dizi sayfası, oynatıcı, giriş, yükleme paneli (`/admin`) |
| `apps/mobile` | Expo (React Native) uygulaması: iOS ve Android |
| `supabase/migrations` | Veritabanı şeması, güvenlik kuralları ve kapak görseli deposu |

Videolar Bunny Stream'e doğrudan yüklenir, orada farklı kalitelere dönüştürülür ve HLS ile oynatılır. Kullanıcılar, katalog ve "kaldığın yerden devam" kayıtları Supabase'de tutulur.

## Kurulum

### 1. Supabase
1. [supabase.com](https://supabase.com) üzerinde yeni bir proje aç.
2. SQL Editor'da `supabase/migrations` klasöründeki dosyaları sırayla (0001, 0002, ...) çalıştır.
3. Project Settings > API sayfasından **Project URL** ve **anon key** değerlerini al.

### 2. Bunny Stream
1. [bunny.net](https://bunny.net) üzerinde hesap aç.
2. **Stream** > **Add Video Library** ile bir kütüphane oluştur (bölge: Avrupa).
3. Kütüphanenin **API** sekmesinden **Video Library ID**, **CDN Hostname** (ör. `vz-xxxx.b-cdn.net`) ve **API Key** değerlerini al.

### 3. Web
```bash
cd apps/web
cp .env.example .env.local   # değerleri doldur
npm install
npm run dev                  # http://localhost:3000
```
Yayına almak için Vercel en kolayıdır: repoyu bağla, kök klasörü `apps/web` seç, aynı ortam değişkenlerini gir.

### 4. Kendini yönetici yap
Web sitesinden kayıt ol, sonra Supabase SQL Editor'da:
```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'senin@epostan.com');
```
Artık üst menüde **Yükle** bağlantısı görünür.

### 5. Mobil
```bash
cd apps/mobile
cp .env.example .env         # değerleri doldur
npm install
npx expo start
```
`expo-video` yerel kod içerdiği için Expo Go yerine geliştirme sürümü gerekir: `npx expo run:android` / `npx expo run:ios` ya da `npx eas-cli@latest build --profile development`.

## İsim ve logo
- Web: `apps/web/src/lib/brand.ts` içindeki `BRAND_NAME`. Logo için `apps/web/public/logo.png` ekleyip `LOGO_SRC` değerini `"/logo.png"` yap.
- Mobil: `apps/mobile/src/lib/brand.ts` ve `apps/mobile/app.json` içindeki `name`.

## Dikey ve yatay diziler
Yükleme panelinde her film veya dizi için **Yatay video** ya da **Dikey video** seçilir. Dikey diziler ana sayfada ayrı bir satırda 9:16 kartlarla görünür ve kısa video uygulamaları gibi tam ekran oynatılır: yukarı kaydırınca sonraki bölüme geçilir, bölüm bitince kendiliğinden sıradakine geçer.

## Nasıl çalışır
- Yönetici panelinden dosya seçildiğinde tarayıcı `/api/upload` adresine sorar. Sunucu yöneticiyi doğrular, Bunny'de bir video kaydı açar ve süreli bir yükleme imzası üretir. Dosya parça parça doğrudan Bunny'ye gider, bağlantı koparsa devam eder.
- Bunny videoyu işledikten sonra (genelde birkaç dakika) web ve mobilde oynatılabilir.
- Oynatıcı her 10 saniyede bir ve duraklatıldığında izleme konumunu kaydeder.

## Sonraki adımlar
- Videoları sadece giriş yapanların izleyebilmesi için Bunny token korumalı adresler
- Altyazı yükleme
- Arama ve türler
- Mobilden yükleme
