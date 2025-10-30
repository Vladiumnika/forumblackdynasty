import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
  isDeleted: { type: Boolean, default: false },
  editedAt: { type: Date },
  likes: { type: Number, default: 0 },
}, { timestamps: true });

CommentSchema.index({ createdAt: -1 });

export default mongoose.model("Comment", CommentSchema);
