import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "app.title": "EngiPlay",
      "app.subtitle": "Interactive STEM & Engineering Platform",
      "auth.login": "Sign In",
      "auth.register": "Create Account",
      "auth.guest": "Play as Guest",
      "auth.logout": "Sign Out",
      "dashboard.title": "Engineering Labs",
      "dashboard.welcome": "Welcome back, {{name}}!",
      "dashboard.grade": "Grade {{grade}}",
      "dashboard.classroom": "Teacher Dashboard",
      "dashboard.skills": "Your Engineering Skill Profile",
      "dashboard.game_count": "{{count}} levels completed",
      
      // Domains
      "domain.electrical": "Electrical Engineering",
      "domain.civil": "Civil/Structural Engineering",
      "domain.mechanical": "Mechanical Engineering",
      "domain.cs": "CS & Algorithms",
      "domain.power": "Power Systems",
      "domain.fluids": "Fluid Dynamics",

      // Tutor
      "tutor.title": "Socratic Tutor Bot",
      "tutor.ask": "Ask for a Hint",
      "tutor.intro": "I'm your Socratic guide. Tell me where you are stuck, or let's look at your last attempt. I won't give you the answer, but I will help you find it!",
      "tutor.waiting": "Thinking of a guiding question...",
      "tutor.trigger": "Stuck? Ask me for a hint!",

      // Games UI
      "game.play": "Launch Game",
      "game.restart": "Retry Level",
      "game.level": "Level {{level}}",
      "game.score": "Score: {{score}}",
      "game.attempts": "Attempt: {{attempts}}",
      "game.success": "Level Completed!",
      "game.next": "Next Level",
      "game.back": "Back to Dashboard",
      "game.failure_title": "Level Check Failed",
      "game.failure_desc": "Don't worry! Here is what went wrong. Adjust your parameters and try again immediately.",
      
      // Skills
      "skill.problem_solving": "Problem Solving",
      "skill.logic": "Logic",
      "skill.creativity": "Creativity",
      "skill.optimization": "Optimization",
      "skill.persistence": "Persistence",
      "skill.spatial_reasoning": "Spatial Reasoning"
    }
  },
  es: {
    translation: {
      "app.title": "EngiPlay",
      "app.subtitle": "Plataforma Interactiva de STEM e Ingeniería",
      "auth.login": "Iniciar Sesión",
      "auth.register": "Crear Cuenta",
      "auth.guest": "Jugar como Invitado",
      "auth.logout": "Cerrar Sesión",
      "dashboard.title": "Laboratorios de Ingeniería",
      "dashboard.welcome": "¡Bienvenido de nuevo, {{name}}!",
      "dashboard.grade": "Grado {{grade}}",
      "dashboard.classroom": "Panel de Control del Profesor",
      "dashboard.skills": "Tu Perfil de Habilidades de Ingeniería",
      "dashboard.game_count": "{{count}} niveles completados",

      // Domains
      "domain.electrical": "Ingeniería Eléctrica",
      "domain.civil": "Ingeniería Civil/Estructural",
      "domain.mechanical": "Ingeniería Mecánica",
      "domain.cs": "Informática y Algoritmos",
      "domain.power": "Sistemas de Energía",
      "domain.fluids": "Dinámica de Fluidos",

      // Tutor
      "tutor.title": "Tutor Bot Socrático",
      "tutor.ask": "Pedir una Pista",
      "tutor.intro": "Soy tu guía socrático. Dime dónde estás atascado o analicemos tu último intento. ¡No te daré la respuesta, pero te ayudaré a encontrarla!",
      "tutor.waiting": "Pensando en una pregunta orientadora...",
      "tutor.trigger": "¿Atascado? ¡Pídeme una pista!",

      // Games UI
      "game.play": "Iniciar Juego",
      "game.restart": "Reintentar Nivel",
      "game.level": "Nivel {{level}}",
      "game.score": "Puntuación: {{score}}",
      "game.attempts": "Intento: {{attempts}}",
      "game.success": "¡Nivel Completado!",
      "game.next": "Siguiente Nivel",
      "game.back": "Volver al Panel",
      "game.failure_title": "Fallo en la prueba de nivel",
      "game.failure_desc": "¡No te preocupes! Esto es lo que falló. Ajusta tus parámetros y vuelve a intentarlo de inmediato.",

      // Skills
      "skill.problem_solving": "Resolución de Problemas",
      "skill.logic": "Lógica",
      "skill.creativity": "Creatividad",
      "skill.optimization": "Optimización",
      "skill.persistence": "Persistencia",
      "skill.spatial_reasoning": "Razonamiento Espacial"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
