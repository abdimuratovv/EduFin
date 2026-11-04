# EduFin veb-demo: amalga oshirish rejasi

Sana: 2026-11-04.
Asos: docs/superpowers/specs/2026-11-03-edufin-web-demo-design.md.
Ruxsat: foydalanuvchi spetsifikatsiyani tasdiqladi va writing-plans ko‘nikmasisiz reja tayyorlashga rozilik berdi.
Holat: reja tayyor; dastur kodi hali yozilmagan.

## 1. Natija

5 yoshli bola uchun “Bilim sarguzashti” dizaynidagi lokal veb-demo:
ota-ona → demo fond → bola → uchta topshiriq → bir martalik mukofot → ota-ona hisoboti.

AI ustoz haqiqiy matn generatsiyasi va ovoz xizmatiga adapter orqali ulanadi. Ulanish sozlanmaganda yoki xizmatda xato bo‘lganda tayyor yordam ishlaydi. Faqat tayyor yordam ishlagan holat “haqiqiy AI integratsiyasi tekshirildi” deb hisobot qilinmaydi.

## 2. Texnologiyalar va ishga tushirish

- Next.js App Router + React + TypeScript: frontend va shu ilovadagi server API.
- CSS Modules + CSS variables: tasdiqlangan ranglar, o‘lchamlar va komponent holatlari.
- SQLite + better-sqlite3: lokal doimiy saqlash, SQL migratsiyalar va tranzaksiyalar.
- Zod: serverga keluvchi so‘rovlarni tekshirish.
- Vitest: domen va API integratsiya tekshiruvlari.
- Playwright: ota-ona va bola oqimlari, mobil ekran va kirish chegaralari.
- Gemini generateContent: birlamchi matn generatsiyasi adapteri.
- Azure Speech: o‘zbekcha ovoz, uz-UZ-MadinaNeural.
- Tayyor ovozlar: dars matnlari asosida avvaldan yaratilgan lokal audio fayllar.

Model identifikatori GEMINI_MODEL orqali aniq beriladi. Integratsiya bosqichida hisobda mavjud, qisqa matn generatsiyasiga mos modelda sinov o‘tkazilib, ishlatilgan identifikator yozib qo‘yiladi. Model identifikatori taxmin qilinmaydi.

Lokal muhit tekshirildi: Node.js v22.12.0, npm 10.9.0, Python 3.12.10. Next.js rasmiy hujjati minimal Node.js 20.9 talabini ko‘rsatadi. Paketlarning mos versiyalari o‘rnatish bosqichida aniqlanadi va package-lock.json bilan qayd etiladi.

Loyiha kodi papka ildizida turadi; mavjud PPTX, docs va output papkalari saqlanadi. Avtomatik scaffolder ularni almashtirmasligi uchun konfiguratsiya nazoratli yaratiladi.

Dastlab localhostda bitta Node serveri va lokal diskdagi SQLite ishlaydi. Serverless joylashtirish, bulutga nashr qilish va haqiqiy to‘lov ushbu rejaning ish hajmiga kirmaydi.

## 3. Fayl tuzilmasi

- src/app/: sahifalar, layout va API route handlerlar.
- src/components/ui/: Button, IconButton, Progress, ChoiceCard, Notice, Dialog.
- src/components/child/: qahramon, dars xaritasi, ovoz boshqaruvi, rasmli savol.
- src/components/parent/: fond, mukofot sozlamasi, hisobot va tarix.
- src/styles/tokens.css: rang, shrift, spacing va radius.
- src/server/auth/: sessiya, ota-ona kodi, rejim va huquqlar.
- src/server/db/: SQLite ulanishi, migratsiya va seed.
- src/server/learning/: dars, urinish va tugallash qoidalari.
- src/server/rewards/: hisob, mukofot huquqi, idempotency.
- src/server/tutor/: prompt, provayder adapterlari, cheklov va fallback.
- src/server/reports/: oila paneli uchun o‘qish so‘rovlari.
- src/content/: tasdiqlangan dars ssenariysi; to‘g‘ri javoblar serverdan o‘qiladi.
- public/assets/: illyustratsiya va tayyor ovoz.
- data/: lokal baza; Gitga kirmaydi.
- tests/unit/, tests/integration/, tests/e2e/: tegishli tekshiruvlar.
- scripts/: migratsiya, seed va tayyor audio yaratish.
- .env.example: kalitlarning nomlari; haqiqiy qiymatlar yo‘q.
- README.md: sozlash, ishga tushirish va demo ko‘rsatish yo‘riqnomasi.

Server modullari brauzer bundle’iga kirmasligi ta’minlanadi. UI bazaga bevosita murojaat qilmaydi.

## 4. Ketma-ket ishlar

### 1-bosqich. Loyiha poydevori

Ishlar:
- TypeScript, Next.js, CSS va tekshiruv buyruqlarini sozlash.
- .gitignore orqali .env fayllari, data, cache va build natijalarini chiqarish.
- Muhit konfiguratsiyasini tekshiruvchi server modulini yozish.
- README boshlang‘ich ishga tushirish ko‘rsatmasini kiritish.
- Build va typecheck ishlashini tasdiqlash.

Chiqish mezoni: lokal bosh sahifa ochiladi, yashirin kalitlar brauzerga uzatilmaydi, mavjud fayllar saqlanadi.

### 2-bosqich. Dars va vizual material

Ishlar:
- “Ehtiyoj va istak” uchun kirish, uchta savol, variantlar, to‘g‘ri/xato izohlar va zaxira yordam yozish.
- Vaziyatli uchta topshiriq: tushlik uchun oziq-ovqat; yomg‘irda himoya; rasm chizish uchun kerakli buyum.
- Har savolning ikki rasmli javobi, asoslangan to‘g‘ri javobi va qisqa ovoz matni bo‘lishi.
- Tasdiqlangan 01-variant asosida original qahramon va dars illyustratsiyalarini tayyorlash.
- Yakuniy matnlar asosida tayyor audio fayllarni yaratish; audio hisob ma’lumotlari bo‘lmasa bu yetishmovchilikni ochiq qayd etish.
- Uzbekcha ovoz va talaffuzni eshitib tekshirish.

Chiqish mezoni: yozishni bilmaydigan bola har bir savolni rasm va ovoz orqali tushunishi mumkin; barcha media fayllar manifestda tekshiriladi. Tayyor audio yo‘qligida brauzer ovozi uning teng o‘rnini bosgani da’vo qilinmaydi.

### 3-bosqich. Baza va mukofot domeni

Ishlar:
- Oilalar, ota-ona, bola, sessiyalar, darslar, topshiriqlar, urinishlar va taraqqiyot jadvallari.
- RewardRule, RewardEntitlement, LedgerTransaction va operatsiya kalitlari.
- Foreign key va unique cheklovlari; summalar butun sonlarda.
- Bola/dars versiyasi uchun bitta entitlement; top-up so‘rovlariga ham takrorlanmas kalit.
- Boshlang‘ich demo oila, 5 yoshli bola, uch savolli dars va 2 000 demo so‘m mukofot.
- Fondning birinchi 100 000 demo so‘mi top-up operatsiyasi orqali yaratiladi; ko‘rinmas balans yozuvi bilan emas.
- Hisob o‘tkazmalari BEGIN IMMEDIATE tranzaksiyasida; band baza uchun cheklangan qayta urinish.
- Mablag‘ manbasi, qabul qiluvchi va operatsiya tarixidan balansni tekshirish.

Muhim holatlar:
- Dars boshlanishida mukofot miqdorini snapshot qilish.
- Ota-ona keyin sozlamani o‘zgartirsa, boshlangan dars mukofoti o‘zgarmaydi.
- Uch topshiriq tugallanganda completion va entitlementni izchil yaratish.
- Yetarli fond bo‘lsa o‘tkazma; bo‘lmasa pending.
- Pending mukofotni faqat ota-ona “Mukofotni berish” bilan qayta hisoblatadi.

Sinovlar: ikki parallel tugallash, qayta so‘rov, darsni takrorlash, fond yetishmasligi, keyin to‘lash, rollback, nol/manfiy/juda katta summa, tahrirlangan so‘rov kalitining boshqa mazmun bilan yuborilishi.

Chiqish mezoni: pul ikki marta berilmaydi, fond manfiyga tushmaydi, tarix va balans mos.

### 4-bosqich. Sessiya va ota-ona chegarasi

Ishlar:
- Taxmin qilib bo‘lmaydigan sessiya identifikatori; HttpOnly, SameSite cookie.
- Lokal demo akkaunti; ota-ona kodi serverda xeshlangan holda saqlanadi.
- Kod urinishlari serverda cheklanadi; brauzerni yangilash hisoblagichni o‘chirmaydi.
- Bola rejimiga o‘tish ota-ona vakolatini yopadi.
- Ota-ona rejimiga qaytish kod talab qiladi.
- Har API so‘rovida sessiya, oila egaligi va kerakli rol tekshiriladi.
- Yozuvchi so‘rovlarda Origin/CSRF himoyasi; noto‘g‘ri yoki boshqa kelib chiqishdagi so‘rov rad etiladi.
- PIN va sessiya tokenlari loglarga yozilmaydi.

Chiqish mezoni: bola faqat UI tugmalarini yashirish hisobiga emas, serverdagi huquqlar orqali cheklanadi. Demo lokal muhitga mo‘ljallangan.

### 5-bosqich. Design system va ekranlar

Ishlar:
- Rang, tipografika, spacing, radius va animatsiya tokenlari.
- UI komponentlari: default, focus, loading, disabled, success, error holatlari.
- Demo kirish, oila paneli, profil, fond, mukofot, hisobot va kod dialogi.
- Bola bosh sahifasi, dars kirishi, topshiriq, yordam va yakun.
- Ota-ona bo‘limida hisoblar; bola bo‘limida bitta vazifa va bitta asosiy harakat.
- Pul yonida “Demo mablag‘”; matn bilan birga ikonka orqali holat.
- Ovoz qayta eshittirish, audio loading va qayta urinish.
- Reduced motion, klaviatura fokusi va kontrast.
- Generatsiya qilingan konsept rasmiga HTML skrinshot sifatida tayanmaslik; haqiqiy komponentlardan tuzish.

Chiqish mezoni: 360 px telefon, planshet va desktopda gorizontal toshishsiz asosiy oqim ishlaydi; asosiy bola tugmalari kamida 56 px balandlikda.

### 6-bosqich. API va to‘liq oqim

Route shartnomalari:
- POST /api/demo/session: demo sessiyani boshlash.
- POST /api/parent/unlock: kod bilan ota-ona rejimini ochish.
- POST /api/mode/child: ota-ona vakolatini yopib bola rejimiga o‘tish.
- GET /api/parent/dashboard: fond, balans, taraqqiyot va tarix.
- PATCH /api/parent/child: bola ismi va avatari.
- POST /api/parent/fund/topups: idempotent demo top-up.
- PATCH /api/parent/reward-rule: keyingi dars boshlanishiga mukofot.
- POST /api/parent/rewards/:id/settle: pending mukofotni bir marta to‘lash.
- GET /api/child/lesson: savollar; to‘g‘ri javob kalitisiz.
- POST /api/child/lesson/start: mukofot snapshot va darsni boshlash.
- POST /api/child/attempts: server baholashi va taraqqiyot.
- POST /api/child/lesson/complete: barcha savollar bajarilganini tekshirish va bir martalik mukofot.
- POST /api/child/tutor: joriy topshiriq uchun cheklangan yordam.

Barcha javoblar ma’lum xato kodlari va foydalanuvchiga tushunarli matn bilan qaytadi. Brauzer yuborgan bola/oila identifikatori yoki summa o‘zicha ishonchli emas.

Chiqish mezoni: refreshdan keyin taraqqiyot saqlanadi; server tasdiqlamaguncha muvaffaqiyat yoki pul tushgani ko‘rsatilmaydi.

### 7-bosqich. Haqiqiy AI va ovoz

Ishlar:
- TutorProvider va SpeechProvider uchun alohida interfeyslar.
- Gemini REST orqali faqat dars kontekstida qisqa o‘zbekcha javob.
- Azure Speech orqali javobni ovozga aylantirish.
- Tayyor dars ovozlarini avvaldan yaratib, diskdan berish.
- AIga faqat yosh, savol, variantlar, tanlov va urinish holatini yuborish.
- Model natijasini format, uzunlik va bo‘sh javob bo‘yicha tekshirish.
- Topshiriq/sessiya chegarasi, qayta bosishni bloklash, uch yangi yordam limiti.
- AI va TTS uchun jami 10 soniyalik deadline, abort va tayyor audio fallback.
- UIga provider kaliti, xom xato matni yoki ichki prompt chiqarilmasligi.
- Texnik logda ai, fallback va audio_error holatlarini farqlash.
- Kerakli o‘zgaruvchilar: GEMINI_API_KEY, GEMINI_MODEL, AZURE_SPEECH_KEY, AZURE_SPEECH_REGION, PARENT_DEMO_PIN, DATABASE_PATH.
- .env.example’da faqat nomlar va tushuntirishlar.

Sinovlar:
- Provayder test dublari bilan kechikish, bo‘sh javob, noto‘g‘ri format, TTS xatosi va limit.
- Sozlangan haqiqiy xizmat bilan nazoratli kichik tekshiruv.
- “Ehtiyoj va istak” savollariga sodda, ikki gapdan oshmaydigan yordam.
- Talaffuz va bola uchun tushunarlilikni eshitib ko‘rish.

Chiqish mezoni: haqiqiy AI va o‘zbekcha audio kamida bir marta ishlagani tasdiqlanadi; provayder yo‘q holatda ham tayyor ovozli yordam ishlaydi. Hisoblar ulanmasa, integratsiya tekshirilmaganligi alohida qayd etiladi.

### 8-bosqich. Yakuniy tekshiruv va topshirish

Asosiy E2E:
1. Demo kirish va ota-ona kodi.
2. 100 000 demo so‘m fond.
3. 2 000 demo so‘m mukofot.
4. Bola rejimi, bitta xato, yordam va uchta to‘g‘ri javob.
5. Fond 98 000, bola balansi 2 000.
6. Takroriy dars mukofotni oshirmaydi.
7. Fond yetmaydigan alohida holat: pending → top-up → ota-ona tasdig‘i → bir martalik to‘lov.
8. AI xatosida tayyor yordam.
9. Bola sessiyasidan ota-ona APIlariga urinish rad etiladi.

Tekshiruv buyruqlari: typecheck, lint, unit/integration testlar, production build, Playwright. Tekshiruvlar yangi o‘zgarish yoki aniqlangan muammo bo‘lmasa takroran kengaytirilmaydi.

Topshirish:
- Ishlaydigan lokal URL.
- Desktop va telefon skrinshotlari.
- README: ishga tushirish, demo PINni sozlash, xizmat kalitlari va demo oqimi.
- Haqiqiy AI/ovoz holati va mavjud cheklovlarning aniq hisoboti.
- Gitda mazmunli bosqichlar bo‘yicha commitlar; secret va lokal baza kiritilmaydi.

## 5. Bog‘liqlik va tartib

Poydevor → dars kontenti → baza/mukofot → sessiya → ekranlar → API oqimi → haqiqiy AI/ovoz → yakuniy tekshiruv.

Dars kontenti tekshirilgach, tayyor audio va illyustratsiyalar yaratiladi. Kalitlar bo‘lmasa poydevor, UI, hisoblar, testlar va fallback oqimi davom etadi. Haqiqiy xizmat ulanishi bajarilmagan ish sifatida ochiq qoladi.

## 6. Keyingi ishlar chegarasi

Joriy foydalanuvchi roziligi ushbu rejani tayyorlashga tegishli. Bu hujjat kod yozilgani yoki demo ishlayotgani haqidagi hisobot emas.

Haqiqiy pul integratsiyasi, ommaviy deploy, ko‘p oilali akkaunt tizimi, admin muharriri va boshqa yosh guruhlari alohida keyingi ishlar.

## 7. Rasmiy texnik manbalar

2026-11-04 kuni hujjatlar tarmoq orqali tekshirildi:
- Next.js o‘rnatish va muhit: https://nextjs.org/docs/app/getting-started/installation
- SQLite tranzaksiyalari: https://www.sqlite.org/lang_transaction.html
- Gemini generateContent REST: https://ai.google.dev/api/generate-content
- Azure Speech til/ovozlar: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts

Azure jadvalida uz-UZ-MadinaNeural va uz-UZ-SardorNeural ovozlari mavjudligi tekshirildi. Rasmiy qo‘llab-quvvatlash demo uchun talaffuz sifati amalda tekshirilishi o‘rnini bosmaydi.
