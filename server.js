const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

const PORT = 3000;

app.use(express.static('public'));

app.set('view engine', 'ejs'); // Establece EJS como motor de plantillas
app.set('views', path.join(__dirname, 'views')); // Directorio donde estarán tus archivos EJS
//app.use(express.static(path.join(__dirname, 'public')));


app.use(bodyParser.urlencoded({ extended: true })); // Middleware para parsear cuerpos de solicitud tipo urlencoded

app.get('/', (req, res) => {
  res.render('index'); // Renderiza index.ejs
});

// Ruta que maneja la solicitud POST desde index.html
app.post('/genericCross', (req, res) => {
  const config = req.body.dashboardConfig;
  console.log("Config received in server.js: " + config);
  res.render('genericCross', { config: JSON.parse(config) });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
