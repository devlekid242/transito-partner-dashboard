import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../components/modal/modal.component';
import { TableComponent } from '../components/table/table.component';
import { FormComponent } from '../components/form/form.component';
import { NotificationComponent } from '../components/notification/notification.component';

@NgModule({
  declarations: [
    ModalComponent,
    TableComponent,
    FormComponent,
    NotificationComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  exports: [
    ModalComponent,
    TableComponent,
    FormComponent,
    NotificationComponent
  ]
})
export class SharedModule { }