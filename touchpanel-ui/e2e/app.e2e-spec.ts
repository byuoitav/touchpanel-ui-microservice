import { TouchpanelUiPage } from './app.po';

describe('touchpanel-ui App', () => {
  let page: TouchpanelUiPage;

  beforeEach(() => {
    page = new TouchpanelUiPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
