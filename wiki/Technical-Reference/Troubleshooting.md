# Troubleshooting Guide

Common issues and solutions for the Lunavo platform.

## Installation Issues

### "Missing Supabase environment variables"

**Symptoms:**
- App fails to start
- Error message about missing environment variables

**Solutions:**
1. Check `.env` file exists in root directory
2. Verify variable names start with `EXPO_PUBLIC_`
3. Restart Expo dev server after creating/updating `.env`
4. Check for typos in variable names

### "Module not found" errors

**Symptoms:**
- Import errors
- Module resolution failures

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Expo cache
npm start -- --clear
```

### Port already in use

**Symptoms:**
- Error: Port 8081 already in use

**Solutions:**

**Windows:**
```bash
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
lsof -ti:8081 | xargs kill
```

## Database Issues

### "Tables not found"

**Symptoms:**
- Database queries fail
- Tables don't exist

**Solutions:**
1. Run database migrations in Supabase SQL Editor
2. Run migrations in order (001, 002, etc.)
3. Check for errors in SQL Editor
4. Verify migrations completed successfully

### "Foreign key constraint" errors

**Symptoms:**
- Migration fails
- Foreign key errors

**Solutions:**
1. See [Database Migration Guide](../Getting-Started/Database-Migration.md)
2. Drop and recreate tables if in development
3. Check migration order
4. Verify table dependencies

### "RLS policy" errors

**Symptoms:**
- Access denied errors
- Data not visible

**Solutions:**
1. Verify RLS is enabled on tables
2. Check policy conditions
3. Verify user role and permissions
4. Review RLS policies in Supabase dashboard

## Authentication Issues

### "Invalid login credentials"

**Symptoms:**
- Login fails
- Wrong password error

**Solutions:**
1. Verify email and password are correct
2. Check if account exists
3. Try password reset
4. Verify email is verified (if required)

### "Email already registered"

**Symptoms:**
- Registration fails
- Email exists error

**Solutions:**
1. Try logging in instead
2. Use password reset if forgotten
3. Check if email is verified
4. Contact support if needed

### Session expired

**Symptoms:**
- Unexpected logout
- Session invalid errors

**Solutions:**
1. Sign in again
2. Check token expiration settings
3. Verify Supabase auth configuration
4. Clear app data and reinstall if persistent

## Navigation Issues

### Route not accessible

**Symptoms:**
- Redirected unexpectedly
- Route blocked

**Solutions:**
1. Check route is in `ROUTE_ACCESS` matrix
2. Verify user role has access
3. Check device type (mobile vs web)
4. Review route protection logic

### Component not showing

**Symptoms:**
- UI element missing
- Feature not visible

**Solutions:**
1. Check Platform.OS conditions
2. Verify role-based conditions
3. Check component is imported
4. Verify component is in render tree
5. Check for conditional rendering logic

### Navigation not working

**Symptoms:**
- Links don't work
- Navigation fails

**Solutions:**
1. Check route is registered in `_layout.tsx`
2. Verify route path is correct
3. Check navigation guard is not blocking
4. Verify user role is loaded
5. Check for navigation errors in console

## Performance Issues

### Slow loading

**Symptoms:**
- App loads slowly
- Data takes time to appear

**Solutions:**
1. Check network connection
2. Verify pagination is enabled
3. Check for large data fetches
4. Review performance optimizations
5. Check Supabase query performance

### Memory issues

**Symptoms:**
- App crashes
- Out of memory errors

**Solutions:**
1. Check for memory leaks
2. Verify pagination is working
3. Review image loading
4. Check for infinite loops
5. Monitor memory usage

## Real-time Issues

### Not receiving updates

**Symptoms:**
- Real-time features not working
- No live updates

**Solutions:**
1. Check network connection
2. Verify real-time subscriptions are active
3. Check Supabase real-time is enabled
4. Review subscription code
5. Check for subscription errors

### Duplicate updates

**Symptoms:**
- Data appears multiple times
- Duplicate notifications

**Solutions:**
1. Check for multiple subscriptions
2. Verify unsubscribe is called
3. Review subscription cleanup
4. Check for duplicate event handlers

## Build Issues

### Build fails

**Symptoms:**
- Expo build fails
- TypeScript errors

**Solutions:**
1. Check TypeScript errors
2. Verify all dependencies are installed
3. Check for syntax errors
4. Review build logs
5. Clear cache and rebuild

### Type errors

**Symptoms:**
- TypeScript compilation errors
- Type mismatches

**Solutions:**
1. Check type definitions
2. Verify imports are correct
3. Review type annotations
4. Check for missing types
5. Run type check: `npx tsc --noEmit`

## Platform-Specific Issues

### iOS Issues

**Symptoms:**
- iOS-specific errors
- App doesn't work on iOS

**Solutions:**
1. Check iOS simulator/device
2. Verify iOS permissions
3. Check for iOS-specific code
4. Review Expo iOS configuration
5. Check for platform-specific bugs

### Android Issues

**Symptoms:**
- Android-specific errors
- App doesn't work on Android

**Solutions:**
1. Check Android emulator/device
2. Verify Android permissions
3. Check for Android-specific code
4. Review Expo Android configuration
5. Check for platform-specific bugs

### Web Issues

**Symptoms:**
- Web-specific errors
- App doesn't work on web

**Solutions:**
1. Check browser console
2. Verify web compatibility
3. Check for web-specific code
4. Review Expo web configuration
5. Test in different browsers

## Getting Help

### Before Asking for Help

1. Check this troubleshooting guide
2. Review relevant documentation
3. Search existing issues
4. Check error messages carefully
5. Gather relevant information

### When Reporting Issues

Include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Error messages or logs
- Environment details (OS, device, version)
- Screenshots if applicable

### Resources

- [Wiki Documentation](../Home.md)
- [Developer Guide](../Development/Developer-Guide.md)
- [GitHub Issues](https://github.com/PraiseTechzw/Lunavo/issues)
- [Supabase Documentation](https://supabase.com/docs)
- [Expo Documentation](https://docs.expo.dev/)

---

**Last Updated**: December 2024
