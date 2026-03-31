const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');

router.get('/public', noticeController.getPublicNotices);

module.exports = router;
