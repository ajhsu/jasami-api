import db from '../db-manager';
import { mongodbConfig } from '../../config';

export const createTestingDb = async () => {
  db.init(mongodbConfig);
  await db.connect();
  // Drop previous database
  await db.query.dropDatabase();
  // Create collection
  await db.query.createCollection('restaurants');
  await db.query.collection('restaurants').insert(require('../mock-db.js'));
  db.close();
};

export const dropTestingDb = async () => {
  db.init(mongodbConfig);
  await db.connect();
  // Drop previous database
  await db.query.dropDatabase();
  db.close();
};
