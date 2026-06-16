Component({
  properties: {
    icon: { type: String, value: "空" },
    title: { type: String, value: "暂无内容" },
    desc: { type: String, value: "" },
    buttonText: { type: String, value: "" }
  },

  methods: {
    onAction() {
      this.triggerEvent("action");
    }
  }
});
