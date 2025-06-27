import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../Assets/logo.png';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BillingList from '../billing/BillingList';
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  FileText, 
  DollarSign, 
  Printer,
  ChevronDown,
  ChevronUp,
  Download,
  FileArchive
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';


const toBase64 = async (url: string): Promise<string> => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const drawSection = (doc: any, title: string, content: { [key: string]: any }, y: number): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text(title, margin, y);
  y += 6;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200);
  let boxHeight = 0;
  const keys = Object.keys(content);

  keys.forEach(key => {
    const value = typeof content[key] === 'object'
      ? JSON.stringify(content[key], null, 2)
      : content[key] || 'N/A';

    const splitText = doc.splitTextToSize(`${key.replace(/([A-Z])/g, ' $1')}: ${value}`, 170);
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(splitText, margin, y);
    y += splitText.length * 5 + 2;
    boxHeight += splitText.length * 5 + 2;
  });

  y += 4;
  return y;
};
const formatRestrictions = (restrictionsObj: any) => {
  if (!restrictionsObj || typeof restrictionsObj !== 'object') return 'N/A';

  const lines = [];

  if (restrictionsObj.avoidActivityWeeks) {
    lines.push(`Avoid activity for: ${restrictionsObj.avoidActivityWeeks} week(s)`);
  }

  if (restrictionsObj.liftingLimitLbs) {
    lines.push(`Lifting limit: ${restrictionsObj.liftingLimitLbs} lbs`);
  }

  if (restrictionsObj.avoidProlongedSitting !== undefined) {
    lines.push(`Avoid prolonged sitting: ${restrictionsObj.avoidProlongedSitting ? 'Yes' : 'No'}`);
  }

  return lines.length ? lines.join('\n') : 'No restrictions provided';
};

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
 
  medicalHistory: {
    allergies: string[];
    medications: string[];
    conditions: string[];
    surgeries: string[];
    familyHistory: string[];
  };
  subjective?: {
    fullName: string;
    date: string;
    severity: string;
    timing: string;
    context: string;
    notes: string;
    quality?: string[];
    exacerbatedBy?: string[];
    symptoms?: string[];
    radiatingTo?: string;
    radiatingRight?: boolean;
    radiatingLeft?: boolean;
    sciaticaRight?: boolean;
    sciaticaLeft?: boolean;
    bodyPart: {
      part: string;
      side: string;
    }[];
  };
  attorney?: {
    name: string;
    firm: string;
    phone: string;
    email: string;
    caseNumber?: string; // <-- Add this
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country?: string; // <-- Optional, based on usage
    };
  };
  
    
  assignedDoctor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  maritalStatus?: string;
  injuryDate?: string;
}

interface Visit {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  doctor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  date: string;
  visitType: string;
  notes?: string;
  __t: string;

  // Initial Visit fields
  chiefComplaint?: string;
  chiropracticAdjustment?: string[];
  chiropracticOther?: string;
  acupuncture?: string[];
  acupunctureOther?: string;
  physiotherapy?: string[];
  rehabilitationExercises?: string[];

  durationFrequency?: {
    timesPerWeek?: number;
    reEvalInWeeks?: number;
  };

  referrals?: string[]; // InitialVisit has referrals as array

  imaging?: {
    xray?: string[];
    mri?: string[];
    ct?: string[];
  };

  diagnosticUltrasound?: string;
  nerveStudy?: string[];

  restrictions?: {
    avoidActivityWeeks?: number;
    liftingLimitLbs?: number;
    avoidProlongedSitting?: boolean;
  };

  disabilityDuration?: string;
  otherNotes?: string;

  // Follow-up Visit fields (matching the EXAM FORM---REEVALUATION template)
  areas?: string;
  areasImproving?: boolean;
  areasExacerbated?: boolean;
  areasSame?: boolean;
  musclePalpation?: string;
  painRadiating?: string;
  romWnlNoPain?: boolean;
  romWnlWithPain?: boolean;
  romImproved?: boolean;
  romDecreased?: boolean;
  romSame?: boolean;
  orthos?: {
    tests?: string;
    result?: string;
  };
  activitiesCausePain?: string;
  activitiesCausePainOther?: string;
  treatmentPlan?: {
    treatments?: string;
    timesPerWeek?: string;
  };
  overallResponse?: {
    improving?: boolean;
    worse?: boolean;
    same?: boolean;
  };
  diagnosticStudy?: {
    study?: string;
    bodyPart?: string;
    result?: string;
  };
  homeCare?: string[]; // FollowupVisit and DischargeVisit have homeCare as array

  // Discharge Visit fields
  treatmentSummary?: string;
  dischargeDiagnosis?: string[];
  medicationsAtDischarge?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  followUpInstructions?: string;
  returnPrecautions?: string[];
  dischargeStatus?: string;

  // Fields observed in VisitDetails.tsx for various visit types, not consistently in previous interface
  assessment?: string; // Used in InitialVisitDetails
  progressNotes?: string; // Used in FollowupVisitDetails for title/check
  assessmentUpdate?: string; // Used in FollowupVisitDetails
  romPercent?: string; // Used in DischargeVisitDetails
  prognosis?: string; // Used in DischargeVisitDetails
  futureMedicalCare?: string[]; // Used in DischargeVisitDetails
  croftCriteria?: string; // Used in DischargeVisitDetails
  amaDisability?: string; // Used in DischargeVisitDetails
  referralsNotes?: string; // Used in DischargeVisitDetails (as notes for referrals)

   // Plan details - matching structure in VisitDetails.tsx
   plan?: {
    diagnosis?: string[];
    labTests?: string[];
    imaging?: string[];
    medications?: { name: string; dosage: string; frequency: string }[];
  };

   // Referral field in Followup and Discharge is a string
   referral?: string;

   // Missing fields identified from linter errors/VisitDetails.tsx review
   rationale?: string;
   scheduleOfCare?: string;
   physicalModality?: string;
   reevaluation?: string;
   returnFrequency?: string;
}

interface Appointment {
  _id: string;
  patient: string;
  doctor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  date: string;
  time: {
    start: string;
    end: string;
  };
  type: string;
  status: string;
  notes?: string; // Added notes field
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  dateIssued: string;
  dueDate: string;
  total: number;
  status: string;
}

const PatientDetails: React.FC<{}> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  // Using _ prefix to indicate this is intentionally unused
  // const [_invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceCount, setInvoiceCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // All sections are always expanded
  const expandedSections = {
    personalInfo: true,
    contactInfo: true,
    medicalHistory: true,
  };

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    const fetchPatientData = async () => {
      setIsLoading(true);
      try {
        // Fetch patient details
        const patientResponse = await axios.get(`https://emr-fb-1.onrender.com/api/patients/${id}`);
        setPatient(patientResponse.data);
        
        // Fetch patient visits
        const visitsResponse = await axios.get(`https://emr-fb-1.onrender.com/api/patients/${id}/visits`);
        
        const parsedVisits = visitsResponse.data.map((visit: any) => ({
          ...visit,
          plan: typeof visit.plan === 'string' ? JSON.parse(visit.plan) : visit.plan,
        }));
        setVisits(parsedVisits);
        
        // Fetch patient appointments
        const appointmentsResponse = await axios.get(`https://emr-fb-1.onrender.com/api/appointments?patient=${id}`);
        setAppointments(appointmentsResponse.data);
        
        // Fetch invoice count for the patient using the dedicated endpoint
        const invoiceCountResponse = await axios.get(`https://emr-fb-1.onrender.com/api/billing/count/${id}`);
        setInvoiceCount(invoiceCountResponse.data.totalInvoices);

        
        // We don't need to fetch invoices here anymore as BillingList will handle it
        // setInvoices([]); // Clear the local invoices state
      } catch (error) {
        console.error('Error fetching patient data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatientData();
  }, [id]);

  // No toggle function needed as all sections are always expanded

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Patient_${patient?.firstName}_${patient?.lastName}`,
  });

  const generatePDF = () => {
    if (!patient) return;
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Patient Summary', 105, 15, { align: 'center' });
    
    // Add patient name
    doc.setFontSize(16);
    doc.text(`${patient.firstName} ${patient.lastName}`, 105, 25, { align: 'center' });
    
    // Add basic info
    doc.setFontSize(12);
    doc.text(`Date of Birth: ${new Date(patient.dateOfBirth).toLocaleDateString()}`, 20, 40);
    doc.text(`Gender: ${patient.gender}`, 20, 50);
    doc.text(`Status: ${patient.status}`, 20, 60);
    doc.text(`Email: ${patient.email}`, 20, 70);
    doc.text(`Phone: ${patient.phone}`, 20, 80);
    
    // Add address
    doc.text('Address:', 20, 95);
    if (patient.address.street) doc.text(`${patient.address.street}`, 30, 105);
    if (patient.address.city || patient.address.state) {
      doc.text(`${patient.address.city}, ${patient.address.state} ${patient.address.zipCode}`, 30, 115);
    }
    if (patient.address.country) doc.text(`${patient.address.country}`, 30, 125);
    
    // Add medical history
    doc.text('Medical History:', 20, 140);
    
    // Allergies
    if (patient.medicalHistory.allergies.length > 0) {
      doc.text('Allergies:', 30, 150);
      patient.medicalHistory.allergies.forEach((allergy, index) => {
        if (allergy) doc.text(`- ${allergy}`, 40, 160 + (index * 10));
      });
    }
    
    // Save the PDF
    doc.save(`Patient_${patient.firstName}_${patient.lastName}.pdf`);
  };

  const generateFullReport = async () => {
    if (!patient) return;
    setIsGeneratingReport(true);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 30;
    const margin = 20;
    const logoBase64 = await toBase64(logo);
    const signatureBase64 = await toBase64('/src/Assets/sig.png');
  
    const colors = {
      primary: [44, 62, 80],
      secondary: [231, 76, 60],
      accent: [52, 152, 219],
      lightGray: [236, 240, 241],
      darkGray: [127, 140, 141],
      success: [46, 204, 113],
      warning: [241, 196, 15],
      purple: [155, 89, 182]
    };
  
    const addHeaderAndFooter = (doc: any, pageNumber: number, totalPages: number) => {
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.addImage(logoBase64, 'PNG', 15, 8, 12, 12);
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Medical Report', 32, 18);
      doc.setFontSize(12);
      doc.setTextColor(...colors.warning);
      doc.text('The Wellness Studio', pageWidth - 15, 18, { align: 'right' });
      doc.setFillColor(...colors.lightGray);
      doc.rect(0, 280, pageWidth, 20, 'F');
      const footerText = `The Wellness Studio • 3711 Long Beach Blvd., Suite 200, Long Beach, CA, 90807 • Tel: (562) 980-0555  Page ${pageNumber} of ${totalPages}`;
      doc.setFontSize(9);
      doc.setTextColor(...colors.darkGray);
      doc.text(footerText, pageWidth / 2, 290, { align: 'center' });
    };
  
    try {
      const response = await axios.post('https://emr-fb-1.onrender.com/api/ai/generate-narrative', {
        patient,
        visits,
      });
  
      const aiNarrative = response.data.narrative;
  
      // PATIENT INFO
      doc.setFontSize(14);
      doc.setTextColor(...colors.primary);
      doc.setFont('helvetica', 'bold');
      doc.text('PATIENT INFORMATION', pageWidth / 2, y, { align: 'center' });
      y += 10;
  
      autoTable(doc, {
        startY: y,
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: {
          fillColor: colors.primary,
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: { textColor: 50, fontStyle: 'normal' },
        columnStyles: {
          0: { cellWidth: 60, fillColor: [245, 245, 245], fontStyle: 'bold' },
          1: { cellWidth: pageWidth - 100 }
        },
        head: [['Field', 'Details']],
        body: [
          ['Name', `${patient.firstName} ${patient.lastName}`],
          ['Date of Birth', new Date(patient.dateOfBirth).toLocaleDateString()],
          ['Gender', patient.gender],
          ['Status', patient.status]
        ],
        theme: 'grid',
        margin: { left: margin, right: margin }
      });
  
      y = (doc as any).lastAutoTable.finalY + 15;
  
      const addNarrativeSection = (title: string, color: number[], fields: Array<[string, any]>) => {
        const sentences: Array<{ label: string; text: string[] }> = [];
        let height = 0;
  
        fields.forEach(([label, value]) => {
          if (!value) return;
          const line = `• ${label}: ${typeof value === 'string' ? value : Array.isArray(value) ? value.join(', ') : JSON.stringify(value)}`;
          const wrapped = doc.splitTextToSize(line, pageWidth - margin * 2);
          sentences.push({ label, text: wrapped });
          height += wrapped.length * 6 + 4;
        });
  
        if (y + height > 260) {
          doc.addPage();
          y = 30;
        }
        y += 10;
  
        doc.setFillColor(...color);
        doc.roundedRect(margin - 2, y - 6, pageWidth - margin * 2 + 4, 10, 3, 3, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text(title, margin, y + 2);
        y += 12;
  
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(200);
       
  
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(50);
        sentences.forEach(({ text }) => {
          doc.text(text, margin, y);
          y += text.length * 6 + 2;
        });
  
        y += 10;
      };
  
      // GROUPED VISITS
      const grouped = {
        initial: visits.find(v => v.visitType === 'initial'),
        followup: visits.find(v => v.visitType === 'followup'),
        discharge: visits.find(v => v.visitType === 'discharge')
      };
  
      if (grouped.initial) {
        const v = grouped.initial;
        addNarrativeSection('INITIAL VISIT', colors.accent, [
          ['Chief Complaint', v.chiefComplaint],
          ['Chiropractic Adjustment', v.chiropracticAdjustment?.join(', ')],
          ['Chiropractic Other Notes', v.chiropracticOther],
          ['Acupuncture', v.acupuncture?.join(', ')],
          ['Acupuncture Other Notes', v.acupunctureOther],
          ['Physiotherapy', v.physiotherapy?.join(', ')],
          ['Rehabilitation Exercises', v.rehabilitationExercises?.join(', ')],
          ['Treatment Frequency', v.durationFrequency ? `${v.durationFrequency.timesPerWeek} times/week, re-eval in ${v.durationFrequency.reEvalInWeeks} weeks` : ''],
          ['Referrals', v.referrals?.join(', ')],
          ['Imaging', v.imaging ? Object.entries(v.imaging).map(([modality, parts]) => `${modality.toUpperCase()}: ${parts.join(', ')}`).join('; ') : ''],
          ['Diagnostic Ultrasound', v.diagnosticUltrasound],
          ['Nerve Study', v.nerveStudy?.join(', ')],
          ['Restrictions', v.restrictions ? `Avoid activity for ${v.restrictions.avoidActivityWeeks} weeks, lifting limit ${v.restrictions.liftingLimitLbs} lbs${v.restrictions.avoidProlongedSitting ? ', avoid prolonged sitting' : ''}` : ''],
          ['Disability Duration', v.disabilityDuration],
          ['Other Notes', v.otherNotes]
        ]);
      }
  
      if (grouped.followup) {
        const v = grouped.followup;
        addNarrativeSection('FOLLOW-UP VISIT', colors.success, [
          ['Areas Status', [v.areasImproving && '✓ Improving', v.areasExacerbated && '✗ Exacerbated', v.areasSame && '➔ Same'].filter(Boolean).join(' ')],
          ['Muscle Palpation', v.musclePalpation],
          ['Pain Radiating', v.painRadiating],
          ['Range of Motion', [v.romWnlNoPain && '✓ WNL (No Pain)', v.romWnlWithPain && '⚠ WNL (With Pain)', v.romImproved && '↑ Improved', v.romDecreased && '↓ Decreased', v.romSame && '→ Same'].filter(Boolean).join(' ')],
          ['Orthopedic Tests', v.orthos ? `${v.orthos.tests} - ${v.orthos.result}` : ''],
          ['Activities Causing Pain', [v.activitiesCausePain, v.activitiesCausePainOther].filter(Boolean).join(' ')],
          ['Treatment Plan', v.treatmentPlan ? `${v.treatmentPlan.treatments} (${v.treatmentPlan.timesPerWeek} times/week)` : ''],
          ['Overall Response', [v.overallResponse?.improving && '↑ Improving', v.overallResponse?.worse && '↓ Worse', v.overallResponse?.same && '→ Same'].filter(Boolean).join(' ')],
          ['Diagnostic Study', v.diagnosticStudy ? `${v.diagnosticStudy.study} of ${v.diagnosticStudy.bodyPart}: ${v.diagnosticStudy.result}` : ''],
          ['Home Care', Array.isArray(v.homeCare) ? v.homeCare.join(', ') : (v.homeCare || 'N/A')],
          ['Referral', v.referral],
          ['Notes', v.otherNotes]
        ]);
      }
  
      if (grouped.discharge) {
        const v = grouped.discharge;
        addNarrativeSection('DISCHARGE VISIT', colors.secondary, [
          ['Prognosis', v.prognosis],
          ['Range of Motion', v.romPercent ? `${v.romPercent}% of pre-injury ROM` : ''],
          ['Diagnostic Study', v.diagnosticStudy ? `${v.diagnosticStudy.study} of ${v.diagnosticStudy.bodyPart}: ${v.diagnosticStudy.result}` : ''],
          ['Recommended Future Medical Care', Array.isArray(v.futureMedicalCare) ? v.futureMedicalCare.join(', ') : (v.futureMedicalCare || 'N/A')],
          ['Croft Criteria', v.croftCriteria],
          ['AMA Disability', v.amaDisability],
          ['Home Care Instructions', v.homeCare?.join(', ')],
          ['Referrals / Notes', v.referralsNotes],
          ['Treatment Summary', v.treatmentSummary],
          ['Discharge Diagnosis', v.dischargeDiagnosis?.join(', ')],
          ['Medications at Discharge', v.medicationsAtDischarge?.map(med => `${med.name} (${med.dosage}, ${med.frequency}, ${med.duration})`).join('; ')],
          ['Follow-up Instructions', v.followUpInstructions],
          ['Return Precautions', v.returnPrecautions?.join(', ')]
        ]);
      }
  
      // AI NARRATIVE (formatted)
      // Dynamically extract all sections from AI narrative
const matches = [...aiNarrative.matchAll(/\*\*(.+?):\*\*\s*([\s\S]*?)(?=\*\*|$)/g)];

matches.forEach(([_, section, content]) => {
  addNarrativeSection(section.toUpperCase(), colors.purple, [[section, content.trim()]]);
});

  
      // SIGNATURE
      if (y > 220) {
        doc.addPage();
        y = 30;
      }
      doc.addImage(signatureBase64, 'PNG', margin, y, 40, 20);
      y += 22;
      doc.setDrawColor(0);
      doc.line(margin, y, margin + 60, y);
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Harold Iseke, D.C.', margin, y);
      y += 5;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.text('Treating Provider', margin, y);
  
      // PAGINATION
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addHeaderAndFooter(doc, i, totalPages);
      }
  
      const fileName = `${patient.lastName}_${patient.firstName}_Medical_Report.pdf`;
      const blob = doc.output('blob');
      const formData = new FormData();
      formData.append('file', blob, fileName);
      await axios.post('https://emr-fb-1.onrender.com/api/reports/upload', formData);
  
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
  
      toast.success('Report generated and downloaded successfully');
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };
  

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">Patient not found</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/patients')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patients
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      {isGeneratingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <span className="text-lg font-semibold text-gray-700">Generating report, please wait...</span>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <button
            onClick={() => navigate('/patients')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-gray-600">
              {calculateAge(patient.dateOfBirth)} years • {patient.gender} • {patient.status}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/patients/${id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
          {user?.role === 'doctor' && (
            <>
              <Link
                to={`/appointments/new?patient=${id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule
              </Link>
              {visits.length > 0 ? (
                <>
                  <Link
                    to={`/patients/${id}/visits/followup`}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    New Follow-up
                  </Link>
                  {patient.status !== 'discharged' && (
                    <Link
                      to={`/patients/${id}/visits/discharge`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Discharge
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  to={`/patients/${id}/visits/initial`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Initial Visit
                </Link>
              )}
            </>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </button>
          <button
            onClick={generateFullReport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('visits')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'visits'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Visits ({visits.length})
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'appointments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Appointments ({appointments.length})
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'billing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Billing ({invoiceCount})

            </button>
          </nav>
        </div>
      </div>

      <div ref={printRef}>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
              </div>
              {expandedSections.personalInfo && (
                <div className="px-6 py-4">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{patient.firstName} {patient.lastName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(patient.dateOfBirth).toLocaleDateString()} ({calculateAge(patient.dateOfBirth)} years)
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Gender</dt>
                      <dd className="mt-1 text-sm text-gray-900 capitalize">{patient.gender}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1 text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            patient.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : patient.status === 'inactive'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {patient.status}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Assigned Doctor</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        Dr. {patient.assignedDoctor?.firstName} {patient.assignedDoctor?.lastName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Patient Since</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(patient.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Contact Information</h2>
              </div>
              {expandedSections.contactInfo && (
                <div className="px-6 py-4">
                  <dl className="grid grid-cols-1 gap-y-6">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{patient.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="mt-1 text-sm text-gray-900">{patient.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Address</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {patient.address.street && <p>{patient.address.street}</p>}
                        {(patient.address.city || patient.address.state) && (
                          <p>
                            {patient.address.city}, {patient.address.state} {patient.address.zipCode}
                          </p>
                        )}
                        {patient.address.country && <p>{patient.address.country}</p>}
                      </dd>
                    </div>
                    
                  </dl>
                </div>
              )}
            </div>

            {/* Medical History */}
            <div className="bg-white shadow rounded-lg overflow-hidden md:col-span-2">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Medical History</h2>
              </div>
              {expandedSections.medicalHistory && (
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Allergies</h3>
                      {patient.medicalHistory.allergies.length > 0 && patient.medicalHistory.allergies[0] ? (
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          {patient.medicalHistory.allergies.map((allergy, index) => (
                            allergy && <li key={index}>{allergy}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No known allergies</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Current Medications</h3>
                      {patient.medicalHistory.medications.length > 0 && patient.medicalHistory.medications[0] ? (
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          {patient.medicalHistory.medications.map((medication, index) => (
                            medication && <li key={index}>{medication}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No current medications</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Medical Conditions</h3>
                      {patient.medicalHistory.conditions.length > 0 && patient.medicalHistory.conditions[0] ? (
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          {patient.medicalHistory.conditions.map((condition, index) => (
                            condition && <li key={index}>{condition}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No known medical conditions</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Past Surgeries</h3>
                      {patient.medicalHistory.surgeries.length > 0 && patient.medicalHistory.surgeries[0] ? (
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          {patient.medicalHistory.surgeries.map((surgery, index) => (
                            surgery && <li key={index}>{surgery}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No past surgeries</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Family History</h3>
                      {patient.medicalHistory.familyHistory.length > 0 && patient.medicalHistory.familyHistory[0] ? (
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          {patient.medicalHistory.familyHistory.map((history, index) => (
                            history && <li key={index}>{history}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No family history provided</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

{/* Subjective Intake */}
<div className="bg-white shadow rounded-lg overflow-hidden md:col-span-2">
  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
    <h2 className="text-lg font-medium text-gray-900">Subjective Intake</h2>
  </div>
  <div className="px-6 py-4">
    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">

    <div className="md:col-span-2">
        <dt className="text-sm font-medium text-gray-500">Body Parts</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {patient.subjective?.bodyPart?.length
            ? patient.subjective.bodyPart.map(bp => `${bp.part} (${bp.side})`).join(', ')
            : 'N/A'}
        </dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-gray-500">Severity</dt>
        <dd className="mt-1 text-sm text-gray-900">{patient.subjective?.severity || 'N/A'}</dd>
      </div>

      <div>
        <dt className="text-sm font-medium text-gray-500">Timing</dt>
        <dd className="mt-1 text-sm text-gray-900">{patient.subjective?.timing || 'N/A'}</dd>
      </div>

      <div>
        <dt className="text-sm font-medium text-gray-500">Context</dt>
        <dd className="mt-1 text-sm text-gray-900">{patient.subjective?.context || 'N/A'}</dd>
      </div>

      <div>
        <dt className="text-sm font-medium text-gray-500">Quality</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {patient.subjective?.quality?.length
            ? patient.subjective.quality.join(', ')
            : 'N/A'}
        </dd>
      </div>

      <div>
        <dt className="text-sm font-medium text-gray-500">Exacerbated By</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {patient.subjective?.exacerbatedBy?.length
            ? patient.subjective.exacerbatedBy.join(', ')
            : 'N/A'}
        </dd>
      </div>

      <div>
        <dt className="text-sm font-medium text-gray-500">Symptoms</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {patient.subjective?.symptoms?.length
            ? patient.subjective.symptoms.join(', ')
            : 'N/A'}
        </dd>
      </div>

      <div>
        <dt className="text-sm font-medium text-gray-500">Radiating To</dt>
        <dd className="mt-1 text-sm text-gray-900">{patient.subjective?.radiatingTo || 'N/A'}</dd>
      </div>

      <div>
        <dt className="text-sm font-medium text-gray-500">Radiating Pain</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {[
            patient.subjective?.radiatingLeft && 'Left',
            patient.subjective?.radiatingRight && 'Right',
          ].filter(Boolean).join(', ') || 'None'}
        </dd>
      </div>

      <div>
        <dt className="text-sm font-medium text-gray-500">Sciatica</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {[
            patient.subjective?.sciaticaLeft && 'Left',
            patient.subjective?.sciaticaRight && 'Right',
          ].filter(Boolean).join(', ') || 'None'}
        </dd>
      </div>

      <div className="md:col-span-2">
        <dt className="text-sm font-medium text-gray-500">Notes</dt>
        <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{patient.subjective?.notes || 'N/A'}</dd>
      </div>
    </dl>
  </div>
</div>


            {/* Attorney Information */}
<div className="bg-white shadow rounded-lg overflow-hidden md:col-span-2">
  <div className="px-6 py-4 border-b border-gray-200">
    <h2 className="text-lg font-medium text-gray-900">Attorney Information</h2>
  </div>
  <div className="px-6 py-4">
    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
      <div>
        <dt className="text-sm font-medium text-gray-500">Attorney Name</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {patient.attorney?.name || 'Not provided'}
        </dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-gray-500">Firm Name</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {patient.attorney?.firm || 'Not provided'}
        </dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-gray-500">Phone</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {patient.attorney?.phone || 'Not provided'}
        </dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-gray-500">Email</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {patient.attorney?.email || 'Not provided'}
        </dd>
      </div>
      <div className="md:col-span-2">
        <dt className="text-sm font-medium text-gray-500">Address</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {patient.attorney?.address?.street ? (
            <>
              <p>{patient.attorney.address.street}</p>
              <p>{patient.attorney.address.city}, {patient.attorney.address.state} {patient.attorney.address.zipCode}</p>
              {patient.attorney.address.country && <p>{patient.attorney.address.country}</p>}
            </>
          ) : (
            'Not provided'
          )}
        </dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-gray-500">Case Number</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {patient.attorney?.caseNumber || 'Not provided'}
        </dd>
      </div>
    </dl>
  </div>
</div>

          </div>
        )}

        {activeTab === 'visits' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Visit History</h2>
              {user?.role === 'doctor' && (
                <div className="flex space-x-2">
                  {visits.length > 0 ? (
                    <>
                      <Link
                        to={`/patients/${id}/visits/followup`}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        New Follow-up
                      </Link>
                      <button
                        onClick={generateFullReport}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <FileArchive className="mr-2 h-4 w-4" />
                        Full Report
                      </button>
                      {patient.status !== 'discharged' && (
                        <Link
                          to={`/patients/${id}/visits/discharge`}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Discharge
                        </Link>
                      )}
                    </>
                  ) : (
                    <Link
                      to={`/patients/${id}/visits/initial`}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Initial Visit
                    </Link>
                  )}
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visits.length > 0 ? (
                    visits.map((visit) => (
                      <tr key={visit._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(visit.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              visit.visitType === 'initial'
                                ? 'bg-blue-100 text-blue-800'
                                : visit.visitType === 'followup'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {visit.visitType === 'initial'
                              ? 'Initial Visit'
                              : visit.visitType === 'followup'
                              ? 'Follow-up'
                              : 'Discharge'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Dr. {visit.doctor.firstName} {visit.doctor.lastName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {(visit.notes ||
                           visit.otherNotes ||
                           visit.referralsNotes ||
                           'No notes provided') as string}
                        </td>


                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link 
  to={`/visits/${visit._id}`} 
  className="text-blue-600 hover:text-blue-900 underline"
>
  View Details
</Link>

                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No visits recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {selectedVisit && (
  <div className="p-6 mt-6 bg-gray-50 border border-gray-200 rounded-lg shadow">
    <h2 className="text-lg font-semibold mb-2">Assessment and Plan</h2>
    <h3 className="text-base font-bold mb-2 underline">Treatment Plans/Rationale</h3>
    <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800">
    {selectedVisit.plan?.diagnosis && (
  <li>
    <strong>Diagnosis:</strong> {selectedVisit.plan.diagnosis.join(', ')}
  </li>
)}


{selectedVisit.plan?.medications && (
  <li>
    <strong>Medications:</strong>
    <ul className="list-disc pl-5">
      {selectedVisit.plan.medications.map((med, index) => (
        <li key={index}>
          {med.name} - {med.dosage}, {med.frequency}
        </li>
      ))}
    </ul>
  </li>
)}
<li>{selectedVisit.scheduleOfCare || 'Schedule of care not provided.'}</li>
<li>{selectedVisit.physicalModality || 'Physical modality not specified.'}</li>
<li>{selectedVisit.reevaluation || 'Re-evaluation plan not specified.'}</li>
<li>{selectedVisit.returnFrequency || 'Visit frequency not mentioned.'}</li>
<li>{selectedVisit.referral || 'Referral notes not added.'}</li>
{selectedVisit.restrictions ? (
  <li>
    <strong>Restrictions:</strong>
    <ul>
      {selectedVisit.restrictions.avoidActivityWeeks && <li>Avoid Activity: {selectedVisit.restrictions.avoidActivityWeeks} week(s)</li>}
      {selectedVisit.restrictions.liftingLimitLbs && <li>Lifting Limit: {selectedVisit.restrictions.liftingLimitLbs} lbs</li>}
      {selectedVisit.restrictions.avoidProlongedSitting && <li>Avoid prolonged sitting/standing</li>}
    </ul>
  </li>
) : (
  <li>No activity restrictions recorded.</li>
)}



{selectedVisit.plan?.medications && (
  <li>
    <strong>Medications:</strong>{' '}
    <ul className="list-disc pl-5">
      {selectedVisit.plan.medications.map((med, index) => (
        <li key={index}>
          {med.name} - {med.dosage}, {med.frequency}
        </li>
      ))}
    </ul>
  </li>
)}

      <li>{selectedVisit.scheduleOfCare || 'Schedule of care not provided.'}</li>
      <li>{selectedVisit.physicalModality || 'Physical modality not specified.'}</li>
      <li>{selectedVisit.reevaluation || 'Re-evaluation plan not specified.'}</li>
      <li>{selectedVisit.returnFrequency || 'Visit frequency not mentioned.'}</li>
      <li>{selectedVisit.referral || 'Referral notes not added.'}</li>
      {selectedVisit.restrictions ? (
        <li>
          <strong>Restrictions:</strong>
          <ul>
            {selectedVisit.restrictions.avoidActivityWeeks && <li>Avoid Activity: {selectedVisit.restrictions.avoidActivityWeeks} week(s)</li>}
            {selectedVisit.restrictions.liftingLimitLbs && <li>Lifting Limit: {selectedVisit.restrictions.liftingLimitLbs} lbs</li>}
            {selectedVisit.restrictions.avoidProlongedSitting && <li>Avoid prolonged sitting/standing</li>}
          </ul>
        </li>
      ) : (
        <li>No activity restrictions recorded.</li>
      )}
    </ul>
    <div className="mt-4">
      <button
        onClick={() => setSelectedVisit(null)}
        className="text-sm text-blue-500 underline"
      >
        Close Details
      </button>
    </div>
  </div>
)}

            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Appointments</h2>
              <Link
                to={`/appointments/new?patient=${id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Appointment
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <tr key={appointment._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{new Date(appointment.date).toLocaleDateString()}</div>
                          <div className="text-gray-500">
                            {appointment.time.start} - {appointment.time.end}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {appointment.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              appointment.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-800'
                                : appointment.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : appointment.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {appointment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {appointment.notes || 'No notes provided'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link to={`/appointments/${appointment._id}/edit`} className="text-blue-600 hover:text-blue-900">
                            View/Edit
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No appointments scheduled
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Billing & Invoices</h2>
              <Link
                to={`/billing/new?patient=${id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Create Invoice
              </Link>
            </div>
            <div className="p-4">
            <BillingList 
  patientId={id} 
  showPatientColumn={false} 
  showHeader={true} 
/>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetails;