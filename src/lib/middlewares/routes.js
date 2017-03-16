import { Router } from 'express';
import routeTable from './route-table';
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

router.route('/').get(routeTable);
router.route('/health').get(healthCheck);
router.route('/favicon.ico').get(favicon);
// /restaurants
router.route('/restaurants').get(getAllRestaurants);
// /restaurant
router.route('/restaurants').post(addRestaurtant);
router.route('/restaurants/:restaurantId').get(getRestaurtantById);
router.route('/restaurants/:restaurantId').put(updateRestaurtantById);
// /restaurants/<id>/dishes
router
  .route('/restaurants/:restaurantId/dishes')
  .get(getAllDishesByRestaurantId);
// /restaurants/<id>/dish
router.route('/restaurants/:restaurantId/dishes').post(addDishByRestaurantId);
router
  .route('/restaurants/:restaurantId/dishes/:dishId')
  .get(getDishByRestaurantIdAndDishId);
router
  .route('/restaurants/:restaurantId/dishes/:dishId')
  .put(updateDishByRestaurantIdAndDishId);
export default router;
