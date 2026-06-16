const { getBrandHeadStyle } = require("../../utils/layout");
const api = require("../../utils/api");

Page({
  data: {
    brandHeadStyle: "",
    phone: "",
    password: "",
    loading: false
  },

  onLoad() {
    this.setData({ brandHeadStyle: getBrandHeadStyle() });
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
