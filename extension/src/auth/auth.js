import { 
  auth, 
  googleProvider, 
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithRedirect, 
  getRedirectResult 
} from '../firebase.js';

// DOM Elements
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const mainBtn = document.getElementById('main-btn');
const toggleLink = document.getElementById('toggle-link');
const toggleText = document.getElementById('toggle-text');
const googleBtn = document.getElementById('google-btn');
const errorMessage = document.getElementById('error-message');
const authSubtitle = document.getElementById('auth-subtitle');

// State
let isLoginMode = true;

// Handle Redirect Result on page load
async function checkRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      await handleSuccessfulAuth(result.user);
    }
  } catch (error) {
    showError(getErrorMessage(error.code));
  }
}
checkRedirectResult();

// Toggle Mode
toggleLink.addEventListener('click', (e) => {
  e.preventDefault();
  isLoginMode = !isLoginMode;
  
  if (isLoginMode) {
    mainBtn.textContent = 'Login';
    toggleText.textContent = "Don't have an account? ";
    toggleLink.textContent = 'Sign up';
    authSubtitle.textContent = 'Sign in to start scanning';
  } else {
    mainBtn.textContent = 'Sign up';
    toggleText.textContent = "Already have an account? ";
    toggleLink.textContent = 'Login';
    authSubtitle.textContent = 'Create an account to start scanning';
  }
  errorMessage.textContent = '';
});

// Email/Password Auth
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  errorMessage.textContent = '';
  mainBtn.disabled = true;
  
  try {
    let userCredential;
    if (isLoginMode) {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } else {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
    }
    await handleSuccessfulAuth(userCredential.user);
  } catch (error) {
    showError(getErrorMessage(error.code));
    mainBtn.disabled = false;
  }
});

// Google OAuth
googleBtn.addEventListener('click', () => {
  errorMessage.textContent = '';
  try {
    if (typeof chrome !== 'undefined' && chrome.identity) {
      chrome.identity.getAuthToken({ interactive: true }, async function(token) {
        if (chrome.runtime.lastError) {
          showError(chrome.runtime.lastError.message);
          return;
        }
        
        try {
          const credential = GoogleAuthProvider.credential(null, token);
          const userCredential = await signInWithCredential(auth, credential);
          await handleSuccessfulAuth(userCredential.user);
        } catch (error) {
          showError(getErrorMessage(error.code));
        }
      });
    } else {
      showError('Google Login requires Chrome Extension context.');
    }
  } catch (error) {
    showError(getErrorMessage(error.code));
  }
});

// Success Handler
async function handleSuccessfulAuth(user) {
  try {
    const token = await user.getIdToken();
    
    // Store in chrome.storage.local if running in extension context
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ 
        userId: user.uid,
        userToken: token 
      });
    }
    
    // Post message to parent window
    if (window.parent) {
      window.parent.postMessage('pf-auth-success', '*');
    }
  } catch (error) {
    console.error('Error handling successful auth:', error);
    showError('Authentication succeeded but failed to save session.');
  }
}

// Helper: Show Error
function showError(msg) {
  errorMessage.textContent = msg;
}

// Helper: Friendly Error Messages
function getErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    default:
      return 'Authentication failed. Please try again.';
  }
}
