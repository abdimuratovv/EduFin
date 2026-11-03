# EduFin veb-demo dizayn spetsifikatsiyasi

Sana: 2026-11-03
Holat: suhbatda tasdiqlangan doira asosida yozildi; yozma spetsifikatsiya foydalanuvchi ko‘rigiga tayyor.
Manba: loyiha prezentatsiyasi va foydalanuvchi bilan ushbu chatdagi qarorlar.

## 1. Maqsad va auditoriya

EduFin 5 yoshli bolaga moliyaviy tushunchalarni rasm, ovoz va tanlov orqali o‘rgatadi. Demo bitta oilaning fond yaratishdan bolaning darsni tugatib mukofot olishigacha bo‘lgan to‘liq oqimini ko‘rsatadi.

Birinchi dars: “Ehtiyoj va istak”. Darsda uchta rasmli topshiriq bor. Bola matn yozishi shart emas. Asosiy tushuntirishlar va ko‘rsatmalar oldindan tayyorlangan ovoz bilan beriladi.

## 2. Tasdiqlangan qarorlar

- Platforma: telefon, planshet va kompyuterga mos veb-ilova.
- Vizual yo‘nalish: “Bilim sarguzashti”, 01-variant.
- Birinchi auditoriya: aynan 5 yoshli bola.
- Demo fondi va balanslari sun’iy. Haqiqiy pul olinmaydi.
- Yakuniy mahsulotda ota-onaning haqiqiy pul kiritishi ko‘zda tutilgan, ammo ushbu demo buni amalga oshirmaydi.
- AI: tayyor darslar va haqiqiy AI tushuntirishini birlashtirish.
- AI ishlamasa, oldindan tayyorlangan yordam ko‘rsatiladi.
- Birinchi demoda erkin ovozli suhbat va mikrofondan savol olish yo‘q.
- Mukofot va javobni baholashni backend boshqaradi.
- Dars tugallangani uchun pul mukofoti bir marta beriladi.

## 3. Demo chegarasi

Demo tarkibi:
1. Bitta demo ota-ona akkaunti va bitta bola profili.
2. Ism, avatar va 5 yosh belgilangan bola profili.
3. Demo fondini to‘ldirish.
4. Ota-onaning dars mukofotini belgilashi.
5. Uchta topshiriqli bitta to‘liq dars.
6. Tayyor ovozlar va “Tushuntirib ber” AI yordami.
7. Bir martalik dars mukofoti.
8. Ota-ona hisoboti va operatsiyalar tarixi.
9. Ota-ona rejimini kod bilan himoyalash.

Demo tashqarisida: haqiqiy to‘lov, karta ma’lumotlari, pul yechish, bank integratsiyasi, bir nechta oila uchun ro‘yxatdan o‘tish, to‘liq admin panel, kontent muharriri, ochiq AI chat, mikrofon, keng kurs katalogi.

Demo akkauntning cheklangan modeli haqiqiy foydalanuvchilarni autentifikatsiya qilish o‘rnini bosmaydi. Haqiqiy ma’lumot yig‘ishdan oldin alohida ishlab chiqarish muhiti dizayni zarur.

## 4. Dizayn tizimi

Asosiy rang: #6D5EF5.
Aksent: #FFD166.
Fon: #F7F5FF.
Matn: o‘qilishi oson to‘q rang, kontrast amalda tekshiriladi.

Bola interfeysi:
- Bir ekranda bitta asosiy vazifa.
- Yirik illyustratsiya va qisqa ko‘rsatma.
- Bosish maydonlari kamida 48 × 48 CSS piksel.
- Asosiy bolalar tugmalari uchun 56 piksel yoki undan katta balandlik.
- Rasmli javoblar va ovozni qayta eshitish tugmasi.
- Rang bilan birga ikonka va matn orqali holatni tushuntirish.
- Xatoda jazolovchi ovoz, pul yo‘qotish yoki uyaltiruvchi matn ishlatilmaydi.
- Animatsiya qisqa; harakatni kamaytirish sozlamasi hisobga olinadi.
- Ovoz foydalanuvchi birinchi harakatidan keyin boshlanadi.
- Shrift o‘zbek lotin yozuvidagi O‘, G‘ va apostroflarni to‘g‘ri ko‘rsatishi kerak.

Ota-ona interfeysi ayni ranglardan foydalanadi. Asosiy urg‘u balans, dars natijasi va operatsiyalar tarixining tushunarliligiga beriladi.

Vizual manba: output/design-concepts/01-bilim-sarguzashti.png.
Generatsiya qilingan rasm konsept sifatida ishlatiladi; undagi tasodifiy matn, sana va sonlar talab hisoblanmaydi.

## 5. Ekranlar va foydalanuvchi oqimi

### Ota-ona

1. Demo kirish: demo ekanini ko‘rsatish va ota-ona rejimiga kirish.
2. Oila paneli: bola, fond, bolaning balansi, dars holati.
3. Bola profili: ism/avatar va yosh.
4. Fond: “Demo fondni to‘ldirish”, miqdor va tasdiq.
5. Mukofot sozlamasi: shu darsning bir martalik mukofoti.
6. Hisobot: tugallangan topshiriqlar, yordamdan foydalanish, mukofot holati.
7. Operatsiyalar: fond to‘ldirish va mukofot o‘tkazmalari.
8. Bola rejimidan ota-ona rejimiga qaytishda kod kiritish.

### Bola

1. Qahramon salomlashuvi va “Darsni boshlash”.
2. “Ehtiyoj va istak” bo‘yicha rasmli, ovozli kirish.
3. Uchta ketma-ket rasmli topshiriq.
4. Xatoda muloyim izoh va qayta urinish.
5. “Tushuntirib ber” orqali kontekstli yordam.
6. Dars yakuni, rag‘bat va mukofot holati.

Topshiriqlar och qolish, sog‘liq yoki oilaviy sharoitni taxmin qiladigan qat’iy umumlashtirishlardan qochadi. Savolda vaziyat beriladi. Masalan: “Tushlik uchun oziq-ovqat olish kerak. Olma yoki yangi o‘yinchoqdan qaysi biri hozir kerak?”

## 6. Arxitektura

Boshlang‘ich tuzilma: modulli monolit backend va moslashuvchan veb-frontend. Bu texnik dizayn qarori kichik demo ko‘lamiga mos; keyingi bosqichda texnologiyalar tanlanadi.

Brauzer → Backend/API → Ma’lumotlar bazasi.
Backend → Fayl ombori: rasmlar va tayyor audio.
Backend → AI adapteri → AI provayderi.
Backend → Ovoz adapteri → Matnni ovozga aylantirish xizmati.

Modullar:
- Kirish va oila: ota-ona sessiyasi, bola profili, ota-ona rejimini ochish.
- Ta’lim: dars, topshiriq, javoblar, taraqqiyot va tugallash.
- Mukofot hisobi: fond, bola balansi, o‘tkazma va takrorlanishni bloklash.
- AI yordam: kontekst tayyorlash, javobni tekshirish, ovoz va zaxira yordam.
- Hisobot: ta’lim va operatsiyalar yozuvlarini o‘qib ko‘rsatish.

Har modul boshqa modul ma’lumotlarini uning belgilangan interfeysi orqali o‘zgartiradi. AI adapteri ta’lim javobini izohlaydi; hisobga yozish vakolatiga ega bo‘lmaydi.

Ma’lumotlar bazasi balans va dars holati uchun asosiy manba. Brauzer saqlovi pul va mukofotning ishonchli manbasi emas.

## 7. Ma’lumot modeli

- Family: demo oila identifikatori.
- Parent: oilaga bog‘langan demo ota-ona.
- ChildProfile: oila, ism, avatar, yosh.
- Lesson: sarlavha, versiya, tayyor tushuntirish va ovoz.
- Task: dars, tartib, vaziyat, rasmli variantlar, serverdagi to‘g‘ri javob.
- Attempt: bola, topshiriq, tanlov, natija, vaqt.
- LessonProgress: bola, dars versiyasi, bajarilgan topshiriqlar, tugallash vaqti.
- RewardRule: dars uchun ota-ona belgilagan mukofot miqdori.
- RewardEntitlement: bola/dars bo‘yicha bir martalik mukofot huquqi va uning holati.
- LedgerTransaction: tur, manba, qabul qiluvchi, butun sonli miqdor, valyuta/ birlik, vaqt, takrorlanmas so‘rov kaliti.
- TutorRequest: topshiriq identifikatori, yordam natijasi, ishlash holati; keraksiz shaxsiy ma’lumot saqlanmaydi.

Bitta bola va dars versiyasi uchun bitta mukofot huquqi yaratiladi. Demo uchun bitta dars versiyasi ishlatiladi.

## 8. Demo mablag‘ va mukofot qoidalari

Boshlang‘ich ko‘rsatish misoli:
- Ota-ona fondiga 100 000 demo so‘m.
- Dars mukofoti 2 000 demo so‘m.
- Bola pul balansi 0 demo so‘m.

Bu sonlar demo boshlang‘ich sozlamalari; ota-ona dars boshlanishidan oldin ularni o‘zgartira oladi. Dars boshlanganida mukofot miqdori shu urinish uchun qayd etiladi.

Uchta topshiriqning har biri to‘g‘ri bajarilganda dars tugallanadi. Qayta urinish va yordam mukofotni kamaytirmaydi.

Fond yetarli bo‘lsa:
- Ota-ona fondidan 2 000 yechiladi.
- Bola balansiga 2 000 yoziladi.
- O‘tkazma tarixga tushadi va huquq “to‘landi” bo‘ladi.

Ushbu amallar bitta tranzaksiyada bajariladi. Bir vaqtning o‘zida yoki qayta kelgan so‘rov ikkinchi mukofotni yaratmaydi. Manfiy balansga yo‘l qo‘yilmaydi.

Fond yetarli bo‘lmasa:
- Dars davom etadi va tugallanishi saqlanadi.
- Dars boshlanishida fond yetishmasligi ma’lum bo‘lsa, bu oldindan ko‘rsatiladi.
- Mukofot “mablag‘ kutilmoqda” holatiga o‘tadi.
- Ota-ona fondni to‘ldirgach, “Mukofotni berish” orqali mavjud huquqni bir marta to‘laydi.

Demo darsda o‘yin ballari alohida valyuta sifatida joriy qilinmaydi. Rivojlanish uchta topshiriqning bajarilishi orqali ko‘rsatiladi. Mukofot demo so‘mda hisoblanadi. Bu 5 yoshli bola uchun ikkita almashtirish tizimini tushuntirish ehtiyojini kamaytiradi.

Bolaning balansini sarflash va pul yechish ushbu demoga kirmaydi.

## 9. AI ustoz

AIga yuboriladi:
- Yosh: 5.
- Darsning tasdiqlangan qisqa mazmuni.
- Joriy savol va variantlar.
- Bolaning tanlovi.
- Shu savoldagi urinish holati.

AIga ism, ota-onaning ma’lumoti, fond, balans yoki boshqa oilalar ma’lumoti yuborilmaydi.

Javob:
- O‘zbek tilida, sodda, ko‘pi bilan ikki qisqa gap.
- Joriy savol doirasida.
- Rag‘batlantiruvchi, uyaltirmaydigan.
- Bolaga qayta o‘ylash uchun ishora beradi.
- Moliyaviy operatsiya yoki hisobni o‘zgartirish buyrug‘i bo‘lmaydi.

Server matn uzunligi va kutilgan javob formatini tekshiradi. Bu tekshiruv mazmunni to‘liq kafolatlamaydi; dars ssenariylari bilan sifat sinovi ham kerak.

AI matni ovozga aylantiriladi. AI yoki ovoz xizmati xato qilsa, format tekshiruvi o‘tmasa yoki umumiy kutish 10 soniyaga yetsa, tayyor ovozli yordam chiqadi. Yordam so‘rovi paytida qayta bosish bloklanadi.

AI kalitlari faqat serverda. Server so‘rovlarni bola sessiyasi va topshiriqqa bog‘laydi, tezlikni cheklaydi. Demo uchun bir topshiriqda ko‘pi bilan uchta yangi AI tushuntirishi; keyingi yordamda tayyor ovoz ishlatiladi.

Haqiqiy AI so‘rovlari xizmat sarfini keltirib chiqarishi mumkin, demo pul balansi bu sarfni ifodalamaydi. Ulash uchun provayder hisobi va server muhiti orqali kalit kerak bo‘ladi; kalit yozishmalarda yoki repozitoriyda saqlanmaydi.

## 10. Kirish va himoya

- Ota-ona va bola amallari serverda tekshiriladi.
- Bola rejimidan ota-ona amallarini kodsiz bajarib bo‘lmaydi.
- Kod tekshiruvi serverda, urinishlar soni cheklangan.
- Bola faqat o‘z oilasiga tegishli profil va natijalarni oladi.
- Muhim yozuvlar: fond to‘ldirish, mukofot sozlash, mukofot o‘tkazish, ota-ona rejimini ochish.
- API ma’lumotlarni tekshiradi; mijoz yuborgan narx, to‘g‘ri javob yoki balansga ishonmaydi.
- Haqiqiy karta raqami yoki bank ma’lumoti yig‘ilmaydi.

## 11. Nosozlik holatlari

- Tarmoq uzilishi: javob qayd etilmagan bo‘lsa, qayta urinish; tasdiqlanmaguncha mukofot olingani ko‘rsatilmaydi.
- Sahifa yangilanishi: backenddagi oxirgi saqlangan holat tiklanadi.
- Takroriy tugma bosish: bir martalik identifikator va server cheklovi.
- AI ishlamasligi: tayyor yordam bilan dars davom etadi.
- Ovoz avtomatik boshlanmasligi: “Ovozni eshitish” tugmasi.
- Fond yetishmasligi: dars saqlanadi, mukofot kutilayotgan holatda.
- Noto‘g‘ri kod: tushunarli xabar va qayta urinish cheklovi.

## 12. Qabul mezonlari va tekshirish

1. Ota-ona demo fondini to‘ldiradi, qiymat va tarix sahifa yangilangandan keyin saqlanadi.
2. Har bir pul ko‘rsatkichi demo ekanini bildiradi.
3. Bola uchta topshiriqni rasm orqali bajara oladi, matn yozmaydi.
4. Xato javobdan so‘ng qayta urinish mumkin.
5. “Tushuntirib ber” haqiqiy AIga ulanadi; xizmat mavjud bo‘lmaganda tayyor yordam ishlaydi.
6. AI va ovoz nosozligida 10 soniyadan keyin bola yordamsiz qolmaydi.
7. Dars yakunida fond va bola balansi bir xil miqdorga qarama-qarshi o‘zgaradi.
8. Takroriy so‘rov, sahifa yangilash va darsni takrorlash qo‘shimcha mukofot bermaydi.
9. Fond yetishmaganda manfiy balans bo‘lmaydi; mablag‘ qo‘shilgach kutilgan mukofot bir marta to‘lanadi.
10. Bola ota-ona sozlamalarini server tasdig‘isiz o‘zgartira olmaydi.
11. Kichik telefon, planshet va desktopda asosiy oqimlar ishlaydi.
12. Tugmalar, ovoz boshqaruvi, kontrast va kamaytirilgan animatsiya qo‘lda tekshiriladi.

Backend uchun hisob izchilligi, takroriy so‘rovlar va huquqlar sinovlari zarur. Asosiy ota-ona → bola → mukofot oqimi integratsion sinov bilan tekshiriladi. AI javoblari tasdiqlangan misol savollar va xato holatlar bilan alohida ko‘rib chiqiladi.

## 13. Keyingi ish

Foydalanuvchi ushbu yozma spetsifikatsiyani ko‘rib chiqadi. So‘ng frontend/backend texnologiyalari, ma’lumotlar bazasi, AI/ovoz provayderlari va joylashtirish usuli bo‘yicha amalga oshirish rejasi tayyorlanadi.

Haqiqiy to‘lovga o‘tish alohida bosqich: to‘lovni tasdiqlash, qaytarish, provayder bilan hisoblarni solishtirish, mablag‘ egaligi va olish tartibi hamda tegishli talablar o‘sha bosqichda aniqlanadi.
