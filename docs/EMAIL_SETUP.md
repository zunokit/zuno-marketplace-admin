# Email Service Setup Guide

This guide explains how to set up email services for the Zuno Marketplace Admin dashboard.

## Overview

The application uses a **Strategy Pattern** to abstract email sending, with automatic environment detection:

- **Development**: Uses Mailpit (local SMTP server) for testing
- **Production**: Uses Resend API for reliable email delivery

## Quick Start

### 1. Install Required Packages

```bash
pnpm add resend nodemailer
pnpm add -D @types/nodemailer
```

### 2. Configure Environment Variables

Copy the email configuration from `.env.example` to your `.env` file:

```env
# Email Provider (auto-detects by default)
EMAIL_PROVIDER="auto"
EMAIL_FROM="noreply@your-domain.com"

# Mailpit (Development)
SMTP_HOST="localhost"
SMTP_PORT="1025"

# Resend (Production)
RESEND_API_KEY="re_your_resend_api_key"
```

### 3. Set Up Development Environment (Mailpit)

#### Install Mailpit

**macOS (Homebrew):**
```bash
brew install mailpit
```

**Linux:**
```bash
# Download latest release
sudo bash < <(curl -sL https://raw.githubusercontent.com/axllent/mailpit/develop/install.sh)
```

**Windows:**
Download the latest release from: https://github.com/axllent/mailpit/releases

**Docker:**
```bash
docker run -d --name mailpit -p 8025:8025 -p 1025:1025 axllent/mailpit
```

#### Run Mailpit

```bash
mailpit
```

Mailpit will start:
- SMTP server on port **1025**
- Web UI on http://localhost:8025

#### Access Web UI

Open http://localhost:8025 in your browser to view sent emails.

### 4. Set Up Production Environment (Resend)

1. **Sign up for Resend**: https://resend.com/signup
2. **Get API Key**: https://resend.com/api-keys
3. **Add to .env**:
   ```env
   RESEND_API_KEY="re_your_api_key_here"
   ```
4. **Verify domain** (for production): https://resend.com/domains

## Architecture

### Email Service Structure

```
src/lib/infrastructure/external/email/
├── base-email.service.ts          # Abstract base class
├── mailpit-smtp.service.ts        # Mailpit SMTP implementation
├── resend.service.ts              # Resend API implementation
├── email.factory.ts               # Factory with auto-detection
└── templates/
    ├── base.template.ts           # Base email layout
    └── invitation.template.ts     # Invitation email template
```

### Strategy Pattern

The application uses the **Strategy Pattern** for email service abstraction:

1. **IEmailService**: Interface defining email operations
2. **BaseEmailService**: Abstract class with common functionality
3. **MailpitSmtpService**: SMTP implementation for development
4. **ResendService**: API implementation for production
5. **EmailServiceFactory**: Factory with environment auto-detection

### Auto-Detection Logic

The email service is automatically selected based on:

1. **EMAIL_PROVIDER** env variable (override):
   - `mailpit`: Force Mailpit SMTP
   - `resend`: Force Resend API
   - `auto`: Auto-detect (default)

2. **Auto-detection** (when `EMAIL_PROVIDER="auto"`):
   - Development (`NODE_ENV=development`): Uses Mailpit
   - Production (`NODE_ENV=production`):
     - If `RESEND_API_KEY` is set: Uses Resend
     - Otherwise: Falls back to Mailpit

## Usage

### Sending Emails

```typescript
import { getEmailService } from '@/lib/infrastructure/external/email'

// Get email service (automatically selected)
const emailService = getEmailService()

// Send email
const result = await emailService.send({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<p>Hello!</p>',
  text: 'Hello!',
})

if (result.success) {
  console.log('Email sent:', result.messageId)
} else {
  console.error('Email failed:', result.error)
}
```

### Using Email Templates

```typescript
import { invitationEmailTemplate } from '@/lib/infrastructure/external/email/templates'
import { getEmailService } from '@/lib/infrastructure/external/email'

// Generate email from template
const { html, text, subject } = invitationEmailTemplate({
  inviterName: 'John Doe',
  organizationName: 'My Project',
  role: 'admin',
  invitationUrl: 'https://app.example.com/invite/accept?id=123&token=abc',
  expiresInDays: 7,
})

// Send email
const emailService = getEmailService()
await emailService.send({
  to: 'invitee@example.com',
  subject,
  html,
  text,
})
```

## Testing

### Unit Tests

Run email service tests:

```bash
pnpm test src/lib/infrastructure/external/email
pnpm test src/lib/utils/__tests__/invitation-token.test.ts
```

### Manual Testing (Development)

1. **Start Mailpit**:
   ```bash
   mailpit
   ```

2. **Send test invitation**:
   - Go to `/members` in the app
   - Click "Invite User"
   - Enter email and role
   - Click "Send Invitation"

3. **View email in Mailpit**:
   - Open http://localhost:8025
   - Check the inbox for the invitation email
   - Click email to view HTML and plain text versions

### Testing Production (Resend)

1. **Set up Resend in development**:
   ```env
   EMAIL_PROVIDER="resend"
   RESEND_API_KEY="re_your_api_key"
   ```

2. **Use Resend test email**:
   - Resend accepts test emails to `delivered@resend.dev`
   - These emails won't be actually sent

3. **Send test invitation**:
   - Invite `delivered@resend.dev`
   - Check Resend dashboard for delivery status

## Invitation Flow

### 1. Send Invitation

**Server Action**: `inviteUserAction(organizationId, email, role)`

1. Validates user permissions (admin/owner only)
2. Checks for existing member or pending invitation
3. Generates secure invitation token
4. Creates invitation record with hashed token
5. Sends invitation email with acceptance link
6. Deletes invitation if email fails to send

### 2. Accept Invitation

**Page**: `/invite/accept?id={invitationId}&token={token}`

1. User clicks invitation link in email
2. Page loads invitation details
3. User clicks "Accept Invitation"
4. Token is verified against stored hash
5. User is added to organization with specified role
6. Invitation marked as "accepted"
7. User redirected to dashboard

### Security

- **Tokens**: Cryptographically secure (32 bytes)
- **Hashing**: SHA-256 hash stored in database
- **Expiration**: Invitations expire after 7 days
- **Verification**: Token must match hash and email
- **One-time use**: Invitation marked as accepted

## Troubleshooting

### Mailpit not receiving emails

**Check Mailpit is running**:
```bash
mailpit
```

**Verify SMTP settings**:
```env
SMTP_HOST="localhost"
SMTP_PORT="1025"
```

**Check logs**: Application logs will show email sending attempts

### Resend API errors

**Check API key is valid**:
- Go to https://resend.com/api-keys
- Verify key is active and not expired

**Check domain verification**:
- Go to https://resend.com/domains
- Ensure your domain is verified (for production)

**Check rate limits**:
- Free tier: 100 emails/day
- Paid tier: Higher limits

### Email service not configured

**Error**: "Email service is not properly configured"

**Solution**:
- For Mailpit: Ensure Mailpit is running
- For Resend: Ensure `RESEND_API_KEY` is set

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_PROVIDER` | No | `auto` | Email provider: `auto`, `mailpit`, or `resend` |
| `EMAIL_FROM` | No | `noreply@example.com` | Default "from" email address |
| `SMTP_HOST` | No | `localhost` | Mailpit SMTP host |
| `SMTP_PORT` | No | `1025` | Mailpit SMTP port |
| `SMTP_USER` | No | - | SMTP username (optional) |
| `SMTP_PASS` | No | - | SMTP password (optional) |
| `RESEND_API_KEY` | Production | - | Resend API key |

## Additional Resources

- **Mailpit**: https://mailpit.axllent.org/
- **Resend**: https://resend.com/docs
- **Nodemailer**: https://nodemailer.com/
