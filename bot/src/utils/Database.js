const { PrismaClient } = require('@prisma/client');
const { info, error } = require('./Console');

const prisma = new PrismaClient();

const database_prisma_setup = async () => {
    try {
        info('Database setup with Prisma completed successfully.');
    } catch (e) {
        error('Failed to setup database with Prisma:', e.message);
    } finally {
        await prisma.$disconnect();
    }
};

module.exports = { database_prisma_setup };
