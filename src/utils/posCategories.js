export const DEFAULT_POS_CATEGORIES = [
  { id: "no-charge", name: "ไม่คิด", icon: "□", matchText: "ไม่คิด" },
  { id: "fresh-pork", name: "เนื้อหมูสด", icon: "🥩", matchText: "เนื้อหมูสด" },
  { id: "fresh-chicken", name: "เนื้อไก่สด", icon: "🍗", matchText: "เนื้อไก่สด" },
  { id: "beef-pork-frozen", name: "เนื้อวัว/เนื้อหมู แช่แข็ง", icon: "🧊", image: "/category-assets/beef-pork-frozen-v2.png", matchText: "เนื้อวัว/เนื้อหมู แช่แข็ง" },
  { id: "egg", name: "ไข่ ไข่แปรรูป", icon: "🥚", matchText: "ไข่ ไข่แปรรูป" },
  { id: "duck-chicken-frozen", name: "เนื้อเป็ด/เนื้อไก่ แช่แข็ง", icon: "❄️", image: "/category-assets/duck-chicken-frozen-v2.png", matchText: "เนื้อเป็ด/เนื้อไก่ แช่แข็ง" },
  { id: "seafood", name: "อาหารทะเลสด", icon: "🦐", matchText: "อาหารทะเลสด" },
  { id: "processed-pork", name: "เนื้อหมูแปรรูป+ตักขาย", icon: "🥓", matchText: "เนื้อหมูแปรรูป+ตักขาย" },
  { id: "frozen-food", name: "อาหารแช่แข็ง", icon: "🧊", image: "/category-assets/frozen-food-v2.png", matchText: "อาหารแช่แข็ง" },
  { id: "bulk-frozen-pork", name: "หมูแช่แข็งเทขาย", icon: "🍖", matchText: "หมูแช่แข็งเทขาย" },
  { id: "chilled-food", name: "อาหารแช่เย็น", icon: "🥗", image: "/category-assets/chilled-food-v2.png", matchText: "อาหารแช่เย็น" },
  { id: "dry-grocery", name: "Dry Grocery", icon: "🛒", matchText: "Dry Grocery" },
  { id: "household", name: "Household", icon: "🧴", matchText: "Household" },
  { id: "fresh-vegetable", name: "ผักสด", icon: "🥬", matchText: "ผักสด" },
  { id: "drink", name: "เครื่องดื่ม", icon: "🥤", matchText: "เครื่องดื่ม" },
];

const CATEGORY_IMAGE_MIGRATIONS = {
  "/category-assets/beef-pork-frozen.png": "/category-assets/beef-pork-frozen-v2.png",
  "/category-assets/duck-chicken-frozen.png": "/category-assets/duck-chicken-frozen-v2.png",
  "/category-assets/frozen-food.png": "/category-assets/frozen-food-v2.png",
  "/category-assets/chilled-food.png": "/category-assets/chilled-food-v2.png",
};

export function normalizePosCategories(categories) {
  const savedList = Array.isArray(categories) ? categories : [];
  const savedById = new Map(savedList.map((category) => [category?.id, category]));

  return DEFAULT_POS_CATEGORIES.map((category) => {
    const saved = savedById.get(category.id) || {};
    return {
      ...category,
      name: saved.name || category.name,
      image: Object.prototype.hasOwnProperty.call(saved, "image") ? (CATEGORY_IMAGE_MIGRATIONS[saved.image] || saved.image) : category.image,
    };
  });
}
