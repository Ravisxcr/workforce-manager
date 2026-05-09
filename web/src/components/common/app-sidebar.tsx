import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Clock, CalendarDays, DollarSign,
  Receipt, FileText, Building2, Bell, Settings, LogOut,
} from 'lucide-react'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger,
  SidebarHeader,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, adminOnly: false },
  { title: 'Employees', url: '/employees', icon: Users, adminOnly: true },
  { title: 'Attendance', url: '/attendance', icon: Clock, adminOnly: false },
  { title: 'Leave', url: '/leave', icon: CalendarDays, adminOnly: false },
  { title: 'Salary', url: '/salary', icon: DollarSign, adminOnly: false },
  { title: 'Reimbursements', url: '/reimbursements', icon: Receipt, adminOnly: false },
  { title: 'Documents', url: '/documents', icon: FileText, adminOnly: false },
  { title: 'Departments', url: '/departments', icon: Building2, adminOnly: true },
  { title: 'Notifications', url: '/notifications', icon: Bell, adminOnly: false },
]

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export function AppSidebar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const checkActive = (url: string) => {
    if (url === '/') return location.pathname === '/'
    return location.pathname.startsWith(url)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            WM
          </div>
          <span className="truncate font-semibold text-sm">Workforce Manager</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={checkActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className={({ isActive }) =>
                        cn('flex items-center gap-2', isActive && 'font-medium')
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Separator className="mb-2" />
        {user && (
          <div className="flex items-center gap-2 px-2 py-1.5 overflow-hidden">
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarFallback className="text-xs">{getInitials(user.full_name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden flex-1 min-w-0">
              <span className="text-xs font-medium truncate">{user.full_name}</span>
              <span className="text-xs text-muted-foreground truncate">{user.email}</span>
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings" isActive={location.pathname === '/settings'}>
              <NavLink to="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Logout" onClick={handleLogout} className="flex items-center gap-2 w-full text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex justify-end pt-1">
          <SidebarTrigger />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
