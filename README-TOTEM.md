# Sistema de Tótem - Adium Backend

Este sistema permite crear un tótem interactivo que responde preguntas sobre Mounjaro usando Azure OpenAI, Azure Search y síntesis de voz.

## 🏗️ Arquitectura

```
Frontend (Tótem) → Backend API → Azure Search → Azure OpenAI → ElevenLabs TTS
```

### Flujo de Procesamiento

1. **Frontend envía pregunta** al endpoint `/api/totem/question`
2. **Azure Search** busca información relevante en la base de conocimientos
3. **Azure OpenAI** genera una respuesta basada en la información encontrada
4. **ElevenLabs** sintetiza la respuesta en audio
5. **Backend devuelve** texto y URL del audio al frontend

## 📋 Configuración

### Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Azure API Keys
AZURE_OPENAI_API_KEY=tu_clave_de_azure_openai_aqui
AZURE_SEARCH_API_KEY=tu_clave_de_azure_search_aqui

# ElevenLabs (para síntesis de voz)
ELEVENLABS_API_KEY=tu_clave_de_elevenlabs_aqui
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
ELEVENLABS_MODEL_ID=eleven_monolingual_v1

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Obtener las Claves de API

1. **Azure OpenAI**: Ve a [Azure Portal](https://portal.azure.com) → Azure OpenAI → Keys
2. **Azure Search**: Ve a [Azure Portal](https://portal.azure.com) → Azure Cognitive Search → Keys
3. **ElevenLabs**: Ve a [ElevenLabs](https://elevenlabs.io) → Profile → API Key

## 🚀 Uso

### Endpoints Disponibles

#### POST `/api/totem/question`
Procesa una pregunta del usuario.

**Request:**
```json
{
  "question": "¿Qué es Mounjaro?",
  "filter": "modulo eq 'mounjaro'"
}
```

**Response:**
```json
{
  "success": true,
  "text": "Mounjaro es un medicamento...",
  "audioUrl": "https://api.elevenlabs.io/v1/text-to-speech/...",
  "searchResults": 3,
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  }
}
```

#### GET `/api/totem/questions`
Obtiene las preguntas predefinidas para el tótem.

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "info",
      "text": "Información sobre Mounjaro",
      "question": "¿Qué es Mounjaro y para qué se usa?"
    },
    {
      "id": "effects",
      "text": "Efectos secundarios",
      "question": "¿Cuáles son los efectos secundarios de Mounjaro?"
    }
  ]
}
```

#### GET `/api/totem/health`
Verifica el estado de todos los servicios.

#### GET `/api/totem/test`
Ejecuta una prueba rápida del sistema.

### Ejemplo de Uso desde Frontend

```javascript
// Enviar pregunta
const response = await fetch('/api/totem/question', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question: '¿Qué es Mounjaro?'
  })
});

const result = await response.json();

if (result.success) {
  // Mostrar texto
  displayText(result.text);
  
  // Reproducir audio
  if (result.audioUrl) {
    playAudio(result.audioUrl);
  }
}
```

## 🧪 Pruebas

### Ejecutar Pruebas del Sistema

```bash
node test-totem-system.js
```

### Verificar Configuración

```bash
curl http://localhost:3001/api/totem/health
```

### Probar Endpoint

```bash
curl -X POST http://localhost:3001/api/totem/question \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Qué es Mounjaro?"}'
```

## 📁 Estructura de Archivos

```
├── config/
│   └── azure.js              # Configuración de Azure
├── services/
│   ├── azureSearchService.js  # Servicio de búsqueda
│   ├── azureOpenAIService.js  # Servicio de IA
│   └── totemService.js        # Servicio principal del tótem
├── controllers/
│   └── totemController.js     # Controlador REST
├── routes/
│   └── totemRoutes.js         # Rutas de la API
├── test-totem-system.js       # Pruebas del sistema
└── README-TOTEM.md           # Esta documentación
```

## 🔧 Desarrollo

### Agregar Nuevas Preguntas Predefinidas

Edita `services/totemService.js`:

```javascript
getPredefinedQuestions() {
  return [
    // ... preguntas existentes
    {
      id: 'nueva',
      text: 'Nueva Categoría',
      question: '¿Nueva pregunta?'
    }
  ];
}
```

### Cambiar Filtro de Búsqueda

Modifica el parámetro `filter` en las llamadas:

```javascript
// Para buscar en otro módulo
const result = await totemService.processQuestion(question, "modulo eq 'otro_modulo'");
```

## 🐛 Solución de Problemas

### Error de API Keys
- Verifica que todas las claves estén en el archivo `.env`
- Asegúrate de que las claves sean válidas y tengan los permisos correctos

### Error de Conexión
- Verifica que el servidor esté corriendo en el puerto correcto
- Revisa los logs del servidor para errores específicos

### Error de Audio
- Verifica la clave de ElevenLabs
- Asegúrate de que el voice ID sea válido

## 📞 Soporte

Para problemas técnicos, revisa:
1. Los logs del servidor
2. El endpoint `/api/totem/health`
3. El archivo de prueba `test-totem-system.js` 