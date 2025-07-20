# Benzochem Admin Authentication Setup (DEPRECATED)

⚠️ **This document is deprecated. The system now uses a simplified login-only approach.**

**Please refer to `LOGIN_ONLY_AUTHENTICATION.md` for current authentication instructions.**

---

This document explains the previous setup-based authentication system (no longer used).

## Changes Made

### 1. Database Schema Updates
- Added `passwordHash` field to the `admins` table in `convex/schema.ts`
- All admin accounts now require a password for authentication

### 2. Authentication System
- Created `convex/auth.ts` with secure authentication functions:
  - `authenticateAdmin`: Validates email/password login
  - `createAdmin`: Creates new admin accounts with hashed passwords
  - `changeAdminPassword`: Allows password changes
  - `resetAdminPassword`: Allows super admins to reset passwords
  - `validateAdminSession`: Validates stored sessions
  - `setupInitialAdmin`: Creates the first admin account

### 3. Password Security
- Passwords are hashed using SHA-256 with a salt
- **Note**: In production, consider upgrading to bcrypt for better security
- Passwords are never stored in plain text

### 4. Frontend Updates
- Removed demo credentials from login page
- Updated auth context to use real authentication
- Added setup page for creating initial admin account
- Added setup check component to redirect to setup if no admins exist

## Setup Instructions

### First Time Setup

1. **Start the development server**:
   ```bash
   cd admin
   npm run dev
   ```

2. **Start Convex**:
   ```bash
   npx convex dev
   ```

3. **Access the application**:
   - Navigate to `http://localhost:3000/login`
   - If no admin accounts exist, you'll be automatically redirected to `/setup`

4. **Create your first admin account**:
   - Fill out the setup form with your details
   - Choose a strong password (minimum 8 characters)
   - Click "Create Admin Account"

5. **Login with your new account**:
   - After setup, you'll be redirected to the login page
   - Use your email and password to sign in

### Creating Additional Admin Accounts

Once you have your first admin account, you can create additional admins through the admin dashboard (this functionality would need to be implemented in the UI).

Alternatively, you can use the Convex dashboard or create a mutation to add more admins.

## Security Considerations

### Current Implementation
- Uses SHA-256 hashing with a salt
- Passwords are validated on the server side
- Sessions are stored in localStorage (consider upgrading to httpOnly cookies)

### Recommended Improvements for Production
1. **Upgrade password hashing**: Replace SHA-256 with bcrypt or Argon2
2. **Implement rate limiting**: Prevent brute force attacks
3. **Add password complexity requirements**: Enforce strong passwords
4. **Use secure session management**: Consider JWT tokens or secure cookies
5. **Add two-factor authentication**: For enhanced security
6. **Implement password reset via email**: For forgotten passwords
7. **Add account lockout**: After multiple failed attempts

## File Structure

```
admin/
├── convex/
│   ├── auth.ts              # Authentication functions
│   ├── admins.ts            # Admin management (updated)
│   ├── schema.ts            # Database schema (updated)
│   └── seed.ts              # Seed data (updated)
├── src/
│   ├── app/
│   │   ├── login/page.tsx   # Login page (updated)
│   │   └── setup/page.tsx   # Initial setup page (new)
│   ├── components/
│   │   └── setup-check.tsx  # Setup check component (new)
│   └── contexts/
│       └── auth-context.tsx # Auth context (updated)
└── AUTHENTICATION_SETUP.md # This file
```

## Troubleshooting

### "No admins exist" error
- This means the database is empty
- Navigate to `/setup` to create your first admin account

### Login fails with correct credentials
- Check the browser console for errors
- Ensure Convex is running and connected
- Verify the admin account exists in the Convex dashboard

### Setup page shows "Initial admin already exists"
- This means at least one admin account exists
- Navigate to `/login` to sign in
- If you forgot your password, you'll need to reset it via the Convex dashboard

## Migration from Demo System

If you were using the demo credentials system:

1. **Clear browser storage**:
   ```javascript
   localStorage.removeItem("benzochem_admin_id");
   localStorage.removeItem("benzochem_admin_data");
   ```

2. **Create new admin account** using the setup process above

3. **Update any hardcoded references** to demo credentials in your code

## Next Steps

1. Implement admin management UI in the dashboard
2. Add password change functionality
3. Implement password reset via email
4. Add audit logging for authentication events
5. Consider implementing role-based permissions more granularly
