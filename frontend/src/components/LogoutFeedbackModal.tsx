import React, { useState } from 'react';
import { X, Monitor, Mouse, Keyboard, Computer, CheckCircle2, AlertCircle } from 'lucide-react';

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
  icon: React.ReactNode;
  value: { status: 'yes' | 'no' | null; issue: string };
  onChange: (value: { status: 'yes' | 'no' | null; issue: string }) => void;
}

function EquipmentItem({ label, icon, value, onChange }: EquipmentItemProps) {
  const isComplete = value.status !== null && (value.status === 'yes' || (value.status === 'no' && value.issue.trim()));
  
  return (
    <div className={`relative border-2 rounded-lg p-4 transition-all duration-200 ${
      value.status === 'yes' 
        ? 'border-green-300 bg-green-50' 
        : value.status === 'no' 
        ? 'border-red-300 bg-red-50' 
        : 'border-gray-200 bg-white hover:border-blue-300'
    }`}>
      {/* Status Indicator */}
      <div className="absolute top-3 right-3">
        {isComplete ? (
          <CheckCircle2 className={`h-5 w-5 ${
            value.status === 'yes' ? 'text-green-600' : 'text-red-600'
          }`} />
        ) : (
          <AlertCircle className="h-5 w-5 text-gray-300" />
        )}
      </div>

      {/* Equipment Header */}
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-2 rounded-lg ${
          value.status === 'yes' 
            ? 'bg-green-100' 
            : value.status === 'no' 
            ? 'bg-red-100' 
            : 'bg-gray-100'
        }`}>
          <div className={`h-6 w-6 ${
            value.status === 'yes' 
              ? 'text-green-700' 
              : value.status === 'no' 
              ? 'text-red-700' 
              : 'text-gray-600'
          }`}>
            {icon}
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{label}</h4>
          <p className="text-xs text-gray-500">Is this equipment working properly?</p>
        </div>
      </div>

      {/* Status Buttons */}
      <div className="flex space-x-3 mb-3">
        <button
          type="button"
          onClick={() => onChange({ status: 'yes', issue: '' })}
          className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
            value.status === 'yes'
              ? 'bg-green-600 text-white shadow-md ring-2 ring-green-600 ring-offset-2'
              : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-green-500 hover:text-green-700'
          }`}
        >
          ✓ Working
        </button>
        <button
          type="button"
          onClick={() => onChange({ status: 'no', issue: value.issue })}
          className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
            value.status === 'no'
              ? 'bg-red-600 text-white shadow-md ring-2 ring-red-600 ring-offset-2'
              : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-700'
          }`}
        >
          ✗ Not Working
        </button>
      </div>

      {/* Issue Description */}
      {value.status === 'no' && (
        <div className="mt-3 animate-fadeIn">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Describe the issue: <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={value.issue}
            onChange={(e) => onChange({ status: 'no', issue: e.target.value })}
            placeholder="e.g., Screen flickering, buttons not working..."
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm bg-white"
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

  // Calculate progress
  const completedItems = [
    feedback.computer.status !== null && (feedback.computer.status === 'yes' || feedback.computer.issue.trim()),
    feedback.mouse.status !== null && (feedback.mouse.status === 'yes' || feedback.mouse.issue.trim()),
    feedback.keyboard.status !== null && (feedback.keyboard.status === 'yes' || feedback.keyboard.issue.trim()),
    feedback.monitor.status !== null && (feedback.monitor.status === 'yes' || feedback.monitor.issue.trim())
  ].filter(Boolean).length;
  
  const progress = (completedItems / 4) * 100;

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 sticky top-0 bg-white z-10">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">Equipment Feedback</h3>
              <p className="text-sm text-gray-600 mt-1">Please check all equipment before logging out</p>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span className="font-medium">{completedItems}/4 completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <EquipmentItem
              label="Computer"
              icon={<Computer />}
              value={feedback.computer}
              onChange={(value) => setFeedback({ ...feedback, computer: value })}
            />

            <EquipmentItem
              label="Mouse"
              icon={<Mouse />}
              value={feedback.mouse}
              onChange={(value) => setFeedback({ ...feedback, mouse: value })}
            />

            <EquipmentItem
              label="Keyboard"
              icon={<Keyboard />}
              value={feedback.keyboard}
              onChange={(value) => setFeedback({ ...feedback, keyboard: value })}
            />

            <EquipmentItem
              label="Monitor"
              icon={<Monitor />}
              value={feedback.monitor}
              onChange={(value) => setFeedback({ ...feedback, monitor: value })}
            />
          </div>

          {/* Additional Comments */}
          <div className="border-t border-gray-200 pt-6">
            <label className="flex items-center text-sm font-semibold text-gray-900 mb-2">
              <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Additional Comments
              <span className="ml-2 text-xs font-normal text-gray-500">(Optional)</span>
            </label>
            <textarea
              value={feedback.additionalComments}
              onChange={(e) => setFeedback({ ...feedback, additionalComments: e.target.value })}
              rows={3}
              placeholder="Any other feedback, suggestions, or issues you'd like to report..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 italic">
              All equipment items must be checked before submitting
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-6 py-2.5 rounded-lg font-medium text-sm shadow-md transition-all duration-200 ${
                  progress === 100
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 ring-2 ring-blue-500 ring-offset-2'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={progress !== 100}
              >
                {progress === 100 ? '✓ Submit Feedback' : `Complete ${4 - completedItems} more item${4 - completedItems > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LogoutFeedbackModal;

