# 🌟 PEACE Platform

**Peer Education And Community Empowerment**

A comprehensive mental health support application for university students, featuring real-time peer support, gamification, and anonymous community engagement.

[![Built with Expo](https://img.shields.io/badge/Built%20with-Expo-000020.svg?style=flat&logo=expo)](https://expo.dev)
[![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-3ECF8E.svg?style=flat&logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 📱 Features

### 🎮 Gamification System
- **Points & Rewards**: Earn points for engagement (check-ins, posts, replies)
- **14 Unique Badges**: Unlock achievements across 4 categories
- **Streak Tracking**: Maintain daily check-in and helping streaks
- **Leaderboard**: Compete with peers for top contributor status
- **Level System**: Progress through levels as you earn points

### 💬 Real-Time Chat
- **Peer Support**: Connect with trained peer educators
- **Anonymous Option**: Seek help without revealing identity
- **Secure Messaging**: End-to-end encrypted transport
- **Live Updates**: Real-time message delivery and typing indicators

### 🏥 Mental Health Tools
- **Daily Check-Ins**: Track mood and emotional well-being
- **AI Insights**: Personalized wellness recommendations
- **Crisis Resources**: Quick access to emergency support
- **Anonymous Forum**: Share experiences and support others

### 🔒 Privacy & Security
- **Pseudonym System**: Protect user identity
- **Row Level Security**: Database-level access control
- **Encrypted Storage**: Secure data handling
- **GDPR Compliant**: Privacy-first design

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- npm or yarn
- Expo CLI
- Supabase account
- Expo account (for builds)

### Installation

```bash
# Clone repository
git clone https://github.com/[username]/peace-platform.git
cd peace-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm start
```

### Running on Device

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

---

## 🏗️ Tech Stack

- **Frontend**: React Native, Expo Router
- **Backend**: Supabase (PostgreSQL, Realtime, Auth)
- **State Management**: React Hooks
- **Styling**: Custom theme system with dark mode
- **Animations**: React Native Reanimated
- **Build & Deploy**: EAS Build, GitHub Actions
- **Type Safety**: TypeScript

---

## 📂 Project Structure

```
peace-platform/
├── app/                    # Application screens
│   ├── (tabs)/            # Tab navigation screens
│   ├── chat/              # Chat screens
│   ├── check-in.tsx       # Daily check-in
│   ├── rewards.tsx        # Gamification
│   └── ...
├── lib/                   # Utility functions
│   ├── database.ts        # Database operations
│   ├── gamification.ts    # Points & badges
│   ├── realtime.ts        # Real-time subscriptions
│   └── ...
├── supabase/              # Database migrations
├── .github/workflows/     # CI/CD pipelines
├── .agent/                # Documentation
└── ...
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### EAS Configuration

The project includes pre-configured EAS profiles:
- **Development**: Internal testing builds
- **Preview**: Stakeholder review builds
- **Production**: Store submission builds

See `eas.json` for details.

---

## 🚢 Deployment

### Automated Deployment (GitHub Actions)

Push to branches to trigger builds:
- `develop` → Development builds
- `staging` → Preview builds
- `main` → Production builds + store submission

### Manual Deployment

```bash
# Build for development
eas build --profile development --platform all

# Build for production
eas build --profile production --platform all

# Submit to stores
eas submit --platform all --latest

# Publish OTA update
eas update --branch production --message "Bug fixes"
```

See `.agent/EAS_SETUP_GUIDE.md` for complete instructions.

---

## 📊 Database Schema

Key tables:
- `users` - User accounts and profiles
- `check_ins` - Daily mood tracking
- `posts` - Forum posts
- `replies` - Post replies
- `support_sessions` - Chat sessions
- `support_messages` - Chat messages
- `user_points` - Points tracking
- `points_transactions` - Transaction history
- `user_badges` - Badge awards
- `streaks` - Streak tracking

All tables protected by Row Level Security (RLS).

---

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Run tests (if configured)
npm test
```

---

## 📚 Documentation

Comprehensive documentation in `.agent/` folder:
- `COMPLETE_SUMMARY.md` - Full feature overview
- `EAS_SETUP_GUIDE.md` - Deployment setup
- `EAS_COMMANDS.md` - Quick command reference
- `GAMIFICATION_SUMMARY.md` - Gamification details
- `GAMIFICATION_TESTING.md` - Testing guide
- `LAUNCH_CHECKLIST.md` - Pre-launch checklist

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Chinhoyi University of Technology** - Project sponsor
- **Peer Education Club** - Content and guidance
- **Expo Team** - Amazing development platform
- **Supabase Team** - Backend infrastructure
- **Open Source Community** - Invaluable tools and libraries

---

## 📞 Support

- **Email**: support@peaceplatform.com
- **Documentation**: See `.agent/` folder
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

## 🗺️ Roadmap

### Version 1.1
- [ ] Push notifications for milestones
- [ ] Advanced analytics dashboard
- [ ] Rewards shop
- [ ] Video messaging

### Version 1.2
- [ ] AI-powered content moderation
- [ ] Seasonal challenges
- [ ] Team competitions
- [ ] Social sharing

### Version 2.0
- [ ] Web dashboard for administrators
- [ ] Advanced reporting
- [ ] Integration with university systems
- [ ] Multi-language support

---

## 📈 Stats

- **Lines of Code**: ~15,000+
- **Components**: 50+
- **Database Tables**: 20+
- **GitHub Actions**: 6
- **Badges**: 14
- **Point Actions**: 8

---

## 🌟 Star History

If you find this project helpful, please consider giving it a star! ⭐

---

## 📸 Screenshots

*Coming soon - Add screenshots of your app here*

---

## 🔐 Security

For security concerns, please email security@peaceplatform.com instead of using the issue tracker.

---

## 💡 About

PEACE Platform was created to provide accessible, anonymous, and engaging mental health support for university students. By combining gamification with professional peer support, we aim to reduce stigma and encourage help-seeking behavior.

**Built with ❤️ for student mental health**

---

## 🎯 Mission

To create a safe, engaging, and effective platform where students can:
- Seek support without fear of judgment
- Connect with trained peer educators
- Track their mental wellness journey
- Build a supportive community
- Access crisis resources instantly

---

**Made with 💙 by the PEACE Team**

