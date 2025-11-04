# Manual Steps Required Before Testing

## Important: Complete These Steps First

Before running `typecheck`, `lint`, or `build`, you must complete these installation steps:

### 1. Install NPM Packages (REQUIRED)

The following packages need to be installed:

```bash
pnpm add resend nodemailer
pnpm add -D @types/nodemailer
```

These packages are required for the email service infrastructure.

### 2. Run Database Migration (REQUIRED)

A new `token` field has been added to the `invitation` table. You must generate and run the migration:

```bash
pnpm db:generate
pnpm db:migrate
```

This will add the `token` column to your database.

### 3. Configure Environment Variables (REQUIRED)

Add email configuration to your `.env` file. Copy from `.env.example`:

```env
# Email Configuration
EMAIL_PROVIDER="auto"
EMAIL_FROM="noreply@your-domain.com"

# Mailpit (Development)
SMTP_HOST="localhost"
SMTP_PORT="1025"

# Resend (Production)
RESEND_API_KEY="re_your_api_key"
```

### 4. Install and Run Mailpit (RECOMMENDED for Development)

For testing emails in development, install and run Mailpit:

**Install:**
```bash
# macOS
brew install mailpit

# Linux
sudo bash < <(curl -sL https://raw.githubusercontent.com/axllent/mailpit/develop/install.sh)

# Windows: Download from https://github.com/axllent/mailpit/releases

# Docker
docker run -d --name mailpit -p 8025:8025 -p 1025:1025 axllent/mailpit
```

**Run:**
```bash
mailpit
```

**Access Web UI:** http://localhost:8025

### 5. After Completing Steps 1-3, Run Quality Checks

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Build
pnpm build

# Run tests
pnpm test
```

## What Was Implemented

A complete invite member feature with:

1. **Email Service Infrastructure**:
   - Strategy Pattern for email abstraction
   - Mailpit SMTP service (development)
   - Resend API service (production)
   - Automatic environment detection

2. **Invitation System**:
   - Secure token generation (SHA-256)
   - Email templates (HTML + plain text)
   - Token verification and expiration
   - Invitation acceptance flow

3. **UI Components**:
   - Invitation acceptance page (`/invite/accept`)
   - Email sending integration in `/members` page

4. **Database**:
   - Added `token` field to `invitation` table
   - Added index for efficient token lookups

5. **Tests**:
   - Email factory tests
   - Token utility tests
   - Email template tests

6. **Documentation**:
   - `docs/EMAIL_SETUP.md` - Complete setup guide
   - `docs/INVITE_MEMBER_IMPLEMENTATION.md` - Implementation details

## Quick Test After Setup

1. Start Mailpit: `mailpit`
2. Start dev server: `pnpm dev`
3. Go to `/members` page
4. Click "Invite User"
5. Enter email and role
6. Click "Send Invitation"
7. Check Mailpit UI at http://localhost:8025
8. Click invitation link in email
9. Accept invitation
10. Verify member added to organization

## Files Changed

**Created (17 files):**
- Email service infrastructure (6 files)
- Email templates (3 files)
- Token utilities (1 file)
- Server actions (1 file)
- Invitation page (1 file)
- Tests (3 files)
- Documentation (2 files)

**Modified (3 files):**
- `organization.schema.ts` - Added token field
- `member-actions.ts` - Added email sending
- `.env.example` - Added email config

## Need Help?

See `docs/EMAIL_SETUP.md` for detailed setup instructions and troubleshooting.
