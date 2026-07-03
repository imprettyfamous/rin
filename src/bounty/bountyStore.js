const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "../../data/bounties.json");

function ensureStore() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(
      DATA_PATH,
      JSON.stringify({ nextId: 1, bounties: [] }, null, 2)
    );
  }
}

function loadBounties() {
  ensureStore();
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
}

function saveBounties(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function createPendingBounty({ submitterId, target, reason, reward, requestedKills }) {
  const data = loadBounties();

  const bounty = {
    id: data.nextId++,
    status: "pending",
    submitterId,
    target,
    reason,
    reward: reward || "No reward listed",
    requestedKills,
    completedKills: 0,
    createdAt: Date.now(),
    approvedAt: null,
    bountyMessageId: null,
    killLog: [],
  };

  data.bounties.push(bounty);
  saveBounties(data);

  return bounty;
}

function getBounty(id) {
  const data = loadBounties();
  return data.bounties.find(bounty => bounty.id === Number(id));
}

function updateBounty(id, updater) {
  const data = loadBounties();
  const bounty = data.bounties.find(b => b.id === Number(id));

  if (!bounty) return null;

  updater(bounty);
  saveBounties(data);

  return bounty;
}

function approveBounty(id, messageId) {
  return updateBounty(id, bounty => {
    bounty.status = "active";
    bounty.approvedAt = Date.now();
    bounty.bountyMessageId = messageId || bounty.bountyMessageId;
  });
}

function rejectBounty(id) {
  return updateBounty(id, bounty => {
    bounty.status = "rejected";
  });
}

function addKill(id, { hunterId, proof, notes }) {
  return updateBounty(id, bounty => {
    bounty.completedKills += 1;

    bounty.killLog.push({
      hunterId,
      proof,
      notes: notes || "",
      submittedAt: Date.now(),
    });

    if (bounty.completedKills >= bounty.requestedKills) {
      bounty.status = "completed";
      bounty.completedAt = Date.now();
    }
  });
}

module.exports = {
  loadBounties,
  saveBounties,
  createPendingBounty,
  getBounty,
  updateBounty,
  approveBounty,
  rejectBounty,
  addKill,
};