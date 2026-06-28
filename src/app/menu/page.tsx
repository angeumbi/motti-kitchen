"use client";

import { useState, useMemo } from "react";

// Matches the exact structure of the public.menus table in supabase_setup.sql
interface MenuItem {
  id: string;
  name: string;
  english_name: string;
  category: "sandwich" | "poke" | "salad";
  description: string;
  price: number;
  calories: number;
  ingredients: string[];
  nutrition_facts: {
    carbs_g: number;
    protein_g: number;
    fat_g: number;
  };
  image_url: string;
  is_available: boolean;
}

const SAMPLE_MENUS: MenuItem[] = [
  {
    id: "m1",
    name: "아보카도 칠면조 샌드위치",
    english_name: "Avocado Turkey Sandwich",
    category: "sandwich",
    description: "담백한 칠면조 가슴살과 고소한 생 아보카도, 아삭한 야채가 완벽한 조화를 이루는 모티키친 대표 샌드위치",
    price: 8900,
    calories: 420,
    ingredients: ["호밀 식빵", "오븐구이 칠면조 슬라이스", "생 아보카도", "토마토", "로메인 상추", "스위스 치즈", "허브 렌치 드레싱"],
    nutrition_facts: { carbs_g: 38, protein_g: 24, fat_g: 18 },
    image_url: "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&q=80&w=600",
    is_available: true,
  },
  {
    id: "m2",
    name: "바질 페스토 치킨 샌드위치",
    english_name: "Basil Pesto Chicken Sandwich",
    category: "sandwich",
    description: "직접 만든 향긋한 바질 페스토에 버무린 수비드 닭가슴살과 쫀득한 모짜렐라 치즈의 프레시한 만남",
    price: 8500,
    calories: 480,
    ingredients: ["치아바타 브레드", "수비드 닭가슴살", "수제 바질 페스토", "생 모짜렐라 치즈", "썬드라이 토마토", "루꼴라"],
    nutrition_facts: { carbs_g: 42, protein_g: 28, fat_g: 16 },
    image_url: "https://images.unsplash.com/photo-1567234669003-dce7a7a88821?auto=format&fit=crop&q=80&w=600",
    is_available: true,
  },
  {
    id: "m3",
    name: "클래식 생연어 포케",
    english_name: "Classic Fresh Salmon Poke",
    category: "poke",
    description: "매일 아침 공수하는 신선한 생연어와 고소한 아보카도에 짭조름한 하와이안 특제 소스를 곁들인 보울",
    price: 12900,
    calories: 510,
    ingredients: ["유기농 현미밥", "슈페리어급 생연어 슬라이스", "아보카도", "오이", "적양파", "날치알", "해초 샐러드", "어니언 후레이크", "스파이시 크림 소스"],
    nutrition_facts: { carbs_g: 54, protein_g: 22, fat_g: 20 },
    image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600",
    is_available: true,
  },
  {
    id: "m4",
    name: "소이 진저 참치 포케",
    english_name: "Soy Ginger Tuna Poke",
    category: "poke",
    description: "감칠맛 가득한 특제 소이 진저 드레싱에 마리네이드한 참치와 에다마메(풋콩)가 어우러져 깔끔하고 가벼운 포케",
    price: 12500,
    calories: 460,
    ingredients: ["귀리 현미밥", "황다랑어 큐브", "에다마메(풋콩)", "미역줄기무침", "래디시 슬라이스", "구운 캐슈넛", "갈릭 칩", "소이 진저 소스"],
    nutrition_facts: { carbs_g: 50, protein_g: 26, fat_g: 12 },
    image_url: "https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&q=80&w=600",
    is_available: true,
  },
  {
    id: "m5",
    name: "그릴드 치킨 퀴노아 샐러드",
    english_name: "Grilled Chicken Quinoa Salad",
    category: "salad",
    description: "직화로 구워 불향을 가둔 닭가슴살과 단백질이 풍부한 슈퍼푸드 퀴노아, 다채로운 야채로 채운 포만감 높은 샐러드",
    price: 10500,
    calories: 380,
    ingredients: ["로메인&치커리 믹스그린", "그릴드 닭가슴살", "화이트&레드 퀴노아", "방울토마토", "병아리콩", "블랙 올리브", "발사믹 비네그레트 드레싱"],
    nutrition_facts: { carbs_g: 25, protein_g: 32, fat_g: 14 },
    image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600",
    is_available: true,
  },
  {
    id: "m6",
    name: "리코타 꿀무화과 샐러드",
    english_name: "Ricotta Sweet Fig Salad",
    category: "salad",
    description: "부드럽고 묵직한 수제 리코타 치즈와 달콤한 건무화과, 바삭한 견과류에 달콤한 벌꿀을 올린 디저트 샐러드",
    price: 11000,
    calories: 340,
    ingredients: ["프레시 믹스 채소", "수제 리코타 치즈", "반건조 무화과", "구운 호두", "아몬드 슬라이스", "크랜베리", "천연 벌꿀 드레싱"],
    nutrition_facts: { carbs_g: 28, protein_g: 12, fat_g: 20 },
    image_url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600",
    is_available: true,
  },
];

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);

  // Filters logic
  const filteredMenus = useMemo(() => {
    return SAMPLE_MENUS.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-charcoal tracking-tight font-display">
          모티키친 메뉴판
        </h1>
        <div className="w-12 h-1 bg-brand-green mx-auto mt-3 rounded" />
        <p className="mt-4 text-xs sm:text-sm text-brand-charcoal/60 leading-relaxed">
          오늘 나의 에너지를 채워줄 최적의 건강 식단을 선택해 보세요.<br />
          카테고리와 재료 이름으로도 검색할 수 있습니다.
        </p>
      </div>

      {/* Filter and Search Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 p-6 rounded-2xl glass-card">
        {/* Category Buttons */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { id: "all", label: "전체보기 🥗" },
            { id: "sandwich", label: "샌드위치 🥪" },
            { id: "poke", label: "포케 보울 🍲" },
            { id: "salad", label: "샐러드 🥗" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${
                selectedCategory === cat.id
                  ? "bg-brand-green text-white shadow-md shadow-brand-green/20"
                  : "bg-white hover:bg-brand-sage text-brand-charcoal border border-brand-green/10"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="메뉴명 또는 재료명(예: 아보카도) 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-brand-green/15 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent bg-white/70"
          />
          <span className="absolute left-3.5 top-3.5 text-zinc-400 text-xs">🔍</span>
        </div>
      </div>

      {/* Menus Grid */}
      {filteredMenus.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMenus.map((item) => {
            const isExpanded = expandedMenuId === item.id;
            
            return (
              <div
                key={item.id}
                className="rounded-2xl overflow-hidden glass-card hover:shadow-xl hover:shadow-brand-green/5 transition-all duration-300 border border-brand-green/5 flex flex-col justify-between"
              >
                {/* Visual Area */}
                <div>
                  <div className="h-56 relative overflow-hidden bg-zinc-100">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-brand-green/90 backdrop-blur-sm text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                      {item.category === "sandwich" ? "sandwich" : item.category === "poke" ? "poke" : "salad"}
                    </div>
                    <div className="absolute bottom-4 right-4 bg-brand-charcoal/85 backdrop-blur-sm text-brand-beige text-xs font-bold px-3 py-1 rounded-full">
                      🔥 {item.calories} kcal
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-brand-charcoal">{item.name}</h3>
                      </div>
                      <p className="text-[10px] text-brand-charcoal/50 font-display mt-0.5">{item.english_name}</p>
                      <p className="text-xs text-brand-charcoal/70 leading-relaxed mt-2.5 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Ingredients tags */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-brand-green">포함된 재료:</span>
                      <div className="flex flex-wrap gap-1">
                        {item.ingredients.map((ing, i) => (
                          <span
                            key={i}
                            className="bg-brand-sage text-brand-green text-[9px] font-medium px-2 py-0.5 rounded"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lower Action & Expanded Nutrition Details */}
                <div className="border-t border-brand-green/10 p-6 bg-brand-sage/20 space-y-4">
                  {isExpanded && (
                    <div className="animate-fadeIn space-y-2 text-xs">
                      <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider block">
                        Detailed Nutrition Facts (영양성분표)
                      </span>
                      <div className="grid grid-cols-3 gap-2 text-center bg-white p-2.5 rounded-xl border border-brand-green/5">
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-brand-charcoal/50">탄수화물</p>
                          <p className="font-bold text-brand-charcoal">{item.nutrition_facts.carbs_g}g</p>
                        </div>
                        <div className="space-y-0.5 border-x border-zinc-100">
                          <p className="text-[9px] text-brand-charcoal/50">단백질</p>
                          <p className="font-bold text-brand-green">{item.nutrition_facts.protein_g}g</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-brand-charcoal/50">지방</p>
                          <p className="font-bold text-brand-orange">{item.nutrition_facts.fat_g}g</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => setExpandedMenuId(isExpanded ? null : item.id)}
                      className="text-xs font-semibold text-brand-green hover:text-brand-orange transition-colors flex items-center gap-1"
                    >
                      {isExpanded ? "성분표 접기 ▴" : "영양성분 보기 ▾"}
                    </button>
                    <span className="text-lg font-extrabold text-brand-green">
                      {item.price.toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-brand-green/10">
          <p className="text-3xl mb-4">🍃</p>
          <h3 className="text-base font-bold text-brand-charcoal">일치하는 메뉴가 없습니다</h3>
          <p className="text-xs text-brand-charcoal/50 mt-1">다른 검색어나 카테고리를 선택해 보세요.</p>
        </div>
      )}
    </div>
  );
}
