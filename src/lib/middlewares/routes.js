import { Router } from 'express';
import healthCheck from './health-check';
import favicon from './favicon';
import {
  getAllRestaurants,
  getRestaurtantById,
  addRestaurtant,
  updateRestaurtantById,
  getAllDishesByRestaurantId
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
// /restaurants/<id>/dishes
router.route('/restaurant/:restaurantId/dishes').get(getAllDishesByRestaurantId);
export default router;
