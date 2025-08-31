import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { 
    Box, 
    Button, 
    Typography, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper,
    Chip
} from '@mui/material';

// Interface for a DSAR Request
interface DsarRequest {
    id: string;
    userIdentifier: string;
    requestType: 'access' | 'erasure';
    status: 'pending' | 'completed';
    notes: string;
    receivedAt: Timestamp;
    completedAt?: Timestamp | null;
}

const DsarPage = () => {
    const [requests, setRequests] = useState<DsarRequest[]>([]);

    const dsarCollectionRef = collection(db, "dsar_requests");

    const fetchRequests = useCallback(async () => {
        try {
            const q = query(dsarCollectionRef, orderBy("receivedAt", "desc"));
            const data = await getDocs(q);
            const filteredData = data.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            })) as DsarRequest[];
            setRequests(filteredData);
        } catch (error) {
            console.error('Error fetching DSAR requests:', error);
        }
    }, [dsarCollectionRef]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleMarkAsComplete = async (id: string) => {
        try {
            const requestDoc = doc(db, "dsar_requests", id);
            await updateDoc(requestDoc, {
                status: 'completed',
                completedAt: Timestamp.now()
            });
            fetchRequests(); // Refresh the list
        } catch (error) {
            console.error('Error updating request status:', error);
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>DSAR Management</Typography>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="dsar requests table">
                    <TableHead>
                        <TableRow>
                            <TableCell>User Identifier</TableCell>
                            <TableCell>Request Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Received At</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {requests.map((request) => (
                            <TableRow key={request.id}>
                                <TableCell>{request.userIdentifier}</TableCell>
                                <TableCell>{request.requestType}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={request.status}
                                        color={request.status === 'pending' ? 'warning' : 'success'} 
                                    />
                                </TableCell>
                                <TableCell>{request.receivedAt.toDate().toLocaleString()}</TableCell>
                                <TableCell align="right">
                                    {request.status === 'pending' && (
                                        <Button variant="contained" onClick={() => handleMarkAsComplete(request.id)}>
                                            Mark Complete
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default DsarPage;
