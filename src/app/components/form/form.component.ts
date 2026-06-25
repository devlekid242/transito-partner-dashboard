import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'tel';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string, disabled?: boolean }[];
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
export class FormComponent implements OnInit {
  @Input() fields: FormField[] = [];
  @Input() submitLabel: string = 'Submit';
  @Output() submit = new EventEmitter<any>();

  form!: FormGroup; // Utilisez l'opérateur ! car il sera initialisé dans ngOnInit
  errorMessage: string = '';

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({});
    this.initializeForm();
  }

  initializeForm(): void {
    this.fields.forEach((field) => {
      const validators = [];
      if (field.required) {
        validators.push(Validators.required);
      }
      if (field.type === 'email') {
        validators.push(Validators.email);
      }

      this.form.addControl(field.key, this.fb.control('', validators));
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.submit.emit(this.form.value);
    } else {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
    }
  }

  getFieldType(field: FormField): string {
    return field.type === 'password' ? 'password' : 'text';
  }
}
