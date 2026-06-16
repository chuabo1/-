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

function getBrandHeadStyle(extraTop = 12) {
  return `padding-top: ${getCapsuleBottom() + extraTop}px;`;
}

module.exports = {
  getCapsuleBottom,
  getBrandHeadStyle
};
