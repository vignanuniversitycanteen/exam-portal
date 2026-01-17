const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const Exam = require('./Exam');

const Seating = sequelize.define('Seating', {
    student_reg: { type: DataTypes.STRING, allowNull: false },
    room_name: { type: DataTypes.STRING, allowNull: false },
    seat_number: { type: DataTypes.STRING, allowNull: false },
    row: { type: DataTypes.INTEGER },
    col: { type: DataTypes.INTEGER },
});

// Associations
Exam.hasMany(Seating, { onDelete: 'CASCADE' });
Seating.belongsTo(Exam);

module.exports = Seating;
