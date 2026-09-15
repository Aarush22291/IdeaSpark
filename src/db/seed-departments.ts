// Deprecated compatibility entry point.
// Use `bun run db:seed`, which seeds the complete department catalogue and
// optional tracks/event config/admin bootstrap from .env.
import "dotenv/config";
import "../scripts/seed";
