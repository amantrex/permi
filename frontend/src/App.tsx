import React, { useState, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Box, CssBaseline, Tabs, Tab, Button } from '@mui/material';
import { AuthProvider, useAuth } from './AuthContext';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

import ConsentPage from './pages/ConsentPage';
import DsarPage from './pages/DsarPage';
import DsarFormPage from './pages/DsarFormPage';
import LoginPage from './pages/LoginPage';
import './App.css';

// --- Protected Route Component ---
interface ProtectedRouteProps {
    children: ReactNode;
}
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { currentUser } = useAuth();
    if (!currentUser) {
        return <Navigate to="/login" />;
    }
    return <>{children}</>;
};


// --- Tab Panel Helper Component ---
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return <div hidden={value !== index}>{value === index && <Box sx={{ p: 3 }}>{children}</Box>}</div>;
}


// --- Main Admin Dashboard Layout ---
const AdminLayout = () => {
  const [value, setValue] = useState(0);
  const { currentUser } = useAuth();

  const handleSignOut = () => {
      signOut(auth);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            DPDP Compliance Dashboard
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>{currentUser?.email}</Typography>
          <Button color="inherit" variant="outlined" onClick={handleSignOut}>Sign Out</Button>
        </Toolbar>
        <Tabs value={value} onChange={(e, val) => setValue(val)} indicatorColor="secondary" textColor="inherit">
          <Tab label="Consent Management" />
          <Tab label="DSAR Management" />
        </Tabs>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3, height: '100vh', overflow: 'auto' }}>
        <Toolbar />
        <Toolbar />
        <Container maxWidth="xl">
          <TabPanel value={value} index={0}><ConsentPage /></TabPanel>
          <TabPanel value={value} index={1}><DsarPage /></TabPanel>
        </Container>
      </Box>
    </Box>
  );
};


// --- Main App Component with Routing ---
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dsar-request" element={<DsarFormPage />} />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;