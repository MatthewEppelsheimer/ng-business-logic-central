import { Injectable } from '@angular/core';

import { BusinessLogicCentralModule } from './business-logic-central.module';
import { BusinessLogicEvent } from './business-logic-event.interface';
import { BusinessLogicInstruction } from './business-logic-instruction.type';

// Set this to true for debugging console output
const debug = false;

/*
 * This is a system for managing conditional business logic by (1) registering
 * condition-based callbacks called "instructions" for specific events, and
 * (2) triggering those events.
 *
 * Think of conditional instructions as something that might apply when a
 * specific event happens, depending on application state. You can handle
 * different state scenarios for a given event by registering multiple
 * instructions to it. For example, when attempting to navigate to a particular
 * route, you might need to redirect to a signin route if the user is logged
 * out (instruction #1), or else redirect them to an onboarding form if this is
 * their first login (instruction #2), or else do nothing (and let routing
 * continue).
 *
 * Clients of this service can implement their own instructions as functions or
 * methods that implement the BusinessLogicInstruction interface. Then, clients
 * register an instruction by calling
 * `addInstructionToEvent(instruction,eventName)`, where eventName is a unique
 * string.
 *
 * Clients can then trigger events by calling
 * `executeInstructionsForEvent(event)`. Events don't need to be declared
 * ahead of time; they will be initialized by this service the first time an
 * instruction is registered to an event.
 *
 * The order instructions are registered is important! During execution of
 * instructions for an event, registered instruction callbacks are executed
 * sequentially in the order they were registered to the event. Instruction
 * callback execution ceases as soon as an instruction returns `true`,
 * indicating that its conditional checks passed, and it was successfully
 * applied. This allows prioritizing multiple instructions with different
 * conditionals, so when an event fires, the highest priority instruction whose
 * conditionals are truthy will run, and all other instructions will be ignored.
 */
@Injectable({
	providedIn: 'root',
})
export class BusinessLogicCentralService {
	// Private storage of event and instruction relationships
	private _businessLogicEvents: {[x: string]: BusinessLogicEvent};

	// For use in debugging
	private _name = 'BusinessLogicCentralService';

	constructor() {
		this._businessLogicEvents = {};
	}

	/*
	 * Register an instruction to run during an Event
	 */
	public addInstructionToEvent(
		instruction: BusinessLogicInstruction,
		eventName: string
	): void {
		if (debug) {
			console.log(this._name + '.addInstructionToEvent() called with instruction:', instruction, 'and eventName:', eventName );
		}

		if (! this._businessLogicEvents.hasOwnProperty(eventName)) {
			this._initializeEvent(eventName);
		}

		this._businessLogicEvents[eventName].eventInstructions.push(instruction);

		if (debug) {
			console.log(this._name + '._businessLogicEvents after addInstructionToEvent():', this._businessLogicEvents);
		}
	}

	/*
	 * Run all instructions registered for an event
	 *
	 * Instructions are run in the order they were added, until an instruction
	 * successfully applies, then the loop stops.
	 *
	 * Return false if no matching rule found, otherwise return true
	 */
	public doEvent(
		event: BusinessLogicEvent
	): boolean {
		if (debug) {
			console.log(this._name + ' executing event:', event.eventName);
		}

		// Return false if there's no matching event
		if (! this._businessLogicEvents.hasOwnProperty(event.eventName)) {
			if (debug) {
				console.log(this._name + ' instructed to execute event ' + event.eventName + ', but no matching event has been registered.');
			}
			return false;
		}

		// Return false if there are no rules matching for the event
		if (this._businessLogicEvents[event.eventName].eventInstructions.length === 0) {
			if (debug) {
				console.log(this._name + ' executed event ' + event.eventName + ' but there are no BusinessLogicInstructions registered to it.');
			}

			return false;
		}

		// loop over callback rules, stopping as soon as one returns true
		let instructions: Array<BusinessLogicInstruction>;
		instructions = this._businessLogicEvents[event.eventName].eventInstructions;
		for (const instruction of instructions ) {
			let outcome: boolean;
			// @TODO test possible failure states with BusinessLogicInstruction's optional `args?` param
			outcome = instruction(event.eventParameters);

			// Stop if an instruction's conditionals were met and it was applied
			if (outcome) {
				break;
			}
			// Otherwise continue looping over instructions in order
		}

		// Indicate BusinessLogicInstructions were processed
		return true;
	}

	/*
	 * Prepare private data for an event
	 *
	 * This is needed before registering instruction for the event.
	 */
	private _initializeEvent(eventName: string): void {
		// Bail out if the event is already initialized
		if (this._businessLogicEvents.hasOwnProperty(eventName)) {
			return;
		}

		Object.defineProperty(this._businessLogicEvents, eventName, {
			// value matches the shape of BusinessLogicEvent
			value: {
				eventName: eventName,
				eventInstructions: []
			},
			writable: true,
			enumerable: true,
			configurable: true
		});
	}
}
