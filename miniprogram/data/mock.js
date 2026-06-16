let categories = [
  { _id: "cat-hot", name: "必吃强烈\n推荐", sort: 1, enabled: true },
  { _id: "cat-veg", name: "心享素菜\n专区", sort: 2, enabled: true },
  { _id: "cat-meat", name: "心享荤菜\n专区", sort: 3, enabled: true },
  { _id: "cat-snack", name: "心享小吃\n专区", sort: 4, enabled: true },
  { _id: "cat-milk", name: "嗦螺奶粉\n地带", sort: 5, enabled: true },
  { _id: "cat-drink", name: "心享饮料\n专区", sort: 6, enabled: true },
  { _id: "cat-treasure", name: "心想有什\n么宝", sort: 7, enabled: true }
];

const storeConfig = {
  name: "万万烧烤",
  tablePrefix: "堂食点单",
  slogan: "炭火刚好，趁热开吃",
  headerImageUrl: "",
  headerImageFileId: ""
};

let dishes = [
  {
    _id: "dish-beef",
    categoryId: "cat-hot",
    name: "炭烤牛肉串",
    price: 6,
    unit: "串",
    tag: "招牌",
    imageKey: "beef",
    enabled: true,
    soldOut: false,
    specs: []
  },
  {
    _id: "dish-wing",
    categoryId: "cat-hot",
    name: "蒜香烤鸡翅",
    price: 12,
    unit: "份",
    tag: "2人推荐",
    imageKey: "wing",
    enabled: true,
    soldOut: false,
    specs: ["微辣", "中辣", "加辣"]
  },
  {
    _id: "dish-egg",
    categoryId: "cat-hot",
    name: "炸蛋2个",
    price: 7,
    unit: "份",
    tag: "",
    imageKey: "egg",
    enabled: true,
    soldOut: false,
    specs: []
  },
  {
    _id: "dish-snail",
    categoryId: "cat-hot",
    name: "招牌田螺鸭脚煲",
    price: 58,
    unit: "份起",
    tag: "热卖",
    imageKey: "snail",
    enabled: true,
    soldOut: false,
    specs: ["微辣", "中辣", "加辣"]
  }
];

let tables = Array.from({ length: 20 }, (_, index) => {
  const tableNo = String(index + 1).padStart(2, "0");
  return {
    _id: `table-${tableNo}`,
    tableNo,
    scene: `table_${tableNo}`,
    enabled: true
  };
});

let orderSeq = 2148;
const orders = [];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeSpec(value) {
  return String(value || "").trim();
}

function getMenu() {
  return clone({
    storeConfig,
    categories: categories.slice().sort((a, b) => a.sort - b.sort),
    dishes: dishes.slice().sort((a, b) => (a.sort || 0) - (b.sort || 0))
  });
}

function initSeedData() {
  return clone({
    tables: tables.length,
    categories: categories.length,
    dishes: dishes.length,
    staffUsers: 1
  });
}

function getTables() {
  return clone(tables);
}

function createOrder(payload) {
  orderSeq += 1;
  const tableNo = payload.tableNo || "03";
  const validation = validateCart({ items: payload.items || [] });
  if (!validation.valid) throw new Error(validation.message);
  const items = validation.items.map((item) => ({
    ...item,
    subtotal: item.price * item.quantity
  }));
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  const order = {
    _id: `order-${tableNo}-${orderSeq}`,
    orderNo: `${tableNo}-${orderSeq}`,
    tableNo,
    status: "pending",
    settlementStatus: "front_desk",
    remark: payload.remark || "",
    totalAmount,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items
  };
  orders.unshift(order);
  return clone(order);
}

function getOrder(payload = {}) {
  const order = orders.find((item) => item._id === payload.orderId || item.orderNo === payload.orderNo);
  if (!order) throw new Error("订单不存在");
  return clone(order);
}

function validateCart(payload = {}) {
  const items = payload.items || [];
  if (!items.length) return { valid: false, message: "请先选择菜品", items: [], totalAmount: 0 };
  const checkedItems = [];
  for (const item of items) {
    const dish = dishes.find((target) => target._id === item.dishId);
    if (!dish || !dish.enabled) return { valid: false, message: `${item.name || "菜品"}已下架`, items: [] };
    if (dish.soldOut) return { valid: false, message: `${dish.name}已售罄`, items: [] };
    const spec = normalizeSpec(item.spec);
    const dishSpecs = (dish.specs || []).map(normalizeSpec);
    if (spec && dishSpecs.length && !dishSpecs.includes(spec)) {
      return { valid: false, message: `${dish.name}规格已变更`, items: [] };
    }
    const quantity = Number(item.quantity || 0);
    if (quantity <= 0) continue;
    checkedItems.push({
      key: item.key || `${dish._id}::${item.spec || ""}`,
      dishId: dish._id,
      name: dish.name,
      spec,
      price: dish.price,
      unit: dish.unit,
      imageKey: dish.imageKey,
      imageUrl: dish.imageUrl || "",
      quantity,
      subtotal: dish.price * quantity
    });
  }
  const totalAmount = checkedItems.reduce((sum, item) => sum + item.subtotal, 0);
  return { valid: checkedItems.length > 0, message: checkedItems.length ? "" : "请先选择菜品", items: checkedItems, totalAmount };
}

function listOrders(payload = {}) {
  const status = payload.status;
  const nonEmptyOrders = orders.filter((order) => Array.isArray(order.items) && order.items.length > 0);
  const visibleOrders = status
    ? nonEmptyOrders.filter((order) => order.status === status)
    : nonEmptyOrders.filter((order) => order.status !== "completed");
  return clone(visibleOrders);
}

function updateOrderStatus(orderId, status) {
  const order = orders.find((item) => item._id === orderId);
  if (!order) throw new Error("订单不存在");
  order.status = status;
  order.updatedAt = Date.now();
  if (status === "confirmed") order.confirmedAt = Date.now();
  if (status === "completed") order.completedAt = Date.now();
  return clone(order);
}

function updateStoreConfig(payload) {
  Object.assign(storeConfig, payload || {});
  return clone(storeConfig);
}

function staffLogin(payload = {}) {
  if (!payload.phone || !payload.password) throw new Error("请输入手机号和密码");
  return clone({ phone: payload.phone, name: "店员", role: "staff", enabled: true });
}

function saveCategory(payload = {}) {
  const id = payload._id || `cat-${Date.now()}`;
  const patch = {
    _id: id,
    name: payload.name || "新分类",
    sort: Number(payload.sort || categories.length + 1),
    enabled: payload.enabled !== false
  };
  const index = categories.findIndex((item) => item._id === id);
  if (index >= 0) categories[index] = { ...categories[index], ...patch };
  else categories.push(patch);
  return clone(patch);
}

function deleteCategory(payload = {}) {
  if (!payload.categoryId) throw new Error("缺少分类 ID");
  categories = categories.filter((item) => item._id !== payload.categoryId);
  dishes = dishes.map((dish) => dish.categoryId === payload.categoryId ? { ...dish, enabled: false } : dish);
  return clone({ categoryId: payload.categoryId });
}

function saveDish(payload = {}) {
  if (!payload.name) throw new Error("请填写菜名");
  const id = payload._id || `dish-${Date.now()}`;
  const patch = {
    _id: id,
    categoryId: payload.categoryId || categories[0]._id,
    name: payload.name,
    price: Number(payload.price || 0),
    unit: payload.unit || "份",
    tag: payload.tag || "",
    imageKey: payload.imageKey || "egg",
    imageUrl: payload.imageUrl || "",
    imageFileId: payload.imageFileId || "",
    specs: Array.isArray(payload.specs) ? payload.specs : String(payload.specs || "").split(/[、/,，\s]+/).filter(Boolean),
    enabled: payload.enabled !== false,
    soldOut: payload.soldOut === true,
    sort: Number(payload.sort || dishes.length + 1)
  };
  const index = dishes.findIndex((item) => item._id === id);
  if (index >= 0) dishes[index] = { ...dishes[index], ...patch };
  else dishes.push(patch);
  return clone(patch);
}

function deleteDish(payload = {}) {
  if (!payload.dishId) throw new Error("缺少菜品 ID");
  dishes = dishes.filter((item) => item._id !== payload.dishId);
  return clone({ dishId: payload.dishId });
}

function updateDishStatus(payload = {}) {
  const dish = dishes.find((item) => item._id === payload.dishId);
  if (!dish) throw new Error("菜品不存在");
  if (typeof payload.enabled === "boolean") dish.enabled = payload.enabled;
  if (typeof payload.soldOut === "boolean") dish.soldOut = payload.soldOut;
  return clone(dish);
}

function generateTableQr(payload = {}) {
  const tableNo = payload.tableNo || "03";
  return clone({
    tableNo,
    scene: `table_${tableNo}`,
    page: "pages/menu/menu",
    tempFileURL: "",
    qrText: `${tableNo}桌桌码`
  });
}

module.exports = {
  getMenu,
  initSeedData,
  getTables,
  createOrder,
  getOrder,
  validateCart,
  listOrders,
  updateOrderStatus,
  updateStoreConfig,
  staffLogin,
  saveCategory,
  deleteCategory,
  saveDish,
  deleteDish,
  updateDishStatus,
  generateTableQr
};
