const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

// Windows Authentication config using msnodesqlv8 driver
// Uses ODBC Driver 17 for SQL Server (verified installed on this machine)
const dbConfig = {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=${process.env.DB_NAME};Trusted_Connection=yes;`,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// This creates ONE connection pool shared across the whole app
// (much faster than opening a new connection for every request)
let poolPromise;

const getPool = () => {
    if (!poolPromise) {
        poolPromise = new sql.ConnectionPool(dbConfig)
            .connect()
            .then(pool => {
                console.log('Connected to SQL Server successfully');
                return pool;
            })
            .catch(err => {
                console.error('SQL Server connection failed:', err);
                poolPromise = null;
                throw err;
            });
    }
    return poolPromise;
};

module.exports = { getPool, sql };