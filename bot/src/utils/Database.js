const { PrismaClient } = require('@prisma/client');
const { info, error } = require('./Console');

const prisma = new PrismaClient();

const database_prisma_setup = async () => {
    try {
        await prisma.$connect();
        info('Database setup with Prisma completed successfully.');
    } catch (e) {
        error('Failed to setup database with Prisma:', e.message);
    }
};

module.exports = { database_prisma_setup, prisma };
