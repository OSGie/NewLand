import content from "@/content/poc.ar.json";
import { formatEgp } from "@shared/poc";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  Receipt,
  ShieldCheck,
  Smartphone,
  Sparkles,
  QrCode,
  Check,
  AlertCircle,
  Building
} from "lucide-react";
import { useState } from "react";
import { useRoute, useLocation } from "wouter";

export default function DemoPayment() {
  const [, params] = useRoute("/demo-payment/:token");
  const [, setLocation] = useLocation();
  const token = params?.token ?? "";
  const [activeTab, setActiveTab] = useState<"card" | "fawry" | "wallet">("card");

  const session = trpc.poc.getPaymentSession.useQuery({ token }, { enabled: Boolean(token) });
  const approve = trpc.poc.approveDemoPayment.useMutation({
    onSuccess: (result) => setLocation(`/payment-processing/${result.paymentToken}`),
  });

  if (session.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#FBFBFF] text-[#4046B5]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#4046B5] border-t-transparent" />
          <p className="mt-4 text-sm font-extrabold text-[#07081A]">جارٍ تهيئة بوابة الدفع المعتمدة...</p>
        </div>
      </div>
    );
  }

  if (!session.data) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#FBFBFF] p-6 text-center text-[#07081A]">
        <div className="max-w-md rounded-3xl border border-destructive/20 bg-white p-8 shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-extrabold">رابط الدفع غير صالح أو انتهت صلاحيته</h1>
          <p className="mt-2 text-xs leading-6 text-[#5b5c72]">
            يرجى الرجوع إلى صفحة إتمام الطلب واختيار الباقة مجددًا.
          </p>
          <a
            href="/checkout"
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#4046B5] px-6 text-xs font-extrabold text-white"
          >
            الرجوع إلى صفحة الطلب
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ECECF7] via-[#F3F4FB] to-[#ECECF7] p-4 md:p-10 text-[#07081A]">
      <div className="mx-auto max-w-xl overflow-hidden rounded-[2.5rem] border border-[#4046B5]/15 bg-white shadow-[0_30px_90px_-35px_rgba(7,8,26,0.25)]">
        {/* Gateway Header */}
        <header className="border-b border-[#4046B5]/10 bg-[#07081A] p-6 text-white md:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#4046B5] text-white shadow-md">
                <LockKeyhole className="h-6 w-6" />
              </span>
              <div>
                <p className="text-base font-black">{content.payment.title}</p>
                <p className="mt-0.5 text-xs text-[#bfc2ff]">بوابة الدفع الآمنة المعتمدة • PoC Environment</p>
              </div>
            </div>
            <ShieldCheck className="h-7 w-7 text-[#10B981]" />
          </div>

          {/* Amount Showcase Banner */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.07] p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white/70">المبلغ الإجمالي للدفع (شامل 14% VAT)</p>
              <p className="mt-0.5 text-sm font-extrabold text-[#d7d8ff]">{session.data.planName}</p>
            </div>
            <strong className="font-[Inter] text-2xl font-black text-white" dir="ltr">
              {formatEgp(session.data.totalPiastres)}
            </strong>
          </div>
        </header>

        {/* Gateway Body */}
        <div className="p-6 md:p-8">
          {/* Payment Method Tabs */}
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#ECECF7]/70 p-1.5 text-xs font-extrabold">
            <button
              type="button"
              onClick={() => setActiveTab("card")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 transition ${
                activeTab === "card"
                  ? "bg-white text-[#4046B5] shadow-xs"
                  : "text-[#5b5c72] hover:text-[#4046B5]"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              بطاقة بنكية
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("fawry")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 transition ${
                activeTab === "fawry"
                  ? "bg-white text-[#4046B5] shadow-xs"
                  : "text-[#5b5c72] hover:text-[#4046B5]"
              }`}
            >
              <Receipt className="h-4 w-4" />
              فوري Pay
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("wallet")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 transition ${
                activeTab === "wallet"
                  ? "bg-white text-[#4046B5] shadow-xs"
                  : "text-[#5b5c72] hover:text-[#4046B5]"
              }`}
            >
              <Smartphone className="h-4 w-4" />
              محفظة / إنستاباي
            </button>
          </div>

          {/* Tab 1: Credit Card Mockup */}
          {activeTab === "card" && (
            <div className="mt-6">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-[#07081A] via-[#1b1e56] to-[#4046B5] p-5 text-white shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs tracking-wider">بطاقة ميزة / فيزا تجريبية</span>
                  <div className="flex gap-1.5">
                    <span className="h-3 w-5 rounded-xs bg-[#F59E0B]" />
                    <span className="h-3 w-5 rounded-xs bg-[#EF4444]" />
                  </div>
                </div>

                <p className="mt-5 font-[Inter] text-lg font-bold tracking-widest" dir="ltr">
                  4046 •••• •••• 2026
                </p>

                <div className="mt-4 flex items-end justify-between text-xs">
                  <div>
                    <p className="text-[10px] text-white/60">صاحب الحساب</p>
                    <p className="font-bold">{session.data.customerName || "عميل موفوتر المميز"}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-white/60">تاريخ الانتهاء</p>
                    <p className="font-[Inter] font-bold">12/28</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[#4046B5]/15 bg-[#FBFBFF] p-3 text-xs text-[#5b5c72]">
                <p className="flex items-center gap-1.5 font-bold text-[#4046B5]">
                  <Sparkles className="h-3.5 w-3.5" />
                  وضع المحاكاة التجريبي (Demo Sandbox):
                </p>
                <p className="mt-1 text-[11px] leading-5">
                  تم تعبئة تفاصيل البطاقة الاختبارية مسبقًا. اضغط على الزر أدناه لاعتماد العملية وإصدار العقد فورياً.
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Fawry Mockup */}
          {activeTab === "fawry" && (
            <div className="mt-6 text-center">
              <div className="rounded-2xl border-2 border-dashed border-[#F59E0B]/40 bg-[#FFFBEB] p-6">
                <p className="text-xs font-bold text-[#92400E]">كود الدفع في فوري (صالح لمدة 24 ساعة):</p>
                <p className="mt-3 font-[Inter] text-3xl font-black tracking-wider text-[#B45309]" dir="ltr">
                  782-940-460
                </p>
                <p className="mt-2 text-xs text-[#92400E]">
                  يمكنك السداد عبر أي ماكينة فوري أو تطبيق فوري أصفر بإدخال الكود الموضح أعلاه.
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Wallet / InstaPay Mockup */}
          {activeTab === "wallet" && (
            <div className="mt-6 text-center">
              <div className="rounded-2xl border border-[#4046B5]/20 bg-[#F3F4FB] p-6">
                <p className="text-xs font-bold text-[#4046B5]">عنوان الدفع اللحظي عبر إنستاباي InstaPay:</p>
                <p className="mt-2 font-[Inter] text-xl font-black text-[#07081A]" dir="ltr">
                  mofawtar@instapay
                </p>
                <div className="mx-auto mt-4 grid h-24 w-24 place-items-center rounded-2xl bg-white shadow-xs">
                  <QrCode className="h-16 w-16 text-[#4046B5]" />
                </div>
                <p className="mt-2 text-[11px] text-[#64657a]">امسح الكود عبر تطبيق بنكك أو المحفظة الإلكترونية</p>
              </div>
            </div>
          )}

          {/* Security Guarantee Note */}
          <div className="mt-6 rounded-2xl border border-[#10B981]/25 bg-[#ECFDF5] p-4 text-xs leading-6 text-[#065F46]">
            <p className="flex items-center gap-2 font-extrabold">
              <ShieldCheck className="h-4 w-4 text-[#10B981]" />
              {content.payment.secure}
            </p>
          </div>

          {/* Action Approval Button */}
          <Button
            onClick={() => approve.mutate({ token })}
            disabled={approve.isPending || session.data.status === "PAID_DEMO"}
            className="mt-6 h-14 w-full rounded-2xl bg-[#4046B5] text-base font-black text-white shadow-lg shadow-[#4046B5]/30 transition hover:bg-[#343aa0] hover:scale-[1.01] active:scale-99"
          >
            {approve.isPending ? "جارٍ تأكيد العملية البنكية..." : content.payment.approve}
            <ArrowLeft className="mr-2 h-4 w-4" />
          </Button>

          {approve.error && (
            <p className="mt-3 text-center text-xs font-bold text-destructive">
              {approve.error.message}
            </p>
          )}

          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs font-bold text-[#64657a]">
            <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
            بيئة تجريبية آمنة لا تخصم أي مبالغ حقيقية من حسابك.
          </p>
        </div>
      </div>
    </div>
  );
}

