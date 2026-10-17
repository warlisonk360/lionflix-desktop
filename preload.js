const { contextBridge } = require('electron');

// Superfície mínima exposta ao site. Nenhum acesso a Node é liberado.
contextBridge.exposeInMainWorld('lionflixDesktop', {
  isDesktop: true,
  platform: process.platform,
});
