# 09 · صفحة 404 `/404` + catch-all

> **الحكم الكلي:** أقصر ملف في المراجعة، وأنظف من ناحية الكود. الكوبي العربي صح («شكل الفاتورة دي تاهت في الدفاتر! 🧾😅»)، والبراند gradient موجود، والـCTAs واضحة. ثلاث مشاكل P1 قابلة للحل في ساعة.

---

## الإيجابيات

- كوبي بلهجة مصرية دافية يعكس شخصية العلامة التجارية.
- gradient خلفية صح من الهوية (`#ECECF7`).
- `mof-stamp` badge موجود — هوية متسقة حتى في الخطأ.
- CTA مزدوج: رئيسية + أسعار — يديّ المستخدم خيار.
- `setLocation` من wouter بدل `window.location` للزرين — صح.
- WhatsApp link بـ`rel="noopener noreferrer"` — ✅

---

## العيوب

### P1-1 — شعار الصفحة بـ`<a href>` بدل `Link` من wouter → full page reload

**الدليل من الكود:**
```tsx
<a href="/" className="inline-block mb-6">
  <img src="/brand/mofawtar-badge-logo.png" alt="مفوتر" />
</a>
```

نفس المشكلة في `Success.tsx` — نقرة على الشعار بتعمل reload كامل في SPA.

**الإصلاح:**
```tsx
import { Link } from "wouter";
<Link href="/" className="inline-block mb-6">
  <img src="/brand/mofawtar-badge-logo.png" alt="مفوتر" />
</Link>
```

---

### P1-2 — «استعراض الباقات» بيروح `/#pricing` بدون persona context

**الدليل من الكود:**
```tsx
onClick={() => setLocation("/#pricing")}
```

المستخدم وصل للـ404 معناه إنه كان بيتصفّح. ممكن يكون عارف شخصيته. بيرجع على `/` فارغ بدون توجيه.

**الإصلاح:**
```tsx
const persona = sessionStorage.getItem('mof_persona');
const pricingPath = persona === 'firm'
  ? '/accounting-offices#pricing'
  : persona === 'company'
  ? '/companies#pricing'
  : '/#pricing';
onClick={() => setLocation(pricingPath)}
```

---

### P1-3 — `wa.me/201000000000` — رقم placeholder

**الدليل من الكود:**
```tsx
href="https://wa.me/201000000000"
```

نفس الرقم في كل صفحة. الرقم الحقيقي في `layout.ar.json`: `+201050996319`.

**الإصلاح:** استيراد من `layout.ar.json` وتوحيد على مستوى المشروع:
```ts
import layout from '@/content/layout.ar.json';
href={`https://wa.me/${layout.contact.phone.replace(/[^0-9]/g, '')}`}
```

---

### P1-4 — `<Home className="h-4 w-4 ml-2" />` — هامش فيزيائي في RTL

```tsx
// قبل
<Home className="h-4 w-4 ml-2" />

// بعد
<Home className="h-4 w-4 me-2" />
```

---

### P1-5 — الصفحة مش بترجّع HTTP 404 من السيرفر

wouter بيتعامل مع الـrouting في المتصفح فقط. لو المستخدم فتح رابط `/whatever` مباشرة، السيرفر بيرجّع الـSPA HTML بـHTTP 200 — وده بيخليه يتأشّر في سيرفر logs وGoogle Search Console كـ«صفحة موجودة».

**الإصلاح (server-side):**
```ts
// Express middleware — بعد الـstatic files
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.status(404).sendFile(path.join(__dirname, 'dist/index.html'));
  }
});
```

---

### P2-1 — `animate-pulse` بدون `prefers-reduced-motion`

```tsx
<div className="absolute inset-0 rounded-full bg-[#4046B5]/10 animate-pulse" />
```

نفس النمط المتكرر — راجع النمط #3 في `README.md`.

---

### P2-2 — 3 استيرادات ميتة

```tsx
import { ArrowLeft, Sparkles, HelpCircle } from "lucide-react"; // لا تُستخدم
```

---

### P2-3 — مفيش `<title>` مخصص

الصفحة بتورث عنوان الـlanding page. يجب:
```html
<title>الصفحة غير موجودة — مفوتر</title>
<meta name="robots" content="noindex" />
```

---

## فرصة الأنيميشن — الأيقونة تدخل بـbounce

الـ`animate-pulse` الحالي static ومستمر. الأنيميشن الأجدر:

```css
@keyframes mof-bounce-in {
  0%   { opacity: 0; transform: scale(0) rotate(-5deg); }
  70%  { transform: scale(1.15) rotate(2deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}

.mof-bounce-in {
  animation: mof-bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

طبّقه على `<FileQuestion>` فقط (مش الخلفية) — ده بيخلي الـ404 يحس بـ«مقصود» مش «كسر».

---

## ملخص الأولويات

| # | البند | الأولوية |
|---|---|---|
| 1 | `<Link>` بدل `<a>` للشعار | P1 |
| 2 | routing «الأسعار» بـpersona context | P1 |
| 3 | رقم واتساب حقيقي من `layout.ar.json` | P1 |
| 4 | `me-2` بدل `ml-2` | P1 |
| 5 | HTTP 404 من السيرفر | P1 |
| 6 | `<title>` + `noindex` | P2 |
| 7 | `prefers-reduced-motion` | P2 |
| 8 | استيرادات ميتة | P2 |
| 9 | bounce-in للأيقونة | P2 |
