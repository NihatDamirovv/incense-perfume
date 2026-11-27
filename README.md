# Incense Parfume — Parfüm kataloqu

Ağ-qara, mobilə uyğun Azərbaycan dilli parfüm saytı və ayrıca admin panel.

## Texnologiyalar

React 19, TypeScript, Vinext/Vite, Cloudflare Workers, D1 (SQLite), R2 fayl yaddaşı, Drizzle migrasiyaları və Zod validasiyası.

## Başlatma

Node.js 22.13 və ya daha yeni versiya lazımdır. Qovluqda asılılıqlar artıq quraşdırılıb.

```powershell
npm run build
npm run db:migrate:local
npm run dev
```

Terminalda göstərilən ünvanı açın. Ana səhifə `/`, admin panel `/admin` yolundadır.
Admin şifrəsi Git-ə daxil edilməyən `.dev.vars` faylının `ADMIN_PASSWORD` sətrindədir.
Bu şifrə yalnız serverdə saxlanır; brauzer paketinə daxil edilmir. Admin girişindən sonra yalnız səhifənin yaddaşında tutulur, localStorage/cookie-yə yazılmır. Səhifəni yeniləyəndə yenidən daxil olmaq lazımdır.

Təmiz checkout üçün əvvəl `npm ci` işlədin və `.dev.vars` daxilində güclü `ADMIN_PASSWORD` təyin edin. Hosted mühitdə bu dəyişəni Sites secrets vasitəsilə konfiqurasiya edin. Lokal `.dev.vars` hosted mühitə göndərilmir.

## İmkanlar

- Brend, cins, ad və notlar üzrə axtarış; qiymət sıralaması.
- Parfüm detalları və cihazda saxlanan seçilmişlər.
- Admin: yaratma, redaktə, silmə, stok statusu, şəkil yükləmə.
- Yeni brend məhsula yazıldıqda filtrə avtomatik əlavə olunur.
- D1-də davamlı məhsullar və əməliyyat jurnalı; R2-də şəkillər.
- İlk kolleksiya nümunədir. Flakonlar illüstrasiyadır, qiymətlər təqdimat üçündür. Bütün nümunələr paneldən dəyişdirilə/silinə bilər.

## API

Tam OpenAPI sxemi: `docs/openapi.json`. Postman kolleksiyası: `docs/NOIR.postman_collection.json`.
Postman-da `baseUrl` və `adminToken` dəyişənlərini təyin edin. Tokeni paylaşılmış kolleksiyada saxlamayın.

| Metod           | Endpoint             | Təyinat                                     |
| --------------- | -------------------- | ------------------------------------------- |
| GET             | `/api/products`      | Filtrli, sıralanmış, səhifələnmiş kataloq   |
| POST            | `/api/products`      | Məhsul yarat (admin)                        |
| GET             | `/api/products/{id}` | Məhsul detalları                            |
| PUT             | `/api/products/{id}` | Məhsulu tam yenilə (admin)                  |
| DELETE          | `/api/products/{id}` | Məhsulu sil (admin)                         |
| GET             | `/api/brands`        | Brendlər və məhsul sayları                  |
| POST            | `/api/upload`        | Multipart `file` şəkil yüklə (admin)        |
| GET             | `/api/images/{key}`  | Yüklənmiş şəkil                             |
| POST            | `/api/auth/check`    | Admin tokenini yoxla                        |
| GET             | `/api/admin/audit`   | Son 100 əməliyyat (admin)                   |
| GET             | `/api/health`        | Database və storage konfiqurasiya vəziyyəti |
| GET/POST/DELETE | `/api/catalog`       | İnterfeys üçün uyğunluq endpointi           |

Admin endpointləri `Authorization: Bearer <ADMIN_PASSWORD>` tələb edir. HTTPS hosted mühitdə platformadan təmin edilir. API tokeni platformanın private Site girişindən ayrıdır: private yayımda əvvəl Site giriş icazəsi tələb olunur.

Kataloq parametrləri: `q`, `brand`, `gender`, `available`, `minPrice`, `maxPrice`, `sort` (`default`, `price_asc`, `price_desc`, `name`), `page` (1-dən), `limit` (1–100).

Xəta forması `{ "error": "İzah", "code": "ERROR_CODE" }`. Validasiya xətalarında `fields` əlavə olunur.

## Backend qorunması

Serverdə Zod validasiyası, parametrli SQL, atomik D1 batch + audit, mənşə yoxlaması, SHA-256 digest müqayisəsi, IP həşinə əsaslanan davamlı sorğu limiti (15 dəqiqədə 10 yanlış giriş; dəqiqədə 60 admin sorğusu), 32 KB JSON limiti və 5 MB şəkil limiti var. Fayl tipi həm MIME, həm ilkin baytlarla yoxlanır; SVG qəbul edilmir. Dəyişənlər və şifrələr Git-dən çıxarılıb.

Silinən məhsul tombstone ilə saxlanır ki, bütün kolleksiya silinəndə nümunələr yenidən görünməsin. Şəkillər avtomatik silinmir: eyni şəkli başqa məhsul da istifadə edə bilər. İstifadəsiz faylların arxivlənməsi/silinməsi ayrıca saxlanma siyasəti ilə edilə bilər.

Bu versiya kataloq və WhatsApp sifariş yönləndirməsi üçündür; onlayn ödəniş və çatdırılma idarəsi daxil deyil. Admin modeli tək idarəçi üçündür. Kataloq filtrlənməsi server yaddaşında aparılır; çox böyük kataloq üçün SQL indeksli filtr/səhifələmə tətbiq edilməlidir. Avtomatik ehtiyat nüsxə və çox-istifadəçili rol sistemi ayrıca konfiqurasiya edilməlidir.

## Yoxlama

```powershell
npm run typecheck
npm run test:api
```

API testi işləyən lokal server tələb edir; test məhsulunu yaradıb, yeniləyib, silir. Hosted URL-yə qarşı işləmir. Lokal R2-də bir kiçik test şəkli və audit qeydləri qalır.

## Mənbə strukturu

### Kataloq və vizual redaktə

Bütün filtrlər kataloqun yuxarısındadır: mənşə (Avropa/Ərəb), brend, cins, fəsil, qiymət aralığı, axtarış və sıralama. URL seçimləri saxlayır. `/brendler`, `/haqqimizda`, `/elaqe` ayrıca səhifələrdir; köhnə ana-səhifə hash linkləri uyğun səhifəyə keçir. Məhsul linkləri yeni tabda tam `/parfum/{id}` səhifəsi açır. Məhsulun məlumatlarından sonra eyni brendin digər ətirləri göstərilir.

Admin → Məhsullar bölməsində `origin`, birdən çox `seasons` və əlavə `variants` (ml, qiymət, stok) təyin edilir. Əsas həcm `size`/`price` olaraq qalır; əlavə variantlar əsas həcmdən fərqli olmalıdır. Mövcud məhsulların ölçü/qiymətləri dəyişmir. Əvvəlki tanınan Avropa brendləri uyğun filtrdə görünür; naməlum brendlərin mənşəyi admin tərəfindən seçilir. Fəsillər avtomatik təxmin edilmir.

Admin → Vizual redaktə: səhifə seçin, önizləmədə mətnə basın, mətni dəyişin və ya boşaldın, sonra yadda saxlayın. Boş/gizli sahələr açılan siyahıdan seçilir. Önizləmə qaralamadır; yalnız autentifikasiya edilmiş `PUT /api/settings` dəyişiklikləri saxlayır və revision yoxlaması paralel redaktəni qoruyur. Önizləmədə məhsula basmaq onun admin redaktəsini açır.

API: `GET /api/products` üçün `origin` və `season` filtrləri əlavə edilib. `POST /api/checkout` sətrlərində optional `size` seçilən ml-dir; server qiyməti və stok vəziyyətini öz məlumatlarından yoxlayır. Səbət eyni məhsulun müxtəlif həcmlərini ayrı saxlayır, açıq tablar arasında sinxronlaşır. `npm run test:options` həcm/qiymət və URL filtr məntiqini yoxlayır. Yenilənmiş sxem `docs/openapi.json` faylındadır.

Mağaza ünvanları: `/kolleksiya`, `/kolleksiya/qadin`, `/kolleksiya/kisi`, `/kolleksiya/uniseks` və `/parfum/{id}`. Brend (`brend`), axtarış (`q`), sıralama (`sirala`) və seçilmişlər (`secilmis=1`) URL parametrlərində saxlanır. Məhsul linki birbaşa həmin parfümü açır; yeniləmə və brauzer tarixçəsi dəstəklənir. `npm run test:routes` lokal serverdə bu ünvanları və 404 cavablarını yoxlayır. Localhost linki yalnız həmin kompüterdə işləyir.

- `app/page.tsx`, `app/globals.css`: mağaza.
- `app/admin/page.tsx`: admin interfeysi.
- `app/api/`: HTTP endpointləri.
- `lib/api.ts`: validasiya, autentifikasiya, rate limit, səhvlər.
- `lib/catalog.ts`: məhsul əməliyyatları.
- `db/schema.ts`, `drizzle/`: schema və versiyalanmış migrasiyalar.
- `.openai/hosting.json`: Site identifikatoru və DB/R2 bindingləri.

Yeni schema dəyişikliyindən sonra `npm run db:generate`, build və lokal migrasiya işlədin. Tətbiq edilmiş migrasiyaları dəyişməyin.

## Brendlər, sayt məzmunu və WhatsApp sifarişi

Mağazanın adı **Incense Parfume** olaraq yeniləndi. `/admin` daxilində üç bölmə var:

- **Məhsullar:** parfümlər, şəkillər, qiymətlər və stok.
- **Brendlər:** məhsul olmadan yeni brend yaratma, loqo, təsvir, sıra və ana səhifədə görünmə. Ad dəyişəndə əlaqəli məhsullar atomik olaraq yenilənir. Məhsulu olan brendin silinməsi 409 ilə bloklanır.
- **Sayt məzmunu:** mağaza adı, loqo, favicon, SEO, menyular, elan, banner və şəkli, kataloq mətnləri, Haqqımızda və şəkli, əlaqə, footer, WhatsApp nömrəsi və sifariş düymələrinin yazıları. Bölmələri gizlətmək mümkündür. “Dəyişiklikləri saxla” düyməsi yenilikləri bazaya yazır. İki pəncərədə paralel redaktə zamanı revision yoxlaması itmiş yeniləmələrin qarşısını alır.

WhatsApp nömrəsi başlanğıcda `+994507790084`-dür. Paneldə “Sayt məzmunu → Əlaqə və WhatsApp” bölməsindən dəyişir. Hər məhsulda tək sifariş və səbət düyməsi var. Səbətdə miqdar dəyişir, məhsul silinir və cihazda saxlanır.

`POST /api/checkout` yalnız məhsul ID-ləri və miqdar qəbul edir. Server aktual qiyməti, stok vəziyyətini və konfiqurasiya edilmiş WhatsApp nömrəsini bazadan oxuyur; yekun məbləği tam qəpiklə hesablayıb mesaj URL-i qaytarır. Sifariş sistemdə təsdiqlənmiş sifariş kimi qeydə alınmır. WhatsApp mesajını müştəri özü göndərir; ödəniş və çatdırılma ayrıca razılaşdırılır.

Yeni endpointlər:

| Metod        | Yol                | Giriş                                |
| ------------ | ------------------ | ------------------------------------ |
| POST         | `/api/brands`      | Admin                                |
| PUT / DELETE | `/api/brands/{id}` | Admin                                |
| GET          | `/api/settings`    | Açıq məzmun                          |
| PUT          | `/api/settings`    | Admin; `{data, revision}`            |
| POST         | `/api/checkout`    | Müştəri; `{items: [{id, quantity}]}` |

`npm run test:cms` lokal serverdə brend CRUD, məhsullara ad dəyişikliyi, məzmunun saxlanması, paralel redaktə qorunması, WhatsApp mesajı və stok yoxlamalarını test edir. Test öz yaratdığı məhsul/brendi silir və əvvəlki sayt məzmununu bərpa edir. Lokal test zamanı məzmun qısa müddət dəyişir. Lokal və hosted bazalar ayrıdır; localhost-da etdiyiniz məzmun redaktələri hosted bazaya avtomatik köçmür.
