# Employee Portal - React Vite App

A comprehensive employee management portal built with React, Vite, Tailwind CSS, and shadcn UI components.

## Features

### 🔐 Authentication
- **Login & Signup**: Secure user authentication system
- Mock authentication with localStorage persistence
- Protected routes for authenticated users

### 💰 Salary Management
- View current month salary slip with detailed breakdown
- Access complete salary history
- Download salary slips as PDF
- View earnings, deductions, and net salary
- Track salary trends and averages

### 📅 Leave Management
- View total, remaining, and used leave balances
- Request new leave with type selection (Casual, Sick, Earned, Emergency)
- View leave history with status (Approved, Pending, Rejected)
- Cancel pending leave requests
- Automatic calculation of leave days
- Leave policy guidelines

### 🔍 ID Verification
- Upload required documents (Aadhaar Card, PAN Card, Address Proof, etc.)
- Track verification status
- Document upload with file validation
- Verification guidelines and help section

### 📊 Dashboard Overview
- Welcome screen with quick stats
- Recent activity feed
- Quick action links
- Employee information display

## Technology Stack

- **Frontend Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.6
- **Styling**: Tailwind CSS 4.1.17
- **UI Components**: shadcn UI (custom implementation)
- **Routing**: React Router DOM 7.1.1
- **Icons**: Lucide React
- **Utilities**: clsx, tailwind-merge

## Project Structure

```
src/
├── components/
│   ├── ui/               # Reusable UI components (shadcn-style)
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── input.jsx
│   │   ├── label.jsx
│   │   ├── table.jsx
│   │   ├── badge.jsx
│   │   └── textarea.jsx
│   └── ProtectedRoute.jsx
├── contexts/
│   └── AuthContext.jsx   # Authentication context provider
├── lib/
│   ├── utils.js          # Utility functions
│   └── mockData.js       # Mock data for development
├── pages/
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Dashboard.jsx
│   ├── Overview.jsx
│   ├── Salary.jsx
│   ├── Leaves.jsx
│   └── Verification.jsx
├── App.jsx               # Main app component with routing
├── main.jsx             # Entry point
└── index.css            # Tailwind CSS imports and custom styles
```

## Getting Started

### Prerequisites

- Node.js (v24.3.0 or higher)
- npm (v11.4.2 or higher)

### Installation

1. Clone the repository or navigate to the project directory:
```bash
cd d:\experiments\full_app\frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit:
```
http://localhost:5173
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

### Login/Signup
- Navigate to the login page (default route)
- Use any email and password to login (mock authentication)
- Or create a new account via the signup page

### Dashboard Navigation
After logging in, you'll have access to:
- **Overview**: Dashboard with quick stats and recent activity
- **Salary Slips**: View and download salary information
- **Leave Management**: Request and manage leaves
- **ID Verification**: Upload and verify identity documents

### Mock Data
The application uses mock data for demonstration purposes. In a production environment:
- Replace mock authentication with real API calls
- Connect to a backend server for data persistence
- Implement actual file upload functionality
- Add proper security measures

## Features in Detail

### Authentication System
- Context-based state management
- Protected routes for authenticated pages
- Auto-redirect to login for unauthenticated users
- User data persistence in localStorage

### Responsive Design
- Mobile-first approach
- Fully responsive across all screen sizes
- Optimized for desktop, tablet, and mobile devices

### UI Components
- Built with shadcn UI principles
- Accessible and semantic HTML
- Consistent design language
- Smooth animations and transitions

## Customization

### Styling
Modify `src/index.css` to customize the color scheme and design tokens.

### Adding New Pages
1. Create a new page component in `src/pages/`
2. Add the route in `src/App.jsx`
3. Update the navigation in `src/pages/Dashboard.jsx`

### Mock Data
Update `src/lib/mockData.js` to change the sample data displayed in the application.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

This is a demonstration project. Feel free to fork and modify as needed.

## License

MIT

## Support

For questions or issues, please contact the development team.

---

Built with ❤️ using React, Vite, and Tailwind CSS

