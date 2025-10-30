import mongoose from "mongoose";

const TopicSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  content: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  views: { type: Number, default: 0 },
  repliesCount: { type: Number, default: 0 },
  lastCommentAt: { type: Date },
  lastCommentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isLocked: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
}, { timestamps: true });

TopicSchema.index({ createdAt: -1 });
TopicSchema.index({ updatedAt: -1 });

export default mongoose.model("Topic", TopicSchema);
