export const ENDPOINTS = {
  STAFF: {
    BASE: '/staff/',
    BY_ID: (userId: string) => `/staff/${userId}`,
    ME: '/staff/me',
    PREFERENCES: '/staff/preferences',
    PREFERENCE: (telegramId: string, key: string) =>
      `/staff/${telegramId}/preferences/${key}`,
  },

  CLUBS: {
    BASE: '/clubs/',
    MY: '/clubs/my',
    LIMITS_CHECK: '/clubs/limits/check',
    BY_ID: (clubId: string) => `/clubs/${clubId}`,
    UPDATE: (clubId: string) => `/clubs/${clubId}`,
    CHECK_PERMISSION: (clubId: string) => `/clubs/${clubId}/check-permission`,
  },

  STUDENTS: {
    BASE: '/students/',
    BY_ID: (userId: string) => `/students/${userId}`,
    BY_TELEGRAM: (telegramId: string) => `/students/by-telegram-id/${telegramId}`,
    PREFERENCES: '/students/preferences',
    PREFERENCE: (telegramId: string, key: string) =>
      `/students/${telegramId}/preferences/${key}`,
  },

  SECTIONS: {
    BASE: '/sections/',
    CLUB: (clubId: number) => `/sections/club/${clubId}`,
    COACH: (coachId: string) => `/sections/coach/${coachId}`,
    MY: '/sections/my',
    BY_ID: (sId: number) => `/sections/${sId}`,
    TOGGLE: (sId: string) => `/sections/${sId}/toggle-status`,
    STATS: (sId: string) => `/sections/${sId}/stats`,
  },

  GROUPS: {
    BASE: '/groups/',
    MY: '/groups/my',
    BY_SECTION_ID: (sId: number | undefined) => `/groups/section/${sId}`,
    BY_ID: (gId: number | undefined) => `/groups/${gId}`
  },

  INVITATIONS: {
    CREATE: (clubId: string) => `/invitations/club/${clubId}`,
    CLUB: (clubId: string) => `/invitations/club/${clubId}`,
    ACCEPT: (invitationId: number) => `/invitations/${invitationId}/accept`,
    DECLINE: (invitationId: number) => `/invitations/${invitationId}/decline`,
    MY: '/invitations/my',
    MY_PENDING: '/invitations/my-pending',
    BY_ID: (invitationId: string) => `/invitations/${invitationId}`,
    DELETE: (invitationId: string) => `/invitations/${invitationId}`,
    STATS_MY: '/invitations/stats/my',
  },

  TEAM: {
    BASE: '/team/',
  },

  SCHEDULE: {
    TEMPLATE: {
      GET: (groupId: string | number) => `/schedule/groups/${groupId}/template`,
      PUT: (groupId: string | number) => `/schedule/groups/${groupId}/template`,
      PATCH: (groupId: string | number) => `/schedule/groups/${groupId}/template`,
    },
    LESSONS: {
      GENERATE_FROM_TEMPLATE: (groupId: string | number) => `/schedule/groups/${groupId}/generate-lessons`,
      REGENERATE_FOR_PERIOD: (groupId: string | number) => `/schedule/groups/${groupId}/regenerate-lessons`,
      CREATE_MANUAL: '/schedule/lessons',
      LIST: '/schedule/lessons',
      GET_BY_ID: (lessonId: string | number) => `/schedule/lessons/${lessonId}`,
      UPDATE_BY_ID: (lessonId: string | number) => `/schedule/lessons/${lessonId}`,
      DELETE_BY_ID: (lessonId: string | number) => `/schedule/lessons/${lessonId}`,
      RESCHEDULE: (lessonId: string | number) => `/schedule/lessons/${lessonId}/reschedule`,
      CANCEL: (lessonId: string | number) => `/schedule/lessons/${lessonId}/cancel`,
      COMPLETE: (lessonId: string | number) => `/schedule/lessons/${lessonId}/complete`,
      BULK_UPDATE: (lessonIds: Array<number>) => `schedule/lessons/bulk-update/?lesson_ids=${lessonIds}`
    },
    CALENDAR: {
      DAY: (targetDate: string) => `/schedule/calendar/day/${targetDate}`,
      WEEK: (targetDate: string) => `/schedule/calendar/week/${targetDate}`,
    },
    STATS: {
      BY_GROUP: (groupId: string | number) => `/schedule/stats/group/${groupId}`,
      BY_COACH: (coachId: string | number) => `/schedule/stats/coach/${coachId}`,
    }
  },

  TARIFFS: {
    BASE: '/tariffs/',
    MY: '/tariffs/my',
    BY_ID: (tariffId: string | number) => `/tariffs/${tariffId}`,
    TOGGLE_STATUS: (tariffId: string | number) => `/tariffs/${tariffId}/toggle-status`,
  }
} as const;
