const { getBrandHeadStyle } = require("../../utils/layout");
const api = require("../../utils/api");

Page({
  data: {
    brandHeadStyle: "",
    phone: "",
    password: "",
    loading: false
  },

  async onLoad() {
    this.setData({ brandHeadStyle: getBrandHeadStyle() });
    await this.loadBrandHead();
  },

  async loadBrandHead() {
    try {
      const { storeConfig } = await api.getMenu();
      this.setData({ brandHeadStyle: getBrandHeadStyle(0, storeConfig && storeConfig.headerImageUrl) });
    } catch (error) {
      // Keep the gradient header if store config fails.
    }
  },

  onPhoneInput(event) {
    this.setData({ phone: event.detail.value });
  },

  onPasswordInput(event) {
    this.setData({ password: event.detail.value });
  },

  async login() {
    if (!this.data.phone || !this.data.password) {
      wx.showToast({ title: "请输入手机号和密码", icon: "none" });
      return;
    }
    this.setData({ loading: true });
    try {
      const staff = await api.staffLogin({ phone: this.data.phone, password: this.data.password });
      getApp().globalData.staff = staff;
      wx.setStorageSync("wanwan_staff", staff);
      wx.showToast({ title: "登录成功", icon: "success" });
      wx.redirectTo({ url: "/pages/staff-workbench/staff-workbench" });
    } catch (error) {
      wx.showToast({ title: error.message || "登录失败", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  }
});
