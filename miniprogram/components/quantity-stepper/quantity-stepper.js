Component({
  properties: {
    value: { type: Number, value: 0 },
    min: { type: Number, value: 0 },
    disabled: { type: Boolean, value: false }
  },

  data: {
    minusDisabled: false
  },

  observers: {
    "value,min,disabled"() {
      this.setData({
        minusDisabled: this.data.disabled || this.data.value <= this.data.min
      });
    }
  },

  lifetimes: {
    attached() {
      this.setData({
        minusDisabled: this.data.disabled || this.data.value <= this.data.min
      });
    }
  },

  methods: {
    onMinus() {
      if (this.data.disabled || this.data.value <= this.data.min) return;
      this.triggerEvent("change", { value: this.data.value - 1 });
    },

    onPlus() {
      if (this.data.disabled) return;
      this.triggerEvent("change", { value: this.data.value + 1 });
    }
  }
});
