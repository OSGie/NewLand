# 08 · لوحة التحكم والتحليلات `/dashboard`

> **الحكم الكلي:** أفضل صفحة داخلية في المشروع — تكامل tRPC حقيقي، قمع تحويل مرئي، فلتر شخصية، وجدول أحداث مفصّل. لكن ثلاثة من أهم أرقامها مكسورون بسبب عيوب في الصفحات السابقة، والـtrend strings ثابتة بالكود مهما تغيّرت الأرقام.

---

## الإيجابيات (احتفظ بيها)

- `trpc.poc.dashboard.useQuery()` — بيانات حقيقية من السيرفر، مش mock.
- قمع التحويل بشريط بنسبة ديناميكية محسوبة من القيمة الأعلى.
- فلتر شخصية (الكل / مكاتب / شركات) مع state محلي — UX نظيف.
- health box بأربعة مؤشرات (rejected, duplicates, missingUtmRate, analyticsStatus).
- جدول الأحداث مع label map عربي وفلترة — الأكثر إفادة للـPoC review.
- loading state بـspinner نظيف.

---

## العيوب

### P0-1 — الداشبورد بيعرض صف «اعتماد الدفع» — بس السيرفر مش بيستقبل الحدث ده

**الدليل من الكود:**
```tsx
// Dashboard.tsx — labels map
purchase_completed: "اعتماد الدفع التجريبي",

// Success.tsx — لا يوجد أي fire لهذا الحدث
// DemoPayment.tsx — لا يوجد أي fire
// PaymentProcessing.tsx — لا يوجد أي fire
```

الداشبورد بيعرض صف «اعتماد الدفع التجريبي» في جدول الأحداث وهيبقى **دايمًا فارغ**. أي stakeholder بيفتح الداشبورد بيشوف إن مرحلة الدفع = صفر — وده مش لأن محدش دفع، ده لأن التتبّع مكتوبش. القرارات المبنية على الداشبورد ده غلط.

**الإصلاح:** راجع `06-success.md` P0-2 — الحل الجذري هو إضافة `track('purchase_completed', {...})` في `Success.tsx`.

---

### P0-2 — `health.analyticsStatus` هيقول «نشطة» وكل الـIDs demo

**الدليل من الكود:**
```ts
// shared/poc.ts
export const ANALYTICS_DEMO_CONFIG = {
  status: "TEST",
  gtmId: "GTM-DEMO-MOFAWTAR",
  ga4Id: "G-DEMO-MOFAWTAR",
  metaPixelId: "000000000000000",
};

// Dashboard.tsx
<strong className="font-[Inter] text-sm text-[#10B981]">
  {data?.health.analyticsStatus}
</strong>
```

لو السيرفر بيرجّع `analyticsStatus = "نشطة"` بدون التحقق من أن الـIDs حقيقية، أي قرار مبني على «Analytics نشطة» هو قرار مبني على بيانات وهمية.

**الإصلاح:** السيرفر يرجّع `status: "TEST" | "LIVE"` والداشبورد يعرض badge تحذيري واضح:
```tsx
{data?.health.analyticsStatus === 'TEST' && (
  <span className="text-[#F59E0B] font-bold">⚠ وضع الاختبار — البيانات غير حقيقية</span>
)}
```

---

### P1-1 — `contract_downloaded` في الـlabels لكن مفيش tracking في `Contract.tsx`

**الدليل من الكود:**
```tsx
// Dashboard.tsx labels
contract_downloaded: "تنزيل نسخة PDF للعقد",

// Contract.tsx — exportPdf function
const exportPdf = async (openForPrint: boolean) => {
  // ... html2canvas + jsPDF ...
  pdf.save(...);
  // ← لا يوجد track() هنا
};
```

صف «تنزيل نسخة PDF» هيبقى صفر دايمًا حتى لو كل عميل نزّل العقد.

**الإصلاح:**
```ts
pdf.save(`${contract.data.contractNumber}.pdf`);
track('contract_downloaded', { token, contractNumber: contract.data.contractNumber, persona });
```

---

### P1-2 — الـtrend strings ثابتة بالكود بصرف النظر عن الأرقام الفعلية

**الدليل من الكود:**
```tsx
const cards = data ? [
  {
    label: content.dashboard.visitors,
    value: data.overview.visitors,
    trend: "+28.4% هذا الأسبوع",  // ← ثابت
    ...
  },
  {
    label: content.dashboard.leads,
    value: data.overview.leads,
    trend: "معدل تفاعل 42%",  // ← ثابت
    ...
  },
] : [];
```

لو الزيارات نزلت 60% — الكارد بيقول "+28.4%". ده مش dashboard، ده إطار مزيّف. كل stakeholder بيشوف أرقام حقيقية مع اتجاه كاذب.

**الإصلاح:** السيرفر يرجّع `trendPercent` و`trendDirection` من مقارنة الأسبوعين:
```ts
// server response
visitorsTrend: { value: 28.4, direction: 'up' | 'down' | 'flat' }

// client
const trendText = trend.direction === 'up'
  ? `+${trend.value}% هذا الأسبوع`
  : `-${trend.value}% هذا الأسبوع`;
```

---

### P1-3 — أوقات الأحداث بدون تاريخ وبأرقام عربية-هندية

**الدليل من الكود:**
```tsx
{event.createdAt
  ? new Date(event.createdAt).toLocaleTimeString("ar-EG")
  : "—"}
```

أحداث من إمبارح وأحداث من النهارده بيبانوا متشابهين. والأرقام عربية-هندية بدل اللاتينية (نفس مشكلة `formatEgp`).

**الإصلاح:**
```ts
new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Africa/Cairo"
}).format(new Date(event.createdAt))
```

---

### P1-4 — مفيش مؤشر إيراد — الداشبورد بيتابع زيارات وعقود بس

كارد `paid` بيعرض **عدد** المدفوعين مش الإيراد. منتج دفع بيتابع مسار العملاء بدون MRR = قرارات تسعير عمياء.

**الإصلاح المقترح:**
```tsx
{
  label: "إجمالي الإيرادات (بالجنيه)",
  value: formatEgp(data.overview.totalRevenuePiastres),
  ...
}
```

---

### P1-5 — `animate-ping` بدون `prefers-reduced-motion`

**الدليل من الكود:**
```tsx
<span className="h-2 w-2 rounded-full bg-[#10B981] animate-ping" />
```

نفس المشكلة المتكررة عبر المشروع — راجع النمط #3 في `README.md`.

---

### P1-6 — الداشبورد ما عندوش `noindex`

فيه بيانات تحليلية تجارية حساسة. يجب:
```html
<meta name="robots" content="noindex, nofollow" />
```

---

### P2-1 — 7 استيرادات ميتة

```tsx
import {
  ArrowUpRight,  // ✗
  Filter,        // ✗
  CheckCircle2,  // ✗
  Clock,         // ✗
  Sparkles,      // ✗
  ShieldCheck,   // ✗
  Zap,           // ✗
} from "lucide-react";
```

---

### P2-2 — لون بنفسجي `#8B5CF6` خارج الهوية البصرية

```tsx
// كارد العقود
color: "text-[#8B5CF6] bg-[#F5F3FF]",
```

استبدله بـ`text-[#4046B5] bg-[#ECECF7]` أو استخدم Violet Blue درجات مختلفة من داخل الباليت المعتمد.

---

### P2-3 — `border-[#4046B5]/12` — opacity غير قياسي

Tailwind JIT بيولّد `/10` و`/15` و`/20` — `/12` ممكن ميتولدش. استخدم `/10` أو `/15`.

---

### P2-4 — مفيش pagination على جدول الأحداث

مع الوقت الجدول هيبقى طويل جدًا. أضف `limit` + `cursor`-based pagination أو date-range picker.

---

## فرصة الأنيميشن — قمع التحويل

شريط القمع بيتحرك بـ`transition-all duration-500` بس كلهم بيبدأوا مع بعض. stagger بسيط يخلي القمع «يتملأ من فوق لتحت»:

```tsx
data?.funnel.map((item, index) => (
  <div
    style={{
      animationDelay: `${index * 80}ms`,
      animationFillMode: 'both'
    }}
    className="animate-[mof-reveal_0.4s_ease-out]"
  >
```

كده كل مرحلة من القمع بتبان بعد التانية بـ80ms — بيدي المستخدم وقت يقرأ كل مرحلة وبيخلّي الداشبورد يحس بـ«حياة» مش بـ«جدول».

---

## ملخص الأولويات

| # | البند | الأولوية |
|---|---|---|
| 1 | أضف `track('purchase_completed')` في `Success.tsx` | **P0** |
| 2 | badge تحذيري لـ`analyticsStatus = TEST` | **P0** |
| 3 | أضف `track('contract_downloaded')` في `Contract.tsx` | P1 |
| 4 | trend من السيرفر مش hardcoded | P1 |
| 5 | وقت الأحداث: تاريخ + وقت + `nu-latn` | P1 |
| 6 | كارد إيراد MRR | P1 |
| 7 | `noindex` | P1 |
| 8 | استيرادات ميتة + لون خارج الهوية + opacity | P2 |
| 9 | stagger أنيميشن على القمع | P2 |
| 10 | pagination على الأحداث | P2 |
