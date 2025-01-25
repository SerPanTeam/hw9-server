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
