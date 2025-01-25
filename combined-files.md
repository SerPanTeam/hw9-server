# Структура проекта

```plaintext
├── cgi-bin
├── config
│   ├── config copy.json
│   ├── config.js
│   └── config.json
├── migrations
│   ├── 20250117220819-create-user.js
│   ├── 20250119110352-add-mustChangePassword-to-user.js
│   └── 20250123182518-add-role-field-to-users.js
├── models
│   ├── index.js
│   └── user.js
├── public
├── seeders
│   └── 20250117221040-demo-user.js
├── tmp
│   └── restart.txt
├── .env
├── .gitignore
├── .htaccess
├── app.js
├── codewr.js
├── combined-files.md
├── middleware.js
├── package-lock.json
├── package.json
└── stderr.log

```

# Файлы .ts, .tsx, .css

## app.js

```javascript
"use strict";
require("dotenv").config();
const { checkAuthorization, checkRole } = require("./middleware");

const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;
const SECRET_KEY =
  process.env.SECRET_KEY || "<<<!__Your_Secret_Key_123456789__?>>>";
const JWT_OPTIONS = { expiresIn: "1h", algorithm: "HS256" };
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const express = require("express");
const cors = require("cors");
const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const { User } = require("./models");
const PORT = process.env.PORT || 3333;

app.get("/", (req, res) => {
  return res.status(200).json({ message: "Hallo. Port: " + PORT });
});

app.get("/users", checkAuthorization, checkRole("admin"), async (req, res) => {
  try {
    const users = await User.findAll();

    const sanitizedUsers = users.map((u) => {
      const { password, ...rest } = u.toJSON();
      return rest;
    });

    return res.status(200).json(sanitizedUsers);
  } catch (error) {
    return res.status(500).json({ message: `Server error: ${error}` });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    } else {
      const user = await User.findOne({ where: { email: email } });
      if (user) {
        res
          .status(409)
          .json({ message: "A user with this email is already registered!" });
      } else {
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        const newUser = await User.create({
          firstName,
          lastName,
          email,
          role,
          password: hash,
        });
        if (newUser) {
          const { password, ...sanitizedUser } = newUser.toJSON();
          return res.status(201).json(sanitizedUser);
        } else {
          return res.status(500).json({ message: `Server error: ${error}` });
        }
      }
    }
  } catch (error) {
    return res.status(500).json({ message: `Server error: ${error}` });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Missing required fields: email, password" });
    }
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password!" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        SECRET_KEY,
        JWT_OPTIONS
      );

      const { password, ...sanitizedUser } = user.toJSON();

      res.cookie("authToken", token, {
        httpOnly: true, // Защита от доступа через JavaScript
        // secure: process.env.NODE_ENV === "production", // Только для HTTPS в продакшене
        secure: false,
        //sameSite: "Strict", // Ограничение отправки с третьих сторон
        maxAge: 3600000, // Время жизни куки (1 час)
      });

      return res.status(200).json({
        message: "Login successful!",
        token,
        user: sanitizedUser,
      });
    }
    return res.status(401).json({ message: "Invalid email or password!" });
  } catch (error) {
    return res.status(500).json({ message: `Server error: ${error}` });
  }
});

app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
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
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      host: process.env.DATABASE_HOST,
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

## middleware.js

```javascript
"use strict";
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;

exports.checkAuthorization = (req, res, next) => {
  //   const authHeader = req.headers.authorization;
  //   if (!authHeader) {
  //     return res.status(401).json({ message: "No token provided" });
  //   }
  //   const token = authHeader.split(" ")[1];
  const token = req.cookies.authToken;
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
};

exports.checkRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
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

## migrations\20250123182518-add-role-field-to-users.js

```javascript
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "role", {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Users", "role");
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
      role: DataTypes.STRING,
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

