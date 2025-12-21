import React, { useState, useMemo, useCallback } from 'react';
import { X, ChevronDown, ChevronRight, Check, Plus, Trash2, Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Tariff, Club, Section, CreateTariffData, PaymentType, PackageType } from '../types';
import type { ClubWithRole } from '@/functions/axios/responses';

interface TariffModalProps {
  tariff?: Tariff;
  clubs: Club[];
  sections: Section[];
  clubRoles: ClubWithRole[];
  onClose: () => void;
  onSave: (data: CreateTariffData) => void;
}

export const TariffModal: React.FC<TariffModalProps> = ({
  tariff,
  clubs,
  sections,
  clubRoles,
  onClose,
  onSave,
}) => {
  const { t } = useI18n();
  const isEditing = !!tariff;

  // Form state
  const [name, setName] = useState(tariff?.name || '');
  const [paymentType, setPaymentType] = useState<PaymentType>(tariff?.payment_type || 'monthly');
  const [price, setPrice] = useState(tariff?.price || 0);
  const [sessionsCount, setSessionsCount] = useState(tariff?.sessions_count || 8);
  const [validityDays, setValidityDays] = useState(tariff?.validity_days || 30);
  const [features, setFeatures] = useState<string[]>(tariff?.features || []);
  const [newFeature, setNewFeature] = useState('');
  const [active, setActive] = useState(tariff?.active ?? true);

  // Suggested features for quick adding
  const suggestedFeatures = useMemo(() => [
    t('management.pricing.feature.unlimited'),
    t('management.pricing.feature.groupClasses'),
    t('management.pricing.feature.equipment'),
    t('management.pricing.feature.locker'),
    t('management.pricing.feature.personalTrainer'),
    t('management.pricing.feature.nutrition'),
    t('management.pricing.feature.parking'),
    t('management.pricing.feature.towel'),
  ], [t]);

  // Selection state
  const [selectedClubs, setSelectedClubs] = useState<number[]>(tariff?.club_ids || []);
  const [selectedSections, setSelectedSections] = useState<number[]>(tariff?.section_ids || []);
  const [selectedGroups, setSelectedGroups] = useState<number[]>(tariff?.group_ids || []);

  // Expand/collapse state
  const [expandedClubs, setExpandedClubs] = useState<number[]>([]);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter clubs where user is owner or admin (not just coach)
  const activeClubs = useMemo(() => {
    return clubs.filter(c => {
      if (c.status !== 'active') return false;
      const clubRole = clubRoles.find(cr => cr.club.id === c.id);
      return clubRole && (clubRole.role === 'owner' || clubRole.role === 'admin');
    });
  }, [clubs, clubRoles]);

  // Get all section IDs for a club
  const getClubSectionIds = useCallback((clubId: number): number[] => {
    return sections.filter(s => s.club_id === clubId).map(s => s.id);
  }, [sections]);

  // Get all group IDs for a club
  const getClubGroupIds = useCallback((clubId: number): number[] => {
    return sections
      .filter(s => s.club_id === clubId)
      .flatMap(s => s.groups.map(g => g.id));
  }, [sections]);

  // Get all group IDs for a section
  const getSectionGroupIds = useCallback((sectionId: number): number[] => {
    const section = sections.find(s => s.id === sectionId);
    return section?.groups.map(g => g.id) || [];
  }, [sections]);

  // Toggle club expand/collapse
  const toggleClubExpand = (clubId: number) => {
    setExpandedClubs(prev =>
      prev.includes(clubId) ? prev.filter(id => id !== clubId) : [...prev, clubId]
    );
  };

  // Toggle section expand/collapse
  const toggleSectionExpand = (sectionId: number) => {
    setExpandedSections(prev =>
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  // Handle club selection
  const handleClubToggle = (clubId: number) => {
    const isSelected = selectedClubs.includes(clubId);
    const clubSectionIds = getClubSectionIds(clubId);
    const clubGroupIds = getClubGroupIds(clubId);

    if (isSelected) {
      // Deselect club and all its sections/groups
      setSelectedClubs(prev => prev.filter(id => id !== clubId));
      setSelectedSections(prev => prev.filter(id => !clubSectionIds.includes(id)));
      setSelectedGroups(prev => prev.filter(id => !clubGroupIds.includes(id)));
    } else {
      // Select club and all its sections/groups
      setSelectedClubs(prev => [...prev, clubId]);
      setSelectedSections(prev => [...new Set([...prev, ...clubSectionIds])]);
      setSelectedGroups(prev => [...new Set([...prev, ...clubGroupIds])]);
    }
  };

  // Handle section selection
  const handleSectionToggle = (sectionId: number) => {
    const isSelected = selectedSections.includes(sectionId);
    const sectionGroupIds = getSectionGroupIds(sectionId);

    if (isSelected) {
      // Deselect section and all its groups
      setSelectedSections(prev => prev.filter(id => id !== sectionId));
      setSelectedGroups(prev => prev.filter(id => !sectionGroupIds.includes(id)));
    } else {
      // Select section and all its groups
      setSelectedSections(prev => [...prev, sectionId]);
      setSelectedGroups(prev => [...new Set([...prev, ...sectionGroupIds])]);
    }
  };

  // Handle group selection
  const handleGroupToggle = (groupId: number) => {
    setSelectedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  // Check if club is fully selected (all its sections and groups)
  const isClubFullySelected = (clubId: number): boolean => {
    return selectedClubs.includes(clubId);
  };

  // Check if section is fully selected
  const isSectionFullySelected = (sectionId: number): boolean => {
    // If parent club is selected, section is auto-selected
    const section = sections.find(s => s.id === sectionId);
    if (section && selectedClubs.includes(section.club_id)) return true;
    return selectedSections.includes(sectionId);
  };

  // Check if group is selected
  const isGroupSelected = (groupId: number, sectionId: number): boolean => {
    // If parent section is fully selected, group is auto-selected
    if (isSectionFullySelected(sectionId)) return true;
    return selectedGroups.includes(groupId);
  };

  // Calculate selection summary
  const selectionSummary = useMemo(() => {
    if (selectedClubs.length > 0) {
      return { type: 'clubs', count: selectedClubs.length };
    }
    if (selectedSections.length > 0) {
      return { type: 'sections', count: selectedSections.length };
    }
    if (selectedGroups.length > 0) {
      return { type: 'groups', count: selectedGroups.length };
    }
    return { type: 'none', count: 0 };
  }, [selectedClubs, selectedSections, selectedGroups]);

  // Determine package type
  const determinePackageType = (): PackageType => {
    if (selectedClubs.length > 0) return 'full_club';
    if (selectedSections.length > 0 && selectedGroups.length === 0) return 'full_section';
    if (selectedGroups.length === 1) return 'single_group';
    return 'multiple_groups';
  };

  // Feature management handlers
  const handleAddFeature = () => {
    const trimmed = newFeature.trim();
    if (trimmed && !features.includes(trimmed)) {
      setFeatures([...features, trimmed]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleAddSuggestedFeature = (feature: string) => {
    if (!features.includes(feature)) {
      setFeatures([...features, feature]);
    }
  };

  const handleFeatureKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFeature();
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = t('management.pricing.errors.nameRequired');
    }
    
    if (selectedClubs.length === 0 && selectedSections.length === 0 && selectedGroups.length === 0) {
      newErrors.access = t('management.pricing.errors.accessRequired');
    }
    
    if (!price || price <= 0) {
      newErrors.price = t('management.pricing.errors.priceRequired');
    }
    
    if (paymentType === 'session_pack') {
      if (!sessionsCount || sessionsCount <= 0) {
        newErrors.sessions = t('management.pricing.errors.sessionsRequired');
      }
      if (!validityDays || validityDays <= 0) {
        newErrors.validity = t('management.pricing.errors.validityRequired');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const data: CreateTariffData = {
        name,
        type: determinePackageType(),
        payment_type: paymentType,
        price,
        club_ids: selectedClubs,
        section_ids: selectedSections,
        group_ids: selectedGroups,
        sessions_count: paymentType === 'session_pack' ? sessionsCount : undefined,
        validity_days: paymentType === 'session_pack' ? validityDays : undefined,
        features,
        active,
      };
      onSave(data);
    }
  };

  const getSelectionLabel = () => {
    if (selectionSummary.type === 'clubs') {
      return `${t('management.pricing.accessClubs')}: ${selectionSummary.count}`;
    }
    if (selectionSummary.type === 'sections') {
      return `${t('management.pricing.accessSections')}: ${selectionSummary.count}`;
    }
    if (selectionSummary.type === 'groups') {
      return `${t('management.pricing.accessGroups')}: ${selectionSummary.count}`;
    }
    return t('management.pricing.notSelected');
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="min-h-full w-full max-w-md mx-auto flex flex-col">
        {/* Header with mt-20 to avoid Telegram UI buttons */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200 mt-20">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? t('management.pricing.editTitle') : t('management.pricing.createTitle')}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('management.pricing.name')} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors({ ...errors, name: '' });
              }}
              className={`w-full border rounded-lg p-2 ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
              placeholder={t('management.pricing.namePlaceholder')}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Hierarchical Access Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('management.pricing.access')} *
              </label>
              <span className="text-xs text-blue-600 font-medium">
                {getSelectionLabel()}
              </span>
            </div>
            
            {errors.access && <p className="text-red-500 text-xs mb-2">{errors.access}</p>}
            
            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              {activeClubs.map(club => {
                const clubSections = sections.filter(s => s.club_id === club.id);
                const isExpanded = expandedClubs.includes(club.id);
                const isFullySelected = isClubFullySelected(club.id);

                return (
                  <div key={club.id} className="border-b border-gray-100 last:border-b-0">
                    {/* Club Level */}
                    <div className="flex items-center gap-2 p-3 hover:bg-gray-50">
                      <button
                        type="button"
                        onClick={() => toggleClubExpand(club.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      <label className="flex items-center gap-2 flex-1 cursor-pointer">
                        <div
                          onClick={(e) => {
                            e.preventDefault();
                            handleClubToggle(club.id);
                          }}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isFullySelected
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          {isFullySelected && <Check size={14} className="text-white" />}
                        </div>
                        <span className="font-medium text-gray-900">{club.name}</span>
                      </label>
                    </div>

                    {/* Sections inside club */}
                    {isExpanded && (
                      <div className="bg-gray-50">
                        {clubSections.length === 0 ? (
                          <p className="text-sm text-gray-400 py-2 pl-12">
                            {t('management.pricing.noSections')}
                          </p>
                        ) : (
                          clubSections.map(section => {
                            const isSectionExpanded = expandedSections.includes(section.id);
                            const isSectionSelected = isSectionFullySelected(section.id);

                            return (
                              <div key={section.id}>
                                {/* Section Level */}
                                <div className="flex items-center gap-2 p-2 pl-8 hover:bg-gray-100">
                                  <button
                                    type="button"
                                    onClick={() => toggleSectionExpand(section.id)}
                                    className="p-1 text-gray-400 hover:text-gray-600"
                                    disabled={section.groups.length === 0}
                                  >
                                    {section.groups.length > 0 ? (
                                      isSectionExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                                    ) : (
                                      <div className="w-6" />
                                    )}
                                  </button>
                                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                                    <div
                                      onClick={(e) => {
                                        e.preventDefault();
                                        if (!selectedClubs.includes(club.id)) {
                                          handleSectionToggle(section.id);
                                        }
                                      }}
                                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                        isSectionSelected
                                          ? 'bg-blue-500 border-blue-500'
                                          : 'border-gray-300 hover:border-blue-400'
                                      } ${selectedClubs.includes(club.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                      {isSectionSelected && <Check size={12} className="text-white" />}
                                    </div>
                                    <span className="text-sm text-gray-800">{section.name}</span>
                                    <span className="text-xs text-gray-400">
                                      ({section.groups.length})
                                    </span>
                                  </label>
                                </div>

                                {/* Groups inside section */}
                                {isSectionExpanded && section.groups.length > 0 && (
                                  <div className="bg-white border-l-2 border-gray-200 ml-12">
                                    {section.groups.map(group => {
                                      const isGroupChecked = isGroupSelected(group.id, section.id);
                                      const isDisabled = isSectionSelected;

                                      return (
                                        <div
                                          key={group.id}
                                          className="flex items-center gap-2 p-2 pl-6 hover:bg-gray-50"
                                        >
                                          <label className="flex items-center gap-2 flex-1 cursor-pointer">
                                            <div
                                              onClick={(e) => {
                                                e.preventDefault();
                                                if (!isDisabled) {
                                                  handleGroupToggle(group.id);
                                                }
                                              }}
                                              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                                isGroupChecked
                                                  ? 'bg-blue-500 border-blue-500'
                                                  : 'border-gray-300 hover:border-blue-400'
                                              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                              {isGroupChecked && <Check size={10} className="text-white" />}
                                            </div>
                                            <span className="text-sm text-gray-700">{group.name}</span>
                                            {group.level && (
                                              <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                                                {group.level}
                                              </span>
                                            )}
                                          </label>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('management.pricing.paymentType')} *
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as PaymentType)}
              className="w-full border border-gray-200 rounded-lg p-2"
            >
              <option value="monthly">{t('management.pricing.type.monthly')}</option>
              <option value="semi_annual">{t('management.pricing.type.semi_annual')}</option>
              <option value="annual">{t('management.pricing.type.annual')}</option>
              <option value="session_pack">{t('management.pricing.type.session_pack')}</option>
            </select>
          </div>

          {/* Session Pack Fields */}
          {paymentType === 'session_pack' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('management.pricing.sessionsCount')} *
                </label>
                <input
                  type="number"
                  value={sessionsCount}
                  onChange={(e) => {
                    setSessionsCount(Number(e.target.value));
                    setErrors({ ...errors, sessions: '' });
                  }}
                  className={`w-full border rounded-lg p-2 ${errors.sessions ? 'border-red-500' : 'border-gray-200'}`}
                  min={1}
                />
                {errors.sessions && <p className="text-red-500 text-xs mt-1">{errors.sessions}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('management.pricing.validityDays')} *
                </label>
                <input
                  type="number"
                  value={validityDays}
                  onChange={(e) => {
                    setValidityDays(Number(e.target.value));
                    setErrors({ ...errors, validity: '' });
                  }}
                  className={`w-full border rounded-lg p-2 ${errors.validity ? 'border-red-500' : 'border-gray-200'}`}
                  min={1}
                />
                {errors.validity && <p className="text-red-500 text-xs mt-1">{errors.validity}</p>}
              </div>
            </div>
          )}

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('management.pricing.price')} *
            </label>
            <div className="relative">
              <input
                type="number"
                value={price || ''}
                onChange={(e) => {
                  setPrice(Number(e.target.value));
                  setErrors({ ...errors, price: '' });
                }}
                className={`w-full border rounded-lg p-2 pr-10 ${errors.price ? 'border-red-500' : 'border-gray-200'}`}
                min={0}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">₸</span>
            </div>
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('management.pricing.features')}
            </label>
            <p className="text-xs text-gray-500 mb-2">{t('management.pricing.featuresHint')}</p>
            
            {/* Feature input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={handleFeatureKeyPress}
                className="flex-1 border border-gray-200 rounded-lg p-2 text-sm"
                placeholder={t('management.pricing.featuresPlaceholder')}
              />
              <button
                type="button"
                onClick={handleAddFeature}
                disabled={!newFeature.trim()}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors flex items-center gap-1"
              >
                <Plus size={16} />
                <span className="text-sm">{t('management.pricing.addFeature')}</span>
              </button>
            </div>
            
            {/* Suggested features */}
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <Sparkles size={12} />
                {t('management.pricing.suggestedFeatures')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedFeatures
                  .filter(f => !features.includes(f))
                  .slice(0, 6)
                  .map((feature, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddSuggestedFeature(feature)}
                      className="px-2.5 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      + {feature}
                    </button>
                  ))}
              </div>
            </div>
            
            {/* Added features list */}
            {features.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Check size={12} className="text-emerald-600" />
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setActive(!active)}
              className={`w-10 h-6 rounded-full transition-colors ${
                active ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${
                  active ? 'translate-x-[18px]' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="text-sm text-gray-700">{t('management.pricing.active')}</span>
          </label>
        </div>

        {/* Footer with safe bottom padding */}
        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 flex gap-3 pb-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {isEditing ? t('management.pricing.update') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};
