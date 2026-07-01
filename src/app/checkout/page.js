"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PayPalButtons } from "@paypal/react-paypal-js";

export default function CheckoutPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const menuTitle = "모티 샌드위치 세트";
  const itemPriceUSD = "10.00";
  const itemPriceKRW = "15,000";

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-brand-beige animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-brand-green/10 shadow-2xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold text-brand-orange uppercase tracking-widest bg-brand-orange/10 px-3 py-1 rounded-full">
            주문 결제 (Checkout)
          </span>
          <h1 className="text-2xl font-extrabold text-brand-brown font-serif tracking-tight mt-2">
            주문 내용을 확인해 주세요
          </h1>
          <p className="text-xs text-brand-brown-light">
            페이팔(PayPal)을 통해 신속하고 안전하게 결제를 완료하실 수 있습니다.
          </p>
        </div>

        {/* Order Summary Card */}
        <div className="bg-brand-sage/10 p-5 rounded-2xl border border-brand-green/5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brand-green/10 rounded-xl flex items-center justify-center text-2xl">
              🥪
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-brand-brown font-serif">{menuTitle}</h3>
              <p className="text-[10px] text-brand-brown-light mt-0.5">수량: 1개</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-brand-brown-light block">한화 환산가</span>
              <span className="text-sm font-extrabold text-brand-orange">₩{itemPriceKRW}</span>
            </div>
          </div>
          
          <div className="border-t border-brand-green/10 pt-4 flex justify-between items-center text-xs">
            <span className="font-bold text-brand-brown">최종 결제 금액 (USD)</span>
            <span className="text-xl font-black text-brand-green">${itemPriceUSD}</span>
          </div>
        </div>

        {/* PayPal Action Panel */}
        <div className="space-y-4 relative">
          {isProcessing && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex flex-col items-center justify-center z-10 rounded-xl animate-in fade-in duration-200">
              <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] font-bold text-brand-green mt-2">결제를 확인하는 중입니다...</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 text-center">
              ⚠️ {errorMessage}
            </div>
          )}

          <div className="min-h-[150px]">
            <PayPalButtons
              style={{ layout: "vertical", color: "gold", shape: "pill", label: "pay" }}
              disabled={isProcessing}
              createOrder={(data, actions) => {
                setErrorMessage("");
                return actions.order.create({
                  purchase_units: [
                    {
                      amount: {
                        currency_code: "USD",
                        value: itemPriceUSD,
                      },
                      description: `${menuTitle} 1개`,
                    },
                  ],
                });
              }}
              onApprove={async (data, actions) => {
                setIsProcessing(true);
                try {
                  const response = await fetch("/api/paypal/capture", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ orderID: data.orderID }),
                  });
                  
                  const result = await response.json();
                  if (result.status === "COMPLETED") {
                    alert("결제가 완료되었습니다!");
                    router.push("/");
                  } else {
                    setErrorMessage(result.message || "결제 승인 검증에 실패했습니다.");
                  }
                } catch (error) {
                  setErrorMessage("네트워크 오류로 서버와 통신할 수 없습니다.");
                  console.error("Capture call error:", error);
                } finally {
                  setIsProcessing(false);
                }
              }}
              onError={(err) => {
                setErrorMessage("페이팔 결제 창 진행 중 오류가 발생했습니다.");
                console.error("PayPal button error:", err);
              }}
            />
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center text-[10px] text-brand-brown-light/80 flex items-center justify-center gap-1">
          <span>🔒 SSL 보안 암호화로 결제가 안전하게 보호됩니다.</span>
        </div>

      </div>
    </div>
  );
}
