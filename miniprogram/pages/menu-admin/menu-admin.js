const api = require("../../utils/api");
const { getBrandHeadStyle } = require("../../utils/layout");
const { requireStaff } = require("../../utils/auth");

Page({
  data: {
    brandHeadStyle: "",
    categories: [],
    dishes: [],
    enabledCount: 0
  },

  async onLoad() {
    if (!requireStaff()) return;
    await this.loadData();
  },

  async onShow() {
    if (this.data.brandHeadStyle) await this.loadData();
  },

  async loadData() {
    const { categories, dishes } = await api.getMenu();
    this.setData({
      brandHeadStyle: getBrandHeadStyle(),
      categories,
      dishes: dishes.map((dish) => ({
        ...dish,
        enabledText: dish.enabled ? "已上架" : "已下架",
        soldOutText: dish.soldOut ? "售罄" : "可售",
        enabledAction: dish.enabled ? "下架" : "上架",
        soldOutAction: dish.soldOut ? "恢复" : "售罄",
        nextEnabled: !dish.enabled,
        nextSoldOut: !dish.soldOut
      })),
      enabledCount: dishes.filter((dish) => dish.enabled).length
    });
  },

  addDish() {
    wx.navigateTo({ url: "/pages/dish-edit/dish-edit" });
  },

  editDish(event) {
    wx.navigateTo({ url: `/pages/dish-edit/dish-edit?dishId=${event.currentTarget.dataset.id}` });
  },

  openCategoryAdmin() {
    wx.navigateTo({ url: "/pages/category-admin/category-admin" });
  },

  async toggleDishEnabled(event) {
    const dish = this.data.dishes.find((item) => item._id === event.currentTarget.dataset.id);
    if (dish) await this.updateDishStatus(dish._id, { enabled: !dish.enabled });
  },

  async toggleDishSoldOut(event) {
    const dish = this.data.dishes.find((item) => item._id === event.currentTarget.dataset.id);
    if (dish) await this.updateDishStatus(dish._id, { soldOut: !dish.soldOut });
  },

  async updateDishStatus(dishId, patch) {
    try {
      await api.updateDishStatus({ dishId, ...patch });
      await this.loadData();
      wx.showToast({ title: "已更新", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "更新失败", icon: "none" });
    }
  }
});
