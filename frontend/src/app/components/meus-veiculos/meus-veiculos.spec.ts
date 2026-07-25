import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeusVeiculos } from './meus-veiculos';

describe('MeusVeiculos', () => {
  let component: MeusVeiculos;
  let fixture: ComponentFixture<MeusVeiculos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeusVeiculos],
    }).compileComponents();

    fixture = TestBed.createComponent(MeusVeiculos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
