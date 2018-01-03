import { BlueberryPage } from './app.po';

describe('blueberry App', () => {
  let page: BlueberryPage;

  beforeEach(() => {
    page = new BlueberryPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
