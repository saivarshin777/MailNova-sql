import { useEffect, useMemo, useState } from "react";
import {
  FaBolt,
  FaCheckCircle,
  FaEdit,
  FaEnvelope,
  FaFilter,
  FaLayerGroup,
  FaPauseCircle,
  FaPlayCircle,
  FaPlus,
  FaProjectDiagram,
  FaSearch,
  FaTrash,
  FaUsers,
} from "react-icons/fa";
import { automationApi } from "../services/api";

const triggerOptions = ["New contact added", "Campaign not opened", "Clicked link", "Contact becomes inactive"];
const conditionOptions = ["Immediately", "Wait 24 hours", "Wait 48 hours", "Status is Lead", "High engagement"];
const actionOptions = ["Send welcome email", "Send follow-up campaign", "Move to interested folder", "Notify manager"];

const emptyDraft = { name: "", trigger: triggerOptions[0], condition: conditionOptions[0], action: actionOptions[0], folder: "" };

const formatRelativeTime = (iso) => {
  if (!iso) return "Never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

function AutomationWorkflows({ contactLists = [], setActivePage, showToast }) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadWorkflows = async () => {
    try {
      const response = await automationApi.getAutomations();
      setWorkflows(response.data.workflows || []);
    } catch (error) {
      console.error("Failed to load automations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
    const interval = window.setInterval(loadWorkflows, 15000);
    return () => window.clearInterval(interval);
  }, []);

  const activeCount = workflows.filter((workflow) => workflow.active).length;
  const totalRuns = workflows.reduce((sum, workflow) => sum + (workflow.runs || 0), 0);

  const visibleWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      if (statusFilter === "active" && !workflow.active) return false;
      if (statusFilter === "paused" && workflow.active) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        workflow.name?.toLowerCase().includes(q) ||
        workflow.trigger?.toLowerCase().includes(q) ||
        workflow.action?.toLowerCase().includes(q) ||
        workflow.folder?.toLowerCase().includes(q)
      );
    });
  }, [workflows, search, statusFilter]);

  const recommendedWorkflow = useMemo(() => {
    if (!contactLists.length) return "Create a welcome journey after your first contact folder is ready.";
    const ranked = [...contactLists].sort(
      (a, b) => (b.contactCount || b.contacts?.length || 0) - (a.contactCount || a.contacts?.length || 0)
    );
    const [largest, second] = ranked;
    const largestCount = largest?.contactCount || largest?.contacts?.length || 0;
    const secondCount = second?.contactCount || second?.contacts?.length || 0;

    if (!largestCount) return "Add contacts to a folder before creating audience-based automations.";
    if (largestCount === secondCount) {
      return "Your folders are balanced. Start with a welcome journey, then add segment-specific follow-ups after engagement data arrives.";
    }

    return `Create a re-engagement workflow for ${largest.name}; it currently has ${largestCount} reachable contact${largestCount === 1 ? "" : "s"}.`;
  }, [contactLists]);

  const startEditing = (workflow) => {
    setEditingId(workflow._id);
    setDraft({
      name: workflow.name,
      trigger: workflow.trigger,
      condition: workflow.condition,
      action: workflow.action,
      folder: workflow.folder === "All Contacts" ? "" : workflow.folder,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const saveWorkflow = async () => {
    if (!draft.name.trim()) {
      showToast?.("Workflow name required", "Give the automation a clear client-facing name.", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        trigger: draft.trigger,
        condition: draft.condition,
        action: draft.action,
        folder: draft.folder || "All Contacts",
      };

      if (editingId) {
        await automationApi.updateAutomation(editingId, payload);
        showToast?.("Workflow updated", "Your changes are live.", "success");
      } else {
        await automationApi.createAutomation(payload);
        showToast?.("Workflow created", "The automation is now saved and active.", "success");
      }

      await loadWorkflows();
      cancelEditing();
    } catch (error) {
      console.error("Failed to save automation:", error);
      showToast?.("Save failed", error.response?.data?.message || "Could not save this automation.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkflow = async (id) => {
    try {
      await automationApi.toggleAutomation(id);
      await loadWorkflows();
    } catch (error) {
      console.error("Failed to toggle automation:", error);
      showToast?.("Update failed", "Could not change this workflow's status.", "error");
    }
  };

  const removeWorkflow = async (id) => {
    if (!window.confirm("Delete this workflow?")) return;
    try {
      await automationApi.deleteAutomation(id);
      await loadWorkflows();
      if (editingId === id) cancelEditing();
      showToast?.("Workflow deleted", "The automation was removed.", "success");
    } catch (error) {
      console.error("Failed to delete automation:", error);
      showToast?.("Delete failed", "Could not delete this workflow.", "error");
    }
  };

  return (
    <section className="automation-command">
      <div className="page-hero compact-hero">
        <div>
          <span className="eyebrow">Automation Studio</span>
          <h1>Visual workflow builder</h1>
          <p>
            Create client-ready journeys such as welcome emails, non-opener follow-ups, and interested-buyer routing.
          </p>
        </div>
        <button type="button" className="compose-btn" onClick={() => setActivePage("Campaigns")}>
          Create Campaign
        </button>
      </div>

      <div className="automation-kpis">
        <div>
          <FaProjectDiagram />
          <strong>{workflows.length}</strong>
          <span>Total workflows</span>
        </div>
        <div>
          <FaPlayCircle />
          <strong>{activeCount}</strong>
          <span>Active journeys</span>
        </div>
        <div>
          <FaBolt />
          <strong>{totalRuns.toLocaleString()}</strong>
          <span>Automation runs</span>
        </div>
        <div>
          <FaCheckCircle />
          <strong>{loading ? "\u2013" : workflows.length ? "Live" : "None yet"}</strong>
          <span>Status</span>
        </div>
      </div>

      <div className="automation-builder-grid">
        <div className="automation-builder chart-box">
          <div className="section-header">
            <div>
              <h3>{editingId ? "Edit Workflow" : "Build Workflow"}</h3>
              <p>Trigger &gt; Condition &gt; Action</p>
            </div>
            <FaPlus />
          </div>

          <input
            type="text"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            placeholder="Workflow name"
          />
          <select value={draft.trigger} onChange={(event) => setDraft((current) => ({ ...current, trigger: event.target.value }))}>
            {triggerOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select value={draft.condition} onChange={(event) => setDraft((current) => ({ ...current, condition: event.target.value }))}>
            {conditionOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select value={draft.action} onChange={(event) => setDraft((current) => ({ ...current, action: event.target.value }))}>
            {actionOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select value={draft.folder} onChange={(event) => setDraft((current) => ({ ...current, folder: event.target.value }))}>
            <option value="">All Contacts</option>
            {contactLists.map((list) => (
              <option key={list._id} value={list.name}>
                {list.name}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="compose-btn" onClick={saveWorkflow} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Workflow"}
            </button>
            {editingId && (
              <button type="button" className="template-btn" onClick={cancelEditing} disabled={saving}>
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="workflow-recommendation chart-box">
          <span>
            <FaFilter />
          </span>
          <h3>Workflow Recommendation</h3>
          <p>{recommendedWorkflow}</p>
          <button type="button" className="template-btn" onClick={() => setActivePage("Contacts")}>
            Review Segments
          </button>
        </div>
      </div>

      <div className="workflow-toolbar" style={{ display: "flex", gap: 10, alignItems: "center", margin: "18px 0" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <FaSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search workflows..."
            style={{ width: "100%", padding: "8px 12px 8px 34px", borderRadius: 8, border: "1.5px solid #eee" }}
          />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #eee" }}>
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="paused">Paused only</option>
        </select>
      </div>

      <div className="workflow-board">
        {loading && <p>Loading workflows...</p>}
        {!loading && workflows.length === 0 && <p>No workflows yet - build your first one above.</p>}
        {!loading && workflows.length > 0 && visibleWorkflows.length === 0 && <p>No workflows match your search/filter.</p>}
        {visibleWorkflows.map((workflow) => (
          <article className="workflow-card" key={workflow._id}>
            <div className="workflow-card-header">
              <div>
                <strong>{workflow.name}</strong>
                <span className={workflow.active ? "status-badge" : "status-badge paused"}>
                  {workflow.active ? "Active" : "Paused"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => startEditing(workflow)} aria-label="Edit workflow">
                  <FaEdit />
                </button>
                <button type="button" onClick={() => toggleWorkflow(workflow._id)} aria-label="Toggle workflow">
                  {workflow.active ? <FaPauseCircle /> : <FaPlayCircle />}
                </button>
                <button type="button" onClick={() => removeWorkflow(workflow._id)} aria-label="Delete workflow">
                  <FaTrash />
                </button>
              </div>
            </div>

            <div className="workflow-line">
              <div>
                <FaUsers />
                <span>{workflow.trigger}</span>
              </div>
              <div>
                <FaLayerGroup />
                <span>{workflow.condition}</span>
              </div>
              <div>
                <FaEnvelope />
                <span>{workflow.action}</span>
              </div>
            </div>

            <div className="workflow-card-footer">
              <span>{workflow.folder}</span>
              <strong>{(workflow.runs || 0).toLocaleString()} runs</strong>
              <span>Last: {formatRelativeTime(workflow.lastTriggeredAt)}</span>
            </div>

            {workflow.lastTriggeredAt && (
              <p style={{ fontSize: 12.5, color: "#64748b", marginTop: 8 }}>
                {workflow.lastTriggeredContact?.name || workflow.lastTriggeredContact?.email
                  ? `Last ran for ${workflow.lastTriggeredContact.name || workflow.lastTriggeredContact.email}. `
                  : ""}
                {workflow.lastResult}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default AutomationWorkflows;
