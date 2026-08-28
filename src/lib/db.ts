// Dynamic imports for sqlite3 are used in the fallback block to prevent GLIBC version errors in production.
import path from 'path';
import fs from 'fs';
import pg from 'pg';

let dbInstance: any = null;
let isPostgres = false;

export async function getDb(): Promise<any> {
  if (dbInstance) return dbInstance;

  // Use PostgreSQL if DATABASE_URL is available
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    console.log('🔌 Connecting to PostgreSQL database...');
    const pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Create a compatibility wrapper for sqlite-like executions
    const pgDb = {
      isPostgres: true,
      pool,
      async exec(sql: string) {
        // Convert SQLite types to Postgres equivalents
        let pgSql = sql
          .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
          .replace(/INTEGER DEFAULT 0/gi, 'INTEGER DEFAULT 0')
          .replace(/PRAGMA foreign_keys = ON;/gi, '') // PRAGMA is SQLite only
          .replace(/AUTOINCREMENT/gi, 'SERIAL')
          .replace(/TEXT PRIMARY KEY/gi, 'VARCHAR(255) PRIMARY KEY')
          .replace(/image_data TEXT/gi, 'image_data TEXT')
          .replace(/biometric_registered INTEGER/gi, 'biometric_registered INTEGER')
          .replace(/bg_removed INTEGER/gi, 'bg_removed INTEGER')
          .replace(/is_default INTEGER/gi, 'is_default INTEGER');
        
        await pool.query(pgSql);
      },
      async run(sql: string, params: any[] = []) {
        // Convert sqlite query placeholders (? -> $1, $2)
        let index = 1;
        const pgSql = sql.replace(/\?/g, () => `$${index++}`);
        const result = await pool.query(pgSql, params);
        return { lastID: null, changes: result.rowCount };
      },
      async get(sql: string, params: any[] = []) {
        let index = 1;
        const pgSql = sql.replace(/\?/g, () => `$${index++}`);
        const result = await pool.query(pgSql, params);
        return result.rows[0] || null;
      },
      async all(sql: string, params: any[] = []) {
        let index = 1;
        const pgSql = sql.replace(/\?/g, () => `$${index++}`);
        const result = await pool.query(pgSql, params);
        return result.rows;
      }
    };

    // Initialize Postgres tables
    await pgDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar TEXT,
        biometric_registered INTEGER DEFAULT 0,
        biometric_credential_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS wardrobes (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        is_default INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS clothes (
        id VARCHAR(255) PRIMARY KEY,
        wardrobe_id VARCHAR(255) NOT NULL,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        size TEXT NOT NULL,
        color TEXT NOT NULL,
        image_data TEXT NOT NULL,
        bg_removed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wardrobe_id) REFERENCES wardrobes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS access_requests (
        id VARCHAR(255) PRIMARY KEY,
        requester_id VARCHAR(255) NOT NULL,
        owner_id VARCHAR(255) NOT NULL,
        wardrobe_id VARCHAR(255) NOT NULL,
        status TEXT DEFAULT 'pending',
        granted_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (wardrobe_id) REFERENCES wardrobes(id) ON DELETE CASCADE
      );
    `);

    dbInstance = pgDb;
    isPostgres = true;
    return dbInstance;
  }

  // Fallback to SQLite locally
  console.log('💾 Connecting to SQLite local database...');
  const sqlite3 = (await import('sqlite3')).default;
  const { open } = await import('sqlite');
  
  const dbPath = path.join(process.cwd(), 'fauve.sqlite');
  
  const sqliteDb = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await sqliteDb.exec('PRAGMA foreign_keys = ON;');

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      biometric_registered INTEGER DEFAULT 0,
      biometric_credential_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS wardrobes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS clothes (
      id TEXT PRIMARY KEY,
      wardrobe_id TEXT NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      size TEXT NOT NULL,
      color TEXT NOT NULL,
      image_data TEXT NOT NULL,
      bg_removed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (wardrobe_id) REFERENCES wardrobes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS access_requests (
      id TEXT PRIMARY KEY,
      requester_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      wardrobe_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      granted_until DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (wardrobe_id) REFERENCES wardrobes(id) ON DELETE CASCADE
    );
  `);

  // Ensure usrnp folder exists
  const usrnpDir = path.join(process.cwd(), 'usrnp');
  if (!fs.existsSync(usrnpDir)) {
    fs.mkdirSync(usrnpDir, { recursive: true });
  }

  dbInstance = sqliteDb;
  return dbInstance;
}
