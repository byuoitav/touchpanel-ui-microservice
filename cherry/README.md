# Cherry

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.7.3.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files. The base href needs to be changed in `src/index.html` from \<base href="/cherry/"\> to \<base href="./"\> in order to work on the dev server. 

Additionally every appearance of `window.location.protocol + "//" + window.location.host;` needs to be changed in `src/app/services/api.service.ts` and `socket.service.ts` to point to your locally hosted mocks of the API microservice and the backend.

Example:

`APIService.localurl = window.location.protocol + "//" + window.location.host;` 

⬇️ 

`APIService.localurl = window.location.protocol + "//localhost:8888";`


## Testing
### Unit Testing
Unit Testing is done using Jest. The tests are in files  ending with `.spec.ts`. 
such as `services.spec.ts`

Run `npm run test` to run all test suites in Jest

Specific test suites can be run by passing the path to the test file as an argument to the test command. For example, to run the test suite for the service classes, run `npm run test src/app/services`


### E2E Testing
End-to-end testing is done using Cypress. The tests are in cypress/e2e/spec.cy.ts

In one terminal run `ng serve` to run a dev server on localhost:4200 (see `Development Server` section above :arrow_up: if the app does not load)

In a second terminal run `npx cypress open` then click the following: `E2E Testing` > `Start E2E Testing in Chrome` > `spec.cy.ts`

![e2e](https://github.com/byuoitav/touchpanel-ui-microservice/assets/13169205/cc613954-5c09-4195-b0bd-1d45034c4072)

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.
