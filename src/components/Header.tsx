import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { Todo } from '../types/Todo';

type Props = {
  todos: Todo[];
  hasAllTodosCompleted: boolean;
  isLoading: boolean;
  shouldFocus: boolean;
  onEmptyTitleError: () => void;
  onAddTodo: (title: string) => void;
  onToggleAllCompleted: () => void;
};

export const Header: React.FC<Props> = ({
  todos,
  hasAllTodosCompleted,
  isLoading,
  shouldFocus,
  onEmptyTitleError,
  onAddTodo,
  onToggleAllCompleted,
}) => {
  const [title, setTitle] = useState('');

  const field = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim() === '') {
      onEmptyTitleError();

      return;
    }

    try {
      await onAddTodo(title.trim());
      setTitle('');
    } catch (error) {}
  };

  useEffect(() => {
    if (!isLoading && shouldFocus) {
      field.current?.focus();
    }
  }, [isLoading, shouldFocus]);

  return (
    <header className="todoapp__header">
      {isLoading || todos.length === 0 ? null : (
        <button
          type="button"
          className={classNames('todoapp__toggle-all', {
            active: hasAllTodosCompleted,
          })}
          data-cy="ToggleAllButton"
          onClick={onToggleAllCompleted}
        />
      )}

      <form onSubmit={handleSubmit}>
        <input
          data-cy="NewTodoField"
          type="text"
          className="todoapp__new-todo"
          placeholder="What needs to be done?"
          ref={field}
          value={title}
          onChange={e => setTitle(e.target.value)}
          disabled={isLoading}
        />
      </form>
    </header>
  );
};
