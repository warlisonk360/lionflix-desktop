const { app, BrowserWindow, shell, session } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------
// URL do site. Pode ser trocada em runtime: LIONFLIX_URL=... npm start
const SITE_URL = process.env.LIONFLIX_URL || 'https://www.lionflix.com.br';

// Carrega o build local (../dist) em vez do site no ar: LIONFLIX_LOCAL=1 npm start
const USE_LOCAL = process.env.LIONFLIX_LOCAL === '1';
const LOCAL_INDEX = path.join(__dirname, '..', 'dist', 'index.html');

// O Google Drive recusa o User-Agent padrão do Electron ("Electron/..."),
// então nos passamos por um Chrome estável. Isso é o que faz o player
// (iframe drive.google.com/file/d/<id>/preview) funcionar.
const CHROME_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
app.userAgentFallback = CHROME_UA;

// Deixa o player do Drive iniciar sem exigir gesto do usuário.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0b0b0f',
    title: 'LionFlix',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Links que abrem nova janela (redes sociais, contas, etc.) vão para o
  // navegador padrão do sistema — nada de janelas soltas dentro do app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (USE_LOCAL && fs.existsSync(LOCAL_INDEX)) {
    win.loadFile(LOCAL_INDEX);
  } else {
    if (USE_LOCAL) {
      console.warn('[lionflix] LIONFLIX_LOCAL=1 mas nao achei', LOCAL_INDEX, '- usando o site online.');
    }
    win.loadURL(SITE_URL);
  }

  win.on('closed', () => {
    win = null;
  });
}

// Instância única: abrir o app de novo apenas foca a janela existente.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    // Garante o UA em todas as requisições (inclusive dentro dos iframes).
    session.defaultSession.setUserAgent(CHROME_UA);
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
