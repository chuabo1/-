Component({
  options: {
    styleIsolation: "apply-shared"
  },

  properties: {
    dish: { type: Object, value: {} },
    quantity: { type: Number, value: 0 }
  },

  data: {
    hasSpec: false,
    shortName: "",
    imageClass: "image-egg",
    showSpecButton: false,
    showStepper: false
  },

  observers: {
    "dish,quantity"(dish, quantity) {
      const name = dish && dish.name ? dish.name : "";
      const imageKey = dish && dish.imageKey ? dish.imageKey : "egg";
      const hasSpec = !!(dish && dish.specs && dish.specs.length);
      this.setData({
        hasSpec,
        shortName: name.replace(/[0-9个串份起]/g, "").slice(0, 3) || name.slice(0, 3),
        imageClass: `image-${imageKey}`,
        showSpecButton: hasSpec && quantity === 0,
        showStepper: quantity > 0
      });
    }
  },

  methods: {
    onAdd() {
      this.triggerEvent("add", { dish: this.data.dish });
    },

    onSpec() {
      this.triggerEvent("spec", { dish: this.data.dish });
    },

    onQuantityChange(event) {
      this.triggerEvent("quantitychange", {
        dish: this.data.dish,
        value: event.detail.value
      });
    }
  }
});
