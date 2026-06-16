Component({
  options: {
    multipleSlots: true
  },

  properties: {
    visible: { type: Boolean, value: false },
    title: { type: String, value: "" },
    height: { type: Number, optionalTypes: [String], value: "" },
    closeText: { type: String, value: "关闭" },
    headerAction: { type: Boolean, value: false },
    footer: { type: Boolean, value: false }
  },

  data: {
    heightStyle: "",
    bodyClass: ""
  },

  observers: {
    "height, visible, footer"(height) {
      if (!height) {
        this.setData({
          heightStyle: "",
          bodyClass: this.data.footer ? "has-footer" : ""
        });
        return;
      }
      this.setData({
        heightStyle: `height: ${height}rpx;`,
        bodyClass: this.data.footer ? "has-footer" : ""
      });
    }
  },

  methods: {
    onClose() {
      this.triggerEvent("close");
    }
  }
});
