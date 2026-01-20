# Models Structure

According to the Modular Monolith Architecture, models should be organized by module:

```
src/modules/{moduleName}/models/
├── User.js          # Model definition
├── UserRepository.js # Optional: Repository pattern for complex queries
└── index.js          # Export models
```

## Example Model Structure

### Module Model (src/modules/users/models/User.js)

```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  // ... other fields
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;
```

### Module Models Index (src/modules/users/models/index.js)

```javascript
const User = require('./User');

module.exports = {
  User,
};
```

## Usage in Services

```javascript
// src/modules/users/services/userService.js
const { User } = require('../models');

const getUserById = async (id) => {
  return await User.findByPk(id);
};
```
