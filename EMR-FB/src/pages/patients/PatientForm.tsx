import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Save, ArrowLeft } from 'lucide-react';

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

interface Attorney {
  name?: string;
  firm?: string;
  phone?: string;
  email?: string;
  caseNumber?: string;
  address?: Omit<Address, 'country'>;
}

interface SubjectiveIntake {
  bodyPart: string;
  side: string;
  headache: string[];
  severity: string;
  quality: string[];
  timing: string;
  context: string;
  exacerbatedBy: string[];
  symptoms: string[];
  radiatingTo: string;
  radiatingRight: boolean;
  radiatingLeft: boolean;
  sciaticaRight: boolean;
  sciaticaLeft: boolean;
  notes: string;
}


interface Patient {
  _id?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  accidentDate: string;
  accidentType: string;
  visits?: Array<{
    _id: string;
    visitType: string;
    status: string;
    date: string;
  }>;
  assignedDoctor: string;
  attorney?: Attorney;
  address: Address;
  medicalHistory: {
    allergies: string[];
    medications: string[];
    conditions: string[];
    surgeries: string[];
    familyHistory: string[];
  };
  subjective: {
    fullName: string;
    date: string;
    physical: string[];
    sleep: string[];
    cognitive: string[];
    digestive: string[];
    emotional: string[];
    bodyPart: { part: string; side: string }[];
    intakes: SubjectiveIntake[];
    tempBodyPart?: string;
    tempSide?: string;
  };
}

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
}

const PatientForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth(); // ✅ new — now you have access to token

  const isEditMode = !!id;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  // State for managing body parts in the subjective section
  const [bodyParts, setBodyParts] = useState<Array<{part: string, side: string}>>([{part: '', side: ''}]);

  const handleAddBodyPart = () => {
    setBodyParts([...bodyParts, {part: '', side: ''}]);
  };

  const handleRemoveBodyPart = (index: number) => {
    if (bodyParts.length > 1) {
      const updated = [...bodyParts];
      updated.splice(index, 1);
      setBodyParts(updated);
    }
  };

  const handleBodyPartChange = (index: number, field: 'part' | 'side', value: string) => {
    const updated = [...bodyParts];
    updated[index] = { ...updated[index], [field]: value };
    setBodyParts(updated);
    
    // We no longer directly update the bodyPart array here
    // as it will be derived from the intakes array in preparePatientData
  };
  
  // Function to add a new subjective intake for a body part
  const addSubjectiveIntake = (bodyPart: string, side: string) => {
    setFormData(prev => ({
      ...prev,
      subjective: {
        ...prev.subjective,
        intakes: [
          ...prev.subjective.intakes,
          {
            bodyPart,
            side,
            headache: [],
            severity: '',
            quality: [],
            timing: '',
            context: '',
            exacerbatedBy: [],
            symptoms: [],
            radiatingTo: '',
            radiatingRight: false,
            radiatingLeft: false,
            sciaticaRight: false,
            sciaticaLeft: false,
            notes: ''
          }
        ]
      }
    }));
  };
  
  // Function to update a specific intake
  const updateSubjectiveIntake = (index: number, field: keyof SubjectiveIntake, value: any) => {
    setFormData(prev => {
      const updatedIntakes = [...prev.subjective.intakes];
      updatedIntakes[index] = {
        ...updatedIntakes[index],
        [field]: value
      };
      
      return {
        ...prev,
        subjective: {
          ...prev.subjective,
          intakes: updatedIntakes
        }
      };
    });
  };
  
  // Function to remove a subjective intake
  const removeSubjectiveIntake = (index: number) => {
    setFormData(prev => {
      const updatedIntakes = [...prev.subjective.intakes];
      updatedIntakes.splice(index, 1);
      
      return {
        ...prev,
        subjective: {
          ...prev.subjective,
          intakes: updatedIntakes
        }
      };
    });
  };
  

  // Define valid status values based on server enum
  const validStatuses = ['active', 'inactive', 'pending', 'discharged'] as const;
  
  const [formData, setFormData] = useState<Patient>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    accidentDate: '',
    accidentType: '',
    assignedDoctor: user?.role === 'admin' ? '' : user?._id || '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    medicalHistory: {
      allergies: [''],
      medications: [''],
      conditions: [''],
      surgeries: [''],
      familyHistory: ['']
    },
    subjective: {
      fullName: '',
      date: new Date().toISOString().split('T')[0],
      physical: [],
      sleep: [],
      cognitive: [],
      digestive: [],
      emotional: [],
      bodyPart: [],
      intakes: [],
      tempBodyPart: '',
      tempSide: ''
    },
    attorney: {
      name: '',
      firm: '',
      phone: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      }
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (isEditMode) {
          // 🔄 Fetch existing patient data
          const patientResponse = await axios.get(`http://localhost:5000/api/patients/${id}`);
          const patientData = patientResponse.data;
  
          if (patientData.dateOfBirth) {
            patientData.dateOfBirth = new Date(patientData.dateOfBirth).toISOString().split('T')[0];
          }
  
          // ✅ Ensure subjective structure
          if (!patientData.subjective) {
            patientData.subjective = {
              fullName: '',
              date: '',
              physical: [],
              sleep: [],
              cognitive: [],
              digestive: [],
              emotional: [],
              bodyPart: [],
              intakes: [],
              tempBodyPart: '',
              tempSide: ''
            };
          }
          
          // Convert old format to new format if needed
          if (patientData.subjective && !patientData.subjective.intakes) {
            patientData.subjective.intakes = [];
          }
          
          // Transform bodyPart array from database to intakes array for the form
          if (patientData.subjective && Array.isArray(patientData.subjective.bodyPart) && patientData.subjective.bodyPart.length > 0) {
            // Map each bodyPart to an intake object
            patientData.subjective.intakes = patientData.subjective.bodyPart.map(bp => ({
              bodyPart: bp.part,
              side: bp.side,
              severity: bp.severity || '',
              quality: Array.isArray(bp.quality) ? bp.quality : [],
              timing: bp.timing || '',
              context: bp.context || '',
              exacerbatedBy: Array.isArray(bp.exacerbatedBy) ? bp.exacerbatedBy : [],
              symptoms: Array.isArray(bp.symptoms) ? bp.symptoms : [],
              notes: bp.notes || '',
              radiatingTo: bp.radiatingTo || '',
              radiatingRight: bp.radiatingRight || false,
              radiatingLeft: bp.radiatingLeft || false,
              sciaticaRight: bp.sciaticaRight || false,
              sciaticaLeft: bp.sciaticaLeft || false,
              headache: [] // This field is in the form but not in the database model
            }));
          }
  
          setFormData(patientData);
        } else {
          // ➕ Auto-generate caseNumber in create mode using localStorage
          const lastCase = localStorage.getItem("lastCaseNumber") || "1000";
          const newCaseNumber = parseInt(lastCase) + 1;
          localStorage.setItem("lastCaseNumber", newCaseNumber.toString());
  
          setFormData(prev => ({
            ...prev,
            attorney: {
              ...prev.attorney,
              caseNumber: `CASE-${newCaseNumber}`
            }
          }));
        }
  
        // 👨‍⚕️ Fetch doctor list if user is admin
        if (user?.role === 'admin') {
          const doctorsResponse = await axios.get('http://localhost:5000/api/auth/doctors');
          setDoctors(doctorsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchData();
  }, [id, isEditMode, user?.role]);
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const isCheckbox = type === 'checkbox';
    const inputValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => {
      // Create a deep copy of the previous state
      const newState = JSON.parse(JSON.stringify(prev));
      
      // Handle nested properties (e.g., attorney.address.street)
      if (name.includes('.')) {
        const parts = name.split('.');
        let current = newState;
        
        // Traverse the object path
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part] || typeof current[part] !== 'object') {
            // Initialize the nested object if it doesn't exist
            current[part] = {};
          }
          current = current[part];
        }
        
        // Set the value at the final path
        const lastPart = parts[parts.length - 1];
        current[lastPart] = inputValue;
      } else {
        // Handle top-level properties
        newState[name] = inputValue;
      }
      
      return newState;
    });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleArrayChange = (category: string, index: number, value: string) => {
    const updatedArray = [...formData.medicalHistory[category as keyof typeof formData.medicalHistory] as string[]];
    updatedArray[index] = value;
    
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        [category]: updatedArray
      }
    }));
  };

  const addArrayItem = (category: string) => {
    const updatedArray = [...formData.medicalHistory[category as keyof typeof formData.medicalHistory] as string[], ''];
    
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        [category]: updatedArray
      }
    }));
  };

  const removeArrayItem = (category: string, index: number) => {
    const updatedArray = [...formData.medicalHistory[category as keyof typeof formData.medicalHistory] as string[]];
    updatedArray.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        [category]: updatedArray
      }
    }));
  };

  // Helper function to clean and validate form data
  const preparePatientData = (data: Patient) => {
    // Create a deep copy of the data
    const cleanedData: any = JSON.parse(JSON.stringify(data));
    
    // Format date of birth
    if (cleanedData.dateOfBirth) {
      cleanedData.dateOfBirth = new Date(cleanedData.dateOfBirth).toISOString();
    }
    
    // Clean medical history arrays
    if (cleanedData.medicalHistory) {
      cleanedData.medicalHistory = Object.fromEntries(
        Object.entries(cleanedData.medicalHistory).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.filter((item: string) => item && item.trim() !== '') : value
        ])
      );
    }
    
    // Clean subjective data
    if (cleanedData.subjective) {
      // Filter valid intakes
      const validIntakes = Array.isArray(cleanedData.subjective.intakes)
        ? cleanedData.subjective.intakes.filter(
            (intake: SubjectiveIntake) => intake.bodyPart && intake.side
          )
        : [];
      
      // Transform intakes into bodyPart format expected by the server/database
      const transformedBodyParts = validIntakes.map((intake: SubjectiveIntake) => ({
        part: intake.bodyPart,
        side: intake.side,
        severity: intake.severity,
        quality: intake.quality,
        timing: intake.timing,
        context: intake.context,
        exacerbatedBy: intake.exacerbatedBy,
        symptoms: intake.symptoms,
        notes: intake.notes,
        radiatingTo: intake.radiatingTo,
        radiatingRight: intake.radiatingRight,
        radiatingLeft: intake.radiatingLeft,
        sciaticaRight: intake.sciaticaRight,
        sciaticaLeft: intake.sciaticaLeft
      }));
      
      cleanedData.subjective = {
        ...cleanedData.subjective,
        bodyPart: transformedBodyParts,
        // Keep intakes for frontend reference but they won't be used by the server
        intakes: validIntakes
      };
    }
    
    // Clean attorney info
    if (cleanedData.attorney) {
      const hasAttorneyInfo = [
        cleanedData.attorney.name,
        cleanedData.attorney.firm,
        cleanedData.attorney.phone,
        cleanedData.attorney.email,
        cleanedData.attorney.caseNumber
      ].some((val) => val && val.trim() !== '');
      
      
      if (!hasAttorneyInfo) {
        delete cleanedData.attorney;
      } else {
        // Clean attorney address
        if (cleanedData.attorney.address) {
          const hasAddressInfo = Object.values(cleanedData.attorney.address).some(
            (val: any) => val && val.trim() !== ''
          );
          
          if (!hasAddressInfo) {
            delete cleanedData.attorney.address;
          } else {
            // Remove empty address fields
            cleanedData.attorney.address = Object.fromEntries(
              Object.entries(cleanedData.attorney.address)
                .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
            );
          }
        }
      }
    }
    
    return cleanedData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender?.trim()) newErrors.gender = 'Gender is required';
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phone?.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.assignedDoctor) newErrors.assignedDoctor = 'Please assign a doctor';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo(0, 0);
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Prepare and clean patient data
      const patientData = preparePatientData(formData);
      
      // Add required fields that might be missing
      if (!patientData.status) {
        patientData.status = 'active'; // Default status
      }
      
      // Ensure required nested objects exist
      if (!patientData.address) patientData.address = {} as Address;
      if (!patientData.medicalHistory) patientData.medicalHistory = { allergies: [], medications: [], conditions: [], surgeries: [], familyHistory: [] };
      if (!patientData.subjective) patientData.subjective = {
        fullName: '',
        date: new Date().toISOString().split('T')[0],
        physical: [],
        sleep: [],
        cognitive: [],
        digestive: [],
        emotional: [],
        bodyPart: [],
        intakes: [],
        tempBodyPart: '',
        tempSide: ''
      };
      
      const config = { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      };
      
      console.log('Sending patient data:', JSON.stringify(patientData, null, 2));
      
      try {
        const response = isEditMode 
          ? await axios.put(`http://localhost:5000/api/patients/${id}`, patientData, config)
          : await axios.post('http://localhost:5000/api/patients', patientData, config);
        
        console.log('Server response:', response.data);
        
        // Show success message
        alert(`Patient ${isEditMode ? 'updated' : 'created'} successfully!`);
        
        // Redirect to patients list
        navigate('/patients');
      } catch (axiosError: any) {
        // Handle axios errors
        console.error('Axios error details:', {
          message: axiosError.message,
          code: axiosError.code,
          config: axiosError.config,
          response: axiosError.response ? {
            status: axiosError.response.status,
            statusText: axiosError.response.statusText,
            data: axiosError.response.data,
            headers: axiosError.response.headers
          } : 'No response',
          request: axiosError.request ? 'Request made but no response received' : 'No request made'
        });
        
        throw axiosError; // Re-throw to be caught by the outer catch
      }
    } catch (error: any) {
      console.error('Error saving patient:', error);
      
      let errorMessage = 'Failed to save patient. Please try again.';
      let errorDetails = '';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
        
        // Try to extract more detailed error information
        const responseData = error.response.data;
        
        if (typeof responseData === 'string') {
          // If the response is a string, try to parse it as JSON
          try {
            const parsedData = JSON.parse(responseData);
            errorMessage = parsedData.message || errorMessage;
            errorDetails = parsedData.error || JSON.stringify(parsedData, null, 2);
          } catch (e) {
            // If it's not JSON, use the raw response
            errorMessage = responseData || errorMessage;
          }
        } else if (responseData && typeof responseData === 'object') {
          errorMessage = responseData.message || errorMessage;
          errorDetails = responseData.error || JSON.stringify(responseData, null, 2);
        }
        
        // Add status-specific messages
        if (error.response.status === 400) {
          errorMessage = 'Validation error. Please check your input.';
        } else if (error.response.status === 401) {
          errorMessage = 'Unauthorized. Please log in again.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }
      
      // Show detailed error in console
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        config: error.config,
        response: error.response?.data
      });
      
      // Show user-friendly error message
      alert(`${errorMessage}${errorDetails ? `\n\nDetails: ${errorDetails}` : ''}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-200"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-800">
          {isEditMode ? 'Edit Patient' : 'Add New Patient'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name*
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name*
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
              </div>
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth*
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>}
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Gender*
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.gender ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
              </div>
              <div>
                <label htmlFor="accidentDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Accident
                </label>
                <input
                  type="date"
                  id="accidentDate"
                  name="accidentDate"
                  value={formData.accidentDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email*
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone*
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="accidentType" className="block text-sm font-medium text-gray-700 mb-1">
                  Type of Accident
                </label>
                <input
                  type="text"
                  id="accidentType"
                  name="accidentType"
                  value={formData.accidentType}
                  onChange={handleChange}
                  placeholder="e.g., Motor vehicle accident"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {user?.role === 'admin' && (
                <div>
                  <label htmlFor="assignedDoctor" className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Doctor*
                  </label>
                  <select
                    id="assignedDoctor"
                    name="assignedDoctor"
                    value={formData.assignedDoctor}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errors.assignedDoctor ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        Dr. {doctor.firstName} {doctor.lastName}
                      </option>
                    ))}
                  </select>
                  {errors.assignedDoctor && <p className="mt-1 text-sm text-red-600">{errors.assignedDoctor}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-1">
                  Street
                </label>
                <input
                  type="text"
                  id="address.street"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="address.city"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  id="address.state"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Zip Code
                </label>
                <input
                  type="text"
                  id="address.zipCode"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  id="address.country"
                  name="address.country"
                  value={formData.address.country || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Body Parts */}
          {/* <div className="md:col-span-2">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Affected Body Parts</h2>
            <div className="space-y-4">
              {bodyParts.map((bodyPart, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={bodyPart.part}
                      onChange={(e) => handleBodyPartChange(index, 'part', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Body part (e.g., Shoulder, Knee)"
                    />
                  </div>
                  <div className="w-32">
                    <select
                      value={bodyPart.side}
                      onChange={(e) => handleBodyPartChange(index, 'side', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Side</option>
                      <option value="Left">Left</option>
                      <option value="Right">Right</option>
                      <option value="Bilateral">Bilateral</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBodyPart(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                    disabled={bodyParts.length <= 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddBodyPart}
                className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                + Add Another Body Part
              </button>
            </div>
          </div> */}

          {/* Attorney Information */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Attorney Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="attorney.name" className="block text-sm font-medium text-gray-700 mb-1">
                  Attorney Name
                </label>
                <input
                  type="text"
                  id="attorney.name"
                  name="attorney.name"
                  value={formData.attorney?.name || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="attorney.firm" className="block text-sm font-medium text-gray-700 mb-1">
                  Firm Name
                </label>
                <input
                  type="text"
                  id="attorney.firm"
                  name="attorney.firm"
                  value={formData.attorney?.firm || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="attorney.phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="attorney.phone"
                  name="attorney.phone"
                  value={formData.attorney?.phone || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="attorney.email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="attorney.email"
                  name="attorney.email"
                  value={formData.attorney?.email || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
  <label htmlFor="attorney.caseNumber" className="block text-sm font-medium text-gray-700 mb-1">
    Case Number
  </label>
  <input
    type="text"
    id="attorney.caseNumber"
    name="attorney.caseNumber"
    value={formData.attorney?.caseNumber || ''}
    onChange={handleChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
  />
</div>
                <div className="md:col-span-2">
                <label htmlFor="attorney.address.street" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="attorney.address.street"
                  name="attorney.address.street"
                  value={formData.attorney?.address?.street || ''}
                  onChange={handleChange}
                  placeholder="Street address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="attorney.address.city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="attorney.address.city"
                  name="attorney.address.city"
                  value={formData.attorney?.address?.city || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="attorney.address.state" className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  id="attorney.address.state"
                  name="attorney.address.state"
                  value={formData.attorney?.address?.state || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="attorney.address.zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  id="attorney.address.zipCode"
                  name="attorney.address.zipCode"
                  value={formData.attorney?.address?.zipCode || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

         
          {/* Medical History */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Medical History</h2>
            
            {/* Allergies */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-800 mb-2">Allergies</h3>
              {formData.medicalHistory.allergies.map((allergy, index) => (
                <div key={`allergy-${index}`} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={allergy}
                    onChange={(e) => handleArrayChange('allergies', index, e.target.value)}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter allergy"
                  />
                  {formData.medicalHistory.allergies.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('allergies', index)}
                      className="ml-2 p-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('allergies')}
                className="mt-1 text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Allergy
              </button>
            </div>
            
            {/* Medications */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-800 mb-2">Medications</h3>
              {formData.medicalHistory.medications.map((medication, index) => (
                <div key={`medication-${index}`} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={medication}
                    onChange={(e) => handleArrayChange('medications', index, e.target.value)}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter medication"
                  />
                  {formData.medicalHistory.medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('medications', index)}
                      className="ml-2 p-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('medications')}
                className="mt-1 text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Medication
              </button>
            </div>
            
            {/* Conditions */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-800 mb-2">Medical Conditions</h3>
              {formData.medicalHistory.conditions.map((condition, index) => (
                <div key={`condition-${index}`} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={condition}
                    onChange={(e) => handleArrayChange('conditions', index, e.target.value)}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter condition"
                  />
                  {formData.medicalHistory.conditions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('conditions', index)}
                      className="ml-2 p-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('conditions')}
                className="mt-1 text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Condition
              </button>
            </div>
            
            {/* Surgeries */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-800 mb-2">Past Surgeries</h3>
              {formData.medicalHistory.surgeries.map((surgery, index) => (
                <div key={`surgery-${index}`} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={surgery}
                    onChange={(e) => handleArrayChange('surgeries', index, e.target.value)}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter surgery"
                  />
                  {formData.medicalHistory.surgeries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('surgeries', index)}
                      className="ml-2 p-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('surgeries')}
                className="mt-1 text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Surgery
              </button>
            </div>
            
            {/* Family History */}
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-2">Family History</h3>
              {formData.medicalHistory.familyHistory.map((history, index) => (
                <div key={`family-${index}`} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={history}
                    onChange={(e) => handleArrayChange('familyHistory', index, e.target.value)}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter family history"
                  />
                  {formData.medicalHistory.familyHistory.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('familyHistory', index)}
                      className="ml-2 p-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('familyHistory')}
                className="mt-1 text-sm text  -blue-600 hover:text-blue-800"
              >
                + Add Family History
              </button>
            </div>
          </div>
        </div>
{/* SUBJECTIVE INTAKE SECTION */}
<div className="mt-12 border-t pt-6">
  <h2 className="text-2xl font-bold text-gray-800 mb-6">Subjective Intake</h2>

  {/* Affected Areas (Body Parts Dropdown + Side Dropdown + Add Button) */}
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-2">Add Body Part for Subjective Intake</h3>

    {/* Dropdown Row */}
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Body Part Dropdown */}
      <select
        value={formData.subjective.tempBodyPart || ''}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            subjective: {
              ...prev.subjective,
              tempBodyPart: e.target.value,
            },
          }))
        }
        className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select Body Part</option>
        {[
          'C/S', 'T/S', 'L/S', 'SH', 'ELB', 'WR', 'Hand', 'Finger(s)',
          'Hip', 'KN', 'AN', 'Foot', 'Toe(s)',
          'L Ant/Post/Lat/Med', 'R Ant/Post/Lat/Med',
        ].map((part) => (
          <option key={part} value={part}>{part}</option>
        ))}
      </select>

      {/* Side Dropdown */}
      <select
        value={formData.subjective.tempSide || ''}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            subjective: {
              ...prev.subjective,
              tempSide: e.target.value,
            },
          }))
        }
        className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select Side</option>
        <option value="Left">Left</option>
        <option value="Right">Right</option>
        <option value="Bilateral">Bilateral</option>
      </select>

      {/* Add Button */}
      <button
        type="button"
        onClick={() => {
          const { tempBodyPart, tempSide } = formData.subjective;
          if (tempBodyPart && tempSide) {
            // Add to bodyPart array for tracking
            setFormData((prev) => ({
              ...prev,
              subjective: {
                ...prev.subjective,
                bodyPart: [
                  ...prev.subjective.bodyPart,
                  { part: tempBodyPart, side: tempSide },
                ],
                tempBodyPart: '',
                tempSide: '',
              },
            }));
            
            // Add a new subjective intake for this body part
            addSubjectiveIntake(tempBodyPart, tempSide);
          }
        }}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        Add Body Part
      </button>
    </div>
  </div>

  {/* Display subjective intakes for each body part */}
  {formData.subjective.intakes.map((intake, intakeIndex) => (
    <div key={`intake-${intakeIndex}`} className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-blue-700">
          {intake.bodyPart} - {intake.side}
        </h3>
        <button
          type="button"
          onClick={() => removeSubjectiveIntake(intakeIndex)}
          className="text-red-600 hover:text-red-800 font-medium"
        >
          Remove
        </button>
      </div>

      {/* Headache */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Headache</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {["Headache", "Frontal", "Parietal", "Temporal", "Occipital", "Head contusion"].map((val) => (
            <label key={`headache-${intakeIndex}-${val}`} className="flex items-center space-x-2">
              <input
                type="checkbox"
                value={val}
                checked={intake.headache.includes(val)}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? [...intake.headache, val]
                    : intake.headache.filter(h => h !== val);
                  updateSubjectiveIntake(intakeIndex, 'headache', updated);
                }}
              />
              <span>{val}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Severity</h4>
        <div className="flex flex-wrap gap-2 text-sm">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Mild", "Moderate", "Severe"].map(val => (
            <label key={`severity-${intakeIndex}-${val}`} className="flex items-center space-x-2">
              <input
                type="radio"
                name={`intake-${intakeIndex}-severity`}
                value={val}
                checked={intake.severity === val}
                onChange={() => updateSubjectiveIntake(intakeIndex, 'severity', val)}
              />
              <span>{val}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Quality */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Quality</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {["Achy", "Dull", "Sharp", "Stabbing", "Throbbing", "Burning", "Crushing"].map(val => (
            <label key={`quality-${intakeIndex}-${val}`} className="flex items-center space-x-2">
              <input
                type="checkbox"
                value={val}
                checked={intake.quality.includes(val)}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? [...intake.quality, val]
                    : intake.quality.filter(q => q !== val);
                  updateSubjectiveIntake(intakeIndex, 'quality', updated);
                }}
              />
              <span>{val}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Timing */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Timing</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          {["Constant", "Frequent", "Intermittent", "Occasional", "Activity Dependent"].map(val => (
            <label key={`timing-${intakeIndex}-${val}`} className="flex items-center space-x-2">
              <input
                type="radio"
                name={`intake-${intakeIndex}-timing`}
                value={val}
                checked={intake.timing === val}
                onChange={() => updateSubjectiveIntake(intakeIndex, 'timing', val)}
              />
              <span>{val}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Context */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Context</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          {["New", "Improving", "Worsening", "Recurrent"].map(val => (
            <label key={`context-${intakeIndex}-${val}`} className="flex items-center space-x-2">
              <input
                type="radio"
                name={`intake-${intakeIndex}-context`}
                value={val}
                checked={intake.context === val}
                onChange={() => updateSubjectiveIntake(intakeIndex, 'context', val)}
              />
              <span>{val}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Radiating To */}
      <div className="mb-6">
        <label htmlFor={`intake-${intakeIndex}-radiatingTo`} className="block text-sm font-medium text-gray-700 mb-1">
          Radiating To
        </label>
        <input
          type="text"
          id={`intake-${intakeIndex}-radiatingTo`}
          value={intake.radiatingTo}
          onChange={(e) => updateSubjectiveIntake(intakeIndex, 'radiatingTo', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="e.g., Arm, Leg, etc."
        />
      </div>

      {/* Exacerbated By */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Exacerbated By</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {["Rest", "Increased Activity", "Prolonged Work", "School", "Stress", "Looking Up/Down", "Overhead Reach", "Sitting", "Standing", "Walking", "Twisting", "Stooping", "Bend", "Squat", "Kneel", "Lifting", "Carrying", "Serving", "Pulling/Pushing", "Grip/Grasp", "Chiro", "Physio", "Exercise", "Ice", "Heat", "Changes in the Weather"].map(val => (
            <label key={`exacerbated-${intakeIndex}-${val}`} className="flex items-center space-x-2">
              <input
                type="checkbox"
                value={val}
                checked={intake.exacerbatedBy.includes(val)}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? [...intake.exacerbatedBy, val]
                    : intake.exacerbatedBy.filter(v => v !== val);
                  updateSubjectiveIntake(intakeIndex, 'exacerbatedBy', updated);
                }}
              />
              <span>{val}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Signs/Symptoms */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Signs / Symptoms</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {["Tenderness", "Soreness", "Stiffness", "Tightness", "Loss of Motion", "Locking", "Grinding", "Popping", "Clicking", "Joint Instability", "Joint Redness", "Tingling", "Numbness", "Swelling", "Weakness", "Pulling", "Dropping Objects", "Dizziness", "Nausea", "Hearing Loss", "TMJ", "Double Vision", "Blurry Vision", "Photosensitivity", "Throat Pain", "Fever", "Rash", "Loss of Bowel or Bladder", "Feeling Mentally Foggy", "Feeling Slowed Down", "Difficulty Remembering", "Difficulty Concentrating"].map(val => (
            <label key={`symptoms-${intakeIndex}-${val}`} className="flex items-center space-x-2">
              <input
                type="checkbox"
                value={val}
                checked={intake.symptoms.includes(val)}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? [...intake.symptoms, val]
                    : intake.symptoms.filter(s => s !== val);
                  updateSubjectiveIntake(intakeIndex, 'symptoms', updated);
                }}
              />
              <span>{val}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Radiating & Sciatica */}
      <div className="mb-6 flex gap-12">
        <div>
          <h4 className="font-medium mb-1">Radiating</h4>
          <label className="inline-flex items-center mr-4">
            <input
              type="checkbox"
              checked={intake.radiatingRight}
              onChange={(e) => updateSubjectiveIntake(intakeIndex, 'radiatingRight', e.target.checked)}
            />
            <span className="ml-2">R</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={intake.radiatingLeft}
              onChange={(e) => updateSubjectiveIntake(intakeIndex, 'radiatingLeft', e.target.checked)}
            />
            <span className="ml-2">L</span>
          </label>
        </div>
        <div>
          <h4 className="font-medium mb-1">Sciatica</h4>
          <label className="inline-flex items-center mr-4">
            <input
              type="checkbox"
              checked={intake.sciaticaRight}
              onChange={(e) => updateSubjectiveIntake(intakeIndex, 'sciaticaRight', e.target.checked)}
            />
            <span className="ml-2">R</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={intake.sciaticaLeft}
              onChange={(e) => updateSubjectiveIntake(intakeIndex, 'sciaticaLeft', e.target.checked)}
            />
            <span className="ml-2">L</span>
          </label>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label htmlFor={`intake-${intakeIndex}-notes`} className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id={`intake-${intakeIndex}-notes`}
          rows={3}
          value={intake.notes}
          onChange={(e) => updateSubjectiveIntake(intakeIndex, 'notes', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        ></textarea>
      </div>
    </div>
  ))}

  {/* Show message if no body parts added */}
  {formData.subjective.intakes.length === 0 && (
    <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-gray-500">No body parts added yet. Use the form above to add body parts for subjective intake.</p>
    </div>
  )}
</div>

<div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Patient
              </>
            )}
          </button>
        </div>
        

</form>
    </div>
  );
};

export default PatientForm;