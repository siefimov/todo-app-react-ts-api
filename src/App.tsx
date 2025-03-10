import React, { useEffect, useState } from 'react';
import { UserWarning } from './UserWarning';
import {
  USER_ID,
  addTodo,
  deleteTodo,
  getTodos,
  updateTodo,
} from './api/todos';
import { Todos } from './components/Todos';
import { ErrorNotification } from './components/ErrorNotification';
import { Todo } from './types/Todo';
import { ErrorMessages } from './enums/ErrorMessages.enum';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldFocus, setShouldFocus] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [targetTodoId, setTargetTodoId] = useState<number | null>(null);
  const [togglingTodoIds, setTogglingTodoIds] = useState<number[]>([]);

  const loadTodos = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const todosFromServer = await getTodos();

      setTodos(todosFromServer);
    } catch {
      setErrorMessage(ErrorMessages.UnableToLoadTodos);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, []);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 3000);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [errorMessage]);

  const handleEmptyErrorMessage = () => {
    setErrorMessage(ErrorMessages.TitleShouldNotBeEmpty);
  };

  const handleAddTodo = async (title: string) => {
    const newTempTodo = {
      id: 0,
      userId: USER_ID,
      title,
      completed: false,
    };

    setTempTodo(newTempTodo);
    setIsLoading(true);

    try {
      const newTodo = await addTodo(title);

      setTodos(currentTodos => [...currentTodos, newTodo]);
      setTempTodo(null);
    } catch (error) {
      setErrorMessage(ErrorMessages.UnableToAddTodo);
      setTempTodo(null);
      throw error;
    } finally {
      setIsLoading(false);
      setShouldFocus(true);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    setIsLoading(true);
    setTargetTodoId(id);

    try {
      await deleteTodo(id);
      setTodos(currentTodos => currentTodos.filter(todo => todo.id !== id));

      return true;
    } catch {
      setErrorMessage(ErrorMessages.UnableToDeleteTodo);

      return false;
    } finally {
      setTargetTodoId(null);
      setIsLoading(false);
      setShouldFocus(true);
    }
  };

  const handleClearCompleted = async () => {
    const completedTodos = todos.filter(todo => todo.completed);
    const deletePromises = completedTodos.map(todo => deleteTodo(todo.id));

    setIsLoading(true);
    setShouldFocus(false);

    try {
      const results = await Promise.allSettled(deletePromises);
      const successfulDeletes = results
        .map((result, index) =>
          result.status === 'fulfilled' ? completedTodos[index].id : null,
        )
        .filter(id => id !== null);

      setTodos(currentTodos =>
        currentTodos.filter(todo => !successfulDeletes.includes(todo.id)),
      );

      const hasError = results.some(result => result.status === 'rejected');

      if (hasError) {
        setErrorMessage(ErrorMessages.UnableToDeleteTodo);
      }
    } catch {
      setErrorMessage(ErrorMessages.UnableToDeleteTodo);
    } finally {
      setIsLoading(false);
      setShouldFocus(true);
    }
  };

  const handleToggleOneCompleted = async (todo: Todo) => {
    setIsLoading(true);
    setTargetTodoId(todo.id);

    try {
      const updatedTodo = await updateTodo({
        ...todo,
        completed: !todo.completed,
      });

      setTodos(currentTodos => {
        return currentTodos.map(currentTodo =>
          currentTodo.id === updatedTodo.id ? updatedTodo : currentTodo,
        );
      });
    } catch (error) {
      setErrorMessage(ErrorMessages.UnableToUpdateTodo);
    } finally {
      setIsLoading(false);
      setTargetTodoId(null);
    }
  };

  const handleToggleAllCompleted = async () => {
    const uncompletedTodos = todos.filter(todo => !todo.completed);
    let updatePromises;

    if (uncompletedTodos.length === 0) {
      updatePromises = todos.map(todo => {
        return updateTodo({
          ...todo,
          completed: false,
        });
      });
    } else {
      updatePromises = uncompletedTodos.map(todo => {
        return updateTodo({
          ...todo,
          completed: !todo.completed,
        });
      });
    }

    setIsLoading(true);
    setShouldFocus(false);
    setTogglingTodoIds(uncompletedTodos.map(todo => todo.id));

    try {
      const results = await Promise.allSettled(updatePromises);

      const successfulUpdates = results
        .map((result, index) => {
          if (result.status === 'fulfilled' && uncompletedTodos.length === 0) {
            return todos[index];
          } else if (
            result.status === 'fulfilled' &&
            uncompletedTodos.length !== 0
          ) {
            return uncompletedTodos[index];
          } else {
            return null;
          }
        })
        .filter(todo => todo !== null);

      setTodos(prevTodos =>
        prevTodos.map(todo =>
          successfulUpdates.some(updatedTodo => updatedTodo.id === todo.id)
            ? { ...todo, completed: !todo.completed }
            : todo,
        ),
      );

      const hasError = results.some(result => result.status === 'rejected');

      if (hasError) {
        setErrorMessage(ErrorMessages.UnableToUpdateTodo);
      }
    } catch {
      setErrorMessage(ErrorMessages.UnableToUpdateTodo);
    } finally {
      setIsLoading(false);
      setShouldFocus(true);
      setTogglingTodoIds([]);
    }
  };

  const handleRenameTodo = async (todo: Todo, title: string) => {
    setIsLoading(true);
    setTargetTodoId(todo.id);

    try {
      const renamedTodo = await updateTodo({
        ...todo,
        title,
      });

      setTodos(currentTodos => {
        return currentTodos.map(currntTodo =>
          currntTodo.id === renamedTodo.id ? renamedTodo : currntTodo,
        );
      });

      return true;
    } catch {
      setErrorMessage(ErrorMessages.UnableToUpdateTodo);

      return false;
    } finally {
      setIsLoading(false);
      setTargetTodoId(null);
    }
  };

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <Todos
        todos={todos}
        tempTodo={tempTodo}
        isLoading={isLoading}
        targetTodoId={targetTodoId}
        togglingTodoIds={togglingTodoIds}
        onEmptyTitleError={handleEmptyErrorMessage}
        onAddTodo={handleAddTodo}
        onDelete={handleDeleteTodo}
        onClearCompleted={handleClearCompleted}
        shouldFocus={shouldFocus}
        onToggleOneCompleted={handleToggleOneCompleted}
        onToggleAllCompleted={handleToggleAllCompleted}
        onRenameTodo={handleRenameTodo}
      />

      <ErrorNotification
        errorMessage={errorMessage}
        clearErrorMessage={() => setErrorMessage(null)}
      />
    </div>
  );
};
