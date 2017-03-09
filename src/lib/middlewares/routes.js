import { Router } from 'express';
import healthCheck from './health-check';
import favicon from './favicon';
import { getRestaurants } from './jasami';

const router = Router();

router.route('/health').get(healthCheck);
router.route('/favicon.ico').get(favicon);
router.route('/restaurants').get(getRestaurants);

export default router;
