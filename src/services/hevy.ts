
export interface HevyWorkout {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    exercises: HevyExerciseSet[];
}

export interface HevyExerciseSet {
    id: string;
    exercise_title: string;
    notes: string;
    sets: HevySet[];
}

export interface HevySet {
    id: string;
    index: number;
    weight_kg: number;
    reps: number;
    distance_meters?: number;
    duration_seconds?: number;
    rpe?: number;
}

export interface ExerciseStats {
    exerciseName: string;
    oneRepMax: number;
    maxVolume: number;
    lastWeight: number;
    lastReps: number;
}

export const fetchHevyWorkouts = async (apiKey: string, page: number = 1, pageSize: number = 5): Promise<HevyWorkout[]> => {
    try {
        const response = await fetch(`https://api.hevyapp.com/v1/workouts?page=${page}&pageSize=${pageSize}`, {
            method: 'GET',
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Hevy API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.workouts;
    } catch (error) {
        console.error('Failed to fetch Hevy workouts:', error);
        throw error;
    }
};

export const calculateExerciseStats = (workouts: HevyWorkout[]): ExerciseStats[] => {
    const statsMap: Record<string, ExerciseStats> = {};

    workouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
            const name = exercise.exercise_title;
            if (!statsMap[name]) {
                statsMap[name] = {
                    exerciseName: name,
                    oneRepMax: 0,
                    maxVolume: 0,
                    lastWeight: 0,
                    lastReps: 0
                };
            }

            exercise.sets.forEach(set => {
                const weight = set.weight_kg;
                const reps = set.reps;

                // Epley Formula for 1RM
                const estimated1RM = weight * (1 + reps / 30);
                if (estimated1RM > statsMap[name].oneRepMax) {
                    statsMap[name].oneRepMax = estimated1RM;
                }

                const volume = weight * reps;
                if (volume > statsMap[name].maxVolume) {
                    statsMap[name].maxVolume = volume;
                }

                // Assuming workouts are ordered by date descending, simplistic "last" check
                if (set.index === 0) { // Just take the first set as a reference for "last" for now or overwrite
                    statsMap[name].lastWeight = weight;
                    statsMap[name].lastReps = reps;
                }
            });
        });
    });

    return Object.values(statsMap);
};
