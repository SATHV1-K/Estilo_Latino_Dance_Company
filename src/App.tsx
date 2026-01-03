import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/screens/LoginScreen';
import { SignUpScreen } from './components/screens/SignUpScreen';
import { ResetPasswordScreen } from './components/screens/ResetPasswordScreen';
import { WaiverFormScreen } from './components/screens/WaiverFormScreen';
import { WaiverReviewScreen } from './components/screens/WaiverReviewScreen';
import { CustomerDashboard } from './components/screens/CustomerDashboard';
import { PunchCardOptions } from './components/screens/PunchCardOptions';
import { PaymentScreen } from './components/screens/PaymentScreen';
import { CustomerProfile } from './components/screens/CustomerProfile';
import { CustomerHistory } from './components/screens/CustomerHistory';
import { StaffPunchInterface } from './components/screens/StaffPunchInterface';
import { StaffHistory } from './components/screens/StaffHistory';
import { AdminPunchInterface } from './components/screens/AdminPunchInterface';
import { AdminModify } from './components/screens/AdminModify';
import { AdminHistory } from './components/screens/AdminHistory';
import { AdminDashboard } from './components/screens/AdminDashboard';
import { BottomNav, NavTab } from './components/BottomNav';
import { SuccessModal } from './components/SuccessModal';
import LoadingSpinner from './components/LoadingSpinner';
import { authService, punchCardService, waiverService } from './services';
import type { User, PunchCard, PunchCardOption } from './services';
import type { WaiverFormData } from './services/waiverService';

type Screen =
  | 'login'
  | 'signup'
  | 'reset-password'
  | 'waiver-form'
  | 'waiver-review'
  | 'customer-dashboard'
  | 'customer-buy-cards'
  | 'customer-history'
  | 'customer-profile'
  | 'checkout'
  | 'staff-punch'
  | 'staff-history'
  | 'admin-punch'
  | 'admin-modify'
  | 'admin-history'
  | 'admin-dashboard';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedCard, setSelectedCard] = useState<PunchCardOption | null>(null);
  const [userActiveCard, setUserActiveCard] = useState<PunchCard | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
  const [waiverFormData, setWaiverFormData] = useState<WaiverFormData | null>(null);
  const [signupPassword, setSignupPassword] = useState<string>(''); // Store password during waiver flow
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Check for reset password token in URL on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (window.location.pathname === '/reset-password' && token) {
      setResetToken(token);
      setCurrentScreen('reset-password');
      // Clean URL
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  // Restore user session on page load (prevents logout on refresh)
  // Only restore if there's a valid token - validates with server
  useEffect(() => {
    const restoreSession = async () => {
      const savedUser = authService.getCurrentUser();
      const hasToken = authService.hasValidToken();

      if (savedUser && hasToken && !currentUser) {
        try {
          // Validate token with server before restoring
          const isValid = await authService.validateSession();
          if (isValid) {
            setCurrentUser(savedUser);
            // Navigate to appropriate dashboard based on role
            if (savedUser.role === 'customer') {
              setCurrentScreen('customer-dashboard');
              setActiveTab('home');
            } else if (savedUser.role === 'staff') {
              setCurrentScreen('staff-punch');
              setActiveTab('home');
            } else if (savedUser.role === 'admin') {
              setCurrentScreen('admin-punch');
              setActiveTab('home');
            }
          } else {
            // Token invalid, clear saved data
            authService.logout();
          }
        } catch {
          // Validation failed, clear saved data
          authService.logout();
        }
      }
    };
    restoreSession();
  }, []);


  // Load user's active card when user logs in
  useEffect(() => {
    if (currentUser && currentUser.role === 'customer') {
      loadUserActiveCard();
    }
  }, [currentUser]);

  const loadUserActiveCard = async () => {
    if (!currentUser) return;
    try {
      // Use getMyActiveCard for customers (doesn't require staff permission)
      const card = await punchCardService.getMyActiveCard();
      setUserActiveCard(card);
    } catch (error) {
      console.error('Error loading active card:', error);
    }
  };

  const handleLogin = async (email: string, password: string, role: 'customer' | 'staff') => {
    setIsLoading(true);
    try {
      const { user } = await authService.login(email, password, role);
      setCurrentUser(user);

      // Navigate based on role
      if (user.role === 'customer') {
        setCurrentScreen('customer-dashboard');
        setActiveTab('home');
      } else if (user.role === 'staff') {
        setCurrentScreen('staff-punch');
        setActiveTab('home');
      } else if (user.role === 'admin') {
        setCurrentScreen('admin-punch');
        setActiveTab('home');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.message || 'Unknown error';
      alert(`Login failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    // Store signup data and password temporarily and redirect to waiver form
    setSignupPassword(data.password); // Store password for later
    setWaiverFormData({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: '',
      city: '',
      state: '',
      zipCode: '',
      birthday: '',
      gender: 'prefer-not-to-say',
      occupation: '',
      source: '',
      signatureDataUrl: '',
      signatureDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });
    setCurrentScreen('waiver-form');
  };

  const handleWaiverFormSubmit = (additionalData: Omit<WaiverFormData, 'firstName' | 'lastName' | 'email' | 'phone'>) => {
    if (!waiverFormData) return;

    // Merge signup data with waiver form data
    const completeWaiverData: WaiverFormData = {
      ...waiverFormData,
      ...additionalData
    };

    setWaiverFormData(completeWaiverData);
    setCurrentScreen('waiver-review');
  };

  const handleWaiverConfirm = async () => {
    if (!waiverFormData || !signupPassword) return;
    if (isLoading) return; // Prevent double-submit

    setShowSuccessModal(false); // Close any existing modal
    setIsLoading(true);

    try {
      // Use the combined signup + waiver endpoint
      const result = await waiverService.signupWithWaiver(signupPassword, waiverFormData);

      // Create user object from result - include all fields from the signup response
      const user: User = {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        phone: result.user.phone || waiverFormData.phone,
        role: 'customer',
        createdAt: result.user.createdAt || new Date().toISOString(),
        qrCode: result.user.qrCode,
        checkInCode: result.user.checkInCode,
        birthday: result.user.birthday
      };

      setCurrentUser(user);
      setSuccessMessage({
        title: 'Welcome to Estilo Latino!',
        message: `Your account has been created and waiver submitted. A copy has been sent to ${waiverFormData.email}.`
      });
      setShowSuccessModal(true);

      setTimeout(() => {
        setCurrentScreen('customer-dashboard');
        setActiveTab('home');
        setWaiverFormData(null);
        setSignupPassword(''); // Clear password
      }, 3000);
    } catch (error: any) {
      console.error('Error completing registration:', error);
      // Show more detailed error message
      const errorMessage = error?.message || 'Unknown error occurred';
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        alert('This email is already registered. Please log in instead or use a different email.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        alert('Network error. Please check your internet connection and try again.');
      } else {
        alert(`Registration failed: ${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setUserActiveCard(null);
    setCurrentScreen('login');
    setActiveTab('home');
  };

  const handleSelectCard = (card: PunchCardOption) => {
    setSelectedCard(card);
    setCurrentScreen('checkout');
  };

  const handlePaymentSuccess = async (punchCardId: string) => {
    // Load the new punch card
    if (currentUser) {
      await loadUserActiveCard();
    }

    setSuccessMessage({
      title: 'Purchase Complete!',
      message: 'Your punch card has been activated and is ready to use.'
    });
    setShowSuccessModal(true);
    setSelectedCard(null);
    setTimeout(() => {
      setCurrentScreen('customer-dashboard');
      setActiveTab('home');
    }, 2500);
  };

  const handleBottomNavChange = (tab: NavTab) => {
    setActiveTab(tab);

    if (!currentUser) return;

    if (currentUser.role === 'customer') {
      switch (tab) {
        case 'home':
          setCurrentScreen('customer-dashboard');
          break;
        case 'cards':
          setCurrentScreen('customer-buy-cards');
          break;
        case 'history':
          setCurrentScreen('customer-history');
          break;
        case 'profile':
          setCurrentScreen('customer-profile');
          break;
      }
    } else if (currentUser.role === 'staff') {
      switch (tab) {
        case 'home':
          setCurrentScreen('staff-punch');
          break;
        case 'history':
          setCurrentScreen('staff-history');
          break;
        case 'profile':
          // Logout for staff
          handleLogout();
          break;
      }
    } else if (currentUser.role === 'admin') {
      switch (tab) {
        case 'home':
          setCurrentScreen('admin-punch');
          break;
        case 'modify':
          setCurrentScreen('admin-modify');
          break;
        case 'history':
          setCurrentScreen('admin-history');
          break;
        case 'admin':
          setCurrentScreen('admin-dashboard');
          break;
        case 'profile':
          // Logout for admin
          handleLogout();
          break;
      }
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return (
          <LoginScreen
            onLogin={handleLogin}
            onSignUpClick={() => setCurrentScreen('signup')}
          />
        );

      case 'signup':
        return (
          <SignUpScreen
            onSignUp={handleSignUp}
            onBackToLogin={() => setCurrentScreen('login')}
          />
        );

      case 'reset-password':
        return resetToken ? (
          <ResetPasswordScreen
            token={resetToken}
            onSuccess={() => {
              setResetToken(null);
              setCurrentScreen('login');
            }}
            onCancel={() => {
              setResetToken(null);
              setCurrentScreen('login');
            }}
          />
        ) : null;

      case 'customer-dashboard':
        return currentUser && (
          <CustomerDashboard
            userName={`${currentUser.firstName} ${currentUser.lastName}`}
            activeCard={userActiveCard}
            onBuyMoreClasses={() => {
              setCurrentScreen('customer-buy-cards');
              setActiveTab('cards');
            }}
            onViewHistory={() => {
              setCurrentScreen('customer-history');
              setActiveTab('history');
            }}
          />
        );

      case 'customer-buy-cards':
        return (
          <PunchCardOptions
            onBack={() => {
              setCurrentScreen('customer-dashboard');
              setActiveTab('home');
            }}
            onSelectCard={handleSelectCard}
          />
        );

      case 'customer-history':
        return currentUser && (
          <CustomerHistory userId={currentUser.id} />
        );

      case 'customer-profile':
        return currentUser && (
          <CustomerProfile
            user={currentUser}
            onLogout={handleLogout}
          />
        );

      case 'checkout':
        return selectedCard && currentUser ? (
          <PaymentScreen
            selectedCard={selectedCard}
            user={currentUser}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={() => setCurrentScreen('customer-buy-cards')}
          />
        ) : null;

      case 'staff-punch':
        return <StaffPunchInterface />;

      case 'staff-history':
        return <StaffHistory />;

      case 'admin-punch':
        return <AdminPunchInterface />;

      case 'admin-modify':
        return <AdminModify />;

      case 'admin-history':
        return <AdminHistory />;

      case 'admin-dashboard':
        return <AdminDashboard />;

      case 'waiver-form':
        return waiverFormData ? (
          <WaiverFormScreen
            firstName={waiverFormData.firstName}
            lastName={waiverFormData.lastName}
            email={waiverFormData.email}
            phone={waiverFormData.phone}
            onSubmit={handleWaiverFormSubmit}
            onBack={() => setCurrentScreen('signup')}
          />
        ) : null;

      case 'waiver-review':
        return waiverFormData ? (
          <WaiverReviewScreen
            formData={waiverFormData}
            onConfirm={handleWaiverConfirm}
            onBack={() => setCurrentScreen('waiver-form')}
            isSubmitting={isLoading}
          />
        ) : null;

      default:
        return null;
    }
  };

  const showBottomNav = currentScreen !== 'login' && currentScreen !== 'signup' && currentScreen !== 'checkout' && currentScreen !== 'waiver-form' && currentScreen !== 'waiver-review';

  return (
    <div className="relative min-h-screen bg-brand-black">
      {isLoading && <LoadingSpinner fullScreen message="Loading..." />}

      {renderScreen()}

      {showBottomNav && currentUser && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={handleBottomNavChange}
          userRole={currentUser.role}
        />
      )}

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successMessage.title}
        message={successMessage.message}
      />
    </div>
  );
}