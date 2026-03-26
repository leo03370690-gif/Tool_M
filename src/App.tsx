import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (currentUser) {
        // Listen to the user document for real-time role updates
        unsubscribeDoc = onSnapshot(doc(db, 'users', currentUser.uid), async (docSnap) => {
          if (docSnap.exists()) {
            setRole(docSnap.data().role);
          } else {
            // Check if it's the owner or the default admin by email/username
            // Default admin email is leo.lo@tooling.local
            const userEmail = currentUser.email?.toLowerCase();
            const isOwner = userEmail === 'leo03370690@gmail.com';
            const isDefaultAdmin = userEmail === 'leo.lo@tooling.local';

            if (isOwner || isDefaultAdmin) {
              setRole('admin');
              // Automatically create the document if it's missing
              try {
                await setDoc(doc(db, 'users', currentUser.uid), {
                  username: isOwner ? 'Owner' : 'Leo.Lo',
                  role: 'admin',
                  createdAt: new Date().toISOString()
                });
              } catch (e) {
                console.error("Error creating admin doc:", e);
              }
            } else {
              setRole(null);
            }
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user doc:", error);
          // Fallback for default admin even if snapshot fails
          const userEmail = currentUser.email?.toLowerCase();
          const isOwner = userEmail === 'leo03370690@gmail.com';
          const isDefaultAdmin = userEmail === 'leo.lo@tooling.local';
          if (isOwner || isDefaultAdmin) {
            setRole('admin');
          } else {
            setRole(null);
          }
          setLoading(false);
        });
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" /> : <Login />} 
        />
        <Route 
          path="/*" 
          element={user ? <Dashboard user={user} role={role} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}
