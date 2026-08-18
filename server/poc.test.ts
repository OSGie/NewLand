import { describe, expect, it } from "vitest";
import { calculateQuote, getPlansForPersona } from "@shared/poc";
import { buildDemoContractHtml, makeContractNumber } from "./poc-contract";

describe("PoC pricing", () => {
  it("calculates annual discount and VAT using integer piastres", () => {
    const quote = calculateQuote("founder", [], "annual", new Date("2026-08-20T10:00:00+03:00"));
    expect(quote.subtotalPiastres).toBe(25000);
    expect(quote.discountPiastres).toBe(2500);
    expect(quote.vatPiastres).toBe(3150);
    expect(quote.totalPiastres).toBe(25650);
  });
  it("does not apply an expired campaign", () => {
    const quote = calculateQuote("founder", [], "annual", new Date("2026-09-02T10:00:00+03:00"));
    expect(quote.discountPiastres).toBe(0);
    expect(quote.totalPiastres).toBe(28500);
  });
  it("exposes four accounting-office plans and does not bill an included bundle twice", () => {
    expect(getPlansForPersona("firm")).toHaveLength(4);
    const quote = calculateQuote("special", ["points"], "annual", new Date("2026-08-20T10:00:00+03:00"));
    expect(quote.addons).toHaveLength(0);
  });
  it("calculates multi-quantity add-ons correctly with dynamic pricing and itemized lines", () => {
    // professional plan: 50,000 piastres (500 EGP)
    // 2 POS devices: 2 * 50,000 = 100,000 piastres (1,000 EGP)
    // 3 Extra users: 3 * 5,000 = 15,000 piastres (150 EGP)
    // Subtotal: 165,000 piastres (1,650 EGP)
    // Discount (10%): 16,500 piastres (165 EGP)
    // Taxable: 148,500 piastres
    // VAT (14%): 20,790 piastres (207.90 EGP)
    // Total: 169,290 piastres (1,692.90 EGP)
    const quote = calculateQuote("professional", { pos: 2, user: 3 }, "annual", new Date("2026-08-20T10:00:00+03:00"));
    expect(quote.subtotalPiastres).toBe(165000);
    expect(quote.discountPiastres).toBe(16500);
    expect(quote.vatPiastres).toBe(20790);
    expect(quote.totalPiastres).toBe(169290);
    expect(quote.addons).toHaveLength(2);
    expect(quote.addons.find(a => a.sku === "pos")?.quantity).toBe(2);
    expect(quote.addons.find(a => a.sku === "pos")?.lineTotalPiastres).toBe(100000);
    expect(quote.addons.find(a => a.sku === "user")?.quantity).toBe(3);
    expect(quote.addons.find(a => a.sku === "user")?.lineTotalPiastres).toBe(15000);
  });
});

describe("PoC contract", () => {
  it("creates the prescribed contract numbering format and retains legal text", () => {
    expect(makeContractNumber(42, new Date("2026-08-17T00:00:00Z"))).toBe("MOF-CON-2026-000042");
    const html = buildDemoContractHtml("MOF-CON-2026-000042", { customerName: "شركة اختبار", email: "demo@example.com", phone: "01000000000", planName: "باقة المحترف", packagePrice: "500", vat: "70", discount: "0", total: "570" });
    expect(html).toContain("يحق طلب الاسترداد خلال 14 يوماً وفق الشروط.");
    expect(html).toContain("الاسم على البطاقة");
    expect(html).toContain("Maintenance & Support:");
    expect(html).toContain("mofawtar-official-stamp.png");
    expect(html).toContain("mofawtar-signature.png");
    ["توفير البيانات:", "أمن الحساب:", "الاستخدام والسداد:", "حفظ البيانات:", "التفعيل:", "الدعم والتدريب:", "الصيانة والدعم الفني:", "الاسترداد والترقية:", "المسؤولية:", "القانون والاختصاص:"].forEach(clause => expect(html).toContain(clause));
    ["Data Provision:", "Security:", "Usage Constraints:", "Data Retention:", "Activation:", "Support & Training:", "Maintenance & Support:", "Refunds & Upgrades:", "Liability:", "Governing Law:"].forEach(clause => expect(html).toContain(clause));
    expect(html).toContain("شركة اختبار");
  });
});
