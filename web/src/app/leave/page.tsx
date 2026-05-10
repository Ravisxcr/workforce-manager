import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, CalendarDays, Check, X, Trash2, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { PageHeader } from '@/components/common/page-header'
import { DataTable, type Column } from '@/components/common/data-table'
import { StatusBadge } from '@/components/common/status-badge'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { StatCard } from '@/components/common/stat-card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  getLeaves, createLeave, deleteLeave, approveLeave, rejectLeave,
  getTeamLeaves, getLeaveBalance, approveLeaveCancellation,
} from '@/api/leave'
import type { LeaveOut, LeaveCreate } from '@/types'
import { useAuth } from '@/context/auth-context'

const LEAVE_TYPES = ['sick', 'casual', 'earned', 'maternity', 'paternity', 'unpaid', 'other']

const EMPTY_FORM: LeaveCreate = { start_date: '', end_date: '', type: '', reason: '' }

export default function LeavePage() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<LeaveCreate>(EMPTY_FORM)

  const [deleteTarget, setDeleteTarget] = useState<LeaveOut | null>(null)
  const [approveTarget, setApproveTarget] = useState<{ leave: LeaveOut; action: 'approve' | 'reject' | 'cancel-approve' } | null>(null)

  const {
    data: myLeaves = [],
    isLoading: myLeavesLoading,
    isError: myLeavesError,
  } = useQuery({
    queryKey: ['leaves'],
    queryFn: () => getLeaves().then((r) => r.data),
  })

  const {
    data: teamLeaves = [],
    isLoading: teamLeavesLoading,
    isError: teamLeavesError,
  } = useQuery({
    queryKey: ['leaves', 'team'],
    queryFn: () => getTeamLeaves(),
    enabled: isAdmin,
  })

  const {
    data: balance = {},
    isLoading: balanceLoading,
    isError: balanceError,
  } = useQuery({
    queryKey: ['leaves', 'balance'],
    queryFn: getLeaveBalance,
  })

  const createLeaveMutation = useMutation({
    mutationFn: createLeave,
    onSuccess: () => {
      toast.success('Leave request submitted')
      setDialogOpen(false)
      setForm(EMPTY_FORM)
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
    },
    onError: (err: { detail?: string }) => {
      toast.error(err.detail ?? 'Failed to submit leave')
    },
  })

  const deleteLeaveMutation = useMutation({
    mutationFn: deleteLeave,
    onSuccess: () => {
      toast.success('Leave request deleted')
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
    },
    onError: () => {
      toast.error('Failed to delete leave')
    },
  })

  const approveLeaveMutation = useMutation({
    mutationFn: ({ leave, action }: { leave: LeaveOut; action: 'approve' | 'reject' | 'cancel-approve' }) => {
      if (action === 'approve') return approveLeave(leave.id)
      if (action === 'reject') return rejectLeave(leave.id)
      return approveLeaveCancellation(leave.id)
    },
    onSuccess: () => {
      toast.success('Action completed')
      setApproveTarget(null)
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
    },
    onError: () => {
      toast.error('Action failed')
    },
  })

  const loading = myLeavesLoading || balanceLoading || (isAdmin && teamLeavesLoading)
  const saving = createLeaveMutation.isPending

  useEffect(() => {
    if (myLeavesError || balanceError || (isAdmin && teamLeavesError)) {
      toast.error('Failed to load leave data')
    }
  }, [balanceError, isAdmin, myLeavesError, teamLeavesError])

  const handleCreate = () => {
    createLeaveMutation.mutate(form)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteLeaveMutation.mutate(deleteTarget.id)
  }

  const handleAction = () => {
    if (!approveTarget) return
    approveLeaveMutation.mutate(approveTarget)
  }

  const pendingTeam = teamLeaves.filter((l) => l.status === 'pending')
  const totalApproved = myLeaves.filter((l) => l.status === 'approved').length
  const totalPending = myLeaves.filter((l) => l.status === 'pending').length

  const myColumns: Column<LeaveOut>[] = [
    {
      key: 'type', header: 'Type',
      cell: (l) => <span className="font-medium capitalize">{l.type}</span>,
    },
    {
      key: 'dates', header: 'Dates',
      cell: (l) => (
        <span className="text-sm">
          {format(new Date(l.start_date), 'MMM d')} – {format(new Date(l.end_date), 'MMM d, yyyy')}
        </span>
      ),
    },
    { key: 'days', header: 'Days', cell: (l) => <Badge variant="outline">{l.days}d</Badge> },
    { key: 'status', header: 'Status', cell: (l) => <StatusBadge status={l.status} /> },
    {
      key: 'actions', header: '', className: 'w-16',
      cell: (l) => l.status === 'pending' ? (
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(l)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ) : null,
    },
  ]

  const teamColumns: Column<LeaveOut>[] = [
    { key: 'type', header: 'Type', cell: (l) => <span className="capitalize font-medium">{l.type}</span> },
    {
      key: 'dates', header: 'Dates',
      cell: (l) => `${format(new Date(l.start_date), 'MMM d')} – ${format(new Date(l.end_date), 'MMM d, yyyy')}`,
    },
    { key: 'days', header: 'Days', cell: (l) => `${l.days}d` },
    { key: 'status', header: 'Status', cell: (l) => <StatusBadge status={l.status} /> },
    {
      key: 'actions', header: 'Actions', className: 'w-28',
      cell: (l) => l.status === 'pending' ? (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700" onClick={() => setApproveTarget({ leave: l, action: 'approve' })}>
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setApproveTarget({ leave: l, action: 'reject' })}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : l.cancellation_requested ? (
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setApproveTarget({ leave: l, action: 'cancel-approve' })}>
          <RefreshCw className="mr-1 h-3 w-3" /> Approve Cancel
        </Button>
      ) : null,
    },
  ]

  return (
    <div>
      <PageHeader title="Leave Management" description="Apply and manage leave requests">
        <Button onClick={() => { setForm(EMPTY_FORM); setDialogOpen(true) }} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Apply Leave
        </Button>
      </PageHeader>

      <div className={`grid gap-4 mb-6 ${isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
        <StatCard title="Total Leaves" value={myLeaves.length} icon={CalendarDays} />
        <StatCard title="Approved" value={totalApproved} icon={Check} />
        <StatCard title="Pending" value={totalPending} icon={RefreshCw} />
        {isAdmin && <StatCard title="Team Pending" value={pendingTeam.length} icon={CalendarDays} />}
      </div>

      {Object.keys(balance).length > 0 && (
        <div className="flex gap-3 flex-wrap mb-4">
          {Object.entries(balance).map(([type, bal]) => (
            <div key={type} className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
              <span className="capitalize text-muted-foreground">{type}</span>
              <span className="font-semibold">{bal.remaining}d</span>
              <span className="text-muted-foreground text-xs">/ {bal.total}d</span>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="my">
        <TabsList className="mb-4">
          <TabsTrigger value="my">My Leaves</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="team">
              Team Leaves
              {pendingTeam.length > 0 && (
                <Badge className="ml-2 h-5 px-1.5 text-xs">{pendingTeam.length}</Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my">
          <DataTable columns={myColumns} data={myLeaves} isLoading={loading} rowKey={(l) => l.id} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="team">
            <DataTable columns={teamColumns} data={teamLeaves} isLoading={loading} rowKey={(l) => l.id} />
          </TabsContent>
        )}
      </Tabs>

      {/* Apply Leave Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason for leave..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Leave Request"
        description="Are you sure you want to delete this leave request?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />

      <ConfirmDialog
        open={!!approveTarget}
        onOpenChange={(o) => !o && setApproveTarget(null)}
        title={approveTarget?.action === 'approve' ? 'Approve Leave' : approveTarget?.action === 'reject' ? 'Reject Leave' : 'Approve Cancellation'}
        description={`Are you sure you want to ${approveTarget?.action?.replace('-', ' ')} this leave request?`}
        confirmLabel={approveTarget?.action === 'approve' ? 'Approve' : approveTarget?.action === 'reject' ? 'Reject' : 'Approve'}
        onConfirm={handleAction}
        destructive={approveTarget?.action === 'reject'}
      />
    </div>
  )
}
