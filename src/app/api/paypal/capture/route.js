import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

export async function POST(request) {
  try {
    const { orderID } = await request.json();
    if (!orderID) {
      return NextResponse.json(
        { status: "FAILED", message: "OrderID가 전달되지 않았습니다." },
        { status: 400 }
      );
    }

    // 1. Get PayPal Access Token
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { status: "FAILED", message: "페이팔 API 인증 정보가 서버 환경 변수에 등록되어 있지 않습니다." },
        { status: 500 }
      );
    }

    const authBase64 = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenResponse = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${authBase64}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("PayPal Token generation failed:", errorText);
      return NextResponse.json(
        { status: "FAILED", message: "페이팔 토큰 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Capture Order Payment
    const captureResponse = await fetch(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text();
      console.error("PayPal Capture failed:", errorText);
      return NextResponse.json(
        { status: "FAILED", message: "페이팔 결제 최종 승인에 실패했습니다." },
        { status: 400 }
      );
    }

    const captureData = await captureResponse.json();

    // 3. Confirm success and record to Supabase 'sales' table
    if (captureData.status === "COMPLETED") {
      const { error } = await supabase
        .from("sales")
        .insert([
          {
            menu_title: "모티 샌드위치 세트",
            quantity: 1,
            total_price: 15000,
            channel: "web",
          },
        ]);

      if (error) {
        console.error("Supabase Database sales logging error:", error.message);
        // We still return COMPLETED because the user successfully paid on PayPal.
        return NextResponse.json({
          status: "COMPLETED",
          db_warning: "결제는 승인되었으나 데이터베이스에 이력을 쓰는 과정에서 경고가 발생했습니다.",
          data: captureData,
        });
      }

      return NextResponse.json({ status: "COMPLETED", data: captureData });
    } else {
      return NextResponse.json(
        { status: "FAILED", message: `결제 진행 상태가 완료되지 않았습니다. (상태: ${captureData.status})` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Server API Capture Error:", error);
    return NextResponse.json(
      { status: "FAILED", message: error.message || "서버 내부 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
