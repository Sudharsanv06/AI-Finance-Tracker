import FirestoreModel from './FirestoreModel.js';

export default class Expense extends FirestoreModel {
  static collectionName = 'expenses';
}