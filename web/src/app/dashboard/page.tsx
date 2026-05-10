import { useEffect, useState } from 'react'
import { Users, CalendarDays, TrendingUp, UserCheck, UserX, FileText } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { StatCard } from '@/components/common/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { listEmployees } from '@/api/employee'
import { getTodayAttendance } from '@/api/attendance'
import { getLeaves } from '@/api/leave'
import { getMyNotifications } from '@/api/notification'
import type { EmployeeOut, AttendanceOut, LeaveOut, NotificationOut } from '@/types'
import { useAuth } from '@/context/auth-context'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const [employees, setEmployees] = useState<EmployeeOut[]>([])
  const [todayAttendance, setTodayAttendance] = useState<AttendanceOut[]>([])
  const [leaves, setLeaves] = useState<LeaveOut[]>([])
  const [notifications, setNotifications] = useState<NotificationOut[]>([])
  const [loading, setLoading] = useState(true)

  const now = new Date()

  useEffect(() => {
    const tasks: Promise<unknown>[] = [
      getLeaves().then((r) => setLeaves(r.data)),
      getMyNotifications().then(setNotifications),
    ]
    if (isAdmin) {
      tasks.push(
        listEmployees().then(setEmployees),
        getTodayAttendance().then(setTodayAttendance),
      )
    }
    Promise.allSettled(tasks).finally(() => setLoading(false))
  }, [isAdmin])

  const activeEmployees = employees.filter((e) => e.is_active).length
  const inactiveEmployees = employees.length - activeEmployees
  const presentToday = todayAttendance.filter((a) => a.status === 'present').length
  const pendingLeaves = leaves.filter((l) => l.status === 'pending').length
  const unreadNotifications = notifications.filter((n) => !n.is_read).length

  return (
    <div>
      <PageHeader
        title={`Good ${getGreeting()}, ${user?.full_name?.split(' ')[0] ?? 'there'}`}
        description={format(now, 'EEEE, MMMM d, yyyy')}
      />

      {isAdmin ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
              ))
            ) : (
              <>
                <StatCard title="Total Employees" value={employees.length} description={`${activeEmployees} active, ${inactiveEmployees} inactive`} icon={Users} />
                <StatCard title="Present Today" value={presentToday} description={`Out of ${employees.length} employees`} icon={UserCheck} />
                <StatCard title="Pending Leaves" value={pendingLeaves} description="Awaiting approval" icon={CalendarDays} />
                <StatCard title="Notifications" value={unreadNotifications} description="Unread notifications" icon={TrendingUp} />
              </>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Today's Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : todayAttendance.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No attendance records for today.</p>
                ) : (
                  <div className="space-y-2">
                    {todayAttendance.slice(0, 6).map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {a.check_in ? format(new Date(a.check_in), 'HH:mm') : '—'} →{' '}
                          {a.check_out ? format(new Date(a.check_out), 'HH:mm') : 'Active'}
                        </span>
                        <Badge variant="outline" className="capitalize">{a.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pending Leave Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : pendingLeaves === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending leave requests.</p>
                ) : (
                  <div className="space-y-2">
                    {leaves.filter((l) => l.status === 'pending').slice(0, 6).map((l) => (
                      <div key={l.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium capitalize">{l.type}</span>
                          <span className="text-muted-foreground ml-2">
                            {format(new Date(l.start_date), 'MMM d')} – {format(new Date(l.end_date), 'MMM d')}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-yellow-700 bg-yellow-50 border-0 dark:bg-yellow-900/20 dark:text-yellow-400">
                          {l.days}d
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notifications.</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((n) => (
                      <div key={n.id} className="flex gap-3">
                        <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${n.is_read ? 'bg-muted' : 'bg-primary'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{n.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Workforce Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : (
                  <div className="space-y-3">
                    <OverviewRow icon={Users} label="Total Employees" value={employees.length} />
                    <OverviewRow icon={UserCheck} label="Active" value={activeEmployees} color="text-green-600" />
                    <OverviewRow icon={UserX} label="Inactive" value={inactiveEmployees} color="text-red-500" />
                    <OverviewRow icon={FileText} label="Leave Requests" value={leaves.length} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
              ))
            ) : (
              <>
                <StatCard title="My Leaves" value={leaves.length} description="Total leave requests" icon={CalendarDays} />
                <StatCard title="Pending" value={pendingLeaves} description="Awaiting approval" icon={CalendarDays} />
                <StatCard title="Notifications" value={unreadNotifications} description="Unread notifications" icon={TrendingUp} />
              </>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">My Leave Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : leaves.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No leave requests.</p>
                ) : (
                  <div className="space-y-2">
                    {leaves.slice(0, 6).map((l) => (
                      <div key={l.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium capitalize">{l.type}</span>
                          <span className="text-muted-foreground ml-2">
                            {format(new Date(l.start_date), 'MMM d')} – {format(new Date(l.end_date), 'MMM d')}
                          </span>
                        </div>
                        <Badge variant="outline" className="capitalize">{l.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notifications.</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((n) => (
                      <div key={n.id} className="flex gap-3">
                        <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${n.is_read ? 'bg-muted' : 'bg-primary'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{n.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function OverviewRow({ icon: Icon, label, value, color = 'text-muted-foreground' }: {
  icon: React.ElementType; label: string; value: number; color?: string
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
