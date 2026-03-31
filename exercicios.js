import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';

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
const weekTabs = document.getElementById('week-tabs');
const exerciseList = document.getElementById('exercise-list');
const selectedList = document.getElementById('selected-list');
const selectedCount = document.getElementById('selected-count');
const currentDay = document.getElementById('current-day');
const clearDayButton = document.getElementById('clear-day');
const viewSaved = document.getElementById('view-saved');

const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
let activeDay = weekDays[0];
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

const exercises = [
  { name: 'Supino reto (barra/halteres)', category: 'Peito / Tríceps', description: 'Clássico para peito, ombros e tríceps.' },
  { name: 'Supino inclinado (parte superior)', category: 'Peito / Tríceps', description: 'Foco na parte superior do peitoral.' },
  { name: 'Crucifixo (reto/máquina)', category: 'Peito / Tríceps', description: 'Alongamento e abertura do peito.' },
  { name: 'Crossover', category: 'Peito / Tríceps', description: 'Definição e controle do movimento de adução.' },
  { name: 'Puxada frente na polia', category: 'Costas / Bíceps', description: 'Largura das costas e puxada vertical.' },
  { name: 'Remada curvada', category: 'Costas / Bíceps', description: 'Força e espessura das costas.' },
  { name: 'Remada unilateral (serrote)', category: 'Costas / Bíceps', description: 'Correção de desequilíbrios e controle.' },
  { name: 'Remada baixa com triângulo', category: 'Costas / Bíceps', description: 'Espessura e conexão do latíssimo.' },
  { name: 'Remada na máquina', category: 'Costas / Bíceps', description: 'Treino mais guiado para segurança.' },
  { name: 'Rosca direta com barra', category: 'Bíceps', description: 'Desenvolvimento de força no bíceps.' },
  { name: 'Rosca alternada com halteres', category: 'Bíceps', description: 'Amplitude total e foco em cada braço.' },
  { name: 'Rosca no banco 45°', category: 'Bíceps', description: 'Alongamento extra e estímulo do pico.' },
  { name: 'Rosca direta na polia baixa', category: 'Bíceps', description: 'Tensão constante durante todo o movimento.' },
  { name: 'Rosca Scott', category: 'Bíceps', description: 'Isola o bíceps e reduz balanço do corpo.' },
  { name: 'Rosca martelo', category: 'Bíceps / Antebraço', description: 'Trabalha bíceps e estabilidade do antebraço.' },
  { name: 'Tríceps francês', category: 'Tríceps', description: 'Extensão para a parte posterior do braço.' },
  { name: 'Tríceps testa', category: 'Tríceps', description: 'Foco na cabeça longa do tríceps.' },
  { name: 'Tríceps pulley', category: 'Tríceps', description: 'Finalização com controle de carga.' },
  { name: 'Tríceps coice', category: 'Tríceps', description: 'Isolamento e extensão máxima do tríceps.' },
  { name: 'Desenvolvimento', category: 'Ombros', description: 'Força de empurrão acima da cabeça.' },
  { name: 'Elevação lateral', category: 'Ombros', description: 'Largura e definição do ombro lateral.' },
  { name: 'Elevação frontal', category: 'Ombros', description: 'Trabalha a porção anterior do ombro.' },
  { name: 'Crucifixo inverso', category: 'Ombros / Costas', description: 'Parte posterior do ombro e parte superior das costas.' },
  { name: 'Agachamento livre (barra)', category: 'Pernas / Glúteos', description: 'Base para força total e pernas.' },
  { name: 'Cadeira extensora', category: 'Pernas', description: 'Isola o quadríceps.' },
  { name: 'Leg Press 45°', category: 'Pernas', description: 'Carga pesada para quadríceps e glúteos.' },
  { name: 'Agachamento búlgaro', category: 'Pernas / Glúteos', description: 'Equilíbrio e força unilateral.' },
  { name: 'Afundo', category: 'Pernas / Glúteos', description: 'Desenvolve quadríceps e glúteos.' },
  { name: 'Stiff', category: 'Pernas / Posterior', description: 'Posteriores de coxa e glúteos.' },
  { name: 'Mesa flexora', category: 'Pernas / Posterior', description: 'Isola os isquiotibiais.' },
  { name: 'Cadeira flexora', category: 'Pernas', description: 'Trabalha os posteriores da coxa.' },
  { name: 'Cadeira abdutora', category: 'Pernas / Quadril', description: 'Estabilidade do quadril e abdutores.' },
  { name: 'Elevação pélvica', category: 'Glúteos / Core', description: 'Ativa glúteos e core.' },
  { name: 'Panturrilha', category: 'Pernas', description: 'Força e explosão de salto.' }
];

async function loadSchedule(uid) {
  if (!uid) return createEmptySchedule();

  try {
    const scheduleRef = doc(db, 'schedules', uid);
    const snapshot = await getDoc(scheduleRef);
    if (!snapshot.exists()) {
      return createEmptySchedule();
    }
    return normalizeSchedule(snapshot.data());
  } catch (error) {
    console.error('Erro ao carregar treino:', error);
    return createEmptySchedule();
  }
}

async function saveSchedule(schedule, uid) {
  if (!uid) return;
  try {
    const scheduleRef = doc(db, 'schedules', uid);
    await setDoc(scheduleRef, schedule);
  } catch (error) {
    console.error('Erro ao salvar treino:', error);
  }
}

function subscribeSchedule(uid) {
  if (scheduleUnsubscribe) {
    scheduleUnsubscribe();
  }

  const scheduleRef = doc(db, 'schedules', uid);
  scheduleUnsubscribe = onSnapshot(scheduleRef, (snapshot) => {
    if (snapshot.exists()) {
      schedule = normalizeSchedule(snapshot.data());
    } else {
      schedule = createEmptySchedule();
    }
    renderWeekTabs(schedule);
    renderExerciseList(schedule);
    renderSelectedList(schedule);
  }, (error) => {
    console.error('Erro no listener de treino:', error);
    schedule = createEmptySchedule();
    renderWeekTabs(schedule);
    renderExerciseList(schedule);
    renderSelectedList(schedule);
  });
}

function getSelectedForDay(schedule, day) {
  return schedule[day] || [];
}

function renderWeekTabs(schedule) {
  weekTabs.innerHTML = '';
  weekDays.forEach((day) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `week-tab${day === activeDay ? ' active' : ''}`;
    button.textContent = day;
    button.addEventListener('click', () => {
      activeDay = day;
      currentDay.textContent = day;
      renderWeekTabs(schedule);
      renderExerciseList(schedule);
      renderSelectedList(schedule);
    });
    weekTabs.appendChild(button);
  });
}

function renderExerciseList(schedule) {
  const selected = getSelectedForDay(schedule, activeDay);
  exerciseList.innerHTML = '';

  const groupedByCategory = exercises.reduce((groups, exercise) => {
    if (!groups[exercise.category]) groups[exercise.category] = [];
    groups[exercise.category].push(exercise);
    return groups;
  }, {});

  Object.entries(groupedByCategory).forEach(([category, list]) => {
    const categoryGroup = document.createElement('div');
    categoryGroup.className = 'category-group';

    const categoryTitle = document.createElement('h3');
    categoryTitle.textContent = category;
    categoryGroup.appendChild(categoryTitle);

    list.forEach((exercise) => {
      const selectedItem = selected.find((item) => item.name === exercise.name);
      const item = document.createElement('div');
      item.className = 'exercise-item';

      const row = document.createElement('div');
      row.className = 'exercise-item-row';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `exercise-${exercise.name}`.replace(/[^a-zA-Z0-9]/g, '-');
      checkbox.checked = Boolean(selectedItem);

      const label = document.createElement('label');
      label.htmlFor = checkbox.id;
      label.innerHTML = `<h3>${exercise.name}</h3><p>${exercise.description}</p><span>${exercise.category}</span>`;

      row.appendChild(checkbox);
      row.appendChild(label);
      item.appendChild(row);

      if (selectedItem) {
        const config = document.createElement('div');
        config.className = 'exercise-config';

        const setsLabel = document.createElement('label');
        setsLabel.textContent = 'Séries';
        const setsInput = document.createElement('input');
        setsInput.type = 'number';
        setsInput.min = '1';
        setsInput.placeholder = 'Ex: 3';
        setsInput.value = selectedItem.sets || '';
        setsLabel.appendChild(setsInput);

        const repsLabel = document.createElement('label');
        repsLabel.textContent = 'Repetições';
        const repsInput = document.createElement('input');
        repsInput.type = 'number';
        repsInput.min = '1';
        repsInput.placeholder = 'Ex: 12';
        repsInput.value = selectedItem.reps || '';
        repsLabel.appendChild(repsInput);

        const weightLabel = document.createElement('label');
        weightLabel.textContent = 'Carga';
        const weightInput = document.createElement('input');
        weightInput.type = 'text';
        weightInput.placeholder = 'Ex: 60 kg';
        weightInput.value = selectedItem.weight || '';
        weightLabel.appendChild(weightInput);

        config.appendChild(setsLabel);
        config.appendChild(repsLabel);
        config.appendChild(weightLabel);
        item.appendChild(config);

        const saveField = (field, value) => {
          selectedItem[field] = value;
          schedule[activeDay] = selected;
          saveSchedule(schedule, currentUid);
          renderSelectedList(schedule);
        };

        setsInput.addEventListener('input', () => saveField('sets', setsInput.value));
        repsInput.addEventListener('input', () => saveField('reps', repsInput.value));
        weightInput.addEventListener('input', () => saveField('weight', weightInput.value));
      }

      checkbox.addEventListener('change', async () => {
        const existingIndex = selected.findIndex((entry) => entry.name === exercise.name);
        if (checkbox.checked) {
          if (existingIndex < 0) {
            selected.push({ name: exercise.name, sets: '', reps: '', weight: '' });
          }
        } else {
          if (existingIndex >= 0) selected.splice(existingIndex, 1);
        }
        schedule[activeDay] = selected;
        await saveSchedule(schedule, currentUid);
        renderExerciseList(schedule);
        renderSelectedList(schedule);
        updateSelectedCount(selected.length);
      });

      categoryGroup.appendChild(item);
    });

    exerciseList.appendChild(categoryGroup);
  });

  updateSelectedCount(selected.length);
}

function renderSelectedList(schedule) {
  const selected = getSelectedForDay(schedule, activeDay);
  selectedList.innerHTML = '';
  if (selected.length === 0) {
    selectedList.innerHTML = '<li>Nenhum exercício selecionado para este dia.</li>';
    return;
  }
  selected.forEach(({ name, sets, reps, weight }) => {
    const li = document.createElement('li');
    let summary = name;
    const details = [];
    if (sets) details.push(`${sets} séries`);
    if (reps) details.push(`${reps} repetições`);
    if (weight) details.push(weight);
    if (details.length) summary += ` — ${details.join(' | ')}`;
    li.textContent = summary;
    selectedList.appendChild(li);
  });
}

function updateSelectedCount(count) {
  selectedCount.textContent = `${count} exercício${count === 1 ? '' : 's'} selecionado${count === 1 ? '' : 's'}`;
}

function clearCurrentDay(schedule) {
  schedule[activeDay] = [];
  saveSchedule(schedule, currentUid);
  renderExerciseList(schedule);
  renderSelectedList(schedule);
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUid = user.uid;
    const name = user.displayName || user.email;
    welcomeText.textContent = `Olá, ${name}! Escolha seus exercícios por dia da semana.`;
    subscribeSchedule(currentUid);
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

clearDayButton.addEventListener('click', () => {
  clearCurrentDay(schedule);
});

viewSaved.addEventListener('click', () => {
  window.location.href = 'treino-salvo.html';
});
