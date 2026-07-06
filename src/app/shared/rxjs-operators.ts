import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Interface représentant la structure standard d'une collection API Platform / JSON-LD
 */
interface JsonLdCollection<T> {
  '@context'?: string;
  '@id'?: string;
  '@type'?: string;
  totalItems?: number;
  member: T[]; // La propriété cible à extraire
}

/**
 * Opérateur RxJS personnalisé qui extrait le tableau 'member' si présent,
 * ou retourne la réponse brute si c'est déjà un tableau ou un autre format.
 */
export function unwrapCollection<T>() {
  return (source: Observable<any>): Observable<T[]> => {
    return source.pipe(
      map((response): T[] => {
        // En cas de réponse vide ou nulle
        if (!response) {
          return [];
        }

        // Cas 1 : Format API Platform / JSON-LD (contient la propriété 'member')
        if (typeof response === 'object' && 'member' in response && Array.isArray(response.member)) {
          return response.member as T[];
        }

        // Cas 2 : Format Tableau brut
        if (Array.isArray(response)) {
          return response as T[];
        }

        // Repli : Si la structure est inattendue mais qu'on attend un tableau
        return typeof response === 'object' ? [response] : [];
      })
    );
  };
}