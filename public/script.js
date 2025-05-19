const socket = io();

const form = document.getElementById('join-form');
const nameInput = document.getElementById('playerName');
const quizArea = document.getElementById('quiz-area');
const questionText = document.getElementById('question');
const answersDiv = document.getElementById('answers');
let currentQuestion = null;

const categorySelect = document.getElementById('category');


form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const category = categorySelect.value;

  if (name && category) {
    socket.emit('player-joined', { name, category });
    form.style.display = 'none';
    quizArea.style.display = 'block';
  }
});

socket.on('show-question', (question) => {
  currentQuestion = question;
  questionText.textContent = question.text;
  answersDiv.innerHTML = "";

  question.answers.forEach((answer, index) => {
    const btn = document.createElement('button');
    btn.textContent = answer;
    btn.classList.add('answer-button');

    btn.addEventListener('click', () => {
      socket.emit('answer', {
        answerIndex: index,
        correctAnswer: currentQuestion.correct
      });

      const allButtons = document.querySelectorAll('.answer-button');
      allButtons.forEach(b => b.disabled = true);
    });

    answersDiv.appendChild(btn);
  });
});

socket.on('answer-result', (data) => {
  const { isCorrect, score } = data;
  const allButtons = document.querySelectorAll('.answer-button');

  allButtons.forEach((btn, index) => {
    if (index === currentQuestion.correct) {
      btn.style.backgroundColor = 'lightgreen';
    } else {
      btn.style.backgroundColor = 'lightcoral';
    }
  });

  document.getElementById('score').textContent = `Score: ${score}`;

  if (isCorrect) {
    console.log("✅ Correct!");
  } else {
    console.log("❌ Wrong!");
  }
});

const nextBtn = document.getElementById('nextBtn');

socket.on('show-question', (question) => {
  currentQuestion = question;
  questionText.textContent = question.text;
  answersDiv.innerHTML = "";
  nextBtn.style.display = "none";

  question.answers.forEach((answer, index) => {
    const btn = document.createElement('button');
    btn.textContent = answer;
    btn.classList.add('answer-button');

    btn.addEventListener('click', () => {
      socket.emit('answer', {
        answerIndex: index,
        correctAnswer: currentQuestion.correct
      });

      const allButtons = document.querySelectorAll('.answer-button');
      allButtons.forEach(b => b.disabled = true);
    });

    answersDiv.appendChild(btn);
  });
});

socket.on('answer-result', (data) => {
  const { isCorrect, score } = data;
  const allButtons = document.querySelectorAll('.answer-button');

  allButtons.forEach((btn, index) => {
    if (index === currentQuestion.correct) {
      btn.style.backgroundColor = 'lightgreen';
    } else {
      btn.style.backgroundColor = 'lightcoral';
    }
  });

  document.getElementById('score').textContent = `Score: ${score}`;

  // Show Next button only after answering
  nextBtn.style.display = "inline-block";
});

nextBtn.addEventListener('click', () => {
  socket.emit('next-question');
  nextBtn.style.display = "none";
});

socket.on('quiz-ended', (leaderboard) => {
  questionText.textContent = "🎉 Quiz Finished!";
  answersDiv.innerHTML = "";
  nextBtn.style.display = "none";

  const list = document.createElement('ul');
  leaderboard.forEach(player => {
    const li = document.createElement('li');
    li.textContent = `${player.name} - ${player.score} pts`;
    list.appendChild(li);
  });

  answersDiv.appendChild(list);
});

