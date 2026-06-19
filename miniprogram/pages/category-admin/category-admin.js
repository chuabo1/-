const api = require("../../utils/api");
const { getBrandHeadStyle } = require("../../utils/layout");
const { requireStaff } = require("../../utils/auth");

Page({
  data: {
    brandHeadStyle: "",
    categories: [],
    saving: false
  },

  async onLoad() {
    if (!requireStaff()) return;
    await this.loadCategories();
  },

  async loadCategories() {
    const { storeConfig, categories } = await api.getMenu();
    this.setData({
      brandHeadStyle: getBrandHeadStyle(0, storeConfig && storeConfig.headerImageUrl),
      categories: categories.map((item) => ({
        ...item,
        nameText: item.name.replace("\n", " "),
        enabledText: item.enabled ? "启用中" : "已停用",
        enabledAction: item.enabled ? "停用" : "启用",
        nextEnabled: !item.enabled
      }))
    });
  },

  addCategory() {
    const categories = this.data.categories.concat({
      _id: "",
      name: "新分类",
      nameText: "新分类",
      sort: this.data.categories.length + 1,
      enabled: true,
      enabledText: "启用中",
      enabledAction: "停用",
      nextEnabled: false
    });
    this.setData({ categories });
  },

  onInput(event) {
    const index = event.currentTarget.dataset.index;
    const field = event.currentTarget.dataset.field;
    this.setData({ [`categories[${index}].${field}`]: event.detail.value });
  },

  async saveCategory(event) {
    if (this.data.saving) return;
    const index = event.currentTarget.dataset.index;
    const category = this.data.categories[index];
    this.setData({ saving: true });
    try {
      await api.saveCategory({
        _id: category._id,
        name: category.name,
        sort: category.sort,
        enabled: category.enabled !== false
      });
      await this.loadCategories();
      wx.showToast({ title: "已保存", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "保存失败", icon: "none" });
    } finally {
      this.setData({ saving: false });
    }
  },

  async toggleCategory(event) {
    const index = event.currentTarget.dataset.index;
    const category = this.data.categories[index];
    this.setData({ [`categories[${index}].enabled`]: !category.enabled });
    await this.saveCategory({ currentTarget: { dataset: { index } } });
  },

  async deleteCategory(event) {
    const index = event.currentTarget.dataset.index;
    const category = this.data.categories[index];
    if (!category._id) {
      const categories = this.data.categories.slice();
      categories.splice(index, 1);
      this.setData({ categories });
      return;
    }
    try {
      await api.deleteCategory({ categoryId: category._id });
      await this.loadCategories();
      wx.showToast({ title: "已删除", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "操作失败", icon: "none" });
    }
  }
});
