import './style.css';
import { DocumentProcessor } from '@document-flow/pdf-engine';

const processor = new DocumentProcessor();

function initApp(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="flex h-screen bg-slate-100">
      <main class="flex-1 flex items-center justify-center p-8">
        <div id="tabletop" class="w-full max-w-4xl h-full min-h-96 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-white/80 hover:border-slate-400 transition-colors cursor-pointer">
          <div class="text-center text-slate-500">
            <p class="text-lg font-medium">Drop files here</p>
            <p class="text-sm mt-1">HEIC, TIFF, PNG, PDF</p>
          </div>
        </div>
      </main>
      <aside class="w-80 bg-white border-l border-slate-200 p-4 flex flex-col gap-4">
        <h2 class="font-semibold text-slate-800">Actions</h2>
        <button id="export-pdf" class="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
          Export PDF
        </button>
        <p class="text-sm text-slate-500 mt-auto">DocumentFlow Suite v1</p>
      </aside>
    </div>
  `;

  const tabletop = document.getElementById('tabletop');
  if (tabletop) {
    tabletop.addEventListener('dragover', (e) => {
      e.preventDefault();
      tabletop.classList.add('border-slate-500', 'bg-slate-50');
    });
    tabletop.addEventListener('dragleave', () => {
      tabletop.classList.remove('border-slate-500', 'bg-slate-50');
    });
    tabletop.addEventListener('drop', (e) => {
      e.preventDefault();
      tabletop.classList.remove('border-slate-500', 'bg-slate-50');
      if (e.dataTransfer?.files.length) {
        console.log('Files dropped:', e.dataTransfer.files, processor);
      }
    });
  }
}

initApp();
