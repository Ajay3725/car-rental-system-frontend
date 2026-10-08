# Car rental

This is a Next.js car-rental application.

## MySQL setup

The application stores users, cars, and bookings in MySQL. In MySQL Workbench, run
[`database/create-database.sql`](./database/create-database.sql) to create the `car_rental`
database. Create a MySQL account for the app (or use an existing account) and grant it
access to this database. For a new local account, replace the placeholder password
before running:

```sql
CREATE USER 'car_rental_app'@'127.0.0.1' IDENTIFIED BY 'replace-with-a-strong-password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, REFERENCES
  ON car_rental.* TO 'car_rental_app'@'127.0.0.1';
```

Copy `.env.example` to `.env.local`, then set `DATABASE_URL` to your MySQL
connection and replace its example password. URL-encode special characters in the
username or password (for example, `@` as `%40`).

Set `SESSION_SECRET` to a random secret of at least 32 characters. To create an initial
administrator, also set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env.local`. The
administrator is added only if that username does not already exist; use a password of
at least 12 characters. If that username already belongs to a non-admin account,
initialization reports an error instead of changing its role. Leave both variables
empty if you do not want to bootstrap an administrator from the environment.

Generate a session secret with Node.js:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

On its first database connection, the app creates the users, cars, and bookings tables
and imports existing JSON users, cars, and bookings when their corresponding tables are
empty. Account passwords are stored as salted scrypt hashes, never as plaintext. Keep
`.env.local` private and do not commit it.

Install dependencies and start the application:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
