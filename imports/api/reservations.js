import { Mongo } from 'meteor/mongo';

export const reservationsCollection = new Mongo.Collection('reservations');
