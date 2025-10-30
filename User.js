import mongoose from 'mongoose';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  // profile
  avatarUrl: { type: String },
  bio: { type: String },
  lastSeenAt: { type: Date },
  // password reset
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  // subscriptions and bookmarks
  subscribedTopicIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
  bookmarkedTopicIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }]
}, { timestamps: true });

// Метод для генерации токена верификации
userSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = token;
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 часа
  return token;
};

// Метод для проверки токена верификации
userSchema.methods.verifyEmail = function(token) {
  if (this.emailVerificationToken === token && 
      this.emailVerificationExpires > Date.now()) {
    this.isEmailVerified = true;
    this.emailVerificationToken = undefined;
    this.emailVerificationExpires = undefined;
    return true;
  }
  return false;
};

export default mongoose.model('User', userSchema);
