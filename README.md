# Setting Up Locally
## Cloning the repo
```bash
git clone https://github.com/founder-srm/IdeaSpark.git ./ideaspark
cd ideaspark
```

## Installing Dependencies
Like `npm` we use a different package manager [bun](https://bun.com/). Click [here](https://bun.com/docs/installation) to install bun.
```bash
bun i
```

## Accessing ENVs
Click [here](https://docs.doppler.com/docs/install-cli) to install the doppler CLI for your OS.

Once installed, check using the `doppler --version` command.

### Authenticate:
```bash
doppler login
```

### Project Setup:
```bash
# Change to your project's directory
cd ./ideaspark

# Select project and config
doppler setup
```

### Local Dev Server:
```bash
doppler run -- bun dev
```
## Database

The IdeaSpark database schema is defined in `src/db/schema.ts` and follows the backend PRD. See `docs/backend/db.md` for migration, seed, and environment instructions.
