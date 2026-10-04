const PRIORITY = { 1: 'High', 2: 'Medium', 3: 'Low' };

export default function TaskCard({ task, onDelete }) {
  return (
    <div
      className="task"
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', String(task.id))}
    >
      <div className="task-top">
        <span className={`badge p${task.priority}`}>{PRIORITY[task.priority]}</span>
        <button className="icon" title="Delete task" onClick={() => onDelete(task.id)}>
          ×
        </button>
      </div>
      <div className="task-title">{task.title}</div>
    </div>
  );
}
