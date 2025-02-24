import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { SPECTRAL_TYPES, RESEARCH_DIVISIONS, SECTION_REQUIREMENTS } from './constants';
import { genAI } from './google-ai';

const roleCharacteristics = {
  'Edge Theorist': /theoretical|boundaries|experimental|speculative|unknowns|new structures/i,
  'Signal Disruptor': /break|distort|reassemble|hidden frequencies|expose/i,
  'Lab Orchestrator': /foundational structures|protocols|systematic|stable|replicable/i,
  'Field Extractor': /retrieve|pattern recognition|data synthesis|unstable zones|volatile/i,
  'Frequencies Engineer': /design|emergent structures|distill|clarity/i,
  'Signal Tracker': /document|fluctuations|trace|forensic precision/i,
  'Threshold Operator': /push limits|testing|tolerance|instability/i,
  'Echo Compiler': /integrate|fragments|evolving|systems/i,
  'Transmission Mediator': /bridge|translate|communication|abstract|tangible/i
};

const personalitySchema = {
  type: SchemaType.OBJECT,
  properties: {
    spectralType: {
      type: SchemaType.NUMBER,
      description: "Candidate's potential role classification (1-9)",
    },
    researchProfile: {
      type: SchemaType.OBJECT,
      properties: {
        coreIdentity: {
          type: SchemaType.STRING,
          description: `Focus on candidate's unique strengths and research style:
1. Core capabilities (technical skills, creative vision)
2. Notable achievements with specific examples
3. How these traits would enhance Lab dynamics
Example: "Candidate demonstrates exceptional ability to [specific skill] through [concrete example], while their work on [project] shows [valuable trait]. Their approach to [area] reveals [unique strength]."`,
          maxLength: 800,
        },
        functionalImpact: {
          type: SchemaType.STRING,
          description: `Focus on different aspects than core identity. Analyze:
1. Technical contributions potential (different from traits mentioned above)
2. Community/collaboration impact
3. Research acceleration possibilities
Example: "Beyond their core strengths, candidate's expertise in [specific area] could accelerate [Lab objective]. Their demonstrated ability to [unique skill] would enhance [specific Lab function]."`,
          maxLength: 600,
        },
        stabilityWarning: {
          type: SchemaType.STRING,
          description: `Frame as growth opportunities and development path:
1. Leadership/growth potential
2. Areas for skill amplification
3. Specific ways to channel their strengths
Example: "GROWTH FOCUS: [Specific potential]
STRENGTHS TO AMPLIFY: [Current capabilities]
DEVELOPMENT PATH: [How to maximize impact]"`,
          maxLength: 500,
        },
        researchDeployment: {
          type: SchemaType.OBJECT,
          properties: {
            verdict: {
              type: SchemaType.STRING,
              description: `High-stakes deployment verdict that must align with the assigned spectral type. Structure:

1. Role Confirmation (must match assigned type):
"As a [EXACT_ROLE_NAME from spectralType], your approach to [role-specific strength] positions you..."

ROLE ALIGNMENT EXAMPLES:
• Transmission Mediator: Focus on communication, visualization, interpretation
• Edge Theorist: Focus on experimental research, boundary exploration
• Field Extractor: Focus on pattern recognition, data synthesis
• Lab Orchestrator: Focus on systems, protocols, research infrastructure
• Signal Interpreter: Focus on meaning extraction, insight development

2. Natural Metric Integration:
✅ DO: Describe abilities that match their role
"Your intuitive grasp of complex patterns [for Field Extractor] makes you valuable for..."
"Your ability to bridge technical gaps [for Transmission Mediator] enables..."

3. Deployment Focus (must align with role):
• Transmission Mediator → Communication/visualization labs
• Edge Theorist → Experimental/theoretical divisions
• Field Extractor → Pattern analysis/data processing
• Lab Orchestrator → Systems/protocol development
• Signal Interpreter → Insight extraction/synthesis

4. Growth-Oriented Boundaries:
Frame development areas that align with their core role
✅ Example for Transmission Mediator:
"While your strength in translating complex concepts drives impact, developing deeper technical foundations will enhance your interpretative capabilities."

EXAMPLE (Transmission Mediator):
"As a Transmission Mediator, your ability to translate complex spectral phenomena into accessible insights positions you at the crucial interface between research and understanding. Your natural talent for visualization and communication makes you invaluable for enhancing research impact, while your creative approach ensures findings resonate beyond technical boundaries. Your primary deployment will be in research communication, where your interpretative skills will amplify the Lab's discoveries. While your strengths in translation and outreach drive immediate impact, developing deeper technical foundations will further enhance your ability to bridge complex research domains."`,
              maxLength: 600,
            },
            metrics: {
              type: SchemaType.OBJECT,
              properties: {
                exploratoryDepth: {
                  score: { type: SchemaType.NUMBER, minimum: 1, maximum: 5 },
                  context: { type: SchemaType.STRING, minLength: 20, maxLength: 100 }
                },
                dataRetention: {
                  score: { type: SchemaType.NUMBER, minimum: 1, maximum: 5 },
                  context: { type: SchemaType.STRING, minLength: 20, maxLength: 100 }
                },
                systematicThinking: {
                  score: { type: SchemaType.NUMBER, minimum: 1, maximum: 5 },
                  context: { type: SchemaType.STRING, minLength: 20, maxLength: 100 }
                },
                riskTolerance: {
                  score: { type: SchemaType.NUMBER, minimum: 1, maximum: 5 },
                  context: { type: SchemaType.STRING, minLength: 20, maxLength: 100 }
                }
              }
            }
          }
        },
        fieldEvidence: {
          type: SchemaType.ARRAY,
          description: "Critical examples from candidate's history that inform their evaluation",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              observation: {
                type: SchemaType.STRING,
                description: "Direct quote demonstrating concerning or promising behavior"
              },
              analysis: {
                type: SchemaType.STRING,
                description: "Clinical interpretation of how this behavior predicts Lab performance",
                maxLength: 150,
              }
            }
          },
          minItems: 2,
          maxItems: 3
        }
      },
      required: ["coreIdentity", "functionalImpact", "stabilityWarning", "researchDeployment", "fieldEvidence"]
    },
  },
  required: ["spectralType", "researchProfile"]
};

function analyzeContent(casts) {
  const analysis = {
    // Research patterns
    research: {
      discussions: [], // Detailed technical discussions
      methodologies: [], // How they approach problems
      insights: [], // Original insights/discoveries
      themes: new Map() // Recurring research interests
    },
    // Technical evidence
    technical: {
      implementations: [], // Actual work/projects
      problemSolving: [], // Problem-solving approaches
      tools: new Set(), // Technologies used
      documentation: [] // Code/documentation shared
    },
    // Impact indicators
    impact: {
      contributions: [], // Specific contributions
      collaborations: [], // Team interactions
      improvements: [], // System/process improvements
      influence: [] // Impact on others' work
    },
    // Stability factors
    stability: {
      approaches: [], // Work/research approaches
      iterations: [], // How they handle changes
      responses: [], // Responses to challenges
      patterns: [] // Behavioral patterns
    }
  };

  casts.forEach(cast => {
    // Analyze research patterns
    if (cast.length > 100 && cast.match(/(?:research|analysis|study|investigation|theory|hypothesis|discovered|realized|learned)/i)) {
      analysis.research.discussions.push({
        text: cast,
        type: 'research_discussion',
        context: cast
      });
    }

    // Track methodologies
    if (cast.match(/(?:approach|method|process|framework|system|structure)/i)) {
      analysis.research.methodologies.push({
        text: cast,
        context: cast
      });
    }

    // Capture technical implementations
    const implementationMatch = cast.match(/(?:built|created|developed|implemented|launched|deployed) (?:a |an |the )?([^.!?\n]+)/i);
    if (implementationMatch) {
      analysis.technical.implementations.push({
        text: cast,
        context: cast
      });
    }

    // Track problem-solving
    if (cast.match(/(?:debug|solve|fix|improve|optimize|refactor)/i)) {
      analysis.technical.problemSolving.push({
        approach: cast,
        context: cast
      });
    }

    // Identify impact
    if (cast.match(/(?:helped|improved|enabled|supported|contributed|changed)/i)) {
      analysis.impact.contributions.push({
        text: cast,
        context: cast
      });
    }

    // Track stability indicators
    if (cast.match(/(?:iterate|refine|adjust|adapt|respond|change)/i)) {
      analysis.stability.iterations.push({
        text: cast,
        context: cast
      });
    }

    // Analyze research themes
    const themes = cast.match(/\b\w+(?:\s+\w+){0,2}\b/g) || [];
    themes.forEach(theme => {
      if (theme.length > 4) {
        analysis.research.themes.set(
          theme,
          (analysis.research.themes.get(theme) || 0) + 1
        );
      }
    });
  });

  // Sort themes by frequency
  const sortedThemes = [...analysis.research.themes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return {
    ...analysis,
    summary: {
      researchFocus: sortedThemes,
      technicalDepth: analysis.technical.implementations.length + analysis.technical.problemSolving.length,
      impactScope: analysis.impact.contributions.length,
      stabilityIndicators: analysis.stability.iterations.length,
      methodologyStrength: analysis.research.methodologies.length
    }
  };
}

// First, update the metrics validation
function validateMetrics(metrics) {
  const requiredMetrics = ['exploratoryDepth', 'dataRetention', 'systematicThinking', 'riskTolerance'];
  
  for (const key of requiredMetrics) {
    if (!metrics[key] || 
        typeof metrics[key].score !== 'number' || 
        typeof metrics[key].context !== 'string' ||
        metrics[key].score < 1 || 
        metrics[key].score > 5) {
      throw new Error(`Invalid metrics structure for ${key}`);
    }
  }
  return true;
}

// Update the prompt to be more explicit about the format
const generatePrompt = (bio, casts) => {
  const analysis = analyzeContent(casts);
  
  return `SPECTRAL LAB RECRUITMENT EVALUATION
CONFIDENTIAL CANDIDATE ASSESSMENT

[CRITICAL REQUIREMENTS]
- Research Deployment verdict must be exactly in this format:
  "Assigned to [Division Name]: [detailed analysis]"
- Total length must be between ${SECTION_REQUIREMENTS.researchDeployment.minLength}-${SECTION_REQUIREMENTS.researchDeployment.maxLength} characters
- Division name must be exact match from list below
- Role must match division's allowed roles

[AVAILABLE DIVISIONS]
${Object.entries(RESEARCH_DIVISIONS).map(([name, info]) => 
  `${name}:\n  Roles: ${info.roles.join(', ')}\n  Focus: ${info.focus}`
).join('\n\n')}

[EVALUATION FRAMEWORK]
${analysis.research.discussions.map(d => `• ${d.text}`).join('\n')}
${analysis.technical.implementations.map(i => `• ${i.text}`).join('\n')}
${analysis.impact.contributions.map(c => `• ${c.text}`).join('\n')}

[RESPONSE FORMAT]
{
  "spectralType": (number 1-9),
  "researchProfile": {
    "coreIdentity": "...",
    "functionalImpact": "...",
    "stabilityWarning": "...",
    "researchDeployment": {
      "verdict": "Assigned to [Exact Division Name]: [detailed analysis between ${SECTION_REQUIREMENTS.researchDeployment.minLength}-${SECTION_REQUIREMENTS.researchDeployment.maxLength} chars]",
      "metrics": {
        "exploratoryDepth": {"score": 1-5, "context": "..."},
        "dataRetention": {"score": 1-5, "context": "..."},
        "systematicThinking": {"score": 1-5, "context": "..."},
        "riskTolerance": {"score": 1-5, "context": "..."}
      }
    },
    "fieldEvidence": [
      {"observation": "...", "analysis": "..."},
      {"observation": "...", "analysis": "..."}
    ]
  }
}`;
};

// Update validateDeployment function to use SECTION_REQUIREMENTS correctly
function validateDeployment(deployment, spectralType) {
  const verdict = deployment.verdict;
  
  if (!verdict || typeof verdict !== 'string') {
    throw new Error('Research deployment verdict must be a string');
  }

  const minLength = SECTION_REQUIREMENTS.researchDeployment.minLength;
  const maxLength = SECTION_REQUIREMENTS.researchDeployment.maxLength;

  if (verdict.length < minLength || verdict.length > maxLength) {
    throw new Error(`Research deployment verdict length (${verdict.length}) must be between ${minLength}-${maxLength} characters`);
  }
  
  // Check if verdict starts with a valid division assignment
  const hasValidDivision = Object.keys(RESEARCH_DIVISIONS).some(division => 
    verdict.startsWith(`Assigned to ${division}:`)  // Note the added colon
  );
  
  if (!hasValidDivision) {
    throw new Error('Research deployment must start with "Assigned to [Division Name]:"');
  }

  // Check if role matches division
  const roleName = SPECTRAL_TYPES[spectralType].name;
  const assignedDivision = Object.entries(RESEARCH_DIVISIONS).find(([division]) => 
    verdict.startsWith(`Assigned to ${division}:`)
  );

  if (!assignedDivision) {
    throw new Error('Invalid division assignment');
  }

  if (!assignedDivision[1].roles.includes(roleName)) {
    throw new Error(`${roleName} cannot be assigned to ${assignedDivision[0]}`);
  }

  return true;
}

// Update the main validation function
function validateResponse(analysis) {
  if (!analysis || typeof analysis !== 'object') {
    throw new Error('Invalid response structure');
  }

  const profile = analysis.researchProfile;
  if (!profile) {
    throw new Error('Missing researchProfile');
  }

  // Basic validation of required fields
  if (!profile.coreIdentity || !profile.functionalImpact || !profile.stabilityWarning) {
    throw new Error('Missing required profile sections');
  }

  // Validate research deployment
  const deployment = profile.researchDeployment;
  if (!deployment?.verdict) {
    throw new Error('Missing research deployment verdict');
  }

  // Validate metrics
  const metrics = deployment.metrics;
  if (!metrics) {
    throw new Error('Missing metrics');
  }

  validateMetrics(metrics);
  validateDeployment(deployment, analysis.spectralType);

  return true;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function testGeminiAPI() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Say "hello"' }] }],
    });
    console.log('Gemini API Test Response:', result.response.text());
    return true;
  } catch (error) {
    console.error('Gemini API Test Error:', error);
    return false;
  }
}

// Update the main analysis function
export async function analyzePersonality(bio, casts) {
  const maxRetries = 3;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = generatePrompt(bio, casts);

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 2048,
        },
      });

      const responseText = result.response.text().trim();
      
      try {
        const analysis = JSON.parse(responseText);
        validateResponse(analysis);
        validateRoleConsistency(analysis);
        return analysis;
      } catch (error) {
        console.error('Validation Error:', error);
        console.error('Response:', responseText);
        if (attempt === maxRetries - 1) throw error;
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      if (attempt === maxRetries - 1) throw error;
      await sleep(1000);
    }
  }
}

function validateRoleConsistency(analysis) {
  const mainRole = SPECTRAL_TYPES[analysis.spectralType].name;
  const deploymentText = analysis.researchProfile.researchDeployment.verdict;
  const coreIdentityText = analysis.researchProfile.coreIdentity;
  
  // Check deployment verdict
  for (const typeNum in SPECTRAL_TYPES) {
    const role = SPECTRAL_TYPES[typeNum].name;
    const rolePhrase = `As a ${role}`;
    if (role !== mainRole && deploymentText.startsWith(rolePhrase)) {
      console.error('Role mismatch in Research Deployment:', {
        expectedRole: mainRole,
        foundRole: role,
        text: deploymentText
      });
      throw new Error(`Role mismatch in Research Deployment: Expected "${mainRole}" but found "${role}"`);
    }
  }

  // Check if core identity aligns with the role's characteristics
  const expectedPattern = roleCharacteristics[mainRole];
  const otherRoleMatches = Object.entries(roleCharacteristics)
    .filter(([role, pattern]) => 
      role !== mainRole && 
      pattern.test(coreIdentityText)
    )
    .map(([role]) => role);

  if (otherRoleMatches.length > 0) {
    console.error('Core Identity suggests different role:', {
      expectedRole: mainRole,
      suggestedRoles: otherRoleMatches,
      text: coreIdentityText
    });
    throw new Error(`Core Identity suggests role "${otherRoleMatches[0]}" but assigned "${mainRole}"`);
  }

  return true;
}

export async function fetchUserInfo(fid) {
  if (!process.env.NEYNAR_API_KEY) {
    throw new Error('NEYNAR_API_KEY not configured');
  }

  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': process.env.NEYNAR_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data?.users?.[0]) {
      throw new Error('User not found');
    }

    return data.users[0];
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
}

export async function fetchUserCasts(fid) {
  if (!process.env.NEYNAR_API_KEY) {
    throw new Error('NEYNAR_API_KEY not configured');
  }

  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/feed/user/casts?fid=${fid}&limit=50`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': process.env.NEYNAR_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data?.casts || !Array.isArray(data.casts)) {
      throw new Error('Invalid response structure');
    }

    return data.casts
      .filter(cast => cast?.text)
      .map(cast => cast.text)
      .slice(0, 50);

  } catch (error) {
    console.error('Error fetching user casts:', error);
    throw error;
  }
}

export async function testNeynarAPI() {
  if (!process.env.NEYNAR_API_KEY) {
    console.error('NEYNAR_API_KEY not configured');
    return { success: false, error: 'API key not configured' };
  }

  try {
    const response = await fetch(
      'https://api.neynar.com/v2/farcaster/user/bulk?fids=1', // Test with fid 1
      {
        headers: {
          'accept': 'application/json',
          'api_key': process.env.NEYNAR_API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error('Neynar API Test Failed:', response.status);
      return { 
        success: false, 
        error: `API returned ${response.status}`,
        key: process.env.NEYNAR_API_KEY?.slice(0, 5) + '...' // Show first 5 chars for debugging
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      data: data?.users?.[0]?.username || 'No username found',
      key: process.env.NEYNAR_API_KEY?.slice(0, 5) + '...'
    };
  } catch (error) {
    console.error('Neynar API Test Error:', error);
    return { success: false, error: error.message };
  }
}