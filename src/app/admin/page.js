"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabase";

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  
  // Tab controller for CMS sections
  const [cmsTab, setCmsTab] = useState("menus"); // "menus" | "notices" | "users" | "inventory"

  // Inventory management states
  const [inventory, setInventory] = useState([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryActionType, setInventoryActionType] = useState("add"); // "add" | "consume" | "create"
  const [selectedItem, setSelectedItem] = useState(null);
  const [inventoryQty, setInventoryQty] = useState("");
  const [inventoryCost, setInventoryCost] = useState("");
  
  // Create item form states
  const [newItemName, setNewItemName] = useState("");
  const [newItemBulkUnit, setNewItemBulkUnit] = useState("봉지");
  const [newItemDetailUnit, setNewItemDetailUnit] = useState("장");
  const [newItemFactor, setNewItemFactor] = useState("20");
  const [newItemMinQty, setNewItemMinQty] = useState(10);

  // Recipe & Sales states
  const [recipes, setRecipes] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [inventorySubTab, setInventorySubTab] = useState("status"); // "status" | "recipes" | "sales"
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [editingRecipeIngredients, setEditingRecipeIngredients] = useState([]);
  const [saleMenuId, setSaleMenuId] = useState("");
  const [saleQty, setSaleQty] = useState("1");

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
        // If owner email logs in, force role as admin
        const adminProfile = profile || { id: user.id, email: user.email, role: "admin", membership: "premium" };
        adminProfile.role = "admin";
        setAdminProfile(adminProfile);
        
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
        setAdminProfile(profile);
      }
      
      // Fetch all CMS tables
      await Promise.all([fetchPosts(), fetchNotices(), fetchUsers()]);
      setIsLoading(false);
    }
    
    checkAdminAuth();
  }, []);

  const defaultInventory = [
    { id: 1, name: "🥬 유기농 로메인 상추", bulkUnit: "박스(10kg)", detailUnit: "g", conversionFactor: 10000, purchased: 1200000, consumed: 980000, minQty: 150000, unitPrice: 85000 },
    { id: 2, name: "🥑 프리미엄 아보카도", bulkUnit: "박스(24개)", detailUnit: "개", conversionFactor: 24, purchased: 300, consumed: 260, minQty: 50, unitPrice: 52800 },
    { id: 3, name: "🍗 닭가슴살 슬라이스", bulkUnit: "팩(5kg)", detailUnit: "g", conversionFactor: 5000, purchased: 80000, consumed: 72000, minQty: 10000, unitPrice: 60000 },
    { id: 4, name: "🍞 100% 통밀 브레드", bulkUnit: "봉지(20장)", detailUnit: "장", conversionFactor: 20, purchased: 150 * 20, consumed: 138 * 20, minQty: 20 * 20, unitPrice: 4500 },
    { id: 5, name: "🧀 훈제 연어 슬라이스", bulkUnit: "팩(1kg)", detailUnit: "g", conversionFactor: 1000, purchased: 40000, consumed: 31000, minQty: 8000, unitPrice: 28000 },
    { id: 6, name: "🍅 유기농 대추방울토마토", bulkUnit: "박스(5kg)", detailUnit: "g", conversionFactor: 5000, purchased: 60000, consumed: 48000, minQty: 12000, unitPrice: 45000 },
    { id: 7, name: "🥛 수제 리코타 치즈", bulkUnit: "통(1kg)", detailUnit: "g", conversionFactor: 1000, purchased: 25000, consumed: 22000, minQty: 5000, unitPrice: 15000 },
    { id: 8, name: "🫒 스페인산 엑스트라버진 올리브오일", bulkUnit: "병(1L)", detailUnit: "ml", conversionFactor: 1000, purchased: 30000, consumed: 18000, minQty: 5000, unitPrice: 19500 },
  ];

  const defaultRecipes = [
    {
      menuId: "1",
      menuTitle: "클래식 아보카도 샌드위치",
      ingredients: [
        { inventoryId: 4, qty: 2 }, // 2 slices of bread
        { inventoryId: 2, qty: 0.5 }, // 0.5 avocado
        { inventoryId: 1, qty: 50 }, // 50g romaine
      ]
    },
    {
      menuId: "2",
      menuTitle: "그릴드 치킨 포케",
      ingredients: [
        { inventoryId: 3, qty: 150 }, // 150g chicken
        { inventoryId: 1, qty: 100 }, // 100g romaine
        { inventoryId: 6, qty: 40 }, // 40g tomato
      ]
    }
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Inventory
      const storedInv = localStorage.getItem("local_inventory");
      if (storedInv) {
        const parsed = JSON.parse(storedInv);
        if (parsed.length > 0 && parsed[0].unit) {
          const migrated = parsed.map(item => ({
            id: item.id,
            name: item.name,
            bulkUnit: item.unit === "봉지" ? "봉지(20장)" : item.unit === "개" ? "박스(24개)" : `박스(10${item.unit})`,
            detailUnit: item.unit === "봉지" ? "장" : item.unit === "개" ? "개" : item.unit === "g" ? "g" : item.unit,
            conversionFactor: item.unit === "봉지" ? 20 : item.unit === "개" ? 24 : 1,
            purchased: item.purchased * (item.unit === "봉지" ? 20 : item.unit === "개" ? 24 : 1),
            consumed: item.consumed * (item.unit === "봉지" ? 20 : item.unit === "개" ? 24 : 1),
            minQty: item.minQty * (item.unit === "봉지" ? 20 : item.unit === "개" ? 24 : 1),
            unitPrice: item.unitPrice
          }));
          localStorage.setItem("local_inventory", JSON.stringify(migrated));
          setInventory(migrated);
        } else {
          setInventory(parsed);
        }
      } else {
        localStorage.setItem("local_inventory", JSON.stringify(defaultInventory));
        setInventory(defaultInventory);
      }

      // 2. Recipes
      const storedRecipes = localStorage.getItem("local_recipes");
      if (storedRecipes) {
        setRecipes(JSON.parse(storedRecipes));
      } else {
        localStorage.setItem("local_recipes", JSON.stringify(defaultRecipes));
        setRecipes(defaultRecipes);
      }

      // 3. Sales History
      const storedSales = localStorage.getItem("local_sales_history");
      if (storedSales) {
        setSalesHistory(JSON.parse(storedSales));
      } else {
        localStorage.setItem("local_sales_history", JSON.stringify([]));
        setSalesHistory([]);
      }
    }
  }, []);

  const saveInventory = (newInv) => {
    setInventory(newInv);
    localStorage.setItem("local_inventory", JSON.stringify(newInv));
  };

  const saveRecipes = (newRecipes) => {
    setRecipes(newRecipes);
    localStorage.setItem("local_recipes", JSON.stringify(newRecipes));
  };

  const saveSalesHistory = (newSales) => {
    setSalesHistory(newSales);
    localStorage.setItem("local_sales_history", JSON.stringify(newSales));
  };

  const handleSaveRecipe = () => {
    if (!selectedMenuId) {
      alert("레시피를 설정할 메뉴를 선택해 주세요.");
      return;
    }
    const selectedPost = posts.find(p => String(p.id) === String(selectedMenuId));
    const menuTitle = selectedPost ? selectedPost.title : "알 수 없는 메뉴";
    
    const existingIndex = recipes.findIndex(r => String(r.menuId) === String(selectedMenuId));
    const newRecipe = {
      menuId: String(selectedMenuId),
      menuTitle: menuTitle,
      ingredients: editingRecipeIngredients.map(ing => ({
        inventoryId: parseInt(ing.inventoryId),
        qty: parseFloat(ing.qty)
      }))
    };

    let updatedRecipes = [...recipes];
    if (existingIndex > -1) {
      updatedRecipes[existingIndex] = newRecipe;
    } else {
      updatedRecipes.push(newRecipe);
    }

    saveRecipes(updatedRecipes);
    alert(`[${menuTitle}] 레시피가 성공적으로 저장되었습니다!`);
  };

  const handleRecordSale = () => {
    if (!saleMenuId) {
      alert("판매할 메뉴를 선택해 주세요.");
      return;
    }
    const qty = parseInt(saleQty);
    if (isNaN(qty) || qty <= 0) {
      alert("올바른 판매 수량을 입력해 주세요.");
      return;
    }

    const recipe = recipes.find(r => String(r.menuId) === String(saleMenuId));
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      alert("이 메뉴는 등록된 레시피(부재료 구성)가 없습니다. 레시피 설정 탭에서 먼저 레시피를 등록해 주세요!");
      return;
    }

    // Verify stock
    for (const ing of recipe.ingredients) {
      const item = inventory.find(inv => inv.id === ing.inventoryId);
      if (!item) continue;
      const needed = ing.qty * qty;
      const currentStock = item.purchased - item.consumed;
      if (currentStock < needed) {
        alert(`재고 부족으로 판매 처리가 불가합니다!\n부재료: ${item.name}\n필요량: ${needed} ${item.detailUnit}\n현재 재고: ${currentStock} ${item.detailUnit}`);
        return;
      }
    }

    // Deduct stock
    const updatedInventory = inventory.map(item => {
      const recipeIng = recipe.ingredients.find(ing => ing.inventoryId === item.id);
      if (recipeIng) {
        const needed = recipeIng.qty * qty;
        return { ...item, consumed: item.consumed + needed };
      }
      return item;
    });
    saveInventory(updatedInventory);

    // Record to sales history log
    const newSaleLog = {
      id: Date.now(),
      menuId: String(saleMenuId),
      menuTitle: recipe.menuTitle,
      quantity: qty,
      date: new Date().toISOString(),
      deductedIngredients: recipe.ingredients.map(ing => {
        const item = inventory.find(inv => inv.id === ing.inventoryId);
        return {
          name: item ? item.name : "알 수 없는 재료",
          qty: ing.qty * qty,
          unit: item ? item.detailUnit : ""
        };
      })
    };
    saveSalesHistory([newSaleLog, ...salesHistory]);
    alert(`성공적으로 판매가 기록되고, 레시피에 의거해 재고가 자동으로 차감되었습니다!\n(메뉴: ${recipe.menuTitle} ${qty}개 판매)`);
  };

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
      <div className="flex border-b border-brand-green/15 gap-2 overflow-x-auto">
        {[
          { id: "menus", label: "🥦 메뉴 관리" },
          { id: "notices", label: "📢 공지사항 관리" },
          { id: "users", label: "👥 회원 관리" },
          { id: "inventory", label: "📦 매장 재고 관리" },
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

        {/* ==================================================== */}
        {/* [CMS Tab 4] Inventory Management */}
        {/* ==================================================== */}
        {cmsTab === "inventory" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Sub Tabs Navigator */}
            <div className="flex border-b border-zinc-200 gap-2 mb-4">
              {[
                { id: "status", label: "📋 재고 현황" },
                { id: "recipes", label: "🥗 레시피 설정" },
                { id: "sales", label: "📈 판매 기록 및 자동 차감" }
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    setInventorySubTab(sub.id);
                    if (sub.id === "recipes") {
                      if (selectedMenuId) {
                        const existing = recipes.find(r => String(r.menuId) === String(selectedMenuId));
                        setEditingRecipeIngredients(existing ? existing.ingredients : []);
                      }
                    }
                  }}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    inventorySubTab === sub.id
                      ? "border-brand-green text-brand-green"
                      : "border-transparent text-brand-brown-light hover:text-brand-brown"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* Sub-tab 1: Inventory Status */}
            {inventorySubTab === "status" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-brand-green/10 shadow-xs flex flex-col justify-between h-[100px]">
                    <span className="text-[10px] font-bold text-brand-brown-light uppercase tracking-wider">누적 매입액</span>
                    <span className="text-xl font-extrabold text-brand-brown">
                      {inventory.reduce((acc, item) => acc + (item.purchased * (item.unitPrice / item.conversionFactor)), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}원
                    </span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-brand-green/10 shadow-xs flex flex-col justify-between h-[100px]">
                    <span className="text-[10px] font-bold text-brand-brown-light uppercase tracking-wider">누적 소진액</span>
                    <span className="text-xl font-extrabold text-brand-brown">
                      {inventory.reduce((acc, item) => acc + (item.consumed * (item.unitPrice / item.conversionFactor)), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}원
                    </span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-brand-green/10 shadow-xs flex flex-col justify-between h-[100px]">
                    <span className="text-[10px] font-bold text-brand-brown-light uppercase tracking-wider">재고 자산 가치</span>
                    <span className="text-xl font-extrabold text-brand-green">
                      {inventory.reduce((acc, item) => acc + ((item.purchased - item.consumed) * (item.unitPrice / item.conversionFactor)), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}원
                    </span>
                  </div>
                  {/* Warning count card */}
                  {(() => {
                    const warningCount = inventory.filter(item => (item.purchased - item.consumed) < item.minQty).length;
                    return (
                      <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between h-[100px] transition-colors ${
                        warningCount > 0 
                          ? "bg-red-50/70 border-red-200 text-red-900" 
                          : "bg-white border-brand-green/10 text-brand-brown"
                      }`}>
                        <span className="text-[10px] font-bold text-brand-brown-light uppercase tracking-wider">재고 부족 품목</span>
                        <span className="text-xl font-extrabold flex items-center gap-1.5">
                          {warningCount > 0 ? `⚠️ ${warningCount}개 품목` : "🟢 지표 양호"}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Inventory List */}
                <div className="p-6 rounded-2xl glass-card">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                      <h2 className="text-base font-bold text-brand-brown font-serif">
                        📦 매장 원부재료 재고 현황
                      </h2>
                      <p className="text-[10px] text-brand-brown-light mt-0.5">
                        매입 단량과 세부 단위(환산계수)를 입력하여, 매입 시에는 대형 단위로 기입하고 출고(소진) 시에는 레시피 장/g 수량으로 자동 차감되도록 지원합니다.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setInventoryActionType("create");
                        setSelectedItem(null);
                        setNewItemName("");
                        setNewItemBulkUnit("봉지");
                        setNewItemDetailUnit("장");
                        setNewItemFactor("20");
                        setNewItemMinQty(400);
                        setInventoryCost("4500");
                        setInventoryQty("");
                        setShowInventoryModal(true);
                      }}
                      className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-brand-green/10 flex items-center gap-1 cursor-pointer"
                    >
                      ➕ 신규 재고 품목 등록
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="border-b border-brand-green/10 text-brand-brown-light/80 font-bold text-left">
                          <th className="pb-3 text-left">품목명</th>
                          <th className="pb-3 text-left">매입 규격 (환산계수)</th>
                          <th className="pb-3 text-right">매입 단가</th>
                          <th className="pb-3 text-right">세부 단가</th>
                          <th className="pb-3 text-right">총 매입량</th>
                          <th className="pb-3 text-right">총 소진량</th>
                          <th className="pb-3 text-right">현재 재고</th>
                          <th className="pb-3 text-right">안전 재고</th>
                          <th className="pb-3 text-center">재고 상태</th>
                          <th className="pb-3 text-center">재고 조정</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {inventory.map((item) => {
                          const currentStock = item.purchased - item.consumed;
                          const isLowStock = currentStock < item.minQty;
                          const bulkPrice = item.unitPrice;
                          const detailPrice = item.unitPrice / item.conversionFactor;

                          const displayPurchased = `${(item.purchased / item.conversionFactor).toFixed(1)} ${item.bulkUnit.split('(')[0]} (${item.purchased.toLocaleString()} ${item.detailUnit})`;
                          const displayConsumed = `${item.consumed.toLocaleString()} ${item.detailUnit}`;
                          const displayCurrent = `${(currentStock / item.conversionFactor).toFixed(1)} ${item.bulkUnit.split('(')[0]} (${currentStock.toLocaleString()} ${item.detailUnit})`;
                          
                          return (
                            <tr key={item.id} className="hover:bg-brand-sage/20 transition-colors">
                              <td className="py-4 font-bold text-brand-brown">{item.name}</td>
                              <td className="py-4 text-brand-brown-light">
                                1 {item.bulkUnit.split('(')[0]} = {item.conversionFactor} {item.detailUnit}
                              </td>
                              <td className="py-4 text-right text-brand-brown-light">{bulkPrice.toLocaleString()}원</td>
                              <td className="py-4 text-right text-brand-brown-light/70">{detailPrice.toFixed(1)}원</td>
                              <td className="py-4 text-right">{displayPurchased}</td>
                              <td className="py-4 text-right text-brand-brown-light">{displayConsumed}</td>
                              <td className="py-4 text-right font-extrabold text-brand-brown">
                                {displayCurrent}
                              </td>
                              <td className="py-4 text-right text-brand-brown-light">{item.minQty.toLocaleString()} {item.detailUnit}</td>
                              <td className="py-4 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                                  isLowStock 
                                    ? "bg-red-100 text-red-800 border border-red-200" 
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                }`}>
                                  {isLowStock ? "⚠️ 부족" : "🟢 정상"}
                                </span>
                              </td>
                              <td className="py-4 text-center space-x-2">
                                <button
                                  onClick={() => {
                                    setInventoryActionType("add");
                                    setSelectedItem(item);
                                    setInventoryQty("");
                                    setShowInventoryModal(true);
                                  }}
                                  className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  📥 매입 입고
                                </button>
                                <button
                                  onClick={() => {
                                    setInventoryActionType("consume");
                                    setSelectedItem(item);
                                    setInventoryQty("");
                                    setShowInventoryModal(true);
                                  }}
                                  className="bg-orange-50 hover:bg-orange-655 text-brand-orange hover:text-white border border-brand-orange/20 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  📤 수동 출고
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm("정말 이 품목을 재고 목록에서 삭제하시겠습니까?")) {
                                      const updated = inventory.filter(x => x.id !== item.id);
                                      saveInventory(updated);
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-750 p-1 text-[10px] cursor-pointer font-bold"
                                >
                                  삭제
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Recipe Config */}
            {inventorySubTab === "recipes" && (
              <div className="p-6 rounded-2xl glass-card space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-brand-green/10 pb-4">
                  <h2 className="text-base font-bold text-brand-brown font-serif">
                    🥗 메뉴 레시피(부재료 구성) 설정
                  </h2>
                  <p className="text-[10px] text-brand-brown-light mt-0.5">
                    판매 시 자동으로 차감될 메뉴별 레시피를 구성합니다. 수량은 세부 단위(예: 식빵 2장 = 2)로 입력합니다.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Left Side: Select Menu and Add Ingredient */}
                  <div className="md:col-span-5 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-brand-brown mb-1">1) 레시피를 설정할 메뉴 선택 *</label>
                      <select
                        value={selectedMenuId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedMenuId(val);
                          const existing = recipes.find(r => String(r.menuId) === String(val));
                          setEditingRecipeIngredients(existing ? existing.ingredients : []);
                        }}
                        className="w-full px-3 py-2.5 border border-brand-green/15 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green bg-white/70"
                      >
                        <option value="">-- 메뉴를 선택하세요 --</option>
                        {posts.map(post => (
                          <option key={post.id} value={post.id}>{post.title}</option>
                        ))}
                      </select>
                    </div>

                    {selectedMenuId && (
                      <div className="bg-brand-sage/20 p-4 rounded-xl border border-brand-green/10 space-y-4">
                        <span className="text-[10px] font-bold text-brand-green block">➕ 원재료 추가</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-semibold text-brand-brown mb-1">부재료 품목</label>
                            <select
                              id="addRecipeIngId"
                              className="w-full px-3 py-2 border border-brand-green/15 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green bg-white"
                            >
                              {inventory.map(item => (
                                <option key={item.id} value={item.id}>{item.name} ({item.detailUnit})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] font-semibold text-brand-brown mb-1">소요 수량 (세부 단위)</label>
                            <div className="flex gap-2">
                              <input
                                id="addRecipeIngQty"
                                type="number"
                                step="any"
                                placeholder="예: 2, 50"
                                className="w-full px-3 py-2 border border-brand-green/15 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const selectEl = document.getElementById("addRecipeIngId");
                                  const qtyEl = document.getElementById("addRecipeIngQty");
                                  const ingId = parseInt(selectEl.value);
                                  const qty = parseFloat(qtyEl.value);
                                  
                                  if (isNaN(qty) || qty <= 0) {
                                    alert("올바른 수량을 입력하세요.");
                                    return;
                                  }
                                  
                                  const existingIndex = editingRecipeIngredients.findIndex(x => x.inventoryId === ingId);
                                  let updated = [...editingRecipeIngredients];
                                  if (existingIndex > -1) {
                                    updated[existingIndex].qty += qty;
                                  } else {
                                    updated.push({ inventoryId: ingId, qty: qty });
                                  }
                                  setEditingRecipeIngredients(updated);
                                  qtyEl.value = "";
                                }}
                                className="bg-brand-green hover:bg-brand-green-hover text-white px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                추가
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Current Recipe List */}
                  <div className="md:col-span-7 space-y-4">
                    <h3 className="text-xs font-bold text-brand-brown">
                      🥗 {selectedMenuId ? `[${posts.find(p => String(p.id) === String(selectedMenuId))?.title}] 구성 재료` : "메뉴를 선택하면 레시피 구성이 여기에 표시됩니다."}
                    </h3>
                    
                    {selectedMenuId && (
                      <div className="border border-brand-green/10 rounded-xl overflow-hidden bg-white/50">
                        {editingRecipeIngredients.length > 0 ? (
                          <div className="divide-y divide-zinc-100 text-xs">
                            {editingRecipeIngredients.map((ing, idx) => {
                              const item = inventory.find(inv => inv.id === ing.inventoryId);
                              return (
                                <div key={idx} className="flex justify-between items-center p-3 hover:bg-brand-sage/10">
                                  <span className="font-bold text-brand-brown">{item ? item.name : "알 수 없는 품목"}</span>
                                  <div className="flex items-center gap-4">
                                    <span className="font-semibold text-brand-green">
                                      {ing.qty} {item ? item.detailUnit : ""}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = editingRecipeIngredients.filter((_, i) => i !== idx);
                                        setEditingRecipeIngredients(updated);
                                      }}
                                      className="text-red-500 hover:text-red-750 font-bold cursor-pointer"
                                    >
                                      제거
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-brand-brown-light/70 text-xs">
                            이 메뉴에 구성된 레시피 재료가 없습니다. 좌측에서 재료를 추가해 주세요.
                          </div>
                        )}
                      </div>
                    )}

                    {selectedMenuId && editingRecipeIngredients.length > 0 && (
                      <button
                        onClick={handleSaveRecipe}
                        className="w-full bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md shadow-brand-green/10 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        💾 레시피 저장하기
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 3: Record Sales */}
            {inventorySubTab === "sales" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
                {/* Sale Input Form */}
                <div className="lg:col-span-4 p-6 rounded-2xl glass-card space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-brand-brown font-serif">
                      📈 제품 판매(출고) 기록
                    </h2>
                    <p className="text-[10px] text-brand-brown-light mt-0.5">
                      판매된 완제품의 수량을 등록합니다. 해당 제품의 레시피에 맞춰 원자재 재고가 자동으로 세분화되어 차감됩니다.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-brand-brown mb-1">판매 제품 선택 *</label>
                      <select
                        value={saleMenuId}
                        onChange={(e) => setSaleMenuId(e.target.value)}
                        className="w-full px-3 py-2.5 border border-brand-green/15 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green bg-white"
                      >
                        <option value="">-- 판매된 메뉴 선택 --</option>
                        {recipes.map(recipe => (
                          <option key={recipe.menuId} value={recipe.menuId}>{recipe.menuTitle}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-brown mb-1">판매 수량 (개) *</label>
                      <input
                        type="number"
                        min="1"
                        value={saleQty}
                        onChange={(e) => setSaleQty(e.target.value)}
                        className="w-full px-3 py-2.5 border border-brand-green/15 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green bg-white"
                      />
                    </div>

                    <button
                      onClick={handleRecordSale}
                      className="w-full bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md shadow-brand-green/10 cursor-pointer"
                    >
                      📈 판매 등록 및 재고 차감 실행
                    </button>
                  </div>
                </div>

                {/* Sales History Log */}
                <div className="lg:col-span-8 p-6 rounded-2xl glass-card space-y-4">
                  <h2 className="text-base font-bold text-brand-brown font-serif">
                    📜 판매 기록 및 자동 재고 차감 이력 ({salesHistory.length}건)
                  </h2>
                  {salesHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="border-b border-brand-green/10 text-brand-brown-light/80 font-bold text-left">
                            <th className="pb-3 text-left">판매 시간</th>
                            <th className="pb-3 text-left">판매 메뉴</th>
                            <th className="pb-3 text-right">수량</th>
                            <th className="pb-3 text-left">차감된 부재료 내역 (세부단위)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {salesHistory.map((log) => (
                            <tr key={log.id} className="hover:bg-brand-sage/20 transition-colors">
                              <td className="py-4 text-brand-brown-light">
                                {new Date(log.date).toLocaleTimeString("ko-KR", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })} ({new Date(log.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })})
                              </td>
                              <td className="py-4 font-bold text-brand-brown">{log.menuTitle}</td>
                              <td className="py-4 text-right font-semibold text-brand-green">{log.quantity}개</td>
                              <td className="py-4 text-brand-brown-light">
                                <div className="flex flex-wrap gap-1.5">
                                  {log.deductedIngredients.map((ing, idx) => (
                                    <span key={ing.name + idx} className="bg-amber-50 text-amber-800 text-[10px] px-2 py-0.5 rounded-full border border-amber-100">
                                      {ing.name}: {ing.qty.toFixed(1)} {ing.unit}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-brand-brown-light/70 text-xs bg-brand-sage/10 rounded-xl border border-dashed border-brand-green/10">
                      등록된 판매 내역이 없습니다. 좌측에서 메뉴 판매를 기록해 보세요! 📈
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Inventory Adjustment Modal */}
            {showInventoryModal && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl border border-brand-green/15 max-w-sm w-full p-6 space-y-6 shadow-2xl">
                  {/* Modal Header */}
                  <div>
                    <h3 className="text-base font-bold text-brand-brown font-serif">
                      {inventoryActionType === "create" && "➕ 신규 재고 품목 등록"}
                      {inventoryActionType === "add" && `📥 [입고] ${selectedItem?.name}`}
                      {inventoryActionType === "consume" && `📤 [출고] ${selectedItem?.name}`}
                    </h3>
                    <p className="text-[10px] text-brand-brown-light mt-0.5">
                      {inventoryActionType === "create" && "매장에서 사용하는 원자재/식재료 품목 정보를 새롭게 등록합니다."}
                      {inventoryActionType === "add" && "새로 매입하거나 구매해 매장에 입고한 수량을 기록합니다."}
                      {inventoryActionType === "consume" && "판매나 유통기한 만료 등으로 매장에서 소진된 수량을 기록합니다."}
                    </p>
                  </div>

                  {/* Form fields */}
                  {inventoryActionType === "create" ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-brand-brown mb-1">품목명 *</label>
                        <input
                          type="text"
                          required
                          placeholder="예: 🍞 100% 통밀 브레드"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          className="w-full px-3 py-2.5 border border-brand-green/15 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-brand-brown mb-1">매입 단위 *</label>
                          <input
                            type="text"
                            required
                            placeholder="예: 봉지, 박스"
                            value={newItemBulkUnit}
                            onChange={(e) => setNewItemBulkUnit(e.target.value)}
                            className="w-full px-3 py-2 border border-brand-green/15 text-[10px] rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-brand-brown mb-1">세부 단위 *</label>
                          <input
                            type="text"
                            required
                            placeholder="예: 장, 개, g"
                            value={newItemDetailUnit}
                            onChange={(e) => setNewItemDetailUnit(e.target.value)}
                            className="w-full px-3 py-2 border border-brand-green/15 text-[10px] rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-brand-brown mb-1">환산계수 *</label>
                          <input
                            type="number"
                            required
                            placeholder="예: 20"
                            value={newItemFactor}
                            onChange={(e) => setNewItemFactor(e.target.value)}
                            className="w-full px-3 py-2 border border-brand-green/15 text-[10px] rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green bg-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-brand-brown mb-1">매입 단가 (원/매입단위) *</label>
                          <input
                            type="number"
                            required
                            placeholder="예: 4500"
                            value={inventoryCost}
                            onChange={(e) => setInventoryCost(e.target.value)}
                            className="w-full px-3 py-2.5 border border-brand-green/15 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-brand-brown mb-1">초기 매입수량 (매입단위) *</label>
                          <input
                            type="number"
                            required
                            placeholder="예: 150"
                            value={inventoryQty}
                            onChange={(e) => setInventoryQty(e.target.value)}
                            className="w-full px-3 py-2.5 border border-brand-green/15 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-brand-brown mb-1">안전 재고 기준 (세부단위) *</label>
                        <input
                          type="number"
                          required
                          placeholder="예: 400 (장)"
                          value={newItemMinQty}
                          onChange={(e) => setNewItemMinQty(e.target.value)}
                          className="w-full px-3 py-2.5 border border-brand-green/15 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green bg-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-brand-brown mb-1">
                        {inventoryActionType === "add" ? "매입 입고량" : "수동 출고량"} ({selectedItem?.bulkUnit.split('(')[0]}) *
                      </label>
                      <input
                        type="number"
                        required
                        placeholder={`예: 3 (${selectedItem?.bulkUnit.split('(')[0]})`}
                        value={inventoryQty}
                        onChange={(e) => setInventoryQty(e.target.value)}
                        className="w-full px-3 py-2.5 border border-brand-green/15 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green bg-white"
                      />
                      {inventoryQty && !isNaN(parseFloat(inventoryQty)) && (
                        <div className="text-[10px] text-brand-green font-semibold mt-1">
                          ↳ 환산량: {parseFloat(inventoryQty) * selectedItem?.conversionFactor} {selectedItem?.detailUnit} 이 자동으로 {inventoryActionType === "add" ? "추가" : "감소"}됩니다.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions buttons */}
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      onClick={() => setShowInventoryModal(false)}
                      className="bg-zinc-150 hover:bg-zinc-200 text-brand-brown font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      닫기
                    </button>
                    <button
                      onClick={() => {
                        const qty = parseFloat(inventoryQty);
                        if (isNaN(qty) || qty <= 0) {
                          alert("올바른 수량을 입력해 주세요.");
                          return;
                        }
                        
                        if (inventoryActionType === "create") {
                          if (!newItemName || !newItemBulkUnit || !newItemDetailUnit || !newItemFactor) {
                            alert("모든 필수 값을 입력해 주세요.");
                            return;
                          }
                          const factor = parseFloat(newItemFactor);
                          const cost = parseFloat(inventoryCost);
                          const minQty = parseFloat(newItemMinQty);
                          
                          if (isNaN(factor) || factor <= 0) {
                            alert("올바른 환산계수를 입력해 주세요.");
                            return;
                          }

                          const newItem = {
                            id: Date.now(),
                            name: newItemName,
                            bulkUnit: `${newItemBulkUnit}(${factor}${newItemDetailUnit})`,
                            detailUnit: newItemDetailUnit,
                            conversionFactor: factor,
                            purchased: qty * factor,
                            consumed: 0,
                            minQty: isNaN(minQty) ? 10 : minQty,
                            unitPrice: isNaN(cost) ? 0 : cost
                          };
                          saveInventory([...inventory, newItem]);
                        } else {
                          const factor = selectedItem.conversionFactor;
                          const detailDelta = qty * factor;

                          const updated = inventory.map(item => {
                            if (item.id === selectedItem.id) {
                              if (inventoryActionType === "add") {
                                return { ...item, purchased: item.purchased + detailDelta };
                              } else {
                                const newConsumed = item.consumed + detailDelta;
                                if (newConsumed > item.purchased) {
                                  alert(`소진량이 전체 입고량(${item.purchased / factor} ${item.bulkUnit.split('(')[0]})을 초과할 수 없습니다.`);
                                  return item;
                                }
                                return { ...item, consumed: newConsumed };
                              }
                            }
                            return item;
                          });
                          saveInventory(updated);
                        }
                        setShowInventoryModal(false);
                      }}
                      className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-brand-green/10 cursor-pointer"
                    >
                      저장 및 반영
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
