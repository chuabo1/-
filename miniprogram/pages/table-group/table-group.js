const api = require("../../utils/api");
const { getBrandHeadStyle } = require("../../utils/layout");

Page({
  data: {
    brandHeadStyle: "",
    tableNo: "03",
    orders: [],
    total: 0
  },

  async onLoad(options) {
    this.setData({
      brandHeadStyle: getBrandHeadStyle(),
      tableNo: options.tableNo || "03"
    });
    await Promise.all([this.loadBrandHead(), this.loadOrders()]);
  },

  async loadBrandHead() {
    try {
      const { storeConfig } = await api.getMenu();
      this.setData({ brandHeadStyle: getBrandHeadStyle(0, storeConfig && storeConfig.headerImageUrl) });
    } catch (error) {
      // Keep the gradient header if store config fails.
    }
  },

  async loadOrders() {
    const [pending, confirmed, completed] = await Promise.all([
      api.listOrders({ status: "pending" }),
      api.listOrders({ status: "confirmed" }),
      api.listOrders({ status: "completed" })
    ]);
    const all = pending.concat(confirmed, completed);
    const orders = all
      .filter((order) => order.tableNo === this.data.tableNo)
      .map((order) => ({
        ...order,
        statusText: order.status === "completed" ? "已完成" : order.status === "confirmed" ? "已确认" : "新加菜"
      }));
    const total = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    this.setData({ orders, total });
  },

  finishAll() {
    wx.showToast({ title: "已标记完成", icon: "success" });
  }
});
