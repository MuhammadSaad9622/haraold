import express from 'express';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// POST endpoint to generate narrative text from form data using OpenAI
router.post('/generate-narrative', async (req, res) => {
  const { patient, visits } = req.body;
  if (!patient) {
    return res.status(400).json({ success: false, error: "Missing patient data" });
  }
  const apiKey = process.env.OPENAI_API_KEY;

  // Build a detailed prompt
  let prompt = `Generate a comprehensive, professional medical narrative report for the following patient. Use clear headings ( Chief Complaint , Physical Examination Findings , Assessment and plan ,  Medical History, Subjective Intake, Attorney Information, Initial Visit, Follow-up Visit, Discharge Visit, ) and write in a formal, clinical style. Do not include raw field names, but write as a narrative. Summarize all relevant information.\n\n`;

  // Patient Info
 
  // Medical History
  prompt += `Medical History:\n`;
  prompt += `- Allergies: ${patient.medicalHistory?.allergies?.join(', ') || 'None'}\n`;
  prompt += `- Medications: ${patient.medicalHistory?.medications?.join(', ') || 'None'}\n`;
  prompt += `- Conditions: ${patient.medicalHistory?.conditions?.join(', ') || 'None'}\n`;
  prompt += `- Surgeries: ${patient.medicalHistory?.surgeries?.join(', ') || 'None'}\n`;
  prompt += `- Family History: ${patient.medicalHistory?.familyHistory?.join(', ') || 'None'}\n\n`;

  // Subjective Intake
  if (patient.subjective) {
    prompt += `Subjective Intake:\n`;
    prompt += `- Severity: ${patient.subjective.severity}\n`;
    prompt += `- Timing: ${patient.subjective.timing}\n`;
    prompt += `- Context: ${patient.subjective.context}\n`;
    prompt += `- Notes: ${patient.subjective.notes}\n`;
    prompt += `- Quality: ${patient.subjective.quality?.join(', ') || 'N/A'}\n`;
    prompt += `- Exacerbated By: ${patient.subjective.exacerbatedBy?.join(', ') || 'N/A'}\n`;
    prompt += `- Symptoms: ${patient.subjective.symptoms?.join(', ') || 'N/A'}\n`;
    prompt += `- Radiating To: ${patient.subjective.radiatingTo || 'N/A'}\n`;
    prompt += `- Radiating Pain: ${[
      patient.subjective.radiatingLeft && 'Left',
      patient.subjective.radiatingRight && 'Right',
    ].filter(Boolean).join(', ') || 'None'}\n`;
    prompt += `- Sciatica: ${[
      patient.subjective.sciaticaLeft && 'Left',
      patient.subjective.sciaticaRight && 'Right',
    ].filter(Boolean).join(', ') || 'None'}\n`;
    prompt += `- Body Parts: ${patient.subjective.bodyPart?.map(bp => `${bp.part} (${bp.side})`).join(', ') || 'N/A'}\n\n`;
  }

  // Attorney Info
  // if (patient.attorney) {
  //   prompt += `Attorney Information:\n`;
  //   prompt += `- Name: ${patient.attorney.name}\n`;
  //   prompt += `- Firm: ${patient.attorney.firm}\n`;
  //   prompt += `- Phone: ${patient.attorney.phone}\n`;
  //   prompt += `- Email: ${patient.attorney.email}\n`;
  //   prompt += `- Case Number: ${patient.attorney.caseNumber}\n`;
  //   prompt += `- Address: ${patient.attorney.address?.street}, ${patient.attorney.address?.city}, ${patient.attorney.address?.state} ${patient.attorney.address?.zipCode}, ${patient.attorney.address?.country || ''}\n\n`;
  // }

  // Visits
  // if (visits && visits.length > 0) {
  //   prompt += `Visits:\n`;
  //   visits.forEach((visit, idx) => {
  //     prompt += `\n${visit.visitType?.toUpperCase() || 'VISIT'} #${idx + 1}:\n`;
  //     prompt += `- Date: ${visit.date}\n`;
  //     prompt += `- Provider: Dr. ${visit.doctor?.firstName || ''} ${visit.doctor?.lastName || ''}\n`;
  //     prompt += `- Notes: ${visit.notes || 'N/A'}\n`;
  //     prompt += `- Assessment: ${visit.assessment || 'N/A'}\n`;
  //     prompt += `- Plan: ${visit.plan ? JSON.stringify(visit.plan) : 'N/A'}\n`;
  //     // Add more fields as needed
  //   });
  //   prompt += `\n`;
  // }

  prompt += `\nWrite the report in a narrative, professional style, using the above information.`;

  try {
    const openai = new OpenAI({ apiKey });

    console.log('Attempting to generate narrative with OpenAI...');
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // or 'gpt-4'
      messages: [
        {
          role: 'system',
          content: 'You are a medical documentation assistant that helps create professional, accurate medical narratives based on provided clinical data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const generatedText = response.choices[0]?.message?.content || "Unable to generate narrative at this time.";
    console.log(generatedText);

    console.log('Successfully generated narrative');
    res.json({ 
      success: true,
      narrative: generatedText 
    });

  } catch (error) {
    console.error('Error generating narrative:', error);
    
    let errorMessage = 'Failed to generate narrative text';
    if (error.status === 401) {
          errorMessage = 'Invalid API key';
    } else if (error.status === 429) {
          errorMessage = 'Too many requests - please try again later';
    } else if (error.status === 500) {
          errorMessage = 'AI service unavailable';
    }
    
    res.status(500).json({ 
      success: false,
      error: errorMessage,
      details: error.message 
    });
  }
});

export default router;
