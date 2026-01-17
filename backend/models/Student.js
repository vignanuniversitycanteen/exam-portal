const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Student = sequelize.define('Student', {
    google_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    username: { // Derived from email part before @
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    is_email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    email_verification_otp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email_verification_expires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'student'
    },
    // Academic Details
    reg_no: {
        type: DataTypes.STRING,
        allowNull: true
    },
    current_year: {
        type: DataTypes.STRING,
        allowNull: true
    },
    section: {
        type: DataTypes.STRING,
        allowNull: true
    },
    branch: {
        type: DataTypes.STRING,
        allowNull: true
    },
    academic_start: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    academic_end: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // Personal Details
    mobile_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dob: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    is_profile_complete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

module.exports = Student;
