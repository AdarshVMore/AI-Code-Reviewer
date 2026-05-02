[
  {
    "path": "/tmp/AdarshVMore-Kanaban-board-task-cliperact-extracted/AdarshVMore-Kanaban-board-task-cliperact-76ccc3d/client/src/App.jsx",
    "content": "import { useState, useEffect, useRef } from 'react'\n" +
      "import Column from './components/Column'\n" +
      "import AddTaskModal from './components/AddTaskModal'\n" +
      "import './App.css'\n" +
      '\n' +
      'function App() {\n' +
      '  const [tasks, setTasks] = useState([])\n' +
      '  const [loading, setLoading] = useState(true)\n' +
      '  const [err, setErr] = useState(null)\n' +
      '  const [modalCol, setModalCol] = useState(null)\n' +
      "  const [boardName, setBoardName] = useState('My Board')\n" +
      '  const [editingName, setEditingName] = useState(false)\n' +
      '  const nameRef = useRef(null)\n' +
      '\n' +
      '  useEffect(() => {\n' +
      '    loadAll()\n' +
      '  }, [])\n' +
      '\n' +
      '  useEffect(() => {\n' +
      '    if (editingName && nameRef.current) {\n' +
      '      nameRef.current.focus()\n' +
      '      nameRef.current.select()\n' +
      '    }\n' +
      '  }, [editingName])\n' +
      '\n' +
      '  async function loadAll() {\n' +
      '    try {\n' +
      "      const res = await fetch('/tasks')\n" +
      '      const data = await res.json()\n' +
      '      setTasks(data)\n' +
      '    } catch (e) {\n' +
      "      setErr('Could not connect to server')\n" +
      '    } finally {\n' +
      '      setLoading(false)\n' +
      '    }\n' +
      '  }\n' +
      '\n' +
      '  async function addTask(title, desc, status) {\n' +
      '    try {\n' +
      "      const res = await fetch('/tasks', {\n" +
      "        method: 'POST',\n" +
      "        headers: { 'Content-Type': 'application/json' },\n" +
      '        body: JSON.stringify({ title, description: desc, status })\n' +
      '      })\n' +
      '      if (!res.ok) {\n' +
      '        const body = await res.json()\n' +
      '        setErr(body.error)\n' +
      '        return\n' +
      '      }\n' +
      '      const created = await res.json()\n' +
      '      setTasks(prev => [...prev, created])\n' +
      '    } catch (e) {\n' +
      "      setErr('Failed to add task')\n" +
      '    }\n' +
      '  }\n' +
      '\n' +
      '  async function moveTask(id, newStatus) {\n' +
      '    try {\n' +
      '      const res = await fetch(`/tasks/${id}`, {\n' +
      "        method: 'PUT',\n" +
      "        headers: { 'Content-Type': 'application/json' },\n" +
      '        body: JSON.stringify({ status: newStatus })\n' +
      '      })\n' +
      '      const updated = await res.json()\n' +
      '      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))\n' +
      '    } catch (e) {\n' +
      "      setErr('Failed to move task')\n" +
      '    }\n' +
      '  }\n' +
      '\n' +
      '  async function removeTask(id) {\n' +
      '    try {\n' +
      "      await fetch(`/tasks/${id}`, { method: 'DELETE' })\n" +
      '      setTasks(prev => prev.filter(t => t.id !== id))\n' +
      '    } catch (e) {\n' +
      "      setErr('Failed to delete task')\n" +
      '    }\n' +
      '  }\n' +
      '\n' +
      '  function saveName() {\n' +
      "    if (!boardName.trim()) setBoardName('My Board')\n" +
      '    setEditingName(false)\n' +
      '  }\n' +
      '\n' +
      '  const cols = [\n' +
      "    { label: 'To Do',       type: 'todo' },\n" +
      "    { label: 'In Progress', type: 'inprogress' },\n" +
      "    { label: 'Bug',         type: 'bug' },\n" +
      "    { label: 'Done',        type: 'done' },\n" +
      '  ]\n' +
      '\n' +
      '  return (\n' +
      '    <div className="app">\n' +
      '      <header className="topbar">\n' +
      '        <div className="topbar-left">\n' +
      '          {editingName ? (\n' +
      '            <input\n' +
      '              ref={nameRef}\n' +
      '              className="name-input"\n' +
      '              value={boardName}\n' +
      '              onChange={e => setBoardName(e.target.value)}\n' +
      '              onBlur={saveName}\n' +
      "              onKeyDown={e => { if (e.key === 'Enter') saveName() }}\n" +
      '            />\n' +
      '          ) : (\n' +
      '            <span className="board-name" title="Click to rename" onClick={() => setEditingName(true)}>\n' +
      '              {boardName}\n' +
      '            </span>\n' +
      '          )}\n' +
      '        </div>\n' +
      '        <span className="total-badge">{tasks.length} tasks</span>\n' +
      '      </header>\n' +
      '\n' +
      '      {err && (\n' +
      '        <div className="err-toast">\n' +
      '          <span>{err}</span>\n' +
      '          <button onClick={() => setErr(null)}>✕</button>\n' +
      '        </div>\n' +
      '      )}\n' +
      '\n' +
      '      {loading ? (\n' +
      '        <div className="loader-wrap">\n' +
      '          <div className="spin" />\n' +
      '        </div>\n' +
      '      ) : (\n' +
      '        <div className="board">\n' +
      '          {cols.map(col => (\n' +
      '            <Column\n' +
      '              key={col.type}\n' +
      '              label={col.label}\n' +
      '              colType={col.type}\n' +
      '              items={tasks.filter(t => t.status === col.type)}\n' +
      '              onMove={moveTask}\n' +
      '              onRemove={removeTask}\n' +
      '              onAddClick={() => setModalCol(col.type)}\n' +
      '            />\n' +
      '          ))}\n' +
      '        </div>\n' +
      '      )}\n' +
      '\n' +
      '      {modalCol && (\n' +
      '        <AddTaskModal\n' +
      '          colStatus={modalCol}\n' +
      '          onClose={() => setModalCol(null)}\n' +
      '          onAdd={addTask}\n' +
      '        />\n' +
      '      )}\n' +
      '    </div>\n' +
      '  )\n' +
      '}\n' +
      '\n' +
      'export default App\n'
  },
  {
    path: '/tmp/AdarshVMore-Kanaban-board-task-cliperact-extracted/AdarshVMore-Kanaban-board-task-cliperact-76ccc3d/client/src/components/AddTaskModal.jsx',
    content: "import { useState } from 'react'\n" +
      '\n' +
      'function AddTaskModal({ colStatus, onClose, onAdd }) {\n' +
      "  const [title, setTitle] = useState('')\n" +
      "  const [desc, setDesc] = useState('')\n" +
      '  const [busy, setBusy] = useState(false)\n' +
      '\n' +
      '  async function submit() {\n' +
      '    if (!title.trim()) return\n' +
      '    setBusy(true)\n' +
      '    await onAdd(title.trim(), desc.trim(), colStatus)\n' +
      '    setBusy(false)\n' +
      '    onClose()\n' +
      '  }\n' +
      '\n' +
      '  function handleOverlayKey(e) {\n' +
      "    if (e.key === 'Escape') onClose()\n" +
      '  }\n' +
      '\n' +
      '  return (\n' +
      '    <div className="overlay" onClick={onClose} onKeyDown={handleOverlayKey}>\n' +
      '      <div className="modal" onClick={e => e.stopPropagation()}>\n' +
      '        <div className="modal-head">\n' +
      '          <h3>New Task</h3>\n' +
      '          <button className="modal-x" onClick={onClose}>✕</button>\n' +
      '        </div>\n' +
      '\n' +
      '        <div className="modal-body">\n' +
      '          <div className="field">\n' +
      '            <label>Title</label>\n' +
      '            <input\n' +
      '              autoFocus\n' +
      '              placeholder="What needs to be done?"\n' +
      '              value={title}\n' +
      '              onChange={e => setTitle(e.target.value)}\n' +
      "              onKeyDown={e => e.key === 'Enter' && submit()}\n" +
      '            />\n' +
      '          </div>\n' +
      '          <div className="field">\n' +
      '            <label>Description</label>\n' +
      '            <textarea\n' +
      '              placeholder="Add some details... (optional)"\n' +
      '              value={desc}\n' +
      '              onChange={e => setDesc(e.target.value)}\n' +
      '              rows={4}\n' +
      '            />\n' +
      '          </div>\n' +
      '        </div>\n' +
      '\n' +
      '        <div className="modal-foot">\n' +
      '          <button className="btn-cancel" onClick={onClose}>Cancel</button>\n' +
      '          <button\n' +
      '            className="btn-submit"\n' +
      '            onClick={submit}\n' +
      '            disabled={busy || !title.trim()}\n' +
      '          >\n' +
      "            {busy ? 'Adding...' : 'Add Task'}\n" +
      '          </button>\n' +
      '        </div>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  )\n' +
      '}\n' +
      '\n' +
      'export default AddTaskModal\n'
  },
  {
    path: '/tmp/AdarshVMore-Kanaban-board-task-cliperact-extracted/AdarshVMore-Kanaban-board-task-cliperact-76ccc3d/client/src/components/Column.jsx',
    content: "import { useState } from 'react'\n" +
      "import TaskCard from './TaskCard'\n" +
      '\n' +
      'const dotColors = {\n' +
      "  todo: '#3b82f6',\n" +
      "  inprogress: '#f97316',\n" +
      "  bug: '#ef4444',\n" +
      "  done: '#22c55e'\n" +
      '}\n' +
      '\n' +
      'function Column({ label, colType, items, onMove, onRemove, onAddClick }) {\n' +
      '  const [dragOver, setDragOver] = useState(false)\n' +
      '\n' +
      '  function handleDragOver(e) {\n' +
      '    e.preventDefault()\n' +
      '    setDragOver(true)\n' +
      '  }\n' +
      '\n' +
      '  function handleDragLeave(e) {\n' +
      '    if (!e.currentTarget.contains(e.relatedTarget)) {\n' +
      '      setDragOver(false)\n' +
      '    }\n' +
      '  }\n' +
      '\n' +
      '  function handleDrop(e) {\n' +
      '    e.preventDefault()\n' +
      '    setDragOver(false)\n' +
      "    const id = parseInt(e.dataTransfer.getData('taskId'))\n" +
      "    const from = e.dataTransfer.getData('fromStatus')\n" +
      '    if (from !== colType) {\n' +
      '      onMove(id, colType)\n' +
      '    }\n' +
      '  }\n' +
      '\n' +
      '  return (\n' +
      '    <div\n' +
      "      className={`column ${colType} ${dragOver ? 'drag-over' : ''}`}\n" +
      '      onDragOver={handleDragOver}\n' +
      '      onDragLeave={handleDragLeave}\n' +
      '      onDrop={handleDrop}\n' +
      '    >\n' +
      '      <div className="col-head">\n' +
      '        <div className="col-head-left">\n' +
      '          <span className="col-dot" style={{ background: dotColors[colType] }} />\n' +
      '          <span className="col-label">{label}</span>\n' +
      '        </div>\n' +
      '        <span className="col-count">{items.length}</span>\n' +
      '      </div>\n' +
      '\n' +
      '      <div className="cards-wrap">\n' +
      '        {items.length === 0 && (\n' +
      '          <div className="empty-hint">Drop tasks here</div>\n' +
      '        )}\n' +
      '        {items.map(item => (\n' +
      '          <TaskCard\n' +
      '            key={item.id}\n' +
      '            task={item}\n' +
      '            onMove={onMove}\n' +
      '            onRemove={onRemove}\n' +
      '          />\n' +
      '        ))}\n' +
      '      </div>\n' +
      '\n' +
      '      <button className="add-col-btn" onClick={onAddClick}>\n' +
      '        + Add task\n' +
      '      </button>\n' +
      '    </div>\n' +
      '  )\n' +
      '}\n' +
      '\n' +
      'export default Column\n'
  },
  {
    path: '/tmp/AdarshVMore-Kanaban-board-task-cliperact-extracted/AdarshVMore-Kanaban-board-task-cliperact-76ccc3d/client/src/components/TaskCard.jsx',
    content: "import { useState } from 'react'\n" +
      '\n' +
      "const accents = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']\n" +
      '\n' +
      'const statusOptions = [\n' +
      "  { value: 'todo',       label: 'To Do' },\n" +
      "  { value: 'inprogress', label: 'In Progress' },\n" +
      "  { value: 'bug',        label: 'Bug' },\n" +
      "  { value: 'done',       label: 'Done' },\n" +
      ']\n' +
      '\n' +
      'function TaskCard({ task, onMove, onRemove }) {\n' +
      '  const [dragging, setDragging] = useState(false)\n' +
      '\n' +
      '  const color = accents[task.id % accents.length]\n' +
      "  const done = task.status === 'done'\n" +
      '\n' +
      '  function onDragStart(e) {\n' +
      "    e.dataTransfer.setData('taskId', task.id)\n" +
      "    e.dataTransfer.setData('fromStatus', task.status)\n" +
      "    e.dataTransfer.effectAllowed = 'move'\n" +
      '    setDragging(true)\n' +
      '  }\n' +
      '\n' +
      '  function onDragEnd() {\n' +
      '    setDragging(false)\n' +
      '  }\n' +
      '\n' +
      '  function handleStatusChange(e) {\n' +
      '    const next = e.target.value\n' +
      '    if (next !== task.status) {\n' +
      '      onMove(task.id, next)\n' +
      '    }\n' +
      '  }\n' +
      '\n' +
      '  return (\n' +
      '    <div\n' +
      "      className={`card ${dragging ? 'dragging' : ''}`}\n" +
      '      draggable\n' +
      '      onDragStart={onDragStart}\n' +
      '      onDragEnd={onDragEnd}\n' +
      '    >\n' +
      '      <div className="card-top">\n' +
      '        <div className="card-accent" style={{ background: color }} />\n' +
      "        <p className={`card-title ${done ? 'striked' : ''}`}>{task.title}</p>\n" +
      '        {task.description && (\n' +
      '          <p className="card-desc">{task.description}</p>\n' +
      '        )}\n' +
      '      </div>\n' +
      '      <div className="card-foot">\n' +
      '        <button className="btn-del" onClick={() => onRemove(task.id)}>\n' +
      '          Delete\n' +
      '        </button>\n' +
      '        <select\n' +
      '          className="status-select"\n' +
      '          value={task.status}\n' +
      '          onChange={handleStatusChange}\n' +
      '          onClick={e => e.stopPropagation()}\n' +
      '        >\n' +
      '          {statusOptions.map(s => (\n' +
      '            <option key={s.value} value={s.value}>{s.label}</option>\n' +
      '          ))}\n' +
      '        </select>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  )\n' +
      '}\n' +
      '\n' +
      'export default TaskCard\n'
  },
  {
    path: '/tmp/AdarshVMore-Kanaban-board-task-cliperact-extracted/AdarshVMore-Kanaban-board-task-cliperact-76ccc3d/client/src/main.jsx',
    content: "import React from 'react'\n" +
      "import ReactDOM from 'react-dom/client'\n" +
      "import App from './App'\n" +
      "import './index.css'\n" +
      '\n' +
      "ReactDOM.createRoot(document.getElementById('root')).render(\n" +
      '  <React.StrictMode>\n' +
      '    <App />\n' +
      '  </React.StrictMode>\n' +
      ')\n'
  },
  {
    path: '/tmp/AdarshVMore-Kanaban-board-task-cliperact-extracted/AdarshVMore-Kanaban-board-task-cliperact-76ccc3d/client/vite.config.js',
    content: "import { defineConfig } from 'vite'\n" +
      "import react from '@vitejs/plugin-react'\n" +
      '\n' +
      'export default defineConfig({\n' +
      '  plugins: [react()],\n' +
      '  server: {\n' +
      '    port: 5173,\n' +
      '    proxy: {\n' +
      "      '/tasks': 'http://localhost:3001'\n" +
      '    }\n' +
      '  }\n' +
      '})\n'
  },
  {
    path: '/tmp/AdarshVMore-Kanaban-board-task-cliperact-extracted/AdarshVMore-Kanaban-board-task-cliperact-76ccc3d/server/index.js',
    content: "const express = require('express')\n" +
      "const cors = require('cors')\n" +
      '\n' +
      'const app = express()\n' +
      '\n' +
      'app.use(cors())\n' +
      'app.use(express.json())\n' +
      '\n' +
      'let tasks = []\n' +
      'let idCounter = 1\n' +
      '\n' +
      "app.get('/tasks', (req, res) => {\n" +
      '  res.json(tasks)\n' +
      '})\n' +
      '\n' +
      "app.post('/tasks', (req, res) => {\n" +
      '  const title = req.body.title\n' +
      "  const description = req.body.description || ''\n" +
      "  const validStatuses = ['todo', 'inprogress', 'bug', 'done']\n" +
      "  const status = validStatuses.includes(req.body.status) ? req.body.status : 'todo'\n" +
      '\n' +
      "  if (!title || title.trim() === '') {\n" +
      "    return res.status(400).json({ error: 'Title cannot be empty' })\n" +
      '  }\n' +
      '\n' +
      '  const task = {\n' +
      '    id: idCounter,\n' +
      '    title: title.trim(),\n' +
      '    description: description.trim(),\n' +
      '    status\n' +
      '  }\n' +
      '\n' +
      '  idCounter++\n' +
      '  tasks.push(task)\n' +
      '  res.status(201).json(task)\n' +
      '})\n' +
      '\n' +
      "app.put('/tasks/:id', (req, res) => {\n" +
      '  const id = parseInt(req.params.id)\n' +
      '  const status = req.body.status\n' +
      '\n' +
      "  const valid = ['todo', 'inprogress', 'bug', 'done']\n" +
      '  if (!valid.includes(status)) {\n' +
      "    return res.status(400).json({ error: 'Invalid status value' })\n" +
      '  }\n' +
      '\n' +
      '  let found = null\n' +
      '  for (let i = 0; i < tasks.length; i++) {\n' +
      '    if (tasks[i].id === id) {\n' +
      '      found = tasks[i]\n' +
      '      break\n' +
      '    }\n' +
      '  }\n' +
      '\n' +
      '  if (!found) {\n' +
      "    return res.status(404).json({ error: 'Task not found' })\n" +
      '  }\n' +
      '\n' +
      '  found.status = status\n' +
      '  res.json(found)\n' +
      '})\n' +
      '\n' +
      "app.delete('/tasks/:id', (req, res) => {\n" +
      '  const id = parseInt(req.params.id)\n' +
      '  const idx = tasks.findIndex(t => t.id === id)\n' +
      '\n' +
      '  if (idx === -1) {\n' +
      "    return res.status(404).json({ error: 'Task not found' })\n" +
      '  }\n' +
      '\n' +
      '  tasks.splice(idx, 1)\n' +
      "  res.json({ message: 'deleted' })\n" +
      '})\n' +
      '\n' +
      'app.listen(3001, () => {\n' +
      "  console.log('server is running on http://localhost:3001')\n" +
      '})\n'
  }
]