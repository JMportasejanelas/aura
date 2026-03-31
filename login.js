import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDIo0BoZfIoK7a46ZcrDY29Jex5A61EgS0",
  authDomain: "aura-174f2.firebaseapp.com",
  projectId: "aura-174f2",
  storageBucket: "aura-174f2.firebasestorage.app",
  messagingSenderId: "709054421042",
  appId: "1:709054421042:web:95c23e00cebbbd716fc42b",
  measurementId: "G-1S8M0195VZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const modeText = {
  login: {
    action: 'Entrar',
    subtitle: 'Use seu email e senha para acessar a sua conta Aura.',
  },
  signup: {
    action: 'Cadastrar',
    subtitle: 'Crie uma conta Aura com email, senha e um apelido de usuário.',
  },
};

const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const actionButton = document.getElementById('action-button');
const subtitle = document.getElementById('subtitle');
const messageBox = document.getElementById('message');
const fieldEmail = document.getElementById('field-email');
const fieldUsername = document.getElementById('field-username');
const emailInput = document.getElementById('email');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('senha');

let currentMode = 'login';

function showMessage(text, type = 'error') {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
}

function clearMessage() {
  messageBox.textContent = '';
  messageBox.className = 'message';
}

function setMode(mode) {
  currentMode = mode;
  tabLogin.classList.toggle('active', mode === 'login');
  tabSignup.classList.toggle('active', mode === 'signup');
  actionButton.textContent = modeText[mode].action;
  subtitle.textContent = modeText[mode].subtitle;
  fieldUsername.style.display = mode === 'signup' ? 'grid' : 'none';
  clearMessage();
}

window.setMode = setMode;

async function handleLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showMessage('Preencha email e senha para entrar.', 'error');
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showMessage('Login realizado com sucesso! Redirecionando...', 'success');
    setTimeout(() => {
      window.location.href = 'exercicios.html';
    }, 800);
  } catch (error) {
    showMessage(`Erro no login: ${error.message}`, 'error');
  }
}

async function handleSignup() {
  const email = emailInput.value.trim();
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!email || !username || !password) {
    showMessage('Preencha email, usuário e senha para cadastrar.', 'error');
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: username });
    showMessage('Cadastro realizado com sucesso! Você já pode entrar.', 'success');
    setMode('login');
  } catch (error) {
    showMessage(`Erro no cadastro: ${error.message}`, 'error');
  }
}

window.handleAction = function () {
  clearMessage();
  if (currentMode === 'login') {
    handleLogin();
  } else {
    handleSignup();
  }
};

async function handleSignOut() {
  try {
    await signOut(auth);
    showMessage('Você saiu com sucesso.', 'success');
    setMode('login');
  } catch (error) {
    showMessage(`Erro ao desconectar: ${error.message}`, 'error');
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    const displayName = user.displayName || user.email;
    showMessage(`Bem-vindo(a), ${displayName}!`, 'success');
    actionButton.textContent = 'Desconectar';
    actionButton.onclick = handleSignOut;

    if (window.location.pathname.includes('login.html')) {
      setTimeout(() => {
        window.location.href = 'exercicios.html';
      }, 800);
    }
  } else {
    actionButton.textContent = modeText[currentMode].action;
    actionButton.onclick = handleAction;
  }
});

setMode('login');
