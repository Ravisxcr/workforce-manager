import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Check, X, Download, Trash2, FileText, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { PageHeader } from '@/components/common/page-header'
import { DataTable, type Column } from '@/components/common/data-table'
import { StatusBadge } from '@/components/common/status-badge'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  getMyDocuments, getPendingDocuments, uploadDocument, deleteDocument,
  verifyDocument, getDocumentFile, getDocumentFileUrl, getDocumentTypes,
  getAllDocuments,
} from '@/api/document'
import type { DocumentOut } from '@/types'
import { useAuth } from '@/context/auth-context'

export default function DocumentsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'  
  const queryClient = useQueryClient()

  const [uploadDialog, setUploadDialog] = useState(false)
  const [uploadForm, setUploadForm] = useState({ document_type: '', description: '' })
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const [verifyTarget, setVerifyTarget] = useState<DocumentOut | null>(null)
  const [verifyAction, setVerifyAction] = useState<'verified' | 'rejected'>('verified')
  const [verifyComment, setVerifyComment] = useState('')
  const [verifyDialog, setVerifyDialog] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<DocumentOut | null>(null)

  const [open, setOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  const {
    data: myDocs = [],
    isLoading: myDocsLoading,
    isError: myDocsError,
  } = useQuery({
    queryKey: ['documents', 'my'],
    queryFn: getMyDocuments,
  })

  const {
    data: docTypes = [],
    isLoading: docTypesLoading,
    isError: docTypesError,
  } = useQuery({
    queryKey: ['documents', 'types'],
    queryFn: getDocumentTypes,
    select: (types) => Array.isArray(types) ? types : [],
  })

  const {
    data: pendingDocs = [],
    isLoading: pendingDocsLoading,
    isError: pendingDocsError,
  } = useQuery({
    queryKey: ['documents', 'pending'],
    queryFn: getPendingDocuments,
    enabled: isAdmin,
  })

  const {
    data: allDocs = [],
    isLoading: allDocsLoading,
    isError: allDocsError,
  } = useQuery({
    queryKey: ['documents', 'all'],
    queryFn: getAllDocuments,
    enabled: isAdmin,
    select: (docs) => Array.isArray(docs) ? docs : [],
  })

  const uploadDocumentMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      toast.success('Document uploaded')
      setUploadDialog(false)
      setUploadForm({ document_type: '', description: '' })
      setUploadFile(null)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (err: { detail?: string }) => {
      toast.error(err.detail ?? 'Upload failed')
    },
  })

  const verifyDocumentMutation = useMutation({
    mutationFn: ({ id, status, comment }: { id: string; status: 'verified' | 'rejected'; comment?: string }) =>
      verifyDocument(id, { status, comment }),
    onSuccess: (_data, variables) => {
      toast.success(`Document ${variables.status}`)
      setVerifyDialog(false)
      setVerifyTarget(null)
      setVerifyComment('')
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: () => {
      toast.error('Verification failed')
    },
  })

  const deleteDocumentMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      toast.success('Document deleted')
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: () => {
      toast.error('Failed to delete')
    },
  })

  const loading =
    myDocsLoading ||
    docTypesLoading ||
    (isAdmin && (pendingDocsLoading || allDocsLoading))
  const saving = uploadDocumentMutation.isPending

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    if (
      myDocsError ||
      docTypesError ||
      (isAdmin && (pendingDocsError || allDocsError))
    ) {
      toast.error('Failed to load documents')
    }
  }, [allDocsError, docTypesError, isAdmin, myDocsError, pendingDocsError])

  const handleUpload = () => {
    if (!uploadFile) { toast.error('Please select a file'); return }
    if (!uploadForm.document_type) { toast.error('Please select document type'); return }
    uploadDocumentMutation.mutate({
      document_type: uploadForm.document_type,
      file: uploadFile,
      description: uploadForm.description || undefined,
    })
  }

  const handleVerify = () => {
    if (!verifyTarget) return
    verifyDocumentMutation.mutate({
      id: verifyTarget.id,
      status: verifyAction,
      comment: verifyComment || undefined,
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteDocumentMutation.mutate(deleteTarget.id)
  }

  const openVerify = (doc: DocumentOut, action: 'verified' | 'rejected') => {
    setVerifyTarget(doc)
    setVerifyAction(action)
    setVerifyComment('')
    setVerifyDialog(true)
  }

  const handlePreview = async (id: string) => {
    try {
      const blob = await getDocumentFile(id)

      const url = URL.createObjectURL(blob)

      setPreviewUrl(url)
      setOpen(true)
    } catch (err) {
      console.error(err)
    }
  }

  const handlePreviewOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen && previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
  }

  const docColumns: Column<DocumentOut>[] = [
    {
      key: 'type', header: 'Document',
      cell: (d) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="font-medium capitalize text-sm">{d.document_type.replace('_', ' ')}</p>
            {d.description && <p className="text-xs text-muted-foreground">{d.description}</p>}
          </div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', cell: (d) => <StatusBadge status={d.status} /> },
    {
      key: 'verified', header: 'Verified At',
      cell: (d) => d.verified_at ? format(new Date(d.verified_at), 'MMM d, yyyy') : '—',
    },
    { key: 'comment', header: 'Comment', cell: (d) => <span className="text-sm text-muted-foreground">{d.comment || '—'}</span> },
    {
      key: 'actions', header: '', className: 'w-24',
      cell: (d) => (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
            <a href={getDocumentFileUrl(d.id)} target="_blank" rel="noopener noreferrer">
              <Download className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(d)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const pendingColumns: Column<DocumentOut>[] = [
    {
      key: 'type', header: 'Document',
      cell: (d) => (
        <div>
          <p className="font-medium capitalize text-sm">{d.document_type.replace('_', ' ')}</p>
          {d.description && <p className="text-xs text-muted-foreground">{d.description}</p>}
        </div>
      ),
    },
    { key: 'status', header: 'Status', cell: (d) => <StatusBadge status={d.status} /> },
    {
      key: 'actions', header: 'Actions', className: 'w-32',
      cell: (d) => (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7"  onClick={() => handlePreview(d.id)}>
              <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700" onClick={() => openVerify(d, 'verified')}>
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => openVerify(d, 'rejected')}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Documents" description="Upload and manage employee documents">
        <Button onClick={() => { setUploadForm({ document_type: '', description: '' }); setUploadFile(null); setUploadDialog(true) }} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </PageHeader>

      <Tabs defaultValue="my">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="my">My Documents</TabsTrigger>
            {isAdmin && (
              <>
              <TabsTrigger value="pending">
                Pending Verification
                {pendingDocs.length > 0 && <Badge className="ml-2 h-5 px-1.5 text-xs">{pendingDocs.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="all">All Documents</TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        <TabsContent value="my">
          <DataTable columns={docColumns} data={myDocs} isLoading={loading} rowKey={(d) => d.id} />
        </TabsContent>

        {isAdmin && (
          <>
          <TabsContent value="pending">
            <DataTable columns={pendingColumns} data={pendingDocs} isLoading={loading} rowKey={(d) => d.id} />
          </TabsContent>

          <TabsContent value="all">
            <DataTable columns={docColumns} data={allDocs} isLoading={loading} rowKey={(d) => d.id} />
          </TabsContent>
          </>
        )}
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Document Type *</Label>
              <Select value={uploadForm.document_type} onValueChange={(v) => setUploadForm({ ...uploadForm, document_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {docTypes.length > 0 ? docTypes.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                  )) : (
                    ['id_proof', 'address_proof', 'educational', 'experience', 'pan_card', 'aadhar', 'other'].map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>File *</Label>
              <Input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} rows={2} placeholder="Optional description..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialog(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={saving}>{saving ? 'Uploading...' : 'Upload'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Dialog */}
      <Dialog open={verifyDialog} onOpenChange={(o) => { setVerifyDialog(o); if (!o) setVerifyTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{verifyAction} Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Document: <strong className="capitalize">{verifyTarget?.document_type.replace('_', ' ')}</strong>
            </p>
            <div className="space-y-2">
              <Label>Comment</Label>
              <Textarea value={verifyComment} onChange={(e) => setVerifyComment(e.target.value)} rows={2} placeholder="Optional comment..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setVerifyDialog(false); setVerifyTarget(null) }}>Cancel</Button>
            <Button
              onClick={handleVerify}
              className={verifyAction === 'rejected' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {verifyAction === 'verified' ? 'Verify' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Document"
        description="Are you sure you want to delete this document?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />

      <Dialog open={open} onOpenChange={handlePreviewOpenChange}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
          
          <div className="flex items-center justify-between border-b px-4 py-3">
            <DialogTitle className="text-sm font-medium">
              Document Preview
            </DialogTitle>
          </div>

          <div className="h-full">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-[calc(90vh-57px)]"
              />
            )}
          </div>

        </DialogContent>
      </Dialog>
    </div>
  )
}
