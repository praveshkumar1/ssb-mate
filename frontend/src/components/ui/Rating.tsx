import React from 'react';

type Props = {
  value: number;
  size?: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
};

const Rating: React.FC<Props> = ({ value, size = 16, onChange, readOnly = true }) => {
  const stars = [1,2,3,4,5];
  return (
    <div className="inline-flex items-center gap-1" role="img" aria-label={`Rating ${value} out of 5`}>
      {stars.map(s => (
        <button
          key={s}
          type="button"
          onClick={() => { if (!readOnly && onChange) onChange(s); }}
          className={`focus:outline-none ${!readOnly ? 'cursor-pointer' : 'cursor-default'}`}
          aria-pressed={!readOnly && value >= s}
          title={`${s} star`}
          style={{ width: size, height: size }}
        >
          <svg viewBox="0 0 24 24" fill={value >= s ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} className={`text-yellow-400 ${value >= s ? 'fill-current' : 'text-gray-300'}`}>
            <path d="M12 .587l3.668 7.431L24 9.748l-6 5.845L19.335 24 12 19.897 4.665 24 6 15.593 0 9.748l8.332-1.73z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

export default Rating;
