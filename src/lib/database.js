import pg from "pg";

const { Pool } = pg;

// Parse decimal/numeric columns (type OID 1700) as float
pg.types.setTypeParser(1700, function(val) {
  return parseFloat(val);
});

// Parse bigint columns (type OID 20) as integer
pg.types.setTypeParser(20, function(val) {
  return parseInt(val, 10);
});

// We will parse connection details from DATABASE_URL or fallback to individual parameters
const connectionString = process.env.DATABASE_URL;

const pgConfig = connectionString ? {
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
} : {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  ssl: {
    rejectUnauthorized: false
  }
};

const pgPool = new Pool(pgConfig);

// Helper function to translate MySQL SQL to Postgres SQL
export function mysqlToPostgresSql(sql) {
  if (typeof sql !== 'string') return sql;

  // 1. Remove backticks
  let cleanSql = sql.replace(/`/g, '');

  // 2. Translate table/column modifiers and types if they are inside CREATE TABLE
  cleanSql = cleanSql.replace(/ENGINE=InnoDB\s*(DEFAULT\s+CHARSET=utf8mb4\s*(COLLATE=utf8mb4_unicode_ci)?)?/gi, '');
  cleanSql = cleanSql.replace(/\bDEFAULT\s*\(UUID\(\)\)/gi, "DEFAULT (gen_random_uuid()::text)");
  cleanSql = cleanSql.replace(/\bUUID\(\)/gi, "gen_random_uuid()::text");
  cleanSql = cleanSql.replace(/ON\s+UPDATE\s+CURRENT_TIMESTAMP/gi, '');
  
  // Replace ENUM definitions with VARCHAR
  cleanSql = cleanSql.replace(/\bENUM\s*\(([^)]+)\)/gi, 'VARCHAR(50)');

  // 3. Replace boolean integer values for is_active columns
  cleanSql = cleanSql.replace(/\bis_active\s*=\s*1\b/gi, 'is_active = true');
  cleanSql = cleanSql.replace(/\bis_active\s*=\s*0\b/gi, 'is_active = false');
  cleanSql = cleanSql.replace(/\bis_active\s*=\s*TRUE\b/gi, 'is_active = true');
  cleanSql = cleanSql.replace(/\bis_active\s*=\s*FALSE\b/gi, 'is_active = false');
  cleanSql = cleanSql.replace(/\b([\w.]+)\.is_active\s*=\s*1\b/gi, '$1.is_active = true');
  cleanSql = cleanSql.replace(/\b([\w.]+)\.is_active\s*=\s*0\b/gi, '$1.is_active = false');

  // 4. Ignore FOREIGN_KEY_CHECKS queries
  if (/SET\s+FOREIGN_KEY_CHECKS/i.test(cleanSql)) {
    return 'SELECT 1'; // Mock the query
  }

  // Replace RAND() with random() for PostgreSQL
  cleanSql = cleanSql.replace(/\bRAND\s*\(\s*\)/gi, 'random()');

  // 5. Replace '?' placeholders with '$1', '$2', '$3', etc.
  let result = '';
  let paramIndex = 1;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  
  for (let i = 0; i < cleanSql.length; i++) {
    const char = cleanSql[i];
    
    if (char === "'" && cleanSql[i - 1] !== '\\') {
      if (!inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
      }
      result += char;
    } else if (char === '"' && cleanSql[i - 1] !== '\\') {
      if (!inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
      }
      result += char;
    } else if (char === '?') {
      if (inSingleQuote || inDoubleQuote) {
        result += char;
      } else {
        result += '$' + paramIndex;
        paramIndex++;
      }
    } else {
      result += char;
    }
  }

  return result;
}

export function cleanParams(params) {
  if (!params) return [];
  return params.map(param => (param === undefined ? null : param));
}

class PostgresConnection {
  constructor(pgClient) {
    this.client = pgClient;
  }

  async beginTransaction() {
    await this.client.query('BEGIN');
  }

  async commit() {
    await this.client.query('COMMIT');
  }

  async rollback() {
    await this.client.query('ROLLBACK');
  }

  async execute(sql, params) {
    const pgSql = mysqlToPostgresSql(sql);
    const pgParams = cleanParams(params);
    const res = await this.client.query(pgSql, pgParams);
    
    // Compatibility mapping
    const rows = res.rows || [];
    rows.affectedRows = res.rowCount;
    rows.insertId = null;
    return [rows, res.fields];
  }

  async ping() {
    await this.client.query('SELECT 1');
  }

  release() {
    this.client.release();
  }
}

class PostgresPool {
  constructor(poolInstance) {
    this.pool = poolInstance;
  }

  async execute(sql, params) {
    const pgSql = mysqlToPostgresSql(sql);
    const pgParams = cleanParams(params);
    const res = await this.pool.query(pgSql, pgParams);
    
    // Compatibility mapping
    const rows = res.rows || [];
    rows.affectedRows = res.rowCount;
    rows.insertId = null;
    return [rows, res.fields];
  }

  async getConnection() {
    const client = await this.pool.connect();
    return new PostgresConnection(client);
  }

  async end() {
    await this.pool.end();
  }
}

const pool = new PostgresPool(pgPool);

// Generate unique ID function
export function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Test database connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ PostgreSQL connection successful');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    return false;
  }
}

export default pool;
