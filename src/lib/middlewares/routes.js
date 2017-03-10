import { Router } from 'express';
import healthCheck from './health-check';
import favicon from './favicon';
import {
  getAllRestaurants,
  getRestaurtantById,
  addRestaurtant
} from './jasami';

const router = Router();

router.route('/health').get(healthCheck);
router.route('/favicon.ico').get(favicon);
router.route('/restaurants').get(getAllRestaurants);
router.route('/restaurant/:restaurantId').get(getRestaurtantById);
router.route('/restaurant').post(addRestaurtant);

export default router;
