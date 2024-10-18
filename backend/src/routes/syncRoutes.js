const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');

router.post('/sync-monday-mailchimp', syncController.syncMondayMailchimp);

module.exports = router;