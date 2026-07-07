export const HISTORIAL_FALLBACK = [
  { id: 1, titulo: 'Sistema web React + Spring Boot — análisis de similitud', tokens: 1240, fecha: '05 Jun 2026', hora: '10:32', coincidencias: 2, similitud: 88, estado: 'completado' },
  { id: 2, titulo: 'Aplicación móvil Flutter para gestión hospitalaria',       tokens: 980,  fecha: '04 Jun 2026', hora: '15:10', coincidencias: 1, similitud: 74, estado: 'completado' },
  { id: 3, titulo: 'Plataforma e-learning con microservicios',                  tokens: 1560, fecha: '03 Jun 2026', hora: '09:45', coincidencias: 3, similitud: 91, estado: 'alta-similitud' },
  { id: 4, titulo: 'API RESTful Node.js + MongoDB para control de activos',     tokens: 870,  fecha: '02 Jun 2026', hora: '14:20', coincidencias: 0, similitud: null, estado: 'sin-coincidencias' },
  { id: 5, titulo: 'Dashboard analítico con Python FastAPI y React',            tokens: 1120, fecha: '01 Jun 2026', hora: '11:55', coincidencias: 1, similitud: 67, estado: 'completado' },
  { id: 6, titulo: 'Sistema de matrícula universitaria con Vue.js',             tokens: 1340, fecha: '30 May 2026', hora: '08:30', coincidencias: 2, similitud: 79, estado: 'completado' },
  { id: 7, titulo: 'IoT con Raspberry Pi para monitoreo ambiental',             tokens: 760,  fecha: '28 May 2026', hora: '16:00', coincidencias: 0, similitud: null, estado: 'sin-coincidencias' },
]

export const TECH_COLORS = {
  'React':       { bg: 'rgba(59,130,246,0.18)',  color: '#60a5fa' },
  'Spring Boot': { bg: 'rgba(34,197,94,0.18)',   color: '#4ade80' },
  'PostgreSQL':  { bg: 'rgba(99,102,241,0.18)',  color: '#a5b4fc' },
  'Flutter':     { bg: 'rgba(56,189,248,0.18)',  color: '#38bdf8' },
  'FastAPI':     { bg: 'rgba(100,116,139,0.22)', color: '#94a3b8' },
  'MongoDB':     { bg: 'rgba(34,197,94,0.18)',   color: '#4ade80' },
  'Node.js':     { bg: 'rgba(52,211,153,0.18)',  color: '#34d399' },
  'Firebase':    { bg: 'rgba(251,191,36,0.18)',  color: '#fbbf24' },
  'Vue.js':      { bg: 'rgba(52,211,153,0.18)',  color: '#34d399' },
  'MySQL':       { bg: 'rgba(251,146,60,0.18)',  color: '#fb923c' },
  'Angular':     { bg: 'rgba(239,68,68,0.18)',   color: '#f87171' },
  'Oracle':      { bg: 'rgba(239,68,68,0.18)',   color: '#f87171' },
}

export const PROYECTOS_FALLBACK = [
  {
    codigo: 'C24-001', grupo: 'Grupo Alpha',   estado: 'aprobado',
    titulo: 'Sistema de Gestión de Inventarios Cloud',
    tecnologias: ['React', 'Spring Boot', 'PostgreSQL'],
    autores: 'K. Quispe · M. Torres · L. Ramos',
    similitud: 88, score: '94/100', fecha: '02 Jun 2026',
  },
  {
    codigo: 'C24-002', grupo: 'Grupo Beta',    estado: 'en-revision',
    titulo: 'Plataforma de Telemedicina con IA',
    tecnologias: ['Flutter', 'FastAPI', 'MongoDB'],
    autores: 'A. Mendoza · R. Ccori',
    similitud: 32, score: null, fecha: '03 Jun 2026',
  },
  {
    codigo: 'C24-003', grupo: 'Grupo Gamma',   estado: 'observado',
    titulo: 'App de Delivery con Seguimiento GPS',
    tecnologias: ['React', 'Node.js', 'Firebase'],
    autores: 'P. Solis · N. Huanca · C. Vargas',
    similitud: 61, score: null, fecha: '01 Jun 2026',
  },
  {
    codigo: 'C24-004', grupo: 'Grupo Delta',   estado: 'aprobado',
    titulo: 'Sistema ERP para PYMEs',
    tecnologias: ['Vue.js', 'Spring Boot', 'MySQL'],
    autores: 'F. Paredes · J. Llanos',
    similitud: 45, score: '87/100', fecha: '30 May 2026',
  },
  {
    codigo: 'C24-005', grupo: 'Grupo Epsilon', estado: 'en-revision',
    titulo: 'Chatbot de Atención al Cliente con NLP',
    tecnologias: ['React', 'FastAPI', 'PostgreSQL'],
    autores: 'D. Cueva · B. Arce · S. Puma',
    similitud: 28, score: null, fecha: '04 Jun 2026',
  },
  {
    codigo: 'C24-006', grupo: 'Grupo Zeta',    estado: 'rechazado',
    titulo: 'Control de Almacén con RFID',
    tecnologias: ['Angular', 'Spring Boot', 'Oracle'],
    autores: 'E. Valois · G. Cruz',
    similitud: 82, score: null, fecha: '28 May 2026',
  },
]
