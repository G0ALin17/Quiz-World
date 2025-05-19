const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Serve static files from /public
app.use(express.static('public'));

// Serve player.html as default homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/player.html');
});

// Global state
let players = {};
let currentQuestionIndex = 0;
let selectedQuestions = [];

// Question bank
const questionSets = {
  animals: [
    {
      text: "Which animal is known as the king of the jungle?",
      answers: ["Tiger", "Elephant", "Lion", "Giraffe"],
      correct: 2
    },
    {
      text: "What do pandas mostly eat?",
      answers: ["Fish", "Bamboo", "Meat", "Leaves"],
      correct: 1
    }
  ],
  general: [
    {
      text: "What is the capital of France?",
      answers: ["Berlin", "Madrid", "Paris", "Rome"],
      correct: 2
    },
    {
      text: "What color is the sky on a clear day?",
      answers: ["Green", "Red", "Blue", "Purple"],
      correct: 2
    }
  ],
  sports: [
    {
      text: "How many players are on a football (soccer) team?",
      answers: ["9", "10", "11", "12"],
      correct: 2
    },
    {
      text: "Which country hosted the 2022 FIFA World Cup?",
      answers: ["Brazil", "Qatar", "Germany", "Russia"],
      correct: 1
    }
  ],
  food: [
    {
      text: "Which fruit is used to make guacamole?",
      answers: ["Banana", "Avocado", "Mango", "Papaya"],
      correct: 1
    },
    {
      text: "Sushi is a cuisine from which country?",
      answers: ["China", "Japan", "Korea", "Vietnam"],
      correct: 1
    }
  ],
  disney: [
    {
      text: "Who is the snowman in Frozen?",
      answers: ["Olaf", "Sven", "Kristoff", "Elsa"],
      correct: 0
    },
    {
      text: "Which Disney princess has a pet tiger?",
      answers: ["Ariel", "Jasmine", "Belle", "Mulan"],
      correct: 1
    }
  ]
};

// Handle new player
io.on('connection', (socket) => {
  console.log('A player connected:', socket.id);

  socket.on('player-joined', (data) => {
    const { name, category } = data;

    players[socket.id] = {
      name,
      category,
      score: 0
    };

    console.log(`${name} joined with category: ${category}`);

    // If this is the first player, start the quiz
    if (Object.keys(players).length === 1) {
      const selectedCategory = category || 'general';
      selectedQuestions = questionSets[selectedCategory] || questionSets.general;
      currentQuestionIndex = 0;
      sendQuestionToAll();
    }
  });

  socket.on('answer', (data) => {
    const { answerIndex, correctAnswer } = data;
    const isCorrect = answerIndex === correctAnswer;

    if (isCorrect && players[socket.id]) {
      players[socket.id].score += 1;
    }

    socket.emit('answer-result', {
      isCorrect,
      score: players[socket.id]?.score || 0
    });
  });

  socket.on('next-question', () => {
    currentQuestionIndex++;
    sendQuestionToAll();
  });

  socket.on('end-quiz', () => {
    sendFinalLeaderboard();
  });

  socket.on('disconnect', () => {
    console.log('A player disconnected:', socket.id);
    delete players[socket.id];
  });
});

// Helper to send next question or end game
function sendQuestionToAll() {
  if (currentQuestionIndex < selectedQuestions.length) {
    const question = selectedQuestions[currentQuestionIndex];
    io.emit('show-question', question);
  } else {
    sendFinalLeaderboard();
  }
}

// Helper to send leaderboard
function sendFinalLeaderboard() {
  const leaderboard = Object.values(players).sort((a, b) => b.score - a.score);
  io.emit('quiz-ended', leaderboard);
}
