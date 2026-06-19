const api = require("../../utils/api");
const { getBrandHeadStyle } = require("../../utils/layout");

Page({
  data: {
    brandHeadStyle: "",
    tables: [],
    selectedTable: "03"
  },

  async onLoad() {
    const app = getApp();
    this.setData({
      brandHeadStyle: getBrandHeadStyle(),
      selectedTable: app.globalData.tableNo || "03"
    });
    await Promise.all([this.loadBrandHead(), this.loadTables()]);
  },

  async loadBrandHead() {
    try {
      const { storeConfig } = await api.getMenu();
      this.setData({ brandHeadStyle: getBrandHeadStyle(0, storeConfig && storeConfig.headerImageUrl) });
    } catch (error) {
      // Keep the gradient header if store config fails.
    }
  },

  async loadTables() {
    try {
      wx.showLoading({ title: "加载中" });
      const tables = await api.getTables();
      this.setData({ tables });
    } catch (error) {
      wx.showToast({ title: error.message || "加载失败", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  },

  selectTable(event) {
    this.setData({ selectedTable: event.currentTarget.dataset.table });
  },

  enterMenu() {
    getApp().globalData.tableNo = this.data.selectedTable;
    wx.navigateTo({ url: `/pages/menu/menu?tableNo=${this.data.selectedTable}` });
  },

  openStaffLogin() {
    wx.navigateTo({ url: "/pages/staff-login/staff-login" });
  }
});
