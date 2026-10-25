# Dizi Platformu

Kendi film ve dizilerini yükleyip web ve mobilde izleyebileceğin platform.

| Klasör | İçerik |
| --- | --- |
| `apps/web` | Next.js web sitesi: katalog, dizi sayfası, oynatıcı, giriş, yükleme paneli (`/admin`) |
| `apps/mobile` | Expo (React Native) uygulaması: iOS ve Android |
| `supabase/migrations` | Veritabanı şeması, güvenlik kuralları ve kapak görseli deposu |

Videolar Cloudflare Stream'e doğrudan yüklenir, orada farklı kalitelere dönüştürülür ve HLS ile oynatılır. Kullanıcılar, katalog ve "kaldığın yerden devam" kayıtları Supabase'de tutulur.

## Kurulum

### 1. Supabase
1. [supabase.com](https://supabase.com) üzerinde yeni bir proje aç.
2. SQL Editor'da `supabase/migrations/0001_init.sql` dosyasının içeriğini çalıştır.
3. Project Settings > API sayfasından **Project URL** ve **anon key** değerlerini al.

### 2. Cloudflare Stream
1. Cloudflare panelinde Stream'i etkinleştir.
2. Stream sayfasındaki örnek adreslerde görünen `customer-XXXX` kodunu not et.
3. My Profile > API Tokens'tan **Stream: Edit** izinli bir token oluştur ve hesap kimliğini (Account ID) al.

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

## Nasıl çalışır
- Yönetici panelinden dosya seçildiğinde tarayıcı `/api/upload` adresine sorar. Sunucu yöneticiyi doğrular ve Cloudflare'den tek kullanımlık bir yükleme adresi alır. Dosya parça parça doğrudan Cloudflare'e gider, bağlantı koparsa devam eder.
- Cloudflare videoyu işledikten sonra (genelde birkaç dakika) web ve mobilde oynatılabilir.
- Oynatıcı her 10 saniyede bir ve duraklatıldığında izleme konumunu kaydeder.

## Sonraki adımlar
- Videoları sadece giriş yapanların izleyebilmesi için Cloudflare imzalı adresler
- Altyazı yükleme
- Arama ve türler
- Mobilden yükleme
