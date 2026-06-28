"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../utils/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Check user login status and fetch database menus
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchProfile(user.id, user);
    });

    fetchPosts();

    // Listen to real-time auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId, currentUser) {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) {
        console.warn("Failed to fetch profile from database:", error.message);
      }

      if (data) {
        setProfile(data);
        // Sync role to cookie for Next.js middleware
        document.cookie = `user-role=${data.role}; path=/; max-age=3600; SameSite=Lax`;
        document.cookie = `user-email=${currentUser.email}; path=/; max-age=3600; SameSite=Lax`;
      } else if (currentUser) {
        const fallbackRole = currentUser.user_metadata?.role || 'user';
        // Fallback profile object using user_metadata
        setProfile({
          id: userId,
          email: currentUser.email,
          role: fallbackRole,
          membership: currentUser.user_metadata?.membership || 'basic'
        });
        // Sync fallback role to cookie
        document.cookie = `user-role=${fallbackRole}; path=/; max-age=3600; SameSite=Lax`;
        document.cookie = `user-email=${currentUser.email}; path=/; max-age=3600; SameSite=Lax`;
      }
    } catch (e) {
      console.log("No profile found for user:", e);
    }
  }

  async function fetchPosts() {
    try {
      const { data } = await supabase.from("posts").select("*").order("id", { ascending: true });
      if (data) setPosts(data);
    } catch (e) {
      console.log("Failed to fetch posts table:", e);
    }
  }

  // 2. Auth handlers
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
    } catch (e) {
      alert("구글 로그인 호출 실패: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Clear cookies
    document.cookie = "user-role=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "user-email=; path=/; max-age=0; SameSite=Lax";
    alert("로그아웃 되었습니다.");
    window.location.reload();
  };

  // 3. Admin Delete handler
  const handleDelete = async (postId) => {
    if (!confirm("정말 이 메뉴를 삭제하시겠습니까?")) return;

    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      alert("삭제 실패: " + error.message);
    } else {
      alert("성공적으로 삭제되었습니다!");
      fetchPosts(); // Refresh list after deletion
    }
  };

  // Toggle logged in user's own membership level
  const handleToggleSelfMembership = async () => {
    if (!user) return;
    const nextMembership = profile?.membership === "premium" ? "basic" : "premium";
    
    // 1. Best-effort database update (might fail due to RLS if profile row missing, which is fine)
    await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        membership: nextMembership,
        role: profile?.role || "user"
      });

    // 2. Guaranteed auth user_metadata update (bypasses RLS constraints)
    const { error } = await supabase.auth.updateUser({
      data: { membership: nextMembership }
    });

    if (error) {
      alert("멤버십 등급 전환 실패: " + error.message);
    } else {
      alert(`🎉 멤버십 등급이 [${nextMembership}] (으)로 변경되었습니다! 홈 화면에서 프리미엄 멤버십 메뉴 언락 상태를 확인해 보세요.`);
      window.location.reload();
    }
  };

  // 4. Mock Tester (for offline testing)
  const handleMockLogin = (role) => {
    document.cookie = `user-role=${role}; path=/; max-age=3600; SameSite=Lax`;
    document.cookie = `user-email=${role === "admin" ? "admin@mottikitchen.com" : "user@motti.com"}; path=/; max-age=3600; SameSite=Lax`;
    if (role === "admin") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-[85vh] bg-brand-beige py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full p-8 rounded-2xl glass-card relative overflow-hidden space-y-8">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-green" />

        {/* 1. If user is logged in (Dashboard view) */}
        {user ? (
          <div className="space-y-6">
            <div className="border-b border-brand-green/10 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-brand-green">로그인 사용자 정보</h2>
                <div className="mt-2 text-sm text-brand-brown space-y-1">
                  <div>
                    🌱 <span className="font-bold">{user.email}</span> 님 
                    (역할: <span className="font-extrabold text-brand-orange">{profile?.role === "admin" ? "사장님 (Admin)" : "손님 (User)"}</span>)
                  </div>
                  <div className="text-xs text-brand-brown-light/75 font-semibold">
                    멤버십 등급: <span className="font-extrabold text-brand-green uppercase">{profile?.membership || "basic"}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleToggleSelfMembership}
                  className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                >
                  멤버십 전환 ({profile?.membership === "premium" ? "Basic 강등" : "Premium 업그레이드"})
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-brand-brown hover:bg-brand-brown-light text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                >
                  로그아웃
                </button>
              </div>
            </div>

            {/* Supabase Posts Table Controls */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-brand-brown flex items-center justify-between">
                <span>📋 데이터베이스 메뉴 목록 (posts 테이블)</span>
                {profile?.role === "admin" && (
                  <span className="text-[10px] text-brand-orange font-bold uppercase tracking-wider">
                    * Admin 권한 획득: 삭제 버튼이 활성화되었습니다.
                  </span>
                )}
              </h3>

              {posts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <div 
                      key={post.id} 
                      className="bg-white rounded-xl overflow-hidden border border-brand-green/5 shadow-sm relative group flex flex-col justify-between"
                    >
                      <div>
                        {/* Image */}
                        <div className="h-44 relative bg-zinc-100">
                          <img 
                            src={post.image_url} 
                            alt={post.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Text */}
                        <div className="p-4 space-y-2">
                          <h4 className="text-sm font-bold text-brand-brown">{post.title}</h4>
                          <p className="text-xs text-brand-brown-light/75 line-clamp-2 leading-relaxed">{post.content}</p>
                        </div>
                      </div>

                      {/* Pricing and Cal */}
                      <div className="p-4 pt-0 flex justify-between items-center border-t border-zinc-50 h-12 bg-brand-beige/20 text-xs">
                        <span className="font-bold text-brand-green">{post.price.toLocaleString()}원</span>
                        <span className="text-brand-brown-light/60">{post.calories} kcal</span>
                      </div>

                      {/* Admin Delete Action */}
                      {profile?.role === "admin" && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-md transition-colors"
                        >
                          지우기 ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-white/50 rounded-xl border border-brand-green/10">
                  <p className="text-sm text-brand-brown-light">불러올 posts 데이터가 없습니다. Supabase에 데이터를 주입해 주세요.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 2. If user is not logged in */
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
              <span className="text-4xl">🌱</span>
              <h2 className="text-2xl font-extrabold text-brand-green font-serif mt-3">Motti Kitchen 로그인</h2>
              <p className="text-xs text-brand-brown-light mt-1">로그인하고 모티키친의 정갈한 웰빙 메뉴와 소식을 실시간으로 만나보세요.</p>
            </div>

            {/* Google Authentication Button */}
            <div className="space-y-4 pt-4">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-brand-green/20 hover:bg-brand-sage bg-white text-brand-brown text-sm font-extrabold rounded-xl transition-all duration-300 shadow-sm"
              >
                <img 
                  src="https://www.gstatic.com/images/branding/product/1x/gsa_android_48dp.png" 
                  alt="Google logo" 
                  className="w-5 h-5 object-contain"
                />
                {isLoading ? "구글 로그인 호출 중..." : "구글 계정으로 로그인"}
              </button>
            </div>

            {/* Direct Login Helper notice */}
            <p className="text-[10px] text-brand-brown-light/50 text-center leading-relaxed">
              * 구글 로그인 연동 시 Supabase Dashboard Settings {">"} Auth {">"} Providers에서 Google 이네이블 및 클라이언트 ID 설정이 필요합니다.
            </p>
          </div>
        )}

        {/* 3. Common Quick Simulator (Super Useful for Local Testing without Google API setup) */}
        <div className="pt-6 border-t border-brand-green/10">
          <p className="text-center text-xs font-bold text-brand-orange mb-3">
            🧪 [테스트 시뮬레이터] 권한 간편 전환 버튼
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            <button
              onClick={() => handleMockLogin("user")}
              className="py-2.5 px-3 border border-brand-green/20 hover:bg-brand-sage text-brand-green rounded-xl text-xs font-bold transition-all bg-white"
            >
              손님(User) 권한 굽기
            </button>
            <button
              onClick={() => handleMockLogin("admin")}
              className="py-2.5 px-3 border border-brand-orange/20 hover:bg-brand-orange/5 text-brand-orange rounded-xl text-xs font-bold transition-all bg-white"
            >
              사장님(Admin) 권한 굽기
            </button>
          </div>
          <p className="mt-2 text-[9px] text-center text-brand-brown-light/50">
            * 구글 로그인 API 미연동 상태에서도 사장님/손님 권한 분기 테스트를 하실 수 있게 해주는 간편 쿠키 시뮬레이터입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
