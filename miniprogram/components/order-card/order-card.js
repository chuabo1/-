const { orderTime } = require("../../utils/format");

function buildItems(order) {
  return (order.items || []).map((item, index) => ({
    ...item,
    key: `${item.dishId || item.name || "item"}-${item.spec || ""}-${index}`,
    displayName: item.spec ? `${item.name} · ${item.spec}` : item.name
  }));
}

Component({
  properties: {
    order: { type: Object, value: {} }
  },

  data: {
    statusText: "新订单",
    statusClass: "pending",
    tableNo: "",
    totalAmount: 0,
    orderSections: []
  },

  observers: {
    order(order) {
      const statusMap = {
        pending: "新订单",
        confirmed: "待完成",
        completed: "已完成"
      };
      const orders = Array.isArray(order.orders) && order.orders.length ? order.orders : [order];
      const status = order.status || (orders[0] && orders[0].status) || "pending";
      const orderSections = orders.map((item, index) => {
        const orderItems = buildItems(item);
        const itemCount = orderItems.reduce((sum, dish) => sum + Number(dish.quantity || 0), 0);
        const label = orders.length > 1
          ? `${index === 0 ? "最新加菜" : `第${orders.length - index}次点单`} · ${orderTime(item.createdAt)}`
          : `${itemCount || item.itemCount || 0}份 · ${orderTime(item.createdAt)}`;
        return {
          key: item._id || item.orderNo || String(index),
          order: item,
          metaText: `${label} · ${item.orderNo}`,
          remark: item.remark || "",
          items: orderItems,
          totalAmount: Number(item.totalAmount || 0),
          showConfirm: item.status === "pending",
          showComplete: item.status !== "completed",
          hasActions: item.status !== "completed"
        };
      });
      this.setData({
        statusText: statusMap[status] || "新订单",
        statusClass: status,
        tableNo: order.tableNo || (orders[0] && orders[0].tableNo) || "",
        totalAmount: Number(order.totalAmount || orderSections.reduce((sum, item) => sum + item.totalAmount, 0)),
        orderSections
      });
    }
  },

  methods: {
    onConfirm(event) {
      const section = this.data.orderSections[Number(event.currentTarget.dataset.index)];
      if (!section) return;
      this.triggerEvent("confirm", { order: section.order });
    },

    onComplete(event) {
      const section = this.data.orderSections[Number(event.currentTarget.dataset.index)];
      if (!section) return;
      this.triggerEvent("complete", { order: section.order });
    }
  }
});
