import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Clock, LogIn, LogOut, Plus, Trash2, BarChart3 } from 'lucide-react'
import { format } from 'date-fns'
import { PageHeader } from '@/components/common/page-header'
import { DataTable, type Column } from '@/components/common/data-table'
import { StatusBadge } from '@/components/common/status-badge'
import { StatCard } from '@/components/common/stat-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  checkIn, checkOut, getMyAttendance, getTodayAttendance,
  getAttendanceAnalytics, manualEntry, deleteAttendance,
} from '@/api/attendance'
import { listEmployees } from '@/api/employee'
import type { AttendanceOut, AttendanceAnalytics, EmployeeOut } from '@/types'
import { useAuth } from '@/context/auth-context'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export default function AttendancePage() {
  const now = new Date()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const [myAttendance, setMyAttendance] = useState<AttendanceOut[]>([])
  const [todayAtt, setTodayAtt] = useState<AttendanceOut[]>([])
  const [analytics, setAnalytics] = useState<AttendanceAnalytics[]>([])
  const [employees, setEmployees] = useState<EmployeeOut[]>([])
  const [loading, setLoading] = useState(true)

  const [checkinNote, setCheckinNote] = useState('')
  const [checkoutNote, setCheckoutNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [manualOpen, setManualOpen] = useState(false)
  const [manualForm, setManualForm] = useState({
    user_id: '', date: '', check_in: '', check_out: '', status: 'present', notes: '',
  })

  const hasTodayCheckin = todayAtt.some((a) => a.check_in && !a.check_out)
  const hasTodayCheckedOut = todayAtt.some((a) => a.check_out)
  const hasTodayRecord = todayAtt.length > 0

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [myAtt, today] = await Promise.all([
        getMyAttendance({ month, year }),
        getTodayAttendance(),
      ])
      setMyAttendance(myAtt)
      setTodayAtt(today)

      if (isAdmin) {
        const [analyt, emps] = await Promise.all([
        getAttendanceAnalytics({ month, year }),
        listEmployees(),
        ])
        setAnalytics(analyt)
        setEmployees(emps)
      }
    } catch {
      toast.error('Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }, [month, year, isAdmin])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCheckIn = async () => {
    setActionLoading(true)
    try {
      await checkIn({ notes: checkinNote })
      toast.success('Checked in successfully')
      setCheckinNote('')
      fetchData()
    } catch (err: unknown) {
      toast.error((err as { detail?: string })?.detail ?? 'Check-in failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setActionLoading(true)
    try {
      await checkOut({ notes: checkoutNote })
      toast.success('Checked out successfully')
      setCheckoutNote('')
      fetchData()
    } catch (err: unknown) {
      toast.error((err as { detail?: string })?.detail ?? 'Check-out failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleManualEntry = async () => {
    try {
      await manualEntry({
        user_id: manualForm.user_id,
        date: manualForm.date,
        check_in: manualForm.check_in || undefined,
        check_out: manualForm.check_out || undefined,
        status: manualForm.status,
        notes: manualForm.notes || undefined,
      })
      toast.success('Manual entry added')
      setManualOpen(false)
      fetchData()
    } catch (err: unknown) {
      toast.error((err as { detail?: string })?.detail ?? 'Failed to add manual entry')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAttendance(id)
      toast.success('Record deleted')
      fetchData()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const myColumns: Column<AttendanceOut>[] = [
    { key: 'date', header: 'Date', cell: (a) => format(new Date(a.date), 'MMM d, yyyy') },
    { key: 'checkin', header: 'Check In', cell: (a) => a.check_in ? format(new Date(a.check_in), 'HH:mm') : '—' },
    { key: 'checkout', header: 'Check Out', cell: (a) => a.check_out ? format(new Date(a.check_out), 'HH:mm') : '—' },
    { key: 'hours', header: 'Hours', cell: (a) => a.work_hours ? `${a.work_hours.toFixed(1)}h` : '—' },
    { key: 'status', header: 'Status', cell: (a) => <StatusBadge status={a.status} /> },
    {
      key: 'actions', header: '', className: 'w-12',
      cell: (a) => (
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ]

  const analyticsColumns: Column<AttendanceAnalytics>[] = [
    { key: 'name', header: 'Employee', cell: (a) => <span className="font-medium">{a.employee_name}</span> },
    { key: 'total', header: 'Total Days', cell: (a) => a.total_days },
    { key: 'present', header: 'Present', cell: (a) => <Badge variant="outline" className="text-green-700 bg-green-50 border-0">{a.present_days}</Badge> },
    { key: 'absent', header: 'Absent', cell: (a) => <Badge variant="outline" className="text-red-700 bg-red-50 border-0">{a.absent_days}</Badge> },
    { key: 'late', header: 'Late', cell: (a) => a.late_days },
    { key: 'hours', header: 'Avg Hours', cell: (a) => a.avg_work_hours ? `${a.avg_work_hours.toFixed(1)}h` : '—' },
  ]

  const totalPresent = analytics.reduce((s, a) => s + a.present_days, 0)
  const totalAbsent = analytics.reduce((s, a) => s + a.absent_days, 0)

  return (
    <div>
      <PageHeader title="Attendance" description="Track and manage employee attendance">
        {isAdmin && (
          <Button onClick={() => setManualOpen(true)} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Manual Entry
          </Button>
        )}
      </PageHeader>

      {/* Quick Check-in / Check-out */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <LogIn className="h-4 w-4 text-green-600" /> Check In
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Optional note..."
              value={checkinNote}
              onChange={(e) => setCheckinNote(e.target.value)}
              rows={2}
            />
            <Button
              onClick={handleCheckIn}
              disabled={actionLoading || hasTodayRecord}
              className="w-full"
              variant={hasTodayRecord ? 'outline' : 'default'}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {hasTodayRecord ? 'Already checked in today' : 'Check In'}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <LogOut className="h-4 w-4 text-red-500" /> Check Out
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Optional note..."
              value={checkoutNote}
              onChange={(e) => setCheckoutNote(e.target.value)}
              rows={2}
            />
            <Button
              onClick={handleCheckOut}
              disabled={actionLoading || !hasTodayCheckin || hasTodayCheckedOut}
              className="w-full"
              variant="outline"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {!hasTodayCheckin ? 'Check in first' : (hasTodayCheckedOut ? 'Already checked out' : 'Check Out')}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="my">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="my">My Attendance</TabsTrigger>
            {isAdmin && <TabsTrigger value="analytics">Team Analytics</TabsTrigger>}
          </TabsList>
          <div className="flex items-center gap-2">
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="my">
          <DataTable columns={myColumns} data={myAttendance} isLoading={loading} rowKey={(a) => a.id} />
        </TabsContent>

        {isAdmin && (
          <>
          <TabsContent value="analytics">
            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <StatCard title="Total Present" value={totalPresent} icon={Clock} description="across all employees" />
              <StatCard title="Total Absent" value={totalAbsent} icon={BarChart3} description="across all employees" />
              <StatCard title="Employees Tracked" value={analytics.length} icon={Clock} description="this month" />
            </div>
            <DataTable columns={analyticsColumns} data={analytics} isLoading={loading} rowKey={(a) => a.user_id} />
          </TabsContent>
          </>
        )}
      </Tabs>

      {/* Manual Entry Dialog */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manual Attendance Entry</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={manualForm.user_id} onValueChange={(v) => setManualForm({ ...manualForm, user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={manualForm.date} onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check In</Label>
                <Input type="time" value={manualForm.check_in} onChange={(e) => setManualForm({ ...manualForm, check_in: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Check Out</Label>
                <Input type="time" value={manualForm.check_out} onChange={(e) => setManualForm({ ...manualForm, check_out: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={manualForm.status} onValueChange={(v) => setManualForm({ ...manualForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['present', 'absent', 'late', 'half_day'].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={manualForm.notes} onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualOpen(false)}>Cancel</Button>
            <Button onClick={handleManualEntry}>Add Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
