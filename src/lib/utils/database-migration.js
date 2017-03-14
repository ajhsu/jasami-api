import db from '../db-manager';
import { mongodbConfig } from '../../config';

export const createTestingDb = async () => {
  try {
    // Drop previous database
    await db.query.dropDatabase();
    // Create collection
    await db.query.createCollection('restaurants');
    await db.query.collection('restaurants').insert(require('../mock-db.js'));
    console.log('TestingDb created');
  } catch (err) {
    console.error('Error occurred when create testing database', err);
  }
};

export const createCounterCollection = async (ids = []) => {
  try {
    // Create counter-document for each id(s)
    if (!ids || ids.length === 0) return;
    await Promise.all(
      ids.map(id =>
        db.query.collection('counters').insert({ _id: id, count: 0 }))
    );
    console.log('Counter collection created');
  } catch (err) {
    console.error('Error occurred when create counter collection', err);
  }
};

export const dropCounterCollection = async () => {
  try {
    const counters = await db.query.collection('counters').find({}).toArray();
    if (counters.length > 0) {
      await db.query.collection('counters').drop();
    }
  } catch (err) {
    console.error('Error occurred when drop counter collection', err);
  }
};

export const getNextCount = async id => {
  const res = await db.counters.findAndModify({
    query: { _id: id },
    update: { $inc: { count: 1 } },
    new: true
  });
  console.log(res);
};

export const dropTestingDb = async () => {
  try {
    // Drop previous database
    await db.query.dropDatabase();
    console.log('TestingDb dropped');
  } catch (err) {
    console.error('Error occurred when drop testing database', err);
  }
};
