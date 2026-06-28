"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../utils/supabase";

export default function Header() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if simulated admin
    const checkSimulatedAdmin = () => {
      if (typeof window !== "undefined") {
        return document.cookie.includes("user-role=admin");
      }
      return false;
    };

    const checkRealAdmin = async (currentUser) => {
      if (!currentUser) {
        setIsAdmin(checkSimulatedAdmin());
        return;
      }
      try {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .maybeSingle();
        setIsAdmin(checkSimulatedAdmin() || data?.role === "admin");
      } catch (e) {
        console.log("Error checking admin status:", e);
        setIsAdmin(checkSimulatedAdmin());
      }
    };

    // Check initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      checkRealAdmin(user);
    });

    // Listen to real-time auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      checkRealAdmin(currentUser);
    });

    // Polling cookie check in case role changes in simulation
    const interval = setInterval(() => {
      setIsAdmin((prev) => prev || checkSimulatedAdmin());
    }, 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Clear cookies
    document.cookie = "user-role=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "user-email=; path=/; max-age=0; SameSite=Lax";
    alert("로그아웃 되었습니다.");
    window.location.reload();
  };

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email;

  return (
    <header className="bg-brand-beige py-6 border-b border-brand-green/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        {/* Top row: Brand Name & Auth State Button */}
        <div className="flex justify-center items-center relative">
          <Link href="/" className="inline-block">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-wide font-serif text-brand-green">
              mottikitchen
            </span>
          </Link>
          <div className="absolute right-0 flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin"
                className="text-xs font-extrabold text-white bg-brand-orange hover:bg-brand-orange-hover px-4 py-2.5 rounded-xl shadow-xs transition-all duration-200"
              >
                👑 사장님 대시보드
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-4">
                <span className="hidden lg:inline text-xs font-semibold text-brand-brown-light">
                  🌱 {displayName} 님
                </span>
                {/* User shape icon */}
                <Link
                  href="/login"
                  title="대시보드 / 프로필"
                  className="text-brand-brown hover:text-brand-green transition-colors flex items-center justify-center p-1 rounded-full hover:bg-brand-sage/60"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
                {/* Cart icon */}
                <button
                  onClick={() => alert("장바구니 기능은 준비 중입니다! 🌱")}
                  title="장바구니"
                  className="text-brand-brown hover:text-brand-green transition-colors flex items-center justify-center p-1 rounded-full hover:bg-brand-sage/60 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </button>
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold text-white bg-brand-brown hover:bg-brand-brown-light px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {/* User shape icon (login page link) */}
                <Link
                  href="/login"
                  title="로그인"
                  className="text-brand-brown hover:text-brand-green transition-colors flex items-center justify-center p-1 rounded-full hover:bg-brand-sage/60"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
                {/* Cart icon */}
                <button
                  onClick={() => alert("장바구니 기능은 준비 중입니다! 🌱")}
                  title="장바구니"
                  className="text-brand-brown hover:text-brand-green transition-colors flex items-center justify-center p-1 rounded-full hover:bg-brand-sage/60 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </button>
                {/* Login Link */}
                <Link 
                  href="/login" 
                  className="text-xs font-semibold text-brand-brown/85 hover:text-brand-green border border-brand-brown/20 hover:bg-brand-sage px-3.5 py-1.5 rounded-full transition-all duration-200"
                >
                  로그인
                </Link>
              </div>
            )}
          </div>
        </div>
 
        {/* Bottom row: Centered Navigation Links */}
        <nav className="flex justify-center space-x-6 sm:space-x-8 text-xs font-bold uppercase tracking-wider text-brand-brown-light">
          <Link href="/?tab=home" className="hover:text-brand-green transition-colors py-1">
            홈
          </Link>
          <Link href="/?tab=brand" className="hover:text-brand-green transition-colors py-1">
            브랜드 소개
          </Link>
          <Link href="/?tab=menu" className="hover:text-brand-green transition-colors py-1">
            메뉴판 보기
          </Link>
          <Link href="/?tab=subscription" className="hover:text-brand-green transition-colors py-1">
            정기구독
          </Link>
          <Link href="/?tab=b2b" className="hover:text-brand-green transition-colors py-1">
            단체 및 기업구매
          </Link>
          <Link href="/?tab=community" className="hover:text-brand-green transition-colors py-1">
            커뮤니티
          </Link>
        </nav>
      </div>
    </header>
  );
}
