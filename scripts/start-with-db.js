const net = require('net');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1200);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function canConnectToDb(url) {
  try {
    const { PrismaClient } = require('@prisma/client');
    const testPrisma = new PrismaClient({
      datasources: { db: { url } }
    });
    await testPrisma.$connect();
    await testPrisma.$disconnect();
    return true;
  } catch (e) {
    return false;
  }
}

async function syncAndSeed(databaseUrl) {
  try {
    console.log('🔄 Syncing Prisma schema with database...');
    execSync('npx prisma db push --skip-generate', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        DIRECT_URL: process.env.DIRECT_URL || databaseUrl
      }
    });
    console.log('✓ Database schema synchronized.');
  } catch (err) {
    console.warn('Notice: Prisma sync warning:', err.message);
  }

  try {
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    const prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } }
    });

    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('🌱 Seeding default test accounts...');
      const passwordHash = await bcrypt.hash('password123', 10);
      await prisma.user.createMany({
        data: [
          {
            email: 'user@test.com',
            name: 'Demo Trainee',
            passwordHash,
            role: 'USER'
          },
          {
            email: 'trainer@test.com',
            name: 'Demo Trainer',
            passwordHash,
            role: 'TRAINER',
            isTrainerVerified: true,
            specializations: ['Hypertrophy', 'HIIT', 'Nutrition']
          }
        ]
      });
      console.log('✓ Seeded test accounts (user@test.com / trainer@test.com, password: password123)');
    }
    await prisma.$disconnect();
  } catch (err) {
    console.warn('Notice: Seed step warning:', err.message);
  }
}

async function startLocalDatabase() {
  const isRunning = await isPortOpen(5433);
  let pgInstance = null;

  if (isRunning) {
    console.log('✓ PostgreSQL already running on port 5433.');
  } else {
    console.log('⚡ Starting local embedded PostgreSQL on port 5433...');
    const EmbeddedPostgres = require('embedded-postgres').default;
    const dbDir = path.join(__dirname, '..', '.db_data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    pgInstance = new EmbeddedPostgres({
      databaseDir: dbDir,
      port: 5433,
      user: 'postgres',
      password: 'password123',
      persistent: true
    });

    try {
      await pgInstance.initialise();
    } catch (e) {
      // already initialized
    }

    await pgInstance.start();
    console.log('✓ PostgreSQL started on port 5433.');

    try {
      await pgInstance.createDatabase('fitconnect');
      console.log('✓ Database "fitconnect" ready.');
    } catch (e) {
      // Database may already exist
    }
  }

  const localUrl = 'postgresql://postgres:password123@127.0.0.1:5433/fitconnect';
  await syncAndSeed(localUrl);

  return { pgInstance, activeUrl: localUrl };
}

async function main() {
  loadEnv();

  const configuredUrl = process.env.DATABASE_URL || '';
  const isRemote = configuredUrl && !configuredUrl.includes('127.0.0.1') && !configuredUrl.includes('localhost');

  let pgInstance = null;
  let activeDatabaseUrl = configuredUrl;

  if (isRemote) {
    console.log(`🌐 Testing connection to remote database: ${configuredUrl.replace(/:[^:@]+@/, ':****@')}`);
    const remoteOk = await canConnectToDb(configuredUrl);
    if (remoteOk) {
      console.log('✓ Connected to remote database (Supabase/PostgreSQL).');
      await syncAndSeed(configuredUrl);
    } else {
      console.warn('⚠️ Remote database unreachable (e.g. Supabase paused or offline). Falling back to local PostgreSQL...');
      const local = await startLocalDatabase();
      pgInstance = local.pgInstance;
      activeDatabaseUrl = local.activeUrl;
    }
  } else {
    const local = await startLocalDatabase();
    pgInstance = local.pgInstance;
    activeDatabaseUrl = local.activeUrl;
  }

  console.log('🚀 Launching Next.js dev server...');
  const child = spawn('npx', ['next', 'dev', '-H', '0.0.0.0'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      DATABASE_URL: activeDatabaseUrl,
      DIRECT_URL: process.env.DIRECT_URL || activeDatabaseUrl
    }
  });

  const cleanup = async () => {
    if (child && !child.killed) {
      child.kill();
    }
    if (pgInstance) {
      try {
        await pgInstance.stop();
      } catch (e) {}
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  child.on('exit', (code) => {
    if (pgInstance) {
      pgInstance.stop().then(() => process.exit(code || 0)).catch(() => process.exit(code || 0));
    } else {
      process.exit(code || 0);
    }
  });
}

main().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
