const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

function ok(data) {
  return { ok: true, data };
}

function fail(message) {
  return { ok: false, message };
}

function normalizeSpec(value) {
  return String(value || "").trim();
}

function defaultSeedData() {
  return {
    settings: {
      store: {
        name: "万万烧烤",
        tablePrefix: "堂食点单",
        slogan: "炭火刚好，趁热开吃",
        headerImageUrl: "",
        headerImageFileId: ""
      }
    },
    tables: Array.from({ length: 20 }, (_, index) => {
      const tableNo = String(index + 1).padStart(2, "0");
      return {
        _id: `table-${tableNo}`,
        tableNo,
        scene: `table_${tableNo}`,
        enabled: true
      };
    }),
    categories: [
      { _id: "cat-hot", name: "必吃强烈\n推荐", sort: 1, enabled: true },
      { _id: "cat-veg", name: "心享素菜\n专区", sort: 2, enabled: true },
      { _id: "cat-meat", name: "心享荤菜\n专区", sort: 3, enabled: true },
      { _id: "cat-snack", name: "心享小吃\n专区", sort: 4, enabled: true },
      { _id: "cat-milk", name: "嗦螺奶粉\n地带", sort: 5, enabled: true },
      { _id: "cat-drink", name: "心享饮料\n专区", sort: 6, enabled: true },
      { _id: "cat-treasure", name: "心想有什么\n公宝", sort: 7, enabled: true }
    ],
    dishes: [
      { _id: "dish-beef", categoryId: "cat-hot", name: "炭烤牛肉串", price: 6, unit: "串", tag: "招牌", imageKey: "beef", specs: [], sort: 1, enabled: true, soldOut: false },
      { _id: "dish-wing", categoryId: "cat-hot", name: "蒜香烤鸡翅", price: 12, unit: "份", tag: "2人推荐", imageKey: "wing", specs: ["微辣", "中辣", "加辣"], sort: 2, enabled: true, soldOut: false },
      { _id: "dish-egg", categoryId: "cat-hot", name: "炸蛋2个", price: 7, unit: "份", tag: "", imageKey: "egg", specs: [], sort: 3, enabled: true, soldOut: false },
      { _id: "dish-snail", categoryId: "cat-hot", name: "招牌田螺鸭脚煲", price: 58, unit: "份起", tag: "热卖", imageKey: "snail", specs: ["微辣", "中辣", "加辣"], sort: 4, enabled: true, soldOut: false }
    ],
    staffUsers: [
      { _id: "staff-admin", phone: "13800000000", password: "123456", name: "店员", role: "staff", enabled: true }
    ]
  };
}

async function setDoc(collectionName, id, data) {
  const { _id, ...docData } = data;
  const payload = {
    ...docData,
    updatedAt: db.serverDate()
  };
  if (!payload.createdAt) payload.createdAt = db.serverDate();
  await db.collection(collectionName).doc(id).set({ data: payload });
}

async function initSeedData(data) {
  const setupKey = process.env.SETUP_KEY;
  if (!setupKey || setupKey === "replace-with-a-temporary-setup-key") return fail("请先配置云函数 SETUP_KEY");
  if (data.setupKey !== setupKey) return fail("初始化密钥错误");
  const seed = data.seedData || defaultSeedData();
  await setDoc("settings", "store", seed.settings.store);
  await Promise.all((seed.tables || []).map((table) => setDoc("tables", table._id || `table-${table.tableNo}`, table)));
  await Promise.all((seed.categories || []).map((category) => setDoc("categories", category._id, category)));
  await Promise.all((seed.dishes || []).map((dish) => setDoc("dishes", dish._id, dish)));
  await Promise.all((seed.staffUsers || []).map((staff) => setDoc("staff_users", staff._id || `staff-${staff.phone}`, staff)));
  await db.collection("operation_logs").add({
    data: {
      type: "init_seed_data",
      targetId: "all",
      createdAt: db.serverDate()
    }
  });
  return ok({
    tables: (seed.tables || []).length,
    categories: (seed.categories || []).length,
    dishes: (seed.dishes || []).length,
    staffUsers: (seed.staffUsers || []).length
  });
}

async function getMenu() {
  const [settings, categories, dishes] = await Promise.all([
    db.collection("settings").doc("store").get().catch(() => ({ data: null })),
    db.collection("categories").where({ enabled: true }).orderBy("sort", "asc").get(),
    db.collection("dishes").where({ enabled: true }).orderBy("sort", "asc").get()
  ]);
  return ok({
    storeConfig: settings.data || {
      name: "万万烧烤",
      tablePrefix: "堂食点单",
      slogan: "炭火刚好，趁热开吃",
      headerImageUrl: "",
      headerImageFileId: ""
    },
    categories: categories.data,
    dishes: dishes.data
  });
}

async function getTables() {
  const res = await db.collection("tables").where({ enabled: true }).orderBy("tableNo", "asc").get();
  return ok(res.data);
}

async function validateCartItems(items) {
  if (!items || items.length === 0) return { valid: false, message: "请先选择菜品", items: [], totalAmount: 0 };
  const dishIds = Array.from(new Set(items.map((item) => item.dishId).filter(Boolean)));
  const dishRes = await db.collection("dishes").where({ _id: _.in(dishIds), enabled: true }).get();
  const dishMap = dishRes.data.reduce((acc, dish) => {
    acc[dish._id] = dish;
    return acc;
  }, {});
  const checkedItems = [];
  for (const item of items) {
    const dish = dishMap[item.dishId];
    if (!dish) return { valid: false, message: `${item.name || "菜品"}已下架`, items: [], totalAmount: 0 };
    if (dish.soldOut) return { valid: false, message: `${dish.name}已售罄`, items: [], totalAmount: 0 };
    const spec = normalizeSpec(item.spec);
    const dishSpecs = (dish.specs || []).map(normalizeSpec);
    if (spec && dishSpecs.length && !dishSpecs.includes(spec)) {
      return { valid: false, message: `${dish.name}规格已变更`, items: [], totalAmount: 0 };
    }
    const quantity = Number(item.quantity || 0);
    if (quantity <= 0) continue;
    checkedItems.push({
      key: item.key || `${dish._id}::${spec}`,
      dishId: dish._id,
      name: dish.name,
      spec,
      imageKey: dish.imageKey || "",
      imageUrl: dish.imageUrl || "",
      quantity,
      price: Number(dish.price || 0),
      unit: dish.unit || "份",
      subtotal: Number(dish.price || 0) * quantity
    });
  }
  const totalAmount = checkedItems.reduce((sum, item) => sum + item.subtotal, 0);
  return { valid: checkedItems.length > 0, message: checkedItems.length ? "" : "请先选择菜品", items: checkedItems, totalAmount };
}

async function validateCart(data) {
  return ok(await validateCartItems(data.items || []));
}

async function createOrder(data) {
  const tableNo = data.tableNo;
  const items = data.items || [];
  if (!tableNo || items.length === 0) return fail("订单缺少桌号或菜品");

  const validation = await validateCartItems(items);
  if (!validation.valid) return fail(validation.message);
  const checkedItems = validation.items;
  const totalAmount = validation.totalAmount;
  const seq = Date.now().toString().slice(-6);
  const orderNo = `${tableNo}-${seq}`;
  const now = db.serverDate();
  const order = {
    orderNo,
    tableNo,
    status: "pending",
    settlementStatus: "front_desk",
    remark: data.remark || "",
    totalAmount,
    itemCount: checkedItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    createdAt: now,
    updatedAt: now
  };

  const orderRes = await db.collection("orders").add({ data: order });
  const itemTasks = checkedItems.map((item) => db.collection("order_items").add({
    data: {
      orderId: orderRes._id,
      orderNo,
      tableNo,
      dishId: item.dishId,
      name: item.name,
      spec: item.spec || "",
      imageKey: item.imageKey || "",
      imageUrl: item.imageUrl || "",
      quantity: Number(item.quantity || 0),
      price: Number(item.price || 0),
      subtotal: Number(item.price || 0) * Number(item.quantity || 0),
      createdAt: now
    }
  }));
  await Promise.all(itemTasks);
  return ok({ ...order, _id: orderRes._id, items: checkedItems });
}

async function getOrder(data) {
  const query = data.orderId
    ? db.collection("orders").doc(data.orderId).get()
    : db.collection("orders").where({ orderNo: data.orderNo }).limit(1).get();
  const res = await query;
  const order = data.orderId ? res.data : res.data[0];
  if (!order) return fail("订单不存在");
  const orderId = data.orderId || order._id;
  const items = await db.collection("order_items").where({ orderId }).get();
  return ok({ ...order, _id: orderId, items: items.data });
}

async function listOrders(data) {
  const where = data && data.status ? { status: data.status } : { status: _.neq("completed") };
  const orders = await db.collection("orders").where(where).orderBy("createdAt", "desc").limit(50).get();
  const orderIds = orders.data.map((order) => order._id);
  if (orderIds.length === 0) return ok([]);
  const items = await db.collection("order_items").where({ orderId: _.in(orderIds) }).get();
  const grouped = orders.data.map((order) => ({
    ...order,
    items: items.data.filter((item) => item.orderId === order._id)
  }));
  return ok(grouped);
}

async function updateOrderStatus(data) {
  if (!data.orderId || !data.status) return fail("缺少订单状态参数");
  const patch = {
    status: data.status,
    updatedAt: db.serverDate()
  };
  if (data.status === "confirmed") patch.confirmedAt = db.serverDate();
  if (data.status === "completed") patch.completedAt = db.serverDate();
  await db.collection("orders").doc(data.orderId).update({ data: patch });
  await db.collection("operation_logs").add({
    data: {
      type: "order_status",
      targetId: data.orderId,
      status: data.status,
      createdAt: db.serverDate()
    }
  });
  return ok({ orderId: data.orderId, status: data.status });
}

async function updateStoreConfig(data) {
  const patch = {
    name: data.name || "万万烧烤",
    tablePrefix: data.tablePrefix || "堂食点单",
    slogan: data.slogan || "炭火刚好，趁热开吃",
    headerImageUrl: data.headerImageUrl || "",
    headerImageFileId: data.headerImageFileId || "",
    updatedAt: db.serverDate()
  };
  await db.collection("settings").doc("store").set({ data: patch });
  await db.collection("operation_logs").add({
    data: {
      type: "store_config",
      targetId: "store",
      createdAt: db.serverDate()
    }
  });
  return ok(patch);
}

async function staffLogin(data) {
  if (!data.phone || !data.password) return fail("请输入手机号和密码");
  const res = await db.collection("staff_users").where({ phone: data.phone, enabled: true }).limit(1).get();
  const staff = res.data[0];
  if (!staff) return fail("账号不存在或已停用");
  if (staff.password !== data.password) return fail("密码错误");
  const { password, ...safeStaff } = staff;
  return ok(safeStaff);
}

async function saveCategory(data) {
  const id = data._id || `cat-${Date.now()}`;
  const patch = {
    name: data.name || "新分类",
    sort: Number(data.sort || 1),
    enabled: data.enabled !== false,
    updatedAt: db.serverDate()
  };
  if (data._id) {
    await db.collection("categories").doc(id).update({ data: patch });
  } else {
    patch.createdAt = db.serverDate();
    await db.collection("categories").doc(id).set({ data: patch });
  }
  await db.collection("operation_logs").add({ data: { type: "category_save", targetId: id, createdAt: db.serverDate() } });
  return ok({ _id: id, ...patch });
}

async function deleteCategory(data) {
  if (!data.categoryId) return fail("缺少分类 ID");
  await db.collection("categories").doc(data.categoryId).update({ data: { enabled: false, updatedAt: db.serverDate() } });
  await db.collection("operation_logs").add({ data: { type: "category_disable", targetId: data.categoryId, createdAt: db.serverDate() } });
  return ok({ categoryId: data.categoryId });
}

async function saveDish(data) {
  if (!data.name) return fail("请填写菜名");
  const id = data._id || `dish-${Date.now()}`;
  const patch = {
    categoryId: data.categoryId,
    name: data.name,
    price: Number(data.price || 0),
    unit: data.unit || "份",
    tag: data.tag || "",
    imageKey: data.imageKey || "egg",
    imageUrl: data.imageUrl || "",
    imageFileId: data.imageFileId || "",
    specs: Array.isArray(data.specs) ? data.specs : String(data.specs || "").split(/[、/,，\s]+/).filter(Boolean),
    enabled: data.enabled !== false,
    soldOut: data.soldOut === true,
    sort: Number(data.sort || 1),
    updatedAt: db.serverDate()
  };
  if (data._id) {
    await db.collection("dishes").doc(id).update({ data: patch });
  } else {
    patch.createdAt = db.serverDate();
    await db.collection("dishes").doc(id).set({ data: patch });
  }
  await db.collection("operation_logs").add({ data: { type: "dish_save", targetId: id, createdAt: db.serverDate() } });
  return ok({ _id: id, ...patch });
}

async function deleteDish(data) {
  if (!data.dishId) return fail("缺少菜品 ID");
  await db.collection("dishes").doc(data.dishId).update({ data: { enabled: false, updatedAt: db.serverDate() } });
  await db.collection("operation_logs").add({ data: { type: "dish_disable", targetId: data.dishId, createdAt: db.serverDate() } });
  return ok({ dishId: data.dishId });
}

async function updateDishStatus(data) {
  if (!data.dishId) return fail("缺少菜品 ID");
  const patch = { updatedAt: db.serverDate() };
  if (typeof data.enabled === "boolean") patch.enabled = data.enabled;
  if (typeof data.soldOut === "boolean") patch.soldOut = data.soldOut;
  await db.collection("dishes").doc(data.dishId).update({ data: patch });
  await db.collection("operation_logs").add({ data: { type: "dish_status", targetId: data.dishId, createdAt: db.serverDate() } });
  return ok({ dishId: data.dishId, ...patch });
}

async function generateTableQr(data) {
  const tableNo = data.tableNo || "03";
  const scene = `table_${tableNo}`;
  const page = "pages/menu/menu";
  const cloudPath = `table-qrs/table-${tableNo}-${Date.now()}.png`;
  const codeRes = await cloud.openapi.wxacode.getUnlimited({
    scene,
    page,
    checkPath: false,
    envVersion: data.envVersion || "release"
  });
  if (!codeRes || !codeRes.buffer) return fail("桌码生成失败");
  const uploadRes = await cloud.uploadFile({
    cloudPath,
    fileContent: codeRes.buffer
  });
  const tempRes = await cloud.getTempFileURL({
    fileList: [uploadRes.fileID]
  });
  const tempFileURL = tempRes.fileList && tempRes.fileList[0] ? tempRes.fileList[0].tempFileURL : "";
  const tablePatch = {
    tableNo,
    scene,
    qrFileID: uploadRes.fileID,
    qrTempFileURL: tempFileURL,
    enabled: true,
    updatedAt: db.serverDate()
  };
  const tableRes = await db.collection("tables").where({ tableNo }).limit(1).get();
  if (tableRes.data && tableRes.data[0]) {
    await db.collection("tables").doc(tableRes.data[0]._id).update({ data: tablePatch });
  } else {
    await db.collection("tables").add({
      data: {
        ...tablePatch,
        createdAt: db.serverDate()
      }
    });
  }
  return ok({
    tableNo,
    scene,
    page,
    fileID: uploadRes.fileID,
    tempFileURL,
    qrText: `${tableNo}桌桌码`
  });
}

exports.main = async (event) => {
  const action = event.action;
  const data = event.data || {};
  try {
    switch (action) {
      case "initSeedData":
        return await initSeedData(data);
      case "getMenu":
        return await getMenu(data);
      case "getTables":
        return await getTables(data);
      case "createOrder":
        return await createOrder(data);
      case "getOrder":
        return await getOrder(data);
      case "validateCart":
        return await validateCart(data);
      case "listOrders":
        return await listOrders(data);
      case "updateOrderStatus":
        return await updateOrderStatus(data);
      case "updateStoreConfig":
        return await updateStoreConfig(data);
      case "staffLogin":
        return await staffLogin(data);
      case "saveCategory":
        return await saveCategory(data);
      case "deleteCategory":
        return await deleteCategory(data);
      case "saveDish":
        return await saveDish(data);
      case "deleteDish":
        return await deleteDish(data);
      case "updateDishStatus":
        return await updateDishStatus(data);
      case "generateTableQr":
        return await generateTableQr(data);
      default:
        return fail(`未知接口：${action}`);
    }
  } catch (error) {
    return fail(error.message || "服务异常");
  }
};
