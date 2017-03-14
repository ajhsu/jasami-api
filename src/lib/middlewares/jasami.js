require('babel-polyfill');

import db from '../db-manager';
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
  // Mering into single document
  const newDocument = Object.assign({}, restaurantDefaults, req.body);
  // Iterating the whole menu to give each dishes a unique objectId for querying
  newDocument.menu = newDocument.menu.map(dish =>
    Object.assign({}, dish, { _id: new ObjectID() }));
  const insertResult = await db.query
    .collection('restaurants')
    .insertOne(newDocument);
  res
    .status(HTTPStatus.CREATED)
    .json({ restaurantId: insertResult.insertedId });
};
// PUT /restaurant
export const updateRestaurtantById = async (req, res, next) => {
  const restaurantId = req.params.restaurantId;
  // json-schema validate
  if (
    !ajv.validate(require('../schemas/restaurant/put/request.json'), req.body)
  ) {
    res
      .status(HTTPStatus.BAD_REQUEST)
      .json({ errors: ajv.errors.map(e => e.message) });
    return;
  }
  const updateResult = await db.query.collection('restaurants').update(
    {
      _id: new ObjectID(restaurantId)
    },
    { $set: req.body }
  );
  res.status(HTTPStatus.OK).json({ restaurantId });
};

// GET /restaurant/<id>/dishes
export const getAllDishesByRestaurantId = async (req, res, next) => {
  const restaurantId = req.params.restaurantId;
  try {
    const restaurant = await db.query
      .collection('restaurants')
      .findOne({ _id: new ObjectID(restaurantId) });
    if (!restaurant) throw new Error('ObjectID not found');
    res.status(HTTPStatus.OK).json(restaurant.menu);
  } catch (err) {
    res.status(HTTPStatus.NOT_FOUND).json({});
  }
};
// GET /restaurant/<id>/dish/<id>
export const getDishByRestaurantIdAndDishId = async (req, res, next) => {
  const restaurantId = req.params.restaurantId;
  const dishId = req.params.dishId;
  try {
    const restaurant = await db.query
      .collection('restaurants')
      .findOne({ _id: new ObjectID(restaurantId) });
    const dish = restaurant.menu
      .filter(dish => dish._id.equals(new ObjectID(dishId)))
      .shift();
    if (!dish) throw new Error('ObjectID not found');
    res.status(HTTPStatus.OK).json(dish);
  } catch (err) {
    res.status(HTTPStatus.NOT_FOUND).json({});
  }
};
// POST /restaurant/<id>/dish
export const addDishByRestaurantId = async (req, res, next) => {
  const restaurantId = req.params.restaurantId;
  // json-schema validate
  if (!ajv.validate(require('../schemas/dish/post/request.json'), req.body)) {
    res
      .status(HTTPStatus.BAD_REQUEST)
      .json({ errors: ajv.errors.map(e => e.message) });
    return;
  }
  const newDishId = new ObjectID();
  const dishDefaults = {
    name: '',
    price: 0,
    tags: []
  };
  // Mering into single document
  const newDocument = Object.assign({}, dishDefaults, req.body, {
    _id: newDishId
  });
  const upsertResult = await db.query
    .collection('restaurants')
    .update(
      { _id: new ObjectID(restaurantId) },
      { $push: { menu: newDocument } }
    );
  res.status(HTTPStatus.CREATED).json({ dishId: newDishId });
};
// PUT /restaurant/<id>/dish/<id>
export const updateDishByRestaurantIdAndDishId = async (req, res, next) => {
  const restaurantId = req.params.restaurantId;
};

// GET /search?keyword=<text>
export const search = keyword => {};
// GET /search?tags=<tag1>,<tag2>
export const filterByTags = tags => {};
