import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  createPool,
  type Pool,
  type PoolConnection,
  type RowDataPacket,
} from "mysql2/promise";
import { hashPassword } from "./password";

export interface CarInput {
  name: string;
  price: number;
  image: string;
  mileage: string;
  seats: string;
  rating: string;
}

export interface BookingInput {
  name: string;
  price: number;
  mileage: string;
  seats: string;
  rating: string;
  image: string;
}

interface LegacyUser {
  username?: string;
  password?: string;
  role?: string;
}

interface LegacyData<T> {
  [key: string]: T[] | undefined;
}

interface CountRow extends RowDataPacket {
  count: number;
}

let pool: Pool | undefined;
let ready: Promise<void> | undefined;

export class DatabaseConfigurationError extends Error {}

export function getDatabaseErrorMessage(error: unknown): string {
  if (error instanceof DatabaseConfigurationError) return error.message;

  const code =
    typeof error === "object" && error !== null && "code" in error &&
    typeof error.code === "string"
      ? error.code
      : undefined;

  const message =
    typeof error === "object" && error !== null && "message" in error &&
    typeof error.message === "string"
      ? error.message
      : "";

  switch (code) {
    case "ER_ACCESS_DENIED_ERROR":
      return `MySQL rejected credentials (${message}). Check username and password in Railway.`;
    case "ER_BAD_DB_ERROR":
      return `The database does not exist (${message}). Check database name in Railway.`;
    case "ER_TABLEACCESS_DENIED_ERROR":
      return `The MySQL account lacks permissions (${message}).`;
    case "ECONNREFUSED":
    case "ETIMEDOUT":
    case "ENOTFOUND":
      return `Cannot reach MySQL (${code}: ${message}). Ensure MySQL service is online and latest variables are deployed.`;
    default:
      return `Database error (${code || "UNKNOWN"}): ${message || "Check Railway deployment logs."}`;
  }
}

async function readLegacyData<T>(filename: string, key: string): Promise<T[]> {
  try {
    const content = await readFile(path.join(process.cwd(), "data", filename), "utf8");
    const parsed = JSON.parse(content) as LegacyData<T>;
    const rows = parsed[key];
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function seedLegacyData(connection: PoolConnection) {
  const [users] = await connection.execute<CountRow[]>(
    "SELECT COUNT(*) AS count FROM users"
  );
  if (Number(users[0].count) === 0) {
    const legacyUsers = await readLegacyData<LegacyUser>("db.json", "user");
    for (const user of legacyUsers) {
      const username = user.username?.trim();
      if (!username || !user.password) continue;
      await connection.execute(
        `INSERT IGNORE INTO users (username, password_hash, role)
         VALUES (?, ?, ?)`,
        [username, hashPassword(user.password), user.role === "admin" ? "admin" : "user"]
      );
    }
  }

  const [cars] = await connection.execute<CountRow[]>(
    "SELECT COUNT(*) AS count FROM cars"
  );
  if (Number(cars[0].count) === 0) {
    const legacyCars = await readLegacyData<Partial<CarInput>>("cardetails.json", "cars");
    for (const car of legacyCars) {
      if (!car.name) continue;
      const price = Number(car.price);
      await connection.execute(
        `INSERT INTO cars (name, price, image, mileage, seats, rating)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          car.name,
          Number.isFinite(price) ? price : 0,
          car.image ?? "/placeholder.jpg",
          car.mileage ?? "",
          car.seats ?? "",
          car.rating ?? "",
        ]
      );
    }
  }

  const [bookings] = await connection.execute<CountRow[]>(
    "SELECT COUNT(*) AS count FROM bookings"
  );
  if (Number(bookings[0].count) === 0) {
    const legacyBookings = await readLegacyData<Record<string, unknown>>("booking.json", "booking");
    for (const booking of legacyBookings) {
      const price = Number(booking.total ?? booking.price);
      const bookedAt = typeof booking.bookedAt === "string" ? new Date(booking.bookedAt) : null;
      if (bookedAt && !Number.isFinite(bookedAt.getTime())) {
        throw new Error("Legacy booking contains an invalid bookedAt date.");
      }
      await connection.execute(
        `INSERT INTO bookings (car_details, total_amount, payment_method, status, created_at)
         VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
        [
          JSON.stringify(booking),
          Number.isFinite(price) ? price : null,
          typeof booking.payment === "string" ? booking.payment : null,
          booking.payment ? "confirmed" : "pending",
          bookedAt,
        ]
      );
    }
  }
}

async function seedAdmin(connection: PoolConnection) {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!username && !password) return;
  if (!username || !password) {
    throw new DatabaseConfigurationError(
      "Set both ADMIN_USERNAME and ADMIN_PASSWORD in .env.local to bootstrap an admin account."
    );
  }
  if (username.length < 3 || username.length > 50) {
    throw new DatabaseConfigurationError(
      "ADMIN_USERNAME must be 3-50 characters to bootstrap an admin account."
    );
  }

  const [existingUsers] = await connection.execute<RowDataPacket[]>(
    "SELECT role FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1",
    [username]
  );
  if (existingUsers[0]) {
    if (existingUsers[0].role !== "admin") {
      throw new DatabaseConfigurationError(
        "ADMIN_USERNAME is already used by a non-admin account. Choose a different username."
      );
    }
    return;
  }

  if (password.length < 4) {
    throw new DatabaseConfigurationError(
      "ADMIN_PASSWORD must be at least 4 characters to create an admin account. Update it in .env.local."
    );
  }

  await connection.execute(
    "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')",
    [username, hashPassword(password)]
  );
}

async function initialize(database: Pool) {
  const connection = await database.getConnection();
  let transactionStarted = false;
  let lockAcquired = false;
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL COLLATE utf8mb4_unicode_ci,
        password_hash VARCHAR(200) NOT NULL,
        role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY users_username_unique (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cars (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        image TEXT NOT NULL,
        mileage VARCHAR(100) NOT NULL DEFAULT '',
        seats VARCHAR(100) NOT NULL DEFAULT '',
        rating VARCHAR(100) NOT NULL DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        car_details JSON NOT NULL,
        total_amount DECIMAL(12, 2) NULL,
        payment_method VARCHAR(32) NULL,
        pickup_date DATE NULL,
        return_date DATE NULL,
        status ENUM('pending', 'confirmed') NOT NULL DEFAULT 'pending',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT bookings_user_id_fk
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [locks] = await connection.execute<RowDataPacket[]>(
      "SELECT GET_LOCK(?, 10) AS acquired",
      ["car_rental_seed"]
    );
    if (Number(locks[0].acquired) !== 1) {
      throw new Error("Could not acquire the database initialization lock.");
    }
    lockAcquired = true;

    await connection.beginTransaction();
    transactionStarted = true;
    await seedLegacyData(connection);
    await seedAdmin(connection);
    await connection.commit();
    transactionStarted = false;
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    try {
      if (lockAcquired) {
        await connection.execute("SELECT RELEASE_LOCK(?)", ["car_rental_seed"]);
      }
    } finally {
      connection.release();
    }
  }
}

function poolOptions() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.MYSQL_URL ||
    process.env.MYSQL_PUBLIC_URL;

  if (connectionString) {
    try {
      const url = new URL(connectionString);
      return {
        host: url.hostname,
        port: Number(url.port || 3306),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: decodeURIComponent(url.pathname.slice(1)),
        waitForConnections: true,
        connectionLimit: 10,
        connectTimeout: 15000,
        enableKeepAlive: true,
      };
    } catch {
      // Fall through to individual environment variables
    }
  }

  const host = process.env.MYSQLHOST || process.env.DB_HOST;
  const port = Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306);
  const user = process.env.MYSQLUSER || process.env.DB_USER;
  const password = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "";
  const database = process.env.MYSQLDATABASE || process.env.DB_NAME;

  if (host && user && database) {
    return {
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 15000,
      enableKeepAlive: true,
    };
  }

  throw new DatabaseConfigurationError(
    "MySQL is not configured. Set DATABASE_URL or link MySQL in Railway Variables."
  );
}

export async function getDb(): Promise<Pool> {
  pool ??= createPool(poolOptions());
  if (!ready) {
    ready = initialize(pool).catch((error: unknown) => {
      ready = undefined;
      console.error("Database connection initialization failed:", error);
      throw error;
    });
  }
  await ready;
  return pool;
}
