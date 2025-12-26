import { SPECTRAL_TYPES } from './constants';

/**
 * Check if observation contains any of the given terms
 */
export function containsAny(observation, terms) {
  const observationLower = observation.toLowerCase();
  return terms.some(term => observationLower.includes(term));
}

/**
 * Detect if cast is a question
 */
export function isQuestion(text) {
  return text.includes("?") || 
    new RegExp('\\b(what|how|why|when|where|who|which|whose|whom)\\b', 'i').test(text);
}

/**
 * Simple sentiment analysis
 */
export function detectSentiment(text) {
  const positiveWords = ["great", "love", "amazing", "good", "excited", "happy", "awesome", "excellent", "fantastic", "beautiful", "perfect", "fun", "enjoy", "thanks", "grateful", "win", "best", "better", "nice", "impressive", "proud", "joy", "positive", "hope", "successful"];
  const negativeWords = ["bad", "hate", "terrible", "awful", "disappointed", "sad", "worst", "sucks", "problem", "fail", "wrong", "broken", "annoying", "stupid", "useless", "ugly", "boring", "hard", "difficult", "negative", "worry", "concerned", "issue", "suck", "afraid", "fear"];
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  const textLower = text.toLowerCase();
  positiveWords.forEach(word => {
    if (textLower.includes(word)) positiveScore++;
  });
  
  negativeWords.forEach(word => {
    if (textLower.includes(word)) negativeScore++;
  });
  
  if (positiveScore > negativeScore) return "positive";
  if (negativeScore > positiveScore) return "negative";
  return "neutral";
}

/**
 * Get variation prefix based on spectral type
 */
export function getVariationPrefix(spectralType) {
  const variations = [
    // Original variations
    "Interestingly, ", 
    "What's revealing is that ", 
    "It's telling that ",
    "Notably, ",
    "Characteristically, ",
    
    // Analytical
    "Upon reflection, ",
    "Looking closely, ",
    "On examination, ",
    "A pattern emerges where ",
    "The subtext here is that ",
    
    // Enthusiastic
    "Brilliantly, ",
    "Fascinatingly, ",
    "Remarkably, ",
    "Impressively, ",
    "Distinctively, ",
    
    // Subtle
    "Subtly, ",
    "In your own way, ",
    "Almost invisibly, ",
    "With quiet confidence, ",
    "With characteristic nuance, ",
    
    // Confident
    "Unmistakably, ",
    "Without question, ",
    "Definitively, ",
    "It's clear that ",
    "Undoubtedly, ",
    
    // Thoughtful
    "Thoughtfully, ",
    "On deeper consideration, ",
    "With careful intention, ",
    "Mindfully, ",
    "With deliberate purpose, ",
  ];
  
  // Spectral type specific variations
  if (spectralType === 1) { // AXIS
    variations.push(
      "Analytically, ",
      "Methodically, ",
      "Systematically, ",
      "With precision, ",
      "Structurally speaking, ",
      "In your framework-oriented way, "
    );
  } else if (spectralType === 2) { // FLUX
    variations.push(
      "Intuitively, ",
      "Fluidly, ",
      "Adaptively, ",
      "With natural flow, ",
      "In your wave-riding fashion, ",
      "As you navigate currents, "
    );
  } else if (spectralType === 3) { // EDGE
    variations.push(
      "Provocatively, ",
      "Disruptively, ",
      "Challengingly, ",
      "With revolutionary flair, ",
      "In your system-questioning way, ",
      "As you push boundaries, "
    );
  }
  
  return variations[Math.floor(Math.random() * variations.length)];
}

/**
 * Ensure interpretation uniqueness
 */
export function ensureUnique(interpretation, usedInterpretations, spectralType) {
  if (usedInterpretations.has(interpretation)) {
    const variation = getVariationPrefix(spectralType);
    return ensureUnique(
      variation + interpretation.charAt(0).toLowerCase() + interpretation.slice(1),
      usedInterpretations,
      spectralType
    );
  }
  usedInterpretations.add(interpretation);
  return interpretation;
}

/**
 * Generate interpretation for field evidence
 * This is the main function that processes evidence and generates interpretations
 */
export function generateInterpretation(evidence, spectralType, usedInterpretations) {
  const observation = evidence.observation || "";
  const observationLower = observation.toLowerCase();
  
  // If evidence already has an interpretation, use it
  if (evidence.interpretation) {
    return evidence.interpretation;
  }
  
  // Helper function for containsAny
  const containsAnyHelper = (terms) => containsAny(observation, terms);
  
  // SPECIFIC CAST PATTERN MATCHING
  // Memory Shift specific interpretations
  if (observationLower.includes("memory shift") && observationLower.includes("beat") && /\d+\.\d+s/.test(observationLower)) {
    if (spectralType === 1) {
      return ensureUnique(`You track your game scores to two decimal places. Very $AXIS of you.`, usedInterpretations, spectralType);
    } else if (spectralType === 2) {
      return ensureUnique(`Most people just play games. You're over here merging with them like some digital performance art.`, usedInterpretations, spectralType);
    } else if (spectralType === 3) {
      return ensureUnique(`You're probably analyzing the game mechanics while playing. Fun is just a side effect of your research.`, usedInterpretations, spectralType);
    }
  }
  
  // Market sentiment specific interpretations
  if (observationLower.includes("market") && (observationLower.includes("bull") || observationLower.includes("bear"))) {
    if (observationLower.includes("bullish bearishness")) {
      if (spectralType === 1) {
        return ensureUnique(`You just casually invented a market paradox and kept scrolling. Classic $AXIS.`, usedInterpretations, spectralType);
      } else if (spectralType === 2) {
        return ensureUnique(`"Bullish bearishness" is such a perfect $FLUX phrase. You're comfortable with contradiction in a way that makes everyone else dizzy.`, usedInterpretations, spectralType);
      } else if (spectralType === 3) {
        return ensureUnique(`You enjoy breaking market categories just to see what happens. "Bullish bearishness" is your version of poking things with a stick.`, usedInterpretations, spectralType);
      }
    } else if (observationLower.includes("bear markets are for building")) {
      if (spectralType === 1) {
        return ensureUnique(`You see market downturns as scheduled construction periods. Your calendar probably has "crisis = opportunity" written all over it.`, usedInterpretations, spectralType);
      } else if (spectralType === 2) {
        return ensureUnique(`While everyone's panicking, you're like "great weather for building today!" That's peak $FLUX energy.`, usedInterpretations, spectralType);
      } else if (spectralType === 3) {
        return ensureUnique(`"Bear markets are for building" is just your polite way of saying "I thrive in chaos." We know.`, usedInterpretations, spectralType);
      }
    } else {
      if (spectralType === 1) {
        return ensureUnique(`You categorize market movements like others sort laundry. It's just what you do.`, usedInterpretations, spectralType);
      } else if (spectralType === 2) {
        return ensureUnique(`You don't just watch markets, you feel them. It's a bit like having financial synesthesia.`, usedInterpretations, spectralType);
      } else if (spectralType === 3) {
        return ensureUnique(`Your market takes always come with a hint of "but what if everything we know is wrong?" Energy.`, usedInterpretations, spectralType);
      }
    }
  }
  
  // "gm" or "gn" casts with humor
  if (new RegExp('^gm+[!.]*$', 'i').test(observationLower) || new RegExp('^gn+[!.]*$', 'i').test(observationLower)) {
    const isGm = new RegExp('^gm+[!.]*$', 'i').test(observationLower);
    if (spectralType === 1) {
      return ensureUnique(isGm ? 
        `Even your greetings are efficiently minimized. I bet you have templates for small talk.` : 
        `Two letters, maximum efficiency. Your keyboard thanks you.`, usedInterpretations, spectralType);
    } else if (spectralType === 2) {
      return ensureUnique(isGm ? 
        `Your "gm" ripples through the community like a tiny digital high five.` : 
        `You sign off like you're stepping out of a room, not leaving a platform.`, usedInterpretations, spectralType);
    } else if (spectralType === 3) {
      return ensureUnique(isGm ? 
        `Your "gm" somehow feels like both participation and commentary on the ritual itself.` : 
        `Your "gn" has big "I'm leaving but also questioning why we announce departures" energy.`, usedInterpretations, spectralType);
    }
  }
  
  // Spectral type specific interpretations
  const sentiment = detectSentiment(observationLower);
  const isQuestionResult = isQuestion(observationLower);
  
  // $AXIS Framer interpretations
  if (spectralType === 1) {
    if (sentiment === "positive") {
      if (isQuestionResult) {
        const options = [
          "Your enthusiastic questions are carefully designed data collection tools.",
          "You ask positive questions like someone mapping a territory you're excited to explore.",
          "Even your optimistic inquiries fit neatly into your mental classification system.",
          "Your questions reveal how you organize positive experiences into structured categories."
        ];
        return ensureUnique(options[Math.floor(Math.random() * options.length)], usedInterpretations, spectralType);
      } else {
        const options = [
          "Your enthusiasm comes with a built-in organizational system.",
          "Even your excitement follows a clear, logical structure.",
          "You celebrate with precision and categorized joy.",
          "Your positive outlook is as well-architected as your plans."
        ];
        return ensureUnique(options[Math.floor(Math.random() * options.length)], usedInterpretations, spectralType);
      }
    } else if (sentiment === "negative") {
      if (isQuestionResult) {
        const options = [
          "Your critical questions are designed to identify flaws in the system.",
          "You ask challenging questions with surgical precision.",
          "Even when questioning problems, you maintain perfect analytical distance.",
          "Your inquiries about challenges reveal your desire to restore order to chaos."
        ];
        return ensureUnique(options[Math.floor(Math.random() * options.length)], usedInterpretations, spectralType);
      } else {
        const options = [
          "You categorize problems with the same precision you apply to solutions.",
          "Your critiques come with an implicit blueprint for improvement.",
          "You approach frustrations as engineering challenges to be solved methodically.",
          "Even your complaints have perfect paragraph structure."
        ];
        return ensureUnique(options[Math.floor(Math.random() * options.length)], usedInterpretations, spectralType);
      }
    }
    
    if (isQuestionResult) {
      const options = [
        "Your questions are precision tools for information extraction.",
        "You ask questions like someone mapping unexplored territory.",
        "Each question you ask is designed to fit perfectly into your mental framework.",
        "You don't just ask questions - you conduct strategic information reconnaissance."
      ];
      return ensureUnique(options[Math.floor(Math.random() * options.length)], usedInterpretations, spectralType);
    }
    
    if (containsAnyHelper(["code", "build", "dev", "api", "function", "app", "website", "program", "framework", "system", "design", "architecture"])) {
      if (containsAnyHelper(["problem", "issue", "bug", "fix", "error"])) {
        return ensureUnique("You don't just fix bugs - you classify them into families and species first.", usedInterpretations, spectralType);
      } else if (containsAnyHelper(["launch", "deploy", "ship", "release"])) {
        return ensureUnique("Your launches probably come with color-coded checklists and perfectly timed confetti.", usedInterpretations, spectralType);
      } else {
        return ensureUnique("I bet your code comments are longer than the code itself. Beautifully documented though.", usedInterpretations, spectralType);
      }
    } else if (containsAnyHelper(["analyze", "research", "study", "learn", "understand", "explore", "discover", "insight", "pattern", "data"])) {
      return ensureUnique("You turned research into an architectural project. Those mental blueprints must be something.", usedInterpretations, spectralType);
    } else if (containsAnyHelper(["organize", "structure", "plan", "map", "model", "framework", "system", "process", "method"])) {
      return ensureUnique("You probably organize your organizers. It's just frameworks all the way down.", usedInterpretations, spectralType);
    } else if (containsAnyHelper(["think", "believe", "opinion", "perspective", "view", "consider"])) {
      return ensureUnique("Your casual opinions come with citations and cross-references. Just in case.", usedInterpretations, spectralType);
    } else if (observationLower.includes("?") || containsAnyHelper(["wonder", "curious", "question", "how", "why", "what if"])) {
      return ensureUnique("Your questions are like precision tools. Each one designed to extract exactly the info you need.", usedInterpretations, spectralType);
    } else if (containsAnyHelper(["trend", "pattern", "notice", "observe", "seeing", "movement", "shift", "change"])) {
      return ensureUnique("You spot patterns others miss. It's like having pattern-recognition superpowers.", usedInterpretations, spectralType);
    } else {
      const options = [
        "You've mentally filed this thought in at least three different categories already.",
        "I bet even your casual thoughts come with metadata and tags.",
        "You probably have a framework for this exact conversation.",
        "This thought definitely has a place in your mental filing system."
      ];
      return ensureUnique(options[Math.floor(Math.random() * options.length)], usedInterpretations, spectralType);
    }
  }
  
  // $FLUX Drifter interpretations
  if (spectralType === 2) {
    if (sentiment === "positive") {
      if (isQuestionResult) {
        const options = [
          "Your questions flow with optimistic curiosity, opening conversations rather than seeking definitive answers.",
          "You ask enthusiastic questions that invite people into your wave of positive possibilities.",
          "Your inquiries radiate an infectious excitement about the connections you're already sensing.",
          "When you ask positive questions, you're already halfway to discovering unexpected joyful patterns."
        ];
        return ensureUnique(options[Math.floor(Math.random() * options.length)], usedInterpretations, spectralType);
      } else {
        const options = [
          "Your joy flows like water finding beautiful unexpected paths.",
          "You don't just experience happiness - you ride its currents to new possibilities.",
          "Your enthusiasm has this wonderful way of revealing connections others miss.",
          "The way you express excitement feels like watching someone dance with emerging patterns."
        ];
        return ensureUnique(options[Math.floor(Math.random() * options.length)], usedInterpretations, spectralType);
      }
    } else if (sentiment === "negative") {
      if (isQuestionResult) {
        const options = [
          "Your questions about challenges feel like someone navigating rapids - alert but unafraid.",
          "Even when asking about problems, you're sensing flows and currents others miss.",
          "Your inquiries into difficulties have this remarkable ability to open unexpected doorways.",
          "You ask about problems with the curiosity of someone who sees them as interesting turbulence."
        ];
        return ensureUnique(options[Math.floor(Math.random() * options.length)], usedInterpretations, spectralType);
      } else {
        const options = [
          "You navigate disappointment like it's just another current to ride.",
          "Your frustrations flow into opportunities others can't see yet.",
          "Even when things go wrong, you're already sensing the next possibility.",
          "Your critiques have this interesting way of opening doors rather than closing them."
        ];
        return ensureUnique(options[Math.floor(Math.random() * options.length)], usedInterpretations, spectralType);
      }
    }
    
    if (isQuestionResult) {
      const options = [
        "Your questions meander like rivers finding their natural path.",
        "You ask questions that create spaces for unexpected connections to emerge.",
        "Your inquiries have this way of surfing between possibilities rather than demanding certainties.",
        "When you ask questions, you're really inviting people into an unfolding conversation."
      ];
      return ensureUnique(options[Math.floor(Math.random() * options.length)], usedInterpretations, spectralType);
    }
    
    if (containsAnyHelper(["adapt", "change", "evolve", "shift", "flow", "move", "transform"])) {
      return ensureUnique("Change isn't just something you adapt to - it's your natural habitat.", usedInterpretations, spectralType);
    } else if (containsAnyHelper(["trend", "pattern", "notice", "observe", "seeing", "movement", "emerging", "developing"])) {
      return ensureUnique("You sense trends before they even know they're trends. It's almost unfair to the rest of us.", usedInterpretations, spectralType);
    } else if (containsAnyHelper(["connect", "relationship", "network", "community", "together", "collaboration", "ecosystem"])) {
      return ensureUnique("You see connections between things the way some people see constellations. It's all patterns and relationships.", usedInterpretations, spectralType);
    } else if (containsAnyHelper(["try", "experiment", "explore", "test", "play", "discover"])) {
      return ensureUnique("Your idea of fun is exploring uncharted territory. Maps are just suggestions.", usedInterpretations, spectralType);
    } else if (containsAnyHelper(["feel", "sense", "intuition", "vibe", "energy", "resonance"])) {
      return ensureUnique("Your intuition has intuition. It's like being psychic but with better branding.", usedInterpretations, spectralType);
    } else if (observationLower.includes("?") && containsAnyHelper(["new", "next", "future", "coming", "emerging", "developing"])) {
      return ensureUnique("You ask about the future like you've already visited and just need confirmation on the details.", usedInterpretations, spectralType);
    } else {
      const options = [
        "You surf invisible currents the rest of us can't even see.",
        "You're tuned to frequencies most people don't even know exist.",
        "While everyone else is standing still, you're dancing with what's emerging.",
        "You're already adapting to the next thing before the current thing is even mainstream."
      ];
      return ensureUnique(options[Math.floor(Math.random() * options.length)], usedInterpretations, spectralType);
    }
  }
  
  // $EDGE Disruptor interpretations
  if (spectralType === 3) {
    if (sentiment === "positive") {
      if (isQuestionResult) {
        const options = [
          "Even your optimistic questions contain subtle challenges to conventional thinking.",
          "Your positive inquiries have hidden trap doors that lead to fascinating new perspectives.",
          "You ask enthusiastic questions that somehow still manage to flip assumptions upside down.",
          "Your excitement-filled questions are Trojan horses for revolutionary ideas."
        ];
        return ensureUnique(options[Math.floor(Math.random() * options.length)], usedInterpretations, spectralType);
      } else {
        const options = [
          "Your enthusiasm comes with a subtle revolutionary edge that changes how people see things.",
          "You celebrate in ways that gently disrupt conventional patterns of thought.",
          "Your positivity has this remarkable ability to make people question assumptions they didn't know they had.",
          "Even your compliments contain invitations to see things from unexplored angles."
        ];
        return ensureUnique(options[Math.floor(Math.random() * options.length)], usedInterpretations, spectralType);
      }
    } else if (sentiment === "negative") {
      if (isQuestionResult) {
        const options = [
          "Your critical questions cut straight to the flawed assumptions others miss.",
          "You ask about problems in ways that expose the system's fundamental contradictions.",
          "Your challenging inquiries have this surgical precision about them - cutting straight to hidden flaws.",
          "When you question what's wrong, you're really inviting a complete rethinking of the premise."
        ];
        return ensureUnique(options[Math.floor(Math.random() * options.length)], usedInterpretations, spectralType);
      } else {
        const options = [
          "Your critiques don't just identify problems - they reframe entire conversations.",
          "You don't just point out what's broken - you expose why the whole approach needs rethinking.",
          "Your frustrations are really invitations to completely reimagine the system.",
          "When you highlight a problem, you're actually offering a glimpse of a radically different possibility."
        ];
        return ensureUnique(options[Math.floor(Math.random() * options.length)], usedInterpretations, spectralType);
      }
    }
    
    if (isQuestionResult) {
      const options = [
        "Your questions are like little conceptual grenades, designed to shake up thinking.",
        "You ask questions that expose the hidden assumptions everyone else missed.",
        "Your inquiries have this wonderful ability to flip perspectives upside down.",
        "When you ask questions, you're really inviting people to question everything they thought they knew."
      ];
      return ensureUnique(options[Math.floor(Math.random() * options.length)], usedInterpretations, spectralType);
    }
    
    if (containsAnyHelper(["wrong", "mistake", "problem", "issue", "broken", "fail", "missing", "overlooked"])) {
      return ensureUnique("You spot the flaw in systems others think are perfect. It's your superpower and dinner party trick.", usedInterpretations, spectralType);
    } else if (containsAnyHelper(["actually", "contrary", "opposite", "instead", "rather", "however", "but", "different"])) {
      return ensureUnique("You've never met a conventional wisdom you didn't want to flip upside down just to see what falls out.", usedInterpretations, spectralType);
    } else if (containsAnyHelper(["limit", "boundary", "edge", "beyond", "outside", "break", "disrupt", "challenge"])) {
      return ensureUnique("You see boundaries as suggestions. Like speed limits or 'wet floor' signs.", usedInterpretations, spectralType);
    } else if (containsAnyHelper(["alternative", "different", "new way", "approach", "perspective", "angle", "lens"])) {
      return ensureUnique("You collect unusual perspectives like some people collect stamps. But yours are way more fun at parties.", usedInterpretations, spectralType);
    } else if (containsAnyHelper(["lol", "lmao", "haha", "joke", "funny", "irony", "satire"])) {
      return ensureUnique("Your humor has that perfect mix of funny and 'wait, did they just challenge my entire worldview?'", usedInterpretations, spectralType);
    } else {
      const options = [
        "Even your casual statements contain little revolutionary ideas.",
        "You've probably questioned more assumptions before breakfast than most people do all year.",
        "You see the glitches in the matrix that everyone else has learned to ignore.",
        "The status quo feels your gaze and gets nervous."
      ];
      return ensureUnique(options[Math.floor(Math.random() * options.length)], usedInterpretations, spectralType);
    }
  }
  
  // Generic fallback for unknown spectral types
  return ensureUnique("You have this knack for being systematic, adaptive, and disruptive all at once. It's impressive and slightly confusing.", usedInterpretations, spectralType);
}

