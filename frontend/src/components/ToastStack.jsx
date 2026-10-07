function ToastStack({ toasts = [], onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-stack" aria-live="polite" aria-label="Status messages">
      {toasts.map((toast) => (
        <div className={`toast-item ${toast.type || "info"}`} key={toast.id}>
          <div>
            <strong>{toast.title}</strong>
            {toast.message && <p>{toast.message}</p>}
          </div>
          <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss message">
            x
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastStack;
