// this file contains prisma code to delete all data
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function truncateAllTables() {
  try {
    await prisma.$executeRawUnsafe(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE;', r.tablename);
        END LOOP;
      END $$;
    `);

    console.log("All tables truncated and IDs reset.");
  } catch (error) {
    console.error("Error truncating tables:", error);
  } finally {
    await prisma.$disconnect();
  }
}

truncateAllTables();