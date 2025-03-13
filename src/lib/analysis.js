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
              title: {
                type: SchemaType.STRING,
                description: "Concise title that describes a specific exploration method",
                maxLength: 30,
              },
              analysis: {
                type: SchemaType.STRING,
                description: "Brief explanation of how they explore the unknown",
                maxLength: 80,
              }
            }
          },
          minItems: 3,
          maxItems: 4
        },
        explorationStyle: {
          type: SchemaType.STRING,
          description: "Poetic, philosophical description of how the user explores the unknown",
          maxLength: 600
        }
      },
      required: ["coreIdentity", "functionalImpact", "alignmentConsiderations", "researchDeployment", "fieldEvidence", "explorationStyle"]
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

// Update the prompt generation function to be more concise
const generatePrompt = (bio, casts, currentDistribution) => {
  const analysis = analyzeContent(casts);
  
  // Calculate role affinity scores based on content analysis
  const roleAffinityScores = calculateRoleAffinityScores(analysis);
  
  // Shorten distribution details
  const distributionSummary = Object.entries(currentDistribution)
    .map(([role, count]) => `${role}: ${count}`)
    .join(', ');
  
  // Filter to only most relevant quotes to save tokens
  const relevantQuotes = analysis.summary.selectedQuotes.slice(0, 3);
  const relevantThemes = analysis.summary.researchFocus.slice(0, 3).map(([theme]) => theme);
  
  return `SPECTRAL ASSESSMENT [JSON REQUIRED]

[KEY REQUIREMENTS]
- Return valid JSON WITHOUT markdown formatting
- Address user directly using "you/your" throughout
- Research Deployment MUST start: "As a [EXACT_ROLE_NAME]" matching spectralType
- Length requirements: coreIdentity (${SECTION_REQUIREMENTS.coreIdentity.minLength}-${SECTION_REQUIREMENTS.coreIdentity.maxLength}), functionalImpact (${Math.floor(SECTION_REQUIREMENTS.functionalImpact.minLength)}-${SECTION_REQUIREMENTS.functionalImpact.maxLength}), alignmentConsiderations (${Math.floor(SECTION_REQUIREMENTS.alignmentConsiderations.minLength)}-${SECTION_REQUIREMENTS.alignmentConsiderations.maxLength})

[SPECTRAL TYPES]
1. $AXIS Framer: Creates frameworks, structures, and systems for discovery
2. $FLUX Drifter: Navigates emergent trends, adapts to dynamic environments 
3. $EDGE Disruptor: Challenges assumptions, finds insights in disruption

[CONTEXT]
Distribution: ${distributionSummary}
${bio ? `Bio: ${bio.substring(0, 200)}${bio.length > 200 ? '...' : ''}` : "No bio available"}
${relevantThemes.length > 0 ? `Themes: ${relevantThemes.join(', ')}` : ''}
${analysis.summary.technologies.length > 0 ? `Technologies: ${analysis.summary.technologies.slice(0, 5).join(', ')}` : ''}
${relevantQuotes.length > 0 ? `Quotes: ${relevantQuotes.slice(0, 2).map(q => `"${q}"`).join(' ')}` : ''}

[OUTPUT FORMAT]
{
  "spectralType": 1-3,
  "researchProfile": {
    "coreIdentity": "Powerful opening followed by 4-5 insightful sentences about their unique strengths",
    "functionalImpact": "Analysis of technical contributions and collaboration impact",
    "alignmentConsiderations": "How their traits are strengths in the right context",
    "researchDeployment": {
      "verdict": "CRITICAL: Must start with 'As a [EXACT ROLE NAME]' followed by details",
      "metrics": {
        "exploratoryDepth": {"score": 1-5, "context": "Brief explanation"},
        "dataRetention": {"score": 1-5, "context": "Brief explanation"},
        "systematicThinking": {"score": 1-5, "context": "Brief explanation"},
        "riskTolerance": {"score": 1-5, "context": "Brief explanation"}
      }
    },
    "fieldEvidence": [
      {"observation": "Direct quote", "title": "Exploration Method", "analysis": "Brief explanation of exploration approach"},
      {"observation": "Direct quote", "title": "Exploration Method", "analysis": "Brief explanation of exploration approach"}
    ],
    "explorationStyle": "Poetic paragraph about how the user explores the unknown (300-600 chars)"
  }
}

Return ONLY the JSON object, no additional text.`;
};

// Update the analyzePersonality function to use more efficient prompts
export async function analyzePersonality(bio, casts) {
  console.log('ANALYSIS: Starting personality analysis');
  console.log(`ANALYSIS: Bio length: ${bio?.length || 0}, Casts count: ${casts?.length || 0}`);
  
  const maxRetries = 3;
  let useFlashModel = true;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // If we've failed with the flash model, fall back to the pro model
      const modelName = useFlashModel ? "gemini-2.0-flash" : "gemini-pro";
      console.log(`Attempt ${attempt + 1} using model: ${modelName}`);
      
      // Get current role distribution to inform the prompt
      const currentDistribution = { ...roleDistribution };
      
      // Create the model with proper configuration
      const model = genAI.getGenerativeModel({
        model: modelName
      });
      
      // Create a much more concise system instruction
      const systemInstruction = "Analyze researcher content and assign to spectral type (1-3). Use direct 'you/your' language. Always begin Research Deployment with 'As a [EXACT_ROLE_NAME]' matching spectralType. Return only valid JSON matching the schema.";
      
      const prompt = generatePrompt(bio, casts, currentDistribution);
      
      const enhancedPrompt = systemInstruction + "\n\n" + prompt;

      // Define the JSON schema for the response structure
      const responseSchema = {
        type: SchemaType.OBJECT,
        properties: {
          spectralType: {
            type: SchemaType.NUMBER,
            description: "Spectral type (1-3)"
          },
          researchProfile: {
            type: SchemaType.OBJECT,
            properties: {
              coreIdentity: {
                type: SchemaType.STRING,
                description: "Core identity paragraph"
              },
              functionalImpact: {
                type: SchemaType.STRING,
                description: "Functional impact paragraph"
              },
              alignmentConsiderations: {
                type: SchemaType.STRING,
                description: "Alignment considerations paragraph"
              },
              researchDeployment: {
                type: SchemaType.OBJECT,
                properties: {
                  verdict: {
                    type: SchemaType.STRING,
                    description: "Research deployment verdict"
                  },
                  metrics: {
                    type: SchemaType.OBJECT,
                    properties: {
                      exploratoryDepth: {
                        type: SchemaType.OBJECT,
                        properties: {
                          score: { type: SchemaType.NUMBER },
                          context: { type: SchemaType.STRING }
                        }
                      },
                      dataRetention: {
                        type: SchemaType.OBJECT,
                        properties: {
                          score: { type: SchemaType.NUMBER },
                          context: { type: SchemaType.STRING }
                        }
                      },
                      systematicThinking: {
                        type: SchemaType.OBJECT,
                        properties: {
                          score: { type: SchemaType.NUMBER },
                          context: { type: SchemaType.STRING }
                        }
                      },
                      riskTolerance: {
                        type: SchemaType.OBJECT,
                        properties: {
                          score: { type: SchemaType.NUMBER },
                          context: { type: SchemaType.STRING }
                        }
                      }
                    }
                  }
                }
              },
              fieldEvidence: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    observation: { type: SchemaType.STRING },
                    title: { type: SchemaType.STRING },
                    analysis: { type: SchemaType.STRING }
                  }
                }
              },
              explorationStyle: {
                type: SchemaType.STRING
              }
            }
          }
        }
      };
      
      try {
        console.log(`ANALYSIS: Generating content with ${modelName}`);
        console.log('ANALYSIS: Prompt length:', enhancedPrompt.length);
        console.time('ANALYSIS: AI model generation');
        
        // Use more efficient generation settings to reduce token usage
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
          generationConfig: {
            temperature: useFlashModel ? 1.2 : 0.7,  // Reduce temperature for more focused outputs
            topK: useFlashModel ? 40 : 40,           // More focused sampling
            topP: useFlashModel ? 0.85 : 0.85,       // More focused sampling
            maxOutputTokens: useFlashModel ? 1536 : 1024, // Significantly reduced token count
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_ONLY_HIGH"
            }
          ],
          responseSchema: responseSchema,
        });
        
        console.timeEnd('ANALYSIS: AI model generation');
        console.log('ANALYSIS: Model response received');

        // Process the response
        let analysis;
        try {
          const responseCandidate = result.response;
          console.log('ANALYSIS: Processing response candidate');
          
          if (responseCandidate.functionResponse && responseCandidate.functionResponse.response) {
            analysis = responseCandidate.functionResponse.response;
            console.log(`ANALYSIS: Structured JSON response received (${modelName})`);
          } else {
            const responseText = responseCandidate.text().trim();
            console.log(`ANALYSIS: Schema validation failed, falling back to text parsing (${modelName})`);
            
            // Clean up the response text
            let cleanedText = responseText;
            
            if (cleanedText.startsWith('```json')) {
              cleanedText = cleanedText.substring(7);
              console.log('ANALYSIS: Removed ```json prefix');
            } else if (cleanedText.startsWith('```')) {
              cleanedText = cleanedText.substring(3);
              console.log('ANALYSIS: Removed ``` prefix');
            }
            
            if (cleanedText.endsWith('```')) {
              cleanedText = cleanedText.substring(0, cleanedText.length - 3);
              console.log('ANALYSIS: Removed ``` suffix');
            }
            
            cleanedText = cleanedText.trim();
            
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              cleanedText = jsonMatch[0];
              console.log('ANALYSIS: Extracted JSON from surrounding text');
            }
            
            try {
              analysis = JSON.parse(cleanedText);
              console.log('ANALYSIS: Successfully parsed JSON from text');
            } catch (parseError) {
              console.error('ANALYSIS: JSON parsing error:', parseError);
              throw new Error(`Failed to parse JSON response: ${parseError.message}`);
            }
          }
          
          // Validate the response
          console.log('ANALYSIS: Validating analysis result');
          try {
            validateResponse(analysis);
            console.log('ANALYSIS: Validation successful');
          } catch (validationError) {
            console.error('ANALYSIS: Validation error:', validationError);
            throw validationError;
          }
          
          // Update role distribution for future requests
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
          
          console.log(`ANALYSIS: Final spectral type determined: ${analysis.spectralType}`);
          return analysis;
          
        } catch (processingError) {
          console.error('ANALYSIS: Error processing AI response:', processingError);
          throw processingError;
        }
      } catch (modelError) {
        console.error('ANALYSIS: Error calling AI model:', modelError);
        
        // If we're using the flash model and it failed, try the pro model next
        if (useFlashModel) {
          console.log("Falling back to gemini-pro model");
          useFlashModel = false;
          continue; // Skip the attempt increment
        }
        
        throw modelError;
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
  console.log(`FARCASTER: Fetching user info for FID: ${fid}`);
  if (!process.env.NEYNAR_API_KEY) {
    console.error('FARCASTER: NEYNAR_API_KEY not configured');
    throw new Error('NEYNAR_API_KEY not configured');
  }

  try {
    console.log(`FARCASTER: Making API request to Neynar for user info`);
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
      console.error(`FARCASTER: Neynar API error: ${response.status}`);
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`FARCASTER: User info API response status: ${!!data}`);
    
    if (!data?.users?.[0]) {
      console.error('FARCASTER: User not found in Neynar response');
      throw new Error('User not found');
    }

    console.log(`FARCASTER: Successfully fetched user info for: ${data.users[0].username}`);
    return data.users[0];
  } catch (error) {
    console.error('FARCASTER: Error fetching user info:', error);
    throw error;
  }
}

export async function fetchUserCasts(fid) {
  console.log(`FARCASTER: Fetching casts for FID: ${fid}`);
  if (!process.env.NEYNAR_API_KEY) {
    console.error('FARCASTER: NEYNAR_API_KEY not configured');
    throw new Error('NEYNAR_API_KEY not configured');
  }

  try {
    console.log(`FARCASTER: Making API request to Neynar for user casts`);
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
      console.error(`FARCASTER: Neynar API error: ${response.status}`);
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`FARCASTER: Casts API response status: ${!!data}`);

    if (!data?.casts || !Array.isArray(data.casts)) {
      console.error('FARCASTER: Invalid response structure from casts API');
      throw new Error('Invalid response structure');
    }

    const filteredCasts = data.casts
      .filter(cast => cast?.text && !cast.parent_hash) // Only include original casts (no replies)
      .map(cast => cast.text)
      .slice(0, 50);
    
    console.log(`FARCASTER: Successfully fetched ${filteredCasts.length} casts`);
    return filteredCasts;

  } catch (error) {
    console.error('FARCASTER: Error fetching user casts:', error);
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