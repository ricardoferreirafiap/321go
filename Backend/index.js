const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"], // Vite e possível segunda porta
    methods: ["GET", "POST"]
  }
});

// CORS para rotas HTTP (além do Socket.IO)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.send('Servidor do WhatsApp está rodando.');
});

// Endpoint para fazer scraping de URLs de operadores
app.post('/api/scrape-url', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL não fornecida' });
    }

    // Validar se é uma URL válida
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'URL inválida' });
    }
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Falha ao baixar página: ${response.status} ${response.statusText}` 
      });
    }

    const htmlContent = await response.text();
    
    res.json({ 
      success: true,
      html: htmlContent,
      contentLength: htmlContent.length 
    });

  } catch (error) {
    console.error('Erro ao fazer scraping:', error);
    res.status(500).json({ 
      error: 'Erro ao fazer scraping da URL',
      details: error.message 
    });
  }
});

io.on('connection', (socket) => {
  socket.emit('message', 'Conectado ao servidor. Aguardando inicialização do WhatsApp...');
  socket.emit('message', 'Iniciando cliente do WhatsApp no servidor...');

  // Inicializa o cliente do WhatsApp
  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('loading_screen', (percent, message) => {
    socket.emit('message', `Carregando: ${message}`);
  });

  client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    socket.emit('qr', qr); // Envia o valor do QR para o frontend
  });

  client.on('ready', () => {
    socket.emit('ready', 'Cliente conectado com sucesso!');
  });

  client.on('auth_failure', (msg) => {
    socket.emit('message', `Falha na autenticação: ${msg}`);
  });

  client.initialize();
});

server.listen(PORT);
