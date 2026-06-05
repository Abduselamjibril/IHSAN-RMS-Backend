const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'A_b0941291766',
  database: 'ihsan_db'
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');
    
    console.log('Dropping public schema...');
    await client.query('DROP SCHEMA public CASCADE;');
    console.log('Creating public schema...');
    await client.query('CREATE SCHEMA public;');
    console.log('Granting privileges on public schema...');
    await client.query('GRANT ALL ON SCHEMA public TO postgres;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    
    console.log('Database cleared successfully!');
  } catch (err) {
    console.error('Error clearing database:', err);
  } finally {
    await client.end();
  }
}

run();
