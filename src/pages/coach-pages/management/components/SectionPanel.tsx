import React from "react";
import type { CreateSectionResponse } from "@/functions/axios/responses";
import { Plus } from "lucide-react";
import SectionCard from "./SectionCard";

export const SectionsPanel: React.FC<{
  sections: CreateSectionResponse[];
  onEdit: (id: number) => void;
  onAdd: () => void;
  editableClubIds?: number[];
}> = ({ sections, onEdit, onAdd, editableClubIds = [] }) => {
  return (
    <>
      <div className="mb-3 text-sm text-gray-600">{sections.length} секций</div>
      <div className="space-y-4">
        {sections.map((sec) => (
          <SectionCard
            key={sec.id}
            section={sec}
            onEdit={onEdit}
            canEdit={editableClubIds.includes(sec.club_id)}
          />
        ))}
        <button onClick={onAdd} className="fixed bottom-28 right-4 bg-blue-500 p-4 rounded-full shadow-lg text-white hover:bg-blue-600 transition-colors">
          <Plus size={20} /> 
        </button>
      </div>
    </>
  );
};

