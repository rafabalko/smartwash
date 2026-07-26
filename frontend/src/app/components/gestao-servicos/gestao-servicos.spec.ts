import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestaoServicos } from './gestao-servicos';

describe('GestaoServicos', () => {
  let component: GestaoServicos;
  let fixture: ComponentFixture<GestaoServicos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestaoServicos],
    }).compileComponents();

    fixture = TestBed.createComponent(GestaoServicos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
