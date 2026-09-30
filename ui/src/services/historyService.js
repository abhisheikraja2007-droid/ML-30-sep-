import { MOCK_HISTORY_LOGS } from '../data/mockHistory';

let localLogs = [...MOCK_HISTORY_LOGS];

export const historyService = {
  getLogs: async () => {
    await new Promise(res => setTimeout(res, 250));
    return [...localLogs];
  },

  addLog: async (action, category, source1_id = 'GLOBAL', details = '', status = 'Completed') => {
    const newLog = {
      id: `act_${Date.now().toString().slice(-4)}`,
      action,
      category,
      source1_id,
      details,
      timestamp: new Date().toLocaleString(),
      status
    };
    localLogs = [newLog, ...localLogs];
    return newLog;
  }
};
