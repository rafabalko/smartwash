import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuscaEstabelecimentos } from './busca-estabelecimentos';

describe('BuscaEstabelecimentos', () => {
  let component: BuscaEstabelecimentos;
  let fixture: ComponentFixture<BuscaEstabelecimentos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuscaEstabelecimentos],
    }).compileComponents();

    fixture = TestBed.createComponent(BuscaEstabelecimentos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
