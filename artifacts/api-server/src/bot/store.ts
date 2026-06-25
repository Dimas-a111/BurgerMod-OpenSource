export interface ServerConfig {
  countingChannelId?: string;
  joinChannelId?: string;
  leaveChannelId?: string;
  boostChannelId?: string;
  antiNukeLogsId?: string;
  autoRoleId?: string;
  autoRoleBotId?: string;
  antiNuke: boolean;
  antiRaid: boolean;
  antiNsfw: boolean;
  blockedWords: string[];
  tempVoiceCategoryId?: string;
  prefix: string;
  verifyRoleId?: string;
  confessChannelId?: string;
}

export const serverConfigs = new Map<string, ServerConfig>();

export function getConfig(guildId: string): ServerConfig {
  if (!serverConfigs.has(guildId)) {
    serverConfigs.set(guildId, { antiNuke: false, antiRaid: false, antiNsfw: false, blockedWords: [], prefix: "!" });
  }
  return serverConfigs.get(guildId)!;
}

export interface UserXP { xp: number; level: number; lastMessage: number; }
export const xpData = new Map<string, UserXP>();

export function getXP(guildId: string, userId: string): UserXP {
  const key = `${guildId}:${userId}`;
  if (!xpData.has(key)) xpData.set(key, { xp: 0, level: 0, lastMessage: 0 });
  return xpData.get(key)!;
}

export function xpNeeded(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level));
}

export const afkStore = new Map<string, string>(); // userId -> reason
export const birthdays = new Map<string, { month: number; day: number }>(); // userId -> {month,day}

export interface Giveaway {
  channelId: string; messageId: string; prize: string;
  endsAt: number; guildId: string; hostId: string;
}
export const giveaways = new Map<string, Giveaway>(); // giveawayId -> giveaway

export const stay247 = new Set<string>(); // guildIds
export const reactionRoles = new Map<string, { messageId: string; emoji: string; roleId: string }[]>(); // guildId -> list
export const ticketCategories = new Map<string, string>(); // guildId -> categoryId

export interface NotifyConfig { channelId: string; target: string; }
export const notifyYoutube = new Map<string, NotifyConfig>();
export const notifyTwitch = new Map<string, NotifyConfig>();
export const notifyTiktok = new Map<string, NotifyConfig>();
export const notifyTwitter = new Map<string, NotifyConfig>();

export const trackedUsers = new Map<string, { guildId: string; channelId: string; watcherId: string }>(); // targetId -> config
