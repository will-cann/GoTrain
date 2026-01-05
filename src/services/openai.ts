import type { UserGoals } from '../components/GoalForm';
import type { StravaActivity } from './strava';
import type { WeeklyPlan } from '../components/WorkoutPlan';
import type { ExerciseStats } from './hevy';

export const generateWorkoutSuggestions = async (
  apiKey: string,
  goals: UserGoals,
  activities: StravaActivity[],
  units: { distance: string; weight: string },
  exerciseStats?: ExerciseStats[],
  currentDate?: string
) => {
  const prompt = `
    Current Date: ${currentDate || new Date().toISOString().split('T')[0]}
    
    User Goals:
    - Main Goal: ${goals.mainGoal}
    - Availability: ${goals.daysPerWeek} days/week
    - Level: ${goals.fitnessLevel}
    - Preference: ${goals.preferredActivities.join(', ')}
${goals.considerations ? `    - Special Considerations/Injuries: ${goals.considerations}` : ''}
    - Preferred Units: ${units.distance} for distance, ${units.weight} for weights.

    Recent Workouts (Last 7 days):
    ${activities.length > 0 ? activities.map(a => `- ${a.name}: ${a.type}, ${Math.round(a.distance / 1000)}km, ${Math.round(a.moving_time / 60)} mins`).join('\n') : 'No recent activities found.'}
    
    ${exerciseStats && exerciseStats.length > 0 ? `
    Recent Weightlifting Stats (Hevy):
    ${exerciseStats.map(stat => `- ${stat.exerciseName}: 1RM Est: ${Math.round(stat.oneRepMax)}kg, Max Vol: ${Math.round(stat.maxVolume)}kg`).join('\n')}
    
    IMPORTANT: Use these 1RM estimates to prescribe accurate weights (e.g. 70% of 1RM).
    ` : ''}

    As a professional fitness coach, generate a highly structured weekly workout plan in JSON format.
    
    The JSON should follow this structure:
    {
      "weeklySummary": "Short overview of the week's focus and total volume",
      "days": [
        {
          "dayNumber": 1,
          "date": "YYYY-MM-DD",
          "title": "Day Title (e.g. Endurance Run, Strength Training)",
          "type": "rest | run | strength | cross-train",
          "activities": [
            {
              "name": "Activity Name",
              "duration": "Duration in mins or kms",
              "intensity": "Easy | Moderate | Hard | Max",
              "details": "High-level structure (Warmup, Main Focus, Cooldown). Do NOT list specific sets/reps here if they are in the exercises array.",
              "exercises": [
                {
                  "name": "Exercise Name",
                  "sets": "3",
                  "reps": "10-12",
                  "weight": "20lbs or Bodyweight",
                  "notes": "Tempo 2-0-2"
                }
              ]
            }
          ],
          "coachTips": ["Tip 1", "Tip 2"]
        }
      ]
    }
    
    CRITICAL INSTRUCTIONS:
    - For any "strength" or "cross-train" workout involving specific moves, you MUST populate the "exercises" array with exact sets, reps, and weights.
    - Do not just write "3 sets of squats" in the details. Put it in the "exercises" list.
    - The "details" field should only contain the strategy (e.g. "Superset A and B", "Focus on form").

    Ensure the plan strictly follows the user's availability of ${goals.daysPerWeek} days/week. For other days, mark them as "rest".
    IMPORTANT: Assign specific dates to each day starting from Today or Tomorrow based on optimal recovery from recent activities.
    IMPORTANT: Use ${units.distance} for all distances and ${units.weight} for all weights (if any) in the plan.
  `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional fitness coach assistant. You provide personalized, safe, and effective workout suggestions. You always respond in valid JSON format according to the requested schema.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to generate suggestions');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

export const handleCoachChat = async (
  apiKey: string,
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  goals: UserGoals,
  activities: StravaActivity[],
  currentPlan: WeeklyPlan | null,
  units: { distance: string; weight: string },
  exerciseStats?: ExerciseStats[],
  currentDate?: string
) => {
  const contextPrompt = `
    You are GoTrain AI Coach. Current Date: ${currentDate || new Date().toISOString().split('T')[0]}
    User Goals: ${goals.mainGoal}, ${goals.fitnessLevel}, ${goals.daysPerWeek} days/week, focuses: ${goals.preferredActivities.join(', ')}.
${goals.considerations ? `    Considerations: ${goals.considerations}` : ''}
    Units: ${units.distance} for distance, ${units.weight} for weights.
    
    ${exerciseStats && exerciseStats.length > 0 ? `
    Lifting Stats (1RM Estimates):
    ${exerciseStats.map(stat => `${stat.exerciseName}: ${Math.round(stat.oneRepMax)}kg`).join(', ')}
    ` : ''}

    Current Workout Plan:
    ${currentPlan ? JSON.stringify(currentPlan) : 'No plan yet.'}
    
    Recent Activities:
    ${activities.map(a => `${a.name} (${Math.round(a.distance / 1000)}km)`).join(', ')}

    INSTRUCTIONS:
    1. Answer fitness questions accurately and encouragingly.
    2. If the user asks to EDIT or CHANGE the plan (e.g., "add yoga", "swap day 2", "make it harder"):
       - You MUST provide a COMPLETELY REVISED JSON plan.
       - Wrap the JSON in a special tag: <REVISED_PLAN>...</REVISED_PLAN>.
       - IMPORTANT: Do NOT include markdown code blocks (backticks) inside the <REVISED_PLAN> tags. Provide raw JSON only.
       - Ensure the JSON follows the schema:
         {
           "weeklySummary": "...",
           "days": [{
             "dayNumber": 1,
             "date": "YYYY-MM-DD",
             "title": "...",
             "type": "...",
             "activities": [{
               "name": "...",
               "duration": "...",
               "intensity": "...",
               "details": "...",
               "exercises": [{ "name": "...", "sets": "...", "reps": "...", "weight": "...", "notes": "..." }]
             }],
             "coachTips": ["..."]
           }]
         }
    3. Keep responses concise and professional.
    `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: contextPrompt },
        ...messages
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get coach response');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};
