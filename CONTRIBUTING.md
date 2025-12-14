# Contributing to Lunavo

Thank you for your interest in contributing to Lunavo! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

1. **Clear title and description**
2. **Steps to reproduce** the bug
3. **Expected behavior** vs **Actual behavior**
4. **Screenshots** (if applicable)
5. **Environment details** (OS, device, app version)
6. **Error messages** or logs

### Suggesting Features

Feature suggestions are welcome! Please create an issue with:

1. **Clear title and description**
2. **Use case** - Why is this feature needed?
3. **Proposed solution** - How should it work?
4. **Alternatives considered** - Other approaches you've thought about

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Follow coding standards** (see below)
5. **Write/update tests** if applicable
6. **Update documentation** if needed
7. **Commit your changes** with clear messages
8. **Push to your branch** (`git push origin feature/amazing-feature`)
9. **Open a Pull Request**

## Development Setup

See the [Installation Guide](wiki/Getting-Started/Installation-and-Setup.md) for detailed setup instructions.

Quick setup:

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Lunavo.git
cd Lunavo

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm start
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper types
- Use interfaces for object shapes
- Use enums for constants

### Code Style

- Follow existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Use async/await instead of promises where possible

### File Organization

- Follow the existing directory structure
- Place components in `app/components/`
- Place utilities in `lib/` or `app/utils/`
- Place types in `app/types/`

### React/React Native

- Use functional components with hooks
- Use `useState` and `useEffect` appropriately
- Memoize expensive computations with `useMemo`
- Use `useCallback` for event handlers passed to children
- Follow the existing component patterns

### Git Commit Messages

Use clear, descriptive commit messages:

```
feat: Add user profile editing
fix: Resolve navigation issue on mobile
docs: Update installation guide
style: Format code with prettier
refactor: Simplify authentication logic
test: Add tests for user creation
chore: Update dependencies
```

## Testing

- Test your changes on both iOS and Android (if applicable)
- Test on web if the feature is web-accessible
- Test with different user roles
- Test error cases and edge cases

## Documentation

- Update relevant wiki pages when adding features
- Add code comments for complex logic
- Update README if needed
- Add JSDoc comments for public functions

## Pull Request Process

1. **Ensure your code follows the coding standards**
2. **Update documentation** as needed
3. **Ensure all tests pass** (if applicable)
4. **Request review** from maintainers
5. **Address review feedback**
6. **Wait for approval** before merging

## Project Structure

```
Lunavo/
├── app/                    # Application code
│   ├── (tabs)/            # Tab navigation
│   ├── admin/             # Admin screens
│   ├── auth/              # Authentication
│   ├── components/        # Reusable components
│   └── utils/             # Utilities
├── lib/                    # Core libraries
├── hooks/                  # Custom hooks
├── supabase/              # Database migrations
├── wiki/                  # Documentation
└── assets/                # Static assets
```

## Questions?

- Check the [Wiki](wiki/Home.md) for documentation
- Review existing issues and PRs
- Ask questions in issues or discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Lunavo! 🎉
