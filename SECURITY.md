# Security Guidelines

## 🔒 Environment Variables

### ⚠️ NEVER commit `.env` files to Git!

The `.env` file contains configuration that may include sensitive data in the future. Always use `.env.example` as a template.

### Current Environment Variables

- `VITE_USE_MOCKS` - Boolean flag to enable/disable mock API (safe to share)
- `VITE_BACKEND_URL` - Backend server URL (safe for local development URLs)

### Future Considerations

If you add any of the following to `.env`, they are **NEVER** safe to commit:
- API keys
- Authentication tokens
- Database credentials
- Secret keys
- Private URLs or IPs
- User credentials

## 📋 What's Protected

The `.gitignore` file now excludes:

### Environment Files
- `.env` (all variants)
- `.env.local`
- `.env.*.local`
- Any environment-specific configs

### Sensitive Files
- `*.key`, `*.pem`, `*.p12` (certificates and keys)
- `secrets/` directory
- `**/api-keys.json`
- `**/credentials.json`
- `**/secrets.json`

### Build & Cache
- `node_modules/`
- `dist/`, `build/`
- `.cache/`
- Coverage reports

### IDE & OS
- `.vscode/` (except extensions.json)
- `.idea/`
- `.DS_Store`, `Thumbs.db`
- Editor swap files

## ✅ Security Checklist

Before committing:
- [ ] No `.env` files in staging area
- [ ] No API keys or tokens in code
- [ ] No hardcoded credentials
- [ ] No sensitive URLs or IPs (use environment variables)
- [ ] `.env.example` is up to date with required variables (but no real values)

## 🔍 Audit History

### 2026-03-17: Initial Security Audit
- ✅ Removed `.env` from Git tracking
- ✅ Updated `.gitignore` with comprehensive exclusions
- ✅ Created `.env.example` template
- ✅ Verified no sensitive data in commit history
- ✅ Initial commit contained only `VITE_BACKEND_URL=http://localhost:8000` (non-sensitive)

## 📞 Reporting Security Issues

If you discover a security vulnerability:
1. **DO NOT** open a public issue
2. Contact the repository maintainer directly
3. Provide details about the vulnerability
4. Allow time for a fix before public disclosure

