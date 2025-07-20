import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Modal from 'react-modal';
import { useQuery } from '@tanstack/react-query';
import DiagnosisSelector from './DiagnosisSelector';



// Define the interface for the form data
interface InitialVisitFormData {
  chiefComplaint: string;
  diagnosis: string[];
  vitals: {
    heightFeet: string;
    heightInches: string;
    weight: string;
    temp: string;
    bpSystolic: string;
    bpDiastolic: string;
    pulse: string;
  };
  grip: {
    right1: string;
    right2: string;
    right3: string;
    left1: string;
    left2: string;
    left3: string;
  };
  appearance: string[];
  appearanceOther: string;
  orientation: {
    timePlacePerson: boolean;
    otherChecked: boolean;
    other: string;
  };
  posture: string[];
  gait: string[];
  gaitDevice: string;
  dtr: string[];
  dtrOther: string;
  dermatomes: {
    [nerveRoot: string]: {
      left: {
        hypo: boolean;
        hyper: boolean;
      };
      right: {
        hypo: boolean;
        hyper: boolean;
      };
    };
  };
  muscleStrength: string[];
  strength: {
    [key: string]: string;
  };
  oriented: boolean;
  neuroNote: string;
  coordination: boolean;
  romberg: string[];
  rombergNotes: string;
  pronatorDrift: string;
  neuroTests: string[];
  walkTests: string[];
  painLocation: string[];
  radiatingTo: string;
  jointDysfunction: string[];
  jointOther: string;

  chiropracticAdjustment: string[];
  chiropracticOther: string;
  acupuncture: string[];
  acupunctureOther: string;
  physiotherapy: string[];
  rehabilitationExercises: string[];
  durationFrequency: {
    timesPerWeek: string;
    reEvalInWeeks: string;
  };
  referrals: string[];
  imaging: {
    xray: string[];
    mri: string[];
    ct: string[];
  };
  diagnosticUltrasound: string;
  nerveStudy: string[];
  restrictions: {
    avoidActivityWeeks: string;
    liftingLimitLbs: string;
    avoidProlongedSitting: boolean;
  };
  disabilityDuration: string;
  otherNotes: string;

  // NEWLY ADDED
  arom: {
    [region: string]: {
      [movement: string]: {
        wnl: string;
        exam: string;
        pain: string;
      };
    };
  };
  ortho: {
    [test: string]: {
      left: string;
      right: string;
      ligLaxity?: string; // Optional field if applicable
    };
  };
  tenderness: {
    [region: string]: string[];
  };
  spasm: {
    [region: string]: string[];
  };

  lumbarTouchingToesMovement: {
    pain: boolean;
    painTS: boolean;
    painLS: boolean;
    acceleration: boolean;
    accelerationTSPain: boolean;
    accelerationLSPain: boolean;
    deceleration: boolean;
    decelerationTSPain: boolean;
    decelerationLSPain: boolean;
    gowersSign: boolean;
    gowersSignTS: boolean;
    gowersSignLS: boolean;
    deviatingLumbopelvicRhythm: boolean;
    deviatingFlexionRotation: boolean;
    deviatingExtensionRotation: boolean;
  };

  cervicalAROMCheckmarks: {
    pain: boolean;
    poorCoordination: boolean;
    abnormalJointPlay: boolean;
    motionNotSmooth: boolean;
    hypomobilityThoracic: boolean;
    fatigueHoldingHead: boolean;
  };
}


const InitialVisitForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  Modal.setAppElement('#root');
const [modalIsOpen, setModalIsOpen] = useState(false);
const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false);

const { data: patientData, isLoading } = useQuery({
  queryKey: ['patientData', id],
  queryFn: async () => {
    const res = await axios.get(`https://emr-h.onrender.com/api/patients/${id}`);
    console.log("Patient API Response:", res.data);
    if (!res.data) throw new Error("No patient data returned");
    return res.data; // ✅ Fix: directly return res.data (not res.data.patient)
  },
  enabled: !!id,
});


  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // Use the defined interface for the state type
 const [formData, setFormData] = useState<InitialVisitFormData>({
  chiefComplaint: '',
  diagnosis: [],
  vitals: { heightFeet: '', heightInches: '', weight: '', temp: '', bpSystolic: '', bpDiastolic: '', pulse: '' },
  grip: { right1: '', right2: '', right3: '', left1: '', left2: '', left3: '' },
  appearance: [],
  appearanceOther: '',
  orientation: { timePlacePerson: false, otherChecked: false, other: '' },
  posture: [],
  gait: [],
  gaitDevice: '',
  dtr: [],
  dtrOther: '',
  dermatomes: {},
  muscleStrength: [],
  strength: {
    C5: '', C6: '', C7: '', C8: '', T1: '',
    L2: '', L3: '', L4: '', L5: '', S1: ''
  },
  oriented: false,
  neuroNote: '',
  coordination: false,
  romberg: [],
  rombergNotes: '',
  pronatorDrift: '',
  neuroTests: [],
  walkTests: [],
  painLocation: [],
  radiatingTo: '',
  jointDysfunction: [],
  jointOther: '',

  chiropracticAdjustment: [],
  chiropracticOther: '',
  acupuncture: [],
  acupunctureOther: '',
  physiotherapy: [],
  rehabilitationExercises: [],
  durationFrequency: { timesPerWeek: '', reEvalInWeeks: '' },
  referrals: [],
  imaging: { xray: [], mri: [], ct: [] },
  diagnosticUltrasound: '',
  nerveStudy: [],
  restrictions: {
    avoidActivityWeeks: '',
    liftingLimitLbs: '',
    avoidProlongedSitting: false
  },
  disabilityDuration: '',
  otherNotes: '',

  arom: {}, // Will store nested regions like cervical.flexion.wnl etc.
  ortho: {}, // Will store test.left and test.right etc.
  tenderness: {},
  spasm: {},

  lumbarTouchingToesMovement: {
    pain: false,
    painTS: false,
    painLS: false,
    acceleration: false,
    accelerationTSPain: false,
    accelerationLSPain: false,
    deceleration: false,
    decelerationTSPain: false,
    decelerationLSPain: false,
    gowersSign: false,
    gowersSignTS: false,
    gowersSignLS: false,
    deviatingLumbopelvicRhythm: false,
    deviatingFlexionRotation: false,
    deviatingExtensionRotation: false,
  },
  cervicalAROMCheckmarks: {
    pain: false,
    poorCoordination: false,
    abnormalJointPlay: false,
    motionNotSmooth: false,
    hypomobilityThoracic: false,
    fatigueHoldingHead: false
  }
});

  const handleCheckboxArrayChange = (field: string, value: string, group?: keyof Omit<InitialVisitFormData, 'durationFrequency' | 'restrictions'>) => {
    setFormData(prev => {
      let targetArray: string[] = [];

      if (group) {
        const parent = prev[group];
        if (typeof parent === 'object' && parent !== null && field in parent && Array.isArray((parent as any)[field])) {
          targetArray = (parent as any)[field];
        }
      } else {
        if (field in prev && Array.isArray(prev[field as keyof InitialVisitFormData])) {
           targetArray = prev[field as keyof InitialVisitFormData] as string[];
        }
      }

      const updated = targetArray.includes(value)
        ? targetArray.filter((item: string) => item !== value)
        : [...targetArray, value];

      if (group) {
        return {
          ...prev,
          [group]: {
            ...(prev[group] as any),
            [field]: updated
          }
        };
      } else {
        return {
          ...prev,
          [field as keyof InitialVisitFormData]: updated
        };
      }
    });

    triggerAutoSave();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => {
      if (name.includes('.')) {
        const [group, field] = name.split('.') as [keyof InitialVisitFormData, string];
        const currentGroup = prev[group] as any;
        return {
          ...prev,
          [group]: {
            ...(typeof currentGroup === 'object' && currentGroup !== null ? currentGroup : {}),
            [field]: type === 'checkbox' ? checked : value
          }
        };
      }
      return { ...prev, [name as keyof InitialVisitFormData]: type === 'checkbox' ? checked : value };
    });

    triggerAutoSave();
  };

  const triggerAutoSave = () => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    
    const timer = setTimeout(() => {
      try {
        const dataString = JSON.stringify(formData);
        const lastSaved = localStorage.getItem(`initialVisit_${id}`);
        
        // Only save if data has actually changed
        if (dataString !== lastSaved) {
          localStorage.setItem(`initialVisit_${id}`, dataString);
          setAutoSaveStatus('Auto-saved');
          setTimeout(() => setAutoSaveStatus(''), 2000);
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
        setAutoSaveStatus('Save failed');
        setTimeout(() => setAutoSaveStatus(''), 2000);
      }
    }, 4000); // Even longer delay - 4 seconds
    
    setAutoSaveTimer(timer);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
  
    try {
      // First, save the visit data
      const response = await axios.post(`https://emr-h.onrender.com/api/visits`, {
         ...formData,
         patient: id,
         doctor: user?._id,
         visitType: 'initial'
      });

      const savedVisitId = response.data.visit._id;
      
      // Then, generate AI narrative
      try {
        const aiResponse = await axios.post(`https://emr-h.onrender.com/api/generate-narrative`, {
          ...formData,
          visitType: 'initial'
        });

        if (aiResponse.data.success) {
          // Update the visit with the AI narrative
          await axios.patch(`https://emr-h.onrender.com/api/visits/${savedVisitId}`, {
            aiNarrative: aiResponse.data.narrative
          });
        }
      } catch (aiError) {
        console.error('Error generating AI narrative:', aiError);
        // Continue with the form submission even if AI generation fails
      }

      localStorage.removeItem(`initialVisit_${id}`);
      setAutoSaveStatus('Visit saved successfully!');
      setTimeout(() => {
        setAutoSaveStatus('');
        navigate(`/patients/${id}`);
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setAutoSaveStatus('Error saving visit. Please try again.');
      setTimeout(() => setAutoSaveStatus(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };
  
  // ✅ Add this handler above your return statement
  const handleNestedInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parts = name.split('.');
  
    setFormData((prev) => {
      const updated = { ...prev };
  
      if (parts[0] === 'arom') {
        // arom.CERVICAL.FLEXION.wnl
        const [_, region, movement, field] = parts;
        updated.arom = {
          ...prev.arom,
          [region]: {
            ...(prev.arom?.[region] || {}),
            [movement]: {
              ...(prev.arom?.[region]?.[movement] || {}),
              [field]: value
            }
          }
        };
      } else if (parts[0] === 'ortho') {
        const [_, test, side] = parts;
        updated.ortho = {
          ...prev.ortho,
          [test]: {
            ...(prev.ortho?.[test] || {}),
            [side]: value
          }
        };
      } else if (parts[0] === 'tenderness' || parts[0] === 'spasm') {
        const [section, region, index] = parts;
        updated[section] = {
          ...prev[section],
          [region]: [
            ...(prev[section]?.[region] || []),
          ]
        };
        updated[section][region][index] = value;
      }
  
      return updated;
    });
  
    triggerAutoSave();
  };

// Add this above your return statement
const handleTendernessSpasmChange = (
  section: string,
  type: 'tenderness' | 'spasm',
  label: string,
  checked: boolean
) => {
  setFormData(prev => {
    const prevArr = Array.isArray(prev[type][section]) ? prev[type][section] : [];
    return {
      ...prev,
      [type]: {
        ...prev[type],
        [section]: checked
          ? [...prevArr, label]
          : prevArr.filter(item => item !== label)
      }
    };
  });
  triggerAutoSave();
};

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-4">
        <button onClick={() => navigate(-1)} className="mr-2 text-gray-600 hover:text-black">
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-semibold">Initial Visit Form</h1>
      </div>

      {autoSaveStatus && (
        <div className="text-green-700 bg-green-100 p-2 rounded mb-4">{autoSaveStatus}</div>
      )}
      
      <div className="min-h-screen bg-gray-100 py-6 px-6">
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setModalIsOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            View Chief Complaint
          </button>
        </div>
        
        <div className="w-full bg-white rounded-md shadow-md p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">EXAM</h1>
          
          <form onSubmit={handleSubmit}>

<section className="mt-4 text-sm text-black w-full">
  <h2 className="text-lg font-semibold mb-2">Chief Complaint</h2>
  <textarea
    name="chiefComplaint"
    value={formData.chiefComplaint}
    onChange={handleInputChange}
    rows={3}
    className="w-full border rounded px-3 py-2"
    placeholder="Enter chief complaint..."
    required
  />
</section>

<section className="mt-6 text-sm text-black w-full">
  <h2 className="text-lg font-semibold mb-2">Diagnosis</h2>
  <div className="flex items-center gap-4">
    <button
      type="button"
      onClick={() => setDiagnosisModalOpen(true)}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    >
      Select Diagnoses
    </button>
    <span className="text-gray-600">
      {formData.diagnosis.length > 0 
        ? `${formData.diagnosis.length} diagnosis(es) selected`
        : 'No diagnoses selected'
      }
    </span>
  </div>
  {formData.diagnosis.length > 0 && (
    <div className="mt-2 p-2 bg-gray-50 rounded">
      <p className="text-sm font-medium">Selected Diagnoses:</p>
      <ul className="mt-1 text-sm text-gray-700">
        {formData.diagnosis.map((diagnosis, index) => (
          <li key={index} className="list-disc list-inside">{diagnosis}</li>
        ))}
      </ul>
    </div>
  )}
</section>

{/* ------------------- VITALS & GRIP ------------------- */}

<section className="mt-6 w-full">
  <h2 className="text-xl font-semibold mb-4 text-gray-800">VITALS</h2>
  
  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-sm w-full">
    <div>
      <label className="block mb-1 text-gray-700">Height (ft)</label>
      <input
        type="text"
        name="vitals.heightFeet"
        value={formData.vitals.heightFeet || ''}
        onChange={handleInputChange}
        className="w-full border border-black rounded px-2 py-1"
        placeholder="5"
      />
    </div>

    <div>
      <label className="block mb-1 text-gray-700">Height (in)</label>
      <input
        type="text"
        name="vitals.heightInches"
        value={formData.vitals.heightInches || ''}
        onChange={handleInputChange}
        className="w-full border border-black rounded px-2 py-1"
        placeholder="10"
      />
    </div>

    <div>
      <label className="block mb-1 text-gray-700">Weight (lbs)</label>
      <input
        type="text"
        name="vitals.weight"
        value={formData.vitals.weight || ''}
        onChange={handleInputChange}
        className="w-full border border-black rounded px-2 py-1"
      />
    </div>

    <div>
      <label className="block mb-1 text-gray-700">Temperature (°F)</label>
      <input
        type="text"
        name="vitals.temp"
        value={formData.vitals.temp || ''}
        onChange={handleInputChange}
        className="w-full border border-black rounded px-2 py-1"
      />
    </div>

    <div>
      <label className="block mb-1 text-gray-700">BP Systolic</label>
      <input
        type="text"
        name="vitals.bpSystolic"
        placeholder="120"
        value={formData.vitals.bpSystolic || ''}
        onChange={handleInputChange}
        className="w-full border border-black rounded px-2 py-1"
      />
    </div>

    <div>
      <label className="block mb-1 text-gray-700">BP Diastolic</label>
      <input
        type="text"
        name="vitals.bpDiastolic"
        placeholder="80"
        value={formData.vitals.bpDiastolic || ''}
        onChange={handleInputChange}
        className="w-full border border-black rounded px-2 py-1"
      />
    </div>

    <div>
      <label className="block mb-1 text-gray-700">Pulse</label>
      <input
        type="text"
        name="vitals.pulse"
        value={formData.vitals.pulse || ''}
        onChange={handleInputChange}
        className="w-full border border-black rounded px-2 py-1"
      />
    </div>
  </div>

  <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-800">GRIP (kg)</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm w-full">
    <div className="w-full">
      <label className="block mb-1 font-medium text-gray-700">Right Hand</label>
      <div className="flex gap-2">
        <input
          type="text"
          name="grip.right1"
          value={formData.grip?.right1 || ''}
          onChange={handleInputChange}
          className="w-full border border-black rounded px-2 py-1 text-center"
        />
        <span className="self-center">/</span>
        <input
          type="text"
          name="grip.right2"
          value={formData.grip?.right2 || ''}
          onChange={handleInputChange}
          className="w-full border border-black rounded px-2 py-1 text-center"
        />
        <span className="self-center">/</span>
        <input
          type="text"
          name="grip.right3"
          value={formData.grip?.right3 || ''}
          onChange={handleInputChange}
          className="w-full border border-black rounded px-2 py-1 text-center"
        />
      </div>
    </div>

    <div className="w-full">
      <label className="block mb-1 font-medium text-gray-700">Left Hand</label>
      <div className="flex gap-2">
        <input
          type="text"
          name="grip.left1"
          value={formData.grip?.left1 || ''}
          onChange={handleInputChange}
          className="w-full border border-black rounded px-2 py-1 text-center"
        />
        <span className="self-center">/</span>
        <input
          type="text"
          name="grip.left2"
          value={formData.grip?.left2 || ''}
          onChange={handleInputChange}
          className="w-full border border-black rounded px-2 py-1 text-center"
        />
        <span className="self-center">/</span>
        <input
          type="text"
          name="grip.left3"
          value={formData.grip?.left3 || ''}
          onChange={handleInputChange}
          className="w-full border border-black rounded px-2 py-1 text-center"
        />
      </div>
    </div>
  </div>
</section>


{/* ------------------- APPEARANCE, ORIENTATION, POSTURE ------------------- */}
<section className="mt-8 w-full text-sm">
  {/* Appearance & Orientation Section */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    {/* Appearance */}
    <div>
      <h3 className="font-semibold text-gray-800 mb-2">Appearance</h3>
      <div className="flex flex-wrap gap-4">
        {['Well-nourished', 'Obese'].map(label => (
          <label key={label} className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.appearance?.includes(label)}
              onChange={() => handleCheckboxArrayChange('appearance', label)}
              className="accent-indigo-600"
            />
            {label}
          </label>
        ))}
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.appearance?.includes('Other')}
            onChange={() => handleCheckboxArrayChange('appearance', 'Other')}
            className="accent-indigo-600"
          />
          Other
          <input
            type="text"
            name="appearanceOther"
            value={formData.appearanceOther || ''}
            onChange={handleInputChange}
            placeholder="Specify"
            className="border border-black rounded px-2 py-1 w-36"
          />
        </label>
      </div>
    </div>

    {/* Orientation */}
    <div>
      <h3 className="font-semibold text-gray-800 mb-2">Orientation</h3>
      <div className="flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            name="orientation.timePlacePerson"
            checked={formData.orientation?.timePlacePerson}
            onChange={handleInputChange}
            className="accent-indigo-600"
          />
          Time, Place, Person
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.orientation?.otherChecked}
            onChange={() => handleCheckboxArrayChange('orientationOtherChecked', 'checked')}
            className="accent-indigo-600"
          />
          Other
        </label>
      </div>
    </div>
  </div>

  {/* Posture */}
  <div>
    <h3 className="font-semibold text-gray-800 mb-2">Posture</h3>
    <div className="flex flex-wrap gap-4">
      {['Antalgic', 'Hyperkyphotic', 'Hyperlordotic', 'Scoliosis', 'Anthead carriage'].map(posture => (
        <label key={posture} className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.posture?.includes(posture)}
            onChange={() => handleCheckboxArrayChange('posture', posture)}
            className="accent-indigo-600"
          />
          {posture}
        </label>
      ))}
    </div>
  </div>
</section>

{/* ------------------- GAIT ------------------- */}

<div className="w-full mt-8">
  <h3 className="text-md font-semibold text-gray-800 mb-2">Gait</h3>
  <div className="flex flex-wrap gap-4 mb-3">
    {['Normal', 'Antalgic', 'Shuffling', 'Unsteady', 'Favor RLE / LLE'].map(gait => (
      <label key={gait} className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={formData.gait?.includes(gait)}
          onChange={() => handleCheckboxArrayChange('gait', gait)}
          className="accent-indigo-600"
        />
        {gait}
      </label>
    ))}
  </div>

  <div className="mt-2">
    <label className="flex items-center gap-3 text-sm">
      Requires the use of:
      <input
        type="text"
        name="gaitDevice"
        value={formData.gaitDevice || ''}
        onChange={handleInputChange}
        placeholder="Specify assistive device"
        className="border border-gray-400 rounded px-3 py-1 w-64"
      />
    </label>
  </div>
</div>


{/* ------------------- DTR, DERMATOMES, MUSCLE STRENGTH ------------------- */}
<section className="w-full mt-8 text-sm space-y-6">

  {/* ------------------- DTR ------------------- */}
  <div>
    <h3 className="text-md font-semibold mb-2">DTR</h3>
    <div className="flex flex-wrap items-center gap-4">
      {['+2 Bilateral and Symmetrical', 'Asymmetrical'].map(label => (
        <label key={label} className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.dtr?.includes(label)}
            onChange={() => handleCheckboxArrayChange('dtr', label)}
            className="accent-indigo-600"
          />
          {label}
        </label>
      ))}
      <input
        type="text"
        name="dtrOther"
        value={formData.dtrOther || ''}
        onChange={handleInputChange}
        placeholder="Other..."
        className="border border-gray-400 rounded px-3 py-1 w-64"
      />
    </div>
  </div>

  {/* ------------------- DERMATOMES ------------------- */}
  <div>
    <h3 className="text-md font-semibold mb-2">DERMATOMES</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Cervical Dermatomes */}
      <div className="border p-3 rounded">
        <h4 className="font-medium mb-2">Cervical (C1-C8)</h4>
        {[
          { root: 'C2', area: 'Back of the head' },
          { root: 'C3', area: 'Neck' },
          { root: 'C4', area: 'Shoulder tops, clavicle' },
          { root: 'C5', area: 'Lateral upper arm (deltoid area)' },
          { root: 'C6', area: 'Thumb side of forearm and thumb' },
          { root: 'C7', area: 'Middle finger' },
          { root: 'C8', area: 'Pinky side of hand and forearm' }
        ].map(({ root, area }) => (
          <div key={root} className="mb-2 text-sm">
            <div className="font-medium">{root} - {area}</div>
            <div className="flex gap-2 mt-1">
              <label className="flex items-center gap-1">
                <span className="text-xs">L:</span>
                <input
                  type="checkbox"
                  checked={formData.dermatomes?.[root]?.left?.hypo || false}
                  onChange={(e) => {
                    const updated = { ...formData.dermatomes };
                    if (!updated[root]) updated[root] = { left: { hypo: false, hyper: false }, right: { hypo: false, hyper: false } };
                    updated[root].left.hypo = e.target.checked;
                    setFormData(prev => ({ ...prev, dermatomes: updated }));
                  }}
                  className="w-3 h-3"
                />
                <span className="text-xs">Hypo</span>
                <input
                  type="checkbox"
                  checked={formData.dermatomes?.[root]?.left?.hyper || false}
                  onChange={(e) => {
                    const updated = { ...formData.dermatomes };
                    if (!updated[root]) updated[root] = { left: { hypo: false, hyper: false }, right: { hypo: false, hyper: false } };
                    updated[root].left.hyper = e.target.checked;
                    setFormData(prev => ({ ...prev, dermatomes: updated }));
                  }}
                  className="w-3 h-3"
                />
                <span className="text-xs">Hyper</span>
              </label>
              <label className="flex items-center gap-1">
                <span className="text-xs">R:</span>
                <input
                  type="checkbox"
                  checked={formData.dermatomes?.[root]?.right?.hypo || false}
                  onChange={(e) => {
                    const updated = { ...formData.dermatomes };
                    if (!updated[root]) updated[root] = { left: { hypo: false, hyper: false }, right: { hypo: false, hyper: false } };
                    updated[root].right.hypo = e.target.checked;
                    setFormData(prev => ({ ...prev, dermatomes: updated }));
                  }}
                  className="w-3 h-3"
                />
                <span className="text-xs">Hypo</span>
                <input
                  type="checkbox"
                  checked={formData.dermatomes?.[root]?.right?.hyper || false}
                  onChange={(e) => {
                    const updated = { ...formData.dermatomes };
                    if (!updated[root]) updated[root] = { left: { hypo: false, hyper: false }, right: { hypo: false, hyper: false } };
                    updated[root].right.hyper = e.target.checked;
                    setFormData(prev => ({ ...prev, dermatomes: updated }));
                  }}
                  className="w-3 h-3"
                />
                <span className="text-xs">Hyper</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Thoracic Dermatomes */}
      <div className="border p-3 rounded">
        <h4 className="font-medium mb-2">Thoracic (T1-T12)</h4>
        {[
          { root: 'T1', area: 'Inner forearm' },
          { root: 'T4', area: 'Nipple line' },
          { root: 'T10', area: 'Belly button (umbilicus)' },
          { root: 'T12', area: 'Just above the groin' }
        ].map(({ root, area }) => (
          <div key={root} className="mb-2 text-sm">
            <div className="font-medium">{root} - {area}</div>
            <div className="flex gap-2 mt-1">
              <label className="flex items-center gap-1">
                <span className="text-xs">L:</span>
                <input
                  type="checkbox"
                  checked={formData.dermatomes?.[root]?.left?.hypo || false}
                  onChange={(e) => {
                    const updated = { ...formData.dermatomes };
                    if (!updated[root]) updated[root] = { left: { hypo: false, hyper: false }, right: { hypo: false, hyper: false } };
                    updated[root].left.hypo = e.target.checked;
                    setFormData(prev => ({ ...prev, dermatomes: updated }));
                  }}
                  className="w-3 h-3"
                />
                <span className="text-xs">Hypo</span>
                <input
                  type="checkbox"
                  checked={formData.dermatomes?.[root]?.left?.hyper || false}
                  onChange={(e) => {
                    const updated = { ...formData.dermatomes };
                    if (!updated[root]) updated[root] = { left: { hypo: false, hyper: false }, right: { hypo: false, hyper: false } };
                    updated[root].left.hyper = e.target.checked;
                    setFormData(prev => ({ ...prev, dermatomes: updated }));
                  }}
                  className="w-3 h-3"
                />
                <span className="text-xs">Hyper</span>
              </label>
              <label className="flex items-center gap-1">
                <span className="text-xs">R:</span>
                <input
                  type="checkbox"
                  checked={formData.dermatomes?.[root]?.right?.hypo || false}
                  onChange={(e) => {
                    const updated = { ...formData.dermatomes };
                    if (!updated[root]) updated[root] = { left: { hypo: false, hyper: false }, right: { hypo: false, hyper: false } };
                    updated[root].right.hypo = e.target.checked;
                    setFormData(prev => ({ ...prev, dermatomes: updated }));
                  }}
                  className="w-3 h-3"
                />
                <span className="text-xs">Hypo</span>
                <input
                  type="checkbox"
                  checked={formData.dermatomes?.[root]?.right?.hyper || false}
                  onChange={(e) => {
                    const updated = { ...formData.dermatomes };
                    if (!updated[root]) updated[root] = { left: { hypo: false, hyper: false }, right: { hypo: false, hyper: false } };
                    updated[root].right.hyper = e.target.checked;
                    setFormData(prev => ({ ...prev, dermatomes: updated }));
                  }}
                  className="w-3 h-3"
                />
                <span className="text-xs">Hyper</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Lumbar and Sacral Dermatomes */}
      <div className="border p-3 rounded">
        <h4 className="font-medium mb-2">Lumbar & Sacral</h4>
        {[
          { root: 'L1', area: 'Groin' },
          { root: 'L2', area: 'Upper thigh' },
          { root: 'L3', area: 'Inner thigh to knee' },
          { root: 'L4', area: 'Knee and medial ankle' },
          { root: 'L5', area: 'Lateral leg, dorsum of foot, big toe' },
          { root: 'S1', area: 'Lateral foot and heel' },
          { root: 'S2', area: 'Back of the thigh' },
          { root: 'S3-S5', area: 'Perianal area (S5 = innermost)' }
        ].map(({ root, area }) => (
          <div key={root} className="mb-2 text-sm">
            <div className="font-medium">{root} - {area}</div>
            <div className="flex gap-2 mt-1">
              <label className="flex items-center gap-1">
                <span className="text-xs">L:</span>
                <input
                  type="checkbox"
                  checked={formData.dermatomes?.[root]?.left?.hypo || false}
                  onChange={(e) => {
                    const updated = { ...formData.dermatomes };
                    if (!updated[root]) updated[root] = { left: { hypo: false, hyper: false }, right: { hypo: false, hyper: false } };
                    updated[root].left.hypo = e.target.checked;
                    setFormData(prev => ({ ...prev, dermatomes: updated }));
                  }}
                  className="w-3 h-3"
                />
                <span className="text-xs">Hypo</span>
                <input
                  type="checkbox"
                  checked={formData.dermatomes?.[root]?.left?.hyper || false}
                  onChange={(e) => {
                    const updated = { ...formData.dermatomes };
                    if (!updated[root]) updated[root] = { left: { hypo: false, hyper: false }, right: { hypo: false, hyper: false } };
                    updated[root].left.hyper = e.target.checked;
                    setFormData(prev => ({ ...prev, dermatomes: updated }));
                  }}
                  className="w-3 h-3"
                />
                <span className="text-xs">Hyper</span>
              </label>
              <label className="flex items-center gap-1">
                <span className="text-xs">R:</span>
                <input
                  type="checkbox"
                  checked={formData.dermatomes?.[root]?.right?.hypo || false}
                  onChange={(e) => {
                    const updated = { ...formData.dermatomes };
                    if (!updated[root]) updated[root] = { left: { hypo: false, hyper: false }, right: { hypo: false, hyper: false } };
                    updated[root].right.hypo = e.target.checked;
                    setFormData(prev => ({ ...prev, dermatomes: updated }));
                  }}
                  className="w-3 h-3"
                />
                <span className="text-xs">Hypo</span>
                <input
                  type="checkbox"
                  checked={formData.dermatomes?.[root]?.right?.hyper || false}
                  onChange={(e) => {
                    const updated = { ...formData.dermatomes };
                    if (!updated[root]) updated[root] = { left: { hypo: false, hyper: false }, right: { hypo: false, hyper: false } };
                    updated[root].right.hyper = e.target.checked;
                    setFormData(prev => ({ ...prev, dermatomes: updated }));
                  }}
                  className="w-3 h-3"
                />
                <span className="text-xs">Hyper</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* ------------------- MUSCLE STRENGTH ------------------- */}
  <div>
    <h3 className="text-md font-semibold mb-3">MUSCLE STRENGTH</h3>

    <div className="flex flex-wrap items-center gap-4 mb-4">
      {['+5/5 Upper and Lower Extremities', 'Weakness'].map(label => (
        <label key={label} className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.muscleStrength?.includes(label)}
            onChange={() => handleCheckboxArrayChange('muscleStrength', label)}
            className="accent-indigo-600"
          />
          {label}
        </label>
      ))}
    </div>

    {/* Strength Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { key: 'C5', desc: 'Shoulder abduction – Deltoid', muscle: 'Deltoid' },
        { key: 'C5-C6', desc: 'Elbow flexion – Biceps', muscle: 'Biceps' },
        { key: 'C7', desc: 'Elbow extension – Triceps', muscle: 'Triceps' },
        { key: 'C6', desc: 'Wrist extension', muscle: 'Wrist extensors' },
        { key: 'C8-T1', desc: 'Grip strength', muscle: 'Grip' },
        { key: 'L2-L3', desc: 'Hip flexion – Iliopsoas', muscle: 'Iliopsoas' },
        { key: 'L3-L4', desc: 'Knee extension – Quadriceps', muscle: 'Quadriceps' },
        { key: 'L4-L5', desc: 'Ankle dorsiflexion – Tibialis anterior', muscle: 'Tibialis anterior' },
        { key: 'S1', desc: 'Ankle plantarflexion – Gastrocnemius', muscle: 'Gastrocnemius' },
      ].map(({ key, desc, muscle }) => (
        <div key={key} className="text-sm border p-2 rounded">
          <div className="font-medium mb-1">{muscle} ({key})</div>
          <div className="flex gap-2">
            <label className="flex items-center gap-1">
              <span className="text-xs">R:</span>
              <select
                name={`strength.${key}.right`}
                value={formData.strength?.[`${key}.right`] || ''}
                onChange={handleInputChange}
                className="border border-gray-400 rounded px-2 py-1 text-xs"
              >
                <option value="">-</option>
                <option value="1">1/5</option>
                <option value="2">2/5</option>
                <option value="3">3/5</option>
                <option value="4">4/5</option>
                <option value="5">5/5</option>
              </select>
            </label>
            <label className="flex items-center gap-1">
              <span className="text-xs">L:</span>
              <select
                name={`strength.${key}.left`}
                value={formData.strength?.[`${key}.left`] || ''}
                onChange={handleInputChange}
                className="border border-gray-400 rounded px-2 py-1 text-xs"
              >
                <option value="">-</option>
                <option value="1">1/5</option>
                <option value="2">2/5</option>
                <option value="3">3/5</option>
                <option value="4">4/5</option>
                <option value="5">5/5</option>
              </select>
            </label>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>


  {/* NEUROLOGICAL */}
  <section className="w-full mt-6 p-4 border border-gray-300 rounded bg-white text-sm space-y-4">
  <h3 className="text-lg font-semibold">NEUROLOGICAL</h3>

  <div className="flex flex-wrap gap-6">
    <label className="inline-flex items-center gap-2">
      <input type="checkbox" name="oriented" checked={formData.oriented} onChange={handleInputChange} />
      Oriented to time, place, and person
    </label>
    <label className="flex items-center gap-2">
      Note:
      <input
        type="text"
        name="neuroNote"
        value={formData.neuroNote || ''}
        onChange={handleInputChange}
        className="border px-2 py-1 rounded w-72"
        placeholder="Add note..."
      />
    </label>
  </div>

  <div className="flex flex-wrap gap-6 items-center">
    <span className="font-medium">Coordination Tests:</span>
    <label className="inline-flex items-center gap-2">
      <input type="checkbox" name="coordination" checked={formData.coordination} onChange={handleInputChange} />
      Negative
    </label>
  </div>

  <div className="flex flex-wrap gap-6 items-center">
    {['Romberg', 'Positive', 'Unsteady'].map(test => (
      <label key={test} className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.romberg?.includes(test)}
          onChange={() => handleCheckboxArrayChange('romberg', test)}
        />
        {test}
      </label>
    ))}
    <label className="inline-flex items-center gap-2">
      Notes:
      <input
        type="text"
        name="rombergNotes"
        value={formData.rombergNotes || ''}
        onChange={handleInputChange}
        className="border px-2 py-1 rounded w-64"
      />
    </label>
    <label className="inline-flex items-center gap-2">
      Pronator Drift:
      <input
        type="text"
        name="pronatorDrift"
        value={formData.pronatorDrift || ''}
        onChange={handleInputChange}
        className="border px-2 py-1 rounded w-64"
      />
    </label>
  </div>

  <div className="flex flex-wrap gap-6">
    {['Finger to Finger', 'Positive', 'Finger to Nose', 'Hoffman', 'Babinski', 'Chaddock', 'Oppenheim'].map(test => (
      <label key={test} className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.neuroTests?.includes(test)}
          onChange={() => handleCheckboxArrayChange('neuroTests', test)}
        />
        {test}
      </label>
    ))}
  </div>

  <div className="flex flex-wrap gap-6 items-center">
    {['Heel Walk/Toe Walk', 'Positive'].map(test => (
      <label key={test} className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.walkTests?.includes(test)}
          onChange={() => handleCheckboxArrayChange('walkTests', test)}
        />
        {test}
      </label>
    ))}
    <span>Pain in the:</span>
    <label className="inline-flex items-center gap-2">
      <input
        type="checkbox"
        checked={formData.painLocation?.includes('T/S')}
        onChange={() => handleCheckboxArrayChange('painLocation', 'T/S')}
      />
      T/S
    </label>
    <label className="inline-flex items-center gap-2">
      <input
        type="checkbox"
        checked={formData.painLocation?.includes('L/S')}
        onChange={() => handleCheckboxArrayChange('painLocation', 'L/S')}
      />
      L/S
    </label>
    <span>Radiating to:</span>
    <input
      type="text"
      name="radiatingTo"
      value={formData.radiatingTo || ''}
      onChange={handleInputChange}
      className="border px-2 py-1 rounded w-64"
    />
  </div>
</section>


  {/* INTERSEGMENTAL AND JOINT DYSFUNCTION */}
  <section className="w-full mt-6 p-4 border border-gray-300 rounded bg-white text-sm space-y-4">
  <h3 className="text-lg font-semibold">INTERSEGMENTAL AND JOINT DYSFUNCTION</h3>

  <div className="flex flex-wrap gap-x-6 gap-y-3">
    {[
      'Cervical',
      'Thoracic',
      'Lumbar',
      'Sacroiliac (SIJ)',
      'Shoulder (GHJ)',
      'Elbow',
      'Wrist (carpals)',
      'Hip',
      'Knee',
      'Ankle',
    ].map(joint => (
      <label key={joint} className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.jointDysfunction?.includes(joint)}
          onChange={() => handleCheckboxArrayChange('jointDysfunction', joint)}
        />
        {joint} R / L
      </label>
    ))}

    <label className="inline-flex items-center gap-2 w-full md:w-auto">
      Other:
      <input
        type="text"
        name="jointOther"
        value={formData.jointOther || ''}
        onChange={handleInputChange}
        className="border px-2 py-1 rounded w-64"
        placeholder="Specify other joint..."
      />
    </label>
  </div>
</section>


  <div className="border border-black w-full text-sm">
  <div className="grid grid-cols-2 divide-x divide-black">

  {/* //-----------tables code-------------- */}
    {/* Left Column */}
    <div className="p-4 space-y-2">
      <h2 className="font-bold uppercase">LUMBAR – Touching Toes Movement</h2>

      <div>
        <label className="block"><input type="checkbox" className="mr-2" />Pain <input type="checkbox" className="ml-4 mr-1" />T/S <input type="checkbox" className="ml-4 mr-1" />L/S</label>
      </div>
      <div>
        <label className="block"><input type="checkbox" className="mr-2" />Acceleration <input type="checkbox" className="ml-4 mr-1" />T/S Pain <input type="checkbox" className="ml-4 mr-1" />L/S Pain</label>
      </div>
      <div>
        <label className="block"><input type="checkbox" className="mr-2" />Deceleration <input type="checkbox" className="ml-4 mr-1" />T/S Pain <input type="checkbox" className="ml-4 mr-1" />L/S Pain</label>
      </div>
      <div>
        <label className="block"><input type="checkbox" className="mr-2" />Gower's Sign Present <input type="checkbox" className="ml-4 mr-1" />T/S <input type="checkbox" className="ml-4 mr-1" />L/S</label>
      </div>
      <div>
        <label className="block"><input type="checkbox" className="mr-2" />Deviating Lumbopelvic Rhythm (not smooth)</label>
      </div>
      <div>
        <label className="block"><input type="checkbox" className="mr-2" />Deviating Flexion-Lateral/Rotation Movements</label>
      </div>
      <div>
        <label className="block"><input type="checkbox" className="mr-2" />Deviating Extension-Lateral/Rotation Movements</label>
      </div>
    </div>

    {/* Right Column */}
    <div className="p-4 space-y-2">
      <h2 className="font-bold uppercase">CERVICAL – AROM</h2>

      <div>
        <label className="block"><input type="checkbox" className="mr-2" />Pain</label>
      </div>
      <div>
        <label className="block"><input type="checkbox" className="mr-2" />Poor Coordination/Neuromuscular Control</label>
      </div>
      <div>
        <label className="block"><input type="checkbox" className="mr-2" />Abnormal Joint Play, Clunking</label>
      </div>
      <div>
        <label className="block"><input type="checkbox" className="mr-2" />Motion that is Not Smooth throughout AROM</label>
      </div>
      <div>
        <label className="block"><input type="checkbox" className="mr-2" />Hypomobility of Upper Thoracic Spine</label>
      </div>
      <div>
        <label className="block"><input type="checkbox" className="mr-2" />Fatigue and Inability to Hold Head Up</label>
      </div>
    </div>
  </div>
</div>


<section className="mt-8 text-sm text-black w-full">
  <h2 className="text-lg font-bold mb-2">AROM/ORTHOPEDIC TESTING</h2>

  <div className="grid grid-cols-2 gap-6 w-full">
  {/* Left Side: CERVICAL AROM */}
  <table className="table-fixed border border-black w-full text-center">
    <thead>
      <tr className="bg-gray-100">
        <th className="border border-black px-2 py-1">CERVICAL</th>
        <th className="border border-black px-2 py-1">NL</th>
        <th className="border border-black px-2 py-1">WNL</th>
        <th className="border border-black px-2 py-1">EXAM</th>
        <th className="border border-black px-2 py-1">PAIN</th>
      </tr>
    </thead>
    <tbody>
      {[
        ['FLEXION', '50°'],
        ['EXTENSION', '60°'],
        ['L LAT BEND', '45°'],
        ['R LAT BEND', '45°'],
        ['L ROTATION', '80°'],
        ['R ROTATION', '80°'],
      ].map(([label, nl]) => (
        <tr key={label}>
          <td className="border border-black px-2 py-1">{label}</td>
          <td className="border border-black px-2 py-1">{nl}</td>
          <td className="border border-black px-2 py-1">
            <input
              type="text"
              name={`arom.CERVICAL.${label}.wnl`}
              value={formData.arom?.CERVICAL?.[label]?.wnl || ''}
              onChange={handleNestedInputChange}
              className="w-full px-1 py-0.5"
            />
          </td>
          <td className="border border-black px-2 py-1">
            <input
              type="text"
              name={`arom.CERVICAL.${label}.exam`}
              value={formData.arom?.CERVICAL?.[label]?.exam || ''}
              onChange={handleNestedInputChange}
              className="w-full px-1 py-0.5"
            />
          </td>
          <td className="border border-black px-2 py-1">
            <input
              type="text"
              name={`arom.CERVICAL.${label}.pain`}
              value={formData.arom?.CERVICAL?.[label]?.pain || ''}
              onChange={handleNestedInputChange}
              className="w-full px-1 py-0.5"
            />
          </td>
        </tr>
      ))}
    </tbody>
  </table>

    {/* Right Side: ORTHOPEDIC TEST */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">ORTHOPEDIC TEST</th>
          <th className="border border-black px-2 py-1">LEFT</th>
          <th className="border border-black px-2 py-1">RIGHT</th>
        </tr>
      </thead>
      <tbody>
        {['Cervical Compression', 'Distraction', 'Shoulder Depression', 'Valsalva', 'Soto Hall'].map(test => (
          <tr key={test}>
            <td className="border border-black px-2 py-1">{test}</td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.left`}
                value={formData.ortho?.[test]?.left || ''}
                onChange={handleNestedInputChange}
                className="w-full px-1 py-0.5"
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.right`}
                value={formData.ortho?.[test]?.right || ''}
                onChange={handleNestedInputChange}
                className="w-full px-1 py-0.5"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* TENDERNESS & SPASM */}
  <div className="mt-6 space-y-3 text-sm">
    <div>
      <span className="font-bold mr-2">TENDERNESS</span>
      {[
  'Facets',
  'C/S Paraspinal',
  'Trapezius',
  'Sub Occipital',
  'Scalene',
  'SCM',
  'Cervicothoracic',
  'Levator scapulae'
].map(label => (
  <label key={label} className="mr-4 inline-flex items-center">
    <input
      type="checkbox"
      className="mr-1"
      checked={Array.isArray(formData.tenderness.cervical) && formData.tenderness.cervical.includes(label)}
      onChange={e => handleTendernessSpasmChange('cervical', 'tenderness', label, e.target.checked)}
    />
    {label}
  </label>
))}
    </div>
    <div>
      <span className="font-bold mr-2">SPASM</span>
      {[
  'C/S Paraspinal',
  'Trapezius',
  'Sub Occipital',
  'Cervicothoracic'
].map(label => (
  <label key={label} className="mr-4 inline-flex items-center">
    <input
      type="checkbox"
      className="mr-1"
      checked={Array.isArray(formData.spasm.cervical) && formData.spasm.cervical.includes(label)}
      onChange={e => handleTendernessSpasmChange('cervical', 'spasm', label, e.target.checked)}
    />
    {label}
  </label>
))}
    </div>
  </div>
</section>

<section className="mt-10 text-sm text-black w-full">
  <div className="grid grid-cols-2 gap-6">
    {/* THORACIC AROM Table */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">THORACIC</th>
          <th className="border border-black px-2 py-1">NL</th>
          <th className="border border-black px-2 py-1">WNL</th>
          <th className="border border-black px-2 py-1">EXAM</th>
          <th className="border border-black px-2 py-1">PAIN</th>
        </tr>
      </thead>
      <tbody>
        {[
          ['FLEXION', '50°'],
          ['EXTENSION', '45°'],
          ['L LAT BEND', '40°'],
          ['R LAT BEND', '40°'],
          ['L ROTATION', '30°'],
          ['R ROTATION', '30°'],
        ].map(([label, nl]) => (
          <tr key={label}>
            <td className="border border-black px-2 py-1">{label}</td>
            <td className="border border-black px-2 py-1">{nl}</td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                className="w-full px-1 py-0.5"
                name={`arom.THORACIC.${label}.wnl`}
                value={formData.arom?.THORACIC?.[label]?.wnl || ''}
                onChange={handleNestedInputChange}
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                className="w-full px-1 py-0.5"
                name={`arom.THORACIC.${label}.exam`}
                value={formData.arom?.THORACIC?.[label]?.exam || ''}
                onChange={handleNestedInputChange}
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                className="w-full px-1 py-0.5"
                name={`arom.THORACIC.${label}.pain`}
                value={formData.arom?.THORACIC?.[label]?.pain || ''}
                onChange={handleNestedInputChange}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* ORTHOPEDIC TEST Table */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">ORTHOPEDIC TEST</th>
          <th className="border border-black px-2 py-1">LEFT</th>
          <th className="border border-black px-2 py-1">RIGHT</th>
        </tr>
      </thead>
      <tbody>
        {['Kemps', 'Valsalva', "Adam's"].map(test => (
          <tr key={test}>
            <td className="border border-black px-2 py-1">{test}</td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                className="w-full px-1 py-0.5"
                name={`ortho.${test}.left`}
                value={formData.ortho?.[test]?.left || ''}
                onChange={handleNestedInputChange}
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                className="w-full px-1 py-0.5"
                name={`ortho.${test}.right`}
                value={formData.ortho?.[test]?.right || ''}
                onChange={handleNestedInputChange}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* TENDERNESS Row */}
  <div className="mt-6">
    <strong className="mr-2">TENDERNESS</strong>
    {[
      'Sp Process',
      '1ˢᵗ Rib',
      'Facets',
      'T/S Para',
      'Trapezius',
      'Rhomboids',
      'Cervicothoracic',
      'Thoracolumbar',
    ].map(label => (
      <label key={label} className="inline-flex items-center mr-4">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.tenderness?.thoracic) && formData.tenderness.thoracic.includes(label)}
          onChange={e => handleTendernessSpasmChange('thoracic', 'tenderness', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>

  {/* SPASM Row */}
  <div className="mt-2">
    <strong className="mr-2">SPASM</strong>
    {[
      'Bilateral',
      'T/S Para',
      'Trapezius',
      'Rhomboids',
      'Cervicothoracic',
      'Thoracolumbar',
      'Inf Scap',
      'Med Scap',
      'Lat Scap',
      'Levator Scap',
    ].map(label => (
      <label key={label} className="inline-flex items-center mr-4">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.spasm?.thoracic) && formData.spasm.thoracic.includes(label)}
          onChange={e => handleTendernessSpasmChange('thoracic', 'spasm', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>
</section>

<section className="mt-10 text-sm text-black w-full">
  <div className="grid grid-cols-2 gap-6">
    {/* LUMBAR AROM Table */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">LUMBAR</th>
          <th className="border border-black px-2 py-1">NL</th>
          <th className="border border-black px-2 py-1">WNL</th>
          <th className="border border-black px-2 py-1">EXAM</th>
          <th className="border border-black px-2 py-1">PAIN</th>
        </tr>
      </thead>
      <tbody>
        {[
          ['FLEXION', '60°'],
          ['EXTENSION', '25°'],
          ['L LAT BEND', '25°'],
          ['R LAT BEND', '25°'],
          ['L ROTATION', '18°'],
          ['R ROTATION', '18°'],
          ['SACRAL ANGLE', '45°'],
        ].map(([label, nl]) => (
          <tr key={label}>
            <td className="border border-black px-2 py-1">{label}</td>
            <td className="border border-black px-2 py-1">{nl}</td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.LUMBAR.${label}.wnl`}
                className="w-full px-1 py-0.5"
                value={formData.arom?.LUMBAR?.[label]?.wnl || ''}
                onChange={handleNestedInputChange}
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.LUMBAR.${label}.exam`}
                className="w-full px-1 py-0.5"
                value={formData.arom?.LUMBAR?.[label]?.exam || ''}
                onChange={handleNestedInputChange}
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.LUMBAR.${label}.pain`}
                className="w-full px-1 py-0.5"
                value={formData.arom?.LUMBAR?.[label]?.pain || ''}
                onChange={handleNestedInputChange}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* ORTHOPEDIC TEST Table */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">ORTHOPEDIC TEST</th>
          <th className="border border-black px-2 py-1">LEFT</th>
          <th className="border border-black px-2 py-1">RIGHT</th>
        </tr>
      </thead>
      <tbody>
        {['Kemps', 'Sitting SLR', 'SLR', 'Valsalva', "Gaenslen's"].map(test => (
          <tr key={test}>
            <td className="border border-black px-2 py-1">{test}</td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.left`}
                className="w-full px-1 py-0.5"
                value={formData.ortho?.[test]?.left || ''}
                onChange={handleNestedInputChange}
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.right`}
                className="w-full px-1 py-0.5"
                value={formData.ortho?.[test]?.right || ''}
                onChange={handleNestedInputChange}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* TENDERNESS Row */}
  <div className="mt-6">
    <strong className="mr-2">TENDERNESS</strong>
    {[
      'Sp Process',
      'Facets',
      'L/S Paraspinal',
      'Iliac Crest',
      'QL',
      'Sacrum',
      'Coccyx',
      'Thoracolumbar',
    ].map(label => (
      <label key={label} className="inline-flex items-center mr-4">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.tenderness?.lumbar) && formData.tenderness.lumbar.includes(label)}
          onChange={e => handleTendernessSpasmChange('lumbar', 'tenderness', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>

  {/* SPASM Row */}
  <div className="mt-2">
    <strong className="mr-2">SPASM</strong>
    {['L/S Paraspinal', 'Gluteus Maximus', 'Thoracolumbar'].map(label => (
      <label key={label} className="inline-flex items-center mr-4">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.spasm?.lumbar) && formData.spasm.lumbar.includes(label)}
          onChange={e => handleTendernessSpasmChange('lumbar', 'spasm', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>
</section>

<section className="mt-10 text-sm text-black w-full">
  <div className="grid grid-cols-2 gap-6">
    {/* SHOULDER ROM Table */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">SHOULDER</th>
          <th className="border border-black px-2 py-1">NL</th>
          <th className="border border-black px-2 py-1">WNL</th>
          <th className="border border-black px-2 py-1">LEFT</th>
          <th className="border border-black px-2 py-1">PAIN</th>
          <th className="border border-black px-2 py-1">WNL</th>
          <th className="border border-black px-2 py-1">RIGHT</th>
          <th className="border border-black px-2 py-1">PAIN</th>
        </tr>
      </thead>
      <tbody>
        {[
          ['FLEXION', '180°'],
          ['EXTENSION', '50°'],
          ['ADDUCTION', '50°'],
          ['ABDUCTION', '180°'],
          ['INT ROTATION', '90°'],
          ['EXT ROTATION', '90°'],
        ].map(([label, nl]) => (
          <tr key={label}>
            <td className="border border-black px-2 py-1">{label}</td>
            <td className="border border-black px-2 py-1">{nl}</td>
            {/* LEFT SIDE */}
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.SHOULDER.${label}.wnl_left`}
                className="w-full text-center outline-none"
                value={formData.arom?.SHOULDER?.[label]?.wnl_left || ''}
                onChange={handleNestedInputChange}
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.SHOULDER.${label}.left`}
                className="w-full text-center outline-none"
                value={formData.arom?.SHOULDER?.[label]?.left || ''}
                onChange={handleNestedInputChange}
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.SHOULDER.${label}.pain_left`}
                className="w-full text-center outline-none"
                value={formData.arom?.SHOULDER?.[label]?.pain_left || ''}
                onChange={handleNestedInputChange}
              />
            </td>
            {/* RIGHT SIDE */}
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.SHOULDER.${label}.wnl_right`}
                className="w-full text-center outline-none"
                value={formData.arom?.SHOULDER?.[label]?.wnl_right || ''}
                onChange={handleNestedInputChange}
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.SHOULDER.${label}.right`}
                className="w-full text-center outline-none"
                value={formData.arom?.SHOULDER?.[label]?.right || ''}
                onChange={handleNestedInputChange}
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.SHOULDER.${label}.pain_right`}
                className="w-full text-center outline-none"
                value={formData.arom?.SHOULDER?.[label]?.pain_right || ''}
                onChange={handleNestedInputChange}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* ORTHOPEDIC TEST Table */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">ORTHOPEDIC TEST</th>
          <th className="border border-black px-2 py-1">LEFT</th>
          <th className="border border-black px-2 py-1">RIGHT</th>
        </tr>
      </thead>
      <tbody>
        {[
          'Speeds',
          'Apleys',
          'Impingement',
          'Dugas',
          'Supraspinatus Press',
          'Shoulder Apprehension',
        ].map(test => (
          <tr key={test}>
            <td className="border border-black px-2 py-1">{test}</td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.left`}
                className="w-full text-center outline-none"
                value={formData.ortho?.[test]?.left || ''}
                onChange={handleNestedInputChange}
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.right`}
                className="w-full text-center outline-none"
                value={formData.ortho?.[test]?.right || ''}
                onChange={handleNestedInputChange}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* TENDERNESS */}
  <div className="mt-6 flex flex-wrap gap-4">
    <strong className="mr-2">TENDERNESS</strong>
    {[
      'Ant', 'Post', 'Lat', 'AC', 'Deltoid', 'GH', 'Bicipital', 'Trap', 'Supra Spin', 'Infra Spin',
      'Scapula', 'Infra Scap', 'Med Scap', 'Rot Cuff', 'Brachialis', 'Bicep', 'Tricep', 'Levator Scap', 'Rhomboids',
    ].map(label => (
      <label key={label} className="inline-flex items-center">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.tenderness?.shoulder) && formData.tenderness.shoulder.includes(label)}
          onChange={e => handleTendernessSpasmChange('shoulder', 'tenderness', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>

  {/* SPASM */}
  <div className="mt-2 flex flex-wrap gap-4">
    <strong className="mr-2">SPASM</strong>
    {[
      'Ant', 'Post', 'Lat', 'AC', 'Deltoid', 'GH', 'Trap', 'Supra Spin', 'Infra Spin',
      'Subscapularis', 'Infra Scap', 'Med Scap', 'Levator Scap', 'Rhomboids',
    ].map(label => (
      <label key={label} className="inline-flex items-center">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.spasm?.shoulder) && formData.spasm.shoulder.includes(label)}
          onChange={e => handleTendernessSpasmChange('shoulder', 'spasm', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>
</section>

<section className="mt-10 text-sm text-black w-full">
  <div className="grid grid-cols-2 gap-6">
    {/* ELBOW ROM Table */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">ELBOW</th>
          <th className="border border-black px-2 py-1">NL</th>
          <th className="border border-black px-2 py-1">WNL</th>
          <th className="border border-black px-2 py-1">LEFT</th>
          <th className="border border-black px-2 py-1">PAIN</th>
          <th className="border border-black px-2 py-1">WNL</th>
          <th className="border border-black px-2 py-1">RIGHT</th>
          <th className="border border-black px-2 py-1">PAIN</th>
        </tr>
      </thead>
      <tbody>
        {[
          ['FLEXION', '140°'],
          ['EXTENSION', '0°'],
          ['SUPINATION', '80°'],
          ['PRONATION', '80°'],
        ].map(([label, nl]) => (
          <tr key={label}>
            <td className="border border-black px-2 py-1">{label}</td>
            <td className="border border-black px-2 py-1">{nl}</td>
            {/* LEFT SIDE */}
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.ELBOW.${label}.wnl_left`}
                className="w-full text-center outline-none"
                value={formData.arom?.ELBOW?.[label]?.wnl_left || ''}
                onChange={handleNestedInputChange}
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.ELBOW.${label}.left`}
                className="w-full text-center outline-none"
                value={formData.arom?.ELBOW?.[label]?.left || ''}
                onChange={handleNestedInputChange}
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.ELBOW.${label}.pain_left`}
                className="w-full text-center outline-none"
                value={formData.arom?.ELBOW?.[label]?.pain_left || ''}
                onChange={handleNestedInputChange}
              />
            </td>
            {/* RIGHT SIDE */}
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.ELBOW.${label}.wnl_right`}
                className="w-full text-center outline-none"
                value={formData.arom?.ELBOW?.[label]?.wnl_right || ''}
                onChange={handleNestedInputChange}
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.ELBOW.${label}.right`}
                className="w-full text-center outline-none"
                value={formData.arom?.ELBOW?.[label]?.right || ''}
                onChange={handleNestedInputChange}
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.ELBOW.${label}.pain_right`}
                className="w-full text-center outline-none"
                value={formData.arom?.ELBOW?.[label]?.pain_right || ''}
                onChange={handleNestedInputChange}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* ORTHOPEDIC TEST Table */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">ORTHOPEDIC TEST</th>
          <th className="border border-black px-2 py-1">LEFT</th>
          <th className="border border-black px-2 py-1">RIGHT</th>
          <th className="border border-black px-2 py-1">LIG LAXITY</th>
        </tr>
      </thead>
      <tbody>
        {['Cozens', 'Varus/Valgus', "Mill's"].map(test => (
          <tr key={test}>
            <td className="border border-black px-2 py-1">{test}</td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.left`}
                className="w-full text-center outline-none"
                value={formData.ortho?.[test]?.left || ''}
                onChange={handleNestedInputChange}
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.right`}
                className="w-full text-center outline-none"
                value={formData.ortho?.[test]?.right || ''}
                onChange={handleNestedInputChange}
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.lig_laxity`}
                className="w-full text-center outline-none"
                value={formData.ortho?.[test]?.lig_laxity || ''}
                onChange={handleNestedInputChange}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* TENDERNESS */}
  <div className="mt-6 flex flex-wrap gap-4">
    <strong className="mr-2">TENDERNESS</strong>
    {[
      'Ant', 'Post', 'Med', 'Lat', 'Olecranon', 'Med Epicondyle', 'Lat Epicondyle', 'Forearm',
      'Brachialis', 'Triceps', 'Biceps', 'Ulnar Notch', 'Radial Head', 'Cubital Fossa',
    ].map(label => (
      <label key={label} className="inline-flex items-center">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.tenderness?.elbow) && formData.tenderness.elbow.includes(label)}
          onChange={e => handleTendernessSpasmChange('elbow', 'tenderness', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>

  {/* SPASM */}
  <div className="mt-2 flex flex-wrap gap-4">
    <strong className="mr-2">SPASM</strong>
    {['Ant', 'Post', 'Med', 'Lat', 'Forearm', 'Brachialis', 'Triceps', 'Biceps'].map(label => (
      <label key={label} className="inline-flex items-center">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.spasm?.elbow) && formData.spasm.elbow.includes(label)}
          onChange={e => handleTendernessSpasmChange('elbow', 'spasm', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>
</section>

<section className="mt-10 text-sm text-black w-full">
  <div className="grid grid-cols-2 gap-6">
    {/* WRIST ROM Table */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">WRIST</th>
          <th className="border border-black px-2 py-1">NL</th>
          <th className="border border-black px-2 py-1">WNL</th>
          <th className="border border-black px-2 py-1">LEFT</th>
          <th className="border border-black px-2 py-1">PAIN</th>
          <th className="border border-black px-2 py-1">WNL</th>
          <th className="border border-black px-2 py-1">RIGHT</th>
          <th className="border border-black px-2 py-1">PAIN</th>
        </tr>
      </thead>
      <tbody>
        {[
          ['FLEXION', '60°'],
          ['EXTENSION', '60°'],
          ['ULNAR DEVIATION', '30°'],
          ['RADIAL DEVIATION', '20°'],
        ].map(([label, nl]) => (
          <tr key={label}>
            <td className="border border-black px-2 py-1">{label}</td>
            <td className="border border-black px-2 py-1">{nl}</td>
            {/* LEFT SIDE */}
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.WRIST.${label}.wnl_left`}
                className="w-full px-1 py-0.5 border-none text-center outline-none"
                value={formData.arom?.WRIST?.[label]?.wnl_left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.WRIST.${label}.left`}
                className="w-full px-1 py-0.5 border-none text-center outline-none"
                value={formData.arom?.WRIST?.[label]?.left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.WRIST.${label}.pain_left`}
                className="w-full px-1 py-0.5 border-none text-center outline-none"
                value={formData.arom?.WRIST?.[label]?.pain_left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            {/* RIGHT SIDE */}
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.WRIST.${label}.wnl_right`}
                className="w-full px-1 py-0.5 border-none text-center outline-none"
                value={formData.arom?.WRIST?.[label]?.wnl_right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.WRIST.${label}.right`}
                className="w-full px-1 py-0.5 border-none text-center outline-none"
                value={formData.arom?.WRIST?.[label]?.right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.WRIST.${label}.pain_right`}
                className="w-full px-1 py-0.5 border-none text-center outline-none"
                value={formData.arom?.WRIST?.[label]?.pain_right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* ORTHOPEDIC TEST Table */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">ORTHOPEDIC TEST</th>
          <th className="border border-black px-2 py-1">LEFT</th>
          <th className="border border-black px-2 py-1">RIGHT</th>
        </tr>
      </thead>
      <tbody>
        {["Tinel's", "Finkelstein's", "Phalen's", "Reverse Phalen's"].map(test => (
          <tr key={test}>
            <td className="border border-black px-2 py-1">{test}</td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.left`}
                className="w-full px-1 py-0.5 border-none text-center outline-none"
                value={formData.ortho?.[test]?.left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.right`}
                className="w-full px-1 py-0.5 border-none text-center outline-none"
                value={formData.ortho?.[test]?.right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* TENDERNESS */}
  <div className="mt-6 flex flex-wrap gap-4">
    <strong className="mr-2">TENDERNESS</strong>
    {[
      'Dorsal (posterior, back)',
      'Volar (anterior, palm side)',
      'Med',
      'Lat',
      'Snuffbox',
      'Thenar',
      'Hypothenar',
      'Forearm',
    ].map(label => (
      <label key={label} className="inline-flex items-center">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.tenderness?.wrist) && formData.tenderness.wrist.includes(label)}
          onChange={e => handleTendernessSpasmChange('wrist', 'tenderness', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>

  {/* SPASM */}
  <div className="mt-2 flex flex-wrap gap-4">
    <strong className="mr-2">SPASM</strong>
    {['Hypothenar', 'Thenar'].map(label => (
      <label key={label} className="inline-flex items-center">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.spasm?.wrist) && formData.spasm.wrist.includes(label)}
          onChange={e => handleTendernessSpasmChange('wrist', 'spasm', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>
</section>

<section className="mt-10 text-sm text-black w-full">
  <div className="grid grid-cols-2 gap-6">
    {/* HAND ROM Table */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">HAND</th>
          <th className="border border-black px-2 py-1">NL</th>
          <th className="border border-black px-2 py-1">WNL</th>
          <th className="border border-black px-2 py-1">LEFT</th>
          <th className="border border-black px-2 py-1">PAIN</th>
          <th className="border border-black px-2 py-1">WNL</th>
          <th className="border border-black px-2 py-1">RIGHT</th>
          <th className="border border-black px-2 py-1">PAIN</th>
        </tr>
      </thead>
      <tbody>
        {[
          ['DIP FLEXION', '80°'],
          ['DIP EXTENSION', '0°'],
          ['PIP FLEXION', '120°'],
          ['PIP EXTENSION', '0°'],
          ['MCP ABDUCTION', '25°'],
          ['MCP ADDUCTION', '0°'],
          ['MCP FLEXION', '90°'],
          ['MCP EXTENSION', '30°'],
          ['PIP THUMB FLEXION', '90°'],
          ['PIP THUMB EXTENSION', '0°'],
          ['MCP THUMB ABDUCTION', '50°'],
          ['MCP THUMB ADDUCTION', '0°'],
          ['MCP THUMB FLEXION', '70°'],
          ['MCP THUMB EXTENSION', '0°']
        ].map(([label, nl]) => (
          <tr key={label}>
            <td className="border border-black px-2 py-1">{label}</td>
            <td className="border border-black px-2 py-1">{nl}</td>
            {/* LEFT SIDE */}
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.HAND.${label}.wnl_left`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.HAND?.[label]?.wnl_left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.HAND.${label}.left`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.HAND?.[label]?.left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.HAND.${label}.pain_left`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.HAND?.[label]?.pain_left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            {/* RIGHT SIDE */}
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.HAND.${label}.wnl_right`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.HAND?.[label]?.wnl_right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.HAND.${label}.right`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.HAND?.[label]?.right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.HAND.${label}.pain_right`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.HAND?.[label]?.pain_right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* ORTHOPEDIC TEST Table */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">ORTHOPEDIC TEST</th>
          <th className="border border-black px-2 py-1">LEFT</th>
          <th className="border border-black px-2 py-1">RIGHT</th>
        </tr>
      </thead>
      <tbody>
        {['Grind Test', "Finkelstein's"].map(test => (
          <tr key={test}>
            <td className="border border-black px-2 py-1">{test}</td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.left`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.ortho?.[test]?.left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.right`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.ortho?.[test]?.right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* TENDERNESS Section */}
  <div className="mt-6 flex flex-wrap gap-4">
    <strong className="mr-2">TENDERNESS</strong>
    {[
      '1ˢᵗ Metacarpal', '2ⁿᵈ Metacarpal', '3ʳᵈ Metacarpal', '4ᵗʰ Metacarpal', '5ᵗʰ Metacarpal',
      '1ˢᵗ Phalanexes', '2ⁿᵈ Phalanexes', '3ʳᵈ Phalanexes', '4ᵗʰ Phalanexes', '5ᵗʰ Phalanexes'
    ].map(label => (
      <label key={label} className="inline-flex items-center">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.tenderness?.hand) && formData.tenderness.hand.includes(label)}
          onChange={e => handleTendernessSpasmChange('hand', 'tenderness', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>

  {/* SPASM Section */}
  <div className="mt-2 flex flex-wrap gap-4">
    <strong className="mr-2">SPASM</strong>
    {['Forearm', 'Thenar', 'Hypothenar'].map(label => (
      <label key={label} className="inline-flex items-center">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.spasm?.hand) && formData.spasm.hand.includes(label)}
          onChange={e => handleTendernessSpasmChange('hand', 'spasm', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>
</section>

<section className="mt-10 text-sm text-black w-full">
  <div className="grid grid-cols-2 gap-4">
    {/* HIP ROM Table */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">HIP</th>
          <th className="border border-black px-2 py-1">NL</th>
          <th className="border border-black px-2 py-1">WNL</th>
          <th className="border border-black px-2 py-1">LEFT</th>
          <th className="border border-black px-2 py-1">PAIN</th>
          <th className="border border-black px-2 py-1">WNL</th>
          <th className="border border-black px-2 py-1">RIGHT</th>
          <th className="border border-black px-2 py-1">PAIN</th>
        </tr>
      </thead>
      <tbody>
        {[
          ['FLEXION', '110°'],
          ['EXTENSION', '0°'],
          ['INT ROTATION', '20°'],
          ['EXT ROTATION', '30°'],
          ['ABDUCTION', '30°'],
          ['ADDUCTION', '0°']
        ].map(([label, nl]) => (
          <tr key={label}>
            <td className="border border-black px-2 py-1">{label}</td>
            <td className="border border-black px-2 py-1">{nl}</td>
            {/* LEFT SIDE */}
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.HIP.${label}.wnl_left`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.HIP?.[label]?.wnl_left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.HIP.${label}.left`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.HIP?.[label]?.left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.HIP.${label}.pain_left`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.HIP?.[label]?.pain_left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            {/* RIGHT SIDE */}
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.HIP.${label}.wnl_right`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.HIP?.[label]?.wnl_right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.HIP.${label}.right`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.HIP?.[label]?.right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.HIP.${label}.pain_right`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.HIP?.[label]?.pain_right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* HIP Orthopedic Tests Table */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">ORTHOPEDIC TEST</th>
          <th className="border border-black px-2 py-1">LEFT</th>
          <th className="border border-black px-2 py-1">RIGHT</th>
        </tr>
      </thead>
      <tbody>
        {[
          'FABER',
          'Obers',
          "Trendelenburg's",
          'Iliac Compression',
          'Hip Circumduction'
        ].map(test => (
          <tr key={test}>
            <td className="border border-black px-2 py-1">{test}</td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.left`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.ortho?.[test]?.left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.right`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.ortho?.[test]?.right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* TENDERNESS Section */}
  <div className="mt-6 flex flex-wrap gap-4">
    <strong className="mr-2">TENDERNESS</strong>
    {['Anterior', 'Posterior', 'Lateral', 'Sacroiliac Joint', 'Buttock'].map(label => (
      <label key={label} className="inline-flex items-center">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.tenderness?.hip) && formData.tenderness.hip.includes(label)}
          onChange={e => handleTendernessSpasmChange('hip', 'tenderness', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>

  {/* SPASM Section */}
  <div className="mt-2 flex flex-wrap gap-4">
    <strong className="mr-2">SPASM</strong>
    {['Quadriceps', 'TFL', 'Hamstrings', 'Buttock'].map(label => (
      <label key={label} className="inline-flex items-center">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.spasm?.hip) && formData.spasm.hip.includes(label)}
          onChange={e => handleTendernessSpasmChange('hip', 'spasm', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>
</section>

<section className="mt-10 text-sm text-black w-full">
  <div className="grid grid-cols-2 gap-4">
    {/* KNEE ROM Table */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">KNEE</th>
          <th className="border border-black px-2 py-1">NL</th>
          <th className="border border-black px-2 py-1">WNL</th>
          <th className="border border-black px-2 py-1">LEFT</th>
          <th className="border border-black px-2 py-1">PAIN</th>
          <th className="border border-black px-2 py-1">WNL</th>
          <th className="border border-black px-2 py-1">RIGHT</th>
          <th className="border border-black px-2 py-1">PAIN</th>
        </tr>
      </thead>
      <tbody>
        {[
          ['FLEXION', '110°'],
          ['EXTENSION', '0°'],
          ['EXT ROTATION', '30°'],
          ['INT ROTATION', '10°']
        ].map(([label, nl]) => (
          <tr key={label}>
            <td className="border border-black px-2 py-1">{label}</td>
            <td className="border border-black px-2 py-1">{nl}</td>
            {/* LEFT SIDE */}
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.KNEE.${label}.wnl_left`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.KNEE?.[label]?.wnl_left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.KNEE.${label}.left`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.KNEE?.[label]?.left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.KNEE.${label}.pain_left`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.KNEE?.[label]?.pain_left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            {/* RIGHT SIDE */}
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.KNEE.${label}.wnl_right`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.KNEE?.[label]?.wnl_right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.KNEE.${label}.right`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.KNEE?.[label]?.right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.KNEE.${label}.pain_right`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.KNEE?.[label]?.pain_right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Orthopedic Tests */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">ORTHOPEDIC TEST</th>
          <th className="border border-black px-2 py-1">LEFT</th>
          <th className="border border-black px-2 py-1">RIGHT</th>
          <th className="border border-black px-2 py-1">LIG LAXITY</th>
        </tr>
      </thead>
      <tbody>
        {[
  "McMurray's/Bounce Home",
  'Varus/Valgus',
  'Anterior Drawer',
  'Posterior Drawer'
].map(test => (
          <tr key={test}>
            <td className="border border-black px-2 py-1">{test}</td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.left`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.ortho?.[test]?.left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.right`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.ortho?.[test]?.right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.lig_laxity`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.ortho?.[test]?.lig_laxity || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* TENDERNESS Section */}
  <div className="mt-6 flex flex-wrap gap-4">
    <strong className="mr-2">TENDERNESS</strong>
    {[
      'Ant', 'Post', 'Med', 'Lat',
      'Sup Patella', 'Inf Patella', 'Popliteal Fossa'
    ].map(label => (
      <label key={label} className="inline-flex items-center">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.tenderness?.knee) && formData.tenderness.knee.includes(label)}
          onChange={e => handleTendernessSpasmChange('knee', 'tenderness', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>

  {/* SPASM Section */}
  <div className="mt-2 flex flex-wrap gap-4">
    <strong className="mr-2">SPASM</strong>
    {[
      'Ant', 'Post', 'Med', 'Lat',
      'Quadriceps', 'TFL', 'Hamstrings'
    ].map(label => (
      <label key={label} className="inline-flex items-center">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.spasm?.knee) && formData.spasm.knee.includes(label)}
          onChange={e => handleTendernessSpasmChange('knee', 'spasm', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>
</section>

<section className="mt-10 text-sm text-black w-full">
  <div className="grid grid-cols-2 gap-4">
    {/* ANKLE ROM Table */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">ANKLE</th>
          <th className="border border-black px-2 py-1">NL</th>
          <th className="border border-black px-2 py-1">WNL</th>
          <th className="border border-black px-2 py-1">LEFT</th>
          <th className="border border-black px-2 py-1">PAIN</th>
          <th className="border border-black px-2 py-1">WNL</th>
          <th className="border border-black px-2 py-1">RIGHT</th>
          <th className="border border-black px-2 py-1">PAIN</th>
        </tr>
      </thead>
      <tbody>
        {[
          ['PLANTAR FLEXION', '40°'],
          ['DORSIFLEXION', '20°'],
          ['INVERSION', '30°'],
          ['EVERSION', '20°']
        ].map(([label, nl]) => (
          <tr key={label}>
            <td className="border border-black px-2 py-1">{label}</td>
            <td className="border border-black px-2 py-1">{nl}</td>
            {/* LEFT SIDE */}
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.ANKLE.${label}.wnl_left`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.ANKLE?.[label]?.wnl_left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.ANKLE.${label}.left`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.ANKLE?.[label]?.left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.ANKLE.${label}.pain_left`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.ANKLE?.[label]?.pain_left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            {/* RIGHT SIDE */}
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.ANKLE.${label}.wnl_right`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.ANKLE?.[label]?.wnl_right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.ANKLE.${label}.right`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.ANKLE?.[label]?.right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.ANKLE.${label}.pain_right`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.ANKLE?.[label]?.pain_right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* ORTHOPEDIC TEST Table */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">ORTHOPEDIC TEST</th>
          <th className="border border-black px-2 py-1">LEFT</th>
          <th className="border border-black px-2 py-1">RIGHT</th>
          <th className="border border-black px-2 py-1">LIG LAXITY</th>
        </tr>
      </thead>
      <tbody>
        {['Varus/Valgus', 'Anterior Drawer', 'Posterior Drawer'].map(test => (
          <tr key={test}>
            <td className="border border-black px-2 py-1">{test}</td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.left`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.ortho?.[test]?.left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.right`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.ortho?.[test]?.right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.${test}.lig_laxity`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.ortho?.[test]?.lig_laxity || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* TENDERNESS Section */}
  <div className="mt-6 flex flex-wrap gap-4">
    <strong className="mr-2">TENDERNESS</strong>
    {[
      'Ant', 'Post', 'Med', 'Lat',
      'Ant Talofibular Lig', 'Med Malleolus', 'Lat Malleolus',
      'Med Heel', 'Lat Heel', 'Achilles'
    ].map(label => (
      <label key={label} className="inline-flex items-center">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.tenderness?.ankle) && formData.tenderness.ankle.includes(label)}
          onChange={e => handleTendernessSpasmChange('ankle', 'tenderness', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>

  {/* SPASM Section */}
  <div className="mt-2 flex flex-wrap gap-4">
    <strong className="mr-2">SPASM</strong>
    {['Calf', 'Distal Leg'].map(label => (
      <label key={label} className="inline-flex items-center">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.spasm?.ankle) && formData.spasm.ankle.includes(label)}
          onChange={e => handleTendernessSpasmChange('ankle', 'spasm', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>
</section>

<section className="mt-10 text-sm text-black w-full">
  <div className="grid grid-cols-2 gap-4">
    {/* FOOT ROM Table */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">FOOT</th>
          <th className="border border-black px-2 py-1">NL</th>
          <th className="border border-black px-2 py-1">WNL</th>
          <th className="border border-black px-2 py-1">LEFT</th>
          <th className="border border-black px-2 py-1">PAIN</th>
          <th className="border border-black px-2 py-1">WNL</th>
          <th className="border border-black px-2 py-1">RIGHT</th>
          <th className="border border-black px-2 py-1">PAIN</th>
        </tr>
      </thead>
      <tbody>
        {[
          ['INVERSION', '35°'],
          ['EVERSION', '25°'],
          ['MTP FLEXION', '30°'],
          ['MTP EXTENSION', '80°'],
          ['PIP FLEXION', '50°'],
          ['PIP EXTENSION', '0°']
        ].map(([label, nl]) => (
          <tr key={label}>
            <td className="border border-black px-2 py-1">{label}</td>
            <td className="border border-black px-2 py-1">{nl}</td>
            {/* LEFT SIDE */}
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.FOOT.${label}.wnl_left`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.FOOT?.[label]?.wnl_left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.FOOT.${label}.left`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.FOOT?.[label]?.left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.FOOT.${label}.pain_left`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.FOOT?.[label]?.pain_left || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            {/* RIGHT SIDE */}
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.FOOT.${label}.wnl_right`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.FOOT?.[label]?.wnl_right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.FOOT.${label}.right`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.FOOT?.[label]?.right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`arom.FOOT.${label}.pain_right`}
                className="w-full px-1 py-0.5 text-center outline-none"
                value={formData.arom?.FOOT?.[label]?.pain_right || ''}
                onChange={handleNestedInputChange}
                placeholder="..."
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* ORTHOPEDIC TEST Table */}
    <table className="table-fixed border border-black w-full text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-2 py-1">ORTHOPEDIC TEST</th>
          <th className="border border-black px-2 py-1">LEFT</th>
          <th className="border border-black px-2 py-1">RIGHT</th>
        </tr>
      </thead>
      <tbody>
        {[...Array(5)].map((_, idx) => (
          <tr key={idx}>
            <td className="border border-black px-2 py-1">
              <input
                type="text"
                name={`ortho.FOOT.test${idx + 1}.name`}
                value={formData.ortho?.FOOT?.[`test${idx + 1}`]?.name || ''}
                onChange={handleNestedInputChange}
                placeholder="Test name"
                className="w-full px-1 py-0.5 text-center outline-none"
              />
            </td>
            {[...Array(2)].map((_, i) => (
              <td key={i} className="border border-black px-2 py-1">
                <input
                  type="text"
                  name={`ortho.FOOT.test${idx + 1}.${i === 0 ? 'left' : 'right'}`}
                  value={formData.ortho?.FOOT?.[`test${idx + 1}`]?.[i === 0 ? 'left' : 'right'] || ''}
                  onChange={handleNestedInputChange}
                  placeholder="..."
                  className="w-full px-1 py-0.5 text-center outline-none"
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* TENDERNESS Section */}
  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
    <strong className="mr-2">TENDERNESS</strong>
    {[
      'Calcaneus', 'Talus', 'Navicular', 'Cuboid', 'Cuneiform(s)',
      '1ˢᵗ Metatarsal', '2ⁿᵈ Metatarsal', '3ʳᵈ Metatarsal', '4ᵗʰ Metatarsal', '5ᵗʰ Metatarsal',
      '1ˢᵗ Phalanges', '2ⁿᵈ Phalanges', '3ʳᵈ Phalanges', '4ᵗʰ Phalanges', '5ᵗʰ Phalanges'
    ].map(label => (
      <label key={label} className="inline-flex items-center">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.tenderness?.foot) && formData.tenderness.foot.includes(label)}
          onChange={e => handleTendernessSpasmChange('foot', 'tenderness', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>

  {/* SPASM Section */}
  <div className="mt-2 flex flex-wrap gap-4">
    <strong className="mr-2">SPASM</strong>
    {['Mid Foot', 'Hind Foot'].map(label => (
      <label key={label} className="inline-flex items-center">
        <input
          type="checkbox"
          className="mr-1"
          checked={Array.isArray(formData.spasm?.foot) && formData.spasm.foot.includes(label)}
          onChange={e => handleTendernessSpasmChange('foot', 'spasm', label, e.target.checked)}
        />
        {label}
      </label>
    ))}
  </div>
</section>


    <h1 className="text-2xl font-bold mb-6 text-center">TREATMENT PLAN</h1>
        

{/* Chiropractic Adjustment */}
<section>
<h2 className="text-lg font-semibold mt-6 mb-2">Chiropractic Adjustment</h2>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-800">
    {[
      'Cervical Spine', 'Thoracic Spine', 'Lumbar Spine', 'Sacroiliac Spine',
      'Hip R / L', 'Knee (Patella) R / L', 'Ankle R / L',
      'Shoulder (GHJ) R / L', 'Elbow R / L', 'Wrist Carpals R / L'
    ].map(item => (
      <label key={item} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.chiropracticAdjustment.includes(item)}
          onChange={() => handleCheckboxArrayChange('chiropracticAdjustment', item)}
        />
        {item}
      </label>
    ))}
  </div>
  <div className="mt-2">
    <label className="text-sm text-gray-700 mr-2">Other:</label>
    <input
      type="text"
      name="chiropracticOther"
      value={formData.chiropracticOther || ''}
      onChange={handleInputChange}
      className="border px-2 py-1 rounded w-1/2"
      placeholder="_______________________________"
    />
  </div>
</section>

{/* Acupuncture (Cupping) */}
<section className="mt-6">
  <h2 className="text-lg font-semibold mt-6 mb-2">Acupuncture (Cupping)</h2>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-800">
    {[
      'Cervical Spine', 'Thoracic Spine', 'Lumbar Spine', 'Sacroiliac Spine',
      'Hip R / L', 'Knee (Patella) R / L', 'Ankle R / L',
      'Shoulder (GHJ) R / L', 'Elbow R / L', 'Wrist Carpals R / L'
    ].map(item => (
      <label key={item} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.acupuncture.includes(item)}
          onChange={() => handleCheckboxArrayChange('acupuncture', item)}
        />
        {item}
      </label>
    ))}
  </div>
  <div className="mt-2">
    <label className="text-sm text-gray-700 mr-2">Other:</label>
    <input
      type="text"
      name="acupunctureOther"
      value={formData.acupunctureOther || ''}
      onChange={handleInputChange}
      className="border px-2 py-1 rounded w-1/2"
      placeholder="_______________________________"
    />
  </div>
</section>


{/* Physiotherapy */}
<section>
  <h2 className="text-lg font-semibold mt-6 mb-2">Physiotherapy</h2>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
    {['Hot Pack/Cold Pack', 'Ultrasound', 'EMS', 'E-Stim', 'Therapeutic Exercises', 'NMR', 'Orthion Bed', 'Mechanical Traction', 'Paraffin Wax', 'Infrared'].map(item => (
      <label key={item} className="flex items-center gap-2">
        <input type="checkbox" checked={formData.physiotherapy.includes(item)} onChange={() => handleCheckboxArrayChange('physiotherapy', item)} />
        {item}
      </label>
    ))}
  </div>
</section>

{/* Rehabilitation Exercises */}
<section>
  <h2 className="text-lg font-semibold mt-6 mb-2">Rehabilitation Exercises</h2>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
    {formData.chiropracticAdjustment.map(item => (
      <label key={item + '-rehab'} className="flex items-center gap-2">
        <input type="checkbox" checked={formData.rehabilitationExercises.includes(item)} onChange={() => handleCheckboxArrayChange('rehabilitationExercises', item)} />
        {item}
      </label>
    ))}
  </div>
</section>

{/* Duration and Re-Evaluation */}
<section>
  <h2 className="text-lg font-semibold mt-6 mb-2">Duration & Re-Evaluation</h2>
  <div className="flex flex-wrap gap-4">
    <label>
      Times per Week:
      <input type="number" name="durationFrequency.timesPerWeek" value={formData.durationFrequency.timesPerWeek} onChange={handleInputChange} className="ml-2 border px-2 py-1 rounded" />
    </label>
    <label>
      Re-Evaluation in Weeks:
      <input type="number" name="durationFrequency.reEvalInWeeks" value={formData.durationFrequency.reEvalInWeeks} onChange={handleInputChange} className="ml-2 border px-2 py-1 rounded" />
    </label>
  </div>
</section>

{/* Referrals */}
<section>
  <h2 className="text-lg font-semibold mt-6 mb-2">Referrals</h2>
  <div className="flex flex-wrap gap-4">
    {['Orthopedist', 'Neurologist', 'Pain Management'].map(item => (
      <label key={item} className="flex items-center gap-2">
        <input type="checkbox" checked={formData.referrals.includes(item)} onChange={() => handleCheckboxArrayChange('referrals', item)} />
        {item}
      </label>
    ))}
  </div>
</section>

{/* Imaging (X-Ray, MRI, CT) */}
{['xray', 'mri', 'ct'].map(modality => (
  <section key={modality}>
    <h2 className="text-lg font-semibold mt-6 mb-2">{modality.toUpperCase()}</h2>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {['C/S', 'T/S', 'L/S', 'Sacroiliac Joint R', 'Sacroiliac Joint L', 'Hip R', 'Hip L', 'Knee R', 'Knee L', 'Ankle R', 'Ankle L', 'Shoulder R', 'Shoulder L', 'Elbow R', 'Elbow L', 'Wrist R', 'Wrist L'].map(region => (
        <label key={`${modality}-${region}`} className="flex items-center gap-2">
          <input type="checkbox" checked={formData.imaging[modality as keyof InitialVisitFormData['imaging']].includes(region)} onChange={() => handleCheckboxArrayChange(modality, region, 'imaging')} />
          {region}
        </label>
      ))}
    </div>
  </section>
))}

{/* Diagnostic Ultrasound */}
<section>
  <h2 className="text-lg font-semibold mt-6 mb-2">Diagnostic Ultrasound</h2>
  <textarea name="diagnosticUltrasound" value={formData.diagnosticUltrasound} onChange={handleInputChange} rows={2} className="w-full border rounded px-3 py-2" placeholder="Enter area of ultrasound" />
</section>

{/* Nerve Study */}
<section>
  <h2 className="text-lg font-semibold mt-6 mb-2">Nerve Study</h2>
  <div className="flex gap-6">
    {['EMG/NCV upper', 'EMG/NCV lower'].map(test => (
      <label key={test} className="flex items-center gap-2">
        <input type="checkbox" checked={formData.nerveStudy.includes(test)} onChange={() => handleCheckboxArrayChange('nerveStudy', test)} />
        {test}
      </label>
    ))}
  </div>
</section>

{/* Recommendations/Restrictions */}
<section>
  <h2 className="text-lg font-semibold mt-6 mb-2">Restrictions</h2>
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium mb-2">Avoid Activity (weeks):</label>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(week => (
          <label key={week} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={formData.restrictions.avoidActivityWeeks === week.toString()}
              onChange={(e) => {
                if (e.target.checked) {
                  setFormData(prev => ({
                    ...prev,
                    restrictions: { ...prev.restrictions, avoidActivityWeeks: week.toString() }
                  }));
                }
              }}
              className="w-4 h-4"
            />
            <span className="text-sm">{week}</span>
          </label>
        ))}
        <input
          type="text"
          name="restrictions.avoidActivityWeeks"
          value={formData.restrictions.avoidActivityWeeks}
          onChange={handleInputChange}
          className="border px-2 py-1 rounded text-sm w-20"
          placeholder="Other"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Lifting Limit (lbs):</label>
      <div className="flex flex-wrap gap-2">
        {[5, 10, 15, 20, 25, 30, 35, 40].map(lbs => (
          <label key={lbs} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={formData.restrictions.liftingLimitLbs === lbs.toString()}
              onChange={(e) => {
                if (e.target.checked) {
                  setFormData(prev => ({
                    ...prev,
                    restrictions: { ...prev.restrictions, liftingLimitLbs: lbs.toString() }
                  }));
                }
              }}
              className="w-4 h-4"
            />
            <span className="text-sm">{lbs}</span>
          </label>
        ))}
        <input
          type="text"
          name="restrictions.liftingLimitLbs"
          value={formData.restrictions.liftingLimitLbs}
          onChange={handleInputChange}
          className="border px-2 py-1 rounded text-sm w-20"
          placeholder="Other"
        />
      </div>
    </div>

    <label className="block flex items-center gap-2">
      <input type="checkbox" name="restrictions.avoidProlongedSitting" checked={formData.restrictions.avoidProlongedSitting} onChange={handleInputChange} />
      Avoid Prolonged Sitting/Standing
    </label>
  </div>
</section>

{/* Disability Duration */}
<section>
  <h2 className="text-lg font-semibold mt-6 mb-2">Disability Duration</h2>
  <div className="flex flex-wrap gap-2">
    {[1, 2, 3, 4, 5, 6, 7, 8].map(week => (
      <label key={week} className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={formData.disabilityDuration === week.toString()}
          onChange={(e) => {
            if (e.target.checked) {
              setFormData(prev => ({ ...prev, disabilityDuration: week.toString() }));
            }
          }}
          className="w-4 h-4"
        />
        <span className="text-sm">{week}</span>
      </label>
    ))}
    <input
      type="text"
      name="disabilityDuration"
      value={formData.disabilityDuration}
      onChange={handleInputChange}
      className="border px-2 py-1 rounded text-sm w-20"
      placeholder="Other"
    />
  </div>
</section>

{/* Additional Notes */}
<section>
  <h2 className="text-lg font-semibold mt-6 mb-2">Other Notes</h2>
  <textarea name="otherNotes" value={formData.otherNotes} onChange={handleInputChange} rows={3} className="w-full border rounded px-3 py-2" placeholder="Add any other comments" />
</section>

{/* Submit Button */}
<div className="flex justify-end mt-6">
  <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
    {isSaving ? 'Saving...' : 'Save Visit'}
  </button>
</div>

            </form>
          </div>

    {/* Chief Complaint Modal */}
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={() => setModalIsOpen(false)}
      contentLabel="Chief Complaint Modal"
      className="bg-white rounded-lg shadow-lg w-11/12 max-w-4xl mx-auto mt-10 p-4 md:p-6 max-h-[90vh] overflow-y-auto"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 pt-4"
    >
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-xl font-bold text-gray-800">Subjective Intake</h2>
        <button 
          onClick={() => setModalIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : patientData?.subjective && patientData.subjective.bodyPart && patientData.subjective.bodyPart.length > 0 ? (
        <div className="text-sm text-gray-700">
          {/* Body Parts Section */}
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2">Body Parts</h3>
            {patientData.subjective.bodyPart.map((bp, index) => (
              <div key={index} className="mb-4 border-b pb-4 rounded-lg bg-gray-50 p-3">
                <p className="font-medium text-blue-600 text-lg border-b border-gray-200 pb-1 mb-2">{bp.part} ({bp.side})</p>
                
                {/* Display detailed subjective data for each body part */}
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                  <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                    <p className="font-medium text-gray-700 text-sm">Severity</p>
                    <p className="text-gray-900">{bp.severity || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                    <p className="font-medium text-gray-700 text-sm">Timing</p>
                    <p className="text-gray-900">{bp.timing || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                    <p className="font-medium text-gray-700 text-sm">Context</p>
                    <p className="text-gray-900">{bp.context || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                    <p className="font-medium text-gray-700 text-sm">Quality</p>
                    <p className="text-gray-900">{bp.quality?.join(', ') || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                    <p className="font-medium text-gray-700 text-sm">Exacerbated By</p>
                    <p className="text-gray-900">{bp.exacerbatedBy?.join(', ') || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                    <p className="font-medium text-gray-700 text-sm">Symptoms</p>
                    <p className="text-gray-900">{bp.symptoms?.join(', ') || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                    <p className="font-medium text-gray-700 text-sm">Radiating To</p>
                    <p className="text-gray-900">{bp.radiatingTo || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                    <p className="font-medium text-gray-700 text-sm">Radiating Pain</p>
                    <p className="text-gray-900">
                      {(bp.radiatingLeft || bp.radiatingRight)
                        ? [bp.radiatingLeft && 'Left', bp.radiatingRight && 'Right'].filter(Boolean).join(', ')
                        : 'None'}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                    <p className="font-medium text-gray-700 text-sm">Sciatica</p>
                    <p className="text-gray-900">
                      {(bp.sciaticaLeft || bp.sciaticaRight)
                        ? [bp.sciaticaLeft && 'Left', bp.sciaticaRight && 'Right'].filter(Boolean).join(', ')
                        : 'None'}
                    </p>
                  </div>
                  {bp.notes && (
                    <div className="col-span-1 sm:col-span-2 md:col-span-3 bg-white p-2 rounded border border-gray-100 shadow-sm">
                      <p className="font-medium text-gray-700 text-sm">Notes</p>
                      <p className="text-gray-900">{bp.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Legacy Subjective Data - Display if no bodyPart data is available */}
          {(!patientData.subjective.bodyPart || patientData.subjective.bodyPart.length === 0) && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <h3 className="font-semibold text-lg mb-2 text-blue-600 border-b border-gray-200 pb-1">Legacy Subjective Data</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                  <p className="font-medium text-gray-700 text-sm">Severity</p>
                  <p className="text-gray-900">{patientData.subjective.severity || 'N/A'}</p>
                </div>
                <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                  <p className="font-medium text-gray-700 text-sm">Timing</p>
                  <p className="text-gray-900">{patientData.subjective.timing || 'N/A'}</p>
                </div>
                <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                  <p className="font-medium text-gray-700 text-sm">Context</p>
                  <p className="text-gray-900">{patientData.subjective.context || 'N/A'}</p>
                </div>
                <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                  <p className="font-medium text-gray-700 text-sm">Quality</p>
                  <p className="text-gray-900">{patientData.subjective.quality?.join(', ') || 'N/A'}</p>
                </div>
                <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                  <p className="font-medium text-gray-700 text-sm">Exacerbated By</p>
                  <p className="text-gray-900">{patientData.subjective.exacerbatedBy?.join(', ') || 'N/A'}</p>
                </div>
                <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                  <p className="font-medium text-gray-700 text-sm">Symptoms</p>
                  <p className="text-gray-900">{patientData.subjective.symptoms?.join(', ') || 'N/A'}</p>
                </div>
                <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                  <p className="font-medium text-gray-700 text-sm">Radiating To</p>
                  <p className="text-gray-900">{patientData.subjective.radiatingTo || 'N/A'}</p>
                </div>
                <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                  <p className="font-medium text-gray-700 text-sm">Radiating Pain</p>
                  <p className="text-gray-900">
                    {(patientData.subjective.radiatingLeft || patientData.subjective.radiatingRight)
                      ? [patientData.subjective.radiatingLeft && 'Left', patientData.subjective.radiatingRight && 'Right'].filter(Boolean).join(', ')
                      : 'None'}
                  </p>
                </div>
                <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                  <p className="font-medium text-gray-700 text-sm">Sciatica</p>
                  <p className="text-gray-900">
                    {(patientData.subjective.sciaticaLeft || patientData.subjective.sciaticaRight)
                      ? [patientData.subjective.sciaticaLeft && 'Left', patientData.subjective.sciaticaRight && 'Right'].filter(Boolean).join(', ')
                      : 'None'}
                  </p>
                </div>
                {patientData.subjective.notes && (
                  <div className="col-span-1 sm:col-span-2 md:col-span-3 bg-white p-2 rounded border border-gray-100 shadow-sm">
                    <p className="font-medium text-gray-700 text-sm">Notes</p>
                    <p className="text-gray-900">{patientData.subjective.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500">No subjective data found.</p>
      )}
      <div className="mt-4 flex justify-between">
        <button 
          onClick={() => setModalIsOpen(false)} 
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={() => setModalIsOpen(false)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </Modal>

    {/* Diagnosis Selector Modal */}
    <DiagnosisSelector
      isOpen={diagnosisModalOpen}
      onClose={() => setDiagnosisModalOpen(false)}
      selectedDiagnoses={formData.diagnosis}
      onDiagnosesChange={(diagnoses) => setFormData(prev => ({ ...prev, diagnosis: diagnoses }))}
    />
      </div>
    </div>
  );
};

export default InitialVisitForm;
