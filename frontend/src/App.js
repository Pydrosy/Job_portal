import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import JobSeekerDashboard from './components/JobSeekerDashboard';
import EmployerDashboard from './components/EmployerDashboard';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Home from './components/Home';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <div className="container mt-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/jobseeker-dashboard" element={
                <PrivateRoute allowedRoles={['jobseeker']}>
                  <JobSeekerDashboard />
                </PrivateRoute>
              } />
              <Route path="/employer-dashboard" element={
                <PrivateRoute allowedRoles={['employer']}>
                  <EmployerDashboard />
                </PrivateRoute>
              } />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;