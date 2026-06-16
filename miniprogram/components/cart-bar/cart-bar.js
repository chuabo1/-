Component({
  properties: {
    count: { type: Number, value: 0 },
    total: { type: Number, value: 0 },
    title: { type: String, value: "已点菜品" },
    emptyTitle: { type: String, value: "还没选菜" },
    emptySub: { type: String, value: "先加一份招牌菜" },
    buttonText: { type: String, value: "提交" },
    disabled: { type: Boolean, value: false }
  },

  data: {
    displayTitle: "还没选菜",
    displaySub: "先加一份招牌菜",
    buttonStateClass: ""
  },

  observers: {
    "count,total,title,emptyTitle,emptySub,disabled"() {
      this.updateDisplay();
    }
  },

  lifetimes: {
    attached() {
      this.updateDisplay();
    }
  },

  methods: {
    updateDisplay() {
      const hasItems = this.data.count > 0;
      this.setData({
        displayTitle: hasItems ? this.data.title : this.data.emptyTitle,
        displaySub: hasItems ? `合计 ¥${this.data.total}` : this.data.emptySub,
        buttonStateClass: this.data.disabled ? "disabled" : ""
      });
    },

    onSubmit() {
      if (this.data.disabled && this.data.count > 0) return;
      this.triggerEvent("submit");
    }
  }
});
