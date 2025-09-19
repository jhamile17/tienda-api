const express = require('express');
const router = express.Router();

// Web (sin token, solo vista)
router.get('/', (req, res) => {
  res.render('home');
});

module.exports = router;
