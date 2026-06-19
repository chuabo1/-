const api = require("../../utils/api");
const { getBrandHeadStyle } = require("../../utils/layout");
const { requireStaff } = require("../../utils/auth");

function groupOrdersByTable(orders, status) {
  const groups = {};
  (orders || []).forEach((order) => {
    const tableNo = order.tableNo || "未知";
    if (!groups[tableNo]) {
      groups[tableNo] = {
        _id: `table-${status}-${tableNo}`,
        tableNo,
        status,
        totalAmount: 0,
        latestAt: 0,
        orders: []
      };
    }
    groups[tableNo].orders.push(order);
    groups[tableNo].totalAmount += Number(order.totalAmount || 0);
    groups[tableNo].latestAt = Math.max(groups[tableNo].latestAt, Number(order.createdAt || 0));
  });
  return Object.keys(groups)
    .map((key) => ({
      ...groups[key],
      orders: groups[key].orders.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    }))
    .sort((a, b) => b.latestAt - a.latestAt);
}

Page({
  data: {
    brandHeadStyle: "",
    orders: [],
    statusTabs: [
      { label: "新订单", value: "pending", activeClass: "active" },
      { label: "待完成", value: "confirmed", activeClass: "" },
      { label: "已完成", value: "completed", activeClass: "" }
    ],
    activeStatus: "pending",
    loading: true,
    error: "",
    watchTask: null
  },

  async onLoad() {
    this.setData({ brandHeadStyle: getBrandHeadStyle() });
    await this.loadBrandHead();
    if (!this.ensureStaff()) return;
    await this.loadOrders();
    this.startWatch();
  },

  async loadBrandHead() {
    try {
      const { storeConfig } = await api.getMenu();
      this.setData({ brandHeadStyle: getBrandHeadStyle(0, storeConfig && storeConfig.headerImageUrl) });
    } catch (error) {
      // Keep the gradient header if store config fails.
    }
  },

  ensureStaff() {
    return requireStaff();
  },

  onUnload() {
    if (this.data.watchTask && this.data.watchTask.close) {
      this.data.watchTask.close();
    }
  },

  async loadOrders() {
    this.setData({ loading: true, error: "" });
    try {
      const orders = await api.listOrders({ status: this.data.activeStatus });
      this.setData({ orders: groupOrdersByTable(orders, this.data.activeStatus) });
    } catch (error) {
      this.setData({ error: error.message || "订单加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },

  startWatch() {
    if (!wx.cloud || !wx.cloud.database) return;
    try {
      const db = wx.cloud.database();
      const watchTask = db.collection("orders")
        .where({ status: "pending" })
        .watch({
          onChange: () => {
            wx.vibrateShort({ type: "light" });
            this.loadOrders();
          },
          onError: () => {
            setTimeout(() => this.loadOrders(), 15000);
          }
        });
      this.setData({ watchTask });
    } catch (error) {
      setTimeout(() => this.loadOrders(), 15000);
    }
  },

  async confirmOrder(event) {
    await this.updateStatus(event.detail.order, "confirmed");
  },

  async completeOrder(event) {
    await this.updateStatus(event.detail.order, "completed");
  },

  async updateStatus(order, status) {
    try {
      wx.showLoading({ title: "处理中" });
      await api.updateOrderStatus({ orderId: order._id, status });
      await this.loadOrders();
      wx.showToast({ title: "已更新", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "更新失败", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  },

  switchStatus(event) {
    const activeStatus = event.currentTarget.dataset.status;
    this.setData({
      activeStatus,
      statusTabs: this.data.statusTabs.map((tab) => ({
        ...tab,
        activeClass: tab.value === activeStatus ? "active" : ""
      }))
    });
    this.loadOrders();
  },

  openMenuAdmin() {
    wx.navigateTo({ url: "/pages/menu-admin/menu-admin" });
  },

  openStoreAdmin() {
    wx.navigateTo({ url: "/pages/store-admin/store-admin" });
  }
});
