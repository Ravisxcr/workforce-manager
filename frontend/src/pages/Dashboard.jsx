import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  ShieldCheck, 
  LogOut,
  User,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Salary Slips', href: '/dashboard/salary', icon: FileText },
    { name: 'Leave Management', href: '/dashboard/leaves', icon: Calendar },
    { name: 'ID Verification', href: '/dashboard/verification', icon: ShieldCheck },
    { name: 'Reimbursement', href: '/dashboard/reimbursement', icon: TrendingUp },
    ...(user?.role === 'admin' ? [
      { name: 'Admin', href: '/dashboard/admin', icon: User },
    ] : []),
  ];

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                className="p-2 bg-primary rounded-lg hover:bg-primary/90 transition-colors duration-200 lg:pointer-events-none"
                onClick={() => setSidebarOpen((prev) => !prev)}
                aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
              >
                <User className="h-5 w-5 text-primary-foreground" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Employee Portal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.employeeId}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden transition-opacity duration-300 ease-in-out"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside
          className={`w-64 shrink-0 fixed lg:relative top-16 lg:top-0 left-0 z-30 h-[calc(100vh-64px)] lg:h-full bg-white lg:bg-transparent border-r lg:border-r-0 lg:border border-gray-200 lg:rounded-lg lg:m-4 lg:ml-8 transition-transform duration-300 ease-in-out lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ 
            boxShadow: sidebarOpen ? '2px 0 8px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <div className="p-4 lg:p-2 h-full overflow-y-auto">
            {/* Mobile close button */}
            <div className="lg:hidden flex justify-between items-center mb-4 pb-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => {
                      // Close sidebar on mobile after navigation
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 lg:p-8 lg:pr-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
