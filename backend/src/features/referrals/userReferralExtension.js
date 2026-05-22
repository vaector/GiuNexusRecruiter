const User = require("../user/User");

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

User.schema.pre("save", async function () {
  if (!this.isNew) return;

  if (!this.referralCode) {
    let code;
    let exists = true;
    let attempts = 0;
    while (exists && attempts < 10) {
      code = generateCode();
      exists = await User.findOne({ referralCode: code });
      attempts++;
    }
    if (attempts === 10) throw new Error('Could not generate unique referral code');
    this.referralCode = code;
  }

  if (!this.userCode) {
    let code;
    let exists = true;
    let attempts = 0;
    while (exists && attempts < 10) {
      code = generateCode();
      exists = await User.findOne({ userCode: code });
      attempts++;
    }
    if (attempts === 10) throw new Error('Could not generate unique user code');
    this.userCode = code;
  }
});