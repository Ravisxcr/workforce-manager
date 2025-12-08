import {CheckCircle, Clock, XCircle} from 'lucide-react';

export const getStatusColor = (status) => {
switch (status) {
    case 'Approved':
    return 'secondary';
    case 'Pending':
    return 'outline';
    case 'Rejected':
    return 'destructive';
    default:
    return 'outline';
}
};

export const getStatusIcon = (status) => {
switch (status) {
    case 'Approved':
    return <CheckCircle className="h-4 w-4" />;
    case 'Pending':
    return <Clock className="h-4 w-4" />;
    case 'Rejected':
    return <XCircle className="h-4 w-4" />;
    default:
    return null;
}
};