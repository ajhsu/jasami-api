require('babel-polyfill');

import db from '../database';
import HTTPStatus from 'http-status';
import Ajv from 'ajv';
const ObjectID = require('mongodb').ObjectID;

// JSON-Schema validator
const ajv = new Ajv();

// GET /restaurants
export const getAllRestaurants = async (req, res, next) => {
  const restaurants = await db.query
    .collection('restaurants')
    .find({})
    .toArray();
  res.status(HTTPStatus.OK).json(restaurants);
};
// GET /restaurant
export const getRestaurtantById = async (req, res, next) => {
  const restaurantId = req.params.restaurantId;
  try {
    const restaurant = await db.query
      .collection('restaurants')
      .findOne({ _id: new ObjectID(restaurantId) });
    if (!restaurant) throw new Error('ObjectID not found');
    res.status(HTTPStatus.OK).json(restaurant);
  } catch (err) {
    res.status(HTTPStatus.NOT_FOUND).json({});
  }
};
// POST /restaurant
export const addRestaurtant = async (req, res, next) => {
  // json-schema validate
  if (
    !ajv.validate(require('../schemas/restaurant/post/request.json'), req.body)
  ) {
    res
      .status(HTTPStatus.BAD_REQUEST)
      .json({ errors: ajv.errors.map(e => e.message) });
    return;
  }
  const restaurantDefaults = {
    location: {
      alias: '',
      address: '',
      coordinates: {
        lat: 0,
        lng: 0
      }
    },
    contact: {
      phone: ''
    },
    priceRange: {
      from: 0,
      to: 0
    },
    menu: []
  };
  const insertResult = await db.query
    .collection('restaurants')
    .insertOne(Object.assign({}, restaurantDefaults, req.body));
  res
    .status(HTTPStatus.CREATED)
    .json({ restaurantId: insertResult.insertedId });
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
