const Notice = require('../models/Notice');
const NoticeConfig = require('../models/NoticeConfig');

const NOTICE_SCOPE = 'HOME_NOTICE_BOARD';
const MIN_VISIBLE = 1;
const MAX_VISIBLE = 20;

const isValidDate = (value) => {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime());
};

const sanitizeNoticePayload = (payload = {}) => {
  const title = String(payload.title || '').trim();
  const description = String(payload.description || '').trim();

  const publishAtRaw = payload.publishAt;
  const expiresAtRaw = payload.expiresAt;

  const publishAt = publishAtRaw ? new Date(publishAtRaw) : new Date();
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;

  return {
    title,
    description,
    publishAt,
    expiresAt,
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
    isPinned: payload.isPinned !== undefined ? Boolean(payload.isPinned) : false
  };
};

const validateNoticePayload = ({ title, description, publishAt, expiresAt }) => {
  if (!title || !description) {
    return 'Title and description are required.';
  }

  if (title.length > 140) {
    return 'Title cannot exceed 140 characters.';
  }

  if (description.length > 1500) {
    return 'Description cannot exceed 1500 characters.';
  }

  if (!isValidDate(publishAt)) {
    return 'publishAt must be a valid date.';
  }

  if (expiresAt && !isValidDate(expiresAt)) {
    return 'expiresAt must be a valid date.';
  }

  if (expiresAt && new Date(expiresAt) <= new Date(publishAt)) {
    return 'expiresAt must be later than publishAt.';
  }

  return null;
};

const getOrCreateConfig = async () => {
  let config = await NoticeConfig.findOne({ scope: NOTICE_SCOPE });
  if (!config) {
    config = await NoticeConfig.create({ scope: NOTICE_SCOPE, maxVisible: 3 });
  }
  return config;
};

const toPublicNotice = (notice) => ({
  id: notice._id,
  title: notice.title,
  description: notice.description,
  isPinned: notice.isPinned,
  uploadedAt: notice.createdAt,
  publishAt: notice.publishAt
});

// Public: home-page notices
exports.getPublicNotices = async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    const now = new Date();

    const notices = await Notice.find({
      isActive: true,
      publishAt: { $lte: now },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    })
      .sort({ isPinned: -1, publishAt: -1, createdAt: -1 })
      .limit(config.maxVisible);

    return res.status(200).json({
      success: true,
      data: notices.map(toPublicNotice),
      meta: {
        maxVisible: config.maxVisible,
        fetchedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get public notices error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notices.' });
  }
};

// Admin: list all notices
exports.getAdminNotices = async (req, res) => {
  try {
    const includeInactive = String(req.query.includeInactive || 'true').toLowerCase() !== 'false';
    const query = includeInactive ? {} : { isActive: true };

    const notices = await Notice.find(query)
      .sort({ isPinned: -1, publishAt: -1, createdAt: -1 })
      .limit(200);

    return res.status(200).json({ success: true, data: notices });
  } catch (error) {
    console.error('Get admin notices error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin notices.' });
  }
};

// Admin: create notice
exports.createNotice = async (req, res) => {
  try {
    const payload = sanitizeNoticePayload(req.body);
    const validationError = validateNoticePayload(payload);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const notice = await Notice.create({
      ...payload,
      createdBy: String(req.user?.email || req.user?.id || 'admin')
    });

    return res.status(201).json({ success: true, message: 'Notice created successfully.', data: notice });
  } catch (error) {
    console.error('Create notice error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create notice.' });
  }
};

// Admin: update notice
exports.updateNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;
    const notice = await Notice.findById(noticeId);

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found.' });
    }

    const updates = {};

    if (req.body.title !== undefined) {
      const title = String(req.body.title || '').trim();
      if (!title) {
        return res.status(400).json({ success: false, message: 'Title cannot be empty.' });
      }
      if (title.length > 140) {
        return res.status(400).json({ success: false, message: 'Title cannot exceed 140 characters.' });
      }
      updates.title = title;
    }

    if (req.body.description !== undefined) {
      const description = String(req.body.description || '').trim();
      if (!description) {
        return res.status(400).json({ success: false, message: 'Description cannot be empty.' });
      }
      if (description.length > 1500) {
        return res.status(400).json({ success: false, message: 'Description cannot exceed 1500 characters.' });
      }
      updates.description = description;
    }

    if (req.body.publishAt !== undefined) {
      if (!isValidDate(req.body.publishAt)) {
        return res.status(400).json({ success: false, message: 'publishAt must be a valid date.' });
      }
      updates.publishAt = new Date(req.body.publishAt);
    }

    if (req.body.expiresAt !== undefined) {
      if (req.body.expiresAt === null || req.body.expiresAt === '') {
        updates.expiresAt = null;
      } else if (!isValidDate(req.body.expiresAt)) {
        return res.status(400).json({ success: false, message: 'expiresAt must be a valid date.' });
      } else {
        updates.expiresAt = new Date(req.body.expiresAt);
      }
    }

    if (req.body.isActive !== undefined) {
      updates.isActive = Boolean(req.body.isActive);
    }

    if (req.body.isPinned !== undefined) {
      updates.isPinned = Boolean(req.body.isPinned);
    }

    const effectivePublishAt = updates.publishAt || notice.publishAt;
    const effectiveExpireAt = updates.expiresAt !== undefined ? updates.expiresAt : notice.expiresAt;

    if (effectiveExpireAt && new Date(effectiveExpireAt) <= new Date(effectivePublishAt)) {
      return res.status(400).json({ success: false, message: 'expiresAt must be later than publishAt.' });
    }

    Object.assign(notice, updates);
    await notice.save();

    return res.status(200).json({ success: true, message: 'Notice updated successfully.', data: notice });
  } catch (error) {
    console.error('Update notice error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notice.' });
  }
};

// Admin: delete notice
exports.deleteNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;
    const deleted = await Notice.findByIdAndDelete(noticeId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notice not found.' });
    }

    return res.status(200).json({ success: true, message: 'Notice deleted successfully.' });
  } catch (error) {
    console.error('Delete notice error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete notice.' });
  }
};

// Admin: read config
exports.getNoticeConfig = async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    return res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error('Get notice config error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notice config.' });
  }
};

// Admin: update config
exports.updateNoticeConfig = async (req, res) => {
  try {
    const maxVisible = Number(req.body.maxVisible);

    if (!Number.isInteger(maxVisible) || maxVisible < MIN_VISIBLE || maxVisible > MAX_VISIBLE) {
      return res.status(400).json({
        success: false,
        message: `maxVisible must be an integer between ${MIN_VISIBLE} and ${MAX_VISIBLE}.`
      });
    }

    const config = await getOrCreateConfig();
    config.maxVisible = maxVisible;
    config.updatedBy = String(req.user?.email || req.user?.id || 'admin');
    await config.save();

    return res.status(200).json({ success: true, message: 'Notice settings updated.', data: config });
  } catch (error) {
    console.error('Update notice config error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notice settings.' });
  }
};
