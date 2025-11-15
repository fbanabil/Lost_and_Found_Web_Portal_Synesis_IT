# Lost and Found Web Portal

A comprehensive, full-stack web application designed to bridge the gap between people who have lost items and those who have found them. This modern platform combines the power of React's dynamic frontend with ASP.NET Core's robust backend architecture to create a seamless, secure, and user-friendly experience for managing lost and found items.

## 🌟 What Makes This Special?

In our fast-paced world, losing personal belongings is an unfortunate but common experience. Whether it's a wallet left at a coffee shop, keys dropped in a park, or a phone forgotten on public transport, the anxiety and frustration of losing something valuable is universal. Our Lost and Found Web Portal addresses this pain point by creating a centralized, digital community where lost items can find their way back home.

The platform goes beyond simple item posting by incorporating matching algorithms, real-time communication capabilities, and location-based services to maximize the chances of successful item recovery. Built with modern web technologies and security best practices, this application ensures that both lost item owners and good Samaritans can connect safely and efficiently.

## 🎯 Mission Statement

To create a digital ecosystem that transforms the traditionally frustrating experience of losing items into a community-driven recovery process, leveraging technology to reunite people with their belongings while fostering a culture of helpfulness and civic responsibility.

## 🚀 Comprehensive Features

### 📋 Advanced Item Management

- **Detailed Item Posting**: Rich text descriptions with category classification, timestamps, and condition status
- **Image Support**: Upload high-resolution image
- **Smart Search & Filtering**: Powerful search engine with filters by category, date, location, and item characteristics
- **Item Status Tracking**: Real-time updates on item status (pending, resolved)

### 💬 Real-time Communication Hub

- **Instant Messaging**: Direct chat system between item owners and finders
- **Thread Management**: Organized conversation threads for each item inquiry
- **Notification System**: Real-time alerts for potential matches
- **Image Sharing in Chat**: Send verification photos and additional item details through chat

### 🔐 Enterprise-Grade Security

- **Authentication**: Secure JWT-based authentication with refresh token rotation
- **Password Security**: Secure password hashing handled by ASP.NET Core Identity framework with built-in salting and PBKDF2 algorithm for maximum protection against rainbow table and brute-force attacks

### 🗺️ Location Intelligence

- **Interactive Map Integration**: Visual item posting and searching with precise location markers
- **Geofencing**: Automatic alerts when similar items are reported in nearby areas

## 🛠 Tech Stack

### Frontend

- **React 18** - Modern UI library
- **Vite** - Fast build tool and development server
- **CSS3** - Styling with custom themes
- **JavaScript (ES6+)** - Modern JavaScript features

### Backend

- **ASP.NET Core** - Web API framework
- **Entity Framework Core** - ORM for database operations
- **SQL Server** - Database management system
- **JWT Authentication** - Secure token-based authentication
- **SignalR** - Real-time communication (Will be upgraded to it in near future)

## 📁 Project Structure

```
Lost_and_Found_Web_Portal/
├── lost-found-portal/          # React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Main application pages
│   │   ├── context/           # React context providers
│   │   └── utils/             # Utility functions
│   ├── public/                # Static assets
│   └── package.json           # Frontend dependencies
├── Server/                    # ASP.NET Core Backend
│   ├── Lost_And_Found_Web_Portal.Api/        # Web API layer
│   ├── Lost_And_Found_Web_Portal.Core/       # Business logic
│   └── Lost_And_Found_Web_Portal.Infrastructure/ # Data access
└── README.md
```

## 🚦 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **.NET 8 SDK** or higher
- **SQL Server** (LocalDB or full instance)
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Abid-Al-Hossain/Lost_and_Found_Web_Portal_Synesis_IT.git
   cd Lost_and_Found_Web_Portal_Synesis_IT
   ```
2. **Setup Backend**

   ```bash
   cd Server/Lost_And_Found_Web_Portal.Api
   dotnet restore
   dotnet ef database update
   ```
3. **Setup Frontend**

   ```bash
   cd lost-found-portal
   npm install
   ```

### Running the Application

1. **Start the Backend API**

   ```bash
   cd Server/Lost_And_Found_Web_Portal.Api
   dotnet run
   ```

   The API will be available at `https://localhost:7000`
2. **Start the Frontend**

   ```bash
   cd lost-found-portal
   npm run dev
   ```

   The web app will be available at `http://localhost:5173`

## 🔧 Configuration

### Backend Configuration

Update `appsettings.json` in the API project:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Your database connection string"
  },
  "AppSettings": {
    "TokenKey": "Your random token key with appropriate size"
  }
}

```

### Frontend Configuration

Update API endpoints in your React app as needed for your environment.

## 📱 Detailed Usage Guide

### 👤 Getting Started

1. **Account Creation**: Register with email 
2. **Dashboard Familiarization**: Explore the intuitive dashboard with quick actions and recent activity

### 📝 Posting Items

4. **Lost Item Reporting**:

   - Provide detailed descriptions with specific identifiers
   - Set precise location and time of loss
5. **Found Item Submission**:

   - Document item condition and current location
   - Add distinguishing features and characteristics

### 🔍 Discovery & Matching

6. **Advanced Search**: Use filters, keywords, and map-based searching to find relevant items
7. **Matching Alerts**: Receive notifications when the system identifies potential matches

### 💬 Communication & Recovery

10. **Messaging**: Initiate conversations with item owners/finders through chat
11. **Identity Verification**: Exchange verification details and proof of ownership safely
12. **Meetup Coordination**: Plan secure meetups using suggested public locations
13. **Success Confirmation**: Mark items as successfully returned and provide feedback (Will be added in near future)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 API Documentation

The API follows RESTful conventions with the following main endpoints:

- `GET/POST /api/authentication` - User authentication
- `GET/POST /api/lostandfound` - Lost and found items management
- `GET/POST /api/chatbox` - Chat functionality

## 🔒 Security Features

- JWT token-based authentication
- Password hashing and validation
- Input sanitization and validation
- CORS configuration

## 🎨 Customization

The application supports:

- **Themes**: Multiple color schemes and UI themes
- **Animations**: Customizable animation effects
- **Sound Effects**: Optional audio feedback
- **Responsive Design**: Adapts to different screen sizes

## 👥 Authors

- **Abid Al Hossain** - Frontend - [Abid-Al-Hossain](https://github.com/Abid-Al-Hossain)
- **Fahad Bin Aziz Nabil** - Backend - [fbanabil](https://github.com/fbanabil)

## 🙏 Acknowledgments

- Synesis IT for project guidance
- React and ASP.NET Core communities

---
