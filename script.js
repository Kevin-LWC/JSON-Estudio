let quizData = [];
let currentIdx = 0;
let selectedOptions = [];
let hasCheckedAnswer = false;

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
  textArea.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(textArea.value).then(() => {
    const label = document.getElementById('copy-label');
    const originalText = label.innerText;
    label.innerText = "¡Copiado!";
    setTimeout(() => label.innerText = originalText, 2000);
  });
}

// --- Quiz Logic ---
function loadQuiz() {
  const input = document.getElementById('json-input').value;
  if (!input.trim()) { alert("Por favor pega un JSON válido."); return; }
  
  try {
    quizData = JSON.parse(input);
    document.getElementById('setup-area').style.display = 'none';
    document.getElementById('quiz-area').style.display = 'block';
    currentIdx = 0;
    showQuestion();
  } catch (e) { 
    alert("Error de sintaxis JSON. Verifica comillas y comas."); 
    console.error(e);
  }
}

function showQuestion() {
  const q = quizData[currentIdx];
  hasCheckedAnswer = false;
  
  document.getElementById('progress').innerText = `Pregunta ${currentIdx + 1} de ${quizData.length}`;
  document.getElementById('question-text').innerText = q.question;
  
  const freqBadge = document.getElementById('frequency-badge');
  if (q.frequency) {
    freqBadge.style.display = 'inline-block';
    document.getElementById('freq-val').innerText = q.frequency;
  } else {
    freqBadge.style.display = 'none';
  }

  const correctCount = q.answer.length;
  const instruction = document.getElementById('selection-instruction');
  instruction.innerText = correctCount > 1 
    ? `(Selecciona ${correctCount} opciones)` 
    : "(Selecciona 1 opción)";

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
  resultHeader.innerText = isCorrect ? "¡Correcto! 🎉" : "Incorrecto ❌";
  resultHeader.className = isCorrect ? "correct-text" : "incorrect-text";

  const expDiv = document.getElementById('explanation-text');
  expDiv.innerHTML = `
    <p><strong>Respuesta Correcta:</strong> ${q.answer.join(', ')}</p>
    <hr style="border: 0; border-top: 1px solid #444; margin: 15px 0;">
    <p style="line-height:1.6">${q.explanation}</p>
  `;

  document.getElementById('feedback').style.display = 'block';
  document.getElementById('feedback').scrollIntoView({ behavior: 'smooth' });
}

function showMessage(msg) {
  const el = document.getElementById('validation-msg');
  el.innerText = msg;
  if(msg) {
    el.style.animation = 'none';
    el.offsetHeight; 
    el.style.animation = 'fadeIn 0.3s';
  }
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
