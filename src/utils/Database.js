const SQLite = require("../client/handler/DatabaseHandler");
const { info, error } = require("./Console");

const database_sqlite_setup = (async () => {
    const db = new SQLite()
    try {
        await db.run(`
            CREATE TABLE IF NOT EXISTS tickets (
                guild_id TEXT PRIMARY KEY,
                category_id TEXT,
                role_id TEXT NOT NULL,
                channel_id TEXT NOT NULL
            )
        `);

        await db.run(`
            CREATE TABLE IF NOT EXISTS ticket_logs (
                logs_id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                guild_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                created_by TEXT NOT NULL,
                channel_id TEXT NOT NULL,
                status TEXT DEFAULT 'open', -- สถานะ: 'open', 'closed',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                closed_at TEXT,
                FOREIGN KEY (guild_id) REFERENCES tickets(guild_id) ON DELETE CASCADE
                )
            `)

        await db.run(`
            CREATE TABLE IF NOT EXISTS message_logs (
                message_id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                content TEXT,
                created_at TEXT NOT NULL,
                fetch_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES ticket_logs(ticket_id) ON DELETE CASCADE
                )
            `)

        info('Ticket table created successfully.');
    } catch (e) {
        error('Failed to create table:', e.message);
    }
})();

module.exports = { database_sqlite_setup }