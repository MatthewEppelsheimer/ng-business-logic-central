import { BusinessLogicInstruction } from './business-logic-instruction.type';

/*
 * Describe the structure of an event managed by BusinessLogicService
 */
export interface BusinessLogicEvent {
	// Unique event identification string
	eventName: string;

	// Parameters passed by the event to instruction callbacks registered
	// to the event
	eventParameters?: Array<any>;

	// Instruction callbacks registered to the event
	eventInstructions?: Array<BusinessLogicInstruction>;
}
