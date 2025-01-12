const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { info, error } = require('../../utils/Console');

class SQLite {
    constructor(databasePath = 'database.sqlite') {
        this.dbPath = path.resolve(databasePath);
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                error('Failed to connect to database:', err.message);
            } else {
                info('Connected to SQLite database.');
            }
        });
    }

    /**
     * รันคำสั่ง SQL (INSERT, UPDATE, DELETE)
     * @param {string} query - คำสั่ง SQL
     * @param {Array} params - พารามิเตอร์สำหรับคำสั่ง SQL
     * @returns {Promise<object>} - คืนค่าข้อมูล เช่น lastID หรือ changes
     */
    run(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(query, params, function (err) {
                if (err) {
                    return reject(err);
                }
                resolve(this); // คืนค่าข้อมูล เช่น lastID หรือ changes
            });
        });
    }

    /**
     * ดึงข้อมูลทั้งหมด (SELECT)
     * @param {string} query คำสั่ง SQL
     * @param {Array} params - พารามิเตอร์สำหรับคำสั่ง SQL
     * @returns {Promise<Array>} - คืนค่าข้อมูลทั้งหมดในรูปแบบ Array
     */
    all(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    /**
     * ดึงข้อมูลแถวเดียว (SELECT LIMIT 1)
     * @param {string} query - คำสั่ง SQL
     * @param {Array} params - พารามิเตอร์สำหรับคำสั่ง SQL
     * @returns {Promise<object>} - คืนค่าแถวเดียวในรูปแบบ Object
     */
    get(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(query, params, (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
    }

    /**
     * ปิดการเชื่อมต่อฐานข้อมูล
     * @returns {Promise<void>}
     */
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    return reject(err);
                }
                info('Database connection closed.');
                resolve();
            });
        });
    }
}

module.exports = SQLite;
