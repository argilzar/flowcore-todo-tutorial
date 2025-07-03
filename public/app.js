class TodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.editingTodoId = null;
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadTodos();
    }

    bindEvents() {
        // Add todo form
        const addForm = document.getElementById('addTodoForm');
        addForm.addEventListener('submit', (e) => this.handleAddTodo(e));

        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterChange(e));
        });
    }

    async loadTodos() {
        try {
            this.showLoading();
            const response = await fetch('/api/todos');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.todos = await response.json();
            this.renderTodos();
            this.updateStats();
            this.hideConnectionError();
        } catch (error) {
            console.error('Error loading todos:', error);
            this.showConnectionError();
        }
    }

    async handleAddTodo(e) {
        e.preventDefault();
        
        const titleInput = document.getElementById('todoTitle');
        const descriptionInput = document.getElementById('todoDescription');
        
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        
        if (!title) {
            this.showError('Please enter a title for your todo.');
            return;
        }

        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, description })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create todo');
            }

            // Clear the form
            titleInput.value = '';
            descriptionInput.value = '';
            
            // Reload todos to get the updated list
            await this.loadTodos();
            
            this.showSuccess('Todo added successfully!');
        } catch (error) {
            console.error('Error adding todo:', error);
            this.showError(`Failed to add todo: ${error.message}`);
        }
    }

    async toggleTodoStatus(id, currentStatus) {
        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ done: !currentStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update todo');
            }

            await this.loadTodos();
        } catch (error) {
            console.error('Error updating todo:', error);
            this.showError('Failed to update todo. Please try again.');
        }
    }

    async deleteTodo(id) {
        if (!confirm('Are you sure you want to delete this todo?')) {
            return;
        }

        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete todo');
            }

            await this.loadTodos();
            this.showSuccess('Todo deleted successfully!');
        } catch (error) {
            console.error('Error deleting todo:', error);
            this.showError('Failed to delete todo. Please try again.');
        }
    }

    async handleEditTodo(id) {
        if (this.editingTodoId === id) {
            // Cancel editing
            this.editingTodoId = null;
            this.renderTodos();
            return;
        }

        this.editingTodoId = id;
        this.renderTodos();
    }

    async saveEditedTodo(id, newTitle) {
        if (!newTitle.trim()) {
            this.showError('Please enter a valid title.');
            return;
        }

        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: newTitle.trim() })
            });

            if (!response.ok) {
                throw new Error('Failed to update todo');
            }

            this.editingTodoId = null;
            await this.loadTodos();
            this.showSuccess('Todo updated successfully!');
        } catch (error) {
            console.error('Error updating todo:', error);
            this.showError('Failed to update todo. Please try again.');
        }
    }

    handleFilterChange(e) {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => btn.classList.remove('active'));
        
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.renderTodos();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'completed':
                return this.todos.filter(todo => todo.done);
            case 'pending':
                return this.todos.filter(todo => !todo.done);
            default:
                return this.todos;
        }
    }

    renderTodos() {
        const container = document.getElementById('todosContainer');
        const emptyState = document.getElementById('emptyState');
        const filteredTodos = this.getFilteredTodos();

        if (filteredTodos.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        
        container.innerHTML = filteredTodos.map(todo => {
            const isEditing = this.editingTodoId === todo.id;
            
            return `
                <div class="todo-item ${todo.done ? 'completed' : ''}">
                    <div class="todo-header">
                        <div class="todo-content">
                            ${isEditing ? this.renderEditForm(todo) : this.renderTodoContent(todo)}
                        </div>
                        <div class="todo-actions">
                            ${this.renderTodoActions(todo, isEditing)}
                        </div>
                    </div>
                    <div class="todo-meta">
                        <span class="todo-status ${todo.done ? 'completed' : 'pending'}">
                            ${todo.done ? '✅ Completed' : '⏳ Pending'}
                        </span>
                    </div>
                </div>
            `;
        }).join('');

        // Bind events for the newly rendered todos
        this.bindTodoEvents();
    }

    renderTodoContent(todo) {
        return `
            <h3 class="todo-title">${this.escapeHtml(todo.title)}</h3>
            ${todo.description ? `<p class="todo-description">${this.escapeHtml(todo.description)}</p>` : ''}
        `;
    }

    renderEditForm(todo) {
        return `
            <div class="edit-form">
                <div class="form-group">
                    <input type="text" class="edit-input" value="${this.escapeHtml(todo.title)}" data-id="${todo.id}" placeholder="Enter new title...">
                </div>
                <div class="edit-actions">
                    <button class="btn btn-success btn-small save-btn" data-id="${todo.id}">
                        <span class="btn-icon">💾</span>
                        Save
                    </button>
                    <button class="btn btn-secondary btn-small cancel-btn" data-id="${todo.id}">
                        <span class="btn-icon">❌</span>
                        Cancel
                    </button>
                </div>
            </div>
        `;
    }

    renderTodoActions(todo, isEditing) {
        if (isEditing) {
            return '';
        }

        return `
            <button class="btn btn-${todo.done ? 'secondary' : 'success'} btn-small toggle-btn" data-id="${todo.id}" data-done="${todo.done}">
                <span class="btn-icon">${todo.done ? '↩️' : '✅'}</span>
                ${todo.done ? 'Reopen' : 'Complete'}
            </button>
            <button class="btn btn-secondary btn-small edit-btn" data-id="${todo.id}">
                <span class="btn-icon">✏️</span>
                Edit
            </button>
            <button class="btn btn-danger btn-small delete-btn" data-id="${todo.id}">
                <span class="btn-icon">🗑️</span>
                Delete
            </button>
        `;
    }

    bindTodoEvents() {
        // Toggle status buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const done = e.currentTarget.dataset.done === 'true';
                this.toggleTodoStatus(id, done);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.deleteTodo(id);
            });
        });

        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.handleEditTodo(id);
            });
        });

        // Save edit buttons
        document.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const input = document.querySelector(`.edit-input[data-id="${id}"]`);
                this.saveEditedTodo(id, input.value);
            });
        });

        // Cancel edit buttons
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.handleEditTodo(id);
            });
        });

        // Enter key in edit inputs
        document.querySelectorAll('.edit-input').forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const id = e.currentTarget.dataset.id;
                    this.saveEditedTodo(id, e.currentTarget.value);
                } else if (e.key === 'Escape') {
                    const id = e.currentTarget.dataset.id;
                    this.handleEditTodo(id);
                }
            });
        });
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.done).length;
        const pending = total - completed;

        document.getElementById('totalCount').textContent = `Total: ${total}`;
        document.getElementById('completedCount').textContent = `Completed: ${completed}`;
        document.getElementById('pendingCount').textContent = `Pending: ${pending}`;
    }

    showLoading() {
        const container = document.getElementById('todosContainer');
        container.innerHTML = '<div class="loading">Loading todos...</div>';
    }

    showConnectionError() {
        const container = document.getElementById('todosContainer');
        const emptyState = document.getElementById('emptyState');
        const connectionError = document.getElementById('connectionError');
        
        container.innerHTML = '';
        emptyState.style.display = 'none';
        connectionError.style.display = 'block';
    }

    hideConnectionError() {
        const connectionError = document.getElementById('connectionError');
        connectionError.style.display = 'none';
    }

    showError(message) {
        // Simple error display - you could enhance this with a toast notification
        alert(`Error: ${message}`);
    }

    showSuccess(message) {
        // Simple success display - you could enhance this with a toast notification
        console.log(`Success: ${message}`);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});