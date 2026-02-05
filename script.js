// --- CONFIGURACIÓN DE ARCHIVOS ---
// Agrega aquí los nombres de tus archivos JSON que guardaste en la carpeta "quizzes/"
const QUIZ_FILES = [
  { name: "Data Cloud Certification", file: "data-cloud.json" },
  { name: "Admin Salesforce", file: "admin-cert.json" },
  { name: "App Builder", file: "app-builder.json" }
];

let quizData = [];
let currentIdx = 0;
let selectedOptions = [];
let hasCheckedAnswer = false;

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('quiz-select');
  QUIZ_FILES.forEach(q => {
    const option = document.createElement('option');
    option.value = q.file;
    option.innerText = q.name;
    select.appendChild(option);
  });
});

// --- Tab Logic ---
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active-content'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  
  document.getElementById(tabId).classList.add('active-content');
  
  const btns = document.querySelectorAll('.tab-btn');
  if(tabId === 'quiz-tab') btns[0].classList.add('active');
  else btns[1].classList.add('active');
}

// --- Prompt Logic ---
function copyPrompt() {
  const textArea = document.getElementById('prompt-text');
  textArea.select();
  navigator.clipboard.writeText(textArea.value).then(() => {
    const label = document.getElementById('copy-label');
    const originalText = label.innerText;
    label.innerText = "¡Copiado!";
    setTimeout(() => label.innerText = originalText, 2000);
  });
}

// --- LOAD LOGIC (NEW) ---

// 1. Cargar desde archivo JSON en carpeta 'quizzes/'
async function loadSelectedQuiz() {
  const filename = document.getElementById('quiz-select').value;
  if (!filename) {
    alert("Por favor selecciona un quiz del menú.");
    return;
  }

  try {
    const response = await fetch(`quizzes/${filename}`);
    if (!response.ok) throw new Error("No se pudo cargar el archivo");
    
    const data = await response.json();
    startQuiz(data);
  } catch (e) {
    alert(`Error cargando el archivo: ${e.message}\n Asegúrate de estar corriendo esto en un servidor local (Live Server) o GitHub Pages.`);
    console.error(e);
  }
}

// 2. Cargar desde Texto Pegado (Legacy)
function loadManualQuiz() {
  const input = document.getElementById('json-input').value;
  if (!input.trim()) { alert("Por favor pega un JSON válido."); return; }
  
  try {
    const data = JSON.parse(input);
    startQuiz(data);
  } catch (e) { 
    alert("Error de sintaxis JSON. Verifica comillas y comas."); 
    console.error(e);
  }
}

// Función común para iniciar
function startQuiz(data) {
  quizData = data;
  document.getElementById('setup-area').style.display = 'none';
  document.getElementById('quiz-area').style.display = 'block';
  currentIdx = 0;
  showQuestion();
}

// --- Quiz Logic (Core) ---
function showQuestion() {
  const q = quizData[currentIdx];
  hasCheckedAnswer = false;
  
  // Progress
  document.getElementById('progress').innerText = `Q: ${currentIdx + 1} / ${quizData.length}`;
  document.getElementById('question-text').innerText = q.question;
  
  // Frequency
  const freqBadge = document.getElementById('frequency-badge');
  if (q.frequency) {
    freqBadge.style.display = 'inline-block';
    document.getElementById('freq-val').innerText = q.frequency;
  } else {
    freqBadge.style.display = 'none';
  }

  // Instructions
  const correctCount = q.answer.length;
  const instruction = document.getElementById('selection-instruction');
  instruction.innerText = correctCount > 1 
    ? `(Select ${correctCount} options)` 
    : "(Select 1 option)";

  // Options Render
  const container = document.getElementById('options-container');
  container.innerHTML = '';
  document.getElementById('feedback').style.display = 'none';
  document.getElementById('validation-msg').innerText = '';
  selectedOptions = [];

  document.getElementById('prev-btn').disabled = (currentIdx === 0);

  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerText = opt;
    btn.onclick = () => handleOptionClick(btn, opt, correctCount);
    container.appendChild(btn);
  });
}

function handleOptionClick(btn, optText, maxSelect) {
  if (hasCheckedAnswer) return; 

  const val = optText.charAt(0); // Asume formato "A. Texto"

  if (selectedOptions.includes(val)) {
    selectedOptions = selectedOptions.filter(i => i !== val);
    btn.classList.remove('selected');
  } else {
    if (maxSelect === 1) {
      selectedOptions = [val];
      document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    } else {
      if (selectedOptions.length < maxSelect) {
        selectedOptions.push(val);
        btn.classList.add('selected');
      } else {
        showMessage(`Solo puedes seleccionar ${maxSelect} opciones.`);
        return; 
      }
    }
  }
  showMessage("");
}

function checkAnswer() {
  if (hasCheckedAnswer) return;

  const q = quizData[currentIdx];
  const correctCount = q.answer.length;

  if (selectedOptions.length !== correctCount) {
    showMessage(`⚠️ Seleccionaste ${selectedOptions.length} de ${correctCount}.`);
    return;
  }

  hasCheckedAnswer = true;
  showMessage("");

  const sortedSelected = selectedOptions.sort().join(',');
  const sortedCorrect = q.answer.sort().join(',');
  const isCorrect = sortedSelected === sortedCorrect;

  const resultHeader = document.getElementById('result-text');
  resultHeader.innerText = isCorrect ? "Correct! 🎉" : "Incorrect ❌";
  resultHeader.className = isCorrect ? "correct-text" : "incorrect-text";

  const expDiv = document.getElementById('explanation-text');
  // Renderizado de explicación
  expDiv.innerHTML = `
    <p><strong>Correct Answer:</strong> ${q.answer.join(', ')}</p>
    <hr style="border: 0; border-top: 1px dashed #555; margin: 15px 0;">
    <p style="line-height:1.6">${q.explanation}</p>
  `;

  document.getElementById('feedback').style.display = 'block';
  // Scroll suave al feedback
  document.getElementById('feedback').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showMessage(msg) {
  const el = document.getElementById('validation-msg');
  el.innerText = msg;
}

function nextQuestion() {
  if (currentIdx < quizData.length - 1) {
    currentIdx++;
    showQuestion();
    document.getElementById('quiz-area').scrollIntoView({ behavior: 'smooth' });
  } else {
    alert("¡Quiz finalizado!");
    location.reload();
  }
}

function prevQuestion() {
  if (currentIdx > 0) {
    currentIdx--;
    showQuestion();
  }
}
