const api = require("../../utils/api");
const { getBrandHeadStyle } = require("../../utils/layout");
const { requireStaff } = require("../../utils/auth");
const { USE_MOCK } = require("../../utils/config");
const { chooseOneImage } = require("../../utils/image");

Page({
  data: {
    brandHeadStyle: "",
    storeForm: {
      name: "万万烧烤",
      tablePrefix: "堂食点单",
      slogan: "炭火刚好，趁热开吃",
      headerImageUrl: "",
      headerImageFileId: ""
    },
    tables: [],
    tableIndex: 2,
    tableNo: "03",
    scene: "table_03",
    qrText: "03桌桌码",
    qrUrl: "",
    hasLocalHeaderPreview: false,
    savingStore: false,
    generating: false
  },

  async onLoad() {
    if (!requireStaff()) return;
    this.setData({ brandHeadStyle: getBrandHeadStyle() });
    await this.loadStore();
    await this.loadTables();
    await this.generateQr();
  },

  async onShow() {
    if (this.data.brandHeadStyle && !this.data.hasLocalHeaderPreview) await this.loadStore();
  },

  async loadStore() {
    const { storeConfig } = await api.getMenu();
    this.setData({
      storeForm: {
        ...this.data.storeForm,
        ...(storeConfig || {})
      }
    });
  },

  async loadTables() {
    const tables = await api.getTables();
    const tableIndex = Math.max(0, tables.findIndex((item) => item.tableNo === this.data.tableNo));
    const table = tables[tableIndex] || {};
    this.setData({
      tables,
      tableIndex,
      tableNo: table.tableNo || this.data.tableNo,
      scene: table.scene || this.data.scene
    });
  },

  onStoreInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`storeForm.${field}`]: event.detail.value });
  },

  async saveStoreConfig() {
    if (this.data.savingStore) return;
    this.setData({ savingStore: true });
    try {
      await api.updateStoreConfig(this.data.storeForm);
      this.setData({ hasLocalHeaderPreview: false });
      wx.showToast({ title: "已保存", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "保存失败", icon: "none" });
    } finally {
      this.setData({ savingStore: false });
    }
  },

  async chooseHeaderImage() {
    try {
      const tempFilePath = await chooseOneImage();
      wx.navigateTo({
        url: `/pages/image-cropper/image-cropper?target=header&ratio=16:9&src=${encodeURIComponent(tempFilePath)}`
      });
    } catch (error) {
      wx.showToast({ title: error.message || "图片处理失败", icon: "none" });
    }
  },

  async onImageCropped(event) {
    const tempFilePath = event.tempFilePath;
    this.setData({
      "storeForm.headerImageUrl": tempFilePath,
      hasLocalHeaderPreview: true
    });
    if (!USE_MOCK && wx.cloud && wx.cloud.uploadFile) {
      try {
        const cloudPath = `store/header-${Date.now()}.jpg`;
        const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: tempFilePath });
        this.setData({ "storeForm.headerImageFileId": uploadRes.fileID });
      } catch (error) {
        wx.showToast({ title: "云上传失败，已本地预览", icon: "none" });
      }
    }
  },

  chooseTable(event) {
    const tableIndex = Number(event.detail.value);
    const table = this.data.tables[tableIndex];
    if (!table) return;
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
    if (!this.data.qrUrl) {
      wx.showToast({ title: "请先生成桌码", icon: "none" });
      return;
    }
    wx.downloadFile({
      url: this.data.qrUrl,
      success: (res) => {
        if (res.statusCode !== 200) {
          wx.showToast({ title: "下载失败", icon: "none" });
          return;
        }
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => wx.showToast({ title: "已保存", icon: "success" }),
          fail: () => wx.previewImage({ urls: [this.data.qrUrl] })
        });
      },
      fail: () => wx.showToast({ title: "下载失败", icon: "none" })
    });
  },

  printQr() {
    wx.showToast({ title: "请连接打印机后打印", icon: "none" });
  }
});
