const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  id: {
    type: String,
    required: [true, 'Plan ID is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Plan price is required'],
    min: 0
  },
  credits: {
    type: Number,
    required: [true, 'Credits amount is required'],
    min: 0
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  features: {
    type: Array,
    required: false,
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
planSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a model from the schema
const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;