const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

function validateMongoQuery(query) {
  if (!query) return true;
  const idFields = ['_id', 'recipient', 'reporter', 'issueId'];
  if (query.email !== undefined && query.email !== null && typeof query.email !== 'string') {
    return false;
  }
  for (const field of idFields) {
    if (query[field] !== undefined && query[field] !== null) {
      const val = query[field];
      if (typeof val === 'string' && !mongoose.Types.ObjectId.isValid(val)) {
        return false;
      }
    }
  }
  return true;
}

function validateMongoId(id) {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id);
}

const useMongo = !!process.env.MONGO_URI;
const jsonDbPath = path.join(__dirname, '..', 'data', 'db.json');

// Ensure data directory exists
const dataDir = path.dirname(jsonDbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial structure for local JSON DB
const initialDb = {
  users: [],
  issues: [],
  notifications: []
};

function readLocalDb() {
  try {
    if (!fs.existsSync(jsonDbPath)) {
      fs.writeFileSync(jsonDbPath, JSON.stringify(initialDb, null, 2));
      return initialDb;
    }
    const data = fs.readFileSync(jsonDbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading local database file:', error);
    return initialDb;
  }
}

function writeLocalDb(data) {
  try {
    fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to local database file:', error);
  }
}

// MongoDB Schemas
let UserModel, IssueModel, NotificationModel;

if (useMongo) {
  const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['parent', 'teacher', 'admin'], default: 'parent' },
    schoolId: { type: String, required: true }
  }, { timestamps: true });

  const IssueSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['pending', 'in-progress', 'resolved'], default: 'pending' },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reporterName: { type: String, required: true },
    schoolId: { type: String, required: true },
    image: { type: String },
    assignedStaff: { type: String, default: '' },
    estimatedResolutionTime: { type: String, default: '' },
    timeline: [{
      status: { type: String, required: true },
      notes: { type: String, default: '' },
      timestamp: { type: Date, default: Date.now }
    }]
  }, { timestamps: true });

  const NotificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
    read: { type: Boolean, default: false }
  }, { timestamps: true });

  UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
  IssueModel = mongoose.models.Issue || mongoose.model('Issue', IssueSchema);
  NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
}

// Unified Database Client
const db = {
  isMongo: useMongo,
  connect: async () => {
    if (useMongo) {
      try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Successfully connected to MongoDB.');
      } catch (err) {
        console.error('MongoDB connection failed, falling back to local JSON database.', err.message);
        db.isMongo = false;
      }
    } else {
      console.log('No MONGO_URI specified. Running with local JSON database fallback at:', jsonDbPath);
      readLocalDb(); // Ensure db.json is initialized
    }
  },

  users: {
    find: async (query = {}) => {
      if (db.isMongo) {
        if (!validateMongoQuery(query)) return [];
        return await UserModel.find(query).lean();
      } else {
        const localData = readLocalDb();
        return localData.users.filter(item => {
          return Object.keys(query).every(key => item[key] === query[key]);
        });
      }
    },
    findOne: async (query = {}) => {
      if (db.isMongo) {
        if (!validateMongoQuery(query)) return null;
        return await UserModel.findOne(query).lean();
      } else {
        const localData = readLocalDb();
        const found = localData.users.find(item => {
          return Object.keys(query).every(key => item[key] === query[key]);
        });
        return found || null;
      }
    },
    findById: async (id) => {
      if (db.isMongo) {
        if (!validateMongoId(id)) return null;
        return await UserModel.findById(id).lean();
      } else {
        const localData = readLocalDb();
        const found = localData.users.find(item => item._id === id);
        return found || null;
      }
    },
    create: async (data) => {
      if (db.isMongo) {
        const user = new UserModel(data);
        const saved = await user.save();
        return saved.toObject();
      } else {
        const localData = readLocalDb();
        const newUser = {
          _id: 'u_' + Math.random().toString(36).slice(2, 11),
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localData.users.push(newUser);
        writeLocalDb(localData);
        return newUser;
      }
    },
    findByIdAndUpdate: async (id, updateData) => {
      if (db.isMongo) {
        if (!validateMongoId(id)) return null;
        return await UserModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).lean();
      } else {
        const localData = readLocalDb();
        const index = localData.users.findIndex(item => item._id === id);
        if (index === -1) return null;

        const original = localData.users[index];
        const updated = {
          ...original,
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        localData.users[index] = updated;
        writeLocalDb(localData);
        return updated;
      }
    }
  },

  issues: {
    find: async (query = {}) => {
      if (db.isMongo) {
        if (!validateMongoQuery(query)) return [];
        return await IssueModel.find(query).sort({ createdAt: -1 }).lean();
      } else {
        const localData = readLocalDb();
        let list = localData.issues;
        
        // Handle filter queries if specific keys are provided
        list = list.filter(item => {
          return Object.keys(query).every(key => {
            if (query[key] === undefined || query[key] === null) return true;
            return item[key] === query[key];
          });
        });
        
        // Sort descending by createdAt
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    },
    findById: async (id) => {
      if (db.isMongo) {
        if (!validateMongoId(id)) return null;
        return await IssueModel.findById(id).lean();
      } else {
        const localData = readLocalDb();
        const found = localData.issues.find(item => item._id === id);
        return found || null;
      }
    },
    create: async (data) => {
      if (db.isMongo) {
        const defaultTimeline = [{
          status: 'pending',
          notes: 'Issue reported to school management.',
          timestamp: new Date()
        }];
        const issue = new IssueModel({
          ...data,
          timeline: data.timeline || defaultTimeline
        });
        const saved = await issue.save();
        return saved.toObject();
      } else {
        const localData = readLocalDb();
        const now = new Date().toISOString();
        const newIssue = {
          _id: 'i_' + Math.random().toString(36).slice(2, 11),
          status: 'pending',
          assignedStaff: '',
          estimatedResolutionTime: '',
          ...data,
          timeline: data.timeline || [{
            status: 'pending',
            notes: 'Issue reported to school management.',
            timestamp: now
          }],
          createdAt: now,
          updatedAt: now
        };
        localData.issues.push(newIssue);
        writeLocalDb(localData);
        return newIssue;
      }
    },
    findByIdAndUpdate: async (id, updateData) => {
      if (db.isMongo) {
        if (!validateMongoId(id)) return null;
        // If appending a timeline event, use $push
        if (updateData.$push && updateData.$push.timeline) {
          return await IssueModel.findByIdAndUpdate(
            id,
            { 
              $push: { timeline: updateData.$push.timeline },
              $set: updateData.$set || {}
            },
            { new: true }
          ).lean();
        }
        return await IssueModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).lean();
      } else {
        const localData = readLocalDb();
        const index = localData.issues.findIndex(item => item._id === id);
        if (index === -1) return null;

        const original = localData.issues[index];
        let updated = { ...original };

        // Handle standard updates or special updates
        if (updateData.$set) {
          updated = { ...updated, ...updateData.$set };
        } else if (!updateData.$push) {
          updated = { ...updated, ...updateData };
        }

        if (updateData.$push && updateData.$push.timeline) {
          const newEvent = {
            ...updateData.$push.timeline,
            timestamp: updateData.$push.timeline.timestamp || new Date().toISOString()
          };
          updated.timeline = [...(updated.timeline || []), newEvent];
        }

        updated.updatedAt = new Date().toISOString();
        localData.issues[index] = updated;
        writeLocalDb(localData);
        return updated;
      }
    }
  },

  notifications: {
    find: async (query = {}) => {
      if (db.isMongo) {
        if (!validateMongoQuery(query)) return [];
        return await NotificationModel.find(query).sort({ createdAt: -1 }).lean();
      } else {
        const localData = readLocalDb();
        const list = localData.notifications.filter(item => {
          return Object.keys(query).every(key => item[key] === query[key]);
        });
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    },
    findById: async (id) => {
      if (db.isMongo) {
        if (!validateMongoId(id)) return null;
        return await NotificationModel.findById(id).lean();
      } else {
        const localData = readLocalDb();
        const found = localData.notifications.find(item => item._id === id);
        return found || null;
      }
    },
    create: async (data) => {
      if (db.isMongo) {
        const notification = new NotificationModel(data);
        const saved = await notification.save();
        return saved.toObject();
      } else {
        const localData = readLocalDb();
        const now = new Date().toISOString();
        const newNotification = {
          _id: 'n_' + Math.random().toString(36).slice(2, 11),
          read: false,
          ...data,
          createdAt: now,
          updatedAt: now
        };
        localData.notifications.push(newNotification);
        writeLocalDb(localData);
        return newNotification;
      }
    },
    findByIdAndUpdate: async (id, updateData) => {
      if (db.isMongo) {
        if (!validateMongoId(id)) return null;
        return await NotificationModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).lean();
      } else {
        const localData = readLocalDb();
        const index = localData.notifications.findIndex(item => item._id === id);
        if (index === -1) return null;

        const original = localData.notifications[index];
        const updated = {
          ...original,
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        localData.notifications[index] = updated;
        writeLocalDb(localData);
        return updated;
      }
    }
  }
};

module.exports = db;
