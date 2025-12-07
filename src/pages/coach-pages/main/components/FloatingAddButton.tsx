import { Plus } from "lucide-react";

export const FloatingAddButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button 
    onClick={onClick} 
    className="fixed bottom-24 right-4 bg-blue-500 p-4 rounded-2xl shadow-lg shadow-blue-500/30 text-white hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95 transition-all duration-200 z-10"
    aria-label="Добавить тренировку"
  >
    <Plus size={24} strokeWidth={2.5} />
  </button>
);