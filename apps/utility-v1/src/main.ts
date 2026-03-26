import './style.css';
import '@document-flow/ui-library';
import { initTheme } from './utils/theme.js';
import './components/document-flow-app.js';

initTheme();

const app = document.getElementById('app');
if (app) {
  app.innerHTML = '<document-flow-app></document-flow-app>';
}
