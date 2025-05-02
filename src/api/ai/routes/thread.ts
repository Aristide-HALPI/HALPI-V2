/**
 * Gestion des threads de conversation avec l'API Fabrile
 */

/**
 * Crée un nouveau thread de conversation avec l'agent Fabrile
 * @param organizationId ID de l'organisation
 * @param agentId ID de l'agent IA
 * @returns Réponse contenant l'ID du thread
 */
export async function createThread(organizationId: string, agentId: string) {
  try {
    const token = import.meta.env.VITE_FABRILE_TOKEN;
   
    if (!token) {
      throw new Error("VITE_FABRILE_TOKEN manquant dans les variables d'environnement");
    }

    const response = await fetch(`https://api.fabrile.ai/api/v1/threads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Organization-ID": organizationId
      },
      body: JSON.stringify({
        agent_id: agentId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Échec de création du thread: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la création du thread:", error);
    throw error;
  }
}

/**
 * Envoie un message dans un thread existant
 * @param organizationId ID de l'organisation
 * @param threadId ID du thread
 * @param message Contenu du message
 * @returns Réponse de l'IA
 */
export async function createThreadMessage(organizationId: string, threadId: string, message: string) {
  try {
    const token = import.meta.env.VITE_FABRILE_TOKEN;
   
    if (!token) {
      throw new Error("VITE_FABRILE_TOKEN manquant dans les variables d'environnement");
    }

    const response = await fetch(`https://api.fabrile.ai/api/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Organization-ID": organizationId
      },
      body: JSON.stringify({
        message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Échec d'envoi du message: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error);
    throw error;
  }
}
