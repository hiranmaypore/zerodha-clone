const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 100000 },
  preferences: {
    theme: { type: String, enum: ['system', 'dark', 'light'], default: 'system' },
    hideBalance: { type: Boolean, default: false },
    orderConfirmations: { type: Boolean, default: true },
    riskProfile: { type: String, enum: ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'], default: 'BALANCED' },
    defaultSL: { type: Number, default: null },
    defaultTarget: { type: Number, default: null }
  }
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
