const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Exam = require('./Exam');

const Malpractice = sequelize.define('Malpractice', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    student_reg: {
        type: DataTypes.STRING,
        allowNull: false
    },
    exam_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    severity: {
        type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
        defaultValue: 'Medium'
    },
    reported_by: {
        type: DataTypes.STRING, // Store username or ID of admin
        allowNull: true
    },
    action_taken: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'malpractice_logs',
    timestamps: true
});

// Associations
Exam.hasMany(Malpractice, { foreignKey: 'exam_id', onDelete: 'CASCADE' });
Malpractice.belongsTo(Exam, { foreignKey: 'exam_id' });

module.exports = Malpractice;
