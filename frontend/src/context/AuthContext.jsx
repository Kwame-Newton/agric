import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { addRegisteredFarmer } from '../services/chatService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to fetch profile details based on role
  const fetchProfileDetails = async (userId, role) => {
    try {
      if (role === 'farmer') {
        const { data, error } = await supabase
          .from('farmers')
          .select('*')
          .eq('id', userId)
          .single();
        if (!error) return data;
      } else if (role === 'buyer') {
        const { data, error } = await supabase
          .from('buyers')
          .select('*')
          .eq('id', userId)
          .single();
        if (!error) return data;
      }
    } catch (err) {
      console.error('Error fetching role-specific details:', err);
    }
    return null;
  };

  // Helper to construct the session user object
  const handleUserSession = async (sessionUser) => {
    if (!sessionUser) {
      setUser(null);
      localStorage.removeItem('agrilink_user');
      return;
    }

    try {
      // Fetch core profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (error || !profile) {
        console.error('Profile not found:', error);
        setUser(null);
        return;
      }

      // Fetch role specific details
      const details = await fetchProfileDetails(sessionUser.id, profile.role);

      // Verification checks:
      if (profile.role === 'farmer' && details?.verification_status !== 'verified') {
        await supabase.auth.signOut();
        setUser(null);
        localStorage.removeItem('agrilink_user');
        return;
      }

      if (profile.role === 'buyer' && details?.status === 'suspended') {
        await supabase.auth.signOut();
        setUser(null);
        localStorage.removeItem('agrilink_user');
        return;
      }

      const userData = {
        id: sessionUser.id,
        email: sessionUser.email,
        name: profile.full_name,
        phone: profile.phone,
        role: profile.role,
        profileDetails: details,
        loginTime: new Date().toISOString(),
      };

      setUser(userData);
      localStorage.setItem('agrilink_user', JSON.stringify(userData));
    } catch (err) {
      console.error('Error handling user session:', err);
      setUser(null);
    }
  };

  useEffect(() => {
    // Check active session on mount
    const checkSession = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await handleUserSession(session.user);
      } else {
        setUser(null);
        localStorage.removeItem('agrilink_user');
      }
      setIsLoading(false);
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoading(true);
      if (session) {
        await handleUserSession(session.user);
      } else {
        setUser(null);
        localStorage.removeItem('agrilink_user');
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
 
      if (error) {
        const message = error.message?.toLowerCase();
        if (message?.includes('confirm') || message?.includes('not confirmed') || message?.includes('email not confirmed')) {
          return { success: false, error: 'Please confirm your email before logging in.' };
        }
        if (message?.includes('user not found') || message?.includes('invalid login') || message?.includes('invalid credentials')) {
          return { success: false, error: 'Unable to find an account with those credentials. Please confirm your email or try again.' };
        }
        return { success: false, error: error.message };
      }

      // Fetch profile to verify role and status before completing login response
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch error details:', profileError);
        await supabase.auth.signOut();
        return { 
          success: false, 
          error: `User profile not found. (DB Error: ${profileError?.message || 'No profile row found for user ID'})` 
        };
      }

      const authUser = {
        ...data.user,
        role: profile.role,
      };

      if (profile.role === 'farmer') {
        const { data: farmer, error: farmerError } = await supabase
          .from('farmers')
          .select('verification_status')
          .eq('id', data.user.id)
          .single();

        if (farmerError || !farmer || farmer.verification_status !== 'verified') {
          await supabase.auth.signOut();
          return {
            success: false,
            error: 'Your farmer account is pending admin verification. You will be able to log in once approved.'
          };
        }
      } else if (profile.role === 'buyer') {
        const { data: buyer, error: buyerError } = await supabase
          .from('buyers')
          .select('status')
          .eq('id', data.user.id)
          .single();

        if (buyerError || !buyer || buyer.status === 'suspended') {
          await supabase.auth.signOut();
          return {
            success: false,
            error: 'Your buyer account is suspended.'
          };
        }
      }

      return { success: true, user: authUser };
    } catch (err) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  };

  const register = async (data) => {
    try {
      // 1. Sign up user in Supabase Auth with metadata (passed to DB trigger)
      const normalizedEmail = data.email.trim().toLowerCase();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: data.fullName,
            phone: data.phone,
            role: data.role,
            // Farmer specific fields
            farm_name: data.farmName || '',
            farm_location: data.farmLocation || '',
            farm_size: data.farmSize || 0,
            primary_category: data.primaryCategory || 'vegetables',
            id_type: data.idType || 'national',
            id_number: data.idNumber || '',
            farm_bio: data.farmBio || '',
            // Buyer specific fields
            buyer_type: data.buyerType || 'individual',
            payment_method: data.paymentMethod || 'momo',
            delivery_address: data.deliveryAddress || '',
          },
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      const sessionUser = authData.user;
      if (!sessionUser) {
        // When email confirmation is enabled, Supabase may not return a session user immediately.
      }

      if (data.role === 'farmer') {
        const farmerReqObj = {
          id: sessionUser?.id || `farmer-${Date.now()}`,
          farmerName: data.fullName,
          email: normalizedEmail,
          phone: data.phone,
          farmName: data.farmName || `${data.fullName}'s Farm`,
          location: data.farmLocation || 'Ghana',
          dateSubmitted: new Date().toISOString().split('T')[0],
          status: 'pending',
          cropSpecialty: data.primaryCategory || 'Vegetables',
          farmSize: `${data.farmSize || 1} acres`,
          farmDescription: data.farmBio || 'Newly registered farmer account pending admin verification.',
          documents: [
            { name: `ID: ${data.idType || 'National ID'} (${data.idNumber || 'Provided'})`, type: 'id', submitted: true },
            { name: 'Farm Registration Details', type: 'land', submitted: true }
          ],
          notes: ''
        };
        addRegisteredFarmer(farmerReqObj);

        // Sign out immediately so they aren't logged in on the client
        await supabase.auth.signOut();
        return { success: true, user: null, requiresVerification: true };
      }

      return { success: true, user: sessionUser };
    } catch (err) {
      return { success: false, error: err.message || 'An unexpected error occurred during registration' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('agrilink_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
