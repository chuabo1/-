const { getBrandHeadStyle } = require("../../utils/layout");

function parseRatio(value) {
  if (value === "16:9") return { width: 16, height: 9, text: "16:9 横图" };
  return { width: 1, height: 1, text: "1:1 方图" };
}

Page({
  data: {
    brandHeadStyle: "",
    src: "",
    target: "",
    ratioText: "",
    stageHeight: 420,
    cropX: 24,
    cropY: 80,
    cropWidth: 320,
    cropHeight: 180,
    cropRight: 344,
    cropBottom: 260,
    imageX: 0,
    imageY: 0,
    sourceWidth: 1,
    sourceHeight: 1,
    displayWidth: 1,
    displayHeight: 1,
    baseDisplayWidth: 1,
    baseDisplayHeight: 1,
    zoomValue: 100,
    outputWidth: 1280,
    outputHeight: 720,
    touchStartX: 0,
    touchStartY: 0,
    startImageX: 0,
    startImageY: 0,
    saving: false
  },

  async onLoad(options) {
    const ratio = parseRatio(options.ratio);
    const src = decodeURIComponent(options.src || "");
    const system = wx.getSystemInfoSync();
    const screenWidth = system.windowWidth;
    const stageHeight = Math.round(system.windowHeight * 0.62);
    const cropWidth = Math.round(screenWidth - (ratio.width === 16 ? 32 : 72));
    const cropHeight = Math.round(cropWidth * ratio.height / ratio.width);
    const cropX = Math.round((screenWidth - cropWidth) / 2);
    const cropY = Math.round((stageHeight - cropHeight) / 2);
    const outputWidth = ratio.width === 16 ? 1280 : 800;
    const outputHeight = ratio.width === 16 ? 720 : 800;

    this.setData({
      brandHeadStyle: getBrandHeadStyle(),
      src,
      target: options.target || "",
      ratioText: ratio.text,
      stageHeight,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      cropRight: cropX + cropWidth,
      cropBottom: cropY + cropHeight,
      outputWidth,
      outputHeight
    });

    wx.getImageInfo({
      src,
      success: (info) => this.initImage(info.width, info.height),
      fail: () => wx.showToast({ title: "图片读取失败", icon: "none" })
    });
  },

  initImage(sourceWidth, sourceHeight) {
    const scale = Math.max(this.data.cropWidth / sourceWidth, this.data.cropHeight / sourceHeight);
    const displayWidth = Math.ceil(sourceWidth * scale);
    const displayHeight = Math.ceil(sourceHeight * scale);
    this.setData({
      sourceWidth,
      sourceHeight,
      baseDisplayWidth: displayWidth,
      baseDisplayHeight: displayHeight,
      displayWidth,
      displayHeight,
      imageX: Math.round(this.data.cropX + (this.data.cropWidth - displayWidth) / 2),
      imageY: Math.round(this.data.cropY + (this.data.cropHeight - displayHeight) / 2)
    });
  },

  clampPosition(x, y, displayWidth = this.data.displayWidth, displayHeight = this.data.displayHeight) {
    const minX = this.data.cropX + this.data.cropWidth - displayWidth;
    const maxX = this.data.cropX;
    const minY = this.data.cropY + this.data.cropHeight - displayHeight;
    const maxY = this.data.cropY;
    return {
      x: Math.min(maxX, Math.max(minX, x)),
      y: Math.min(maxY, Math.max(minY, y))
    };
  },

  onTouchStart(event) {
    const touch = event.touches && event.touches[0];
    if (!touch) return;
    this.setData({
      touchStartX: touch.clientX,
      touchStartY: touch.clientY,
      startImageX: this.data.imageX,
      startImageY: this.data.imageY
    });
  },

  onTouchMove(event) {
    const touch = event.touches && event.touches[0];
    if (!touch) return;
    const next = this.clampPosition(
      this.data.startImageX + touch.clientX - this.data.touchStartX,
      this.data.startImageY + touch.clientY - this.data.touchStartY
    );
    this.setData({
      imageX: next.x,
      imageY: next.y
    });
  },

  onZoom(event) {
    const zoom = Number(event.detail.value || 100);
    const oldCenterX = this.data.imageX + this.data.displayWidth / 2;
    const oldCenterY = this.data.imageY + this.data.displayHeight / 2;
    const displayWidth = Math.ceil(this.data.baseDisplayWidth * zoom / 100);
    const displayHeight = Math.ceil(this.data.baseDisplayHeight * zoom / 100);
    const next = this.clampPosition(
      Math.round(oldCenterX - displayWidth / 2),
      Math.round(oldCenterY - displayHeight / 2),
      displayWidth,
      displayHeight
    );
    this.setData({
      zoomValue: zoom,
      displayWidth,
      displayHeight,
      imageX: next.x,
      imageY: next.y
    });
  },

  cancel() {
    wx.navigateBack();
  },

  confirm() {
    if (this.data.saving) return;
    const sx = (this.data.cropX - this.data.imageX) / this.data.displayWidth * this.data.sourceWidth;
    const sy = (this.data.cropY - this.data.imageY) / this.data.displayHeight * this.data.sourceHeight;
    const sw = this.data.cropWidth / this.data.displayWidth * this.data.sourceWidth;
    const sh = this.data.cropHeight / this.data.displayHeight * this.data.sourceHeight;
    if (sx < 0 || sy < 0 || sx + sw > this.data.sourceWidth || sy + sh > this.data.sourceHeight) {
      wx.showToast({ title: "请让裁剪框完全覆盖图片", icon: "none" });
      return;
    }

    this.setData({ saving: true });
    const ctx = wx.createCanvasContext("cropCanvas", this);
    ctx.drawImage(this.data.src, sx, sy, sw, sh, 0, 0, this.data.outputWidth, this.data.outputHeight);
    ctx.draw(false, () => {
      wx.canvasToTempFilePath({
        canvasId: "cropCanvas",
        width: this.data.outputWidth,
        height: this.data.outputHeight,
        destWidth: this.data.outputWidth,
        destHeight: this.data.outputHeight,
        success: (res) => this.finish(res.tempFilePath),
        fail: () => {
          this.setData({ saving: false });
          wx.showToast({ title: "裁剪生成失败", icon: "none" });
        }
      }, this);
    });
  },

  finish(tempFilePath) {
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage && prevPage.onImageCropped) {
      prevPage.onImageCropped({
        target: this.data.target,
        tempFilePath
      });
    }
    wx.navigateBack();
  }
});
