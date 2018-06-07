/*
 * Signature for instructions registered to business logic events
 *
 * Instructions are callback functions that optionally accept an array of
 * arguments, and that return true if the instruction is invoked based on its
 * internal conditional checks and the args array passed; otherwise the
 * instruction must return false.
 */
export type BusinessLogicInstruction = (args?: Array<any>) => boolean;
