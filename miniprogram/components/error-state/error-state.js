Component({
  options: {
    styleIsolation: "apply-shared"
  },

  properties: {
    title: { type: String, value: "加载失败" },
    desc: { type: String, value: "网络不稳定，请稍后重试" },
    buttonText: { type: String, value: "重试" }
  },

  methods: {
    onRetry() {
      this.triggerEvent("retry");
    }
  }
});
