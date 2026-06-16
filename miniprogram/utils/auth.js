function getStaff() {
  const app = getApp();
  const staff = app.globalData.staff || wx.getStorageSync("wanwan_staff");
  if (staff) app.globalData.staff = staff;
  return staff;
}

function requireStaff() {
  const staff = getStaff();
  if (!staff) {
    wx.redirectTo({ url: "/pages/staff-login/staff-login" });
    return null;
  }
  return staff;
}

module.exports = {
  getStaff,
  requireStaff
};
