import type { Pagination } from '@/types';
import type { ActivityFilters, ActivityList, Member, MemberCredentials, MemberDetails, MemberInput, MemberStatus, Permissions, TeamOptions, TeamOverview } from '@/types/team';
import { request } from './api';

export interface MemberPatch {
  name?: string;
  phone?: string;
  title?: string;
  preset?: string;
  permissions?: Permissions;
  isActive?: boolean;
}

export const getTeamOptions = () => request<TeamOptions>('/admin/team/options');

export const getTeamOverview = () => request<TeamOverview>('/admin/team/overview');

export const listTeam = async (params: { q: string; status: MemberStatus | ''; preset: string; sort: string }) =>
  (await request<{ admins: Member[] }>('/admin/team', { query: { q: params.q, status: params.status, preset: params.preset, sort: params.sort } })).admins;

export const getMember = (id: string) => request<MemberDetails>(`/admin/team/${id}`);

export const createMember = (input: MemberInput) => request<MemberCredentials>('/admin/team', { method: 'POST', body: input });

export const updateMember = async (id: string, patch: MemberPatch) => (await request<{ admin: Member }>(`/admin/team/${id}`, { method: 'PATCH', body: patch })).admin;

export const resetMemberPassword = (id: string) => request<MemberCredentials>(`/admin/team/${id}/reset-password`, { method: 'POST' });

export const emailMemberCredentials = (id: string, password: string) => request<{ sent: boolean }>(`/admin/team/${id}/email-credentials`, { method: 'POST', body: { password } });

export const signOutMember = (id: string) => request<{ admin: Member }>(`/admin/team/${id}/sign-out`, { method: 'POST' });

export const removeMember = (id: string) => request<{ deleted: boolean }>(`/admin/team/${id}`, { method: 'DELETE' });

export const listActivity = (filters: ActivityFilters, page: number, limit: number) =>
  request<ActivityList & { pagination: Pagination }>('/admin/team/activity', {
    query: { admin: filters.admin, module: filters.module, outcome: filters.outcome, type: filters.type, q: filters.q, from: filters.from, to: filters.to, page, limit },
  });