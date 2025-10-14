import React, { useState } from 'react';
import { X } from 'lucide-react';

interface LogoutFeedbackModalProps {
  onClose: () => void;
  onSubmit: (feedback: FeedbackData) => void;
}

interface FeedbackData {
  computer: { status: 'yes' | 'no' | null; issue: string };
  mouse: { status: 'yes' | 'no' | null; issue: string };
  keyboard: { status: 'yes' | 'no' | null; issue: string };
  monitor: { status: 'yes' | 'no' | null; issue: string };
  additionalComments: string;
}

interface EquipmentItemProps {
  label: string;
  value: { status: 'yes' | 'no' | null; issue: string };
  onChange: (value: { status: 'yes' | 'no' | null; issue: string }) => void;
}

function EquipmentItem({ label, value, onChange }: EquipmentItemProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}:
      </label>
      <p className="text-sm text-gray-600 mb-2">
        Is the {label.toLowerCase()} working properly?
      </p>
      <div className="flex items-center space-x-6 mb-2">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="radio"
            name={label}
            checked={value.status === 'yes'}
            onChange={() => onChange({ status: 'yes', issue: '' })}
            className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span className="ml-2 text-sm text-gray-700">Yes</span>
        </label>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="radio"
            name={label}
            checked={value.status === 'no'}
            onChange={() => onChange({ status: 'no', issue: value.issue })}
            className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span className="ml-2 text-sm text-gray-700">No</span>
        </label>
      </div>
      {value.status === 'no' && (
        <div className="mt-2">
          <label className="block text-xs text-gray-600 mb-1">If no, describe the issue:</label>
          <input
            type="text"
            value={value.issue}
            onChange={(e) => onChange({ status: 'no', issue: e.target.value })}
            placeholder="Describe the issue..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            required
          />
        </div>
      )}
    </div>
  );
}

function LogoutFeedbackModal({ onClose, onSubmit }: LogoutFeedbackModalProps) {
  const [feedback, setFeedback] = useState<FeedbackData>({
    computer: { status: null, issue: '' },
    mouse: { status: null, issue: '' },
    keyboard: { status: null, issue: '' },
    monitor: { status: null, issue: '' },
    additionalComments: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all equipment status are selected
    if (!feedback.computer.status || !feedback.mouse.status || 
        !feedback.keyboard.status || !feedback.monitor.status) {
      alert('Please answer all equipment questions');
      return;
    }

    // Validate that if "No" is selected, an issue description is provided
    if (feedback.computer.status === 'no' && !feedback.computer.issue.trim()) {
      alert('Please describe the issue with the Computer');
      return;
    }
    if (feedback.mouse.status === 'no' && !feedback.mouse.issue.trim()) {
      alert('Please describe the issue with the Mouse');
      return;
    }
    if (feedback.keyboard.status === 'no' && !feedback.keyboard.issue.trim()) {
      alert('Please describe the issue with the Keyboard');
      return;
    }
    if (feedback.monitor.status === 'no' && !feedback.monitor.issue.trim()) {
      alert('Please describe the issue with the Monitor');
      return;
    }

    onSubmit(feedback);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900">FEEDBACK FORM</h3>
            <p className="text-sm text-gray-500 mt-1">Please report equipment condition before logging out</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-1">
            <EquipmentItem
              label="Computer"
              value={feedback.computer}
              onChange={(value) => setFeedback({ ...feedback, computer: value })}
            />

            <EquipmentItem
              label="Mouse"
              value={feedback.mouse}
              onChange={(value) => setFeedback({ ...feedback, mouse: value })}
            />

            <EquipmentItem
              label="Keyboard"
              value={feedback.keyboard}
              onChange={(value) => setFeedback({ ...feedback, keyboard: value })}
            />

            <EquipmentItem
              label="Monitor"
              value={feedback.monitor}
              onChange={(value) => setFeedback({ ...feedback, monitor: value })}
            />
          </div>

          {/* Additional Comments */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments (Optional):
            </label>
            <p className="text-sm text-gray-600 mb-2">
              Any other feedback or suggestions?
            </p>
            <textarea
              value={feedback.additionalComments}
              onChange={(e) => setFeedback({ ...feedback, additionalComments: e.target.value })}
              rows={3}
              placeholder="Enter your feedback or suggestions here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
            >
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LogoutFeedbackModal;

