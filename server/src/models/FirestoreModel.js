import { db } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

// Helper to convert Firestore timestamp to date
export const toJSDate = (val) => {
  if (val && typeof val.toDate === 'function') {
    return val.toDate();
  }
  return val;
};

// Chainable query class mimicking Mongoose Query
class FirestoreQuery {
  constructor(collectionName, modelClass, filter = {}) {
    this.collectionName = collectionName;
    this.modelClass = modelClass;
    this.filter = filter;
    this._sort = null;
    this._limit = null;
    this._skip = null;
    this._populatePath = null;
    this._populateSelect = null;
  }

  sort(option) {
    this._sort = option;
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  skip(n) {
    this._skip = n;
    return this;
  }

  populate(path, select) {
    this._populatePath = path;
    this._populateSelect = select;
    return this;
  }

  select(fields) {
    this._select = fields;
    return this;
  }

  async then(resolve, reject) {
    try {
      const results = await this.exec();
      resolve(results);
    } catch (err) {
      reject(err);
    }
  }

  async exec() {
    let queryRef = db.collection(this.collectionName);

    // Apply basic filter mappings
    for (const [key, val] of Object.entries(this.filter)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        // Handle comparison operators ($gte, $lte, $ne, $in)
        for (const [op, opVal] of Object.entries(val)) {
          if (op === '$gte') {
            queryRef = queryRef.where(key, '>=', opVal);
          } else if (op === '$lte') {
            queryRef = queryRef.where(key, '<=', opVal);
          } else if (op === '$gt') {
            queryRef = queryRef.where(key, '>', opVal);
          } else if (op === '$lt') {
            queryRef = queryRef.where(key, '<', opVal);
          } else if (op === '$ne') {
            queryRef = queryRef.where(key, '!=', opVal);
          } else if (op === '$in') {
            queryRef = queryRef.where(key, 'in', opVal);
          }
        }
      } else {
        // Exact match
        queryRef = queryRef.where(key, '==', val);
      }
    }

    const snapshot = await queryRef.get();
    const list = [];
    
    for (const doc of snapshot.docs) {
      const instance = new this.modelClass(doc.data(), doc.id);
      if (this._populatePath) {
        await instance.populate(this._populatePath, this._populateSelect);
      }
      list.push(instance);
    }

    // Apply sorting in memory to avoid requiring Firestore composite indexes
    if (this._sort) {
      let sortKey = '';
      let sortDir = 'asc';
      if (typeof this._sort === 'string') {
        if (this._sort.startsWith('-')) {
          sortKey = this._sort.substring(1);
          sortDir = 'desc';
        } else {
          sortKey = this._sort;
        }
      } else if (typeof this._sort === 'object') {
        const entry = Object.entries(this._sort)[0];
        if (entry) {
          sortKey = entry[0];
          sortDir = entry[1] === -1 || entry[1] === 'desc' ? 'desc' : 'asc';
        }
      }
      if (sortKey) {
        list.sort((a, b) => {
          let valA = a[sortKey];
          let valB = b[sortKey];
          if (valA instanceof Date) valA = valA.getTime();
          if (valB instanceof Date) valB = valB.getTime();
          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;
          if (valA < valB) return sortDir === 'asc' ? -1 : 1;
          if (valA > valB) return sortDir === 'asc' ? 1 : -1;
          return 0;
        });
      }
    }

    // Apply skip and limit in memory
    let finalList = list;
    if (this._skip) {
      finalList = finalList.slice(this._skip);
    }
    if (this._limit) {
      finalList = finalList.slice(0, this._limit);
    }

    return finalList;
  }
}

// Base Firestore Model Class
export default class FirestoreModel {
  static collectionName = '';

  constructor(data = {}, id = null) {
    this._id = id;
    this.id = id;
    
    // Copy data properties
    for (const [k, v] of Object.entries(data)) {
      // Map Firestore Timestamps to native Date
      if (v && typeof v.toDate === 'function') {
        this[k] = v.toDate();
      } else {
        this[k] = v;
      }
    }
  }

  static find(filter = {}) {
    return new FirestoreQuery(this.collectionName, this, filter);
  }

  static async countDocuments(filter = {}) {
    let queryRef = db.collection(this.collectionName);
    for (const [key, val] of Object.entries(filter)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        for (const [op, opVal] of Object.entries(val)) {
          if (op === '$gte') queryRef = queryRef.where(key, '>=', opVal);
          else if (op === '$lte') queryRef = queryRef.where(key, '<=', opVal);
          else if (op === '$gt') queryRef = queryRef.where(key, '>', opVal);
          else if (op === '$lt') queryRef = queryRef.where(key, '<', opVal);
          else if (op === '$ne') queryRef = queryRef.where(key, '!=', opVal);
          else if (op === '$in') queryRef = queryRef.where(key, 'in', opVal);
        }
      } else {
        queryRef = queryRef.where(key, '==', val);
      }
    }
    const snapshot = await queryRef.count().get();
    return snapshot.data().count;
  }

  static async findOne(filter = {}) {
    const list = await new FirestoreQuery(this.collectionName, this, filter).limit(1).exec();
    return list[0] || null;
  }

  static async findById(id) {
    if (!id) return null;
    const doc = await db.collection(this.collectionName).doc(id.toString()).get();
    if (!doc.exists) return null;
    return new this(doc.data(), doc.id);
  }

  static async findByIdAndUpdate(id, updateData, options = {}) {
    if (!id) return null;
    const docRef = db.collection(this.collectionName).doc(id.toString());
    
    const cleanUpdate = {};
    
    if (updateData.$inc) {
      for (const [k, v] of Object.entries(updateData.$inc)) {
        if (v !== undefined) {
          cleanUpdate[k] = FieldValue.increment(Number(v));
        }
      }
    }

    // Translate MongoDB style $set operator
    if (updateData.$set) {
      for (const [k, v] of Object.entries(updateData.$set)) {
        if (v !== undefined) {
          cleanUpdate[k] = v;
        }
      }
    }

    // Support standard root properties
    for (const [k, v] of Object.entries(updateData)) {
      if (!k.startsWith('$') && v !== undefined) {
        cleanUpdate[k] = v;
      }
    }

    await docRef.update(cleanUpdate);
    const updatedDoc = await docRef.get();
    return new this(updatedDoc.data(), updatedDoc.id);
  }

  static async findByIdAndDelete(id) {
    if (!id) return null;
    await db.collection(this.collectionName).doc(id.toString()).delete();
    return true;
  }

  static async create(data) {
    const docRef = db.collection(this.collectionName).doc();
    const id = docRef.id;
    const cleanData = { ...data };
    
    // Add default timestamps if they don't exist
    if (!cleanData.createdAt) cleanData.createdAt = new Date();
    if (!cleanData.updatedAt) cleanData.updatedAt = new Date();

    // Remove undefined fields
    for (const [k, v] of Object.entries(cleanData)) {
      if (v === undefined) {
        delete cleanData[k];
      }
    }

    await docRef.set(cleanData);
    return new this(cleanData, id);
  }

  static async deleteMany(filter = {}) {
    const list = await this.find(filter).exec();
    const batch = db.batch();
    for (const item of list) {
      const docRef = db.collection(this.collectionName).doc(item.id.toString());
      batch.delete(docRef);
    }
    await batch.commit();
    return { deletedCount: list.length };
  }

  async save() {
    const cleanData = {};
    // Extract non-private/non-method properties
    for (const [k, v] of Object.entries(this)) {
      if (!k.startsWith('_') && k !== 'id' && typeof v !== 'function') {
        cleanData[k] = v === undefined ? null : v;
      }
    }
    cleanData.updatedAt = new Date();

    if (this.id) {
      await db.collection(this.constructor.collectionName).doc(this.id.toString()).set(cleanData, { merge: true });
    } else {
      const docRef = db.collection(this.constructor.collectionName).doc();
      this.id = docRef.id;
      this._id = docRef.id;
      await docRef.set(cleanData);
    }
    return this;
  }

  async deleteOne() {
    if (this.id) {
      await db.collection(this.constructor.collectionName).doc(this.id.toString()).delete();
      return true;
    }
    return false;
  }

  // Populate references dynamically
  async populate(pathOption, selectFields = '') {
    const list = Array.isArray(pathOption) ? pathOption : [{ path: pathOption, select: selectFields }];

    for (const item of list) {
      const path = item.path;
      const select = item.select || '';
      const refId = this[path];
      if (!refId) continue;

      let targetCollection = '';
      if (path === 'createdBy' || path === 'userId' || path === 'submittedBy' || path === 'approvedBy') {
        targetCollection = 'users';
      } else if (path === 'eventId') {
        targetCollection = 'events';
      } else if (path === 'familyMember') {
        targetCollection = 'family_members';
      }

      if (targetCollection) {
        // Handle if refId is already populated
        if (typeof refId === 'object' && refId._id) {
          continue;
        }

        const doc = await db.collection(targetCollection).doc(refId.toString()).get();
        if (doc.exists) {
          const docData = doc.data();
          const cleanDoc = { _id: doc.id, id: doc.id };
          if (select) {
            const fields = select.split(' ');
            for (const f of fields) {
              if (f && !f.startsWith('-') && docData[f] !== undefined) {
                cleanDoc[f] = docData[f];
              }
            }
          } else {
            Object.assign(cleanDoc, docData);
          }
          this[path] = cleanDoc;
        }
      }
    }
    return this;
  }
}
