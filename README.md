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
- `npm run build` — production build

## Holat

1-bosqich (poydevor) bajarilgan. AI va ovoz kalitlari ixtiyoriy; bo'lmasa tayyor yordam ishlatiladi (7-bosqich).
