var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var core_1 = require('@angular/core');
// Set this to true for debugging console output
var debug = false;
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
var BusinessLogicCentralService = (function () {
    function BusinessLogicCentralService() {
        // For use in debugging
        this._name = 'BusinessLogicCentralService';
        this._businessLogicEvents = {};
    }
    /*
     * Register an instruction to run during an Event
     */
    BusinessLogicCentralService.prototype.addInstructionToEvent = function (instruction, eventName) {
        if (debug) {
            console.log(this._name + '.addInstructionToEvent() called with instruction:', instruction, 'and eventName:', eventName);
        }
        if (!this._businessLogicEvents.hasOwnProperty(eventName)) {
            this._initializeEvent(eventName);
        }
        this._businessLogicEvents[eventName].eventInstructions.push(instruction);
        if (debug) {
            console.log(this._name + '._businessLogicEvents after addInstructionToEvent():', this._businessLogicEvents);
        }
    };
    /*
     * Run all instructions registered for an event
     *
     * Instructions are run in the order they were added, until an instruction
     * successfully applies, then the loop stops.
     *
     * Return false if no matching rule found, otherwise return true
     */
    BusinessLogicCentralService.prototype.executeInstructionsForEvent = function (event) {
        if (debug) {
            console.log(this._name + ' executing event:', event.eventName);
        }
        // Return false if there's no matching event
        if (!this._businessLogicEvents.hasOwnProperty(event.eventName)) {
            if (debug) {
                console.log(this._name + ' instructed to execute event ' + event.eventName + ', but no matching event has been registered.');
            }
            return false;
        }
        // Return false if there are no rules matching for the event
        if (this._businessLogicEvents[event].eventInstructions.length === 0) {
            if (debug) {
                console.log(this._name + ' executed event ' + event.eventName + ' but there are no BusinessLogicInstructions registered to it.');
            }
            return false;
        }
        // loop over callback rules, stopping as soon as one returns true
        var instructions;
        instructions = this._businessLogicEvents[event.eventName].eventInstructions;
        for (var _i = 0; _i < instructions.length; _i++) {
            var instruction = instructions[_i];
            var outcome = void 0;
            // @TODO test possible failure states with BusinessLogicInstruction's optional `args?` param
            outcome = instruction(event.eventParameters);
            // Stop if an instruction's conditionals were met and it was applied
            if (outcome) {
                break;
            }
        }
        // Indicate BusinessLogicInstructions were processed
        return true;
    };
    /*
     * Prepare private data for an event
     *
     * This is needed before registering instruction for the event.
     */
    BusinessLogicCentralService.prototype._initializeEvent = function (eventName) {
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
    };
    BusinessLogicCentralService = __decorate([
        core_1.Injectable({
            providedIn: 'BusinessLogicCentralModule'
        })
    ], BusinessLogicCentralService);
    return BusinessLogicCentralService;
})();
exports.BusinessLogicCentralService = BusinessLogicCentralService;
