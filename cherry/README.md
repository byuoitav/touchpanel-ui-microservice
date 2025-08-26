# Cherry Docs
Documentation for the Cherry user interface detailing the structure and components of the UI.

## Structure
The central structure of the Cherry UI is built around the window object. Classes and Objects are attached to the window object to provide global access across the application. 

```
window
├── APIService: APIService {}
├── CommandService: CommandService {}
├── DataService: DataService {}
├── SocketService: {}
├── VolumeSlider: class VolumeSlider
├── StreamInputsModal: class StreamInputsModal
└── components
    ├── audioControl
    ├── cameraControl
    ├── display
    └── startingScreen
```

Example: 
If one wanted to retrieve the hostname in the DataService, one could use:
```javascript
const hostname = window.APIService.piHostname.toLowerCase();
```

## Components
Components are the building blocks of the Cherry UI. Each component is responsible for a specific part of the user interface. They are loaded using the `loadComponent(componentName, targetDiv)` function in `script.js`, which dynamically adds the component and its associated JS/CSS files to the page.

New components can be added by creating a new directory `componentName` under `cherry/components/` and defining the HTML, CSS, and JavaScript files for the component. The respective files should follow the naming convention of `componentName.html`, `componentName.css`, and `componentName.js`.

## Services
The services are found in the /services directory 

### APIService
The `APIService` is responsible for handling API requests to the backend. It gets things like the UIConfig, hostname, and other config data.

### DataService
The `DataService` manages the application's data state. It provides methods to retrieve and update data, ensuring that the UI reflects the current state of the application.

### CommandService
The `CommandService` generates and sends commands to the AV API (localhost:8000) for controlling devices. It handles the logic for constructing commands based on user interactions and API responses.

### Navigation
The navigation service controls the navigation between the three main components of the UI: `display`, `audioControl`, and `cameraControl`. It provides methods to switch between these components and update the UI accordingly. It handles the touch gestures that allow users to swipe between components.

### SocketService
The `SocketService` manages WebSocket connections for real-time communication with the backend. It listens for events and updates the UI based on incoming messages (refresh, input changes, etc.).

### status.objects.js and objects.js
Just a bunch of objects for storing the various device types and their properties and states.

### ThemeService
The `ThemeService` gets the theme from couch and applies it to the UI.

## Startup Process
The start process consists of the following steps:
1. The ThemeService is initialized to get the theme from couch and apply it to the UI.
2. The start screen component appears
3. When the start screen is clicked, the ThemeService is reloaded, the SocketService starts, and the APIService is initialized.
4. The APIService retrieves the UIConfig and other necessary data, when it is done, the CommandService and the DataService start to initialize
5. The DataService checks if there is a divider sensor and retrieves the current preset. The preset is used to determine what appears on the UI.
6. The UI controls appear ready for user interaction