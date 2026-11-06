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

## Holat

1–7-bosqichlar bajarilgan. Qolgan: yakuniy tekshiruv va topshirish (8).

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
