# 07 · صفحة العقد الإلكتروني `/contract/:token`

> **الحكم الكلي:** أتقن صفحة هندسيًا في المشروع — حالتين، أربع guard states، تصدير PDF متعدد الصفحات، وشريط جانبي sticky. ارفع باقي الصفحات لمستواها الهيكلي. لكن فيها ثغرتان P0 تمسّان المسؤولية القانونية، وثالثة P0 أمنية تحتاج تحقق فوري.

---

## الإيجابيات (احتفظ بيها وطوّرها)

- حالتان واضحتان: فورم الإدخال → عارض المستند، مع انتقال منطقي بينهم.
- أربع guard states كل واحدة بطريق خروج: `isLoading` · `contract.error` · `order.error` · `!order.data`.
- sidebar `xl:sticky xl:top-24` بثلاث خطوات إرشادية — أفضل UX تعليمي في الريبو.
- زر «العودة لصفحة النجاح» دايمًا في الأعلى — المستخدم مش محاصر.
- `exportPdf` منفّذ بالكامل مع multi-page support.

---

## العيوب

### P0-1 — الصفحة تدّعي تنفيذ عقد بدون أي فعل توقيع

**الدليل من الكود:**
```tsx
// badge
«عقد رسمي نافذ ومعتمد بالسداد»
«مطابقة للمعايير القانونية المصرية لخدمات الحوسبة السحابية»

// زر الإرسال
content.contract.create  // = «إنشاء» — مش «توقيع»
```

مفيش: checkbox إقرار · «أقر وأوافق على الشروط» · توقيت قبول مُخزَّن · IP capture · عرض الشروط **قبل** التوليد.

**الأثر البيعي:** لحظة الضغط على «إنشاء» هي أقوى لحظة التزام نفسي في الرحلة كلها — والكود بيتخطّاها. المستند المُنتج مش له قيمة إثباتية لأن ما حدّش «وافق» على حاجة رسميًا، وبيعيًا ده خسارة لأن لحظة التوقيع هي اللحظة اللي العميل بيحس فيها بالجدية.

**الإصلاح:**
```tsx
// 1. اعرض الشروط قبل التوليد
<details open>
  <summary className="font-bold text-xs">الشروط والأحكام</summary>
  <p className="text-xs leading-7">{content.contract.terms}</p>
</details>

// 2. checkbox إلزامي
<label className="flex items-start gap-2 text-xs">
  <input
    type="checkbox"
    required
    onChange={(e) => setAgreed(e.target.checked)}
  />
  <span>أقر بصحة البيانات وأوافق على شروط الخدمة</span>
</label>

// 3. سجّل وقت القبول على السيرفر
// createContract({ token, agreedAt: new Date().toISOString(), ip: req.ip })
```

---

### P0-2 — `dangerouslySetInnerHTML` على مستند يحتوي مدخلات العميل الحرة

**الدليل من الكود:**
```tsx
// viewer
dangerouslySetInnerHTML={{ __html: contract.data.html }}

// حقل حر في الفورم
<Textarea
  name="address"
  placeholder="المدينة، الحي، الشارع، رقم المبنى"
  // لا يوجد maxLength، لا يوجد pattern
/>
```

الـHTML جاي من السيرفر اللي بيبني القالب من حقول كتبها العميل بإيده. لو السيرفر مش بيعمل escape للمدخلات قبل تضمينها في HTML — وده محتاج تحقق فوري — ده **stored XSS مكتمل الأركان**: سكريبت في `address` يتنفّذ في متصفح أي حد يفتح الرابط، في صفحة التوكن فيها في الـURL.

**الإصلاح المطلوب تحققه فورًا:**
```ts
// server side — تأكد إن القالب بيعمل escape
const html = template
  .replace('{{address}}', escapeHtml(data.address))
  .replace('{{customerName}}', escapeHtml(data.customerName));
// أو استخدم مكتبة templating بتعمل auto-escaping

// client side — طبقة دفاع ثانية
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contract.data.html) }}
```

---

### P0-3 — احتمال أن فورم الإنشاء غير قابل للوصول لعملاء جدد (يحتاج تحقق)

**الدليل من الكود:**
```tsx
const contract = trpc.poc.getContract.useQuery(
  { token },
  { enabled: Boolean(token), retry: false }  // ← retry: false
);

// الـguard order في JSX:
if (contract.error) return <FullScreenError />  // ← يُعرض قبل الفورم
if (!contract.data) { /* فورم الإنشاء */ }
```

لو السيرفر بيرجّع `NOT_FOUND` لما العقد لسه ماتولدش — وده السلوك المتوقع من الـprocedure — يبقى `contract.error` بتبقى `true` وكل عميل جديد بيشوف «تعذر فتح العقد الآن» **قبل** ما يوصل للفورم.

**التحقق المطلوب:** شيك السيرفر — هل `getContract` بيرجّع `null` (بدون error) أو `NOT_FOUND` لما العقد مش موجود؟ لو الأول، مفيش مشكلة. لو التاني، الإصلاح:
```ts
// server: return null instead of throwing NOT_FOUND
if (!contract) return null; // not: throw new TRPCError({ code: 'NOT_FOUND' })

// client: handle error ≠ not-found
if (contract.error?.data?.code !== 'NOT_FOUND' && contract.error) {
  return <FullScreenError />;
}
```

---

### P1-1 — كل حقول الهوية اختيارية في مستند قانوني

**الدليل من الكود:**
```tsx
<Label>رقم بطاقة الضريبة <span className="text-[#8e90a8]">(اختياري)</span></Label>
<Label>رقم البطاقة الشخصية <span className="text-[#8e90a8]">(اختياري)</span></Label>
<Label>رقم السجل التجاري <span className="text-[#8e90a8]">(اختياري)</span></Label>
<Label>عنوان النشاط <span className="text-[#8e90a8]">(اختياري)</span></Label>
```

وفي الوقت نفسه الـsidebar بيقول: «تأكد من مطابقة بيانات السجل والبطاقة الضريبية». محاسب عارف إن السجل التجاري إلزامي في أي عقد خدمات — لما بيشوفه اختياري بيحسّ إن المنتج مش جادّ.

**الإصلاح:** إلزامية شرطية حسب الشخصية:
```ts
// firm: taxCard required | company: taxCard + commercialRegister required
const isRequired = (field: string) =>
  persona === 'firm'
    ? ['name', 'email', 'phone', 'taxCard'].includes(field)
    : ['name', 'email', 'phone', 'taxCard', 'commercialRegister'].includes(field);
```

---

### P1-2 — PDF مش مستند — ده صورة

**الدليل من الكود:**
```tsx
const canvas = await html2canvas(page, { scale: 2, useCORS: true });
const imgData = canvas.toDataURL("image/png");
pdf.addImage(imgData, "PNG", 0, 0, 210, 297, undefined, "FAST");
```

النص مش قابل للتحديد أو البحث أو النسخ. العربي بـ`scale:2` على A4 بيتدهور في الطباعة. والملف ضخم. **محاسب يفتح عقد ومش قادر يعمل Ctrl+F = إحساس فوري بـ«مستند مش محترف».**

**الإصلاح:** استخدم `window.print()` مع print stylesheet بدل `html2canvas`:
```tsx
const handlePrint = () => {
  window.print(); // المتصفح بيتولى الـA4 والنص المقروء
};
// + أضف في index.css
@media print {
  body > *:not(.contract-printable) { display: none; }
  .contract-printable { display: block; }
}
```

---

### P1-3 — بيانات متاحة مش بتتملأ تلقائيًا

**الدليل من الكود:**
```tsx
// name فقط بيتملأ
<Input name="name" defaultValue={order.data.customerName} />

// email وphone بيتعملوا فارغين
<Input name="email" type="email" />
<Input name="phone" type="tel" />
```

العميل كتبهم في Checkout، دفع، ووصل لهنا — وبيُطلب منه يكتبهم تاني. ده trust hit واضح. **الإصلاح:** `defaultValue={order.data.customerEmail}` و`defaultValue={order.data.customerPhone}`.

---

### P1-4 — مفيش إرسال العقد بالإيميل أو الواتساب

العقد موجود بس في التاب ده. لو العميل غلق المتصفح قبل التنزيل — المستند اتضيّع من وجهة نظره. زر «أرسل نسخة لإيميلك» = ثقة وراحة بال.

---

### P1-5 — ألوان المستند خارج الهوية البصرية

**الدليل من الكود:**
```tsx
className="bg-[#DFE1ED]"   // wrapper خلفية
className="bg-[#CFD2DF]"   // inner wrapper
className="border-[#C9CCDB]" // border
```

الهوية البصرية عندها `Magnolia #ECECF7` لهذا الغرض بالظبط. الألوان الحالية رمادية-بنفسجية غير معتمدة بتخليها تبان كـ«ورقة مكتب حكومي» مش «مستند موفوتر».

---

### P1-6 — مشكلة تمرير المستند على الموبايل

**الدليل من الكود:**
```tsx
<div className="max-h-[76vh] overflow-auto">
  <div className="contract-document mx-auto w-fit">
    {/* A4-width content */}
  </div>
</div>
```

عرض A4 (~794px) داخل `w-fit` داخل scroll حاوية على شاشة 390px = horizontal scroll trap. مفيش استراتيجية موبايل للمستند.

**الإصلاح:** `transform: scale()` بيحسب النسبة:
```tsx
const scale = Math.min(1, (containerWidth - 32) / 794);
<div style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
```

---

### P2-1 — استيرادات ميتة (3 أيقونات)

```tsx
import { Building, CheckCircle2, Sparkles } from "lucide-react"; // لا تُستخدم
```

### P2-2 — `h-13` غير قياسي في Tailwind

```tsx
className="h-13" // Tailwind افتراضيًا عنده h-12 وh-14 بس — يحتاج تأكيد في الكونفيج
```

### P2-3 — سنة مكتوبة يدويًا في الـbadge

```tsx
// Dashboard.tsx
«لوحة المتابعة والتحليلات 2026»
// استبدل بـ:
new Date().getFullYear()
```

### P2-4 — هوامش فيزيائية في RTL

```tsx
ml-2 / mr-2  // استبدل بـ ms-2 / me-2
```

---

## SEO والأمان

```html
<meta name="robots" content="noindex, nofollow" />
<meta name="referrer" content="no-referrer" />
```

الصفحة فيها بيانات هوية كاملة للعميل. لا يجب أن تُفهرس أو تُرسَل في الـreferrer header.

---

## فرصة الأنيميشن — لحظة الختم

توليد العقد → العارض بيظهر فورًا وبصمت. **ده الذروة العاطفية في الرحلة كلها.**

```css
@keyframes mof-stamp-land {
  0%   { opacity: 0; transform: translateY(-40px) rotate(-3deg) scale(1.3); }
  60%  { opacity: 1; transform: translateY(4px)  rotate(-3deg) scale(0.97); }
  80%  { transform: translateY(-2px) rotate(-3deg) scale(1.01); }
  100% { opacity: 1; transform: translateY(0)    rotate(-3deg) scale(1); }
}

.mof-contract-stamp-animate {
  animation: mof-stamp-land 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

الختم يظهر بعد `onSuccess` مباشرةً فوق المستند — يُثبّت فيه 3° CCW كما تحدد دليل الهوية — ثم يتحول لـwatermark خلف النص.

---

## ملخص الأولويات

| # | البند | الأولوية | التأثير |
|---|---|---|---|
| 1 | تحقق من XSS في `dangerouslySetInnerHTML` | **P0** | أمان |
| 2 | تحقق من سلوك `getContract` لو عقد جديد | **P0** | وصول الصفحة |
| 3 | أضف checkbox إقرار + توقيت قبول | **P0** | مسؤولية قانونية |
| 4 | حقول الهوية إلزامية حسب الشخصية | P1 | جودة المستند |
| 5 | استبدل `html2canvas` بـ`window.print()` | P1 | جودة PDF |
| 6 | ملأ email وphone تلقائيًا | P1 | UX/ثقة |
| 7 | زر إرسال العقد بالإيميل | P1 | احتفاظ بالعميل |
| 8 | استبدل ألوان المستند بـMagnolia | P1 | هوية بصرية |
| 9 | حل scroll trap الموبايل | P1 | موبايل |
| 10 | `noindex` + `no-referrer` | P1 | أمان/SEO |
| 11 | أنيميشن الختم عند التوليد | P2 | إبهار |
| 12 | استيرادات ميتة + `h-13` + هوامش RTL | P2 | نظافة |
