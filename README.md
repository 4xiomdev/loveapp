# 💕 Love App - Relationship Management Platform

A comprehensive relationship management app built with React, Firebase, and love! ✨

## 🚀 Features

- **Messages**: Couple messaging system
- **Stars**: Star/rating system for activities
- **Coupons**: Digital coupons for special activities
- **Reminders**: Shared reminders and notifications
- **Accountability**: Habit tracking for couples
- **Schedule**: Shared calendar integration with Google Calendar
- **Mood Tracker**: Emotional wellness tracking
- **Partner Linking**: Connect with your partner seamlessly

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Git

### Quick Start

1. **Clone and Install**
   ```bash
   git clone [your-repo-url]
   cd loveapp
   npm install
   ```

2. **Environment Setup**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Firebase and Google OAuth credentials

3. **Development with Live Reload**
   ```bash
   npm run dev
   ```
   - Opens at http://localhost:5173
   - Hot reload enabled - changes reflect immediately!

## 🔥 Development Workflows

### For Daily Development (RECOMMENDED)
```bash
npm run dev
```
- Uses live Firebase database (production)
- See changes instantly without deployment
- Perfect for UI/UX development
- No need to deploy every change!

### For Backend Development
```bash
npm run dev:emulators
```
- Uses local Firebase emulators
- Safe for testing database changes
- Isolated from production data

### For Testing Production Build
```bash
npm run build
npm run preview
```

## 🚀 Deployment

### Deploy Everything
```bash
npm run deploy
```

### Deploy Only Frontend
```bash
npm run deploy:hosting
```

### Deploy Only Backend Functions
```bash
npm run deploy:functions
```

## 📂 Project Structure

```
loveapp/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Main application pages
│   ├── contexts/      # React contexts (Auth, Theme)
│   ├── services/      # API services
│   ├── utils/         # Helper functions
│   └── firebase.js    # Firebase configuration
├── functions/         # Firebase Cloud Functions
├── public/           # Static assets
└── dist/            # Built application (auto-generated)
```

## 🌐 Live URLs

- **Production**: https://iloveyou64.web.app
- **Firebase Console**: https://console.firebase.google.com/project/loveapp-16d8b

## 🔒 Security

- All environment variables are properly configured
- Firestore security rules in place
- Firebase Authentication required
- Partner-based access control

## 💡 Development Tips

1. **Use `npm run dev` for most development** - no deployment needed!
2. **Commit often** - save your progress frequently
3. **Test locally** before deploying to production
4. **Use emulators** for database schema changes

---

Built with ❤️ for managing relationships better!
