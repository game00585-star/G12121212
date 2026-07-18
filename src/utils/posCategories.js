export const DEFAULT_POS_CATEGORIES = [
  { id: "no-charge", name: "ไม่คิด", icon: "□", matchText: "ไม่คิด" },
  { id: "fresh-pork", name: "เนื้อหมูสด", icon: "🥩", matchText: "เนื้อหมูสด" },
  { id: "fresh-chicken", name: "เนื้อไก่สด", icon: "🍗", matchText: "เนื้อไก่สด" },
  { id: "beef-pork-frozen", name: "เนื้อวัว/เนื้อหมู แช่แข็ง", icon: "🧊", image: "/category-assets/beef-pork-frozen-v3.png", matchText: "เนื้อวัว/เนื้อหมู แช่แข็ง" },
  { id: "egg", name: "ไข่ ไข่แปรรูป", icon: "🥚", matchText: "ไข่ ไข่แปรรูป" },
  { id: "duck-chicken-frozen", name: "เนื้อเป็ด/เนื้อไก่ แช่แข็ง", icon: "❄️", image: "/category-assets/duck-chicken-frozen-v3.png", matchText: "เนื้อเป็ด/เนื้อไก่ แช่แข็ง" },
  { id: "seafood", name: "อาหารทะเลสด", icon: "🦐", matchText: "อาหารทะเลสด" },
  { id: "processed-pork", name: "เนื้อหมูแปรรูป+ตักขาย", icon: "🥓", matchText: "เนื้อหมูแปรรูป+ตักขาย" },
  { id: "frozen-food", name: "อาหารแช่แข็ง", icon: "🧊", image: "/category-assets/frozen-food-v3.png", matchText: "อาหารแช่แข็ง" },
  { id: "bulk-frozen-pork", name: "หมูแช่แข็งเทขาย", icon: "🍖", matchText: "หมูแช่แข็งเทขาย" },
  { id: "chilled-food", name: "อาหารแช่เย็น", icon: "🥗", image: "/category-assets/chilled-food-v3.png", matchText: "อาหารแช่เย็น" },
  { id: "dry-grocery", name: "Dry Grocery", icon: "🛒", matchText: "Dry Grocery" },
  { id: "household", name: "Household", icon: "🧴", matchText: "Household" },
  { id: "fresh-vegetable", name: "ผักสด", icon: "🥬", matchText: "ผักสด" },
  { id: "drink", name: "เครื่องดื่ม", icon: "🥤", matchText: "เครื่องดื่ม" },
];

const CATEGORY_IMAGE_MIGRATIONS = {
  "/category-assets/beef-pork-frozen.png": "/category-assets/beef-pork-frozen-v3.png",
  "/category-assets/duck-chicken-frozen.png": "/category-assets/duck-chicken-frozen-v3.png",
  "/category-assets/frozen-food.png": "/category-assets/frozen-food-v3.png",
  "/category-assets/chilled-food.png": "/category-assets/chilled-food-v3.png",
  "/category-assets/beef-pork-frozen-v2.png": "/category-assets/beef-pork-frozen-v3.png",
  "/category-assets/duck-chicken-frozen-v2.png": "/category-assets/duck-chicken-frozen-v3.png",
  "/category-assets/frozen-food-v2.png": "/category-assets/frozen-food-v3.png",
  "/category-assets/chilled-food-v2.png": "/category-assets/chilled-food-v3.png",
};

function cleanCategoryText(value) {
  return String(value || "").trim();
}

function makeCategoryId(label) {
  const text = cleanCategoryText(label).toLowerCase();
  const slug = text
    .replace(/[^a-z0-9ก-๙]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }
  return `excel-${slug || "category"}-${Math.abs(hash)}`;
}

function normalizeCategoryImage(image) {
  return CATEGORY_IMAGE_MIGRATIONS[image] || image;
}

export function normalizePosCategories(categories) {
  const savedList = Array.isArray(categories) ? categories : [];
  const savedById = new Map(savedList.map((category) => [category?.id, category]));
  const defaultIds = new Set(DEFAULT_POS_CATEGORIES.map((category) => category.id));

  const defaultCategories = DEFAULT_POS_CATEGORIES.map((category) => {
    const saved = savedById.get(category.id) || {};
    return {
      ...category,
      name: saved.name || category.name,
      image: Object.prototype.hasOwnProperty.call(saved, "image") ? normalizeCategoryImage(saved.image) : category.image,
    };
  });

  const extraCategories = savedList
    .filter((category) => category?.id && !defaultIds.has(category.id))
    .map((category) => ({
      id: category.id,
      name: category.name || category.matchText || "หมวดใหม่",
      icon: category.icon || "□",
      image: normalizeCategoryImage(category.image || ""),
      matchText: category.matchText || category.name || "",
    }));

  return [...defaultCategories, ...extraCategories];
}

export function normalizeHiddenCategoryLabels(labels) {
  return Array.from(new Set(
    (Array.isArray(labels) ? labels : [])
      .map((label) => cleanCategoryText(label).toLowerCase())
      .filter(Boolean)
  ));
}

function isHiddenCategory(category, hiddenLabels) {
  const keys = [
    cleanCategoryText(category?.matchText).toLowerCase(),
    cleanCategoryText(category?.name).toLowerCase(),
  ].filter(Boolean);
  return keys.some((key) => hiddenLabels.includes(key));
}

export function mergeProductCategories(categoryMenu, products, hiddenCategoryLabels = []) {
  const hiddenLabels = normalizeHiddenCategoryLabels(hiddenCategoryLabels);
  const currentCategories = normalizePosCategories(categoryMenu).filter((category) => !isHiddenCategory(category, hiddenLabels));
  const knownLabels = new Set(currentCategories.map((category) => cleanCategoryText(category.matchText || category.name).toLowerCase()).filter(Boolean));
  const nextCategories = [...currentCategories];

  (Array.isArray(products) ? products : []).forEach((product) => {
    const labels = [cleanCategoryText(product?.categoryType)].filter(Boolean);

    labels.forEach((label) => {
      const key = label.toLowerCase();
      if (!key || hiddenLabels.includes(key) || knownLabels.has(key)) return;
      knownLabels.add(key);
      nextCategories.push({
        id: makeCategoryId(label),
        name: label,
        icon: "□",
        image: "",
        matchText: label,
      });
    });
  });

  return nextCategories;
}
