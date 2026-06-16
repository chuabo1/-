Component({
  options: {
    styleIsolation: "apply-shared"
  },

  properties: {
    item: { type: Object, value: {} },
    showQuantity: { type: Boolean, value: false },
    border: { type: Boolean, value: false }
  },

  data: {
    shortName: "",
    displayName: "",
    displayPrice: 0,
    displayQuantity: 0,
    imageClass: "image-egg",
    borderClass: "",
    quantityClass: ""
  },

  observers: {
    "item,border,showQuantity"(item, border, showQuantity) {
      const name = item && item.name ? item.name : "";
      const imageKey = item && item.imageKey ? item.imageKey : "egg";
      const price = Number(item && (item.subtotal || item.price) ? (item.subtotal || item.price) : 0);
      const quantity = Number(item && item.quantity ? item.quantity : 0);
      this.setData({
        shortName: name.replace(/[0-9个串份起]/g, "").slice(0, 3) || name.slice(0, 3),
        displayName: item && item.displayName ? item.displayName : name,
        displayPrice: price,
        displayQuantity: quantity,
        imageClass: `image-${imageKey}`,
        borderClass: border ? "with-border" : "",
        quantityClass: showQuantity ? "with-quantity" : ""
      });
    }
  },

  methods: {
    onQuantityChange(event) {
      this.triggerEvent("quantitychange", {
        item: this.data.item,
        value: event.detail.value
      });
    }
  }
});
