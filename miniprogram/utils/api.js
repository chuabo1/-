const { USE_MOCK } = require("./config");
const mock = require("../data/mock");

async function call(action, data = {}) {
  if (USE_MOCK || !wx.cloud) {
    switch (action) {
      case "getMenu":
        return mock.getMenu(data);
      case "initSeedData":
        return mock.initSeedData(data);
      case "getTables":
        return mock.getTables(data);
      case "createOrder":
        return mock.createOrder(data);
      case "getOrder":
        return mock.getOrder(data);
      case "validateCart":
        return mock.validateCart(data);
      case "listOrders":
        return mock.listOrders(data);
      case "updateOrderStatus":
        return mock.updateOrderStatus(data.orderId, data.status);
      case "updateStoreConfig":
        return mock.updateStoreConfig(data);
      case "staffLogin":
        return mock.staffLogin(data);
      case "saveCategory":
        return mock.saveCategory(data);
      case "deleteCategory":
        return mock.deleteCategory(data);
      case "saveDish":
        return mock.saveDish(data);
      case "deleteDish":
        return mock.deleteDish(data);
      case "updateDishStatus":
        return mock.updateDishStatus(data);
      case "generateTableQr":
        return mock.generateTableQr(data);
      default:
        throw new Error(`未知接口：${action}`);
    }
  }

  const res = await wx.cloud.callFunction({
    name: "wanwanApi",
    data: {
      action,
      data
    }
  });

  if (!res.result || res.result.ok !== true) {
    throw new Error((res.result && res.result.message) || "服务异常");
  }

  return res.result.data;
}

module.exports = {
  getMenu: (data) => call("getMenu", data),
  initSeedData: (data) => call("initSeedData", data),
  getTables: (data) => call("getTables", data),
  createOrder: (data) => call("createOrder", data),
  getOrder: (data) => call("getOrder", data),
  validateCart: (data) => call("validateCart", data),
  listOrders: (data) => call("listOrders", data),
  updateOrderStatus: (data) => call("updateOrderStatus", data),
  updateStoreConfig: (data) => call("updateStoreConfig", data),
  staffLogin: (data) => call("staffLogin", data),
  saveCategory: (data) => call("saveCategory", data),
  deleteCategory: (data) => call("deleteCategory", data),
  saveDish: (data) => call("saveDish", data),
  deleteDish: (data) => call("deleteDish", data),
  updateDishStatus: (data) => call("updateDishStatus", data),
  generateTableQr: (data) => call("generateTableQr", data)
};
