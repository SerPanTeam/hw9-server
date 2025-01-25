"use strict";
const { checkAuthorization, checkRole } = require("./middleware");

const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;
const SECRET_KEY =
  process.env.SECRET_KEY || "<<<!__Your_Secret_Key_123456789__?>>>";
const JWT_OPTIONS = { expiresIn: "1h", algorithm: "HS256" };
const jwt = require("jsonwebtoken");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
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
