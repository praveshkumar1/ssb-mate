import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/Spinner';

type SessionType = {
  id: string;
  label: string;
  minutes: number;
  price: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: any) => void;
  sessionTypes?: SessionType[];
  selectedSlot?: any;
  initialSessionType?: SessionType | null;
  coachName?: string;
  confirmLoading?: boolean;
};

const BookingModal: React.FC<Props> = ({ open, onClose, onConfirm, sessionTypes = [], selectedSlot, initialSessionType = null, coachName, confirmLoading = false }) => {
  const [selectedType, setSelectedType] = useState<SessionType | null>(initialSessionType || sessionTypes[0] || null);
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('general_mentoring');

  // keep in sync if parent changes initialSessionType
  React.useEffect(() => {
    if (initialSessionType) setSelectedType(initialSessionType);
  }, [initialSessionType]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded w-full max-w-lg shadow-lg">
        <h3 className="text-lg font-semibold">Book session{coachName ? ` with ${coachName}` : ''}</h3>
        <div className="mt-4">
          <div className="text-sm text-muted-foreground">Choose session type</div>
          <div className="mt-2 flex gap-2">
            {sessionTypes.map(st => (
              <button key={st.id} onClick={() => setSelectedType(st)} className={`p-2 border rounded ${selectedType?.id === st.id ? 'border-primary bg-primary/5' : ''}`}>
                <div className="font-medium">{st.label}</div>
                <div className="text-xs text-muted-foreground">{st.minutes} mins • {st.price ? `$${st.price}` : 'Custom'}</div>
              </button>
            ))}
          </div>

          <div className="mt-4">
            <div className="text-sm text-muted-foreground">Selected time</div>
            <div className="mt-1">{selectedSlot ? new Date(selectedSlot.start).toLocaleString() : 'Pick a slot from availability'}</div>
          </div>

          <div className="mt-4">
            <div className="text-sm text-muted-foreground">Session category</div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full mt-2 p-2 border rounded">
              <option value="general_mentoring">General mentoring</option>
              <option value="group_discussion">Group discussion</option>
              <option value="personal_interview">Personal interview</option>
              <option value="planning_exercise">Planning exercise</option>
            </select>
            <div className="text-xs text-muted-foreground mt-1">This is the session category the coach will see in notifications.</div>
          </div>

          <div className="mt-3">
            <div className="text-sm text-muted-foreground">Price</div>
            <div className="mt-1 font-medium">{selectedType ? (selectedType.price ? `$${selectedType.price}` : 'Custom') : '-'}</div>
          </div>

          <div className="mt-4">
            <label className="text-sm text-muted-foreground">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full mt-2 p-2 border rounded" placeholder="Notes for your coach (visible only to you)" />
          </div>

                  <div className="mt-6 flex gap-2 justify-end">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={async () => { await onConfirm({ slot: selectedSlot, sessionType: selectedType, description, category }); }} disabled={!selectedSlot || !selectedType || confirmLoading}>
                      <span className="flex items-center">
                        {confirmLoading && <Spinner className="w-4 h-4" />}
                        <span>{confirmLoading ? 'Confirming...' : 'Confirm booking'}</span>
                      </span>
                    </Button>
                  </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
