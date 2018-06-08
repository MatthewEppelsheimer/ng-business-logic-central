# Business Logic Central

A system for managing event-driven conditional business logic within an Angular application.

**Requires Angular 6.0.0 or later.**

## What It Does ##

This library supports creating "Business Logic Instructions" that drive changes if custom application state conditions are met, registering them to events, and triggering events when appropriate. Instructions are supplied by you and can have completely custom conditionals, directives, and whatever behavior you'd like. It is very flexible. 

Think of Business Logic Instructions as something that might apply when a specific event happens, depending on application state. You can handle different state scenarios for a given event by registering multiple instructions to it.

Business Logic Instructions' conditionals are intended to be mutually-exclusive, so that if one Instruction applies, no other Instruction should apply. Instructions registered to events are processed in priority order, so the first instruction registered will be considered before the second, and so on. Whenever an Instruction's conditionals are truthy and it executes, all lower-priority instructions registered to the event are ignored.

### Example Use Case ###

Here is an example to illustrate how this system can be used to implement complex and interrelated business requirements by specifying conditional/action pairs and prioritizing them for a given event.

Let's say our application is routing to a specific application page X. If the user has been logged in for 14 days, then we should log them out and reload (because someone from the legal or product team really wanted this). Otherwise, if the user is logged-out, then they should be redirected to a logged-out page Y (to sign-in). Otherwise, if this is a first-time login, then we should display an onboarding experience. Otherwise, do nothing besides load the page. 

In this example, "Route to page X" is the event, with three instructions registered: 

1. "if the user has been logged in for 14 days then log them out and reload"
2. "if the user is logged-out, redirect to a logged-out page Y (to sign-in)"
3. "if this is a first-time login then display an onboarding experience". 

Say a user has been logged in for 3 weeks and revisits the application. Because Instruction 1 is registered to the event first, its conditional ("if the user has been logged in for 14 days") will be checked first and will be truthy, so "log them out and reload" will execute. When the application reloads, the user will no longer be logged in, so this Instruction will be skipped, but the second Instruction ("if logged-out, redirect to logged-out page") will apply. Since an Instuction has applied, no further instructions are considered.

Say instead that a user has been logged in for 2 days. The first two Instructions won't apply, and neither will the third because they've previously logged in. In this case, no Nnstructions apply. So our application just shows them the view they've routed to.

## What's Included ##

1. `BussinessLogicCentralModule` is this module. Include it in your Angular application to use its functionality.
2. `BusinessLogicInstruction` is a TypeScript `type` you should use to type the custom business logic instructions you write as functions or methods.
3. `BusinessLogicCentralService` is an injectable Angular service. Interact with this to register instructions to specific events, and to trigger events.

The module also uses defines the `BusinessLogicEvent` TypeScript `interface` for internal use, to keep track of event/instruction registrations. The module doesn't export this as it is intended for internal private use, so it won't be available in your application.

## How to Use ##

### Including in your application ###

1. Include this module in your Angular 6.x or later project with `npm install --save 'ng-business-logic-central'`.
2. Where needed in your application's code, import the following from the module:

```typescript
import {
	BusinessLogicInstruction,
	BusinessLogicCentralService
} from 'business-logic-central';
```

### Create Business Logic Instructions ###

Your Business Logic Instructions must be functions (or object methods on a service) that match the shape of the `BusinessLogicInstruction` type: `(args?: Array<any?>) => boolean`. 

Here's an example of an instruction in a `my-business-logic-instructions.ts` file:

```typescript
import { BusinessLogicInstruction } from 'business-logic-central'

/*
This BusienssLogicInstruction implements the business requirement
"if logged in 14 days or more, log out and redirect". 

This particular example doesn't accept any args.
*/

// Your instruction must conform to the shape of the BusinessLogicInstruction 
// type. Being explicit like this gives your the benefit of type checking at 
// compile time.
export let logOutIfLoggedInFourteenDays: BusinessLogicInstruction;

logOutIfLoggedInFourteenDays = function(): boolean {	
	if ( 13 < getDaysUserLoggedIn() ) {
		logUserOut();
		redirectTo('loggedOutRoute');
		
		// Whenever a BusinessLogicInstruction DOES apply, you must ALWAYS return
		// TRUE. This tells BusinessLogicCentralService to stop applying any
		// additional Instructions registered for an event.
		return true;
	}
	
	// Whenever a BusinessLogicInstruction does NOT apply,
	// you must ALWAYS return FALSE
	return false;
}

```
Register the instruction for an event from within one of your services, using dependency injection to get access to `BusinessLogicCentralService`

```typescript
import { Injectable } from '@angular/core';
import { BusinessLogicCentralService } from 'business-logic-central';
import {
	logOutIfLoggedInFourteenDays,
	redirectIfLoggedOut,
} from './my-business-logic-instructions';

@Injectable()
export class MyCustomLogicService {

	// Inject BusinessLogicCentralService for local use
	constructor( businessLogicCentral: BusinessLogicCentralService ) {
		this.businessLogicCentral.addInstructionToEvent(
			logOutIfLoggedInFourteenDays, // a custom Instruction
			'routeToPageX' // your custom event name
		);
		
		// Remember that the order Instructions are added to events is important!
		// When processing events, Instructions are executed sequentially in the
		// order they were registered, and processing ceases as soon as an
		// Instruction applies.
		this.businessLogicCentral.addInstructionToEvent(
			redirectIfLoggedOut, // a custom Instruction
			'routeToPageX' // your custom event name
		);		
	}
}
```

Trigger events by calling `BusinessLogicCentralService`'s `doEvent(event)` method. Events don't need to be declared ahead of time; they will be initialized by this service the first time an instruction is registered to an event.

This example triggers event `routeToPageX` from within an Angular `CanActivate` route guard, which is used in a `canActivate:` rule for "page X" in your router configuration.

```typescript
import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';

import { BusinessLogicCentralService { from 'business-logic-central';

@Injectable()
export class PageXGuard implements CanActivate {
	// Inject BusinessLogicCentralService for local use
	constructor( businessLogicCentral: BusinessLogicCentralService ) {}

	canActivate() {
		// HERE IS WHERE WE FIRE THE CUSTOM EVENT. This tells
		// BusinessLogicCentralService to do the work of calling instructions you've
		// registered above to this event.
		this.businessLogicCentral.doEvent('routeToPageX');

		return true; // (part of CanActivate interface implementation)
  }
}

```

## Roadmap ##

Nice-to-have features:

- Add test coverage!
- Maybe support Angular `4.x` and later, instead of `6.x` and later?
	- Upgrading from `4.x` to `6.x` isn't terribly onerous in most cases, so I'll only work on this if I get requests for it.
- Support instructions that **aren't** mutually-exclusive — i.e. always return `false`
	-  This may only require a docs/language change.

## Maintenance ##

### Build ###

Run `ng build business-logic-central --prod` to build the library. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

### Publish updates to NPM ###

```bash
# manually increment version in package.json
# avoid git tags since we're publishing from `dist/` later
npm --no-git-tag-version -f version [major|minor|patch]

# build
ng build business-logic-central --prod

# switch to built package
cd dist/ng-business-logic-central/

# publish update npm
npm publish
```

### Run tests ###

**There currently are no tests!**

- Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).
- Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
