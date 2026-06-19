function getCapsuleBottom() {
  try {
    const capsule = wx.getMenuButtonBoundingClientRect && wx.getMenuButtonBoundingClientRect();
    if (capsule && capsule.bottom) return capsule.bottom;
  } catch (error) {
    // Fall back to status bar height below.
  }

  try {
    const system = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
    return (system.statusBarHeight || 24) + 40;
  } catch (error) {
    return 64;
  }
}

function getCapsuleTop() {
  try {
    const capsule = wx.getMenuButtonBoundingClientRect && wx.getMenuButtonBoundingClientRect();
    if (capsule && capsule.top) return capsule.top;
  } catch (error) {
    // Fall back to status bar height below.
  }

  try {
    const system = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
    return (system.statusBarHeight || 24) + 6;
  } catch (error) {
    return 36;
  }
}

function getBrandHeadStyle(extraTop = 0) {
  return `padding-top: ${getCapsuleTop() + extraTop}px;`;
}

module.exports = {
  getCapsuleBottom,
  getCapsuleTop,
  getBrandHeadStyle
};
