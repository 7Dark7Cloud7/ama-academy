// AMA · carrega os motores determinísticos de estudo (sem rede, sem modelo)
// e expõe-nos em window.Study para a camada clássica (app.js / ama-study.js).
import * as summary from './summary-engine.js';
import * as review from './review-scheduler.js';
import * as teacher from './teacher-tools.js';
import * as attendance from './attendance.js';
import * as planner from './planner-engine.js';

window.Study = { ...summary, ...review, ...teacher, ...attendance, ...planner };
window.dispatchEvent(new Event('study-ready'));
