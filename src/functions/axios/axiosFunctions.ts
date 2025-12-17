import { axiosRequest } from './axiosApis';
import { ENDPOINTS } from './endpoints';
import type { 
  CancelLessonRequest, 
  CompleteLessonRequest, 
  CreateClubRequest, 
  CreateGroupRequest, 
  CreateManualLessonRequest, 
  CreateSectionRequest, 
  CreateStaffRequest, 
  CreateStuffInvitationRequest, 
  GenerateLessonsRequest, 
  RescheduleLessonRequest, 
  UpdateGroupScheduleTemplateRequest, 
  UpdateLessonRequest, 
  UpdateStaffRequest,
  UpdateStudentRequest,
  UpdateClubRequest,
  CreateTariffRequest,
  UpdateTariffRequest
} from './requests';
import type { 
  CreateClubResponse, 
  CreateSectionResponse, 
  CreateStaffResponse, 
  GetClubsLimitCheckResponse, 
  GetMyClubsResponse, 
  GetMyInvitationsResponse, 
  GetSectionGroupsResponse, 
  GetMySectionsResponse, 
  GetTeamMembersResponse, 
  CreateGroupResponse, 
  CreateManualLessonResponse, 
  GetDayScheduleResponse, 
  GetGroupScheduleTemplateResponse, 
  GetLessonsResponse, 
  GetWeekScheduleResponse, 
  Lesson, 
  GetStudentsListResponse,
  StudentResponse,
  SessionResponse,
  ClubLocationResponse,
  TariffResponse,
  TariffListResponse,
  StaffStudentResponse,
  StaffStudentsListResponse,
  StudentAttendanceListResponse,
  StudentAttendanceStatsResponse,
  StudentPaymentListResponse,
  StudentPaymentStatsResponse,
  ClubAnalyticsResponse,
  DashboardSummaryResponse
} from './responses';

// Staff API
export const staffApi = {
  getList: (token: string) =>
    axiosRequest<CreateStaffResponse[]>(ENDPOINTS.STAFF.BASE, 'GET', token),

  getById: (userId: string, token: string) =>
    axiosRequest<CreateStaffResponse>(ENDPOINTS.STAFF.BY_ID(userId), 'GET', token),

  getMe: (token: string | null) =>
    axiosRequest<CreateStaffResponse>(ENDPOINTS.STAFF.ME, 'GET', token),

  updateMe: (data: UpdateStaffRequest, token: string) =>
    axiosRequest<CreateStaffResponse>(ENDPOINTS.STAFF.ME, 'PUT', token, data),

  create: (data: CreateStaffRequest, token: string) =>
    axiosRequest<CreateStaffResponse>(ENDPOINTS.STAFF.BASE, 'POST', token, data),

  updatePrefs: (prefs: unknown, token: string) =>
    axiosRequest<unknown>(ENDPOINTS.STAFF.PREFERENCES, 'PUT', token, prefs),

  getPref: (tgId: string, key: string, token: string) =>
    axiosRequest<unknown>(ENDPOINTS.STAFF.PREFERENCE(tgId, key), 'GET', token),
};

// Students API
export const studentsApi = {
  getList: (token: string) =>
    axiosRequest<GetStudentsListResponse>(ENDPOINTS.STUDENTS.BASE, 'GET', token),

  getMe: (token: string | null) =>
    axiosRequest<StudentResponse>(ENDPOINTS.STUDENTS.BASE + 'me', 'GET', token),

  updateMe: (data: UpdateStudentRequest, token: string) =>
    axiosRequest<StudentResponse>(ENDPOINTS.STUDENTS.BASE + 'me', 'PUT', token, data),

  getById: (userId: string, token: string) =>
    axiosRequest<StudentResponse>(ENDPOINTS.STUDENTS.BY_ID(userId), 'GET', token),

  updatePrefs: (prefs: unknown, token: string) =>
    axiosRequest<unknown>(ENDPOINTS.STUDENTS.PREFERENCES, 'PUT', token, prefs),

  getPref: (tgId: string, key: string, token: string) =>
    axiosRequest<unknown>(ENDPOINTS.STUDENTS.PREFERENCE(tgId, key), 'GET', token),
};

// Clubs API
export const clubsApi = {
  getLimitsCheck: (token: string) =>
    axiosRequest<GetClubsLimitCheckResponse>(ENDPOINTS.CLUBS.LIMITS_CHECK, 'GET', token),
  
  getList: (token: string) => 
    axiosRequest(ENDPOINTS.CLUBS.BASE, 'GET', token),
  
  getMy: (token: string) => 
    axiosRequest<GetMyClubsResponse>(ENDPOINTS.CLUBS.MY, 'GET', token),
  
  getById: (id: string, token: string) =>
    axiosRequest(ENDPOINTS.CLUBS.BY_ID(id), 'GET', token),
  
  create: (data: CreateClubRequest, token: string) =>
    axiosRequest<CreateClubResponse>(ENDPOINTS.CLUBS.BASE, 'POST', token, data),
  
  update: (id: string, data: UpdateClubRequest, token: string) =>
    axiosRequest<CreateClubResponse>(ENDPOINTS.CLUBS.UPDATE(id), 'PUT', token, data),
  
  delete: (id: string, token: string) =>
    axiosRequest<void>(ENDPOINTS.CLUBS.BY_ID(id), 'DELETE', token),
  
  checkPerm: (id: string, token: string) =>
    axiosRequest<boolean>(ENDPOINTS.CLUBS.CHECK_PERMISSION(id), 'GET', token),

  getNearest: (latitude: number, longitude: number, token: string | null) =>
    axiosRequest<ClubLocationResponse>(
      `${ENDPOINTS.CLUBS.BASE}nearest?lat=${latitude}&lon=${longitude}`,
      'GET',
      token
    ),
};

// Sections API
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

// Groups API
export const groupsApi = {
  create: (data: CreateGroupRequest, token: string) =>
    axiosRequest<CreateGroupResponse>(ENDPOINTS.GROUPS.BASE, 'POST', token, data),
  
  getBySectionId: (id: number | undefined, token: string) =>
    axiosRequest<GetSectionGroupsResponse>(ENDPOINTS.GROUPS.BY_SECTION_ID(id), 'GET', token),
  
  getMy: (token: string | null) =>
    axiosRequest<GetSectionGroupsResponse>(ENDPOINTS.GROUPS.MY, 'GET', token),
  
  updateById: (data: CreateGroupRequest, id: number, token: string) =>
    axiosRequest<CreateGroupResponse>(ENDPOINTS.GROUPS.BY_ID(id), 'PUT', token, data),
  
  deleteById: (id: number | undefined, token: string) =>
    axiosRequest<CreateGroupResponse>(ENDPOINTS.GROUPS.BY_ID(id), 'DELETE', token)
};

// Invitations API
export const invitationsApi = {
  create: (clubId: string, data: CreateStuffInvitationRequest, token: string) =>
    axiosRequest(ENDPOINTS.INVITATIONS.CREATE(clubId), 'POST', token, data),
  
  accept: (id: number, token: string) =>
    axiosRequest(ENDPOINTS.INVITATIONS.ACCEPT(id), 'POST', token, {}),
  
  decline: (id: number, token: string) =>
    axiosRequest(ENDPOINTS.INVITATIONS.DECLINE(id), 'POST', token, {}),
  
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
  
  getByClub: (clubId: string, token: string) =>
    axiosRequest<GetMyInvitationsResponse>(
      ENDPOINTS.INVITATIONS.CLUB(clubId),
      'GET',
      token
    ),
  
  getById: (id: string, token: string) =>
    axiosRequest(ENDPOINTS.INVITATIONS.BY_ID(id), 'GET', token),
  
  delete: (id: string, token: string) =>
    axiosRequest<void>(ENDPOINTS.INVITATIONS.DELETE(id), 'DELETE', token),
  
  statsMy: (token: string) =>
    axiosRequest(ENDPOINTS.INVITATIONS.STATS_MY, 'GET', token),
};

// Team API
export const teamApi = {
  get: (token: string) =>
    axiosRequest<GetTeamMembersResponse>(
      ENDPOINTS.TEAM.BASE,
      'GET',
      token
    ),
  
  getMemberPermissions: (clubId: number, userId: number, token: string) =>
    axiosRequest<{
      current_user_role: string;
      target_user_role: string;
      can_delete: boolean;
      can_change_role: boolean;
    }>(ENDPOINTS.TEAM.MEMBER_PERMISSIONS(clubId, userId), 'GET', token),
  
  removeMember: (clubId: number, userId: number, token: string) =>
    axiosRequest<{
      success: boolean;
      message: string;
      removed_user_id: number;
      club_id: number;
    }>(ENDPOINTS.TEAM.REMOVE_MEMBER(clubId, userId), 'DELETE', token),
  
  changeRole: (clubId: number, userId: number, newRole: string, token: string) =>
    axiosRequest<{
      success: boolean;
      message: string;
      user_id: number;
      club_id: number;
      new_role: string;
      old_role: string;
    }>(ENDPOINTS.TEAM.CHANGE_ROLE(clubId, userId), 'PUT', token, { new_role: newRole }),
};

// Schedule API
export const scheduleApi = {
  getGroupTemplate: (groupId: string | number, token: string) =>
    axiosRequest<GetGroupScheduleTemplateResponse>(ENDPOINTS.SCHEDULE.TEMPLATE.GET(groupId), 'GET', token),

  updateGroupTemplate: (groupId: string | number, data: UpdateGroupScheduleTemplateRequest, token: string) =>
    axiosRequest<void>(ENDPOINTS.SCHEDULE.TEMPLATE.PUT(groupId), 'PUT', token, data),

  generateLessons: (groupId: string | number, data: GenerateLessonsRequest, token: string) =>
    axiosRequest<void>(ENDPOINTS.SCHEDULE.LESSONS.GENERATE_FROM_TEMPLATE(groupId), 'POST', token, data),

  regenerateLessons: (groupId: string | number, data: GenerateLessonsRequest, token: string) =>
    axiosRequest<void>(ENDPOINTS.SCHEDULE.LESSONS.REGENERATE_FOR_PERIOD(groupId), 'POST', token, data),

  createManualLesson: (data: CreateManualLessonRequest, token: string | null) =>
    axiosRequest<CreateManualLessonResponse>(ENDPOINTS.SCHEDULE.LESSONS.CREATE_MANUAL, 'POST', token, data),

  getLessons: (params: {
    page?: number;
    size?: number;
    group_id?: number;
    club_id?: number;
    section_id?: number;
    coach_id?: number;
    date_from?: string;
    date_to?: string;
    status?: string;
  }, token: string) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.size) searchParams.append('size', params.size.toString());
    if (params.group_id) searchParams.append('group_id', params.group_id.toString());
    if (params.club_id) searchParams.append('club_id', params.club_id.toString());
    if (params.section_id) searchParams.append('section_id', params.section_id.toString());
    if (params.coach_id) searchParams.append('coach_id', params.coach_id.toString());
    if (params.date_from) searchParams.append('date_from', params.date_from);
    if (params.date_to) searchParams.append('date_to', params.date_to);
    if (params.status) searchParams.append('status', params.status);
    
    const queryString = searchParams.toString();
    const url = queryString ? `${ENDPOINTS.SCHEDULE.LESSONS.LIST}?${queryString}` : ENDPOINTS.SCHEDULE.LESSONS.LIST;
    return axiosRequest<GetLessonsResponse>(url, 'GET', token);
  },

  getLessonById: (lessonId: number | string, token: string) =>
    axiosRequest<Lesson>(ENDPOINTS.SCHEDULE.LESSONS.GET_BY_ID(lessonId), 'GET', token),

  updateLesson: (lessonId: number | string, data: UpdateLessonRequest, token: string) =>
    axiosRequest<Lesson>(ENDPOINTS.SCHEDULE.LESSONS.UPDATE_BY_ID(lessonId), 'PUT', token, data),

  deleteLesson: (lessonId: number | string, token: string) =>
    axiosRequest<void>(ENDPOINTS.SCHEDULE.LESSONS.DELETE_BY_ID(lessonId), 'DELETE', token),

  rescheduleLesson: (lessonId: number | string, data: RescheduleLessonRequest, token: string) =>
    axiosRequest<void>(ENDPOINTS.SCHEDULE.LESSONS.RESCHEDULE(lessonId), 'POST', token, data),

  cancelLesson: (lessonId: number | string, data: CancelLessonRequest, token: string) =>
    axiosRequest<void>(ENDPOINTS.SCHEDULE.LESSONS.CANCEL(lessonId), 'POST', token, data),

  completeLesson: (lessonId: number | string, data: CompleteLessonRequest, token: string) =>
    axiosRequest<void>(ENDPOINTS.SCHEDULE.LESSONS.COMPLETE(lessonId), 'POST', token, data),

  bulkUpdateLessons: (lessonIds: Array<number>, data: UpdateLessonRequest, token: string) =>
    axiosRequest<void>(ENDPOINTS.SCHEDULE.LESSONS.BULK_UPDATE(lessonIds), 'POST', token, data),

  getDaySchedule: (date: string, token: string) =>
    axiosRequest<GetDayScheduleResponse>(ENDPOINTS.SCHEDULE.CALENDAR.DAY(date), 'GET', token),

  getWeekSchedule: (date: string, token: string | null) =>
    axiosRequest<GetWeekScheduleResponse>(ENDPOINTS.SCHEDULE.CALENDAR.WEEK(date), 'GET', token),
};

// Tariffs API
export const tariffsApi = {
  getList: (token: string, params?: {
    page?: number;
    size?: number;
    club_id?: number;
    payment_type?: string;
    name?: string;
    active_only?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.size) searchParams.append('size', params.size.toString());
    if (params?.club_id) searchParams.append('club_id', params.club_id.toString());
    if (params?.payment_type) searchParams.append('payment_type', params.payment_type);
    if (params?.name) searchParams.append('name', params.name);
    if (params?.active_only !== undefined) searchParams.append('active_only', params.active_only.toString());
    
    const queryString = searchParams.toString();
    const url = queryString ? `${ENDPOINTS.TARIFFS.BASE}?${queryString}` : ENDPOINTS.TARIFFS.BASE;
    return axiosRequest<TariffListResponse>(url, 'GET', token);
  },

  getMy: (token: string) =>
    axiosRequest<TariffResponse[]>(ENDPOINTS.TARIFFS.MY, 'GET', token),

  getById: (tariffId: string | number, token: string) =>
    axiosRequest<TariffResponse>(ENDPOINTS.TARIFFS.BY_ID(tariffId), 'GET', token),

  create: (data: CreateTariffRequest, token: string) =>
    axiosRequest<TariffResponse>(ENDPOINTS.TARIFFS.BASE, 'POST', token, data),

  update: (tariffId: string | number, data: UpdateTariffRequest, token: string) =>
    axiosRequest<TariffResponse>(ENDPOINTS.TARIFFS.BY_ID(tariffId), 'PUT', token, data),

  delete: (tariffId: string | number, token: string) =>
    axiosRequest<void>(ENDPOINTS.TARIFFS.BY_ID(tariffId), 'DELETE', token),

  toggleStatus: (tariffId: string | number, token: string) =>
    axiosRequest<TariffResponse>(ENDPOINTS.TARIFFS.TOGGLE_STATUS(tariffId), 'PATCH', token),
};

// Check-in API (placeholder for future implementation)
export const checkInApi = {
  checkIn: (token: string | null) =>
    axiosRequest<void>('/students/checkin', 'POST', token),
};

// Sessions API (placeholder for future implementation)
export const sessionsApi = {
  getNext: (token: string | null) =>
    axiosRequest<SessionResponse[]>('/students/sessions/next', 'GET', token),
  
  book: (sessionId: number, token: string | null) =>
    axiosRequest<void>(`/students/sessions/${sessionId}/book`, 'POST', token),
};

// Staff Students API - For staff to manage students
export const staffStudentsApi = {
  getList: (params: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    club_id?: number;
    section_id?: number;
    group_ids?: number[];
    coach_ids?: number[];
  }, token: string) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.size) searchParams.append('size', params.size.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.club_id) searchParams.append('club_id', params.club_id.toString());
    if (params.section_id) searchParams.append('section_id', params.section_id.toString());
    if (params.group_ids?.length) searchParams.append('group_ids', params.group_ids.join(','));
    if (params.coach_ids?.length) searchParams.append('coach_ids', params.coach_ids.join(','));
    
    const queryString = searchParams.toString();
    const url = queryString ? `${ENDPOINTS.STAFF_STUDENTS.BASE}?${queryString}` : ENDPOINTS.STAFF_STUDENTS.BASE;
    return axiosRequest<StaffStudentsListResponse>(url, 'GET', token);
  },

  getById: (studentId: string | number, token: string) =>
    axiosRequest<StaffStudentResponse>(ENDPOINTS.STAFF_STUDENTS.BY_ID(studentId), 'GET', token),

  enroll: (data: {
    student_id: number;
    group_id: number;
    tariff_id?: number;
    start_date: string;
    end_date: string;
    price?: number;
    freeze_days_total?: number;
  }, token: string) =>
    axiosRequest<{ message: string; enrollment_id: number }>(ENDPOINTS.STAFF_STUDENTS.ENROLL, 'POST', token, data),

  extend: (data: {
    enrollment_id: number;
    tariff_id: number;
    days: number;
  }, token: string) =>
    axiosRequest<{ message: string; new_end_date: string }>(ENDPOINTS.STAFF_STUDENTS.EXTEND, 'POST', token, data),

  freeze: (data: {
    enrollment_id: number;
    days: number;
    reason?: string;
  }, token: string) =>
    axiosRequest<{ message: string; freeze_end_date: string; new_end_date: string }>(ENDPOINTS.STAFF_STUDENTS.FREEZE, 'POST', token, data),

  unfreeze: (enrollmentId: string | number, token: string) =>
    axiosRequest<{ message: string; status: string; end_date: string }>(ENDPOINTS.STAFF_STUDENTS.UNFREEZE(enrollmentId), 'POST', token),

  // Student attendance history
  getAttendance: (studentId: string | number, params: {
    page?: number;
    size?: number;
    date_from?: string;
    date_to?: string;
  }, token: string) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.size) searchParams.append('size', params.size.toString());
    if (params.date_from) searchParams.append('date_from', params.date_from);
    if (params.date_to) searchParams.append('date_to', params.date_to);
    
    const queryString = searchParams.toString();
    const url = queryString 
      ? `${ENDPOINTS.STAFF_STUDENTS.ATTENDANCE(studentId)}?${queryString}` 
      : ENDPOINTS.STAFF_STUDENTS.ATTENDANCE(studentId);
    return axiosRequest<StudentAttendanceListResponse>(url, 'GET', token);
  },

  getAttendanceStats: (studentId: string | number, token: string) =>
    axiosRequest<StudentAttendanceStatsResponse>(ENDPOINTS.STAFF_STUDENTS.ATTENDANCE_STATS(studentId), 'GET', token),

  // Student payment history
  getPayments: (studentId: string | number, params: {
    page?: number;
    size?: number;
    status?: string;
  }, token: string) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.size) searchParams.append('size', params.size.toString());
    if (params.status) searchParams.append('status', params.status);
    
    const queryString = searchParams.toString();
    const url = queryString 
      ? `${ENDPOINTS.STAFF_STUDENTS.PAYMENTS(studentId)}?${queryString}` 
      : ENDPOINTS.STAFF_STUDENTS.PAYMENTS(studentId);
    return axiosRequest<StudentPaymentListResponse>(url, 'GET', token);
  },

  getPaymentStats: (studentId: string | number, token: string) =>
    axiosRequest<StudentPaymentStatsResponse>(ENDPOINTS.STAFF_STUDENTS.PAYMENTS_STATS(studentId), 'GET', token),
};

// Staff Analytics API
export const analyticsApi = {
  getClubAnalytics: (clubId: string | number, periodDays: number = 30, token: string) => {
    const url = `${ENDPOINTS.STAFF_ANALYTICS.CLUB(clubId)}?period_days=${periodDays}`;
    return axiosRequest<ClubAnalyticsResponse>(url, 'GET', token);
  },

  getDashboard: (token: string) =>
    axiosRequest<DashboardSummaryResponse>(ENDPOINTS.STAFF_ANALYTICS.DASHBOARD, 'GET', token),
};
