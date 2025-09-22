const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  image: { type: String, default: '' },
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