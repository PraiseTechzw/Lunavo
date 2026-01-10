# Lunavo Platform

A comprehensive student support platform designed for the Chinhoyi University of Technology (CUT). Lunavo provides peer support, professional counseling, crisis detection, and resource management for students.

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   - Create `.env` file with Supabase credentials
   - See [Wiki - Supabase Setup](docs/wiki/Getting-Started/Supabase-Setup.md)

3. **Run database migrations**
   - See [Wiki - Database Migration](docs/wiki/Getting-Started/Database-Migration.md)

4. **Start the app**
   ```bash
   npm start
   ```

## 📚 Documentation

**Comprehensive documentation is available in the [Wiki](docs/wiki/Home.md)**

### Quick Links

- [Installation & Setup](docs/wiki/Getting-Started/Installation-and-Setup.md)
- [Quick Start Guide](docs/wiki/Getting-Started/Quick-Start.md)
- [Developer Guide](docs/wiki/Development/Developer-Guide.md)
- [Architecture Overview](docs/wiki/Development/Architecture.md)
- [Authentication System](docs/wiki/Features/Authentication.md)
- [Role-Based Navigation](docs/wiki/Features/Role-Based-Navigation.md)
- [Escalation System](docs/wiki/Features/Escalation-System.md)

## 🎯 Features

- **Peer Support**: Connect students with peer educators
- **Professional Counseling**: Access to counselors and life coaches
- **Crisis Detection**: Automatic detection and escalation of concerning posts
- **Resource Management**: Educational resources and support materials
- **Analytics**: Anonymized analytics for Student Affairs
- **Gamification**: Points, badges, and engagement features
- **Real-time Updates**: Live notifications and updates

## 🔐 User Roles

The platform supports 8 distinct user roles:

1. **Student** - Base user with access to core features
2. **Peer Educator** - Provides peer support to students
3. **Peer Educator Executive** - Manages peer educators
4. **Moderator** - Content moderation and reporting
5. **Counselor** - Professional mental health support
6. **Life Coach** - Life coaching and guidance
7. **Student Affairs** - Analytics and trend analysis (Web-only)
8. **Admin** - Full system access and management

## 🛠️ Technology Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Language**: TypeScript
- **Navigation**: Expo Router
- **UI Components**: React Native Paper

## 📖 Learn More

- [Wiki Documentation](docs/wiki/Home.md) - Complete documentation
- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)

## 📝 Project Status

**Current Status**: 85% Complete - Production Ready

See [Implementation Status](docs/wiki/Implementation-Status/Current-Status.md) for details.

---

**For detailed setup instructions, see the [Wiki](docs/wiki/Home.md)**
