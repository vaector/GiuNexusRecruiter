const User = require("../user/User");

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

User.schema.pre("save", async function (next) {
  if (!this.isNew || this.referralCode) return next();

  let code;
  let exists = true;
  while (exists) {
    code = generateCode();
    exists = await User.findOne({ referralCode: code });
  }
  this.referralCode = code;
  next();
});
