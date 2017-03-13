require('babel-polyfill');

import db from '../database';

// GET /restaurants
export const getAllRestaurants = async (req, res, next) => {
  const restaurants = await db.query
    .collection('restaurants')
    .find({})
    .toArray();
  res.status(200).json(restaurants);
};
// GET /restaurant
export const getRestaurtantById = (req, res, next) => {
  const restaurantId = req.params.restaurantId;
  res.end('ok');
};
// POST /restaurant
export const addRestaurtant = (req, res, next) => {
  console.log(req.payload);
  res.json({ status: 'success' });
};
// PUT /restaurant
export const updateRestaurtantById = (restaurantId, payload) => {};

// GET /restaurant/<id>/dishes
export const getAllDishesByRestaurantId = restaurantId => {};
// GET /restaurant/<id>/dish/<id>
export const getDishByRestaurantIdAndDishId = (restaurantId, dishId) => {};
// POST /restaurant/<id>/dish
export const addDishByRestaurantId = (restaurantId, payload) => {};
// PUT /restaurant/<id>/dish/<id>
export const updateDishByRestaurantIdAndDishId = (
  restaurantId,
  dishId,
  payload
) => {};

// GET /search?keyword=<text>
export const search = keyword => {};
// GET /search?tags=<tag1>,<tag2>
export const filterByTags = tags => {};
