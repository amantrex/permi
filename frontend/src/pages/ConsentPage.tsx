import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Import the db instance from our firebase config
import { collection, getDocs, addDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { 
    Box, 
    TextField, 
    Button, 
    Typography, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// Updated interface for Firestore
interface Consent {
    id: string; // Firestore document IDs are strings
    name: string;
    content: string;
    button_text: string;
    background_color: string;
    text_color: string;
    createdAt: Timestamp;
}

// The production URL of your Firebase Hosting deployment
const HOSTING_URL = 'https://permi-2881a.web.app';

const ConsentPage = () => {
    const [consents, setConsents] = useState<Consent[]>([]);
    const [formState, setFormState] = useState({
        name: '',
        content: '',
        button_text: 'I Agree',
        background_color: '#ffffff',
        text_color: '#000000'
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedConsent, setSelectedConsent] = useState<Consent | null>(null);

    const consentsCollectionRef = collection(db, "consent_configurations");

    const fetchConsents = async () => {
        try {
            const q = query(consentsCollectionRef, orderBy("createdAt", "desc"));
            const data = await getDocs(q);
            const filteredData = data.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            })) as Consent[];
            setConsents(filteredData);
        } catch (error) {
            console.error('Error fetching consents:', error);
        }
    };

    useEffect(() => {
        fetchConsents();
    }, []);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormState({ ...formState, [event.target.name]: event.target.value });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            await addDoc(consentsCollectionRef, {
                ...formState,
                createdAt: Timestamp.now()
            });
            fetchConsents(); // Refresh the list
            setFormState({ name: '', content: '', button_text: 'I Agree', background_color: '#ffffff', text_color: '#000000' });
        } catch (error) {
            console.error('Error creating consent:', error);
        }
    };

    const handleOpenModal = (consent: Consent) => {
        setSelectedConsent(consent);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedConsent(null);
    };

    const getSnippet = () => {
        if (!selectedConsent) return '';
        // This now points to the script that will be hosted on your Firebase Hosting URL
        return `<script src="${HOSTING_URL}/consent-client.js" id="dpdp-consent-script" data-config-id="${selectedConsent.id}" async></script>`;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(getSnippet());
    };

    return (
        <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 1.5fr' }, gap: 4 }}>
                <Box>
                    <Typography variant="h5" gutterBottom>Create New Consent Banner</Typography>
                    <Paper sx={{ p: 2 }}>
                        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                            <TextField margin="normal" required fullWidth id="name" label="Configuration Name" name="name" autoFocus value={formState.name} onChange={handleInputChange} />
                            <TextField margin="normal" required fullWidth multiline rows={4} id="content" label="Banner Content (HTML allowed)" name="content" value={formState.content} onChange={handleInputChange} />
                            <TextField margin="normal" fullWidth id="button_text" label="Button Text" name="button_text" value={formState.button_text} onChange={handleInputChange} />
                            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>Create Configuration</Button>
                        </Box>
                    </Paper>
                </Box>
                <Box>
                    <Typography variant="h5" gutterBottom>Existing Configurations</Typography>
                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }} aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Content</TableCell>
                                    <TableCell>Created At</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {consents.map((consent) => (
                                    <TableRow key={consent.id}>
                                        <TableCell>{consent.name}</TableCell>
                                        <TableCell>{consent.content}</TableCell>
                                        <TableCell>{consent.createdAt.toDate().toLocaleString()}</TableCell>
                                        <TableCell align="right">
                                            <Button variant="outlined" onClick={() => handleOpenModal(consent)}>Get Snippet</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Box>

            <Dialog open={modalOpen} onClose={handleCloseModal} fullWidth maxWidth="md">
                <DialogTitle>
                    Embeddable Snippet
                    <IconButton aria-label="copy" onClick={copyToClipboard} sx={{ position: 'absolute', right: 8, top: 8}}>
                        <ContentCopyIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <DialogContentText>
                        Copy and paste this snippet into the {'<head>'} section of your website's HTML.
                    </DialogContentText>
                    <Paper elevation={0} sx={{ background: '#f5f5f5', p: 2, mt: 2}}>
                        <pre><code>{getSnippet()}</code></pre>
                    </Paper>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ConsentPage;
