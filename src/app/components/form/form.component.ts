import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

export interface FormField {
  key: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'select'
    | 'textarea'
    | 'checkbox'
    | 'tel'
    | 'date'
    | 'time';
  placeholder?: string;
  required?: boolean;
  multiple?: boolean;
  options?: { value: string; label: string; disabled?: boolean }[];
  value?: any;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
}

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css'],
  // 2. Ajoutez ReactiveFormsModule ici dans les imports
  imports: [CommonModule, ReactiveFormsModule],
})
export class FormComponent implements OnInit, OnChanges {
  @Input() fields: FormField[] = [];
  @Input() submitLabel: string = 'Submit';
  @Output() submit = new EventEmitter<any>();
  @Input() IsSubmit: boolean = false; // Ajout de l'input pour le statut de soumission

  form!: FormGroup; // Utilisez l'opérateur ! car il sera initialisé dans ngOnInit
  errorMessage: string = '';

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({});
    this.initializeForm();
  }

  ngOnChanges(): void {
    if (this.form) {
      this.initializeForm();
    }
  }

  initializeForm(): void {
    const controls: Record<string, any> = {};
    this.fields.forEach((field) => {
      const validators = [];
      if (field.required) {
        validators.push(Validators.required);
      }
      if (field.type === 'email') {
        validators.push(Validators.email);
      }

      const defaultValue =
        field.type === 'select' && field.multiple ? (field.value ?? []) : (field.value ?? '');
      controls[field.key] = this.fb.control(defaultValue, validators);
    });

    this.form = this.fb.group(controls);
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.submit.emit(this.form.value);
    } else {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
    }
  }

  getFieldType(field: FormField): string {
    if (field.type === 'password') {
      return 'password';
    }
    if (
      field.type === 'number' ||
      field.type === 'tel' ||
      field.type === 'email' ||
      field.type === 'text' ||
      field.type === 'date' ||
      field.type === 'time'
    ) {
      return field.type;
    }
    return 'text';
  }
}
