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
import * as nucleo3d from './nucleo-3d.js?v=4';
import * as slideSpec from './slide-spec.js?v=4';
import * as slideStudio from './slide-studio-engine.js?v=10';
// Camada de investigação Wikipédia/Wikimedia/Wikidata YouTube/Mapas — fundida nos slides por omissão.
import * as slideWeb from './web-enrichment.js?v=9';
import * as aiEngine from './ai-engine.js?v=2';
import * as quality from './quality-engine.js?v=11';

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
};
window.dispatchEvent(new Event('study-ready'));
