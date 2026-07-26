import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientesAdmin } from './clientes-admin';

describe('ClientesAdmin', () => {
  let component: ClientesAdmin;
  let fixture: ComponentFixture<ClientesAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientesAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientesAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
