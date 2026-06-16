function chooseOneImage() {
  return new Promise((resolve, reject) => {
    const success = (res) => {
      const tempFilePath = res.tempFilePath
        || (res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath)
        || (res.tempFilePaths && res.tempFilePaths[0])
        || "";
      if (tempFilePath) {
        resolve(tempFilePath);
      } else {
        reject(new Error("未选择图片"));
      }
    };
    const fail = () => reject(new Error("未选择图片"));

    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["album", "camera"],
        success,
        fail
      });
      return;
    }

    if (wx.chooseImage) {
      wx.chooseImage({
        count: 1,
        sourceType: ["album", "camera"],
        success,
        fail
      });
      return;
    }

    reject(new Error("当前基础库不支持选择图片"));
  });
}

function cropImage(src, cropScale) {
  return new Promise((resolve, reject) => {
    if (!wx.cropImage) {
      reject(new Error("当前基础库不支持图片裁剪"));
      return;
    }
    wx.cropImage({
      src,
      cropScale,
      success: (res) => resolve(res.tempFilePath || src),
      fail: () => reject(new Error("未完成图片裁剪"))
    });
  });
}

module.exports = {
  chooseOneImage,
  cropImage
};
