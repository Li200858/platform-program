const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  image: { type: String, default: '' },
  media: { type: [String], default: [] },
  author: { type: String, required: true },
  authorName: { type: String, default: '' },
  authorClass: { type: String, default: '' },
  authorAvatar: { type: String, default: '' },
  likes: { type: Number, default: 0 },
  likedUsers: { type: [String], default: [] },
  favorites: { type: [String], default: [] },
  views: { type: Number, default: 0 },
  comments: [{
    id: String,
    author: String,
    authorClass: String,
    authorAvatar: String,
    content: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', ActivitySchema);
