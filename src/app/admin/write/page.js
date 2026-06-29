"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../utils/supabase";

export default function AdminWritePageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-beige flex items-center justify-center">
        <div className="text-center space-y-2">
          <span className="text-3xl animate-bounce inline-block">🌱</span>
          <p className="text-sm font-bold text-brand-brown">페이지를 불러오는 중입니다...</p>
        </div>
      </div>
    }>
      <AdminWritePage />
    </Suspense>
  );
}

function AdminWritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [englishName, setEnglishName] = useState("");
  const [category, setCategory] = useState("sandwich");
  const [content, setContent] = useState("");
  const [price, setPrice] = useState("");
  const [calories, setCalories] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [status, setStatus] = useState("published");

  useEffect(() => {
    async function initPage() {
      // 1. Auth check
      const isSimulatedAdmin = document.cookie.includes("user-role=admin");
      if (isSimulatedAdmin) {
        const mockUser = {
          id: "mock-admin-id",
          email: "admin@mottikitchen.com",
          user_metadata: { full_name: "테스트 사장님" }
        };
        setAdminUser(mockUser);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Strict admin email check
        if (user.email !== "o1027770162@gmail.com" && user.email !== "admin@mottikitchen.com") {
          alert("관리자 권한이 없습니다. 로그인 화면으로 이동합니다.");
          router.push("/login");
          return;
        }
        setAdminUser(user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (user.email === "o1027770162@gmail.com") {
          // Update database role to admin in background if not already
          if (!profile || profile.role !== "admin") {
            supabase.from("profiles").upsert({
              id: user.id,
              email: user.email,
              role: "admin",
              membership: profile?.membership || "premium"
            }).then();
          }
        } else {
          if (!profile || profile.role !== "admin") {
            alert("관리자 권한이 없습니다. 로그인 화면으로 이동합니다.");
            router.push("/login");
            return;
          }
        }
      }

      // 2. Fetch post data if editing
      if (editId) {
        let post = null;
        
        // 1. Try local storage first
        const localPostsRaw = localStorage.getItem("local_posts");
        if (localPostsRaw) {
          const localPosts = JSON.parse(localPostsRaw);
          post = localPosts.find(p => p.id === editId || p.id.toString() === editId.toString());
        }

        // 2. Try Supabase if not found and not a local ID
        if (!post && !editId.toString().startsWith("local_")) {
          const { data, error } = await supabase
            .from("posts")
            .select("*")
            .eq("id", editId)
            .single();
          if (!error) {
            post = data;
          }
        }

        if (!post) {
          alert("해당 메뉴 데이터를 찾을 수 없습니다.");
          router.push("/admin");
          return;
        }

        setTitle(post.title);
        setEnglishName(post.english_name || "");
        setCategory(post.category || "sandwich");
        setContent(post.content || "");
        setPrice(post.price.toString());
        setCalories(post.calories.toString());
        setImageUrl(post.image_url || post.imageUrl || "");
        setIngredientsText(post.ingredients ? post.ingredients.join(", ") : "");
        setIsPremium(post.is_premium || false);
        setStatus(post.status || "published");
      }

      setIsLoading(false);
    }

    initPage();
  }, [editId]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("이미지 파일 크기는 2MB 이하여야 합니다.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !price || !calories) {
      alert("필수 항목(메뉴명, 금액, 칼로리)을 입력해 주세요.");
      return;
    }

    setIsSubmitLoading(true);
    const ingredientsArray = ingredientsText
      ? ingredientsText.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

    const isSimulatedAdmin = document.cookie.includes("user-role=admin");

    const postPayload = {
      title: title.trim(),
      english_name: englishName.trim(),
      content: content.trim(),
      price: Number(price),
      calories: Number(calories),
      image_url: imageUrl.trim() || "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600",
      ingredients: ingredientsArray,
      is_premium: isPremium,
      category: category,
      status: status,
      updated_at: new Date().toISOString()
    };

    try {
      if (isSimulatedAdmin) {
        const localPostsRaw = localStorage.getItem("local_posts");
        const localPosts = localPostsRaw ? JSON.parse(localPostsRaw) : [];

        if (editId) {
          // Update existing local or DB-derived post
          const existingIndex = localPosts.findIndex(p => p.id === editId || p.id.toString() === editId.toString());
          const updatedPost = {
            id: editId.toString().startsWith("local_") ? editId : Number(editId),
            ...postPayload
          };
          
          if (existingIndex > -1) {
            localPosts[existingIndex] = updatedPost;
          } else {
            localPosts.push(updatedPost);
          }
          localStorage.setItem("local_posts", JSON.stringify(localPosts));
          alert("🎉 [시뮬레이션] 메뉴가 로컬 스토리지에 수정되었습니다.");
        } else {
          // Insert new local post
          const newPost = {
            id: "local_" + Date.now(),
            ...postPayload,
            created_at: new Date().toISOString()
          };
          localStorage.setItem("local_posts", JSON.stringify([...localPosts, newPost]));
          alert("🎉 [시뮬레이션] 새 메뉴가 로컬 스토리지에 등록되었습니다.");
        }
      } else {
        if (editId) {
          // UPDATE existing post
          const { error } = await supabase
            .from("posts")
            .update(postPayload)
            .eq("id", editId);

          if (error) throw error;
          alert("🎉 메뉴가 성공적으로 수정되었습니다.");
        } else {
          // INSERT new post
          const { error } = await supabase
            .from("posts")
            .insert([{
              ...postPayload,
              created_at: new Date().toISOString()
            }]);

          if (error) throw error;
          alert("🎉 새 메뉴가 성공적으로 등록되었습니다.");
        }
      }
      router.push("/admin");
    } catch (error) {
      alert("오류 발생: " + error.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-beige flex items-center justify-center">
        <div className="text-center space-y-2">
          <span className="text-3xl animate-bounce inline-block">🌱</span>
          <p className="text-sm font-bold text-brand-brown">인증 및 메뉴 데이터 조회 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-white p-8 rounded-2xl border border-brand-green/10 shadow-xl space-y-6 text-left">
        {/* Header */}
        <div className="border-b border-brand-green/10 pb-4">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-orange">
            {editId ? "Edit Item Form" : "New Item Form"}
          </span>
          <h1 className="text-2xl font-extrabold text-brand-green font-serif mt-1">
            {editId ? "🥦 메뉴 정보 수정하기" : "🥦 신규 메뉴 등록하기"}
          </h1>
          <p className="text-[11px] text-brand-brown-light mt-1.5">
            데이터베이스에 저장될 메뉴의 카테고리, 속성 및 노출 상태를 설정합니다.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-brand-brown mb-1.5">메뉴 이름 *</label>
            <input
              type="text"
              required
              placeholder="예: 꿀 무화과 샐러드"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-brand-green/15 focus:outline-none focus:ring-1 focus:ring-brand-green rounded-xl bg-white text-brand-brown text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-brand-brown mb-1.5">영문 이름</label>
            <input
              type="text"
              placeholder="English name"
              value={englishName}
              onChange={(e) => setEnglishName(e.target.value)}
              className="w-full p-3 border border-brand-green/15 focus:outline-none focus:ring-1 focus:ring-brand-green rounded-xl bg-white text-brand-brown text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-brand-brown mb-1.5">카테고리 분류</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 border border-brand-green/15 focus:outline-none focus:ring-1 focus:ring-brand-green rounded-xl bg-white text-brand-brown text-xs"
              >
                <option value="sandwich">샌드위치 (sandwich)</option>
                <option value="salad">샐러드 (salad)</option>
                <option value="poke">포케 (poke)</option>
                <option value="beverage">건강 음료 (beverage)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-brand-brown mb-1.5">노출 상태 (Status)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-3 border border-brand-green/15 focus:outline-none focus:ring-1 focus:ring-brand-green rounded-xl bg-white text-brand-brown text-xs"
              >
                <option value="published">🟢 즉시 공개 (published)</option>
                <option value="draft">⚪ 임시 저장 (draft)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-brand-brown mb-1.5">가격 (원) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="가격 입력"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-3 border border-brand-green/15 focus:outline-none focus:ring-1 focus:ring-brand-green rounded-xl bg-white text-brand-brown text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-brand-brown mb-1.5">칼로리 (kcal) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="칼로리 입력"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="w-full p-3 border border-brand-green/15 focus:outline-none focus:ring-1 focus:ring-brand-green rounded-xl bg-white text-brand-brown text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-brand-brown mb-1.5">상세 내용 설명</label>
            <textarea
              rows={3}
              placeholder="메뉴에 대한 상세 정보 또는 설명글을 입력해 주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 border border-brand-green/15 focus:outline-none focus:ring-1 focus:ring-brand-green rounded-xl bg-white text-brand-brown text-xs leading-relaxed"
            />
          </div>

          <div>
            <label className="block font-bold text-brand-brown mb-1.5">메뉴 이미지</label>
            
            {imageUrl ? (
              <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-brand-green/15 shadow-inner mb-3">
                <img
                  src={imageUrl}
                  alt="Menu Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 bg-red-650 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs shadow-md transition-colors cursor-pointer"
                  title="이미지 제거"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="border border-dashed border-brand-green/15 rounded-xl p-6 text-center bg-zinc-50/50 mb-3 flex flex-col items-center justify-center">
                <span className="text-2xl mb-1.5">🥗</span>
                <p className="text-[10px] text-brand-brown-light mb-2">등록된 사진이 없습니다. 기기에서 사진을 업로드해 주세요.</p>
              </div>
            )}

            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="menu-image-upload"
              />
              <label
                htmlFor="menu-image-upload"
                className="inline-flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-hover text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm shadow-brand-green/10 cursor-pointer"
              >
                📷 내 사진 가져오기
              </label>
            </div>
          </div>

          <div>
            <label className="block font-bold text-brand-brown mb-1.5">재료 태그 (쉼표로 구분)</label>
            <input
              type="text"
              placeholder="호밀 식빵, 리코타 치즈, 아몬드, 벌꿀"
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              className="w-full p-3 border border-brand-green/15 focus:outline-none focus:ring-1 focus:ring-brand-green rounded-xl bg-white text-brand-brown text-xs"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-brand-sage/40 rounded-xl border border-brand-green/15">
            <span className="font-bold text-brand-brown">👑 Premium 멤버십 전용 설정</span>
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
              className="w-4 h-4 text-brand-green rounded focus:ring-brand-green border-zinc-300 cursor-pointer"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-brand-green/10 mt-6">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="flex-1 bg-white hover:bg-zinc-50 border border-brand-brown/15 text-brand-brown-light font-bold py-3 rounded-xl transition-all cursor-pointer text-center"
            >
              목록으로 돌아가기
            </button>
            <button
              type="submit"
              disabled={isSubmitLoading}
              className="flex-1 bg-brand-green hover:bg-brand-green-hover text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-brand-green/10 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitLoading ? "저장 중..." : editId ? "수정 완료하기" : "신규 메뉴 등록하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
