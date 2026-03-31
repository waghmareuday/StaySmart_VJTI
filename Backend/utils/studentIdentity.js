const normalizeStudentId = (value) => String(value || '').trim().toUpperCase();

const parseNumericStudentId = (value) => {
  const normalized = normalizeStudentId(value);
  if (!normalized) return null;

  const direct = Number(normalized);
  if (Number.isFinite(direct)) {
    return direct;
  }

  const trailing = normalized.match(/(\d+)$/);
  if (!trailing) {
    return null;
  }

  const parsed = Number(trailing[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

const getAuthStudentId = (req) => {
  const fromCollegeId = normalizeStudentId(req?.user?.collegeId);
  if (fromCollegeId) return fromCollegeId;

  return normalizeStudentId(req?.user?.studentId);
};

const isOwnedStudentId = (authStudentId, candidateId) => {
  const normalizedAuth = normalizeStudentId(authStudentId);
  const normalizedCandidate = normalizeStudentId(candidateId);

  if (!normalizedAuth || !normalizedCandidate) {
    return false;
  }

  if (normalizedAuth === normalizedCandidate) {
    return true;
  }

  const authNumeric = parseNumericStudentId(normalizedAuth);
  const candidateNumeric = parseNumericStudentId(normalizedCandidate);

  return authNumeric != null && candidateNumeric != null && authNumeric === candidateNumeric;
};

const getOwnedIdClause = (fieldName, authStudentId) => {
  const normalizedAuth = normalizeStudentId(authStudentId);
  if (!normalizedAuth) return null;

  const numeric = parseNumericStudentId(normalizedAuth);
  if (numeric == null) {
    return { [fieldName]: normalizedAuth };
  }

  return {
    $or: [
      { [fieldName]: normalizedAuth },
      { [fieldName]: { $regex: `(^|\\D)${numeric}$`, $options: 'i' } }
    ]
  };
};

const getOwnedStudentMatchQuery = (authStudentId) => getOwnedIdClause('studentId', authStudentId);

module.exports = {
  normalizeStudentId,
  parseNumericStudentId,
  getAuthStudentId,
  isOwnedStudentId,
  getOwnedIdClause,
  getOwnedStudentMatchQuery
};