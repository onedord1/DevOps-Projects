const cron = require('node-cron');
const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'monitoring_system',
  user: process.env.DB_USER || 'monitoring',
  password: process.env.DB_PASSWORD || 'monitoring_pass',
  max: 5,
  connectionTimeoutMillis: 5000,
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

// Cleanup old status history (older than 90 days)
async function cleanupOldData() {
  const startTime = Date.now();
  console.log('🧹 Starting cleanup of old status history...');
  
  try {
    const result = await pool.query('SELECT cleanup_old_status_history()');
    const duration = Date.now() - startTime;
    console.log(`✅ Cleanup completed in ${duration}ms`);
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

// Aggregate hourly statistics
async function aggregateHourlyStats() {
  const startTime = Date.now();
  console.log('📊 Starting hourly aggregation...');
  
  try {
    // Get the previous hour
    const lastHour = new Date();
    lastHour.setHours(lastHour.getHours() - 1);
    lastHour.setMinutes(0, 0, 0);
    
    await pool.query(
      'SELECT aggregate_hourly_statistics($1)',
      [lastHour]
    );
    
    const duration = Date.now() - startTime;
    console.log(`✅ Aggregation completed in ${duration}ms for hour: ${lastHour.toISOString()}`);
  } catch (error) {
    console.error('❌ Aggregation failed:', error.message);
  }
}

// Get database statistics
async function getDatabaseStats() {
  try {
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM status_history) as total_history_records,
        (SELECT COUNT(*) FROM status_history_hourly) as total_hourly_records,
        (SELECT MIN(checked_at) FROM status_history) as oldest_record,
        (SELECT MAX(checked_at) FROM status_history) as newest_record,
        pg_size_pretty(pg_database_size(current_database())) as database_size
    `);
    
    const stats = result.rows[0];
    console.log('\n📊 Database Statistics:');
    console.log(`   Total History Records: ${stats.total_history_records}`);
    console.log(`   Total Hourly Records: ${stats.total_hourly_records}`);
    console.log(`   Oldest Record: ${stats.oldest_record}`);
    console.log(`   Newest Record: ${stats.newest_record}`);
    console.log(`   Database Size: ${stats.database_size}\n`);
  } catch (error) {
    console.error('❌ Failed to get stats:', error.message);
  }
}

// Schedule tasks
function scheduleJobs() {
  console.log('⏰ Scheduling maintenance tasks...\n');

  // Cleanup: Run daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('🕐 [2:00 AM] Running scheduled cleanup...');
    await cleanupOldData();
    await getDatabaseStats();
  }, {
    timezone: 'UTC'
  });
  console.log('✅ Cleanup job scheduled: Daily at 2:00 AM UTC');

  // Aggregation: Run every hour at :05 minutes
  cron.schedule('5 * * * *', async () => {
    console.log('🕐 [Hourly :05] Running scheduled aggregation...');
    await aggregateHourlyStats();
  }, {
    timezone: 'UTC'
  });
  console.log('✅ Aggregation job scheduled: Every hour at :05 UTC');

  // Statistics: Run every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('🕐 [Every 6 hours] Displaying statistics...');
    await getDatabaseStats();
  }, {
    timezone: 'UTC'
  });
  console.log('✅ Statistics job scheduled: Every 6 hours UTC');

  console.log('\n🚀 Maintenance scheduler is running!\n');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⚠️  SIGINT received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

// Main
async function main() {
  console.log('🚀 Maintenance Scheduler Starting...\n');
  
  // Test database connection
  await testConnection();
  
  // Show initial statistics
  await getDatabaseStats();
  
  // Run initial aggregation for the last hour (if not already done)
  console.log('📊 Running initial aggregation...');
  await aggregateHourlyStats();
  
  // Schedule recurring jobs
  scheduleJobs();
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
