import bcrypt from 'bcryptjs';
import FirestoreModel from './FirestoreModel.js';

export default class User extends FirestoreModel {
  static collectionName = 'users';

  static async create(data) {
    const cleanData = { ...data };
    if (cleanData.password) {
      const salt = await bcrypt.genSalt(10);
      cleanData.password = await bcrypt.hash(cleanData.password, salt);
    }
    if (!cleanData.role) {
      cleanData.role = 'Organizer';
    }
    return super.create(cleanData);
  }

  async save() {
    if (this.password && !this.password.startsWith('$2')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    return super.save();
  }

  async matchPassword(enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
  }
}