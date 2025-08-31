import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { 
    Box, TextField, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Divider, List, ListItem, ListItemText, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Chip, Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

// --- DATA STRUCTURES ---
interface ConsentCategory {
    id: string;
    name: string;
    description: string;
    required: boolean;
}

interface ConsentConfiguration {
    id: string; 
    name: string;
    mainContent: string;
    categories: ConsentCategory[];
    createdAt: Timestamp;
}

const HOSTING_URL = 'https://permi-2881a.web.app';

const categoryTemplates: Omit<ConsentCategory, 'id'>[] = [
    { name: 'Strictly Necessary', description: 'These cookies are essential for the website to function and cannot be switched off.', required: true },
    { name: 'Performance & Analytics', description: 'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.', required: false },
    { name: 'Functional', description: 'These cookies enable the website to provide enhanced functionality and personalization.', required: false },
    { name: 'Targeting & Advertising', description: 'These cookies may be set through our site by our advertising partners to build a profile of your interests and show you relevant adverts on other sites.', required: false },
    { name: 'Social Media', description: 'These cookies are set by a range of social media services that we have added to the site to enable you to share our content with your friends and networks.', required: false },
];

const bannerTemplates = [
    { name: 'Simple Notice', mainContent: 'This website uses cookies to ensure you get the best experience.', categories: ['Strictly Necessary'] },
    { name: 'Analytics Opt-In', mainContent: 'We use cookies to analyze our traffic. By clicking “Accept”, you consent to our use of cookies for analytics.', categories: ['Strictly Necessary', 'Performance & Analytics'] },
    { name: 'Full GDPR/DPDP', mainContent: 'We use cookies and other tracking technologies to improve your browsing experience on our website, to show you personalized content and targeted ads, to analyze our website traffic, and to understand where our visitors are coming from.', categories: ['Strictly Necessary', 'Performance & Analytics', 'Functional', 'Targeting & Advertising'] },
];

const ConsentPage = () => {
    const [consents, setConsents] = useState<ConsentConfiguration[]>([]);
    const [formState, setFormState] = useState({ name: '', mainContent: '' });
    const [categories, setCategories] = useState<Omit<ConsentCategory, 'id'>[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedCategoryTemplate, setSelectedCategoryTemplate] = useState('');
    const [selectedBannerTemplate, setSelectedBannerTemplate] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedConsent, setSelectedConsent] = useState<ConsentConfiguration | null>(null);

    const consentsCollectionRef = collection(db, "consent_configurations");

    const fetchConsents = useCallback(async () => {
        const q = query(consentsCollectionRef, orderBy("createdAt", "desc"));
        const data = await getDocs(q);
        setConsents(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as ConsentConfiguration[]);
    }, [consentsCollectionRef]);

    useEffect(() => { fetchConsents(); }, [fetchConsents]);

    const resetForm = () => {
        setFormState({ name: '', mainContent: '' });
        setCategories([]);
        setEditingId(null);
        setSelectedBannerTemplate('');
        setSelectedCategoryTemplate('');
    };

    const handleAddCategory = () => {
        const template = categoryTemplates.find(t => t.name === selectedCategoryTemplate);
        if (template && !categories.find(c => c.name === template.name)) {
            setCategories([...categories, template]);
        }
        setSelectedCategoryTemplate('');
    };

    const handleRemoveCategory = (index: number) => setCategories(categories.filter((_, i) => i !== index));

    const handleBannerTemplateChange = (event: SelectChangeEvent) => {
        const templateName = event.target.value;
        setSelectedBannerTemplate(templateName);
        const template = bannerTemplates.find(t => t.name === templateName);
        if (template) {
            setFormState({ name: template.name, mainContent: template.mainContent });
            const templateCategories = categoryTemplates.filter(ct => template.categories.includes(ct.name));
            setCategories(templateCategories);
        } else {
            resetForm();
        }
    };

    const handleEditClick = (consent: ConsentConfiguration) => {
        setEditingId(consent.id);
        setFormState({ name: consent.name, mainContent: consent.mainContent });
        setCategories(consent.categories);
        window.scrollTo(0, 0);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!formState.name || !formState.mainContent || categories.length === 0) {
            alert('Please fill out all fields and add at least one category.');
            return;
        }

        const finalCategories = categories.map(cat => ({ ...cat, id: cat.name.toLowerCase().replace(/\s+/g, '-') }));
        const dataToSave = { ...formState, categories: finalCategories };

        if (editingId) {
            const consentDoc = doc(db, "consent_configurations", editingId);
            await updateDoc(consentDoc, dataToSave);
        } else {
            await addDoc(consentsCollectionRef, { ...dataToSave, createdAt: Timestamp.now() });
        }
        
        fetchConsents();
        resetForm();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this configuration?')) {
            await deleteDoc(doc(db, "consent_configurations", id));
            fetchConsents();
        }
    };

    const handleOpenModal = (consent: ConsentConfiguration) => {
        setSelectedConsent(consent);
        setModalOpen(true);
    };

    const getSnippet = () => {
        if (!selectedConsent) return '';
        return `<script src="${HOSTING_URL}/consent-client.js" id="dpdp-consent-script" data-config-id="${selectedConsent.id}" async></script>`;
    };

    return (
        <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 1.5fr' }, gap: 4 }}>
                <Box>
                    <Typography variant="h5" gutterBottom>{editingId ? 'Edit Consent Banner' : 'Create New Consent Banner'}</Typography>
                    <Paper sx={{ p: 2 }}>
                        <form onSubmit={handleSubmit}>
                            <Divider sx={{ my: 2 }}><Chip label="Step 1: Add Consent Categories" /></Divider>
                            <Box sx={{ p: 2, border: '1px dashed grey', borderRadius: 1, mb: 2}}>
                                <FormControl fullWidth margin="dense">
                                    <InputLabel>Add a Pre-defined Category</InputLabel>
                                    <Select label="Add a Pre-defined Category" value={selectedCategoryTemplate} onChange={(e) => setSelectedCategoryTemplate(e.target.value)}>
                                        {categoryTemplates.map(t => <MenuItem key={t.name} value={t.name}>{t.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <Button variant="outlined" fullWidth onClick={handleAddCategory} sx={{ mt: 1 }}>Add Category</Button>
                            </Box>
                            <List dense>{categories.map((cat, index) => (<ListItem key={index} secondaryAction={<IconButton edge="end" onClick={() => handleRemoveCategory(index)}><DeleteIcon /></IconButton>}><ListItemText primary={cat.name} secondary={cat.description} /></ListItem>))}</List>

                            <Divider sx={{ my: 2 }}><Chip label="Step 2: Configure Banner Details" /></Divider>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Or Start with a Banner Template</InputLabel>
                                <Select label="Or Start with a Banner Template" value={selectedBannerTemplate} onChange={handleBannerTemplateChange} disabled={!!editingId}>
                                    <MenuItem value=""><em>Custom</em></MenuItem>
                                    {bannerTemplates.map(t => <MenuItem key={t.name} value={t.name}>{t.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField label="Configuration Name" name="name" fullWidth required margin="normal" value={formState.name} onChange={(e) => setFormState({...formState, name: e.target.value})} />
                            <TextField label="Main Banner Content" name="mainContent" fullWidth required multiline rows={3} margin="normal" value={formState.mainContent} onChange={(e) => setFormState({...formState, mainContent: e.target.value})} />
                            
                            <Stack direction="row" spacing={2} sx={{ mt: 3, mb: 2 }}>
                                <Button type="submit" fullWidth variant="contained">{editingId ? 'Update Configuration' : 'Save Configuration'}</Button>
                                {editingId && <Button fullWidth variant="outlined" onClick={resetForm}>Cancel Edit</Button>}
                            </Stack>
                        </form>
                    </Paper>
                </Box>
                <Box>
                    <Typography variant="h5" gutterBottom>Existing Configurations</Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Main Content</TableCell><TableCell>Categories</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                            <TableBody>{consents.map((consent) => (<TableRow key={consent.id}><TableCell>{consent.name}</TableCell><TableCell>{consent.mainContent}</TableCell><TableCell>{consent.categories.length}</TableCell><TableCell align="right"><IconButton aria-label="edit" onClick={() => handleEditClick(consent)}><EditIcon /></IconButton><IconButton aria-label="delete" onClick={() => handleDelete(consent.id)}><DeleteIcon /></IconButton><Button variant="outlined" size="small" onClick={() => handleOpenModal(consent)}>Get Snippet</Button></TableCell></TableRow>))}</TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Box>

            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>Embeddable Snippet</DialogTitle>
                <DialogContent dividers><pre><code>{getSnippet()}</code></pre></DialogContent>
                <DialogActions><Button onClick={() => setModalOpen(false)}>Close</Button></DialogActions>
            </Dialog>
        </>
    );
};

export default ConsentPage;