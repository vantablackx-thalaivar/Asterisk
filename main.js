
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    updateProfile,
    GoogleAuthProvider,
    GithubAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const authContainer = document.getElementById('auth-container');
const loggedInContainer = document.getElementById('logged-in-container');
const userEmailSpan = document.getElementById('user-email');
const logoutButton = document.getElementById('logout-button');

const authForm = document.getElementById('auth-form');
const nameContainer = document.getElementById('name-container');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitButton = document.getElementById('login-button');
const linksContainer = document.querySelector('.links p');
const h1 = document.querySelector('h1');
const passwordVisibilityToggle = document.querySelector('.password-wrapper .material-symbols-outlined');
const googleSignInButton = document.getElementById('google-signin');
const githubSignInButton = document.getElementById('github-signin');

let isSignUp = false;

// --- UI UPDATE FUNCTIONS ---
function showLoggedInUI(user) {
    authContainer.style.display = 'none';
    loggedInContainer.style.display = 'block';
    userEmailSpan.textContent = user.email;
}

function showLoginUI() {
    authContainer.style.display = 'block';
    loggedInContainer.style.display = 'none';
}

// --- FUNCTIONS ---

function toggleAuthMode() {
    isSignUp = !isSignUp;
    document.querySelector('#auth-container h1').innerHTML = isSignUp ? 'Create your new <br>Universe' : 'Your Universe of <br>Conversation';
    submitButton.textContent = isSignUp ? 'Sign Up' : 'Login';
    submitButton.classList.toggle('signup-button', isSignUp);
    nameContainer.style.display = isSignUp ? 'block' : 'none';
    linksContainer.innerHTML = isSignUp ? 'Already have an account? <a href="#" id="login-link">Login</a>' : 'Don\'t have an account? <a href="#" id="signup-link">Sign Up</a>';
}

async function handleSocialSignIn(provider) {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            await setDoc(userDocRef, {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                createdAt: new Date()
            });
            console.log('New user signed in via popup and data stored!');
        } else {
            console.log('Existing user signed in via popup.');
        }
        showLoggedInUI(user); // Manually update UI

    } catch (error) {
        console.error("Social sign-in error:", error.code, error.message);
        if (error.code === 'auth/account-exists-with-different-credential') {
            alert('An account already exists with the same email address. Please sign in with the original method.');
        } else if (error.code === 'auth/popup-closed-by-user') {
            console.log("Sign-in process was cancelled by the user.");
        } else {
            alert(`Error: ${error.message}`);
        }
    }
}

// --- AUTH STATE OBSERVER ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        showLoggedInUI(user);
    } else {
        showLoginUI();
    }
});

// --- EVENT LISTENERS ---

document.querySelector('.links').addEventListener('click', (e) => {
    if (e.target.id === 'signup-link' || e.target.id === 'login-link') {
        e.preventDefault();
        toggleAuthMode();
    }
});

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    const name = nameInput.value;

    if (isSignUp) {
        let userCredentialHolder;
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                userCredentialHolder = userCredential;
                const displayName = name || email.split('@')[0];
                return updateProfile(userCredential.user, { displayName: displayName });
            })
            .then(() => {
                const user = userCredentialHolder.user;
                return setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    email: email,
                    name: name || email.split('@')[0],
                    createdAt: new Date()
                });
            })
            .then(() => {
                const displayName = name || email.split('@')[0];
                console.log('Signed up and user data stored successfully!');
                alert(`Sign up successful, ${displayName}! Please log in.`);
                toggleAuthMode();
            })
            .catch((error) => {
                console.error('Sign up error:', error.code, error.message);
                alert(`Error: ${error.message}`);
            });
    } else {
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log('Logged in successfully!');
                showLoggedInUI(userCredential.user);
            })
            .catch((error) => {
                console.error('Login error:', error.code, error.message);
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    alert('Invalid email or password.');
                } else {
                    alert(`Error: ${error.message}`);
                }
            });
    }
});

passwordVisibilityToggle.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordVisibilityToggle.textContent = 'visibility';
    } else {
        passwordInput.type = 'password';
        passwordVisibilityToggle.textContent = 'visibility_off';
    }
});

googleSignInButton.addEventListener('click', () => {
    handleSocialSignIn(new GoogleAuthProvider());
});

githubSignInButton.addEventListener('click', () => {
    handleSocialSignIn(new GithubAuthProvider());
});

logoutButton.addEventListener('click', () => {
    signOut(auth).catch(error => {
        console.error('Logout Error:', error);
        alert('Failed to log out.');
    });
});
