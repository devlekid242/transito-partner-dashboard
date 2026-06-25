import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
}

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent {
  @Input() fields: FormField[] = [];
  @Input() submitLabel: string = 'Submit';
  @Output() submit = new EventEmitter<any>();

  form: FormGroup;
  errorMessage: string = '';

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({});
    this.initializeForm();
  }

  initializeForm(): void {
    this.fields.forEach(field => {
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