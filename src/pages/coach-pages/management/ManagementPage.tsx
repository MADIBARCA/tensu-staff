// ManagementPage.tsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import TabNavigation from "./components/TabNavigation";
import StaffFilter from "./components/StaffFilter";
import AddStaffModal from "./components/AddStaffModal";
import AddSectionModal from "./components/AddSectionModal";
import type { Filters, NewStaff, NewSection, Staff } from "@/types/types";
import { BottomNav } from "@/components/Layout";
import { X } from "lucide-react";
import {
  clubsApi,
  invitationsApi,
  sectionsApi,
  teamApi,
} from "@/functions/axios/axiosFunctions";
import type { CreateStuffInvitationRequest } from "@/functions/axios/requests";
import type {
  CreateSectionResponse,
  CreateClubResponse,
  Invitation,
} from "@/functions/axios/responses";
import { SectionsPanel } from "./components/SectionPanel";
import { useI18n } from "@/i18n/i18n";
import { StaffPanel } from "./components/StaffPanel";

const ManagementPage: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState(
    localStorage.getItem("activeManagementTab") || "staff"
  );
  const userFullName = localStorage.getItem("telegramFullName") || "";
  const userId = Number(localStorage.getItem("userId"));
  const [filters, setFilters] = useState<Filters>({
    search: "",
    roles: [],
    clubs: [],
    sections: [],
  });

  const [sectionEditing, setSectionEditing] = useState(false);

  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);

  const [newStaff, setNewStaff] = useState<NewStaff>({
    role: "",
    phone: "",
    clubId: "",
  });

  const [newSection, setNewSection] = useState<
    NewSection & { valid_from?: string; valid_until?: string }
  >({
    club_id: undefined,
    name: "",
    coach_id: undefined,
    description: "",
    active: true,
    valid_from: "",
    valid_until: "",
  });

  const handleSectionChange = useCallback(
    (field: keyof NewSection, value: unknown) => {
      setNewSection((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const [clubsRaw, setClubsRaw] = useState<CreateClubResponse[]>([]);
  const [ownedClubs, setOwnedClubs] = useState<CreateClubResponse[]>([]);

  const [staff, setStaff] = useState<Staff[]>([]);
  const [sections, setSections] = useState<CreateSectionResponse[]>([]);
  const [activeSection, setActiveSection] = useState<
    CreateSectionResponse | undefined
  >(undefined);

  const [sectionCreateAllowed, setSectionCreateAllowed] = useState(false);
  const [staffCreateAllowed, setStaffCreateAllowed] = useState(false);

  const [showSecNotAllowed, setShowSecNotAllowed] = useState(false);
  const [showStaffNotAllowed, setShowStaffNotAllowed] = useState(false);

  const addSection = () => {
    setActiveSection(undefined);
    if (!sectionCreateAllowed) {
      setShowSecNotAllowed(true);
      return;
    }
    setNewSection({
      club_id: clubsRaw.length === 1 ? clubsRaw[0]?.id : undefined,
      name: "",
      coach_id: userId,
      description: "",
      active: true,
    });
    setShowAddSection(true);
  };

  const editSection = (sectionId: number) => {
    const sec = sections.find((s) => s.id === sectionId)!;
    setActiveSection(sec);
    setNewSection({
      club_id: sec.club_id,
      name: sec.name,
      coach_id: sec.coach_id,
      description: sec.description,
      active: sec.active,
    });
    setSectionEditing(true);
    setShowAddSection(true);
  };

  const onAddSectionModalClose = () => {
    setShowAddSection(false);
    setSectionEditing(false);
  };
  const addStaff = () => {
    if (!staffCreateAllowed) {
      setShowStaffNotAllowed(true);
      return;
    }
    setShowAddStaff(true);
  };

  const allRoles = ["owner", "coach", "admin"];

  useEffect(() => {
    const token = localStorage.getItem("telegramToken") || "";
    if (!token) return;

    (async () => {
      try {
        const [secRes, clubRes, teamRes, invRes] = await Promise.all([
          sectionsApi.getMy(token),
          clubsApi.getMy(token),
          teamApi.get(token),
          invitationsApi.getMy(token),
        ]);

        console.log(secRes.data);

        setClubsRaw(clubRes.data.clubs.map((w) => w.club));
        setOwnedClubs(
          clubRes.data.clubs
            .filter((w) => w.role === "owner" || w.role === "admin")
            .map((w) => w.club)
        );

        setSections(secRes.data);

        if (clubRes.data.clubs.length > 0) {
          setSectionCreateAllowed(true);
          setStaffCreateAllowed(true);
        }

        // 1) Маппим реальных членов команды
        const teamMembers: Staff[] = (
          teamRes.data.staff_members as unknown[]
        ).map((m) => {
          const member = m as {
            id: number | string;
            first_name: string;
            last_name: string;
            username?: string;
            clubs_and_roles: Array<{ role: string; club_name: string }>;
            phone_number?: string;
          };
          return {
            id: member.id.toString(),
            name: member.first_name,
            surname: member.last_name,
            telegramUsername: member.username,
            role: (member.clubs_and_roles[0]?.role as Staff["role"]) || "coach",
            sports: [] as string[],
            clubs: member.clubs_and_roles.map((cr) => cr.club_name),
            phone: member.phone_number,
            status: "active", // литерал 'active'
          };
        });

        // 2) Маппим только pending-приглашения
        const pendingInvs: Staff[] = invRes.data.invitations
          .filter((inv) => inv.status === "pending")
          .map((inv) => {
            // находим название клуба
            const wrapper = clubRes.data.clubs.find(
              (w) => w.club.id === inv.club_id
            );
            return {
              id: inv.id.toString(),
              name: "",
              surname: "",
              telegramUsername: undefined,
              role: inv.role as Staff["role"],
              sports: [] as string[],
              clubs: wrapper ? [wrapper.club.name] : [],
              phone: inv.phone_number,
              status: "pending", // литерал 'pending'
            };
          });

        // 3) Объединяем: сначала реальные члены, потом приглашённые
        setStaff([...teamMembers, ...pendingInvs]);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const handleAddInvitation = async () => {
    const token = localStorage.getItem("telegramToken") || "";
    if (!newStaff.clubId) return;
    const payload: CreateStuffInvitationRequest = {
      phone_number: newStaff.phone,
      role: newStaff.role,
    };
    try {
      const { data: invitation } = await invitationsApi.create(
        newStaff.clubId,
        payload,
        token
      );
      const typedInvitation = invitation as Invitation;
      setStaff((prev) => [
        ...prev,
        {
          id: typedInvitation.id.toString(),
          name: "",
          surname: "",
          telegramUsername: undefined,
          role: typedInvitation.role as "owner" | "coach" | "admin",
          sports: [],
          clubs: clubsRaw
            .filter((c) => c.id === typedInvitation.club_id)
            .map((c) => c.name),
          phone: typedInvitation.phone_number,
          status: typedInvitation.status,
        },
      ]);
      setShowAddStaff(false);
      setNewStaff({ role: "", phone: "", clubId: "" });
    } catch (err) {
      console.error("Ошибка создания приглашения:", err);
    }
  };

  const filteredStaff = useMemo(() => {
    const s = filters.search.toLowerCase();
    return staff.filter(
      (m) =>
        (!s ||
          (m.phone && m.phone.toLowerCase().includes(s)) ||
          m.role.includes(s)) &&
        (filters.roles.length === 0 || filters.roles.includes(m.role)) &&
        (filters.clubs.length === 0 ||
          m.clubs.some((c) => filters.clubs.includes(c)))
    );
  }, [staff, filters]);

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-50">
        <div className="bg-white sticky top-0 z-10 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <div className="px-4 py-3">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">{t('management.title')}</h1>
            <TabNavigation activeTab={activeTab} onChange={setActiveTab} />
            {activeTab === "staff" && (
              <StaffFilter
                filters={filters}
                allClubs={clubsRaw}
                onChange={(f) => setFilters((prev) => ({ ...prev, ...f }))}
              />
            )}
          </div>
        </div>
        <div className="px-4 py-2">
          {activeTab === "staff" && (
            <StaffPanel staff={filteredStaff} onAdd={addStaff} />
          )}
          {activeTab === "sections" && (
            <SectionsPanel
              sections={sections}
              onEdit={editSection}
              onAdd={addSection}
              editableClubIds={ownedClubs.map((c) => c.id)}
            />
          )}
        </div>

        <BottomNav page="management" />
      </div>
      <AddStaffModal
        show={showAddStaff}
        allRoles={allRoles}
        allClubs={clubsRaw}
        newStaff={newStaff}
        onChange={(f, v) =>
          setNewStaff((prev) => ({ ...prev, [f]: v as string }))
        }
        onAdd={handleAddInvitation}
        onClose={() => setShowAddStaff(false)}
      />
      <AddSectionModal
        show={showAddSection}
        editing={sectionEditing}
        allClubs={ownedClubs}
        allStaff={staff}
        newSection={newSection}
        userFullName={userFullName}
        userId={userId}
        activeSection={activeSection}
        refresh={() => window.location.reload()}
        onChange={handleSectionChange}
        onClose={onAddSectionModalClose}
      />
      {showSecNotAllowed && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="relative bg-white w-[95%] max-w-md shadow-xl ring-1 ring-gray-200 rounded-2xl px-6 py-5">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowSecNotAllowed(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Невозможно создать секцию
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Пожалуйста, сначала создайте клуб
              </p>
            </div>
          </div>
        </div>
      )}

      {showStaffNotAllowed && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="relative bg-white w-[95%] max-w-md shadow-xl ring-1 ring-gray-200 rounded-2xl px-6 py-5">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowStaffNotAllowed(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Невозможно добавить тренера
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Пожалуйста, сначала создайте клуб
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default ManagementPage;
