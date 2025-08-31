import React, { useState } from 'react';
import axios from 'axios';
import { 
    Box, 
    TextField, 
    Button, 
    Typography, 
    Paper,
    Container,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    CircularProgress,
    Alert
} from '@mui/material';

// The public URL for your deployed Cloud Function
const SUBMIT_URL = 'https://us-central1-permi-2881a.cloudfunctions.net/submitDsarRequest';

const DsarFormPage = () => {
    const [userIdentifier, setUserIdentifier] = useState('');
    const [requestType, setRequestType] = useState('access');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setStatus('submitting');
        try {
            await axios.post(SUBMIT_URL, {
                userIdentifier,
                requestType,
                notes
            });
            setStatus('success');
        } catch (error) {
            console.error('Error submitting DSAR request:', error);
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <Container component="main" maxWidth="sm">
                <Paper sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
                    <Typography variant="h5" align="center" gutterBottom>Request Submitted</Typography>
                    <Alert severity="success">
                        Your request has been submitted successfully. We will process it and get back to you shortly.
                    </Alert>
                </Paper>
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="sm">
            <Paper sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
                <Typography variant="h5" align="center" gutterBottom>
                    Data Subject Access Request
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                    Use this form to request access to or erasure of your personal data.
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="userIdentifier"
                        label="Email Address or User ID"
                        name="userIdentifier"
                        autoFocus
                        value={userIdentifier}
                        onChange={(e) => setUserIdentifier(e.target.value)}
                    />
                    <FormControl component="fieldset" margin="normal" required>
                        <FormLabel component="legend">Request Type</FormLabel>
                        <RadioGroup
                            row
                            aria-label="requestType"
                            name="requestType"
                            value={requestType}
                            onChange={(e) => setRequestType(e.target.value)}
                        >
                            <FormControlLabel value="access" control={<Radio />} label="Access my data" />
                            <FormControlLabel value="erasure" control={<Radio />} label="Erase my data" />
                        </RadioGroup>
                    </FormControl>
                    <TextField
                        margin="normal"
                        fullWidth
                        multiline
                        rows={4}
                        id="notes"
                        label="Notes (Optional)"
                        name="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={status === 'submitting'}
                        sx={{ mt: 3, mb: 2 }}
                    >
                        {status === 'submitting' ? <CircularProgress size={24} /> : 'Submit Request'}
                    </Button>
                    {status === 'error' && (
                        <Alert severity="error">Failed to submit request. Please try again later.</Alert>
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default DsarFormPage;
