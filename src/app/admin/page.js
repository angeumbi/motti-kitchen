"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabase";

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  
  // Tab controller for CMS sections
  const [cmsTab, setCmsTab] = useState("menus"); // "menus" | "notices" | "users"

  // CMS lists state
  const [posts, setPosts] = useState([]);
  const [notices, setNotices] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Menus CRUD states simplified (handled in /admin/write)

  // Form states (Notices CRUD)
  const [editingNoticeId, setEditingNoticeId] = useState(null);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");

  useEffect(() => {
    async function checkAdminAuth() {
      const isSimulatedAdmin = document.cookie.includes("user-role=admin");
      if (isSimulatedAdmin) {
        const mockUser = {
          id: "mock-admin-id",
          email: "admin@mottikitchen.com",
          user_metadata: { full_name: "테스트 사장님" }
        };
        const mockProfile = {
          id: "mock-admin-id",
          email: "admin@mottikitchen.com",
          role: "admin",
          membership: "premium"
        };
        setAdminUser(mockUser);
        setAdminProfile(mockProfile);
        await Promise.all([fetchPosts(), fetchNotices(), fetchUsers()]);
        setIsLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setAdminUser(user);
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
        
      if (!profile || profile.role !== "admin") {
        alert("관리자 권한이 없습니다. 로그인 화면으로 이동합니다.");
        router.push("/login");
        return;
      }
      setAdminProfile(profile);
      
      // Fetch all CMS tables
      await Promise.all([fetchPosts(), fetchNotices(), fetchUsers()]);
      setIsLoading(false);
    }
    
    checkAdminAuth();
  }, []);

  async function fetchPosts() {
    const { data } = await supabase.from("posts").select("*").order("id", { ascending: true });
    const localPostsRaw = localStorage.getItem("local_posts");
    const localPosts = localPostsRaw ? JSON.parse(localPostsRaw) : [];
    const deletedIdsRaw = localStorage.getItem("deleted_post_ids");
    const deletedIds = deletedIdsRaw ? JSON.parse(deletedIdsRaw) : [];
    const dbData = data || [];
    
    // Merge: filter deleted DB posts, and overwrite modified DB posts
    let merged = dbData.filter(p => !deletedIds.includes(p.id));
    merged = merged.map(p => {
      const localMod = localPosts.find(lp => lp.id === p.id);
      return localMod ? { ...p, ...localMod } : p;
    });
    
    // Add local-only posts
    const newLocalPosts = localPosts.filter(lp => !dbData.some(p => p.id === lp.id) && !deletedIds.includes(lp.id));
    setPosts([...newLocalPosts, ...merged]);
  }

  async function fetchNotices() {
    const { data } = await supabase.from("notices").select("*").order("created_at", { ascending: false });
    const localNoticesRaw = localStorage.getItem("local_notices");
    const localNotices = localNoticesRaw ? JSON.parse(localNoticesRaw) : [];
    const deletedNoticeIdsRaw = localStorage.getItem("deleted_notice_ids");
    const deletedNoticeIds = deletedNoticeIdsRaw ? JSON.parse(deletedNoticeIdsRaw) : [];
    const dbData = data || [];
    
    // Merge: filter deleted DB notices, and overwrite modified DB notices
    let merged = dbData.filter(n => !deletedNoticeIds.includes(n.id));
    merged = merged.map(n => {
      const localMod = localNotices.find(ln => ln.id === n.id);
      return localMod ? { ...n, ...localMod } : n;
    });
    
    // Add local-only notices
    const newLocalNotices = localNotices.filter(ln => !dbData.some(n => n.id === ln.id) && !deletedNoticeIds.includes(ln.id));
    const finalNotices = [...newLocalNotices, ...merged].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setNotices(finalNotices);
  }

  async function fetchUsers() {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setUsers(data);
  }

  // ==========================================
  // [CRUD] 1. Menus (Posts) Management
  // ==========================================
  const handleToggleStatus = async (postId, currentStatus) => {
    const nextStatus = currentStatus === "published" ? "draft" : "published";
    const isSimulatedAdmin = document.cookie.includes("user-role=admin");

    if (isSimulatedAdmin) {
      const localPostsRaw = localStorage.getItem("local_posts");
      const localPosts = localPostsRaw ? JSON.parse(localPostsRaw) : [];
      
      const existingIndex = localPosts.findIndex(p => p.id === postId);
      if (existingIndex > -1) {
        localPosts[existingIndex].status = nextStatus;
        localPosts[existingIndex].updated_at = new Date().toISOString();
      } else {
        const originalPost = posts.find(p => p.id === postId);
        if (originalPost) {
          localPosts.push({ ...originalPost, status: nextStatus, updated_at: new Date().toISOString() });
        }
      }
      localStorage.setItem("local_posts", JSON.stringify(localPosts));
      fetchPosts();
      return;
    }

    const { error } = await supabase
      .from("posts")
      .update({ status: nextStatus })
      .eq("id", postId);

    if (error) {
      alert("상태 변경 실패: " + error.message);
    } else {
      fetchPosts();
    }
  };

  const handleDeleteClick = async (postId) => {
    if (!confirm("정말 이 메뉴를 삭제하시겠습니까?")) return;
    const isSimulatedAdmin = document.cookie.includes("user-role=admin");

    if (isSimulatedAdmin) {
      const deletedIdsRaw = localStorage.getItem("deleted_post_ids");
      const deletedIds = deletedIdsRaw ? JSON.parse(deletedIdsRaw) : [];
      if (!deletedIds.includes(postId)) {
        deletedIds.push(postId);
        localStorage.setItem("deleted_post_ids", JSON.stringify(deletedIds));
      }
      
      const localPostsRaw = localStorage.getItem("local_posts");
      if (localPostsRaw) {
        const localPosts = JSON.parse(localPostsRaw);
        localStorage.setItem("local_posts", JSON.stringify(localPosts.filter(p => p.id !== postId)));
      }
      
      alert("성공적으로 삭제되었습니다.");
      fetchPosts();
      return;
    }

    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      alert("삭제 실패: " + error.message);
    } else {
      alert("성공적으로 삭제되었습니다.");
      fetchPosts();
    }
  };

  // ==========================================
  // [CRUD] 2. Notices Management
  // ==========================================
  const handleNoticeSubmit = async (e) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      alert("제목과 내용을 입력해 주세요.");
      return;
    }

    setIsSubmitLoading(true);

    const isSimulatedAdmin = document.cookie.includes("user-role=admin");
    if (isSimulatedAdmin) {
      const localNoticesRaw = localStorage.getItem("local_notices");
      const localNotices = localNoticesRaw ? JSON.parse(localNoticesRaw) : [];

      if (editingNoticeId) {
        // UPDATE local notice
        const existingIndex = localNotices.findIndex(n => n.id === editingNoticeId);
        const updatedNotice = {
          id: editingNoticeId,
          title: noticeTitle.trim(),
          content: noticeContent.trim(),
          updated_at: new Date().toISOString()
        };
        
        if (existingIndex > -1) {
          localNotices[existingIndex] = { ...localNotices[existingIndex], ...updatedNotice };
        } else {
          const original = notices.find(n => n.id === editingNoticeId);
          localNotices.push({ ...original, ...updatedNotice });
        }
        localStorage.setItem("local_notices", JSON.stringify(localNotices));
        alert("🎉 [테스트 시뮬레이션] 공지사항이 로컬 스토리지에 수정되었습니다.");
      } else {
        // CREATE local notice
        const newNotice = {
          id: "local_n_" + Date.now(),
          title: noticeTitle.trim(),
          content: noticeContent.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        localStorage.setItem("local_notices", JSON.stringify([newNotice, ...localNotices]));
        alert("🎉 [테스트 시뮬레이션] 새 공지사항이 로컬 스토리지에 등록되었습니다.");
      }

      resetNoticeForm();
      fetchNotices();
      setIsSubmitLoading(false);
      return;
    }

    const noticePayload = {
      title: noticeTitle.trim(),
      content: noticeContent.trim(),
      updated_at: new Date().toISOString()
    };

    if (editingNoticeId) {
      // UPDATE Notice
      const { error } = await supabase
        .from("notices")
        .update(noticePayload)
        .eq("id", editingNoticeId);

      if (error) {
        alert("공지 수정 실패: " + error.message);
      } else {
        alert("🎉 공지사항이 성공적으로 수정되었습니다.");
        resetNoticeForm();
        fetchNotices();
      }
    } else {
      // CREATE Notice
      const { error } = await supabase
        .from("notices")
        .insert([noticePayload]);

      if (error) {
        alert("공지 등록 실패: " + error.message);
      } else {
        alert("🎉 새 공지사항이 등록되었습니다.");
        resetNoticeForm();
        fetchNotices();
      }
    }
    setIsSubmitLoading(false);
  };

  const handleEditNotice = (notice) => {
    setEditingNoticeId(notice.id);
    setNoticeTitle(notice.title);
    setNoticeContent(notice.content);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!confirm("정말 이 공지사항을 삭제하시겠습니까?")) return;
    const isSimulatedAdmin = document.cookie.includes("user-role=admin");

    if (isSimulatedAdmin) {
      const deletedNoticeIdsRaw = localStorage.getItem("deleted_notice_ids");
      const deletedNoticeIds = deletedNoticeIdsRaw ? JSON.parse(deletedNoticeIdsRaw) : [];
      if (!deletedNoticeIds.includes(noticeId)) {
        deletedNoticeIds.push(noticeId);
        localStorage.setItem("deleted_notice_ids", JSON.stringify(deletedNoticeIds));
      }
      
      const localNoticesRaw = localStorage.getItem("local_notices");
      if (localNoticesRaw) {
        const localNotices = JSON.parse(localNoticesRaw);
        localStorage.setItem("local_notices", JSON.stringify(localNotices.filter(n => n.id !== noticeId)));
      }
      
      alert("성공적으로 삭제되었습니다.");
      fetchNotices();
      if (editingNoticeId === noticeId) resetNoticeForm();
      return;
    }

    const { error } = await supabase.from("notices").delete().eq("id", noticeId);
    if (error) {
      alert("삭제 실패: " + error.message);
    } else {
      alert("성공적으로 삭제되었습니다.");
      fetchNotices();
      if (editingNoticeId === noticeId) resetNoticeForm();
    }
  };

  const resetNoticeForm = () => {
    setEditingNoticeId(null);
    setNoticeTitle("");
    setNoticeContent("");
  };

  // ==========================================
  // [CRUD] 3. Membership Users Management
  // ==========================================
  const handleToggleRole = async (userId, currentRole) => {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    if (userId === adminUser.id && nextRole === "user") {
      alert("자기 자신의 관리자 권한은 회수할 수 없습니다!");
      return;
    }
    if (!confirm(`이 회원의 역할을 [${nextRole}] (으)로 변경하시겠습니까?`)) return;

    const { error } = await supabase
      .from("profiles")
      .update({ role: nextRole })
      .eq("id", userId);

    if (error) {
      alert("역할 변경 실패: " + error.message);
    } else {
      alert("역할이 성공적으로 변경되었습니다.");
      fetchUsers();
    }
  };

  const handleToggleMembership = async (userId, currentMembership) => {
    const nextMembership = currentMembership === "premium" ? "basic" : "premium";
    if (!confirm(`이 회원의 멤버십 등급을 [${nextMembership}] (으)로 변경하시겠습니까?`)) return;

    const { error } = await supabase
      .from("profiles")
      .update({ membership: nextMembership })
      .eq("id", userId);

    if (error) {
      alert("멤버십 변경 실패: " + error.message);
    } else {
      alert("멤버십 등급이 성공적으로 변경되었습니다.");
      fetchUsers();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-beige flex items-center justify-center">
        <div className="text-center space-y-2">
          <span className="text-3xl animate-bounce inline-block">🌱</span>
          <p className="text-sm font-bold text-brand-brown">관리자 페이지 인증 및 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* 1. Dashboard Header */}
      <div className="border-b border-brand-green/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-brand-orange uppercase tracking-[0.25em]">CMS Control Panel</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-green font-serif mt-1">mottikitchen CMS 대시보드</h1>
          <p className="text-xs text-brand-brown-light mt-1">
            접속자: <span className="font-semibold text-brand-green">{adminUser.email}</span> (역할: 사장님)
          </p>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="text-xs font-semibold bg-brand-brown hover:bg-brand-brown-light text-white px-5 py-2.5 rounded-xl transition-all"
        >
          🔒 개인 대시보드로 돌아가기
        </button>
      </div>

      {/* 2. CMS Section Tab Navigator */}
      <div className="flex border-b border-brand-green/15 gap-2">
        {[
          { id: "menus", label: "🥦 메뉴 관리" },
          { id: "notices", label: "📢 공지사항 관리" },
          { id: "users", label: "👥 회원 관리" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCmsTab(tab.id)}
            className={`px-6 py-3 text-xs sm:text-sm font-extrabold border-t-2 border-x transition-all duration-300 rounded-t-xl ${
              cmsTab === tab.id
                ? "bg-white border-t-brand-green border-x-brand-green/15 text-brand-green"
                : "bg-brand-beige/50 border-t-transparent border-x-transparent text-brand-brown-light hover:bg-brand-sage/35"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. CMS Dynamic Content Area */}
      <div className="transition-all duration-300">
        
        {/* ==================================================== */}
        {/* [CMS Tab 1] Menus (Posts) Management */}
        {/* ==================================================== */}
        {cmsTab === "menus" && (
          <div className="w-full p-6 rounded-2xl glass-card">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-lg font-bold text-brand-brown font-serif">
                  🥦 등록된 메뉴 목록 (posts)
                </h2>
                <p className="text-[10px] text-brand-brown-light">
                  Supabase database의 posts 테이블에 등록된 모든 메뉴 리스트를 조회하고 상태를 변경합니다.
                </p>
              </div>
              <button
                onClick={() => router.push("/admin/write")}
                className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-brand-green/10 flex items-center gap-1 cursor-pointer"
              >
                ➕ 신규 메뉴 등록
              </button>
            </div>

            {posts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-brand-green/10 text-brand-brown-light/80 font-bold text-left">
                      <th className="pb-3 text-left">메뉴명 (영문)</th>
                      <th className="pb-3 text-center">노출 상태</th>
                      <th className="pb-3 text-right">금액</th>
                      <th className="pb-3 text-right">칼로리</th>
                      <th className="pb-3 text-center">멤버십 전용</th>
                      <th className="pb-3 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-brand-sage/20 transition-colors">
                        <td className="py-4">
                          <div className="font-bold text-brand-brown">{post.title}</div>
                          {post.english_name && (
                            <div className="text-[9px] text-brand-brown-light/65 font-display mt-0.5">{post.english_name}</div>
                          )}
                        </td>
                        <td className="py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(post.id, post.status)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold cursor-pointer transition-all border ${
                              post.status === "published"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-zinc-50 text-zinc-400 border-zinc-200 hover:bg-zinc-100"
                            }`}
                          >
                            {post.status === "published" ? "🟢 공개 중" : "⚪ 임시 저장"}
                          </button>
                        </td>
                        <td className="py-4 text-right font-semibold text-brand-green">
                          {typeof post.price === "number" ? `${post.price.toLocaleString()}원` : post.price}
                        </td>
                        <td className="py-4 text-right">{post.calories} kcal</td>
                        <td className="py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            post.is_premium ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-400"
                          }`}>
                            {post.is_premium ? "👑 Premium" : "일반"}
                          </span>
                        </td>
                        <td className="py-4 text-center space-x-2">
                          <button
                            onClick={() => router.push(`/admin/write?edit=${post.id}`)}
                            className="bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white px-2.5 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteClick(post.id)}
                            className="bg-red-50 text-red-650 hover:bg-red-650 hover:text-white px-2.5 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-brand-brown-light/70 text-xs bg-brand-sage/10 rounded-xl border border-dashed border-brand-green/10">
                등록된 메뉴가 존재하지 않습니다. 상단 우측 버튼을 눌러 첫 신규 메뉴를 등록해 주세요! 🌱
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* [CMS Tab 2] Notices Management */}
        {/* ==================================================== */}
        {cmsTab === "notices" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Editor Form */}
            <div className="lg:col-span-4 p-6 rounded-2xl glass-card space-y-6">
              <div>
                <h2 className="text-lg font-bold text-brand-brown font-serif">
                  {editingNoticeId ? "📝 공지사항 수정" : "📢 신규 공지 등록"}
                </h2>
                <p className="text-[10px] text-brand-brown-light">
                  {editingNoticeId ? "공지사항 내용을 수정하고 반영합니다." : "홈페이지 공지 아코디언에 노출될 새 소식을 등록합니다."}
                </p>
              </div>

              <form onSubmit={handleNoticeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-brown mb-1">공지 제목 *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: [안내] 휴무일 일정 공지"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-brand-green/15 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green bg-white/70"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-brown mb-1">공지 본문 내용 *</label>
                  <textarea
                    rows={8}
                    required
                    placeholder="공지할 세부 내용을 기입해 주세요."
                    value={noticeContent}
                    onChange={(e) => setNoticeContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-brand-green/15 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green bg-white/70"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitLoading}
                    className="flex-grow bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md shadow-brand-green/10 disabled:opacity-50"
                  >
                    {editingNoticeId ? "공지 수정완료" : "공지 등록하기"}
                  </button>
                  {editingNoticeId && (
                    <button
                      type="button"
                      onClick={resetNoticeForm}
                      className="bg-brand-brown/10 hover:bg-brand-brown/20 text-brand-brown text-xs font-semibold px-4 py-3 rounded-xl transition-all"
                    >
                      취소
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List Table */}
            <div className="lg:col-span-8 p-6 rounded-2xl glass-card">
              <h2 className="text-base font-bold text-brand-brown font-serif mb-4">
                📢 등록된 공지사항 목록 ({notices.length}개)
              </h2>
              {notices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-brand-green/10 text-brand-brown-light/80 font-bold text-left">
                        <th className="pb-3 text-left">공지 제목</th>
                        <th className="pb-3 text-left">내용 요약</th>
                        <th className="pb-3 text-center">등록일</th>
                        <th className="pb-3 text-center">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {notices.map((n) => (
                        <tr key={n.id} className="hover:bg-brand-sage/20 transition-colors">
                          <td className="py-4 font-bold text-brand-brown max-w-[150px] truncate">{n.title}</td>
                          <td className="py-4 text-brand-brown-light/75 max-w-[220px] truncate">{n.content}</td>
                          <td className="py-4 text-center text-brand-brown-light/60">
                            {new Date(n.created_at).toLocaleDateString("ko-KR", {
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="py-4 text-center space-x-2">
                            <button
                              onClick={() => handleEditNotice(n)}
                              className="bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white px-2 py-1 rounded text-[10px] font-bold transition-all"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteNotice(n.id)}
                              className="bg-red-50 text-red-650 hover:bg-red-600 hover:text-white px-2 py-1 rounded text-[10px] font-bold transition-all"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-brand-brown-light/70 text-xs">
                  등록된 공지사항이 없습니다. 좌측 폼을 이용해 새 공지를 등록하세요.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* [CMS Tab 3] Membership Users Management */}
        {/* ==================================================== */}
        {cmsTab === "users" && (
          <div className="p-6 rounded-2xl glass-card">
            <h2 className="text-base font-bold text-brand-brown font-serif mb-6">
              👥 가입 회원 역할 및 멤버십 관리 ({users.length}명)
            </h2>
            {users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-brand-green/10 text-brand-brown-light/80 font-bold text-left">
                      <th className="pb-3 text-left">이메일 주소</th>
                      <th className="pb-3 text-left">표시 이름</th>
                      <th className="pb-3 text-center">권한 등급 (Role)</th>
                      <th className="pb-3 text-center">멤버십 레벨 (Membership)</th>
                      <th className="pb-3 text-center">등급 변경</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-brand-sage/20 transition-colors">
                        <td className="py-4 font-bold text-brand-brown">{u.email}</td>
                        <td className="py-4 text-brand-brown-light/70">{u.display_name || "-"}</td>
                        <td className="py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            u.role === "admin" ? "bg-red-100 text-red-800" : "bg-zinc-100 text-zinc-600"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            u.membership === "premium" ? "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse" : "bg-zinc-50 text-zinc-400 border border-zinc-200"
                          }`}>
                            {u.membership || "basic"}
                          </span>
                        </td>
                        <td className="py-4 text-center space-x-2">
                          <button
                            onClick={() => handleToggleRole(u.id, u.role)}
                            className="bg-brand-brown/5 hover:bg-brand-brown/15 text-brand-brown px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all"
                          >
                            역할 토글
                          </button>
                          <button
                            onClick={() => handleToggleMembership(u.id, u.membership)}
                            className="bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all"
                          >
                            멤버십 토글
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-brand-brown-light/70 text-xs">
                데이터베이스에 조회되는 프로필 정보가 없습니다.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
