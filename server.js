const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = 3000;

// Track players and their scores
let players = {};

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/player', (req, res) => {
  res.sendFile(__dirname + '/public/player.html');
});

io.on('connection', (socket) => {
  console.log('A player connected:', socket.id);

  socket.on('next-question', () => {
  // Just relay it to host (optional, used in manual mode)
  socket.broadcast.emit('next-question');
});

socket.on('end-quiz', () => {
  // Create a leaderboard array
  const leaderboard = Object.values(players).map(p => ({
    name: p.name,
    score: p.score
  }));

  // Sort descending by score
  leaderboard.sort((a, b) => b.score - a.score);

  // Send to all players
  io.emit('quiz-ended', leaderboard);
});

  socket.on('player-joined', (data) => {
  const { name, category } = data;
  players[socket.id] = {
    name: name,
    category: category,
    score: 0
  };
  console.log(`Player ${name} joined with category ${category}`);
});


  socket.on('start-quiz', (question) => {
    console.log("📨 Host sent a question:", question.text);
    io.emit('show-question', question);
  });

  socket.on('answer', (data) => {
    const { answerIndex, correctAnswer } = data;
    const isCorrect = answerIndex === correctAnswer;

    if (isCorrect && players[socket.id]) {
      players[socket.id].score += 1;
    }

    socket.emit('answer-result', {
      isCorrect: isCorrect,
      score: players[socket.id] ? players[socket.id].score : 0
    });
  });

  socket.on('disconnect', () => {
    console.log('A player disconnected:', socket.id);
    delete players[socket.id];
  });
});

http.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
