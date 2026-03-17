/**
 * CommandManager Tests
 * 
 * Tests for the command pattern implementation with undo/redo functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandManager } from './CommandManager';
import type { Command } from '../types';

// Mock command for testing
class MockCommand implements Command {
  id: string;
  type: string;
  timestamp: number;
  executed = false;
  undone = false;

  constructor(id: string, type: string = 'mock') {
    this.id = id;
    this.type = type;
    this.timestamp = Date.now();
  }

  execute(): void {
    this.executed = true;
    this.undone = false;
  }

  undo(): void {
    this.undone = true;
    this.executed = false;
  }

  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      timestamp: this.timestamp,
    };
  }
}

describe('CommandManager', () => {
  let manager: CommandManager;

  beforeEach(() => {
    manager = new CommandManager();
  });

  describe('execute', () => {
    it('should execute a command', () => {
      const cmd = new MockCommand('cmd1');
      manager.execute(cmd);

      expect(cmd.executed).toBe(true);
      expect(manager.canUndo()).toBe(true);
      expect(manager.canRedo()).toBe(false);
    });

    it('should add command to history', () => {
      const cmd = new MockCommand('cmd1');
      manager.execute(cmd);

      const history = manager.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('cmd1');
    });

    it('should clear redo stack when executing new command', () => {
      const cmd1 = new MockCommand('cmd1');
      const cmd2 = new MockCommand('cmd2');
      const cmd3 = new MockCommand('cmd3');

      manager.execute(cmd1);
      manager.execute(cmd2);
      manager.undo();
      
      expect(manager.canRedo()).toBe(true);
      
      manager.execute(cmd3);
      
      expect(manager.canRedo()).toBe(false);
      expect(manager.getHistory()).toHaveLength(2);
    });
  });

  describe('undo', () => {
    it('should undo the last command', () => {
      const cmd = new MockCommand('cmd1');
      manager.execute(cmd);
      manager.undo();

      expect(cmd.undone).toBe(true);
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(true);
    });

    it('should not undo when history is empty', () => {
      expect(manager.canUndo()).toBe(false);
      expect(() => manager.undo()).not.toThrow();
    });

    it('should undo multiple commands in reverse order', () => {
      const cmd1 = new MockCommand('cmd1');
      const cmd2 = new MockCommand('cmd2');
      const cmd3 = new MockCommand('cmd3');

      manager.execute(cmd1);
      manager.execute(cmd2);
      manager.execute(cmd3);

      manager.undo();
      expect(cmd3.undone).toBe(true);
      expect(cmd2.undone).toBe(false);

      manager.undo();
      expect(cmd2.undone).toBe(true);
      expect(cmd1.undone).toBe(false);

      manager.undo();
      expect(cmd1.undone).toBe(true);
    });
  });

  describe('redo', () => {
    it('should redo an undone command', () => {
      const cmd = new MockCommand('cmd1');
      manager.execute(cmd);
      manager.undo();
      manager.redo();

      expect(cmd.executed).toBe(true);
      expect(manager.canRedo()).toBe(false);
      expect(manager.canUndo()).toBe(true);
    });

    it('should not redo when redo stack is empty', () => {
      expect(manager.canRedo()).toBe(false);
      expect(() => manager.redo()).not.toThrow();
    });

    it('should redo multiple commands in order', () => {
      const cmd1 = new MockCommand('cmd1');
      const cmd2 = new MockCommand('cmd2');

      manager.execute(cmd1);
      manager.execute(cmd2);
      manager.undo();
      manager.undo();

      manager.redo();
      expect(cmd1.executed).toBe(true);
      expect(cmd2.executed).toBe(false);

      manager.redo();
      expect(cmd2.executed).toBe(true);
    });
  });

  describe('history limits', () => {
    it('should limit history to maxHistorySize', () => {
      const maxSize = 50;
      const manager = new CommandManager(maxSize);

      // Execute more commands than the limit
      for (let i = 0; i < maxSize + 10; i++) {
        manager.execute(new MockCommand(`cmd${i}`));
      }

      const history = manager.getHistory();
      expect(history.length).toBeLessThanOrEqual(maxSize);

      // Should keep the most recent commands
      expect(history[history.length - 1].id).toBe(`cmd${maxSize + 9}`);
    });
  });

  describe('batch commands', () => {
    it('should batch multiple commands into one undo/redo operation', () => {
      const cmd1 = new MockCommand('cmd1');
      const cmd2 = new MockCommand('cmd2');
      const cmd3 = new MockCommand('cmd3');

      manager.beginBatch('Batch Operation');
      manager.execute(cmd1);
      manager.execute(cmd2);
      manager.execute(cmd3);
      manager.endBatch();

      expect(manager.getHistory()).toHaveLength(1);
      expect(manager.getHistory()[0].type).toBe('batch');

      manager.undo();
      expect(cmd1.undone).toBe(true);
      expect(cmd2.undone).toBe(true);
      expect(cmd3.undone).toBe(true);

      manager.redo();
      expect(cmd1.executed).toBe(true);
      expect(cmd2.executed).toBe(true);
      expect(cmd3.executed).toBe(true);
    });

    it('should handle nested batches by flattening', () => {
      const cmd1 = new MockCommand('cmd1');
      const cmd2 = new MockCommand('cmd2');

      manager.beginBatch('Outer');
      manager.execute(cmd1);
      manager.beginBatch('Inner');
      manager.execute(cmd2);
      manager.endBatch();
      manager.endBatch();

      expect(manager.getHistory()).toHaveLength(1);
    });
  });

  describe('clear', () => {
    it('should clear all history', () => {
      manager.execute(new MockCommand('cmd1'));
      manager.execute(new MockCommand('cmd2'));
      manager.undo();

      manager.clear();

      expect(manager.getHistory()).toHaveLength(0);
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
    });
  });

  describe('getCurrentIndex', () => {
    it('should return current position in history', () => {
      expect(manager.getCurrentIndex()).toBe(-1);

      manager.execute(new MockCommand('cmd1'));
      expect(manager.getCurrentIndex()).toBe(0);

      manager.execute(new MockCommand('cmd2'));
      expect(manager.getCurrentIndex()).toBe(1);

      manager.undo();
      expect(manager.getCurrentIndex()).toBe(0);

      manager.redo();
      expect(manager.getCurrentIndex()).toBe(1);
    });
  });
});

