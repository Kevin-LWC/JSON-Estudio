// ==========================================
// ⚙️ CONFIGURACIÓN DE GITHUB (¡EDITA ESTO!)
// ==========================================
const GITHUB_CONFIG = {
  // Tu nombre de usuario en GitHub
  username: "Kevin-LWC", // <--- CAMBIA ESTO por tu usuario real
  // El nombre EXACTO de tu repositorio
  repo: "JSON-Estudio", // <--- CAMBIA ESTO por el nombre de tu repo
  // La carpeta donde guardas los jsons
  folder: "quizzes"
};

let quizData = [];
let currentIdx = 0;
let selectedOptions = [];
let hasCheckedAnswer = false;

// --- Inicialización: Carga automática de la lista ---
document.addEventListener('DOMContentLoaded', () => {
  fetchQuizListFromGitHub();
});

// --- FUNCIÓN MÁGICA: Escanear carpeta de GitHub ---
async function fetchQuizListFromGitHub() {
  const select = document.getElementById('quiz-select');
  const statusMsg = document.getElementById('status-msg');

  // URL de la API de GitHub para leer contenido de carpeta
  const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.folder}`;

  try {
    statusMsg.innerText = "🔍 Buscando archivos en GitHub...";
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      if(response.status === 404) throw new Error("Repositorio o carpeta no encontrada.");
      if(response.status === 403) throw new Error("Límite de API excedido o repo privado.");
      throw new Error("Error de conexión con GitHub.");
    }

    const files = await response.json();
    
    // Limpiar select
    select.innerHTML = '<option value="" disabled selected>-- Selecciona un Quiz detectado --</option>';
    
    // Filtrar solo archivos .json
    const jsonFiles = files.filter(file => file.name.endsWith('.json'));

    if (jsonFiles.length === 0) {
      statusMsg.innerText = "⚠️ No encontré archivos .json en la carpeta 'quizzes'.";
      return;
    }

    // Llenar el select dinámicamente
    jsonFiles.forEach(file => {
      const option = document.createElement('option');
      option.value = file.download_url; // URL cruda del archivo
      // Quitamos la extensión .json para que se vea bonito en el nombre
      option.innerText = file.name.replace('.json', '');
      select.appendChild(option);
    });

    statusMsg.innerText = `✅ ¡Listo! Se encontraron ${jsonFiles.length} quizzes.`;

  } catch (error) {
    console.error(error);
    // Fallback: Si falla la API (ej. estás en local sin internet o repo privado)
    statusMsg.innerHTML = `⚠️ No se pudo escanear GitHub automáticante.<br><small>${error.message}</small>`;
    select.innerHTML = '<option value="" disabled>Error de carga (Ver consola)</option>';
  }
}

// --- Cargar el Quiz seleccionado ---
async function loadSelectedQuiz() {
  const url = document.getElementById('quiz-select').value;
  if (!url) {
    alert("Por favor selecciona un quiz del menú.");
    return;
  }

  try {
    document.getElementById('status-msg').innerText = "⏳ Descargando preguntas...";
    const response = await fetch(url);
    if (!response.ok) throw new Error("No se pudo descargar el archivo JSON");
    
    const data = await response.json();
    startQuiz(data);
    document.getElementById('status-msg').innerText = "";
  } catch (e) {
    alert(`Error cargando el quiz: ${e.message}`);
  }
}

// --- Lógica Estándar (Igual que antes) ---
function loadManualQuiz() {
  const input = document.getElementById('json-input').value;
  if (!input.trim()) { alert("Por favor pega un JSON válido."); return; }
  try {
    const data = JSON.parse(input);
    startQuiz(data);
  } catch (e) { 
    alert("Error de sintaxis JSON."); 
  }
}

function startQuiz(data) {
  quizData = data;
  document.getElementById('setup-area').style.display = 'none';
  document.getElementById('quiz-area').style.display = 'block';
  currentIdx = 0;
  showQuestion();
}

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
    const old = label.innerText;
    label.innerText = "¡Copiado!";
    setTimeout(() => label.innerText = old, 2000);
  });
}

// --- Quiz Engine ---
function showQuestion() {
  const q = quizData[currentIdx];
  hasCheckedAnswer = false;
  
  document.getElementById('progress').innerText = `Q: ${currentIdx + 1} / ${quizData.length}`;
  document.getElementById('question-text').innerText = q.question;
  
  const freqBadge = document.getElementById('frequency-badge');
  if (q.frequency) {
    freqBadge.style.display = 'inline-block';
    document.getElementById('freq-val').innerText = q.frequency;
  } else {
    freqBadge.style.display = 'none';
  }

  const correctCount = q.answer.length;
  document.getElementById('selection-instruction').innerText = correctCount > 1 
    ? `(Select ${correctCount} options)` 
    : "(Select 1 option)";

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
    alert("¡Has terminado el quiz!");
    location.reload();
  }
}

function prevQuestion() {
  if (currentIdx > 0) {
    currentIdx--;
    showQuestion();
  }
}
