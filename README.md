<div align="center">
  <h1>🎬 AnimeStream</h1>
  <p>A modern, self-hosted anime streaming platform built with TypeScript and Express</p>

  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
  ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
  ![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)
</div>

## ✨ Features

- 🎯 **Modern Interface** - Clean and responsive design using Bootstrap 5
- 🔐 **Discord Authentication** - Secure login through Discord OAuth2
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🎮 **Video Player Controls** - Custom video player with keyboard shortcuts
- ❤️ **Favorites System** - Save and manage your favorite anime
- 📊 **Progress Tracking** - Automatically tracks your watching progress
- 👥 **User Management** - Admin panel for user role management
- 🎨 **Theme Support** - Light and dark mode support
- 🔍 **Advanced Search** - Filter by type, genre, and more

## 🚀 Getting Started

### Prerequisites

- Node.js 16 or higher
- TypeScript
- A Discord application for OAuth2

### Installation

1. Clone the repository:

```bash
git clone https://github.com/chocoOnEstrogen/AnimeStream.git
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file:

```env
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
SESSION_SECRET=your_session_secret
BASE_URL=http://localhost:3000
```

4. Build and start the application:

```bash
npm run build
npm start
```

## 🛠️ Configuration

The main configuration file is located at `src/config.ts`. Here you can configure:

- Media directories
- Port settings
- Discord OAuth settings
- Session configuration

## 📁 Directory Structure

```
src/
├── routes/          # Express route controllers
├── middleware/      # Express middleware
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
├── views/          # EJS templates
└── public/         # Static files
```

## 🎮 Usage

1. Add your anime files to the configured media directory
2. Each anime should have an `info.ini` file with metadata
3. Start the server and navigate to `http://localhost:3000`
4. Log in with Discord
5. Browse and stream your anime collection

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Video.js](https://videojs.com/) for the video player
- [Bootstrap](https://getbootstrap.com/) for the UI framework
- [Discord](https://discord.com/) for authentication


