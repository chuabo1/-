Component({
  options: {
    styleIsolation: "apply-shared"
  },

  properties: {
    item: { type: Object, value: {} },
    showQuantity: { type: Boolean, value: false },
    border: { type: Boolean, value: false },
    variant: { type: String, value: "" }
  },

  data: {
    shortName: "",
    displayName: "",
    displaySpec: "",
    specVisible: false,
    displayPrice: 0,
    displayQuantity: 0,
    imageClass: "image-egg",
    borderClass: "",
    quantityClass: "",
    variantClass: ""
  },

  observers: {
    "item,border,showQuantity,variant"(item, border, showQuantity, variant) {
      const name = item && item.name ? item.name : "";
      const imageKey = item && item.imageKey ? item.imageKey : "egg";
      const isCart = variant === "cart";
      const spec = item && item.spec ? item.spec : "";
      const price = isCart
        ? Number(item && item.price ? item.price : 0)
        : Number(item && (item.subtotal || item.price) ? (item.subtotal || item.price) : 0);
      const quantity = Number(item && item.quantity ? item.quantity : 0);
      this.setData({
        shortName: name.replace(/[0-9个串份起]/g, "").slice(0, 3) || name.slice(0, 3),
        displayName: isCart ? name : (item && item.displayName ? item.displayName : name),
        displaySpec: spec,
        specVisible: isCart && !!spec,
        displayPrice: price,
        displayQuantity: quantity,
        imageClass: `image-${imageKey}`,
        borderClass: border ? "with-border" : "",
        quantityClass: showQuantity ? "with-quantity" : "",
        variantClass: isCart ? "cart-summary" : ""
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
