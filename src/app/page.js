"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../utils/supabase";

// Mock data as fallback if Supabase DB is empty or disconnected
const SAMPLE_MENUS = [
  {
    name: "아보카도 칠면조 샌드위치",
    english_name: "Avocado Turkey Sandwich",
    price: 8900,
    calories: 420,
    category: "sandwich",
    ingredients: ["호밀빵", "칠면조 가슴살", "생 아보카도", "토마토", "로메인", "스위스 치즈"],
    imageUrl: "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "바질 페스토 치킨 샌드위치",
    english_name: "Basil Pesto Chicken Sandwich",
    price: 8500,
    calories: 480,
    category: "sandwich",
    ingredients: ["치아바타", "수비드 닭가슴살", "생바질 페스토", "생모짜렐라 치즈", "루꼴라"],
    imageUrl: "https://images.unsplash.com/photo-1567234669003-dce7a7a88821?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "에그 포테이토 통밀 샌드위치",
    english_name: "Egg Potato Wholewheat Sandwich",
    price: 7900,
    calories: 390,
    category: "sandwich",
    ingredients: ["통밀식빵", "으깬 감자", "삶은 달걀", "오이 피클", "홀그레인 마요"],
    imageUrl: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "비프 머쉬룸 치아바타",
    english_name: "Beef Mushroom Ciabatta",
    price: 9500,
    calories: 520,
    category: "sandwich",
    ingredients: ["치아바타", "우삼겹 불고기", "구운 만가닥버섯", "체다치즈", "바비큐 소스"],
    imageUrl: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "그릴드 치킨 퀴노아 샐러드",
    english_name: "Grilled Chicken Quinoa Salad",
    price: 10500,
    calories: 380,
    category: "salad",
    ingredients: ["믹스 그린", "그릴드 닭가슴살", "레드 퀴노아", "병아리콩", "발사믹 드레싱"],
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "리코타 꿀무화과 샐러드",
    english_name: "Ricotta Fig Salad",
    price: 11000,
    calories: 340,
    category: "salad",
    ingredients: ["믹스 그린", "수제 리코타 치즈", "반건조 무화과", "구운 호두", "꿀 드레싱"],
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "연어 아보카도 그린 샐러드",
    english_name: "Salmon Avocado Salad",
    price: 12000,
    calories: 410,
    category: "salad",
    ingredients: ["로메인", "생연어 슬라이스", "아보카도", "케이퍼", "어니언 레몬 드레싱"],
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "구운 단호박 텐더 샐러드",
    english_name: "Roasted Pumpkin Tender Salad",
    price: 9800,
    calories: 350,
    category: "salad",
    ingredients: ["믹스그린", "오븐구이 단호박", "바삭한 치킨텐더", "방울토마토", "머스타드 드레싱"],
    imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "클래식 생연어 포케",
    english_name: "Classic Fresh Salmon Poke",
    price: 12900,
    calories: 510,
    category: "poke",
    ingredients: ["유기농 현미밥", "생연어 큐브", "아보카도", "날치알", "해초", "스파이시 마요 소스"],
    imageUrl: "https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "소이 진저 참치 포케",
    english_name: "Soy Ginger Tuna Poke",
    price: 12500,
    calories: 460,
    category: "poke",
    ingredients: ["귀리 현미밥", "황다랑어 큐브", "에다마메", "어니언 플래이크", "소이진저 소스"],
    imageUrl: "https://images.unsplash.com/photo-1546069901-31d3b4b52b57?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "스파이시 쉬림프 포케",
    english_name: "Spicy Shrimp Poke",
    price: 11900,
    calories: 430,
    category: "poke",
    ingredients: ["현미밥", "버터구이 새우", "파인애플", "크랩 샐러드", "매콤 갈릭 소스"],
    imageUrl: "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "비건 두부 버섯 포케",
    english_name: "Vegan Tofu Mushroom Poke",
    price: 10900,
    calories: 390,
    category: "poke",
    ingredients: ["귀리밥", "구운 두부 큐브", "느타리버섯", "병아리콩", "참깨 비건 드레싱"],
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "그린 케일 디톡스 주스",
    english_name: "Green Kale Detox Juice",
    price: 6500,
    calories: 120,
    category: "beverage",
    ingredients: ["유기농 케일", "생 레몬", "풋사과", "아카시아 꿀"],
    imageUrl: "https://images.unsplash.com/photo-1610970881699-44a5587caa90?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "아보카도 바나나 올밀크",
    english_name: "Avocado Banana Smoothie",
    price: 7000,
    calories: 290,
    category: "beverage",
    ingredients: ["생 아보카도", "완숙 바나나", "락토프리 저지방 우유"],
    imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "올가닉 코코넛 오트 라떼",
    english_name: "Organic Coconut Oat Latte",
    price: 5500,
    calories: 180,
    category: "beverage",
    ingredients: ["에스프레소 원액", "유기농 코코넛 시럽", "무설탕 오트밀크"],
    imageUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=600",
  },
];

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-brand-beige text-brand-brown font-semibold text-sm">
        🌱 로딩 중...
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "home";

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuTab, setMenuTab] = useState("sandwich");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [openDropdownIdx, setOpenDropdownIdx] = useState(0);
  const [dbPosts, setDbPosts] = useState([]);
  const [dbNotices, setDbNotices] = useState([]);
  const [expandedNoticeId, setExpandedNoticeId] = useState(null);

  // --- B2B Form States ---
  const [b2bCompanyName, setB2bCompanyName] = useState("");
  const [b2bContactName, setB2bContactName] = useState("");
  const [b2bEmail, setB2bEmail] = useState("");
  const [b2bGroupSize, setB2bGroupSize] = useState(10);
  const [b2bType, setB2bType] = useState("catering_box");
  const [b2bContent, setB2bContent] = useState("");
  const [b2bSubmitting, setB2bSubmitting] = useState(false);

  // --- Community Sub-tab State ---
  const [communitySubTab, setCommunitySubTab] = useState("notice");

  const handleB2bSubmit = (e) => {
    e.preventDefault();
    if (!b2bCompanyName.trim() || !b2bContactName.trim() || !b2bEmail.trim()) {
      alert("필수 항목을 모두 채워주세요.");
      return;
    }
    setB2bSubmitting(true);
    setTimeout(() => {
      alert(`🎉 문의가 정상적으로 접수되었습니다!\n\n회사명: ${b2bCompanyName}\n담당자: ${b2bContactName}\n희망 케이터링: ${b2bType === "catering_box" ? "런치박스 패키지" : b2bType === "breakfast" ? "정기 조식 배달" : "행사 케이터링 뷔페"}\n\n기재하신 이메일(${b2bEmail})로 신속하게 제안서와 견적을 보내드리겠습니다.`);
      setB2bCompanyName("");
      setB2bContactName("");
      setB2bEmail("");
      setB2bGroupSize(10);
      setB2bType("catering_box");
      setB2bContent("");
      setB2bSubmitting(false);
    }, 800);
  };

  // --- Customer Reviews & Comments States ---
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewImageUrl, setReviewImageUrl] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [activeReplyReviewId, setActiveReplyReviewId] = useState(null);
  const [replyCommentText, setReplyCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  // Helper to mask emails
  function maskEmail(email) {
    if (!email) return "익명";
    const [username, domain] = email.split("@");
    if (!domain) return email;
    if (username.length <= 3) {
      return `${username.slice(0, 1)}**@${domain}`;
    }
    return `${username.slice(0, 3)}***@${domain}`;
  }

  async function fetchReviewsAndComments() {
    setLoadingReviews(true);
    try {
      const { data: revData, error: revErr } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (revErr) throw revErr;
      setReviews(revData || []);

      const { data: commData, error: commErr } = await supabase
        .from("review_comments")
        .select("*")
        .order("created_at", { ascending: true });

      if (commErr) throw commErr;
      setComments(commData || []);
    } catch (err) {
      console.log("Error fetching reviews/comments:", err);
    } finally {
      setLoadingReviews(false);
    }
  }

  const openWriteModal = (review = null) => {
    if (!user) {
      alert("로그인 후 이용하실 수 있습니다.");
      return;
    }
    if (review) {
      setEditingReview(review);
      setReviewTitle(review.title);
      setReviewContent(review.content);
      setReviewRating(review.rating);
      setReviewImageUrl(review.image_url || "");
    } else {
      setEditingReview(null);
      setReviewTitle("");
      setReviewContent("");
      setReviewRating(5);
      setReviewImageUrl("");
    }
    setIsReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    setEditingReview(null);
    setReviewTitle("");
    setReviewContent("");
    setReviewRating(5);
    setReviewImageUrl("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("이미지 파일 크기는 2MB 이하여야 합니다.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setReviewImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
      return;
    }
    if (!reviewTitle.trim() || !reviewContent.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    setSubmittingReview(true);
    try {
      if (editingReview) {
        const { error } = await supabase
          .from("reviews")
          .update({
            title: reviewTitle.trim(),
            content: reviewContent.trim(),
            rating: reviewRating,
            image_url: reviewImageUrl || null,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingReview.id);

        if (error) throw error;
        alert("후기가 수정되었습니다.");
      } else {
        const { error } = await supabase
          .from("reviews")
          .insert({
            user_id: user.id,
            user_email: user.email,
            title: reviewTitle.trim(),
            content: reviewContent.trim(),
            rating: reviewRating,
            image_url: reviewImageUrl || null
          });

        if (error) throw error;
        alert("후기가 등록되었습니다.");
      }
      closeReviewModal();
      fetchReviewsAndComments();
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("리뷰 저장에 실패했습니다. DB가 설정되었는지 확인해 주세요. " + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReviewDelete = async (reviewId) => {
    if (!confirm("정말 이 후기를 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;
      alert("후기가 삭제되었습니다.");
      fetchReviewsAndComments();
    } catch (err) {
      console.error("Error deleting review:", err);
      alert("후기 삭제에 실패했습니다: " + err.message);
    }
  };

  const handleAddComment = async (reviewId) => {
    if (!replyCommentText.trim()) {
      alert("답변 내용을 입력해주세요.");
      return;
    }

    try {
      const { error } = await supabase
        .from("review_comments")
        .insert({
          review_id: reviewId,
          admin_id: user.id,
          admin_email: user.email,
          comment: replyCommentText.trim()
        });

      if (error) throw error;
      alert("답변이 등록되었습니다.");
      setReplyCommentText("");
      setActiveReplyReviewId(null);
      fetchReviewsAndComments();
    } catch (err) {
      console.error("Error adding reply:", err);
      alert("답변 등록 실패: " + err.message);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editingCommentText.trim()) {
      alert("수정할 답변 내용을 입력해주세요.");
      return;
    }

    try {
      const { error } = await supabase
        .from("review_comments")
        .update({
          comment: editingCommentText.trim()
        })
        .eq("id", commentId);

      if (error) throw error;
      alert("답변이 수정되었습니다.");
      setEditingCommentId(null);
      setEditingCommentText("");
      fetchReviewsAndComments();
    } catch (err) {
      console.error("Error updating reply:", err);
      alert("답변 수정 실패: " + err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("정말 이 답변을 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("review_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      alert("답변이 삭제되었습니다.");
      fetchReviewsAndComments();
    } catch (err) {
      console.error("Error deleting reply:", err);
      alert("답변 삭제 실패: " + err.message);
    }
  };

  // Check login user and fetch database posts
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchProfile(user.id, user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser);
      } else {
        setProfile(null);
      }
    });

    fetchPosts();
    fetchNotices();
    fetchReviewsAndComments();

    return () => subscription.unsubscribe();
  }, []);

  async function fetchNotices() {
    try {
      const { data } = await supabase.from("notices").select("*").order("created_at", { ascending: false });
      const localNoticesRaw = localStorage.getItem("local_notices");
      const localNotices = localNoticesRaw ? JSON.parse(localNoticesRaw) : [];
      const deletedNoticeIdsRaw = localStorage.getItem("deleted_notice_ids");
      const deletedNoticeIds = deletedNoticeIdsRaw ? JSON.parse(deletedNoticeIdsRaw) : [];
      const dbData = data || [];
      
      // Filter deleted ones, then overwrite updated ones
      let merged = dbData.filter(n => !deletedNoticeIds.includes(n.id));
      merged = merged.map(n => {
        const localMod = localNotices.find(ln => ln.id === n.id);
        return localMod ? { ...n, ...localMod } : n;
      });
      
      const newLocalNotices = localNotices.filter(ln => !dbData.some(n => n.id === ln.id) && !deletedNoticeIds.includes(ln.id));
      const finalNotices = [...newLocalNotices, ...merged].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setDbNotices(finalNotices);
    } catch (e) {
      console.log("Supabase fetch notices table failed, using mock data.", e);
      try {
        const localNoticesRaw = localStorage.getItem("local_notices");
        if (localNoticesRaw) {
          setDbNotices(JSON.parse(localNoticesRaw));
        }
      } catch (_) {}
    }
  }

  async function fetchProfile(userId, currentUser) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) {
        console.warn("Failed to fetch profile from database:", error.message);
      }

      if (data) {
        const finalRole = currentUser.email === 'o1027770162@gmail.com' ? 'admin' : data.role;
        setProfile({ ...data, role: finalRole });
        // Sync role to cookie for Next.js middleware
        document.cookie = `user-role=${finalRole}; path=/; max-age=3600; SameSite=Lax`;
        document.cookie = `user-email=${currentUser.email}; path=/; max-age=3600; SameSite=Lax`;
        
        // Auto promotion to admin role in database
        if (currentUser.email === 'o1027770162@gmail.com' && data.role !== 'admin') {
          supabase.from("profiles").update({ role: "admin" }).eq("id", currentUser.id).then();
        }
      } else if (currentUser) {
        const fallbackRole = currentUser.email === 'o1027770162@gmail.com' ? 'admin' : (currentUser.user_metadata?.role || 'user');
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
      console.log("Error loading profile:", e);
    }
  }

  async function fetchPosts() {
    try {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .order('id', { ascending: true }); // do not filter in DB query directly so we can merge with local storage status toggles correctly
      
      const localPostsRaw = localStorage.getItem("local_posts");
      const localPosts = localPostsRaw ? JSON.parse(localPostsRaw) : [];
      const deletedIdsRaw = localStorage.getItem("deleted_post_ids");
      const deletedIds = deletedIdsRaw ? JSON.parse(deletedIdsRaw) : [];
      const dbData = data || [];

      // Filter deleted ones, then overwrite updated ones
      let merged = dbData.filter(p => !deletedIds.includes(p.id));
      merged = merged.map(p => {
        const localMod = localPosts.find(lp => lp.id === p.id);
        return localMod ? { ...p, ...localMod } : p;
      });

      const newLocalPosts = localPosts.filter(lp => !dbData.some(p => p.id === lp.id) && !deletedIds.includes(lp.id));
      const allPosts = [...newLocalPosts, ...merged];

      // Final status === 'published' filter for homepage view
      const publishedPosts = allPosts.filter(p => p.status === "published");

      const mapped = publishedPosts.map(post => {
        let cat = post.category;
        if (!cat) {
          cat = "sandwich";
          if (post.title.includes("포케") || post.title.includes("Poke")) cat = "poke";
          else if (post.title.includes("샐러드") || post.title.includes("Salad")) cat = "salad";
        }

        return {
          name: post.title,
          english_name: post.english_name || (cat === "sandwich" ? "Fresh Sandwich" : cat === "poke" ? "Poke Bowl" : cat === "salad" ? "Salad Bowl" : "Beverage"),
          price: post.price,
          calories: post.calories,
          category: cat,
          ingredients: post.ingredients || ["신선한 채소", "자연 조미료", "건강 식재료"],
          imageUrl: post.image_url || post.imageUrl || "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600",
          is_premium: post.is_premium || false
        };
      });

      setDbPosts(mapped);
    } catch (err) {
      console.log("Supabase fetch failed or table doesn't exist, using mock data.", err);
      try {
        const localPostsRaw = localStorage.getItem("local_posts");
        if (localPostsRaw) {
          const localPosts = JSON.parse(localPostsRaw);
          const publishedLocalPosts = localPosts.filter(p => p.status === "published");
          const mapped = publishedLocalPosts.map(post => {
            let cat = post.category || "sandwich";
            return {
              name: post.title,
              english_name: post.english_name || "Fresh Menu",
              price: post.price,
              calories: post.calories,
              category: cat,
              ingredients: post.ingredients || ["신선한 채소", "자연 조미료", "건강 식재료"],
              imageUrl: post.image_url || post.imageUrl || "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600",
              is_premium: post.is_premium || false
            };
          });
          setDbPosts(mapped);
        }
      } catch (_) {}
    }
  }

  // Choose between real database posts or mock fallback data
  const displayMenus = useMemo(() => {
    if (dbPosts.length > 0) {
      // If the database has posts but no beverages, supplement with mock beverages
      const hasBeverage = dbPosts.some((item) => item.category === "beverage");
      if (!hasBeverage) {
        return [...dbPosts, ...SAMPLE_MENUS.filter((item) => item.category === "beverage")];
      }
      return dbPosts;
    }
    return SAMPLE_MENUS;
  }, [dbPosts]);

  // Filter menus based on active tab
  const filteredMenus = useMemo(() => {
    return displayMenus.filter(item => item.category === menuTab).slice(0, 4); // Limit to 4 cards
  }, [displayMenus, menuTab]);

  // Hero Slider Configuration
  const sliderImages = [
    {
      url: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&q=80&w=1200",
      tag: "ORGANIC & FRESH",
      title: "Daily Fresh Sandwich",
      subtitle: "매일 아침 직접 굽는 빵과 신선한 채소로 완성하는 정갈한 샌드위치",
    },
    {
      url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1200",
      tag: "HEALTHY BALANCE BOWL",
      title: "Premium Poke Bowl",
      subtitle: "신선한 해산물과 생 아보카도, 현미밥이 어우러진 하와이안 건강 식단",
    },
    {
      url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=1200",
      tag: "SIMPLE & CLEAN NUTRITION",
      title: "Superfood Salad Bowl",
      subtitle: "가공되지 않은 신선한 슈퍼푸드와 수제 올가닉 드레싱의 가벼운 한 끼",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const dropdownItems = [
    {
      title: "고객 후기 (Customer Reviews)",
      content:
        "“주 3회 정기배송으로 모티키친의 포케보울을 먹고 있습니다. 맛과 영양의 밸런스가 뛰어나고 야채가 정직하리만큼 아삭아삭 신선합니다. 특히 아보카도 칠면조 샌드위치는 제 최애 메뉴예요!” (마포구 직장인 김민지 님)\n\n“단순하면서 속 편한 샐러드를 원했는데 정답을 찾았습니다. 자극적인 양념이 전혀 없어 깔끔하게 완식해도 죄책감이 없습니다.” (웰빙 다이어터 이정훈 님)",
    },
    {
      title: "정기배송 안내 (Weekly Subscription)",
      content:
        "모티키친의 신선한 에너지를 매일 아침 집이나 오피스에서 받아보세요.\n\n• 배송 요일: 매주 월/수/금 또는 화/목 선택 가능\n• 추천 구성: 주 3회 샐러드/포케 교차 보울 배송 (칼로리 & 드레싱 밀크 플랜 동봉)\n• 신청 문의: 홈페이지 상단 채널톡 또는 전화상담(02-1234-5678)을 통해 1:1 맞춤 정기 식단을 설계해 드립니다.",
    },
    {
      title: "테이블 예약 (Table Reservation)",
      content:
        "모티키친 매장은 정갈하고 따뜻한 여백의 공간으로 꾸며져 있습니다. 소규모 모임이나 점심 단체 식사를 위한 테이블 예약이 가능합니다.\n\n• 예약 가능 시간: 오전 11:30 - 오후 19:30\n• 예약 신청: 당일 예약은 최소 2시간 전 유선 전화를 통해서만 접수 가능합니다. (주말 단체 예약은 네이버 예약을 권장합니다)",
    },
    {
      title: "공지사항 (Notice & News)",
      content:
        "[신메뉴 출시] 초여름 한정 '꿀무화과 리코타 치즈 샐러드'가 정식 론칭되었습니다. 홈메이드로 직접 굳힌 깊은 치즈 풍미와 무화과의 톡톡 터지는 달콤함을 직접 매장에서 경험해 보세요.\n\n[휴무 안내] 다가오는 공휴일에는 정상 영업하며, 매주 월요일은 식자재 창고 소독 및 위생 품질 관리를 위해 전체 정기 휴무를 진행합니다.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-brand-beige">
      {/* user status ribbon in header if logged in */}
      {user && (
        <div className="bg-brand-green text-brand-beige text-center text-xs py-2 font-semibold">
          🌱 "{user.user_metadata?.full_name || user.user_metadata?.name || user.email}"님 안녕하세요! 모티키친의 신선한 웰빙 라이프를 즐겨보세요.
        </div>
      )}

      {/* --- Dynamic Page Rendering based on currentTab query parameter --- */}
      {currentTab === "brand" ? (
        /* 브랜드 소개 (Brand About) */
        <section className="py-16 bg-brand-beige">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-12 animate-in fade-in duration-300">
            {/* Header */}
            <div className="space-y-4">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-brand-green/70">Our Philosophy</span>
              <h2 className="text-4xl font-extrabold font-serif text-brand-green">건강, 신선, 단순</h2>
              <div className="w-12 h-1 bg-brand-orange mx-auto mt-4" />
            </div>

            {/* Banner Image */}
            <div className="rounded-2xl overflow-hidden h-[300px] shadow-md border border-brand-green/10">
              <img
                src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=1000"
                alt="Motti Kitchen Farm Fresh Ingredients"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Slogan */}
            <div className="bg-white p-8 rounded-2xl border border-brand-green/5 shadow-sm space-y-3">
              <span className="text-[10px] font-bold text-brand-orange block uppercase tracking-wider">Slogan</span>
              <blockquote className="text-xl sm:text-2xl font-extrabold text-brand-brown font-serif italic">
                "자연 본연의 맛, 가장 정직한 한 끼"
              </blockquote>
              <p className="text-xs sm:text-sm text-brand-brown-light/80 leading-relaxed font-light mt-4">
                모티키친은 재료 본연의 순수함을 훼손하지 않는 음식을 고집합니다.<br className="hidden sm:inline" />
                인공 합성 첨가물과 가공 단계를 최대한 줄여 건강하면서도 속 편한 아침과 점심을 선사합니다.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-brand-sage/60 p-8 rounded-2xl border border-brand-green/10 space-y-3">
              <span className="text-[10px] font-bold text-brand-green block uppercase tracking-wider">Vision</span>
              <h3 className="text-lg font-bold text-brand-brown">
                "신선한 초록색 활기를 일상에 더해 건강하고 지속가능한 식문화를 선도합니다."
              </h3>
              <p className="text-xs text-brand-brown-light/80 leading-relaxed font-light">
                바쁜 현대인의 라이프스타일 속에서도 맛과 영양이 균형을 이루는 완전한 식탁을 구현하고자 합니다.<br />
                몸과 마음이 모두 건강한 웰빙 문화를 모티키친이 완성하겠습니다.
              </p>
            </div>

            {/* Core Values */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold font-serif text-brand-green text-center">핵심 가치 (Core Values)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="bg-white p-6 rounded-2xl border border-brand-green/5 shadow-xs space-y-2">
                  <span className="text-2xl">🥬</span>
                  <h4 className="font-extrabold text-brand-brown text-sm">정직한 신선함</h4>
                  <p className="text-xs text-brand-brown-light/80 leading-relaxed font-light">
                    당일 아침 농가에서 직송한 신선한 채소를 사용하고, 당일 제조 및 당일 판매 원칙을 엄격하게 준수합니다.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-brand-green/5 shadow-xs space-y-2">
                  <span className="text-2xl">🥗</span>
                  <h4 className="font-extrabold text-brand-brown text-sm">단순함과 균형</h4>
                  <p className="text-xs text-brand-brown-light/80 leading-relaxed font-light">
                    과장된 레시피나 화학 조미료를 뺀 단순한 자연식 그대로의 균형 잡힌 탄수화물, 단백질, 지방을 배합합니다.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-brand-green/5 shadow-xs space-y-2">
                  <span className="text-2xl">🌱</span>
                  <h4 className="font-extrabold text-brand-brown text-sm">지속가능한 상생</h4>
                  <p className="text-xs text-brand-brown-light/80 leading-relaxed font-light">
                    생분해성 친환경 용기를 전면 사용하며, 로컬 농가와의 직거래를 활성화해 사회적 가치를 함께 창출합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : currentTab === "menu" ? (
        /* 메뉴판 보기 (Menu Catalog) */
        <section className="py-16 bg-white border-y border-brand-green/5 animate-in fade-in duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-[10px] font-extrabold text-brand-orange tracking-widest uppercase">Motti Catalog</span>
              <h2 className="text-3xl font-extrabold font-serif text-brand-green mt-2">모티키친 전체 메뉴판</h2>
              <p className="text-xs text-brand-brown-light/70 mt-2 font-light">원하시는 카테고리를 눌러 모티키친의 건강한 메뉴를 탐색하세요.</p>
            </div>

            {/* Menu Category Selection Tabs */}
            <div className="flex justify-center space-x-2 sm:space-x-4 mb-12">
              {[
                { id: "sandwich", label: "샌드위치 🥪" },
                { id: "salad", label: "샐러드 🥗" },
                { id: "poke", label: "포케 보울 🍲" },
                { id: "beverage", label: "건강 음료 🍹" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMenuTab(tab.id)}
                  className={`px-6 py-2.5 rounded-full text-xs font-extrabold transition-all duration-300 cursor-pointer ${
                    menuTab === tab.id
                      ? "bg-brand-green text-white shadow-md shadow-brand-green/10"
                      : "bg-brand-beige text-brand-brown hover:bg-brand-sage/60 border border-brand-green/10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Render Category Menus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {displayMenus.filter(item => item.category === menuTab).map((item, idx) => {
                const isLocked = item.is_premium && (!profile || profile.membership !== "premium");
                
                return (
                  <div
                    key={idx}
                    className="bg-brand-beige/40 rounded-2xl overflow-hidden border border-brand-green/5 hover:border-brand-green/20 hover:shadow-xl hover:shadow-brand-green/5 transition-all duration-300 flex flex-col justify-between group relative"
                  >
                    {/* Lock Overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 z-20 backdrop-blur-[6px] bg-brand-brown/70 flex flex-col justify-center items-center text-center p-4">
                        <span className="text-3xl mb-2 animate-pulse">🔒</span>
                        <span className="text-[10px] font-extrabold text-brand-orange uppercase tracking-wider block">Premium Only</span>
                        <h4 className="text-xs font-bold text-white mt-1">멤버십 전용 메뉴</h4>
                        <p className="text-[9px] text-white/80 leading-relaxed mt-2.5 max-w-[170px] mx-auto">
                          로그인 후 대시보드에서 프리미엄 멤버십으로 업그레이드하고 이용해 보세요!
                        </p>
                        <Link 
                          href="/login" 
                          className="bg-brand-orange hover:bg-brand-orange-hover text-white text-[9px] font-bold px-3 py-1.5 rounded-full mt-4 transition-all"
                        >
                          멤버십 가입 / 업그레이드
                        </Link>
                      </div>
                    )}

                    <div>
                      <div className="h-56 relative overflow-hidden bg-zinc-100">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-4 left-4 bg-brand-green text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {menuTab}
                        </div>

                        {/* Premium Badge */}
                        {item.is_premium && (
                          <div className="absolute top-4 right-4 bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
                            👑 PREMIUM
                          </div>
                        )}
                      </div>

                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="text-base font-extrabold text-brand-brown group-hover:text-brand-green transition-colors leading-tight text-left">
                            {item.name}
                          </h3>
                          <p className="text-[10px] text-brand-brown-light/65 font-display mt-0.5 text-left">
                            {item.english_name}
                          </p>
                        </div>

                        <div className="space-y-1 text-left">
                          <span className="text-[9px] font-bold text-brand-green block">성분 및 재료:</span>
                          <div className="flex flex-wrap gap-1">
                            {item.ingredients.map((ing, i) => (
                              <span
                                key={i}
                                className="bg-brand-sage/60 text-brand-green text-[9px] font-medium px-2 py-0.5 rounded"
                              >
                                {ing}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 border-t border-brand-green/5 flex justify-between items-center bg-brand-sage/10 h-14">
                      <span className="text-[10px] font-bold text-brand-orange">
                        {item.calories} kcal
                      </span>
                      <span className="text-sm font-extrabold text-brand-green">
                        {typeof item.price === "number" ? `${item.price.toLocaleString()}원` : item.price}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : currentTab === "subscription" ? (
        /* 정기 구독 (Weekly Subscription) */
        <section className="py-16 bg-brand-beige animate-in fade-in duration-300">
          <div className="max-w-5xl mx-auto px-4 space-y-16">
            {/* Header */}
            <div className="text-center">
              <span className="text-[10px] font-extrabold text-brand-orange tracking-widest uppercase">Motti Life Subscription</span>
              <h2 className="text-3xl font-extrabold font-serif text-brand-green mt-2">모티 라이프 웰빙 정기구독</h2>
              <p className="text-xs text-brand-brown-light/75 mt-2 font-light">매일 아침, 문 앞으로 만나는 신선한 그린 라이프 루틴</p>
            </div>

            {/* Pricing Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Plan 1 */}
              <div className="bg-white p-8 rounded-2xl border border-brand-green/10 shadow-sm flex flex-col justify-between relative hover:-translate-y-1 transition-all duration-300">
                <div className="space-y-4 text-left">
                  <span className="text-[10px] font-extrabold bg-brand-sage text-brand-green px-2.5 py-1 rounded-full uppercase">Light Plan</span>
                  <h3 className="text-xl font-extrabold text-brand-brown">라이트 식단</h3>
                  <p className="text-xs text-brand-brown-light/75 font-light leading-relaxed">
                    주 2회 (월/목) 배송. 건강한 습관을 시작하기 위한 가볍고 부담 없는 플랜입니다.
                  </p>
                  <div className="pt-4 border-t border-brand-green/5">
                    <span className="text-2xl font-extrabold text-brand-green">월 79,000원</span>
                  </div>
                </div>
                <button
                  onClick={() => alert("라이트 식단 정기 구독이 신청되었습니다! 🌱")}
                  className="w-full bg-brand-beige border border-brand-green/30 text-brand-green hover:bg-brand-green hover:text-white text-xs font-bold py-3 rounded-xl mt-8 transition-colors cursor-pointer"
                >
                  구독하기
                </button>
              </div>

              {/* Plan 2 */}
              <div className="bg-white p-8 rounded-2xl border-2 border-brand-orange shadow-md flex flex-col justify-between relative hover:-translate-y-1 transition-all duration-300 scale-105">
                <div className="absolute -top-3 right-6 bg-brand-orange text-white text-[9px] font-extrabold px-3 py-1 rounded-full shadow">
                  RECOMMENDED ★
                </div>
                <div className="space-y-4 text-left">
                  <span className="text-[10px] font-extrabold bg-orange-100 text-brand-orange px-2.5 py-1 rounded-full uppercase">Balance Plan</span>
                  <h3 className="text-xl font-extrabold text-brand-brown">배런스 식단</h3>
                  <p className="text-xs text-brand-brown-light/75 font-light leading-relaxed">
                    주 3회 (월/수/금) 배송. 직장인 점심 관리, 규칙적인 디톡스를 원하시는 분께 최적의 플랜입니다.
                  </p>
                  <div className="pt-4 border-t border-brand-green/5">
                    <span className="text-2xl font-extrabold text-brand-orange">월 119,000원</span>
                  </div>
                </div>
                <button
                  onClick={() => alert("밸런스 식단 정기 구독이 신청되었습니다! 🌱")}
                  className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold py-3 rounded-xl mt-8 transition-colors cursor-pointer"
                >
                  구독하기
                </button>
              </div>

              {/* Plan 3 */}
              <div className="bg-white p-8 rounded-2xl border border-brand-green/10 shadow-sm flex flex-col justify-between relative hover:-translate-y-1 transition-all duration-300">
                <div className="space-y-4 text-left">
                  <span className="text-[10px] font-extrabold bg-brand-brown text-brand-beige px-2.5 py-1 rounded-full uppercase">Intense Plan</span>
                  <h3 className="text-xl font-extrabold text-brand-brown">웰빙 올데이</h3>
                  <p className="text-xs text-brand-brown-light/75 font-light leading-relaxed">
                    주 5회 (월~금) 배송. 매일 완벽하고 철저하게 식단을 채우는 다이어터 및 헬스 매니아 맞춤 플랜입니다.
                  </p>
                  <div className="pt-4 border-t border-brand-green/5">
                    <span className="text-2xl font-extrabold text-brand-green">월 199,000원</span>
                  </div>
                </div>
                <button
                  onClick={() => alert("웰빙 올데이 정기 구독이 신청되었습니다! 🌱")}
                  className="w-full bg-brand-beige border border-brand-green/30 text-brand-green hover:bg-brand-green hover:text-white text-xs font-bold py-3 rounded-xl mt-8 transition-colors cursor-pointer"
                >
                  구독하기
                </button>
              </div>
            </div>

            {/* Benefits Grid */}
            <div className="bg-white p-8 rounded-2xl border border-brand-green/5 shadow-xs space-y-6">
              <h3 className="text-lg font-bold text-brand-green text-center">정기 구독 3대 혜택</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <div className="text-2xl">🚀</div>
                  <h4 className="font-extrabold text-sm text-brand-brown">무료 새벽 배송</h4>
                  <p className="text-xs text-brand-brown-light/75 font-light leading-relaxed">
                    매일 아침 7시 이전까지 현관 앞으로 전용 보냉백에 담아 신선하게 전달해 드립니다.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl">📋</div>
                  <h4 className="font-extrabold text-sm text-brand-brown">식단 칼로리 플래너</h4>
                  <p className="text-xs text-brand-brown-light/75 font-light leading-relaxed">
                    매주 발송되는 메뉴의 상세 영양성분 및 칼로리가 기재된 건강 플래너를 동봉합니다.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl">🔄</div>
                  <h4 className="font-extrabold text-sm text-brand-brown">자유로운 건너뛰기</h4>
                  <p className="text-xs text-brand-brown-light/75 font-light leading-relaxed">
                    여행이나 약속이 있는 날은 배송 시작 24시간 전 언제든지 홈페이지에서 건너뛰기가 가능합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : currentTab === "b2b" ? (
        /* 단체 및 기업구매 (B2B Purchase) */
        <section className="py-16 bg-white border-y border-brand-green/5 animate-in fade-in duration-300">
          <div className="max-w-3xl mx-auto px-4 space-y-12">
            {/* Header */}
            <div className="text-center">
              <span className="text-[10px] font-extrabold text-brand-orange tracking-widest uppercase">Motti B2B Catering</span>
              <h2 className="text-3xl font-extrabold font-serif text-brand-green mt-2">단체 및 기업 구매 문의</h2>
              <p className="text-xs text-brand-brown-light/75 mt-2 font-light">워크숍, 세미나, 사내 정기 조식 배달 등 맞춤형 웰빙 케이터링 서비스를 만나보세요.</p>
            </div>

            {/* Catering Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-brand-beige/50 p-6 rounded-2xl border border-brand-green/5">
              <div className="space-y-2 text-left">
                <h4 className="font-extrabold text-sm text-brand-green">🍱 기업 조식 & 런치박스</h4>
                <p className="text-xs text-brand-brown-light/80 leading-relaxed font-light">
                  회의나 부서 아침 세미나에 어울리는 샌드위치 반절+과일팩+음료 구성의 웰빙 팩을 회사 회의실까지 배달해 드립니다.
                </p>
              </div>
              <div className="space-y-2 text-left">
                <h4 className="font-extrabold text-sm text-brand-green">🥗 맞춤형 단체 할인</h4>
                <p className="text-xs text-brand-brown-light/80 leading-relaxed font-light">
                  10인분 이상의 대량 단체 구매 및 장기 파트너십 제휴 기업에게는 맞춤형 가격 혜택 및 단독 신선 배송 노선을 개설해 드립니다.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleB2bSubmit} className="bg-brand-beige/25 p-8 rounded-2xl border border-brand-green/10 shadow-sm space-y-4 text-xs text-left">
              <h3 className="text-base font-bold text-brand-brown border-b border-brand-green/10 pb-2">✏️ 견적 및 상담 의뢰서</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-brand-brown block">회사명 / 단체명 <span className="text-brand-orange">*</span></label>
                  <input
                    type="text"
                    value={b2bCompanyName}
                    onChange={(e) => setB2bCompanyName(e.target.value)}
                    placeholder="예: 모티소프트"
                    className="w-full p-2.5 border border-brand-green/15 focus:outline-none focus:ring-1 focus:ring-brand-green rounded bg-white text-brand-brown text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-brand-brown block">담당자 성함 <span className="text-brand-orange">*</span></label>
                  <input
                    type="text"
                    value={b2bContactName}
                    onChange={(e) => setB2bContactName(e.target.value)}
                    placeholder="예: 홍길동 대리"
                    className="w-full p-2.5 border border-brand-green/15 focus:outline-none focus:ring-1 focus:ring-brand-green rounded bg-white text-brand-brown text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-brand-brown block">이메일 주소 <span className="text-brand-orange">*</span></label>
                  <input
                    type="email"
                    value={b2bEmail}
                    onChange={(e) => setB2bEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full p-2.5 border border-brand-green/15 focus:outline-none focus:ring-1 focus:ring-brand-green rounded bg-white text-brand-brown text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-brand-brown block">예상 주문 수량 <span className="text-brand-orange">*</span></label>
                  <input
                    type="number"
                    min="5"
                    value={b2bGroupSize}
                    onChange={(e) => setB2bGroupSize(parseInt(e.target.value) || 10)}
                    className="w-full p-2.5 border border-brand-green/15 focus:outline-none focus:ring-1 focus:ring-brand-green rounded bg-white text-brand-brown text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-brand-brown block">케이터링 종류</label>
                <select
                  value={b2bType}
                  onChange={(e) => setB2bType(e.target.value)}
                  className="w-full p-2.5 border border-brand-green/15 focus:outline-none focus:ring-1 focus:ring-brand-green rounded bg-white text-brand-brown text-xs"
                >
                  <option value="catering_box">회의용 수제 런치박스 패키지</option>
                  <option value="breakfast">사내 임직원 정기 조식배달</option>
                  <option value="event">대형 세미나 / 파티 케이터링 뷔페</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-brand-brown block">상세 요청 내용 (선택)</label>
                <textarea
                  value={b2bContent}
                  onChange={(e) => setB2bContent(e.target.value)}
                  placeholder="희망 일자, 선호 카테고리(샌드위치/포케 등), 알레르기 제외 등의 상세 요청을 기재해주세요."
                  rows={4}
                  className="w-full p-2.5 border border-brand-green/15 focus:outline-none focus:ring-1 focus:ring-brand-green rounded bg-white text-brand-brown text-xs leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={b2bSubmitting}
                className="w-full bg-brand-green hover:bg-brand-green-hover text-white font-bold py-3.5 rounded-xl text-xs tracking-wider shadow-sm transition-all disabled:opacity-50 cursor-pointer text-center"
              >
                {b2bSubmitting ? "전송 중..." : "상담 신청하기"}
              </button>
            </form>
          </div>
        </section>
      ) : currentTab === "community" ? (
        /* 커뮤니티 (Notices & Customer Reviews) */
        <section className="py-16 bg-brand-beige animate-in fade-in duration-300">
          <div className="max-w-4xl mx-auto px-4 space-y-8">
            {/* Header */}
            <div className="text-center">
              <span className="text-[10px] font-extrabold text-brand-orange tracking-widest uppercase">Motti Community</span>
              <h2 className="text-3xl font-extrabold font-serif text-brand-green mt-2">모티 커뮤니티</h2>
              <p className="text-xs text-brand-brown-light/75 mt-2 font-light">공지사항 확인 및 생생한 고객 이용 후기를 만나보세요.</p>
            </div>

            {/* Sub Tabs Selector */}
            <div className="flex justify-center space-x-2 border-b border-brand-green/10 pb-4">
              <button
                type="button"
                onClick={() => setCommunitySubTab("notice")}
                className={`px-6 py-2.5 text-xs font-bold transition-all rounded-lg cursor-pointer ${
                  communitySubTab === "notice"
                    ? "bg-brand-green text-white shadow-xs"
                    : "bg-white text-brand-brown border border-brand-green/10 hover:bg-brand-sage/50"
                }`}
              >
                📢 공지사항 (Notices)
              </button>
              <button
                type="button"
                onClick={() => setCommunitySubTab("reviews")}
                className={`px-6 py-2.5 text-xs font-bold transition-all rounded-lg cursor-pointer ${
                  communitySubTab === "reviews"
                    ? "bg-brand-green text-white shadow-xs"
                    : "bg-white text-brand-brown border border-brand-green/10 hover:bg-brand-sage/50"
                }`}
              >
                ⭐ 고객 후기 (Reviews)
              </button>
            </div>

            {/* Sub Tab Content */}
            {communitySubTab === "notice" ? (
              /* 공지사항 리스트 */
              <div className="bg-white p-6 rounded-2xl border border-brand-green/5 shadow-sm space-y-4 text-left">
                {/* 어드민일 경우 공지 등록 바로가기 버튼 제공 */}
                {profile?.role === "admin" && (
                  <div className="flex justify-end mb-2">
                    <Link
                      href="/admin"
                      className="bg-brand-green text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-brand-green-hover transition-colors"
                    >
                      ✏️ 공지사항 관리자 작성기 바로가기
                    </Link>
                  </div>
                )}
                
                {dbNotices.length === 0 ? (
                  <div className="text-center py-10 text-xs text-brand-brown-light">등록된 공지사항이 없습니다.</div>
                ) : (
                  <div className="space-y-4">
                    {dbNotices.map((notice) => {
                      const isNoticeOpen = expandedNoticeId === notice.id;
                      return (
                        <div key={notice.id} className="border-b border-brand-green/10 last:border-b-0 pb-4 last:pb-0">
                          <div 
                            onClick={() => setExpandedNoticeId(isNoticeOpen ? null : notice.id)}
                            className="flex justify-between items-center cursor-pointer hover:text-brand-green py-1"
                          >
                            <span className="font-bold text-xs sm:text-sm text-brand-brown leading-tight flex items-center gap-2">
                              <span className="text-[10px]">✨</span>
                              {notice.title}
                            </span>
                            <span className="text-[9px] text-brand-brown-light/65 min-w-[75px] text-right">
                              {new Date(notice.created_at).toLocaleDateString("ko-KR", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <div 
                            className={`transition-all duration-300 overflow-hidden text-xs sm:text-sm text-brand-brown-light/85 bg-brand-beige/50 p-4 rounded-xl leading-relaxed whitespace-pre-line ${
                              isNoticeOpen ? "max-h-60 mt-2 opacity-100 border border-brand-green/5 shadow-sm" : "max-h-0 opacity-0 pointer-events-none"
                            }`}
                          >
                            {notice.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* 고객 후기 목록 */
              <div className="bg-white p-6 rounded-2xl border border-brand-green/5 shadow-sm space-y-6 text-left">
                <div className="flex justify-between items-center pb-2 border-b border-brand-green/10">
                  <span className="text-xs text-brand-brown-light font-medium">총 {reviews.length}개의 생생한 후기가 있습니다.</span>
                  <button
                    type="button"
                    onClick={() => openWriteModal()}
                    className="bg-brand-green text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm hover:bg-brand-green-hover transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    ✏️ 후기 남기기
                  </button>
                </div>

                {loadingReviews ? (
                  <div className="text-center py-6 text-xs text-brand-brown-light">후기를 불러오는 중입니다...</div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-10 text-xs text-brand-brown-light bg-brand-beige/30 rounded-lg border border-dashed border-brand-green/10">
                    첫 번째 후기를 남겨주세요! 🌱
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((rev) => {
                      const revComments = comments.filter(c => c.review_id === rev.id);
                      const isOwner = user && user.id === rev.user_id;
                      const isAdmin = profile?.role === "admin";
                      
                      return (
                        <div key={rev.id} className="bg-brand-beige/30 p-5 rounded-xl border border-brand-green/5 shadow-xs space-y-3">
                          {/* Review Top Row */}
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <div className="flex text-amber-500 text-sm">
                                  {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                                </div>
                                <span className="text-[10px] bg-brand-sage text-brand-green font-bold px-1.5 py-0.5 rounded">
                                  {rev.rating}.0
                                </span>
                              </div>
                              <h4 className="font-extrabold text-sm sm:text-base text-brand-brown leading-tight mt-1">
                                {rev.title}
                              </h4>
                            </div>
                            
                            <div className="text-right text-[10px] text-brand-brown-light/60 space-y-0.5">
                              <div className="font-semibold">{maskEmail(rev.user_email)}</div>
                              <div>
                                {new Date(rev.created_at).toLocaleDateString("ko-KR", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric"
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Review Body */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                            {rev.image_url && (
                              <div className="md:col-span-3 h-28 rounded-lg overflow-hidden border border-brand-green/5">
                                <img
                                  src={rev.image_url}
                                  alt={rev.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className={`${rev.image_url ? 'md:col-span-9' : 'md:col-span-12'} text-xs sm:text-sm text-brand-brown-light leading-relaxed whitespace-pre-line`}>
                              {rev.content}
                            </div>
                          </div>

                          {/* Actions */}
                          {(isOwner || isAdmin) && (
                            <div className="flex justify-end gap-2 pt-2 border-t border-brand-green/5">
                              {isOwner && (
                                <button
                                  type="button"
                                  onClick={() => openWriteModal(rev)}
                                  className="text-[10px] font-bold text-brand-brown hover:text-brand-green border border-brand-brown/10 hover:bg-brand-sage/40 px-2.5 py-1 rounded cursor-pointer"
                                >
                                  수정
                                </button>
                              )}
                              {(isOwner || isAdmin) && (
                                <button
                                  type="button"
                                  onClick={() => handleReviewDelete(rev.id)}
                                  className="text-[10px] font-bold text-red-600 hover:text-white border border-red-200 hover:bg-red-500 px-2.5 py-1 rounded transition-colors cursor-pointer"
                                >
                                  삭제
                                </button>
                              )}
                              {isAdmin && revComments.length === 0 && activeReplyReviewId !== rev.id && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveReplyReviewId(rev.id);
                                    setReplyCommentText("");
                                  }}
                                  className="text-[10px] font-bold text-white bg-brand-green hover:bg-brand-green-hover px-2.5 py-1 rounded shadow-xs cursor-pointer"
                                >
                                  💬 답변 달기
                                </button>
                              )}
                            </div>
                          )}

                          {/* Replies */}
                          <div className="space-y-2 mt-3">
                            {revComments.map((comment) => (
                              <div key={comment.id} className="bg-white p-4 rounded-lg border border-brand-green/10 space-y-2">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] bg-brand-green text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      사장님 답변
                                    </span>
                                    <span className="text-[9px] text-brand-brown-light/60">
                                      {new Date(comment.created_at).toLocaleDateString("ko-KR", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                      })}
                                    </span>
                                  </div>
                                  {isAdmin && (
                                    <div className="flex gap-1.5">
                                      {editingCommentId === comment.id ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateComment(comment.id)}
                                            className="text-[9px] font-bold text-brand-green cursor-pointer"
                                          >
                                            저장
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingCommentId(null)}
                                            className="text-[9px] font-bold text-brand-brown-light cursor-pointer"
                                          >
                                            취소
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingCommentId(comment.id);
                                              setEditingCommentText(comment.comment);
                                            }}
                                            className="text-[9px] font-bold text-brand-brown hover:text-brand-green cursor-pointer"
                                          >
                                            수정
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="text-[9px] font-bold text-red-600 hover:text-red-800 cursor-pointer"
                                          >
                                            삭제
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                {editingCommentId === comment.id ? (
                                  <textarea
                                    value={editingCommentText}
                                    onChange={(e) => setEditingCommentText(e.target.value)}
                                    className="w-full text-xs p-2.5 border border-brand-green/20 rounded bg-white text-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-green"
                                    rows={2}
                                  />
                                ) : (
                                  <p className="text-xs sm:text-sm text-brand-brown leading-relaxed whitespace-pre-line text-left">
                                    {comment.comment}
                                  </p>
                                )}
                              </div>
                            ))}

                            {/* Reply Input Form */}
                            {activeReplyReviewId === rev.id && (
                              <div className="bg-white p-3 rounded-lg border border-dashed border-brand-green/20 space-y-2.5">
                                <div className="text-[10px] font-bold text-brand-green">📝 사장님 답변 작성</div>
                                <textarea
                                  value={replyCommentText}
                                  onChange={(e) => setReplyCommentText(e.target.value)}
                                  placeholder="고객님의 후기에 정성스러운 답변을 남겨보세요..."
                                  className="w-full text-xs p-2.5 border border-brand-green/20 rounded bg-white text-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-green placeholder-brand-brown-light/40"
                                  rows={3}
                                />
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setActiveReplyReviewId(null)}
                                    className="text-[10px] font-bold text-brand-brown-light border border-brand-brown/10 px-2.5 py-1.5 rounded bg-white hover:bg-zinc-50 cursor-pointer"
                                  >
                                    취소
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAddComment(rev.id)}
                                    className="text-[10px] font-bold text-white bg-brand-green hover:bg-brand-green-hover px-3 py-1.5 rounded shadow-xs cursor-pointer"
                                  >
                                    답변 저장
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      ) : (
        /* 기본 홈 화면 (home) */
        <div className="animate-in fade-in duration-300">
          {/* 1. Hero Content & Image Slider */}
          <section className="relative w-full h-[600px] sm:h-[680px] overflow-hidden bg-brand-brown">
            {sliderImages.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? "opacity-40" : "opacity-0"
                }`}
              >
                <img
                  src={slide.url}
                  alt={slide.title}
                  className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-[4000ms]"
                />
              </div>
            ))}

            <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-brand-beige px-6 z-10">
              <span className="text-xs sm:text-sm font-extrabold tracking-[0.25em] text-brand-orange uppercase mb-4">
                {sliderImages[currentSlide].tag}
              </span>
              <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-serif mb-6 leading-tight max-w-4xl">
                {sliderImages[currentSlide].title}
              </h2>
              <p className="max-w-2xl text-sm sm:text-lg text-brand-beige/85 font-light leading-relaxed mb-10">
                {sliderImages[currentSlide].subtitle}
              </p>
              <Link
                href="/?tab=menu"
                className="border-2 border-brand-beige text-brand-beige hover:bg-brand-beige hover:text-brand-brown px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Explore Menu
              </Link>
            </div>

            <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-3 z-20">
              {sliderImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentSlide ? "bg-brand-orange w-8" : "bg-brand-beige/40"
                  }`}
                />
              ))}
            </div>
          </section>

          {/* 2. Brand Motto Section */}
          <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-brand-beige">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-brand-green/70 block mb-3">
              Simple, Honest Food for You
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-serif tracking-wide text-brand-green leading-[1.3] max-w-3xl mx-auto">
              Healthy, Fresh, Simple
            </h2>
            <div className="w-10 h-0.5 bg-brand-orange mx-auto my-6" />
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-brand-brown-light leading-relaxed font-light">
              모티키친은 인공 요소를 배제하고 아삭한 제철 채소와 자연 친화적인 통곡물,<br className="hidden sm:inline" />
              가공 과정을 단축한 단순한 영양설계를 고집합니다. 맑고 가벼운 일상의 에너지를 느껴보세요.
            </p>
          </section>

          {/* 3. Button Filtered Menu Tabs Card Grid */}
          <section className="py-16 bg-white border-y border-brand-green/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <span className="text-[10px] font-extrabold text-brand-orange tracking-widest uppercase">New in store</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-brand-green mt-2">오늘의 신선 라인업</h2>
              </div>

              <div className="flex justify-center space-x-3 sm:space-x-4 mb-12">
                {[
                  { id: "sandwich", label: "샌드위치 🥪" },
                  { id: "salad", label: "샐러드 🥗" },
                  { id: "poke", label: "포케 보울 🍲" },
                  { id: "beverage", label: "건강 음료 🍹" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMenuTab(tab.id)}
                    className={`px-8 py-3 rounded-full text-xs font-extrabold transition-all duration-300 cursor-pointer ${
                      menuTab === tab.id
                        ? "bg-brand-green text-white shadow-md shadow-brand-green/10"
                        : "bg-brand-beige text-brand-brown hover:bg-brand-sage/60 border border-brand-green/10"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredMenus.map((item, idx) => {
                  const isLocked = item.is_premium && (!profile || profile.membership !== "premium");
                  
                  return (
                    <div
                      key={idx}
                      className="bg-brand-beige/40 rounded-2xl overflow-hidden border border-brand-green/5 hover:border-brand-green/20 hover:shadow-xl hover:shadow-brand-green/5 transition-all duration-300 flex flex-col justify-between group relative"
                    >
                      {/* Lock Overlay */}
                      {isLocked && (
                        <div className="absolute inset-0 z-20 backdrop-blur-[6px] bg-brand-brown/70 flex flex-col justify-center items-center text-center p-4">
                          <span className="text-3xl mb-2 animate-pulse">🔒</span>
                          <span className="text-[10px] font-extrabold text-brand-orange uppercase tracking-wider block">Premium Only</span>
                          <h4 className="text-xs font-bold text-white mt-1">멤버십 전용 메뉴</h4>
                          <p className="text-[9px] text-white/80 leading-relaxed mt-2.5 max-w-[170px] mx-auto">
                            로그인 후 대시보드에서 프리미엄 멤버십으로 업그레이드하고 이용해 보세요!
                          </p>
                          <Link 
                            href="/login" 
                            className="bg-brand-orange hover:bg-brand-orange-hover text-white text-[9px] font-bold px-3 py-1.5 rounded-full mt-4 transition-all"
                          >
                            멤버십 가입 / 업그레이드
                          </Link>
                        </div>
                      )}

                      <div>
                        <div className="h-56 relative overflow-hidden bg-zinc-100">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-4 left-4 bg-brand-green text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {menuTab}
                          </div>

                          {/* Premium Badge */}
                          {item.is_premium && (
                            <div className="absolute top-4 right-4 bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
                              👑 PREMIUM
                            </div>
                          )}
                        </div>

                        <div className="p-5 space-y-3">
                          <div>
                            <h3 className="text-base font-extrabold text-brand-brown group-hover:text-brand-green transition-colors leading-tight text-left">
                              {item.name}
                            </h3>
                            <p className="text-[10px] text-brand-brown-light/65 font-display mt-0.5 text-left">
                              {item.english_name}
                            </p>
                          </div>

                          <div className="space-y-1 text-left">
                            <span className="text-[9px] font-bold text-brand-green block">성분 및 재료:</span>
                            <div className="flex flex-wrap gap-1">
                              {item.ingredients.map((ing, i) => (
                                <span
                                  key={i}
                                  className="bg-brand-sage/60 text-brand-green text-[9px] font-medium px-2 py-0.5 rounded"
                                >
                                  {ing}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 pt-0 border-t border-brand-green/5 flex justify-between items-center bg-brand-sage/10 h-14">
                        <span className="text-[10px] font-bold text-brand-orange">
                          {item.calories} kcal
                        </span>
                        <span className="text-sm font-extrabold text-brand-green">
                          {typeof item.price === "number" ? `${item.price.toLocaleString()}원` : item.price}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 4. Dropdown Board Section */}
          <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-brand-beige">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 h-[400px] sm:h-[450px] relative rounded-2xl overflow-hidden shadow-lg border border-brand-green/5">
                <img
                  src="https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&q=80&w=600"
                  alt="Organic Greens"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-brand-green/5 mix-blend-multiply" />
                <div className="absolute bottom-6 left-6 text-brand-beige z-10 bg-brand-brown/85 backdrop-blur-sm p-4 rounded-xl max-w-xs">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand-orange block">Aesthetic Natural Ingredient</span>
                  <p className="text-xs font-serif mt-1 text-brand-beige/95 leading-relaxed">
                    "재료 본연의 가치와 내추럴한 영양을 투명하게 공개합니다."
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-2 mb-6 text-left">
                  <span className="text-[10px] font-extrabold tracking-widest text-brand-orange uppercase">Motti Services</span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-brand-green">모티 보드 & 정기 안내</h2>
                </div>

                <div className="divide-y divide-brand-green/10 border-y border-brand-green/10">
                  {dropdownItems.map((item, idx) => {
                    const isOpen = openDropdownIdx === idx;
                    return (
                      <div key={idx} className="py-4">
                        <button
                          type="button"
                          onClick={() => setOpenDropdownIdx(isOpen ? null : idx)}
                          className="w-full flex justify-between items-center text-left py-2 group focus:outline-none cursor-pointer"
                        >
                          <span className="text-sm sm:text-base font-bold text-brand-brown group-hover:text-brand-green transition-colors flex items-center gap-3">
                            <span className={`w-1.5 h-1.5 rounded-full bg-brand-orange ${isOpen ? "scale-125" : "scale-100"} transition-all`} />
                            {item.title}
                          </span>
                          <span className={`text-xs font-bold text-brand-green transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                            {isOpen ? "▴" : "▾"}
                          </span>
                        </button>

                        <div
                          className={`transition-all duration-300 overflow-hidden ${
                            isOpen ? "max-h-[3000px] mt-3 opacity-100" : "max-h-0 opacity-0"
                          }`}
                        >
                          {idx === 0 ? (
                            /* 고객 후기 동적 렌더링 */
                            <div className="bg-brand-sage/35 p-5 rounded-xl border border-brand-green/5 space-y-6 text-left">
                              <div className="flex justify-between items-center pb-2 border-b border-brand-green/10">
                                <span className="text-xs text-brand-brown-light font-medium">총 {reviews.length}개의 생생한 후기가 있습니다.</span>
                                <button
                                  type="button"
                                  onClick={() => openWriteModal()}
                                  className="bg-brand-green text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm hover:bg-brand-green-hover transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  ✏️ 후기 남기기
                                </button>
                              </div>

                              {loadingReviews ? (
                                <div className="text-center py-6 text-xs text-brand-brown-light">후기를 불러오는 중입니다...</div>
                              ) : reviews.length === 0 ? (
                                <div className="text-center py-10 text-xs text-brand-brown-light bg-white/50 rounded-lg border border-dashed border-brand-green/10">
                                  첫 번째 후기를 남겨주세요! 🌱
                                </div>
                              ) : (
                                <div className="space-y-6">
                                  {reviews.map((rev) => {
                                    const revComments = comments.filter(c => c.review_id === rev.id);
                                    const isOwner = user && user.id === rev.user_id;
                                    const isAdmin = profile?.role === "admin";
                                    
                                    return (
                                      <div key={rev.id} className="bg-white p-5 rounded-xl border border-brand-green/5 shadow-sm space-y-3">
                                        {/* Review Top Row */}
                                        <div className="flex justify-between items-start">
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-1.5">
                                              <div className="flex text-amber-500 text-sm">
                                                {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                                              </div>
                                              <span className="text-[10px] bg-brand-sage text-brand-green font-bold px-1.5 py-0.5 rounded">
                                                {rev.rating}.0
                                              </span>
                                            </div>
                                            <h4 className="font-extrabold text-sm sm:text-base text-brand-brown leading-tight mt-1">
                                              {rev.title}
                                            </h4>
                                          </div>
                                          
                                          <div className="text-right text-[10px] text-brand-brown-light/60 space-y-0.5">
                                            <div className="font-semibold">{maskEmail(rev.user_email)}</div>
                                            <div>
                                              {new Date(rev.created_at).toLocaleDateString("ko-KR", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric"
                                              })}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Review Body */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                                          {rev.image_url && (
                                            <div className="md:col-span-3 h-28 rounded-lg overflow-hidden border border-brand-green/5">
                                              <img
                                                src={rev.image_url}
                                                alt={rev.title}
                                                className="w-full h-full object-cover"
                                              />
                                            </div>
                                          )}
                                          <div className={`${rev.image_url ? 'md:col-span-9' : 'md:col-span-12'} text-xs sm:text-sm text-brand-brown-light leading-relaxed whitespace-pre-line`}>
                                            {rev.content}
                                          </div>
                                        </div>

                                        {/* Actions */}
                                        {(isOwner || isAdmin) && (
                                          <div className="flex justify-end gap-2 pt-2 border-t border-brand-green/5">
                                            {isOwner && (
                                              <button
                                                type="button"
                                                onClick={() => openWriteModal(rev)}
                                                className="text-[10px] font-bold text-brand-brown hover:text-brand-green border border-brand-brown/10 hover:bg-brand-sage/40 px-2.5 py-1 rounded cursor-pointer"
                                              >
                                                수정
                                              </button>
                                            )}
                                            {(isOwner || isAdmin) && (
                                              <button
                                                type="button"
                                                onClick={() => handleReviewDelete(rev.id)}
                                                className="text-[10px] font-bold text-red-600 hover:text-white border border-red-200 hover:bg-red-500 px-2.5 py-1 rounded transition-colors cursor-pointer"
                                              >
                                                삭제
                                              </button>
                                            )}
                                            {isAdmin && revComments.length === 0 && activeReplyReviewId !== rev.id && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setActiveReplyReviewId(rev.id);
                                                  setReplyCommentText("");
                                                }}
                                                className="text-[10px] font-bold text-white bg-brand-green hover:bg-brand-green-hover px-2.5 py-1 rounded shadow-xs cursor-pointer"
                                              >
                                                💬 답변 달기
                                              </button>
                                            )}
                                          </div>
                                        )}

                                        {/* Replies */}
                                        <div className="space-y-2 mt-3">
                                          {revComments.map((comment) => (
                                            <div key={comment.id} className="bg-brand-sage/40 p-4 rounded-lg border border-brand-green/10 space-y-2">
                                              <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-1.5">
                                                  <span className="text-[10px] bg-brand-green text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                    사장님 답변
                                                  </span>
                                                  <span className="text-[9px] text-brand-brown-light/60">
                                                    {new Date(comment.created_at).toLocaleDateString("ko-KR", {
                                                      month: "short",
                                                      day: "numeric",
                                                      hour: "2-digit",
                                                      minute: "2-digit"
                                                    })}
                                                  </span>
                                                </div>
                                                {isAdmin && (
                                                  <div className="flex gap-1.5">
                                                    {editingCommentId === comment.id ? (
                                                      <>
                                                        <button
                                                          type="button"
                                                          onClick={() => handleUpdateComment(comment.id)}
                                                          className="text-[9px] font-bold text-brand-green cursor-pointer"
                                                        >
                                                          저장
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={() => setEditingCommentId(null)}
                                                          className="text-[9px] font-bold text-brand-brown-light cursor-pointer"
                                                        >
                                                          취소
                                                        </button>
                                                      </>
                                                    ) : (
                                                      <>
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            setEditingCommentId(comment.id);
                                                            setEditingCommentText(comment.comment);
                                                          }}
                                                          className="text-[9px] font-bold text-brand-brown hover:text-brand-green cursor-pointer"
                                                        >
                                                          수정
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={() => handleDeleteComment(comment.id)}
                                                          className="text-[9px] font-bold text-red-600 hover:text-red-800 cursor-pointer"
                                                        >
                                                          삭제
                                                        </button>
                                                      </>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                              
                                              {editingCommentId === comment.id ? (
                                                <textarea
                                                  value={editingCommentText}
                                                  onChange={(e) => setEditingCommentText(e.target.value)}
                                                  className="w-full text-xs p-2.5 border border-brand-green/20 rounded bg-white text-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-green"
                                                  rows={2}
                                                />
                                              ) : (
                                                <p className="text-xs sm:text-sm text-brand-brown leading-relaxed whitespace-pre-line">
                                                  {comment.comment}
                                                </p>
                                              )}
                                            </div>
                                          ))}

                                          {/* Reply Input Form */}
                                          {activeReplyReviewId === rev.id && (
                                            <div className="bg-brand-sage/20 p-3 rounded-lg border border-dashed border-brand-green/20 space-y-2.5">
                                              <div className="text-[10px] font-bold text-brand-green">📝 사장님 답변 작성</div>
                                              <textarea
                                                value={replyCommentText}
                                                onChange={(e) => setReplyCommentText(e.target.value)}
                                                placeholder="고객님의 후기에 정성스러운 답변을 남겨보세요..."
                                                className="w-full text-xs p-2.5 border border-brand-green/20 rounded bg-white text-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-green placeholder-brand-brown-light/40"
                                                rows={3}
                                              />
                                              <div className="flex justify-end gap-1.5">
                                                <button
                                                  type="button"
                                                  onClick={() => setActiveReplyReviewId(null)}
                                                  className="text-[10px] font-bold text-brand-brown-light border border-brand-brown/10 px-2.5 py-1.5 rounded bg-white hover:bg-zinc-50 cursor-pointer"
                                                >
                                                  취소
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleAddComment(rev.id)}
                                                  className="text-[10px] font-bold text-white bg-brand-green hover:bg-brand-green-hover px-3 py-1.5 rounded shadow-xs cursor-pointer"
                                                >
                                                  답변 저장
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ) : idx === 3 ? (
                            /* 공지사항 전용 간편보기 리스트 렌더링 */
                            <div className="bg-brand-sage/35 p-5 rounded-xl border border-brand-green/5 space-y-4 text-left">
                              {/* 어드민일 경우 공지 등록 바로가기 버튼 제공 */}
                              {profile?.role === "admin" && (
                                <div className="flex justify-end mb-2">
                                  <Link
                                    href="/admin"
                                    className="bg-brand-green text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-brand-green-hover transition-colors"
                                  >
                                    ✏️ 공지사항 관리자 작성기 바로가기
                                  </Link>
                                </div>
                              )}
                              
                              {(dbNotices.length > 0 ? dbNotices : [
                                { id: "mock_n1", title: "[공지] 초여름 한정 리코타 꿀무화과 샐러드 출시!", content: "홈메이드로 직접 만든 깊은 치즈와 무화과 소식을 맛보세요.", created_at: new Date().toISOString() },
                                { id: "mock_n2", title: "[안내] 정기 휴무 및 정밀 방역위생 안내 (매주 월요일)", content: "위생 소독을 위해 정기 휴무가 진행됩니다.", created_at: new Date().toISOString() }
                              ]).map((notice) => {
                                const isNoticeOpen = expandedNoticeId === notice.id;
                                return (
                                  <div key={notice.id} className="border-b border-brand-green/10 last:border-b-0 pb-3 last:pb-0">
                                    <div 
                                      onClick={() => setExpandedNoticeId(isNoticeOpen ? null : notice.id)}
                                      className="flex justify-between items-center cursor-pointer hover:text-brand-green py-1"
                                    >
                                      <span className="font-bold text-xs sm:text-sm text-brand-brown leading-tight flex items-center gap-2">
                                        <span className="text-[10px]">✨</span>
                                        {notice.title}
                                      </span>
                                      <span className="text-[9px] text-brand-brown-light/65 min-w-[75px] text-right">
                                        {new Date(notice.created_at).toLocaleDateString("ko-KR", {
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </span>
                                    </div>
                                    <div 
                                      className={`transition-all duration-300 overflow-hidden text-xs sm:text-sm text-brand-brown-light/85 bg-white/75 p-3 rounded-lg leading-relaxed whitespace-pre-line ${
                                        isNoticeOpen ? "max-h-60 mt-2 opacity-100 border border-brand-green/5 shadow-sm" : "max-h-0 opacity-0 pointer-events-none"
                                      }`}
                                    >
                                      {notice.content}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            /* 나머지 일반 정보 렌더링 */
                            <p className="text-xs sm:text-sm text-brand-brown-light/85 leading-relaxed bg-brand-sage/30 p-4 rounded-xl whitespace-pre-line border border-brand-green/5 text-left">
                              {item.content}
                            </p>
                          )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
        </div>
      )}

      {/* 5. 후기 작성/수정 모달 */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-brand-brown/40 backdrop-blur-[4px] z-50 flex items-center justify-center p-4">
          <div className="bg-brand-beige border border-brand-green/10 rounded-2xl max-w-md w-full shadow-2xl p-6 relative text-left">
            <button
              onClick={closeReviewModal}
              className="absolute top-4 right-4 text-brand-brown-light/60 hover:text-brand-brown font-bold text-lg"
            >
              ✕
            </button>
            <div className="space-y-1 mb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-orange">Review Form</span>
              <h3 className="text-lg font-extrabold text-brand-green">
                {editingReview ? "후기 수정하기" : "새로운 후기 남기기"}
              </h3>
              <p className="text-[11px] text-brand-brown-light/80">
                모티키친과의 건강하고 신선한 경험을 들려주세요.
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-brand-brown">별점 선택</label>
                <div className="flex items-center gap-2 pt-0.5">
                  <div className="flex space-x-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`text-2xl focus:outline-none transition-transform active:scale-125 ${
                          star <= reviewRating ? "text-amber-500" : "text-zinc-300"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-brand-green bg-brand-sage px-2 py-0.5 rounded mt-0.5">
                    {reviewRating}점 / 5점
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="review-title" className="font-bold text-brand-brown">후기 제목</label>
                <input
                  id="review-title"
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="예: 정말 신선하고 양도 넉넉합니다!"
                  className="w-full p-2.5 border border-brand-green/15 focus:outline-none focus:ring-1 focus:ring-brand-green rounded bg-white text-brand-brown text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-brand-brown block mb-1">후기 이미지 (선택)</label>
                {reviewImageUrl ? (
                  <div className="space-y-2">
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-brand-green/10 bg-zinc-50 group">
                      <img
                        src={reviewImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setReviewImageUrl("")}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-bold shadow hover:bg-red-600 transition-colors cursor-pointer"
                        title="이미지 삭제"
                      >
                        ✕
                      </button>
                    </div>
                    <span className="text-[10px] text-brand-brown-light/75 block">새로운 이미지로 변경하려면 아래 버튼을 클릭하세요.</span>
                  </div>
                ) : null}

                <div className="relative">
                  <input
                    id="review-image-file"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="review-image-file"
                    className="inline-flex items-center gap-2 cursor-pointer bg-white border border-brand-green/20 hover:border-brand-green text-brand-brown text-xs px-4 py-2.5 rounded-lg font-bold shadow-xs hover:bg-brand-sage/20 transition-all w-full justify-center"
                  >
                    📷 내 이미지 가져오기
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="review-content" className="font-bold text-brand-brown">상세 내용</label>
                <textarea
                  id="review-content"
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="음식의 맛, 포장 상태, 배송 만족도 등에 대해 남겨주세요."
                  rows={4}
                  className="w-full p-2.5 border border-brand-green/15 focus:outline-none focus:ring-1 focus:ring-brand-green rounded bg-white text-brand-brown text-xs leading-relaxed"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="flex-1 bg-white hover:bg-zinc-50 border border-brand-brown/10 text-brand-brown-light font-bold py-2.5 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 bg-brand-green hover:bg-brand-green-hover text-white font-bold py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {submittingReview ? "저장 중..." : "등록하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
