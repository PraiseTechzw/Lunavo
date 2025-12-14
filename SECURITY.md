# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Lunavo seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:

- Open a public GitHub issue
- Discuss the vulnerability publicly
- Share the vulnerability with others until it has been resolved

### Please DO:

1. **Email us directly** at: praisesamasunga04@gmail.com
2. **Include the following information**:
   - Type of vulnerability
   - Full paths of source file(s) related to the vulnerability
   - The location of the affected source code (tag/branch/commit or direct URL)
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if possible)
   - Impact of the vulnerability, including how an attacker might exploit it

3. **Allow time for response**: We will acknowledge receipt of your report within 48 hours and provide a more detailed response within 7 days.

## Security Best Practices

### For Users

- Keep your app updated to the latest version
- Use strong, unique passwords
- Enable two-factor authentication if available
- Report suspicious activity immediately
- Don't share your credentials with anyone

### For Developers

- Never commit secrets or API keys to the repository
- Use environment variables for sensitive configuration
- Follow secure coding practices
- Keep dependencies updated
- Review code changes for security issues
- Use Row Level Security (RLS) policies in Supabase
- Validate and sanitize all user input
- Use HTTPS for all network requests
- Implement proper authentication and authorization

## Security Features

Lunavo includes several security features:

### Authentication & Authorization

- Secure password hashing (handled by Supabase)
- JWT token-based authentication
- Role-based access control (RBAC)
- Session management
- Password reset via secure email

### Data Protection

- Row Level Security (RLS) policies
- Encrypted connections (HTTPS)
- Secure token storage
- Data anonymization for analytics
- Privacy-first design

### Input Validation

- Client-side validation
- Server-side validation (Supabase RLS)
- SQL injection prevention
- XSS protection
- CSRF protection

## Known Security Considerations

### Environment Variables

- Never commit `.env` files
- Use `EXPO_PUBLIC_` prefix for client-side variables only
- Keep service role keys server-side only
- Rotate keys regularly

### API Keys

- Use `anon/public` key in client code
- Never expose `service_role` key
- Rotate keys if compromised
- Monitor key usage

### Database Security

- Always use RLS policies
- Never disable RLS in production
- Regularly review and update policies
- Use parameterized queries
- Limit database access

## Security Updates

Security updates will be:

1. Released as patches to supported versions
2. Documented in release notes
3. Communicated to users via appropriate channels
4. Prioritized over feature development

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the issue and determine affected versions
2. Audit code to find any potential similar problems
3. Prepare fixes for all supported versions
4. Release fixes as soon as possible
5. Publicly disclose the vulnerability after fixes are released

## Security Checklist

Before deploying to production:

- [ ] All dependencies are up to date
- [ ] Environment variables are properly configured
- [ ] RLS policies are enabled and tested
- [ ] API keys are secure and not exposed
- [ ] HTTPS is enabled
- [ ] Authentication is properly implemented
- [ ] Authorization checks are in place
- [ ] Input validation is implemented
- [ ] Error messages don't leak sensitive information
- [ ] Logging doesn't include sensitive data
- [ ] Security headers are configured
- [ ] Regular security audits are scheduled

## Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
- [React Native Security](https://reactnative.dev/docs/security)

## Contact

For security concerns, please email: praisesamasunga04@gmail.com

---

**Last Updated**: December 2024
