const api = require("../../utils/api");
const { sumCart, cartCount } = require("../../utils/format");

function cartKey(dish, spec = "") {
  return `${dish._id || dish.dishId}::${spec}`;
}

function cartStorageKey(tableNo) {
  return `wanwan_cart_${tableNo}`;
}

function tableNoFromScene(scene) {
  try {
    const value = decodeURIComponent(scene || "").replace(/^table_/, "");
    return value ? value.padStart(2, "0") : "";
  } catch (error) {
    return "";
  }
}

function categoryTitle(name) {
  return String(name || "").replace(/\s+/g, "");
}

function cartSheetHeight(itemCount) {
  const rowsHeight = Math.max(1, itemCount) * 136;
  return Math.min(1080, Math.max(720, 500 + rowsHeight));
}

Page({
  data: {
    tableNo: "03",
    storeConfig: {
      name: "万万烧烤",
      tablePrefix: "堂食点单",
      slogan: "炭火刚好，趁热开吃",
      headerImageUrl: ""
    },
    menuHeadStyle: "",
    headerTopPx: 56,
    categories: [],
    dishes: [],
    activeCategoryId: "cat-hot",
    activeCategoryTitle: "必吃强烈推荐",
    showHotBadge: true,
    visibleDishes: [],
    cartMap: {},
    dishQuantities: {},
    cartItems: [],
    cartCount: 0,
    cartTotal: 0,
    cartDisabled: true,
    cartButtonText: "先选菜",
    cartSheetHeight: cartSheetHeight(0),
    loading: true,
    error: "",
    specVisible: false,
    cartVisible: false,
    confirmVisible: false,
    selectedDish: { name: "", specs: [] },
    selectedDishTitle: "",
    selectedSpecOptions: [],
    selectedSummary: {},
    selectedSpec: "",
    specQuantity: 1,
    specSheetHeight: 720,
    remark: "",
    submitting: false,
    validating: false
  },

  async onLoad(options) {
    const app = getApp();
    const sceneTableNo = tableNoFromScene(options.scene);
    const tableNo = options.tableNo || sceneTableNo || app.globalData.tableNo || "03";
    app.globalData.tableNo = tableNo;
    this.setData({ tableNo });
    this.initHeaderLayout();
    await this.loadMenu();
    this.restoreCart();
  },

  initHeaderLayout() {
    let headerTopPx = 56;
    try {
      const capsule = wx.getMenuButtonBoundingClientRect();
      if (capsule && capsule.bottom) headerTopPx = capsule.bottom + 12;
    } catch (error) {
      const system = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
      headerTopPx = (system.statusBarHeight || 24) + 48;
    }
    this.setData({ headerTopPx });
    this.updateMenuHeadStyle(this.data.storeConfig);
  },

  updateMenuHeadStyle(storeConfig) {
    const bg = storeConfig.headerImageUrl
      ? `background-image: url(${storeConfig.headerImageUrl});`
      : "";
    this.setData({
      menuHeadStyle: `${bg} padding: ${this.data.headerTopPx - 12}px 32rpx 24rpx;`
    });
  },

  async loadMenu() {
    this.setData({ loading: true, error: "" });
    try {
      const { storeConfig, categories, dishes } = await api.getMenu();
      const nextStoreConfig = {
        ...this.data.storeConfig,
        ...(storeConfig || {})
      };
      const activeCategoryId = categories[0] ? categories[0]._id : "";
      this.setData({
        storeConfig: nextStoreConfig,
        categories: this.decorateCategories(categories, activeCategoryId, this.data.cartCount),
        dishes,
        activeCategoryId
      });
      this.updateMenuHeadStyle(nextStoreConfig);
      this.updateVisibleDishes();
    } catch (error) {
      this.setData({ error: error.message || "菜单加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },

  selectCategory(event) {
    const activeCategoryId = event.currentTarget.dataset.id;
    this.setData({
      activeCategoryId,
      categories: this.decorateCategories(this.data.categories, activeCategoryId, this.data.cartCount)
    });
    this.updateVisibleDishes();
  },

  decorateCategories(categories, activeCategoryId, count) {
    return (categories || []).map((category) => ({
      ...category,
      activeClass: category._id === activeCategoryId ? "active" : "",
      cartDotVisible: category._id === "cat-hot" && count > 0
    }));
  },

  updateActiveCategoryMeta() {
    const activeCategory = this.data.categories.find((category) => category._id === this.data.activeCategoryId) || {};
    this.setData({
      activeCategoryTitle: categoryTitle(activeCategory.name) || "菜品",
      showHotBadge: activeCategory._id === "cat-hot"
    });
  },

  updateVisibleDishes() {
    const visibleDishes = this.data.dishes
      .filter((dish) => dish.categoryId === this.data.activeCategoryId && dish.enabled)
      .map((dish) => ({
        ...dish,
        quantityInCart: this.data.dishQuantities[dish._id] || 0
      }));
    this.setData({
      visibleDishes,
      categories: this.decorateCategories(this.data.categories, this.data.activeCategoryId, this.data.cartCount)
    });
    this.updateActiveCategoryMeta();
  },

  addDish(event) {
    const dish = event.detail.dish;
    if (dish.specs && dish.specs.length) {
      this.openSpec(event);
      return;
    }
    this.setCartItem(dish, "", 1);
  },

  openSpec(event) {
    const dish = event.detail.dish;
    const specOptions = Array.isArray(dish.specs) ? dish.specs : [];
    const selectedSpec = specOptions[0] || "";
    const specRows = Math.max(1, Math.ceil(specOptions.length / 3));
    this.setData({
      specVisible: true,
      selectedDish: dish,
      selectedDishTitle: dish.name || "",
      selectedSpecOptions: specOptions,
      selectedSummary: { ...dish, quantity: 1 },
      selectedSpec,
      specQuantity: 1,
      specSheetHeight: Math.min(1040, Math.max(720, 616 + specRows * 88))
    });
  },

  closeSpec() {
    this.setData({ specVisible: false });
  },

  changeSpec(event) {
    this.setData({ selectedSpec: event.detail.value });
  },

  changeSpecQuantity(event) {
    this.setData({ specQuantity: event.detail.value });
  },

  confirmSpec() {
    this.setCartItem(this.data.selectedDish, this.data.selectedSpec, this.data.specQuantity);
    this.closeSpec();
  },

  changeDishQuantity(event) {
    const dish = event.detail.dish;
    const nextQuantity = Number(event.detail.value || 0);
    if (dish.specs && dish.specs.length) {
      const currentQuantity = Number(this.data.dishQuantities[dish._id] || 0);
      if (nextQuantity < currentQuantity) {
        this.reduceSpecDishQuantity(dish._id, currentQuantity - nextQuantity);
      } else if (nextQuantity > currentQuantity) {
        this.openSpec({ detail: { dish } });
      }
      return;
    }
    this.setCartItem(dish, "", nextQuantity, true);
  },

  changeCartQuantity(event) {
    const item = event.detail.item;
    this.setCartItem(item, item.spec || "", event.detail.value, true);
  },

  setCartItem(dish, spec, quantity, replace = false) {
    const key = cartKey(dish, spec);
    const cartMap = { ...this.data.cartMap };
    const current = cartMap[key] || {
      key,
      dishId: dish._id || dish.dishId,
      name: dish.name,
      spec,
      price: dish.price,
      unit: dish.unit,
      imageKey: dish.imageKey,
      imageUrl: dish.imageUrl || "",
      quantity: 0
    };
    current.quantity = replace ? quantity : current.quantity + quantity;
    if (current.quantity <= 0) {
      delete cartMap[key];
    } else {
      cartMap[key] = current;
    }
    this.refreshCart(cartMap);
  },

  reduceSpecDishQuantity(dishId, amount) {
    let remaining = Number(amount || 0);
    if (remaining <= 0) return;
    const cartMap = { ...this.data.cartMap };
    const keys = Object.keys(cartMap).filter((key) => cartMap[key].dishId === dishId).reverse();
    keys.forEach((key) => {
      if (remaining <= 0) return;
      const item = { ...cartMap[key] };
      const nextQuantity = Math.max(0, Number(item.quantity || 0) - remaining);
      remaining -= Number(item.quantity || 0) - nextQuantity;
      if (nextQuantity <= 0) {
        delete cartMap[key];
      } else {
        cartMap[key] = { ...item, quantity: nextQuantity };
      }
    });
    this.refreshCart(cartMap);
  },

  refreshCart(cartMap) {
    const cartItems = Object.keys(cartMap).map((key) => {
      const item = cartMap[key];
      return {
        ...item,
        displayName: item.spec ? `${item.name} · ${item.spec}` : item.name,
        subtotal: item.price * item.quantity
      };
    });
    const dishQuantities = cartItems.reduce((acc, item) => {
      acc[item.dishId] = (acc[item.dishId] || 0) + item.quantity;
      return acc;
    }, {});
    const nextCartCount = cartCount(cartMap);
    this.setData({
      cartMap,
      dishQuantities,
      cartItems,
      cartCount: nextCartCount,
      cartTotal: sumCart(cartMap),
      cartDisabled: this.data.submitting || nextCartCount === 0,
      cartButtonText: nextCartCount > 0 ? "提交" : "先选菜",
      cartSheetHeight: cartSheetHeight(cartItems.length)
    });
    this.saveCart(cartMap);
    this.updateVisibleDishes();
  },

  saveCart(cartMap) {
    try {
      wx.setStorageSync(cartStorageKey(this.data.tableNo), cartMap);
    } catch (error) {
      // Local cart persistence is best effort; ordering still works without it.
    }
  },

  restoreCart() {
    try {
      const cartMap = wx.getStorageSync(cartStorageKey(this.data.tableNo)) || {};
      const validCartMap = Object.keys(cartMap).reduce((acc, key) => {
        const item = cartMap[key];
        if (item && item.dishId && item.name && Number(item.price) >= 0 && Number(item.quantity) > 0) {
          acc[key] = item;
        }
        return acc;
      }, {});
      this.refreshCart(validCartMap, true);
    } catch (error) {
      this.refreshCart({}, true);
    }
  },

  openCart() {
    if (this.data.cartCount <= 0) {
      wx.showToast({ title: "请先选择菜品", icon: "none" });
      return;
    }
    this.setData({ cartVisible: true });
  },

  closeCart() {
    this.setData({ cartVisible: false });
  },

  openStaffLogin() {
    wx.navigateTo({ url: "/pages/staff-login/staff-login" });
  },

  clearCart() {
    this.refreshCart({});
    try {
      wx.removeStorageSync(cartStorageKey(this.data.tableNo));
    } catch (error) {
      // Ignore local cache cleanup failures.
    }
    this.setData({ cartVisible: false });
  },

  async openConfirm() {
    if (this.data.validating || this.data.cartCount <= 0) return;
    this.setData({ validating: true });
    try {
      const validation = await api.validateCart({ items: this.data.cartItems });
      if (!validation.valid) {
        wx.showToast({ title: validation.message || "购物车已变化", icon: "none" });
        return;
      }
      const nextCartMap = validation.items.reduce((acc, item) => {
        acc[item.key || cartKey(item, item.spec || "")] = item;
        return acc;
      }, {});
      this.refreshCart(nextCartMap);
      this.setData({ cartVisible: false, confirmVisible: true });
    } catch (error) {
      wx.showToast({ title: error.message || "校验失败，请重试", icon: "none" });
    } finally {
      this.setData({ validating: false });
    }
  },

  closeConfirm() {
    this.setData({ confirmVisible: false, cartVisible: true });
  },

  onRemarkInput(event) {
    this.setData({ remark: event.detail.value });
  },

  async submitOrder() {
    if (this.data.submitting || this.data.cartCount <= 0) return;
    this.setData({ submitting: true, cartDisabled: true });
    try {
      const order = await api.createOrder({
        tableNo: this.data.tableNo,
        remark: this.data.remark,
        items: this.data.cartItems
      });
      try {
        wx.setStorageSync(`wanwan_order_${order.orderNo}`, order);
        wx.removeStorageSync(cartStorageKey(this.data.tableNo));
      } catch (error) {
        // Success page can still query the order through API.
      }
      this.refreshCart({});
      wx.redirectTo({ url: `/pages/success/success?orderId=${order._id}&orderNo=${order.orderNo}&tableNo=${order.tableNo}&total=${order.totalAmount}` });
    } catch (error) {
      wx.showToast({ title: error.message || "下单失败，请重试", icon: "none" });
    } finally {
      this.setData({
        submitting: false,
        cartDisabled: this.data.cartCount === 0
      });
    }
  }
});
