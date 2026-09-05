import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

import { extractApiErrorMessage, extractApiMessage } from '../utils/error.utils';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  success(responseOrMessage: unknown, title: string = 'Succès !', fallback: string = 'Opération réussie'): void {
    const text = extractApiMessage(
      responseOrMessage,
      typeof responseOrMessage === 'string' ? responseOrMessage : fallback
    );
    Swal.fire({
      title,
      text,
      icon: 'success',
      confirmButtonColor: '#3b82f6',
      timer: 2200,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  }

  error(errorOrMessage: unknown, title: string = 'Une erreur est survenue', fallback: string = 'Une erreur est survenue'): void {
    const text = extractApiErrorMessage(
      errorOrMessage,
      typeof errorOrMessage === 'string' ? errorOrMessage : fallback
    );
    Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonColor: '#ef4444',
    });
  }

  warning(errorOrMessage: unknown, title: string = 'Attention', fallback: string = 'Attention'): void {
    const text = extractApiErrorMessage(
      errorOrMessage,
      typeof errorOrMessage === 'string' ? errorOrMessage : fallback
    );
    Swal.fire({
      title,
      text,
      icon: 'warning',
      confirmButtonColor: '#f59e0b',
    });
  }

  info(responseOrMessage: unknown, title: string = 'Information', fallback: string = 'Information'): void {
    const text = extractApiMessage(
      responseOrMessage,
      typeof responseOrMessage === 'string' ? responseOrMessage : fallback
    );
    Swal.fire({
      title,
      text,
      icon: 'info',
      confirmButtonColor: '#3b82f6',
      timer: 2200,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  }

  async confirm(title: string, text: string): Promise<boolean> {
    const result = await Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler',
    });

    return result.isConfirmed;
  }
}
