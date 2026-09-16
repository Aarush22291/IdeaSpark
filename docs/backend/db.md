# Schemas
Find your schemas [here](/src/db/schema.ts).

# Seed and Query the Database
[Documentation](https://orm.drizzle.team/docs/get-started/neon-new#step-7---seed-and-query-the-database).

# Applying Changes to DB
You can directly apply changes to your database using the `drizzle-kit push` command.
```bash
bunx drizzle-kit push
```
___

TIPS:
Alternatively, you can generate migrations using the `drizzle-kit generate` command and then apply them using the `drizzle-kit migrate` command:

Generate migrations:
```bash
npx drizzle-kit generate
```

Apply migrations:
```bash
npx drizzle-kit migrate
```

Read more about migration process in [documentation](https://orm.drizzle.team/docs/kit-overview).
___