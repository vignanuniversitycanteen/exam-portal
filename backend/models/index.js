const Exam = require('./Exam');
const Seating = require('./Seating');
const Admin = require('./Admin');
const Student = require('./Student');
const Malpractice = require('./Malpractice');
const { sequelize } = require('../db');

const syncDB = async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully');
    } catch (error) {
        console.error('Database sync failed:', error);
    }
};

module.exports = { Exam, Seating, Admin, Student, Malpractice, syncDB };
