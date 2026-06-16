const { getBrandHeadStyle } = require("../../utils/layout");
const api = require("../../utils/api");

Page({
  data: {
    brandHeadStyle: "",
    tableNo: "03",
    orderNo: "03-2148",
    total: 0,
    items: [],
    loading: true
  },

  async onLoad(options) {
    this.setData({
      brandHeadStyle: getBrandHeadStyle(),
      tableNo: options.tableNo || getApp().globalData.tableNo || "03",
      orderNo: options.orderNo || "03-2148",
      total: Number(options.total || 0)
    });
    await this.loadOrder(options);
  },

  async loadOrder(options) {
    try {
      const cached = wx.getStorageSync(`wanwan_order_${this.data.orderNo}`);
      const order = cached || await api.getOrder({ orderId: options.orderId, orderNo: this.data.orderNo });
      const items = (order.items || []).map((item, index) => ({
        ...item,
        key: `${item.dishId || item.name}-${item.spec || ""}-${index}`,
        displayName: item.spec ? `${item.name} · ${item.spec}` : item.name,
        subtotal: item.subtotal || item.price * item.quantity
      }));
      this.setData({
        tableNo: order.tableNo || this.data.tableNo,
        orderNo: order.orderNo || this.data.orderNo,
        total: order.totalAmount || this.data.total,
        items
      });
    } catch (error) {
      wx.showToast({ title: error.message || "订单加载失败", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  },

  continueOrder() {
    wx.redirectTo({ url: `/pages/menu/menu?tableNo=${this.data.tableNo}` });
  }
});
