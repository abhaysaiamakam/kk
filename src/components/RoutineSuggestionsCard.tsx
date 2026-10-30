import React, { useState } from 'react';
import { Sparkles, Clock, Check, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { RoutineSuggestion } from '../types';
import { playChime } from '../utils/audio';

interface RoutineSuggestionsCardProps {
  suggestions: RoutineSuggestion[];
  onApprove: (id: string) => void;
}

export const RoutineSuggestionsCard: React.FC<RoutineSuggestionsCardProps> = ({
  suggestions,
  onApprove
}) => {
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [showDetailsId, setShowDetailsId] = useState<string | null>(null);

  const activeSuggestion = suggestions[0];
  if (!activeSuggestion) return null;

  const isApproved = approvedIds.includes(activeSuggestion.id) || activeSuggestion.status === 'approved';

  const handleApprove = (id: string) => {
    setApprovedIds([...approvedIds, id]);
    playChime();
    onApprove(id);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
      {/* Header matching Screen 14 */}
      <div className="flex items-center space-x-2 text-[#263238]">
        <div className="w-8 h-8 rounded-xl bg-[#A8C9B0]/30 text-[#2D4F3B] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#3B664B]" />
        </div>
        <div>
          <h3 className="font-bold text-sm sm:text-base font-['Poppins']">
            Smart Routine Suggestions
          </h3>
          <p className="text-[11px] text-gray-500">
            AI Suggestion • Based on his routine and mood patterns
          </p>
        </div>
      </div>

      {/* Suggestion Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#F2F8F4] to-[#EEF6FB] border border-[#A8C9B0]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-white shadow-xs text-[#3B664B] flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#263238]">
              {activeSuggestion.title}
            </h4>
            <p className="text-xs text-gray-500">
              (Preferred time: {activeSuggestion.suggestedTime})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isApproved ? (
            <span className="px-3.5 py-1.5 rounded-xl bg-green-100 text-green-800 text-xs font-bold flex items-center space-x-1">
              <Check className="w-3.5 h-3.5 text-green-700" />
              <span>Approved &amp; Scheduled</span>
            </span>
          ) : (
            <>
              <button
                onClick={() => handleApprove(activeSuggestion.id)}
                className="px-4 py-2 rounded-xl bg-[#3B664B] hover:bg-[#2D4F3B] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Approve
              </button>
              <button
                onClick={() => setShowDetailsId(showDetailsId ? null : activeSuggestion.id)}
                className="px-3 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200 transition-colors cursor-pointer"
              >
                View Details
              </button>
            </>
          )}
        </div>
      </div>

      {/* View Details Drawer */}
      {showDetailsId && (
        <div className="p-3.5 bg-[#F8F7F0] rounded-xl text-xs text-gray-700 border border-gray-200 space-y-1">
          <p className="font-bold text-[#263238]">Why this suggestion?</p>
          <p>{activeSuggestion.reason}</p>
          <p className="text-[10px] text-gray-400 italic mt-1">
            Caregiver confirmation is required before any schedule update is published to patient app.
          </p>
        </div>
      )}

      {/* Personalization Insights matching Screen 14 bottom */}
      <div className="pt-2 border-t border-gray-100">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
          Personalization Insights
        </span>
        <div className="space-y-1.5 text-xs text-gray-600">
          {activeSuggestion.personalizationInsights.map((insight, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3B664B] shrink-0" />
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
