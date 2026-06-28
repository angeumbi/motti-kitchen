import type { Metadata } from "next";
import { Noto_Sans_KR, Outfit } from "next/font/google";
import Link from "next/link";
import Header from "../components/common/Header";
import "./globals.css";

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-noto",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "mottikitchen | 건강, 신선, 단순 샌드위치·포케·샐러드",
  description: "신선한 재료로 건강하고 단순하게 만드는 샌드위치, 포케, 샐러드 전문점 모티키친입니다. 일상에 가볍고 든든한 초록색 활기를 더해 보세요.",
  openGraph: {
    title: "mottikitchen",
    description: "건강, 신선, 단순함을 담은 프리미엄 샌드위치, 포케, 샐러드 보울 전문점",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${noto.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-brand-beige text-brand-brown">
        {/* Dynamic client-side GNB Header */}
        <Header />

        {/* Main Content Area */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-brand-brown text-brand-beige py-12 border-t border-brand-green/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Column 1: Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold font-serif text-white tracking-wider">
                  mottikitchen
                </h3>
                <p className="text-xs text-brand-beige/70 leading-relaxed">
                  "건강하고 신선하며, 지극히 단순한 한 끼"<br />
                  모티키친은 자연 본연의 영양을 훼손하지 않는 가장 신선하고 단순한 샌드위치, 포케, 샐러드를 만듭니다.
                </p>
              </div>
              
              {/* Column 2: Hours */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-orange">영업 시간</h4>
                <ul className="text-xs space-y-1.5 text-brand-beige/70">
                  <li>평일: 08:30 - 20:30 (라스트 오더 20:00)</li>
                  <li>주말: 09:30 - 19:30 (라스트 오더 19:00)</li>
                  <li className="text-brand-orange/90 font-medium">매주 월요일 정기 휴무</li>
                </ul>
              </div>

              {/* Column 3: Store Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-orange">위치 및 연락처</h4>
                <address className="text-xs not-italic space-y-1.5 text-brand-beige/70">
                  <p>📍 서울시 마포구 신선로 123 (모티키친 빌딩 1층)</p>
                  <p>📞 02-1234-5678</p>
                  <p>✉️ hello@mottikitchen.com</p>
                  <p>📸 Instagram: @motti_kitchen</p>
                </address>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-brand-beige/10 flex flex-col md:flex-row justify-between items-center text-[10px] text-brand-beige/55 gap-4">
              <p>&copy; {new Date().getFullYear()} mottikitchen. All rights reserved.</p>
              <div className="flex gap-4">
                <a href="#" className="hover:underline">이용약관</a>
                <a href="#" className="hover:underline">개인정보처리방침</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
