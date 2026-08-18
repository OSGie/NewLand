import content from "@/content/poc.ar.json";
import { CheckCircle2, Loader2, ShieldCheck, FileCheck2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";

export default function PaymentProcessing() {
  const [, params] = useRoute("/payment-processing/:token");
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const s1 = window.setTimeout(() => setStep(1), 400);
    const s2 = window.setTimeout(() => setStep(2), 850);
    const s3 = window.setTimeout(() => setStep(3), 1300);
    const timer = window.setTimeout(() => {
      setLocation(`/success/${params?.token}`);
    }, 1700);

    return () => {
      window.clearTimeout(s1);
      window.clearTimeout(s2);
      window.clearTimeout(s3);
      window.clearTimeout(timer);
    };
  }, [params?.token, setLocation]);

  const steps = [
    { label: "التحقق من صحة العملية البنكية واعتماد السداد", done: step >= 1 },
    { label: "إصدار الفاتورة الضريبية وتوثيق الختم الإلكتروني", done: step >= 2 },
    { label: "تفعيل اشتراك المنظومة وتجهيز العقد الرسمي", done: step >= 3 },
  ];

  return (
    <div className="grid min-h-screen place-items-center bg-[#07081A] p-5 text-center text-white">
      <div className="mx-auto w-full max-w-md rounded-[2.5rem] border border-white/10 bg-[#101132] p-8 shadow-2xl">
        <div className="relative mx-auto grid h-24 w-24 place-items-center">
          <div className="absolute inset-0 rounded-full border-4 border-[#4046B5]/30 animate-ping" />
          <Loader2 className="absolute h-20 w-20 animate-spin text-[#7D82EB]" />
          <ShieldCheck className="h-9 w-9 text-white" />
        </div>

        <h1 className="mt-8 text-2xl font-black">{content.payment.processing}</h1>
        <p className="mt-2 text-xs leading-6 text-white/60">
          لحظات قليلة.. نقوم بتأكيد سدادك وتجهيز مساحة العمل الخاصة بمكتبك / شركتك.
        </p>

        <div className="mt-8 space-y-3 text-right">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 rounded-xl border p-3 text-xs font-bold transition-all duration-300 ${
                item.done
                  ? "border-[#10B981]/40 bg-[#10B981]/15 text-[#38ef7d]"
                  : "border-white/10 bg-white/[.03] text-white/45"
              }`}
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-black ${
                  item.done ? "bg-[#10B981] text-white" : "bg-white/10 text-white/40"
                }`}
              >
                {item.done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
              </span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

