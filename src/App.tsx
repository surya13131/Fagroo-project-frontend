import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute'; // Adjust path if needed

// Pages
import { Login } from './components/Login';
import { Home } from './components/Home';
import { AdminDashboard } from './components/AdminDashboard'; 
import { ProductDetails } from './components/ProductDetails'; 

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
   
          <Route path="/" element={<Login />} />
          
  
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />


          <Route 
            path="/product/:id" 
            element={
              <ProtectedRoute>
                <ProductDetails />
              </ProtectedRoute>
            } 
          />

          
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;