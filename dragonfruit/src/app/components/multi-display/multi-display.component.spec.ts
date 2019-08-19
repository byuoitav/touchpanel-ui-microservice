import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiDisplayComponent } from './multi-display.component';

describe('MultiDisplayComponent', () => {
  let component: MultiDisplayComponent;
  let fixture: ComponentFixture<MultiDisplayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MultiDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MultiDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
