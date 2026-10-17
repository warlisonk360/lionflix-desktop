const { app, BrowserWindow, shell, session, Menu, dialog } = require('electron');
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

// Página de downloads (usada no fallback de atualização manual).
const RELEASES_URL = 'https://github.com/warlisonk360/lionflix-desktop/releases/latest';

// O Google Drive recusa o User-Agent padrão do Electron ("Electron/..."),
// então nos passamos por um Chrome estável. Isso é o que faz o player
// (iframe drive.google.com/file/d/<id>/preview) funcionar.
const CHROME_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
app.userAgentFallback = CHROME_UA;

// Deixa o player do Drive iniciar sem exigir gesto do usuário.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// ---------------------------------------------------------------------------
// Atualizações automáticas (electron-updater)
// ---------------------------------------------------------------------------
// O electron-updater é opcional: se por algum motivo não carregar, o app
// continua funcionando normalmente, só sem a atualização automática.
let autoUpdater = null;
try {
  ({ autoUpdater } = require('electron-updater'));
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
} catch (err) {
  console.warn('[lionflix] electron-updater indisponivel:', err.message);
}

let win = null;
// Marca se a checagem atual foi pedida manualmente (menu), para dar retorno
// ao usuário mesmo quando não há versão nova.
let manualCheck = false;

// O auto-update só é possível quando o app está empacotado. No Linux, o
// electron-updater só troca o arquivo quando o app roda de dentro do próprio
// .AppImage (o runtime define a variável APPIMAGE).
function canAutoUpdate() {
  if (!app.isPackaged || !autoUpdater) return false;
  if (process.platform === 'linux' && !process.env.APPIMAGE) return false;
  return true;
}

function openReleasesPage() {
  shell.openExternal(RELEASES_URL);
}

function checkForUpdates({ manual = false } = {}) {
  manualCheck = manual;

  if (!canAutoUpdate()) {
    if (manual) {
      dialog
        .showMessageBox(win, {
          type: 'info',
          title: 'Atualizações',
          message: 'Atualização automática indisponível neste formato.',
          detail:
            'Baixe a versão mais recente na página de downloads do LionFlix.',
          buttons: ['Abrir página de downloads', 'Fechar'],
          defaultId: 0,
          cancelId: 1,
        })
        .then(({ response }) => {
          if (response === 0) openReleasesPage();
        });
    }
    return;
  }

  autoUpdater.checkForUpdates().catch((err) => {
    console.warn('[lionflix] falha ao verificar atualizacoes:', err.message);
    if (manualCheck) {
      dialog.showMessageBox(win, {
        type: 'warning',
        title: 'Atualizações',
        message: 'Não foi possível verificar atualizações agora.',
        detail: 'Verifique sua conexão e tente novamente mais tarde.',
      });
    }
  });
}

function setupUpdaterEvents() {
  if (!autoUpdater) return;

  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(win, {
      type: 'info',
      title: 'Atualização disponível',
      message: `Nova versão ${info.version} encontrada.`,
      detail: 'O download está sendo feito em segundo plano.',
      buttons: ['OK'],
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    if (manualCheck) {
      dialog.showMessageBox(win, {
        type: 'info',
        title: 'Atualizações',
        message: 'Você já está na versão mais recente.',
        detail: `Versão instalada: ${app.getVersion()} (a mais nova: ${info.version}).`,
        buttons: ['OK'],
      });
    }
  });

  autoUpdater.on('error', (err) => {
    console.warn('[lionflix] erro no atualizador:', err.message);
  });

  autoUpdater.on('update-downloaded', (info) => {
    dialog
      .showMessageBox(win, {
        type: 'info',
        title: 'Atualização pronta',
        message: `A versão ${info.version} foi baixada.`,
        detail: 'Reiniciar o LionFlix agora para aplicar a atualização?',
        buttons: ['Reiniciar agora', 'Depois'],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall();
      });
  });
}

// ---------------------------------------------------------------------------
// Menu da aplicação (fica escondido; aparece com Alt)
// ---------------------------------------------------------------------------
function buildMenu() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [{ role: 'quit', label: 'Sair' }],
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recarregar' },
        { role: 'toggleDevTools', label: 'Ferramentas de desenvolvedor' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Tamanho normal' },
        { role: 'zoomIn', label: 'Aumentar zoom' },
        { role: 'zoomOut', label: 'Diminuir zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela cheia' },
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Verificar atualizações…',
          click: () => checkForUpdates({ manual: true }),
        },
        {
          label: 'Página de downloads',
          click: () => openReleasesPage(),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ---------------------------------------------------------------------------
// Janela
// ---------------------------------------------------------------------------
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
    buildMenu();
    setupUpdaterEvents();
    createWindow();

    // Procura atualizações pouco depois de abrir (sem incomodar o usuário).
    if (canAutoUpdate()) {
      setTimeout(() => checkForUpdates({ manual: false }), 5000);
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
