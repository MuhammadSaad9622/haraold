import React, { useState } from 'react';
import Modal from 'react-modal';

interface DiagnosisSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDiagnoses: string[];
  onDiagnosesChange: (diagnoses: string[]) => void;
}

const DiagnosisSelector: React.FC<DiagnosisSelectorProps> = ({
  isOpen,
  onClose,
  selectedDiagnoses,
  onDiagnosesChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const diagnoses = [
    // Cervical Spine
    'Cervical strain/sprain',
    'Cervical radiculopathy',
    'Cervical disc herniation',
    'Cervical facet syndrome',
    'Cervical myelopathy',
    'Whiplash injury',
    'Cervical degenerative disc disease',
    'Cervical stenosis',
    
    // Thoracic Spine
    'Thoracic strain/sprain',
    'Thoracic radiculopathy',
    'Thoracic disc herniation',
    'Thoracic facet syndrome',
    'Thoracic degenerative disc disease',
    'Costovertebral dysfunction',
    'Intercostal neuralgia',
    
    // Lumbar Spine
    'Lumbar strain/sprain',
    'Lumbar radiculopathy',
    'Lumbar disc herniation',
    'Lumbar facet syndrome',
    'Lumbar degenerative disc disease',
    'Lumbar stenosis',
    'Spondylolisthesis',
    'Spondylosis',
    'Sciatica',
    'Lumbar disc bulge',
    'Lumbar disc protrusion',
    'Lumbar disc extrusion',
    
    // Sacral/Coccyx
    'Sacral dysfunction',
    'Coccydynia',
    'Sacral radiculopathy',
    
    // Shoulder
    'Shoulder impingement syndrome',
    'Rotator cuff tear',
    'Rotator cuff tendinitis',
    'Adhesive capsulitis (frozen shoulder)',
    'Shoulder instability',
    'Acromioclavicular joint sprain',
    'Bicipital tendinitis',
    'Labral tear',
    
    // Elbow
    'Lateral epicondylitis (tennis elbow)',
    'Medial epicondylitis (golfer\'s elbow)',
    'Cubital tunnel syndrome',
    'Elbow bursitis',
    'Elbow arthritis',
    
    // Wrist/Hand
    'Carpal tunnel syndrome',
    'De Quervain\'s tenosynovitis',
    'Wrist sprain',
    'Trigger finger',
    'Dupuytren\'s contracture',
    'Wrist arthritis',
    
    // Hip
    'Hip bursitis',
    'Hip arthritis',
    'Hip labral tear',
    'Hip impingement',
    'Piriformis syndrome',
    'Trochanteric bursitis',
    'Iliotibial band syndrome',
    
    // Knee
    'Knee sprain',
    'Meniscal tear',
    'Anterior cruciate ligament tear',
    'Posterior cruciate ligament tear',
    'Medial collateral ligament sprain',
    'Lateral collateral ligament sprain',
    'Patellofemoral pain syndrome',
    'Knee arthritis',
    'Knee bursitis',
    'Patellar tendinitis',
    
    // Ankle/Foot
    'Ankle sprain',
    'Plantar fasciitis',
    'Achilles tendinitis',
    'Achilles tendon rupture',
    'Ankle arthritis',
    'Tarsal tunnel syndrome',
    'Metatarsalgia',
    'Bunion',
    'Hammertoe',
    
    // Neurological
    'Peripheral neuropathy',
    'Complex regional pain syndrome',
    'Fibromyalgia',
    'Myofascial pain syndrome',
    'Chronic pain syndrome',
    'Post-traumatic stress disorder',
    'Depression',
    'Anxiety',
    
    // Other
    'Post-concussion syndrome',
    'Traumatic brain injury',
    'Post-traumatic headache',
    'Dizziness/vertigo',
    'Tinnitus',
    'Sleep disturbance',
    'Fatigue',
    'Memory problems',
    'Concentration difficulties'
  ];

  const filteredDiagnoses = diagnoses.filter(diagnosis =>
    diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDiagnosisToggle = (diagnosis: string) => {
    const updated = selectedDiagnoses.includes(diagnosis)
      ? selectedDiagnoses.filter(d => d !== diagnosis)
      : [...selectedDiagnoses, diagnosis];
    onDiagnosesChange(updated);
  };

  const handleSelectAll = () => {
    onDiagnosesChange([...diagnoses]);
  };

  const handleClearAll = () => {
    onDiagnosesChange([]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Diagnosis Selector"
      className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto mt-20 p-6 max-h-[80vh] overflow-y-auto"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Select Diagnoses</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search diagnoses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSelectAll}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Select All
        </button>
        <button
          onClick={handleClearAll}
          className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
        {filteredDiagnoses.map((diagnosis) => (
          <label key={diagnosis} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
            <input
              type="checkbox"
              checked={selectedDiagnoses.includes(diagnosis)}
              onChange={() => handleDiagnosisToggle(diagnosis)}
              className="rounded"
            />
            <span className="text-sm">{diagnosis}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600 mb-2">
          Selected: {selectedDiagnoses.length} diagnosis(es)
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DiagnosisSelector; 