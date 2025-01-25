# Структура проекта

```plaintext
├── config
│   ├── config copy.json
│   ├── config.js
│   └── config.json
├── migrations
│   ├── 20250117220819-create-user.js
│   └── 20250119110352-add-mustChangePassword-to-user.js
├── models
│   ├── index.js
│   └── user.js
├── seeders
│   └── 20250117221040-demo-user.js
├── .env
├── app.js
├── codewr.js
├── combined-files.md
├── package-lock.json
└── package.json

```

# Файлы .ts, .tsx, .css

## app.js

```javascript
"use strict";
const bcrypt = require("bcrypt");
const saltRounds = 10;

require("dotenv").config();

const express = require("express");
const app = express();
app.use(express.json());
const { User } = require("./models");
const PORT = process.env.PORT || 3333;

require("dotenv").config({ path: './.env' });
console.log("DB_USERNAME:", process.env.DB_USERNAME);

console.log("DB_USERNAME:", process.env.DB_USERNAME);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_HOST:", process.env.DB_HOST);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Hallo. Port: " + PORT });
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    res.status(500).send({ message: "Wrong data!" });
  } else {
    const user = await User.findOne({ where: { email: email } });
    if (user) {
      res
        .status(500)
        .send({ message: "User with this email has alredy been registered!" });
    } else {
      const hash = bcrypt.hashSync(password, saltRounds);
      const newUser = await User.create({
        firstName,
        lastName,
        email,
        password: hash,
      });
      if (newUser) res.status(201).send(newUser);
      else res.status(500).send({ message: "Error create user!" });
    }
  }
});

app.listen(PORT, () => {
  console.log("Server is running! Port:", PORT);
});

```

## config\config.js

```javascript
require("dotenv").config();

module.exports = {
    development: {
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      dialect: "mysql",
    },
    test: {
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      dialect: "mysql",
    },
    production: {
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      dialect: "mysql",
    },
  };
  
```

## migrations\20250117220819-create-user.js

```javascript
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      firstName: {
        type: Sequelize.STRING
      },
      lastName: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};
```

## migrations\20250119110352-add-mustChangePassword-to-user.js

```javascript
"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "mustChangePassword", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Users", "mustChangePassword");
  },
};

```

## models\index.js

```javascript
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

```

## models\user.js

```javascript
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init(
    {
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      mustChangePassword: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};

```

## seeders\20250117221040-demo-user.js

```javascript
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert(
      "Users",
      [
        {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
          password: "1234",
        },
        {
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
          password: "1234",
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Users", null, {});
  },
};

```

# Дополнительные файлы

⚠️ Файл **index.html** не найден и пропущен.

