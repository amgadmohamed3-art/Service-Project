const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'content_admin', 'moderator'],
    default: 'content_admin'
  },
  permissions: [{
    type: String,
    enum: [
      'content_create',
      'content_read',
      'content_update',
      'content_delete',
      'content_publish',
      'user_manage',
      'admin_manage',
      'analytics_view',
      'system_config'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
AdminSchema.index({ email: 1 }, { unique: true });
AdminSchema.index({ isActive: 1 });
AdminSchema.index({ role: 1 });

// Pre-save middleware to hash password
AdminSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update updatedAt
AdminSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check password validity
AdminSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to update last login
AdminSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Method to get user info without sensitive data
AdminSchema.methods.toSafeObject = function() {
  const adminObject = this.toObject();
  delete adminObject.password;
  return adminObject;
};

// Static method to find admin by email with password
AdminSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email, isActive: true }).select('+password');
};

// Role-based default permissions
AdminSchema.pre('save', function(next) {
  if (this.isNew && !this.permissions.length) {
    switch (this.role) {
      case 'super_admin':
        this.permissions = [
          'content_create', 'content_read', 'content_update',
          'content_delete', 'content_publish', 'user_manage',
          'admin_manage', 'analytics_view', 'system_config'
        ];
        break;
      case 'content_admin':
        this.permissions = [
          'content_create', 'content_read', 'content_update',
          'content_delete', 'content_publish', 'analytics_view'
        ];
        break;
      case 'moderator':
        this.permissions = ['content_read', 'content_update'];
        break;
    }
  }
  next();
};

module.exports = mongoose.model('Admin', AdminSchema);