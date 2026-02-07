// ==========================================
// ⚙️ CONFIGURACIÓN DE GITHUB (¡EDITA ESTO!)
// ==========================================
const GITHUB_CONFIG = {
  username: "Kevin-LWC", // <--- Tu usuario
  repo: "JSON-Estudio", // <--- Tu repo
  folder: "quizzes"
};

let quizData = [];
let currentIdx = 0;
let selectedOptions = [];
let hasCheckedAnswer = false;
let quizProgress = []; // Estado: null (sin responder), true (correcta), false (incorrecta)

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
  fetchQuizListFromGitHub();
});

// --- GITHUB FETCH ---
async function fetchQuizListFromGitHub() {
  const select = document.getElementById('quiz-select');
  const statusMsg = document.getElementById('status-msg');
  const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.folder}`;

  try {
    statusMsg.innerText = "🔍 Buscando archivos en GitHub...";
    const response = await fetch(apiUrl);
    
    if (!response.ok) throw new Error("Error conectando con GitHub");
    const files = await response.json();
    
    select.innerHTML = '<option value="" disabled selected>-- Selecciona un Quiz detectado --</option>';
    const jsonFiles = files.filter(file => file.name.endsWith('.json'));

    if (jsonFiles.length === 0) {
      statusMsg.innerText = "⚠️ No hay JSONs en la carpeta 'quizzes'.";
      return;
    }

    jsonFiles.forEach(file => {
      const option = document.createElement('option');
      option.value = file.download_url;
      option.innerText = file.name.replace('.json', '');
      select.appendChild(option);
    });

    statusMsg.innerText = `✅ ¡Listo! ${jsonFiles.length} quizzes encontrados.`;

  } catch (error) {
    console.error(error);
    statusMsg.innerHTML = `⚠️ Error leyendo GitHub.<br><small>${error.message}</small>`;
    select.innerHTML = '<option value="" disabled>Error de carga</option>';
  }
}

// --- CARGA DEL QUIZ ---
async function loadSelectedQuiz() {
  const url = document.getElementById('quiz-select').value;
  if (!url) { alert("Selecciona un quiz primero."); return; }

  try {
    document.getElementById('status-msg').innerText = "⏳ Descargando...";
    const response = await fetch(url);
    if (!response.ok) throw new Error("Error al descargar");
    
    const data = await response.json();
    startQuiz(data);
    document.getElementById('status-msg').innerText = "";
  } catch (e) {
    alert(`Error: ${e.message}`);
  }
}

function loadManualQuiz() {
  const input = document.getElementById('json-input').value;
  if (!input.trim()) return;
  try {
    startQuiz(JSON.parse(input));
  } catch (e) { alert("JSON inválido."); }
}

function startQuiz(data) {
  quizData = data;
  // Reiniciar estado
  quizProgress = new Array(data.length).fill(null); 
  currentIdx = 0;
  
  document.getElementById('setup-area').style.display = 'none';
  document.getElementById('quiz-area').style.display = 'block';
  document.getElementById('final-results').style.display = 'none';
  
  renderNavigation(); // 4. Generar cuadritos
  showQuestion();
}

// --- 1. FUNCIÓN COPIAR PREGUNTA ---
function copyCurrentQuestion() {
  if (!quizData || quizData.length === 0) return;
  const q = quizData[currentIdx];
  
  // Formatear texto limpio
  let textToCopy = `Question ${currentIdx + 1}: ${q.question}\n\n`;
  q.options.forEach(opt => {
    textToCopy += `${opt}\n`;
  });
  
  navigator.clipboard.writeText(textToCopy).then(() => {
    // Feedback visual temporal
    const btn = document.querySelector('.mini-btn');
    const originalText = btn.innerText;
    btn.innerText = "✅ Copiado";
    setTimeout(() => btn.innerText = originalText, 1500);
  });
}

// --- NAVEGACIÓN Y RENDERIZADO ---
function showQuestion() {
  const q = quizData[currentIdx];
  
  // Si ya respondimos esta pregunta, mostrar feedback guardado (opcional)
  // Por simplicidad, permitimos re-visitar pero bloqueamos editar si ya fue respondida en lógica compleja.
  // Aquí reseteamos la vista para interactuar si no se ha respondido, o mostramos estado.
  // Para este ejemplo simple: Si ya se respondió, mostramos la solución de nuevo o permitimos verla.
  
  hasCheckedAnswer = (quizProgress[currentIdx] !== null); // Bloquear si ya se respondió
  
  document.getElementById('progress').innerText = `Q: ${currentIdx + 1} / ${quizData.length}`;
  document.getElementById('question-text').innerText = q.question;
  
  const freqBadge = document.getElementById('frequency-badge');
  if (q.frequency) {
    freqBadge.style.display = 'inline-block';
    document.getElementById('freq-val').innerText = q.frequency;
  } else { freqBadge.style.display = 'none'; }

  const correctCount = q.answer.length;
  document.getElementById('selection-instruction').innerText = correctCount > 1 
    ? `(Select ${correctCount} options)` : "(Select 1 option)";

  const container = document.getElementById('options-container');
  container.innerHTML = '';
  
  // Limpiar feedback anterior
  document.getElementById('feedback').style.display = 'none';
  document.getElementById('validation-msg').innerText = '';
  selectedOptions = [];

  document.getElementById('prev-btn').disabled = (currentIdx === 0);
  // Si ya respondimos, deshabilitar botón Check
  document.getElementById('submit-btn').disabled = hasCheckedAnswer;
  if(hasCheckedAnswer) document.getElementById('submit-btn').innerText = "Answered";
  else document.getElementById('submit-btn').innerText = "Check Answer";

  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerText = opt;
    if (!hasCheckedAnswer) {
        btn.onclick = () => handleOptionClick(btn, opt, correctCount);
    }
    container.appendChild(btn);
  });
  
  updateGridStatus(); // Actualizar colores del grid
}

// --- 4. MAPA DE PREGUNTAS (GRID) ---
function renderNavigation() {
    const grid = document.getElementById('navigation-grid');
    grid.innerHTML = '';
    quizData.forEach((_, idx) => {
        const btn = document.createElement('div');
        btn.className = 'nav-item';
        btn.innerText = idx + 1;
        btn.onclick = () => jumpToQuestion(idx);
        btn.id = `nav-item-${idx}`;
        grid.appendChild(btn);
    });
}

function updateGridStatus() {
    // Quitar clase current a todos
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('current'));
    // Poner current al actual
    const currentBtn = document.getElementById(`nav-item-${currentIdx}`);
    if(currentBtn) currentBtn.classList.add('current');

    // Colorear según progreso
    quizProgress.forEach((status, idx) => {
        const btn = document.getElementById(`nav-item-${idx}`);
        if(!btn) return;
        if (status === true) btn.classList.add('solved-correct');
        else if (status === false) btn.classList.add('solved-wrong');
    });
}

function jumpToQuestion(idx) {
    currentIdx = idx;
    showQuestion();
    document.getElementById('quiz-area').scrollIntoView({ behavior: 'smooth' });
}

function handleOptionClick(btn, optText, maxSelect) {
  if (hasCheckedAnswer) return; 
  const val = optText.charAt(0); 

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
      }
    }
  }
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
  document.getElementById('submit-btn').disabled = true;

  const sortedSelected = selectedOptions.sort().join(',');
  const sortedCorrect = q.answer.sort().join(',');
  const isCorrect = sortedSelected === sortedCorrect;

  // Guardar progreso
  quizProgress[currentIdx] = isCorrect;
  updateGridStatus();

  const resultHeader = document.getElementById('result-text');
  resultHeader.innerText = isCorrect ? "Correct! 🎉" : "Incorrect ❌";
  resultHeader.className = isCorrect ? "correct-text" : "incorrect-text";

  const expDiv = document.getElementById('explanation-text');
  expDiv.innerHTML = `
    <p><strong>Correct Answer:</strong> ${q.answer.join(', ')}</p>
    <hr style="border: 0; border-top: 1px dashed #555; margin: 15px 0;">
    <p style="line-height:1.6">${q.explanation}</p>
  `;

  document.getElementById('feedback').style.display = 'block';
  document.getElementById('feedback').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showMessage(msg) {
  document.getElementById('validation-msg').innerText = msg;
}

function nextQuestion() {
  if (currentIdx < quizData.length - 1) {
    currentIdx++;
    showQuestion();
    document.getElementById('quiz-area').scrollIntoView({ behavior: 'smooth' });
  } else {
    // 3. FINALIZAR QUIZ Y MOSTRAR RESULTADOS
    showFinalResults();
  }
}

function showFinalResults() {
    document.getElementById('quiz-area').style.display = 'none';
    const resultsDiv = document.getElementById('final-results');
    resultsDiv.style.display = 'block';

    // Calcular score
    const total = quizData.length;
    const correct = quizProgress.filter(s => s === true).length;
    const percent = Math.round((correct / total) * 100);

    document.getElementById('final-score-percent').innerText = `${percent}%`;
    document.getElementById('final-score-text').innerText = `${correct} correctas de ${total}`;
}

function prevQuestion() {
  if (currentIdx > 0) {
    currentIdx--;
    showQuestion();
  }
}

// Prompt Tab Logic (Sin cambios)
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active-content'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId).classList.add('active-content');
  const btns = document.querySelectorAll('.tab-btn');
  if(tabId === 'quiz-tab') btns[0].classList.add('active');
  else btns[1].classList.add('active');
}

function copyPrompt() {
  const textArea = document.getElementById('prompt-text');
  textArea.select();
  navigator.clipboard.writeText(textArea.value);
}
