const { getBrandHeadStyle } = require("../../utils/layout");
const api = require("../../utils/api");
const { requireStaff } = require("../../utils/auth");

Page({
  data: {
    brandHeadStyle: "",
    tables: [],
    tableIndex: 2,
    tableNo: "03",
    scene: "table_03",
    qrText: "03桌桌码",
    qrUrl: "",
    generating: false
  },

  async onLoad() {
    if (!requireStaff()) return;
    this.setData({ brandHeadStyle: getBrandHeadStyle() });
    await this.loadTables();
    await this.generateQr();
  },

  async loadTables() {
    const tables = await api.getTables();
    const tableIndex = Math.max(0, tables.findIndex((item) => item.tableNo === this.data.tableNo));
    this.setData({ tables, tableIndex });
  },

  chooseTable(event) {
    const tableIndex = Number(event.detail.value);
    const table = this.data.tables[tableIndex];
    this.setData({
      tableIndex,
      tableNo: table.tableNo,
      scene: table.scene || `table_${table.tableNo}`,
      qrText: `${table.tableNo}桌桌码`
    });
    this.generateQr();
  },

  async generateQr() {
    if (this.data.generating) return;
    this.setData({ generating: true });
    try {
      const res = await api.generateTableQr({ tableNo: this.data.tableNo });
      this.setData({
        scene: res.scene,
        qrText: res.qrText,
        qrUrl: res.tempFileURL || ""
      });
    } catch (error) {
      wx.showToast({ title: error.message || "生成失败", icon: "none" });
    } finally {
      this.setData({ generating: false });
    }
  },

  downloadQr() {
    wx.showToast({ title: this.data.qrUrl ? "下载能力已接入" : "云码生成后可下载", icon: "none" });
  },

  printQr() {
    wx.showToast({ title: "请连接打印机后打印", icon: "none" });
  }
});
