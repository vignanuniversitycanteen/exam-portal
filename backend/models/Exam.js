const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Exam = sequelize.define('Exam', {
    name: { type: DataTypes.STRING, allowNull: false },
    academicYear: { type: DataTypes.STRING, allowNull: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    time: { type: DataTypes.STRING, allowNull: false },
    // Legacy fields (kept for compatibility, but allow null now potentially or handle logic)
    branch: { type: DataTypes.STRING, allowNull: true },
    year: { type: DataTypes.STRING, allowNull: true },
    start_reg: { type: DataTypes.STRING, allowNull: true },
    end_reg: { type: DataTypes.STRING, allowNull: true },

    // New Multi-Branch Support
    // Structure: [{ branch: 'CSE', year: '3rd', start_reg: '...', end_reg: '...' }, ...]
    batches: { type: DataTypes.JSON, defaultValue: [] },

    // Optional: Multiple Subjects
    subjects: { type: DataTypes.JSON, allowNull: true, defaultValue: [] }, // Stores array of strings e.g. ["Maths", "Physics"]

    room_config: { type: DataTypes.JSON, allowNull: false }, // Stores array of { name, rows, cols }
    total_seats: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.STRING, defaultValue: 'created' }, // 'created' or 'published'
    excluded_reg: { type: DataTypes.JSON, defaultValue: [] },
    archived: { type: DataTypes.BOOLEAN, defaultValue: false }
});

module.exports = Exam;
