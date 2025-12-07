import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { verificationAPI } from '../lib/api';
import { mockVerificationStatus } from '../lib/mockData';
import { ShieldCheck, Upload, CheckCircle, XCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';

const Verification = () => {
  const [documents, setDocuments] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVerificationData();
  }, []);

  const fetchVerificationData = async () => {
    try {
      setLoading(true);
      const [status, requiredDocs] = await Promise.all([
        verificationAPI.getVerificationStatus(),
        verificationAPI.getRequiredDocuments(),
      ]);
      setVerificationStatus(status);
      setDocuments(requiredDocs.documents || requiredDocs);
    } catch (err) {
      console.error('Failed to fetch verification data:', err);
      setError(err.message);
      // Fallback to mock data
      setVerificationStatus(mockVerificationStatus);
      setDocuments(mockVerificationStatus.requiredDocuments);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, documentId) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile({ documentId, file });
    }
  };

  const handleUpload = async (documentId) => {
    if (selectedFile && selectedFile.documentId === documentId) {
      setUploading(true);
      try {
        const document = documents.find((d) => d.id === documentId);
        await verificationAPI.uploadDocument(document.name, selectedFile.file);
        
        // Update local state
        setDocuments(
          documents.map((doc) =>
            doc.id === documentId ? { ...doc, uploaded: true } : doc
          )
        );
        setSelectedFile(null);
        alert(`${document.name} uploaded successfully!`);
      } catch (err) {
        console.error('Upload failed:', err);
        alert(`Failed to upload document: ${err.message}`);
      } finally {
        setUploading(false);
      }
    }
  };

  const allRequiredDocsUploaded = documents
    .filter((doc) => doc.required)
    .every((doc) => doc.uploaded);

  const handleSubmitVerification = async () => {
    if (allRequiredDocsUploaded) {
      try {
        await verificationAPI.submitVerification();
        alert('Verification submitted successfully! You will be notified once reviewed.');
        await fetchVerificationData();
      } catch (err) {
        console.error('Failed to submit verification:', err);
        alert(`Failed to submit verification: ${err.message}`);
      }
    } else {
      alert('Please upload all required documents before submitting.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const status = verificationStatus || mockVerificationStatus;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">ID Verification</h2>
        <p className="text-gray-500 mt-1">Complete your identity verification process</p>
      </div>

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Verification Status</CardTitle>
              <CardDescription className="mt-1">
                Current status of your identity verification
              </CardDescription>
            </div>
            <div className="p-3 bg-orange-50 rounded-full">
              {status.idVerified ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <AlertCircle className="h-8 w-8 text-orange-600" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Verification Status</p>
                <p className="text-sm text-gray-500 mt-1">
                  {status.idVerified
                    ? 'Your identity has been verified'
                    : 'Verification is pending'}
                </p>
              </div>
              <Badge
                variant={status.idVerified ? 'secondary' : 'outline'}
              >
                {status.verificationStatus}
              </Badge>
            </div>

            {!status.idVerified && (
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Action Required</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Please upload all required documents to complete your verification process.
                    This is essential for accessing salary payments and other benefits.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Required Documents</CardTitle>
          <CardDescription>
            Upload the following documents for verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`p-4 border rounded-lg ${
                  doc.uploaded ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      doc.uploaded ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {doc.uploaded ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        {doc.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {doc.uploaded
                          ? 'Document uploaded successfully'
                          : 'Please upload a clear copy of your document'}
                      </p>
                      
                      {!doc.uploaded && (
                        <div className="mt-3 flex items-center space-x-2">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(e, doc.id)}
                            className="max-w-xs"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpload(doc.id)}
                            disabled={!selectedFile || selectedFile.documentId !== doc.id || uploading}
                          >
                            {uploading && selectedFile?.documentId === doc.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {doc.uploaded && (
                    <Badge variant="secondary" className="ml-2">
                      Uploaded
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              size="lg"
              onClick={handleSubmitVerification}
              disabled={!allRequiredDocsUploaded}
            >
              <ShieldCheck className="h-5 w-5 mr-2" />
              Submit for Verification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verification Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Guidelines</CardTitle>
          <CardDescription>Important information about document submission</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <p className="text-gray-600">
                Ensure all documents are clear, legible, and not expired.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <p className="text-gray-600">
                Accepted formats: PDF, JPG, JPEG, PNG (Max size: 5MB per file).
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <p className="text-gray-600">
                Documents should match the name registered in your employee profile.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <p className="text-gray-600">
                Verification usually takes 2-3 business days after submission.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <p className="text-gray-600">
                You will receive a notification once your verification is complete.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>Contact support if you face any issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              If you're having trouble uploading documents or have questions about the
              verification process, please contact our HR department:
            </p>
            <div className="flex flex-col space-y-1 mt-3">
              <p className="text-sm">
                <span className="font-medium">Email:</span> hr@company.com
              </p>
              <p className="text-sm">
                <span className="font-medium">Phone:</span> +91 1234567890
              </p>
              <p className="text-sm">
                <span className="font-medium">Office Hours:</span> Mon-Fri, 9:00 AM - 6:00 PM
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Verification;
