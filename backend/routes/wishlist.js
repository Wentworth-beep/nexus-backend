// LAYER: Route — URL mapping only, calls wishlistController
const router = require('express').Router();
const ctrl = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.get);
router.post('/', ctrl.add);
router.delete('/:productId', ctrl.remove);

module.exports = router;