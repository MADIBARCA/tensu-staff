import { axiosRequest } from './axiosApis';
import { ENDPOINTS } from './endpoints';
import type { CreateClubRequest, CreateGroupRequest, CreateSectionRequest, CreateStaffRequest, CreateStuffInvitationRequest, UpdateStaffRequest } from './requests';
import type { CreateClubResponse, CreateSectionResponse, CreateStaffResponse, GetClubsLimitCheckResponse, GetMyClubsResponse, GetMyInvitationsResponse, GetSectionGroupsResponse, GetMySectionsResponse, GetTeamMembersResponse, CreateGroupResponse } from './responses';

export const staffApi = {
    getList: (token: string) =>
        axiosRequest<CreateStaffResponse[]>(ENDPOINTS.STUFF.BASE, 'GET', token),

    getById: (userId: string, token: string) =>
        axiosRequest<CreateStaffResponse>(ENDPOINTS.STUFF.BY_ID(userId), 'GET', token),

    getMe: (token: string | null) =>
        axiosRequest<CreateStaffResponse>(ENDPOINTS.STUFF.ME, 'GET', token),

    updateMe: (data: UpdateStaffRequest, token: string) =>
        axiosRequest<CreateStaffResponse>(ENDPOINTS.STUFF.ME, 'PUT', token, data),

    create: (data: CreateStaffRequest, token: string) =>
        axiosRequest<CreateStaffResponse>(ENDPOINTS.STUFF.BASE, 'POST', token, data),

    updatePrefs: (prefs: unknown, token: string) =>
        axiosRequest<unknown>(ENDPOINTS.STUFF.PREFERENCES, 'PUT', token, prefs),

    getPref: (tgId: string, key: string, token: string) =>
        axiosRequest<unknown>(ENDPOINTS.STUFF.PREFERENCE(tgId, key), 'GET', token),
};

export const clubsApi = {
    getLimitsCheck: (token: string) =>
        axiosRequest<GetClubsLimitCheckResponse>(ENDPOINTS.CLUBS.LIMITS_CHECK, 'GET', token),
    getList: (token: string) => axiosRequest(ENDPOINTS.CLUBS.BASE, 'GET', token),
    getMy: (token: string) => axiosRequest<GetMyClubsResponse>(ENDPOINTS.CLUBS.MY, 'GET', token),
    getById: (id: string, token: string) =>
        axiosRequest(ENDPOINTS.CLUBS.BY_ID(id), 'GET', token),
    create: (data: CreateClubRequest, token: string) =>
        axiosRequest<CreateClubResponse>(ENDPOINTS.CLUBS.BASE, 'POST', token, data),
    update: (id: string, data: unknown, token: string) =>
        axiosRequest(ENDPOINTS.CLUBS.UPDATE(id), 'PUT', token, data),
    delete: (id: string, token: string) =>
        axiosRequest<void>(ENDPOINTS.CLUBS.BY_ID(id), 'DELETE', token),
    checkPerm: (id: string, token: string) =>
        axiosRequest<boolean>(ENDPOINTS.CLUBS.CHECK_PERMISSION(id), 'GET', token),
};

export const sectionsApi = {
    getMy: (token: string) =>
        axiosRequest<GetMySectionsResponse>(ENDPOINTS.SECTIONS.MY, 'GET', token),
    getByClubId: (clubId: number, token: string) =>
        axiosRequest<GetMySectionsResponse>(ENDPOINTS.SECTIONS.CLUB(clubId), 'GET', token),
    create: (data: CreateSectionRequest, token: string) =>
        axiosRequest<CreateSectionResponse>(ENDPOINTS.SECTIONS.BASE, 'POST', token, data),
    delete: (id: number, token: string) =>
        axiosRequest(ENDPOINTS.SECTIONS.BY_ID(id), 'DELETE', token),
    updateById: (data: CreateSectionRequest, id: number, token: string) =>
        axiosRequest<CreateSectionResponse>(ENDPOINTS.SECTIONS.BY_ID(id), 'PUT', token, data)
};

export const groupsApi = {
    create: (data: CreateGroupRequest, token: string) =>
        axiosRequest(ENDPOINTS.GROUPS.BASE, 'POST', token, data),
    getBySectionId: (id: number | undefined, token: string) =>
        axiosRequest<GetSectionGroupsResponse>(ENDPOINTS.GROUPS.BY_SECTION_ID(id), 'GET', token),
    updateById: (data: CreateGroupRequest, id: number, token: string) =>
        axiosRequest<CreateGroupResponse>(ENDPOINTS.GROUPS.BY_ID(id), 'PUT', token, data),
    deleteById: (id: number | undefined, token: string) =>
        axiosRequest<CreateGroupResponse>(ENDPOINTS.GROUPS.BY_ID(id), 'DELETE', token)
}

export const invitationsApi = {
    create: (clubId: string, data: CreateStuffInvitationRequest, token: string) =>
        axiosRequest(ENDPOINTS.INVITATIONS.CREATE(clubId), 'POST', token, data),
    accept: (id: number, token: string) =>
        axiosRequest(ENDPOINTS.INVITATIONS.ACCEPT(id), 'POST', token),
    decline: (id: number, token: string) =>
        axiosRequest(ENDPOINTS.INVITATIONS.DECLINE(id), 'POST', token),
    getMy: (token: string) =>
        axiosRequest<GetMyInvitationsResponse>(
            ENDPOINTS.INVITATIONS.MY,
            'GET',
            token
        ),
    getMyPending: (token: string) =>
        axiosRequest<GetMyInvitationsResponse>(
            ENDPOINTS.INVITATIONS.MY_PENDING,
            'GET',
            token
        ),
    getById: (id: string, token: string) =>
        axiosRequest(ENDPOINTS.INVITATIONS.BY_ID(id), 'GET', token),
    delete: (id: string, token: string) =>
        axiosRequest<void>(ENDPOINTS.INVITATIONS.DELETE(id), 'DELETE', token),
    statsMy: (token: string) =>
        axiosRequest(ENDPOINTS.INVITATIONS.STATS_MY, 'GET', token),
}

export const teamApi = {
    get: (token: string) =>
        axiosRequest<GetTeamMembersResponse>(
            ENDPOINTS.TEAM.BASE,
            'GET',
            token
        ),
}