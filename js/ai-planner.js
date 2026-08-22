import { config } from './config.js';
import { createStop, updateStop } from './stops.js';
import { createActivity } from './activities.js';
import { showToast } from './ui-helpers.js';

/**
 * AI Trip Planner Copilot powered by vendouple/ox-alpha via Pollinations API
 */
export const aiPlanner = {

  /**
   * Send prompt to Pollinations API (OpenAI-compatible) with full trip context
   */
  async generateResponse(userPrompt, tripState, onChunk) {
    const API_URL = 'https://gen.pollinations.ai/v1/chat/completions';
    const MODEL = 'Spit-fires/muse-glimmer';

    const systemInstruction = `
You are GlobeTrotter AI Copilot, an elite AI travel planner built into GlobeTrotter.
Your objective is to help the user plan complete multi-city trips, update daily itineraries, calculate budget costs in Indian Rupees (₹), and provide live travel advice.

Current Trip Context:
- Trip Title: "${tripState.trip?.name || 'Untitled Trip'}"
- Start Date: ${tripState.trip?.start_date || 'N/A'}, End Date: ${tripState.trip?.end_date || 'N/A'}
- Existing City Destinations (${tripState.stops?.length || 0}):
${(tripState.stops || []).map((s, idx) => `  ${idx + 1}. [ID: ${s.id}] ${s.city_name}, ${s.country} (${s.start_date} to ${s.end_date}) — Allocated Budget: ₹${s.budget}`).join('\n')}
- Currently Selected Stop: ${tripState.selectedStop ? `${tripState.selectedStop.city_name} (ID: ${tripState.selectedStop.id})` : 'None'}
- Currently Selected Day: Day ${tripState.selectedDay || 1}

Output Rules:
1. Provide a detailed, engaging, high-value response in clean GitHub-style Markdown.
2. ALWAYS use Rupees (₹) as the currency for cost estimates.
3. If your response includes actionable changes to the trip (adding new city stops, adding daily activities, or adjusting stop budgets), append a single raw JSON block at the VERY END of your response with the following format:

\`\`\`json
{
  "actions": [
    {
      "type": "add_stop",
      "city_name": "City Name",
      "country": "Country Name",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
      "budget": 15000
    },
    {
      "type": "add_activity",
      "stop_id": "${tripState.selectedStop?.id || ''}",
      "city_name": "${tripState.selectedStop?.city_name || ''}",
      "day_number": ${tripState.selectedDay || 1},
      "name": "Activity Title",
      "category": "sightseeing|food|transport|lodging|entertainment|other",
      "cost": 500,
      "start_time": "09:30",
      "end_time": "11:30",
      "duration": 120,
      "notes": "Optional recommendations"
    },
    {
      "type": "update_budget",
      "stop_id": "${tripState.selectedStop?.id || ''}",
      "city_name": "${tripState.selectedStop?.city_name || ''}",
      "budget": 25000
    }
  ]
}
\`\`\`

If no structural changes are needed (e.g. general questions or travel advice), omit the JSON block.
`;

    const requestBody = {
      model: MODEL,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4096,
      stream: true
    };

    try {
      const apiKey = config.getPollinationsApiKey();
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Pollinations API error (${response.status}):`, errText);
        throw new Error(`AI API error ${response.status}: ${errText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let responseText = "";
      let buffer = "";

      console.log("Starting to read Pollinations stream...");

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("Stream reading complete.");
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;

          // Handle both 'data: ' and 'data:'
          if (cleanLine.startsWith("data:")) {
            const dataStr = cleanLine.substring(cleanLine.indexOf(":") + 1).trim();
            if (dataStr === "[DONE]") {
              console.log("Stream sent [DONE] token.");
              continue;
            }

            try {
              const parsed = JSON.parse(dataStr);
              const content = parsed.choices?.[0]?.delta?.content || "";
              if (content) {
                responseText += content;
                console.log("Streamed token:", content);
                if (typeof onChunk === 'function') {
                  let cleanTextForUser = responseText;
                  const jsonStartIndex = responseText.indexOf("```json");
                  if (jsonStartIndex !== -1) {
                    cleanTextForUser = responseText.substring(0, jsonStartIndex).trim();
                  }
                  onChunk(cleanTextForUser || "Thinking...");
                }
              }
            } catch (e) {
              console.warn("Failed to parse SSE JSON:", e, "dataStr:", dataStr);
            }
          }
        }
      }

      // Final process of remaining buffer if any
      if (buffer && buffer.trim().startsWith("data:")) {
        const cleanLine = buffer.trim();
        const dataStr = cleanLine.substring(cleanLine.indexOf(":") + 1).trim();
        if (dataStr !== "[DONE]") {
          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              responseText += content;
            }
          } catch (e) { }
        }
      }

      console.log("Full responseText accumulated:", responseText);

      // Extract proposed JSON actions if present
      let parsedActions = [];
      let cleanText = responseText;

      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const jsonObj = JSON.parse(jsonMatch[1]);
          if (jsonObj && Array.isArray(jsonObj.actions)) {
            parsedActions = jsonObj.actions;
          }
          cleanText = responseText.replace(/```json\s*[\s\S]*?\s*```/, '').trim();
        } catch (e) {
          console.warn("Failed to parse proposed AI actions JSON:", e);
        }
      }

      return {
        reply: cleanText,
        actions: parsedActions,
        searchGroundingUsed: false,
        modelUsed: MODEL
      };
    } catch (err) {
      console.error("Pollinations API request failed:", err);
      throw err;
    }
  },

  /**
   * Apply an AI proposed action to Supabase and update state
   */
  async executeAction(action, tripState, refreshCallback) {
    if (!action || !action.type) return;

    if (action.type === 'add_stop') {
      const tripId = tripState.trip?.id;
      if (!tripId) throw new Error("No active trip context");

      await createStop({
        trip_id: tripId,
        city_name: action.city_name,
        country: action.country || 'India',
        start_date: action.start_date || tripState.trip?.start_date,
        end_date: action.end_date || tripState.trip?.end_date,
        budget: parseFloat(action.budget) || 0
      });

      showToast(`AI added destination: ${action.city_name}`);
    }
    else if (action.type === 'add_activity') {
      let targetStopId = action.stop_id;

      // Fallback matching by city name if stop_id is not exact
      if (!targetStopId && action.city_name && tripState.stops) {
        const found = tripState.stops.find(s => s.city_name.toLowerCase().includes(action.city_name.toLowerCase()));
        if (found) targetStopId = found.id;
      }

      if (!targetStopId && tripState.selectedStop) {
        targetStopId = tripState.selectedStop.id;
      }

      if (!targetStopId) throw new Error("Select a destination stop to add activity.");

      let notesWithTime = action.notes || '';
      if (action.start_time && action.end_time) {
        notesWithTime = `[${action.start_time} - ${action.end_time}] ${notesWithTime}`.trim();
      }

      await createActivity({
        stop_id: targetStopId,
        day_number: parseInt(action.day_number) || 1,
        name: action.name,
        category: action.category || 'sightseeing',
        cost: parseFloat(action.cost) || 0,
        duration: parseInt(action.duration) || 90,
        notes: notesWithTime
      });

      showToast(`AI added activity: "${action.name}"`);
    }
    else if (action.type === 'update_budget') {
      let targetStopId = action.stop_id;
      if (!targetStopId && action.city_name && tripState.stops) {
        const found = tripState.stops.find(s => s.city_name.toLowerCase().includes(action.city_name.toLowerCase()));
        if (found) targetStopId = found.id;
      }
      if (!targetStopId && tripState.selectedStop) {
        targetStopId = tripState.selectedStop.id;
      }

      if (!targetStopId) throw new Error("Target destination stop not found.");

      const existingStop = tripState.stops.find(s => s.id === targetStopId);
      if (existingStop) {
        await updateStop(targetStopId, {
          ...existingStop,
          budget: parseFloat(action.budget) || 0
        });
        showToast(`AI updated budget for ${existingStop.city_name} to ₹${action.budget}`);
      }
    }

    if (typeof refreshCallback === 'function') {
      await refreshCallback();
    }
  }
};
