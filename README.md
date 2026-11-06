# EduFin veb-demo

Bolalar uchun moliyaviy savodxonlik demo ilovasi (5 yosh, “Ehtiyoj va istak” darsi).
Spetsifikatsiya: `docs/superpowers/specs/`, reja: `docs/superpowers/plans/`.

> Demo: barcha pul miqdorlari sun’iy. Haqiqiy to‘lov yo‘q.

## Ishga tushirish

Talab: Node.js 20.9+ (tekshirilgan: v22.12.0).

```bash
npm install
cp .env.example .env.local   # PARENT_DEMO_PIN ni to'ldiring
npm run dev                  # http://localhost:3000
```

## Buyruqlar

- `npm run dev` — dasturlash serveri
- `npm run typecheck` — TypeScript tekshiruvi
- `npm run lint` — ESLint
- `npm test` — domen va integratsiya testlari (Vitest)
- `npm run build` — production build
- `npm run test:e2e` — build + Playwright E2E (Chrome kerak; 3 ta alohida server va baza ishga tushadi)

## Holat

Barcha 8 bosqich bajarilgan (demo tayyor).

## Dars kontenti va media (2-bosqich)

- Dars: `src/content/lesson.json` (turi: `src/content/lesson.ts`). To'g'ri javoblar faqat serverda o'qiladi.
- Rasmlar: `public/assets/images/*.svg`.
- Tayyor ovozlar: `public/assets/audio/<id>.mp3` (14 ta). Yaratish: `npm run audio:generate`.
- Tekshirish: `npm run check:media` (`-- --strict` bilan ovoz yo'q bo'lsa xato beradi).

### ElevenLabs kalit va ovozni olish (tayyor ovozlar uchun)

1. https://elevenlabs.io ga kiring (Starter tarif yetarli).
2. Pastki chapda profil → **API Keys** (yoki https://elevenlabs.io/app/settings/api-keys) → **Create API Key**. Kalitni nusxalang (faqat bir marta ko'rsatiladi).
3. **Voices** bo'limidan quvnoq, iliq, bolalarga mos ovozni tanlang (**My Voices** ga qo'shing), keyin ovoz yonidagi **ID** tugmasi bilan Voice ID ni nusxalang.
4. `.env.local` ga yozing (Gitga kirmaydi): `ELEVENLABS_API_KEY=...` va `ELEVENLABS_VOICE_ID=...`.
5. `npm run audio:generate` — 14 ta mp3 yaratiladi (model `eleven_v4`, o'zbek tili; `ELEVENLABS_MODEL` bilan o'zgartiriladi).
6. Eshitib, talaffuzni tekshiring. Yoqmagan qatorni `-- --only=t1-help --force` bilan qayta yarating.

### Gemini kalitini olish (7-bosqich: AI ustoz matni)

https://aistudio.google.com → **Get API key** → **Create API key** → `.env.local` ga `GEMINI_API_KEY=...`.

## AI ustoz va ovoz (7-bosqich)

- "Tushuntirib ber" `POST /api/child/tutor` ni chaqiradi: Gemini (`GEMINI_MODEL`, tekshirilgan: `gemini-3.5-flash`) matn yozadi, ElevenLabs (`eleven_v4`) uni ovozga aylantiradi.
- AIga faqat yosh, dars mazmuni, savol, variantlar, bolaning tanlovi va urinish holati yuboriladi.
- Natija tekshiriladi (ko'pi bilan 2 gap, lotin yozuvi, markup va moliyaviy so'zlarsiz). Xato, noto'g'ri format, 10 soniyalik chegara yoki 3 ta yangi tushuntirish limiti bo'lsa tayyor ovozli yordam chiqadi.
- Holatlar `tutor_requests` jadvalida (`ai`, `fallback_*`); prompt va javob matni saqlanmaydi. Ota-ona hisobotida AI va tayyor yordam soni ko'rinadi.
- Gemini'da `thinkingBudget: 0` qo'yilgan: aks holda fikrlash tokenlari javobni o'rtasida kesib yuboradi (MAX_TOKENS). Kesilgan javob qabul qilinmaydi.

## Yakuniy tekshiruv (8-bosqich)

Buyruqlar: `npm run typecheck`, `npm run lint`, `npm test` (50 ta unit/integratsiya), `npm run test:e2e` (11 ta E2E, har biri alohida baza bilan).

E2E qamrovi: demo kirish va kod, fond 100 000 → mukofot 2 000 → fond 98 000 / bola 2 000, xato javob va yordam, sahifani yangilash, takroriy dars mukofot bermasligi, fond yetishmasligi (pending → top-up → ota-ona to'lovi), bola sessiyasidan ota-ona API'lariga urinish (403), begona Origin (403), kod urinishlari cheklovi, 360 px telefon (toshishsiz, bosish maydonlari, kamaytirilgan animatsiya) va 768 px planshet. Rang kontrasti (WCAG AA) `tests/unit/contrast.test.ts` da tekshiriladi.

Skrinshotlar: `docs/screenshots/` (desktop, planshet, telefon).

### Cheklovlar (ochiq aytilgan)

- Demo faqat lokal muhit uchun. Haqiqiy to'lov, ko'p oilali akkaunt, admin panel va ommaviy deploy yo'q; haqiqiy foydalanuvchilar uchun alohida ishlab chiqarish dizayni kerak.
- E2E'da AI yaroqsiz kalit bilan (xato → tayyor yordam) va kalitsiz sinaladi. Haqiqiy Gemini + ElevenLabs integratsiyasi 7-bosqichda qo'lda, jonli kalitlar bilan tekshirilgan (avtomatik emas: pul va kvota sarfi, barqaror emas).
- AI javobi 5–10 soniya oladi; 10 soniyadan oshsa tayyor yordam chiqadi. Gemini bepul tarif kvotasi tugashi mumkin (zaxira ishlaydi).
- Ovoz sifati va talaffuz inson qulog'i bilan tekshirilishi kerak (avtomatik tekshiruv faqat matn mosligini ko'radi).
- Rasmlar qo'lda chizilgan oddiy SVG.
