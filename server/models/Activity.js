const mongoose = require('mongoose');

const StageSchema = new mongoose.Schema({
  key: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  startAt: { type: Date, required: true },
  endAt: { type: Date },
  isSystemDefault: { type: Boolean, default: false },
  allowEdit: { type: Boolean, default: true },
}, { _id: false });

const ActivitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, default: Date.now },
  image: { type: String, default: '' },
  media: [{ type: String }],
  stages: { type: [StageSchema], default: [] },
  author: { type: String, required: true },
  authorName: { type: String, required: true },
  authorClass: { type: String, required: true },
  authorAvatar: { type: String, default: '' },
  likes: { type: Number, default: 0 },
  likedUsers: [String],
  favorites: [String],
  comments: [{
    id: { type: String, required: true },
    author: { type: String, required: true },
    authorClass: { type: String, required: true },
    authorAvatar: { type: String, default: '' },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', ActivitySchema);