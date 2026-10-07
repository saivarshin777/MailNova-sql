// Run with:  node --test backend/tests/
// Exercises the SQL model layer with the exact query shapes the controllers use.
import test from "node:test";
import assert from "node:assert/strict";

process.env.SQLITE_PATH = ":memory:";

const { connectDB } = await import("../config/db.js");
const { tenantStorage } = await import("../config/tenantDb.js");
const { default: User } = await import("../models/User.js");
const { default: Contact } = await import("../models/Contact.js");
const { default: ContactList } = await import("../models/ContactList.js");
const { default: Template } = await import("../models/Template.js");
const { default: Campaign } = await import("../models/Campaign.js");
const { default: CampaignRecipient } = await import("../models/CampaignRecipient.js");
const { default: Notification } = await import("../models/Notification.js");
const { default: Automation } = await import("../models/Automation.js");
const { default: AutomationTask } = await import("../models/AutomationTask.js");
const { default: OTP } = await import("../models/OTP.js");
const { default: Payment } = await import("../models/Payment.js");
const { default: ActivityLog } = await import("../models/ActivityLog.js");

await connectDB();

const inTenant = (tenantId, fn) => tenantStorage.run({ tenantId }, fn);

test("users: defaults, setters, unique email, nested plan, partial save", async () => {
  const u = await User.create({ name: "  Ada ", email: "ADA@Example.COM ", password: "hash" });
  assert.equal(u.email, "ada@example.com");
  assert.equal(u.name, "Ada");
  assert.equal(u.role, "User");
  assert.deepEqual(u.plan, { name: "Free", sendLimit: 5000, contactLimit: 1000, billingStatus: "Trial" });
  assert.match(String(u._id), /^[0-9a-f]{24}$/);

  await assert.rejects(User.create({ name: "x", email: "ada@example.com", password: "p" }), (e) => e.code === 11000);
  await assert.rejects(User.create({ name: "x", email: "bad", password: "p", role: "Nope" }), (e) => e.name === "ValidationError");

  // lookup is case/space insensitive like Mongoose's lowercase setter
  assert.equal((await User.findOne({ email: "ADA@example.com" }))._id, u._id);

  // select("-password") then save() must NOT wipe the password
  const partial = await User.findById(u._id).select("-password");
  assert.equal(partial.password, undefined);
  partial.isOwner = true;
  partial.plan = { name: "Pro", sendLimit: 50000, contactLimit: 20000, billingStatus: "Active" };
  await partial.save();
  const full = await User.findById(u._id);
  assert.equal(full.password, "hash");
  assert.equal(full.plan.name, "Pro");
  assert.equal(full.isOwner, true);

  full.workDoneAtLogin = { campaigns: 2, lastLoginAt: new Date() };
  full.lastLogin = new Date();
  full.loginCount = (full.loginCount || 0) + 1;
  await full.save();
  const again = await User.findById(u._id).lean();
  assert.equal(again.workDoneAtLogin.campaigns, 2);
  assert.ok(again.lastLogin instanceof Date);
  assert.equal(again.loginCount, 1);
  assert.equal(typeof JSON.stringify(full.toJSON()), "string");

  // password reset token lookup with $gt on a date using Date.now()
  full.resetPasswordToken = "tok";
  full.resetPasswordExpire = new Date(Date.now() + 60000);
  await full.save();
  assert.ok(await User.findOne({ resetPasswordToken: "tok", resetPasswordExpire: { $gt: Date.now() } }));
  assert.equal(await User.findOne({ resetPasswordToken: "tok", resetPasswordExpire: { $gt: Date.now() + 120000 } }), null);

  // seed: updateMany with $ne + $set
  await User.create({ name: "B", email: "b@example.com", password: "p", isOwner: true });
  await User.updateMany({ email: { $ne: "ada@example.com" }, isOwner: true }, { $set: { isOwner: false } });
  assert.equal((await User.findOne({ email: "b@example.com" })).isOwner, false);

  // aggregate used by admin dashboard
  const byRole = await User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
  assert.deepEqual(byRole, [{ _id: "User", count: 2 }]);
  const byPlan = await User.aggregate([{ $group: { _id: "$plan.name", count: { $sum: 1 } } }]);
  assert.equal(byPlan.find((r) => r._id === "Pro").count, 1);
});

test("tenant isolation: each user only sees their own rows", async () => {
  const a = "a".repeat(24);
  const b = "b".repeat(24);
  await inTenant(a, () => Contact.create({ name: "A1", email: "a1@x.com" }));
  await inTenant(b, () => Contact.create({ name: "B1", email: "b1@x.com" }));
  await Contact.create({ name: "Legacy", email: "legacy@x.com" }); // no tenant => "main db"

  assert.deepEqual((await inTenant(a, () => Contact.find().lean())).map((c) => c.name), ["A1"]);
  assert.deepEqual((await inTenant(b, () => Contact.find().lean())).map((c) => c.name), ["B1"]);
  assert.deepEqual((await Contact.find().lean()).map((c) => c.name), ["Legacy"]);
  assert.equal(await inTenant(a, () => Contact.countDocuments({})), 1);

  // another tenant can't update/delete by id
  const a1 = await inTenant(a, () => Contact.findOne({ name: "A1" }));
  assert.equal(await inTenant(b, () => Contact.findOneAndDelete({ _id: a1._id })), null);
  assert.equal((await inTenant(b, () => Contact.deleteMany({}))).deletedCount, 1);
  assert.equal(await inTenant(a, () => Contact.countDocuments()), 1);
});

test("contacts: search $or/$regex, status $in, update with undefined keys, sort, lean", async () => {
  const t = "c".repeat(24);
  await inTenant(t, async () => {
    await Contact.insertMany([
      { name: "John Doe", email: "john@acme.com", phone: "999", city: "Pune", status: "Lead" },
      { name: "Jane Roe", email: "jane@acme.com", phone: "", city: "Bangalore", status: "Customer" },
      { name: "Bob 50%_", email: "bob@other.com", phone: "123", city: "Delhi", status: "Prospect" },
    ]);
    const search = (s) => ({
      $or: [
        { name: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { city: { $regex: s, $options: "i" } },
        { phone: { $regex: s, $options: "i" } },
      ],
    });
    assert.equal((await Contact.find(search("ACME")).lean()).length, 2);
    assert.equal((await Contact.find(search("50%_")).lean()).length, 1); // LIKE wildcards are escaped
    assert.equal(await Contact.countDocuments({ status: { $in: ["Customer", "Prospect"] } }), 2);
    assert.equal((await Contact.find({ phone: { $exists: true, $ne: "" } }).lean()).length, 2);
    assert.deepEqual((await Contact.find().sort({ name: 1 }).lean()).map((c) => c.name), ["Bob 50%_", "Jane Roe", "John Doe"]);
    assert.deepEqual((await Contact.find().sort({ createdAt: -1 }).limit(2).lean()).length, 2);

    const john = await Contact.findOne({ email: "JOHN@acme.com" });
    const updated = await Contact.findOneAndUpdate(
      { _id: john._id },
      { name: "Johnny", email: undefined, phone: undefined, city: "Mumbai", status: "Customer" },
      { new: true, runValidators: true }
    );
    assert.equal(updated.name, "Johnny");
    assert.equal(updated.email, "john@acme.com"); // undefined keys are ignored
    assert.equal(updated.city, "Mumbai");
    await assert.rejects(Contact.findOneAndUpdate({ _id: john._id }, { status: "Bad" }, { new: true, runValidators: true }), (e) => e.name === "ValidationError");
    const before = await Contact.findOneAndUpdate({ _id: john._id }, { city: "Goa" }); // default returns old doc
    assert.equal(before.city, "Mumbai");
    assert.equal((await Contact.findById(john._id)).city, "Goa");
  });
});

test("contact lists: array of ids, populate, $addToSet/$pull, membership filter", async () => {
  const t = "d".repeat(24);
  await inTenant(t, async () => {
    const [c1, c2, c3] = await Contact.insertMany([
      { name: "One", email: "1@x.com", status: "Lead" },
      { name: "Two", email: "2@x.com", status: "Customer" },
      { name: "Three", email: "3@x.com", status: "Lead" },
    ]);
    const list = await ContactList.create({ name: " Folder ", contacts: [c1._id, c2._id, c1._id].map(String), createdBy: "e".repeat(24) });
    assert.equal(list.name, "Folder");

    let populated = await ContactList.findById(list._id).populate("contacts", "name email phone city status createdAt").lean();
    assert.deepEqual(populated.contacts.map((c) => c.name), ["One", "Two", "One"].slice(0, 3));
    assert.ok(populated.contacts[0]._id && populated.contacts[0].createdAt instanceof Date);
    assert.equal(populated.contacts[0].isSeedData, undefined); // projection respected

    populated = await ContactList.findOneAndUpdate(
      { _id: list._id, createdBy: "e".repeat(24) },
      { $addToSet: { contacts: { $each: [c2._id, c3._id] } } },
      { new: true }
    ).populate("contacts", "name").lean();
    assert.deepEqual(populated.contacts.map((c) => c.name).sort(), ["One", "One", "Three", "Two"].filter((n, i, a) => a.indexOf(n) === i || n === "One").sort());

    populated = await ContactList.findOneAndUpdate({ _id: list._id }, { $pull: { contacts: { $in: [c1._id] } } }, { new: true }).populate("contacts", "name").lean();
    assert.deepEqual(populated.contacts.map((c) => c.name).sort(), ["Three", "Two"]);

    // deleting a contact pulls it from lists (contactController.deleteContact)
    await ContactList.updateMany({ contacts: c2._id }, { $pull: { contacts: c2._id } });
    const raw = await ContactList.findById(list._id).lean();
    assert.deepEqual(raw.contacts, [String(c3._id)]);
    assert.equal(await ContactList.countDocuments({ contacts: c3._id }), 1);

    // update replacing array + wrong-owner scoping
    assert.equal(await ContactList.findOneAndUpdate({ _id: list._id, createdBy: "f".repeat(24) }, { name: "x" }, { new: true }), null);
    const replaced = await ContactList.findOneAndUpdate({ _id: list._id }, { contacts: [String(c1._id)], name: "Renamed" }, { new: true, runValidators: true }).lean();
    assert.deepEqual(replaced.contacts, [String(c1._id)]);

    // contact deleted => populate drops it
    await Contact.deleteOne({ _id: c1._id });
    const p2 = await ContactList.findById(list._id).populate("contacts", "name").lean();
    assert.deepEqual(p2.contacts, []);
  });
});

test("campaigns: scoping filters, populate createdBy, aggregate usage, save(), counters", async () => {
  const t = "1".repeat(24);
  const owner = await User.create({ name: "Camp Owner", email: "camp@x.com", password: "p", role: "Admin" });
  await inTenant(t, async () => {
    const c = await Campaign.create({ name: "Spring", subject: "Hello", recipients: ["a@x.com", "b@x.com"], createdBy: owner._id, emailsSent: 2 });
    await Campaign.create({ name: "Draft one", subject: "Later", sendStatus: "draft", status: "Draft", createdBy: owner._id, emailsSent: 99 });
    await Campaign.create({ name: "Orphan", subject: "x" });
    assert.deepEqual(c.recipients, ["a@x.com", "b@x.com"]);
    await assert.rejects(Campaign.create({ name: "n", subject: "s", emailsSent: -1 }), (e) => e.name === "ValidationError");

    // scopeCampaignFilter for non-admins / shared read filter
    assert.equal((await Campaign.find({ createdBy: owner._id }).lean()).length, 2);
    const shared = await Campaign.find({ $or: [{ createdBy: owner._id }, { createdBy: null }, { createdBy: { $exists: false } }] }).lean();
    assert.equal(shared.length, 3);

    // populate createdBy from the global users table
    const [first] = await Campaign.find({ name: "Spring" }).populate("createdBy", "name email role").lean();
    assert.deepEqual(Object.keys(first.createdBy).sort(), ["_id", "email", "name", "role"]);
    assert.equal(first.createdBy.name, "Camp Owner");
    const [orphan] = await Campaign.find({ name: "Orphan" }).populate("createdBy", "name").lean();
    assert.equal(orphan.createdBy, null);

    // search across fields incl. fields that don't exist (must not error)
    const q = "spring";
    const found = await Campaign.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { campaignName: { $regex: q, $options: "i" } },
        { subject: { $regex: q, $options: "i" } },
        { status: { $regex: q, $options: "i" } },
      ],
    }).sort({ createdAt: -1 }).lean();
    assert.equal(found.length, 1);

    // monthly usage aggregate from createCampaign
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const usage = await Campaign.aggregate([
      { $match: { createdBy: owner._id, createdAt: { $gte: monthStart }, sendStatus: { $ne: "draft" } } },
      { $group: { _id: null, total: { $sum: "$emailsSent" } } },
    ]);
    assert.equal(usage[0].total, 2);
    assert.deepEqual(await Campaign.aggregate([{ $match: { name: "nothing" } }, { $group: { _id: null, total: { $sum: "$emailsSent" } } }]), []);

    // worker: pending + scheduledFor null/<= now
    const pending = await Campaign.find({ sendStatus: "pending", $or: [{ scheduledFor: null }, { scheduledFor: { $lte: new Date() } }] });
    assert.equal(pending.length, 2);
    const doc = pending.find((p) => p.name === "Spring");
    doc.sendStatus = "sending"; doc.status = "Running"; await doc.save();
    doc.sendStatus = "sent"; doc.emailsSent = 2; doc.delivered = 2; await doc.save();
    const fresh = await Campaign.findById(doc._id).lean();
    assert.equal(fresh.sendStatus, "sent");
    assert.ok(fresh.updatedAt >= fresh.createdAt);

    // tracking: findByIdAndUpdate with plain object
    await Campaign.findByIdAndUpdate(doc._id, { delivered: 1, opened: 1, clicked: 0 });
    assert.equal((await Campaign.findById(doc._id)).opened, 1);

    // recipients: insertMany, unique token, unique (campaign,email), counts
    const recs = await CampaignRecipient.insertMany(["a@x.com", "B@x.com"].map((email, i) => ({ campaign: doc._id, email, token: `tok${i}`, status: "pending" })));
    assert.equal(recs[1].email, "b@x.com");
    await assert.rejects(CampaignRecipient.insertMany([{ campaign: doc._id, email: "dup@x.com", token: "tok0" }]), (e) => e.code === 11000);
    await assert.rejects(CampaignRecipient.insertMany([{ campaign: doc._id, email: "a@x.com", token: "other" }]), (e) => e.code === 11000);
    const rec = await CampaignRecipient.findOne({ campaign: doc._id, token: "tok1" });
    rec.openedAt = new Date(); rec.opens = (rec.opens || 0) + 1; rec.status = "sent"; await rec.save();
    assert.equal(await CampaignRecipient.countDocuments({ campaign: doc._id, openedAt: { $ne: null } }), 1);
    assert.equal(await CampaignRecipient.countDocuments({ campaign: doc._id, status: { $in: ["sent", "bounced", "unsubscribed"] } }), 1);
    await CampaignRecipient.findOneAndUpdate({ campaign: doc._id, token: "tok0" }, { status: "bounced", bouncedAt: new Date(), error: "x" });
    assert.equal((await CampaignRecipient.findOne({ token: "tok0" })).status, "bounced");
    const evs = await CampaignRecipient.find({ campaign: { $in: [doc._id] } }).sort({ lastEventAt: -1, updatedAt: -1 }).limit(500).lean();
    assert.equal(evs.length, 2);
    assert.equal((await CampaignRecipient.deleteMany({ campaign: doc._id })).deletedCount, 2);
  });
});

test("templates: blocks, owner filters, $ne null", async () => {
  const t = "2".repeat(24);
  await inTenant(t, async () => {
    const tpl = await Template.create({
      name: "Newsletter", createdBy: "9".repeat(24),
      blocks: [{ type: "heading", content: "Hi" }, { type: "weird", align: "up", imageData: "data:image/png;base64,AAA" }],
    });
    assert.equal(tpl.blocks[1].type, "text");
    assert.equal(tpl.blocks[1].align, "left");
    assert.equal(tpl.blocks[1].height, "");
    const lean = await Template.findOne({ _id: tpl._id, $or: [{ createdBy: "9".repeat(24) }, { createdBy: null }] }).lean();
    assert.equal(lean.blocks.length, 2);
    await Template.create({ name: "No owner" });
    assert.equal((await Template.find({ createdBy: { $ne: null } }).sort({ updatedAt: -1 }).lean()).length, 1);
    const upd = await Template.findOneAndUpdate({ _id: tpl._id }, { name: "Renamed", blocks: [] }, { new: true, runValidators: true }).lean();
    assert.equal(upd.name, "Renamed");
    assert.deepEqual(upd.blocks, []);
    assert.ok((await Template.findOneAndDelete({ _id: tpl._id }))._id);
    assert.equal(await Template.countDocuments(), 1);
  });
});

test("notifications: updateMany with $or/$exists, mark read, seed cleanup", async () => {
  const t = "3".repeat(24);
  const me = "4".repeat(24);
  await inTenant(t, async () => {
    await Notification.insertMany([
      { title: "n1", desc: "d", recipient: me },
      { title: "n2", desc: "d", recipient: me, read: true, isRead: true },
      { title: "seed", desc: "d", recipient: me, isSeedData: true },
    ], { timestamps: false });
    await Notification.updateMany(
      { recipient: me, $or: [{ read: false }, { read: { $exists: false } }, { isRead: false }, { isRead: { $exists: false } }] },
      { read: true, isRead: true }
    );
    assert.equal(await Notification.countDocuments({ read: false }), 0);
    await Notification.findOneAndUpdate({ _id: (await Notification.findOne({ title: "n1" }))._id, recipient: me }, { read: true, isRead: true });
    assert.equal((await Notification.deleteMany({ isSeedData: true })).deletedCount, 1);
    assert.equal((await Notification.find({ recipient: me }).sort({ createdAt: -1 }).lean()).length, 2);
    const n = await Notification.create({ type: "campaign", title: "t", desc: "x", time: "Just now", recipient: me });
    assert.equal(n.read, false);
    await assert.rejects(Notification.create({ type: "nope", title: "t", desc: "x" }), (e) => e.name === "ValidationError");
  });
});

test("automations: nested subdoc, array push + save, tasks unique + due query", async () => {
  const t = "5".repeat(24);
  await inTenant(t, async () => {
    const c = await Contact.create({ name: "C", email: "c@x.com" });
    const wf = await Automation.create({ name: "Welcome", trigger: "New contact added", action: "Send welcome email" });
    assert.deepEqual(wf.lastTriggeredContact, { name: "", email: "" });
    assert.deepEqual(wf.firedForContacts, []);
    const doc = await Automation.findById(wf._id);
    doc.firedForContacts.push(c._id);
    doc.runs = (doc.runs || 0) + 1;
    doc.lastTriggeredAt = new Date();
    doc.lastTriggeredContact = { name: c.name, email: c.email };
    await doc.save();
    const back = await Automation.findById(wf._id).lean();
    assert.deepEqual(back.firedForContacts, [String(c._id)]);
    assert.equal(back.lastTriggeredContact.email, "c@x.com");
    assert.equal((await Automation.find({ trigger: "New contact added", active: true })).length, 1);
    await assert.rejects(Automation.create({ name: "bad", trigger: "nope", action: "Notify manager" }), (e) => e.name === "ValidationError");

    const past = new Date(Date.now() - 1000);
    const task = await AutomationTask.create({ automation: wf._id, contact: c._id, dueAt: past });
    await assert.rejects(AutomationTask.create({ automation: wf._id, contact: c._id, dueAt: past }), (e) => e.code === 11000);
    const due = await AutomationTask.find({ status: "pending", dueAt: { $lte: new Date() } }).limit(200);
    assert.equal(due.length, 1);
    due[0].status = "completed"; due[0].result = "ok"; await due[0].save();
    assert.equal((await AutomationTask.findById(task._id)).status, "completed");
    assert.equal((await Automation.findByIdAndDelete(wf._id))._id, wf._id);
    assert.equal(await Automation.findById(wf._id), null);
  });
});

test("OTP (5 min TTL), payments, activity log", async () => {
  await OTP.deleteMany({ email: "o@x.com" });
  const rec = await OTP.create({ email: "O@x.com", otp: "hash", attempts: 0 });
  assert.equal((await OTP.findOne({ email: "o@x.com" }))._id, rec._id);
  rec.attempts += 1; await rec.save();
  assert.equal((await OTP.findOne({ email: "o@x.com" })).attempts, 1);
  await OTP.create({ email: "old@x.com", otp: "h", createdAt: new Date(Date.now() - 6 * 60 * 1000) });
  assert.equal(await OTP.findOne({ email: "old@x.com" }), null); // expired => gone
  await OTP.deleteOne({ _id: rec._id });
  assert.equal(await OTP.findOne({ email: "o@x.com" }), null);

  const user = await User.create({ name: "Pay", email: "pay@x.com", password: "p" });
  const pay = await Payment.create({ user: user._id, planName: "Pro", amount: 99900, razorpayOrderId: "order_1" });
  assert.deepEqual(pay.webhookEventIds, []);
  await assert.rejects(Payment.create({ user: user._id, planName: "Pro", amount: 1, razorpayOrderId: "order_1" }), (e) => e.code === 11000);
  const p = await Payment.findOne({ razorpayOrderId: "order_1", user: user._id });
  p.status = "paid"; p.razorpayPaymentId = "pay_1"; p.webhookEventIds.push("evt1"); await p.save();
  const p2 = await Payment.findOne({ razorpayOrderId: "order_1" }).lean();
  assert.equal(p2.status, "paid");
  assert.deepEqual(p2.webhookEventIds, ["evt1"]);

  await ActivityLog.create({ action: "a", entityType: "User", entityId: user._id, actor: user._id, message: "m", metadata: { x: 1 } });
  const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(100).populate("actor", "name email role").lean();
  assert.equal(logs[0].actor.email, "pay@x.com");
  assert.deepEqual(logs[0].metadata, { x: 1 });
  assert.equal(await ActivityLog.create({ action: "n", entityType: "System", entityId: null }).then((l) => l.entityId), null);
});
