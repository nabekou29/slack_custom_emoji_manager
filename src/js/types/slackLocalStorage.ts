/**
 * Slackで保存されているLocalStorage
 */
export type SlackLocalStorageData = {
  lastActiveTeamId: string;
  orderedTeamIds: string[];
  teams: {
    [key: string]: SlackLocalStorageDataTeam;
  };
};

export type SlackLocalStorageDataTeam = {
  id: string;
  name: string;
  url: string;
};
