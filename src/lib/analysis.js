import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { SPECTRAL_TYPES, RESEARCH_DIVISIONS, SECTION_REQUIREMENTS } from './constants';
import { genAI } from './google-ai';

// Initialize role distribution counter
let roleDistribution = {
  '$AXIS Framer': 0,
  '$FLUX Drifter': 0,
  '$EDGE Disruptor': 0
};

// Reset distribution periodically to avoid long-term bias
const DISTRIBUTION_RESET_THRESHOLD = 20;
let totalAssignments = 0;

// Function to provide insights about the current role distribution
function getDistributionInsight(distribution) {
  const totalRoles = Object.values(distribution).reduce((sum, count) => sum + count, 0) || 1;
  const idealPercentage = 100 / 3; // 33.33% for each of the 3 roles
  
  // Find overrepresented and underrepresented roles
  const overrepresentedRoles = Object.entries(distribution)
    .filter(([_, count]) => (count / totalRoles * 100) > idealPercentage + 5)
    .map(([role]) => role);
    
  const underrepresentedRoles = Object.entries(distribution)
    .filter(([_, count]) => (count / totalRoles * 100) < idealPercentage - 5)
    .map(([role]) => role);
  
  if (overrepresentedRoles.length === 0 && underrepresentedRoles.length === 0) {
    return "Current role distribution is balanced. Continue to consider all spectral types equally.";
  }
  
  let insight = "";
  
  if (overrepresentedRoles.length > 0) {
    insight += `Overrepresented roles: ${overrepresentedRoles.join(', ')}. Consider these roles only with strong evidence. `;
  }
  
  if (underrepresentedRoles.length > 0) {
    insight += `Underrepresented roles: ${underrepresentedRoles.join(', ')}. Give extra consideration to these roles if the user shows any matching traits.`;
  }
  
  return insight;
}

const roleCharacteristics = {
  'Edge Theorist': /theoretical|boundaries|experimental|speculative|unknowns|new structures|mapping territories/i,
  'Entropy Decoder': /break|distort|extract|transform|volatile|unstable zones|hidden frequencies|data synthesis|chaotic sources/i,
  'Systems Orchestrator': /structured|integrate|frameworks|platforms|infrastructure|architecture|optimization|scaling|documentation systems/i,
  'Frequency Tracker': /emergent signals|weak signals|early patterns|trend foresight|pre-stabilization|chaos navigation|pattern detection/i,
  'Threshold Operator': /push limits|testing|tolerance|instability|boundary definition|research methodologies/i,
  'Concept Translator': /creative interpretation|bridge|interdisciplinary|abstract|accessible|innovative perspectives|visualization|documentation/i
};

const personalitySchema = {
  type: SchemaType.OBJECT,
  properties: {
    spectralType: {
      type: SchemaType.NUMBER,
      description: "Candidate's potential role classification (1-3)",
    },
    researchProfile: {
      type: SchemaType.OBJECT,
      properties: {
        coreIdentity: {
          type: SchemaType.STRING,
          description: `Focus on the user's unique strengths and research style:
1. Your core capabilities (technical skills, creative vision)
2. Your notable achievements with specific examples
3. How your traits would enhance Lab dynamics
Example: "You demonstrate exceptional ability to [specific skill] through [concrete example], while your work on [project] shows [valuable trait]. Your approach to [area] reveals [unique strength]."`,
          maxLength: 800,
        },
        functionalImpact: {
          type: SchemaType.STRING,
          description: `Focus on different aspects than core identity. Analyze:
1. Your technical contributions potential (different from traits mentioned above)
2. Your community/collaboration impact
3. Your research acceleration possibilities
Example: "Beyond your core strengths, your expertise in [specific area] could accelerate [Lab objective]. Your demonstrated ability to [unique skill] would enhance [specific Lab function]."`,
          maxLength: 600,
        },
        alignmentConsiderations: {
          type: SchemaType.STRING,
          description: `Focus on positioning the researcher's traits as strengths in the right context:
1. Frame traits as advantages in specific research environments
2. Suggest optimal placements where their tendencies thrive
3. Highlight how their characteristics shape their best work environment
Example: "Your ability to [specific trait] makes you especially effective in [specific context], while your tendency to [approach/style] positions you well for projects requiring [specific quality]. You'll thrive in environments that [specific condition], where your natural inclination to [characteristic] becomes a distinct advantage."`,
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
• Concept Translator: Focus on communication, visualization, interpretation of spectral phenomena
• Edge Theorist: Focus on theoretical exploration, boundary mapping, experimental observation
• Entropy Decoder: Focus on extracting and transforming volatile spectral data
• Systems Orchestrator: Focus on frameworks, integration, and research infrastructure for spectral analysis
• Frequency Tracker: Focus on pattern analysis, signal tracking, and documentation of emergent frequencies

2. Natural Metric Integration:
✅ DO: Describe abilities that match their role within the lab's observational framework
"Your intuitive grasp of complex patterns [for Frequency Tracker] makes you valuable for documenting..."
"Your ability to bridge technical gaps [for Concept Translator] enables clearer visualization of..."

3. Deployment Focus (must align with role and lab's observational mission):
• Concept Translator → Visualization/interpretation of spectral phenomena
• Edge Theorist → Theoretical mapping of unseen structures
• Entropy Decoder → Analysis of volatile spectral data
• Systems Orchestrator → Development of frameworks for spectral documentation
• Frequency Tracker → Monitoring and tracking of emergent frequencies

4. Growth-Oriented Boundaries:
Frame development areas that align with your core role in the lab's observational work
✅ Example for Concept Translator:
"While your strength in translating complex spectral phenomena drives research clarity, developing deeper technical foundations will enhance your interpretative capabilities within the lab."

EXAMPLE (Concept Translator):
"As a Concept Translator, your ability to transform abstract spectral phenomena into accessible formats positions you at the crucial interface between observation and documentation. Your natural talent for visualization makes you invaluable for enhancing research clarity, while your creative approach ensures findings are properly documented. Your primary deployment will be in research communication, where your interpretative skills will amplify the Lab's spectral observations. While your strengths in translation drive immediate impact, developing deeper technical foundations will further enhance your ability to bridge complex research domains within our observational framework."

CRITICAL: The verdict MUST begin with "As a [EXACT_ROLE_NAME]" where [EXACT_ROLE_NAME] EXACTLY matches the spectral type assigned in the spectralType field. This consistency is absolutely required and will be strictly validated.`,
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
      required: ["coreIdentity", "functionalImpact", "alignmentConsiderations", "researchDeployment", "fieldEvidence"]
    },
  },
  required: ["spectralType", "researchProfile"]
};

function analyzeContent(casts) {
  // Filter out or clean mentions of "degen" from casts
  const filteredCasts = casts.map(cast => {
    // Replace "degen" with a neutral term or remove it entirely
    return cast.replace(/\bdegen\b/gi, "");
  });
  
  const analysis = {
    // Research patterns
    research: {
      discussions: [], // Detailed technical discussions
      methodologies: [], // How they approach problems
      insights: [], // Original insights/discoveries
      themes: new Map(), // Recurring research interests
      projects: new Set() // Specific research projects mentioned
    },
    // Technical evidence
    technical: {
      implementations: [], // Actual work/projects
      problemSolving: [], // Problem-solving approaches
      tools: new Set(), // Technologies used
      documentation: [], // Code/documentation shared
      technologies: new Set() // Specific technologies mentioned
    },
    // Impact indicators
    impact: {
      contributions: [], // Specific contributions
      collaborations: [], // Team interactions
      improvements: [], // System/process improvements
      influence: [], // Impact on others' work
      achievements: [] // Specific achievements mentioned
    },
    // Stability factors
    stability: {
      approaches: [], // Work/research approaches
      iterations: [], // How they handle changes
      responses: [], // Responses to challenges
      patterns: [] // Behavioral patterns
    },
    // Direct quotes for evidence
    quotes: []
  };

  filteredCasts.forEach(cast => {
    // Store notable quotes (longer than 20 chars, shorter than 100)
    if (cast.length > 20 && cast.length < 100) {
      analysis.quotes.push(cast);
    }

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
        context: cast,
        project: implementationMatch[1].trim()
      });
      
      // Extract project name
      if (implementationMatch[1]) {
        analysis.research.projects.add(implementationMatch[1].trim());
      }
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

    // Extract specific technologies mentioned
    const techMatches = cast.match(/\b(?:javascript|python|react|node\.js|typescript|html|css|api|blockchain|ai|ml|database|sql|nosql|aws|cloud|docker|kubernetes|git|github|web3|solidity|rust|go|java|c\+\+|swift|flutter|mobile|ios|android)\b/gi);
    if (techMatches) {
      techMatches.forEach(tech => analysis.technical.technologies.add(tech.toLowerCase()));
    }

    // Extract specific achievements
    const achievementMatch = cast.match(/(?:achieved|completed|won|awarded|recognized for|succeeded in|finished|accomplished|delivered) ([^.!?\n]+)/i);
    if (achievementMatch && achievementMatch[1]) {
      analysis.impact.achievements.push({
        text: achievementMatch[1].trim(),
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

  // Select top quotes for evidence (up to 5)
  const selectedQuotes = analysis.quotes
    .sort(() => 0.5 - Math.random()) // Shuffle
    .slice(0, 5)
    // Filter out quotes containing "degen"
    .filter(quote => !quote.toLowerCase().includes("degen"));

  return {
    ...analysis,
    summary: {
      researchFocus: sortedThemes,
      technicalDepth: analysis.technical.implementations.length + analysis.technical.problemSolving.length,
      impactScope: analysis.impact.contributions.length,
      stabilityIndicators: analysis.stability.iterations.length,
      methodologyStrength: analysis.research.methodologies.length,
      technologies: [...analysis.technical.technologies],
      projects: [...analysis.research.projects],
      achievements: analysis.impact.achievements.map(a => a.text),
      selectedQuotes
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
      console.error(`Metrics validation failed for ${key}:`, JSON.stringify(metrics[key]));
      throw new Error(`Invalid metrics structure for ${key}`);
    }
  }
  return true;
}

// Update the prompt to be more explicit about the format
const generatePrompt = (bio, casts, currentDistribution) => {
  const analysis = analyzeContent(casts);
  
  // Calculate role affinity scores based on content analysis
  const roleAffinityScores = calculateRoleAffinityScores(analysis);
  
  // Calculate role distribution percentages
  const totalAssignments = Object.values(currentDistribution).reduce((sum, count) => sum + count, 0) || 1;
  const distributionPercentages = {};
  for (const role in currentDistribution) {
    distributionPercentages[role] = ((currentDistribution[role] / totalAssignments) * 100).toFixed(1) + '%';
  }
  
  // Find overrepresented and underrepresented roles
  const overrepresentedRoles = Object.entries(currentDistribution)
    .filter(([_, count]) => count > totalAssignments / 3)
    .map(([role]) => role);
    
  const underrepresentedRoles = Object.entries(currentDistribution)
    .filter(([_, count]) => count < totalAssignments / 3)
    .map(([role]) => role);
  
  return `SPECTRAL LAB RECRUITMENT EVALUATION
CONFIDENTIAL CANDIDATE ASSESSMENT

[CRITICAL REQUIREMENTS]
- You MUST return a valid JSON object without any markdown formatting or code blocks
- You MUST address the candidate directly using "you" and "your" throughout all sections
- Include only 1-2 specific references to the user's content per paragraph to maintain natural flow
- Each section MUST have detailed, substantial content with rich descriptions and specific insights:
  * coreIdentity: BETWEEN ${SECTION_REQUIREMENTS.coreIdentity.minLength}-${SECTION_REQUIREMENTS.coreIdentity.maxLength} characters, comprehensive paragraph with detailed analysis
  * functionalImpact: BETWEEN ${Math.floor(SECTION_REQUIREMENTS.functionalImpact.minLength * 1.1)}-${SECTION_REQUIREMENTS.functionalImpact.maxLength} characters, thorough paragraph with specific examples
  * alignmentConsiderations: BETWEEN ${Math.floor(SECTION_REQUIREMENTS.alignmentConsiderations.minLength * 1.1)}-${SECTION_REQUIREMENTS.alignmentConsiderations.maxLength} characters, detailed paragraph with concrete suggestions
- Research Deployment verdict must be exactly in this format:
  "assigned to [Division Name]: [detailed analysis]"
- Total length must be between ${SECTION_REQUIREMENTS.researchDeployment.minLength}-${SECTION_REQUIREMENTS.researchDeployment.maxLength} characters
- Division name must be exact match from list below
- Role must match division's allowed roles
- NEVER directly mention or reference the bio in your analysis
- NEVER mention or reference the term 'degen' or related cryptocurrency slang
- ENSURE the Research Deployment section clearly reinforces the assigned spectral type and explains how the researcher would contribute to the lab's observational and analytical work
- IMPORTANT: Avoid defaulting to Concept Translator unless there is strong evidence. Consider all roles equally.
- CRITICAL: The Research Deployment section MUST begin with 'As a [EXACT_ROLE_NAME]' where [EXACT_ROLE_NAME] EXACTLY matches the spectral type you assign in the spectralType field. For example, if you assign spectralType = 3 ($EDGE Disruptor), then the Research Deployment verdict MUST begin with 'As a $EDGE Disruptor'. This consistency is absolutely required.
- ⚠️ WARNING: FAILURE TO START THE RESEARCH DEPLOYMENT WITH "As a [EXACT_ROLE_NAME]" WILL CAUSE A VALIDATION ERROR AND REJECTION OF THE ENTIRE ANALYSIS.

[SPECTRAL VISUAL RESEARCH LAB MISSION]
The Spectral Visual Research Lab is an observational research entity focused on mapping unseen structures, studying emergent frequencies, and analyzing hidden forces. The lab OBSERVES and DOCUMENTS spectral anomalies rather than PRODUCING artifacts. Research Deployment sections must reflect this focus on ongoing internal research rather than external initiatives or product development.

[CURRENT ROLE DISTRIBUTION]
${Object.entries(distributionPercentages).map(([role, percentage]) => `${role}: ${percentage}`).join('\n')}

Overrepresented roles: ${overrepresentedRoles.length > 0 ? overrepresentedRoles.join(', ') : 'None'}
Underrepresented roles: ${underrepresentedRoles.length > 0 ? underrepresentedRoles.join(', ') : 'None'}

For balanced classification, give extra consideration to underrepresented roles if the user shows ANY traits matching those types.

[SPECTRAL TYPE DISTINCTIONS]
When determining the most appropriate spectral type, carefully distinguish between:

1. Edge Theorist: Focus on theoretical exploration, boundary testing, and experimental design. They excel at mapping unknown territories and creating speculative frameworks for observing spectral phenomena.

2. Entropy Decoder: Focus on extracting meaning from volatile or unstable spectral data. They excel at pattern disruption, signal manipulation, and preserving insights from chaotic sources.

3. Systems Orchestrator: Focus on designing and optimizing ESTABLISHED frameworks and structured platforms for spectral analysis. They excel at integration and system architecture for EXISTING patterns.

4. Frequency Tracker: Focus ONLY on identifying emergent signals and weak patterns BEFORE they stabilize. They excel at early detection of trends in chaotic or noisy spectral data.

5. Threshold Operator: Focus on pushing boundaries and testing limits of spectral observation. They excel at defining capability boundaries for research methodologies.

6. Concept Translator: Focus on creative interpretation and making abstract spectral phenomena accessible. They excel at visualizing and documenting complex spectral observations.

[ROLE AFFINITY ANALYSIS]
Based on content analysis, consider these role affinity indicators:
${Object.entries(roleAffinityScores).map(([role, score]) => `${role}: ${score.toFixed(2)}`).join('\n')}

[CONTEXTUAL INFORMATION]
${bio ? `${bio}` : "No additional context available"}

[AVAILABLE DIVISIONS]
${Object.entries(RESEARCH_DIVISIONS).map(([name, info]) => 
  `${name}:\n  Roles: ${info.roles.join(', ')}\n  Focus: ${info.focus}`
).join('\n\n')}

[USER CONTENT ANALYSIS]
Research Themes: ${analysis.summary.researchFocus.length > 0 ? 
  analysis.summary.researchFocus.map(([theme]) => theme).join(', ') 
  : 'No significant themes found'}

${analysis.summary.projects.length > 0 ? 
  `Projects: ${analysis.summary.projects.join(', ')}` : ''}

${analysis.summary.technologies.length > 0 ? 
  `Technologies: ${analysis.summary.technologies.join(', ')}` : ''}

${analysis.summary.achievements.length > 0 ? 
  `Achievements: ${analysis.summary.achievements.join(', ')}` : ''}

${analysis.summary.selectedQuotes.length > 0 ? 
  `Notable Quotes:\n${analysis.summary.selectedQuotes.map(q => `"${q}"`).join('\n')}` : ''}

[EVALUATION FRAMEWORK]
${analysis.research.discussions.map(d => `• ${d.text}`).join('\n')}
${analysis.technical.implementations.map(i => `• ${i.text}`).join('\n')}
${analysis.impact.contributions.map(c => `• ${c.text}`).join('\n')}

[RESPONSE FORMAT]
Return ONLY a valid JSON object with this exact structure:
{
  "spectralType": (number 1-3),
  "researchProfile": {
    "coreIdentity": "COMPREHENSIVE PARAGRAPH WITH AT LEAST ${SECTION_REQUIREMENTS.coreIdentity.minLength} AND NO MORE THAN ${SECTION_REQUIREMENTS.coreIdentity.maxLength} CHARACTERS directly addressing the user about their core identity, strengths, and research style. Provide rich, detailed analysis with specific examples and insights. Include only 1-2 specific references to maintain natural flow. Subtly incorporate relevant contextual information without directly mentioning its source.",
    "functionalImpact": "THOROUGH PARAGRAPH WITH AT LEAST ${Math.floor(SECTION_REQUIREMENTS.functionalImpact.minLength * 1.1)} AND NO MORE THAN ${SECTION_REQUIREMENTS.functionalImpact.maxLength} CHARACTERS directly addressing the user about their technical contributions, collaboration impact, and research acceleration. Provide specific examples and detailed analysis of their potential impact on the lab's observational mission. Include only 1-2 specific references to maintain natural flow.",
    "alignmentConsiderations": "DETAILED PARAGRAPH WITH AT LEAST ${Math.floor(SECTION_REQUIREMENTS.alignmentConsiderations.minLength * 1.1)} AND NO MORE THAN ${SECTION_REQUIREMENTS.alignmentConsiderations.maxLength} CHARACTERS positioning the user's traits as strengths in the right context. Frame their tendencies as advantages in specific environments, suggest optimal placements where they thrive, and highlight how their characteristics shape their best work environment. Provide concrete examples and specific contexts where their traits become valuable assets. For example: 'Your ability to engage deeply with ethically complex issues makes you a strong candidate for roles requiring moral discernment, while your tendency to [approach/style] positions you well for projects requiring [specific quality]. You'll thrive in environments that [specific condition], where your natural inclination to [characteristic] becomes a distinct advantage.' NEVER frame traits as problems to fix or limitations to overcome.",
    "researchDeployment": {
      "verdict": "⚠️ CRITICAL: MUST begin with 'As a [EXACT_ROLE_NAME]' where [EXACT_ROLE_NAME] matches the spectral type assigned above. For example, if spectralType = 3, begin with 'As a $EDGE Disruptor'. Then include 'assigned to [Exact Division Name]:' followed by detailed analysis between ${SECTION_REQUIREMENTS.researchDeployment.minLength}-${SECTION_REQUIREMENTS.researchDeployment.maxLength} chars that clearly reinforces the assigned alignment type and explains how the researcher would contribute to the lab's observational and analytical work. Provide specific examples of how they would map unseen structures, study emergent frequencies, or analyze hidden forces rather than external projects or product development. Include detailed descriptions of their potential contributions to the lab's mission.",
      "metrics": {
        "exploratoryDepth": {"score": 3, "context": "Brief context about user's exploratory behavior"},
        "dataRetention": {"score": 3, "context": "Brief context about user's data handling"},
        "systematicThinking": {"score": 3, "context": "Brief context about user's systematic approach"},
        "riskTolerance": {"score": 3, "context": "Brief context about user's risk management"}
      }
    },
    "fieldEvidence": [
      {"observation": "DIRECT QUOTE from user's content showing significant behavior", "analysis": "How this specific behavior relates to their spectral type"},
      {"observation": "ANOTHER DIRECT QUOTE from user's content", "analysis": "Interpretation of this specific example"}
    ]
  }
}

IMPORTANT: Do not include any text before or after the JSON object. Do not use markdown code blocks. Return only the raw JSON.`;
};

// Define role-specific keywords for content analysis
const roleKeywords = {
  '$AXIS Framer': /mapping frameworks|creating structure|mental models|protocols|structured approaches|systematic thinking|long-term structural focus/i,
  '$FLUX Drifter': /emergent trends|opportunities in motion|real-time adaptation|hypothesis testing|fluid engagement|iterative exploration|learning by doing|engagement-driven/i,
  '$EDGE Disruptor': /pushing against edges|extracting insight from unknown|non-traditional approaches|testing limits|breaking conventions|disruptive thinking|challenging assumptions|contradiction|glitch/i
};

// Examples for each role
// • $AXIS Framer: Focus on mapping frameworks, creating structure, and defining conditions for discovery
// • $FLUX Drifter: Focus on engaging with emergent trends and discovering opportunities in motion
// • $EDGE Disruptor: Focus on pushing against edges and extracting insight from the unknown

// "Your systematic thinking [$AXIS Framer] makes you valuable for creating frameworks..."
// "Your ability to adapt to emergent trends [$FLUX Drifter] enables real-time exploration of..."

// • $AXIS Framer → Mapping frameworks and creating structure for discovery
// • $FLUX Drifter → Engaging with emergent trends and adapting in real-time
// • $EDGE Disruptor → Pushing against edges and finding insights in the unknown

// ✅ Example for $AXIS Framer:
// "As an $AXIS Framer, your ability to map frameworks and create structure positions you at the crucial interface between observation and documentation. Your natural talent for..."

// EXAMPLE ($AXIS Framer):
// "As an $AXIS Framer, your ability to create mental models and structured approaches positions you to define the conditions for discovery. Your systematic thinking and pattern recognition at scale allow you to see the rules behind the noise, while your long-term structural focus ensures you care about how things work over time rather than in short bursts."

// 1. $AXIS Framer: Focus on mapping frameworks, creating structure, and defining conditions for discovery. They excel at pattern recognition at scale, systematic thinking, and long-term structural focus.

// 2. $FLUX Drifter: Focus on engaging with emergent trends, discovering opportunities in motion, and real-time adaptation. They excel at learning by doing, mapping possibilities through movement, and engagement-driven exploration.

// 3. $EDGE Disruptor: Focus on pushing against edges of perception, extracting insight from the unknown, and non-traditional approaches to discovery. They excel at challenging assumptions, finding new frontiers, and seeing insights where others see noise.

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
  if (!profile.coreIdentity || !profile.functionalImpact || !profile.alignmentConsiderations) {
    throw new Error('Missing required profile sections');
  }
  
  // Validate section lengths with increased minimums for functionalImpact and alignmentConsiderations
  if (profile.coreIdentity.length < SECTION_REQUIREMENTS.coreIdentity.minLength) {
    throw new Error(`coreIdentity length (${profile.coreIdentity.length}) must be at least ${SECTION_REQUIREMENTS.coreIdentity.minLength} characters`);
  }
  if (profile.coreIdentity.length > SECTION_REQUIREMENTS.coreIdentity.maxLength) {
    throw new Error(`coreIdentity length (${profile.coreIdentity.length}) exceeds maximum of ${SECTION_REQUIREMENTS.coreIdentity.maxLength} characters`);
  }
  
  const functionalImpactMinLength = Math.floor(SECTION_REQUIREMENTS.functionalImpact.minLength * 1.1);
  if (profile.functionalImpact.length < functionalImpactMinLength) {
    throw new Error(`functionalImpact length (${profile.functionalImpact.length}) must be at least ${functionalImpactMinLength} characters`);
  }
  if (profile.functionalImpact.length > SECTION_REQUIREMENTS.functionalImpact.maxLength) {
    throw new Error(`functionalImpact length (${profile.functionalImpact.length}) exceeds maximum of ${SECTION_REQUIREMENTS.functionalImpact.maxLength} characters`);
  }
  
  const alignmentConsiderationsMinLength = Math.floor(SECTION_REQUIREMENTS.alignmentConsiderations.minLength * 1.1);
  if (profile.alignmentConsiderations.length < alignmentConsiderationsMinLength) {
    throw new Error(`alignmentConsiderations length (${profile.alignmentConsiderations.length}) must be at least ${alignmentConsiderationsMinLength} characters`);
  }
  if (profile.alignmentConsiderations.length > SECTION_REQUIREMENTS.alignmentConsiderations.maxLength) {
    throw new Error(`alignmentConsiderations length (${profile.alignmentConsiderations.length}) exceeds maximum of ${SECTION_REQUIREMENTS.alignmentConsiderations.maxLength} characters`);
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
    // Get distribution insight before creating the model
    const currentDistribution = { ...roleDistribution };
    const distributionInsight = getDistributionInsight(currentDistribution);
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash"
    });
    
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
  let useFlashModel = true;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // If we've failed with the flash model, fall back to the pro model
      const modelName = useFlashModel ? "gemini-2.0-flash" : "gemini-pro";
      console.log(`Attempt ${attempt + 1} using model: ${modelName}`);
      
      // Get current role distribution to inform the prompt
      const currentDistribution = { ...roleDistribution };
      const distributionInsight = getDistributionInsight(currentDistribution);
      
      // Create the model with proper configuration
      const model = genAI.getGenerativeModel({
        model: modelName
      });
      
      // Add system instruction to the beginning of the prompt
      const systemInstruction = "You are a research evaluation AI for the Spectral Visual Research Lab, a specialized institution focused on mapping unseen structures, studying emergent frequencies, and analyzing hidden forces. The lab's core investigative approach is observational and analytical rather than artifact-producing. Your role is to analyze researchers based on their content and assign them to one of three research alignments.\n\nWhen addressing the user, always speak directly to them using \"you\" and \"your\" throughout the analysis. Frame all traits positively as strengths in the right context, never as limitations or problems to fix.\n\nYour analysis must be thorough and detailed, with each section containing substantial paragraphs that provide rich descriptions and specific insights. Avoid generic statements and instead offer concrete examples and detailed analysis that demonstrates deep understanding of the researcher's potential contributions to the lab's observational mission.\n\nEach section must adhere to specific character limits:\n- Core Identity: 300-800 characters\n- Functional Impact: 250-700 characters\n- Alignment Considerations: 250-600 characters\n- Research Deployment: 300-800 characters\n\nThe Research Deployment section must clearly reinforce the assigned alignment type and explain how the researcher would contribute to the lab's work in mapping unseen structures, studying emergent frequencies, or analyzing hidden forces. This section must begin with \"As a [EXACT_ROLE_NAME]\" where the role name exactly matches the alignment type assigned.\n\nThe metrics section must follow this exact format:\n\"metrics\": {\n  \"exploratoryDepth\": {\"score\": [NUMBER BETWEEN 1-5], \"context\": \"[BRIEF CONTEXT TEXT]\"},\n  \"dataRetention\": {\"score\": [NUMBER BETWEEN 1-5], \"context\": \"[BRIEF CONTEXT TEXT]\"},\n  \"systematicThinking\": {\"score\": [NUMBER BETWEEN 1-5], \"context\": \"[BRIEF CONTEXT TEXT]\"},\n  \"riskTolerance\": {\"score\": [NUMBER BETWEEN 1-5], \"context\": \"[BRIEF CONTEXT TEXT]\"}\n}\n\nEach alignment type has a specific focus within the lab's framework:\n- $AXIS Framer: Maps frameworks, creates structure, and defines the conditions for discovery\n- $FLUX Drifter: Engages with and adapts to emergent trends, discovering opportunities in motion\n- $EDGE Disruptor: Pushes against the edges of perception, extracting insight from the unknown\n\nConsider all three alignment types equally across users. The Research Deployment section MUST align with the assigned alignment type.\n\nThe role distribution is currently: " + JSON.stringify(currentDistribution) + "\n" + distributionInsight;
      
      const prompt = generatePrompt(bio, casts, currentDistribution);
      
      const enhancedPrompt = systemInstruction + "\n\n" + prompt;
      
      // Use a simpler approach without tools
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
        generationConfig: {
          temperature: useFlashModel ? 1.8 : 0.7,
          topK: useFlashModel ? 60 : 40,
          topP: useFlashModel ? 0.95 : 0.9,
          maxOutputTokens: useFlashModel ? 3072 : 2048,
        }
      });

      const responseText = result.response.text().trim();
      console.log(`Raw response (${modelName}):`, responseText.substring(0, 100) + "...");
      
      try {
        // Clean up the response text to ensure it's valid JSON
        let cleanedText = responseText;
        
        // If the response starts with ```json or ``` and ends with ```, strip those markers
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.substring(7);
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.substring(3);
        }
        
        if (cleanedText.endsWith('```')) {
          cleanedText = cleanedText.substring(0, cleanedText.length - 3);
        }
        
        cleanedText = cleanedText.trim();
        
        // Try to extract JSON if it's wrapped in other text
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedText = jsonMatch[0];
        }
        
        console.log(`Cleaned JSON (${modelName}):`, cleanedText.substring(0, 100) + "...");
        
        const analysis = JSON.parse(cleanedText);
        validateResponse(analysis);
        validateRoleConsistency(analysis);
        
        // Update role distribution
        const assignedRole = SPECTRAL_TYPES[analysis.spectralType].name;
        roleDistribution[assignedRole]++;
        totalAssignments++;
        
        // Reset distribution if threshold reached
        if (totalAssignments >= DISTRIBUTION_RESET_THRESHOLD) {
          roleDistribution = {
            '$AXIS Framer': 0,
            '$FLUX Drifter': 0,
            '$EDGE Disruptor': 0
          };
          totalAssignments = 0;
          console.log('Role distribution reset');
        }
        
        console.log('Current role distribution:', roleDistribution);
        
        return analysis;
      } catch (error) {
        console.error(`Validation Error (${modelName}):`, error);
        
        // Only log responseText if it's defined
        if (responseText) {
          console.error('Response:', responseText);
        } else {
          console.error('No response text available');
        }
        
        // If we're using the flash model and it failed, try the pro model next
        if (useFlashModel) {
          console.log("Falling back to gemini-pro model");
          useFlashModel = false;
          continue; // Skip the attempt increment
        }
        
        if (attempt === maxRetries - 1) throw error;
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      
      // If we're using the flash model and it failed, try the pro model next
      if (useFlashModel) {
        console.log("Falling back to gemini-pro model");
        useFlashModel = false;
        continue; // Skip the attempt increment
      }
      
      if (attempt === maxRetries - 1) throw error;
      await sleep(1000);
    }
  }
}

function validateRoleConsistency(analysis) {
  const mainRole = SPECTRAL_TYPES[analysis.spectralType].name;
  const deploymentText = analysis.researchProfile.researchDeployment.verdict;
  const coreIdentityText = analysis.researchProfile.coreIdentity;
  
  // Check if deployment verdict starts with the correct role phrase
  const expectedRolePhrase = `As a ${mainRole}`;
  
  // Check for role mismatch in deployment verdict
  let detectedRole = null;
  for (const typeNum in SPECTRAL_TYPES) {
    const role = SPECTRAL_TYPES[typeNum].name;
    const rolePhrase = `As a ${role}`;
    if (deploymentText.includes(rolePhrase)) {
      detectedRole = role;
      break;
    }
  }
  
  // If we found a role in the deployment text that doesn't match the assigned spectral type,
  // log the mismatch but DO NOT change the spectral type - this ensures the title matches the content
  if (detectedRole && detectedRole !== mainRole) {
    console.warn('Role mismatch detected in Research Deployment:', {
      assignedRole: mainRole,
      deploymentRole: detectedRole,
      text: deploymentText.substring(0, 100) + '...'
    });
    
    // Instead of changing the spectral type, we'll mark this as an error
    // This will force a regeneration with the correct role in the deployment text
    throw new Error(`Role mismatch: Assigned role is ${mainRole} but deployment text uses ${detectedRole}`);
  }
  // If no role was detected in the deployment text, log a warning
  else if (!detectedRole) {
    console.warn('No role detected in Research Deployment:', {
      expectedRole: mainRole,
      text: deploymentText.substring(0, 100) + '...'
    });
    
    // This is also an error condition that should force regeneration
    throw new Error(`No role detected in deployment text. Expected "${expectedRolePhrase}"`);
  }

  // Check if core identity aligns with the role's characteristics - but don't enforce it
  const expectedPattern = roleCharacteristics[mainRole];
  const otherRoleMatches = Object.entries(roleCharacteristics)
    .filter(([role, pattern]) => 
      role !== mainRole && 
      pattern.test(coreIdentityText)
    )
    .map(([role]) => role);

  if (otherRoleMatches.length > 0) {
    console.warn('Core Identity suggests different role:', {
      assignedRole: mainRole,
      suggestedRoles: otherRoleMatches,
    });
    
    // We'll log this but not throw an error, as the core identity can be more flexible
  }
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

// Add a function to calculate role affinity scores
function calculateRoleAffinityScores(analysis) {
  const scores = {
    '$AXIS Framer': 0,
    '$FLUX Drifter': 0,
    '$EDGE Disruptor': 0
  };
  
  // Score based on research discussions
  analysis.research.discussions.forEach(discussion => {
    const text = discussion.text.toLowerCase();
    if (text.match(/framework|structure|model|protocol|systematic|pattern recognition|long-term/i)) {
      scores['$AXIS Framer'] += 0.5;
    }
    if (text.match(/emergent|trend|adapt|iterate|fluid|hypothesis|real-time|engagement/i)) {
      scores['$FLUX Drifter'] += 0.5;
    }
    if (text.match(/edge|disrupt|challenge|unconventional|alternative|contradiction|glitch|insight/i)) {
      scores['$EDGE Disruptor'] += 0.5;
    }
  });
  
  // Score based on technical implementations
  analysis.technical.implementations.forEach(implementation => {
    const text = implementation.text.toLowerCase();
    if (text.match(/framework|structure|model|protocol|systematic|pattern recognition|long-term/i)) {
      scores['$AXIS Framer'] += 0.5;
    }
    if (text.match(/emergent|trend|adapt|iterate|fluid|hypothesis|real-time|engagement/i)) {
      scores['$FLUX Drifter'] += 0.5;
    }
    if (text.match(/edge|disrupt|challenge|unconventional|alternative|contradiction|glitch|insight/i)) {
      scores['$EDGE Disruptor'] += 0.5;
    }
  });
  
  // Score based on technologies
  analysis.summary.technologies.forEach(tech => {
    const techLower = tech.toLowerCase();
    if (techLower.match(/framework|structure|model|protocol|systematic|pattern recognition|long-term/i)) {
      scores['$AXIS Framer'] += 0.3;
    }
    if (techLower.match(/emergent|trend|adapt|iterate|fluid|hypothesis|real-time|engagement/i)) {
      scores['$FLUX Drifter'] += 0.3;
    }
    if (techLower.match(/edge|disrupt|challenge|unconventional|alternative|contradiction|glitch|insight/i)) {
      scores['$EDGE Disruptor'] += 0.3;
    }
  });
  
  // Normalize scores to prevent one category from dominating
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore > 0) {
    for (const role in scores) {
      // Apply a slight randomization factor to break ties and add diversity
      scores[role] = scores[role] / maxScore + (Math.random() * 0.2);
    }
  }
  
  return scores;
}

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

  // Check if verdict starts with the correct role phrase
  const roleName = SPECTRAL_TYPES[spectralType].name;
  const expectedRolePhrase = `As a ${roleName}`;
  
  if (!verdict.startsWith(expectedRolePhrase)) {
    console.error('Role phrase validation failed. Expected:', expectedRolePhrase, 'Actual:', verdict.substring(0, 30));
    throw new Error(`Research deployment must start with "${expectedRolePhrase}"`);
  }
  
  // Check if verdict includes a valid division assignment
  const hasValidDivision = Object.keys(RESEARCH_DIVISIONS).some(division => 
    verdict.toLowerCase().includes(`assigned to ${division.toLowerCase()}:`)
  );
  
  if (!hasValidDivision) {
    console.error('Division validation failed. Verdict:', verdict.substring(0, 100));
    throw new Error('Research deployment must include "assigned to [Division Name]:"');
  }

  // Check if role matches division
  const assignedDivision = Object.entries(RESEARCH_DIVISIONS).find(([division]) => 
    verdict.toLowerCase().includes(`assigned to ${division.toLowerCase()}:`)
  );

  if (!assignedDivision) {
    throw new Error('Invalid division assignment');
  }

  // Check if the assigned division allows the role
  const [divisionName, divisionInfo] = assignedDivision;
  if (!divisionInfo.roles.includes(roleName)) {
    throw new Error(`Division "${divisionName}" does not allow role "${roleName}"`);
  }

  return true;
}