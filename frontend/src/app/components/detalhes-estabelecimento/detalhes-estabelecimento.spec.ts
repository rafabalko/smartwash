import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalhesEstabelecimento } from './detalhes-estabelecimento';

describe('DetalhesEstabelecimento', () => {
  let component: DetalhesEstabelecimento;
  let fixture: ComponentFixture<DetalhesEstabelecimento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalhesEstabelecimento],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalhesEstabelecimento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
