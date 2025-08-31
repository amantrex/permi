import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Box, CssBaseline, Tabs, Tab } from '@mui/material';
import ConsentPage from './pages/ConsentPage';
import DsarPage from './pages/DsarPage';
import DsarFormPage from './pages/DsarFormPage'; // Import the new public form page
import './App.css';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Layout for the admin dashboard
const AdminLayout = () => {
  const [value, setValue] = useState(0);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            DPDP Compliance Dashboard
          </Typography>
        </Toolbar>
        <Tabs value={value} onChange={handleChange} indicatorColor="secondary" textColor="inherit">
          <Tab label="Consent Management" />
          <Tab label="DSAR Management" />
        </Tabs>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3, height: '100vh', overflow: 'auto' }}>
        <Toolbar />
        <Toolbar />
        <Container maxWidth="xl">
          <TabPanel value={value} index={0}>
            <ConsentPage />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <DsarPage />
          </TabPanel>
        </Container>
      </Box>
    </Box>
  );
};

// Main App component to handle routing
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />} />
        <Route path="/dsar-request" element={<DsarFormPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
