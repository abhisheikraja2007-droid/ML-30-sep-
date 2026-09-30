import { MOCK_SOURCE1_ENTITIES, MOCK_CANDIDATES } from '../data/mockEntities';

export const entityService = {
  // Get list of entities with optional filter/search (Live backend -> Fallback to mock)
  getEntities: async (query = '', countryFilter = 'ALL', statusFilter = 'ALL') => {
    try {
      const url = `/api/entities?limit=50&query=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          let list = data.items;
          if (countryFilter !== 'ALL') {
            list = list.filter(i => i.country.toLowerCase() === countryFilter.toLowerCase());
          }
          if (statusFilter !== 'ALL') {
            list = list.filter(i => i.status.toLowerCase() === statusFilter.toLowerCase());
          }
          return list;
        }
      }
    } catch (err) {
      console.warn('Backend unavailable, using mock entities:', err);
    }

    await new Promise(res => setTimeout(res, 200));
    let filtered = [...MOCK_SOURCE1_ENTITIES];

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.entity_id.toLowerCase().includes(q) ||
        item.business_name.toLowerCase().includes(q) ||
        item.business_address.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q)
      );
    }

    if (countryFilter !== 'ALL') {
      filtered = filtered.filter(item => item.country.toLowerCase() === countryFilter.toLowerCase());
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(item => item.status.toLowerCase() === statusFilter.toLowerCase());
    }

    return filtered;
  },

  // Get a single entity details by ID
  getEntityById: async (source1Id) => {
    try {
      const res = await fetch(`/api/entities/${encodeURIComponent(source1Id)}`);
      if (res.ok) {
        const data = await res.json();
        return data.entity;
      }
    } catch (err) {
      console.warn('Backend unavailable, using mock entity:', err);
    }

    await new Promise(res => setTimeout(res, 150));
    const entity = MOCK_SOURCE1_ENTITIES.find(e => e.entity_id.toUpperCase() === source1Id.toUpperCase());
    if (!entity) {
      // Create a fallback entity object so navigation works smoothly
      return {
        entity_id: source1Id,
        business_name: `Company Record #${source1Id}`,
        business_address: 'United Kingdom Registered Office',
        country: 'United Kingdom',
        industry: 'Commercial Entity',
        status: 'Canonical'
      };
    }
    return entity;
  },

  // Get candidates for a given Source 1 ID via AI model
  getCandidatesForEntity: async (source1Id) => {
    try {
      const res = await fetch(`/api/entities/${encodeURIComponent(source1Id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.resolution && data.resolution.candidates) {
          return data.resolution.candidates.map(c => ({
            candidate_id: c.candidate_id,
            business_name: c.company_name,
            business_address: `${c.post_town} ${c.postcode}`.trim() || c.serialized_text,
            country: 'United Kingdom',
            source: 'Companies House Registry',
            faiss_cosine_score: c.faiss_cosine_score,
            cross_encoder_confidence: c.cross_encoder_confidence,
            confidence_level: c.confidence_level,
            decision: c.decision,
            unified_entity_id: c.unified_entity_id,
            cluster_size: c.cluster_size
          }));
        }
      }
    } catch (err) {
      console.warn('Backend unavailable, using mock candidates:', err);
    }

    await new Promise(res => setTimeout(res, 200));
    const normalizedId = source1Id.toUpperCase();
    return MOCK_CANDIDATES[normalizedId] || [];
  },

  // Real-time custom resolution API call
  resolveCustomQuery: async ({ name, address = '', town = '', zip_code = '', threshold = 0.85 }) => {
    const res = await fetch('/api/resolve_candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, address, town, zip_code, threshold })
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`);
    }
    return await res.json();
  },

  // Get single candidate comparison breakdown
  getComparison: async (source1Id, candidateId) => {
    try {
      const res = await fetch(`/api/entities/${encodeURIComponent(source1Id)}`);
      if (res.ok) {
        const data = await res.json();
        const cand = (data.resolution?.candidates || []).find(c => c.candidate_id === candidateId);
        if (cand) {
          return {
            source1: data.entity,
            candidate: {
              candidate_id: cand.candidate_id,
              business_name: cand.company_name,
              business_address: `${cand.post_town} ${cand.postcode}`.trim() || cand.serialized_text,
              country: 'United Kingdom',
              source: 'Companies House Registry',
              confidence_level: cand.confidence_level,
              decision: cand.decision,
              cross_encoder_confidence: cand.cross_encoder_confidence,
              faiss_cosine_score: cand.faiss_cosine_score
            }
          };
        }
      }
    } catch (err) {
      console.warn('Backend comparison failed, using mock:', err);
    }

    await new Promise(res => setTimeout(res, 250));
    const normalizedS1 = source1Id.toUpperCase();
    const normalizedCand = candidateId.toUpperCase();

    const entity = MOCK_SOURCE1_ENTITIES.find(e => e.entity_id.toUpperCase() === normalizedS1);
    const candidates = MOCK_CANDIDATES[normalizedS1] || [];
    const candidate = candidates.find(c => c.candidate_id.toUpperCase() === normalizedCand);

    return {
      source1: entity || { entity_id: source1Id, business_name: source1Id },
      candidate: candidate || { candidate_id: candidateId, business_name: candidateId }
    };
  }
};
