
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

let chatSession: Chat | null = null;
let aiClient: GoogleGenAI | null = null;

// Inicializador perezoso para asegurar que las variables de entorno estén listas
const getAiClient = (): GoogleGenAI | null => {
    if (aiClient) return aiClient;
    
    // Verificación segura de la clave
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn("⚠️ API Key de Google GenAI no encontrada.");
        return null;
    }
    
    try {
        aiClient = new GoogleGenAI({ apiKey });
        return aiClient;
    } catch (e) {
        console.error("Error inicializando cliente AI:", e);
        return null;
    }
};

// Función para iniciar o reiniciar el chat con un contexto específico (datos de la pantalla)
export async function startNewChat(contextData: string = ""): Promise<void> {
    const ai = getAiClient();
    
    if (!ai) {
        console.error("No se puede iniciar el chat: Cliente AI no disponible.");
        return;
    }

    // Instrucción del sistema: Analista de Datos + Asistente General en Español
    const systemInstruction = `
Eres Gemini, un asistente de inteligencia artificial integrado en la aplicación corporativa "Consulta de Tarifas".

TU COMPORTAMIENTO DEBE SER:
1. **Idioma:** DEBES RESPONDER SIEMPRE EN ESPAÑOL. No importa el idioma en el que te hablen, tu respuesta debe ser en un español claro y profesional.
2. **Versátil:** Puedes responder a CUALQUIER pregunta, ya sea sobre la aplicación, sobre los datos que ves, o temas generales (cultura, redacción, ayuda técnica, etc.).
3. **Analítico (Si hay datos):** A continuación se te proporcionará un "CONTEXTO DE DATOS ACTUAL". Si contiene información, úsala para responder preguntas sobre precios, productos o estadísticas. Si está vacío, actúa como un chat normal.
4. **Profesional y Conciso:** Tus respuestas deben ser útiles y directas.

CONTEXTO DE DATOS ACTUAL (Lo que ve el usuario):
${contextData ? contextData : "El usuario no está visualizando datos específicos ahora mismo."}

EJEMPLOS DE INTERACCIÓN:
- Usuario: "¿Qué precio tiene el jamón?" -> (Buscas en el contexto y respondes en español).
- Usuario: "Write an email for employees." -> (Redactas el correo EN ESPAÑOL).
- Usuario: "Hola, ¿qué puedes hacer?" -> (Te presentas en español).
    `;

    try {
        chatSession = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            },
        });
        console.log("Chat de Gemini inicializado correctamente en español.");
    } catch (error) {
        console.error("Error al iniciar sesión de chat Gemini:", error);
        chatSession = null;
    }
}

export async function getBotResponse(message: string): Promise<string> {
  try {
    if (!chatSession) {
        await startNewChat();
    }

    if (!chatSession) {
        return "Error: No se pudo conectar con el servicio de IA. Verifica tu API Key.";
    }

    const result: GenerateContentResponse = await chatSession.sendMessage({ message: message });
    
    if (result && result.text) {
        return result.text;
    } else {
        return "No he recibido una respuesta válida. Por favor, inténtalo de nuevo.";
    }

  } catch (error: any) {
    console.error("Error al comunicarse con la API de Gemini:", error);
    chatSession = null;

    if (error.message && error.message.includes('API key')) {
        return "Error de autenticación con la IA. Verifica la API Key.";
    }
    
    return "Lo siento, ha ocurrido un error de conexión con la IA. Por favor, inténtalo de nuevo en unos segundos.";
  }
}
