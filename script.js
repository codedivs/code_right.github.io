// DOM Elements
const questionPad = document.getElementById('question_pad');
const answerPad = document.getElementById('answer_pad');
const questionAnswers = document.getElementById('question_answers');
const timerDisplay = document.getElementById('timer');
const resultDiv = document.getElementById('result');
const scoreDisplay = document.getElementById('score');
const totalTimeDisplay = document.getElementById('total_time');
const retryBtn = document.getElementById('retry_btn');
const cancelBtn = document.getElementById('cancel_btn');
const startScreen = document.getElementById('start_screen');
const startBtn = document.getElementById('start_btn');
const quitBtn = document.getElementById('quit_btn');

let allQuestions = [], selectedQuestions = [], curIdx = 0, curQ = null;
let correctCount = 0, startTime = 0, intervalId = null, isQuizActive = false;

// Fetch questions
fetch('questions.json')
  .then(r => r.ok ? r.json() : Promise.reject('Failed to load questions'))
  .then(data => {
    allQuestions = data.easy || [];
    showStartScreen();
  })
  .catch(err => {
    questionPad.textContent = 'Error loading questions: ' + err;
    console.error(err);
  });

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// === Screens ===
function showStartScreen() {
  isQuizActive = false;
  stopTimer();
  timerDisplay.style.display = 'none';
  startScreen.style.display = 'block';
  resultDiv.style.display = 'none';
  questionPad.textContent = 'You ready to code? Have fun.';
  answerPad.innerHTML = '';
  questionAnswers.innerHTML = '';
}

function startQuiz() {
  if (allQuestions.length < 20) {
    alert('Not enough questions loaded!');
    return;
  }

  selectedQuestions = shuffle([...allQuestions]).slice(0, 20);
  curIdx = 0; correctCount = 0; startTime = Date.now();
  isQuizActive = true;

  // Full cleanup
  answerPad.innerHTML = '';
  questionAnswers.innerHTML = '';
  resultDiv.style.display = 'none';
  startScreen.style.display = 'none';
  timerDisplay.style.display = 'block';

  startTimer();
  loadQuestion(0);
}

function endQuiz() {
  if (!isQuizActive) return;
  isQuizActive = false;
  stopTimer();

  const totalTime = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.floor(totalTime / 60);
  const secs = totalTime % 60;

  scoreDisplay.textContent = `Score: ${correctCount} / 20`;
  totalTimeDisplay.textContent = `Time: ${mins}m ${secs}s`;
  resultDiv.style.display = 'block';
  questionPad.textContent = 'Quiz Complete!';
  timerDisplay.style.display = 'none';
}

// === Timer ===
function startTimer() {
  if (intervalId) clearInterval(intervalId);
  const questionStartTime = Date.now();
  intervalId = setInterval(() => {
    const elapsed = Math.floor((Date.now() - questionStartTime) / 1000);
    timerDisplay.textContent = `Time: ${elapsed}s`;
  }, 1000);
}

function stopTimer() {
  if (intervalId) clearInterval(intervalId);
}

// === Load Question ===
function loadQuestion(idx) {
  if (idx >= selectedQuestions.length || !isQuizActive) {
    endQuiz();
    return;
  }

  curQ = selectedQuestions[idx];
  questionPad.textContent = curQ.question;

  answerPad.innerHTML = '';
  questionAnswers.innerHTML = '';

  // Answer blocks
  curQ.answers.forEach((txt, i) => {
    const block = document.createElement('div');
    block.className = 'answer-block';
    block.textContent = txt;
    block.draggable = true;
    block.dataset.idx = i;
    answerPad.appendChild(block);

    block.addEventListener('dragstart', dragStart);
    block.addEventListener('dragend', dragEnd);
  });

  // Slots with placeholder via data attribute
  for (let i = 0; i < curQ.answer_divs; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.placeholder = `Drop answer ${i + 1} here`;
    slot.dataset.slot = i;
    slot.addEventListener('dragover', e => e.preventDefault());
    slot.addEventListener('drop', drop);
    questionAnswers.appendChild(slot);
  }

  // Allow dropping back into answer pad
  answerPad.addEventListener('dragover', e => e.preventDefault());
  answerPad.addEventListener('drop', e => drop(e, true));
}

// === Drag & Drop ===
function dragStart(e) {
  e.dataTransfer.setData('text/plain', e.target.dataset.idx);
  e.target.classList.add('dragging');
}

function dragEnd(e) {
  e.target.classList.remove('dragging');
}

function drop(e, toAnswerPad = false) {
  if (!isQuizActive) return;
  e.preventDefault();

  const idx = e.dataTransfer.getData('text/plain');
  const block = document.querySelector(`.answer-block[data-idx="${idx}"]`);
  if (!block) return;

  block.classList.remove('dragging');

  if (toAnswerPad || !e.target.closest('.slot')) {
    answerPad.appendChild(block);
    // Restore placeholders on any empty slots
    document.querySelectorAll('.slot').forEach(slot => {
      if (!slot.hasChildNodes()) slot.innerHTML = '';
    });
    return;
  }

  const slot = e.target.closest('.slot');
  if (!slot || slot.children.length > 0) return;

  slot.innerHTML = '';
  slot.appendChild(block);

  // Check if all slots filled
  if (questionAnswers.querySelectorAll('.slot .answer-block').length === curQ.answer_divs) {
    setTimeout(checkAnswerAndProceed, 400);
  }
}

function checkAnswerAndProceed() {
  const userOrder = Array.from(questionAnswers.querySelectorAll('.slot')).map(slot => {
    const block = slot.querySelector('.answer-block');
    return block ? +block.dataset.idx : -1;
  });

  const isCorrect = JSON.stringify(userOrder) === JSON.stringify(curQ.correct_order);

  if (isCorrect) {
    correctCount++;
    curIdx++;
    setTimeout(() => loadQuestion(curIdx), 600);
  } else {
    questionAnswers.classList.add('shake');
    setTimeout(() => {
      questionAnswers.classList.remove('shake');
      // Move all blocks back
      questionAnswers.querySelectorAll('.answer-block').forEach(b => answerPad.appendChild(b));
      questionAnswers.querySelectorAll('.slot').forEach(slot => slot.innerHTML = '');
    }, 600);
  }
}

// === Custom Confirm Modal ===
async function customConfirm(message) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;z-index:9999;`;
    overlay.innerHTML = `
      <div style="background:#0c121c;padding:24px 32px;border-radius:12px;text-align:center;box-shadow:0 0 20px rgba(20,255,236,0.3);">
        <p style="color:#14ffec;margin-bottom:16px;font-size:1.1rem;">${message}</p>
        <button id="yesBtn" style="background:#14ffec;color:#0b0f19;padding:10px 20px;border:none;border-radius:8px;margin:0 8px;cursor:pointer;">Yes</button>
        <button id="noBtn" style="background:#ff416c;color:white;padding:10px 20px;border:none;border-radius:8px;margin:0 8px;cursor:pointer;">No</button>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#yesBtn').onclick = () => { overlay.remove(); resolve(true); };
    overlay.querySelector('#noBtn').onclick = () => { overlay.remove(); resolve(false); };
  });
}

function showGoodbyeScreen() {
  document.body.innerHTML = `
    <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;color:#14ffec;font-family:'Fira Code',monospace;background:radial-gradient(circle at 20% 20%, #0b0f19 0%, #02060f 100%);text-align:center;">
      <h2 style="font-size:2.5rem;margin-bottom:16px;">Thanks for playing!</h2>
      <p style="font-size:1.2rem;margin-bottom:24px;">Come back soon!</p>
      <button id="restartBtn" style="padding:14px 28px;background:linear-gradient(90deg,#14ffec,#0d7377);color:#0b0f19;border:none;border-radius:10px;font-size:1.1rem;cursor:pointer;box-shadow:0 0 20px rgba(20,255,236,0.4);">
        Restart Quiz
      </button>
    </div>
  `;
  document.getElementById('restartBtn').onclick = () => location.reload();
}

// === Event Listeners ===
startBtn.addEventListener('click', startQuiz);
retryBtn.addEventListener('click', startQuiz);

cancelBtn.addEventListener('click', async () => {
  if (await customConfirm('Restart the quiz?')) {
    showStartScreen();
  }
});

quitBtn.addEventListener('click', async () => {
  if (await customConfirm('Quit the game?')) {
    showGoodbyeScreen();
  }
});

// Cursor glow effect
document.addEventListener('mousemove', e => {
  const glow = document.querySelector('.cursor-glow');
  glow.style.left = e.pageX + 'px';
  glow.style.top = e.pageY + 'px';
});

// Init
showStartScreen();
