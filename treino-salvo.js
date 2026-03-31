import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js';
import { getFirestore, doc, setDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';

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
const db = getFirestore(app);
const welcomeText = document.getElementById('welcome');
const logoutButton = document.getElementById('logout-button');
const backButton = document.getElementById('back-button');
const savedPlan = document.getElementById('saved-plan');

const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
let currentUid = null;
let schedule = null;
let scheduleUnsubscribe = null;

function createEmptySchedule() {
  return weekDays.reduce((acc, day) => ({ ...acc, [day]: [] }), {});
}

function normalizeSchedule(raw) {
  return weekDays.reduce((acc, day) => ({
    ...acc,
    [day]: Array.isArray(raw?.[day]) ? raw[day].map((item) => ({
      name: item.name,
      sets: item.sets || '',
      reps: item.reps || '',
      weight: item.weight || ''
    })) : []
  }), {});
}

async function saveSchedule(scheduleToSave, uid) {
  if (!uid) return;
  try {
    const scheduleRef = doc(db, 'schedules', uid);
    await setDoc(scheduleRef, scheduleToSave);
  } catch (error) {
    console.error('Erro ao salvar treino:', error);
  }
}

function subscribeSchedule(uid) {
  if (scheduleUnsubscribe) {
    scheduleUnsubscribe();
    scheduleUnsubscribe = null;
  }

  const scheduleRef = doc(db, 'schedules', uid);
  scheduleUnsubscribe = onSnapshot(scheduleRef, (snapshot) => {
    if (snapshot.exists()) {
      schedule = normalizeSchedule(snapshot.data());
    } else {
      schedule = createEmptySchedule();
    }
    renderSavedPlan(schedule);
  }, (error) => {
    console.error('Erro no listener de treino:', error);
    schedule = createEmptySchedule();
    renderSavedPlan(schedule);
  });
}

function renderSavedPlan(schedule) {
  savedPlan.innerHTML = '';
  let hasAny = false;

  weekDays.forEach((day) => {
    const items = schedule[day] || [];
    if (items.length === 0) return;

    hasAny = true;
    const dayCard = document.createElement('div');
    dayCard.className = 'day-card';

    const title = document.createElement('h2');
    title.textContent = day;
    dayCard.appendChild(title);

    const list = document.createElement('ul');

    items.forEach((item, index) => {
      const li = document.createElement('li');

      const header = document.createElement('div');
      header.className = 'exercise-row';
      const nameEl = document.createElement('strong');
      nameEl.textContent = item.name;
      header.appendChild(nameEl);
      li.appendChild(header);

      const fields = document.createElement('div');
      fields.className = 'field-row';

      const setsLabel = document.createElement('label');
      setsLabel.textContent = 'Séries';
      const setsInput = document.createElement('input');
      setsInput.type = 'number';
      setsInput.min = '1';
      setsInput.placeholder = 'Ex: 3';
      setsInput.value = item.sets || '';
      setsLabel.appendChild(setsInput);

      const repsLabel = document.createElement('label');
      repsLabel.textContent = 'Repetições';
      const repsInput = document.createElement('input');
      repsInput.type = 'number';
      repsInput.min = '1';
      repsInput.placeholder = 'Ex: 12';
      repsInput.value = item.reps || '';
      repsLabel.appendChild(repsInput);

      const weightLabel = document.createElement('label');
      weightLabel.textContent = 'Carga';
      const weightInput = document.createElement('input');
      weightInput.type = 'text';
      weightInput.placeholder = 'Ex: 60 kg';
      weightInput.value = item.weight || '';
      weightLabel.appendChild(weightInput);

      fields.appendChild(setsLabel);
      fields.appendChild(repsLabel);
      fields.appendChild(weightLabel);
      li.appendChild(fields);

      const saveField = (field, value) => {
        schedule[day][index][field] = value;
        saveSchedule(schedule, currentUid);
      };

      setsInput.addEventListener('input', () => saveField('sets', setsInput.value));
      repsInput.addEventListener('input', () => saveField('reps', repsInput.value));
      weightInput.addEventListener('input', () => saveField('weight', weightInput.value));

      list.appendChild(li);
    });

    dayCard.appendChild(list);
    savedPlan.appendChild(dayCard);
  });

  if (!hasAny) {
    savedPlan.innerHTML = '<div class="empty-state"><strong>Nenhum treino salvo ainda.</strong><p>Volte para "Todos os exercícios" e escolha os exercícios para cada dia.</p></div>';
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUid = user.uid;
    subscribeSchedule(currentUid);
    const name = user.displayName || user.email;
    welcomeText.textContent = `Olá, ${name}! Aqui está o seu treino salvo.`;
  } else {
    if (scheduleUnsubscribe) {
      scheduleUnsubscribe();
      scheduleUnsubscribe = null;
    }
    window.location.href = 'login.html';
  }
});

logoutButton.addEventListener('click', async () => {
  try {
    await signOut(auth);
    window.location.href = 'login.html';
  } catch (error) {
    welcomeText.textContent = `Erro ao sair: ${error.message}`;
  }
});

backButton.addEventListener('click', () => {
  window.location.href = 'exercicios.html';
});
