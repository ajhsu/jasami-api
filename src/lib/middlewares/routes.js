import { Router } from 'express';
import healthCheck from './health-check';
import favicon from './favicon';
import {
  getAllRestaurants,
  getRestaurtantById,
  addRestaurtant,
  updateRestaurtantById
} from './jasami';

const router = Router();

router.route('/health').get(healthCheck);
router.route('/favicon.ico').get(favicon);
// /restaurants
router.route('/restaurants').get(getAllRestaurants);
// /restaurant
router.route('/restaurant').post(addRestaurtant);
router.route('/restaurant/:restaurantId').get(getRestaurtantById);
router.route('/restaurant/:restaurantId').put(updateRestaurtantById);

export default router;
