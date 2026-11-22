// AMA — carrega os motores determinísticos de estudo (sem rede, sem modelo)
// e expõe-os em window.Study para a camada clássica (app.js / ama-study.js).
// As versões nos imports garantem que uma alteração de motor chega ao navegador
// mesmo quando o index.html não muda — essencial no projetor PDF→slides.
import * as summary from './summary-engine.js?v=3';
import * as review from './review-scheduler.js?v=2';
import * as teacher from './teacher-tools.js?v=2';
import * as attendance from './attendance.js?v=2';
import * as planner from './planner-engine.js?v=2';
import * as quiz from './quiz-engine.js?v=5';
import * as projector from './projector-engine.js?v=22';
import * as nucleo3d from './nucleo-3d.js?v=5';
import * as slideSpec from './slide-spec.js?v=4';
import * as slideStudio from './slide-studio-engine.js?v=10';
// Camada de investigação Wikipédia/Wikimedia/Wikidata YouTube/Mapas — fundida nos slides por omissão.
import * as slideWeb from './web-enrichment.js?v=12';
import * as aiEngine from './ai-engine.js?v=5';
import * as quality from './quality-engine.js?v=12';
import * as pdfEngine from './pdf-engine.js?v=1';
import * as outlineEngine from './outline-engine.js?v=2';
import * as worksheetEngine from './worksheet-engine.js?v=1';
import * as exportEngine from './export-engine.js?v=1';
import * as docAnalyzer from './doc-analyzer.js?v=1';
import * as mvpDb from './mvp-db.js?v=1';

window.Study = {
  ...summary, ...review, ...teacher, ...attendance, ...planner, ...quiz, ...projector, ...nucleo3d,
  SlideStudio: {
    ...slideSpec, ...slideStudio,
    SLIDE_SPEC_VERSION: slideSpec.SLIDE_SPEC_VERSION,
    PALETTES: slideSpec.PALETTES,
    SLIDE_TYPES: slideSpec.SLIDE_TYPES,
    INTERACTIVE_TYPES: slideSpec.INTERACTIVE_TYPES,
  },
  SlideStudioWeb: slideWeb,
  AI: aiEngine,
  Quality: quality,
  PDF: pdfEngine,
  Outline: outlineEngine,
  Worksheet: worksheetEngine,
  Export: exportEngine,
  DocAnalyzer: docAnalyzer,
  MvpDB: mvpDb,
};
try { mvpDb.migrateLocalStorageDecks().then(() => mvpDb.syncWithServer()).catch(() => {}); } catch { }
window.dispatchEvent(new Event('study-ready'));
