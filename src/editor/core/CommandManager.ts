/**
 * CommandManager
 * 
 * Manages command execution, undo/redo stack, and history persistence.
 * Implements the Command pattern for non-destructive editing.
 */

import type { Command } from '../types';

/**
 * Batch command that groups multiple commands into a single undo/redo operation
 */
class BatchCommand implements Command {
  id: string;
  type = 'batch';
  timestamp: number;
  private commands: Command[] = [];
  private name: string;

  constructor(name: string) {
    this.id = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.timestamp = Date.now();
    this.name = name;
  }

  addCommand(command: Command): void {
    this.commands.push(command);
  }

  execute(): void {
    this.commands.forEach(cmd => cmd.execute());
  }

  undo(): void {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }

  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      timestamp: this.timestamp,
      commands: this.commands.map(cmd => cmd.serialize()),
    };
  }

  getCommands(): Command[] {
    return this.commands;
  }
}

/**
 * CommandManager manages the execution and history of commands
 */
export class CommandManager {
  private history: Command[] = [];
  private currentIndex = -1;
  private maxHistorySize: number;
  private batchStack: BatchCommand[] = [];

  constructor(maxHistorySize = 50) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Execute a command and add it to history
   */
  execute(command: Command): void {
    // If we're in a batch, add to the batch instead
    if (this.batchStack.length > 0) {
      const currentBatch = this.batchStack[this.batchStack.length - 1];
      currentBatch.addCommand(command);
      command.execute();
      return;
    }

    // Execute the command
    command.execute();

    // Remove any commands after current index (clear redo stack)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add command to history
    this.history.push(command);
    this.currentIndex++;

    // Enforce history size limit
    if (this.history.length > this.maxHistorySize) {
      const removeCount = this.history.length - this.maxHistorySize;
      this.history.splice(0, removeCount);
      this.currentIndex -= removeCount;
    }
  }

  /**
   * Undo the last command
   */
  undo(): void {
    if (!this.canUndo()) {
      return;
    }

    const command = this.history[this.currentIndex];
    command.undo();
    this.currentIndex--;
  }

  /**
   * Redo the next command
   */
  redo(): void {
    if (!this.canRedo()) {
      return;
    }

    this.currentIndex++;
    const command = this.history[this.currentIndex];
    command.execute();
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Begin a batch of commands
   */
  beginBatch(name: string): void {
    const batch = new BatchCommand(name);
    this.batchStack.push(batch);
  }

  /**
   * End the current batch and add it to history
   */
  endBatch(): void {
    const batch = this.batchStack.pop();
    
    if (!batch) {
      console.warn('endBatch called without matching beginBatch');
      return;
    }

    // If there's a parent batch, add this batch's commands to it
    if (this.batchStack.length > 0) {
      const parentBatch = this.batchStack[this.batchStack.length - 1];
      batch.getCommands().forEach(cmd => parentBatch.addCommand(cmd));
      return;
    }

    // Only add to history if batch has commands
    if (batch.getCommands().length > 0) {
      // Remove any commands after current index (clear redo stack)
      this.history = this.history.slice(0, this.currentIndex + 1);
      
      // Add batch to history
      this.history.push(batch);
      this.currentIndex++;

      // Enforce history size limit
      if (this.history.length > this.maxHistorySize) {
        const removeCount = this.history.length - this.maxHistorySize;
        this.history.splice(0, removeCount);
        this.currentIndex -= removeCount;
      }
    }
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
    this.batchStack = [];
  }

  /**
   * Get the current history
   */
  getHistory(): Command[] {
    return [...this.history];
  }

  /**
   * Get the current index in history
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Get a specific command from history
   */
  getCommand(index: number): Command | undefined {
    return this.history[index];
  }

  /**
   * Serialize history for persistence
   */
  serializeHistory(): Record<string, unknown>[] {
    return this.history.map(cmd => cmd.serialize());
  }
}

