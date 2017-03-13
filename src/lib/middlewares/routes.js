import { Router } from 'express';
import healthCheck from './health-check';
import favicon from './favicon';
import {
  getAllRestaurants,
  getRestaurtantById,
  addRestaurtant,
  updateRestaurtantById,
  getAllDishesByRestaurantId,
  getDishByRestaurantIdAndDishId,
  addDishByRestaurantId,
  updateDishByRestaurantIdAndDishId
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
router
  .route('/restaurant/:restaurantId/dishes')
  .get(getAllDishesByRestaurantId);
// /restaurants/<id>/dish
router.route('/restaurant/:restaurantId/dish').post(addDishByRestaurantId);
router
  .route('/restaurant/:restaurantId/dish/:dishId')
  .get(getDishByRestaurantIdAndDishId);
router
  .route('/restaurant/:restaurantId/dish/:dishId')
  .put(updateDishByRestaurantIdAndDishId);
export default router;
