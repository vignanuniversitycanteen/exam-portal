const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Admin = sequelize.define('Admin', {
    employee_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('main_admin', 'sub_admin'),
        defaultValue: 'sub_admin'
    },
    permissions: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    mfa_secret: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_mfa_setup: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    backup_codes: {
        type: DataTypes.JSON,
        defaultValue: []
    }
});

module.exports = Admin;
