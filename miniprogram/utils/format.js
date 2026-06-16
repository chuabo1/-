function money(value) {
  return `¥${Number(value || 0)}`;
}

function orderTime(timestamp) {
  const date = timestamp ? new Date(timestamp) : new Date();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

function sumCart(cart) {
  return Object.keys(cart).reduce((sum, key) => {
    const item = cart[key];
    return sum + item.price * item.quantity;
  }, 0);
}

function cartCount(cart) {
  return Object.keys(cart).reduce((sum, key) => sum + cart[key].quantity, 0);
}

module.exports = {
  money,
  orderTime,
  sumCart,
  cartCount
};
