const router = require('express').Router();
const Admin = require('../models/Admin');
const Content = require('../models/Content');
const omdbService = require('../services/omdbService');
const genreService = require('../services/genreService');
const {
  generateAdminToken,
  authenticateAdmin,
  requirePermission,
  requireRole,
  requireSuperAdmin,
  requireAnyPermission
} = require('../middleware/adminAuth');

// Helper function to build content filter query
const buildContentFilter = (filters) => {
  const query = {};

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.status) {
    query.status = filters.status;
  } else {
    query.status = { $ne: 'archived' }; // Exclude archived by default
  }

  if (filters.genre) {
    const normalizedGenres = genreService.normalizeGenres([filters.genre]);
    if (normalizedGenres.length > 0) {
      query.genres = normalizedGenres[0];
    }
  }

  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
      { director: { $regex: filters.search, $options: 'i' } },
      { actors: { $regex: filters.search, $options: 'i' } }
    ];
  }

  if (filters.year) {
    if (filters.year.includes('-')) {
      const [startYear, endYear] = filters.year.split('-').map(Number);
      query.year = { $gte: startYear, $lte: endYear };
    } else {
      query.year = parseInt(filters.year);
    }
  }

  if (filters.isAdminCreated !== undefined) {
    query.isAdminCreated = filters.isAdminCreated === 'true';
  }

  if (filters.isFeatured !== undefined) {
    query.isFeatured = filters.isFeatured === 'true';
  }

  return query;
};

// Helper function to build sort options
const buildSortOptions = (sortBy, sortOrder = 'desc') => {
  const sortMapping = {
    'createdAt': 'createdAt',
    'updatedAt': 'updatedAt',
    'title': 'title',
    'year': 'year',
    'rating': 'averageUserRating',
    'views': 'viewCount',
    'reviews': 'totalReviews'
  };

  const sortField = sortMapping[sortBy] || 'createdAt';
  return { [sortField]: sortOrder === 'asc' ? 1 : -1 };
};

// === Admin Authentication Routes ===

/**
 * POST /api/admin/auth/register
 * Register new admin (super_admin only)
 */
router.post('/auth/register', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { email, password, name, role = 'content_admin', permissions } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        error: 'Admin with this email already exists'
      });
    }

    // Create new admin
    const adminData = {
      email,
      password,
      name,
      role,
      permissions: permissions || [] // Will use default permissions based on role
    };

    const admin = new Admin(adminData);
    await admin.save();

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: admin.toSafeObject()
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register admin'
    });
  }
});

/**
 * POST /api/admin/auth/login
 * Admin login
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find admin with password
    const admin = await Admin.findByEmailWithPassword(email);

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Update last login
    await admin.updateLastLogin();

    // Generate token
    const token = generateAdminToken(admin);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: admin.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login'
    });
  }
});

/**
 * GET /api/admin/auth/profile
 * Get admin profile
 */
router.get('/auth/profile', authenticateAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.admin.toSafeObject()
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get admin profile'
    });
  }
});

/**
 * PUT /api/admin/auth/profile
 * Update admin profile
 */
router.put('/auth/profile', authenticateAdmin, async (req, res) => {
  try {
    const { name, email } = req.body;
    const admin = req.admin;

    // Check if email is being changed and if it's already taken
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email, _id: { $ne: admin._id } });
      if (existingAdmin) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists'
        });
      }
      admin.email = email.toLowerCase();
    }

    if (name) {
      admin.name = name;
    }

    await admin.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: admin.toSafeObject()
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update admin profile'
    });
  }
});

/**
 * POST /api/admin/auth/change-password
 * Change admin password
 */
router.post('/auth/change-password', authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = req.admin;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// === Content Management Routes ===

/**
 * GET /api/admin/contents
 * List all content with pagination and filtering
 */
router.get('/contents', authenticateAdmin, requirePermission('content_read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      genre,
      status,
      search,
      year,
      isAdminCreated,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const query = buildContentFilter({
      type,
      genre,
      status,
      search,
      year,
      isAdminCreated,
      isFeatured
    });
    const sort = buildSortOptions(sortBy, sortOrder);

    const [contents, total] = await Promise.all([
      Content.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('seriesId', 'title')
        .lean(),
      Content.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        contents,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        },
        filters: { type, genre, status, search, year, isAdminCreated, isFeatured, sortBy, sortOrder }
      }
    });
  } catch (error) {
    console.error('Get admin contents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contents'
    });
  }
});

/**
 * GET /api/admin/contents/:id
 * Get detailed content information
 */
router.get('/contents/:id', authenticateAdmin, requirePermission('content_read'), async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by _id first, then by imdbID
    let content = await Content.findById(id).populate('seriesId');

    if (!content) {
      content = await Content.findOne({ imdbID: id }).populate('seriesId');
    }

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get content details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content details'
    });
  }
});

/**
 * POST /api/admin/contents
 * Create new content entry (manual admin upload)
 */
router.post('/contents', authenticateAdmin, requirePermission('content_create'), async (req, res) => {
  try {
    const contentData = { ...req.body };

    // Set admin-specific fields
    contentData.isAdminCreated = true;
    contentData.status = contentData.status || 'active';

    // Validate and normalize genres
    if (contentData.genres && Array.isArray(contentData.genres)) {
      const genreValidation = genreService.validateGenres(contentData.genres);
      contentData.genres = genreValidation.valid;

      if (genreValidation.invalid.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid genres: ${genreValidation.invalid.join(', ')}`,
          invalidGenres: genreValidation.invalid
        });
      }
    }

    // Validate required fields
    if (!contentData.title || !contentData.description || !contentData.year) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, and year are required'
      });
    }

    const content = new Content(contentData);
    await content.save();

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: content
    });
  } catch (error) {
    console.error('Create content error:', error);

    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `Content with this ${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create content'
    });
  }
});

/**
 * PUT /api/admin/contents/:id
 * Update existing content
 */
router.put('/contents/:id', authenticateAdmin, requirePermission('content_update'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find content
    let content = await Content.findById(id);

    if (!content) {
      content = await Content.findOne({ imdbID: id });
    }

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    // Validate and normalize genres if provided
    if (updateData.genres && Array.isArray(updateData.genres)) {
      const genreValidation = genreService.validateGenres(updateData.genres);
      updateData.genres = genreValidation.valid;

      if (genreValidation.invalid.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid genres: ${genreValidation.invalid.join(', ')}`,
          invalidGenres: genreValidation.invalid
        });
      }
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== '__v' && key !== 'createdAt') {
        content[key] = updateData[key];
      }
    });

    content.updatedAt = new Date();
    await content.save();

    res.json({
      success: true,
      message: 'Content updated successfully',
      data: content
    });
  } catch (error) {
    console.error('Update content error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `Content with this ${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update content'
    });
  }
});

/**
 * DELETE /api/admin/contents/:id
 * Soft delete content (set status: 'archived')
 */
router.delete('/contents/:id', authenticateAdmin, requirePermission('content_delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const { force = false } = req.query;

    // Find content
    let content = await Content.findById(id);

    if (!content) {
      content = await Content.findOne({ imdbID: id });
    }

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    if (force === 'true') {
      // Hard delete
      await Content.findByIdAndDelete(content._id);
      return res.json({
        success: true,
        message: 'Content permanently deleted'
      });
    } else {
      // Soft delete
      content.status = 'archived';
      content.updatedAt = new Date();
      await content.save();

      res.json({
        success: true,
        message: 'Content archived successfully'
      });
    }
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete content'
    });
  }
});

/**
 * POST /api/admin/contents/import/omdb
 * Import movie/series from OMDb by imdbID
 */
router.post('/contents/import/omdb', authenticateAdmin, requirePermission('content_create'), async (req, res) => {
  try {
    const { imdbID, options = {} } = req.body;

    if (!imdbID) {
      return res.status(400).json({
        success: false,
        error: 'IMDB ID is required'
      });
    }

    const content = await omdbService.importMovie(imdbID, options);

    res.status(201).json({
      success: true,
      message: 'Content imported successfully from OMDb',
      data: content
    });
  } catch (error) {
    console.error('Import from OMDb error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to import content from OMDb'
    });
  }
});

/**
 * POST /api/admin/contents/sync/:id
 * Sync existing content with latest OMDb data
 */
router.post('/contents/sync/:id', authenticateAdmin, requirePermission('content_update'), async (req, res) => {
  try {
    const { id } = req.params;

    // Find content by imdbID
    const content = await Content.findOne({ imdbID: id });

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found or not imported from OMDb'
      });
    }

    const syncedContent = await omdbService.syncMovie(id);

    res.json({
      success: true,
      message: 'Content synced successfully with OMDb',
      data: syncedContent
    });
  } catch (error) {
    console.error('Sync content error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync content with OMDb'
    });
  }
});

/**
 * POST /api/admin/contents/batch-import
 * Import multiple movies from CSV or imdbID list
 */
router.post('/contents/batch-import', authenticateAdmin, requirePermission('content_create'), async (req, res) => {
  try {
    const { imdbIDs, options = {} } = req.body;

    if (!imdbIDs || !Array.isArray(imdbIDs) || imdbIDs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'IMDB IDs array is required'
      });
    }

    const results = await omdbService.importBatchMovies(imdbIDs, options);

    res.json({
      success: true,
      message: 'Batch import completed',
      data: results
    });
  } catch (error) {
    console.error('Batch import error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform batch import'
    });
  }
});

/**
 * GET /api/admin/contents/genres
 * List all available genres with counts
 */
router.get('/contents/genres', authenticateAdmin, requirePermission('content_read'), async (req, res) => {
  try {
    const genreStats = await genreService.getGenreStats();

    res.json({
      success: true,
      data: genreStats
    });
  } catch (error) {
    console.error('Get genre stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch genre statistics'
    });
  }
});

/**
 * GET /api/admin/contents/statistics
 * Get content statistics for admin dashboard
 */
router.get('/contents/statistics', authenticateAdmin, requirePermission('content_read'), async (req, res) => {
  try {
    const [
      totalContents,
      totalMovies,
      totalSeries,
      totalEpisodes,
      adminCreatedContent,
      featuredContent,
      activeContent,
      archivedContent,
      contentByType,
      contentByYear,
      topRatedContent,
      mostViewedContent
    ] = await Promise.all([
      Content.countDocuments(),
      Content.countDocuments({ type: 'movie' }),
      Content.countDocuments({ type: 'series' }),
      Content.countDocuments({ type: 'episode' }),
      Content.countDocuments({ isAdminCreated: true }),
      Content.countDocuments({ isFeatured: true }),
      Content.countDocuments({ status: 'active' }),
      Content.countDocuments({ status: 'archived' }),
      Content.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Content.aggregate([
        { $match: { year: { $gte: 2020 } } },
        { $group: { _id: '$year', count: { $sum: 1 } } },
        { $sort: { '_id': -1 } },
        { $limit: 5 }
      ]),
      Content.find({ status: 'active' })
        .sort({ averageUserRating: -1 })
        .limit(10)
        .select('title averageUserRating year type poster'),
      Content.find({ status: 'active' })
        .sort({ viewCount: -1 })
        .limit(10)
        .select('title viewCount year type poster')
    ]);

    res.json({
      success: true,
      data: {
        totals: {
          all: totalContents,
          movies: totalMovies,
          series: totalSeries,
          episodes: totalEpisodes,
          adminCreated: adminCreatedContent,
          featured: featuredContent,
          active: activeContent,
          archived: archivedContent
        },
        byType: contentByType,
        byYear: contentByYear,
        topRated: topRatedContent,
        mostViewed: mostViewedContent
      }
    });
  } catch (error) {
    console.error('Get content statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content statistics'
    });
  }
});

/**
 * POST /api/admin/contents/bulk-update
 * Bulk update multiple contents
 */
router.post('/contents/bulk-update', authenticateAdmin, requirePermission('content_update'), async (req, res) => {
  try {
    const { contentIds, updates } = req.body;

    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content IDs array is required'
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Update data is required'
      });
    }

    // Prepare update data
    const updateData = { ...updates };
    updateData.updatedAt = new Date();

    // Validate genres if being updated
    if (updateData.genres) {
      const genreValidation = genreService.validateGenres(updateData.genres);
      updateData.genres = genreValidation.valid;

      if (genreValidation.invalid.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid genres: ${genreValidation.invalid.join(', ')}`,
          invalidGenres: genreValidation.invalid
        });
      }
    }

    const result = await Content.updateMany(
      { _id: { $in: contentIds } },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} contents successfully`,
      data: {
        requested: contentIds.length,
        updated: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk update'
    });
  }
});

module.exports = router;