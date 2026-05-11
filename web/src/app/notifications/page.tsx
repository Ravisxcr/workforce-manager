import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Bell, BellOff, Check, CheckCheck, Trash2, Send, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { EmptyState } from '@/components/common/empty-state'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import {
  getMyNotifications, markAsRead, markAllRead, deleteNotification,
  sendNotification, broadcastNotification,
} from '@/api/notification'
import { listEmployees } from '@/api/employee'
import type { NotificationOut } from '@/types'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'

const NOTIF_TYPES = ['info', 'warning', 'error', 'success']

export default function NotificationsPage() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()

  const [sendDialog, setSendDialog] = useState(false)
  const [broadcastDialog, setBroadcastDialog] = useState(false)
  const [sendForm, setSendForm] = useState({ user_id: '', title: '', message: '', type: 'info', link: '' })
  const [broadcastForm, setBroadcastForm] = useState({ user_ids: [] as string[], title: '', message: '', type: 'info', link: '' })

  const [deleteTarget, setDeleteTarget] = useState<NotificationOut | null>(null)

  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    isError: notificationsError,
  } = useQuery({
    queryKey: ['notifications', 'me'],
    queryFn: getMyNotifications,
  })

  const {
    data: employees = [],
    isLoading: employeesLoading,
    isError: employeesError,
  } = useQuery({
    queryKey: ['employees'],
    queryFn: () => listEmployees(),
    enabled: isAdmin,
  })

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => {
      toast.error('Failed to mark as read')
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      toast.success('All notifications marked as read')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => {
      toast.error('Failed to mark all as read')
    },
  })

  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      setDeleteTarget(null)
      toast.success('Notification deleted')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => {
      toast.error('Failed to delete')
    },
  })

  const sendNotificationMutation = useMutation({
    mutationFn: sendNotification,
    onSuccess: () => {
      toast.success('Notification sent')
      setSendDialog(false)
      setSendForm({ user_id: '', title: '', message: '', type: 'info', link: '' })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (err: { detail?: string }) => {
      toast.error(err.detail ?? 'Failed to send')
    },
  })

  const broadcastNotificationMutation = useMutation({
    mutationFn: broadcastNotification,
    onSuccess: (_data, variables) => {
      toast.success(`Broadcast sent to ${variables.user_ids.length} employees`)
      setBroadcastDialog(false)
      setBroadcastForm({ user_ids: [], title: '', message: '', type: 'info', link: '' })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (err: { detail?: string }) => {
      toast.error(err.detail ?? 'Failed to broadcast')
    },
  })

  const loading = notificationsLoading || (isAdmin && employeesLoading)
  const saving = sendNotificationMutation.isPending || broadcastNotificationMutation.isPending

  useEffect(() => {
    if (notificationsError || (isAdmin && employeesError)) {
      toast.error('Failed to load notifications')
    }
  }, [employeesError, isAdmin, notificationsError])

  const unread = notifications.filter((n) => !n.is_read)

  const handleMarkRead = (n: NotificationOut) => {
    if (n.is_read) return
    markReadMutation.mutate(n.id)
  }

  const handleMarkAll = () => {
    markAllReadMutation.mutate()
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteNotificationMutation.mutate(deleteTarget.id)
  }

  const handleSend = () => {
    sendNotificationMutation.mutate({ ...sendForm, link: sendForm.link || undefined })
  }

  const handleBroadcast = () => {
    if (broadcastForm.user_ids.length === 0) { toast.error('Select at least one employee'); return }
    broadcastNotificationMutation.mutate({ ...broadcastForm, link: broadcastForm.link || undefined })
  }

  const toggleEmployee = (id: string) => {
    setBroadcastForm((prev) => ({
      ...prev,
      user_ids: prev.user_ids.includes(id)
        ? prev.user_ids.filter((e) => e !== id)
        : [...prev.user_ids, id],
    }))
  }

  return (
    <div>
      <PageHeader title="Notifications" description="Manage and send notifications">
        <div className="flex gap-2">
          {unread.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAll}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          )}
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={() => setBroadcastDialog(true)}>
                <Users className="mr-2 h-4 w-4" />
                Broadcast
              </Button>
              <Button size="sm" onClick={() => setSendDialog(true)}>
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      <Tabs defaultValue="unread">
        <div className="flex items-center gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="unread">
              Unread
              {unread.length > 0 && <Badge className="ml-2 h-5 px-1.5 text-xs">{unread.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="unread">
          {!loading && unread.length === 0 ? (
            <EmptyState icon={BellOff} title="No unread notifications" description="You're all caught up!" />
          ) : (
            <div className="space-y-2">
              {loading ? Array.from({ length: 3 }).map((_, i) => <NotifSkeleton key={i} />) :
                unread.map((n) => (
                  <NotifCard key={n.id} notification={n} onMarkRead={() => handleMarkRead(n)} onDelete={() => setDeleteTarget(n)} />
                ))
              }
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          {!loading && notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" description="Notifications will appear here." />
          ) : (
            <div className="space-y-2">
              {loading ? Array.from({ length: 5 }).map((_, i) => <NotifSkeleton key={i} />) :
                notifications.map((n) => (
                  <NotifCard key={n.id} notification={n} onMarkRead={() => handleMarkRead(n)} onDelete={() => setDeleteTarget(n)} />
                ))
              }
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Send Dialog */}
      <Dialog open={sendDialog} onOpenChange={setSendDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Notification</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Employee *</Label>
              <Select value={sendForm.user_id} onValueChange={(v) => setSendForm({ ...sendForm, user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.user_id}>{e.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={sendForm.title} onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })} placeholder="Notification title" />
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea value={sendForm.message} onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })} rows={3} placeholder="Notification message..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={sendForm.type} onValueChange={(v) => setSendForm({ ...sendForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NOTIF_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Link</Label>
                <Input value={sendForm.link} onChange={(e) => setSendForm({ ...sendForm, link: e.target.value })} placeholder="/some/path" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialog(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={saving}>{saving ? 'Sending...' : 'Send'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Broadcast Dialog */}
      <Dialog open={broadcastDialog} onOpenChange={setBroadcastDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Broadcast Notification</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={broadcastForm.title} onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })} placeholder="Notification title" />
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea value={broadcastForm.message} onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Recipients ({broadcastForm.user_ids.length} selected)</Label>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() =>
                  setBroadcastForm((p) => ({ ...p, user_ids: p.user_ids.length === employees.length ? [] : employees.map((e) => e.user_id) }))
                }>
                  {broadcastForm.user_ids.length === employees.length ? 'Deselect all' : 'Select all'}
                </Button>
              </div>
              <ScrollArea className="h-40 rounded-md border p-2">
                <div className="space-y-2">
                  {employees.map((e) => (
                    <div key={e.id} className="flex items-center gap-2">
                      <Checkbox
                        id={e.id}
                        checked={broadcastForm.user_ids.includes(e.user_id)}
                        onCheckedChange={() => toggleEmployee(e.user_id)}
                      />
                      <label htmlFor={e.id} className="text-sm cursor-pointer">{e.full_name}</label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={broadcastForm.type} onValueChange={(v) => setBroadcastForm({ ...broadcastForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NOTIF_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBroadcastDialog(false)}>Cancel</Button>
            <Button onClick={handleBroadcast} disabled={saving}>{saving ? 'Sending...' : 'Broadcast'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Notification"
        description="Are you sure you want to delete this notification?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  )
}

function NotifCard({ notification: n, onMarkRead, onDelete }: {
  notification: NotificationOut
  onMarkRead: () => void
  onDelete: () => void
}) {
  return (
    <Card className={cn('transition-colors', !n.is_read && 'border-primary/30 bg-primary/5 dark:bg-primary/10')}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('mt-1 h-2 w-2 rounded-full shrink-0', n.is_read ? 'bg-muted' : 'bg-primary')} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={cn('text-sm font-medium', !n.is_read && 'text-foreground')}>{n.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <StatusBadge status={n.type} className="text-xs" />
                {!n.is_read && (
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onMarkRead} title="Mark as read">
                    <Check className="h-3 w-3" />
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onDelete}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NotifSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="h-2 w-2 rounded-full bg-muted mt-1 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
