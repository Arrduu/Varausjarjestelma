import { Mongo } from 'meteor/mongo';

export const itemsCollection = new Mongo.Collection('items');
