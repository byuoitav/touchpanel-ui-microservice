class ThemeService {
  constructor() {
    this.localUrl = window.location.protocol + "//" + window.location.host;
    this.camLink = null;
    this.phoneNumber = null;
    this.logo = null;
      }

  async getLogo() {
    try {
      const response = await fetch(`${this.localUrl}/logo`, {
        method: 'GET',
        headers: {
          'Content-Type': 'img/svg+xml'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP status error: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error("Error fetching logo:", error);
      return null;
    }
  }

  async getThemeConfig() {
    try {
      const response = await fetch(`${this.localUrl}/themeconfig`);
      if (!response.ok) {
        throw new Error(`HTTP status error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching theme config:", error);
      return null;
    }
  }

  async fetchTheme() {
    try {
      const data = await this.getThemeConfig();
      console.log("Theme Config:", data);

      if (data && Array.isArray(data) ? data.length !== 0 : data['background-color'] !== undefined) {
        document.documentElement.style.setProperty('--background-color', data['background-color']);
        document.documentElement.style.setProperty('--top-bar-color', data['top-bar-color']);
        document.documentElement.style.setProperty('--background-color-accent', data['background-color-accent']);
        document.documentElement.style.setProperty('--dpad-color', data['dpad-color']);
        document.documentElement.style.setProperty('--dpad-press', data['dpad-press']);
        document.documentElement.style.setProperty('--cam-preset-color', data['cam-preset-color']);
        document.documentElement.style.setProperty('--cam-preset-press', data['cam-preset-press']);
        document.documentElement.style.setProperty('--volume-slider-color', data['volume-slider-color']);
        document.documentElement.style.setProperty('--help-button-color', data['help-button-color']);
        document.documentElement.style.setProperty('--text-color', data['text-color']);
        document.documentElement.style.setProperty('--font-name', data['font-name']);

        // Load font
        const fontUrl = data['font-link'];
        console.log("Font URL:", fontUrl);
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = fontUrl;
        linkElement.onload = () => {
          document.body.style.setProperty('font-family', `${data['font-name']}, sans-serif`);
        };
        document.head.appendChild(linkElement);

        // Show/hide camera text
        if (data['show-cam-text'] === true) {
          console.log("Displaying Camera Text");
          document.documentElement.style.setProperty('--show-cam-text', 'flex');
        } else {
          console.log("Not Displaying Camera Text");
          document.documentElement.style.setProperty('--show-cam-text', 'none');
        }

        // Set camera link and phone number
        this.camLink = data['cam-link'];
        this.phoneNumber = data['phone-number'];

        // get logo
        this.logo = await this.getLogo();          

      } else {
        console.log("Error: No theme configuration received. Using default values.");
      }
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
  }
}