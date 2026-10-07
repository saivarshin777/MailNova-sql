import { useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaEnvelopeOpenText,
  FaEye,
  FaMagic,
  FaPaperPlane,
  FaRobot,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";

const steps = ["Audience", "Template", "Content", "Preview", "Schedule/Send", "Review"];

const toneOptions = ["Executive", "Friendly", "Premium", "Urgent", "Minimal"];

const spamWords = ["free", "guarantee", "winner", "urgent", "cash", "risk-free", "limited time"];

function scoreSpam(subject, content) {
  const source = `${subject} ${content}`.toLowerCase();
  const hits = spamWords.filter((word) => source.includes(word));
  const punctuationPenalty = (subject.match(/!/g) || []).length * 6;
  const capsPenalty = subject.length > 0 && subject === subject.toUpperCase() ? 18 : 0;
  const score = Math.min(94, 12 + hits.length * 11 + punctuationPenalty + capsPenalty);

  return {
    score,
    label: score < 35 ? "Low risk" : score < 65 ? "Moderate risk" : "High risk",
    hits,
  };
}

function CampaignWizard({
  campaignName,
  campaignSubject,
  campaignContent,
  campaignRecipients,
  contactLists,
  templates,
  selectedCampaignList,
  selectedCampaignListId,
  selectedTemplate,
  selectedTemplateId,
  campaignError,
  setCampaignName,
  setCampaignSubject,
  setCampaignContent,
  setCampaignRecipients,
  setSelectedCampaignListId,
  setSelectedTemplateId,
  onClose,
  onDraft,
  onSend,
  onManageFolder,
  onOpenTemplates,
  showToast,
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [tone, setTone] = useState("Premium");
  const [scheduleMode, setScheduleMode] = useState("send-now");
  const [scheduledAt, setScheduledAt] = useState("");

  const recipientCount = selectedCampaignList
    ? selectedCampaignList.contactCount || selectedCampaignList.contacts?.length || 0
    : campaignRecipients.split(",").map((item) => item.trim()).filter(Boolean).length;

  const spam = useMemo(
    () => scoreSpam(campaignSubject, campaignContent),
    [campaignContent, campaignSubject]
  );

  const recommendation = useMemo(() => {
    if (!contactLists.length) {
      return {
        list: null,
        label: "Create a contact folder first",
        detail: "Recommendations appear after folders contain contacts.",
        confident: false,
      };
    }

    const ranked = [...contactLists].sort(
      (a, b) => (b.contactCount || b.contacts?.length || 0) - (a.contactCount || a.contacts?.length || 0)
    );
    const [top, second] = ranked;
    const topCount = top?.contactCount || top?.contacts?.length || 0;
    const secondCount = second?.contactCount || second?.contacts?.length || 0;

    if (!topCount) {
      return {
        list: null,
        label: "No contacts in folders yet",
        detail: "Add contacts to a folder before using recommendations.",
        confident: false,
      };
    }

    if (topCount === secondCount) {
      return {
        list: top,
        label: `${top.name} (${topCount} contacts)`,
        detail: "Several folders are tied, so choose based on campaign intent.",
        confident: false,
      };
    }

    return {
      list: top,
      label: `${top.name} (${topCount} contacts)`,
      detail: `Largest reachable folder by ${topCount - secondCount} contact${topCount - secondCount === 1 ? "" : "s"}.`,
      confident: true,
    };
  }, [contactLists]);
  const recommendedList = recommendation.list;

  const bestSendTime = recipientCount > 1000 ? "Tuesday, 10:00 AM" : "Tomorrow, 9:30 AM";

  const generateSubject = () => {
    const base = campaignName.trim() || selectedTemplate?.name || "Your next campaign";
    const subjects = {
      Executive: `${base}: strategic update for your team`,
      Friendly: `A quick update from MailNova: ${base}`,
      Premium: `${base} - curated for high-value customers`,
      Urgent: `${base}: priority action recommended`,
      Minimal: `${base} update`,
    };
    setCampaignSubject(subjects[tone]);
    showToast?.("Subject generated", "Review and edit it before sending.", "success");
  };

  const generateContent = () => {
    const listName = selectedCampaignList?.name || recommendedList?.name || "your audience";
    const content = `Hi {{firstName}},\n\nWe prepared this ${tone.toLowerCase()} update for ${listName}. ${campaignName || "This campaign"} highlights the most important next step for your audience and keeps the message focused on value.\n\nRecommended action:\n- Review the offer or announcement\n- Click through while engagement is strongest\n- Reply if your team needs a tailored follow-up\n\nThanks,\nMailNova Team`;
    setCampaignContent(content);
    showToast?.("Email copy generated", "The draft includes audience context and a clear call to action.", "success");
  };

  const applyRecommendation = () => {
    if (!recommendedList) {
      showToast?.("No contact folder found", "Create a folder in Contacts to use segment recommendations.", "warning");
      return;
    }
    setSelectedCampaignListId(recommendedList._id || recommendedList.id);
    setCampaignRecipients("");
    showToast?.("Audience segment applied", `${recommendedList.name} is selected for this campaign.`, "success");
  };

  const canContinue =
    stepIndex === 0
      ? selectedCampaignListId || campaignRecipients.trim()
      : stepIndex === 1
      ? true
      : stepIndex === 2
      ? campaignName.trim() && campaignSubject.trim()
      : true;

  const goNext = () => {
    if (!canContinue) {
      showToast?.("Complete this step", "Add the required campaign details before continuing.", "warning");
      return;
    }
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  };

  return (
    <section className="campaign-wizard chart-box">
      <div className="wizard-topbar">
        <div>
          <span className="eyebrow">Smart Campaign Builder</span>
          <h3>Guided campaign launch flow</h3>
          <p>Audience &gt; Template &gt; Content &gt; Preview &gt; Schedule/Send &gt; Review</p>
        </div>
        <button type="button" className="ghost-danger-btn" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="wizard-steps" aria-label="Campaign builder steps">
        {steps.map((step, index) => (
          <button
            type="button"
            key={step}
            className={index === stepIndex ? "active" : index < stepIndex ? "done" : ""}
            onClick={() => setStepIndex(index)}
          >
            <span>{index + 1}</span>
            {step}
          </button>
        ))}
      </div>

      {stepIndex === 0 && (
        <div className="wizard-panel two-column-panel">
          <div>
            <h4>Choose Audience</h4>
            <p>Select a reusable contact folder or enter comma-separated recipients manually.</p>
            <select
              value={selectedCampaignListId}
              onChange={(event) => {
                setSelectedCampaignListId(event.target.value);
                if (event.target.value) setCampaignRecipients("");
              }}
            >
              <option value="">Manual recipients or default list</option>
              {contactLists.map((list) => (
                <option key={list._id} value={list._id}>
                  {list.name} ({list.contactCount || list.contacts?.length || 0} contacts)
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder={
                selectedCampaignList ? "Folder selected - emails will be pulled automatically" : "Recipients separated by comma"
              }
              value={campaignRecipients}
              disabled={Boolean(selectedCampaignList)}
              onChange={(event) => setCampaignRecipients(event.target.value)}
            />
            {selectedCampaignList && (
              <div className="recipient-folder-preview">
                <div>
                  <strong>{selectedCampaignList.name}</strong>
                  <p>{recipientCount} contacts will receive this campaign.</p>
                </div>
                <button type="button" onClick={onManageFolder}>
                  Manage Folder
                </button>
              </div>
            )}
          </div>
          <div className="ai-card">
            <span>
              <FaUsers />
            </span>
            <h4>Segment Recommendation</h4>
            <p>
              Suggested segment: <strong>{recommendation.label}</strong>
            </p>
            <small>{recommendation.detail}</small>
            <button type="button" className="compose-btn" onClick={applyRecommendation}>
              {recommendation.confident ? "Apply Recommended Segment" : "Use This Segment"}
            </button>
          </div>
        </div>
      )}

      {stepIndex === 1 && (
        <div className="wizard-panel two-column-panel">
          <div>
            <h4>Select Template</h4>
            <p>Use a saved template or continue with a clean basic email.</p>
            <select
              value={selectedTemplateId}
              onChange={(event) => {
                const template = templates.find((item) => item._id === event.target.value);
                setSelectedTemplateId(event.target.value);
                if (template?.subject && !campaignSubject.trim()) setCampaignSubject(template.subject);
              }}
            >
              <option value="">No template / basic email</option>
              {templates.map((template) => (
                <option key={template._id} value={template._id}>
                  {template.name}
                </option>
              ))}
            </select>
            <button type="button" className="template-btn" onClick={onOpenTemplates}>
              Open Template Studio
            </button>
          </div>
          <div className="template-mini-preview" style={{ background: selectedTemplate?.background || "#f8fafc" }}>
            <span>Template Preview</span>
            <h4>{selectedTemplate?.name || "Basic Campaign"}</h4>
            <p>{selectedTemplate?.subject || "A clean message layout with your campaign content."}</p>
          </div>
        </div>
      )}

      {stepIndex === 2 && (
        <div className="wizard-panel">
          <div className="ai-assist-bar">
            <div>
              <h4>Content Studio</h4>
              <p>Generate subject lines, draft copy, check spam risk, and choose the best send time.</p>
            </div>
            <select value={tone} onChange={(event) => setTone(event.target.value)}>
              {toneOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="ai-tool-grid">
            <button type="button" onClick={generateSubject}>
              <FaMagic />
              Generate Subject
            </button>
            <button type="button" onClick={generateContent}>
              <FaRobot />
              Generate Content
            </button>
            <button type="button" onClick={() => showToast?.("Spam check complete", `${spam.label}: ${spam.score}/100`, "info")}>
              <FaShieldAlt />
              Spam Score: {spam.score}/100
            </button>
            <button type="button" onClick={() => showToast?.("Best send time", bestSendTime, "info")}>
              <FaClock />
              Best Time: {bestSendTime}
            </button>
          </div>

          <input
            type="text"
            placeholder="Campaign name"
            value={campaignName}
            onChange={(event) => setCampaignName(event.target.value)}
          />
          <input
            type="text"
            placeholder="Email subject"
            value={campaignSubject}
            onChange={(event) => setCampaignSubject(event.target.value)}
          />
          <textarea
            rows="8"
            placeholder="Write your email content..."
            value={campaignContent}
            onChange={(event) => setCampaignContent(event.target.value)}
          />

          <div className={`spam-meter ${spam.score < 35 ? "good" : spam.score < 65 ? "medium" : "bad"}`}>
            <strong>{spam.label}</strong>
            <span>{spam.hits.length ? `Flagged words: ${spam.hits.join(", ")}` : "No major spam keywords detected."}</span>
          </div>
        </div>
      )}

      {stepIndex === 3 && (
        <div className="wizard-panel preview-panel">
          <div className="email-preview-frame">
            <div className="email-preview-top">
              <span>Preview</span>
              <strong>{campaignSubject || "Email subject preview"}</strong>
            </div>
            <div className="email-preview-body">
              <h2>{campaignName || "Campaign Name"}</h2>
              <p>{campaignContent || "Your campaign content preview will appear here."}</p>
            </div>
          </div>
          <div className="review-card">
            <FaEye />
            <h4>Preview Checklist</h4>
            <p>Review subject, sender fit, mobile readability, call to action, and audience match before sending.</p>
          </div>
        </div>
      )}

      {stepIndex === 4 && (
        <div className="wizard-panel two-column-panel">
          <div>
            <h4>Schedule or Send</h4>
            <p>Send immediately or prepare a scheduled send time for the campaign.</p>
            <div className="segmented-control">
              <button type="button" className={scheduleMode === "send-now" ? "active" : ""} onClick={() => setScheduleMode("send-now")}>
                Send Now
              </button>
              <button type="button" className={scheduleMode === "schedule" ? "active" : ""} onClick={() => setScheduleMode("schedule")}>
                Schedule
              </button>
            </div>
            {scheduleMode === "schedule" && (
              <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
            )}
          </div>
          <div className="ai-card">
            <span>
              <FaCalendarAlt />
            </span>
            <h4>Best Send-Time Suggestion</h4>
            <p>{bestSendTime} based on audience size and typical B2B engagement windows.</p>
          </div>
        </div>
      )}

      {stepIndex === 5 && (
        <div className="wizard-panel review-grid">
          {[
            ["Audience", selectedCampaignList?.name || `${recipientCount} manual recipients`],
            ["Template", selectedTemplate?.name || "Basic email"],
            ["Spam Risk", `${spam.label} (${spam.score}/100)`],
            ["Send Plan", scheduleMode === "schedule" && scheduledAt ? scheduledAt : "Send now"],
          ].map(([label, value]) => (
            <div className="review-card" key={label}>
              <FaCheckCircle />
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      )}

      {campaignError && <p className="form-error">{campaignError}</p>}

      <div className="wizard-actions">
        <button type="button" className="template-btn" disabled={stepIndex === 0} onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}>
          Back
        </button>
        {stepIndex < steps.length - 1 ? (
          <button type="button" className="compose-btn" onClick={goNext}>
            Continue
          </button>
        ) : (
          <>
            <button type="button" className="template-btn" onClick={onDraft}>
              Save Draft
            </button>
            <button
              type="button"
              className="compose-btn"
              onClick={() =>
                onSend({
                  scheduledFor: scheduleMode === "schedule" && scheduledAt ? scheduledAt : null,
                })
              }
            >
              <FaPaperPlane />
              Send Campaign
            </button>
          </>
        )}
      </div>
    </section>
  );
}

export default CampaignWizard;
