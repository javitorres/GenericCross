const express = require('express');
const path = require('path');
const app = express();

const PORT = 3000; // Puedes usar cualquier puerto que esté disponible

// Middleware para servir archivos estáticos
app.use(express.static('public')); // 'public' es el nombre de la carpeta donde tienes tu HTML

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html')); // Asegúrate de que el path coincida con la ubicación de tu archivo HTML
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
