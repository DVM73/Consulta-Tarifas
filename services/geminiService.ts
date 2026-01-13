
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

// Initialize the Google GenAI client directly using the environment variable as per guidelines.
// Always use a named parameter object for the constructor.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chatSession: Chat | null = null;

// Función para iniciar o reiniciar el chat con un contexto específico (datos de la pantalla)
export async function startNewChat(contextData: string = ""): Promise<void> {
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
        // Correct usage of chats.create with gemini-3-flash-preview and systemInstruction in config.
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
        throw new Error("No se pudo establecer la sesión de chat.");
    }

    // sendMessage returns GenerateContentResponse
    const result: GenerateContentResponse = await chatSession.sendMessage({ message: message });
    
    // The simplest and most direct way to get the generated text content is by accessing the .text property.
    // Do not call .text() as it is a getter property.
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