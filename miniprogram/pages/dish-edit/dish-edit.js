const { getBrandHeadStyle } = require("../../utils/layout");
const api = require("../../utils/api");
const { requireStaff } = require("../../utils/auth");
const { USE_MOCK } = require("../../utils/config");
const { chooseOneImage } = require("../../utils/image");

Page({
  data: {
    brandHeadStyle: "",
    categories: [],
    dishId: "",
    form: {
      _id: "",
      categoryId: "cat-hot",
      categoryName: "必吃强烈推荐",
      name: "蒜香烤鸡翅",
      price: "12",
      unit: "份",
      tag: "2人推荐",
      imageKey: "wing",
      imageUrl: "",
      imageFileId: "",
      specs: "微辣 / 中辣 / 加辣",
      enabled: true,
      soldOut: false
    },
    enabledText: "上架中",
    soldOutText: "可售",
    saving: false
  },

  async onLoad(options) {
    if (!requireStaff()) return;
    this.setData({
      brandHeadStyle: getBrandHeadStyle(),
      dishId: options.dishId || ""
    });
    await this.loadData(options.dishId);
  },

  async loadData(dishId) {
    const { categories, dishes } = await api.getMenu();
    const dish = dishes.find((item) => item._id === dishId);
    const category = dish ? categories.find((item) => item._id === dish.categoryId) : categories[0];
    const form = dish ? {
      _id: dish._id,
      categoryId: dish.categoryId,
      categoryName: category ? category.name.replace("\n", "") : "",
      name: dish.name,
      price: String(dish.price),
      unit: dish.unit,
      tag: dish.tag || "",
      imageKey: dish.imageKey || "egg",
      imageUrl: dish.imageUrl || "",
      imageFileId: dish.imageFileId || "",
      specs: (dish.specs || []).join(" / "),
      enabled: dish.enabled !== false,
      soldOut: dish.soldOut === true
    } : {
      ...this.data.form,
      categoryId: category ? category._id : "cat-hot",
      categoryName: category ? category.name.replace("\n", "") : "必吃强烈推荐"
    };
    this.setData({
      categories,
      form,
      enabledText: form.enabled ? "上架中" : "已下架",
      soldOutText: form.soldOut ? "售罄" : "可售"
    });
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  chooseCategory(event) {
    const category = this.data.categories[Number(event.detail.value)];
    this.setData({
      "form.categoryId": category._id,
      "form.categoryName": category.name.replace("\n", "")
    });
  },

  toggleEnabled() {
    const enabled = !this.data.form.enabled;
    this.setData({
      "form.enabled": enabled,
      enabledText: enabled ? "上架中" : "已下架"
    });
  },

  toggleSoldOut() {
    const soldOut = !this.data.form.soldOut;
    this.setData({
      "form.soldOut": soldOut,
      soldOutText: soldOut ? "售罄" : "可售"
    });
  },

  async chooseDishImage() {
    try {
      const tempFilePath = await chooseOneImage();
      wx.navigateTo({
        url: `/pages/image-cropper/image-cropper?target=dish&ratio=1:1&src=${encodeURIComponent(tempFilePath)}`
      });
    } catch (error) {
      wx.showToast({ title: error.message || "图片处理失败", icon: "none" });
    }
  },

  async onImageCropped(event) {
    const tempFilePath = event.tempFilePath;
    this.setData({ "form.imageUrl": tempFilePath });
    if (!USE_MOCK && wx.cloud && wx.cloud.uploadFile) {
      try {
        const cloudPath = `dishes/${this.data.form._id || Date.now()}.jpg`;
        const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: tempFilePath });
        this.setData({ "form.imageFileId": uploadRes.fileID });
      } catch (error) {
        wx.showToast({ title: "云上传失败，已本地预览", icon: "none" });
      }
    }
  },

  async save() {
    if (!this.data.form.name || !this.data.form.price) {
      wx.showToast({ title: "请填写菜名和价格", icon: "none" });
      return;
    }
    if (this.data.saving) return;
    this.setData({ saving: true });
    try {
      await api.saveDish({
        ...this.data.form,
        price: Number(this.data.form.price),
        specs: String(this.data.form.specs || "").split(/[、/,，\s]+/).filter(Boolean)
      });
      wx.showToast({ title: "已保存", icon: "success" });
      setTimeout(() => wx.navigateBack(), 250);
    } catch (error) {
      wx.showToast({ title: error.message || "保存失败", icon: "none" });
    } finally {
      this.setData({ saving: false });
    }
  }
});
