const { ENV_ID } = require("./utils/config");

function tableNoFromScene(scene) {
  try {
    const value = decodeURIComponent(scene || "").replace(/^table_/, "");
    return value ? value.padStart(2, "0") : "";
  } catch (error) {
    return "";
  }
}

App({
  globalData: {
    tableNo: "03",
    staff: null
  },

  onLaunch(options) {
    if (wx.cloud) {
      wx.cloud.init({
        env: ENV_ID,
        traceUser: true
      });
    }

    const scene = options && options.query && options.query.scene;
    const tableNo = tableNoFromScene(scene);
    if (tableNo) this.globalData.tableNo = tableNo;
  }
});
