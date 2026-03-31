const ALL_BLOCKS = ['A', 'C', 'PG'];

const normalizeBlock = (block) => {
  const value = String(block || '').trim().toUpperCase();
  if (value === 'T') return 'PG';
  return value;
};

const getManagedBlocks = (warden = {}) => {
  const role = String(warden.role || '').toUpperCase();
  const assignedBlock = normalizeBlock(warden.assignedBlock);
  const email = String(warden.email || '').toLowerCase();

  if (Array.isArray(warden.managedBlocks) && warden.managedBlocks.length > 0) {
    return [...new Set(warden.managedBlocks.map(normalizeBlock).filter(Boolean))];
  }

  if (role === 'CHIEF_WARDEN' || assignedBlock === 'ALL') {
    return [...ALL_BLOCKS];
  }

  if (assignedBlock === 'A') return ['A'];

  // As requested: PG warden handles both C block and PG hostel.
  if (assignedBlock === 'PG') return ['C', 'PG'];

  // Backward compatibility for existing C-block warden login.
  if (assignedBlock === 'C' && (email.includes('wardenc') || email.includes('wardenpg'))) {
    return ['C', 'PG'];
  }

  if (assignedBlock === 'C') return ['C'];

  return [];
};

const canAccessBlock = (warden = {}, block) => {
  const normalizedBlock = normalizeBlock(block);
  const managedBlocks = getManagedBlocks(warden);
  return managedBlocks.includes(normalizedBlock);
};

module.exports = {
  ALL_BLOCKS,
  normalizeBlock,
  getManagedBlocks,
  canAccessBlock
};
