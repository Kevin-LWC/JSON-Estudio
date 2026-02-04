let quizData = [];
let currentIdx = 0;
let selectedOptions = [];

function loadQuiz() {
  const input = document.getElementById('json-input').value;
  try {
    quizData = JSON.parse(input);
    document.getElementById('setup-area').style.display = 'none';
    document.getElementById('quiz-area').style.display = 'block';
    showQuestion();
  } catch (e) { alert("JSON inválido. Revisa el formato."); }
}

function showQuestion() {
  const q = quizData[currentIdx];
  document.getElementById('progress').innerText = `Pregunta ${currentIdx + 1} de ${quizData.length}`;
  document.getElementById('question-text').innerText = q.question;
  const container = document.getElementById('options-container');
  container.innerHTML = '';
  document.getElementById('feedback').style.display = 'none';
  selectedOptions = [];

  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerText = opt;
    btn.onclick = () => {
      btn.classList.toggle('selected');
      const val = opt.charAt(0); // Toma la letra A, B, C...
      if(selectedOptions.includes(val)) {
        selectedOptions = selectedOptions.filter(i => i !== val);
      } else { selectedOptions.push(val); }
    };
    container.appendChild(btn);
  });
}

function checkAnswer() {
  const q = quizData[currentIdx];
  const isCorrect = selectedOptions.sort().join(',') === q.answer.sort().join(',');
  const result = document.getElementById('result-text');
  
  result.innerText = isCorrect ? "¡Correcto!" : "Incorrecto";
  result.className = isCorrect ? "correct" : "incorrect";
  document.getElementById('explanation-text').innerHTML = `<strong>Respuesta correcta: ${q.answer}</strong><br><br>${q.explanation}`;
  document.getElementById('feedback').style.display = 'block';
}

function nextQuestion() {
  currentIdx++;
  if(currentIdx < quizData.length) { showQuestion(); }
  else { alert("¡Has terminado el quiz!"); location.reload(); }
}