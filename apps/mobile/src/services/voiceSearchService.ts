/**
 * Voice Search Service (React Native Expo)
 * Converts voice commands to load searches
 * Supports natural language queries like "Find me loads to Phoenix" or "Show earnings"
 */

import * as Speech from "expo-speech";
import Voice from "@react-native-voice/voice";

export class VoiceSearchService {
  constructor() {
    this.isListening = false;
    this.transcript = "";
    this.recognizedLoads = [];
  }

  /**
   * Initialize voice recognition
   */
  async initializeVoiceRecognition() {
    try {
      Voice.onSpeechStart = this.onSpeechStart;
      Voice.onSpeechEnd = this.onSpeechEnd;
      Voice.onSpeechResults = this.onSpeechResults;
      Voice.onSpeechError = this.onSpeechError;

      console.log("✅ Voice recognition initialized");
      return { success: true };
    } catch (err) {
      console.error("❌ Voice init failed:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Start listening for voice command
   */
  async startListening() {
    try {
      if (this.isListening) {
        console.log("⚠️ Already listening");
        return;
      }

      this.transcript = "";
      this.isListening = true;

      await Voice.start("en-US");
      console.log("🎤 Listening...");

      return { success: true, message: "Listening for your command" };
    } catch (err) {
      console.error("❌ Start listening failed:", err);
      this.isListening = false;
      return { success: false, error: err.message };
    }
  }

  /**
   * Stop listening
   */
  async stopListening() {
    try {
      if (!this.isListening) {
        return;
      }

      await Voice.stop();
      this.isListening = false;

      console.log("🛑 Stopped listening");
      return { success: true };
    } catch (err) {
      console.error("❌ Stop listening failed:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Parse voice command into search parameters
   */
  async parseVoiceCommand(transcript) {
    try {
      const normalized = transcript.toLowerCase().trim();

      // Command patterns
      const patterns = {
        loadSearch: /find|search|looking for|show me|get|find me/i,
        destination: /to|going to|headed to|toward|towards|destination|city|phoenix|denver|las vegas|los angeles/i,
        origin: /from|starting from|pickup|origin|leaving|denver|phoenix/i,
        earnings: /earnings|money|how much|pay|rate|revenue/i,
        bidding: /bid|offer|place bid|bid on|accept/i,
        map: /map|navigation|route|distance/i,
        nearby: /nearby|close|around me|in my area|radius/i,
      };

      // Detect command type
      let commandType = "unknown";
      if (patterns.loadSearch.test(normalized)) commandType = "load_search";
      if (patterns.earnings.test(normalized)) commandType = "earnings";
      if (patterns.bidding.test(normalized)) commandType = "bidding";
      if (patterns.map.test(normalized)) commandType = "map";
      if (patterns.nearby.test(normalized)) commandType = "nearby";

      // Extract key information
      const cities = this.extractCities(normalized);
      const range = this.extractRange(normalized);

      const parsed = {
        type: commandType,
        transcript: normalized,
        cities,
        range,
        confidence: this.calculateConfidence(normalized),
      };

      console.log("✅ Parsed command:", parsed);
      return parsed;
    } catch (err) {
      console.error("❌ Parse command failed:", err);
      return { type: "unknown", confidence: 0 };
    }
  }

  /**
   * Extract city names from transcript
   */
  extractCities(transcript) {
    const cities = {
      denver: "Denver, CO",
      denver_co: "Denver, CO",
      phoenix: "Phoenix, AZ",
      phoenix_az: "Phoenix, AZ",
      las_vegas: "Las Vegas, NV",
      vegas: "Las Vegas, NV",
      los_angeles: "Los Angeles, CA",
      la: "Los Angeles, CA",
      chicago: "Chicago, IL",
      newyork: "New York, NY",
      dallas: "Dallas, TX",
      houston: "Houston, TX",
      atlanta: "Atlanta, GA",
      kansas_city: "Kansas City, MO",
      memphis: "Memphis, TN",
      los_angeles: "Los Angeles, CA",
    };

    const found = [];
    for (const [key, value] of Object.entries(cities)) {
      if (transcript.includes(key.replace(/_/g, " "))) {
        found.push(value);
      }
    }

    return found;
  }

  /**
   * Extract distance range from transcript
   */
  extractRange(transcript) {
    const rangePatterns = {
      short: { pattern: /short|close|nearby|200|300|400|500/i, miles: 500 },
      medium: { pattern: /medium|moderate|800|1000|1200/i, miles: 1200 },
      long: { pattern: /long|far|2000|3000/i, miles: 3000 },
    };

    for (const [type, config] of Object.entries(rangePatterns)) {
      if (config.pattern.test(transcript)) {
        return { type, maxMiles: config.miles };
      }
    }

    return { type: "any", maxMiles: 5000 };
  }

  /**
   * Calculate confidence of parsed command
   */
  calculateConfidence(normalized) {
    let confidence = 0.5;

    // Bonus for clarity
    if (normalized.length > 10) confidence += 0.1;
    if (normalized.length < 100) confidence += 0.1;

    // Penalty for ambiguity
    if (normalized.includes("uh") || normalized.includes("um")) confidence -= 0.05;

    return Math.min(0.99, Math.max(0.3, confidence));
  }

  /**
   * Convert search result to voice response
   */
  async speakSearchResult(result) {
    try {
      const { count, topLoad } = result;

      let message = "";

      if (count === 0) {
        message = "Sorry, no loads found matching your criteria.";
      } else if (count === 1) {
        message = `Found 1 load. ${topLoad.pickupCity} to ${topLoad.dropoffCity}, paying $${topLoad.rate}. Say bid to accept.`;
      } else {
        message = `Found ${count} loads. Top match: ${topLoad.pickupCity} to ${topLoad.dropoffCity}, paying $${topLoad.rate}. Say bid to accept.`;
      }

      await Speech.speak(message, {
        language: "en-US",
        rate: 0.9,
      });

      console.log("🔊 Spoke:", message);
      return { success: true, message };
    } catch (err) {
      console.error("❌ Speech failed:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Voice shortcuts
   */
  async handleVoiceShortcut(command) {
    try {
      const shortcuts = {
        help: {
          message: "Say: Find loads to Phoenix, Show my earnings, or Accept bid.",
        },
        earnings: {
          message: "Your earnings today are $2,100.",
        },
        loads: {
          message: "You have 5 available loads.",
        },
        profile: {
          message: "You are certified for dry van and hazmat.",
        },
      };

      const shortcut = shortcuts[command.toLowerCase()];

      if (shortcut) {
        await Speech.speak(shortcut.message, {
          language: "en-US",
        });

        return { success: true, ...shortcut };
      }

      return { success: false, message: "Command not recognized" };
    } catch (err) {
      console.error("❌ Shortcut failed:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Event handlers
   */
  onSpeechStart = () => {
    console.log("🎤 Speech start");
  };

  onSpeechEnd = () => {
    console.log("🛑 Speech end");
  };

  onSpeechResults = (e) => {
    this.transcript = e.value[0] || "";
    console.log("📝 Transcript:", this.transcript);
  };

  onSpeechError = (e) => {
    console.error("❌ Speech error:", e.error);
    this.isListening = false;
  };

  /**
   * Test voice command with mock transcript
   */
  async testVoiceCommand(mockTranscript) {
    try {
      const parsed = await this.parseVoiceCommand(mockTranscript);

      // Mock search results
      const results = {
        load_search: {
          count: 3,
          topLoad: {
            id: "load-1",
            pickupCity: "Denver",
            dropoffCity: "Phoenix",
            rate: 2100,
          },
        },
        earnings: {
          message: "Today's earnings: $2,100",
        },
        nearby: {
          count: 2,
          message: "Found 2 loads within 50 miles",
        },
      };

      const result = results[parsed.type] || { message: "Unknown command" };

      if (parsed.type === "load_search") {
        await this.speakSearchResult(result);
      } else if (result.message) {
        await Speech.speak(result.message, { language: "en-US" });
      }

      return { success: true, parsed, result };
    } catch (err) {
      console.error("❌ Test failed:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Cleanup
   */
  async cleanup() {
    try {
      Voice.destroy().then(Voice.removeAllListeners);
      this.isListening = false;
      console.log("✅ Voice service cleaned up");
    } catch (err) {
      console.error("❌ Cleanup failed:", err);
    }
  }
}

export const voiceSearchService = new VoiceSearchService();
