const mongoose = require('mongoose');

const FollowSchema = new mongoose.Schema({
  followerName: { type: String, required: true, index: true },
  followingName: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

FollowSchema.index({ followerName: 1, followingName: 1 }, { unique: true });

module.exports = mongoose.model('Follow', FollowSchema);
