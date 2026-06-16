Component({
  properties: {
    options: { type: Array, value: [] },
    value: { type: String, value: "" }
  },

  data: {
    optionItems: []
  },

  observers: {
    "options,value"(options, value) {
      const safeOptions = Array.isArray(options) ? options : [];
      this.setData({
        optionItems: safeOptions.map((label) => ({
          label,
          activeClass: label === value ? "active" : ""
        }))
      });
    }
  },

  methods: {
    onSelect(event) {
      const value = event.currentTarget.dataset.value;
      this.triggerEvent("change", { value });
    }
  }
});
