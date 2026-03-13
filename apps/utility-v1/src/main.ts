import './style.css';
import '@document-flow/ui-library';
import './components/document-flow-app.js';

const app = document.getElementById('app');
if (app) {
  app.innerHTML = '<document-flow-app></document-flow-app>';
}
