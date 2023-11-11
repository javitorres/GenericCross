const express = require('express');
const path = require('path');
const app = express();

const PORT = 3000; // Puedes usar cualquier puerto que esté disponible

// Middleware para servir archivos estáticos
app.use(express.static('public')); // 'public' es el nombre de la carpeta donde tienes tu HTML

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html')); 
});

// Receive POST data to /submit
app.post('/submit', (req, res) => {
  console.log(req.body);
  res.sendFile(path.join(__dirname, '/public/index.html')); 
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});




