/**
 * Utilitaires pour extraire les messages d'erreur et de réponse
 * retournés par l'API (clé "message" en priorité).
 */

export function extractApiErrorMessage(
  error: unknown,
  fallbackMessage: string = 'Une erreur est survenue'
): string {
  if (!error) {
    return fallbackMessage;
  }

  // Si c'est déjà une chaîne non vide
  if (typeof error === 'string') {
    const trimmed = error.trim();
    if (!trimmed) return fallbackMessage;

    // Tente de parser au cas où ce soit une chaîne JSON
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          return extractApiErrorMessage(parsed, fallbackMessage);
        }
      } catch {}
    }
    return trimmed;
  }

  if (typeof error === 'object') {
    const err = error as any;

    // 1. HttpErrorResponse avec payload dans err.error
    if (err.error !== undefined && err.error !== null) {
      if (typeof err.error === 'string') {
        const raw = err.error.trim();
        if (raw.startsWith('{') && raw.endsWith('}')) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              return extractApiErrorMessage(parsed, fallbackMessage);
            }
          } catch {}
        }
        // Éviter d'afficher du HTML brut si le serveur a crashé (500 HTML)
        if (raw && !raw.startsWith('<')) {
          return raw;
        }
      } else if (typeof err.error === 'object') {
        // Priorité absolue à la clé "message" comme renvoyée par les contrôleurs Symfony / API
        if (err.error.message && typeof err.error.message === 'string' && err.error.message.trim()) {
          return err.error.message.trim();
        }
        if (err.error.error && typeof err.error.error === 'string' && err.error.error.trim()) {
          return err.error.error.trim();
        }
        if (err.error.detail && typeof err.error.detail === 'string' && err.error.detail.trim()) {
          return err.error.detail.trim();
        }
        // Symfony violations de formulaire
        if (Array.isArray(err.error.violations) && err.error.violations.length > 0) {
          const first = err.error.violations[0];
          if (first?.message && typeof first.message === 'string') {
            return first.message;
          }
        }
      }
    }

    // 2. Objet direct contenant la clé "message" (ex: objet JSON ou instance personnalisée)
    if (err.message && typeof err.message === 'string' && err.message.trim()) {
      // Ignorer le message technique générique d'Angular HttpClient ("Http failure response for...")
      if (!err.message.startsWith('Http failure response for')) {
        return err.message.trim();
      }
    }

    // 3. Clés alternatives directes
    if (err.error && typeof err.error === 'string' && err.error.trim()) {
      return err.error.trim();
    }
    if (err.detail && typeof err.detail === 'string' && err.detail.trim()) {
      return err.detail.trim();
    }
  }

  return fallbackMessage;
}

export function extractApiMessage(
  response: unknown,
  fallbackMessage: string = 'Opération réussie'
): string {
  if (!response) {
    return fallbackMessage;
  }

  if (typeof response === 'string') {
    const trimmed = response.trim();
    return trimmed || fallbackMessage;
  }

  if (typeof response === 'object') {
    const res = response as any;
    if (res.message && typeof res.message === 'string' && res.message.trim()) {
      return res.message.trim();
    }
  }

  return fallbackMessage;
}
