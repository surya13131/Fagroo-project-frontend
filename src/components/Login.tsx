import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'; // Added Firestore imports

export const Login = () => {
  // Toggle state between Login and Register
  const [isLogin, setIsLogin] = useState<boolean>(true);
  
  // Form state
  const [name, setName] = useState<string>(''); // Only used for registration
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN FLOW ---
        const auth = getAuth();
        const db = getFirestore();

        await login(email, password);

        const uid = auth.currentUser?.uid;
        if (uid) {
          const snap = await getDoc(doc(db, "users", uid));
          if (snap.exists() && snap.data().role === "admin") {
            navigate("/admin");
          } else {
            navigate("/home");
          }
        }
      } else {
        // --- REGISTER FLOW ---
        const auth = getAuth();
        const db = getFirestore(); // Initialize Firestore
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update Firebase profile with the user's Name
        await updateProfile(userCredential.user, { displayName: name });
        
        // Save the user document to Firestore (CRITICAL FOR ADMIN ROLE)
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          name: name,
          email: email,
          role: 'buyer' // Hardcoding default role as buyer
        });
        
        navigate('/home'); // Redirect to Home on success
      }
    } catch (err: any) {
      setError(err.message || (isLogin ? 'Failed to log in.' : 'Failed to register.'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(''); // Clear any existing errors when switching modes
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          {isLogin ? 'AgriTech Login' : 'Create an Account'}
        </h2>
        
        {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Show Name field only if in Register mode */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading 
              ? (isLogin ? 'Logging in...' : 'Creating Account...') 
              : (isLogin ? 'Log In' : 'Register')}
          </button>
        </form>

        {/* Toggle between Login and Register modes */}
        <p className="mt-4 text-sm text-center text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            onClick={toggleMode} 
            className="font-semibold text-green-600 hover:underline focus:outline-none"
          >
            {isLogin ? 'Register' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};